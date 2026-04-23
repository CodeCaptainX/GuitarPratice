import { useEffect, useMemo, useState } from "react";
import {
  createRoutine,
  DEFAULT_PRACTICE_SETTINGS,
  loadActiveRoutineId,
  loadPracticeRoutines,
  loadPracticeSettings,
  PracticeRoutine,
  PracticeSettings,
  saveActiveRoutineId,
  savePracticeRoutines,
  savePracticeSettings,
} from "../utils/practiceStorage";

const ALL_KEYS = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
];
const MINOR_TYPES = ["natural", "harmonic", "melodic"] as const;

const focusOptions: PracticeRoutine["focus"][] = [
  "notes",
  "scales",
  "chords",
  "arpeggios",
  "technique",
  "custom",
];

export default function ManagePage() {
  const [settings, setSettings] = useState<PracticeSettings>(DEFAULT_PRACTICE_SETTINGS);
  const [routines, setRoutines] = useState<PracticeRoutine[]>([]);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [newRoutine, setNewRoutine] = useState<Omit<PracticeRoutine, "id">>({
    name: "",
    minutes: 10,
    focus: "notes",
    bpm: 120,
    notes: "",
  });

  useEffect(() => {
    setSettings(loadPracticeSettings());
    setRoutines(loadPracticeRoutines());
    setActiveRoutineId(loadActiveRoutineId());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    savePracticeSettings(settings);
  }, [loaded, settings]);

  useEffect(() => {
    if (!loaded) return;
    savePracticeRoutines(routines);
  }, [loaded, routines]);

  useEffect(() => {
    if (!loaded) return;
    saveActiveRoutineId(activeRoutineId);
  }, [activeRoutineId, loaded]);

  const activeRoutine = useMemo(
    () => routines.find((r) => r.id === activeRoutineId) ?? null,
    [activeRoutineId, routines]
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Routines */}
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Routines</h2>
            <p className="mt-1 text-sm text-slate-300">
              Create a simple plan (minutes + focus). Pick one as active for your Practice timer.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
            Active:{" "}
            <span className="font-semibold text-white">
              {activeRoutine ? activeRoutine.name : "None"}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {routines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
              No routines yet. Add one below.
            </div>
          ) : null}

          {routines.map((routine) => {
            const isActive = routine.id === activeRoutineId;
            return (
              <div
                key={routine.id}
                className={`rounded-2xl p-4 ring-1 transition-colors ${
                  isActive ? "bg-indigo-500/10 ring-indigo-400/40" : "bg-white/5 ring-white/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-white">{routine.name}</div>
                      {isActive ? (
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {routine.minutes} min · {routine.focus}
                      {routine.bpm ? ` · ${routine.bpm} bpm` : ""}
                    </div>
                    {routine.notes ? (
                      <div className="mt-2 text-sm text-slate-300">{routine.notes}</div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRoutineId(isActive ? null : routine.id)}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition-colors ${
                        isActive
                          ? "bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10"
                          : "bg-indigo-500 text-white ring-white/10 hover:bg-indigo-400"
                      }`}
                    >
                      {isActive ? "Unset" : "Set active"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRoutines((prev) => prev.filter((r) => r.id !== routine.id));
                        if (routine.id === activeRoutineId) setActiveRoutineId(null);
                      }}
                      className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-white">Add routine</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="text-xs text-slate-300">Name</div>
              <input
                value={newRoutine.name}
                onChange={(e) => setNewRoutine((r) => ({ ...r, name: e.target.value }))}
                placeholder="e.g. Morning warmup"
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">Focus</div>
              <select
                value={newRoutine.focus}
                onChange={(e) =>
                  setNewRoutine((r) => ({ ...r, focus: e.target.value as PracticeRoutine["focus"] }))
                }
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                {focusOptions.map((focus) => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">Minutes</div>
              <input
                type="number"
                min={1}
                max={240}
                value={newRoutine.minutes}
                onChange={(e) =>
                  setNewRoutine((r) => ({ ...r, minutes: Number(e.target.value || 0) }))
                }
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </label>

            <label className="block">
              <div className="text-xs text-slate-300">BPM (optional)</div>
              <input
                type="number"
                min={30}
                max={260}
                value={newRoutine.bpm ?? ""}
                onChange={(e) =>
                  setNewRoutine((r) => ({
                    ...r,
                    bpm: e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </label>

            <label className="block sm:col-span-2">
              <div className="text-xs text-slate-300">Notes</div>
              <textarea
                value={newRoutine.notes ?? ""}
                onChange={(e) => setNewRoutine((r) => ({ ...r, notes: e.target.value }))}
                placeholder="What are you working on?"
                rows={3}
                className="mt-1 w-full resize-none rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const trimmedName = newRoutine.name.trim();
                if (!trimmedName) return;
                const routine = createRoutine({ ...newRoutine, name: trimmedName });
                setRoutines((prev) => [routine, ...prev]);
                setNewRoutine({ name: "", minutes: 10, focus: "notes", bpm: 120, notes: "" });
              }}
              className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-indigo-400"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() =>
                setNewRoutine({ name: "", minutes: 10, focus: "notes", bpm: 120, notes: "" })
              }
              className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Defaults */}
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="text-base font-semibold text-white">Default practice options</h2>
        <p className="mt-1 text-sm text-slate-300">
          These options auto-load in Practice. You can still tweak them while practicing.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="text-xs text-slate-300">Interval (ms)</div>
            <input
              type="number"
              min={250}
              max={30000}
              value={settings.intervalMs}
              onChange={(e) =>
                setSettings((s) => ({ ...s, intervalMs: Number(e.target.value || 0) }))
              }
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-300">Max fret</div>
            <input
              type="number"
              min={0}
              max={24}
              value={settings.maxFret}
              onChange={(e) => setSettings((s) => ({ ...s, maxFret: Number(e.target.value || 0) }))}
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div>
              <div className="text-sm font-semibold text-white">Key filter</div>
              <div className="text-xs text-slate-300">Limit random notes to the selected key.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.useKeyFilter}
              onChange={(e) => setSettings((s) => ({ ...s, useKeyFilter: e.target.checked }))}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-300">Key</div>
            <select
              value={settings.selectedKey}
              onChange={(e) => setSettings((s) => ({ ...s, selectedKey: e.target.value }))}
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              {ALL_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div>
              <div className="text-sm font-semibold text-white">Include octave</div>
              <div className="text-xs text-slate-300">Show octave numbers in scale display.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.includeOctave}
              onChange={(e) => setSettings((s) => ({ ...s, includeOctave: e.target.checked }))}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-300">Start octave</div>
            <input
              type="number"
              min={1}
              max={7}
              value={settings.startOctave}
              onChange={(e) =>
                setSettings((s) => ({ ...s, startOctave: Number(e.target.value || 0) }))
              }
              className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-300">Scale type</div>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, scaleType: "major" }))}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition-colors ${
                  settings.scaleType === "major"
                    ? "bg-indigo-500 text-white ring-white/10"
                    : "bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10"
                }`}
              >
                Major
              </button>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, scaleType: "minor" }))}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition-colors ${
                  settings.scaleType === "minor"
                    ? "bg-indigo-500 text-white ring-white/10"
                    : "bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10"
                }`}
              >
                Minor
              </button>
            </div>
          </label>

          <label className="block">
            <div className="text-xs text-slate-300">Minor type</div>
            <select
              value={settings.minorType}
              onChange={(e) =>
                setSettings((s) => ({ ...s, minorType: e.target.value as PracticeSettings["minorType"] }))
              }
              disabled={settings.scaleType !== "minor"}
              className={`mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
                settings.scaleType !== "minor" ? "opacity-60" : ""
              }`}
            >
              {MINOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-slate-300">Volume</div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => setSettings((s) => ({ ...s, volume: Number(e.target.value || 0) }))}
              className="mt-3 w-full accent-indigo-500"
            />
            <div className="mt-1 text-xs text-slate-400">{settings.volume}%</div>
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div>
              <div className="text-sm font-semibold text-white">Speech</div>
              <div className="text-xs text-slate-300">Speak the note name.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.useSpeech}
              onChange={(e) => setSettings((s) => ({ ...s, useSpeech: e.target.checked }))}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div>
              <div className="text-sm font-semibold text-white">Sound</div>
              <div className="text-xs text-slate-300">Enable sound effects.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.useSound}
              onChange={(e) => setSettings((s) => ({ ...s, useSound: e.target.checked }))}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSettings(DEFAULT_PRACTICE_SETTINGS)}
            className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Reset defaults
          </button>
        </div>
      </section>
    </div>
  );
}
