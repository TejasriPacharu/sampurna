// src/components/CrisisChat.js
// Shared crisis chat room component used by Delivery, NGO, Donor, and Admin dashboards.
// Renders as a full-screen modal overlay (pure HTML/CSS — matches the existing ui.js style).

import { useState, useEffect, useRef } from 'react';
import { T } from '../components/ui/ui';
import { sendMessage, subscribeRoom, markRoomRead } from '../store/chatStore';

// Role → accent color & emoji
const ROLE_COLOR = {
  donor:    '#4ADE80',
  ngo:      '#60A5FA',
  delivery: '#FBBF24',
  admin:    '#A78BFA',
  system:   '#8C8880',
};
const ROLE_ICON = {
  donor:    '🌱',
  ngo:      '🤝',
  delivery: '🚴',
  admin:    '🛡',
  system:   '⚙️',
};

/**
 * Props:
 *   issue       – { id, foodType, reason, isAuto, deliveryName, raisedAt }
 *   senderName  – display name of the current user
 *   senderRole  – 'donor' | 'ngo' | 'delivery' | 'admin'
 *   onClose     – called when user dismisses the chat
 */
export default function CrisisChat({ issue, senderName, senderRole, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const endRef = useRef(null);
  const accent = ROLE_COLOR[senderRole] || '#FBBF24';

  useEffect(() => {
    if (!issue?.id) return;
    markRoomRead(issue.id);
    const unsub = subscribeRoom(issue.id, msgs => {
      setMessages(msgs);
      // Scroll to bottom after paint
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
    });
    return unsub;
  }, [issue?.id]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !issue?.id) return;
    sendMessage({
      issueId:    issue.id,
      listingId:  issue.listingId || '',
      senderName: senderName || senderRole,
      senderRole,
      text:       trimmed,
    });
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    // Full-screen overlay
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(28,26,23,0.50)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>

      {/* Sheet */}
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#FFFFFF',
        borderRadius: '20px 20px 0 0',
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid #E3E0D9`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1A17' }}>
              💬 Crisis Chat
            </div>
            <div style={{ fontSize: 12, color: '#8C8880', marginTop: 2 }}>
              {issue?.foodType || 'Food delivery'}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20,
              color: '#8C8880', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Issue context banner */}
        <div style={{
          margin: '12px 16px 0',
          background: issue?.isAuto ? '#FFFBEB' : '#FEF2F2',
          border: `1px solid ${issue?.isAuto ? '#FDE68A' : '#FECACA'}`,
          borderRadius: 10, padding: '10px 14px', flexShrink: 0,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: issue?.isAuto ? '#D97706' : '#DC2626',
            marginBottom: 3,
          }}>
            {issue?.isAuto ? '⏰ AUTO — Food freshness expired' : '🚨 Issue raised by delivery'}
          </div>
          <div style={{ fontSize: 12, color: '#8C8880', lineHeight: 1.5 }}>
            {issue?.reason}
          </div>
        </div>

        {/* Participants pill */}
        <div style={{
          textAlign: 'center', fontSize: 10, color: '#6B6860',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          padding: '8px 0 4px', flexShrink: 0,
        }}>
          🟢 Donor · 🔵 NGO · 🟡 Delivery · 🟣 Admin
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '8px 14px 12px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center', color: '#4B4842', fontSize: 12,
              paddingTop: 40,
            }}>
              No messages yet. Start coordinating.
            </div>
          )}

          {messages.map(m => {
            const isMe = m.senderRole === senderRole && m.senderRole !== 'system';
            const col  = ROLE_COLOR[m.senderRole] || '#8C8880';
            const isSystem = m.senderRole === 'system';

            if (isSystem) return (
              <div key={m.id} style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  background: '#F7F6F3',
                  border: '1px solid #E3E0D9',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: 11, color: '#8C8880', fontStyle: 'italic',
                  whiteSpace: 'pre-wrap', lineHeight: 1.5,
                }}>
                  ⚙️ {m.text}
                </span>
              </div>
            );

            return (
              <div key={m.id} style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                gap: 8, alignItems: 'flex-end',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: col + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0,
                }}>
                  {ROLE_ICON[m.senderRole] || '👤'}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '70%' }}>
                  {/* Name + time */}
                  <div style={{
                    fontSize: 9, color: '#6B6860', marginBottom: 3,
                    textAlign: isMe ? 'right' : 'left',
                  }}>
                    <span style={{ color: col, fontWeight: 700 }}>{m.senderName}</span>
                    {' · '}{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    background: isMe ? (col + '15') : '#F7F6F3',
                    border: `1px solid ${isMe ? col + '40' : '#E3E0D9'}`,
                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '9px 13px',
                    fontSize: 13, color: '#1C1A17',
                    lineHeight: 1.45, whiteSpace: 'pre-wrap',
                  }}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <div style={{
          display: 'flex', gap: 8, padding: '12px 16px 20px',
          borderTop: '1px solid #E3E0D9',
          background: '#FFFFFF',
          flexShrink: 0,
        }}>
          <textarea
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            style={{
              flex: 1, padding: '10px 14px',
              background: '#F7F6F3',
              border: '1px solid #E3E0D9',
              borderRadius: 12,
              color: '#1C1A17', fontSize: 13,
              fontFamily: T.font,
              resize: 'none', outline: 'none',
              lineHeight: 1.4,
            }}
          />
          <button onClick={send} style={{
            padding: '0 20px',
            background: accent + '15',
            border: `1px solid ${accent + '40'}`,
            borderRadius: 12,
            color: accent, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: T.font,
            flexShrink: 0,
          }}>
            Send
          </button>
        </div>

      </div>
    </div>
  );
}