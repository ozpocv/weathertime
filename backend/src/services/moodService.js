const MoodModel = require('../models/moodModel');

module.exports = {
  async publish({ user_id, username, mood, activity, status, lat, lng }) {
    const roundedLat = Math.round(lat * 200) / 200;
    const roundedLng = Math.round(lng * 200) / 200;
    const expires_at = new Date(Date.now() + 4 * 60 * 60 * 1000);
    return MoodModel.create({ user_id, username, mood, activity, status, lat: roundedLat, lng: roundedLng, expires_at });
  },
  async getNearby({ lat, lng, radiusKm, excludeUserId }) {
    const rows = await MoodModel.findNearby({ lat, lng, radiusKm, excludeUserId });
    return rows.map(r => ({
      id: r._id || r.id, user_id: r.user_id, username: r.username,
      mood: r.mood, activity: r.activity, status: r.status,
      distance_km: Math.round(r.distance_km * 10) / 10,
    }));
  },
  async getMyMood(user_id) { return MoodModel.findByUser(user_id); },
  async delete(id, user_id) {
    const deleted = await MoodModel.delete(id, user_id);
    if (!deleted) { const e = new Error('Mood not found'); e.status = 404; throw e; }
  },
};
