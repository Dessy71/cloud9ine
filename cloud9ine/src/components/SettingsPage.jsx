
import { useState } from 'react';
import { SECTIONS, fmt } from '../utils/constants.js';

export default function SettingsPage({ ctx }) {
  const { data, saveAndSync, STORAGE_KEYS } = ctx;
  const [settings, setSettings] = useState({
    paystackKey: 'pk_test_e589f26c71faa5d88b250c6516c743628cb9da44',
    clubName: 'Cloud 9ine',
    ...data.settings,
  });
  const [saved, setSaved] = useState(false);

  function save() {
    saveAndSync(STORAGE_KEYS.SETTINGS, settings);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      {saved && <div className="alert alert-success">✅ Settings saved!</div>}

      <div className="card mb-4">
        <div className="card-header"><div className="card-title">💳 Paystack Integration</div></div>
        <div className="card-body">
          <div className="alert alert-info">Test key pre-loaded. Replace with live key when going live. Secret key stays server-side only.</div>
          <div className="form-group">
            <label className="form-label">Paystack Public Key</label>
            <input className="form-input" value={settings.paystackKey || ''} onChange={e => setSettings({ ...settings, paystackKey: e.target.value })} placeholder="pk_live_…" />
          </div>
          <div className="form-group">
            <label className="form-label">Club Name (on receipts)</label>
            <input className="form-input" value={settings.clubName || ''} onChange={e => setSettings({ ...settings, clubName: e.target.value })} />
          </div>
          <button className="btn btn-gold" onClick={save}>Save Settings</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><div className="card-title">🪑 Sections & Tables</div></div>
        <div className="card-body">
          {SECTIONS.map(s => (
            <div key={s.id} className="flex items-center gap-3 mb-3" style={{ padding: '10px 14px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}` }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.tables} tables</div>
              </div>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: s.color }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><div className="card-title">💰 Commission & Tax</div></div>
        <div className="card-body">
          <div className="grid-2">
            <div>
              <div className="form-label" style={{ marginBottom: 10 }}>Commission</div>
              <div className="bill-row"><span>Rate</span><span className="text-gold font-bold">2.5%</span></div>
              <div className="bill-row"><span>Applied on</span><span className="text-muted text-sm">Net sales (excl. tip)</span></div>
              <div className="bill-row"><span>Tips</span><span className="text-muted text-sm">100% to server</span></div>
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: 10 }}>Ghana Tax Levies</div>
              <div className="bill-row"><span>VAT</span><span className="text-gold">15%</span></div>
              <div className="bill-row"><span>NHIL</span><span className="text-gold">2.5%</span></div>
              <div className="bill-row"><span>GETFL</span><span className="text-gold">1%</span></div>
              <hr className="bill-divider" style={{ margin: '6px 0' }} />
              <div className="bill-row font-bold"><span>Total Tax</span><span className="text-gold">18.5%</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">👥 Role Permissions</div></div>
        <div className="card-body">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Action</th><th>Manager</th><th>Cashier</th><th>Server</th></tr></thead>
              <tbody>
                {[
                  ['Create orders',          '—',  '—',  '✅'],
                  ['Approve payment',         '—',  '✅', '—'],
                  ['Close orders',            '—',  '✅', '—'],
                  ['Print receipts',          '✅', '✅', '—'],
                  ['View all orders',         '✅', '✅', 'Own only'],
                  ['Manage staff',            '✅', '—',  '—'],
                  ['Manage menu',             '✅', '—',  '—'],
                  ['Daily report',            '✅', '✅', '—'],
                  ['Broadcast messages',      '✅', '✅', '—'],
                  ['Send DMs',               '✅', '✅', '✅'],
                  ['View activity log',       '✅', '—',  '—'],
                ].map(([a,m,c,s]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td style={{ color: m === '✅' ? 'var(--success)' : m === '—' ? 'var(--muted)' : 'var(--text)' }}>{m}</td>
                    <td style={{ color: c === '✅' ? 'var(--success)' : c === '—' ? 'var(--muted)' : 'var(--text)' }}>{c}</td>
                    <td style={{ color: s === '✅' ? 'var(--success)' : s === '—' ? 'var(--muted)' : 'var(--text)' }}>{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
