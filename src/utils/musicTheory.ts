// utils/musicTheory.ts

// Standard tuning for a 6-string guitar (from 6th/lowest string to 1st/highest string)
// const STANDARD_TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"];

// Map of all notes with enharmonic equivalents
const NOTE_NAMES: Record<number, string[]> = {
  0: ["C"],
  1: ["C#", "Db"],
  2: ["D"],
  3: ["D#", "Eb"],
  4: ["E"],
  5: ["F"],
  6: ["F#", "Gb"],
  7: ["G"],
  8: ["G#", "Ab"],
  9: ["A"],
  10: ["A#", "Bb"],
  11: ["B"],
};

// Note index lookup table
const NOTE_INDEXES: Record<string, number> = {
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

/**
 * Gets the note at a specific string and fret position
 * @param stringNumber - The string number (1-6, where 1 is the highest E string)
 * @param fretNumber - The fret number (0-24)
 * @returns The note name with octave
 */
// export function getNoteAtPosition(
//   stringNumber: number,
//   fretNumber: number
// ): string {
//   // Convert from UI string number (1-6) to array index (0-5)
//   // In the UI, string 1 is the highest string (E4), string 6 is the lowest (E2)
//   const stringIndex = 6 - stringNumber;

//   if (stringIndex < 0 || stringIndex >= STANDARD_TUNING.length) {
//     return "Invalid string";
//   }

//   const openStringNote = STANDARD_TUNING[stringIndex];

//   // Extract the base note and octave from the open string
//   const baseNote = openStringNote.slice(0, -1);
//   const octave = parseInt(openStringNote.slice(-1));

//   // Find the open string note index
//   let noteIndex = -1;
//   for (let i = 0; i < 12; i++) {
//     if (NOTE_NAMES[i].includes(baseNote)) {
//       noteIndex = i;
//       break;
//     }
//   }

//   if (noteIndex === -1) {
//     return "Invalid note";
//   }

//   // Calculate the new note index and octave after applying the fret number
//   const newNoteIndex = (noteIndex + fretNumber) % 12;
//   const octaveOffset = Math.floor((noteIndex + fretNumber) / 12);
//   const newOctave = octave + octaveOffset;

//   // Use the first representation of the note (usually sharps rather than flats)
//   const newNoteName = NOTE_NAMES[newNoteIndex][0];

//   return `${newNoteName}${newOctave}`;
// }

export const getNoteAtPosition = (string: number, fret: number): string => {
  // Standard tuning of guitar strings (from 6th to 1st)
  const openStringNotes: string[] = ["E", "A", "D", "G", "B", "E"];
  const allNotes: string[] = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  // Convert string number to array index (string 6 = index 0)
  const stringIndex = 6 - string;

  // Get the open note for this string
  const openNote = openStringNotes[stringIndex];

  // Find where the open note is in our notes array
  const openNoteIndex = allNotes.indexOf(openNote);

  // Calculate which note this fret position represents
  const noteIndex = (openNoteIndex + fret) % 12;

  return allNotes[noteIndex];
};

/**
 * Generates frequencies for musical notes
 * @param noteName - Note name with octave (e.g., 'A4')
 * @returns Frequency in Hz
 */
export function getNoteFrequency(noteName: string): number {
  // Extract note and octave
  const note = noteName.slice(0, -1);
  const octave = parseInt(noteName.slice(-1));

  // A4 = 440Hz is the reference
  const A4 = 440;

  // Find semitone distance from A4
  let noteIndex = -1;
  for (let i = 0; i < 12; i++) {
    if (NOTE_NAMES[i].includes(note)) {
      noteIndex = i;
      break;
    }
  }

  if (noteIndex === -1) {
    console.error(`Invalid note: ${note}`);
    return 0;
  }

  // Calculate semitone distance
  // A is at index 9, so calculate distance from there
  let semitonesFromA = noteIndex - 9;

  // Adjust for octave (each octave is 12 semitones)
  const octavesFromA4 = octave - 4;
  semitonesFromA += octavesFromA4 * 12;

  // Calculate frequency: f = 440 * 2^(n/12)
  // where n is the number of semitones from A4
  const frequency = A4 * Math.pow(2, semitonesFromA / 12);

  return Math.round(frequency * 100) / 100; // Round to 2 decimal places
}

/**
 * Generates a major scale based on a given key
 * @param key - The root note of the scale (e.g., 'C', 'F#', 'Bb')
 * @param includeOctave - Whether to include octave numbers in returned notes
 * @param octaveStart - Starting octave number if includeOctave is true
 * @returns Array of notes in the major scale
 */
export function generateMajorScale(
  key: string,
  includeOctave: boolean = false,
  octaveStart: number = 4
): string[] {
  // Sanitize the key input by removing any octave number and using first representation
  const sanitizedKey = key.replace(/[0-9]/g, "");

  // Get the root note index
  const rootIndex = NOTE_INDEXES[sanitizedKey];
  if (rootIndex === undefined) {
    console.error(`Invalid key: ${key}`);
    return [];
  }

  // Major scale follows the pattern of whole and half steps: W-W-H-W-W-W-H
  // Which translates to semitone intervals of: 2-2-1-2-2-2-1
  const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];

  // Generate the scale
  const scale: string[] = [];
  let currentOctave = octaveStart;

  for (let i = 0; i < 8; i++) {
    // Include the octave (8 notes total)
    // Calculate the note index (0-11)
    const interval = i === 7 ? 12 : majorScaleIntervals[i]; // For the 8th note (octave)
    const noteIndex = (rootIndex + interval) % 12;

    // Increment octave if we wrap around past B
    if (i > 0 && interval === 0) {
      currentOctave++;
    }

    // Get the note name (use the first representation, usually the sharp version)
    let noteName = NOTE_NAMES[noteIndex][0];

    // Prefer flats if the root note is flat
    if (sanitizedKey.includes("b") && NOTE_NAMES[noteIndex].length > 1) {
      noteName = NOTE_NAMES[noteIndex][1] || NOTE_NAMES[noteIndex][0];
    }

    // Add octave number if requested
    if (includeOctave) {
      // If we've gone past B to C, we're in the next octave
      const noteOctave =
        rootIndex + interval >= 12 ? currentOctave + 1 : currentOctave;
      scale.push(`${noteName}${noteOctave}`);
    } else {
      scale.push(noteName);
    }

    // Don't add the 8th note (octave) twice
    if (i === 7) break;
  }

  return scale;
}

