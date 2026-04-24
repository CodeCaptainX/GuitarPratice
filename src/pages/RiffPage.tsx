import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";

import FretboardGrid from "../components/practice/FretboardGrid";
import RiffStaff from "../components/riff/RiffStaff";
import TabGrid, { SelectedCell, TabGridSize } from "../components/riff/TabGrid";
import RiffQuickStart from "../components/riff/RiffQuickStart";
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
  const beatMs = 60_000 / Math.max(30, Math.min(260, bpm));
  return beatMs / stepsPerBeat;
}

function durationForStepsPerBeat(stepsPerBeat: number): Tone.Unit.Time {
  if (stepsPerBeat === 1) return "4n";
  if (stepsPerBeat === 4) return "16n";
  return "8n";
}

export default function RiffPage() {
  const [riff, setRiff] = useState<TabRiff>(() => createEmptyTabRiff());
  const [selected, setSelected] = useState<SelectedCell>({ stringRow: 0, stepIndex: 0 });
  const [playheadStep, setPlayheadStep] = useState<number | null>(null);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [loop, setLoop] = useState(true);
  const [maxFret, setMaxFret] = useState(12);
  const [volume, setVolume] = useState(80);
  const [uiSize, setUiSize] = useState<TabGridSize>("xl");
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [sustainOnEmpty, setSustainOnEmpty] = useState(true);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const clickRef = useRef<Tone.MembraneSynth | null>(null);
  const timersRef = useRef<number[]>([]);
  const heldByStringRef = useRef<Array<string | null>>(Array.from({ length: 6 }, () => null));
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
      synthRef.current.set({
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.25, release: 0.25 },
      });
    }
    if (!clickRef.current) {
      clickRef.current = new Tone.MembraneSynth().toDestination();
      clickRef.current.set({ volume: -12 });
    }
    const volDb = -24 + (Math.max(0, Math.min(100, volume)) / 100) * 24;
    synthRef.current.set({ volume: volDb });
  };

  const releaseAll = () => {
    const synth = synthRef.current;
    if (!synth) return;
    for (let row = 0; row < 6; row++) {
      const held = heldByStringRef.current[row];
      if (held) synth.triggerRelease(held);
      heldByStringRef.current[row] = null;
    }
  };

  const stop = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    releaseAll();
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

  const updateCell = (stringRow: number, stepIndex: number, value: number | null) => {
    setRiff((prev) => {
      const next: TabRiff = { ...prev, cells: prev.cells.map((row) => [...row]) };
      if (!next.cells[stringRow] || next.cells[stringRow]!.length <= stepIndex) return prev;
      next.cells[stringRow]![stepIndex] = value;
      return next;
    });
  };

  const moveSelectedStep = (delta: number) => {
    setSelected((prev) => {
      const base = prev ?? { stringRow: 0, stepIndex: 0 };
      return { ...base, stepIndex: Math.max(0, Math.min(steps - 1, base.stepIndex + delta)) };
    });
  };

  const addFromFretboard = (fret: number) => {
    if (!selected) return;
    updateCell(selected.stringRow, selected.stepIndex, fret);
    if (autoAdvance) moveSelectedStep(1);
  };

  const clearSelected = () => {
    if (!selected) return;
    updateCell(selected.stringRow, selected.stepIndex, null);
  };

  const muteSelected = () => {
    if (!selected) return;
    updateCell(selected.stringRow, selected.stepIndex, -1);
  };

  const moveSelectedString = (delta: number) => {
    setSelected((prev) => {
      const base = prev ?? { stringRow: 0, stepIndex: 0 };
      return { ...base, stringRow: Math.max(0, Math.min(5, base.stringRow + delta)) };
    });
  };

  const clearAll = () => {
    setRiff((prev) => ({ ...prev, cells: prev.cells.map((row) => row.map(() => null)) }));
    setSelected({ stringRow: 0, stepIndex: 0 });
  };

  const resizeBars = (bars: number) => {
    const nextBars = Math.max(1, Math.min(32, bars));
    setRiff((prev) => {
      const nextTotal = nextBars * 4 * prev.stepsPerBeat;
      const nextCells = prev.cells.map((row) =>
        Array.from({ length: nextTotal }, (_, i) => (i < row.length ? row[i] ?? null : null))
      );
      return { ...prev, bars: nextBars, cells: nextCells };
    });
    setSelected((prev) => {
      const base = prev ?? { stringRow: 0, stepIndex: 0 };
      const nextStep = Math.max(
        0,
        Math.min(nextBars * 4 * riff.stepsPerBeat - 1, base.stepIndex)
      );
      return { ...base, stepIndex: nextStep };
    });
  };

  const play = async () => {
    if (steps <= 0) return;
    stop();
    await ensureAudio();
    setIsPlaying(true);
    setPlayheadStep(0);

    const dur = durationForStepsPerBeat(riff.stepsPerBeat);
    const timers: number[] = [];

    const schedulePass = (startAtMs: number) => {
      releaseAll();

      for (let step = 0; step < steps; step++) {
        const t = startAtMs + step * stepMs;
        const id = window.setTimeout(() => {
          setPlayheadStep(step);

          if (metronomeOn && step % stepsPerBeat === 0) {
            const isDownbeat = step % stepsPerBar === 0;
            clickRef.current?.triggerAttackRelease(isDownbeat ? "C2" : "G2", "16n");
          }

          if (!sustainOnEmpty) {
            const notes = getNotesAtStep(riff, step);
            if (notes.length) synthRef.current?.triggerAttackRelease(notes, dur);
            return;
          }

          // Sustain mode: each string is its own "voice". Empty cells keep ringing.
          const synth = synthRef.current;
          if (!synth) return;
          for (let stringRow = 0; stringRow < 6; stringRow++) {
            const cell = riff.cells[stringRow]?.[step] ?? null;
            const held = heldByStringRef.current[stringRow];

            if (cell === -1) {
              if (held) synth.triggerRelease(held);
              heldByStringRef.current[stringRow] = null;
              continue;
            }

            if (typeof cell !== "number") {
              // null => tie/hold
              continue;
            }

            if (cell < 0) continue;
            const note = noteAtWithOctave(6 - stringRow, cell);
            if (held && held !== note) synth.triggerRelease(held);
            if (held !== note) synth.triggerAttack(note);
            heldByStringRef.current[stringRow] = note;
          }
        }, t);
        timers.push(id);
      }

      const endId = window.setTimeout(() => {
        if (loop) {
          schedulePass(0);
        } else {
          releaseAll();
          setIsPlaying(false);
          setPlayheadStep(null);
        }
      }, startAtMs + steps * stepMs + 10);
      timers.push(endId);
    };

    schedulePass(0);
    timersRef.current = timers;
  };

  const selectedLabel = useMemo(() => {
    if (!selected) return "—";
    return `string ${6 - selected.stringRow} · step ${selected.stepIndex + 1}`;
  }, [selected]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!target || !(target as any).tagName) return false;
      const tag = String((target as any).tagName).toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || (target as any).isContentEditable;
    };

    let digitBuf = "";
    let digitTimer: number | null = null;
    const clampFret = (value: number) => Math.max(0, Math.min(24, Math.trunc(value)));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (!selected) return;

      const key = e.key;

      if (key === "ArrowLeft") {
        e.preventDefault();
        moveSelectedStep(-1);
        return;
      }
      if (key === "ArrowRight") {
        e.preventDefault();
        moveSelectedStep(1);
        return;
      }
      if (key === "ArrowUp") {
        e.preventDefault();
        moveSelectedString(-1);
        return;
      }
      if (key === "ArrowDown") {
        e.preventDefault();
        moveSelectedString(1);
        return;
      }

      if (key === "Backspace" || key === "Delete") {
        e.preventDefault();
        clearSelected();
        return;
      }
      if (key === "x" || key === "X") {
        e.preventDefault();
        muteSelected();
        return;
      }

      if (key === " " || key === "Spacebar") {
        e.preventDefault();
        if (isPlaying) stop();
        else void play();
        return;
      }

      if (/^\d$/.test(key)) {
        e.preventDefault();
        if (digitTimer) window.clearTimeout(digitTimer);

        digitBuf = (digitBuf + key).slice(-2);
        let next = Number(digitBuf);
        if (!Number.isFinite(next)) return;
        if (next > 24) {
          digitBuf = key;
          next = Number(key);
        }

        updateCell(selected.stringRow, selected.stepIndex, clampFret(next));
        if (autoAdvance) moveSelectedStep(1);

        digitTimer = window.setTimeout(() => {
          digitBuf = "";
          digitTimer = null;
        }, 420);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (digitTimer) window.clearTimeout(digitTimer);
    };
  }, [
    autoAdvance,
    clearSelected,
    isPlaying,
    moveSelectedStep,
    moveSelectedString,
    muteSelected,
    play,
    selected,
    stop,
    updateCell,
  ]);

  return (
    <div className="space-y-6">
      {/* Studio: quick start + transport + settings */}
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Riff / Lick Studio</div>
            <div className="mt-1 text-sm text-slate-300">
              Generate a lick, edit it fast, and play it back as TAB + sheet.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void play()}
              disabled={isPlaying}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-indigo-400 disabled:opacity-50"
            >
              Play
            </button>
            <button
              type="button"
              onClick={stop}
              className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Stop
            </button>

            <label className="ml-1 flex items-center gap-2 rounded-xl bg-slate-950/30 px-3 py-2 ring-1 ring-white/10">
              <span className="text-xs font-semibold text-slate-300">BPM</span>
              <input
                type="number"
                value={riff.bpm}
                min={30}
                max={260}
                onChange={(e) =>
                  setRiff((p) => ({ ...p, bpm: Math.max(30, Math.min(260, Number(e.target.value))) }))
                }
                className="w-20 rounded-lg bg-slate-950/40 px-2 py-1 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </label>

            <div className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
              {selectedLabel}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <RiffQuickStart
            riff={riff}
            maxFret={maxFret}
            onApply={(next) => {
              setRiff(next);
              setSelected({ stringRow: 5, stepIndex: 0 });
            }}
            onClear={clearAll}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <label className="block lg:col-span-3">
            <div className="text-xs text-slate-300">Bars</div>
            <input
              type="number"
              value={riff.bars}
              min={1}
              max={32}
              onChange={(e) => resizeBars(Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </label>

          <label className="block lg:col-span-3">
            <div className="text-xs text-slate-300">Resolution</div>
            <select
              value={riff.stepsPerBeat}
              onChange={(e) => {
                const spb = Number(e.target.value);
                setRiff((prev) => {
                  const next = createEmptyTabRiff({ bpm: prev.bpm, bars: prev.bars, stepsPerBeat: spb });
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

          <label className="block lg:col-span-3">
            <div className="text-xs text-slate-300">UI size</div>
            <select
              value={uiSize}
              onChange={(e) => setUiSize((e.target.value as TabGridSize) || "xl")}
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value="xl">Big screen</option>
              <option value="lg">Large</option>
              <option value="md">Comfortable</option>
            </select>
          </label>

          <label className="block lg:col-span-3">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-6">
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
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

            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
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

            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div>
                <div className="text-sm font-semibold text-white">Auto-advance</div>
                <div className="text-xs text-slate-300">After fret entry, move forward.</div>
              </div>
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="h-5 w-5 accent-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div>
                <div className="text-sm font-semibold text-white">Sustain</div>
                <div className="text-xs text-slate-300">Empty cells keep ringing (tie).</div>
              </div>
              <input
                type="checkbox"
                checked={sustainOnEmpty}
                onChange={(e) => setSustainOnEmpty(e.target.checked)}
                className="h-5 w-5 accent-indigo-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-6 lg:justify-end">
            <button
              type="button"
              onClick={() => moveSelectedStep(-1)}
              className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Prev step
            </button>
            <button
              type="button"
              onClick={() => moveSelectedStep(1)}
              className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Next step
            </button>
            <button
              type="button"
              onClick={clearSelected}
              className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Clear cell
            </button>
            <button
              type="button"
              onClick={muteSelected}
              className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 ring-1 ring-rose-400/20 hover:bg-rose-500/20"
            >
              Mute (x)
            </button>
          </div>
        </div>
      </section>

      {/* Big screen: TAB + Sheet + Fretboard together */}
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">TAB editor</div>
              <div className="mt-1 text-sm text-slate-300">Click a cell then type a fret, or use the fretboard.</div>
            </div>
          </div>
          <div className="mt-4">
            <TabGrid riff={riff} selected={selected} onSelect={setSelected} playheadStep={playheadStep} size={uiSize} />
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Tip: use <span className="font-semibold text-slate-200">Mute (x)</span> to force-release a sustained note.
          </div>
        </section>

        <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Sheet view</div>
              <div className="mt-1 text-sm text-slate-300">Shows highest note (melody) + lowest note (bass) per step.</div>
            </div>
            <div className="shrink-0 rounded-xl bg-slate-950/30 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
              {nowInfo ? (
                <span>
                  Bar {nowInfo.bar} · Beat {nowInfo.beat}
                  {riff.stepsPerBeat > 1 ? ` (sub ${nowInfo.sub + 1})` : ""}
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <RiffStaff riff={riff} playheadStep={playheadStep} size={uiSize} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {nowNotes.length ? (
              nowNotes.map((n) => (
                <span
                  key={n}
                  className="rounded-lg bg-white/5 px-2 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/10"
                >
                  {n}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No notes</span>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 2xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Fretboard input</div>
              <div className="mt-1 text-sm text-slate-300">
                Pick a TAB cell, then click frets. Turn off auto-advance to enter chords on the same step.
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
                className="mt-3 w-64 accent-indigo-500"
              />
              <div className="mt-1 text-xs text-slate-400">0–{maxFret}</div>
            </label>
          </div>

          <div className="mt-4">
            <FretboardGrid
              startFret={0}
              maxFret={maxFret}
              onCellClick={(stringNumber, fret) => {
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
    </div>
  );
}
