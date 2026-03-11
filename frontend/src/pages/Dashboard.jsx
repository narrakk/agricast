import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useWeather, useLocations } from '../hooks/useWeather';
import WeatherIcon from '../components/WeatherIcon';

const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1 },
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ─── Mini city weather card ───────────────────────────────────────────────────
function CityCard({ name, temp, condition, code, delay }) {
  const condColor = code >= 61 ? 'var(--accent-sky-light)' : 'var(--accent-amber-light)';
  const textColor = code >= 61 ? 'var(--accent-sky)' : 'var(--accent-amber)';

  return (
    <motion.div
      variants={cardVariants}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 22 }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(60,120,90,0.14)' }}
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255,255,255,0.9)',
        borderRadius: 20,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 4px 20px rgba(60,120,90,0.08)',
        cursor: 'default',
      }}
    >
      <WeatherIcon code={code ?? 0} size={40} isDay />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Nunito' }}>{name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{condition}</p>
      </div>
      <div style={{
        background: condColor, color: textColor,
        borderRadius: 12, padding: '4px 10px',
        fontSize: 14, fontWeight: 800, fontFamily: 'Nunito',
        minWidth: 50, textAlign: 'center'
      }}>
        {temp !== undefined ? `${Math.round(temp)}°` : '—'}
      </div>
    </motion.div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, bg, color }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -3 }}
      style={{
        background: bg,
        borderRadius: 18,
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 6,
        boxShadow: '0 4px 16px rgba(60,120,90,0.08)',
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <p style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'Nunito', lineHeight: 1 }}>{value}</p>
    </motion.div>
  );
}

