import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_KEYS,
  keyRoot,
  ScaleFamily,
  scaleNoteNames,
  scalePitchClasses,
} from "../../utils/musicUtils";
import { CagedPosition, getCagedWindow } from "../../utils/caged";
import { getNoteAtPosition } from "../../utils/musicTheory";
import {
  loadPracticeSettings,
  savePracticeSettings,
  PracticeSettings,
} from "../../utils/practiceStorage";
import FretboardGrid from "./FretboardGrid";

type TargetNote = { string: number; fret: number; note: string };

const defaultFamily: ScaleFamily = "major";

export default function NoteTrainer() {
  const [initial] = useState<PracticeSettings>(() => loadPracticeSettings());

  const [running, setRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(initial.intervalMs);
  const [maxFret, setMaxFret] = useState(initial.maxFret);
  const [selectedKey, setSelectedKey] = useState(initial.selectedKey);

  const [filterEnabled, setFilterEnabled] = useState(initial.useKeyFilter);
  const [filterFamily, setFilterFamily] = useState<ScaleFamily>(defaultFamily);
  const [position, setPosition] = useState<CagedPosition>("full");

  const [speechEnabled, setSpeechEnabled] = useState(initial.useSpeech);
  const [volume, setVolume] = useState(initial.volume);

  const [queueSize, setQueueSize] = useState<number>(5);
  const [showPositions, setShowPositions] = useState<boolean>(true);
  const [queue, setQueue] = useState<TargetNote[]>([]);
  const timerRef = useRef<number | null>(null);
  const current = queue.length ? queue[0] : null;

  const allowedPitchClasses = useMemo(() => {
    if (!filterEnabled) return null;
    return scalePitchClasses(keyRoot(selectedKey), filterFamily);
  }, [filterEnabled, filterFamily, selectedKey]);

  const rootPitchClass = useMemo(() => {
    if (!filterEnabled) return null;
    return allowedPitchClasses?.[0] ?? null;
  }, [allowedPitchClasses, filterEnabled]);

  const allowedNoteNames = useMemo(() => {
    if (!filterEnabled) return [];
    return scaleNoteNames(keyRoot(selectedKey), filterFamily);
  }, [filterEnabled, filterFamily, selectedKey]);

  const cagedWindow = useMemo(() => {
    if (!filterEnabled) return null;
    return getCagedWindow(keyRoot(selectedKey), position);
  }, [filterEnabled, position, selectedKey]);

  const startFret = useMemo(() => {
    if (!filterEnabled || !cagedWindow) return 0;
    return cagedWindow.startFret;
  }, [cagedWindow, filterEnabled]);

  const endFret = useMemo(() => {
    const desiredEnd = Math.min(24, maxFret);
    if (!filterEnabled || !cagedWindow) return desiredEnd;
    return Math.min(desiredEnd, cagedWindow.endFret);
  }, [cagedWindow, filterEnabled, maxFret]);

  useEffect(() => {
    savePracticeSettings({
      ...initial,
      intervalMs,
      maxFret,
      selectedKey,
      useKeyFilter: filterEnabled,
      useSpeech: speechEnabled,
      volume,
    });
  }, [filterEnabled, initial, intervalMs, maxFret, selectedKey, speechEnabled, volume]);

  const speak = (text: string) => {
    if (!speechEnabled) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = Math.max(0, Math.min(1, volume / 100));
    window.speechSynthesis.speak(utterance);
  };

  const makeRandomNote = (): TargetNote | null => {
    for (let attempts = 0; attempts < 250; attempts++) {
      const string = Math.floor(Math.random() * 6) + 1;
      const fret = startFret + Math.floor(Math.random() * (endFret - startFret + 1));
      const note = getNoteAtPosition(string, fret);

      if (allowedPitchClasses) {
        const root = note.replace(/[0-9]/g, "");
        if (!allowedNoteNames.includes(root)) continue;
      }

      return { string, fret, note };
    }
    return null;
  };

  const fillQueue = () => {
    setQueue((prev) => {
      const next = [...prev];
      while (next.length < queueSize) {
        const note = makeRandomNote();
        if (!note) break;
        next.push(note);
      }
      return next;
    });
  };

  useEffect(() => {
    fillQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueSize, startFret, endFret, filterEnabled, filterFamily, selectedKey]);

  const advance = () => {
    setQueue((prev) => {
      const next = prev.slice(1);
      while (next.length < queueSize) {
        const note = makeRandomNote();
        if (!note) break;
        next.push(note);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!current) return;
    speak(current.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.note]);

  useEffect(() => {
    if (!running) return;
    fillQueue();
    timerRef.current = window.setInterval(() => advance(), intervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running, intervalMs, startFret, endFret, filterEnabled, filterFamily, queueSize, selectedKey]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-slate-300">Target</div>
            <div className="mt-1 text-4xl font-bold tracking-tight text-white">
              {current ? current.note : "—"}
            </div>
            {current ? (
              <div className="mt-2 text-sm text-slate-300">
                String <span className="font-semibold text-white">{current.string}</span> · Fret{" "}
                <span className="font-semibold text-white">{current.fret}</span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-400">Press Start to begin.</div>
            )}

          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRunning((v) => !v)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-white/10 ${
                running ? "bg-rose-500 hover:bg-rose-400" : "bg-indigo-500 hover:bg-indigo-400"
              } text-white`}
            >
              {running ? "Stop" : "Start"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!queue.length) fillQueue();
                else advance();
              }}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => current && speak(current.note)}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
              disabled={!current}
            >
              Speak
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-white">Settings</div>
          <div className="mt-4 space-y-4">
            <label className="block">
              <div className="text-xs text-slate-300">Interval</div>
              <input
                type="range"
                min={250}
                max={8000}
                step={50}
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="mt-3 w-full accent-indigo-500"
              />
              <div className="mt-1 text-xs text-slate-400">{intervalMs} ms</div>
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">Max fret</div>
              <input
                type="range"
                min={5}
                max={24}
                step={1}
                value={maxFret}
                onChange={(e) => setMaxFret(Number(e.target.value))}
                className="mt-3 w-full accent-indigo-500"
              />
              <div className="mt-1 text-xs text-slate-400">0–{maxFret}</div>
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
              <div className="mt-1 text-xs text-slate-400">{queueSize} notes</div>
            </label>

            <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Filter by scale</div>
                  <div className="text-xs text-slate-300">Limit targets to a key + scale family.</div>
                </div>
                <input
                  type="checkbox"
                  checked={filterEnabled}
                  onChange={(e) => setFilterEnabled(e.target.checked)}
                  className="h-5 w-5 accent-indigo-500"
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <label className="block">
                  <div className="text-xs text-slate-300">Key</div>
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    disabled={!filterEnabled}
                    className={`mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
                      !filterEnabled ? "opacity-60" : ""
                    }`}
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
                    value={filterFamily}
                    onChange={(e) => setFilterFamily(e.target.value as ScaleFamily)}
                    disabled={!filterEnabled}
                    className={`mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
                      !filterEnabled ? "opacity-60" : ""
                    }`}
                  >
                    <option value="major">Major</option>
                    <option value="natural_minor">Minor (natural)</option>
                    <option value="major_pentatonic">Pentatonic (major)</option>
                    <option value="minor_pentatonic">Pentatonic (minor)</option>
                    <option value="blues">Blues</option>
                  </select>
                </label>

                <label className="block">
                  <div className="text-xs text-slate-300">CAGED position</div>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as CagedPosition)}
                    disabled={!filterEnabled}
                    className={`mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
                      !filterEnabled ? "opacity-60" : ""
                    }`}
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

                <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <div>
                    <div className="text-sm font-semibold text-white">Show positions</div>
                    <div className="text-xs text-slate-300">Show string/fret in Up next list.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPositions}
                    onChange={(e) => setShowPositions(e.target.checked)}
                    className="h-5 w-5 accent-indigo-500"
                  />
                </label>

                {filterEnabled ? (
                  <div className="text-xs text-slate-300">
                    Notes: <span className="font-semibold text-white">{allowedNoteNames.join(" ")}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Speech</div>
                  <div className="text-xs text-slate-300">Speak the note name.</div>
                </div>
                <input
                  type="checkbox"
                  checked={speechEnabled}
                  onChange={(e) => setSpeechEnabled(e.target.checked)}
                  className="h-5 w-5 accent-indigo-500"
                />
              </div>
              <label className="mt-3 block">
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
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Fretboard</div>
              <div className="mt-1 text-sm text-slate-300">
                Tap a cell to set the target note instantly.
              </div>
            </div>
            <div className="hidden sm:block rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
              Showing frets <span className="font-semibold text-white">{startFret}</span>–
              <span className="font-semibold text-white">{endFret}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold text-slate-300">Queue</div>
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-white">1</span> = current ·{" "}
                <span className="font-semibold text-white">2+</span> = next
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {(queue.length ? queue : []).slice(0, 1 + Math.min(6, Math.max(0, queue.length - 1))).map((n, idx) => (
                <span
                  key={`${n.string}-${n.fret}-${idx}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                    idx === 0
                      ? "bg-indigo-500/20 text-indigo-100 ring-indigo-400/30"
                      : "bg-white/5 text-slate-200 ring-white/10"
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white/5 px-1 text-[11px] font-bold ring-1 ring-white/10">
                    {idx + 1}
                  </span>
                  {n.note}
                  {showPositions ? (
                    <span className="ml-2 text-[11px] font-medium text-slate-400">
                      S{n.string} F{n.fret}
                    </span>
                  ) : null}
                </span>
              ))}
              {!queue.length ? (
                <span className="text-xs text-slate-400">Press Start to generate a queue.</span>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <FretboardGrid
              startFret={startFret}
              maxFret={endFret}
              highlights={current ? [{ string: current.string, fret: current.fret }] : []}
              markers={queue.slice(0, 1 + Math.min(6, queue.length - 1)).map((n, idx) => ({
                string: n.string,
                fret: n.fret,
                label: `${idx + 1}`,
                variant: idx === 0 ? "current" : "next",
              }))}
              rootPitchClasses={rootPitchClass === null ? [] : [rootPitchClass]}
              scalePitchClasses={allowedPitchClasses ?? []}
              onCellClick={(stringNumber, fret) => {
                const note = getNoteAtPosition(stringNumber, fret);
                setQueue((prev) => {
                  const next = [{ string: stringNumber, fret, note }, ...prev.slice(1)];
                  return next.slice(0, queueSize);
                });
                speak(note);
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
