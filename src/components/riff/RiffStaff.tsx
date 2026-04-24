import { useMemo } from "react";

import { noteAtWithOctave, noteIndex } from "../../utils/musicUtils";
import type { TabRiff } from "../../utils/tabRiff";
import { stepToBarBeat, totalSteps } from "../../utils/tabRiff";

type NotePoint = {
  step: number;
  isBarStart: boolean;
  isBeat: boolean;
  melody: { note: string; diatonic: number; accidental: boolean } | null;
  bass: { note: string; diatonic: number; accidental: boolean } | null;
};

const LETTER_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function parseNote(note: string): { letter: string; accidental: boolean; octave: number } | null {
  const trimmed = note.trim();
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(trimmed);
  if (!match) return null;
  const letter = match[1] ?? "";
  const accidental = (match[2] ?? "") !== "";
  const octave = Number(match[3]);
  if (!letter || !Number.isFinite(octave)) return null;
  return { letter, accidental, octave };
}

function noteToDiatonic(note: string): { diatonic: number; accidental: boolean } | null {
  const parsed = parseNote(note);
  if (!parsed) return null;
  const li = LETTER_INDEX[parsed.letter];
  if (typeof li !== "number") return null;
  return { diatonic: parsed.octave * 7 + li, accidental: parsed.accidental };
}

function midiFor(note: string): number | null {
  const parsed = parseNote(note);
  if (!parsed) return null;
  const pc = noteIndex(parsed.letter + (parsed.accidental ? "#" : ""));
  if (pc === null) return null;
  return (parsed.octave + 1) * 12 + pc;
}

function pickVoices(stepNotes: string[]): { melody: string | null; bass: string | null } {
  if (!stepNotes.length) return { melody: null, bass: null };
  const items = stepNotes
    .map((n) => ({ note: n, midi: midiFor(n) }))
    .filter((x): x is { note: string; midi: number } => typeof x.midi === "number");
  if (!items.length) return { melody: null, bass: null };
  items.sort((a, b) => a.midi - b.midi);
  const bass = items[0]?.note ?? null;
  const melody = items[items.length - 1]?.note ?? null;
  return { melody, bass };
}

