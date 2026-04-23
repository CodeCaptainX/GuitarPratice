import { noteAt, noteIndex } from "../../utils/musicUtils";

type Highlight = {
  string: number;
  fret: number;
};

type Marker = {
  string: number;
  fret: number;
  label: string;
  variant?: "current" | "next";
};

const stringLabel: Record<number, string> = {
  1: "E",
  2: "B",
  3: "G",
  4: "D",
  5: "A",
  6: "E",
};

export default function FretboardGrid({
  startFret = 0,
  maxFret,
  highlights = [],
  markers = [],
  activePitchClasses = [],
  rootPitchClasses = [],
  scalePitchClasses = [],
  onCellClick,
}: {
  startFret?: number;
  maxFret: number;
  highlights?: Highlight[];
  markers?: Marker[];
  activePitchClasses?: number[];
  rootPitchClasses?: number[];
  scalePitchClasses?: number[];
  onCellClick?: (stringNumber: number, fret: number) => void;
}) {
  const endFret = Math.max(startFret, maxFret);
  const frets = Array.from({ length: endFret - startFret + 1 }, (_, i) => startFret + i);

  const isHighlighted = (stringNumber: number, fret: number) =>
    highlights.some((h) => h.string === stringNumber && h.fret === fret);

  const markerFor = (stringNumber: number, fret: number): Marker | null =>
    markers.find((m) => m.string === stringNumber && m.fret === fret) ?? null;

  return (
    <div className="overflow-auto rounded-2xl bg-slate-950/30 ring-1 ring-white/10">
      <div className="min-w-[820px]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `80px repeat(${frets.length}, minmax(44px, 1fr))` }}
        >
          <div className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
            String
          </div>
          {frets.map((fret) => (
            <div
              key={`fret-${fret}`}
              className="px-2 py-2 text-center text-[11px] font-semibold text-slate-400 ring-1 ring-white/10"
            >
              {fret}
            </div>
          ))}

          {Array.from({ length: 6 }, (_, row) => {
            // Standard visual order (top -> bottom): string 1 (high E) ... string 6 (low E)
            const stringNumber = row + 1;
            const label = stringLabel[stringNumber] ?? `${stringNumber}`;
            return (
              <div key={`row-${stringNumber}`} className="contents">
                <div className="sticky left-0 z-10 flex items-center justify-between gap-2 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
                  <span className="text-slate-300">String</span>
                  <span>{label}</span>
                </div>

                {frets.map((fret) => {
                  const note = noteAt(stringNumber, fret);
                  const notePitchClass = noteIndex(note) ?? -1;

                  const isRoot = rootPitchClasses.includes(notePitchClass);
                  const inScale = scalePitchClasses.includes(notePitchClass);
                  const current = isHighlighted(stringNumber, fret);
                  const isActive = activePitchClasses.includes(notePitchClass);
                  const marker = markerFor(stringNumber, fret);

                  const base =
                    "relative h-11 px-2 py-2 text-center text-xs ring-1 ring-white/10 transition-colors";
                  const bg = current
                    ? "bg-indigo-500/40"
                    : isActive
                      ? "bg-amber-500/20 hover:bg-amber-500/25"
                    : isRoot
                      ? "bg-emerald-500/20"
                      : inScale
                        ? "bg-white/5 hover:bg-white/10"
                        : "bg-transparent hover:bg-white/5";
                  const text = current
                    ? "text-white font-bold"
                    : isActive
                      ? "text-amber-100 font-semibold"
                    : isRoot
                      ? "text-emerald-200 font-semibold"
                      : inScale
                        ? "text-slate-100"
                        : "text-slate-400";

                  return (
                    <button
                      key={`cell-${stringNumber}-${fret}`}
                      type="button"
                      className={`${base} ${bg} ${text}`}
                      onClick={() => onCellClick?.(stringNumber, fret)}
                      title={`${note} (string ${stringNumber}, fret ${fret})`}
                    >
                      {marker ? (
                        <span
                          className={`absolute left-1 top-1 grid h-5 min-w-5 place-items-center rounded-md px-1 text-[11px] font-bold ring-1 ${
                            marker.variant === "current"
                              ? "bg-indigo-500 text-white ring-white/20"
                              : "bg-amber-500/20 text-amber-100 ring-amber-400/30"
                          }`}
                        >
                          {marker.label}
                        </span>
                      ) : null}
                      {note}
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
