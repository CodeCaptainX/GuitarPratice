import { JSX } from 'react';
import GuitarFretboardPixi from '../components/GuitarFretboardPixi';

export default function GuitarFretboard(): JSX.Element {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4">Interactive Guitar Fretboard</h2>
      <p className="mb-4 text-gray-600">Click on any fret position to hear the note</p>

      {/* Nut */}
      <div className="w-full max-w-4xl mb-2 h-4 bg-gray-100 rounded"></div>

      {/* Fretboard */}
      <GuitarFretboardPixi width={800} height={400} />

      <div className="mt-6 text-center text-gray-600">
        <p>Click individual frets to play notes or use the chord buttons above</p>
        <p className="text-sm mt-2">Frequencies are calculated using the equation: f = f₀ × 2^(n/12)</p>
      </div>
    </div >
  );
}