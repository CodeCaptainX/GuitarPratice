import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";

import FretboardGrid from "../components/practice/FretboardGrid";
import TabGrid, { SelectedCell } from "../components/riff/TabGrid";
import { noteAtWithOctave } from "../utils/musicUtils";
import {
  createEmptyTabRiff,
  getNotesAtStep,
  loadTabRiff,
  saveTabRiff,
  stepToBarBeat,
  totalSteps,
  type TabRiff,
} from "../utils/tabRiff";

function msPerStep(bpm: number, stepsPerBeat: number) {
  const beatMs = (60_000 / Math.max(30, Math.min(260, bpm)));
  return beatMs / stepsPerBeat;
}

export default function RiffPage() {
  const [riff, setRiff] = useState<TabRiff>(() => createEmptyTabRiff());
  const [selected, setSelected] = useState<SelectedCell>({ stringRow: 0, stepIndex: 0 });
  const [playheadStep, setPlayheadStep] = useState<number | null>(null);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [loop, setLoop] = useState(true);
  const [maxFret, setMaxFret] = useState(12);
  const [volume, setVolume] = useState(80);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const clickRef = useRef<Tone.MembraneSynth | null>(null);
  const timersRef = useRef<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setRiff(loadTabRiff());
  }, []);

  useEffect(() => {
    saveTabRiff(riff);
  }, [riff]);

  const ensureAudio = async () => {
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
    if (!clickRef.current) {
      clickRef.current = new Tone.MembraneSynth().toDestination();
      clickRef.current.set({ volume: -12 });
    }
    const volDb = -24 + (Math.max(0, Math.min(100, volume)) / 100) * 24;
    synthRef.current.set({ volume: volDb });
  };

  const stop = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setIsPlaying(false);
    setPlayheadStep(null);
  };

  useEffect(() => {
    return () => {
      stop();
      synthRef.current?.dispose();
      synthRef.current = null;
      clickRef.current?.dispose();
      clickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = totalSteps(riff);
  const stepMs = msPerStep(riff.bpm, riff.stepsPerBeat);
  const stepsPerBeat = riff.stepsPerBeat;
  const stepsPerBar = 4 * stepsPerBeat;

  const nowInfo = useMemo(() => {
    if (playheadStep === null) return null;
    return stepToBarBeat(riff, playheadStep);
  }, [playheadStep, riff]);

  const nowNotes = useMemo(() => {
    if (playheadStep === null) return [];
    return getNotesAtStep(riff, playheadStep);
  }, [playheadStep, riff]);

  const play = async () => {
    if (steps <= 0) return;
    stop();
    await ensureAudio();
    setIsPlaying(true);
    setPlayheadStep(0);

    const timers: number[] = [];
    const schedulePass = (startAtMs: number) => {
      for (let step = 0; step < steps; step++) {
        const t = startAtMs + step * stepMs;
        const id = window.setTimeout(() => {
          setPlayheadStep(step);

          // metronome (quarter notes)
          if (metronomeOn && step % stepsPerBeat === 0) {
            const isDownbeat = step % stepsPerBar === 0;
            clickRef.current?.triggerAttackRelease(isDownbeat ? "C2" : "G2", "16n");
          }

          const notes = getNotesAtStep(riff, step);
          if (notes.length) {
            synthRef.current?.triggerAttackRelease(notes, "8n");
          }
        }, t);
        timers.push(id);
      }

      const endId = window.setTimeout(() => {
        if (loop) {
          schedulePass(0);
        } else {
          setIsPlaying(false);
          setPlayheadStep(null);
        }
      }, startAtMs + steps * stepMs + 10);
      timers.push(endId);
    };

    schedulePass(0);
    timersRef.current = timers;
  };

  const updateCell = (stringRow: number, stepIndex: number, value: number | null) => {
    setRiff((prev) => {
      const next: TabRiff = {
        ...prev,
        cells: prev.cells.map((row) => [...row]),
      };
      if (!next.cells[stringRow] || next.cells[stringRow]!.length <= stepIndex) return prev;
      next.cells[stringRow]![stepIndex] = value;
      return next;
    });
  };

  const addFromFretboard = (fret: number) => {
    if (!selected) return;
    updateCell(selected.stringRow, selected.stepIndex, fret);
    // Auto-advance to next step
    setSelected((prev) => {
      if (!prev) return prev;
      const nextStep = Math.min(steps - 1, prev.stepIndex + 1);
      return { ...prev, stepIndex: nextStep };
    });
  };

  const clearSelected = () => {
    if (!selected) return;
    updateCell(selected.stringRow, selected.stepIndex, null);
  };

  const resizeBars = (bars: number) => {
    setRiff((prev) => {
      const nextBars = Math.max(1, Math.min(32, bars));
      const nextTotal = nextBars * 4 * prev.stepsPerBeat;
      const nextCells = prev.cells.map((row) => {
        const out = row.slice(0, nextTotal);
        while (out.length < nextTotal) out.push(null);
        return out;
      });
      return { ...prev, bars: nextBars, cells: nextCells };
    });
    setSelected((s) => (s ? { ...s, stepIndex: 0 } : s));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Riff Builder (TAB)</div>
            <div className="mt-1 text-sm text-slate-300">
              Click a TAB cell, then click the fretboard to place a note. Playback shows a moving playhead + metronome.
            </div>
            {nowInfo ? (
              <div className="mt-3 text-sm text-slate-300">
                Now:{" "}
                <span className="font-semibold text-white">
                  Bar {nowInfo.bar} · Beat {nowInfo.beat}
                </span>
                {nowNotes.length ? (
                  <span className="ml-2 text-slate-300">
                    Notes: <span className="font-semibold text-white">{nowNotes.join(" ")}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void play()}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-indigo-400"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => stop()}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
              disabled={!isPlaying}
            >
              Stop
            </button>
            <button
              type="button"
              onClick={() => clearSelected()}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Erase cell
            </button>
            <button
              type="button"
              onClick={() => setRiff(createEmptyTabRiff({ bpm: riff.bpm, bars: riff.bars, stepsPerBeat: riff.stepsPerBeat }))}
              className="rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-rose-500"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-6">
          <label className="block lg:col-span-1">
            <div className="text-xs text-slate-300">BPM</div>
            <input
              type="number"
              min={30}
              max={260}
              value={riff.bpm}
              onChange={(e) =>
                setRiff((prev) => ({ ...prev, bpm: Math.max(30, Math.min(260, Number(e.target.value || 110))) }))
              }
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </label>

          <label className="block lg:col-span-1">
            <div className="text-xs text-slate-300">Bars (4/4)</div>
            <input
              type="number"
              min={1}
              max={32}
              value={riff.bars}
              onChange={(e) => resizeBars(Number(e.target.value || 4))}
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </label>

          <label className="block lg:col-span-1">
            <div className="text-xs text-slate-300">Resolution</div>
            <select
              value={riff.stepsPerBeat}
              onChange={(e) => {
                const spb = Number(e.target.value);
                // Keep it simple: only support 2 for now in UI; accept 1/4 for future.
                setRiff((prev) => {
                  const next = createEmptyTabRiff({ bpm: prev.bpm, bars: prev.bars, stepsPerBeat: spb });
                  // Attempt to copy existing data into new grid where possible.
                  const minSteps = Math.min(totalSteps(prev), totalSteps(next));
                  const cells = next.cells.map((row, r) =>
                    row.map((_, c) => (c < minSteps ? prev.cells[r]?.[c] ?? null : null))
                  );
                  return { ...next, cells };
                });
                setSelected({ stringRow: 0, stepIndex: 0 });
              }}
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value={2}>Eighth notes</option>
              <option value={1}>Quarter notes</option>
              <option value={4}>Sixteenth notes</option>
            </select>
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10 lg:col-span-1">
            <div>
              <div className="text-sm font-semibold text-white">Metronome</div>
              <div className="text-xs text-slate-300">Ticks on beats.</div>
            </div>
            <input
              type="checkbox"
              checked={metronomeOn}
              onChange={(e) => setMetronomeOn(e.target.checked)}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10 lg:col-span-1">
            <div>
              <div className="text-sm font-semibold text-white">Loop</div>
              <div className="text-xs text-slate-300">Repeat bars.</div>
            </div>
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>

          <label className="block lg:col-span-1">
            <div className="text-xs text-slate-300">Volume</div>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="mt-3 w-full accent-indigo-500"
            />
            <div className="mt-1 text-xs text-slate-400">{volume}%</div>
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="text-sm font-semibold text-white">TAB spreadsheet</div>
        <div className="mt-4">
          <TabGrid riff={riff} selected={selected} onSelect={setSelected} playheadStep={playheadStep} />
        </div>
        <div className="mt-4 text-sm text-slate-300">
          Selected cell:{" "}
          {selected ? (
            <span className="font-semibold text-white">
              string {6 - selected.stringRow} · step {selected.stepIndex + 1}
            </span>
          ) : (
            "—"
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Fretboard input</div>
            <div className="mt-1 text-sm text-slate-300">
              Click the fretboard to write into the selected TAB cell (then auto-advances one step).
            </div>
          </div>
          <label className="block">
            <div className="text-xs text-slate-300">Fret range</div>
            <input
              type="range"
              min={5}
              max={24}
              value={maxFret}
              onChange={(e) => setMaxFret(Number(e.target.value))}
              className="mt-3 w-56 accent-indigo-500"
            />
            <div className="mt-1 text-xs text-slate-400">0–{maxFret}</div>
          </label>
        </div>

        <div className="mt-4">
          <FretboardGrid
            startFret={0}
            maxFret={maxFret}
            onCellClick={(stringNumber, fret) => {
              // quick local preview sound
              void (async () => {
                await ensureAudio();
                synthRef.current?.triggerAttackRelease(noteAtWithOctave(stringNumber, fret), "8n");
              })();
              addFromFretboard(fret);
            }}
          />
        </div>
      </section>
    </div>
  );
}
