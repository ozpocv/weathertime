const MoodModel = require('../models/moodModel');

module.exports = {
  publish({ user_id, mood, activity, status, lat, lng }) {
    const roundedLat = Math.round(lat * 200) / 200;
    const roundedLng = Math.round(lng * 200) / 200;
    const expires_at = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    return MoodModel.create({ user_id, mood, activity, status, lat: roundedLat, lng: roundedLng, expires_at });
  },
  getNearby({ lat, lng, radiusKm, excludeUserId }) {
    return MoodModel.findNearby({ lat, lng, radiusKm, excludeUserId }).map(r => ({
      id: r.id, user_id: r.user_id, username: r.username, avatar_url: r.avatar_url,
      mood: r.mood, activity: r.activity, status: r.status,
      distance_km: Math.round(r.distance_km * 10) / 10,
    }));
  },
  getMyMood: user_id => MoodModel.findByUser(user_id),
  delete(id, user_id) {
    if (!MoodModel.delete(id, user_id)) { const e = new Error('Mood not found'); e.status = 404; throw e; }
  },
};
