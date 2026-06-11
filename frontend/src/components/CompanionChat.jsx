import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/meteo.css';

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

export default function CompanionChat({ chat, onSend, onClose, onDismiss, minimized }) {
  const { user }        = useAuth();
  const [text, setText] = useState('');
  const bottomRef       = useRef(null);
  const countdown       = useCountdown(chat?.expires_at);

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, minimized]);

  if (!chat) return null;

  // Mode minimisé — juste une petite bulle en bas à droite
  if (minimized) {
    return (
      <div
        onClick={onClose} // onClose = reopen dans ce contexte
        style={{
          position: 'fixed', bottom: '0', right: '24px',
          background: 'rgba(8,20,33,0.96)',
          border: '1px solid rgba(0,255,220,0.28)',
          borderBottom: 'none',
          borderRadius: '14px 14px 0 0',
          padding: '10px 16px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '10px',
          zIndex: 200,
          backdropFilter: 'blur(14px)',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
          💬 {chat.partnerName}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
          {chat.expired ? 'Expired' : countdown}
        </span>
        <span style={{ fontSize: '16px', color: 'var(--muted)' }}>↑</span>
      </div>
    );
  }

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <p className="chat-partner">💬 {chat.partnerName}</p>
          <p className="chat-activity">✦ {chat.activity}</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
          <span className={`chat-timer${chat.expired ? ' chat-expired' : ''}`}>
            ⏱ {chat.expired ? 'Chat expired' : countdown}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {/* Minimize */}
            <button className="chat-close" onClick={onClose} title="Minimize">—</button>
            {/* Fermer définitivement */}
            {chat.expired && (
              <button className="chat-close" onClick={onDismiss} title="Close">×</button>
            )}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {!chat.messages?.length && (
          <p style={{ color:'var(--muted)', fontSize:'12px', textAlign:'center', margin:'auto' }}>
            Say hello to {chat.partnerName}! 👋
          </p>
        )}
        {chat.messages?.map(msg => (
          <div key={msg.id} className={`chat-msg ${msg.user_id === user?.id ? 'mine' : 'theirs'}`}>
            {msg.user_id !== user?.id && (
              <span style={{ fontSize:'10px', color:'var(--muted)', marginBottom:'2px', display:'block' }}>
                {msg.username}
              </span>
            )}
            <div className="chat-msg-bubble">{msg.text}</div>
            <p className="chat-msg-time">
              {new Date(msg.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {chat.expired ? (
        <div className="chat-expired-banner">
          This chat has expired — hope the meetup went well! 🌟
          <br />
          <button
            onClick={onDismiss}
            style={{ marginTop:'8px', background:'transparent', border:'none', color:'var(--accent)', fontSize:'12px', cursor:'pointer' }}
          >
            Close
          </button>
        </div>
      ) : (
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            className="chat-input"
            type="text"
            placeholder="Your message..."
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
            autoFocus
          />
          <button className="chat-send" type="submit" disabled={!text.trim()}>➤</button>
        </form>
      )}
    </div>
  );
}
