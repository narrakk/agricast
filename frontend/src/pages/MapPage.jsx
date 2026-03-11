import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { motion } from 'framer-motion';

// Fix Leaflet marker icons for Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Layer configuration ──────────────────────────────────────────────────────
const LAYERS = [
  { id: 'wind',        label: 'Wind Flow',      icon: '💨', color: '#38BDF8',  endpoint: '/api/map/wind',        type: 'velocity' },
  { id: 'temperature', label: 'Temperature',    icon: '🌡️',  color: '#F87171',  endpoint: '/api/map/temperature', type: 'heat',     gradient: { 0.0: '#313695', 0.3: '#74add1', 0.5: '#fee090', 0.7: '#f46d43', 1.0: '#a50026' } },
  { id: 'precipitation', label: 'Rainfall Risk', icon: '🌧',  color: '#34D399',  endpoint: '/api/map/precipitation', type: 'heat',  gradient: { 0.0: '#f7fbff', 0.3: '#9ecae1', 0.6: '#2171b5', 1.0: '#08306b' } },
  { id: 'humidity',    label: 'Humidity',       icon: '💧', color: '#A78BFA',  endpoint: '/api/map/humidity',    type: 'heat',     gradient: { 0.0: '#fff5eb', 0.4: '#fd8d3c', 0.7: '#d94801', 1.0: '#7f2704' } },
  { id: 'uv',          label: 'UV Index',       icon: '☀️',  color: '#FBBF24',  endpoint: '/api/map/uv',          type: 'heat',     gradient: { 0.0: '#ffffcc', 0.4: '#fd8d3c', 0.7: '#e31a1c', 1.0: '#800026' } },
  { id: 'cloudcover',  label: 'Cloud Cover',    icon: '☁️',  color: '#94A3B8',  endpoint: '/api/map/cloudcover',  type: 'heat',     gradient: { 0.0: 'rgba(255,255,255,0)', 0.5: 'rgba(180,200,220,0.4)', 1.0: 'rgba(100,140,180,0.7)' } },
];

// ─── Wind velocity layer component ───────────────────────────────────────────
function WindLayer({ data }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!data || !window.L?.velocityLayer) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    layerRef.current = L.velocityLayer({
      displayValues: true,
      displayOptions: {
        velocityType: 'Wind',
        position: 'bottomleft',
        emptyString: 'No wind data',
        speedUnit: 'k/h',
        showCardinal: true,
        angleConvention: 'bearingCW',
      },
      data,
      maxVelocity: 25,
      velocityScale: 0.008,
      colorScale: ['#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'],
      opacity: 0.85,
    });

    map.addLayer(layerRef.current);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [data, map]);

  return null;
}

// ─── Heatmap layer component ──────────────────────────────────────────────────
function HeatLayer({ data, gradient, layerId }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!data || !window.L?.heatLayer) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Normalize values to 0–1 range for heat intensity
    const values = data.map(p => p[2]);
    const min = Math.min(...values);
    const max = Math.max(...values) || 1;

    const normalised = data.map(([lat, lon, val]) => [
      lat, lon, (val - min) / (max - min)
    ]);

    layerRef.current = L.heatLayer(normalised, {
      radius: 80,
      blur: 60,
      maxZoom: 10,
      gradient: gradient || { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
      max: 1.0,
      minOpacity: 0.35
    });

    map.addLayer(layerRef.current);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [data, gradient, map]);

  return null;
}

