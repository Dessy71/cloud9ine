import { useState } from 'react';
import { SECTIONS, getSectionCfg, fmt } from '../utils/constants.js';

export default function FloorPage({ ctx }) {
  const { data } = ctx;
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const section = getSectionCfg(activeSection);

  function getOpen(t) { return data.orders.find(o => String(o.table) === String(t) && o.sectionId === activeSection && o.status === 'open'); }
  function getPaid(t) { return data.orders.find(o => String(o.table) === String(t) && o.sectionId === activeSection && o.status === 'paid'); }

  const openCount = data.orders.filter(o => o.sectionId === activeSection && o.status === 'open').length;

  return (
    <div className="fade-in">
      <div className="section-tabs">
        {SECTIONS.map(s => (
          <button key={s.id} className="section-tab"
            style={{ borderColor: activeSection === s.id ? s.color : 'rgba(255,255,255,0.1)', color: activeSection === s.id ? s.color : 'var(--muted)', background: activeSection === s.id ? s.bg : 'transparent' }}
            onClick={() => setActiveSection(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="floor-section-hdr">
        <span style={{ fontSize: 26 }}>{section.icon}</span>
        <div>
          <div className="floor-section-label" style={{ color: section.color }}>{section.label}</div>
          <div className="floor-section-count">{section.tables} tables · {openCount} occupied · {section.tables - openCount} free</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4 text-sm text-muted flex-wrap">
        <span>🔴 Occupied</span><span>🟢 Paid</span><span>⬜ Free</span>
      </div>

      <div className="floor-grid">
        {Array.from({ length: section.tables }, (_, i) => i + 1).map(t => {
          const open = getOpen(t);
          const paid = getPaid(t);
          let bc = 'rgba(255,255,255,0.1)', bg = 'rgba(255,255,255,0.02)', cls = 'table-card free';
          if (open)      { bc = 'rgba(231,76,60,0.5)';  bg = 'rgba(231,76,60,0.08)';  cls = 'table-card'; }
          else if (paid) { bc = 'rgba(46,204,113,0.4)'; bg = 'rgba(46,204,113,0.07)'; cls = 'table-card paid-recent'; }
          return (
            <div key={t} className={cls} style={{ borderColor: bc, background: bg }}>
              <div className="table-number" style={{ color: open ? 'var(--danger)' : paid ? 'var(--success)' : section.color }}>T{t}</div>
              {open ? (
                <>
                  <div className="table-info" style={{ color: 'var(--danger)', fontWeight: 600 }}>🔴 Occupied</div>
                  <div className="table-info">{open.customerName}</div>
                  <div className="table-info" style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(open.bill?.total || 0)}</div>
                  <div className="table-info" style={{ color: 'var(--muted)', fontSize: 9 }}>{open.serverName}</div>
                </>
              ) : paid ? (
                <>
                  <div className="table-info" style={{ color: 'var(--success)', fontWeight: 600 }}>🟢 Paid</div>
                  <div className="table-info" style={{ color: 'var(--muted)' }}>{paid.customerName}</div>
                </>
              ) : (
                <div className="table-info" style={{ color: 'var(--muted)' }}>Free</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
