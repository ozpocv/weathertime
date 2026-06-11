const { query, run, get } = require('../config/db');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLng = (lng2 - lng1) * d2r;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

module.exports = {
  create({ user_id, mood, activity, status, lat, lng, expires_at }) {
    run('DELETE FROM moods WHERE user_id = ?', [user_id]);
    const id = run(
      'INSERT INTO moods (user_id,mood,activity,status,lat,lng,expires_at) VALUES (?,?,?,?,?,?,?)',
      [user_id, mood, activity, status, lat, lng, expires_at]
    );
    return get('SELECT * FROM moods WHERE id = ?', [id]);
  },

  findNearby({ lat, lng, radiusKm = 5, excludeUserId }) {
    const now  = new Date().toISOString();
    const rows = query(
      `SELECT m.*, u.username, u.avatar_url
       FROM moods m JOIN users u ON u.id = m.user_id
       WHERE m.expires_at > ? AND m.user_id != ?`,
      [now, excludeUserId]
    );
    return rows
      .map(m => ({ ...m, distance_km: haversine(lat, lng, m.lat, m.lng) }))
      .filter(m => m.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 20);
  },

  findByUser(user_id) {
    const now = new Date().toISOString();
    return get('SELECT * FROM moods WHERE user_id = ? AND expires_at > ?', [user_id, now]);
  },

  delete(id, user_id) {
    const before = query('SELECT id FROM moods WHERE id = ? AND user_id = ?', [id, user_id]);
    if (!before.length) return false;
    run('DELETE FROM moods WHERE id = ? AND user_id = ?', [id, user_id]);
    return true;
  },
};
