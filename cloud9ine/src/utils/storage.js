import { STORAGE_KEYS, INITIAL_FOOD, INITIAL_DRINKS, INITIAL_MANAGER } from './constants.js';

export const store = {
  get: (k, fb = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
};

export function initStorage() {
  if (!store.get(STORAGE_KEYS.MENU_FOOD))   store.set(STORAGE_KEYS.MENU_FOOD,   INITIAL_FOOD);
  if (!store.get(STORAGE_KEYS.MENU_DRINKS)) store.set(STORAGE_KEYS.MENU_DRINKS, INITIAL_DRINKS);
  if (!store.get(STORAGE_KEYS.SERVERS))     store.set(STORAGE_KEYS.SERVERS,     [INITIAL_MANAGER]);
  if (!store.get(STORAGE_KEYS.ORDERS))      store.set(STORAGE_KEYS.ORDERS,      []);
  if (!store.get(STORAGE_KEYS.MESSAGES))    store.set(STORAGE_KEYS.MESSAGES,    []);
  if (!store.get(STORAGE_KEYS.ACTIVITY))    store.set(STORAGE_KEYS.ACTIVITY,    []);
  if (!store.get(STORAGE_KEYS.SETTINGS))    store.set(STORAGE_KEYS.SETTINGS,    {
    paystackKey: 'pk_test_e589f26c71faa5d88b250c6516c743628cb9da44',
    clubName: 'Cloud 9ine',
  });
}

let bc;
try { bc = new BroadcastChannel('cloud9ine_sync'); } catch { bc = null; }
export function broadcastSync() { if (bc) bc.postMessage({ type: 'sync', ts: Date.now() }); }
export function onBroadcast(cb) {
  if (!bc) return () => {};
  bc.addEventListener('message', cb);
  return () => bc.removeEventListener('message', cb);
}

// Activity logger
export function logActivity(entry) {
  const logs = store.get(STORAGE_KEYS.ACTIVITY, []);
  const newLog = { id: 'log_' + Date.now(), ts: new Date().toISOString(), ...entry };
  store.set(STORAGE_KEYS.ACTIVITY, [newLog, ...logs].slice(0, 500)); // keep last 500
  broadcastSync();
}
