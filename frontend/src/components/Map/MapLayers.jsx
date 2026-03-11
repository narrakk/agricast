import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Wind velocity layer component using leaflet-velocity.
 */
export function WindLayer({ data }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    // Only proceed if window.L.velocityLayer is available (loaded via script)
    if (!data || !window.L?.velocityLayer) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    try {
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
    } catch (err) {
      console.error('[WindLayer Error]', err);
    }

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [data, map]);

  return null;
}

/**
 * Heatmap layer component using leaflet.heat.
 */
export function HeatLayer({ data, gradient }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    // Only proceed if window.L.heatLayer is available (loaded via script)
    if (!data || !window.L?.heatLayer) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    try {
      // Normalize values to 0–1 range for heat intensity if needed
      const values = data.map(p => p[2]);
      const min = Math.min(...values);
      const max = Math.max(...values) || 1;

      const normalized = data.map(([lat, lon, val]) => [
        lat, lon, (val - min) / (max - min)
      ]);

      layerRef.current = L.heatLayer(normalized, {
        radius: 80,
        blur: 60,
        maxZoom: 10,
        gradient: gradient || { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
        max: 1.0,
        minOpacity: 0.35
      });

      map.addLayer(layerRef.current);
    } catch (err) {
      console.error('[HeatLayer Error]', err);
    }

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [data, gradient, map]);

  return null;
}
