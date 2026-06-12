const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:   { type: String },
  mood:       { type: String, enum: ['happy','chill','tired','sporty'], required: true },
  activity:   { type: String, required: true },
  status:     { type: String, enum: ['open','quiet'], required: true },
  lat:        { type: Number, required: true },
  lng:        { type: Number, required: true },
  expires_at: { type: Date, required: true },
}, { timestamps: true });

const Mood = mongoose.model('Mood', moodSchema);

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLng = (lng2 - lng1) * d2r;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

module.exports = {
  async create({ user_id, username, mood, activity, status, lat, lng, expires_at }) {
    await Mood.deleteMany({ user_id });
    const m = await Mood.create({ user_id, username, mood, activity, status, lat, lng, expires_at });
    return m.toObject();
  },

  async findNearby({ lat, lng, radiusKm = 5, excludeUserId }) {
    const rows = await Mood.find({
      expires_at: { $gt: new Date() },
      user_id:    { $ne: excludeUserId },
    }).lean();

    return rows
      .map(m => ({ ...m, id: m._id, distance_km: haversine(lat, lng, m.lat, m.lng) }))
      .filter(m => m.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 20);
  },

  async findByUser(user_id) {
    return Mood.findOne({ user_id, expires_at: { $gt: new Date() } }).lean();
  },

  async delete(id, user_id) {
    const res = await Mood.findOneAndDelete({ _id: id, user_id });
    return !!res;
  },
};
