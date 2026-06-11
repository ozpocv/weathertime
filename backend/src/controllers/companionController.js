const CompanionService = require('../services/companionService');

module.exports = {
  findCompatible(req, res, next) {
    try {
      const { lat, lng, radius, index } = req.query;
      if (!lat||!lng) return res.status(400).json({ error: 'lat and lng required' });
      res.json(CompanionService.findCompatible({
        user_id:  req.user.id,
        lat:      parseFloat(lat),
        lng:      parseFloat(lng),
        radiusKm: radius ? parseFloat(radius) : 5,
        index:    index  ? parseInt(index)    : 0,
      }));
    } catch(e) { next(e); }
  },

  getPending(req, res, next) {
    try { res.json(CompanionService.getPending(req.user.id)); }
    catch(e) { next(e); }
  },

  send(req, res, next) {
    try {
      const { receiver_id, activity, mood } = req.body;
      if (!receiver_id||!activity||!mood)
        return res.status(400).json({ error: 'Missing fields' });

      const result = CompanionService.sendRequest({
        sender_id:   req.user.id,
        receiver_id: parseInt(receiver_id),
        activity,
        mood,
      });

      // Notifie le receiver en temps réel
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${receiver_id}`).emit('companion_request', {
          ...result,
          sender_username: req.user.username,
        });
      }

      res.status(201).json(result);
    } catch(e) { next(e); }
  },

  accept(req, res, next) {
    try {
      const result = CompanionService.accept(req.params.id, req.user.id);

      // Notifie le sender que sa demande a été acceptée → ouvre le chat
      const io = req.app.get('io');
      if (io && result.chat_id) {
        io.to(`user:${result.sender_id}`).emit('companion_accepted', {
          chat_id:      result.chat_id,
          activity:     result.activity,
          partner_name: req.user.username,
        });
      }

      res.json(result);
    } catch(e) { next(e); }
  },

  decline(req, res, next) {
    try { res.json(CompanionService.decline(req.params.id, req.user.id)); }
    catch(e) { next(e); }
  },

  getChat(req, res, next) {
    try { res.json(CompanionService.getChat(req.params.chatId, req.user.id)); }
    catch(e) { next(e); }
  },
};