// ─── Click inspector component ────────────────────────────────────────────────
function ClickInspector({ onLocationClick }) {
  useMapEvents({
    click: async (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// ─── Inspect popup ────────────────────────────────────────────────────────────
function InspectMarker({ lat, lon, data, onClose }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], map.getZoom(), { animate: true });
    }
  }, [lat, lon, map]);

  if (!lat || !lon || !data) return null;

  const customIcon = L.divIcon({
    html: `<div style="width:16px;height:16px;background:#8B5CF6;border:2px solid #A78BFA;border-radius:50%;box-shadow:0 0 12px rgba(139,92,246,0.6)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: ''
  });

  return (
    <Marker position={[lat, lon]} icon={customIcon} ref={markerRef}>
      <Popup onClose={onClose}>
        <div style={{ minWidth: '200px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <p style={{ fontWeight: 700, marginBottom: 8, color: '#A78BFA', fontFamily: 'Nunito, sans-serif' }}>
            📍 {lat.toFixed(4)}, {lon.toFixed(4)}
          </p>
          {data ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
              <span>🌡️ Temp</span><strong>{Math.round(data.current_weather?.temperature)}°C</strong>
              <span>💨 Wind</span><strong>{data.current_weather?.windspeed} km/h</strong>
              <span>🌧 Rain</span><strong>{data.daily?.precipitation_probability_max?.[0]}%</strong>
              <span>💧 Humidity</span><strong>{data.hourly?.relativehumidity_2m?.[0]}%</strong>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading...</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// ─── Main MapPage ─────────────────────────────────────────────────────────────
export default function MapPage() {
  const [activeLayers, setActiveLayers] = useState(new Set(['temperature']));
  const [layerData, setLayerData] = useState({});
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  const [locations, setLocations] = useState([]);
  const [inspectPoint, setInspectPoint] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [velocityLoaded, setVelocityLoaded] = useState(false);

  // Load leaflet-velocity from CDN
  useEffect(() => {
    if (window.L?.velocityLayer) { setVelocityLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/leaflet-velocity@2.1.4/dist/leaflet-velocity.min.js';
    script.onload = () => setVelocityLoaded(true);
    document.head.appendChild(script);

    // Also load leaflet.heat
    const heatScript = document.createElement('script');
    heatScript.src = 'https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js';
    document.head.appendChild(heatScript);
  }, []);

  // Load locations
  useEffect(() => {
    axios.get('/api/weather/locations').then(r => setLocations(r.data.value || r.data));
  }, []);

  // Load layer data when toggled on
  const toggleLayer = useCallback(async (layerId) => {
    const newLayers = new Set(activeLayers);
    if (newLayers.has(layerId)) {
      newLayers.delete(layerId);
    } else {
      newLayers.add(layerId);
      if (!layerData[layerId]) {
        const layerConfig = LAYERS.find(l => l.id === layerId);
        setLoadingLayers(prev => new Set([...prev, layerId]));
        try {
          const { data } = await axios.get(layerConfig.endpoint);
          setLayerData(prev => ({ ...prev, [layerId]: data.value || data }));
        } finally {
          setLoadingLayers(prev => { const n = new Set(prev); n.delete(layerId); return n; });
        }
      }
    }
    setActiveLayers(newLayers);
  }, [activeLayers, layerData]);

  // Load initial temperature layer
  useEffect(() => {
    if (activeLayers.has('temperature') && !layerData['temperature']) {
      toggleLayer('temperature');
    }
  }, []);

  // Click to inspect
  const handleLocationClick = useCallback(async (lat, lon) => {
    setInspectPoint({ lat, lon });
    setInspectData(null);
    try {
      const { data } = await axios.get(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
      setInspectData(data);
    } catch (e) {
      setInspectData(null);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          Click anywhere on the map to inspect live weather at that exact point
        </p>
      </motion.div>

      {/* Layer toggles */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {LAYERS.map((layer, i) => (
          <motion.button
            key={layer.id}
            className={`layer-btn ${activeLayers.has(layer.id) ? 'active' : ''}`}
            onClick={() => toggleLayer(layer.id)}
            style={activeLayers.has(layer.id) ? {
              borderColor: layer.color,
              color: layer.color,
              background: `${layer.color}18`,
              boxShadow: `0 4px 16px ${layer.color}30`
            } : {}}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
          >
            <span>{layer.icon}</span>
            <span>{layer.label}</span>
            {loadingLayers.has(layer.id) && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ display: 'inline-block', fontSize: 10 }}
              >⏳</motion.span>
            )}
            {activeLayers.has(layer.id) && !loadingLayers.has(layer.id) && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: layer.color, display: 'inline-block' }} />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Map container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(60,120,90,0.14)',
          border: '2px solid rgba(255,255,255,0.9)',
          height: 520,
        }}
      >
        <MapContainer
          center={[-0.5, 37.5]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='© OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {LAYERS.filter(l => activeLayers.has(l.id) && layerData[l.id]).map(layer => {
            if (layer.type === 'velocity' && velocityLoaded) {
              return <WindLayer key={layer.id} data={layerData[layer.id]} />;
            }
            if (layer.type === 'heat') {
              return <HeatLayer key={layer.id} data={layerData[layer.id]} gradient={layer.gradient} layerId={layer.id} />;
            }
            return null;
          })}

          {locations.map(loc => (
            <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13 }}>
                  <strong style={{ fontFamily: 'Nunito, sans-serif', color: 'var(--accent-green)', fontSize: 14 }}>{loc.name}</strong>
                  <br />
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{loc.region}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          <ClickInspector onLocationClick={handleLocationClick} />
          {inspectPoint && (
            <InspectMarker
              lat={inspectPoint.lat}
              lon={inspectPoint.lon}
              data={inspectData}
              onClose={() => setInspectPoint(null)}
            />
          )}
        </MapContainer>
      </motion.div>

      {/* Active layers legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255,255,255,0.9)',
          borderRadius: 20,
          padding: '14px 20px',
          boxShadow: '0 4px 16px rgba(60,120,90,0.06)',
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Active Layers
        </p>
        {LAYERS.filter(l => activeLayers.has(l.id)).map(layer => (
          <div key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: layer.color, fontWeight: 600 }}>
            <span>{layer.icon}</span>
            <span>{layer.label}</span>
          </div>
        ))}
        {activeLayers.size === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No layers selected</p>
        )}
      </motion.div>
    </motion.div>
  );
}