import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import {
  ALL_KEYS,
  chordNoteNames,
  chordPitchClasses,
  ChordQuality,
  DiatonicMode,
  diatonicTriads,
  keyRoot,
  noteIndex,
  noteNameFromIndex,
} from "../../utils/musicUtils";
import { CagedPosition, getCagedWindow, getCagedWindows } from "../../utils/caged";
import FretboardGrid from "./FretboardGrid";

type FingeringPreset = "open" | "E" | "A";
type DisplayPreset = "caged" | FingeringPreset;

type Fingering = Array<number | "x">; // strings 6..1
type ChordTarget = {
  root: string;
  quality: ChordQuality;
  position: Exclude<CagedPosition, "full">;
  octave: "low" | "high";
};

function lowErootFret(root: string): number | null {
  const rootIdx = noteIndex(root);
  const eIdx = noteIndex("E");
  if (rootIdx === null || eIdx === null) return null;
  return (rootIdx - eIdx + 12) % 12;
}

function aStringRootFret(root: string): number | null {
  const rootIdx = noteIndex(root);
  const aIdx = noteIndex("A");
  if (rootIdx === null || aIdx === null) return null;
  return (rootIdx - aIdx + 12) % 12;
}

function fingeringFor(root: string, quality: ChordQuality, shape: "E" | "A"): Fingering | null {
  if (shape === "E") {
    const r = lowErootFret(root);
    if (r === null) return null;
    // E-shape barre at fret r
    // Strings: 6  5  4  3  2  1
    // Maj:     r r+2 r+2 r+1 r r
    // Min:     r r+2 r+2 r   r r
    // 7:       r r+2 r   r+1 r r
    if (quality === "maj") return [r, r + 2, r + 2, r + 1, r, r];
    if (quality === "min") return [r, r + 2, r + 2, r, r, r];
    if (quality === "7") return [r, r + 2, r, r + 1, r, r];
    return null;
  }

  const r = aStringRootFret(root);
  if (r === null) return null;
  // A-shape barre at fret r
  // Maj: x r r+2 r+2 r+2 r
  // Min: x r r+2 r+2 r+1 r
  // 7:   x r r+2 r   r+2 r
  if (quality === "maj") return ["x", r, r + 2, r + 2, r + 2, r];
  if (quality === "min") return ["x", r, r + 2, r + 2, r + 1, r];
  if (quality === "7") return ["x", r, r + 2, r, r + 2, r];
  return null;
}

function chordLabel(root: string, quality: ChordQuality) {
  return `${root}${quality === "maj" ? "" : quality === "min" ? "m" : quality === "7" ? "7" : "dim"}`;
}

function toPlayableNotes(root: string, quality: ChordQuality): string[] {
  const rootIdx = noteIndex(root);
  if (rootIdx === null) return [];
  const pcs =
    quality === "maj"
      ? [0, 4, 7]
      : quality === "min"
        ? [0, 3, 7]
        : quality === "dim"
          ? [0, 3, 6]
          : [0, 4, 7, 10];
  const base = 3;
  return pcs.map((i) => `${noteNameFromIndex(rootIdx + i)}${base + (i >= 7 ? 1 : 0)}`);
}

const OPEN_FINGERINGS: Record<string, Fingering> = {
  C: ["x", 3, 2, 0, 1, 0],
  Cm: ["x", 3, 5, 5, 4, 3], // fallback (barre-ish) if user chooses open for Cm
  D: ["x", "x", 0, 2, 3, 2],
  Dm: ["x", "x", 0, 2, 3, 1],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  G: [3, 2, 0, 0, 0, 3],
  A: ["x", 0, 2, 2, 2, 0],
  Am: ["x", 0, 2, 2, 1, 0],
  F: [1, 3, 3, 2, 1, 1],
  C7: ["x", 3, 2, 3, 1, 0],
  D7: ["x", "x", 0, 2, 1, 2],
  E7: [0, 2, 0, 1, 0, 0],
  A7: ["x", 0, 2, 0, 2, 0],
  G7: [3, 2, 0, 0, 0, 1],
};

function openKey(root: string, quality: ChordQuality) {
  if (quality === "maj") return root;
  if (quality === "min") return `${root}m`;
  if (quality === "7") return `${root}7`;
  return `${root}dim`;
}

