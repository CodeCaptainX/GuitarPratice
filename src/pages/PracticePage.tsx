import { useEffect, useMemo, useState } from "react";

import ChordTrainer from "../components/practice/ChordTrainer";
import NoteTrainer from "../components/practice/NoteTrainer";
import ScaleTrainer from "../components/practice/ScaleTrainer";
import SegmentedTabs from "../components/practice/SegmentedTabs";
import {
  loadActiveRoutineId,
  loadPracticeRoutines,
  PracticeRoutine,
} from "../utils/practiceStorage";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

type TabId = "notes" | "scales" | "chords";

export default function PracticePage() {
  const [tab, setTab] = useState<TabId>("notes");

  const [routines, setRoutines] = useState<PracticeRoutine[]>([]);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    setRoutines(loadPracticeRoutines());
    setActiveRoutineId(loadActiveRoutineId());
  }, []);

  const activeRoutine = useMemo(
    () => routines.find((r) => r.id === activeRoutineId) ?? null,
    [activeRoutineId, routines]
  );

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((s) => (s ? s - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-slate-300">Session</div>
            <div className="mt-1 text-base font-semibold text-white">
              {activeRoutine ? activeRoutine.name : "No active routine"}
            </div>
            <div className="mt-1 text-sm text-slate-300">
              {activeRoutine ? `${activeRoutine.minutes} min · ${activeRoutine.focus}` : "Set one in Manage"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!activeRoutine) return;
                setSecondsLeft(activeRoutine.minutes * 60);
              }}
              className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-indigo-400 disabled:opacity-50"
              disabled={!activeRoutine}
            >
              Start timer
            </button>
            <button
              type="button"
              onClick={() => setSecondsLeft(null)}
              className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              Stop
            </button>
            <div className="ml-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
              {secondsLeft === null ? "—" : formatTime(Math.max(0, secondsLeft))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <SegmentedTabs
          tabs={[
            { id: "notes", label: "Notes" },
            { id: "scales", label: "Scales" },
            { id: "chords", label: "Chords" },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as TabId)}
        />
      </div>

      {tab === "notes" ? <NoteTrainer /> : null}
      {tab === "scales" ? <ScaleTrainer /> : null}
      {tab === "chords" ? <ChordTrainer /> : null}
    </div>
  );
}

