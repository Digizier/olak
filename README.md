# 🚖 OLAK (اولاک) — Smart Mobility & Delivery Platform

> **Tagline**: Safar Har Qadam Asan (سفر ہر قدم آسان)  
> **Headquarters**: Near City Thana, Thana Road, Turbat, Balochistan  
> **Helpline**: +92 335 0455599 | **WhatsApp**: +92 334 0468649

---

## 🌟 Overview
OLAK is an on-demand mobility and logistics web application built for **Turbat and Balochistan** (connecting Gwadar, Pasni, Jiwani, Panjgur, Quetta, and Karachi).

### ✨ Key Features
- **Passenger Portal & Booking Engines**: Instant booking for Bike, Rickshaw/Bolan, Economy & AC Comfort Cars, and Parcel Logistics with real-time Turbat landmark routing and fare calculation.
- **Customer Dashboard (`/customer`)**: Booking history, live active trip tracking, saved addresses, and profile management.
- **Captain / Driver Workplace (`/captain`)**: Driver registration with CNIC/License/Vehicle photo upload, Online/Offline availability switch, live available trip queue in Turbat, and real-time daily earnings analytics with 10% platform commission deduction.
- **Live Trip Tracker (`/track`)**: 5-step visual trip progress tracker with live driver contact actions.
- **Admin Command Center (`/admin`)**: Today's live KPIs, booking dispatch desk with 1-click WhatsApp/SMS triggers, captain verification hub, customer database, and dynamic fare rate editor.
- **Urdu & English Bilingual Support**: Seamless one-touch language switching.
- **Zero-Cost Edge Architecture**: 100% Next.js static export (`output: 'export'`) ready for Cloudflare Pages / Vercel with direct Supabase BaaS.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production / Cloudflare Pages / Vercel
```bash
npm run build
```
The static export will be generated inside the `/out` directory.

---

## 📄 License
MIT License. Developed for OLAK Mobility & Logistics.
