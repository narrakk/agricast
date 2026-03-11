import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../utils/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon (known Vite/webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarkers({ locations, weatherMap }) {
  return locations.map(loc => (
    <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
      <Popup>
        <div className="text-sm">
          <p className="font-bold text-agri-green">{loc.name}</p>
          <p className="text-gray-500 text-xs">{loc.region}</p>
          {weatherMap[loc.id] && (
            <p className="mt-1">🌡️ {Math.round(weatherMap[loc.id].temperature)}°C — {weatherMap[loc.id].windspeed} km/h wind</p>
          )}
        </div>
      </Popup>
    </Marker>
  ));
}

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [weatherMap, setWeatherMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/weather/locations').then(async res => {
      // Handle potential Supabase response structure
      const locs = res.data.value || res.data;
      setLocations(Array.isArray(locs) ? locs : []);

      // Fetch weather for each location and build a map of id → weather
      const weatherData = {};
      if (Array.isArray(locs)) {
        await Promise.all(locs.map(async loc => {
          try {
            const w = await api.get(`/api/weather/forecast?lat=${loc.latitude}&lon=${loc.longitude}`);
            weatherData[loc.id] = w.data.current_weather;
          } catch (e) {
            console.error(`Error fetching weather for ${loc.name}:`, e.message);
          }
        }));
      }

      setWeatherMap(weatherData);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching locations:', err.message);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">🗺️ Weather Map — East Africa</h2>
        {loading && <span className="text-sm text-gray-400 animate-pulse">Loading weather data...</span>}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Location marker</span>
        <span>Click any marker for current conditions</span>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200" style={{ height: '520px' }}>
        <MapContainer
          center={[-0.5, 37.5]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarkers locations={locations} weatherMap={weatherMap} />
        </MapContainer>
      </div>

      {/* Weather summary cards for each location */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {locations.map(loc => (
          <div key={loc.id} className="bg-white rounded-xl border p-3 shadow-sm text-sm">
            <p className="font-semibold text-agri-green">{loc.name}</p>
            <p className="text-xs text-gray-400">{loc.region}</p>
            {weatherMap[loc.id] ? (
              <p className="mt-1 text-gray-700">
                🌡️ {Math.round(weatherMap[loc.id].temperature)}°C &nbsp;
                💨 {weatherMap[loc.id].windspeed} km/h
              </p>
            ) : (
              <p className="mt-1 text-gray-300 text-xs">Loading...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}