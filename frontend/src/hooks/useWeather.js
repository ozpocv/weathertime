import { useState, useCallback } from 'react';
import { api } from '../services/api';

export function useWeather() {
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState(null);
  const [hourly,   setHourly]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchWeather = useCallback(async ({ city, lat, lon }) => {
    setLoading(true); setError(null);
    try {
      const w = city
        ? await api.weatherByCity(city)
        : await api.weatherByCoords(lat, lon);
      setWeather(w);

      const coordLat = w.coord?.lat ?? lat;
      const coordLon = w.coord?.lon ?? lon;
      const [f, h] = await Promise.allSettled([
        api.forecast7day(coordLat, coordLon),
        api.hourly(coordLat, coordLon),
      ]);
      if (f.status === 'fulfilled') setForecast(f.value);
      if (h.status === 'fulfilled') setHourly(h.value);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const geolocate = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => fetchWeather({ lat: coords.latitude, lon: coords.longitude }),
      () => setError('Unable to get your location')
    );
  }, [fetchWeather]);

  return { weather, forecast, hourly, loading, error, fetchWeather, geolocate };
}
