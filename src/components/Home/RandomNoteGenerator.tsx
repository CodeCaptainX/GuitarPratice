// RandomNoteGenerator.tsx
import React, { useState, useEffect, useRef } from "react";
import { getNoteAtPosition } from "../../utils/musicTheory";
import ScaleGenerator from "./ScaleGenerator";
import KeyFilterControls from "./KeyFilterControls";
import {
  loadPracticeSettings,
  savePracticeSettings,
  PracticeSettings,
} from "../../utils/practiceStorage";
//TODO
// create random lick
// be able to play just one poisition or two postion or every position base on caged system
//

// Music theory constants
const ALL_KEYS = [
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
];
const MINOR_TYPES = ["natural", "harmonic", "melodic"];

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

interface RandomNote {
  string: number;
  fret: number;
  noteName: string;
}

const RandomNoteGenerator: React.FC = () => {
  const [initialSettings] = useState<PracticeSettings>(() => loadPracticeSettings());
  const [currentNote, setCurrentNote] = useState<RandomNote | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [interval, setIntervalTime] = useState<number>(initialSettings.intervalMs);
  const [useKeyFilter, setUseKeyFilter] = useState<boolean>(initialSettings.useKeyFilter);
  const [selectedKey, setSelectedKey] = useState<string>(initialSettings.selectedKey);
  const [includeOctave, setIncludeOctave] = useState<boolean>(initialSettings.includeOctave);

  const [scaleType, setScaleType] = useState<"major" | "minor">(initialSettings.scaleType);
  const [minorType, setMinorType] = useState<
    "natural" | "harmonic" | "melodic"
  >(initialSettings.minorType);
  const [maxFret, setMaxFret] = useState<number>(initialSettings.maxFret);
  const [useSound, setUseSound] = useState<boolean>(initialSettings.useSound);
  const [useSpeech, setUseSpeech] = useState<boolean>(initialSettings.useSpeech);
  const [volume, setVolume] = useState<number>(initialSettings.volume);
  const [startOctave, setStartOctave] = useState<number>(initialSettings.startOctave);

  // Refs to store audio elements
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis and audio
  useEffect(() => {
    // Initialize speech synthesis
    if (window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis;
    }

    // Create alarm sound element
    const alarm = new Audio();
    alarm.src = "/sounds/notification.mp3"; // You'll need to provide this audio file
    alarm.preload = "auto";
    alarmSoundRef.current = alarm;

    // Cleanup function
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // Persist settings so Manage + Practice stay in sync
  useEffect(() => {
    savePracticeSettings({
      intervalMs: interval,
      useKeyFilter,
      selectedKey,
      includeOctave,
      scaleType,
      minorType,
      maxFret,
      useSound,
      useSpeech,
      volume,
      startOctave,
    });
  }, [
    interval,
    useKeyFilter,
    selectedKey,
    includeOctave,
    scaleType,
    minorType,
    maxFret,
    useSound,
    useSpeech,
    volume,
    startOctave,
  ]);

  // Determines if a note belongs to the selected key
  const isNoteInKey = (noteName: string): boolean => {
    if (!useKeyFilter) return true;

    // Extract the root note without any octave numbers
    const noteRoot = noteName.replace(/[0-9]/g, "");

    // Handle sharp/flat variations
    const noteIndex = NOTE_INDEXES[noteRoot];
    if (noteIndex === undefined) return false;

    // Get the index of the selected key
    const keyIndex = NOTE_INDEXES[selectedKey.split("/")[0]];

    // Major scale pattern (whole and half steps): 0, 2, 4, 5, 7, 9, 11
    const majorScaleSteps = [0, 2, 4, 5, 7, 9, 11];

    // Check if the note is in the key by checking if its relative position is in the scale
    const relativePosition = (noteIndex - keyIndex + 12) % 12;
    return majorScaleSteps.includes(relativePosition);
  };

  // Play the note name using speech synthesis
  const speakNoteName = (noteName: string): void => {
    if (!useSpeech || !speechSynthesisRef.current) return;

    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(noteName);
    utterance.volume = volume / 100;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Speak the note name
    speechSynthesisRef.current.speak(utterance);
  };

  // Play alarm sound when time is almost up
  // const playAlarmSound = (): void => {
  //   if (!useSound || !alarmSoundRef.current) return;

  //   alarmSoundRef.current.volume = volume / 100;
  //   alarmSoundRef.current.currentTime = 0;
  //   alarmSoundRef.current
  //     .play()
  //     .catch((err) => console.error("Error playing alarm:", err));
  // };

  // Generate a random note
  const generateRandomNote = (): void => {
    let validNote = false;
    let attempts = 0;
    let randomString = 0;
    let randomFret = 0;
    let noteName = "";

    // Try to find a valid note (in the selected key if filtering is enabled)
    while (!validNote && attempts < 100) {
      // Random string (1-6)
      randomString = Math.floor(Math.random() * 6) + 1;

      // Random fret (0-maxFret)
      randomFret = Math.floor(Math.random() * (maxFret + 1));

      // Get the note name using your existing function
      noteName = getNoteAtPosition(randomString, randomFret);

      // Check if the note is valid for the selected key
      validNote = isNoteInKey(noteName);
      attempts++;
    }

    // If we found a valid note, set it as the current note
    if (validNote) {
      const newNote = {
        string: randomString,
        fret: randomFret,
        noteName,
      };

      setCurrentNote(newNote);

      // Speak the note name when it changes
      speakNoteName(noteName);
    } else {
      // Fallback if we couldn't find a valid note after max attempts
      const newNote = {
        string: randomString,
        fret: randomFret,
        noteName,
      };

      setCurrentNote(newNote);

      // Speak the note name
      speakNoteName(noteName);
    }
  };

  // Start/stop the generator
  const toggleGenerator = (): void => {
    setIsRunning(!isRunning);
  };

  // Change the interval
  const handleIntervalChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setIntervalTime(Number(e.target.value));
  };

  // Change the max fret
  const handleMaxFretChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setMaxFret(Number(e.target.value));
  };

  // Toggle key filtering
  const toggleKeyFilter = (): void => {
    setUseKeyFilter(!useKeyFilter);
  };

  // Toggle sound
  const toggleSound = (): void => {
    setUseSound(!useSound);
  };

  // Toggle speech
  const toggleSpeech = (): void => {
    setUseSpeech(!useSpeech);
  };

  // Handle key selection
  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedKey(e.target.value);
    // setScaleOfKey()
  };

  // Handle scale type change
  const handleScaleTypeChange = (type: "major" | "minor") => {
    setScaleType(type);
  };

  // Handle minor type change
  const handleMinorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMinorType(e.target.value as "natural" | "harmonic" | "melodic");
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setVolume(Number(e.target.value));
  };

  // Handle octave number change
  const handleStartOctaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartOctave(Number(e.target.value));
  };

  // Setup/cleanup interval
  useEffect(() => {
    let noteTimer: any | null = null;
    const alarmTimer: any | null = null;

    if (isRunning) {
      // Generate first note immediately
      generateRandomNote();

      // Set interval for subsequent notes
      noteTimer = setInterval(() => {
        generateRandomNote();
      }, interval);

      // Set timer for alarm sound (500ms before the next note)
      // const alarmDelay = interval > 800 ? interval - 500 : interval * 0.75;
      // alarmTimer = setInterval(() => {
      //   playAlarmSound();
      // }, interval);
    }

    // Cleanup function
    return () => {
      if (noteTimer) clearInterval(noteTimer);
      if (alarmTimer) clearInterval(alarmTimer);
    };
  }, [
    isRunning,
    interval,
    useKeyFilter,
    selectedKey,
    maxFret,
    useSound,
    useSpeech,
    volume,
  ]);

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">
        Random Note Generator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Interval control */}
        <div className="bg-slate-700 p-4 rounded">
          <h3 className="text-lg font-medium text-slate-300 mb-3">Timing</h3>
          <div className="flex items-center mb-4">
            <label htmlFor="interval" className="text-slate-300 mr-2 w-full">
              Interval (ms):
            </label>
            <input
              id="interval"
              type="number"
              min="500"
              max="10000"
              step="100"
              value={interval}
              onChange={handleIntervalChange}
              className="bg-slate-600 text-white px-3 py-2 rounded w-full"
            />
          </div>

          <div className="flex items-center">
            <label htmlFor="maxFret" className="text-slate-300 mr-2 w-full">
              Max Fret:
            </label>
            <input
              id="maxFret"
              type="number"
              min="5"
              max="24"
              value={maxFret}
              onChange={handleMaxFretChange}
              className="bg-slate-600 text-white px-3 py-2 rounded w-full"
            />
          </div>
        </div>

        {/* Key filter controls */}
        <KeyFilterControls
          useKeyFilter={useKeyFilter}
          toggleKeyFilter={toggleKeyFilter}
          selectedKey={selectedKey}
          handleKeyChange={handleKeyChange}
          startOctave={startOctave}
          handleStartOctaveChange={handleStartOctaveChange}
          includeOctave={includeOctave}
          setIncludeOctave={setIncludeOctave}
          scaleType={scaleType}
          handleScaleTypeChange={handleScaleTypeChange}
          minorType={minorType}
          handleMinorTypeChange={handleMinorTypeChange}
          ALL_KEYS={ALL_KEYS}
          MINOR_TYPES={MINOR_TYPES}
        />
      </div>

      {/* Sound controls */}
      <div className="bg-slate-700 p-4 rounded mb-6">
        <h3 className="text-lg font-medium text-slate-300 mb-3">
          Sound Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSpeech}
                  onChange={toggleSpeech}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                <span className="ms-3 text-slate-300">Speak note names</span>
              </label>
            </div>

            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSound}
                  onChange={toggleSound}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                <span className="ms-3 text-slate-300">Play alarm sound</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="volume" className="text-slate-300 block mb-2">
              Volume: {volume}%
            </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>


      {/* Control buttons */}
      <div className="flex justify-center mb-6">
        <button
          onClick={toggleGenerator}
          className={`px-6 py-3 rounded-lg font-bold text-lg ${isRunning
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
            } text-white transition-colors shadow-md`}
        >
          {isRunning ? "Stop Generator" : "Start Generator"}
        </button>
      </div>

      {/* Guitar neck preview */}
      <div className="bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-700 mb-6">
        <div className="mb-3 text-slate-300 text-center font-semibold">
          Guitar Fretboard Preview (First 20 Frets)
        </div>
        <div className="relative h-72 overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-700 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.08),transparent_25%)]" />

          {/* Fret labels */}
          <div className="absolute inset-x-0 top-6 flex items-center justify-between px-8 text-[9px] uppercase tracking-[0.08em] text-slate-500 font-mono">
            {Array.from({ length: 21 }, (_, fret) => (
              <span key={`fret-label-${fret}`} className="w-4 text-center">
                {fret}
              </span>
            ))}
          </div>

          {/* Strings with thickness variation and colors */}
          {['E4', 'B3', 'G3', 'D3', 'A2', 'E2'].map((stringName, index) => {
            const top = 18 + index * 10;
            const thicknesses = ['h-px', 'h-0.5', 'h-0.5', 'h-1', 'h-1.5', 'h-2'];
            const colors = ['bg-gray-300', 'bg-gray-400', 'bg-amber-500', 'bg-amber-600', 'bg-amber-700', 'bg-amber-800'];

            return (
              <div key={stringName}>
                <div
                  className={`absolute left-10 right-10 ${thicknesses[index]} ${colors[index]} transition-all duration-150 hover:shadow-lg hover:drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]`}
                  style={{ top: `${top}%` }}
                />
                <div
                  className={`absolute left-10 right-10 ${thicknesses[index]} opacity-0 hover:opacity-60 transition-opacity duration-150`}
                  style={{
                    top: `${top}%`,
                    background: 'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)',
                    filter: 'blur(1px)'
                  }}
                />
                <span className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 text-[11px] text-slate-300 font-semibold w-8 text-right">
                  {stringName}
                </span>
              </div>
            );
          })}

          {/* Frets (0-20) with visual separation */}
          {Array.from({ length: 21 }, (_, fret) => {
            const left = 10 + (fret / 20) * 80;
            const isMajorFret = [3, 5, 7, 9, 12, 15, 17, 19].includes(fret);
            return (
              <div key={`fret-line-${fret}`}>
                <div
                  className={`absolute top-12 bottom-6 w-px transition-all duration-200 ${isMajorFret ? 'bg-slate-500/60' : 'bg-slate-600/40'
                    } hover:bg-slate-400/80`}
                  style={{ left: `${left}%` }}
                />
              </div>
            );
          })}

          {/* Fret markers at standard positions (inlays) */}
          {[3, 5, 7, 9, 12, 15, 17, 19].map((fret) => (
            <div
              key={`fret-marker-${fret}`}
              className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-md"
              style={{ left: `${10 + (fret / 20) * 80}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
            />
          ))}

          {/* Interactive note markers with animations */}
          {currentNote && currentNote.fret <= 20 && (
            <div
              className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 border-2 border-white shadow-2xl flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/50 animate-pulse"
              style={{
                left: `${10 + (currentNote.fret / 20) * 80}%`,
                top: `${18 + (currentNote.string - 1) * 10}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.8), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}
            >
              <span className="animate-bounce text-[11px]">{currentNote.noteName}</span>
            </div>
          )}

          {currentNote && currentNote.fret > 20 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 font-medium">
              Fret {currentNote.fret} (beyond preview)
            </div>
          )}

          <div className="absolute left-8 top-12 h-56 w-1 rounded-r-full bg-gradient-to-b from-slate-300 to-slate-400 shadow-lg" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 opacity-30 pointer-events-none" />
        </div>
      </div>

      {/* Note display */}
      {currentNote && (
        <div className="bg-slate-700 rounded-lg p-6 text-center shadow-inner">
          <div className="mb-6">
            <span className="text-slate-400 text-lg">Current Note</span>
            <div className="text-5xl font-bold text-indigo-300 mt-2">
              {currentNote.noteName}
            </div>
          </div>

          <div className="grid mb-2 grid-cols-2 gap-6">
            <div className="bg-slate-600 p-4 rounded-lg shadow">
              <span className="text-slate-400 text-sm block mb-1">String</span>
              <div className="text-3xl font-bold text-white">
                {currentNote.string}
              </div>
            </div>

            <div className="bg-slate-600 p-4 rounded-lg shadow">
              <span className="text-slate-400 text-sm block mb-1">Fret</span>
              <div className="text-3xl font-bold text-white">
                {currentNote.fret}
              </div>
            </div>
          </div>
          <ScaleGenerator
            kefOfTheKey={selectedKey}
            OctaveNumber={startOctave}
            includeOctave={includeOctave}
            minorType={minorType}
            scaleType={scaleType}
          />
        </div>
      )}
    </div>
  );
};

export default RandomNoteGenerator;
