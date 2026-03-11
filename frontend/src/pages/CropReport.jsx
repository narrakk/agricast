import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RISK_COLORS = { low: '#34D399', moderate: '#FBBF24', high: '#F87171' };
const SCORE_COLOR = (score) => score >= 75 ? '#34D399' : score >= 50 ? '#FBBF24' : '#F87171';

// ─── Custom dark tooltip ──────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#13131E', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#A78BFA', fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Score bar component ──────────────────────────────────────────────────────
const ScoreBar = ({ score, label }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: SCORE_COLOR(score) }}>{score}%</span>
    </div>
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${score}%`,
        background: `linear-gradient(90deg, ${SCORE_COLOR(score)}, ${SCORE_COLOR(score)}88)`,
        borderRadius: 3,
        transition: 'width 0.8s ease'
      }} />
    </div>
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="mb-4">
    <h3 className="font-display font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: 15 }}>
      <span>{icon}</span>{title}
    </h3>
    {subtitle && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
  </div>
);

// ─── Main CropReport page ─────────────────────────────────────────────────────
export default function CropReport() {
  const [locations, setLocations] = useState([]);
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState({ lat: -1.286389, lon: 36.817223, locationName: 'Nairobi', cropId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/weather/locations'),
      axios.get('/api/weather/crops')
    ]).then(([locs, crps]) => {
      setLocations(locs.data.value || locs.data);
      setCrops(crps.data.value || crps.data);
    });
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: form.lat,
        lon: form.lon,
        ...(form.cropId && { cropId: form.cropId })
      });
      const { data } = await axios.get(`/api/map/crop-report?${params}`);
      setReport(data);
    } catch (e) {
      setError('Failed to generate report. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    padding: '10px 14px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Crop Planner
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Enter your location and crop to receive a data-driven planting, fertilisation, and harvest calendar.
        </p>
      </div>

      {/* Input form */}
      <div className="glass-card p-5">
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Location */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              📍 Location
            </label>
            <select
              style={inputStyle}
              onChange={e => {
                const loc = locations.find(l => l.id === e.target.value);
                if (loc) setForm(f => ({ ...f, lat: loc.latitude, lon: loc.longitude, locationName: loc.name }));
              }}
            >
              <option value="">Nairobi (default)</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}, {loc.region}</option>
              ))}
            </select>
          </div>

          {/* Crop */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              🌾 Crop (optional)
            </label>
            <select
              style={inputStyle}
              value={form.cropId}
              onChange={e => setForm(f => ({ ...f, cropId: e.target.value }))}
            >
              <option value="">General analysis</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.id}>{crop.name} ({crop.local_name})</option>
              ))}
            </select>
          </div>

          {/* Generate button */}
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-display font-semibold text-sm transition-all duration-200"
              style={{
                background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                color: loading ? 'rgba(255,255,255,0.5)' : 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {loading ? '⏳ Analysing 12 months...' : '⚡ Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 16, color: '#F87171', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Report output */}
      {report && (
        <div className="space-y-5 fade-in">
          {/* Summary header */}
          <div className="glass-card p-5 glow-purple">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>REPORT FOR</p>
                <h3 className="font-display text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {report.location.lat.toFixed(2)}°, {report.location.lon.toFixed(2)}°
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--accent-purple-light)' }}>
                  {report.crop ? `Crop: ${report.crop.name} (${report.crop.local_name})` : 'General analysis — no specific crop selected'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Based on data from {report.dataRange.start} to {report.dataRange.end}
                </p>
              </div>
              {report.cropCalendar && (
                <div style={{ textAlign: 'right' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>BEST PLANTING MONTH</p>
                  <p className="font-display text-3xl font-bold mt-1" style={{ color: 'var(--accent-green)' }}>
                    {report.cropCalendar.bestPlantingMonth}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Grid: charts + map */}
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Chart 1: Monthly Rainfall */}
            <div className="glass-card p-5">
              <SectionHeader icon="🌧" title="Monthly Rainfall (Historical Avg)" subtitle="Last 12 months · mm total per month" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.monthlyData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="monthName" tick={{ fill: '#8888AA', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8888AA', fontSize: 10 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="totalRainfall" name="Rainfall (mm)" radius={[4, 4, 0, 0]}>
                    {report.monthlyData.map((m, i) => (
                      <Cell
                        key={i}
                        fill={m.totalRainfall > 100 ? '#38BDF8' : m.totalRainfall > 50 ? '#34D399' : '#FBBF24'}
                      />
                    ))}
                  </Bar>
                  {report.crop && (
                    <ReferenceLine
                      y={report.crop.ideal_rainfall_mm_per_month}
                      stroke="#A78BFA"
                      strokeDasharray="4 4"
                      label={{ value: 'Ideal', fill: '#A78BFA', fontSize: 10 }}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Temperature Range */}
            <div className="glass-card p-5">
              <SectionHeader icon="🌡️" title="Temperature Range" subtitle="Monthly average max / min · °C" />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={report.monthlyData}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="monthName" tick={{ fill: '#8888AA', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8888AA', fontSize: 10 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area type="monotone" dataKey="avgTempMax" name="Max Temp (°C)" stroke="#F87171" fill="url(#tempGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="avgTempMin" name="Min Temp (°C)" stroke="#38BDF8" strokeWidth={2} dot={false} />
                  {report.crop && <>
                    <ReferenceLine y={report.crop.ideal_temp_max} stroke="#F87171" strokeDasharray="4 4" />
                    <ReferenceLine y={report.crop.ideal_temp_min} stroke="#38BDF8" strokeDasharray="4 4" />
                  </>}
                </AreaChart>
              </ResponsiveContainer>
              {report.crop && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Dashed lines = ideal range for {report.crop.name} ({report.crop.ideal_temp_min}–{report.crop.ideal_temp_max}°C)
                </p>
              )}
            </div>

            {/* Chart 3: Planting + Fertilisation + Harvest Calendar */}
            {report.cropCalendar && (
              <div className="glass-card p-5 lg:col-span-2">
                <SectionHeader icon="📅" title="Crop Activity Calendar" subtitle="Planting / Fertilisation / Harvest suitability by month · Score 0–100" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.cropCalendar.calendar} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="monthName" tick={{ fill: '#8888AA', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8888AA', fontSize: 10 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#8888AA' }} />
                    <Bar dataKey="plantingScore" name="Planting" fill="#34D399" radius={[3, 3, 0, 0]} opacity={0.9} />
                    <Bar dataKey="fertScore" name="Fertilise" fill="#A78BFA" radius={[3, 3, 0, 0]} opacity={0.9} />
                    <Bar dataKey="harvestScore" name="Harvest" fill="#FBBF24" radius={[3, 3, 0, 0]} opacity={0.9} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Chart 4: Risk Dashboard */}
            {report.cropCalendar && (
              <div className="glass-card p-5">
                <SectionHeader icon="⚠️" title="Monthly Risk Assessment" subtitle="Frost · Drought · Flood risk by month" />
                <div className="space-y-3 mt-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {report.cropCalendar.calendar.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 28, flexShrink: 0 }}>{m.monthName}</span>
                      <div className="flex gap-2 flex-1">
                        {[
                          { label: '❄️', risk: m.frostRisk },
                          { label: '☀️', risk: m.droughtRisk },
                          { label: '🌊', risk: m.floodRisk }
                        ].map(({ label, risk }, j) => (
                          <span key={j} style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: `${RISK_COLORS[risk]}20`,
                            color: RISK_COLORS[risk],
                            border: `1px solid ${RISK_COLORS[risk]}40`,
                            whiteSpace: 'nowrap'
                          }}>
                            {label} {risk}
                          </span>
                        ))}
                      </div>
                      <div style={{ width: 80 }}>
                        <ScoreBar score={m.plantingScore} label="" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart 5: Harvest probability */}
            {report.cropCalendar && (
              <div className="glass-card p-5">
                <SectionHeader icon="🌾" title="Harvest Window Forecast" subtitle="Probability of dry conditions for harvest" />
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={report.cropCalendar.calendar}>
                    <defs>
                      <linearGradient id="harvestGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="monthName" tick={{ fill: '#8888AA', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8888AA', fontSize: 10 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <ReferenceLine y={70} stroke="#34D399" strokeDasharray="4 4"
                      label={{ value: 'Good', fill: '#34D399', fontSize: 10 }} />
                    <Area type="monotone" dataKey="harvestScore" name="Harvest suitability %"
                      stroke="#FBBF24" fill="url(#harvestGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>

          {/* Map reference */}
          <div className="glass-card overflow-hidden">
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <SectionHeader icon="🗺" title="Location Reference Map" subtitle={`Analysed coordinates: ${report.location.lat.toFixed(4)}°N, ${report.location.lon.toFixed(4)}°E`} />
            </div>
            <div style={{ height: 280 }}>
              <MapContainer
                center={[report.location.lat, report.location.lon]}
                zoom={8}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='© OpenStreetMap'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[report.location.lat, report.location.lon]}>
                  <Popup>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                      <strong style={{ color: '#A78BFA' }}>Analysis Point</strong>
                      <br />
                      {report.crop && <span>{report.crop.name}</span>}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Current conditions footer */}
          {report.currentAdvice && (
            <div className="glass-card p-5">
              <SectionHeader icon="⚡" title="Current Conditions" subtitle="Live advice based on today's forecast" />
              <div className="grid sm:grid-cols-2 gap-3">
                <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#34D399' }}>💧 Irrigation</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{report.currentAdvice.irrigationNeeded.reason}</p>
                </div>
                <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#A78BFA' }}>🌿 Spraying</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {report.currentAdvice.sprayingWindow.reason || report.currentAdvice.sprayingWindow.warning || 'Check conditions'}
                  </p>
                </div>
              </div>
              {report.currentAdvice.alerts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {report.currentAdvice.alerts.map((alert, i) => (
                    <div key={i} style={{
                      background: alert.severity === 'critical' ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
                      border: `1px solid ${alert.severity === 'critical' ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`,
                      borderRadius: 10, padding: '10px 14px', fontSize: 12,
                      color: alert.severity === 'critical' ? '#F87171' : '#FBBF24'
                    }}>
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}