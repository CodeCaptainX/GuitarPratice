import { rootFretForKeyOnString } from "./musicUtils";

export type CagedPosition = "full" | "C" | "A" | "G" | "E" | "D";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getCagedWindow(root: string, position: CagedPosition) {
  if (position === "full") {
    return { startFret: 0, endFret: 18, rootFret: 0 };
  }

  // Practical (training) windows around each CAGED chord shape.
  // Each position chooses a reference string for the root and a relative fret box.
  const spec: Record<
    Exclude<CagedPosition, "full">,
    { rootString: number; from: number; to: number }
  > = {
    // Root on A string (string 5)
    C: { rootString: 5, from: -3, to: 1 }, // open C: root@3 => 0..4
    A: { rootString: 5, from: -1, to: 3 }, // open A: root@0 => 0..3-ish
    // Root on low E string (string 6)
    G: { rootString: 6, from: -3, to: 1 }, // open G: root@3 => 0..4
    E: { rootString: 6, from: 0, to: 4 }, // open E: root@0 => 0..4
    // Root on D string (string 4)
    D: { rootString: 4, from: 0, to: 4 }, // open D: root@0 => 0..4
  };

  const { rootString, from, to } = spec[position];
  const base = rootFretForKeyOnString(root, rootString) ?? 0;
  const candidates = [base, base + 12];

  const score = (start: number, end: number) => {
    const below = Math.max(0, 0 - start);
    const above = Math.max(0, end - 18);
    return below + above;
  };

  const picked = candidates
    .map((rf) => ({ rf, start: rf + from, end: rf + to }))
    .sort((a, b) => {
      const sa = score(a.start, a.end);
      const sb = score(b.start, b.end);
      if (sa !== sb) return sa - sb;
      return a.rf - b.rf;
    })[0];

  return {
    startFret: clamp(picked.start, 0, 18),
    endFret: clamp(picked.end, 0, 18),
    rootFret: clamp(picked.rf, 0, 18),
  };
}

export function getCagedWindows(root: string, position: CagedPosition) {
  if (position === "full") {
    const win = { startFret: 0, endFret: 18, rootFret: 0 };
    return { low: win, high: win };
  }

  const spec: Record<
    Exclude<CagedPosition, "full">,
    { rootString: number; from: number; to: number }
  > = {
    C: { rootString: 5, from: -3, to: 1 },
    A: { rootString: 5, from: -1, to: 3 },
    G: { rootString: 6, from: -3, to: 1 },
    E: { rootString: 6, from: 0, to: 4 },
    D: { rootString: 4, from: 0, to: 4 },
  };

  const { rootString, from, to } = spec[position];
  const base = rootFretForKeyOnString(root, rootString) ?? 0;
  const lowRaw = { rf: base, start: base + from, end: base + to };
  const highRaw = { rf: base + 12, start: base + 12 + from, end: base + 12 + to };

  const low = {
    startFret: clamp(lowRaw.start, 0, 18),
    endFret: clamp(lowRaw.end, 0, 18),
    rootFret: clamp(lowRaw.rf, 0, 18),
  };
  const high = {
    startFret: clamp(highRaw.start, 0, 18),
    endFret: clamp(highRaw.end, 0, 18),
    rootFret: clamp(highRaw.rf, 0, 18),
  };

  return { low, high };
}
