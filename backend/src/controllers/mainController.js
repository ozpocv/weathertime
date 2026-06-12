const UserModel     = require('../models/userModel');
const PlacesService = require('../services/placesService');
const mongoose      = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter_id: mongoose.Schema.Types.ObjectId,
  reported_id: mongoose.Schema.Types.ObjectId,
  reason:      String,
}, { timestamps: true });
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

exports.UserController = {
  async getById(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch(e) { next(e); }
  },
  async update(req, res, next) {
    try {
      if (req.params.id.toString() !== req.user.id.toString())
        return res.status(403).json({ error: 'Unauthorized' });
      const allowed = ['username','avatar_url','bio'];
      const fields  = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) fields[k] = req.body[k]; });
      if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nothing to update' });
      res.json(await UserModel.update(req.user.id, fields));
    } catch(e) { next(e); }
  },
  async delete(req, res, next) {
    try {
      if (req.params.id.toString() !== req.user.id.toString())
        return res.status(403).json({ error: 'Unauthorized' });
      await UserModel.delete(req.user.id);
      res.json({ message: 'Account deleted' });
    } catch(e) { next(e); }
  },
  async report(req, res, next) {
    try {
      const { reported_id, reason } = req.body;
      if (!reported_id||!reason) return res.status(400).json({ error: 'Missing fields' });
      await Report.create({ reporter_id: req.user.id, reported_id, reason });
      res.status(201).json({ message: 'Report submitted' });
    } catch(e) { next(e); }
  },
};

exports.PlacesController = {
  async getNearby(req, res, next) {
    try {
      const { lat, lng, type } = req.query;
      if (!lat||!lng||!type) return res.status(400).json({ error: 'lat, lng and type required' });
      res.json(await PlacesService.getNearby({ lat: parseFloat(lat), lng: parseFloat(lng), type }));
    } catch(e) { next(e); }
  },
};
