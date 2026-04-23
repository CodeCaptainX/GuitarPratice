import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import {
  ALL_KEYS,
  keyRoot,
  noteAt,
  noteIndex,
  ScaleFamily,
  scaleNoteNames,
  scalePitchClasses,
} from "../../utils/musicUtils";
import { CagedPosition, getCagedWindow } from "../../utils/caged";
import FretboardGrid from "./FretboardGrid";

const families: { id: ScaleFamily; label: string; hint: string }[] = [
  { id: "major", label: "Major", hint: "Ionian (7 notes)" },
  { id: "natural_minor", label: "Minor", hint: "Natural minor (7 notes)" },
  { id: "major_pentatonic", label: "Major pentatonic", hint: "5 notes" },
  { id: "minor_pentatonic", label: "Minor pentatonic", hint: "5 notes" },
  { id: "blues", label: "Blues", hint: "Minor blues (6 notes)" },
];

export default function ScaleTrainer() {
  const [selectedKey, setSelectedKey] = useState<string>("C");
  const [family, setFamily] = useState<ScaleFamily>("major");
  const [position, setPosition] = useState<CagedPosition>("full");

  const root = useMemo(() => keyRoot(selectedKey), [selectedKey]);
  const pitch = useMemo(() => scalePitchClasses(root, family), [family, root]);
  const notes = useMemo(() => scaleNoteNames(root, family), [family, root]);

  const cagedWindow = useMemo(() => getCagedWindow(root, position), [position, root]);
  const startFret = cagedWindow.startFret;
  const endFret = cagedWindow.endFret;

  const [drillRunning, setDrillRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1200);
  const [pingPong, setPingPong] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlayStep, setAutoPlayStep] = useState(true);
  const [startOctave, setStartOctave] = useState(4);
  const [volume, setVolume] = useState(80);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepDir, setStepDir] = useState<1 | -1>(1);
  const timerRef = useRef<number | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const playbackTimersRef = useRef<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cyclePlaying, setCyclePlaying] = useState(false);
  const cycleIndexRef = useRef<number>(0);
  const cyclePlayingRef = useRef<boolean>(false);
  const cyclePositions: Array<Exclude<CagedPosition, "full">> = ["C", "A", "G", "E", "D"];
  const [showScaleMap, setShowScaleMap] = useState(false);
  const [showScaleNotes, setShowScaleNotes] = useState(true);

  const stepNotes = useMemo(() => {
    if (!notes.length) return [];
    return [...notes, notes[0]!];
  }, [notes]);

  const stepPitch = useMemo(() => {
    if (!pitch.length) return [];
    return [...pitch, pitch[0]!];
  }, [pitch]);

  const currentStepNote = stepNotes[stepIndex] ?? null;
  const isInPlayback = isPlaying || cyclePlaying;

  const stepNotesWithOctave = useMemo(() => {
    if (!stepNotes.length) return [];
    let octave = startOctave;
    const out: string[] = [];
    for (let i = 0; i < stepNotes.length; i++) {
      if (i > 0 && stepPitch[i] !== undefined && stepPitch[i - 1] !== undefined) {
        if ((stepPitch[i] as number) < (stepPitch[i - 1] as number)) octave += 1;
      }
      out.push(`${stepNotes[i]}${octave}`);
    }
    return out;
  }, [startOctave, stepNotes, stepPitch]);

  const ensureSynth = async () => {
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
    const volDb = -24 + (Math.max(0, Math.min(100, volume)) / 100) * 24;
    synthRef.current.set({ volume: volDb });
  };

  const playNote = async (noteWithOctave: string) => {
    if (!soundEnabled) return;
    await ensureSynth();
    synthRef.current?.triggerAttackRelease(noteWithOctave, "8n");
  };

  const stopAudio = () => {
    playbackTimersRef.current.forEach((t) => window.clearTimeout(t));
    playbackTimersRef.current = [];
    setIsPlaying(false);
  };

  const schedulePlayback = async (
    sequence: string[],
    stepIndices?: number[],
    onDone?: () => void
  ) => {
    if (!soundEnabled || !sequence.length) return;
    stopAudio();
    await ensureSynth();
    setIsPlaying(true);
    const safeStep = Math.max(120, intervalMs);

    const timers: number[] = [];
    sequence.forEach((note, i) => {
      const id = window.setTimeout(() => {
        synthRef.current?.triggerAttackRelease(note, "8n");
      }, i * safeStep);
      timers.push(id);

      const stepIndexAtTime = stepIndices?.[i];
      if (typeof stepIndexAtTime === "number") {
        const uiId = window.setTimeout(() => {
          setStepIndex(stepIndexAtTime);
        }, i * safeStep);
        timers.push(uiId);
      }
    });

    const doneId = window.setTimeout(() => setIsPlaying(false), sequence.length * safeStep + 10);
    timers.push(doneId);
    playbackTimersRef.current = timers;

    if (onDone) {
      const cbId = window.setTimeout(() => onDone(), sequence.length * safeStep + 30);
      timers.push(cbId);
      playbackTimersRef.current = timers;
    }
  };

  const upIndices = useMemo(() => stepNotes.map((_, i) => i), [stepNotes]);
  const downIndices = useMemo(
    () => stepNotes.map((_, i) => stepNotes.length - 1 - i),
    [stepNotes]
  );
  const upDownIndices = useMemo(() => {
    const n = stepNotes.length;
    if (n <= 1) return [0];
    const downPart = Array.from({ length: n - 2 }, (_, i) => n - 2 - i); // n-2 .. 1
    return [...Array.from({ length: n }, (_, i) => i), ...downPart];
  }, [stepNotes.length]);

  const playUp = async () => {
    setStepIndex(0);
    await schedulePlayback(stepNotesWithOctave, upIndices);
  };
  const playDown = async () => {
    setStepIndex(stepNotes.length ? stepNotes.length - 1 : 0);
    await schedulePlayback([...stepNotesWithOctave].reverse(), downIndices);
  };
  const playUpDown = async () => {
    const ascending = stepNotesWithOctave;
    const sequence = [...ascending, ...ascending.slice(1, -1).reverse()];
    setStepIndex(0);
    await schedulePlayback(sequence, upDownIndices);
  };

  const playUpDownOnce = async (onDone?: () => void) => {
    const ascending = stepNotesWithOctave;
    const sequence = [...ascending, ...ascending.slice(1, -1).reverse()];
    setStepIndex(0);
    await schedulePlayback(sequence, upDownIndices, onDone);
  };

  const startCagedCycle = async () => {
    if (!stepNotesWithOctave.length) return;
    if (!soundEnabled) return;
    setCyclePlaying(true);
    cyclePlayingRef.current = true;

    const startPos = position === "full" ? "C" : position;
    const startIndex = Math.max(0, cyclePositions.indexOf(startPos as Exclude<CagedPosition, "full">));
    cycleIndexRef.current = startIndex;

    const run = async () => {
      if (!cyclePlayingRef.current) return;
      const pos = cyclePositions[cycleIndexRef.current] ?? "C";
      setPosition(pos);
      await playUpDownOnce(() => {
        if (!cyclePlayingRef.current) return;
        cycleIndexRef.current = (cycleIndexRef.current + 1) % cyclePositions.length;
        void run();
      });
    };

    await run();
  };

  const stopAllAudio = () => {
    cyclePlayingRef.current = false;
    setCyclePlaying(false);
    stopAudio();
  };

  type Location = { string: number; fret: number };

  const candidateLocations = useMemo(() => {
    const map = new Map<number, Location[]>();
    for (const pc of stepPitch) {
      if (!map.has(pc)) map.set(pc, []);
    }
    if (!map.size) return map;

    for (let stringNumber = 6; stringNumber >= 1; stringNumber--) {
      for (let fret = startFret; fret <= endFret; fret++) {
        const n = noteAt(stringNumber, fret);
        const idx = noteIndex(n);
        if (idx === null) continue;
        const list = map.get(idx);
        if (!list) continue;
        list.push({ string: stringNumber, fret });
      }
    }
    return map;
  }, [endFret, startFret, stepPitch]);

  const stepLocations = useMemo(() => {
    if (!stepPitch.length) return [];

    const chooseStart = (pc: number): Location | null => {
      const list = candidateLocations.get(pc) ?? [];
      if (!list.length) return null;
      // Start low on the neck (lower fret), prefer lower strings (6->1).
      return (
        [...list].sort((a, b) => {
          if (a.fret !== b.fret) return a.fret - b.fret;
          return b.string - a.string;
        })[0] ?? null
      );
    };

    const cost = (prev: Location, next: Location) => {
      const fretDelta = Math.abs(next.fret - prev.fret);
      const stringDelta = Math.abs(next.string - prev.string);
      const backwardsPenalty = next.fret < prev.fret ? 10 : 0; // encourage "ascending" movement
      return fretDelta * 2 + stringDelta * 3 + backwardsPenalty;
    };

    const out: Array<Location | null> = [];
    let prev: Location | null = null;

    for (let i = 0; i < stepPitch.length; i++) {
      const pc = stepPitch[i]!;
      const list = candidateLocations.get(pc) ?? [];
      if (!list.length) {
        out.push(null);
        continue;
      }

      if (!prev) {
        const start = chooseStart(pc);
        out.push(start);
        prev = start;
        continue;
      }

      const best =
        [...list].sort((a, b) => cost(prev!, a) - cost(prev!, b))[0] ?? null;
      out.push(best);
      prev = best ?? prev;
    }

    return out;
  }, [candidateLocations, stepPitch]);

  const currentLocation = stepLocations[stepIndex] ?? null;

  const nextSteps = useMemo(() => {
    if (!stepNotes.length) return [];
    const out: string[] = [];
    let idx = stepIndex;
    let dir: 1 | -1 = stepDir;
    for (let i = 0; i < 6; i++) {
      let next = idx + dir;
      if (pingPong) {
        if (next >= stepNotes.length) {
          dir = -1;
          next = idx + dir;
        } else if (next < 0) {
          dir = 1;
          next = idx + dir;
        }
      } else {
        if (next >= stepNotes.length) next = 0;
        if (next < 0) next = stepNotes.length - 1;
      }
      out.push(stepNotes[next]!);
      idx = next;
    }
    return out;
  }, [pingPong, stepDir, stepIndex, stepNotes]);

  const advance = () => {
    if (!stepNotes.length) return;
    setStepIndex((idx) => {
      let next = idx + stepDir;
      if (pingPong) {
        if (next >= stepNotes.length) {
          setStepDir(-1);
          next = idx - 1;
        } else if (next < 0) {
          setStepDir(1);
          next = idx + 1;
        }
      } else {
        if (next >= stepNotes.length) next = 0;
        if (next < 0) next = stepNotes.length - 1;
      }
      return Math.max(0, Math.min(stepNotes.length - 1, next));
    });
  };

  useEffect(() => {
    setStepIndex(0);
    setStepDir(1);
  }, [selectedKey, family, position]);

  useEffect(() => {
    if (!drillRunning) return;
    if (!stepNotes.length) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => advance(), intervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillRunning, intervalMs, pingPong, stepNotes.length]);

  useEffect(() => {
    if (!drillRunning) return;
    if (!soundEnabled) return;
    if (!autoPlayStep) return;
    const noteWithOctave = stepNotesWithOctave[stepIndex];
    if (!noteWithOctave) return;
    void playNote(noteWithOctave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayStep, drillRunning, soundEnabled, stepIndex, stepNotesWithOctave]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      stopAllAudio();
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Scales</div>
            <div className="mt-1 text-sm text-slate-300">
              Choose a key + scale family, then practice it in a focused position window.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <div className="text-xs text-slate-300">Key</div>
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
              <div className="text-xs text-slate-300">Scale</div>
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value as ScaleFamily)}
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-[11px] text-slate-400">
                {families.find((f) => f.id === family)?.hint ?? ""}
              </div>
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">CAGED position</div>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as CagedPosition)}
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                <option value="full">Full neck (0–18)</option>
                <option value="C">C</option>
                <option value="A">A</option>
                <option value="G">G</option>
                <option value="E">E</option>
                <option value="D">D</option>
              </select>
              <div className="mt-1 text-[11px] text-slate-400">
                Showing frets {startFret}–{endFret}
              </div>
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="mr-2 text-xs text-slate-400">Scale notes</div>
          <label className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
            <input
              type="checkbox"
              checked={showScaleNotes && !isInPlayback}
              onChange={(e) => setShowScaleNotes(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
              disabled={isInPlayback}
            />
            Show list
          </label>
          <button
            type="button"
            onClick={async () => {
              const text = notes.join(" ");
              try {
                await navigator.clipboard.writeText(text);
              } catch {
                // ignore
              }
            }}
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Copy
          </button>
        </div>

        {showScaleNotes && !isInPlayback ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {notes.map((n, i) => {
              const isRoot = i === 0;
              const noteWithOctave = stepNotesWithOctave[i] ?? `${n}${startOctave}`;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => void playNote(noteWithOctave)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-colors hover:bg-white/10 ${isRoot
                    ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20"
                    : "bg-white/5 text-slate-200 ring-white/10"
                    }`}
                  title={`Play ${noteWithOctave}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Linear drill</div>
            <div className="mt-1 text-sm text-slate-300">
              Shows one note at a time, moving forward then backward (ping-pong).
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div className="text-xs text-slate-300">Current</div>
              <div className="mt-1 text-4xl font-bold tracking-tight text-white">
                {currentStepNote ?? "—"}
              </div>
              <div className="mt-2 text-sm text-slate-300">
                Direction:{" "}
                <span className="font-semibold text-white">{stepDir === 1 ? "Up" : "Down"}</span>
              </div>

              <div className="mt-2 text-sm text-slate-300">
                Position: <span className="font-semibold text-white">{position === "full" ? "Full" : position}</span>{" "}
                <span className="text-slate-400">(frets {startFret}–{endFret})</span>
              </div>

              <div className="mt-2 text-sm text-slate-300">
                Play:{" "}
                {currentLocation ? (
                  <>
                    String <span className="font-semibold text-white">{currentLocation.string}</span> · Fret{" "}
                    <span className="font-semibold text-white">{currentLocation.fret}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Any matching note in this position</span>
                )}
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-300">Up next</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {nextSteps.map((n, idx) => (
                    <span
                      key={`${n}-${idx}`}
                      className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/10"
                    >
                      {n}
                    </span>
                  ))}
                  {!nextSteps.length ? (
                    <span className="text-xs text-slate-400">Pick a scale to start.</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setDrillRunning((v) => {
                    const next = !v;
                    if (next && soundEnabled) void ensureSynth();
                    return next;
                  })
                }
                className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-white/10 ${drillRunning ? "bg-rose-500 hover:bg-rose-400" : "bg-indigo-500 hover:bg-indigo-400"
                  } text-white`}
                disabled={!stepNotes.length}
              >
                {drillRunning ? "Stop" : "Start"}
              </button>
              <button
                type="button"
                onClick={() => advance()}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!stepNotes.length}
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => void playUp()}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!stepNotes.length || !soundEnabled}
              >
                Play up
              </button>
              <button
                type="button"
                onClick={() => void playDown()}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!stepNotes.length || !soundEnabled}
              >
                Play down
              </button>
              <button
                type="button"
                onClick={() => void playUpDown()}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!stepNotes.length || !soundEnabled}
              >
                Play up/down
              </button>
              <button
                type="button"
                onClick={() => void startCagedCycle()}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!stepNotes.length || !soundEnabled || cyclePlaying}
                title="Plays up/down in C, then A, then G, then E, then D positions"
              >
                Play CAGED cycle
              </button>
              <button
                type="button"
                onClick={() => stopAllAudio()}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!isPlaying && !cyclePlaying}
              >
                Stop audio
              </button>
              <button
                type="button"
                onClick={() => {
                  setStepIndex(0);
                  setStepDir(1);
                }}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                disabled={!stepNotes.length}
              >
                Reset
              </button>
            </div>

            <label className="block">
              <div className="text-xs text-slate-300">Interval</div>
              <input
                type="range"
                min={300}
                max={2500}
                step={50}
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="mt-3 w-full accent-indigo-500"
              />
              <div className="mt-1 text-xs text-slate-400">{intervalMs} ms</div>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div>
                  <div className="text-sm font-semibold text-white">Sound</div>
                  <div className="text-xs text-slate-300">Enable playback buttons + auto-step audio.</div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="h-5 w-5 accent-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div>
                  <div className="text-sm font-semibold text-white">Auto-play step</div>
                  <div className="text-xs text-slate-300">Play each drill note as it appears.</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlayStep}
                  onChange={(e) => setAutoPlayStep(e.target.checked)}
                  className="h-5 w-5 accent-indigo-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-xs text-slate-300">Start octave</div>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={startOctave}
                  onChange={(e) => setStartOctave(Number(e.target.value || 4))}
                  className="mt-2 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </label>

              <label className="block rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
                <div className="text-xs text-slate-300">Volume</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="mt-3 w-full accent-indigo-500"
                />
                <div className="mt-1 text-[11px] text-slate-400">{volume}%</div>
              </label>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div>
                <div className="text-sm font-semibold text-white">Ping-pong</div>
                <div className="text-xs text-slate-300">Go up then back down through the scale.</div>
              </div>
              <input
                type="checkbox"
                checked={pingPong}
                onChange={(e) => setPingPong(e.target.checked)}
                className="h-5 w-5 accent-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div>
                <div className="text-sm font-semibold text-white">Show scale map</div>
                <div className="text-xs text-slate-300">Tint all scale notes on the fretboard.</div>
              </div>
              <input
                type="checkbox"
                checked={showScaleMap && !isInPlayback}
                onChange={(e) => setShowScaleMap(e.target.checked)}
                className="h-5 w-5 accent-indigo-500"
                disabled={isInPlayback}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Fretboard view</div>
            <div className="mt-1 text-sm text-slate-300">
              Root notes are green; scale notes are tinted; current drill note is amber.
            </div>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
            Root: <span className="font-semibold text-white">{notes[0] ?? "—"}</span>
          </div>
        </div>

        <div className="mt-4">
          <FretboardGrid
            startFret={startFret}
            maxFret={endFret}
            highlights={currentLocation ? [currentLocation] : []}
          />
        </div>
      </section>
    </div>
  );
}
