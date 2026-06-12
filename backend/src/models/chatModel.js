const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat_id:  { type: String, required: true, index: true },
  user_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  text:     { type: String, required: true },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = {
  async saveMessage({ chat_id, user_id, username, text }) {
    const msg = await Message.create({ chat_id, user_id, username, text });
    return {
      id:         msg._id,
      chat_id:    msg.chat_id,
      user_id:    msg.user_id,
      username:   msg.username,
      text:       msg.text,
      created_at: msg.createdAt.toISOString(),
    };
  },

  async getMessages(chat_id) {
    const msgs = await Message.find({ chat_id }).sort({ createdAt: 1 }).lean();
    return msgs.map(m => ({
      id:         m._id,
      chat_id:    m.chat_id,
      user_id:    m.user_id,
      username:   m.username,
      text:       m.text,
      created_at: m.createdAt?.toISOString(),
    }));
  },
};
