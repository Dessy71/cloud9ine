import { useState } from 'react';
import { SECTIONS, getSectionCfg, calcBill, fmt } from '../utils/constants.js';
import { store } from '../utils/storage.js';

export default function NewOrderPage({ ctx }) {
  const { data, session, saveAndSync, STORAGE_KEYS } = ctx;
  const [menuTab, setMenuTab]       = useState('food');
  const [sectionId, setSectionId]   = useState(SECTIONS[0].id);
  const [tableNo, setTableNo]       = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cartItems, setCartItems]   = useState([]);
  const [discount, setDiscount]     = useState(0);
  const [tip, setTip]               = useState(0);
  const [payMethod, setPayMethod]   = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState('');
  const [err, setErr]               = useState('');

  const section = getSectionCfg(sectionId);
  const menu    = menuTab === 'food' ? data.menuFood : data.menuDrinks;
  const bill    = calcBill(cartItems, discount, Number(tip));
  const change  = Number(cashReceived) - bill.total;

  function isOccupied(t) {
    return data.orders.some(o => String(o.table) === String(t) && o.sectionId === sectionId && o.status === 'open');
  }

  function addItem(item) {
    if (!item.available) return;
    setCartItems(prev => {
      const ex = prev.find(i => i.id === item.id);
      return ex ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }];
    });
  }

  function setQty(id, qty) {
    if (qty <= 0) setCartItems(prev => prev.filter(i => i.id !== id));
    else setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }

  function handlePaystack() {
    const key = data.settings?.paystackKey || 'pk_test_e589f26c71faa5d88b250c6516c743628cb9da44';
    setProcessing(true);
    const run = () => {
      const handler = window.PaystackPop.setup({
        key, email: 'customer@cloud9ine.com',
        amount: Math.round(bill.total * 100), currency: 'GHS',
        ref: 'c9_' + Date.now(),
        onClose: () => setProcessing(false),
        callback: (res) => { placeOrder('paystack', res.reference); setProcessing(false); },
      });
      handler.openIframe();
    };
    if (document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) { run(); return; }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = run;
    document.body.appendChild(s);
  }

  function placeOrder(method, paystackRef = null) {
    if (!tableNo || !customerName || cartItems.length === 0) { setErr('Fill table, customer and add items'); return; }
    if (isOccupied(tableNo)) { setErr('Table is occupied — choose another'); return; }
    if (method === 'cash' && Number(cashReceived) < bill.total) { setErr('Cash received is less than total'); return; }

    const order = {
      id: 'ord_' + Date.now(),
      sectionId, table: tableNo, customerName,
      serverId: session.id, serverName: session.name,
      items: cartItems, bill, discount, tip: Number(tip),
      payMethod: method, paystackRef,
      status: 'open', // cashier must approve → paid
      cashReceived: method === 'cash' ? Number(cashReceived) : null,
      changeGiven:  method === 'cash' ? change : null,
      createdAt: new Date().toISOString(),
    };

    const orders = store.get(STORAGE_KEYS.ORDERS, []);
    saveAndSync(STORAGE_KEYS.ORDERS, [...orders, order]);

    // Notify cashiers via system message
    const cashiers = store.get(STORAGE_KEYS.SERVERS, []).filter(s => s.role === 'cashier' && s.status === 'active');
    const msgs = store.get(STORAGE_KEYS.MESSAGES, []);
    const notif = {
      id: 'msg_' + Date.now(),
      type: 'broadcast',
      senderId: 'system', senderName: 'System', senderAvatar: '🔔',
      recipientId: null,
      text: `💳 Payment pending: Order #${order.id.slice(-6)} — ${section.icon} ${section.label} T${tableNo} · ${customerName} · ${fmt(bill.total)} via ${method.toUpperCase()} — Server: ${session.name}`,
      ts: new Date().toISOString(), readBy: [],
      isSystemNotif: true, orderId: order.id,
    };
    saveAndSync(STORAGE_KEYS.MESSAGES, [...msgs, notif]);

    setCartItems([]); setTableNo(''); setCustomerName('');
    setDiscount(0); setTip(0); setCashReceived('');
    setErr(''); setSuccess(`Order #${order.id.slice(-6)} placed! Awaiting cashier approval.`);
    setTimeout(() => setSuccess(''), 5000);
  }

  const categories = [...new Set(menu.map(i => i.category))];
  const tableOccupied = tableNo && isOccupied(tableNo);

  return (
    <div className="fade-in">
      {success && <div className="alert alert-success">{success}</div>}
      {err     && <div className="alert alert-danger">{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }} className="order-layout">
        {/* Left — section/table picker + menu */}
        <div>
          {/* Section picker */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="form-label" style={{ marginBottom: 8 }}>Select Section</div>
              <div className="section-tabs">
                {SECTIONS.map(s => (
                  <button key={s.id} className="section-tab"
                    style={{ borderColor: sectionId === s.id ? s.color : 'rgba(255,255,255,0.1)', color: sectionId === s.id ? s.color : 'var(--muted)', background: sectionId === s.id ? s.bg : 'transparent' }}
                    onClick={() => { setSectionId(s.id); setTableNo(''); }}>
                    {s.icon} {s.label} <span style={{ fontSize: 10, opacity: 0.7 }}>({s.tables})</span>
                  </button>
                ))}
              </div>

              {/* Table grid */}
              <div className="form-label" style={{ marginTop: 12, marginBottom: 8 }}>
                Table — <span style={{ color: section.color }}>{section.icon} {section.label}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {Array.from({ length: section.tables }, (_, i) => i + 1).map(t => {
                  const occ = isOccupied(t);
                  const sel = String(tableNo) === String(t);
                  return (
                    <button key={t} onClick={() => !occ && setTableNo(String(t))}
                      style={{
                        width: 38, height: 38, borderRadius: 8, border: '2px solid', fontWeight: 700, fontSize: 12,
                        cursor: occ ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                        borderColor: sel ? section.color : occ ? 'var(--border)' : 'rgba(255,255,255,0.15)',
                        background: sel ? section.bg : occ ? 'rgba(255,255,255,0.03)' : 'transparent',
                        color: sel ? section.color : occ ? 'var(--muted)' : 'var(--text)',
                        opacity: occ ? 0.5 : 1, position: 'relative',
                      }}>
                      {t}
                      {occ && <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', border: '1px solid var(--deep)' }} />}
                    </button>
                  );
                })}
              </div>
              {tableOccupied && <div className="alert alert-warning mt-3" style={{ marginBottom: 0 }}>⚠️ Table {tableNo} is occupied</div>}

              <div className="mt-3">
                <label className="form-label">Customer Name</label>
                <input className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Ama Owusu" />
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="menu-tabs">
            <button className={`menu-tab ${menuTab === 'food' ? 'active' : ''}`} onClick={() => setMenuTab('food')}>🍽️ Food</button>
            <button className={`menu-tab ${menuTab === 'drinks' ? 'active' : ''}`} onClick={() => setMenuTab('drinks')}>🍹 Drinks</button>
          </div>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{cat}</div>
              <div className="menu-grid">
                {menu.filter(i => i.category === cat).map(item => (
                  <div key={item.id} className={`menu-item ${!item.available ? 'unavail' : ''}`} onClick={() => addItem(item)}>
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-cat">{item.category}</div>
                    <div className="menu-item-price">{fmt(item.price)}</div>
                    {!item.available && <div style={{ position: 'absolute', top: 5, right: 5, fontSize: 9, color: 'var(--danger)' }}>UNAVAIL</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right — Bill panel */}
        <div className="bill-panel">
          <div className="bill-title">🧾 Order</div>
          {tableNo && (
            <div style={{ padding: '5px 10px', borderRadius: 8, background: section.bg, border: `1px solid ${section.border}`, fontSize: 12, color: section.color, fontWeight: 600 }}>
              {section.icon} {section.label} · Table {tableNo}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Server: <strong style={{ color: 'var(--text)' }}>{session.name}</strong></div>

          {cartItems.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 12 }}>Tap items to add</div>
            : cartItems.map(i => (
              <div key={i.id} className="bill-item">
                <div className="bill-item-name">{i.name}</div>
                <div className="flex items-center gap-1">
                  <button className="qty-btn" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                  <span style={{ fontSize: 12, minWidth: 14, textAlign: 'center' }}>{i.qty}</span>
                  <button className="qty-btn" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                </div>
                <div className="bill-item-price">{fmt(i.price * i.qty)}</div>
              </div>
            ))
          }

          <hr className="bill-divider" />
          <div className="grid-2" style={{ gap: 8 }}>
            <div><label className="form-label">Discount %</label><input className="form-input" type="number" min={0} max={100} value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
            <div><label className="form-label">Tip (GHS)</label><input className="form-input" type="number" min={0} value={tip} onChange={e => setTip(e.target.value)} /></div>
          </div>

          <div>
            <div className="bill-row"><span>Subtotal</span><span>{fmt(bill.subtotal)}</span></div>
            {discount > 0 && <div className="bill-row tax"><span>Discount ({discount}%)</span><span style={{ color: 'var(--success)' }}>−{fmt(bill.discountAmt)}</span></div>}
            <div className="bill-row tax"><span>VAT 15%</span><span>{fmt(bill.vat)}</span></div>
            <div className="bill-row tax"><span>NHIL 2.5%</span><span>{fmt(bill.nhil)}</span></div>
            <div className="bill-row tax"><span>GETFL 1%</span><span>{fmt(bill.getfl)}</span></div>
            {Number(tip) > 0 && <div className="bill-row tax"><span>Tip</span><span>{fmt(bill.tipAmt)}</span></div>}
            <div className="bill-row tax" style={{ color: 'var(--success)', fontSize: 10 }}><span>Your Commission 2.5%</span><span>{fmt(bill.commission)}</span></div>
            <div className="bill-row total"><span>TOTAL</span><span>{fmt(bill.total)}</span></div>
          </div>

          {/* Payment method */}
          <div className="form-label">Payment Method</div>
          <div className="pay-options">
            <div className={`pay-opt ${payMethod === 'cash' ? 'sel' : ''}`} onClick={() => setPayMethod('cash')}>
              <div className="pay-opt-icon">💵</div><div className="pay-opt-label">Cash</div>
            </div>
            <div className={`pay-opt ${payMethod === 'paystack' ? 'sel' : ''}`} onClick={() => setPayMethod('paystack')}>
              <div className="pay-opt-icon">💳</div><div className="pay-opt-label">Paystack</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Card / MoMo</div>
            </div>
          </div>

          {payMethod === 'cash' && (
            <div>
              <label className="form-label">Cash Received (GHS)</label>
              <input className="form-input" type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} placeholder={`Min ${bill.total.toFixed(2)}`} />
              {cashReceived && Number(cashReceived) >= bill.total && <div className="alert alert-success" style={{ marginTop: 8 }}>Change: {fmt(change)}</div>}
            </div>
          )}

          {payMethod === 'cash' && (
            <button className="btn btn-gold btn-full"
              disabled={!tableNo || !customerName || cartItems.length === 0 || tableOccupied || Number(cashReceived) < bill.total}
              onClick={() => placeOrder('cash')}>
              💵 Place Order (Cash)
            </button>
          )}

          {payMethod === 'paystack' && (
            <button className="btn btn-gold btn-full"
              disabled={!tableNo || !customerName || cartItems.length === 0 || tableOccupied || processing}
              onClick={handlePaystack}>
              {processing ? 'Opening Paystack…' : '💳 Place Order (Paystack)'}
            </button>
          )}

          <div className="alert alert-info" style={{ marginBottom: 0, fontSize: 11 }}>
            ℹ️ Orders need cashier approval before a receipt is printed.
          </div>
        </div>
      </div>
    </div>
  );
}
