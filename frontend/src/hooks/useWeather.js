import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useWeather(lat, lon) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;
    setLoading(true);
    api.get(`/api/weather/advice?lat=${lat}&lon=${lon}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [lat, lon]);

  return { data, loading, error };
}

export function useLocations() {
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    api.get('/api/weather/locations').then(res => {
      // Handle the Supabase response structure { value, Count } or array
      const locData = res.data.value || res.data;
      setLocations(Array.isArray(locData) ? locData : []);
    });
  }, []);
  return locations;
}