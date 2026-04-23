import { useEffect, useMemo, useRef } from "react";
import type { TabRiff } from "../../utils/tabRiff";
import { stepToBarBeat, totalSteps } from "../../utils/tabRiff";

const stringLabels: Record<number, string> = { 6: "E", 5: "A", 4: "D", 3: "G", 2: "B", 1: "E" };

export type SelectedCell = { stringRow: number; stepIndex: number } | null; // stringRow 0..5 (6..1)

export default function TabGrid({
  riff,
  selected,
  onSelect,
  playheadStep,
}: {
  riff: TabRiff;
  selected: SelectedCell;
  onSelect: (cell: SelectedCell) => void;
  playheadStep: number | null;
}) {
  const steps = totalSteps(riff);
  const stepsPerBar = 4 * riff.stepsPerBeat;

  const gridRef = useRef<HTMLDivElement | null>(null);

  const columns = useMemo(() => Array.from({ length: steps }, (_, i) => i), [steps]);

  useEffect(() => {
    if (playheadStep === null) return;
    const el = gridRef.current?.querySelector(`[data-step='${playheadStep}']`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "nearest", inline: "center" });
  }, [playheadStep]);

  return (
    <div className="overflow-auto rounded-2xl bg-slate-950/30 ring-1 ring-white/10">
      <div className="min-w-[980px]">
        <div
          ref={gridRef}
          className="grid"
          style={{
            gridTemplateColumns: `76px repeat(${columns.length}, minmax(34px, 1fr))`,
          }}
        >
          {/* Header left */}
          <div className="sticky left-0 z-20 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
            TAB
          </div>

          {/* Header columns */}
          {columns.map((step) => {
            const { bar, beat, sub } = stepToBarBeat(riff, step);
            const isBeat = sub === 0;
            const isBarStart = step % stepsPerBar === 0;
            const isPlayhead = playheadStep === step;
            return (
              <div
                key={`h-${step}`}
                data-step={step}
                className={`px-1 py-2 text-center text-[10px] font-semibold ring-1 ring-white/10 ${
                  isPlayhead ? "bg-indigo-500/20 text-indigo-100" : "text-slate-400"
                } ${isBeat ? "bg-white/5" : ""} ${isBarStart ? "shadow-[inset_2px_0_0_rgba(255,255,255,0.12)]" : ""}`}
                title={`Bar ${bar}, Beat ${beat}${riff.stepsPerBeat > 1 ? ` (sub ${sub + 1})` : ""}`}
              >
                {isBeat ? beat : "·"}
              </div>
            );
          })}

          {/* Rows 6..1 */}
          {Array.from({ length: 6 }, (_, row) => {
            const stringNumber = 6 - row;
            const label = stringLabels[stringNumber] ?? `${stringNumber}`;
            return (
              <div key={`row-${row}`} className="contents">
                <div className="sticky left-0 z-10 flex items-center justify-between gap-2 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
                  <span className="text-slate-300">String</span>
                  <span>{label}</span>
                </div>

                {columns.map((step) => {
                  const val = riff.cells[row]?.[step];
                  const isSelected = selected?.stringRow === row && selected.stepIndex === step;
                  const isPlayhead = playheadStep === step;
                  const isBeat = stepToBarBeat(riff, step).sub === 0;
                  const isBarStart = step % stepsPerBar === 0;

                  const base =
                    "relative h-10 px-1 py-2 text-center text-xs ring-1 ring-white/10 transition-colors";
                  const bg = isSelected
                    ? "bg-indigo-500/25"
                    : isPlayhead
                      ? "bg-white/10"
                      : isBeat
                        ? "bg-white/5 hover:bg-white/10"
                        : "bg-transparent hover:bg-white/5";
                  const text =
                    typeof val === "number" ? "text-white font-semibold" : "text-slate-500";
                  const barBorder = isBarStart ? "shadow-[inset_2px_0_0_rgba(255,255,255,0.12)]" : "";

                  return (
                    <button
                      key={`c-${row}-${step}`}
                      type="button"
                      onClick={() => onSelect({ stringRow: row, stepIndex: step })}
                      className={`${base} ${bg} ${text} ${barBorder}`}
                      title={`String ${stringNumber} @ step ${step + 1}`}
                    >
                      {typeof val === "number" ? val : "—"}
                      {isSelected ? (
                        <span className="absolute inset-0 ring-2 ring-indigo-400/60 rounded-none" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

