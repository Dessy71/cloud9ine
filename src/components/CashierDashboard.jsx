import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { CashierOverview } from './Overview.jsx';
import OrdersPage from './OrdersPage.jsx';
import FloorPage from './FloorPage.jsx';
import ChatPage from './ChatPage.jsx';
import { downloadExcel, downloadPDF } from '../utils/reports.js';
import { store, logActivity } from '../utils/storage.js';

export default function CashierDashboard({ ctx }) {
  const [tab, setTab] = useState('overview');
  const [sideOpen, setSideOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const { data, session, logout, goOnBreak, STORAGE_KEYS } = ctx;

  const unread   = data.messages.filter(m => !m.readBy?.includes(session.id) && m.senderId !== session.id).length;
  const pending  = data.orders.filter(o => o.status === 'open').length;

  const nav = [
    { id:'overview', icon:'📊', label:'Overview' },
    { id:'orders',   icon:'🧾', label:'Orders',   badge: pending },
    { id:'floor',    icon:'🪑', label:'Floor View' },
    { id:'report',   icon:'📤', label:'Daily Report' },
    { id:'chat',     icon:'💬', label:'Messages',  badge: unread },
  ];

  const titles = { overview:'Overview', orders:'Orders', floor:'Floor View', report:'Daily Report', chat:'Messages' };

  function sendReportToManager() {
    // Download files
    downloadExcel(data.orders, data.servers);
    downloadPDF(data.orders, data.servers);

    // Send message to manager
    const msgs = store.get(STORAGE_KEYS.MESSAGES, []);
    const today = new Date().toLocaleDateString('en-GH', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    const paid  = data.orders.filter(o => o.status === 'paid' && new Date(o.createdAt).toDateString() === new Date().toDateString());
    const rev   = paid.reduce((s, o) => s + (o.bill?.total || 0), 0);
    const cash  = paid.filter(o => o.payMethod === 'cash').reduce((s, o) => s + (o.bill?.total || 0), 0);
    const digi  = paid.filter(o => o.payMethod === 'paystack').reduce((s, o) => s + (o.bill?.total || 0), 0);
    const comm  = paid.reduce((s, o) => s + (o.bill?.commission || 0), 0);
    const tips  = paid.reduce((s, o) => s + (o.bill?.tipAmt || 0), 0);

    const reportText = `📊 DAILY REPORT — ${today}\n\nSent by: ${session.name} (Cashier)\n\n` +
      `Total Revenue: GHS ${rev.toFixed(2)}\nCash: GHS ${cash.toFixed(2)} | Digital: GHS ${digi.toFixed(2)}\n` +
      `Commissions: GHS ${comm.toFixed(2)} | Tips: GHS ${tips.toFixed(2)}\nPaid Orders: ${paid.length}\n\n` +
      `Excel & PDF report downloaded to your device. ✅`;

    const msg = {
      id: 'msg_' + Date.now(),
      type: 'broadcast',
      senderId: session.id, senderName: session.name, senderAvatar: session.avatar || '💰',
      recipientId: null,
      text: reportText,
      ts: new Date().toISOString(), readBy: [session.id],
      isReport: true,
    };
    store.set(STORAGE_KEYS.MESSAGES, [...msgs, msg]);
    logActivity({ type: 'payment', userId: session.id, userName: session.name, userRole: 'cashier', detail: `Daily report sent by ${session.name}` });
    ctx.loadAll();
    setReportMsg('✅ Report sent to manager and files downloaded!');
    setTimeout(() => setReportMsg(''), 4000);
  }

  return (
    <div className="dashboard">
      <Sidebar session={session} navItems={nav} onNav={setTab} activeTab={tab} onBreak={goOnBreak} onLogout={logout} isOpen={sideOpen} onClose={() => setSideOpen(false)} />
      <div className="main-content">
        <div className="topbar">
          <div className="flex items-center gap-2">
            <button className="hamburger" onClick={() => setSideOpen(true)}>☰</button>
            <div className="topbar-title">{titles[tab]}</div>
          </div>
          <div className="topbar-right">
            {session.availability === 'break' && <span style={{ fontSize: 11, color: 'var(--warning)', padding: '4px 10px', background: 'rgba(243,156,18,0.1)', borderRadius: 20 }}>☕ On Break</span>}
          </div>
        </div>
        <div className="page">
          {tab === 'overview' && <CashierOverview ctx={ctx} />}
          {tab === 'orders'   && <OrdersPage ctx={ctx} role="cashier" />}
          {tab === 'floor'    && <FloorPage ctx={ctx} />}
          {tab === 'chat'     && <ChatPage ctx={ctx} />}
          {tab === 'report'   && (
            <div className="fade-in" style={{ maxWidth: 640 }}>
              {reportMsg && <div className="alert alert-success">{reportMsg}</div>}
              <div className="card mb-4">
                <div className="card-header"><div className="card-title">📤 Send Daily Report to Manager</div></div>
                <div className="card-body">
                  <p className="text-sm text-muted mb-4">This will automatically calculate all of today's activity — items sold, commissions and tips per server — and send the manager a broadcast message plus download an Excel file and a PDF report.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                    {[
                      ['Orders Today', data.orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status === 'paid').length],
                      ['Revenue', 'GHS ' + data.orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status === 'paid').reduce((s,o)=>s+(o.bill?.total||0),0).toFixed(2)],
                      ['Cash', 'GHS ' + data.orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status === 'paid' && o.payMethod === 'cash').reduce((s,o)=>s+(o.bill?.total||0),0).toFixed(2)],
                      ['Digital', 'GHS ' + data.orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status === 'paid' && o.payMethod === 'paystack').reduce((s,o)=>s+(o.bill?.total||0),0).toFixed(2)],
                    ].map(([label, val]) => (
                      <div key={label} className="stat-card"><div className="stat-label">{label}</div><div className="stat-value" style={{fontSize:20}}>{val}</div></div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn btn-gold" onClick={sendReportToManager}>📤 Send Report + Download Files</button>
                    <button className="btn btn-outline" onClick={() => downloadExcel(data.orders, data.servers)}>📊 Download Excel Only</button>
                    <button className="btn btn-outline" onClick={() => downloadPDF(data.orders, data.servers)}>📄 Download PDF Only</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
