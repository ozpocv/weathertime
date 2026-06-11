require('dotenv').config();
const express       = require('express');
const http          = require('http');
const { Server }    = require('socket.io');
const cors          = require('cors');
const jwt           = require('jsonwebtoken');
const { initDb, get, chats } = require('./config/db');
const errorHandler  = require('./middlewares/errorHandler');
const {
  authRouter, weatherRouter, moodRouter,
  companionRouter, userRouter, placesRouter, reportRouter
} = require('./routes/index');

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
  const userId = socket.user.id;
  socket.join(`user:${userId}`);

  socket.on('join_chat', ({ chatId }) => {
    const chat = chats[chatId];
    if (!chat) return socket.emit('error', { message: 'Chat not found' });
    if (chat.user_a_id !== userId && chat.user_b_id !== userId)
      return socket.emit('error', { message: 'Unauthorized' });
    if (new Date(chat.expires_at) < new Date()) return socket.emit('chat_expired');
    socket.join(`chat:${chatId}`);
    socket.emit('chat_history', { messages: chat.messages, expires_at: chat.expires_at, activity: chat.activity });
  });

  socket.on('send_message', ({ chatId, text }) => {
    const chat = chats[chatId];
    if (!chat || (chat.user_a_id !== userId && chat.user_b_id !== userId)) return;
    if (new Date(chat.expires_at) < new Date()) return socket.emit('chat_expired');
    if (!text?.trim()) return;
    const user = get('SELECT username FROM users WHERE id = ?', [userId]);
    const msg  = { id: Date.now(), user_id: userId, username: user?.username || '?', text: text.trim().slice(0, 500), created_at: new Date().toISOString() };
    chat.messages.push(msg);
    io.to(`chat:${chatId}`).emit('new_message', msg);
  });
});

app.set('io', io);

// Démarrage — initialiser la BDD avant de lancer le serveur
initDb().then(() => {
  server.listen(PORT, () => console.log(`✅ WeatherTime backend running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌ DB init failed:', err);
  process.exit(1);
});
