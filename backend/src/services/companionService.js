const CompanionModel = require('../models/companionModel');
const MoodModel      = require('../models/moodModel');
const UserModel      = require('../models/userModel');
const { chats }      = require('../config/db');
const crypto         = require('crypto');

const COMPAT = {
  happy:  ['happy','chill','sporty'],
  chill:  ['chill','happy','tired'],
  tired:  ['tired','chill'],
  sporty: ['sporty','happy'],
};
const ACTS = {
  'happy-happy':  'Grab a drink together',
  'happy-chill':  'Find a cozy café',
  'happy-sporty': 'Go for a run',
  'chill-chill':  'Visit a museum',
  'chill-tired':  'Sit in a quiet café',
  'tired-tired':  'Find a spa',
  'sporty-sporty':'Hit the gym together',
};

function commonActivity(mA, mB) {
  return ACTS[`${mA}-${mB}`] || ACTS[`${mB}-${mA}`] || 'Meet for a coffee';
}

module.exports = {
  async findCompatible({ user_id, lat, lng, radiusKm = 5, index = 0 }) {
    const myMood = await MoodModel.findByUser(user_id);
    if (!myMood) return null;

    const nearby     = await MoodModel.findNearby({ lat, lng, radiusKm, excludeUserId: user_id });
    const compatible = COMPAT[myMood.mood] || [];
    const pending    = await CompanionModel.findPendingForUser(user_id);
    const pendingIds = new Set(pending.map(r => r.sender_id?.toString()));

    const candidates = nearby.filter(m =>
      compatible.includes(m.mood) && !pendingIds.has(m.user_id?.toString())
    );

    if (!candidates.length) return null;

    const safeIndex = index % candidates.length;
    const c         = candidates[safeIndex];
    const cUser     = await UserModel.findById(c.user_id);

    return {
      user_id:            c.user_id,
      username:           c.username,
      bio:                cUser?.bio || null,
      mood:               c.mood,
      activity:           c.activity,
      distance_km:        Math.round(c.distance_km * 10) / 10,
      suggested_activity: commonActivity(myMood.mood, c.mood),
      index:              safeIndex,
      total:              candidates.length,
    };
  },

  async sendRequest({ sender_id, receiver_id, activity, mood }) {
    const req = await CompanionModel.create({ sender_id, receiver_id, activity, mood });
    if (!req) { const e = new Error('Request already exists'); e.status = 409; throw e; }
    return req;
  },

  async getPending(user_id) { return CompanionModel.findPendingForUser(user_id); },

  async accept(request_id, user_id) {
    const req = await CompanionModel.findById(request_id);
    if (!req) { const e = new Error('Request not found'); e.status = 404; throw e; }
    if (req.receiver_id?.toString() !== user_id?.toString()) {
      const e = new Error('Unauthorized'); e.status = 403; throw e;
    }
    const chatId     = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    chats[chatId] = {
      id: chatId,
      user_a_id:  req.sender_id?.toString(),
      user_b_id:  req.receiver_id?.toString(),
      expires_at,
      activity:   req.activity,
    };
    return CompanionModel.updateStatus(request_id, 'accepted', chatId);
  },

  async decline(request_id, user_id) {
    const req = await CompanionModel.findById(request_id);
    if (!req || req.receiver_id?.toString() !== user_id?.toString()) {
      const e = new Error('Unauthorized'); e.status = 403; throw e;
    }
    return CompanionModel.updateStatus(request_id, 'declined');
  },

  getChat(chat_id, user_id) {
    const chat = chats[chat_id];
    if (!chat) { const e = new Error('Chat not found'); e.status = 404; throw e; }
    const uid = user_id?.toString();
    if (chat.user_a_id !== uid && chat.user_b_id !== uid) {
      const e = new Error('Unauthorized'); e.status = 403; throw e;
    }
    if (new Date(chat.expires_at) < new Date()) {
      const e = new Error('Chat expired'); e.status = 410; throw e;
    }
    return chat;
  },
};
