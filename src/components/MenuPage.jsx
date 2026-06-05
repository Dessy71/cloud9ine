import { useState } from 'react';
import { fmt } from '../utils/constants.js';
import { store } from '../utils/storage.js';

export default function MenuPage({ ctx }) {
  const { data, saveAndSync, STORAGE_KEYS } = ctx;
  const [tab, setTab] = useState('food');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category: '', available: true });
  const menu = tab === 'food' ? data.menuFood : data.menuDrinks;
  const key  = tab === 'food' ? STORAGE_KEYS.MENU_FOOD : STORAGE_KEYS.MENU_DRINKS;

  function save() {
    if (!form.name || !form.price || !form.category) return;
    const updated = editing
      ? menu.map(i => i.id === editing.id ? { ...i, ...form, price: Number(form.price) } : i)
      : [...menu, { ...form, id: (tab === 'food' ? 'f' : 'd') + Date.now(), price: Number(form.price) }];
    saveAndSync(key, updated); setModal(false);
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="menu-tabs" style={{ marginBottom: 0 }}>
          <button className={`menu-tab ${tab === 'food' ? 'active' : ''}`} onClick={() => setTab('food')}>🍽️ Food</button>
          <button className={`menu-tab ${tab === 'drinks' ? 'active' : ''}`} onClick={() => setTab('drinks')}>🍹 Drinks</button>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => { setEditing(null); setForm({ name: '', price: '', category: '', available: true }); setModal(true); }}>+ Add Item</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {menu.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="tag">{item.category}</span></td>
                  <td className="text-gold font-bold">{fmt(item.price)}</td>
                  <td><span className={`badge ${item.available ? 'badge-active' : 'badge-suspended'}`}>{item.available ? 'Available' : 'Unavailable'}</span></td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditing(item); setForm({ ...item }); setModal(true); }}>Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => saveAndSync(key, menu.map(i => i.id === item.id ? { ...i, available: !i.available } : i))}>{item.available ? 'Disable' : 'Enable'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => saveAndSync(key, menu.filter(i => i.id !== item.id))}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Item' : 'Add Menu Item'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Price (GHS)</label><input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Cocktails, Mains" /></div>
              <div className="form-group"><label className="form-label">Availability</label>
                <select className="form-select" value={form.available} onChange={e => setForm({ ...form, available: e.target.value === 'true' })}>
                  <option value="true">Available</option><option value="false">Unavailable</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={save}>{editing ? 'Save Changes' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
