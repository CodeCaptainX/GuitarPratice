export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="text-base font-semibold text-white">What is this?</h2>
        <p className="mt-2 text-sm text-slate-300">
          A lightweight guitar practice companion: random-note trainer, key filtering, scale
          display, simple routines, and an interactive fretboard.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-white">Suggested workflow</div>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <span className="font-semibold text-white">1.</span> Create a routine in{" "}
              <span className="font-semibold text-white">Manage</span>.
            </li>
            <li>
              <span className="font-semibold text-white">2.</span> Set your default key, max fret,
              and interval.
            </li>
            <li>
              <span className="font-semibold text-white">3.</span> Hit{" "}
              <span className="font-semibold text-white">Practice</span> and start the timer.
            </li>
          </ol>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-white">Notes</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              Defaults persist in your browser using <span className="font-semibold text-white">localStorage</span>.
            </li>
            <li>
              The Practice screen can speak note names using{" "}
              <span className="font-semibold text-white">Speech Synthesis</span> (browser support varies).
            </li>
            <li>
              Fretboard audio uses <span className="font-semibold text-white">Tone.js</span>.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

