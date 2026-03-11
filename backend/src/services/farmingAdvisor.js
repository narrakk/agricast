/**
 * AgriCast Farming Intelligence Engine
 *
 * Converts raw weather data into actionable farming recommendations.
 * Rules are based on agronomic best practices for East African smallholder farmers.
 */

/**
 * Analyses current weather + forecast and returns farming recommendations.
 *
 * @param {Object} weatherData - Response from Open-Meteo getWeatherForecast()
 * @param {Object} crop - Crop object from the crops table (can be null)
 * @returns {Object} { advice, alerts, plantingWindow, irrigationNeeded, sprayingWindow }
 */
function getFarmingAdvice(weatherData, crop = null) {
  const current = weatherData.current_weather;
  const daily = weatherData.daily;

  const advice = [];
  const alerts = [];

  const today = {
    tempMax: daily.temperature_2m_max[0],
    tempMin: daily.temperature_2m_min[0],
    rainSum: daily.precipitation_sum[0],
    rainProb: daily.precipitation_probability_max[0],
    windMax: daily.windspeed_10m_max[0],
    weatherCode: daily.weathercode[0]
  };

  const tomorrow = {
    tempMax: daily.temperature_2m_max[1],
    tempMin: daily.temperature_2m_min[1],
    rainSum: daily.precipitation_sum[1],
    rainProb: daily.precipitation_probability_max[1],
    windMax: daily.windspeed_10m_max[1]
  };

  // ─── Planting window assessment ────────────────────────────────────────────
  const plantingWindow = assessPlantingWindow(daily, crop);

  // ─── Irrigation assessment ──────────────────────────────────────────────────
  const irrigationNeeded = assessIrrigation(today, crop);

  // ─── Spraying window (pesticide/fertilizer) ─────────────────────────────────
  const sprayingWindow = assessSprayingWindow(today, tomorrow);

  // ─── Alert generation ────────────────────────────────────────────────────────
  // Heavy rainfall alert
  if (today.rainSum > 30) {
    alerts.push({
      type: 'heavy_rain',
      severity: 'warning',
      message: `⚠️ Heavy rain expected today (${today.rainSum}mm). Avoid fieldwork. Check drainage channels.`
    });
  }

  // Frost risk alert (for highland areas)
  if (today.tempMin < 4) {
    alerts.push({
      type: 'frost_risk',
      severity: 'critical',
      message: `🌡️ Frost risk tonight — temperature may drop to ${today.tempMin}°C. Cover sensitive crops or irrigate before sunset.`
    });
  }

  // Drought stress alert
  const last7DayRain = daily.precipitation_sum.slice(0, 7).reduce((a, b) => a + b, 0);
  if (last7DayRain < 5 && today.tempMax > 30) {
    alerts.push({
      type: 'drought_stress',
      severity: 'warning',
      message: `☀️ Drought stress risk — only ${last7DayRain.toFixed(1)}mm rain in 7 days with high temperatures. Consider irrigation.`
    });
  }

  // High wind alert (affects spraying and young crops)
  if (today.windMax > 25) {
    alerts.push({
      type: 'high_wind',
      severity: 'warning',
      message: `💨 High winds expected (${today.windMax}km/h). Avoid pesticide spraying. Stake tall crops.`
    });
  }

  // ─── General advice ──────────────────────────────────────────────────────────
  if (today.rainProb < 20 && today.tempMax < 32 && today.windMax < 15) {
    advice.push('✅ Good general farming conditions today.');
  }

  if (tomorrow.rainProb > 60) {
    advice.push(`🌧️ Rain likely tomorrow (${tomorrow.rainProb}% probability). Complete fieldwork today.`);
  }

  if (crop) {
    const cropAdvice = getCropSpecificAdvice(current, today, crop);
    advice.push(...cropAdvice);
  }

  return {
    advice,
    alerts,
    plantingWindow,
    irrigationNeeded,
    sprayingWindow,
    summary: buildSummary(today, current)
  };
}

/**
 * Assesses whether conditions are suitable for planting over the next 7 days.
 */
