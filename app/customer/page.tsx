'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  getCurrentCustomer, 
  loginCustomer, 
  registerCustomer, 
  logoutCustomer, 
  getCustomerBookings 
} from '@/lib/db';
import { Customer, Booking } from '@/lib/types';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  CheckCircle2, 
  Car, 
  Bike, 
  Package, 
  Clock, 
  ArrowRight, 
  LogOut, 
  MapPin, 
  Navigation, 
  Search, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CustomerPortalPage() {
  const { t, isUrdu } = useLanguage();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form State
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadCustomerData = async (cust: Customer) => {
    const bks = await getCustomerBookings(cust.id, cust.phone);
    setBookings(bks);
  };

  useEffect(() => {
    const cur = getCurrentCustomer();
    if (cur) {
      setCustomer(cur);
      loadCustomerData(cur);
    }

    const handleAuthChange = (e: any) => {
      const updated = e.detail;
      setCustomer(updated);
      if (updated) loadCustomerData(updated);
    };

    window.addEventListener('olak_customer_auth_changed', handleAuthChange);
    window.addEventListener('olak_bookings_updated', () => {
      if (customer) loadCustomerData(customer);
    });

    return () => {
      window.removeEventListener('olak_customer_auth_changed', handleAuthChange);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) {
      setErrorMsg(isUrdu ? 'براہ کرم اپنا ای میل یا موبائل نمبر درج کریں۔' : 'Please enter your email or phone.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const logged = await loginCustomer(emailOrPhone, password);
      if (logged) {
        setCustomer(logged);
        loadCustomerData(logged);
      } else {
        const autoCust = await registerCustomer({
          full_name: 'OLAK Passenger',
          email: emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@olak.pk`,
          phone: emailOrPhone,
          password: password,
        });
        setCustomer(autoCust);
        loadCustomerData(autoCust);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !email) {
      setErrorMsg(isUrdu ? 'براہ کرم تمام معلومات درج کریں۔' : 'Please fill all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const newCust = await registerCustomer({
        full_name: fullName,
        email: email,
        phone: phone,
        password: password || '123456',
      });
      setCustomer(newCust);
      loadCustomerData(newCust);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D084', '#10B981', '#ffffff']
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setErrorMsg('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutCustomer();
    setCustomer(null);
    setBookings([]);
  };

  const activeTrips = bookings.filter(b => b.booking_status !== 'completed' && b.booking_status !== 'cancelled');
  const pastTrips = bookings.filter(b => b.booking_status === 'completed' || b.booking_status === 'cancelled');

  return (
    <div className="min-h-screen bg-olak-navy-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-grow py-8 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {!customer ? (
            /* AUTH GATE: LOGIN & FAST REGISTRATION */
            <div className="max-w-md mx-auto">
              <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                
                {/* Brand Header */}
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-olak-teal/20 text-olak-teal rounded-2xl flex items-center justify-center mx-auto border border-olak-teal/40">
                    <User className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    {authMode === 'login' 
                      ? (isUrdu ? 'کسٹمر پورٹل میں لاگ ان کریں' : 'Passenger Sign In') 
                      : (isUrdu ? 'نیا اکاؤنٹ بنائیں' : 'Create Customer Account')}
                  </h2>
                  <p className="text-xs text-slate-400 font-urdu">
                    {isUrdu 
                      ? 'بغیر کسی انتظار کے فوری بکنگ اور اپنے تمام سفروں کا ریکارڈ دیکھیں۔' 
                      : 'Zero-friction booking, saved addresses, and live trip tracking.'}
                  </p>
                </div>

                {/* Auth Mode Tabs */}
                <div className="flex bg-olak-navy-950 p-1 rounded-xl border border-olak-navy-800 text-xs font-bold">
                  <button
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                    className={`flex-1 py-2.5 rounded-lg transition ${
                      authMode === 'login' ? 'bg-olak-teal text-olak-navy-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isUrdu ? 'لاگ ان کریں' : 'Sign In'}
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                    className={`flex-1 py-2.5 rounded-lg transition ${
                      authMode === 'register' ? 'bg-olak-teal text-olak-navy-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isUrdu ? 'نیا اکاؤنٹ' : 'Register Free'}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl text-center">
                    {errorMsg}
                  </div>
                )}

                {/* LOGIN FORM */}
                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {isUrdu ? 'موبائل نمبر یا ای میل' : 'Mobile Number or Email'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="0334 1234567 or email@domain.com"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                          className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-olak-teal"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {isUrdu ? 'پاس ورڈ (اختیاری)' : 'Password (Optional)'}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-olak-teal"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-black py-3 rounded-xl transition shadow-teal-glow text-sm flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-olak-navy-950 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>{isUrdu ? 'لاگ ان کریں اور بکنگ دیکھیں' : 'Sign In & Access Dashboard'}</span>
                      )}
                    </button>
                  </form>
                ) : (
                  /* REGISTRATION FORM */
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {isUrdu ? 'آپ کا پورا نام' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aslam Baloch"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-olak-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {isUrdu ? 'موبائل نمبر (واٹس ایپ)' : 'Mobile Number (WhatsApp)'}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0334 1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-olak-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {isUrdu ? 'ای میل ایڈریس' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="aslam@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-olak-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {isUrdu ? 'پاس ورڈ بنائیں' : 'Create Password'}
                      </label>
                      <input
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-olak-teal"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-olak-teal to-emerald-500 hover:from-emerald-400 hover:to-olak-teal text-olak-navy-950 font-black py-3 rounded-xl transition shadow-teal-glow text-sm flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-olak-navy-950 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>{isUrdu ? 'اکاؤنٹ بنائیں اور شروع کریں' : 'Register & Start Booking'}</span>
                      )}
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <Link href="/" className="text-xs text-slate-400 hover:text-olak-teal">
                    ← {isUrdu ? 'بغیر اکاؤنٹ کے فوری سواری بک کریں' : 'Book a Ride Directly without Login'}
                  </Link>
                </div>

              </div>
            </div>
          ) : (
            /* AUTHENTICATED CUSTOMER DASHBOARD */
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              
              {/* Profile Bar */}
              <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-olak-teal/20 border border-olak-teal/40 flex items-center justify-center text-olak-teal font-black text-xl sm:text-2xl flex-shrink-0">
                    {customer.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white">{customer.full_name}</h2>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {customer.phone} • {customer.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    href="/"
                    className="flex-1 sm:flex-none bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-teal-glow transition"
                  >
                    <Car className="w-4 h-4" />
                    <span>{isUrdu ? 'نئی رائیڈ بک کریں' : 'Book New Ride'}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 rounded-xl text-xs transition border border-slate-700"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Trips Section */}
              {activeTrips.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-olak-teal" />
                    <span>{isUrdu ? 'جاری سفر / لائیو ٹرپ' : 'Active Live Trips'}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTrips.map((b) => (
                      <div key={b.id} className="bg-olak-navy-900 border border-olak-teal/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-olak-teal bg-olak-teal/10 px-2.5 py-0.5 rounded text-xs">
                            {b.booking_code}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-olak-teal text-olak-navy-950 animate-pulse">
                            ● {b.booking_status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-olak-teal flex-shrink-0 mt-0.5" />
                            <span>Pickup: <strong className="text-white">{b.pickup_location}</strong></span>
                          </div>
                          <div className="flex items-start gap-2 text-slate-300">
                            <Navigation className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>Dropoff: <strong className="text-white">{b.dropoff_location}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-olak-navy-800">
                          <span className="text-base font-black text-white">PKR {b.estimated_fare}</span>
                          <Link
                            href={`/track/?code=${b.booking_code}`}
                            className="bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm"
                          >
                            <span>{isUrdu ? 'لائیو ٹریک کریں' : 'Track Live'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Booking History Cards on Mobile, Table on Desktop */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-olak-teal" />
                    <span>{isUrdu ? 'آپ کے تمام سفروں کا ریکارڈ' : 'Your Trip & Delivery History'}</span>
                  </h3>
                  <span className="text-xs text-slate-400">Total: {bookings.length}</span>
                </div>

                {/* Mobile Trip Cards */}
                <div className="space-y-3 sm:hidden">
                  {bookings.map((b) => (
                    <div key={b.id} className="bg-olak-navy-900 border border-olak-navy-800 rounded-2xl p-4 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{b.booking_code}</span>
                          <span className="text-[10px] font-bold uppercase text-olak-teal bg-olak-teal/10 px-2 py-0.5 rounded">
                            {b.service_type}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.booking_status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : b.booking_status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {b.booking_status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300">
                        <p className="truncate">📍 {b.pickup_location}</p>
                        <p className="truncate text-slate-400">🏁 {b.dropoff_location}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-olak-navy-800 text-xs">
                        <span className="font-black text-olak-teal">PKR {b.final_fare || b.estimated_fare}</span>
                        <div className="flex gap-2">
                          <Link
                            href={`/track/?code=${b.booking_code}`}
                            className="text-olak-teal font-bold hover:underline"
                          >
                            View Live
                          </Link>
                          <Link
                            href="/"
                            className="text-slate-400 hover:text-white"
                          >
                            Re-book
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-xs font-urdu bg-olak-navy-900 rounded-2xl border border-olak-navy-800">
                      {isUrdu 
                        ? 'آپ نے ابھی تک کوئی رائیڈ بک نہیں کی ہے۔ اپنی پہلی سواری بک کریں!' 
                        : 'No bookings found in your history. Book your first ride with OLAK!'}
                    </div>
                  )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block bg-olak-navy-900 border border-olak-navy-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-olak-navy-950 text-slate-400 uppercase font-bold border-b border-olak-navy-800">
                        <tr>
                          <th className="px-4 py-3">Token</th>
                          <th className="px-4 py-3">Service</th>
                          <th className="px-4 py-3">Pickup ➔ Destination</th>
                          <th className="px-4 py-3">Fare</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-olak-navy-800">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-olak-navy-850/60 transition">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-white block">{b.booking_code}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(b.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-semibold uppercase text-slate-200">
                              {b.service_type}
                            </td>

                            <td className="px-4 py-3 max-w-xs truncate">
                              <span className="text-slate-300 block truncate font-medium">📍 {b.pickup_location}</span>
                              <span className="text-slate-400 block truncate">🏁 {b.dropoff_location}</span>
                            </td>

                            <td className="px-4 py-3 font-black text-olak-teal">
                              PKR {b.final_fare || b.estimated_fare}
                            </td>

                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.booking_status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : b.booking_status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {b.booking_status.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right space-x-2">
                              <Link
                                href={`/track/?code=${b.booking_code}`}
                                className="inline-flex text-olak-teal hover:underline font-bold"
                              >
                                View
                              </Link>
                              <Link
                                href="/"
                                className="inline-flex text-slate-400 hover:text-white font-medium"
                              >
                                Re-book
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {bookings.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs font-urdu">
                        {isUrdu 
                          ? 'آپ نے ابھی تک کوئی رائیڈ بک نہیں کی ہے۔ اپنی پہلی سواری بک کریں!' 
                          : 'No bookings found in your history. Book your first ride with OLAK!'}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
