const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const UserModel = require('../models/userModel');

module.exports = {
  async register({ username, email, password }) {
    if (UserModel.findByEmail(email))    { const e = new Error('Email already in use');    e.status = 409; throw e; }
    if (UserModel.findByUsername(username)) { const e = new Error('Username already taken'); e.status = 409; throw e; }
    const password_hash = await bcrypt.hash(password, 12);
    const user  = UserModel.create({ username, email, password_hash });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return { user, token };
  },
  async login({ email, password }) {
    const user = UserModel.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const e = new Error('Invalid email or password'); e.status = 401; throw e;
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    const { password_hash, ...safe } = user;
    return { user: safe, token };
  },
};
