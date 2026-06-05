import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { ServerOverview } from './Overview.jsx';
import NewOrderPage from './NewOrderPage.jsx';
import OrdersPage from './OrdersPage.jsx';
import FloorPage from './FloorPage.jsx';
import ChatPage from './ChatPage.jsx';

export default function ServerDashboard({ ctx }) {
  const [tab, setTab] = useState('overview');
  const [sideOpen, setSideOpen] = useState(false);
  const { data, session, logout, goOnBreak } = ctx;

  const unread = data.messages.filter(m => !m.readBy?.includes(session.id) && m.senderId !== session.id).length;
  const myOpen = data.orders.filter(o => o.serverId === session.id && o.status === 'open').length;

  const nav = [
    { id:'overview',   icon:'📊', label:'My Overview' },
    { id:'new-order',  icon:'➕', label:'New Order' },
    { id:'my-orders',  icon:'🧾', label:'My Orders', badge: myOpen },
    { id:'floor',      icon:'🪑', label:'Floor View' },
    { id:'chat',       icon:'💬', label:'Messages',  badge: unread },
  ];

  const titles = { overview:'My Overview', 'new-order':'New Order', 'my-orders':'My Orders', floor:'Floor View', chat:'Messages' };

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
          {tab === 'overview'  && <ServerOverview ctx={ctx} />}
          {tab === 'new-order' && <NewOrderPage ctx={ctx} />}
          {tab === 'my-orders' && <OrdersPage ctx={ctx} role="server" />}
          {tab === 'floor'     && <FloorPage ctx={ctx} />}
          {tab === 'chat'      && <ChatPage ctx={ctx} />}
        </div>
      </div>
    </div>
  );
}
