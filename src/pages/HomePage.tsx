import React from 'react';
import RandomNoteGenerator from '../components/Home/RandomNoteGenerator';

// Simplified version just to show usage
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Guitar Practice Tool</h1>
      </header>
      
      <main>
        {/* Include the random note generator component */}
        <RandomNoteGenerator />
      </main>
    </div>
  );
};

export default App;