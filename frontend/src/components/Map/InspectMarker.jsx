import React, { useEffect, useRef } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/**
 * Click inspector component captures map clicks.
 */
export function ClickInspector({ onLocationClick }) {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

/**
 * Custom marker and popup for inspecting a specific location on the map.
 */
export function InspectMarker({ lat, lon, data, onClose }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], map.getZoom(), { animate: true });
    }
  }, [lat, lon, map]);

  if (!lat || !lon || !data) return null;

  // Custom icon for the inspection point
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>🌡️ Temp</span>
            <strong style={{ color: 'var(--text-primary)' }}>{Math.round(data.current_weather?.temperature)}°C</strong>
            
            <span style={{ color: 'var(--text-secondary)' }}>💨 Wind</span>
            <strong style={{ color: 'var(--text-primary)' }}>{data.current_weather?.windspeed} km/h</strong>
            
            <span style={{ color: 'var(--text-secondary)' }}>🌧 Rain</span>
            <strong style={{ color: 'var(--text-primary)' }}>{data.daily?.precipitation_probability_max?.[0]}%</strong>
            
            <span style={{ color: 'var(--text-secondary)' }}>💧 Humidity</span>
            <strong style={{ color: 'var(--text-primary)' }}>{data.hourly?.relativehumidity_2m?.[0]}%</strong>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
