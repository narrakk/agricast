const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { getWeatherForecast, getHistoricalWeather, decodeWeatherCode, getCacheStats } = require('../services/weatherService');
const { getFarmingAdvice } = require('../services/farmingAdvisor');
const { getCrops, getLocations } = require('../services/supabaseService');

/**
 * GET /api/weather/forecast?lat=-1.286389&lon=36.817223
 * Returns 7-day forecast for a location
 */
router.get('/forecast', asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  const weather = await getWeatherForecast(parseFloat(lat), parseFloat(lon));
  res.json(weather);
}));

/**
 * GET /api/weather/advice?lat=-1.286389&lon=36.817223&cropId=optional-uuid
 * Returns farming advice for a location
 */
router.get('/advice', asyncHandler(async (req, res) => {
  const { lat, lon, cropId } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  const weather = await getWeatherForecast(parseFloat(lat), parseFloat(lon));

  let crop = null;
  if (cropId) {
    const crops = await getCrops();
    crop = crops.find(c => c.id === cropId) || null;
  }

  const advice = getFarmingAdvice(weather, crop);
  res.json({ weather: weather.current_weather, advice });
}));

/**
 * GET /api/weather/locations
 * Returns all known farm locations
 */
router.get('/locations', asyncHandler(async (req, res) => {
  const locations = await getLocations();
  res.json(locations);
}));

/**
 * GET /api/weather/crops
 * Returns all supported crop types
 */
router.get('/crops', asyncHandler(async (req, res) => {
  const crops = await getCrops();
  res.json(crops);
}));

/**
 * GET /api/weather/cache-stats
 * Returns cache hit/miss statistics for monitoring
 */
router.get('/cache-stats', (req, res) => {
  res.json(getCacheStats());
});

module.exports = router;