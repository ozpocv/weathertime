const CompanionService = require('../services/companionService');

module.exports = {
  async findCompatible(req, res, next) {
    try {
      const { lat, lng, radius, index } = req.query;
      if (!lat||!lng) return res.status(400).json({ error: 'lat and lng required' });
      res.json(await CompanionService.findCompatible({
        user_id: req.user.id, lat: parseFloat(lat), lng: parseFloat(lng),
        radiusKm: radius ? parseFloat(radius) : 5,
        index:    index  ? parseInt(index)    : 0,
      }));
    } catch(e) { next(e); }
  },

  async getPending(req, res, next) {
    try { res.json(await CompanionService.getPending(req.user.id)); }
    catch(e) { next(e); }
  },

  async send(req, res, next) {
    try {
      const { receiver_id, activity, mood } = req.body;
      if (!receiver_id||!activity||!mood)
        return res.status(400).json({ error: 'Missing fields' });

      const result = await CompanionService.sendRequest({
        sender_id: req.user.id, receiver_id, activity, mood
      });

      const io = req.app.get('io');
      if (io) {
        // Notifie le receiver — convertit en string pour matcher la room Socket.io
        const receiverRoom = `user:${receiver_id.toString()}`;
        console.log(`📨 Emitting companion_request to ${receiverRoom}`);
        io.to(receiverRoom).emit('companion_request', {
          ...result,
          id:              result._id?.toString() || result.id,
          sender_id:       result.sender_id?.toString(),
          receiver_id:     result.receiver_id?.toString(),
          sender_username: req.user.username,
        });
      }

      res.status(201).json(result);
    } catch(e) { next(e); }
  },

  async accept(req, res, next) {
    try {
      const result = await CompanionService.accept(req.params.id, req.user.id);

      const io = req.app.get('io');
      if (io && result?.chat_id) {
        const senderRoom = `user:${result.sender_id?.toString()}`;
        console.log(`✅ Emitting companion_accepted to ${senderRoom}, chat: ${result.chat_id}`);
        io.to(senderRoom).emit('companion_accepted', {
          chat_id:      result.chat_id,
          activity:     result.activity,
          partner_name: req.user.username,
        });
      }

      res.json(result);
    } catch(e) { next(e); }
  },

  async decline(req, res, next) {
    try { res.json(await CompanionService.decline(req.params.id, req.user.id)); }
    catch(e) { next(e); }
  },

  async getChat(req, res, next) {
    try { res.json(CompanionService.getChat(req.params.chatId, req.user.id)); }
    catch(e) { next(e); }
  },
};