function isValidFingering(fingering: Fingering): boolean {
  return fingering.every((f) => f === "x" || (Number.isFinite(f) && f >= 0 && f <= 18));
}

function fitsWindow(fingering: Fingering, startFret: number, endFret: number): boolean {
  const frets = fingering.filter((f): f is number => typeof f === "number");
  if (frets.length === 0) return false;
  return frets.every((f) => f >= startFret && f <= endFret);
}

function dShapeFingering(rootFretOnD: number, quality: ChordQuality): Fingering | null {
  // strings 6..1
  if (quality === "maj") {
    return ["x", "x", rootFretOnD, rootFretOnD + 2, rootFretOnD + 3, rootFretOnD + 2];
  }
  if (quality === "min") {
    return ["x", "x", rootFretOnD, rootFretOnD + 2, rootFretOnD + 3, rootFretOnD + 1];
  }
  if (quality === "7") {
    return ["x", "x", rootFretOnD, rootFretOnD + 2, rootFretOnD + 1, rootFretOnD + 2];
  }
  return null;
}

function cShapeFingering(rootFretOnA: number, quality: ChordQuality): Fingering | null {
  // A-string is string 5. Use a closed, movable version of the classic C-shape.
  if (quality === "maj") {
    return ["x", rootFretOnA, rootFretOnA - 1, rootFretOnA - 3, rootFretOnA - 2, rootFretOnA - 3];
  }
  if (quality === "min") {
    return ["x", rootFretOnA, rootFretOnA - 2, rootFretOnA - 3, rootFretOnA - 3, rootFretOnA - 3];
  }
  if (quality === "7") {
    return ["x", rootFretOnA, rootFretOnA - 1, rootFretOnA, rootFretOnA - 2, rootFretOnA - 3];
  }
  return null;
}

function cagedFingering(root: string, quality: ChordQuality, position: CagedPosition): Fingering | null {
  const window = getCagedWindow(root, position);

  if (position === "E") return fingeringFor(root, quality, "E");
  if (position === "A") return fingeringFor(root, quality, "A");
  if (position === "D") {
    const f = dShapeFingering(window.rootFret, quality);
    return f && isValidFingering(f) ? f : null;
  }
  if (position === "C") {
    const f = cShapeFingering(window.rootFret, quality);
    return f && isValidFingering(f) ? f : null;
  }
  if (position === "G") {
    // G-shape is more complex; fall back to an in-window barre shape when possible.
    const e = fingeringFor(root, quality, "E");
    const a = fingeringFor(root, quality, "A");
    if (e && fitsWindow(e, window.startFret, window.endFret)) return e;
    if (a && fitsWindow(a, window.startFret, window.endFret)) return a;
    return e ?? a ?? null;
  }

  // full
  return fingeringFor(root, quality, "E") ?? fingeringFor(root, quality, "A");
}

function cagedFingeringForTarget(target: ChordTarget): { fingering: Fingering | null; window: { startFret: number; endFret: number; rootFret: number } } {
  const windows = getCagedWindows(target.root, target.position);
  const window = target.octave === "high" ? windows.high : windows.low;

  if (target.position === "E") {
    const f = fingeringFor(target.root, target.quality, "E");
    return { fingering: f && fitsWindow(f, window.startFret, window.endFret) ? f : f, window };
  }
  if (target.position === "A") {
    const f = fingeringFor(target.root, target.quality, "A");
    return { fingering: f && fitsWindow(f, window.startFret, window.endFret) ? f : f, window };
  }
  if (target.position === "D") {
    const f = dShapeFingering(window.rootFret, target.quality);
    return { fingering: f && isValidFingering(f) ? f : null, window };
  }
  if (target.position === "C") {
    const f = cShapeFingering(window.rootFret, target.quality);
    return { fingering: f && isValidFingering(f) ? f : null, window };
  }
  // G: fall back to E/A barre that fits the window
  const e = fingeringFor(target.root, target.quality, "E");
  const a = fingeringFor(target.root, target.quality, "A");
  if (e && fitsWindow(e, window.startFret, window.endFret)) return { fingering: e, window };
  if (a && fitsWindow(a, window.startFret, window.endFret)) return { fingering: a, window };
  return { fingering: e ?? a ?? null, window };
}

