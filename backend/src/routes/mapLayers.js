const express = require('express');
const router = express.Router();
const { getGridData, getWindGridData } = require('../services/weatherService');
const { getHistoricalWeather, getWeatherForecast } = require('../services/weatherService');
const { getCrops } = require('../services/supabaseService');
const { getFarmingAdvice } = require('../services/farmingAdvisor');

let windFetchInProgress = false;

/**
 * GET /api/map/wind
 * Returns wind U/V grid data formatted for leaflet-velocity
 */
router.get('/wind', async (req, res) => {
  if (windFetchInProgress) {
    return res.status(429).json({ error: 'Wind data is currently loading, try again in 30 seconds' });
  }
  windFetchInProgress = true;
  try {
    const data = await getWindGridData();
    res.json(data);
  } finally {
    windFetchInProgress = false;
  }
});

/**
 * GET /api/map/temperature
 * Returns temperature heatmap points: [[lat, lon, value], ...]
 */
router.get('/temperature', async (req, res) => {
  const data = await getGridData('temperature_2m');
  res.json(data);
});

/**
 * GET /api/map/precipitation
 * Returns precipitation heatmap points
 */
router.get('/precipitation', async (req, res) => {
  const data = await getGridData('precipitation_probability');
  res.json(data);
});

/**
 * GET /api/map/humidity
 * Returns humidity heatmap points
 */
router.get('/humidity', async (req, res) => {
  const data = await getGridData('relativehumidity_2m');
  res.json(data);
});

/**
 * GET /api/map/uv
 * Returns UV index heatmap points
 */
router.get('/uv', async (req, res) => {
  const data = await getGridData('uv_index');
  res.json(data);
});

/**
 * GET /api/map/cloudcover
 * Returns cloud cover heatmap points
 */
router.get('/cloudcover', async (req, res) => {
  const data = await getGridData('cloudcover');
  res.json(data);
});

/**
 * GET /api/map/crop-report?lat=X&lon=Y&cropId=Z
 * Returns 12-month historical analysis for crop planning report
 */
router.get('/crop-report', async (req, res) => {
  const { lat, lon, cropId } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  // Get 12 months of historical data (last complete year)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);

  const formatDate = d => d.toISOString().split('T')[0];

  const [historical, forecast, crops] = await Promise.all([
    getHistoricalWeather(parseFloat(lat), parseFloat(lon), formatDate(startDate), formatDate(endDate)),
    getWeatherForecast(parseFloat(lat), parseFloat(lon)),
    getCrops()
  ]);

  // Handle potential Supabase response structure { value, Count } or array
  const cropList = crops.value || crops;
  const crop = cropId ? (Array.isArray(cropList) ? cropList.find(c => c.id === cropId) : null) : null;

  // Build monthly aggregates from daily historical data
  const monthlyData = buildMonthlyAggregates(historical.daily);

  // Generate crop calendar if crop is selected
  const cropCalendar = crop ? generateCropCalendar(monthlyData, crop) : null;

  // Current farming advice
  const currentAdvice = getFarmingAdvice(forecast, crop);

  res.json({
    location: { lat: parseFloat(lat), lon: parseFloat(lon) },
    crop: crop || null,
    monthlyData,
    cropCalendar,
    currentAdvice,
    dataRange: { start: formatDate(startDate), end: formatDate(endDate) }
  });
});

/**
 * Aggregates daily historical data into monthly summaries.
 */
function buildMonthlyAggregates(daily) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    monthName: new Date(2024, i).toLocaleString('default', { month: 'short' }),
    totalRainfall: 0,
    avgTempMax: 0,
    avgTempMin: 0,
    maxWind: 0,
    rainDays: 0,
    count: 0
  }));

  daily.time.forEach((dateStr, i) => {
    const monthIdx = new Date(dateStr).getMonth();
    const m = months[monthIdx];
    m.totalRainfall += daily.precipitation_sum[i] || 0;
    m.avgTempMax += daily.temperature_2m_max[i] || 0;
    m.avgTempMin += daily.temperature_2m_min[i] || 0;
    m.maxWind = Math.max(m.maxWind, daily.windspeed_10m_max[i] || 0);
    if ((daily.precipitation_sum[i] || 0) > 1) m.rainDays++;
    m.count++;
  });

  return months.map(m => ({
    ...m,
    avgTempMax: m.count > 0 ? +(m.avgTempMax / m.count).toFixed(1) : 0,
    avgTempMin: m.count > 0 ? +(m.avgTempMin / m.count).toFixed(1) : 0,
    totalRainfall: +m.totalRainfall.toFixed(1),
    maxWind: +m.maxWind.toFixed(1)
  }));
}

/**
 * Generates a crop-specific planting, fertilisation, and harvest calendar.
 * Based on monthly rainfall averages vs crop water requirements.
 */
function generateCropCalendar(monthlyData, crop) {
  const calendar = monthlyData.map(m => {
    const tempOk = m.avgTempMax <= crop.ideal_temp_max && m.avgTempMin >= crop.ideal_temp_min;
    const rainOk = m.totalRainfall >= (crop.ideal_rainfall_mm_per_month * 0.7);
    const rainTooMuch = m.totalRainfall > (crop.ideal_rainfall_mm_per_month * 1.8);

    // Planting suitability score 0–100
    let plantingScore = 0;
    if (tempOk) plantingScore += 50;
    if (rainOk && !rainTooMuch) plantingScore += 50;
    else if (rainOk) plantingScore += 25;

    // Fertilisation: ideal when rain is moderate (not washing it away, not drought)
    const fertScore = (rainOk && !rainTooMuch && tempOk) ? 80 : 30;

    // Harvest: ideal when rain probability drops (dry for harvest)
    const harvestScore = m.rainDays < 8 ? 90 : m.rainDays < 14 ? 60 : 30;

    // Risk assessment
    const frostRisk = m.avgTempMin < 4 ? 'high' : m.avgTempMin < 8 ? 'moderate' : 'low';
    const droughtRisk = m.totalRainfall < 20 ? 'high' : m.totalRainfall < 40 ? 'moderate' : 'low';
    const floodRisk = m.totalRainfall > 200 ? 'high' : m.totalRainfall > 120 ? 'moderate' : 'low';

    return {
      ...m,
      plantingScore,
      fertScore,
      harvestScore,
      frostRisk,
      droughtRisk,
      floodRisk,
      recommendation: plantingScore >= 75 ? 'ideal' : plantingScore >= 50 ? 'suitable' : 'avoid'
    };
  });

  // Find the best planting window (consecutive months with high planting score)
  const bestMonth = calendar.reduce((best, curr) =>
    curr.plantingScore > best.plantingScore ? curr : best
  );

  return { calendar, bestPlantingMonth: bestMonth.monthName, crop };
}

module.exports = router;