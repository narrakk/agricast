import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Hook for fetching weather data and advice for a specific location.
 */
export function useWeather(lat, lon) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!lat || !lon) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.get(`/api/weather/advice?lat=${lat}&lon=${lon}`);
      
      // Basic validation: advice and weather should exist
      if (!res.data || !res.data.advice || !res.data.weather) {
        throw new Error('Incomplete weather data received');
      }
      
      setData(res.data);
    } catch (err) {
      console.error('[Weather Hook Error]', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch weather');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { data, loading, error, refresh: fetchWeather };
}

/**
 * Hook for fetching all saved farm locations.
 */
export function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/api/weather/locations')
      .then(res => {
        // Handle Supabase structure { value, Count } or array fallback
        const locData = res.data.value || res.data;
        if (Array.isArray(locData)) {
          setLocations(locData);
        } else {
          setLocations([]);
        }
      })
      .catch(err => {
        console.error('[Locations Hook Error]', err);
        setError('Failed to load locations');
      })
      .finally(() => setLoading(false));
  }, []);

  return { locations, loading, error };
}
