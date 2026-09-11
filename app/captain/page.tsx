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
  updateCaptainProfile,
  fileToBase64,
  getBookings, 
  updateBookingStatus, 
  toggleCaptainOnline,
  uploadFileToStorage,
  getCaptainFinancialSummary,
  getSiteSettings
} from '@/lib/db';
import { supabase } from '@/lib/supabase';
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
  CreditCard,
  Edit3,
  Camera,
  X,
  Ban,
  RefreshCw,
  ExternalLink,
  ReceiptText,
  PackageCheck,
  Home
} from 'lucide-react';
import { getGoogleMapsNavigationUrl, getGoogleMapsDirectionsUrl } from '@/lib/routingHelper';
import { CaptainBottomNav, CaptainNavTab } from '@/components/CaptainBottomNav';
import confetti from 'canvas-confetti';

export default function CaptainHubPage() {
  const { t, isUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState<'workplace' | 'register' | 'login'>('workplace');
  const [captainNavTab, setCaptainNavTab] = useState<CaptainNavTab>('home');
  
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [cnic, setCnic] = useState('');
  const [city, setCity] = useState('Turbat');
  const [serviceType, setServiceType] = useState<ServiceType>('bike');
  const [vehicleName, setVehicleName] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [modelYear, setModelYear] = useState('');
  
  // Verification Document Files
  const [driverPhotoFile, setDriverPhotoFile] = useState<File | null>(null);
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredCaptain, setRegisteredCaptain] = useState<Captain | null>(null);

  // Captain Login State
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Live Workplace & Trips State
  const [liveBookings, setLiveBookings] = useState<Booking[]>([]);

  // Edit Captain Profile / Application State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<Captain>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editDriverPhotoFile, setEditDriverPhotoFile] = useState<File | null>(null);
  const [editCnicFile, setEditCnicFile] = useState<File | null>(null);
  const [editLicenseFile, setEditLicenseFile] = useState<File | null>(null);
  const [editVehicleFile, setEditVehicleFile] = useState<File | null>(null);

  const openEditModal = (cap: Captain) => {
    setEditingData({ ...cap });
    setEditDriverPhotoFile(null);
    setEditCnicFile(null);
    setEditLicenseFile(null);
    setEditVehicleFile(null);
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCaptain || !editingData.full_name || !editingData.phone) {
      setToast({ 
        type: 'error', 
        title: 'Missing Fields', 
        message: isUrdu ? 'نام اور موبائل نمبر درج کریں۔' : 'Full Name and Phone Number are required.' 
      });
      return;
    }

    setIsSavingEdit(true);
    try {
      let driverPhoto = editingData.profile_photo_url || '';
      let cnicPhoto = editingData.cnic_front_url || '';
      let licensePhoto = editingData.license_url || '';
      let vehiclePhoto = editingData.vehicle_photo_url || '';

      if (editDriverPhotoFile) driverPhoto = await fileToBase64(editDriverPhotoFile);
      if (editCnicFile) cnicPhoto = await fileToBase64(editCnicFile);
      if (editLicenseFile) licensePhoto = await fileToBase64(editLicenseFile);
      if (editVehicleFile) vehiclePhoto = await fileToBase64(editVehicleFile);

      const updated = await updateCaptainProfile(currentCaptain.id, {
        ...editingData,
        profile_photo_url: driverPhoto,
        cnic_front_url: cnicPhoto,
        license_url: licensePhoto,
        vehicle_photo_url: vehiclePhoto,
      });

      if (updated) {
        setCurrentCaptain(updated);
        setToast({
          type: 'success',
          title: isUrdu ? 'پروفائل اپڈیٹ ہو گئی' : 'Profile Updated',
          message: isUrdu ? 'آپ کی معلومات کامیابی سے محفوظ کر لی گئی ہیں۔' : 'Your details have been updated successfully!'
        });
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setToast({ type: 'error', title: 'Update Error', message: 'Failed to update profile.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => {
      setIsRefreshing(false);
      setToast({
        type: 'success',
        title: isUrdu ? 'معلومات تازہ ہو گئیں' : 'Data Refreshed',
        message: isUrdu ? 'دستیاب سواریاں، بکنگز اور بیلنس اپڈیٹ ہو گئے۔' : 'Live rides, bookings, and clearance balance updated.'
      });
    }, 500);
  };

  const loadData = async () => {
    const s = await getSiteSettings();
    setSiteSettings(s);
    const bks = await getBookings();
    setLiveBookings(bks);
    const caps = await getCaptains();
    const cur = getCurrentCaptain();
    if (cur) {
      const refreshed = caps.find(c => 
        c.id === cur.id || 
        (c.phone && cur.phone && c.phone.replace(/\D/g, '') === cur.phone.replace(/\D/g, '')) ||
        (c.vehicle_number_plate && cur.vehicle_number_plate && c.vehicle_number_plate.toUpperCase() === cur.vehicle_number_plate.toUpperCase())
      );
      if (refreshed) {
        setCurrentCaptain(refreshed);
        if (typeof window !== 'undefined') {
          localStorage.setItem('olak_current_captain', JSON.stringify(refreshed));
        }
        const fin = await getCaptainFinancialSummary(refreshed.id);
        setFinancialSummary(fin);
      } else {
        setCurrentCaptain(cur);
        const fin = await getCaptainFinancialSummary(cur.id);
        setFinancialSummary(fin);
      }
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

    // Supabase 0ms Real-Time Listener with unique channel name
    const channelName = 'captain-portal-live-' + Math.random().toString(36).slice(2, 9);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      window.removeEventListener('olak_captain_auth_changed', handleAuth);
      window.removeEventListener('olak_bookings_updated', loadData);
      window.removeEventListener('olak_captains_updated', loadData);
      window.removeEventListener('olak_settlements_updated', loadData);
      window.removeEventListener('olak_settings_updated', handleSettings);
      supabase.removeChannel(channel);
    };
  }, []);

  // Instant scroll to top when captain navigation tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [captainNavTab]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !cnic || !numberPlate || !password) {
      setToast({
        type: 'error',
        title: 'Incomplete Details',
        message: isUrdu ? 'تمام ضروری فیلڈز اور پاس ورڈ درج کریں۔' : 'Please fill all required fields and enter a password.'
      });
      return;
    }

    if (password.length < 6) {
      setToast({
        type: 'error',
        title: 'Weak Password',
        message: isUrdu ? 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا چاہیے۔' : 'Password must be at least 6 characters long.'
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setToast({
        type: 'error',
        title: 'Password Mismatch',
        message: isUrdu ? 'پاس ورڈ اور کنفرم پاس ورڈ یکساں نہیں ہیں۔' : 'Passwords do not match.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let driverPhotoUrl = '';
      let cnicUrl = '';
      let licenseUrl = '';
      let vehicleUrl = '';

      if (driverPhotoFile) driverPhotoUrl = await uploadFileToStorage(driverPhotoFile, 'captains');
      if (cnicFile) cnicUrl = await uploadFileToStorage(cnicFile, 'cnic');
      if (licenseFile) licenseUrl = await uploadFileToStorage(licenseFile, 'licenses');
      if (vehiclePhotoFile) vehicleUrl = await uploadFileToStorage(vehiclePhotoFile, 'vehicles');

      const cleanPhone = phone.trim();
      const cleanEmail = email.trim() ? email.trim().toLowerCase() : `${cleanPhone.replace(/\D/g, '') || Date.now()}@captain.olak.pk`;

      const captain = await createCaptain({
        full_name: fullName.trim(),
        email: cleanEmail,
        password_hash: password,
        phone: cleanPhone,
        whatsapp_number: whatsapp.trim() || cleanPhone,
        cnic_number: cnic.trim(),
        city: city,
        service_type: serviceType,
        vehicle_name: vehicleName.trim(),
        vehicle_model_year: modelYear.trim(),
        vehicle_number_plate: numberPlate.toUpperCase().trim(),
        cnic_front_url: cnicUrl,
        license_url: licenseUrl,
        vehicle_photo_url: vehicleUrl,
        profile_photo_url: driverPhotoUrl,
      });

      setRegisteredCaptain(captain);
      setCurrentCaptain(captain);
      setIsSubmitting(false);
      setToast({
        type: 'success',
        title: 'Captain Registered!',
        message: isUrdu ? 'آپ کی رجسٹریشن کامیابی سے مکمل ہو گئی ہے۔ دستاویزات جانچ کے لیے بھیج دی گئی ہیں۔' : 'Your captain profile has been submitted for admin verification!'
      });

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00D084', '#10B981', '#ffffff']
        });
      } catch (e) {}
    } catch (err: any) {
      console.error(err);
      setIsSubmitting(false);
      setToast({
        type: 'error',
        title: 'Registration Error',
        message: err?.message || 'Registration failed. Please try again.'
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrPhone.trim()) return;

    setLoginError('');
    const logged = await loginCaptain(loginEmailOrPhone.trim(), loginPassword ? loginPassword : undefined);
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
      setLoginError(isUrdu ? 'ای میل/فون یا پاس ورڈ درست نہیں ہے۔ دوبارہ کوشش کریں۔' : 'Invalid email/phone or password. Please try again or register.');
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
    if (currentCaptain.status === 'rejected') {
      setToast({
        type: 'error',
        title: isUrdu ? 'اکاؤنٹ مسترد ہے' : 'Account Rejected',
        message: isUrdu 
          ? 'آپ کا اکاؤنٹ ایڈمن کی جانب سے مسترد کیا گیا ہے۔ آپ آن لائن نہیں جا سکتے۔' 
          : 'Your captain account has been rejected by administration. You cannot go online.'
      });
      return;
    }
    if (currentCaptain.status !== 'approved') {
      setToast({
        type: 'error',
        title: isUrdu ? 'منظوری زیر التواء ہے' : 'Approval Pending',
        message: isUrdu ? 'آپ کا اکاؤنٹ ابھی تک منظور نہیں ہوا۔' : 'Your account is pending admin approval.'
      });
      return;
    }
    await toggleCaptainOnline(currentCaptain.id, !currentCaptain.is_online);
    const updated = { ...currentCaptain, is_online: !currentCaptain.is_online };
    setCurrentCaptain(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('olak_current_captain', JSON.stringify(updated));
    }
  };

  const handleAcceptRide = async (bookingId: string) => {
    if (!currentCaptain) return;
    if (currentCaptain.status === 'rejected') {
      setToast({
        type: 'error',
        title: isUrdu ? 'اکاؤنٹ مسترد ہے' : 'Account Rejected',
        message: isUrdu 
          ? 'آپ کا اکاؤنٹ ایڈمن نے مسترد کیا ہے۔ آپ سواری قبول نہیں کر سکتے۔' 
          : 'Your captain account has been rejected by admin. You cannot accept rides.'
      });
      return;
    }
    if (currentCaptain.status !== 'approved') {
      setToast({
        type: 'error',
        title: isUrdu ? 'منظوری درکار ہے' : 'Approval Required',
        message: isUrdu ? 'صرف منظور شدہ کیپٹن سواری قبول کر سکتے ہیں۔' : 'Only approved captains can accept rides.'
      });
      return;
    }
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

      <main className="flex-grow py-6 sm:py-12 pb-28 sm:pb-12">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          
          {/* Top Header Strip - On mobile, only shown in Account / Settings tab */}
          {(!currentCaptain || captainNavTab === 'account') ? (
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
              {currentCaptain ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Desktop Tabs */}
                  <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                    {[
                      { id: 'home', label: isUrdu ? 'ہوم' : 'Home', icon: Home },
                      { id: 'earnings', label: isUrdu ? 'آمدنی' : 'Earnings', icon: DollarSign },
                      { id: 'trips', label: isUrdu ? 'ٹرپس' : 'Trips', icon: ReceiptText },
                      { id: 'requests', label: isUrdu ? `آرڈرز (${availablePendingBookings.length})` : `Requests (${availablePendingBookings.length})`, icon: PackageCheck },
                      { id: 'account', label: isUrdu ? 'اکاؤنٹ' : 'Account', icon: User },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCaptainNavTab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            captainNavTab === tab.id ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <Link
                    href="/"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                    title="Switch to Customer Storefront"
                  >
                    <Car className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline">{isUrdu ? 'کسٹمر پورٹل' : 'Rider Portal'}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isUrdu ? 'لاگ آؤٹ' : 'Logout'}</span>
                  </button>
                </div>
              ) : (
                /* Logged-out state: Sign In vs Register Tabs */
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('workplace')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'workplace' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isUrdu ? 'لاگ ان' : 'Sign In'}
                  </button>

                  <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'register' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isUrdu ? 'رجسٹریشن' : 'Register Vehicle'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* On Home, Earnings, Trips, Requests tabs - hidden on mobile, compact on desktop */
            <div className="hidden sm:flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-black text-slate-900">{currentCaptain.full_name}</span>
                <span className="text-xs text-slate-400">({currentCaptain.vehicle_name} • {currentCaptain.vehicle_number_plate})</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {[
                    { id: 'home', label: isUrdu ? 'ہوم' : 'Home', icon: Home },
                    { id: 'earnings', label: isUrdu ? 'آمدنی' : 'Earnings', icon: DollarSign },
                    { id: 'trips', label: isUrdu ? 'ٹرپس' : 'Trips', icon: ReceiptText },
                    { id: 'requests', label: isUrdu ? `آرڈرز (${availablePendingBookings.length})` : `Requests (${availablePendingBookings.length})`, icon: PackageCheck },
                    { id: 'account', label: isUrdu ? 'اکاؤنٹ' : 'Account', icon: User },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCaptainNavTab(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          captainNavTab === tab.id ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <Link
                  href="/"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                >
                  <Car className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">{isUrdu ? 'کسٹمر پورٹل' : 'Rider'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl border border-slate-200 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: WORKPLACE & DRIVER DASHBOARD */}
          {activeTab === 'workplace' && (
            <div className="space-y-6">
              
              {!currentCaptain ? (
                /* Prompt to Sign In */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-md mx-auto shadow-md">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                    <User className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{isUrdu ? 'کیپٹن لاگ ان' : 'Captain Login'}</h3>
                  <p className="text-xs text-slate-500">{isUrdu ? 'اپنا رجسٹرڈ ای میل یا موبائل نمبر اور پاس ورڈ درج کریں۔' : 'Enter your registered Email or Mobile number and Password to access your workplace.'}</p>
                  
                  <form onSubmit={handleLogin} className="space-y-3 pt-2 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isUrdu ? 'ای میل یا موبائل نمبر' : 'Email or Mobile Number'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="0334 1234567 or captain@example.com"
                        value={loginEmailOrPhone}
                        onChange={(e) => {
                          setLoginEmailOrPhone(e.target.value);
                          setLoginError('');
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          {isUrdu ? 'پاس ورڈ' : 'Password'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer"
                        >
                          {showLoginPassword ? (isUrdu ? 'چھپائیں' : 'Hide') : (isUrdu ? 'دیکھیں' : 'Show')}
                        </button>
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setLoginError('');
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {loginError && <p className="text-xs text-red-600 font-bold">{loginError}</p>}
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-md cursor-pointer transition"
                    >
                      {isUrdu ? 'لاگ ان کریں' : 'Sign In to Driver Workplace'}
                    </button>
                  </form>

                  <div className="pt-2">
                    <button onClick={() => setActiveTab('register')} className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer">
                      New Captain? Register your vehicle here →
                    </button>
                  </div>
                </div>
              ) : currentCaptain.status === 'rejected' ? (
                /* REJECTED / SUSPENDED CAPTAIN BANNER */
                <div className="bg-white border-2 border-red-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-lg animate-fadeIn">
                  <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto border border-red-200">
                    <Ban className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-red-800 bg-red-50 px-3.5 py-1 rounded-full border border-red-200">
                    {isUrdu ? 'درخواست مسترد شدہ / معطل' : 'Application Status: Rejected / Blocked'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {isUrdu ? `محترم کیپٹن ${currentCaptain.full_name}، آپ کی درخواست مسترد کی گئی ہے` : `Captain ${currentCaptain.full_name}, Application Rejected`}
                  </h3>
                  <p className="text-xs sm:text-sm text-red-700 max-w-xl mx-auto leading-relaxed font-semibold">
                    {isUrdu 
                      ? 'آپ کی ڈرائیور رجسٹریشن یا دستاویزات اولاک تربت ایڈمنسٹریشن کی جانب سے مسترد کی گئی ہیں۔ آپ سواریاں قبول نہیں کر سکتے اور نہ ہی آن لائن جا سکتے ہیں۔ معلومات کی درستگی کے لیے نیچے دیے گئے بٹن سے دوبارہ دستاویزات جمع کریں یا دفتر سے رابطہ کریں۔' 
                      : 'Your driver registration or documents have been rejected by the OLAK Turbat administration desk. You are not authorized to accept passenger rides or go online. You can edit and update your vehicle documents below to re-submit for review.'}
                  </p>
                  
                  <div className="bg-red-50/60 p-4 rounded-2xl border border-red-200 max-w-md mx-auto text-xs text-left space-y-1.5 text-slate-800">
                    <p>Vehicle: <strong>{currentCaptain.vehicle_name} ({currentCaptain.vehicle_number_plate})</strong></p>
                    <p>Phone: <strong>{currentCaptain.phone}</strong></p>
                    <p>Account Status: <span className="font-bold text-red-700 uppercase">Rejected by Admin</span></p>
                    <p>Turbat Head Office: <strong>Near City Thana, Thana Road, Turbat (+92 335 0455599)</strong></p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(currentCaptain)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-6 py-3 rounded-2xl shadow-sm cursor-pointer transition transform active:scale-95"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isUrdu ? 'دستاویزات درست کر کے دوبارہ بھیجیں' : 'Edit Application & Re-Submit Documents'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-3 rounded-2xl cursor-pointer transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isRefreshing ? (isUrdu ? 'تازہ کاری ہو رہی ہے...' : 'Checking...') : (isUrdu ? 'اسٹیٹس چیک کریں (Refresh)' : 'Check Status (Refresh)')}</span>
                    </button>
                  </div>
                </div>
              ) : currentCaptain.status === 'pending' ? (
                /* Pending Admin Approval & Under Review Banner */
                <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-6 sm:p-9 text-center space-y-5 shadow-lg animate-fadeIn">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto border-2 border-amber-300 shadow-xs">
                    <Clock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                  </div>
                  
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                    <span>{isUrdu ? 'دستاویزات کی جانچ جاری ہے (Under Review)' : 'Under Review — 24 to 48 Hours'}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {isUrdu ? `خوش آمدید، کیپٹن ${currentCaptain.full_name}!` : `Welcome, Captain ${currentCaptain.full_name}!`}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-urdu leading-relaxed">
                      {isUrdu 
                        ? 'آپ کی درخواست اور دستاویزات (شناختی کارڈ، ڈرائیونگ لائسنس، گاڑی کی تصاویر) اولاک ایڈمن ڈیسک پر موصول ہو چکی ہیں۔ جانچ کے بعد آپ کا اکاؤنٹ رائیڈز کے لیے فعال کر دیا جائے گا۔' 
                        : 'Your submitted documents (CNIC, Driving License, Vehicle Details) are currently being reviewed by our Turbat dispatch safety desk. You will be authorized to go online and accept rides upon approval.'}
                    </p>
                  </div>

                  {/* 3-Step Verification Pipeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2">
                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-left">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>1. Account Created</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{currentCaptain.phone}</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-left">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <RefreshCw className="w-4 h-4 text-amber-700 shrink-0 animate-spin" />
                        <span>2. Under Review</span>
                      </div>
                      <p className="text-[10px] text-amber-800 mt-1">Verification in progress</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left opacity-75">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>3. Ride Dispatch</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Pending admin pass</p>
                    </div>
                  </div>

                  {/* Captain Details Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-lg mx-auto text-xs text-left space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vehicle:</span>
                      <strong className="text-slate-900">{currentCaptain.vehicle_name} ({currentCaptain.vehicle_number_plate})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CNIC Number:</span>
                      <span className="font-mono font-bold text-slate-800">{currentCaptain.cnic_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">City & Service:</span>
                      <span className="font-bold text-emerald-700 uppercase">{currentCaptain.city} • {currentCaptain.service_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Turbat Safety Office:</span>
                      <span className="font-bold text-slate-800">Near City Thana Road (+92 335 0455599)</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(currentCaptain)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-6 py-3.5 rounded-2xl shadow-sm cursor-pointer transition transform active:scale-95"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isUrdu ? 'درخواست میں ترمیم کریں' : 'Edit Application Details'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-6 py-3.5 rounded-2xl border border-slate-300 cursor-pointer transition"
                    >
                      <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isRefreshing ? (isUrdu ? 'تازہ کاری ہو رہی ہے...' : 'Checking...') : (isUrdu ? 'منظوری چیک کریں (Refresh)' : 'Check Approval Status')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* APPROVED CAPTAIN LIVE DASHBOARD */
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Status & Online Availability Header - Only in Account / Settings Tab */}
                  {captainNavTab === 'account' && (
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

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                          className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Refresh Workplace"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>{isRefreshing ? '...' : (isUrdu ? 'تازہ کریں' : 'Refresh')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(currentCaptain)}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isUrdu ? 'پروفائل میں ترمیم' : 'Edit Profile'}</span>
                        </button>

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
                    </div>
                  )}

                  {/* TAB CONTENT BASED ON captainNavTab */}

                  {/* 1. HOME TAB */}
                  {captainNavTab === 'home' && (
                    <div className="space-y-6 animate-fadeIn min-h-[calc(100vh-180px)]">
                      {/* Clean Driver Workplace Status & Quick Switch */}
                      <div className={`border rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm transition-all ${
                        currentCaptain.is_online 
                          ? 'bg-emerald-50/90 border-emerald-300' 
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition shadow-xs ${
                            currentCaptain.is_online ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Power className={`w-5 h-5 ${currentCaptain.is_online ? 'animate-pulse' : ''}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                                {currentCaptain.is_online ? (isUrdu ? 'آپ آن لائن ہیں (سواریاں فعال)' : 'You are ONLINE') : (isUrdu ? 'آپ آف لائن ہیں' : 'You are OFFLINE')}
                              </h3>
                              <span className={`w-2.5 h-2.5 rounded-full ${currentCaptain.is_online ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-urdu">
                              {currentCaptain.is_online 
                                ? (isUrdu ? 'تربت میں سواریاں موصول کرنے کے لیے ریڈار فعال ہے' : 'Active and receiving passenger rides in Turbat') 
                                : (isUrdu ? 'سواریاں وصول کرنے کے لیے بٹن دبائیں' : 'Tap Go Online to start receiving passenger rides')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                            title="Refresh"
                          >
                            <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={handleToggleOnline}
                            className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs transition transform active:scale-95 shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                              currentCaptain.is_online
                                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{currentCaptain.is_online ? (isUrdu ? 'آف لائن ہوں' : 'Go Offline') : (isUrdu ? 'آن لائن جائیں' : 'Go Online')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Active Ongoing Trip Card */}
                      {activeAssignedTrip ? (
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
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-slate-500 block text-[11px]">Pickup Location:</span>
                                    <strong className="text-slate-900 block truncate">{activeAssignedTrip.pickup_location}</strong>
                                  </div>
                                </div>
                                <a
                                  href={getGoogleMapsNavigationUrl(activeAssignedTrip.pickup_coords || activeAssignedTrip.pickup_location)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-black flex items-center gap-1 flex-shrink-0 transition shadow-2xs"
                                  title="1-Click Navigate to Pickup in Google Maps"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>Map</span>
                                </a>
                              </div>

                              <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-200/60">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <Navigation className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-slate-500 block text-[11px]">Destination:</span>
                                    <strong className="text-slate-900 block truncate">{activeAssignedTrip.dropoff_location}</strong>
                                  </div>
                                </div>
                                <a
                                  href={getGoogleMapsNavigationUrl(activeAssignedTrip.dropoff_coords || activeAssignedTrip.dropoff_location)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg text-[10px] font-black flex items-center gap-1 flex-shrink-0 transition shadow-2xs"
                                  title="1-Click Navigate to Destination in Google Maps"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>Map</span>
                                </a>
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

                          {/* 1-Click Live Turn-by-Turn Google Maps Navigation */}
                          <div className="pt-2">
                            {activeAssignedTrip.booking_status === 'assigned' ? (
                              <a
                                href={getGoogleMapsNavigationUrl(activeAssignedTrip.pickup_coords || activeAssignedTrip.pickup_location)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer transform active:scale-98"
                                title="Open Google Maps Turn-by-Turn Live Navigation to Passenger"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>🗺️ 1-Click Google Maps: Navigate to Passenger Pickup</span>
                              </a>
                            ) : (
                              <a
                                href={getGoogleMapsNavigationUrl(activeAssignedTrip.dropoff_coords || activeAssignedTrip.dropoff_location)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-black py-3 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer transform active:scale-98"
                                title="Open Google Maps Turn-by-Turn Live Navigation to Dropoff"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>🏁 1-Click Google Maps: Navigate to Destination</span>
                              </a>
                            )}
                          </div>

                          {/* Action Steps */}
                          <div className="pt-1 flex flex-wrap gap-2.5">
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
                      ) : (
                        /* Radar Standby Banner when no active trip */
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentCaptain.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              <Navigation className={`w-6 h-6 ${currentCaptain.is_online ? 'animate-pulse' : ''}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-base">
                                  {currentCaptain.is_online ? 'Radar Active — Ready for Rides' : 'You are Currently Offline'}
                                </h3>
                                {currentCaptain.is_online && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {currentCaptain.is_online 
                                  ? `${availablePendingBookings.length} passenger requests waiting in Turbat` 
                                  : 'Turn switch to Online above to receive incoming passenger requests'}
                              </p>
                            </div>
                          </div>
                          {availablePendingBookings.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setCaptainNavTab('requests')}
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                            >
                              View {availablePendingBookings.length} Requests →
                            </button>
                          )}
                        </div>
                      )}

                      {/* Snapshot Financial Strip */}
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
                    </div>
                  )}

                  {/* 2. EARNINGS TAB */}
                  {captainNavTab === 'earnings' && (
                    <div className="space-y-6 animate-fadeIn">
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

                      {/* Financial Guidelines & Office Settlement Desk */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          <span>Cash Settlement & Commission Policy</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-urdu">
                          {isUrdu 
                            ? 'اولاک پلیٹ فارم پر کیپٹن تمام کرایہ نقد مسافر سے خود وصول کرتا ہے۔ ہر سفر پر صرف 10% فیس اولاک کے دفتر میں جمع کروانی ہوتی ہے، جبکہ 90% خالص رقم کیپٹن کا منافع ہے۔' 
                            : 'On OLAK, captains collect 100% cash directly from riders upon trip completion. A fixed 10% platform fee is payable to the OLAK Turbat settlement office, allowing you to keep 90% of your hard-earned revenue.'}
                        </p>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                          <div className="flex justify-between"><span className="text-slate-500">Completed Trips:</span> <strong className="text-slate-900">{completedTrips.length}</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500">Commission Rate:</span> <strong className="text-emerald-700">{commissionRate}%</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500">Settlement Status:</span> <strong className={financialSummary && financialSummary.netBalanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}>{financialSummary && financialSummary.netBalanceDue > 0 ? `PKR ${financialSummary.netBalanceDue} Pending Clearance` : 'Up-to-date ✓'}</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500">Turbat Head Office:</span> <span className="text-slate-800 font-bold">Near City Thana Road, Turbat (+92 335 0455599)</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. TRIPS TAB */}
                  {captainNavTab === 'trips' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                          <span>{isUrdu ? 'مکمل شدہ سفر' : 'Completed Trips & Earnings'}</span>
                        </h3>
                        <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {completedTrips.length} Completed
                        </span>
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
                  )}

                  {/* 4. REQUESTS TAB */}
                  {captainNavTab === 'requests' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                          <span>{isUrdu ? 'تربت میں دستیاب سواریاں و پارسل' : 'Live Available Bookings in Turbat'}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black shadow-2xs transition cursor-pointer transform active:scale-95 disabled:opacity-50"
                            title="Refresh Available Bookings"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>{isRefreshing ? (isUrdu ? 'تازہ کاری...' : 'Refreshing...') : (isUrdu ? 'تازہ کریں (Refresh)' : 'Refresh Rides')}</span>
                          </button>
                          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {availablePendingBookings.length} Requests
                          </span>
                        </div>
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
                              <a
                                href={getGoogleMapsDirectionsUrl(b.pickup_coords || b.pickup_location, b.dropoff_coords || b.dropoff_location)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline pt-0.5"
                                title="Preview route in Google Maps"
                              >
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                                <span>1-Click View Route Map</span>
                              </a>
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
                  )}

                  {/* 5. ACCOUNT TAB */}
                  {captainNavTab === 'account' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-2xl">
                              {currentCaptain.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black text-slate-900">{currentCaptain.full_name}</h2>
                                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  {currentCaptain.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{currentCaptain.phone} • {currentCaptain.city}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => openEditModal(currentCaptain)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{isUrdu ? 'ترمیم کریں' : 'Edit Profile'}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Vehicle Information</span>
                            <p className="flex justify-between"><span className="text-slate-500">Vehicle Type:</span> <strong className="text-slate-900 uppercase">{currentCaptain.service_type} ({currentCaptain.vehicle_name})</strong></p>
                            <p className="flex justify-between"><span className="text-slate-500">License Plate:</span> <span className="font-mono font-bold text-emerald-700">{currentCaptain.vehicle_number_plate}</span></p>
                            <p className="flex justify-between"><span className="text-slate-500">Model Year:</span> <span className="font-bold text-slate-800">{currentCaptain.vehicle_model_year || 'N/A'}</span></p>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Driver Identity</span>
                            <p className="flex justify-between"><span className="text-slate-500">CNIC:</span> <span className="font-mono font-bold text-slate-800">{currentCaptain.cnic_number}</span></p>
                            <p className="flex justify-between"><span className="text-slate-500">WhatsApp:</span> <span className="font-bold text-slate-800">{currentCaptain.whatsapp_number || currentCaptain.phone}</span></p>
                            <p className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="text-slate-800">{currentCaptain.email || 'N/A'}</span></p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <Link
                            href="/"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition"
                          >
                            <Car className="w-4 h-4 text-emerald-600" />
                            <span>Switch to Customer / Passenger Portal</span>
                          </Link>

                          <button
                            onClick={handleLogout}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out from Captain Workplace</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="captain@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">Password</label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="•••••••• (Min 6)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="border border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3 bg-slate-50 text-center">
                          <Upload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                          <span className="text-[11px] font-bold text-slate-700 block">Driver Photo</span>
                          <span className="text-[9px] text-slate-400 block">(کیپٹن کی تصویر)</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setDriverPhotoFile(e.target.files?.[0] || null)}
                            className="text-[10px] text-slate-500 mt-1 max-w-full"
                          />
                        </div>

                        <div className="border border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3 bg-slate-50 text-center">
                          <Upload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                          <span className="text-[11px] font-bold text-slate-700 block">CNIC Photo</span>
                          <span className="text-[9px] text-slate-400 block">(شناختی کارڈ)</span>
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
                          <span className="text-[9px] text-slate-400 block">(ڈرائیونگ لائسنس)</span>
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
                          <span className="text-[9px] text-slate-400 block">(گاڑی / بائیک)</span>
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

      {/* EDIT CAPTAIN APPLICATION / PROFILE MODAL */}
      {editModalOpen && currentCaptain && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-2xl w-full space-y-5 shadow-2xl relative my-auto animate-scaleIn max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  <span>{isUrdu ? 'کیپٹن معلومات میں ترمیم کریں' : 'Edit Captain Profile & Application'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isUrdu ? 'اپنی ذاتی معلومات، گاڑی کی تفصیلات یا دستاویزات تبدیل کریں۔' : 'Update your personal details, vehicle specs, or document photos.'}
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              {/* Personal Info Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">1. Personal Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingData.full_name || ''}
                      onChange={(e) => setEditingData({ ...editingData, full_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CNIC Number *</label>
                    <input
                      type="text"
                      required
                      value={editingData.cnic_number || ''}
                      onChange={(e) => setEditingData({ ...editingData, cnic_number: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editingData.phone || ''}
                      onChange={(e) => setEditingData({ ...editingData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={editingData.whatsapp_number || ''}
                      onChange={(e) => setEditingData({ ...editingData, whatsapp_number: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City / Base Location</label>
                    <input
                      type="text"
                      value={editingData.city || 'Turbat'}
                      onChange={(e) => setEditingData({ ...editingData, city: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Specs Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">2. Vehicle Specifications</h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Service Category</label>
                    <select
                      value={editingData.service_type || 'bike'}
                      onChange={(e) => setEditingData({ ...editingData, service_type: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    >
                      <option value="bike">Bike / موٹرسائیکل</option>
                      <option value="rickshaw">Rickshaw / رکشہ</option>
                      <option value="car">Car Ride / گاڑی</option>
                      <option value="delivery">Parcel Delivery / ڈلیوری</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Vehicle Make & Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Honda 125 or Suzuki Bolan"
                      value={editingData.vehicle_name || ''}
                      onChange={(e) => setEditingData({ ...editingData, vehicle_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Model Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2023"
                      value={editingData.vehicle_model_year || ''}
                      onChange={(e) => setEditingData({ ...editingData, vehicle_model_year: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Number Plate *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRB-1234"
                    value={editingData.vehicle_number_plate || ''}
                    onChange={(e) => setEditingData({ ...editingData, vehicle_number_plate: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-black uppercase tracking-wider"
                  />
                </div>
              </div>

              {/* Photos & Documents Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">3. Photos & Documents (Optional to change)</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  {/* Driver Photo */}
                  <div className="border border-slate-200 bg-white rounded-xl p-2.5 text-center space-y-2 flex flex-col justify-between">
                    <span className="font-bold text-slate-800 block text-[10px]">Driver Photo</span>
                    <div className="h-20 w-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                      {editDriverPhotoFile ? (
                        <span className="text-[10px] text-emerald-700 font-bold">New file chosen</span>
                      ) : editingData.profile_photo_url ? (
                        <img src={editingData.profile_photo_url} alt="Driver" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg cursor-pointer block text-[10px]">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setEditDriverPhotoFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  {/* CNIC Photo */}
                  <div className="border border-slate-200 bg-white rounded-xl p-2.5 text-center space-y-2 flex flex-col justify-between">
                    <span className="font-bold text-slate-800 block text-[10px]">CNIC Document</span>
                    <div className="h-20 w-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                      {editCnicFile ? (
                        <span className="text-[10px] text-emerald-700 font-bold">New file chosen</span>
                      ) : editingData.cnic_front_url ? (
                        <img src={editingData.cnic_front_url} alt="CNIC" className="w-full h-full object-cover" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg cursor-pointer block text-[10px]">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setEditCnicFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  {/* License Photo */}
                  <div className="border border-slate-200 bg-white rounded-xl p-2.5 text-center space-y-2 flex flex-col justify-between">
                    <span className="font-bold text-slate-800 block text-[10px]">Driving License</span>
                    <div className="h-20 w-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                      {editLicenseFile ? (
                        <span className="text-[10px] text-emerald-700 font-bold">New file chosen</span>
                      ) : editingData.license_url ? (
                        <img src={editingData.license_url} alt="License" className="w-full h-full object-cover" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg cursor-pointer block text-[10px]">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setEditLicenseFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  {/* Vehicle Photo */}
                  <div className="border border-slate-200 bg-white rounded-xl p-2.5 text-center space-y-2 flex flex-col justify-between">
                    <span className="font-bold text-slate-800 block text-[10px]">Vehicle Photo</span>
                    <div className="h-20 w-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                      {editVehicleFile ? (
                        <span className="text-[10px] text-emerald-700 font-bold">New file chosen</span>
                      ) : editingData.vehicle_photo_url ? (
                        <img src={editingData.vehicle_photo_url} alt="Vehicle" className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg cursor-pointer block text-[10px]">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setEditVehicleFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition"
                >
                  {isSavingEdit ? 'Saving...' : (isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Changes')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar */}
      {currentCaptain && (
        <CaptainBottomNav
          activeTab={captainNavTab}
          onTabChange={setCaptainNavTab}
          requestsCount={availablePendingBookings.length}
          hasActiveTrip={!!activeAssignedTrip}
        />
      )}

      <Footer className="hidden sm:block" />
    </div>
  );
}
