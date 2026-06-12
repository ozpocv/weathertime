import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  const url = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}