import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWeather, useLocations } from '../hooks/useWeather';
import WeatherIcon from '../components/WeatherIcon';
import { CityCard, StatPill } from '../components/Dashboard/DashboardWidgets';

const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1 },
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/**
 * Hyperlocal Farming Dashboard - Refactored for performance and cleaner code.
 */
export default function Dashboard() {
  const { locations, loading: locLoading } = useLocations();
  const [selected, setSelected] = useState({ lat: -1.286389, lon: 36.817223, name: 'Nairobi' });
  const { data, loading: weatherLoading, error } = useWeather(selected.lat, selected.lon);

  // Dynamic background morphing based on weather condition
  useEffect(() => {
    if (!data) return;
    const code = data.weather?.weathercode ?? 0;
    // Update body class for the animated mesh background variants
    const bodyClass = code <= 2 ? 'weather-sunny' : code >= 61 ? 'weather-rainy' : '';
    document.body.className = bodyClass;
    
    return () => { document.body.className = ''; };
  }, [data]);

  const kenyaCities = useMemo(() => [
    { name: 'Mombasa', lat: -4.043, lon: 39.668 },
    { name: 'Kisumu',  lat: -0.092, lon: 34.768 },
    { name: 'Nakuru',  lat: -0.303, lon: 36.080 },
  ], []);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      
      {/* ── Header & Location Selector ───────────────────────────────── */}
      <motion.div variants={cardVariants} className="mb-5 flex gap-2 flex-wrap">
        <select
          className="field w-auto min-w-[220px]"
          value={selected.id}
          onChange={e => {
            const loc = locations.find(l => l.id === e.target.value);
            if (loc) setSelected({ lat: loc.latitude, lon: loc.longitude, name: loc.name, id: loc.id });
          }}
        >
          <option value="">📍 Nairobi (default)</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}, {loc.region}</option>
          ))}
        </select>
      </motion.div>

      {/* ── Loading & Error States ─────────────────────────────────── */}
      {weatherLoading && (
        <div className="text-center py-20 text-text-muted">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="text-4xl inline-block"
          >☀️</motion.div>
          <p className="mt-3 text-sm font-display font-semibold">
            Fetching intelligence for {selected.name}...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-accent-coral/10 border-l-4 border-accent-coral p-4 rounded-r-2xl mb-5">
          <p className="text-accent-coral font-bold font-display">Communication Error</p>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      )}

      {data && !weatherLoading && (
        <>
          {/* ── Intelligence Alerts ────────────────────────────────────── */}
          {data.advice.alerts.map((alert, i) => (
            <motion.div
              key={i} 
              variants={cardVariants}
              className={`mb-3 border-l-4 rounded-r-2xl p-2.5 px-4 text-[13px] font-medium ${
                alert.severity === 'critical' 
                  ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' 
                  : 'border-accent-amber bg-accent-amber/10 text-accent-amber'
              }`}
            >
              {alert.message}
            </motion.div>
          ))}

          {/* ── Main Bento Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Main Weather Hero */}
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.005 }}
              className="md:col-span-2 glass-card p-7 pb-6 relative overflow-hidden flex flex-col justify-between"
              style={{ background: 'linear-gradient(135deg, rgba(46,204,138,0.15) 0%, rgba(72,184,232,0.1) 100%)' }}
            >
              {/* Decorative light blob */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-accent-green/10 blur-3xl pointer-events-none" />

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] text-text-secondary font-semibold">📍 {selected.name}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-accent-green/15 text-accent-green">LIVE</span>
                  </div>

                  <div className="flex items-end gap-1">
                    <p className="text-[80px] font-black font-display text-text-primary leading-none temp-pulse">
                      {Math.round(data.weather.temperature)}
                    </p>
                    <p className="text-4xl font-bold font-display text-text-secondary mb-2.5">°C</p>
                  </div>

                  <p className="text-sm text-text-secondary mt-1.5 font-medium max-w-sm">
                    {data.advice.summary}
                  </p>

                  <div className="flex gap-2.5 mt-4 flex-wrap">
                    <span className="tag bg-accent-sky/15 text-accent-sky">💨 {data.weather.windspeed} km/h</span>
                    <span className={`tag ${data.advice.irrigationNeeded.recommended ? 'bg-accent-sky/15 text-accent-sky' : 'bg-accent-green/15 text-accent-green'}`}>
                      {data.advice.irrigationNeeded.recommended ? '💧 Irrigate' : '✅ Soil moist'}
                    </span>
                    <span className={`tag ${data.advice.sprayingWindow.suitable ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-amber/15 text-accent-amber'}`}>
                      🌿 Spray {data.advice.sprayingWindow.suitable ? 'OK' : 'wait'}
                    </span>
                  </div>
                </div>

                <div className="float mr-2 -mt-2">
                  <WeatherIcon
                    code={data.weather.weathercode ?? 0}
                    size={120}
                    isDay={data.weather.is_day === 1}
                  />
                </div>
              </div>
            </motion.div>

            {/* Quick Recommendation Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-gradient-to-br from-accent-green to-[#1AAF72] rounded-[28px] p-6 shadow-card hover:shadow-card-hover text-white relative overflow-hidden"
            >
              <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-white/10 blur-xl" />
              <p className="text-[11px] font-semibold opacity-90 uppercase tracking-widest">Planting Status</p>
              <p className="text-[44px] font-black font-display leading-tight mt-2">
                {data.advice.plantingWindow[0]?.suitable ? 'GO ✅' : 'WAIT ⏳'}
              </p>
              <p className="text-xs mt-2 opacity-90 font-medium">
                {data.advice.plantingWindow[0]?.suitable ? 'Ideal conditions today' : 'Postpone planting'}
              </p>
              <div className="float-2 absolute top-4 right-4 opacity-40">
                <WeatherIcon code={0} size={48} isDay />
              </div>
            </motion.div>

            {/* 7-Day Planting Timeline */}
            <motion.div variants={cardVariants} className="md:col-span-3 glass-card p-6 px-7">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">
                7-Day Growth Outlook
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {data.advice.plantingWindow.map((day, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' });
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      whileHover={{ y: -4, scale: 1.04 }}
                      className={`rounded-2xl p-3 px-2 text-center border-[1.5px] cursor-default transition-colors ${
                        day.suitable 
                        ? 'bg-accent-green/5 border-accent-green/20' 
                        : 'bg-accent-coral/5 border-accent-coral/15'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-text-muted mb-1.5 uppercase">{dayName}</p>
                      <div className="flex justify-center my-1.5">
                        <WeatherIcon code={0} size={32} isDay />
                      </div>
                      <p className="text-base font-black font-display text-text-primary my-1">{day.tempMax}°</p>
                      <p className={`text-[10px] font-bold ${day.suitable ? 'text-accent-green' : 'text-accent-coral'}`}>
                        {day.rainProb}% 🌧
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Regions Comparison */}
            <motion.div variants={cardVariants} className="glass-card p-5">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3">Regional Trends</p>
              <div className="flex flex-col gap-2.5">
                {kenyaCities.map((city, i) => (
                  <CityCard
                    key={city.name}
                    name={city.name}
                    temp={22 + i * 1.5}
                    condition="Clear"
                    code={0}
                    delay={0.4 + i * 0.1}
                  />
                ))}
              </div>
            </motion.div>

            {/* Advice Grid */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-accent-sky/10 border-[1.5px] border-accent-sky/20 rounded-[20px] p-5 shadow-sm"
              >
                <p className="text-[10px] font-bold text-accent-sky uppercase tracking-widest mb-2">💧 Irrigation</p>
                <p className="text-xl mb-1.5">{data.advice.irrigationNeeded.recommended ? '🚿' : '✅'}</p>
                <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
                  {data.advice.irrigationNeeded.reason}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="bg-accent-purple/5 border-[1.5px] border-accent-purple/20 rounded-[20px] p-5 shadow-sm"
              >
                <p className="text-[10px] font-bold text-accent-purple uppercase tracking-widest mb-2">🌿 Spraying</p>
                <p className="text-xl mb-1.5">{data.advice.sprayingWindow.suitable ? '✅' : '⏳'}</p>
                <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
                  {data.advice.sprayingWindow.reason || data.advice.sprayingWindow.warning || 'Stable conditions'}
                </p>
              </motion.div>

              {data.advice.advice.length > 0 && (
                <motion.div
                  whileHover={{ y: -2 }}
                  className="sm:col-span-2 glass-card p-4 px-5"
                >
                  <p className="text-[10px] font-bold text-accent-green uppercase tracking-widest mb-2.5">📋 Strategic Actions</p>
                  {data.advice.advice.map((item, i) => (
                    <p key={i} className="text-[13px] text-text-secondary pl-3 border-l-2 border-accent-green/30 mb-1.5 font-medium leading-relaxed last:mb-0">
                      {item}
                    </p>
                  ))}
                </motion.div>
              )}
            </div>

          </div>
        </>
      )}
    </motion.div>
  );
}
