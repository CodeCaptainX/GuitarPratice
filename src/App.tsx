// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import './App.css';
import routes from './routes';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Header */}
        <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎸</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Guitar Practice Pro</h1>
                  <p className="text-xs text-slate-400">Master your fretboard</p>
                </div>
              </Link>
              <nav className="flex gap-6">
                <Link to="/" className="hover:text-indigo-400 transition-colors">Practice</Link>
                <Link to="/about" className="hover:text-indigo-400 transition-colors">About</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <Routes>
            {routes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Routes>
        </main>
      </diviv className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎸</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Guitar Practice Pro</h1>
                  <p className="text-xs text-slate-400">Master your fretboard</p>
                </div>
              </Link>
              <nav className="flex gap-6">
                <Link to="/" className="hover:text-indigo-400 transition-colors">Practice</Link>
                <Link to="/about" className="hover:text-indigo-400 transition-colors">About</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <Routes>
            {routes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;