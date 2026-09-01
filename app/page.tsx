'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RideBookingWidget } from '@/components/RideBookingWidget';
import { DeliveryWidget } from '@/components/DeliveryWidget';
import { IntercityWidget } from '@/components/IntercityWidget';
import { PromotionBannerCarousel } from '@/components/PromotionBannerCarousel';
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
  MessageCircle, 
  Sparkles,
  ArrowRight,
  UserCheck,
  Phone,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function HomePage() {
  const { t, isUrdu } = useLanguage();
  const [activeMainTab, setActiveMainTab] = useState<'rides' | 'delivery' | 'intercity'>('rides');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setCurrentCustomer(getCurrentCustomer());
  }, []);

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Promotional Ads Showcase Carousel */}
      <div className="bg-slate-50 border-b border-slate-200">
        <PromotionBannerCarousel isUrdu={isUrdu} />
      </div>

      {/* Hero Section with Clean White & Slate Background */}
      <main className="flex-grow">
        <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 overflow-hidden bg-white">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Headings & Value Props (5 Cols) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                
                {/* Badge */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.hero_badge}</span>
                  </div>

                  {currentCustomer ? (
                    <Link
                      href="/customer/"
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isUrdu ? `خوش آمدید، ${currentCustomer.full_name}` : `Welcome, ${currentCustomer.full_name}`}</span>
                    </Link>
                  ) : (
                    <Link
                      href="/customer/"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 text-xs font-bold transition"
                    >
                      <span>{isUrdu ? 'کسٹمر پورٹل' : 'Customer Portal'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Main Titles */}
                <div className="space-y-2">
                  <h1 className={`text-3xl sm:text-5xl lg:text-5xl font-black text-slate-950 tracking-tight ${
                    isUrdu ? 'font-urdu leading-normal sm:leading-relaxed' : 'font-sans'
                  }`}>
                    {t.hero_title_1}
                  </h1>
                  <h2 className={`text-2xl sm:text-4xl lg:text-4xl font-black text-emerald-600 ${
                    isUrdu ? 'font-urdu leading-normal sm:leading-relaxed' : 'font-sans'
                  }`}>
                    {t.hero_title_2}
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-slate-600 font-urdu leading-relaxed max-w-lg">
                  {t.hero_desc}
                </p>

                {/* Quick Trust Highlights */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>CNIC Verified</span>
                    </div>
                    <p className="text-xs text-slate-500">100% inspected Turbat captains</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                      <Clock className="w-4 h-4" />
                      <span>3-7 Min Pickup</span>
                    </div>
                    <p className="text-xs text-slate-500">Rapid doorstep arrival</p>
                  </div>
                </div>

                {/* Driver CTA Card */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      {isUrdu ? 'گاڑی یا بائیک ہے؟' : 'Own a Bike or Car?'}
                    </h4>
                    <p className="text-xs text-slate-600 font-urdu">
                      {isUrdu ? 'اولاک کے ساتھ جڑیں اور باعزت روزگار کمائیں' : 'Drive with OLAK & earn 90% income'}
                    </p>
                  </div>
                  <Link
                    href="/captain/"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition whitespace-nowrap shadow-xs"
                  >
                    {isUrdu ? 'کیپٹن بنیں' : 'Register Now'}
                  </Link>
                </div>

              </div>

              {/* Right Column: Booking Engine (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Primary Mode Tabs (City Ride vs Delivery vs Intercity) */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                  <button
                    onClick={() => setActiveMainTab('rides')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                      activeMainTab === 'rides'
                        ? 'bg-white text-emerald-700 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Car className="w-4 h-4 text-emerald-600" />
                    <span>{isUrdu ? 'شہری رائیڈ' : 'City Rides'}</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab('delivery')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                      activeMainTab === 'delivery'
                        ? 'bg-white text-emerald-700 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>{isUrdu ? 'پارسل ڈلیوری' : 'Parcel Delivery'}</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab('intercity')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                      activeMainTab === 'intercity'
                        ? 'bg-white text-emerald-700 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>{isUrdu ? 'انٹرسٹی ٹریول' : 'Intercity Travel'}</span>
                  </button>
                </div>

                {/* Active Booking Engine Widget */}
                <div>
                  {activeMainTab === 'rides' && <RideBookingWidget />}
                  {activeMainTab === 'delivery' && <DeliveryWidget />}
                  {activeMainTab === 'intercity' && <IntercityWidget />}
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
        <section id="intercity" className="py-16 sm:py-24 bg-white border-t border-slate-200 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                {isUrdu ? 'بلوچستان و سندھ رابطہ' : 'Intercity Mobility Network'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                {isUrdu ? 'تربت سے بلوچستان کے تمام اہم شہروں تک سفر' : 'Travel from Turbat to All Major Hubs'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-urdu">
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
                  className="bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-white rounded-2xl p-4 text-center transition group shadow-xs hover:shadow-md"
                >
                  <span className="text-xs font-bold text-slate-500 block group-hover:text-emerald-600">
                    {route.km} • {route.time}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-1">
                    {route.city}
                  </h4>
                  <span className="inline-block mt-2 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
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
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline font-bold text-xs">OLAK WhatsApp</span>
      </a>

      <Footer />
    </div>
  );
}
