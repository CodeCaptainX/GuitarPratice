import { noteAtWithOctave } from "./musicUtils";

export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type TabRiff = {
  version: 1;
  bpm: number;
  bars: number; // 4/4
  stepsPerBeat: number; // 2 => eighth notes
  // cells[stringIndex][stepIndex]:
  // - null: empty (no note, or "tie" when using sustain-on-empty playback)
  // - -1: explicit mute (force release in sustain playback)
  // - 0..24: fret number
  cells: Array<Array<number | null>>; // 6 x totalSteps
};

export type TabStepNotes = { stepIndex: number; notes: string[] };

const TAB_KEY = "guitarPractice:tabRiff:v1";

export function createEmptyTabRiff(input?: Partial<Pick<TabRiff, "bpm" | "bars" | "stepsPerBeat">>): TabRiff {
  const bpm = input?.bpm ?? 110;
  const bars = input?.bars ?? 4;
  const stepsPerBeat = input?.stepsPerBeat ?? 2;
  const totalSteps = bars * 4 * stepsPerBeat;
  const cells: Array<Array<number | null>> = Array.from({ length: 6 }, () =>
    Array.from({ length: totalSteps }, () => null)
  );
  return { version: 1, bpm, bars, stepsPerBeat, cells };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function loadTabRiff(): TabRiff {
  try {
    const raw = localStorage.getItem(TAB_KEY);
    if (!raw) return createEmptyTabRiff();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return createEmptyTabRiff();
    const p = parsed as any;
    const bpm = clamp(Number(p.bpm ?? 110), 30, 260);
    const bars = clamp(Number(p.bars ?? 4), 1, 32);
    const stepsPerBeat = p.stepsPerBeat === 1 || p.stepsPerBeat === 2 || p.stepsPerBeat === 4 ? p.stepsPerBeat : 2;

    const base = createEmptyTabRiff({ bpm, bars, stepsPerBeat });
    if (!Array.isArray(p.cells) || p.cells.length !== 6) return base;

    const cells = base.cells.map((row, rowIndex) => {
      const srcRow = Array.isArray(p.cells[rowIndex]) ? p.cells[rowIndex] : [];
      return row.map((_, colIndex) => {
        const v = srcRow[colIndex];
        if (v === null || v === undefined) return null;
        const num = Number(v);
        if (!Number.isFinite(num)) return null;
        const t = Math.trunc(num);
        if (t === -1) return -1;
        return clamp(t, 0, 24);
      });
    });

    return { version: 1, bpm, bars, stepsPerBeat, cells };
  } catch {
    return createEmptyTabRiff();
  }
}

export function saveTabRiff(riff: TabRiff): void {
  try {
    localStorage.setItem(TAB_KEY, JSON.stringify(riff));
  } catch {
    // ignore
  }
}

export function totalSteps(riff: TabRiff) {
  return riff.bars * 4 * riff.stepsPerBeat;
}

export function stepToBarBeat(riff: TabRiff, stepIndex: number) {
  const stepsPerBar = 4 * riff.stepsPerBeat;
  const bar = Math.floor(stepIndex / stepsPerBar) + 1;
  const inBar = stepIndex % stepsPerBar;
  const beat = Math.floor(inBar / riff.stepsPerBeat) + 1;
  const sub = inBar % riff.stepsPerBeat;
  return { bar, beat, sub };
}

export function getNotesAtStep(riff: TabRiff, stepIndex: number): string[] {
  const notes: string[] = [];
  for (let stringRow = 0; stringRow < 6; stringRow++) {
    const fret = riff.cells[stringRow]?.[stepIndex];
    if (typeof fret !== "number" || fret < 0) continue;
    const stringNumber = (6 - stringRow) as StringNumber; // row 0 => string 6
    notes.push(noteAtWithOctave(stringNumber, fret));
  }
  return notes;
}

export function toStepSequence(riff: TabRiff): TabStepNotes[] {
  const steps = totalSteps(riff);
  const out: TabStepNotes[] = [];
  for (let i = 0; i < steps; i++) {
    const notes = getNotesAtStep(riff, i);
    out.push({ stepIndex: i, notes });
  }
  return out;
}
