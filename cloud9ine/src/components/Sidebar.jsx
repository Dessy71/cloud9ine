export default function Sidebar({ session, navItems, onNav, activeTab, onBreak, onLogout, isOpen, onClose }) {
  const onBreakStatus = session?.availability === 'break';
  const roleColor = { manager: 'var(--gold)', cashier: 'var(--purple)', server: 'var(--info)' }[session?.role] || 'var(--muted)';

  return (
    <>
      {isOpen && <div className="sidebar-overlay show" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">☁️ Cloud 9ine</div>
          <div className="sidebar-logo-sub" style={{ color: roleColor }}>
            {session?.role === 'manager' ? 'Management Portal' : session?.role === 'cashier' ? 'Cashier Portal' : 'Staff Portal'}
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {session?.avatar || '👤'}
            {session?.role !== 'manager' && (
              <span className={`user-avail-dot ${onBreakStatus ? 'dot-break' : 'dot-on'}`} />
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.name}</div>
            <div className="user-role-label" style={{ color: roleColor }}>{session?.role}</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {navItems.map(n => (
            <div
              key={n.id}
              className={`nav-item ${activeTab === n.id ? 'active' : ''}`}
              onClick={() => { onNav(n.id); onClose(); }}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          {session?.role !== 'manager' && onBreak && (
            <button className={`break-btn ${onBreakStatus ? 'on-break' : ''}`} onClick={onBreak}>
              {onBreakStatus ? '☀️ Back on Duty' : '☕ Go on Break'}
            </button>
          )}
          <button className="signout-btn" onClick={onLogout}>🚪 Sign Out</button>
        </div>
      </div>
    </>
  );
}
