import { useState, useRef } from 'react';
import { getSectionCfg, fmt } from '../utils/constants.js';
import { logActivity } from '../utils/storage.js';
import Receipt from './Receipt.jsx';
import { SECTIONS } from '../utils/constants.js';

export default function OrdersPage({ ctx, role }) {
  const { data, session, saveAndSync, STORAGE_KEYS } = ctx;
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [sectionFilter, setSection] = useState('all');
  const [selected, setSelected]     = useState(null);
  const printRef = useRef();

  // Role-based visibility
  const orders = data.orders
    .filter(o => role === 'server' ? o.serverId === session.id : true)
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => sectionFilter === 'all' || o.sectionId === sectionFilter)
    .filter(o => !search ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      `t${o.table}`.includes(search.toLowerCase()) ||
      o.serverName?.toLowerCase().includes(search.toLowerCase())
    )
    .slice().reverse();

  function approvePaid(o) {
    const updated = data.orders.map(x =>
      x.id === o.id ? { ...x, status: 'paid', paidAt: new Date().toISOString(), cashierId: session.id, cashierName: session.name } : x
    );
    saveAndSync(STORAGE_KEYS.ORDERS, updated);
    logActivity({ type: 'payment', userId: session.id, userName: session.name, userRole: 'cashier', detail: `Cashier ${session.name} approved payment for Order #${o.id.slice(-6)} — ${fmt(o.bill?.total || 0)}` });
    setSelected(null);
  }

  function closeOrder(o) {
    const updated = data.orders.map(x => x.id === o.id ? { ...x, status: 'closed' } : x);
    saveAndSync(STORAGE_KEYS.ORDERS, updated);
    setSelected(null);
  }

  function printReceipt() { window.print(); }

  const canApprove  = role === 'cashier';
  const canPrint    = role === 'cashier' || role === 'manager';
  const showServer  = role !== 'server';

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input className="search-bar" placeholder="Search table, customer, server…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          {['all','open','paid','closed'].map(f => (
            <button key={f} className={`tab ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatus(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Section filter */}
      <div className="section-tabs mb-4">
        <button className="section-tab"
          style={{ borderColor: sectionFilter === 'all' ? 'var(--gold)' : 'rgba(255,255,255,0.1)', color: sectionFilter === 'all' ? 'var(--gold)' : 'var(--muted)', background: sectionFilter === 'all' ? 'rgba(201,168,76,0.1)' : 'transparent' }}
          onClick={() => setSection('all')}>All Sections</button>
        {SECTIONS.map(s => (
          <button key={s.id} className="section-tab"
            style={{ borderColor: sectionFilter === s.id ? s.color : 'rgba(255,255,255,0.1)', color: sectionFilter === s.id ? s.color : 'var(--muted)', background: sectionFilter === s.id ? s.bg : 'transparent' }}
            onClick={() => setSection(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ref</th><th>Section / Table</th><th>Customer</th>
                {showServer && <th>Server</th>}
                {role !== 'server' && <th>Cashier</th>}
                <th>Total</th><th>Pay</th><th>Status</th><th>Time</th><th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const sc = getSectionCfg(o.sectionId);
                return (
                  <tr key={o.id}>
                    <td className="text-muted text-xs">#{o.id.slice(-6)}</td>
                    <td>
                      <span className="section-pill" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.icon} {sc.label}</span>
                      <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>T{o.table}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{o.customerName}</td>
                    {showServer && <td style={{ fontSize: 12 }}>{o.serverName}</td>}
                    {role !== 'server' && <td style={{ fontSize: 12, color: o.cashierName ? 'var(--purple)' : 'var(--muted)' }}>{o.cashierName || '—'}</td>}
                    <td className="text-gold font-bold">{fmt(o.bill?.total || 0)}</td>
                    <td><span className={`badge badge-${o.payMethod === 'cash' ? 'cash' : 'paystack'}`}>{o.payMethod}</span></td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                    <td className="text-muted text-xs">{new Date(o.createdAt).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => setSelected(o)}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && <div className="empty-state"><div className="empty-icon">🧾</div><p>No orders found</p></div>}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">Order #{selected.id.slice(-6)}</div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Order meta */}
              <div className="grid-2 mb-4">
                <div><div className="form-label">Payment Method</div><span className={`badge badge-${selected.payMethod === 'cash' ? 'cash' : 'paystack'}`}>{selected.payMethod}</span></div>
                <div><div className="form-label">Status</div><span className={`badge badge-${selected.status}`}>{selected.status}</span></div>
                {selected.cashReceived && <div><div className="form-label">Cash Received</div><span className="text-gold">{fmt(selected.cashReceived)}</span></div>}
                {selected.changeGiven  && <div><div className="form-label">Change Given</div><span className="text-success">{fmt(selected.changeGiven)}</span></div>}
                {selected.paystackRef  && <div style={{ gridColumn: '1/-1' }}><div className="form-label">Paystack Ref</div><span className="text-sm text-muted">{selected.paystackRef}</span></div>}
              </div>
              <div className="receipt-zone" ref={printRef}>
                <Receipt order={selected} showStamp={selected.status === 'paid'} />
              </div>
            </div>
            <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
              {canApprove && selected.status === 'open' && (
                <button className="btn btn-success btn-sm" onClick={() => approvePaid(selected)}>✅ Approve Payment</button>
              )}
              {canApprove && selected.status === 'open' && (
                <button className="btn btn-outline btn-sm" onClick={() => closeOrder(selected)}>Close Order</button>
              )}
              {canPrint && selected.status === 'paid' && (
                <button className="btn btn-gold btn-sm" onClick={printReceipt}>🖨️ Print Receipt</button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
