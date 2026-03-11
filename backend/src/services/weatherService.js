const axios = require('axios');
const NodeCache = require('node-cache');

// Cache TTL defaults to 1 hour (3600 seconds)
// This keeps us well within Open-Meteo's 10,000 requests/day free limit
const weatherCache = new NodeCache({
  stdTTL: parseInt(process.env.WEATHER_CACHE_TTL) || 3600,
  checkperiod: 600
});

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

/**
 * Fetches current weather + 7-day hourly forecast for a given location.
 * Results are cached for WEATHER_CACHE_TTL seconds.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Object} Weather data including current conditions and 7-day forecast
 */
async function getWeatherForecast(latitude, longitude) {
  const cacheKey = `forecast_${latitude}_${longitude}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Weather for ${latitude},${longitude}`);
    return cached;
  }

  console.log(`[Cache MISS] Fetching weather for ${latitude},${longitude}`);

  const params = {
    latitude,
    longitude,
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'precipitation',
      'windspeed_10m',
      'winddirection_10m',
      'relativehumidity_2m',
      'soil_moisture_0_to_1cm',
      'uv_index',
      'weathercode'
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'windspeed_10m_max',
      'weathercode',
      'sunrise',
      'sunset',
      'uv_index_max'
    ].join(','),
    current_weather: true,
    timezone: 'auto',
    forecast_days: 7
  };

  const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, { params });
  const data = response.data;

  weatherCache.set(cacheKey, data);
  return data;
}

/**
 * Fetches historical weather for a location over a date range.
 * Used for the farming calendar and trend analysis.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} startDate  Format: YYYY-MM-DD
 * @param {string} endDate    Format: YYYY-MM-DD
 * @returns {Object} Historical weather data
 */
async function getHistoricalWeather(latitude, longitude, startDate, endDate) {
  const cacheKey = `history_${latitude}_${longitude}_${startDate}_${endDate}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  const params = {
    latitude,
    longitude,
    start_date: startDate,
    end_date: endDate,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'windspeed_10m_max'
    ].join(','),
    timezone: 'auto'
  };

  const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', { params });
  const data = response.data;

  weatherCache.set(cacheKey, data);
  return data;
}

/**
 * Maps Open-Meteo weathercode to a human-readable description.
 * Full code list: https://open-meteo.com/en/docs
 *
 * @param {number} code - WMO weather interpretation code
 * @returns {string} Human-readable description
 */
function decodeWeatherCode(code) {
  const codes = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm with hail'
  };
  return codes[code] || 'Unknown';
}

/**
 * Returns cache statistics for monitoring.
 */
function getCacheStats() {
  return weatherCache.getStats();
}

module.exports = {
  getWeatherForecast,
  getHistoricalWeather,
  decodeWeatherCode,
  getCacheStats
};