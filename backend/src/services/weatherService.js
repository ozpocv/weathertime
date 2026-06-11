module.exports = {
  async getByCity(city) {
    const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=en&appid=${process.env.OPENWEATHER_API_KEY}`);
    const data = await res.json();
    if (!res.ok) { const e = new Error(data.message || 'City not found'); e.status = res.status; throw e; }
    return data;
  },
  async getByCoords(lat, lon) {
    const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=${process.env.OPENWEATHER_API_KEY}`);
    const data = await res.json();
    if (!res.ok) { const e = new Error(data.message || 'Error'); e.status = res.status; throw e; }
    return data;
  },
  async getHourly(lat, lon) {
    const p   = new URLSearchParams({ latitude:lat, longitude:lon, hourly:'temperature_2m,weather_code,precipitation_probability', timezone:'auto', forecast_days:'2' });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`);
    if (!res.ok) throw new Error('Hourly forecast error');
    return res.json();
  },
  async get7Day(lat, lon) {
    const p   = new URLSearchParams({ latitude:lat, longitude:lon, daily:'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset', timezone:'auto', forecast_days:'7' });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`);
    if (!res.ok) throw new Error('7-day forecast error');
    return res.json();
  },
  async getQuote() {
    const FALLBACK = [
      { q: "Imagination is more important than knowledge.", a: "Albert Einstein" },
      { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
      { q: "Be the change you wish to see in the world.", a: "Mahatma Gandhi" },
      { q: "In the middle of difficulty lies opportunity.", a: "Albert Einstein" },
    ];
    try {
      const res = await fetch('https://zenquotes.io/api/random');
      if (!res.ok) throw new Error();
      const data = await res.json();
      return { q: data[0].q, a: data[0].a };
    } catch {
      return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    }
  },
  async getHistory() {
    const today = new Date();
    const res   = await fetch(`https://api.api-ninjas.com/v1/historicalevents?month=${today.getMonth()+1}&day=${today.getDate()}`, { headers: { 'X-Api-Key': process.env.HISTORY_API_KEY } });
    const data  = await res.json();
    if (!res.ok) throw new Error('History error');
    return Array.isArray(data) && data.length ? data[Math.floor(Math.random() * data.length)] : { event: 'No event found', year: '' };
  },
};
