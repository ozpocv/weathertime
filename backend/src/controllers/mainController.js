const UserModel     = require('../models/userModel');
const PlacesService = require('../services/placesService');
const { run }       = require('../config/db');

exports.UserController = {
  getById(req, res, next) {
    try {
      const user = UserModel.findById(parseInt(req.params.id));
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch(e) { next(e); }
  },
  update(req, res, next) {
    try {
      if (parseInt(req.params.id) !== req.user.id)
        return res.status(403).json({ error: 'Unauthorized' });
      const allowed = ['username','avatar_url','bio'];
      const fields  = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) fields[k] = req.body[k]; });
      if (!Object.keys(fields).length)
        return res.status(400).json({ error: 'Nothing to update' });
      res.json(UserModel.update(req.user.id, fields));
    } catch(e) { next(e); }
  },
  delete(req, res, next) {
    try {
      if (parseInt(req.params.id) !== req.user.id)
        return res.status(403).json({ error: 'Unauthorized' });
      UserModel.delete(req.user.id);
      res.json({ message: 'Account deleted' });
    } catch(e) { next(e); }
  },
  report(req, res, next) {
    try {
      const { reported_id, reason } = req.body;
      if (!reported_id || !reason)
        return res.status(400).json({ error: 'Missing fields' });
      run('INSERT INTO reports (reporter_id,reported_id,reason) VALUES (?,?,?)',
        [req.user.id, reported_id, reason]);
      res.status(201).json({ message: 'Report submitted' });
    } catch(e) { next(e); }
  },
};

exports.PlacesController = {
  async getNearby(req, res, next) {
    try {
      const { lat, lng, type } = req.query;
      if (!lat||!lng||!type)
        return res.status(400).json({ error: 'lat, lng and type required' });
      res.json(await PlacesService.getNearby({
        lat: parseFloat(lat), lng: parseFloat(lng), type
      }));
    } catch(e) { next(e); }
  },
};
