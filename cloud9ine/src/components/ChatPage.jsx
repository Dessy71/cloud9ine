import { useState, useEffect, useRef } from 'react';
import { canDM, canLogin } from '../utils/constants.js';

export default function ChatPage({ ctx }) {
  const { data, session, saveAndSync, STORAGE_KEYS } = ctx;
  const [activeChat, setActiveChat] = useState('broadcast');
  const [text, setText] = useState('');
  const [mentionQ, setMentionQ] = useState(null);
  const [mentionPos, setMentionPos] = useState(0);
  const [showContacts, setShowContacts] = useState(false);
  const msgRef = useRef();
  const inputRef = useRef();

  const contacts = data.servers.filter(s => s.id !== session.id && s.status === 'active');

  const messages = data.messages.filter(m => {
    if (activeChat === 'broadcast') return m.type === 'broadcast';
    return m.type === 'dm' && (
      (m.senderId === session.id && m.recipientId === activeChat) ||
      (m.senderId === activeChat && m.recipientId === session.id)
    );
  });

  // Mark read
  useEffect(() => {
    const toMark = data.messages.filter(m =>
      !m.readBy?.includes(session.id) && m.senderId !== session.id &&
      (activeChat === 'broadcast' ? m.type === 'broadcast' : (m.type === 'dm' && m.senderId === activeChat))
    );
    if (!toMark.length) return;
    const updated = data.messages.map(m =>
      toMark.find(x => x.id === m.id) ? { ...m, readBy: [...(m.readBy || []), session.id] } : m
    );
    saveAndSync(STORAGE_KEYS.MESSAGES, updated);
  }, [activeChat, data.messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [messages.length]);

  function scrollToTop() { if (msgRef.current) msgRef.current.scrollTop = 0; }
  function scrollToBottom() { if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight; }

  function handleInput(e) {
    const val = e.target.value;
    setText(val);
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    if (atIdx !== -1 && (atIdx === 0 || before[atIdx - 1] === ' ')) {
      const q = before.slice(atIdx + 1);
      if (!q.includes(' ')) { setMentionQ(q.toLowerCase()); setMentionPos(atIdx); return; }
    }
    setMentionQ(null);
  }

  function insertMention(server) {
    const before = text.slice(0, mentionPos);
    const after = text.slice(inputRef.current?.selectionStart || mentionPos).replace(/^\S*/, '');
    setText(before + `@${server.name} ` + after);
    setMentionQ(null);
    inputRef.current?.focus();
  }

  const mentionMatches = contacts.filter(c => c.role === 'server' && (!mentionQ || c.name.toLowerCase().startsWith(mentionQ)));

  function renderText(t) {
    const parts = t.split(/(@[\w][\w\s]*?)(?=\s|$|@)/g);
    return parts.map((pt, i) => pt.startsWith('@')
      ? <span key={i} className="mention-tag">{pt}</span>
      : pt
    );
  }

  function send() {
    if (!text.trim()) return;
    const isBroadcast = activeChat === 'broadcast';
    if (isBroadcast && session.role === 'server') return;
    if (!isBroadcast) {
      const r = data.servers.find(s => s.id === activeChat);
      if (r && !canDM(r)) return;
    }
    const msg = {
      id: 'msg_' + Date.now(),
      type: isBroadcast ? 'broadcast' : 'dm',
      senderId: session.id, senderName: session.name, senderAvatar: session.avatar || '💬',
      recipientId: isBroadcast ? null : activeChat,
      text: text.trim(), ts: new Date().toISOString(), readBy: [session.id],
    };
    saveAndSync(STORAGE_KEYS.MESSAGES, [...data.messages, msg]);
    setText(''); setMentionQ(null);
  }

  function getUnread(cid) {
    return data.messages.filter(m => m.type === 'dm' && m.senderId === cid && m.recipientId === session.id && !m.readBy?.includes(session.id)).length;
  }

  function getMentioned(cid) {
    // Count broadcasts where this user is @mentioned and not read
    return data.messages.filter(m =>
      m.type === 'broadcast' &&
      !m.readBy?.includes(session.id) &&
      m.senderId !== session.id &&
      m.text?.includes(`@${session.name}`)
    ).length;
  }

  const broadcastUnread = data.messages.filter(m => m.type === 'broadcast' && !m.readBy?.includes(session.id) && m.senderId !== session.id).length;
  const broadcastMentioned = getMentioned();
  const activeContact = contacts.find(c => c.id === activeChat);
  const recipientOnBreak = activeChat !== 'broadcast' && activeContact?.availability === 'break';
  const canSend = activeChat === 'broadcast' ? session.role !== 'server' : (activeContact && canDM(activeContact));

  return (
    <div className="chat-wrap fade-in">
      {/* Contacts sidebar */}
      <div className={`chat-side ${showContacts ? 'show' : ''}`}>
        <div className="chat-side-hdr">
          💬 Messages
          <button className="btn btn-ghost btn-sm" style={{ float: 'right', padding: '2px 6px' }} onClick={() => setShowContacts(false)}>×</button>
        </div>
        <div className="chat-list">
          <div className={`chat-item ${activeChat === 'broadcast' ? 'active' : ''}`} onClick={() => { setActiveChat('broadcast'); setShowContacts(false); }}>
            <div className="flex items-center gap-2 justify-between">
              <div className="chat-item-name">📢 Broadcast</div>
              <div className="flex gap-1">
                {broadcastMentioned > 0 && <span className="chat-mention-badge">@{broadcastMentioned}</span>}
                {broadcastUnread > 0 && <span className="chat-badge">{broadcastUnread}</span>}
              </div>
            </div>
            <div className="chat-item-last">All staff channel</div>
          </div>
          {contacts.map(c => {
            const unread = getUnread(c.id);
            const last = data.messages.filter(m => m.type === 'dm' && ((m.senderId === c.id && m.recipientId === session.id) || (m.senderId === session.id && m.recipientId === c.id))).slice(-1)[0];
            return (
              <div key={c.id} className={`chat-item ${activeChat === c.id ? 'active' : ''}`} onClick={() => { setActiveChat(c.id); setShowContacts(false); }}>
                <div className="flex items-center gap-2 justify-between">
                  <div className="chat-item-name">
                    {c.avatar} {c.name}
                    {c.availability === 'break' && <span style={{ fontSize: 9, color: 'var(--warning)', marginLeft: 3 }}>☕</span>}
                    {!canLogin(c) && <span style={{ fontSize: 9, color: 'var(--danger)', marginLeft: 3 }}>⛔</span>}
                  </div>
                  {unread > 0 && <span className="chat-badge">{unread}</span>}
                </div>
                <div className="chat-item-last">{last?.text || 'No messages yet'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        <div className="chat-hdr">
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setShowContacts(true)}>☰</button>
          <span style={{ fontSize: 22 }}>{activeChat === 'broadcast' ? '📢' : (activeContact?.avatar || '💬')}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{activeChat === 'broadcast' ? 'Broadcast — All Staff' : activeContact?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {activeChat === 'broadcast' ? 'Manager & Cashier can broadcast' :
               recipientOnBreak ? '🟡 On break' : activeContact ? '🟢 On duty' : ''}
            </div>
          </div>
        </div>

        {recipientOnBreak && (
          <div className="alert alert-warning" style={{ margin: '10px 16px 0', fontSize: 11 }}>
            ☕ <strong>{activeContact?.name}</strong> is on break — they may not respond immediately.
          </div>
        )}

        {/* Scroll controls */}
        <div style={{ position: 'relative' }}>
          <button className="scroll-btn scroll-bottom-btn" onClick={scrollToTop} title="Scroll to top">↑</button>
          <button className="scroll-btn scroll-top-btn" onClick={scrollToBottom} title="Scroll to bottom">↓</button>
        </div>

        <div className="chat-messages" ref={msgRef}>
          {messages.length === 0 && <div className="empty-state"><div className="empty-icon">💬</div><p>No messages yet</p></div>}
          {messages.map(m => {
            const mine = m.senderId === session.id;
            return (
              <div key={m.id} className={`message ${mine ? 'mine' : m.type === 'broadcast' ? 'broadcast' : 'theirs'}`}>
                {!mine && <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{m.senderName}</div>}
                <div className="msg-bubble">{renderText(m.text)}</div>
                <div className="msg-meta">{new Date(m.ts).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            );
          })}
        </div>

        <div className="chat-input-area">
          {!canSend ? (
            <div style={{ flex: 1, padding: '9px 14px', fontSize: 12, color: 'var(--muted)', background: 'var(--deep)', borderRadius: 18 }}>
              {activeChat === 'broadcast' ? 'Only managers & cashiers can broadcast' : `Cannot message — ${activeContact?.name || 'user'} is unavailable`}
            </div>
          ) : (
            <>
              {mentionQ !== null && mentionMatches.length > 0 && (
                <div className="mention-dropdown">
                  {mentionMatches.map(s => (
                    <div key={s.id} className="mention-opt" onClick={() => insertMention(s)}>
                      <span>{s.avatar}</span>{s.name}
                      {s.availability === 'break' && <span style={{ fontSize: 9, color: 'var(--warning)' }}>☕</span>}
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={inputRef}
                className="chat-input" rows={1}
                placeholder={activeChat === 'broadcast' ? 'Broadcast to all… (type @ to mention)' : `Message ${activeContact?.name || ''}…`}
                value={text}
                onChange={handleInput}
                onKeyDown={e => { if (e.key === 'Escape') { setMentionQ(null); return; } if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button className="btn btn-gold btn-sm" onClick={send}>Send</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
