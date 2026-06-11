import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export function useCompanion(coords, isLoggedIn) {
  const [suggestion,     setSuggestion]     = useState(null);
  const [companionIndex, setCompanionIndex] = useState(0);
  const [pending,        setPending]        = useState([]);
  const [activeChat,     setActiveChat]     = useState(null);
  const [loading,        setLoading]        = useState(false);
  const pollRef = useRef(null);

  const findCompanion = useCallback(async (index = 0) => {
    if (!isLoggedIn || !coords?.lat) return;
    setLoading(true);
    try {
      const result = await api.findCompanion(coords.lat, coords.lng, index);
      setSuggestion(result);
      if (result) setCompanionIndex(result.index ?? index);
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
    socket.emit('join_chat', { chatId });
    socket.once('chat_history', ({ messages, expires_at }) => {
      setActiveChat({ chatId, messages, expires_at, activity, partnerName });
    });
    socket.on('new_message', (msg) => {
      setActiveChat(prev => prev?.chatId === chatId
        ? { ...prev, messages: [...prev.messages, msg] } : prev);
    });
    socket.once('chat_expired', () => {
      setActiveChat(prev => prev?.chatId === chatId ? { ...prev, expired: true } : prev);
    });
  }

  const sendMessage = useCallback((text) => {
    const socket = getSocket();
    if (!socket || !activeChat) return;
    socket.emit('send_message', { chatId: activeChat.chatId, text });
  }, [activeChat]);

  const closeChat = useCallback(() => setActiveChat(null), []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadPending();
    const socket = getSocket();
    if (socket) socket.on('companion_request', req => setPending(p => [...p, req]));
    pollRef.current = setInterval(loadPending, 15000);
    return () => {
      clearInterval(pollRef.current);
      socket?.off('companion_request');
      socket?.off('new_message');
    };
  }, [isLoggedIn, loadPending]);

  return {
    suggestion, pending, activeChat, loading,
    findCompanion, nextCompanion,
    sendRequest, accept, decline,
    sendMessage, closeChat,
  };
}
