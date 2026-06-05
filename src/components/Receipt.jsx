import { fmt, getSectionCfg } from '../utils/constants.js';

export default function Receipt({ order, showStamp = false }) {
  const now = new Date(order.paidAt || order.createdAt || Date.now());
  const sc = getSectionCfg(order.sectionId);
  return (
    <div className="receipt">
      <div className="receipt-logo">
        <h2>☁ CLOUD 9INE</h2>
        <p>Restaurant &amp; Bar</p>
        <p style={{ fontSize: 9, marginTop: 2 }}>{now.toLocaleString('en-GH')}</p>
      </div>
      {showStamp && <div className="paid-stamp">PAID</div>}
      <hr className="receipt-hr" />
      <div className="receipt-row"><span>Section:</span><span>{sc.icon} {sc.label}</span></div>
      <div className="receipt-row"><span>Table:</span><span>{order.table}</span></div>
      <div className="receipt-row"><span>Customer:</span><span>{order.customerName || order.customer}</span></div>
      <div className="receipt-row"><span>Server:</span><span>{order.serverName || order.server}</span></div>
      {order.cashierName && <div className="receipt-row"><span>Cashier:</span><span>{order.cashierName}</span></div>}
      <hr className="receipt-hr" />
      {(order.items || []).map(i => (
        <div key={i.id} className="receipt-row"><span>{i.name} x{i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>
      ))}
      <hr className="receipt-hr" />
      <div className="receipt-row"><span>Subtotal</span><span>{fmt(order.bill?.subtotal || 0)}</span></div>
      {order.discount > 0 && <div className="receipt-row"><span>Discount ({order.discount}%)</span><span>-{fmt(order.bill?.discountAmt || 0)}</span></div>}
      <div className="receipt-row"><span>VAT (15%)</span><span>{fmt(order.bill?.vat || 0)}</span></div>
      <div className="receipt-row"><span>NHIL (2.5%)</span><span>{fmt(order.bill?.nhil || 0)}</span></div>
      <div className="receipt-row"><span>GETFL (1%)</span><span>{fmt(order.bill?.getfl || 0)}</span></div>
      {(order.bill?.tipAmt || 0) > 0 && <div className="receipt-row"><span>Tip</span><span>{fmt(order.bill.tipAmt)}</span></div>}
      <hr className="receipt-hr" />
      <div className="receipt-row receipt-bold"><span>TOTAL</span><span>{fmt(order.bill?.total || 0)}</span></div>
      <div className="receipt-row"><span>Payment</span><span style={{ textTransform: 'uppercase' }}>{order.payMethod}</span></div>
      {order.paystackRef && <div className="receipt-row"><span>Ref</span><span style={{ fontSize: 9 }}>{order.paystackRef}</span></div>}
      <hr className="receipt-hr" />
      <div style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>
        <p>Thank you for visiting Cloud 9ine!</p>
        <p style={{ marginTop: 3 }}>Ghana VAT Reg. No: XXXXXXXX</p>
      </div>
    </div>
  );
}
