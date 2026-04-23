type Tab = {
  id: string;
  label: string;
  description?: string;
};

export default function SegmentedTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-semibold text-white">Practice</div>
        <div className="mt-1 text-sm text-slate-300">
          Notes, scales, and chord drills in one place.
        </div>
      </div>

      <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition-colors ${
                isActive
                  ? "bg-indigo-500 text-white ring-white/10"
                  : "bg-white/0 text-slate-200 ring-white/0 hover:bg-white/5 hover:ring-white/10"
              }`}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

