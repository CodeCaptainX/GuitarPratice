export type ScaleFamily =
  | "major"
  | "natural_minor"
  | "major_pentatonic"
  | "minor_pentatonic"
  | "blues";

export type ChordQuality = "maj" | "min" | "7" | "dim";

const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export const ALL_KEYS = [
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
] as const;

export function keyRoot(key: string): string {
  return key.split("/")[0].trim();
}

export function noteIndex(note: string): number | null {
  const cleaned = note.trim().replace(/[0-9]/g, "");
  const value = NOTE_INDEX[cleaned];
  return typeof value === "number" ? value : null;
}

export function noteNameFromIndex(index: number): string {
  const safe = ((index % 12) + 12) % 12;
  return NOTE_NAMES_SHARP[safe];
}

export function scalePitchClasses(root: string, family: ScaleFamily): number[] {
  const rootIndex = noteIndex(root);
  if (rootIndex === null) return [];

  const intervals =
    family === "major"
      ? [0, 2, 4, 5, 7, 9, 11]
      : family === "natural_minor"
        ? [0, 2, 3, 5, 7, 8, 10]
        : family === "major_pentatonic"
          ? [0, 2, 4, 7, 9]
          : family === "minor_pentatonic"
            ? [0, 3, 5, 7, 10]
            : [0, 3, 5, 6, 7, 10]; // blues (minor blues)

  return intervals.map((semitones) => (rootIndex + semitones) % 12);
}

export function scaleNoteNames(root: string, family: ScaleFamily): string[] {
  return scalePitchClasses(root, family).map(noteNameFromIndex);
}

export function chordPitchClasses(root: string, quality: ChordQuality): number[] {
  const rootIndex = noteIndex(root);
  if (rootIndex === null) return [];
  const intervals =
    quality === "maj"
      ? [0, 4, 7]
      : quality === "min"
        ? [0, 3, 7]
        : quality === "dim"
          ? [0, 3, 6]
          : [0, 4, 7, 10];
  return intervals.map((semitones) => (rootIndex + semitones) % 12);
}

export function chordNoteNames(root: string, quality: ChordQuality): string[] {
  return chordPitchClasses(root, quality).map(noteNameFromIndex);
}

export type DiatonicMode = "major" | "natural_minor";
export type DiatonicTriad = {
  degree: number; // 1..7
  root: string;
  quality: ChordQuality;
};

export function diatonicTriads(key: string, mode: DiatonicMode): DiatonicTriad[] {
  const pcs = scalePitchClasses(key, mode === "major" ? "major" : "natural_minor");
  if (pcs.length < 7) return [];
  const degreeRoots = pcs.slice(0, 7).map(noteNameFromIndex);
  const qualitiesMajor: ChordQuality[] = ["maj", "min", "min", "maj", "maj", "min", "dim"];
  const qualitiesMinor: ChordQuality[] = ["min", "dim", "maj", "min", "min", "maj", "maj"];
  const qualities = mode === "major" ? qualitiesMajor : qualitiesMinor;
  return degreeRoots.map((root, idx) => ({
    degree: idx + 1,
    root,
    quality: qualities[idx] ?? "maj",
  }));
}

export const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"] as const; // strings 6..1

const STANDARD_TUNING_WITH_OCTAVE = ["E2", "A2", "D3", "G3", "B3", "E4"] as const; // strings 6..1

export function noteAt(stringNumber: number, fret: number): string {
  const stringIndex = 6 - stringNumber;
  const open = STANDARD_TUNING[stringIndex];
  const openIndex = noteIndex(open);
  if (openIndex === null) return "C";
  return noteNameFromIndex(openIndex + fret);
}

export function noteAtWithOctave(stringNumber: number, fret: number): string {
  const stringIndex = 6 - stringNumber;
  const open = STANDARD_TUNING_WITH_OCTAVE[stringIndex] ?? "E4";
  const openNote = open.slice(0, -1);
  const openOctave = Number(open.slice(-1));
  const openIdx = noteIndex(openNote);
  if (openIdx === null || !Number.isFinite(openOctave)) return "C4";
  const semis = openIdx + fret;
  const pc = ((semis % 12) + 12) % 12;
  const octave = openOctave + Math.floor(semis / 12);
  return `${noteNameFromIndex(pc)}${octave}`;
}

export function fitsPitchClass(note: string, allowed: number[]): boolean {
  const idx = noteIndex(note);
  return idx === null ? false : allowed.includes(idx);
}

export function rootFretForKeyOnString(root: string, stringNumber: number): number | null {
  const rootIdx = noteIndex(root);
  if (rootIdx === null) return null;
  const stringIndex = 6 - stringNumber;
  const open = STANDARD_TUNING[stringIndex];
  const openIdx = noteIndex(open);
  if (openIdx === null) return null;
  return (rootIdx - openIdx + 12) % 12;
}
