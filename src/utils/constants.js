export const GHANA_TAXES = { VAT: 0.15, NHIL: 0.025, GETFL: 0.01 };
export const COMMISSION_RATE = 0.025;

export const SECTIONS = [
  { id:'main',     label:'Main Floor', tables:20, color:'#C9A84C', bg:'rgba(201,168,76,0.12)',  border:'rgba(201,168,76,0.45)',  icon:'🏠' },
  { id:'vip',      label:'VIP',        tables:10, color:'#9B59B6', bg:'rgba(155,89,182,0.12)', border:'rgba(155,89,182,0.45)', icon:'👑' },
  { id:'terrace',  label:'Terrace',    tables:25, color:'#2ECC71', bg:'rgba(46,204,113,0.12)',  border:'rgba(46,204,113,0.45)',  icon:'🌿' },
  { id:'bar',      label:'Bar',        tables:20, color:'#E74C3C', bg:'rgba(231,76,60,0.12)',   border:'rgba(231,76,60,0.45)',   icon:'🍸' },
  { id:'poolside', label:'Poolside',   tables:20, color:'#3498DB', bg:'rgba(52,152,219,0.12)',  border:'rgba(52,152,219,0.45)',  icon:'☕' },
];

export const STORAGE_KEYS = {
  SESSION:    'c9_session',
  SERVERS:    'c9_servers',
  MENU_FOOD:  'c9_menu_food',
  MENU_DRINKS:'c9_menu_drinks',
  ORDERS:     'c9_orders',
  MESSAGES:   'c9_messages',
  SETTINGS:   'c9_settings',
  ACTIVITY:   'c9_activity',
};

export const INITIAL_FOOD = [
  { id:'f1', name:'Jollof Rice & Chicken', price:85,  category:'Mains',    available:true },
  { id:'f2', name:'Grilled Tilapia',        price:120, category:'Mains',    available:true },
  { id:'f3', name:'Kelewele',               price:35,  category:'Sides',    available:true },
  { id:'f4', name:'Waakye Special',         price:70,  category:'Mains',    available:true },
  { id:'f5', name:'Spring Rolls (6pcs)',    price:55,  category:'Starters', available:true },
  { id:'f6', name:'Banku & Okra Stew',      price:80,  category:'Mains',    available:true },
  { id:'f7', name:'Club Sandwich',          price:65,  category:'Starters', available:true },
  { id:'f8', name:'Puff Puff (8pcs)',       price:30,  category:'Desserts', available:true },
];

export const INITIAL_DRINKS = [
  { id:'d1',  name:'Signature Cloud Cocktail', price:95,   category:'Cocktails',     available:true },
  { id:'d2',  name:'Mojito',                   price:85,   category:'Cocktails',     available:true },
  { id:'d3',  name:'Hennessy VS (shot)',        price:120,  category:'Spirits',       available:true },
  { id:'d4',  name:'Ciroc Bottle',              price:850,  category:'Bottles',       available:true },
  { id:'d5',  name:'Heineken',                  price:45,   category:'Beers',         available:true },
  { id:'d6',  name:'Club Beer',                 price:35,   category:'Beers',         available:true },
  { id:'d7',  name:'Soft Drink',                price:20,   category:'Non-Alcoholic', available:true },
  { id:'d8',  name:'Sparkling Water',           price:25,   category:'Non-Alcoholic', available:true },
  { id:'d9',  name:'Champagne (bottle)',        price:1200, category:'Bottles',       available:true },
  { id:'d10', name:'Long Island Iced Tea',      price:105,  category:'Cocktails',     available:true },
];

export const INITIAL_MANAGER = {
  id:'mgr_001', name:'Manager', username:'admin', password:'admin123',
  role:'manager', avatar:'👔', status:'active', availability:'active',
  phone:'', email:'',
};

export const INACTIVE_STATUSES = ['suspended','leave','pending'];

export function getSectionCfg(id) {
  return SECTIONS.find(s => s.id === id) || SECTIONS[0];
}

export function canLogin(s) {
  return s.status === 'active';
}

export function canDM(s) {
  return s.status === 'active' && s.availability !== 'break';
}

export function fmt(n) {
  return `GHS ${Number(n).toFixed(2)}`;
}

export function calcBill(items, discountPct = 0, tipAmt = 0) {
  const subtotal     = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt  = subtotal * (discountPct / 100);
  const afterDiscount= subtotal - discountAmt;
  const vat          = afterDiscount * GHANA_TAXES.VAT;
  const nhil         = afterDiscount * GHANA_TAXES.NHIL;
  const getfl        = afterDiscount * GHANA_TAXES.GETFL;
  const commission   = afterDiscount * COMMISSION_RATE;
  const total        = afterDiscount + vat + nhil + getfl + Number(tipAmt);
  return { subtotal, discountAmt, afterDiscount, vat, nhil, getfl, tipAmt: Number(tipAmt), commission, total };
}

export function periodFilter(orders, period) {
  const now = new Date();
  return orders.filter(o => {
    const d = new Date(o.createdAt);
    if (period === 'day')   return d.toDateString() === now.toDateString();
    if (period === 'week')  { const w = new Date(now); w.setDate(now.getDate()-7); return d >= w; }
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'year')  return d.getFullYear() === now.getFullYear();
    return true;
  });
}
