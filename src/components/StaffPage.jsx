import { useState } from 'react';
import { store } from '../utils/storage.js';
import { canLogin } from '../utils/constants.js';

const AVATARS = ['🍹','🍸','🧋','☕','🍾','🎯','⭐','🌟','💰','🧾','🎪','🌙'];

const ROLE_META = {
  server:  { label: 'Server',  color: 'var(--info)',   badge: 'badge-server'  },
  cashier: { label: 'Cashier', color: 'var(--purple)', badge: 'badge-cashier' },
};

export default function StaffPage({ ctx }) {
  const { data, saveAndSync, STORAGE_KEYS } = ctx;
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [roleTab, setRoleTab] = useState('server');
  const [filter, setFilter]  = useState('all');
  const [form, setForm] = useState({
    name: '', username: '', password: '', avatar: '🍹',
    role: 'server', status: 'active', phone: '', email: '',
  });

  const staff = data.servers.filter(s => s.role !== 'manager');
  const byRole = staff.filter(s => s.role === roleTab);
  const filtered = byRole.filter(s => filter === 'all' ? true : s.status === filter);
  const pendingList = staff.filter(s => s.status === 'pending');

  function openAdd(role) {
    setEditing(null);
    setForm({ name: '', username: '', password: '', avatar: role === 'cashier' ? '💰' : '🍹', role, status: 'active', phone: '', email: '' });
    setModal(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ ...s, password: '' });
    setModal(true);
  }

  function save() {
    if (!form.name || !form.username || (!editing && !form.password)) return;
    const all = store.get(STORAGE_KEYS.SERVERS, []);
    let updated;
    if (editing) {
      updated = all.map(s => s.id === editing.id
        ? { ...s, ...form, ...(form.password ? { password: form.password } : {}) }
        : s
      );
    } else {
      updated = [...all, { ...form, id: (form.role === 'cashier' ? 'csh_' : 'srv_') + Date.now(), availability: 'active' }];
    }
    saveAndSync(STORAGE_KEYS.SERVERS, updated);
    setModal(false);
  }

  function setStatus(s, status) {
    const all = store.get(STORAGE_KEYS.SERVERS, []);
    const availability = status === 'active' ? (s.availability || 'active') : 'inactive';
    saveAndSync(STORAGE_KEYS.SERVERS, all.map(x => x.id === s.id ? { ...x, status, availability } : x));
  }

  function del(id) {
    saveAndSync(STORAGE_KEYS.SERVERS, store.get(STORAGE_KEYS.SERVERS, []).filter(s => s.id !== id));
  }

  return (
    <div className="fade-in">
      {pendingList.length > 0 && (
        <div className="alert alert-warning mb-4">
          ⏳ {pendingList.length} staff pending approval: {pendingList.map(s => s.name).join(', ')}
        </div>
      )}

      {/* Role tabs */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="tabs" style={{ margin: 0 }}>
          <button className={`tab ${roleTab === 'server' ? 'active' : ''}`} onClick={() => setRoleTab('server')}>🍹 Servers</button>
          <button className={`tab ${roleTab === 'cashier' ? 'active' : ''}`} onClick={() => setRoleTab('cashier')}>💰 Cashiers</button>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => openAdd(roleTab)}>+ Add {roleTab === 'cashier' ? 'Cashier' : 'Server'}</button>
      </div>

      {/* Status filter */}
      <div className="tabs mb-4">
        {['all', 'active', 'suspended', 'leave', 'pending'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{roleTab === 'cashier' ? 'Cashier' : 'Server'}</th>
                <th>Username</th>
                {roleTab === 'cashier' && <th>Contact</th>}
                <th>Status</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 20 }}>{s.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        {s.email && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="text-muted text-sm">@{s.username}</td>
                  {roleTab === 'cashier' && <td className="text-muted text-sm">{s.phone || '—'}</td>}
                  <td>
                    <span className={`badge badge-${s.status}`}>
                      <span className={`status-dot`} style={{ background: s.status === 'active' ? 'var(--success)' : s.status === 'suspended' ? 'var(--danger)' : s.status === 'pending' ? 'var(--warning)' : 'var(--info)' }} />
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.availability === 'break' ? 'badge-break' : s.status === 'active' ? 'badge-active' : 'badge-suspended'}`}>
                      {s.availability === 'break' ? '☕ On Break' : s.status === 'active' ? '🟢 On Duty' : '⛔ Offline'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {s.status === 'pending'    && <button className="btn btn-success btn-sm" onClick={() => setStatus(s, 'active')}>✅ Approve</button>}
                      {s.status === 'active'     && <button className="btn btn-outline btn-sm" onClick={() => setStatus(s, 'suspended')}>Suspend</button>}
                      {s.status === 'active'     && <button className="btn btn-outline btn-sm" onClick={() => setStatus(s, 'leave')}>Set Leave</button>}
                      {(s.status === 'suspended' || s.status === 'leave') && <button className="btn btn-success btn-sm" onClick={() => setStatus(s, 'active')}>Reactivate</button>}
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(s.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">👥</div><p>No {roleTab}s found</p></div>}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? `Edit ${form.role}` : `Add ${form.role}`}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password {editing && '(leave blank to keep)'}</label>
                <input className="form-input" type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              {form.role === 'cashier' && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0XX XXX XXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@email.com" />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="server">Server</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="leave">On Leave</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATARS.map(a => (
                    <div key={a} onClick={() => setForm({ ...form, avatar: a })}
                      style={{ fontSize: 24, cursor: 'pointer', padding: 4, borderRadius: 8, border: form.avatar === a ? '2px solid var(--gold)' : '2px solid transparent' }}>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={save}>{editing ? 'Save Changes' : `Add ${form.role}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
