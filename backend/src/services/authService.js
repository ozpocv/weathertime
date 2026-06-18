const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/userModel');

module.exports = {
  async register({ username, email, password }) {
    if (await UserModel.findByEmail(email)) {
      const e = new Error('Email already in use'); e.status = 409; throw e;
    }
    if (await UserModel.findByUsername(username)) {
      const e = new Error('Username already taken'); e.status = 409; throw e;
    }
    const password_hash = await bcrypt.hash(password, 12);
    const user  = await UserModel.create({ username, email, password_hash });
    if (!user) { const e = new Error('Failed to create user'); e.status = 500; throw e; }

    const userId = user._id?.toString() || user.id?.toString();
    const token  = jwt.sign(
      { id: userId, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return { user, token };
  },

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) { const e = new Error('Invalid email or password'); e.status = 401; throw e; }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { const e = new Error('Invalid email or password'); e.status = 401; throw e; }

    const userId = user._id?.toString() || user.id?.toString();
    const token  = jwt.sign(
      { id: userId, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    const { password_hash, ...safe } = user;
    return { user: { ...safe, id: userId }, token };
  },
};
