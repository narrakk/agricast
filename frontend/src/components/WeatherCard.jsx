export default function WeatherCard({ weather, summary, location }) {
  if (!weather) return null;
  const isDay = weather.is_day === 1;

  return (
    <div className="bg-gradient-to-br from-agri-green to-agri-light rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-80">📍 {location}</p>
          <p className="text-6xl font-bold mt-1">{Math.round(weather.temperature)}°C</p>
          <p className="mt-2 text-sm opacity-90">{summary}</p>
        </div>
        <div className="text-6xl">{isDay ? '☀️' : '🌙'}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
          💨 Wind: {weather.windspeed} km/h
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
          🕐 Updated: {new Date(weather.time).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}