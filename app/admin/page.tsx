'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OlakLogo } from '@/components/OlakLogo';
import { 
  getSiteSettings, 
  saveSiteSettings, 
  getPricingRates, 
  savePricingRate, 
  getIntercityRoutes, 
  saveIntercityRoute, 
  getCaptains, 
  updateCaptainStatus, 
  deleteCaptain,
  getBookings, 
  updateBookingStatus, 
  deleteBooking,
  getCustomers,
  deleteCustomer
} from '@/lib/db';
import { 
  SiteSettings, 
  PricingRate, 
  IntercityRoute, 
  Captain, 
  Booking, 
  Customer,
  BookingStatus, 
  CaptainStatus, 
  ServiceType 
} from '@/lib/types';
import { 
  INITIAL_SITE_SETTINGS, 
  INITIAL_PRICING_RATES, 
  INITIAL_INTERCITY_ROUTES 
} from '@/lib/constants';
import { PrintableReceipt } from '@/components/PrintableReceipt';
import { 
  Lock, 
  ShieldCheck, 
  Users, 
  Navigation, 
  Banknote, 
  Settings, 
  Printer, 
  MessageCircle, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Edit3, 
  Save, 
  Bike, 
  Car, 
  Truck, 
  Package, 
  Eye, 
  MapPin, 
  ExternalLink,
  DollarSign,
  TrendingUp,
  UserCheck,
  User,
  Clock,
  Activity,
  Trash2
} from 'lucide-react';

