const mongoose = require('mongoose');

const companionSchema = new mongoose.Schema({
  sender_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity:    { type: String, required: true },
  mood:        { type: String, required: true },
  status:      { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
  chat_id:     { type: String, default: null },
}, { timestamps: true });

const Companion = mongoose.model('Companion', companionSchema);

module.exports = {
  async create({ sender_id, receiver_id, activity, mood }) {
    const existing = await Companion.findOne({
      $or: [
        { sender_id, receiver_id },
        { sender_id: receiver_id, receiver_id: sender_id },
      ],
      status: 'pending',
    });
    if (existing) return null;

    const req = await Companion.create({ sender_id, receiver_id, activity, mood });
    return req.toObject();
  },

  async findById(id) {
    return Companion.findById(id).lean();
  },

  async findPendingForUser(user_id) {
    const reqs = await Companion.find({ receiver_id: user_id, status: 'pending' })
      .populate('sender_id', 'username bio')
      .lean();
    return reqs.map(r => ({
      ...r,
      id:              r._id,
      sender_username: r.sender_id?.username,
      sender_bio:      r.sender_id?.bio || null,
      sender_id:       r.sender_id?._id,
    }));
  },

  async updateStatus(id, status, chat_id = null) {
    return Companion.findByIdAndUpdate(id, { status, chat_id }, { new: true }).lean();
  },
};
