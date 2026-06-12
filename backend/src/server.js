require('dotenv').config();
const express       = require('express');
const http          = require('http');
const { Server }    = require('socket.io');
const cors          = require('cors');
const jwt           = require('jsonwebtoken');
const { connectDb, chats } = require('./config/db');
const { saveMessage, getMessages } = require('./models/chatModel');
const UserModel     = require('./models/userModel');
const CompanionModel = require('./models/companionModel');
const errorHandler  = require('./middlewares/errorHandler');
const { authRouter, weatherRouter, moodRouter, companionRouter, userRouter, placesRouter, reportRouter } = require('./routes/index');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, { cors: { origin: ORIGIN, methods: ['GET','POST'] } });

app.use(cors({ origin: ORIGIN }));
app.use(express.json());

app.use('/api/auth',       authRouter);
app.use('/api/weather',    weatherRouter);
app.use('/api/moods',      moodRouter);
app.use('/api/companions', companionRouter);
app.use('/api/users',      userRouter);
app.use('/api/places',     placesRouter);
app.use('/api/reports',    reportRouter);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Missing token'));
  try { socket.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { next(new Error('Invalid token')); }
});

io.on('connection', socket => {
  const userId = socket.user.id?.toString();
  socket.join(`user:${userId}`);

  socket.on('join_chat', async ({ chatId }) => {
    try {
      // Vérifie que ce chat appartient à cet user via MongoDB
      const req = await CompanionModel.findOne
        ? null
        : null;

      // Cherche dans companion_requests
      const mongoose = require('mongoose');
      const Companion = mongoose.model('Companion');
      const companionReq = await Companion.findOne({
        chat_id: chatId,
        $or: [{ sender_id: userId }, { receiver_id: userId }],
      }).lean();

      if (!companionReq) return socket.emit('error', { message: 'Chat not found' });

      const createdAt  = new Date(companionReq.createdAt);
      const expires_at = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);

      if (expires_at < new Date()) return socket.emit('chat_expired');

      socket.join(`chat:${chatId}`);

      // Charge les messages depuis MongoDB
      const messages = await getMessages(chatId);

      socket.emit('chat_history', {
        messages,
        expires_at: expires_at.toISOString(),
        activity:   companionReq.activity,
      });
    } catch(err) {
      console.error('join_chat error:', err);
      socket.emit('error', { message: 'Error joining chat' });
    }
  });

  socket.on('send_message', async ({ chatId, text }) => {
    try {
      const mongoose   = require('mongoose');
      const Companion  = mongoose.model('Companion');
      const companionReq = await Companion.findOne({
        chat_id: chatId,
        $or: [{ sender_id: userId }, { receiver_id: userId }],
      }).lean();

      if (!companionReq) return;

      const createdAt  = new Date(companionReq.createdAt);
      const expires_at = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
      if (expires_at < new Date()) return socket.emit('chat_expired');
      if (!text?.trim()) return;

      const user = await UserModel.findById(userId);
      const msg  = await saveMessage({
        chat_id:  chatId,
        user_id:  userId,
        username: user?.username || '?',
        text:     text.trim().slice(0, 500),
      });

      io.to(`chat:${chatId}`).emit('new_message', msg);
    } catch(err) {
      console.error('send_message error:', err);
    }
  });
});

app.set('io', io);

connectDb().then(() => {
  server.listen(PORT, () => console.log(`✅ WeatherTime backend running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌ DB connection failed:', err);
  process.exit(1);
});