/**
 * Generates a minor scale based on a given key
 * @param key - The root note of the scale (e.g., 'A', 'E', 'G#')
 * @param type - The type of minor scale ('natural', 'harmonic', or 'melodic')
 * @param includeOctave - Whether to include octave numbers in returned notes
 * @param octaveStart - Starting octave number if includeOctave is true
 * @returns Array of notes in the minor scale
 */
export function generateMinorScale(
  key: string,
  type: string,
  includeOctave: boolean = false,
  octaveStart: number = 4
): string[] {
  // Sanitize the key input
  const sanitizedKey = key.replace(/[0-9]/g, "");

  // Get the root note index
  const rootIndex = NOTE_INDEXES[sanitizedKey];
  if (rootIndex === undefined) {
    console.error(`Invalid key: ${key}`);
    return [];
  }

  // Scale interval patterns (semitones from root)
  // Natural minor: W-H-W-W-H-W-W (2-1-2-2-1-2-2)
  // Harmonic minor: W-H-W-W-H-WH-H (2-1-2-2-1-3-1)
  // Melodic minor ascending: W-H-W-W-W-W-H (2-1-2-2-2-2-1)
  let scaleIntervals: number[];

  switch (type) {
    case "natural":
      scaleIntervals = [0, 2, 3, 5, 7, 8, 10];
      break;
    case "harmonic":
      scaleIntervals = [0, 2, 3, 5, 7, 8, 11];
      break;
    case "melodic":
      scaleIntervals = [0, 2, 3, 5, 7, 9, 11];
      break;
    default:
      scaleIntervals = [0, 2, 3, 5, 7, 8, 10]; // Default to natural minor
  }

  // Generate the scale
  const scale: string[] = [];
  let currentOctave = octaveStart;

  for (let i = 0; i < 8; i++) {
    // Include the octave (8 notes total)
    // Calculate the note index (0-11)
    const interval = i === 7 ? 12 : scaleIntervals[i]; // For the 8th note (octave)
    const noteIndex = (rootIndex + interval) % 12;

    // Increment octave if we wrap around past the root note
    if (i > 0 && interval === 0) {
      currentOctave++;
    }

    // Get the note name (use the first representation, usually the sharp version)
    let noteName = NOTE_NAMES[noteIndex][0];

    // Prefer flats if the root note is flat
    if (sanitizedKey.includes("b") && NOTE_NAMES[noteIndex].length > 1) {
      noteName = NOTE_NAMES[noteIndex][1] || NOTE_NAMES[noteIndex][0];
    }

    // Add octave number if requested
    if (includeOctave) {
      // If we've gone past B to C, we're in the next octave
      const noteOctave =
        rootIndex + interval >= 12 ? currentOctave + 1 : currentOctave;
      scale.push(`${noteName}${noteOctave}`);
    } else {
      scale.push(noteName);
    }

    // Don't add the 8th note (octave) twice
    if (i === 7) break;
  }

  return scale;
}

/**
 * Creates a tone generator for playing notes
 * @returns Object with methods to play and stop tones
 */
export function createToneGenerator() {
  // Check if Web Audio API is supported
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    console.error("Web Audio API is not supported in this browser");

    // Return dummy object with no-op methods
    return {
      playTone: (_frequency: number, _duration: number = 1000) => {},
      stopTone: () => {},
      setVolume: (_volume: number) => {},
    };
  }

  // Create audio context
  const AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();

  // Create nodes
  let oscillator: OscillatorNode | null = null;
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);

  // Set default volume
  gainNode.gain.value = 0.5;

  return {
    /**
     * Play a tone at the specified frequency
     * @param frequency - Frequency in Hz
     * @param duration - Duration in milliseconds (optional)
     */
    playTone(frequency: number, duration: number = 1000) {
      // Stop any existing tone
      this.stopTone();

      // Create and configure oscillator
      oscillator = audioContext.createOscillator();
      oscillator.type = "sine"; // sine, square, sawtooth, triangle
      oscillator.frequency.value = frequency;

      // Apply subtle attack and release for a more pleasant sound
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gainNode.gain.value, now + 0.02);

      // Connect and start
      oscillator.connect(gainNode);
      oscillator.start();

      // Stop after duration if specified
      if (duration > 0) {
        // Apply release curve
        gainNode.gain.setValueAtTime(
          gainNode.gain.value,
          now + duration / 1000 - 0.05
        );
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

        // Schedule oscillator stop
        oscillator.stop(now + duration / 1000);
        oscillator = null;
      }
    },

    /**
     * Stop the currently playing tone
     */
    stopTone() {
      if (oscillator) {
        // Apply quick release to avoid clicks
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.05);

        // Schedule stop
        oscillator.stop(now + 0.06);
        oscillator = null;
      }
    },

    /**
     * Set the volume level
     * @param volume - Volume level (0-1)
     */
    setVolume(volume: number) {
      // Make sure volume is between 0 and 1
      const safeVolume = Math.max(0, Math.min(1, volume));
      gainNode.gain.value = safeVolume;
    },
  };
}