export default function RiffStaff({
  riff,
  playheadStep,
  size = "md",
}: {
  riff: TabRiff;
  playheadStep: number | null;
  size?: "md" | "lg" | "xl";
}) {
  const steps = totalSteps(riff);
  const stepsPerBar = 4 * riff.stepsPerBeat;

  const points = useMemo<NotePoint[]>(() => {
    const out: NotePoint[] = [];
    for (let step = 0; step < steps; step++) {
      const stepNotes: string[] = [];
      for (let stringRow = 0; stringRow < 6; stringRow++) {
        const fret = riff.cells[stringRow]?.[step];
        if (typeof fret !== "number" || fret < 0) continue;
        const stringNumber = 6 - stringRow;
        stepNotes.push(noteAtWithOctave(stringNumber, fret));
      }

      const voices = pickVoices(stepNotes);
      const melodyInfo = voices.melody ? noteToDiatonic(voices.melody) : null;
      const bassInfo = voices.bass ? noteToDiatonic(voices.bass) : null;

      const melody = voices.melody && melodyInfo ? { note: voices.melody, ...melodyInfo } : null;
      const bass = voices.bass && bassInfo ? { note: voices.bass, ...bassInfo } : null;

      const info = stepToBarBeat(riff, step);
      out.push({
        step,
        isBarStart: step % stepsPerBar === 0,
        isBeat: info.sub === 0,
        melody,
        bass,
      });
    }
    return out;
  }, [riff, steps, stepsPerBar]);

  const cellW = size === "xl" ? 64 : size === "lg" ? 52 : 42;
  const leftPad = size === "xl" ? 86 : size === "lg" ? 74 : 64;
  const topPad = 18;
  const lineGap = size === "xl" ? 16 : size === "lg" ? 14 : 12; // distance between staff lines
  const diatonicStep = lineGap / 2; // line<->space

  // Treble staff reference: bottom line is E4, top line is F5.
  const bottomLineDiatonic = 4 * 7 + (LETTER_INDEX.E ?? 2); // E4
  const staffBottomY = topPad + 4 * lineGap;
  const staffTopY = topPad;

  const width = leftPad + Math.max(1, steps) * cellW + 10;
  const height = topPad + 4 * lineGap + 26;

  const yForDiatonic = (d: number) => staffBottomY - (d - bottomLineDiatonic) * diatonicStep;

  const ledgerLinesFor = (d: number) => {
    const y = yForDiatonic(d);
    const lines: number[] = [];
    if (y < staffTopY - diatonicStep) {
      // above: add lines every other diatonic step (line positions)
      for (let yy = staffTopY - lineGap; yy >= y - 1; yy -= lineGap) lines.push(yy);
    } else if (y > staffBottomY + diatonicStep) {
      // below
      for (let yy = staffBottomY + lineGap; yy <= y + 1; yy += lineGap) lines.push(yy);
    }
    return lines;
  };

  return (
    <div className="overflow-auto rounded-2xl bg-slate-950/30 ring-1 ring-white/10">
      <svg width={width} height={height} className="block">
        {/* Staff lines */}
        {Array.from({ length: 5 }, (_, i) => (
          <line
            key={`line-${i}`}
            x1={0}
            x2={width}
            y1={topPad + i * lineGap}
            y2={topPad + i * lineGap}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
          />
        ))}

        {/* Clef hint */}
        <text
          x={16}
          y={topPad + 3 * lineGap}
          fill="rgba(255,255,255,0.70)"
          fontSize={size === "xl" ? 28 : size === "lg" ? 24 : 22}
        >
          𝄞
        </text>
        <text
          x={16}
          y={topPad + 3 * lineGap + (size === "lg" ? 20 : 18)}
          fill="rgba(255,255,255,0.55)"
          fontSize={10}
        >
          (gtr)
        </text>

        {/* Bars / beats */}
        {points.map((p) => {
          const x = leftPad + p.step * cellW + cellW / 2;
          const isPlayhead = playheadStep === p.step;
          return (
            <g key={`col-${p.step}`}>
              {p.isBarStart ? (
                <line
                  x1={leftPad + p.step * cellW}
                  x2={leftPad + p.step * cellW}
                  y1={topPad - 2}
                  y2={staffBottomY + 12}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={2}
                />
              ) : p.isBeat ? (
                <line
                  x1={leftPad + p.step * cellW}
                  x2={leftPad + p.step * cellW}
                  y1={topPad - 1}
                  y2={staffBottomY + 8}
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={1}
                />
              ) : null}

              {isPlayhead ? (
                <rect
                  x={leftPad + p.step * cellW}
                  y={topPad - 6}
                  width={cellW}
                  height={staffBottomY - topPad + 22}
                  fill="rgba(99,102,241,0.22)"
                />
              ) : null}

              {/* Bass voice (lowest note) */}
              {p.bass ? (
                <g>
                  {ledgerLinesFor(p.bass.diatonic).map((yy, idx) => (
                    <line
                      key={`bass-ledger-${p.step}-${idx}`}
                      x1={x - 9}
                      x2={x + 9}
                      y1={yy}
                      y2={yy}
                      stroke="rgba(255,255,255,0.20)"
                      strokeWidth={1}
                    />
                  ))}
                  {p.bass.accidental ? (
                    <text x={x - 16} y={yForDiatonic(p.bass.diatonic) + 4} fill="rgba(255,255,255,0.75)" fontSize={12}>
                      #
                    </text>
                  ) : null}
                  <ellipse
                    cx={x}
                    cy={yForDiatonic(p.bass.diatonic)}
                    rx={6}
                    ry={4.2}
                    fill="rgba(16,185,129,0.95)"
                  />
                </g>
              ) : null}

              {/* Melody voice (highest note) */}
              {p.melody && (!p.bass || p.melody.note !== p.bass.note) ? (
                <g>
                  {ledgerLinesFor(p.melody.diatonic).map((yy, idx) => (
                    <line
                      key={`mel-ledger-${p.step}-${idx}`}
                      x1={x - 9}
                      x2={x + 9}
                      y1={yy}
                      y2={yy}
                      stroke="rgba(255,255,255,0.20)"
                      strokeWidth={1}
                    />
                  ))}
                  {p.melody.accidental ? (
                    <text x={x - 16} y={yForDiatonic(p.melody.diatonic) + 4} fill="rgba(255,255,255,0.75)" fontSize={12}>
                      #
                    </text>
                  ) : null}
                  <ellipse
                    cx={x}
                    cy={yForDiatonic(p.melody.diatonic)}
                    rx={6}
                    ry={4.2}
                    fill="rgba(255,255,255,0.92)"
                  />
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
