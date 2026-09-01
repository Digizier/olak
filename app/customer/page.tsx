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
    const bks = await getCustomerBookings(cust.phone || cust.email);
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
          phone: emailOrPhone.replace(/\D/g, '') || '03340000000',
          password: password || 'password123',
        });
        setCustomer(autoCust);
        loadCustomerData(autoCust);
      }
    } catch (err) {
      setErrorMsg('Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      setErrorMsg(isUrdu ? 'براہ کرم تمام لازمی فیلڈز مکمل کریں۔' : 'Please fill all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const newCust = await registerCustomer({
        full_name: fullName,
        email: email || `${phone.replace(/\D/g, '')}@olak.pk`,
        phone,
        password: password || 'password123',
      });
      setCustomer(newCust);
      loadCustomerData(newCust);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      setErrorMsg('Could not register account. Please try again.');
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow py-8 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {!customer ? (
            /* AUTH GATE: LOGIN & FAST REGISTRATION */
            <div className="max-w-md mx-auto">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                
                {/* Brand Header */}
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                    <User className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {authMode === 'login' 
                      ? (isUrdu ? 'کسٹمر پورٹل میں لاگ ان کریں' : 'Passenger Sign In') 
                      : (isUrdu ? 'نیا اکاؤنٹ بنائیں' : 'Create Customer Account')}
                  </h2>
                  <p className="text-xs text-slate-500 font-urdu">
                    {isUrdu 
                      ? 'بغیر کسی انتظار کے فوری بکنگ اور اپنے تمام سفروں کا ریکارڈ دیکھیں۔' 
                      : 'Zero-friction booking, saved addresses, and live trip tracking.'}
                  </p>
                </div>

                {/* Auth Mode Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                    className={`flex-1 py-2.5 rounded-lg transition ${
                      authMode === 'login' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isUrdu ? 'لاگ ان کریں' : 'Sign In'}
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                    className={`flex-1 py-2.5 rounded-lg transition ${
                      authMode === 'register' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isUrdu ? 'نیا اکاؤنٹ' : 'Register Free'}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* LOGIN FORM */}
                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isUrdu ? 'پاس ورڈ (اختیاری)' : 'Password (Optional)'}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>{isUrdu ? 'لاگ ان کریں اور بکنگ دیکھیں' : 'Sign In & Access Dashboard'}</span>
                      )}
                    </button>
                  </form>
                ) : (
                  /* REGISTRATION FORM */
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isUrdu ? 'آپ کا پورا نام' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aslam Baloch"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isUrdu ? 'موبائل نمبر (واٹس ایپ)' : 'Mobile Number (WhatsApp)'}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0334 1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isUrdu ? 'ای میل ایڈریس' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="aslam@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isUrdu ? 'پاس ورڈ بنائیں' : 'Create Password'}
                      </label>
                      <input
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>{isUrdu ? 'اکاؤنٹ بنائیں اور شروع کریں' : 'Register & Start Booking'}</span>
                      )}
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <Link href="/" className="text-xs text-slate-500 hover:text-emerald-700">
                    ← {isUrdu ? 'بغیر اکاؤنٹ کے فوری سواری بک کریں' : 'Book a Ride Directly without Login'}
                  </Link>
                </div>

              </div>
            </div>
          ) : (
            /* AUTHENTICATED CUSTOMER DASHBOARD */
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              
              {/* Profile Bar */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-xl sm:text-2xl flex-shrink-0">
                    {customer.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">{customer.full_name}</h2>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {customer.phone} • {customer.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    href="/"
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Car className="w-4 h-4" />
                    <span>{isUrdu ? 'نئی رائیڈ بک کریں' : 'Book New Ride'}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Trips Section */}
              {activeTrips.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    <span>{isUrdu ? 'جاری سفر / لائیو ٹرپ' : 'Active Live Trips'}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTrips.map((b) => (
                      <div key={b.id} className="bg-white border border-emerald-300 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded text-xs border border-emerald-200">
                            {b.booking_code}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-600 text-white animate-pulse">
                            ● {b.booking_status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>Pickup: <strong className="text-slate-900">{b.pickup_location}</strong></span>
                          </div>
                          <div className="flex items-start gap-2 text-slate-700">
                            <Navigation className="w-3.5 h-3.5 text-teal-700 flex-shrink-0 mt-0.5" />
                            <span>Dropoff: <strong className="text-slate-900">{b.dropoff_location}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-base font-black text-slate-900">PKR {b.estimated_fare}</span>
                          <Link
                            href={`/track/?code=${b.booking_code}`}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs"
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
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    <span>{isUrdu ? 'آپ کے تمام سفروں کا ریکارڈ' : 'Your Trip & Delivery History'}</span>
                  </h3>
                  <span className="text-xs text-slate-500">Total: {bookings.length}</span>
                </div>

                {/* Mobile Trip Cards */}
                <div className="space-y-3 sm:hidden">
                  {bookings.map((b) => (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">{b.booking_code}</span>
                          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {b.service_type}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.booking_status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.booking_status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.booking_status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-700">
                        <p className="truncate">📍 {b.pickup_location}</p>
                        <p className="truncate text-slate-500">🏁 {b.dropoff_location}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <span className="font-black text-emerald-700">PKR {b.final_fare || b.estimated_fare}</span>
                        <div className="flex gap-2">
                          <Link
                            href={`/track/?code=${b.booking_code}`}
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            View Live
                          </Link>
                          <Link
                            href="/"
                            className="text-slate-500 hover:text-slate-900"
                          >
                            Re-book
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-xs font-urdu bg-white rounded-2xl border border-slate-200">
                      {isUrdu 
                        ? 'آپ نے ابھی تک کوئی رائیڈ بک نہیں کی ہے۔ اپنی پہلی سواری بک کریں!' 
                        : 'No bookings found in your history. Book your first ride with OLAK!'}
                    </div>
                  )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Token</th>
                          <th className="px-4 py-3">Service</th>
                          <th className="px-4 py-3">Pickup ➔ Destination</th>
                          <th className="px-4 py-3">Fare</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-slate-900 block">{b.booking_code}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(b.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-semibold uppercase text-slate-900">
                              {b.service_type}
                            </td>

                            <td className="px-4 py-3 max-w-xs truncate">
                              <span className="text-slate-800 block truncate font-medium">📍 {b.pickup_location}</span>
                              <span className="text-slate-500 block truncate">🏁 {b.dropoff_location}</span>
                            </td>

                            <td className="px-4 py-3 font-black text-emerald-700">
                              PKR {b.final_fare || b.estimated_fare}
                            </td>

                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.booking_status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.booking_status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {b.booking_status.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right space-x-2">
                              <Link
                                href={`/track/?code=${b.booking_code}`}
                                className="inline-flex text-emerald-700 hover:underline font-bold"
                              >
                                View
                              </Link>
                              <Link
                                href="/"
                                className="inline-flex text-slate-500 hover:text-slate-900 font-medium"
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
