// types.ts - TypeScript type definitions for the CAGED Explorer app

// Note position on fretboard
export interface NotePosition {
  string: number; // Guitar string number (1-6, where 1 is high E)
  fret: number; // Fret position (0-12+)
}

// Position data for CAGED shapes
export interface PositionData {
  rootPositions: NotePosition[];
  description: string;
}

// Game state types
export type GameStateType = "intro" | "playing" | "summary";

// Key selector component props
export interface KeySelectorProps {
  selectedKey: string;
  onKeyChange: (key: string) => void;
}

// Fretboard component props
export interface FretboardProps {
  currentTarget: NotePosition | null;
  onNotePlayed: (string: number, fret: number) => void;
}

// Position display component props
export interface PositionDisplayProps {
  currentShape: string;
  selectedKey: string;
  description?: string;
}

// Score panel component props
export interface ScorePanelProps {
  score: number;
  timer: number;
  streakCount: number;
  feedback: string;
}

// Game controls component props
export interface GameControlsProps {
  onEndGame: () => void;
}
