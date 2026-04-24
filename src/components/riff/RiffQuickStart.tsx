import { useMemo, useState } from "react";

import { ALL_KEYS } from "../../utils/musicUtils";
import {
  applyRiffPreset,
  RIFF_PRESETS,
  type GenerateRiffPresetOptions,
  type RiffPresetId,
} from "../../utils/riffPresets";
import type { TabRiff } from "../../utils/tabRiff";

export default function RiffQuickStart({
  riff,
  maxFret,
  onApply,
  onClear,
}: {
  riff: TabRiff;
  maxFret: number;
  onApply: (next: TabRiff) => void;
  onClear: () => void;
}) {
  const [preset, setPreset] = useState<RiffPresetId>("lead_pentatonic");
  const [key, setKey] = useState<string>("A");
  const [positionFret, setPositionFret] = useState<number>(5);
  const [density, setDensity] = useState<number>(70);
  const [seed, setSeed] = useState<number>(() => Date.now());

  const presetInfo = useMemo(
    () => RIFF_PRESETS.find((p) => p.id === preset) ?? RIFF_PRESETS[0],
    [preset]
  );

  const options: GenerateRiffPresetOptions = useMemo(
    () => ({
      preset,
      key,
      positionFret,
      maxFret,
      density,
      seed,
    }),
    [density, key, maxFret, positionFret, preset, seed]
  );

  return (
    <div className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Quick start</div>
          <div className="mt-1 text-sm text-slate-300">Generate a riff, then tweak it in the TAB grid.</div>
          <div className="mt-2 text-xs text-slate-400">
            Shortcuts: arrows = move · type numbers = fret ·{" "}
            <span className="font-semibold text-slate-200">x</span> = mute ·{" "}
            <span className="font-semibold text-slate-200">backspace</span> = clear ·{" "}
            <span className="font-semibold text-slate-200">space</span> = play/stop
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSeed(Date.now())}
          className="shrink-0 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
          title="New variation"
        >
          Re-roll
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <div className="text-xs text-slate-300">Preset</div>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as RiffPresetId)}
            className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          >
            {RIFF_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-slate-400">{presetInfo?.description}</div>
        </label>

        <label className="block">
          <div className="text-xs text-slate-300">Key</div>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          >
            {ALL_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-xs text-slate-300">Position</div>
          <input
            type="range"
            min={0}
            max={Math.max(0, Math.min(24, maxFret))}
            value={Math.max(0, Math.min(24, positionFret))}
            onChange={(e) => setPositionFret(Number(e.target.value))}
            className="mt-3 w-full accent-indigo-500"
          />
          <div className="mt-1 text-xs text-slate-400">Around fret {positionFret}</div>
        </label>

        <label className="block">
          <div className="text-xs text-slate-300">Density</div>
          <input
            type="range"
            min={10}
            max={100}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="mt-3 w-full accent-indigo-500"
          />
          <div className="mt-1 text-xs text-slate-400">{density}%</div>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onApply(applyRiffPreset(riff, options))}
          className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-indigo-400"
        >
          Generate riff
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
        >
          Clear all
        </button>

        <div className="ml-auto rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
          Seed: {seed}
        </div>
      </div>
    </div>
  );
}

