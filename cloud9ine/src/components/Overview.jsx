import { useState } from 'react';
import { fmt, periodFilter, getSectionCfg } from '../utils/constants.js';

// ─── SHARED PERIOD TABS ───────────────────────────────────────────────────────
function PeriodTabs({ period, setPeriod }) {
  return (
    <div className="period-tabs">
      {['day','week','month','year'].map(p => (
        <button key={p} className={`period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ─── MANAGER OVERVIEW ─────────────────────────────────────────────────────────
export function ManagerOverview({ ctx }) {
  const { data } = ctx;
  const [period, setPeriod] = useState('day');

  const paid    = periodFilter(data.orders, period).filter(o => o.status === 'paid');
  const revenue = paid.reduce((s, o) => s + (o.bill?.total || 0), 0);
  const cashRev = paid.filter(o => o.payMethod === 'cash').reduce((s, o) => s + (o.bill?.total || 0), 0);
  const digRev  = paid.filter(o => o.payMethod === 'paystack').reduce((s, o) => s + (o.bill?.total || 0), 0);
  const commissions = paid.reduce((s, o) => s + (o.bill?.commission || 0), 0);
  const tips        = paid.reduce((s, o) => s + (o.bill?.tipAmt || 0), 0);
  const openCount   = data.orders.filter(o => o.status === 'open').length;
  const activeStaff = data.servers.filter(s => s.status === 'active' && s.role !== 'manager').length;

  return (
    <div className="fade-in">
      <PeriodTabs period={period} setPeriod={setPeriod} />
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value">{fmt(revenue)}</div><div className="stat-sub">{paid.length} paid orders</div></div>
        <div className="stat-card"><div className="stat-label">Cash Collected</div><div className="stat-value" style={{ color:'var(--success)' }}>{fmt(cashRev)}</div><div className="stat-sub">Cash payments</div></div>
        <div className="stat-card"><div className="stat-label">Digital Payments</div><div className="stat-value" style={{ color:'var(--info)' }}>{fmt(digRev)}</div><div className="stat-sub">Paystack</div></div>
        <div className="stat-card"><div className="stat-label">Commissions</div><div className="stat-value" style={{ color:'var(--teal)' }}>{fmt(commissions)}</div><div className="stat-sub">2.5% on net sales</div></div>
        <div className="stat-card"><div className="stat-label">Tips</div><div className="stat-value" style={{ color:'var(--gold)' }}>{fmt(tips)}</div><div className="stat-sub">To servers</div></div>
        <div className="stat-card"><div className="stat-label">Open Orders</div><div className="stat-value" style={{ color:'var(--warning)' }}>{openCount}</div><div className="stat-sub">Awaiting cashier</div></div>
      </div>

      {/* Staff performance */}
      <div className="card mb-4">
        <div className="card-header"><div className="card-title">Staff Performance — {period}</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Staff</th><th>Role</th><th>Orders</th><th>Sales</th><th>Commission</th><th>Tips</th><th>Status</th></tr></thead>
            <tbody>
              {data.servers.filter(s => s.role !== 'manager').map(s => {
                const sOrders = paid.filter(o => o.serverId === s.id || o.cashierId === s.id);
                const sales   = sOrders.reduce((x, o) => x + (o.bill?.afterDiscount || 0), 0);
                const comm    = sOrders.reduce((x, o) => x + (o.bill?.commission || 0), 0);
                const stips   = sOrders.reduce((x, o) => x + (o.bill?.tipAmt || 0), 0);
                return (
                  <tr key={s.id}>
                    <td><div className="flex items-center gap-2"><span>{s.avatar}</span><strong>{s.name}</strong></div></td>
                    <td><span className={`badge badge-${s.role}`}>{s.role}</span></td>
                    <td>{sOrders.length}</td>
                    <td className="text-gold">{fmt(sales)}</td>
                    <td className="text-success">{fmt(comm)}</td>
                    <td className="text-gold">{fmt(stips)}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="card-header"><div className="card-title">Recent Orders</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ref</th><th>Section/Table</th><th>Customer</th><th>Server</th><th>Cashier</th><th>Total</th><th>Pay</th><th>Status</th></tr></thead>
            <tbody>
              {data.orders.slice().reverse().slice(0, 15).map(o => {
                const sc = getSectionCfg(o.sectionId);
                return (
                  <tr key={o.id}>
                    <td className="text-muted text-xs">#{o.id.slice(-6)}</td>
                    <td>
                      <span className="section-pill" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.icon} {sc.label}</span>
                      <span style={{ marginLeft: 5, fontSize: 12, fontWeight: 700 }}>T{o.table}</span>
                    </td>
                    <td>{o.customerName}</td>
                    <td style={{ fontSize: 12 }}>{o.serverName}</td>
                    <td style={{ fontSize: 12, color: 'var(--purple)' }}>{o.cashierName || '—'}</td>
                    <td className="text-gold font-bold">{fmt(o.bill?.total || 0)}</td>
                    <td><span className={`badge badge-${o.payMethod === 'cash' ? 'cash' : 'paystack'}`}>{o.payMethod}</span></td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.orders.length === 0 && <div className="empty-state"><div className="empty-icon">🧾</div><p>No orders yet</p></div>}
        </div>
      </div>
    </div>
  );
}

// ─── CASHIER OVERVIEW ─────────────────────────────────────────────────────────
export function CashierOverview({ ctx }) {
  const { data, session } = ctx;
  const [period, setPeriod] = useState('day');

  const allPaid   = periodFilter(data.orders, period).filter(o => o.status === 'paid');
  const myApproved= allPaid.filter(o => o.cashierId === session.id);
  const pending   = data.orders.filter(o => o.status === 'open');
  const cashTotal = allPaid.filter(o => o.payMethod === 'cash').reduce((s, o) => s + (o.bill?.total || 0), 0);
  const digTotal  = allPaid.filter(o => o.payMethod === 'paystack').reduce((s, o) => s + (o.bill?.total || 0), 0);
  const revenue   = allPaid.reduce((s, o) => s + (o.bill?.total || 0), 0);

  return (
    <div className="fade-in">
      <PeriodTabs period={period} setPeriod={setPeriod} />
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-value">{fmt(revenue)}</div><div className="stat-sub">{allPaid.length} paid orders</div></div>
        <div className="stat-card"><div className="stat-label">My Approvals</div><div className="stat-value" style={{ color:'var(--purple)' }}>{myApproved.length}</div><div className="stat-sub">This {period}</div></div>
        <div className="stat-card"><div className="stat-label">Pending Approval</div><div className="stat-value" style={{ color:'var(--warning)' }}>{pending.length}</div><div className="stat-sub">Awaiting action</div></div>
        <div className="stat-card"><div className="stat-label">Cash Collected</div><div className="stat-value" style={{ color:'var(--success)' }}>{fmt(cashTotal)}</div><div className="stat-sub">Cash payments</div></div>
        <div className="stat-card"><div className="stat-label">Digital</div><div className="stat-value" style={{ color:'var(--info)' }}>{fmt(digTotal)}</div><div className="stat-sub">Paystack</div></div>
        <div className="stat-card"><div className="stat-label">Balance Check</div><div className="stat-value" style={{ fontSize: 16, paddingTop: 4 }}>{fmt(cashTotal)} + {fmt(digTotal)}</div><div className="stat-sub">= {fmt(revenue)}</div></div>
      </div>

      {/* Pending orders quick list */}
      {pending.length > 0 && (
        <div className="card mb-4">
          <div className="card-header"><div className="card-title">⏳ Pending Approvals ({pending.length})</div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ref</th><th>Section/Table</th><th>Customer</th><th>Server</th><th>Total</th><th>Pay Method</th><th>Time</th></tr></thead>
              <tbody>
                {pending.map(o => {
                  const sc = getSectionCfg(o.sectionId);
                  return (
                    <tr key={o.id}>
                      <td className="text-muted text-xs">#{o.id.slice(-6)}</td>
                      <td>
                        <span className="section-pill" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.icon} {sc.label}</span>
                        <span style={{ marginLeft: 5, fontWeight: 700 }}>T{o.table}</span>
                      </td>
                      <td>{o.customerName}</td>
                      <td style={{ fontSize: 12 }}>{o.serverName}</td>
                      <td className="text-gold font-bold">{fmt(o.bill?.total || 0)}</td>
                      <td><span className={`badge badge-${o.payMethod === 'cash' ? 'cash' : 'paystack'}`}>{o.payMethod}</span></td>
                      <td className="text-muted text-xs">{new Date(o.createdAt).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SERVER OVERVIEW ──────────────────────────────────────────────────────────
export function ServerOverview({ ctx }) {
  const { data, session } = ctx;
  const [period, setPeriod] = useState('day');

  const myPaid   = periodFilter(data.orders, period).filter(o => o.serverId === session.id && o.status === 'paid');
  const sales    = myPaid.reduce((s, o) => s + (o.bill?.afterDiscount || 0), 0);
  const commission = myPaid.reduce((s, o) => s + (o.bill?.commission || 0), 0);
  const tips     = myPaid.reduce((s, o) => s + (o.bill?.tipAmt || 0), 0);
  const openNow  = data.orders.filter(o => o.serverId === session.id && o.status === 'open').length;

  return (
    <div className="fade-in">
      <PeriodTabs period={period} setPeriod={setPeriod} />
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total Sold</div><div className="stat-value">{fmt(sales)}</div><div className="stat-sub">{myPaid.length} paid orders</div></div>
        <div className="stat-card"><div className="stat-label">Commission (2.5%)</div><div className="stat-value" style={{ color:'var(--success)' }}>{fmt(commission)}</div><div className="stat-sub">On net sales excl. tip</div></div>
        <div className="stat-card"><div className="stat-label">Tips Earned</div><div className="stat-value" style={{ color:'var(--success)' }}>{fmt(tips)}</div><div className="stat-sub">{myPaid.filter(o => o.bill?.tipAmt > 0).length} tipped orders</div></div>
        <div className="stat-card"><div className="stat-label">Total Earnings</div><div className="stat-value" style={{ color:'var(--success)' }}>{fmt(commission + tips)}</div><div className="stat-sub">Commission + Tips</div></div>
        <div className="stat-card"><div className="stat-label">Open Orders</div><div className="stat-value" style={{ color:'var(--warning)' }}>{openNow}</div><div className="stat-sub">Awaiting cashier</div></div>
        <div className="stat-card"><div className="stat-label">Avg Order Value</div><div className="stat-value">{fmt(myPaid.length ? sales / myPaid.length : 0)}</div><div className="stat-sub">Per paid order</div></div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">My Recent Orders</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Section/Table</th><th>Customer</th><th>Sales</th><th>Commission</th><th>Tip</th><th>Cashier</th><th>Status</th></tr></thead>
            <tbody>
              {data.orders.filter(o => o.serverId === session.id).slice().reverse().slice(0, 15).map(o => {
                const sc = getSectionCfg(o.sectionId);
                return (
                  <tr key={o.id}>
                    <td>
                      <span className="section-pill" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.icon} {sc.label}</span>
                      <span style={{ marginLeft: 5, fontWeight: 700 }}>T{o.table}</span>
                    </td>
                    <td>{o.customerName}</td>
                    <td className="text-gold">{fmt(o.bill?.afterDiscount || 0)}</td>
                    <td className="text-success">{fmt(o.bill?.commission || 0)}</td>
                    <td className="text-gold">{fmt(o.bill?.tipAmt || 0)}</td>
                    <td style={{ fontSize: 12, color: 'var(--purple)' }}>{o.cashierName || '⏳ Pending'}</td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
