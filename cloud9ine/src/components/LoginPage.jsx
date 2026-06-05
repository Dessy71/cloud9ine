import { useState } from 'react';

const ROLE_META = {
  manager: { icon: '👔', title: 'Manager Login',  sub: 'Management Portal',  hint: 'Default: admin / admin123' },
  cashier: { icon: '💰', title: 'Cashier Login',  sub: 'Cashier Portal',      hint: '' },
  server:  { icon: '🍹', title: 'Server Login',   sub: 'Staff Portal',        hint: '' },
};

export default function LoginPage({ role, onBack, onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const meta = ROLE_META[role];

  function submit() {
    if (!u || !p) { setErr('Please fill all fields'); return; }
    if (!onLogin(u, p, role)) setErr('Invalid credentials or account is not active');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-back" onClick={onBack}>← Back to Portal</div>
        <div style={{ fontSize: 44, marginBottom: 14 }}>{meta.icon}</div>
        <h2 className="auth-title">{meta.title}</h2>
        <p className="auth-sub">Cloud 9ine — {meta.sub}</p>
        {err && <div className="alert alert-danger">{err}</div>}
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" value={u} onChange={e => setU(e.target.value)} placeholder="Enter username" onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="username" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={p} onChange={e => setP(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="current-password" />
        </div>
        {meta.hint && <p className="text-sm text-muted mb-3">{meta.hint}</p>}
        <button className="btn btn-gold btn-full" onClick={submit}>Sign In</button>
      </div>
    </div>
  );
}
