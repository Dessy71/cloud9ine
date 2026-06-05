# ☁️ Cloud 9ine — Restaurant & Bar Management System

A full-featured management system for Cloud 9ine Restaurant & Bar, built with React + Vite.

## Roles
| Role | Access |
|------|--------|
| **Manager** | Full control — staff CRUD, menu, orders (view/print), activity log, settings |
| **Cashier** | Approve payments, close orders, print receipts, daily report (Excel + PDF), floor view |
| **Server** | Create orders, view own orders, floor view, earnings overview |

## Default Login
- **Manager:** `admin` / `admin123`

## Features
- 🏠 5 sections: Main Floor (20), VIP (10), Terrace (25), Bar (20), Poolside (20)
- 💳 Cash + Paystack (Card / Mobile Money) payments
- 🧾 Receipts with PAID stamp — cashier only
- 🇬🇭 Ghana taxes: VAT 15%, NHIL 2.5%, GETFL 1%
- 💰 2.5% commission on net sales (excl. tips)
- 📊 Daily report: Excel + PDF with per-server breakdown
- 💬 Real-time chat: broadcast (manager/cashier) + DMs + @mentions
- ☕ Break hibernation: password-locked screen
- 📋 Activity log: login, logout, break, return, orders, payments
- 📱 Responsive: mobile, tablet, desktop

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo at vercel.com
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click Deploy ✅

## Environment
No environment variables needed — Paystack public key is stored in app settings (localStorage).
Add your live Paystack key in **Manager → Settings**.

## Tech Stack
- React 18 + Vite
- localStorage (persistence + BroadcastChannel for real-time sync)
- xlsx (Excel reports)
- jsPDF + jspdf-autotable (PDF reports)
- Paystack Inline JS (payments)
