'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RideBookingWidget } from '@/components/RideBookingWidget';
import { DeliveryWidget } from '@/components/DeliveryWidget';
import { IntercityWidget } from '@/components/IntercityWidget';
import { MobileAppMockup } from '@/components/MobileAppMockup';
import { FeaturesSection } from '@/components/FeaturesSection';
import { FaresChartSection } from '@/components/FaresChartSection';
import { CaptainPromoSection } from '@/components/CaptainPromoSection';
import { useLanguage } from '@/lib/LanguageContext';
import { getCurrentCustomer } from '@/lib/db';
import { Customer } from '@/lib/types';
import { 
  Bike, 
  Car, 
  Package, 
  Navigation, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Sparkles,
  ArrowRight,
  UserCheck,
  UserPlus
} from 'lucide-react';

export default function HomePage() {
  const { t, isUrdu } = useLanguage();
  const [activeMainTab, setActiveMainTab] = useState<'rides' | 'delivery' | 'intercity'>('rides');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setCurrentCustomer(getCurrentCustomer());
  }, []);

  return (
    <div id="top" className="min-h-screen bg-olak-navy-950 text-slate-100 flex flex-col selection:bg-olak-teal selection:text-olak-navy-950">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-28 overflow-hidden bg-radial-navy">
          
          {/* Background Glows */}
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-olak-teal/10 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Headings & Booking Engine (7 Cols) */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                
                {/* Hero Badge & Customer Welcome */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 bg-olak-navy-900/90 border border-olak-teal/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-olak-teal shadow-teal-glow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-olak-teal" />
                    <span>{t.hero_badge}</span>
                  </div>

                  {currentCustomer ? (
                    <Link
                      href="/customer/"
                      className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-500 hover:text-white transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isUrdu ? `خوش آمدید، ${currentCustomer.full_name}` : `Welcome, ${currentCustomer.full_name}`}</span>
                    </Link>
                  ) : (
                    <Link
                      href="/customer/"
                      className="inline-flex items-center gap-1.5 bg-slate-900/90 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold hover:border-olak-teal transition"
                    >
                      <span>{isUrdu ? 'کسٹمر پورٹل لاگ ان' : 'Customer Account'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Fixed Main Titles (No clipping, proper responsive line heights) */}
                <div className="space-y-2">
                  <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black text-white ${
                    isUrdu ? 'font-urdu leading-normal sm:leading-relaxed' : 'font-sans tracking-tight leading-tight sm:leading-none'
                  }`}>
                    {t.hero_title_1}
                  </h1>
                  <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-olak-teal via-emerald-300 to-accent bg-clip-text text-transparent ${
                    isUrdu ? 'font-urdu leading-normal sm:leading-relaxed' : 'font-sans tracking-tight leading-tight sm:leading-tight'
                  }`}>
                    {t.hero_title_2}
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl font-urdu leading-relaxed">
                  {t.hero_desc}
                </p>

                {/* Primary Mode Tabs (Ride vs Delivery vs Intercity) */}
                <div className="flex bg-olak-navy-900 p-1.5 rounded-2xl border border-olak-navy-800 max-w-md shadow-lg">
                  <button
                    onClick={() => setActiveMainTab('rides')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                      activeMainTab === 'rides'
                        ? 'bg-olak-teal text-olak-navy-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>{isUrdu ? 'شہری رائیڈ' : 'City Rides'}</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab('delivery')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                      activeMainTab === 'delivery'
                        ? 'bg-olak-teal text-olak-navy-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>{isUrdu ? 'پارسل ڈلیوری' : 'Parcel Delivery'}</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab('intercity')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                      activeMainTab === 'intercity'
                        ? 'bg-olak-teal text-olak-navy-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{isUrdu ? 'انٹرسٹی' : 'Intercity'}</span>
                  </button>
                </div>

                {/* Dynamic Booking Widget Card */}
                <div>
                  {activeMainTab === 'rides' && <RideBookingWidget />}
                  {activeMainTab === 'delivery' && <DeliveryWidget />}
                  {activeMainTab === 'intercity' && <IntercityWidget />}
                </div>

              </div>

              {/* Right Column: Interactive Mobile Mockup (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="text-center mb-4 lg:hidden">
                  <span className="text-xs font-bold text-olak-teal uppercase">
                    {t.app_mockup_title}
                  </span>
                </div>
                
                <MobileAppMockup />

                <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-olak-teal" />
                    <span>CNIC Verified</span>
                  </span>
                  <span>•</span>
                  <span>Live Fare Meter</span>
                  <span>•</span>
                  <span>24/7 Helpline</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <FeaturesSection />

        {/* Transparent Fare Rate Chart */}
        <FaresChartSection />

        {/* Intercity Routes Overview */}
        <section id="intercity" className="py-16 sm:py-24 bg-olak-navy-950 border-t border-olak-navy-800 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-olak-teal bg-olak-teal/10 border border-olak-teal/30 px-3 py-1 rounded-full">
                {isUrdu ? 'بلوچستان و سندھ رابطہ' : 'Intercity Mobility Network'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                {isUrdu ? 'تربت سے بلوچستان کے تمام اہم شہروں تک سفر' : 'Travel from Turbat to All Major Hubs'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-urdu">
                {isUrdu 
                  ? 'گوادر پورٹ، پسنی ساحل، پنجگور، کوئٹہ، ہب چوکی اور کراچی کے لیے آرام دہ کاریں اور کارگو سروس۔' 
                  : 'Daily scheduled and private direct rides from Turbat to Gwadar, Quetta, Panjgur, and Karachi.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { city: 'Gwadar (گوادر)', km: '170 KM', time: '2.5h', fare: 'PKR 3,500' },
                { city: 'Pasni (پسنی)', km: '135 KM', time: '2h', fare: 'PKR 3,000' },
                { city: 'Panjgur (پنجگور)', km: '220 KM', time: '3.5h', fare: 'PKR 4,500' },
                { city: 'Jiwani (جیوانی)', km: '210 KM', time: '3.5h', fare: 'PKR 4,500' },
                { city: 'Karachi (کراچی)', km: '780 KM', time: '11h', fare: 'PKR 16,000' },
                { city: 'Quetta (کوئٹہ)', km: '760 KM', time: '12h', fare: 'PKR 17,000' },
              ].map((route, i) => (
                <div 
                  key={i} 
                  className="bg-olak-navy-900/80 border border-olak-navy-800 hover:border-olak-teal rounded-2xl p-4 text-center transition group"
                >
                  <span className="text-xs font-bold text-slate-400 block group-hover:text-olak-teal">
                    {route.km} • {route.time}
                  </span>
                  <h4 className="text-sm font-black text-white mt-1">
                    {route.city}
                  </h4>
                  <span className="inline-block mt-2 text-xs font-bold text-olak-teal bg-olak-teal/10 px-2 py-0.5 rounded-lg">
                    {route.fare}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Captain Promotion Showcase */}
        <CaptainPromoSection />

      </main>

      {/* Floating WhatsApp Quick Contact Button */}
      <a
        href="https://wa.me/923340468649?text=Hello%20OLAK%20Turbat%20I%20want%20to%20book%20a%20ride%20or%20delivery"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-white p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline font-bold text-xs">OLAK WhatsApp</span>
      </a>

      <Footer />
    </div>
  );
}
