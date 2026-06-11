const MoodService = require('../services/moodService');
module.exports = {
  async publish(req, res, next) {
    try {
      const { mood, activity, status, lat, lng } = req.body;
      if (!mood||!activity||!status||lat==null||lng==null) return res.status(400).json({ error: 'All fields required' });
      res.status(201).json(MoodService.publish({ user_id: req.user.id, mood, activity, status, lat: parseFloat(lat), lng: parseFloat(lng) }));
    } catch(e) { next(e); }
  },
  async getNearby(req, res, next) {
    try {
      const { lat, lng, radius } = req.query;
      if (!lat||!lng) return res.status(400).json({ error: 'lat and lng required' });
      res.json(MoodService.getNearby({ lat: parseFloat(lat), lng: parseFloat(lng), radiusKm: radius ? parseFloat(radius) : 5, excludeUserId: req.user.id }));
    } catch(e) { next(e); }
  },
  async getMyMood(req, res, next) { try { res.json(MoodService.getMyMood(req.user.id) || null); } catch(e) { next(e); } },
  async delete(req, res, next) {
    try { MoodService.delete(req.params.id, req.user.id); res.json({ message: 'Mood removed' }); }
    catch(e) { next(e); }
  },
};
