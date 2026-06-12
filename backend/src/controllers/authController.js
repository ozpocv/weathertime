const AuthService = require('../services/authService');
const UserModel   = require('../models/userModel');

exports.AuthController = {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      if (!username||!email||!password) return res.status(400).json({ error: 'All fields required' });
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      const { user, token } = await AuthService.register({ username, email, password });
      res.status(201).json({ user, token });
    } catch(e) { next(e); }
  },
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email||!password) return res.status(400).json({ error: 'Email and password required' });
      const { user, token } = await AuthService.login({ email, password });
      res.json({ user, token });
    } catch(e) { next(e); }
  },
  logout(req, res) { res.json({ message: 'Signed out' }); },
  async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    } catch(e) { next(e); }
  },
};
