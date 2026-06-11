import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export function useCompanion(coords, isLoggedIn) {
  const [suggestion, setSuggestion] = useState(null);
  const [pending,    setPending]    = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const pollRef    = useRef(null);
  const activeChatRef = useRef(null); // pour garder le chatId même si le composant re-render

  const findCompanion = useCallback(async (index = 0) => {
    if (!isLoggedIn || !coords?.lat) return;
    setLoading(true);
    try {
      const result = await api.findCompanion(coords.lat, coords.lng, index);
      setSuggestion(result);
    } catch {}
    finally { setLoading(false); }
  }, [coords, isLoggedIn]);

  const nextCompanion = useCallback(() => {
    if (!suggestion) return;
    const nextIndex = ((suggestion.index ?? 0) + 1) % (suggestion.total ?? 1);
    findCompanion(nextIndex);
  }, [suggestion, findCompanion]);

  const loadPending = useCallback(async () => {
    if (!isLoggedIn) return;
    try { setPending(await api.getPendingCompanions()); } catch {}
  }, [isLoggedIn]);

  const sendRequest = useCallback(async (receiver_id, activity, mood) => {
    await api.sendCompanionReq({ receiver_id, activity, mood });
    setSuggestion(null);
  }, []);

  const accept = useCallback(async (request_id, partnerName, activity) => {
    const result = await api.acceptCompanion(request_id);
    setPending(p => p.filter(r => r.id !== request_id));
    if (result.chat_id) openChat(result.chat_id, partnerName, activity);
  }, []);

  const decline = useCallback(async (request_id) => {
    await api.declineCompanion(request_id);
    setPending(p => p.filter(r => r.id !== request_id));
  }, []);

  function openChat(chatId, partnerName, activity) {
    const socket = getSocket();
    if (!socket) return;

    // Sauvegarde le chat actif pour pouvoir le rouvrir
    activeChatRef.current = { chatId, partnerName, activity };

    socket.emit('join_chat', { chatId });

    socket.once('chat_history', ({ messages, expires_at }) => {
      // Vérifie si le chat n'est pas expiré
      if (new Date(expires_at) < new Date()) {
        activeChatRef.current = null;
        return;
      }
      setActiveChat({ chatId, messages, expires_at, activity, partnerName });
      setChatMinimized(false);
    });

    socket.on('new_message', (msg) => {
      setActiveChat(prev => {
        if (prev?.chatId === chatId) {
          // Si chat minimisé, on le rouvre automatiquement
          setChatMinimized(false);
          return { ...prev, messages: [...prev.messages, msg] };
        }
        return prev;
      });
    });

    socket.once('chat_expired', () => {
      setActiveChat(prev => prev?.chatId === chatId ? { ...prev, expired: true } : prev);
      activeChatRef.current = null;
    });
  }

  // Rouvrir un chat minimisé
  const reopenChat = useCallback(() => {
    if (activeChat) {
      setChatMinimized(false);
      return;
    }
    // Si on a perdu l'état mais qu'on a le chatId, rejoindre à nouveau
    if (activeChatRef.current) {
      openChat(
        activeChatRef.current.chatId,
        activeChatRef.current.partnerName,
        activeChatRef.current.activity
      );
    }
  }, [activeChat]);

  const minimizeChat = useCallback(() => setChatMinimized(true), []);

  const closeChat = useCallback(() => {
    setChatMinimized(true); // minimise au lieu de fermer définitivement
  }, []);

  const dismissChat = useCallback(() => {
    setActiveChat(null);
    activeChatRef.current = null;
    setChatMinimized(false);
  }, []);

  const sendMessage = useCallback((text) => {
    const socket = getSocket();
    if (!socket || !activeChat) return;
    socket.emit('send_message', { chatId: activeChat.chatId, text });
  }, [activeChat]);

  useEffect(() => {
    if (!isLoggedIn) return;

    loadPending();
    pollRef.current = setInterval(loadPending, 10000);

    const onFocus = () => loadPending();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) loadPending();
    });

    const socket = getSocket();
    if (socket) {
      socket.on('companion_request', req => setPending(p => [...p, req]));
      socket.on('companion_accepted', ({ chat_id, activity, partner_name }) => {
        openChat(chat_id, partner_name, activity);
      });
    }

    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener('focus', onFocus);
      socket?.off('companion_request');
      socket?.off('companion_accepted');
      socket?.off('new_message');
    };
  }, [isLoggedIn, loadPending]);

  return {
    suggestion, pending, activeChat, chatMinimized, loading,
    findCompanion, nextCompanion,
    sendRequest, accept, decline,
    sendMessage, closeChat, reopenChat, minimizeChat, dismissChat,
    hasActiveChat: !!(activeChat || activeChatRef.current),
  };
}
