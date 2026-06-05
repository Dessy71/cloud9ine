import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmt, getSectionCfg } from './constants.js';

function todayOrders(orders) {
  const today = new Date().toDateString();
  return orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status === 'paid');
}

export function generateDailyReport(orders, servers) {
  const paid = todayOrders(orders);
  const dateStr = new Date().toLocaleDateString('en-GH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Per-server summary
  const serverSummary = servers
    .filter(s => s.role === 'server')
    .map(s => {
      const sOrders = paid.filter(o => o.serverId === s.id);
      const sales    = sOrders.reduce((x, o) => x + (o.bill?.afterDiscount || 0), 0);
      const comm     = sOrders.reduce((x, o) => x + (o.bill?.commission  || 0), 0);
      const tips     = sOrders.reduce((x, o) => x + (o.bill?.tipAmt      || 0), 0);
      const cash     = sOrders.filter(o => o.payMethod === 'cash').reduce((x, o) => x + (o.bill?.total || 0), 0);
      const digital  = sOrders.filter(o => o.payMethod === 'paystack').reduce((x, o) => x + (o.bill?.total || 0), 0);
      return { name: s.name, orders: sOrders.length, sales, commission: comm, tips, cash, digital, total: sales };
    });

  const totals = {
    orders:     paid.length,
    revenue:    paid.reduce((x, o) => x + (o.bill?.total         || 0), 0),
    commission: paid.reduce((x, o) => x + (o.bill?.commission    || 0), 0),
    tips:       paid.reduce((x, o) => x + (o.bill?.tipAmt        || 0), 0),
    cash:       paid.filter(o => o.payMethod === 'cash').reduce((x, o) => x + (o.bill?.total || 0), 0),
    digital:    paid.filter(o => o.payMethod === 'paystack').reduce((x, o) => x + (o.bill?.total || 0), 0),
    vat:        paid.reduce((x, o) => x + (o.bill?.vat           || 0), 0),
    nhil:       paid.reduce((x, o) => x + (o.bill?.nhil          || 0), 0),
    getfl:      paid.reduce((x, o) => x + (o.bill?.getfl         || 0), 0),
  };

  return { paid, serverSummary, totals, dateStr };
}

export function downloadExcel(orders, servers) {
  const { paid, serverSummary, totals, dateStr } = generateDailyReport(orders, servers);

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['CLOUD 9INE — DAILY REPORT', '', '', '', '', '', ''],
    [dateStr, '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Server', 'Orders', 'Net Sales (GHS)', 'Commission (GHS)', 'Tips (GHS)', 'Cash (GHS)', 'Digital (GHS)'],
    ...serverSummary.map(s => [s.name, s.orders, s.sales.toFixed(2), s.commission.toFixed(2), s.tips.toFixed(2), s.cash.toFixed(2), s.digital.toFixed(2)]),
    ['', '', '', '', '', '', ''],
    ['TOTALS', totals.orders, totals.revenue.toFixed(2), totals.commission.toFixed(2), totals.tips.toFixed(2), totals.cash.toFixed(2), totals.digital.toFixed(2)],
    ['', '', '', '', '', '', ''],
    ['TAX BREAKDOWN', '', '', '', '', '', ''],
    ['VAT (15%)', '', '', totals.vat.toFixed(2), '', '', ''],
    ['NHIL (2.5%)', '', '', totals.nhil.toFixed(2), '', '', ''],
    ['GETFL (1%)', '', '', totals.getfl.toFixed(2), '', '', ''],
    ['Cash vs Digital Balance', '', '', '', '', '', ''],
    ['Cash Total', totals.cash.toFixed(2), '', 'Digital Total', totals.digital.toFixed(2), '', ''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Daily Summary');

  // Orders detail sheet
  const ordersData = [
    ['Order Ref', 'Time', 'Section', 'Table', 'Customer', 'Server', 'Cashier', 'Items', 'Subtotal', 'Discount', 'VAT', 'NHIL', 'GETFL', 'Tip', 'Total', 'Commission', 'Payment Method'],
    ...paid.map(o => {
      const sc = getSectionCfg(o.sectionId);
      return [
        '#' + o.id.slice(-6),
        new Date(o.createdAt).toLocaleTimeString('en-GH', { hour:'2-digit', minute:'2-digit' }),
        sc.label,
        o.table,
        o.customerName,
        o.serverName,
        o.cashierName || '—',
        o.items?.map(i => `${i.name} x${i.qty}`).join(', '),
        (o.bill?.subtotal     || 0).toFixed(2),
        (o.bill?.discountAmt  || 0).toFixed(2),
        (o.bill?.vat          || 0).toFixed(2),
        (o.bill?.nhil         || 0).toFixed(2),
        (o.bill?.getfl        || 0).toFixed(2),
        (o.bill?.tipAmt       || 0).toFixed(2),
        (o.bill?.total        || 0).toFixed(2),
        (o.bill?.commission   || 0).toFixed(2),
        o.payMethod,
      ];
    }),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(ordersData);
  ws2['!cols'] = Array(17).fill({ wch: 16 });
  XLSX.utils.book_append_sheet(wb, ws2, 'Orders Detail');

  XLSX.writeFile(wb, `Cloud9ine_DailyReport_${new Date().toISOString().slice(0,10)}.xlsx`);
}

export function downloadPDF(orders, servers) {
  const { paid, serverSummary, totals, dateStr } = generateDailyReport(orders, servers);

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('☁ CLOUD 9INE', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Daily Activity Report', 14, 26);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(dateStr, 14, 33);
  doc.setTextColor(0);

  // Totals summary box
  doc.setFontSize(10);
  const summaryY = 42;
  const summaryItems = [
    ['Total Revenue', fmt(totals.revenue)],
    ['Total Orders',  String(totals.orders)],
    ['Cash Collected',fmt(totals.cash)],
    ['Digital Payments', fmt(totals.digital)],
    ['Total Commission', fmt(totals.commission)],
    ['Total Tips',    fmt(totals.tips)],
    ['VAT (15%)',     fmt(totals.vat)],
    ['NHIL (2.5%)',   fmt(totals.nhil)],
    ['GETFL (1%)',    fmt(totals.getfl)],
  ];
  autoTable(doc, {
    startY: summaryY,
    head: [['Metric', 'Amount']],
    body: summaryItems,
    theme: 'striped',
    headStyles: { fillColor: [201, 168, 76], textColor: [0,0,0] },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 } },
    margin: { left: 14 },
    tableWidth: 'auto',
  });

  // Per-server table
  const afterSummary = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff Performance', 14, afterSummary);
  autoTable(doc, {
    startY: afterSummary + 4,
    head: [['Server', 'Orders', 'Net Sales', 'Commission', 'Tips', 'Cash', 'Digital']],
    body: serverSummary.map(s => [
      s.name, s.orders,
      fmt(s.sales), fmt(s.commission), fmt(s.tips), fmt(s.cash), fmt(s.digital),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [201, 168, 76], textColor: [0,0,0] },
    styles: { fontSize: 9 },
    margin: { left: 14 },
  });

  // Orders detail
  const afterStaff = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Detail', 14, afterStaff);
  autoTable(doc, {
    startY: afterStaff + 4,
    head: [['Ref', 'Time', 'Section', 'T', 'Customer', 'Server', 'Cashier', 'Total', 'Pay']],
    body: paid.map(o => {
      const sc = getSectionCfg(o.sectionId);
      return [
        '#'+o.id.slice(-6),
        new Date(o.createdAt).toLocaleTimeString('en-GH',{hour:'2-digit',minute:'2-digit'}),
        sc.label, o.table, o.customerName,
        o.serverName, o.cashierName||'—',
        fmt(o.bill?.total||0), o.payMethod,
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [201, 168, 76], textColor: [0,0,0] },
    styles: { fontSize: 8 },
    margin: { left: 14 },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Cloud 9ine — Confidential | Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 8);
  }

  doc.save(`Cloud9ine_DailyReport_${new Date().toISOString().slice(0,10)}.pdf`);
}
