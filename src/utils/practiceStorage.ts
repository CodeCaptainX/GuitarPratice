export type ScaleType = "major" | "minor";
export type MinorType = "natural" | "harmonic" | "melodic";

export type PracticeSettings = {
  intervalMs: number;
  useKeyFilter: boolean;
  selectedKey: string;
  includeOctave: boolean;
  scaleType: ScaleType;
  minorType: MinorType;
  maxFret: number;
  useSound: boolean;
  useSpeech: boolean;
  volume: number;
  startOctave: number;
};

export const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
  intervalMs: 2000,
  useKeyFilter: false,
  selectedKey: "C",
  includeOctave: true,
  scaleType: "major",
  minorType: "natural",
  maxFret: 18,
  useSound: true,
  useSpeech: true,
  volume: 80,
  startOctave: 4,
};

export type RoutineFocus =
  | "notes"
  | "scales"
  | "chords"
  | "arpeggios"
  | "technique"
  | "custom";

export type PracticeRoutine = {
  id: string;
  name: string;
  minutes: number;
  focus: RoutineFocus;
  bpm?: number;
  notes?: string;
};

const SETTINGS_KEY = "guitarPractice:settings:v1";
const ROUTINES_KEY = "guitarPractice:routines:v1";
const ACTIVE_ROUTINE_KEY = "guitarPractice:activeRoutineId:v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
};

export function loadPracticeSettings(): PracticeSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_PRACTICE_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return DEFAULT_PRACTICE_SETTINGS;

    const scaleType =
      parsed.scaleType === "major" || parsed.scaleType === "minor"
        ? parsed.scaleType
        : DEFAULT_PRACTICE_SETTINGS.scaleType;

    const minorType =
      parsed.minorType === "natural" ||
      parsed.minorType === "harmonic" ||
      parsed.minorType === "melodic"
        ? parsed.minorType
        : DEFAULT_PRACTICE_SETTINGS.minorType;

    return {
      intervalMs: clampNumber(parsed.intervalMs, 250, 30_000, DEFAULT_PRACTICE_SETTINGS.intervalMs),
      useKeyFilter:
        typeof parsed.useKeyFilter === "boolean"
          ? parsed.useKeyFilter
          : DEFAULT_PRACTICE_SETTINGS.useKeyFilter,
      selectedKey:
        typeof parsed.selectedKey === "string" && parsed.selectedKey.length > 0
          ? parsed.selectedKey
          : DEFAULT_PRACTICE_SETTINGS.selectedKey,
      includeOctave:
        typeof parsed.includeOctave === "boolean"
          ? parsed.includeOctave
          : DEFAULT_PRACTICE_SETTINGS.includeOctave,
      scaleType,
      minorType,
      maxFret: clampNumber(parsed.maxFret, 0, 24, DEFAULT_PRACTICE_SETTINGS.maxFret),
      useSound:
        typeof parsed.useSound === "boolean"
          ? parsed.useSound
          : DEFAULT_PRACTICE_SETTINGS.useSound,
      useSpeech:
        typeof parsed.useSpeech === "boolean"
          ? parsed.useSpeech
          : DEFAULT_PRACTICE_SETTINGS.useSpeech,
      volume: clampNumber(parsed.volume, 0, 100, DEFAULT_PRACTICE_SETTINGS.volume),
      startOctave: clampNumber(
        parsed.startOctave,
        1,
        7,
        DEFAULT_PRACTICE_SETTINGS.startOctave
      ),
    };
  } catch {
    return DEFAULT_PRACTICE_SETTINGS;
  }
}

export function savePracticeSettings(settings: PracticeSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore (storage disabled)
  }
}

const makeId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function loadPracticeRoutines(): PracticeRoutine[] {
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is PracticeRoutine => isRecord(item))
      .map((item) => ({
        id: typeof item.id === "string" && item.id.length > 0 ? item.id : makeId(),
        name: typeof item.name === "string" && item.name.length > 0 ? item.name : "Untitled",
        minutes: clampNumber(item.minutes, 1, 240, 10),
        focus:
          item.focus === "notes" ||
          item.focus === "scales" ||
          item.focus === "chords" ||
          item.focus === "arpeggios" ||
          item.focus === "technique" ||
          item.focus === "custom"
            ? item.focus
            : "custom",
        bpm: item.bpm === undefined ? undefined : clampNumber(item.bpm, 30, 260, 120),
        notes: typeof item.notes === "string" ? item.notes : undefined,
      }));
  } catch {
    return [];
  }
}

export function savePracticeRoutines(routines: PracticeRoutine[]): void {
  try {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch {
    // ignore
  }
}

export function createRoutine(
  input: Omit<PracticeRoutine, "id"> & { id?: string }
): PracticeRoutine {
  return {
    id: input.id ?? makeId(),
    name: input.name,
    minutes: input.minutes,
    focus: input.focus,
    bpm: input.bpm,
    notes: input.notes,
  };
}

export function loadActiveRoutineId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ROUTINE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveRoutineId(id: string | null): void {
  try {
    if (!id) localStorage.removeItem(ACTIVE_ROUTINE_KEY);
    else localStorage.setItem(ACTIVE_ROUTINE_KEY, id);
  } catch {
    // ignore
  }
}

