// ScaleGenerator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { generateMajorScale, generateMinorScale,  createToneGenerator } from '../../utils/musicTheory';


interface KeyType {
    kefOfTheKey: string;  // avoid using 'key' directly to prevent confusion
    OctaveNumber :  number;
    includeOctave : boolean;
    scaleType : string;
    minorType : string
}

const ScaleGenerator: React.FC<KeyType> = ({ kefOfTheKey,OctaveNumber,includeOctave,scaleType,minorType }) => {
  // State for selected scale options


  const [volume, _] = useState<number>(80);
  
  // State for generated handleStartOctaveChange
  const [currentScale, setCurrentScale] = useState<string[]>([]);
  const [currentNoteIndex, ] = useState<number>(-1);
  
  // Refs for audio
  const toneGeneratorRef = useRef<ReturnType<typeof createToneGenerator> | null>(null);
  const playTimerRef = useRef<number | null>(null);
  
  // Initialize the tone generator
  useEffect(() => {
    toneGeneratorRef.current = createToneGenerator();
    
    // Cleanup function
    return () => {
      if (toneGeneratorRef.current) {
        toneGeneratorRef.current.stopTone();
      }
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, []);
  
  // Update tone generator volume when volume changes
  useEffect(() => {
    if (toneGeneratorRef.current) {
      toneGeneratorRef.current.setVolume(volume / 100);
    }
  }, [volume]);
  
  // Generate the scale when options change
  useEffect(() => {
    generateScale();
  }, [kefOfTheKey, scaleType, minorType, includeOctave, OctaveNumber]);
  
  // Function to generate the scale based on current options
  const generateScale = () => {
    // Extract the first key if it contains a slash (e.g., C#/Db -> C#)
    const keyRoot = kefOfTheKey.split('/')[0];
    
    let scale: string[] = [];
    
    if (scaleType === 'major') {
      scale = generateMajorScale(keyRoot, includeOctave, OctaveNumber);
    } else {
      scale = generateMinorScale(keyRoot, minorType, includeOctave, OctaveNumber);
    }
    
    setCurrentScale(scale);
  };
  
  // Function to play a single note
  // const playNote = (note: string) => {
  //   if (!toneGeneratorRef.current) return;
    
  //   try {
  //     // Calculate the frequency for the note
  //     const frequency = getNoteFrequency(note);
      
  //     if (frequency > 0) {
  //       // Stop any currently playing tone
  //       toneGeneratorRef.current.stopTone();
        
  //       // Play the new tone (duration: 750ms)
  //       toneGeneratorRef.current.playTone(frequency, 750);
  //     }
  //   } catch (err) {
  //     console.error('Error playing tone for note:', note, err);
  //   }
  // };
  
  // Function to play the entire scale
  // const playScale = () => {
  //   if (isPlaying) {
  //     // If already playing, stop
  //     stopPlayingScale();
  //     return;
  //   }
    
  //   setIsPlaying(true);
  //   setCurrentNoteIndex(0);
    
  //   // Function to play each note in sequence
  //   const playNextNote = (index: number) => {
  //     if (index >= currentScale.length) {
  //       // End of scale
  //       setIsPlaying(false);
  //       setCurrentNoteIndex(-1);
  //       return;
  //     }
      
  //     // Play current note
  //     setCurrentNoteIndex(index);
      
  //     const note = currentScale[index];
      
  //     // Make sure we have the octave for frequency calculation
  //     const noteWithOctave = includeOctave 
  //       ? note
  //       : `${note}${OctaveNumber + (index >= 7 ? 1 : 0)}`;
        
  //     playNote(noteWithOctave);
      
  //     // Schedule next note
  //     playTimerRef.current = window.setTimeout(() => {
  //       playNextNote(index + 1);
  //     }, 800); // Slightly longer than the note duration for better separation
  //   };
    
  //   // Start playing from the first note
  //   playNextNote(0);
  // };
  
  // Function to stop playing the scale
  // const stopPlayingScale = () => {
  //   setIsPlaying(false);
  //   setCurrentNoteIndex(-1);
    
  //   if (toneGeneratorRef.current) {
  //     toneGeneratorRef.current.stopTone();
  //   }
    
  //   if (playTimerRef.current) {
  //     clearTimeout(playTimerRef.current);
  //     playTimerRef.current = null;
  //   }
  // };
  
  // Handle click on a note in the scale
  // const handleNoteClick = (note: string, index: number) => {
  //   setCurrentNoteIndex(index);
    
  //   // Make sure we have the octave for frequency calculation
  //   const noteWithOctave = includeOctave 
  //     ? note 
  //     : `${note}${OctaveNumber + (index >= 7 ? 1 : 0)}`;
      
  //   playNote(noteWithOctave);
  // };
  
  return (
    <div className="bg-slate-800 rounded-lg mb-4 shadow-lg">
      
      {/* Scale display */}
      <div className="bg-slate-700 rounded-lg p-6 shadow-inner">
        <h3 className="text-lg font-medium text-slate-300 mb-4 text-center">
          {kefOfTheKey} {scaleType === 'major' ? 'Major' : `${minorType.charAt(0).toUpperCase() + minorType.slice(1)} Minor`} Scale
        </h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          {currentScale.map((note, index) => (
            <div 
              key={index}
              className={`
                px-4 py-3 rounded-md text-center cursor-pointer transition-all
                ${currentNoteIndex === index 
                  ? 'bg-indigo-500 text-white scale-110' 
                  : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}
              `}
              style={{ minWidth: '60px' }}
            >
              <div className="text-xl font-bold">{note}</div>
              <div className="text-xs mt-1 opacity-75">Degree: {index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScaleGenerator;