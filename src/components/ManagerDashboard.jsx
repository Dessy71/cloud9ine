import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { ManagerOverview } from './Overview.jsx';
import OrdersPage from './OrdersPage.jsx';
import FloorPage from './FloorPage.jsx';
import MenuPage from './MenuPage.jsx';
import StaffPage from './StaffPage.jsx';
import ChatPage from './ChatPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import ActivityLog from './ActivityLog.jsx';

export default function ManagerDashboard({ ctx }) {
  const [tab, setTab] = useState('overview');
  const [sideOpen, setSideOpen] = useState(false);
  const { data, session, logout } = ctx;

  const unread  = data.messages.filter(m => !m.readBy?.includes(session.id) && m.senderId !== session.id).length;
  const pending  = data.servers.filter(s => s.status === 'pending').length;
  const openOrds = data.orders.filter(o => o.status === 'open').length;

  const nav = [
    { id:'overview', icon:'📊', label:'Overview' },
    { id:'orders',   icon:'🧾', label:'Orders',   badge: openOrds },
    { id:'floor',    icon:'🪑', label:'Floor View' },
    { id:'menu',     icon:'🍽️', label:'Menu' },
    { id:'staff',    icon:'👥', label:'Staff',     badge: pending },
    { id:'chat',     icon:'💬', label:'Messages',  badge: unread },
    { id:'activity', icon:'📋', label:'Activity Log' },
    { id:'settings', icon:'⚙️', label:'Settings' },
  ];

  const titles = { overview:'Overview', orders:'Orders', floor:'Floor View', menu:'Menu Management', staff:'Staff Management', chat:'Messages', activity:'Activity Log', settings:'Settings' };

  return (
    <div className="dashboard">
      <Sidebar session={session} navItems={nav} onNav={setTab} activeTab={tab} onLogout={logout} isOpen={sideOpen} onClose={() => setSideOpen(false)} />
      <div className="main-content">
        <div className="topbar">
          <div className="flex items-center gap-2">
            <button className="hamburger" onClick={() => setSideOpen(true)}>☰</button>
            <div className="topbar-title">{titles[tab]}</div>
          </div>
          <div className="topbar-right">
            <span className="text-sm text-muted">{new Date().toLocaleDateString('en-GH', { weekday:'short', month:'short', day:'numeric' })}</span>
          </div>
        </div>
        <div className="page">
          {tab === 'overview'  && <ManagerOverview ctx={ctx} />}
          {tab === 'orders'    && <OrdersPage ctx={ctx} role="manager" />}
          {tab === 'floor'     && <FloorPage ctx={ctx} />}
          {tab === 'menu'      && <MenuPage ctx={ctx} />}
          {tab === 'staff'     && <StaffPage ctx={ctx} />}
          {tab === 'chat'      && <ChatPage ctx={ctx} />}
          {tab === 'activity'  && <ActivityLog ctx={ctx} />}
          {tab === 'settings'  && <SettingsPage ctx={ctx} />}
        </div>
      </div>
    </div>
  );
}
