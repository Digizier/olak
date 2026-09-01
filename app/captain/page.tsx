'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  createCaptain, 
  getCaptains, 
  loginCaptain, 
  logoutCaptain, 
  getCurrentCaptain, 
  getBookings, 
  updateBookingStatus, 
  toggleCaptainOnline,
  uploadFileToStorage,
  getCaptainFinancialSummary,
  getSiteSettings
} from '@/lib/db';
import { Captain, Booking, ServiceType, SiteSettings } from '@/lib/types';
import { Toast, ToastMessage } from '@/components/Toast';
import { 
  UserPlus, 
  Bike, 
  Car, 
  Truck, 
  Package, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Power, 
  Phone, 
  Navigation, 
  MapPin, 
  Banknote, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  MessageCircle, 
  LogOut, 
  User, 
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CaptainHubPage() {
  const { t, isUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState<'workplace' | 'register' | 'login'>('workplace');
  
  // Current Session
  const [currentCaptain, setCurrentCaptain] = useState<Captain | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [financialSummary, setFinancialSummary] = useState<{
    totalTrips: number;
    grossFares: number;
    commissionRate: number;
    commissionDue: number;
    driverEarnings: number;
    totalSettled: number;
    netBalanceDue: number;
    isCleared: boolean;
    recentSettlements: any[];
  } | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cnic, setCnic] = useState('');
  const [city, setCity] = useState('Turbat');
  const [serviceType, setServiceType] = useState<ServiceType>('bike');
  const [vehicleName, setVehicleName] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [modelYear, setModelYear] = useState('');
  
  // Verification Document Files
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredCaptain, setRegisteredCaptain] = useState<Captain | null>(null);

  // Captain Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');

  // Live Workplace & Trips State
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);

  const loadData = async () => {
    const s = await getSiteSettings();
    setSiteSettings(s);
    const bks = await getBookings();
    setLiveBookings(bks);
    const caps = await getCaptains();
    const cur = getCurrentCaptain();
    if (cur) {
      const refreshed = caps.find(c => c.id === cur.id);
      if (refreshed) {
        setCurrentCaptain(refreshed);
        const fin = await getCaptainFinancialSummary(refreshed.id);
        setFinancialSummary(fin);
      }
    } else if (caps.length > 0) {
      const approved = caps.find(c => c.status === 'approved') || caps[0];
      setCurrentCaptain(approved);
      const fin = await getCaptainFinancialSummary(approved.id);
      setFinancialSummary(fin);
    }
  };

  useEffect(() => {
    loadData();
    const handleAuth = async (e: any) => {
      if (e.detail) {
        setCurrentCaptain(e.detail);
        const fin = await getCaptainFinancialSummary(e.detail.id);
        setFinancialSummary(fin);
      }
    };
    const handleSettings = (e: any) => {
      if (e.detail) setSiteSettings(e.detail);
    };

    window.addEventListener('olak_captain_auth_changed', handleAuth);
    window.addEventListener('olak_bookings_updated', loadData);
    window.addEventListener('olak_captains_updated', loadData);
    window.addEventListener('olak_settlements_updated', loadData);
    window.addEventListener('olak_settings_updated', handleSettings);

    return () => {
      window.removeEventListener('olak_captain_auth_changed', handleAuth);
      window.removeEventListener('olak_bookings_updated', loadData);
      window.removeEventListener('olak_captains_updated', loadData);
      window.removeEventListener('olak_settlements_updated', loadData);
      window.removeEventListener('olak_settings_updated', handleSettings);
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !cnic || !numberPlate) {
      setToast({
        type: 'error',
        title: 'Incomplete Details',
        message: isUrdu ? 'تمام ضروری فیلڈز مکمل کریں۔' : 'Please fill all required fields.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let cnicUrl = '';
      let licenseUrl = '';
      let vehicleUrl = '';

      if (cnicFile) cnicUrl = await uploadFileToStorage(cnicFile, 'cnic');
      if (licenseFile) licenseUrl = await uploadFileToStorage(licenseFile, 'licenses');
      if (vehiclePhotoFile) vehicleUrl = await uploadFileToStorage(vehiclePhotoFile, 'vehicles');

      const captain = await createCaptain({
        full_name: fullName,
        phone: phone.trim(),
        whatsapp_number: whatsapp.trim() || phone.trim(),
        cnic_number: cnic.trim(),
        city: city,
        service_type: serviceType,
        vehicle_name: vehicleName,
        vehicle_model_year: modelYear,
        vehicle_number_plate: numberPlate.toUpperCase(),
        cnic_front_url: cnicUrl,
        license_url: licenseUrl,
        vehicle_photo_url: vehicleUrl,
      });

      setRegisteredCaptain(captain);
      setCurrentCaptain(captain);
      setIsSubmitting(false);
      setToast({
        type: 'success',
        title: 'Captain Registered!',
        message: isUrdu ? 'آپ کی رجسٹریشن کامیابی سے مکمل ہو گئی ہے۔' : 'Your captain profile has been created successfully!'
      });

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00D084', '#10B981', '#ffffff']
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setToast({
        type: 'error',
        title: 'Registration Error',
        message: 'Registration failed. Please try again.'
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone) return;

    const logged = await loginCaptain(loginPhone);
    if (logged) {
      setCurrentCaptain(logged);
      const fin = await getCaptainFinancialSummary(logged.id);
      setFinancialSummary(fin);
      setActiveTab('workplace');
      setToast({
        type: 'success',
        title: 'Welcome Back',
        message: `Logged in as Captain ${logged.full_name}`
      });
    } else {
      setLoginError(isUrdu ? 'کوئی منظور شدہ کیپٹن نہیں ملا۔' : 'No captain account found. Please register.');
    }
  };

  const handleLogout = () => {
    logoutCaptain();
    setCurrentCaptain(null);
    setFinancialSummary(null);
    setToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have logged out of Captain Hub.'
    });
  };

  const handleToggleOnline = async () => {
    if (!currentCaptain) return;
    await toggleCaptainOnline(currentCaptain.id, !currentCaptain.is_online);
    setCurrentCaptain({ ...currentCaptain, is_online: !currentCaptain.is_online });
  };

  const handleAcceptRide = async (bookingId: string) => {
    if (!currentCaptain) return;
    await updateBookingStatus(bookingId, 'assigned', currentCaptain.id);
    await loadData();
    setToast({
      type: 'success',
      title: 'Ride Accepted',
      message: 'You have accepted the passenger request!'
    });
  };

  const handleStatusProgress = async (bookingId: string, nextStatus: any) => {
    await updateBookingStatus(bookingId, nextStatus);
    await loadData();
    setToast({
      type: 'info',
      title: 'Status Updated',
      message: `Trip status updated to ${nextStatus}`
    });
  };

  // Driver Analytics Calculations - DYNAMIC FROM ADMIN SETTINGS
  const captainTrips = liveBookings.filter(b => b.assigned_captain_id === currentCaptain?.id);
  const completedTrips = captainTrips.filter(b => b.booking_status === 'completed');
  const activeAssignedTrip = captainTrips.find(b => b.booking_status !== 'completed' && b.booking_status !== 'cancelled');

  const grossEarnings = completedTrips.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
  const commissionRate = siteSettings?.commission_percentage ?? 10;
  const platformFee = Math.round(grossEarnings * (commissionRate / 100));
  const netEarnings = grossEarnings - platformFee;
  const captainSharePercent = 100 - commissionRate;

  const availablePendingBookings = liveBookings.filter(b => b.booking_status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow py-6 sm:py-12">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          
          {/* Top Header Strip */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
                  {isUrdu ? 'اولاک کیپٹن پورٹل' : 'OLAK Driver & Captain Portal'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">
                {currentCaptain ? `${currentCaptain.full_name} (${currentCaptain.vehicle_name})` : (isUrdu ? 'اپنی گاڑی رجسٹر کروائیں' : 'Drive with OLAK')}
              </h1>
              <p className="text-xs text-slate-500 font-urdu">
                {isUrdu ? 'تربت شہر، ایئرپورٹ اور بلوچستان بھر میں رائیڈز اور ڈلیوری قبول کریں۔' : 'On-demand ride dispatch & real-time driver earnings in Turbat.'}
              </p>
            </div>

            {/* Navigation Switchers */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('workplace')}
                className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'workplace' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {isUrdu ? 'ورک پلیس' : 'Dashboard'}
              </button>

              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'register' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {isUrdu ? 'رجسٹریشن' : 'Register'}
              </button>

              {currentCaptain && (
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl border border-slate-200 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: WORKPLACE & DRIVER DASHBOARD */}
          {activeTab === 'workplace' && (
            <div className="space-y-6">
              
              {!currentCaptain ? (
                /* Prompt to Sign In */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-md mx-auto shadow-md">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                    <User className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Captain Login Required</h3>
                  <p className="text-xs text-slate-500">Enter your registered mobile number or number plate to access your queue and earnings.</p>
                  
                  <form onSubmit={handleLogin} className="space-y-3 pt-2">
                    <input
                      type="text"
                      required
                      placeholder="0334 1234567 or Plate (TRB-1234)"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    {loginError && <p className="text-xs text-red-600 font-bold">{loginError}</p>}
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-md cursor-pointer"
                    >
                      Sign In to Workplace
                    </button>
                  </form>

                  <div className="pt-2">
                    <button onClick={() => setActiveTab('register')} className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer">
                      New Captain? Register your vehicle here →
                    </button>
                  </div>
                </div>
              ) : currentCaptain.status === 'pending' ? (
                /* Pending Admin Approval Banner */
                <div className="bg-white border border-amber-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-md">
                  <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                    <Clock className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Application Status: Pending Admin Verification
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Hello, Captain {currentCaptain.full_name}!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-urdu leading-relaxed">
                    {isUrdu 
                      ? 'آپ کی بائیک/گاڑی کی رجسٹریشن اور دستاویزات موصول ہوچکی ہیں۔ ایڈمن ٹیم جانچ کے بعد آپ کا اکاؤنٹ فعال کر دے گی۔' 
                      : 'Your documents (CNIC & Driving License) are under review by our Turbat dispatch desk. You will be able to accept rides as soon as admin approves your account.'}
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto text-xs text-left space-y-1 text-slate-700">
                    <p>Vehicle: <strong>{currentCaptain.vehicle_name} ({currentCaptain.vehicle_number_plate})</strong></p>
                    <p>Phone: <strong>{currentCaptain.phone}</strong></p>
                    <p>Head Office: <strong>Near City Thana, Turbat</strong></p>
                  </div>
                </div>
              ) : (
                /* APPROVED CAPTAIN LIVE DASHBOARD */
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Status & Online Availability Header */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-xl sm:text-2xl flex-shrink-0">
                        {currentCaptain.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg sm:text-xl font-black text-slate-900">{currentCaptain.full_name}</h2>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Vehicle: <span className="text-slate-900 font-bold">{currentCaptain.vehicle_name}</span> • Plate: <span className="font-mono text-emerald-700 font-bold">{currentCaptain.vehicle_number_plate}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleOnline}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-2xl font-black text-xs transition transform active:scale-95 shadow-sm cursor-pointer ${
                        currentCaptain.is_online
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      <span>{currentCaptain.is_online ? 'ONLINE (Accepting Rides)' : 'OFFLINE (Tap to Go Online)'}</span>
                    </button>
                  </div>

                  {/* REAL-TIME DRIVER FINANCIAL ANALYTICS & CASH CLEARANCE STRIP */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Gross Cash Collected</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xs font-bold text-slate-500">PKR</span>
                        <span className="text-xl sm:text-2xl font-black text-slate-900">{grossEarnings}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">From Riders (Cash in Hand)</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Captain Net Share</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xs font-bold text-emerald-600">PKR</span>
                        <span className="text-xl sm:text-2xl font-black text-emerald-700">{netEarnings}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{captainSharePercent}% of Total Fares</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 block">{commissionRate}% Platform Fee</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xs text-amber-600 font-bold">PKR</span>
                        <span className="text-xl sm:text-2xl font-black text-amber-700">{platformFee}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Commission for OLAK ({commissionRate}%)</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Office Clearance</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-lg sm:text-xl font-black ${financialSummary && financialSummary.netBalanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {financialSummary && financialSummary.netBalanceDue > 0 ? `PKR ${financialSummary.netBalanceDue} Due` : 'All Cleared ✓'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {financialSummary ? `PKR ${financialSummary.totalSettled} paid` : 'Settled at Office'}
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE ONGOING TRIP CARD */}
                  {activeAssignedTrip && (
                    <div className="bg-white border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                            Active: {activeAssignedTrip.booking_code}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-emerald-600 text-white">
                          {activeAssignedTrip.booking_status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div className="space-y-2 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span>Pickup: <strong className="text-slate-900">{activeAssignedTrip.pickup_location}</strong></span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Navigation className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
                            <span>Destination: <strong className="text-slate-900">{activeAssignedTrip.dropoff_location}</strong></span>
                          </div>
                        </div>

                        <div className="space-y-2 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Passenger:</span>
                            <span className="font-bold text-slate-900">{activeAssignedTrip.customer_name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Collect Cash:</span>
                            <span className="font-black text-emerald-600 text-base">PKR {activeAssignedTrip.estimated_fare}</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <a
                              href={`tel:${activeAssignedTrip.customer_phone}`}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-center py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${activeAssignedTrip.customer_phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl border border-emerald-200 transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Action Steps */}
                      <div className="pt-2 flex flex-wrap gap-2.5">
                        {activeAssignedTrip.booking_status === 'assigned' && (
                          <button
                            onClick={() => handleStatusProgress(activeAssignedTrip.id, 'arrived')}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer"
                          >
                            Mark as "Arrived at Pickup Point"
                          </button>
                        )}
                        {activeAssignedTrip.booking_status === 'arrived' && (
                          <button
                            onClick={() => handleStatusProgress(activeAssignedTrip.id, 'in_progress')}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer"
                          >
                            Start Trip to Destination
                          </button>
                        )}
                        {activeAssignedTrip.booking_status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusProgress(activeAssignedTrip.id, 'completed')}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-md cursor-pointer"
                          >
                            Complete Trip & Collect Cash (PKR {activeAssignedTrip.estimated_fare})
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AVAILABLE PENDING RIDES QUEUE */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        <span>{isUrdu ? 'تربت میں دستیاب سواریاں و پارسل' : 'Live Available Bookings in Turbat'}</span>
                      </h3>
                      <span className="text-xs text-slate-500">
                        {availablePendingBookings.length} Requests Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {availablePendingBookings.map((b) => (
                        <div 
                          key={b.id}
                          className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 space-y-3.5 transition shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              {b.booking_code}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {b.service_type}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-700">
                            <p className="truncate">📍 Pickup: <strong className="text-slate-900">{b.pickup_location}</strong></p>
                            <p className="truncate">🏁 Destination: <strong className="text-slate-900">{b.dropoff_location}</strong></p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Cash Fare</span>
                              <span className="text-base font-black text-emerald-600">PKR {b.estimated_fare}</span>
                            </div>

                            <button
                              onClick={() => handleAcceptRide(b.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isUrdu ? 'قبول کریں' : 'Accept Ride'}</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {availablePendingBookings.length === 0 && (
                        <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center text-slate-500 text-xs font-urdu shadow-sm">
                          {isUrdu 
                            ? 'اس وقت کوئی نئی پینڈنگ رائیڈ نہیں ہے۔ جیسے ہی کوئی مسافر بکنگ کرے گا، یہاں شو ہوگی۔' 
                            : 'No pending requests currently. Keeping radar active for new customer bookings in Turbat...'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DRIVER COMPLETED TRIPS LIST */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        <span>{isUrdu ? 'مکمل شدہ سفر' : 'Completed Trips & Earnings'}</span>
                      </h3>
                      <span className="text-xs text-slate-500">{completedTrips.length} Completed</span>
                    </div>

                    {/* Mobile Cards */}
                    <div className="space-y-3 sm:hidden">
                      {completedTrips.map((b) => (
                        <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                          <div className="flex justify-between text-xs">
                            <span className="font-mono font-bold text-slate-900">{b.booking_code}</span>
                            <span className="font-bold text-emerald-700">
                              Net: PKR {Math.round((b.final_fare || b.estimated_fare) * 0.90)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 truncate">👤 {b.customer_name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{b.pickup_location} ➔ {b.dropoff_location}</p>
                        </div>
                      ))}
                      {completedTrips.length === 0 && (
                        <div className="p-6 text-center text-slate-500 text-xs font-urdu bg-white rounded-2xl border border-slate-200">
                          {isUrdu ? 'ابھی تک کوئی مکمل سفر درج نہیں۔' : 'No completed trips recorded yet.'}
                        </div>
                      )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Token</th>
                            <th className="px-4 py-3">Passenger</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Gross Fare</th>
                            <th className="px-4 py-3">Net Earning (90%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {completedTrips.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.booking_code}</td>
                              <td className="px-4 py-3">{b.customer_name}</td>
                              <td className="px-4 py-3 max-w-xs truncate">{b.pickup_location} ➔ {b.dropoff_location}</td>
                              <td className="px-4 py-3 text-slate-600">PKR {b.final_fare || b.estimated_fare}</td>
                              <td className="px-4 py-3 font-black text-emerald-700">
                                PKR {Math.round((b.final_fare || b.estimated_fare) * 0.90)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: REGISTRATION FORM */}
          {activeTab === 'register' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Promotional Showcase */}
              <div className="lg:col-span-5 space-y-6">
                <div className="relative h-64 sm:h-80 w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                  <Image
                    src="/assets/bike-poster.jpg"
                    alt="OLAK Captain"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <span className="text-xs font-bold bg-emerald-500 text-slate-950 px-3 py-1 rounded-full uppercase">
                      Official Captain
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">آسان سفر، آسان کمائی</h3>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3 text-xs sm:text-sm shadow-sm">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{isUrdu ? 'رجسٹریشن کے فوائد' : 'Why Partner with OLAK?'}</span>
                  </h4>
                  <p className="text-slate-600 font-urdu leading-relaxed">
                    صرف 10% کمیشن، روزانہ نقد کمائی، اور تربت شہر کے معزز شہریوں کو تیز ترین سفری سہولت۔
                  </p>
                </div>
              </div>

              {/* Right Registration Form */}
              <div className="lg:col-span-7">
                {registeredCaptain ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-md">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      Application Submitted (Pending Admin Approval)
                    </span>
                    <h3 className="text-2xl font-black text-slate-900">
                      {registeredCaptain.full_name}
                    </h3>
                    <p className="text-xs text-slate-600 font-urdu leading-relaxed">
                      آپ کی درخواست موصول ہوگئی ہے۔ ایڈمن منظوری کے بعد آپ رائیڈز قبول کر سکیں گے۔
                    </p>
                    <button
                      onClick={() => setActiveTab('workplace')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
                    >
                      Go to Driver Workplace
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-emerald-600" />
                      <span>{isUrdu ? 'کیپٹن رجسٹریشن فارم' : 'Captain Registration Form'}</span>
                    </h3>

                    {/* Service Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isUrdu ? 'گاڑی کی کیٹیگری' : 'Vehicle Service Category'}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'bike', label: 'Bike', icon: Bike },
                          { id: 'rickshaw', label: 'Rickshaw', icon: Truck },
                          { id: 'car', label: 'Car', icon: Car },
                          { id: 'delivery', label: 'Delivery', icon: Package },
                        ].map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setServiceType(item.id as any)}
                            className={`p-2 sm:p-2.5 rounded-xl border text-center transition cursor-pointer ${
                              serviceType === item.id ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <item.icon className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                            <span className="block text-[11px] sm:text-xs font-bold truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (as per CNIC)</label>
                        <input
                          type="text"
                          required
                          placeholder="Tariq Baloch"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="0334 1234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">CNIC Number</label>
                        <input
                          type="text"
                          required
                          placeholder="52201-1234567-1"
                          value={cnic}
                          onChange={(e) => setCnic(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Operating City</label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Turbat">Turbat (تربت)</option>
                          <option value="Gwadar">Gwadar (گوادر)</option>
                          <option value="Panjgur">Panjgur (پنجگور)</option>
                          <option value="Pasni">Pasni (پسنی)</option>
                          <option value="Quetta">Quetta (کوئٹہ)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Model</label>
                        <input
                          type="text"
                          required
                          placeholder="Honda 125 / Alto"
                          value={vehicleName}
                          onChange={(e) => setVehicleName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                        <input
                          type="text"
                          placeholder="2022"
                          value={modelYear}
                          onChange={(e) => setModelYear(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Plate Number</label>
                        <input
                          type="text"
                          required
                          placeholder="TRB-7821"
                          value={numberPlate}
                          onChange={(e) => setNumberPlate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 uppercase focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Document Uploads */}
                    <div className="space-y-3 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                        Verification Photos (Uploaded to Supabase)
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="border border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3 bg-slate-50 text-center">
                          <Upload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                          <span className="text-[11px] font-bold text-slate-700 block">CNIC Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setCnicFile(e.target.files?.[0] || null)}
                            className="text-[10px] text-slate-500 mt-1 max-w-full"
                          />
                        </div>

                        <div className="border border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3 bg-slate-50 text-center">
                          <Upload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                          <span className="text-[11px] font-bold text-slate-700 block">Driving License</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                            className="text-[10px] text-slate-500 mt-1 max-w-full"
                          />
                        </div>

                        <div className="border border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3 bg-slate-50 text-center">
                          <Upload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                          <span className="text-[11px] font-bold text-slate-700 block">Vehicle Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setVehiclePhotoFile(e.target.files?.[0] || null)}
                            className="text-[10px] text-slate-500 mt-1 max-w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition text-base disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Uploading & Registering...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          <span>Submit Captain Registration</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Modern UI Toast Notifications (No native browser alerts) */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Footer />
    </div>
  );
}
