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

export default function CompanionChat({ chat, onSend, onClose }) {
  const { user }        = useAuth();
  const [text, setText] = useState('');
  const bottomRef       = useRef(null);
  const countdown       = useCountdown(chat?.expires_at);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chat?.messages]);

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
          <button className="chat-close" onClick={onClose}>×</button>
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
              <span style={{ fontSize:'10px', color:'var(--muted)', marginBottom:'2px', display:'block' }}>{msg.username}</span>
            )}
            <div className="chat-msg-bubble">{msg.text}</div>
            <p className="chat-msg-time">{new Date(msg.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {chat.expired ? (
        <div className="chat-expired-banner">
          This chat has expired — hope the meetup went well! 🌟
        </div>
      ) : (
        <form className="chat-input-row" onSubmit={handleSend}>
          <input className="chat-input" type="text" placeholder="Your message..." value={text} onChange={e => setText(e.target.value)} maxLength={500} autoFocus />
          <button className="chat-send" type="submit" disabled={!text.trim()}>➤</button>
        </form>
      )}
    </div>
  );
}
