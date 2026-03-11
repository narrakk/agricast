import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../utils/api';
import { motion } from 'framer-motion';

// Refactored components
import { WindLayer, HeatLayer } from '../components/Map/MapLayers';
import { ClickInspector, InspectMarker } from '../components/Map/InspectMarker';

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

/**
 * Main Map Page with interactive weather layers.
 */
export default function MapPage() {
  const [activeLayers, setActiveLayers] = useState(new Set(['temperature']));
  const [layerData, setLayerData] = useState({});
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  const [locations, setLocations] = useState([]);
  const [inspectPoint, setInspectPoint] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({ velocity: false, heat: false });

  // ─── Script Loading ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadScript = (id, src, callback) => {
      if (document.getElementById(id)) {
        callback();
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.onload = callback;
      document.head.appendChild(script);
    };

    loadScript('leaflet-velocity-js', 'https://cdn.jsdelivr.net/npm/leaflet-velocity@2.1.4/dist/leaflet-velocity.min.js', () => {
      setScriptsLoaded(prev => ({ ...prev, velocity: true }));
    });

    loadScript('leaflet-heat-js', 'https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js', () => {
      setScriptsLoaded(prev => ({ ...prev, heat: true }));
    });
  }, []);

  // ─── Data Loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/api/weather/locations')
      .then(r => setLocations(r.data.value || r.data))
      .catch(err => console.error('Failed to load map locations', err));
  }, []);

  const toggleLayer = useCallback(async (layerId) => {
    const isCurrentlyActive = activeLayers.has(layerId);
    
    // Toggle activation state immediately
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (isCurrentlyActive) next.delete(layerId);
      else next.add(layerId);
      return next;
    });

    // If activating and data isn't loaded yet
    if (!isCurrentlyActive && !layerData[layerId]) {
      const layerConfig = LAYERS.find(l => l.id === layerId);
      setLoadingLayers(prev => new Set([...prev, layerId]));
      
      try {
        const { data } = await api.get(layerConfig.endpoint);
        setLayerData(prev => ({ ...prev, [layerId]: data.value || data }));
      } catch (err) {
        console.error(`Failed to load layer: ${layerId}`, err);
        // Remove from active if load failed
        setActiveLayers(prev => {
          const next = new Set(prev);
          next.delete(layerId);
          return next;
        });
      } finally {
        setLoadingLayers(prev => {
          const next = new Set(prev);
          next.delete(layerId);
          return next;
        });
      }
    }
  }, [activeLayers, layerData]);

  // Initial load
  useEffect(() => {
    if (activeLayers.has('temperature') && !layerData['temperature']) {
      toggleLayer('temperature');
    }
  }, [toggleLayer, activeLayers, layerData]);

  // ─── Click Inspector ──────────────────────────────────────────────────────
  const handleLocationClick = useCallback(async (lat, lon) => {
    setInspectPoint({ lat, lon });
    setInspectData(null);
    try {
      const { data } = await api.get(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
      setInspectData(data);
    } catch (e) {
      console.error('Inspection failed', e);
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-sm font-medium text-text-secondary">
          Click anywhere on the map to inspect live weather at that exact point
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-2"
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
                className="inline-block text-[10px]"
              >⏳</motion.span>
            )}
            {activeLayers.has(layer.id) && !loadingLayers.has(layer.id) && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: layer.color }} />
            )}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="h-[520px] rounded-[28px] overflow-hidden shadow-card border-2 border-white/90"
      >
        <MapContainer
          center={[-0.5, 37.5]}
          zoom={6}
          className="h-full w-full"
        >
          <TileLayer
            attribution='© OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {LAYERS.filter(l => activeLayers.has(l.id) && layerData[l.id]).map(layer => {
            if (layer.type === 'velocity' && scriptsLoaded.velocity) {
              return <WindLayer key={layer.id} data={layerData[layer.id]} />;
            }
            if (layer.type === 'heat' && scriptsLoaded.heat) {
              return <HeatLayer key={layer.id} data={layerData[layer.id]} gradient={layer.gradient} />;
            }
            return null;
          })}

          {locations.map(loc => (
            <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <div className="font-body text-sm">
                  <strong className="font-display text-accent-green text-base">{loc.name}</strong>
                  <br />
                  <span className="text-text-muted text-xs">{loc.region}</span>
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4 flex items-center gap-5 flex-wrap"
      >
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
          Active Layers
        </p>
        {LAYERS.filter(l => activeLayers.has(l.id)).map(layer => (
          <div key={layer.id} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: layer.color }}>
            <span>{layer.icon}</span>
            <span>{layer.label}</span>
          </div>
        ))}
        {activeLayers.size === 0 && (
          <p className="text-xs text-text-muted">No layers selected</p>
        )}
      </motion.div>
    </motion.div>
  );
}
