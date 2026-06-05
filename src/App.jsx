import { useState, useEffect } from 'react';
import { store, initStorage, broadcastSync, onBroadcast, logActivity } from './utils/storage.js';
import { STORAGE_KEYS, canLogin } from './utils/constants.js';
import Landing from './components/Landing.jsx';
import LoginPage from './components/LoginPage.jsx';
import HibernateScreen from './components/HibernateScreen.jsx';
import ManagerDashboard from './components/ManagerDashboard.jsx';
import CashierDashboard from './components/CashierDashboard.jsx';
import ServerDashboard from './components/ServerDashboard.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState('landing');
  const [hibernated, setHibernated] = useState(false);
  const [data, setData] = useState({
    servers: [], menuFood: [], menuDrinks: [], orders: [], messages: [], settings: {}, activity: [],
  });

  useEffect(() => {
    initStorage();
    loadAll();
    const saved = store.get(STORAGE_KEYS.SESSION);
    if (saved) {
      const servers = store.get(STORAGE_KEYS.SERVERS, []);
      const live = servers.find(x => x.id === saved.id);
      if (live && canLogin(live)) {
        setSession(live);
        store.set(STORAGE_KEYS.SESSION, live);
        setPage(live.role);
      } else {
        store.set(STORAGE_KEYS.SESSION, null);
      }
    }
    // Check if was hibernated
    const hib = sessionStorage.getItem('c9_hib');
    if (hib) setHibernated(true);
  }, []);

  useEffect(() => {
    const unsub = onBroadcast(e => { if (e.data?.type === 'sync') loadAll(); });
    return unsub;
  }, []);

  useEffect(() => {
    const iv = setInterval(loadAll, 1500);
    return () => clearInterval(iv);
  }, []);

  function loadAll() {
    setData({
      servers:   store.get(STORAGE_KEYS.SERVERS,    []),
      menuFood:  store.get(STORAGE_KEYS.MENU_FOOD,  []),
      menuDrinks:store.get(STORAGE_KEYS.MENU_DRINKS,[]),
      orders:    store.get(STORAGE_KEYS.ORDERS,     []),
      messages:  store.get(STORAGE_KEYS.MESSAGES,   []),
      settings:  store.get(STORAGE_KEYS.SETTINGS,   {}),
      activity:  store.get(STORAGE_KEYS.ACTIVITY,   []),
    });
  }

  function saveAndSync(key, val) {
    store.set(key, val);
    broadcastSync();
    loadAll();
  }

  function login(username, password, role) {
    const servers = store.get(STORAGE_KEYS.SERVERS, []);
    const user = servers.find(s =>
      s.username === username &&
      s.password === password &&
      s.role === role &&
      canLogin(s)
    );
    if (!user) return false;
    store.set(STORAGE_KEYS.SESSION, user);
    setSession(user);
    setPage(user.role);
    setHibernated(false);
    sessionStorage.removeItem('c9_hib');
    logActivity({ type: 'login', userId: user.id, userName: user.name, userRole: user.role, detail: `${user.name} (${user.role}) logged in` });
    broadcastSync();
    return true;
  }

  function logout() {
    if (session) {
      logActivity({ type: 'logout', userId: session.id, userName: session.name, userRole: session.role, detail: `${session.name} (${session.role}) logged out` });
      broadcastSync();
    }
    store.set(STORAGE_KEYS.SESSION, null);
    sessionStorage.removeItem('c9_hib');
    setSession(null);
    setHibernated(false);
    setPage('landing');
  }

  function goOnBreak() {
    if (!session) return;
    // Update availability
    const servers = store.get(STORAGE_KEYS.SERVERS, []);
    const updated = servers.map(s => s.id === session.id ? { ...s, availability: 'break' } : s);
    store.set(STORAGE_KEYS.SERVERS, updated);
    const newSession = { ...session, availability: 'break' };
    store.set(STORAGE_KEYS.SESSION, newSession);
    setSession(newSession);
    sessionStorage.setItem('c9_hib', '1');
    setHibernated(true);
    logActivity({ type: 'break', userId: session.id, userName: session.name, userRole: session.role, detail: `${session.name} went on break` });
    broadcastSync();
    loadAll();
  }

  function wakeFromBreak() {
    if (!session) return;
    const servers = store.get(STORAGE_KEYS.SERVERS, []);
    const updated = servers.map(s => s.id === session.id ? { ...s, availability: 'active' } : s);
    store.set(STORAGE_KEYS.SERVERS, updated);
    const newSession = { ...session, availability: 'active' };
    store.set(STORAGE_KEYS.SESSION, newSession);
    setSession(newSession);
    sessionStorage.removeItem('c9_hib');
    setHibernated(false);
    logActivity({ type: 'return', userId: session.id, userName: session.name, userRole: session.role, detail: `${session.name} returned from break` });
    broadcastSync();
    loadAll();
  }

  const ctx = { session, data, saveAndSync, loadAll, logout, goOnBreak, STORAGE_KEYS };

  if (hibernated && session) {
    return <HibernateScreen session={session} onUnlock={wakeFromBreak} onLogout={logout} />;
  }

  return (
    <div className="app fade-in">
      {page === 'landing'  && <Landing onSelect={setPage} />}
      {page === 'manager-login'  && <LoginPage role="manager"  onBack={() => setPage('landing')} onLogin={login} />}
      {page === 'cashier-login'  && <LoginPage role="cashier"  onBack={() => setPage('landing')} onLogin={login} />}
      {page === 'server-login'   && <LoginPage role="server"   onBack={() => setPage('landing')} onLogin={login} />}
      {page === 'manager'  && session && <ManagerDashboard  ctx={ctx} />}
      {page === 'cashier'  && session && <CashierDashboard  ctx={ctx} />}
      {page === 'server'   && session && <ServerDashboard   ctx={ctx} />}
    </div>
  );
}
