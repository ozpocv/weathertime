import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wt_token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(({ user }) => { setUser(user); connectSocket(token); })
      .catch(() => localStorage.removeItem('wt_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user, token } = await api.login({ email, password });
    localStorage.setItem('wt_token', token);
    setUser(user);
    connectSocket(token);
    return user;
  }

  async function register(username, email, password) {
    const { user, token } = await api.register({ username, email, password });
    localStorage.setItem('wt_token', token);
    setUser(user);
    connectSocket(token);
    return user;
  }

  async function logout() {
    try { await api.logout(); } catch {}
    localStorage.removeItem('wt_token');
    disconnectSocket();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
