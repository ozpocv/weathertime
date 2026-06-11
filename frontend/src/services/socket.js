import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  const url = import.meta.env.VITE_API_URL || '/';

  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  socket.on('connect',       () => console.log('🔌 Socket connecté'));
  socket.on('disconnect',    () => console.log('🔌 Socket déconnecté'));
  socket.on('connect_error', () => setTimeout(() => socket.connect(), 3000));

  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}