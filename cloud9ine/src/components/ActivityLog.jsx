import { useState } from 'react';

const TYPE_META = {
  login:   { icon: '🟢', color: 'var(--success)', label: 'Login'   },
  logout:  { icon: '🔴', color: 'var(--danger)',  label: 'Logout'  },
  break:   { icon: '☕', color: 'var(--warning)', label: 'Break'   },
  return:  { icon: '☀️', color: 'var(--info)',    label: 'Returned'},
  order:   { icon: '🧾', color: 'var(--gold)',    label: 'Order'   },
  payment: { icon: '💳', color: 'var(--success)', label: 'Payment' },
};

export default function ActivityLog({ ctx }) {
  const { data } = ctx;
  const [roleFilter, setRoleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const logs = (data.activity || [])
    .filter(l => roleFilter === 'all' || l.userRole === roleFilter)
    .filter(l => typeFilter === 'all' || l.type === typeFilter)
    .filter(l => !search || l.detail?.toLowerCase().includes(search.toLowerCase()) || l.userName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input className="search-bar" placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          {['all','manager','cashier','server'].map(r => (
            <button key={r} className={`tab ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div className="tabs" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          {['all','login','logout','break','return','order','payment'].map(t => (
            <button key={t} className={`tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {TYPE_META[t]?.icon || ''} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Activity Log</div>
          <span className="text-muted text-sm">{logs.length} entries</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {logs.length === 0 && <div className="empty-state"><div className="empty-icon">📋</div><p>No activity yet</p></div>}
          {logs.map(log => {
            const meta = TYPE_META[log.type] || { icon: '📌', color: 'var(--muted)', label: log.type };
            return (
              <div key={log.id} className="log-item" style={{ padding: '12px 20px' }}>
                <div className="log-icon" style={{ background: meta.color + '20' }}>
                  {meta.icon}
                </div>
                <div className="log-text">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{log.userName}</span>
                    <span className={`badge badge-${log.userRole}`}>{log.userRole}</span>
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: meta.color + '20', color: meta.color }}>{meta.label}</span>
                  </div>
                  <div className="log-time">{log.detail}</div>
                  <div className="log-time" style={{ color: 'var(--muted)', fontSize: 10 }}>
                    {new Date(log.ts).toLocaleString('en-GH', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