export default function ChordTrainer() {
  const [selectedKey, setSelectedKey] = useState<string>("A");
  const [quality, setQuality] = useState<ChordQuality>("min");
  const [preset, setPreset] = useState<DisplayPreset>("caged");
  const [cagedPosition, setCagedPosition] = useState<CagedPosition>("E");

  const [drillRunning, setDrillRunning] = useState(false);
  const [drillIntervalMs, setDrillIntervalMs] = useState(2500);
  const [queueSize, setQueueSize] = useState(5);
  const [queue, setQueue] = useState<ChordTarget[]>([]);

  const [familyKey, setFamilyKey] = useState<string>("C");
  const [familyMode, setFamilyMode] = useState<DiatonicMode>("major");
  const [familyDegree, setFamilyDegree] = useState<number>(1);
  const [strumMs, setStrumMs] = useState<number>(30);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const timerRef = useRef<number | null>(null);

  const root = useMemo(() => keyRoot(selectedKey), [selectedKey]);
  const chordNotes = useMemo(() => chordNoteNames(root, quality), [quality, root]);
  const chordPitch = useMemo(() => chordPitchClasses(root, quality), [quality, root]);
  const cagedWindow = useMemo(() => getCagedWindow(root, cagedPosition), [cagedPosition, root]);

  const currentTarget = queue.length ? queue[0] : null;
  const targetData = useMemo(() => {
    if (!currentTarget) return null;
    return cagedFingeringForTarget(currentTarget);
  }, [currentTarget]);

  const activeRoot = currentTarget?.root ?? root;
  const activeQuality = currentTarget?.quality ?? quality;
  const activeChordNotes = useMemo(
    () => (currentTarget ? chordNoteNames(currentTarget.root, currentTarget.quality) : chordNotes),
    [chordNotes, currentTarget]
  );
  const activeChordPitch = useMemo(
    () => (currentTarget ? chordPitchClasses(currentTarget.root, currentTarget.quality) : chordPitch),
    [chordPitch, currentTarget]
  );
  const activeWindow = targetData?.window ?? cagedWindow;
  const fingering = useMemo(() => {
    if (preset === "caged") {
      return cagedFingering(root, quality, cagedPosition);
    }
    if (preset === "open") {
      const key = openKey(root, quality);
      return OPEN_FINGERINGS[key] ?? null;
    }
    return fingeringFor(root, quality, preset);
  }, [cagedPosition, preset, quality, root]);

  const activeFingering = targetData?.fingering ?? fingering;
  const activeHighlights = useMemo(() => {
    if (!activeFingering) return [];
    return activeFingering
      .map((fret, i) => ({ string: 6 - i, fret }))
      .filter((p): p is { string: number; fret: number } => typeof p.fret === "number" && p.fret >= 0);
  }, [activeFingering]);

  const ensureSynth = async () => {
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
      synthRef.current.set({ volume: -8 });
    }
  };

  const play = async () => {
    await ensureSynth();
    const notes = toPlayableNotes(activeRoot, activeQuality);
    if (!synthRef.current || notes.length === 0) return;

    // Quick strum
    notes.forEach((note, idx) => {
      const t = Tone.now() + (idx * strumMs) / 1000;
      synthRef.current?.triggerAttackRelease(note, "8n", t);
    });
  };

  const makeRandomTarget = (): ChordTarget | null => {
    const positions: Array<Exclude<CagedPosition, "full">> = ["C", "A", "G", "E", "D"];

    for (let attempts = 0; attempts < 200; attempts++) {
      const rootKey = keyRoot(selectedKey);
      const q = quality;
      const pos = positions[Math.floor(Math.random() * positions.length)] ?? "E";
      const octave: "low" | "high" = Math.random() > 0.5 ? "high" : "low";
      const target: ChordTarget = { root: rootKey, quality: q, position: pos, octave };
      const { fingering: f } = cagedFingeringForTarget(target);
      if (f) return target;
    }

    return null;
  };

  const fillQueue = () => {
    setQueue((prev) => {
      const next = [...prev];
      while (next.length < queueSize) {
        const t = makeRandomTarget();
        if (!t) break;
        next.push(t);
      }
      return next;
    });
  };

  const advance = () => {
    setQueue((prev) => {
      const next = prev.slice(1);
      while (next.length < queueSize) {
        const t = makeRandomTarget();
        if (!t) break;
        next.push(t);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!drillRunning) return;
    setPreset("caged");
    fillQueue();
    timerRef.current = window.setInterval(() => advance(), drillIntervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillRunning, drillIntervalMs, queueSize]);

  useEffect(() => {
    if (!drillRunning) return;
    setQueue([]);
    fillQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillRunning, selectedKey, quality]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  const label = chordLabel(root, quality);
  const family = useMemo(
    () => diatonicTriads(keyRoot(familyKey), familyMode),
    [familyKey, familyMode]
  );
  const pickedFamily = family.find((c) => c.degree === familyDegree) ?? family[0] ?? null;

  const openAvailable = useMemo(() => {
    const key = openKey(root, quality);
    return key in OPEN_FINGERINGS;
  }, [quality, root]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Chords</div>
            <div className="mt-1 text-sm text-slate-300">
              Practice one chord across CAGED positions (random position windows).
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <label className="block">
              <div className="text-xs text-slate-300">Root</div>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                {ALL_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">Quality</div>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as ChordQuality)}
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                <option value="maj">Major</option>
                <option value="min">Minor</option>
                <option value="7">Dominant 7</option>
                <option value="dim">Diminished</option>
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">Fingering</div>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as DisplayPreset)}
                disabled={drillRunning}
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                <option value="caged">CAGED (auto)</option>
                <option value="open" disabled={!openAvailable}>
                  Open (if available)
                </option>
                <option value="E">E-shape barre</option>
                <option value="A">A-shape barre</option>
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">CAGED position</div>
              <select
                value={cagedPosition}
                onChange={(e) => setCagedPosition(e.target.value as CagedPosition)}
                disabled={drillRunning}
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                <option value="C">C</option>
                <option value="A">A</option>
                <option value="G">G</option>
                <option value="E">E</option>
                <option value="D">D</option>
                <option value="full">Full neck</option>
              </select>
              <div className="mt-1 text-[11px] text-slate-400">
                {drillRunning
                  ? "Randomized during drill"
                  : `Showing frets ${cagedWindow.startFret}–${cagedWindow.endFret}`}
              </div>
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">Strum speed</div>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={strumMs}
                onChange={(e) => setStrumMs(Number(e.target.value))}
                className="mt-3 w-full accent-indigo-500"
              />
              <div className="mt-1 text-[11px] text-slate-400">{strumMs} ms between notes</div>
            </label>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950/30 p-5 ring-1 ring-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Chord drill (queue)</div>
              <div className="mt-1 text-sm text-slate-300">
                Generates a queue of <span className="font-semibold text-white">{chordLabel(root, quality)}</span> in random C/A/G/E/D positions (low/high).
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <div className="text-xs text-slate-300">Interval</div>
                <input
                  type="range"
                  min={800}
                  max={6000}
                  step={100}
                  value={drillIntervalMs}
                  onChange={(e) => setDrillIntervalMs(Number(e.target.value))}
                  className="mt-3 w-full accent-indigo-500"
                />
                <div className="mt-1 text-[11px] text-slate-400">{drillIntervalMs} ms</div>
              </label>

              <label className="block">
                <div className="text-xs text-slate-300">Queue length</div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={1}
                  value={queueSize}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setQueueSize(next);
                    setQueue((prev) => prev.slice(0, next));
                  }}
                  className="mt-3 w-full accent-indigo-500"
                />
                <div className="mt-1 text-[11px] text-slate-400">{queueSize} chords</div>
              </label>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setDrillRunning((v) => !v)}
                  className={`w-full rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-white/10 ${drillRunning ? "bg-rose-500 hover:bg-rose-400" : "bg-indigo-500 hover:bg-indigo-400"
                    } text-white`}
                >
                  {drillRunning ? "Stop drill" : "Start drill"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {queue.length ? (
              queue.slice(0, 1 + Math.min(6, Math.max(0, queue.length - 1))).map((t, idx) => (
                <span
                  key={`${t.root}-${t.quality}-${t.position}-${t.octave}-${idx}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${idx === 0
                    ? "bg-indigo-500/20 text-indigo-100 ring-indigo-400/30"
                    : "bg-white/5 text-slate-200 ring-white/10"
                    }`}
                >
                  <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white/5 px-1 text-[11px] font-bold ring-1 ring-white/10">
                    {idx + 1}
                  </span>
                  {t.position} · {t.octave}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Press Start drill to generate a queue.</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!queue.length) fillQueue();
                else advance();
              }}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Next chord
            </button>
            <button
              type="button"
              onClick={() => {
                setQueue([]);
                fillQueue();
              }}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Reroll queue
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950/30 p-5 ring-1 ring-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Chord family (diatonic)</div>
              <div className="mt-1 text-sm text-slate-300">
                Pick a key, then choose I–vii° (triads). Click a chord to load it.
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <div className="text-xs text-slate-300">Key</div>
                <select
                  value={familyKey}
                  onChange={(e) => setFamilyKey(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                >
                  {ALL_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <div className="text-xs text-slate-300">Mode</div>
                <select
                  value={familyMode}
                  onChange={(e) => setFamilyMode(e.target.value as DiatonicMode)}
                  className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                >
                  <option value="major">Major</option>
                  <option value="natural_minor">Natural minor</option>
                </select>
              </label>
              <label className="block">
                <div className="text-xs text-slate-300">Degree</div>
                <select
                  value={familyDegree}
                  onChange={(e) => setFamilyDegree(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                >
                  {family.map((c) => (
                    <option key={c.degree} value={c.degree}>
                      {c.degree}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {family.map((c) => {
              const isActive = c.degree === familyDegree;
              const labelText = chordLabel(c.root, c.quality);
              return (
                <button
                  key={c.degree}
                  type="button"
                  onClick={() => {
                    setFamilyDegree(c.degree);
                    setSelectedKey(c.root);
                    setQuality(c.quality);
                    if (preset === "open" && !(openKey(c.root, c.quality) in OPEN_FINGERINGS)) {
                      setPreset("E");
                    }
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition-colors ${isActive
                    ? "bg-indigo-500 text-white ring-white/10"
                    : "bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10"
                    }`}
                >
                  {labelText}
                </button>
              );
            })}
            {pickedFamily ? (
              <div className="ml-auto hidden sm:block text-xs text-slate-400">
                Selected: <span className="font-semibold text-white">{chordLabel(pickedFamily.root, pickedFamily.quality)}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/30 p-5 ring-1 ring-white/10">
            <div className="text-xs text-slate-300">Current chord</div>
            <div className="mt-1 text-3xl font-bold text-white">
              {currentTarget ? chordLabel(currentTarget.root, currentTarget.quality) : label}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              Notes:{" "}
              <span className="font-semibold text-white">{activeChordNotes.join(" ")}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => play()}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-indigo-400"
              >
                Play
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950/30 p-5 ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Shape & fingering</div>
                <div className="mt-1 text-sm text-slate-300">
                  Strings are shown 6 → 1. &ldquo;x&rdquo; means muted.
                </div>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
                {preset === "caged"
                  ? `CAGED: ${cagedPosition}`
                  : preset === "open"
                    ? "Open"
                    : `${preset}-shape`}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-xs font-semibold text-slate-300">Fingering</div>
              <div className="mt-3 grid grid-cols-6 gap-2">
                {(fingering ?? ["x", "x", "x", "x", "x", "x"]).map((f, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-950/40 px-2 py-3 text-center text-sm font-semibold text-white ring-1 ring-white/10"
                    title={`String ${6 - idx}`}
                  >
                    {f}
                  </div>
                ))}
              </div>
              {!fingering ? (
                <div className="mt-3 text-sm text-slate-300">
                  No fingering preset for this chord/quality yet. Try a different quality or use a barre shape.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-950/30 p-5 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Fretboard</div>
              <div className="mt-1 text-sm text-slate-300">
                Full-width view so the shape is easy to read.
              </div>
            </div>
          </div>

          <div className="mt-4">
            <FretboardGrid
              startFret={activeWindow.startFret}
              maxFret={Math.max(
                activeWindow.endFret,
                Math.min(18, Math.max(...activeHighlights.map((h) => h.fret), 5))
              )}
              highlights={activeHighlights}
              rootPitchClasses={activeChordPitch.length ? [activeChordPitch[0]!] : []}
              scalePitchClasses={activeChordPitch}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
