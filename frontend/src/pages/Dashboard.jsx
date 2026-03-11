import React, { useState } from 'react';
import { useWeather, useLocations } from '../hooks/useWeather';
import WeatherCard from '../components/WeatherCard';
import ForecastStrip from '../components/ForecastStrip';
import AdvicePanel from '../components/AdvicePanel';
import AlertBanner from '../components/AlertBanner';

export default function Dashboard() {
  const locations = useLocations();
  const [selected, setSelected] = useState({ lat: -1.286389, lon: 36.817223, name: 'Nairobi' });
  const { data, loading, error } = useWeather(selected.lat, selected.lon);

  return (
    <div className="space-y-5">
      {/* Location selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">📍 Location:</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          value={locations.find(l => l.name === selected.name)?.id || ''}
          onChange={e => {
            const loc = locations.find(l => l.id === e.target.value);
            if (loc) setSelected({ lat: loc.latitude, lon: loc.longitude, name: loc.name });
            else setSelected({ lat: -1.286389, lon: 36.817223, name: 'Nairobi' });
          }}
        >
          <option value="">Nairobi (default)</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}, {loc.region}</option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl animate-pulse">🌤️</p>
          <p className="mt-2">Loading weather for {selected.name}...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ❌ Failed to load weather data. Make sure the backend is running on port 3001.
        </div>
      )}

      {/* Weather content */}
      {data && !loading && (
        <>
          {data.advice.alerts.length > 0 && <AlertBanner alerts={data.advice.alerts} />}
          <WeatherCard weather={data.weather} summary={data.advice.summary} location={selected.name} />
          <ForecastStrip plantingWindows={data.advice.plantingWindow} />
          <AdvicePanel advice={data.advice} />
        </>
      )}
    </div>
  );
}