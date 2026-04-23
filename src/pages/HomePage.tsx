import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadActiveRoutineId,
  loadPracticeRoutines,
  loadPracticeSettings,
  PracticeRoutine,
  PracticeSettings,
} from "../utils/practiceStorage";

const Card = ({
  title,
  description,
  to,
  badge,
}: {
  title: string;
  description: string;
  to: string;
  badge?: string;
}) => (
  <Link
    to={to}
    className="group block rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/15"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-base font-semibold text-white">{title}</div>
        <div className="mt-1 text-sm text-slate-300">{description}</div>
      </div>
      {badge ? (
        <span className="shrink-0 rounded-full bg-indigo-500/15 px-2 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/20">
          {badge}
        </span>
      ) : null}
    </div>
    <div className="mt-4 text-sm font-semibold text-indigo-200 group-hover:text-indigo-100">
      Open →
    </div>
  </Link>
);

export default function HomePage() {
  const [settings, setSettings] = useState<PracticeSettings | null>(null);
  const [routines, setRoutines] = useState<PracticeRoutine[]>([]);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadPracticeSettings());
    setRoutines(loadPracticeRoutines());
    setActiveRoutineId(loadActiveRoutineId());
  }, []);

  const activeRoutine = useMemo(
    () => routines.find((r) => r.id === activeRoutineId) ?? null,
    [activeRoutineId, routines]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-white/5 p-6 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
              <span>🎯</span>
              <span>Practice focus</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
              Train your fretboard, faster
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Use <span className="font-semibold text-white">Manage</span> to set defaults and routines,
              then jump into <span className="font-semibold text-white">Practice</span>.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-xs text-slate-300">Active routine</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {activeRoutine ? activeRoutine.name : "None"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {activeRoutine ? `${activeRoutine.minutes} min · ${activeRoutine.focus}` : "Create one in Manage"}
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to="/practice"
                className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-indigo-400"
              >
                Start Practice
              </Link>
              <Link
                to="/manage"
                className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          title="Practice"
          description="Random notes trainer with key filter and scale display."
          to="/practice"
          badge="Trainer"
        />
        <Card
          title="Manage"
          description="Create routines and set default options (saved automatically)."
          to="/manage"
          badge="Control"
        />
        <Card
          title="Fretboard"
          description="Interactive fretboard with chord buttons."
          to="/fretboard"
          badge="Visual"
        />
        <Card
          title="About"
          description="Tips + recommended workflow."
          to="/about"
        />
      </section>

      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold text-white">Current defaults</div>
            <div className="mt-1 text-sm text-slate-300">
              These load into Practice automatically.
            </div>
          </div>
          <Link
            to="/manage"
            className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Edit
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
            <div className="text-xs text-slate-400">Key</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {settings ? settings.selectedKey : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {settings?.useKeyFilter ? "Filtered" : "All notes"}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
            <div className="text-xs text-slate-400">Interval</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {settings ? `${settings.intervalMs} ms` : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-400">Random note cadence</div>
          </div>
          <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
            <div className="text-xs text-slate-400">Max fret</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {settings ? settings.maxFret : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-400">Training range</div>
          </div>
        </div>
      </section>
    </div>
  );
}