// ─── Dark tooltip ─────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(26,46,40,0.92)', borderRadius: 12,
      padding: '8px 14px', fontSize: 12, color: 'white',
      backdropFilter: 'blur(8px)'
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const locations  = useLocations();
  const [selected, setSelected] = useState({ lat: -1.286389, lon: 36.817223, name: 'Nairobi' });
  const { data, loading } = useWeather(selected.lat, selected.lon);

  // Apply body weather class for background morphing
  useEffect(() => {
    if (!data) return;
    const code = data.weather?.weathercode ?? 0;
    document.body.className = code <= 2 ? 'weather-sunny' : code >= 61 ? 'weather-rainy' : '';
    return () => { document.body.className = ''; };
  }, [data]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">

      {/* ── Location selector ──────────────────────────────────────────── */}
      <motion.div variants={cardVariants} style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select
          className="field"
          style={{ width: 'auto', minWidth: 200 }}
          onChange={e => {
            const loc = locations.find(l => l.id === e.target.value);
            if (loc) setSelected({ lat: loc.latitude, lon: loc.longitude, name: loc.name });
          }}
        >
          <option value="">📍 Nairobi (default)</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}, {loc.region}</option>
          ))}
        </select>
      </motion.div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            style={{ fontSize: 40, display: 'inline-block' }}
          >☀️</motion.div>
          <p style={{ marginTop: 12, fontSize: 14, fontFamily: 'Nunito', fontWeight: 600 }}>
            Loading weather for {selected.name}...
          </p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* ── Alerts ─────────────────────────────────────────────────── */}
          {data.advice.alerts.map((alert, i) => (
            <motion.div
              key={i} variants={cardVariants}
              style={{
                marginBottom: 12,
                borderLeft: `4px solid ${alert.severity === 'critical' ? '#FF6B6B' : '#F5A623'}`,
                background: alert.severity === 'critical'
                  ? 'rgba(255,107,107,0.08)' : 'rgba(245,166,35,0.08)',
                borderRadius: '0 16px 16px 0',
                padding: '10px 16px',
                fontSize: 13, fontWeight: 500,
                color: alert.severity === 'critical' ? '#CC3333' : '#996600'
              }}
            >
              {alert.message}
            </motion.div>
          ))}

          {/* ── Main bento grid ────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto auto', gap: 16 }}>

            {/* Hero weather card — spans 2 cols */}
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.01 }}
              style={{
                gridColumn: '1 / 3',
                background: 'linear-gradient(135deg, rgba(46,204,138,0.15) 0%, rgba(72,184,232,0.1) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                borderRadius: 28,
                padding: '28px 28px 24px',
                boxShadow: '0 12px 40px rgba(46,204,138,0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative blob */}
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 200, height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(46,204,138,0.12), transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      📍 {selected.name}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 700,
                      background: 'rgba(46,204,138,0.15)', color: 'var(--accent-green)'
                    }}>LIVE</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <p className="temp-pulse" style={{
                      fontSize: 80, fontWeight: 900, fontFamily: 'Nunito',
                      color: 'var(--text-primary)', lineHeight: 1, margin: 0,
                    }}>
                      {Math.round(data.weather.temperature)}
                    </p>
                    <p style={{ fontSize: 36, fontWeight: 700, fontFamily: 'Nunito', color: 'var(--text-secondary)', marginBottom: 10 }}>
                      °C
                    </p>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>
                    {data.advice.summary}
                  </p>

                  <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                    <span className="tag" style={{ background: 'rgba(72,184,232,0.15)', color: 'var(--accent-sky)' }}>
                      💨 {data.weather.windspeed} km/h
                    </span>
                    <span className="tag" style={{ background: 'rgba(46,204,138,0.15)', color: 'var(--accent-green)' }}>
                      {data.advice.irrigationNeeded.recommended ? '💧 Irrigate today' : '✅ No irrigation'}
                    </span>
                    <span className="tag" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--accent-amber)' }}>
                      🌿 Spray {data.advice.sprayingWindow.suitable ? 'OK' : 'wait'}
                    </span>
                  </div>
                </div>

                {/* Large floating weather icon */}
                <div className="float" style={{ marginRight: 8, marginTop: -8 }}>
                  <WeatherIcon
                    code={data.weather.weathercode ?? 0}
                    size={120}
                    isDay={data.weather.is_day === 1}
                  />
                </div>
              </div>
            </motion.div>

            {/* Humidity / quick stat card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              style={{
                background: 'linear-gradient(135deg, #2ECC8A 0%, #1AAF72 100%)',
                borderRadius: 28,
                padding: '24px 20px',
                boxShadow: '0 8px 28px rgba(46,204,138,0.30)',
                color: 'white',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', bottom: -20, right: -20,
                width: 100, height: 100, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)'
              }} />
              <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Planting Today
              </p>
              <p style={{ fontSize: 44, fontWeight: 900, fontFamily: 'Nunito', lineHeight: 1.1, marginTop: 8 }}>
                {data.advice.plantingWindow[0]?.suitable ? '✅' : '❌'}
              </p>
              <p style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>
                {data.advice.plantingWindow[0]?.suitable ? 'Good conditions' : 'Not ideal today'}
              </p>
              <div className="float-2" style={{ position: 'absolute', top: 16, right: 16 }}>
                <WeatherIcon code={0} size={44} isDay />
              </div>
            </motion.div>

            {/* 7-day strip */}
            <motion.div
              variants={cardVariants}
              style={{
                gridColumn: '1 / 4',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                borderRadius: 24,
                padding: '20px 24px',
                boxShadow: '0 4px 20px rgba(60,120,90,0.08)',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                7-Day Planting Window
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                {data.advice.plantingWindow.map((day, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' });
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 300 }}
                      whileHover={{ y: -4, scale: 1.04 }}
                      style={{
                        borderRadius: 18,
                        padding: '12px 8px',
                        textAlign: 'center',
                        background: day.suitable
                          ? 'linear-gradient(160deg, rgba(46,204,138,0.1), rgba(46,204,138,0.05))'
                          : 'rgba(255,107,107,0.06)',
                        border: `1.5px solid ${day.suitable ? 'rgba(46,204,138,0.2)' : 'rgba(255,107,107,0.15)'}`,
                        cursor: 'default',
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                        {dayName}
                      </p>
                      <WeatherIcon code={0} size={32} isDay />
                      <p style={{ fontSize: 15, margin: '6px 0 4px', fontWeight: 800, fontFamily: 'Nunito', color: 'var(--text-primary)' }}>
                        {day.tempMax}°
                      </p>
                      <p style={{ fontSize: 10, color: day.suitable ? 'var(--accent-green)' : 'var(--accent-coral)', fontWeight: 600 }}>
                        {day.rainProb}% 🌧
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* City comparison cards */}
            <motion.div
              variants={cardVariants}
              style={{
                gridColumn: '1 / 2',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                borderRadius: 24,
                padding: '20px',
                boxShadow: '0 4px 20px rgba(60,120,90,0.08)',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Kenya Cities
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Mombasa', lat: -4.043, lon: 39.668 },
                  { name: 'Kisumu',  lat: -0.092, lon: 34.768 },
                  { name: 'Nakuru',  lat: -0.303, lon: 36.080 },
                ].map((city, i) => (
                  <CityCard
                    key={city.name}
                    name={city.name}
                    temp={20 + i * 2}
                    condition="Partly cloudy"
                    code={2}
                    delay={0.4 + i * 0.1}
                  />
                ))}
              </div>
            </motion.div>

            {/* Irrigation & spraying advice */}
            <motion.div
              variants={cardVariants}
              style={{
                gridColumn: '2 / 4',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12
              }}
            >
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  background: 'rgba(72,184,232,0.1)',
                  border: '1.5px solid rgba(72,184,232,0.2)',
                  borderRadius: 20, padding: '18px 20px',
                  boxShadow: '0 4px 16px rgba(72,184,232,0.1)',
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-sky)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  💧 Irrigation
                </p>
                <p style={{ fontSize: 20, marginBottom: 6 }}>
                  {data.advice.irrigationNeeded.recommended ? '🚿' : '✅'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 500 }}>
                  {data.advice.irrigationNeeded.reason}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  background: 'rgba(139,108,246,0.08)',
                  border: '1.5px solid rgba(139,108,246,0.2)',
                  borderRadius: 20, padding: '18px 20px',
                  boxShadow: '0 4px 16px rgba(139,108,246,0.1)',
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  🌿 Spraying
                </p>
                <p style={{ fontSize: 20, marginBottom: 6 }}>
                  {data.advice.sprayingWindow.suitable ? '✅' : '⏳'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 500 }}>
                  {data.advice.sprayingWindow.reason || data.advice.sprayingWindow.warning || 'Checking conditions'}
                </p>
              </motion.div>

              {/* Today's advice */}
              {data.advice.advice.length > 0 && (
                <motion.div
                  whileHover={{ y: -2 }}
                  style={{
                    gridColumn: '1 / 3',
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(255,255,255,0.9)',
                    borderRadius: 20, padding: '16px 20px',
                    boxShadow: '0 4px 16px rgba(60,120,90,0.08)',
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    📋 Today's Recommendations
                  </p>
                  {data.advice.advice.map((item, i) => (
                    <p key={i} style={{
                      fontSize: 13, color: 'var(--text-secondary)',
                      padding: '6px 0 6px 12px',
                      borderLeft: '3px solid rgba(46,204,138,0.3)',
                      marginBottom: 6, fontWeight: 500, lineHeight: 1.4
                    }}>
                      {item}
                    </p>
                  ))}
                </motion.div>
              )}
            </motion.div>

          </div>
        </>
      )}
    </motion.div>
  );
}
