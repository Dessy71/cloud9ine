export default function Landing({ onSelect }) {
  const portals = [
    { id: 'manager-login',  icon: '👔', label: 'Manager',  desc: 'Full control — staff, menu, orders, reports & settings.' },
    { id: 'cashier-login',  icon: '💰', label: 'Cashier',  desc: 'Approve payments, daily reports & floor oversight.' },
    { id: 'server-login',   icon: '🍹', label: 'Server',   desc: 'Take orders, manage tables & track earnings.' },
  ];
  return (
    <div className="landing">
      <div className="landing-glow" />
      <div className="logo-wrap">
        <div className="logo-icon">☁️</div>
        <div className="logo-title">Cloud 9ine</div>
        <div className="logo-sub">Restaurant & Bar Management</div>
      </div>
      <div className="portal-grid">
        {portals.map(p => (
          <div key={p.id} className="portal-card" onClick={() => onSelect(p.id)}>
            <span className="portal-icon">{p.icon}</span>
            <div className="portal-label">{p.label}</div>
            <div className="portal-desc">{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
