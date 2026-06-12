const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true },
  email:         { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  avatar_url:    { type: String, default: null },
  bio:           { type: String, default: null },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = {
  async findByEmail(email)       { return User.findOne({ email }).lean(); },
  async findByUsername(username) { return User.findOne({ username }).lean(); },
  async findById(id) {
    const u = await User.findById(id).lean();
    if (!u) return null;
    const { password_hash, __v, ...safe } = u;
    safe.id = safe._id;
    return safe;
  },
  async create({ username, email, password_hash }) {
    const user = await User.create({ username, email, password_hash });
    const obj  = user.toObject();
    const { password_hash: _, __v, ...safe } = obj;
    safe.id = safe._id;
    return safe;
  },
  async update(id, fields) {
    const user = await User.findByIdAndUpdate(id, fields, { new: true }).lean();
    if (!user) return null;
    const { password_hash, __v, ...safe } = user;
    safe.id = safe._id;
    return safe;
  },
  async delete(id) { await User.findByIdAndDelete(id); },
};
