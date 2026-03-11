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

/**
 * Fetches a grid of weather data for map layer rendering.
 * Samples weather at a 5x5 grid of points across East Africa
 * and returns data formatted for heatmap overlays.
 *
 * Grid covers: lat -4.5 to 4.5, lon 33.5 to 42.5 (East Africa bounding box)
 * 25 points total — stays well within Open-Meteo free tier limits when cached.
 *
 * @param {string} variable - Open-Meteo hourly variable name
 * @returns {Array} Array of [lat, lon, value] for leaflet.heat
 */
async function getGridData(variable) {
  const cacheKey = `grid_${variable}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Grid data for ${variable}`);
    return cached;
  }

  // 5x5 grid spanning East Africa
  const latPoints = [-4.0, -2.0, 0.0, 2.0, 4.0];
  const lonPoints = [34.0, 35.5, 37.0, 38.5, 40.0];

  const points = [];
  for (const lat of latPoints) {
    for (const lon of lonPoints) {
      points.push({ lat, lon });
    }
  }

  // Fetch all 25 points in parallel
  const results = await Promise.all(
    points.map(async ({ lat, lon }) => {
      try {
        const params = {
          latitude: lat,
          longitude: lon,
          hourly: variable,
          timezone: 'auto',
          forecast_days: 1
        };
        const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, { params });
        // Return current hour value (index 0)
        const value = response.data.hourly[variable]?.[0] ?? 0;
        return [lat, lon, value];
      } catch (e) {
        return [lat, lon, 0];
      }
    })
  );

  weatherCache.set(cacheKey, results);
  return results;
}

/**
 * Fetches wind U and V components for a grid of points.
 * Formats data into leaflet-velocity's required JSON structure.
 *
 * @returns {Array} Two-element array: [uComponent, vComponent] in leaflet-velocity format
 */
async function getWindGridData() {
  const cacheKey = 'wind_grid';
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  // Denser 8x8 grid for smoother wind animation
  const latPoints = [-4.0, -2.5, -1.0, 0.5, 1.5, 2.5, 3.5, 4.5];
  const lonPoints = [33.5, 34.7, 35.9, 37.1, 38.3, 39.5, 40.7, 41.9];

  const nx = lonPoints.length;
  const ny = latPoints.length;

  const uData = new Array(nx * ny).fill(0);
  const vData = new Array(nx * ny).fill(0);

  await Promise.all(
    latPoints.flatMap((lat, latIdx) =>
      lonPoints.map(async (lon, lonIdx) => {
        try {
          const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
            params: {
              latitude: lat,
              longitude: lon,
              hourly: 'windspeed_10m,winddirection_10m',
              timezone: 'auto',
              forecast_days: 1
            }
          });
          const speed = response.data.hourly.windspeed_10m?.[0] ?? 0;
          const dir = response.data.hourly.winddirection_10m?.[0] ?? 0;
          // Convert speed/direction to U/V components
          const dirRad = (dir * Math.PI) / 180;
          uData[latIdx * nx + lonIdx] = -speed * Math.sin(dirRad);
          vData[latIdx * nx + lonIdx] = -speed * Math.cos(dirRad);
        } catch (e) {
          // Leave as 0
        }
      })
    )
  );

  // Format for leaflet-velocity
  const header = {
    parameterUnit: 'm/s',
    lo1: lonPoints[0],
    la1: latPoints[latPoints.length - 1],
    dx: (lonPoints[lonPoints.length - 1] - lonPoints[0]) / (nx - 1),
    dy: (latPoints[latPoints.length - 1] - latPoints[0]) / (ny - 1),
    nx,
    ny,
    refTime: new Date().toISOString()
  };

  const result = [
    { header: { ...header, parameterNumber: 2, parameterNumberName: 'eastward_wind' }, data: uData },
    { header: { ...header, parameterNumber: 3, parameterNumberName: 'northward_wind' }, data: vData }
  ];

  weatherCache.set(cacheKey, result);
  return result;
}

module.exports = {
  getWeatherForecast,
  getHistoricalWeather,
  decodeWeatherCode,
  getCacheStats,
  getGridData,
  getWindGridData
};