interface DeleteModalState {
  isOpen: boolean;
  type: 'booking' | 'captain' | 'customer';
  id: string;
  title: string;
  subtitle: string;
}

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'bookings' | 'captains' | 'customers' | 'pricing' | 'intercity' | 'analytics' | 'settings'>('bookings');

  // Master Datasets
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pricingRates, setPricingRates] = useState<PricingRate[]>(INITIAL_PRICING_RATES);
  const [intercityRoutes, setIntercityRoutes] = useState<IntercityRoute[]>(INITIAL_INTERCITY_ROUTES);
  
  // Filters & State
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [captainFilter, setCaptainFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<Booking | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load All Data
  const loadData = async () => {
    try {
      const [st, bk, cp, cust, pr, ir] = await Promise.all([
        getSiteSettings(),
        getBookings(),
        getCaptains(),
        getCustomers(),
        getPricingRates(),
        getIntercityRoutes(),
      ]);
      setSettings(st);
      setBookings(bk);
      setCaptains(cp);
      setCustomers(cust);
      setPricingRates(pr);
      setIntercityRoutes(ir);
    } catch (err) {
      console.error('Admin data load error:', err);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem('olak_admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('olak_bookings_updated', handleUpdate);
    window.addEventListener('olak_captains_updated', handleUpdate);
    window.addEventListener('olak_customers_updated', handleUpdate);
    window.addEventListener('olak_fares_updated', handleUpdate);
    window.addEventListener('olak_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('olak_bookings_updated', handleUpdate);
      window.removeEventListener('olak_captains_updated', handleUpdate);
      window.removeEventListener('olak_customers_updated', handleUpdate);
      window.removeEventListener('olak_fares_updated', handleUpdate);
      window.removeEventListener('olak_settings_updated', handleUpdate);
    };
  }, []);

  // Handle PIN Login
  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === settings.admin_pin || pinInput === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('olak_admin_authenticated', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('olak_admin_authenticated');
  };

  // Actions
  const handleAssignCaptain = async (bookingId: string, captainId: string) => {
    await updateBookingStatus(bookingId, 'assigned', captainId);
    await loadData();
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    await updateBookingStatus(bookingId, status);
    await loadData();
  };

  const handleCaptainStatus = async (captainId: string, status: CaptainStatus) => {
    await updateCaptainStatus(captainId, status);
    await loadData();
  };

  const handleSaveRate = async (rate: PricingRate) => {
    setIsSaving(true);
    await savePricingRate(rate);
    setIsSaving(false);
    await loadData();
    alert(`Saved ${rate.service_name} rates!`);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveSiteSettings(settings);
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  const handlePrint = (bk: Booking) => {
    setSelectedBookingForPrint(bk);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Prompt and Execute Deletions
  const triggerDelete = (type: 'booking' | 'captain' | 'customer', id: string, title: string, subtitle: string) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      title,
      subtitle,
    });
  };

  const confirmExecuteDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'customer') {
        await deleteCustomer(deleteModal.id);
      } else if (deleteModal.type === 'captain') {
        await deleteCaptain(deleteModal.id);
      } else if (deleteModal.type === 'booking') {
        await deleteBooking(deleteModal.id);
      }
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  };

  // WhatsApp Dispatch Generators
  const getPassengerWhatsAppLink = (bk: Booking, cap?: Captain | null) => {
    const cleanPhone = bk.customer_phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('92') ? cleanPhone : `92${cleanPhone.replace(/^0/, '')}`;
    const text = `Assalam-o-Alaikum ${bk.customer_name}!\nYour OLAK (${settings.company_name}) ride has been confirmed.\n\nToken: ${bk.booking_code}\nPickup: ${bk.pickup_location}\nDropoff: ${bk.dropoff_location}\nEstimated Fare: PKR ${bk.estimated_fare}\n\nCaptain: ${cap ? `${cap.full_name} (${cap.vehicle_name} - ${cap.vehicle_number_plate}, Phone: ${cap.phone})` : 'Assigned shortly'}\n\nLive Tracking: https://olak-mobility.vercel.app/track/?code=${bk.booking_code}\nHelpline: ${settings.phone}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const getCaptainWhatsAppLink = (bk: Booking, cap: Captain) => {
    const cleanPhone = (cap.whatsapp_number || cap.phone).replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('92') ? cleanPhone : `92${cleanPhone.replace(/^0/, '')}`;
    const text = `OLAK Dispatch Alert!\nNew Trip Assigned to Captain ${cap.full_name}.\n\nBooking: ${bk.booking_code}\nService: ${bk.service_type.toUpperCase()}\nCustomer: ${bk.customer_name} (${bk.customer_phone})\nPickup: ${bk.pickup_location}\nDropoff: ${bk.dropoff_location}\nFare: PKR ${bk.estimated_fare}\n\nPlease head to the pickup location immediately.`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  // Real-time Today's Metrics
  const todayDateStr = new Date().toDateString();
  const todayBookings = bookings.filter(b => new Date(b.created_at).toDateString() === todayDateStr);
  const todayGrossRevenue = todayBookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
  const todayCommission = Math.round(todayGrossRevenue * (settings.commission_percentage / 100));
  
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
  const platformCommission = Math.round(totalRevenue * (settings.commission_percentage / 100));
  const pendingCaptainsCount = captains.filter(c => c.status === 'pending').length;
  const activeCaptainsCount = captains.filter(c => c.status === 'approved').length;
  const ongoingTripsCount = bookings.filter(b => b.booking_status === 'assigned' || b.booking_status === 'arrived' || b.booking_status === 'in_progress').length;

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesFilter = bookingFilter === 'all' || b.booking_status === bookingFilter || b.service_type === bookingFilter;
    const matchesSearch = !searchQuery || 
      b.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  // Filtered Captains
  const filteredCaptains = captains.filter(c => {
    const matchesFilter = captainFilter === 'all' || c.status === captainFilter || c.service_type === captainFilter;
    const matchesSearch = !searchQuery || 
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery) ||
      c.vehicle_number_plate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filtered Customers
  const filteredCustomers = customers.filter(c => {
    return !searchQuery || 
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // PIN GATE SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-olak-navy-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-olak-teal/20 text-olak-teal rounded-2xl flex items-center justify-center mx-auto border border-olak-teal/40">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">OLAK Command Center</h2>
            <p className="text-xs text-slate-400 mt-1">Enter Master Authorization PIN to manage dispatches & drivers</p>
          </div>

          <form onSubmit={handlePinLogin} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter PIN (Default: admin123)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full bg-olak-navy-950 border border-olak-navy-800 focus:border-olak-teal rounded-xl px-4 py-3 text-center text-white tracking-widest text-lg font-mono focus:outline-none"
            />

            {pinError && (
              <p className="text-xs text-red-400 font-bold">Incorrect PIN. Please try again.</p>
            )}

            <button
              type="submit"
              className="w-full bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-black py-3 rounded-xl transition shadow-teal-glow"
            >
              Authorize & Enter Portal
            </button>
          </form>

          <Link href="/" className="inline-block text-xs text-slate-500 hover:text-slate-300">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-olak-navy-950 text-slate-100 flex flex-col">
      
      {/* Top Admin Header with Transparent Vector Logo */}
      <header className="bg-olak-navy-950 border-b border-olak-navy-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OlakLogo size="sm" textColor="text-white" />
            <div>
              <span className="font-black text-white text-base sm:text-lg">Admin Command Center</span>
              <span className="text-[10px] text-olak-teal font-mono ml-2 hidden sm:inline">Turbat Control Desk</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-olak-navy-900 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-olak-teal bg-olak-navy-900 px-3 py-1.5 rounded-lg border border-olak-navy-800"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 border border-red-800/40 px-3 py-1.5 rounded-lg font-bold"
            >
              Lock / Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">
        
        {/* TODAY'S REAL-TIME KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-olak-navy-900 border border-olak-teal/30 rounded-2xl p-4 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-olak-teal block flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>Today's Bookings</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{todayBookings.length}</span>
              <span className="text-[10px] text-slate-400">Total: {bookings.length}</span>
            </div>
          </div>

          <div className="bg-olak-navy-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Today's Gross Volume</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-emerald-400 font-bold">PKR</span>
              <span className="text-2xl font-black text-white">{todayGrossRevenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-olak-navy-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Today's Commission</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-amber-400 font-bold">PKR</span>
              <span className="text-2xl font-black text-amber-400">{todayCommission.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-2xl p-4 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Ongoing Trips</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-olak-teal">{ongoingTripsCount}</span>
              <span className="text-[10px] text-slate-400">On Road</span>
            </div>
          </div>

          <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-2xl p-4 shadow-lg col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Driver Approvals</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400">{pendingCaptainsCount}</span>
              <span className="text-[10px] text-slate-400">Active: {activeCaptainsCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-olak-navy-800">
          {[
            { id: 'bookings', label: 'Live Bookings & Dispatch', icon: Navigation, badge: bookings.filter(b => b.booking_status === 'pending').length },
            { id: 'captains', label: 'Captains & Drivers', icon: Users, badge: pendingCaptainsCount },
            { id: 'customers', label: 'Customer Database', icon: UserCheck, count: customers.length },
            { id: 'pricing', label: 'Fare Rates & Pricing', icon: DollarSign },
            { id: 'intercity', label: 'Intercity Routes', icon: MapPin },
            { id: 'analytics', label: 'Analytics & Financials', icon: TrendingUp },
            { id: 'settings', label: 'System Settings', icon: Settings },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  isSel
                    ? 'bg-olak-teal text-olak-navy-950 shadow-teal-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-olak-navy-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSel ? 'bg-olak-navy-950 text-olak-teal' : 'bg-red-500 text-white'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: BOOKINGS & DISPATCH */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {['all', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                      bookingFilter === st
                        ? 'bg-olak-navy-800 text-olak-teal border border-olak-teal/40'
                        : 'bg-olak-navy-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search token, name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-olak-navy-900 border border-olak-navy-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-olak-teal"
                />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-olak-navy-950 text-slate-400 uppercase font-bold border-b border-olak-navy-800">
                    <tr>
                      <th className="px-4 py-3">Token & Service</th>
                      <th className="px-4 py-3">Customer Contact</th>
                      <th className="px-4 py-3">Pickup ➔ Dropoff</th>
                      <th className="px-4 py-3">Fare</th>
                      <th className="px-4 py-3">Assigned Captain</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions & Dispatch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-olak-navy-800">
                    {filteredBookings.map((b) => {
                      const assignedCap = captains.find(c => c.id === b.assigned_captain_id);
                      return (
                        <tr key={b.id} className="hover:bg-olak-navy-850/60 transition">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-white block">{b.booking_code}</span>
                            <span className="text-[10px] text-olak-teal uppercase font-semibold">{b.service_type}</span>
                            <span className="text-[9px] text-slate-500 block">
                              {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-white block">{b.customer_name}</span>
                            <a href={`tel:${b.customer_phone}`} className="text-slate-400 hover:text-olak-teal block">
                              {b.customer_phone}
                            </a>
                          </td>

                          <td className="px-4 py-3 max-w-xs">
                            <span className="text-slate-200 block truncate font-medium">📍 {b.pickup_location}</span>
                            <span className="text-slate-400 block truncate">🏁 {b.dropoff_location}</span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-black text-olak-teal block">PKR {b.final_fare || b.estimated_fare}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{b.payment_method}</span>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={b.assigned_captain_id || ''}
                              onChange={(e) => handleAssignCaptain(b.id, e.target.value)}
                              className="bg-olak-navy-950 border border-olak-navy-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none max-w-[140px]"
                            >
                              <option value="">-- Assign Driver --</option>
                              {captains.filter(c => c.status === 'approved').map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.full_name} ({c.vehicle_name})
                                </option>
                              ))}
                            </select>
                            {assignedCap && (
                              <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono">
                                {assignedCap.vehicle_number_plate}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={b.booking_status}
                              onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as any)}
                              className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase border focus:outline-none ${
                                b.booking_status === 'completed'
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50'
                                  : b.booking_status === 'cancelled'
                                  ? 'bg-red-950/60 text-red-400 border-red-700/50'
                                  : 'bg-amber-950/60 text-amber-400 border-amber-700/50'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="assigned">Assigned</option>
                              <option value="arrived">Arrived</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            <a
                              href={getPassengerWhatsAppLink(b, assignedCap)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex p-1.5 bg-emerald-900/60 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg transition"
                              title="Send WhatsApp to Customer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {assignedCap && (
                              <a
                                href={getCaptainWhatsAppLink(b, assignedCap)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex p-1.5 bg-blue-900/60 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition"
                                title="Send WhatsApp Dispatch to Captain"
                              >
                                <Car className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() => handlePrint(b)}
                              className="inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                              title="Print Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* DELETE BOOKING BUTTON */}
                            <button
                              onClick={() => triggerDelete(
                                'booking', 
                                b.id, 
                                `Delete Booking ${b.booking_code}?`, 
                                `Are you sure you want to delete ride token ${b.booking_code} for ${b.customer_name}?`
                              )}
                              className="inline-flex p-1.5 bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-800/60 transition"
                              title="Delete Booking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredBookings.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No bookings found matching filter criteria.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CAPTAINS VERIFICATION */}
        {activeTab === 'captains' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setCaptainFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    captainFilter === st ? 'bg-olak-navy-800 text-olak-teal border border-olak-teal/40' : 'bg-olak-navy-900 text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCaptains.map((cap) => (
                <div key={cap.id} className="bg-olak-navy-900 border border-olak-navy-800 rounded-2xl p-5 space-y-3.5 shadow-lg relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-olak-teal">{cap.service_type}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cap.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : cap.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {cap.status}
                      </span>
                      {/* DELETE CAPTAIN BUTTON */}
                      <button
                        onClick={() => triggerDelete(
                          'captain', 
                          cap.id, 
                          `Delete Captain ${cap.full_name}?`, 
                          `Are you sure you want to delete Captain ${cap.full_name} (${cap.vehicle_name})?`
                        )}
                        className="p-1 bg-red-950/60 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-800/40 transition"
                        title="Delete Captain"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">{cap.full_name}</h4>
                    <p className="text-xs text-slate-300">Phone: {cap.phone}</p>
                    <p className="text-xs text-slate-400">CNIC: {cap.cnic_number} • City: {cap.city}</p>
                    <p className="text-xs text-slate-300 font-semibold mt-1">
                      Vehicle: {cap.vehicle_name} (<span className="font-mono text-olak-teal">{cap.vehicle_number_plate}</span>)
                    </p>
                  </div>

                  {/* Documents Preview Thumbnails */}
                  <div className="flex gap-2 pt-2 border-t border-olak-navy-800 text-[10px]">
                    {cap.cnic_front_url && (
                      <button
                        onClick={() => setPreviewDocUrl(cap.cnic_front_url!)}
                        className="bg-olak-navy-950 hover:bg-olak-navy-800 text-slate-300 px-2 py-1 rounded border border-olak-navy-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-olak-teal" />
                        <span>CNIC</span>
                      </button>
                    )}
                    {cap.license_url && (
                      <button
                        onClick={() => setPreviewDocUrl(cap.license_url!)}
                        className="bg-olak-navy-950 hover:bg-olak-navy-800 text-slate-300 px-2 py-1 rounded border border-olak-navy-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-olak-teal" />
                        <span>License</span>
                      </button>
                    )}
                    {cap.vehicle_photo_url && (
                      <button
                        onClick={() => setPreviewDocUrl(cap.vehicle_photo_url!)}
                        className="bg-olak-navy-950 hover:bg-olak-navy-800 text-slate-300 px-2 py-1 rounded border border-olak-navy-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-olak-teal" />
                        <span>Vehicle</span>
                      </button>
                    )}
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="flex gap-2 pt-2">
                    {cap.status !== 'approved' && (
                      <button
                        onClick={() => handleCaptainStatus(cap.id, 'approved')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs transition shadow-sm"
                      >
                        Approve Captain
                      </button>
                    )}
                    {cap.status !== 'rejected' && (
                      <button
                        onClick={() => handleCaptainStatus(cap.id, 'rejected')}
                        className="flex-1 bg-red-950 hover:bg-red-800 text-red-300 border border-red-800 py-1.5 rounded-lg text-xs transition"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER DATABASE */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Registered Passengers & Customers</h3>
                <span className="text-xs text-slate-400">Total Registered: {customers.length}</span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-olak-navy-900 border border-olak-navy-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-olak-teal"
                />
              </div>
            </div>

            <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-olak-navy-950 text-slate-400 uppercase font-bold border-b border-olak-navy-800">
                  <tr>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Contact Phone</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Registered Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olak-navy-800">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-olak-navy-850/60 transition">
                      <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-olak-teal/20 text-olak-teal flex items-center justify-center font-bold text-[10px]">
                          {c.full_name.charAt(0)}
                        </div>
                        <span>{c.full_name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{c.phone}</td>
                      <td className="px-4 py-3 text-slate-400">{c.email}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <a
                          href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-700 hover:text-white rounded-lg border border-emerald-700/50"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        {/* DELETE CUSTOMER BUTTON */}
                        <button
                          onClick={() => triggerDelete(
                            'customer', 
                            c.id, 
                            `Delete Customer ${c.full_name}?`, 
                            `Are you sure you want to delete customer ${c.full_name}?`
                          )}
                          className="inline-flex p-1.5 bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-800/60 transition"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCustomers.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No customers found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DYNAMIC FARE RATES MANAGER */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Service Fare & Pricing Rate Manager</h3>
              <span className="text-xs text-slate-400">Directly syncs to live customer calculators</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pricingRates.map((rate) => (
                <div key={rate.id} className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-olak-navy-800">
                    <div>
                      <h4 className="text-lg font-black text-white">{rate.service_name}</h4>
                      <span className="text-xs text-olak-teal font-urdu">{rate.service_name_urdu}</span>
                    </div>
                    <span className="text-xs font-mono uppercase bg-slate-800 px-2 py-1 rounded text-slate-300">
                      {rate.service_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Base Fare (PKR)</label>
                      <input
                        type="number"
                        value={rate.base_fare}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, base_fare: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-lg px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Per KM Rate (PKR)</label>
                      <input
                        type="number"
                        value={rate.per_km_charge}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, per_km_charge: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-lg px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Minimum Fare (PKR)</label>
                      <input
                        type="number"
                        value={rate.minimum_fare}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, minimum_fare: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-lg px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Waiting Charge (PKR/min)</label>
                      <input
                        type="number"
                        value={rate.waiting_charge_per_min}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, waiting_charge_per_min: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-lg px-3 py-2 text-white font-bold"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveRate(rate)}
                    disabled={isSaving}
                    className="w-full bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-teal-glow transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save {rate.service_name} Rates</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: INTERCITY ROUTES */}
        {activeTab === 'intercity' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Intercity Highway Routes & Matrix</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {intercityRoutes.map((route) => (
                <div key={route.id} className="bg-olak-navy-900 border border-olak-navy-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-olak-navy-800">
                    <span className="font-bold text-white">{route.origin_city} ➔ {route.destination_city}</span>
                    <span className="text-xs text-olak-teal">{route.estimated_distance_km} KM</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-slate-200">{route.estimated_duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Economy Car Fare:</span>
                      <span className="font-bold text-olak-teal">PKR {route.car_economy_fare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">AC Comfort Car:</span>
                      <span className="font-bold text-emerald-400">PKR {route.car_comfort_fare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Parcel Cargo:</span>
                      <span className="font-bold text-amber-400">PKR {route.delivery_parcel_fare}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ANALYTICS & REPORTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-6 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400">Trips by Service</span>
                <div className="space-y-2 text-xs">
                  {['bike', 'car', 'rickshaw', 'delivery', 'intercity'].map(s => {
                    const count = bookings.filter(b => b.service_type === s).length;
                    return (
                      <div key={s} className="flex justify-between items-center text-slate-300">
                        <span className="capitalize">{s}</span>
                        <span className="font-bold text-white">{count} ({bookings.length > 0 ? Math.round((count/bookings.length)*100) : 0}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-6 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400">Trip Status Distribution</span>
                <div className="space-y-2 text-xs">
                  {['completed', 'pending', 'assigned', 'in_progress', 'cancelled'].map(s => {
                    const count = bookings.filter(b => b.booking_status === s).length;
                    return (
                      <div key={s} className="flex justify-between items-center text-slate-300">
                        <span className="capitalize">{s.replace('_', ' ')}</span>
                        <span className="font-bold text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-6 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400">Financial Summary</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Booking Value:</span>
                    <span className="font-bold text-white">PKR {totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commission Rate:</span>
                    <span className="font-bold text-olak-teal">{settings.commission_percentage}%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-olak-navy-800 text-sm">
                    <span className="font-bold text-emerald-400">Net Platform Profit:</span>
                    <span className="font-black text-emerald-400">PKR {platformCommission.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-6 sm:p-8 space-y-5 max-w-3xl shadow-xl">
            <h3 className="text-lg font-bold text-white">Platform Identity & Contact Controls</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Company Name (English)</label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Company Name (Urdu)</label>
                <input
                  type="text"
                  value={settings.company_name_urdu}
                  onChange={(e) => setSettings({ ...settings, company_name_urdu: e.target.value })}
                  className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-white font-urdu"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Official Helpline Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Official WhatsApp Number</label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Platform Commission (%)</label>
                <input
                  type="number"
                  value={settings.commission_percentage}
                  onChange={(e) => setSettings({ ...settings, commission_percentage: Number(e.target.value) })}
                  className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Master Admin PIN</label>
                <input
                  type="text"
                  value={settings.admin_pin}
                  onChange={(e) => setSettings({ ...settings, admin_pin: e.target.value })}
                  className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-bold px-6 py-3 rounded-xl transition shadow-teal-glow"
            >
              Save All Settings
            </button>
          </form>
        )}

      </main>

      {/* CLEAN CONFIRMATION MODAL FOR DELETIONS */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-olak-navy-900 border border-red-600/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">{deleteModal.title}</h3>
              <p className="text-xs text-slate-400">{deleteModal.subtitle}</p>
            </div>

            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-3 text-[11px] text-red-300 text-center font-semibold">
              ⚠️ This action cannot be undone.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
              >
                Cancel / No
              </button>

              <button
                type="button"
                onClick={confirmExecuteDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Image Lightbox Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-olak-navy-900 border border-olak-navy-800 rounded-3xl p-4 max-w-xl w-full space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Document Verification Preview</span>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-black">
              <img src={previewDocUrl} alt="Document" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => setPreviewDocUrl(null)}
              className="w-full bg-olak-navy-800 hover:bg-olak-navy-700 text-white font-bold py-2 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Hidden Printable Invoice Component */}
      {selectedBookingForPrint && (
        <PrintableReceipt
          booking={selectedBookingForPrint}
          captain={captains.find(c => c.id === selectedBookingForPrint.assigned_captain_id)}
          settings={settings}
        />
      )}

    </div>
  );
}
