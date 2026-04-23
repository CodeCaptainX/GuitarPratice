import GuitarFretboardPixi from "../components/GuitarFretboardPixi";

export default function FretboardPage() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="text-base font-semibold text-white">Interactive fretboard</h2>
        <p className="mt-1 text-sm text-slate-300">
          Click a fret position to hear the note. Use the chord buttons to compare shapes.
        </p>
      </div>

      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="overflow-auto">
          <div className="min-w-[860px]">
            <GuitarFretboardPixi width={860} height={380} />
          </div>
        </div>
      </div>
    </div>
  );
}

