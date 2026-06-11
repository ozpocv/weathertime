module.exports = {
  async getNearby({ lat, lng, type }) {
    const url = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(type)}&filter=circle:${lng},${lat},8000&limit=10&apiKey=${process.env.GEOAPIFY_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error('Places error');
    return (data.features || []).map(f => ({
      name: f.properties?.name || 'Place',
      address: f.properties?.formatted || '',
      lat: f.geometry?.coordinates?.[1],
      lng: f.geometry?.coordinates?.[0],
    }));
  },
};
