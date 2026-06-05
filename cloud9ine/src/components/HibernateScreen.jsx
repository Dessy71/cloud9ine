import { useState } from 'react';
import { store } from '../utils/storage.js';
import { STORAGE_KEYS } from '../utils/constants.js';

export default function HibernateScreen({ session, onUnlock, onLogout }) {
  const [p, setP] = useState('');
  const [err, setErr] = useState('');

  function unlock() {
    const servers = store.get(STORAGE_KEYS.SERVERS, []);
    const user = servers.find(s => s.id === session.id);
    if (user && user.password === p) {
      setErr(''); onUnlock();
    } else {
      setErr('Incorrect password');
    }
  }

  return (
    <div className="hibernate-screen">
      <div className="hibernate-logo">☁️</div>
      <div className="hibernate-title">Cloud 9ine</div>
      <div className="hibernate-sub">
        {session.name} is on break · Enter password to resume
      </div>
      <div className="hibernate-box">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36 }}>{session.avatar || '🍹'}</div>
          <div style={{ fontWeight: 700, marginTop: 8, fontSize: 16 }}>{session.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{session.role}</div>
        </div>
        {err && <div className="alert alert-danger">{err}</div>}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input" type="password" value={p}
            onChange={e => setP(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()}
            placeholder="Enter your password" autoFocus
          />
        </div>
        <button className="btn btn-gold btn-full" onClick={unlock}>☀️ Resume Session</button>
        <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={onLogout}>Sign Out Instead</button>
      </div>
    </div>
  );
}
