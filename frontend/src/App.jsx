import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-agri-green text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <h1 className="text-xl font-bold tracking-tight">AgriCast</h1>
            <span className="text-xs text-green-200 hidden sm:block">Weather Intelligence for Farmers</span>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activePage === 'dashboard' ? 'bg-white text-agri-green' : 'text-white hover:bg-green-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePage('map')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activePage === 'map' ? 'bg-white text-agri-green' : 'text-white hover:bg-green-700'
              }`}
            >
              Map
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'map' && <MapPage />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-center text-xs py-3">
        AgriCast — Free weather intelligence for East African farmers
      </footer>
    </div>
  );
}