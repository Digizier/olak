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
import { 
  getCurrentCustomer, 
  getCurrentCaptain, 
  getCustomerBookings,
  getBookingByCode,
  getCaptains,
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  getIntercityRoutes
} from '@/lib/db';
import { Customer, Captain, Booking, IntercityRoute } from '@/lib/types';
import { INITIAL_INTERCITY_ROUTES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
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
  CheckCircle2,
  Shuffle,
  MapPin,
  Lock,
  User,
  LogOut,
  ChevronRight,
  Globe,
  ExternalLink,
  RefreshCw,
  Search
} from 'lucide-react';
import { RoleGatewayModal } from '@/components/RoleGatewayModal';
import { CustomerBottomNav, CustomerNavTab } from '@/components/CustomerBottomNav';

export default function HomePage() {
  const { t, isUrdu, lang, setLang } = useLanguage();
  const [customerNavTab, setCustomerNavTab] = useState<CustomerNavTab>('home');
  const [activeMainTab, setActiveMainTab] = useState<'rides' | 'delivery' | 'intercity'>('rides');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [loggedInCaptain, setLoggedInCaptain] = useState<Captain | null>(null);
  const [showRoleGateway, setShowRoleGateway] = useState(false);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [intercityRoutes, setIntercityRoutes] = useState<IntercityRoute[]>(INITIAL_INTERCITY_ROUTES);

  // Auth in Account tab
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Live Tracking tab state
  const [trackInputCode, setTrackInputCode] = useState('');
  const [trackedBooking, setTrackedBooking] = useState<Booking | null>(null);
  const [trackedCaptain, setTrackedCaptain] = useState<Captain | null>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  const handleFetchTrackCode = async (code: string) => {
    if (!code.trim()) return;
    setIsTrackLoading(true);
    try {
      const b = await getBookingByCode(code.trim());
      setTrackedBooking(b);
      if (b && b.assigned_captain_id) {
        const caps = await getCaptains();
        const cap = caps.find(c => c.id === b.assigned_captain_id);
        setTrackedCaptain(cap || null);
      } else {
        setTrackedCaptain(null);
      }
    } catch (e) {
      console.warn('Track search error:', e);
    } finally {
      setIsTrackLoading(false);
    }
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchTrackCode(trackInputCode);
  };

  // URL query param tab handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as CustomerNavTab;
      if (tab && ['home', 'book', 'track', 'rides', 'account'].includes(tab)) {
        setCustomerNavTab(tab);
      }
      const code = params.get('code');
      if (code) {
        setTrackInputCode(code);
        handleFetchTrackCode(code);
      }
    }
  }, []);

  // Instant scroll to top on mobile tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [customerNavTab]);

  const loadData = async () => {
    const cust = getCurrentCustomer();
    setCurrentCustomer(cust);
    if (cust) {
      const bks = await getCustomerBookings(cust.phone || cust.email);
      setCustomerBookings(bks);
    }

    const capt = getCurrentCaptain();
    setLoggedInCaptain(capt);

    // Auto-prompt login / role gateway if user is not logged in
    if (typeof window !== 'undefined') {
      if (!cust && !capt) {
        setShowRoleGateway(true);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData();

    // Fetch and sync intercity routes
    const fetchRoutes = async () => {
      try {
        const routes = await getIntercityRoutes();
        if (isMounted && routes && routes.length > 0) {
          setIntercityRoutes(routes.filter(r => r.is_active));
        }
      } catch (err) {
        console.warn('Error loading intercity routes:', err);
      }
    };
    fetchRoutes();

    const handleAuthChange = (e: any) => {
      if (!isMounted) return;
      setCurrentCustomer(e.detail);
      if (e.detail) {
        getCustomerBookings(e.detail.phone || e.detail.email).then(bks => {
          if (isMounted) setCustomerBookings(bks);
        });
      }
    };

    const handleIntercityUpdate = (e?: any) => {
      if (!isMounted) return;
      if (e?.detail) {
        setIntercityRoutes(e.detail.filter((r: IntercityRoute) => r.is_active));
      } else {
        fetchRoutes();
      }
    };

    window.addEventListener('olak_customer_auth_changed', handleAuthChange);
    window.addEventListener('olak_bookings_updated', loadData);
    window.addEventListener('olak_intercity_updated', handleIntercityUpdate);

    // 0ms Supabase Realtime Channel for intercity_routes
    const channelName = 'home-intercity-feed-' + Math.random().toString(36).slice(2, 9);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'intercity_routes' }, () => {
        fetchRoutes();
      })
      .subscribe();

    // Smooth scroll for hash URLs (e.g. /#fares, /#intercity)
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    return () => {
      isMounted = false;
      window.removeEventListener('olak_customer_auth_changed', handleAuthChange);
      window.removeEventListener('olak_bookings_updated', loadData);
      window.removeEventListener('olak_intercity_updated', handleIntercityUpdate);
      window.removeEventListener('hashchange', handleHash);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        if (!authEmailOrPhone) {
          setAuthError(isUrdu ? 'موبائل نمبر یا ای میل درج کریں۔' : 'Please enter your email or mobile number.');
          setAuthLoading(false);
          return;
        }
        const logged = await loginCustomer(authEmailOrPhone, authPassword || undefined);
        if (logged) {
          setCurrentCustomer(logged);
          const bks = await getCustomerBookings(logged.phone || logged.email);
          setCustomerBookings(bks);
          setAuthSuccess(isUrdu ? 'لاگ ان کامیاب!' : 'Login successful! Welcome back.');
        } else {
          setAuthError(isUrdu ? 'درست ای میل/موبائل یا پاس ورڈ درج کریں۔' : 'Invalid email/phone or password.');
        }
      } else {
        if (!authFullName || !authPhone || !authPassword) {
          setAuthError(isUrdu ? 'تمام خانے پر کریں۔' : 'Please fill all required fields.');
          setAuthLoading(false);
          return;
        }
        if (authPassword.length < 6) {
          setAuthError(isUrdu ? 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے۔' : 'Password must be at least 6 characters.');
          setAuthLoading(false);
          return;
        }
        const registered = await registerCustomer({
          full_name: authFullName,
          phone: authPhone,
          email: authEmail || `${authPhone.replace(/\D/g, '')}@olak.pk`,
          password: authPassword,
        });
        if (registered) {
          setCurrentCustomer(registered);
          setAuthSuccess(isUrdu ? 'اکاؤنٹ بن گیا! خوش آمدید۔' : 'Account created successfully!');
        } else {
          setAuthError(isUrdu ? 'اکاؤنٹ بنانے میں مسئلہ پیش آیا۔' : 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setAuthError(isUrdu ? 'غلطی پیش آئی۔' : 'An error occurred. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logoutCustomer();
    setCurrentCustomer(null);
    setCustomerBookings([]);
    setAuthSuccess(isUrdu ? 'کامیابی سے لاگ آؤٹ ہو گئے۔' : 'Logged out successfully.');
  };

  const activeBooking = customerBookings.find(
    (b) => b.booking_status !== 'completed' && b.booking_status !== 'cancelled'
  );

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />
      <RoleGatewayModal isOpen={showRoleGateway} onClose={() => setShowRoleGateway(false)} />

      {/* MAIN VIEWPORT */}
      <main className="flex-grow pb-24 sm:pb-0">

        {/* ---------------------------------------------------- */}
        {/* MOBILE VIEW (App-Style Screen Switching) */}
        {/* ---------------------------------------------------- */}
        <div className="sm:hidden">
          
          {/* TAB 1: MOBILE HOME */}
          {customerNavTab === 'home' && (
            <div className="space-y-4 animate-fadeIn">
              {/* App Hero Greeting Bar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                    {currentCustomer ? currentCustomer.full_name.charAt(0) : 'O'}
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900 leading-tight">
                      {currentCustomer ? `Hi, ${currentCustomer.full_name.split(' ')[0]}` : 'Welcome to OLAK'}
                    </h2>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      Turbat City, Balochistan
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!currentCustomer && (
                    <button
                      onClick={() => setCustomerNavTab('account')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      {isUrdu ? 'لاگ ان' : 'Sign In'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowRoleGateway(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 cursor-pointer"
                    title="Switch between Rider and Captain"
                  >
                    <Shuffle className="w-3 h-3 text-emerald-600" />
                    <span>{isUrdu ? 'پورٹل' : 'Portal'}</span>
                  </button>
                </div>
              </div>

              {/* Unauthenticated Quick Login Notice */}
              {!currentCustomer && (
                <div className="mx-3 p-3 bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-emerald-200" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black">{isUrdu ? 'سواری و ڈلیوری کے لیے لاگ ان کریں' : 'Login to Ride or Register'}</h4>
                      <p className="text-[10px] text-emerald-100/90">{isUrdu ? 'لاگ ان کے بعد مینیو بار اور رائڈز دستیاب ہوں گے' : 'Sign in to access bottom navigation & your trips'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCustomerNavTab('account')}
                    className="bg-white text-emerald-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs active:scale-95 shrink-0 hover:bg-emerald-50 transition"
                  >
                    {isUrdu ? 'لاگ ان' : 'Sign In'}
                  </button>
                </div>
              )}

              {/* Promotional Ads Carousel */}
              <div className="px-2.5">
                <PromotionBannerCarousel isUrdu={isUrdu} />
              </div>

              {/* Active Trip Banner if in progress */}
              {activeBooking && (
                <div className="mx-3 bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-3xl shadow-lg border border-emerald-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-mono font-bold text-emerald-300 text-xs">
                        {activeBooking.booking_code}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      {activeBooking.booking_status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 truncate">
                    📍 {activeBooking.pickup_location} ➔ 🏁 {activeBooking.dropoff_location}
                  </p>
                  <Link
                    href={`/track/?code=${activeBooking.booking_code}`}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 rounded-xl text-center block transition shadow-xs"
                  >
                    Track Live Ride on Map →
                  </Link>
                </div>
              )}

              {/* 3 Large Mobile Quick-Booking Shortcuts */}
              <div className="px-3 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block px-1">
                  {isUrdu ? 'فوری خدمات' : 'Quick Services'}
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setActiveMainTab('rides');
                      setCustomerNavTab('book');
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <Car className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900">City Rides</span>
                    <span className="text-[9px] text-emerald-700 font-bold">From PKR 50</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveMainTab('delivery');
                      setCustomerNavTab('book');
                    }}
                    className="bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900">Parcel</span>
                    <span className="text-[9px] text-teal-700 font-bold">Fast Courier</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveMainTab('intercity');
                      setCustomerNavTab('book');
                    }}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900">Intercity</span>
                    <span className="text-[9px] text-blue-700 font-bold">Gwadar / Khi</span>
                  </button>
                </div>
              </div>

              {/* Fares Rate Chart Section */}
              <div className="pt-2">
                <FaresChartSection 
                  onSelectService={(serviceType) => {
                    if (serviceType === 'delivery') {
                      setActiveMainTab('delivery');
                    } else {
                      setActiveMainTab('rides');
                      window.dispatchEvent(new CustomEvent('olak_select_service', { detail: serviceType }));
                    }
                    setCustomerNavTab('book');
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                />
              </div>

              {/* Balochistan Corridors */}
              <div id="intercity-mobile" className="px-3 pt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Turbat Highway Corridors</h3>
                      <p className="text-[10px] text-slate-500">Scheduled & Private Rides</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveMainTab('intercity');
                        setCustomerNavTab('book');
                      }}
                      className="text-xs font-black text-emerald-700 hover:underline cursor-pointer"
                    >
                      Book →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(intercityRoutes.length > 0 ? intercityRoutes.slice(0, 4) : INITIAL_INTERCITY_ROUTES.slice(0, 4)).map((route, i) => (
                      <div 
                        key={route.id || i}
                        onClick={() => {
                          setActiveMainTab('intercity');
                          setCustomerNavTab('book');
                        }}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 text-center cursor-pointer hover:border-emerald-500 transition shadow-2xs active:scale-95"
                      >
                        <span className="text-[10px] text-slate-400 block">{route.estimated_duration}</span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{route.destination_city}</h4>
                        <span className="text-[11px] font-black text-emerald-700">PKR {route.car_economy_fare.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features List */}
              <FeaturesSection />

              {/* Captain Driver Recruitment Banner */}
              <div className="px-3 pb-4">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 space-y-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Bike className="w-5 h-5" />
                    <h4 className="font-black text-sm">Drive with OLAK Turbat</h4>
                  </div>
                  <p className="text-xs text-emerald-50 leading-relaxed">
                    Own a bike, rickshaw, or car? Register in 24 hours and earn daily cash. Only 10% commission.
                  </p>
                  <Link
                    href="/captain/"
                    className="inline-block bg-white text-emerald-800 font-black text-xs px-4 py-2 rounded-xl transition shadow-xs"
                  >
                    Register as Captain →
                  </Link>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MOBILE BOOKING ENGINE */}
          {customerNavTab === 'book' && (
            <div className="p-3 space-y-4 animate-fadeIn">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                <button
                  onClick={() => setActiveMainTab('rides')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeMainTab === 'rides'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isUrdu ? 'شہری رائیڈ' : 'City Rides'}</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('delivery')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeMainTab === 'delivery'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isUrdu ? 'پارسل ڈلیوری' : 'Parcel'}</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('intercity')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeMainTab === 'intercity'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isUrdu ? 'انٹرسٹی' : 'Intercity'}</span>
                </button>
              </div>

              {/* Active Booking Engine Widget */}
              <div>
                {activeMainTab === 'rides' && <RideBookingWidget />}
                {activeMainTab === 'delivery' && <DeliveryWidget />}
                {activeMainTab === 'intercity' && <IntercityWidget />}
              </div>
            </div>
          )}

          {/* TAB: MOBILE TRACKING */}
          {customerNavTab === 'track' && (
            <div className="p-3 space-y-4 animate-fadeIn min-h-[calc(100vh-140px)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {isUrdu ? 'لائیو ٹریکنگ' : 'Live Ride & Parcel Tracking'}
                  </h2>
                  <p className="text-xs text-slate-500 font-urdu">
                    {isUrdu ? 'اپنا بکنگ کوڈ درج کر کے کیپٹن اور سفر کی صورتحال دیکھیں' : 'Enter booking code to track captain and trip status in Turbat'}
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search Form for Tracking Code */}
              <form onSubmit={handleTrackSearch} className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="e.g. OLK-4437"
                  value={trackInputCode}
                  onChange={(e) => setTrackInputCode(e.target.value.toUpperCase())}
                  className="flex-1 text-xs uppercase font-bold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:normal-case"
                />
                <button
                  type="submit"
                  disabled={isTrackLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
                >
                  {isTrackLoading ? '...' : (isUrdu ? 'تلاش کریں' : 'Track')}
                </button>
              </form>

              {/* Track Result Display */}
              {trackedBooking ? (
                <div className="bg-white border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        {trackedBooking.booking_code}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5 capitalize">{trackedBooking.service_type} Ride</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                      {trackedBooking.booking_status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* 5-Step Visual Progress */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Trip Progress</span>
                    <div className="grid grid-cols-5 gap-1 text-center text-[9px] font-bold">
                      {['Pending', 'Assigned', 'Arrived', 'En Route', 'Done'].map((step, idx) => {
                        const stepNum = idx + 1;
                        const currStep = trackedBooking.booking_status === 'pending' ? 1
                          : trackedBooking.booking_status === 'assigned' ? 2
                          : trackedBooking.booking_status === 'arrived' ? 3
                          : trackedBooking.booking_status === 'in_progress' ? 4
                          : trackedBooking.booking_status === 'completed' ? 5 : 0;
                        const isDone = currStep >= stepNum;
                        return (
                          <div key={step} className="space-y-1">
                            <div className={`h-1.5 rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            <span className={isDone ? 'text-emerald-700' : 'text-slate-400'}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block">Pickup:</span>
                        <strong className="text-slate-900 truncate block">{trackedBooking.pickup_location}</strong>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                      <Navigation className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block">Dropoff:</span>
                        <strong className="text-slate-900 truncate block">{trackedBooking.dropoff_location}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Fare & Captain Info */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-slate-500">Total Fare:</span>
                    <strong className="text-sm font-black text-emerald-700">PKR {trackedBooking.final_fare || trackedBooking.estimated_fare}</strong>
                  </div>

                  {trackedCaptain && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                          {trackedCaptain.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{trackedCaptain.full_name}</h4>
                          <span className="text-[10px] text-slate-600 block">{trackedCaptain.vehicle_name} • {trackedCaptain.vehicle_number_plate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${trackedCaptain.phone}`}
                          className="p-2 bg-white hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-300 text-xs font-bold transition shadow-2xs"
                          title="Call Driver"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${(trackedCaptain.whatsapp_number || trackedCaptain.phone).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                          title="WhatsApp Driver"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Open in full page button */}
                  <Link
                    href={`/track/?code=${trackedBooking.booking_code}`}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl text-center block transition border border-slate-200"
                  >
                    View Full Screen Map & Receipt →
                  </Link>
                </div>
              ) : activeBooking ? (
                <div className="bg-white border-2 border-emerald-500 rounded-3xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Active: {activeBooking.booking_code}
                    </span>
                    <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      {activeBooking.booking_status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    <p className="truncate">📍 Pickup: <strong>{activeBooking.pickup_location}</strong></p>
                    <p className="truncate">🏁 Dropoff: <strong>{activeBooking.dropoff_location}</strong></p>
                    <p>Fare: <strong className="text-emerald-700">PKR {activeBooking.final_fare || activeBooking.estimated_fare}</strong></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackInputCode(activeBooking.booking_code);
                      handleFetchTrackCode(activeBooking.booking_code);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 rounded-xl text-center block transition shadow-xs cursor-pointer"
                  >
                    Track This Ride Now →
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
                  <Navigation className="w-10 h-10 text-emerald-600/40 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">{isUrdu ? 'کوئی فعال ٹرپ نہیں ہے' : 'No Active Ride Selected'}</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {isUrdu 
                      ? 'اوپر دیے گئے خانے میں اپنا بکنگ کوڈ درج کریں یا نئی رائیڈ بک کریں۔' 
                      : 'Enter a booking code above (e.g. OLK-4437) or book a new ride to start tracking.'}
                  </p>
                  <button
                    onClick={() => setCustomerNavTab('book')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    {isUrdu ? 'نئی رائیڈ بک کریں' : 'Book a Ride Now'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MOBILE MY RIDES */}
          {customerNavTab === 'rides' && (
            <div className="p-3 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {isUrdu ? 'میری رائیڈز و ٹرپس' : 'My Rides & Trips'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {currentCustomer ? `Bookings history for ${currentCustomer.full_name}` : 'Live trips & recent bookings'}
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Active Ongoing Trip Card if any */}
              {activeBooking && (
                <div className="bg-white border-2 border-emerald-500 rounded-3xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Active: {activeBooking.booking_code}
                    </span>
                    <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      {activeBooking.booking_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    <p className="truncate">📍 Pickup: <strong>{activeBooking.pickup_location}</strong></p>
                    <p className="truncate">🏁 Dropoff: <strong>{activeBooking.dropoff_location}</strong></p>
                    <p>Fare: <strong className="text-emerald-700">PKR {activeBooking.final_fare || activeBooking.estimated_fare}</strong></p>
                  </div>

                  <Link
                    href={`/track/?code=${activeBooking.booking_code}`}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 rounded-xl text-center block transition shadow-xs"
                  >
                    Open Live Radar & Tracking →
                  </Link>
                </div>
              )}

              {/* Past Bookings */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">
                  Trip History ({customerBookings.length})
                </span>

                {customerBookings.map((b) => (
                  <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">{b.booking_code}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-500">{b.service_type}</span>
                    </div>
                    <p className="text-xs text-slate-700 truncate font-medium">📍 {b.pickup_location} ➔ 🏁 {b.dropoff_location}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="font-black text-emerald-700">PKR {b.final_fare || b.estimated_fare}</span>
                      <Link
                        href={`/track/?code=${b.booking_code}`}
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        View Receipt →
                      </Link>
                    </div>
                  </div>
                ))}

                {customerBookings.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
                    <Car className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">No Bookings Yet</h4>
                    <p className="text-xs text-slate-500">
                      {currentCustomer 
                        ? 'You haven\'t booked any rides with this account yet.' 
                        : 'Sign in to see your trip history or book your first ride.'}
                    </p>
                    <button
                      onClick={() => setCustomerNavTab('book')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Book a Ride Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MOBILE ACCOUNT & SETTINGS */}
          {customerNavTab === 'account' && (
            <div className="p-3 space-y-4 animate-fadeIn">
              {currentCustomer ? (
                /* Authenticated Profile */
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-xl">
                        {currentCustomer.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-base font-black text-slate-900">{currentCustomer.full_name}</h2>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{currentCustomer.phone}</p>
                        <p className="text-[11px] text-slate-400">{currentCustomer.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Saved Settings</span>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600">Language / زبان:</span>
                        <button
                          onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
                          className="px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>{isUrdu ? 'اردو' : 'English'}</span>
                        </button>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600">Head Office Support:</span>
                        <a href="tel:+923350455599" className="font-bold text-emerald-700">+92 335 0455599</a>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Link
                        href="/captain/"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl text-center block transition border border-slate-200 flex items-center justify-center gap-1.5"
                      >
                        <Bike className="w-4 h-4 text-emerald-600" />
                        <span>Switch to Captain / Driver Portal</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-2.5 rounded-xl text-center block transition border border-red-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out from OLAK</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Unauthenticated Sign In / Register Form */
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                      <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      {authMode === 'login' ? 'Sign In to OLAK' : 'Create Free Account'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Direct Supabase Email & Password Verification (No Google account required)
                    </p>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                        authMode === 'login' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                        authMode === 'register' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Register Free
                    </button>
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center font-medium">
                      {authError}
                    </div>
                  )}
                  {authSuccess && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 text-center font-bold">
                      {authSuccess}
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                    {authMode === 'register' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Aslam Baloch"
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {authMode === 'login' ? 'Email or Mobile Number' : 'Mobile Number (WhatsApp)'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="0334 1234567 or email@domain.com"
                        value={authMode === 'login' ? authEmailOrPhone : authPhone}
                        onChange={(e) => authMode === 'login' ? setAuthEmailOrPhone(e.target.value) : setAuthPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {authMode === 'register' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="aslam@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      {authLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>

                  <div className="pt-2 border-t border-slate-100 text-center space-y-2">
                    <Link
                      href="/captain/"
                      className="text-xs text-emerald-700 hover:underline font-bold block"
                    >
                      Want to drive? Register your vehicle as Captain →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ---------------------------------------------------- */}
        {/* DESKTOP VIEW (Classic Spacious Storefront Layout) */}
        {/* ---------------------------------------------------- */}
        <div className="hidden sm:block">
          <div className="bg-slate-50 border-b border-slate-200">
            <PromotionBannerCarousel isUrdu={isUrdu} />
          </div>

          <section className="relative pt-4 pb-12 sm:pt-6 sm:pb-16 overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
                
                {/* Left Column: Headings & Value Props (5 Cols) */}
                <div className="lg:col-span-5 space-y-4 sm:space-y-5 lg:sticky lg:top-28">
                  
                  {/* Badge & Role Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300/80 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.hero_badge}</span>
                    </div>

                    <button
                      onClick={() => setShowRoleGateway(true)}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-300 transition shadow-xs cursor-pointer"
                      title="Switch between Rider and Driver portal"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isUrdu ? 'پورٹل تبدیل کریں' : 'Switch Portal'}</span>
                    </button>

                    {currentCustomer ? (
                      <Link
                        href="/customer/"
                        className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-200 transition"
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
                  <div className="space-y-1 sm:space-y-2">
                    <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight ${
                      isUrdu ? 'font-urdu leading-normal sm:leading-relaxed' : 'font-sans'
                    }`}>
                      {t.hero_title_1}
                    </h1>
                    <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 ${
                      isUrdu ? 'font-urdu leading-normal sm:leading-relaxed' : 'font-sans'
                    }`}>
                      {t.hero_title_2}
                    </h2>
                  </div>

                  <p className={`text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg ${isUrdu ? 'font-urdu' : ''}`}>
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
                      <p className={`text-xs text-slate-600 ${isUrdu ? 'font-urdu' : ''}`}>
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
                  
                  {/* Primary Mode Tabs */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button
                      onClick={() => setActiveMainTab('rides')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-black transition cursor-pointer ${
                        activeMainTab === 'rides'
                          ? 'bg-white text-emerald-700 shadow-md border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{isUrdu ? 'شہری رائیڈ' : 'City Rides'}</span>
                    </button>

                    <button
                      onClick={() => setActiveMainTab('delivery')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-black transition cursor-pointer ${
                        activeMainTab === 'delivery'
                          ? 'bg-white text-emerald-700 shadow-md border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{isUrdu ? 'پارسل ڈلیوری' : 'Parcel Delivery'}</span>
                    </button>

                    <button
                      onClick={() => setActiveMainTab('intercity')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-black transition cursor-pointer ${
                        activeMainTab === 'intercity'
                          ? 'bg-white text-emerald-700 shadow-md border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{isUrdu ? 'انٹرسٹی ٹریول' : 'Intercity Travel'}</span>
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
          <FaresChartSection 
            onSelectService={(serviceType) => {
              if (serviceType === 'delivery') {
                setActiveMainTab('delivery');
              } else {
                setActiveMainTab('rides');
                window.dispatchEvent(new CustomEvent('olak_select_service', { detail: serviceType }));
              }
              const el = document.getElementById('booking') || document.getElementById('top');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

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
                <p className={`text-sm sm:text-base text-slate-600 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu 
                    ? 'گوادر پورٹ، پسنی ساحل، پنجگور، کوئٹہ، ہب چوکی اور کراچی کے لیے آرام دہ کاریں اور کارگو سروس۔' 
                    : 'Daily scheduled and private direct rides from Turbat to Gwadar, Quetta, Panjgur, and Karachi.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {(intercityRoutes.length > 0 ? intercityRoutes : INITIAL_INTERCITY_ROUTES).map((route, i) => (
                  <div 
                    key={route.id || i} 
                    onClick={() => {
                      setActiveMainTab('intercity');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-white rounded-2xl p-4 text-center transition group shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-500 block group-hover:text-emerald-600">
                      {route.estimated_distance_km} KM • {route.estimated_duration}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 mt-1 truncate">
                      {route.destination_city}
                    </h4>
                    <span className="inline-block mt-2 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                      PKR {route.car_economy_fare.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Captain Promotion Showcase */}
          <CaptainPromoSection />
        </div>

      </main>

      {/* Floating WhatsApp Quick Contact Button (Safely Positioned above Bottom Navigation Bar) */}
      <a
        href="https://wa.me/923340468649?text=Hello%20OLAK%20Turbat%20I%20want%20to%20book%20a%20ride%20or%20delivery"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 bg-emerald-500 hover:bg-emerald-600 text-white p-3 sm:p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:inline font-bold text-xs">OLAK WhatsApp</span>
      </a>

      {/* Mobile Sticky Customer Bottom Navigation Bar - Only visible when customer is logged in */}
      {currentCustomer && (
        <CustomerBottomNav
          activeTab={customerNavTab}
          onTabChange={setCustomerNavTab}
          activeRidesCount={customerBookings.filter(b => ['pending', 'assigned', 'in_progress', 'arrived'].includes(b.booking_status)).length}
        />
      )}

      <Footer className="hidden sm:block" />
    </div>
  );
}