function assessPlantingWindow(daily, crop) {
  const windows = [];

  for (let i = 0; i < 7; i++) {
    const rainProb = daily.precipitation_probability_max[i];
    const rainSum = daily.precipitation_sum[i];
    const tempMax = daily.temperature_2m_max[i];
    const tempMin = daily.temperature_2m_min[i];

    let suitable = true;
    let reason = '';

    if (rainProb > 70) { suitable = false; reason = 'Too much rain risk'; }
    else if (rainSum > 20) { suitable = false; reason = 'Heavy rainfall expected'; }
    else if (tempMax > 36) { suitable = false; reason = 'Too hot for germination'; }
    else if (tempMin < 10 && crop && crop.frost_sensitive) { suitable = false; reason = 'Too cold for this crop'; }
    else if (rainProb > 20 && rainProb < 60) { reason = 'Light rain possible — ideal planting conditions'; }
    else if (rainProb < 20) { reason = 'Dry — ensure soil has enough moisture before planting'; }

    windows.push({ dayIndex: i, suitable, reason, rainProb, tempMax });
  }

  return windows;
}

/**
 * Determines whether irrigation is recommended today.
 */
function assessIrrigation(today, crop) {
  // Simplified evapotranspiration-based model
  // Full Penman-Monteith would require more variables; this gives practical guidance
  if (today.rainSum > 10) {
    return { recommended: false, reason: 'Sufficient rainfall today — no irrigation needed' };
  }
  if (today.rainProb > 60) {
    return { recommended: false, reason: 'Rain likely — skip irrigation today' };
  }
  if (today.tempMax > 30) {
    return { recommended: true, urgency: 'high', reason: `High temperature (${today.tempMax}°C) increases water demand` };
  }
  if (today.tempMax > 25) {
    return { recommended: true, urgency: 'moderate', reason: 'Warm and dry conditions — irrigate if soil feels dry' };
  }
  return { recommended: false, reason: 'Conditions do not require irrigation today' };
}

/**
 * Determines whether conditions are safe for pesticide/fertilizer spraying.
 */
function assessSprayingWindow(today, tomorrow) {
  if (today.windMax > 15) {
    return { suitable: false, reason: `Wind too high (${today.windMax}km/h) — spray drift risk. Wait for calmer conditions.` };
  }
  if (today.rainProb > 40) {
    return { suitable: false, reason: `Rain likely (${today.rainProb}%) — chemicals will be washed off before absorption.` };
  }
  if (today.tempMax > 35) {
    return { suitable: false, reason: 'Too hot — spray early morning (before 9am) or evening (after 5pm) to avoid evaporation.' };
  }
  if (tomorrow.rainProb > 60) {
    return { suitable: true, warning: 'Good today, but rain likely tomorrow. Spray today for best results.' };
  }
  return { suitable: true, reason: 'Good spraying conditions — low wind, low rain risk.' };
}

/**
 * Returns crop-specific advice based on current conditions.
 */
function getCropSpecificAdvice(current, today, crop) {
  const advice = [];
  const temp = current.temperature;

  if (temp < crop.ideal_temp_min) {
    advice.push(`🌡️ Temperature (${temp}°C) is below ideal for ${crop.name} (${crop.ideal_temp_min}–${crop.ideal_temp_max}°C). Growth may be slow.`);
  } else if (temp > crop.ideal_temp_max) {
    advice.push(`🌡️ Temperature (${temp}°C) exceeds ideal for ${crop.name}. Consider shade or irrigation to cool the root zone.`);
  } else {
    advice.push(`✅ Temperature (${temp}°C) is within ideal range for ${crop.name}.`);
  }

  return advice;
}

/**
 * Builds a short human-readable weather summary.
 */
function buildSummary(today, current) {
  const desc = getConditionDescription(today.weatherCode);
  return `${desc}. High of ${today.tempMax}°C, low of ${today.tempMin}°C. Rain probability: ${today.rainProb}%.`;
}

function getConditionDescription(code) {
  if (code === 0) return 'Clear sunny day';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy conditions';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rainy';
  if (code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Mixed conditions';
}

module.exports = { getFarmingAdvice };