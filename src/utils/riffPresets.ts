import { keyRoot, noteAt, noteIndex, rootFretForKeyOnString, scalePitchClasses } from "./musicUtils";
import type { ScaleFamily } from "./musicUtils";
import type { TabRiff } from "./tabRiff";

export type RiffPresetId = "lead_pentatonic" | "blues_lick" | "metal_chug";

export const RIFF_PRESETS: Array<{
  id: RiffPresetId;
  label: string;
  description: string;
}> = [
  {
    id: "lead_pentatonic",
    label: "Lead (minor pentatonic)",
    description: "Playable lead line on top strings + simple root bass.",
  },
  {
    id: "blues_lick",
    label: "Blues lick",
    description: "Call-and-response lick using the blues scale.",
  },
  {
    id: "metal_chug",
    label: "Metal chug",
    description: "Tight chug with occasional power-5th hits.",
  },
];

export type GenerateRiffPresetOptions = {
  preset: RiffPresetId;
  key: string; // e.g. "A#/Bb"
  positionFret: number; // target fret region
  maxFret: number; // clamp frets 0..maxFret
  density: number; // 0..100 (higher = more notes)
  seed?: number; // stable variation
};

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], rand: () => number): T {
  const idx = Math.floor(rand() * items.length);
  return items[Math.max(0, Math.min(items.length - 1, idx))] as T;
}

function emptyCellsLike(riff: TabRiff): Array<Array<number | null>> {
  return riff.cells.map((row) => row.map(() => null));
}

function pitchClassAt(stringNumber: number, fret: number): number | null {
  const idx = noteIndex(noteAt(stringNumber, fret));
  return typeof idx === "number" ? idx : null;
}

function nearestFretForPitchClassOnString(
  stringNumber: number,
  pitchClass: number,
  targetFret: number,
  maxFret: number
): number | null {
  let best: { fret: number; score: number } | null = null;
  for (let fret = 0; fret <= maxFret; fret++) {
    const pc = pitchClassAt(stringNumber, fret);
    if (pc !== pitchClass) continue;
    const score = Math.abs(fret - targetFret);
    if (!best || score < best.score) best = { fret, score };
  }
  return best ? best.fret : null;
}

function closestRootFretOnString(
  root: string,
  stringNumber: number,
  targetFret: number,
  maxFret: number
): number | null {
  const base = rootFretForKeyOnString(root, stringNumber);
  if (base === null) return null;
  const candidates = [base, base + 12, base + 24].filter((x) => x <= maxFret);
  if (!candidates.length) return null;
  candidates.sort((a, b) => Math.abs(a - targetFret) - Math.abs(b - targetFret));
  return candidates[0] ?? null;
}

function scaleFamilyForPreset(preset: RiffPresetId): ScaleFamily {
  if (preset === "lead_pentatonic") return "minor_pentatonic";
  if (preset === "blues_lick") return "blues";
  return "natural_minor";
}

export function applyRiffPreset(riff: TabRiff, options: GenerateRiffPresetOptions): TabRiff {
  const root = keyRoot(options.key);
  const maxFret = clampInt(options.maxFret, 0, 24);
  const targetFret = clampInt(options.positionFret, 0, maxFret);
  const density = clampInt(options.density, 0, 100);
  const seed = Number.isFinite(options.seed) ? Number(options.seed) : Date.now();
  const rand = mulberry32(seed);

  const steps = riff.bars * 4 * riff.stepsPerBeat;
  const stepsPerBeat = riff.stepsPerBeat;
  const stepsPerBar = 4 * stepsPerBeat;
  const cells = emptyCellsLike(riff);

  const family = scaleFamilyForPreset(options.preset);
  const allowed = scalePitchClasses(root, family);
  const rootPc = noteIndex(root);
  const fifthPc = rootPc === null ? null : (rootPc + 7) % 12;

  const leadRows = [3, 4, 5]; // strings 3..1 (high strings)
  const setCell = (stringRow: number, stepIndex: number, value: number | null) => {
    const row = cells[stringRow];
    if (!row) return;
    if (stepIndex < 0 || stepIndex >= row.length) return;
    row[stepIndex] = value;
  };

  if (options.preset === "metal_chug") {
    const rootFret6 = closestRootFretOnString(root, 6, targetFret, maxFret) ?? 0;
    const fifthFret5 =
      fifthPc === null ? null : nearestFretForPitchClassOnString(5, fifthPc, rootFret6, maxFret);

    for (let step = 0; step < steps; step++) {
      const on = step % 2 === 0;
      setCell(0, step, on ? rootFret6 : -1); // string 6

      const isDownbeat = step % stepsPerBar === 0;
      const isBeat = step % stepsPerBeat === 0;
      const hitPower = (isDownbeat || (isBeat && rand() < density / 200)) && fifthFret5 !== null;
      if (hitPower) {
        setCell(0, step, rootFret6);
        setCell(1, step, fifthFret5); // string 5
      }
    }

    return { ...riff, cells };
  }

  // Lead / blues:
  const melodyPcs = allowed.length ? allowed : rootPc !== null ? [rootPc] : [];
  let degree = 0;

  const bassFret = closestRootFretOnString(root, 6, Math.min(5, targetFret), maxFret);
  if (bassFret !== null) {
    for (let step = 0; step < steps; step += stepsPerBar) setCell(0, step, bassFret);
  }

  const shouldPlaceNote = (step: number) => {
    if (step % stepsPerBeat === 0) return true;
    return rand() < density / 100;
  };

  for (let step = 0; step < steps; step++) {
    if (!shouldPlaceNote(step)) continue;

    const jumps =
      options.preset === "blues_lick"
        ? ([-2, -1, -1, 0, 0, 1, 1, 2] as const)
        : ([-2, -1, 0, 0, 1, 2] as const);
    degree = clampInt(degree + pick([...jumps], rand), 0, Math.max(0, melodyPcs.length - 1));

    const pc = melodyPcs[degree];
    if (typeof pc !== "number") continue;

    const stringRow = pick(leadRows, rand);
    const stringNumber = 6 - stringRow;
    const fret = nearestFretForPitchClassOnString(stringNumber, pc, targetFret, maxFret);
    if (fret === null) continue;
    setCell(stringRow, step, fret);

    if (options.preset === "blues_lick" && step % stepsPerBeat === 0 && rand() < 0.22) {
      const replyDegree = clampInt(
        degree + (rand() < 0.5 ? 1 : -1),
        0,
        Math.max(0, melodyPcs.length - 1)
      );
      const replyPc = melodyPcs[replyDegree];
      const replyRow = pick([4, 5], rand); // strings 2..1
      const replyStringNumber = 6 - replyRow;
      const replyFret = nearestFretForPitchClassOnString(replyStringNumber, replyPc, targetFret, maxFret);
      if (replyFret !== null && step + 1 < steps) setCell(replyRow, step + 1, replyFret);
    }
  }

  return { ...riff, cells };
}

