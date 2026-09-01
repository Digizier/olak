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
  deleteIntercityRoute,
  getCaptains, 
  updateCaptainStatus, 
  deleteCaptain,
  getBookings, 
  updateBookingStatus, 
  deleteBooking,
  getCustomers,
  deleteCustomer,
  getPromotions,
  savePromotion,
  deletePromotion,
  getDriverSettlements,
  recordDriverSettlement,
  deleteDriverSettlement,
  getCaptainFinancialSummary,
  getCityLandmarks,
  saveCityLandmark,
  deleteCityLandmark,
  calculateRealtimeDistance,
  calculateTripFare
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
  ServiceType,
  PromotionBanner,
  DriverSettlement,
  CityLandmark
} from '@/lib/types';
import { 
  INITIAL_SITE_SETTINGS, 
  INITIAL_PRICING_RATES, 
  INITIAL_INTERCITY_ROUTES,
  INITIAL_PROMOTIONS,
  TURBAT_LANDMARKS
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
  Trash2,
  Image as ImageIcon,
  PlusCircle,
  CreditCard,
  CheckCircle,
  Sliders,
  Tag,
  Receipt
} from 'lucide-react';

interface DeleteModalState {
  isOpen: boolean;
  type: 'booking' | 'captain' | 'customer' | 'route' | 'promo' | 'settlement' | 'landmark';
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
  const [activeTab, setActiveTab] = useState<
    'bookings' | 'captains' | 'settlements' | 'customers' | 'pricing' | 'intercity' | 'promotions' | 'analytics' | 'settings'
  >('bookings');

  // Master Datasets
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pricingRates, setPricingRates] = useState<PricingRate[]>(INITIAL_PRICING_RATES);
  const [intercityRoutes, setIntercityRoutes] = useState<IntercityRoute[]>(INITIAL_INTERCITY_ROUTES);
  const [promotions, setPromotions] = useState<PromotionBanner[]>(INITIAL_PROMOTIONS);
  const [settlements, setSettlements] = useState<DriverSettlement[]>([]);
  const [landmarks, setLandmarks] = useState<CityLandmark[]>(TURBAT_LANDMARKS);
  
  // Simulator State for Admin Fare Testing
  const [simPickup, setSimPickup] = useState<string>(TURBAT_LANDMARKS[0].name);
  const [simDropoff, setSimDropoff] = useState<string>(TURBAT_LANDMARKS[2].name);

  // Landmark Modal State
  const [landmarkModalOpen, setLandmarkModalOpen] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<Partial<CityLandmark>>({
    name: '',
    name_urdu: '',
    area: 'Central Turbat',
    lat: 26.0031,
    lng: 63.0544,
    is_active: true
  });
  
  // Filters & State
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [captainFilter, setCaptainFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<Booking | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals for Actions
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Driver Settlement Form Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedCaptainForSettle, setSelectedCaptainForSettle] = useState<Captain | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState('cash');
  const [settleNotes, setSettleNotes] = useState('');

  // Intercity Route Form Modal State
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Partial<IntercityRoute>>({
    origin_city: 'Turbat',
    destination_city: '',
    estimated_distance_km: 100,
    estimated_duration: '2 Hours',
    pricing_model: 'fixed',
    per_km_rate: 25,
    car_economy_fare: 3000,
    car_comfort_fare: 4500,
    delivery_parcel_fare: 800,
    is_active: true,
  });

  // Promo Banner Form Modal State
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<PromotionBanner>>({
    title: '',
    subtitle: '',
    image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
    link_url: '/#fares',
    badge: 'Special Deal',
    is_active: true,
  });

  // Load All Data
  const loadData = async () => {
    try {
      const [st, bk, cp, cust, pr, ir, prm, stl, lm] = await Promise.all([
        getSiteSettings(),
        getBookings(),
        getCaptains(),
        getCustomers(),
        getPricingRates(),
        getIntercityRoutes(),
        getPromotions(),
        getDriverSettlements(),
        getCityLandmarks(),
      ]);
      setSettings(st);
      setBookings(bk);
      setCaptains(cp);
      setCustomers(cust);
      setPricingRates(pr);
      setIntercityRoutes(ir);
      setPromotions(prm);
      setSettlements(stl);
      if (lm && lm.length > 0) {
        setLandmarks(lm);
      }
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
    window.addEventListener('olak_intercity_updated', handleUpdate);
    window.addEventListener('olak_promotions_updated', handleUpdate);
    window.addEventListener('olak_settlements_updated', handleUpdate);
    window.addEventListener('olak_settings_updated', handleUpdate);
    window.addEventListener('olak_landmarks_updated', handleUpdate);
    return () => {
      window.removeEventListener('olak_bookings_updated', handleUpdate);
      window.removeEventListener('olak_captains_updated', handleUpdate);
      window.removeEventListener('olak_customers_updated', handleUpdate);
      window.removeEventListener('olak_fares_updated', handleUpdate);
      window.removeEventListener('olak_intercity_updated', handleUpdate);
      window.removeEventListener('olak_promotions_updated', handleUpdate);
      window.removeEventListener('olak_settlements_updated', handleUpdate);
      window.removeEventListener('olak_settings_updated', handleUpdate);
      window.removeEventListener('olak_landmarks_updated', handleUpdate);
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

  // Settlement Handlers
  const openSettlementModal = (captain: Captain) => {
    setSelectedCaptainForSettle(captain);
    // Compute remaining balance
    const captainBookings = bookings.filter(b => b.assigned_captain_id === captain.id && b.booking_status === 'completed');
    const gross = captainBookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
    const comm = Math.round(gross * (settings.commission_percentage / 100));
    const paid = settlements.filter(s => s.captain_id === captain.id).reduce((sum, s) => sum + Number(s.amount), 0);
    const due = Math.max(0, comm - paid);
    
    setSettleAmount(due);
    setSettleNotes(`Cleared cash commission for ${captainBookings.length} completed trips`);
    setSettleModalOpen(true);
  };

  const handleRecordSettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptainForSettle || settleAmount <= 0) {
      alert('Please specify a valid payment amount.');
      return;
    }

    setIsSaving(true);
    await recordDriverSettlement({
      captain_id: selectedCaptainForSettle.id,
      captain_name: selectedCaptainForSettle.full_name,
      amount: settleAmount,
      payment_method: settleMethod,
      notes: settleNotes,
    });
    setIsSaving(false);
    setSettleModalOpen(false);
    await loadData();
    alert(`Cash payment of PKR ${settleAmount} recorded for ${selectedCaptainForSettle.full_name}!`);
  };

  // Intercity Route Handlers
  const handleSaveRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute.origin_city || !editingRoute.destination_city) {
      alert('Please provide Origin and Destination cities.');
      return;
    }
    setIsSaving(true);
    await saveIntercityRoute(editingRoute);
    setIsSaving(false);
    setRouteModalOpen(false);
    await loadData();
    alert('Intercity route saved successfully!');
  };

  // Promotion Handlers
  const handleSavePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo.title || !editingPromo.image_url) {
      alert('Please provide a banner title and image URL.');
      return;
    }
    setIsSaving(true);
    await savePromotion(editingPromo);
    setIsSaving(false);
    setPromoModalOpen(false);
    await loadData();
    alert('Promotion banner saved successfully!');
  };

  // City Landmark Handlers
  const handleSaveLandmarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLandmark.name) {
      alert('Please provide a landmark name.');
      return;
    }
    setIsSaving(true);
    await saveCityLandmark(editingLandmark);
    setIsSaving(false);
    setLandmarkModalOpen(false);
    await loadData();
    alert('City landmark saved successfully!');
  };

  // Prompt and Execute Deletions
  const triggerDelete = (
    type: 'booking' | 'captain' | 'customer' | 'route' | 'promo' | 'settlement' | 'landmark', 
    id: string, 
    title: string, 
    subtitle: string
  ) => {
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
      } else if (deleteModal.type === 'route') {
        await deleteIntercityRoute(deleteModal.id);
      } else if (deleteModal.type === 'promo') {
        await deletePromotion(deleteModal.id);
      } else if (deleteModal.type === 'settlement') {
        await deleteDriverSettlement(deleteModal.id);
      } else if (deleteModal.type === 'landmark') {
        await deleteCityLandmark(deleteModal.id);
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
  const totalSettledCash = settlements.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalPendingSettlements = Math.max(0, platformCommission - totalSettledCash);

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">OLAK Command Center</h2>
            <p className="text-xs text-slate-500 mt-1">Enter Master Authorization PIN to access admin desk</p>
          </div>

          <form onSubmit={handlePinLogin} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter PIN (Default: admin123)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-4 py-3 text-center text-slate-900 tracking-widest text-lg font-mono focus:outline-none"
            />

            {pinError && (
              <p className="text-xs text-red-600 font-bold">Incorrect PIN. Please try again.</p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition shadow-md cursor-pointer"
            >
              Authorize & Enter Portal
            </button>
          </form>

          <Link href="/" className="inline-block text-xs text-slate-500 hover:text-slate-800">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* Top Admin Header with Transparent Vector Logo on White */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OlakLogo size="sm" textColor="text-slate-900" innerCircleColor="#ffffff" />
            <div>
              <span className="font-black text-slate-900 text-base sm:text-lg">Admin Command Center</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-2 hidden sm:inline">
                Turbat Control Desk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadData}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
            >
              Lock / Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">
        
        {/* REAL-TIME KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>Today's Bookings</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{todayBookings.length}</span>
              <span className="text-[10px] text-slate-500">Total: {bookings.length}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Today's Volume</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-emerald-600 font-bold">PKR</span>
              <span className="text-2xl font-black text-slate-900">{todayGrossRevenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Today's Commission</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-amber-600 font-bold">PKR</span>
              <span className="text-2xl font-black text-amber-700">{todayCommission.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">Cleared Cash Paid</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-teal-600 font-bold">PKR</span>
              <span className="text-2xl font-black text-teal-700">{totalSettledCash.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pending Clearance</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-red-600 font-bold">PKR</span>
              <span className="text-2xl font-black text-red-600">{totalPendingSettlements.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {[
            { id: 'bookings', label: 'Live Bookings & Dispatch', icon: Navigation, badge: bookings.filter(b => b.booking_status === 'pending').length },
            { id: 'captains', label: 'Captains & Drivers', icon: Users, badge: pendingCaptainsCount },
            { id: 'settlements', label: 'Driver Cash Clearance', icon: Banknote },
            { id: 'customers', label: 'Customer Database', icon: UserCheck, count: customers.length },
            { id: 'pricing', label: 'Fare Rates & Pricing', icon: DollarSign },
            { id: 'intercity', label: 'Intercity Routes Editor', icon: MapPin },
            { id: 'promotions', label: 'Ads & Promotion Banners', icon: Tag },
            { id: 'analytics', label: 'Analytics & Financials', icon: TrendingUp },
            { id: 'settings', label: 'System Settings', icon: Settings },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                  isSel
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSel ? 'bg-white text-emerald-700' : 'bg-red-500 text-white'}`}>
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
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-200">
                    {filteredBookings.map((b) => {
                      const assignedCap = captains.find(c => c.id === b.assigned_captain_id);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-slate-900 block">{b.booking_code}</span>
                            <span className="text-[10px] text-emerald-700 uppercase font-bold">{b.service_type}</span>
                            <span className="text-[9px] text-slate-400 block">
                              {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{b.customer_name}</span>
                            <a href={`tel:${b.customer_phone}`} className="text-slate-500 hover:text-emerald-600 block">
                              {b.customer_phone}
                            </a>
                          </td>

                          <td className="px-4 py-3 max-w-xs">
                            <span className="text-slate-800 block truncate font-medium">📍 {b.pickup_location}</span>
                            <span className="text-slate-500 block truncate">🏁 {b.dropoff_location}</span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-black text-emerald-700 block">PKR {b.final_fare || b.estimated_fare}</span>
                            <span className="text-[10px] text-slate-400 uppercase">{b.payment_method}</span>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={b.assigned_captain_id || ''}
                              onChange={(e) => handleAssignCaptain(b.id, e.target.value)}
                              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none max-w-[140px]"
                            >
                              <option value="">-- Assign Driver --</option>
                              {captains.filter(c => c.status === 'approved').map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.full_name} ({c.vehicle_name})
                                </option>
                              ))}
                            </select>
                            {assignedCap && (
                              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5 font-mono">
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
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : b.booking_status === 'cancelled'
                                  ? 'bg-red-50 text-red-700 border-red-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
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
                              className="inline-flex p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-200 transition"
                              title="Send WhatsApp to Customer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {assignedCap && (
                              <a
                                href={getCaptainWhatsAppLink(b, assignedCap)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg border border-blue-200 transition"
                                title="Send WhatsApp Dispatch to Captain"
                              >
                                <Car className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() => handlePrint(b)}
                              className="inline-flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
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
                              className="inline-flex p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition cursor-pointer"
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
                    captainFilter === st ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCaptains.map((cap) => {
                const captainBookings = bookings.filter(b => b.assigned_captain_id === cap.id && b.booking_status === 'completed');
                const grossFares = captainBookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
                const comm = Math.round(grossFares * (settings.commission_percentage / 100));
                const paid = settlements.filter(s => s.captain_id === cap.id).reduce((sum, s) => sum + Number(s.amount), 0);
                const due = Math.max(0, comm - paid);

                return (
                  <div key={cap.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-sm relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {cap.service_type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          cap.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : cap.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
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
                          className="p-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition cursor-pointer"
                          title="Delete Captain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900">{cap.full_name}</h4>
                      <p className="text-xs text-slate-600">Phone: {cap.phone}</p>
                      <p className="text-xs text-slate-500">CNIC: {cap.cnic_number} • City: {cap.city}</p>
                      <p className="text-xs text-slate-700 font-semibold mt-1">
                        Vehicle: {cap.vehicle_name} (<span className="font-mono text-emerald-700">{cap.vehicle_number_plate}</span>)
                      </p>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Trips:</span>
                        <span className="font-bold text-slate-900">{captainBookings.length} completed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gross Cash Collected:</span>
                        <span className="font-bold text-slate-900">PKR {grossFares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Platform Due ({settings.commission_percentage}%):</span>
                        <span className="font-bold text-amber-700">PKR {comm.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                        <span className="text-slate-700">Net Due to Office:</span>
                        <span className={`font-black ${due > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {due > 0 ? `PKR ${due.toLocaleString()}` : 'Cleared (PKR 0)'}
                        </span>
                      </div>
                    </div>

                    {/* Cash Clearance CTA */}
                    <button
                      onClick={() => openSettlementModal(cap)}
                      className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment / Clear Cash</span>
                    </button>

                    {/* Documents Preview Thumbnails */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200 text-[10px]">
                      {cap.cnic_front_url && (
                        <button
                          onClick={() => setPreviewDocUrl(cap.cnic_front_url!)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>CNIC</span>
                        </button>
                      )}
                      {cap.license_url && (
                        <button
                          onClick={() => setPreviewDocUrl(cap.license_url!)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>License</span>
                        </button>
                      )}
                      {cap.vehicle_photo_url && (
                        <button
                          onClick={() => setPreviewDocUrl(cap.vehicle_photo_url!)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Vehicle</span>
                        </button>
                      )}
                    </div>

                    {/* Approve / Reject Actions */}
                    <div className="flex gap-2 pt-2">
                      {cap.status !== 'approved' && (
                        <button
                          onClick={() => handleCaptainStatus(cap.id, 'approved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs transition shadow-xs cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {cap.status !== 'rejected' && (
                        <button
                          onClick={() => handleCaptainStatus(cap.id, 'rejected')}
                          className="flex-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 py-1.5 rounded-lg text-xs transition cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DRIVER CASH CLEARANCE & SETTLEMENTS */}
        {activeTab === 'settlements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Driver Cash Settlement & Clearance Desk</h3>
                <p className="text-xs text-slate-500">Record when drivers pay their 10% platform commission and mark cash cleared</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600">Total Cleared: PKR {totalSettledCash.toLocaleString()}</span>
              </div>
            </div>

            {/* Drivers Ledger Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {captains.filter(c => c.status === 'approved').map(cap => {
                const captainBookings = bookings.filter(b => b.assigned_captain_id === cap.id && b.booking_status === 'completed');
                const gross = captainBookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
                const comm = Math.round(gross * (settings.commission_percentage / 100));
                const paid = settlements.filter(s => s.captain_id === cap.id).reduce((sum, s) => sum + Number(s.amount), 0);
                const due = Math.max(0, comm - paid);

                return (
                  <div key={cap.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-slate-900">{cap.full_name}</h4>
                        <span className="text-xs text-slate-500">{cap.vehicle_name} ({cap.vehicle_number_plate})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${due <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {due <= 0 ? 'CLEARED' : 'PENDING'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Fares Collected:</span>
                        <span className="font-bold text-slate-900">PKR {gross.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>10% Platform Fee:</span>
                        <span className="font-bold text-amber-700">PKR {comm.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total Cleared / Paid:</span>
                        <span className="font-bold text-emerald-700">PKR {paid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                        <span className="text-slate-700">Outstanding Balance:</span>
                        <span className={`font-black ${due > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          PKR {due.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openSettlementModal(cap)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record Payment / Clear Cash</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Settlements History Log Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-3 p-5">
              <h4 className="font-black text-sm text-slate-900">Payment Clearance History Log</h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Captain Name</th>
                      <th className="px-4 py-3">Amount Cleared</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3">Notes / Ref</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {settlements.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.captain_name}</td>
                        <td className="px-4 py-3 font-black text-emerald-700">PKR {Number(s.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 uppercase font-bold text-slate-600">{s.payment_method}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{s.notes || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => triggerDelete('settlement', s.id, 'Delete Settlement Record?', `Delete payment of PKR ${s.amount} for ${s.captain_name}?`)}
                            className="p-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded border border-red-200 transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {settlements.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No cash clearances recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMER DATABASE */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registered Passengers & Customers</h3>
                <span className="text-xs text-slate-500">Total Registered: {customers.length}</span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Contact Phone</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Registered Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                          {c.full_name.charAt(0)}
                        </div>
                        <span>{c.full_name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-800">{c.phone}</td>
                      <td className="px-4 py-3 text-slate-500">{c.email}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <a
                          href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-200"
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
                          className="inline-flex p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition cursor-pointer"
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

        {/* TAB 5: DYNAMIC FARE RATES MANAGER */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Service Fare & Pricing Rate Manager</h3>
                <span className="text-xs text-slate-500">Directly syncs to live customer calculators in Turbat</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pricingRates.map((rate) => (
                <div key={rate.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{rate.service_name}</h4>
                      <span className="text-xs text-emerald-600 font-urdu">{rate.service_name_urdu}</span>
                    </div>
                    <span className="text-xs font-mono uppercase bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-bold border border-slate-200">
                      {rate.service_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Base Fare (PKR)</label>
                      <input
                        type="number"
                        value={rate.base_fare}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, base_fare: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Per KM Rate (PKR)</label>
                      <input
                        type="number"
                        value={rate.per_km_charge}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, per_km_charge: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Minimum Fare (PKR)</label>
                      <input
                        type="number"
                        value={rate.minimum_fare}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, minimum_fare: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Waiting Charge (PKR/min)</label>
                      <input
                        type="number"
                        value={rate.waiting_charge_per_min}
                        onChange={(e) => {
                          const updated = pricingRates.map(r => r.id === rate.id ? { ...r, waiting_charge_per_min: Number(e.target.value) } : r);
                          setPricingRates(updated);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveRate(rate)}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save {rate.service_name} Rates</span>
                  </button>
                </div>
              ))}
            </div>

            {/* REAL-TIME DISTANCE & FARE SIMULATOR (ADMIN VISIBILITY & CONTROL) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    <span>Real-Time GPS Route Distance & Fare Simulator</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Test the exact real-time distance and fare calculations that customers see in live Turbat bookings.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                  Live Calculator
                </span>
              </div>

              {/* Landmark Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Pickup Location</label>
                  <select
                    value={simPickup}
                    onChange={(e) => setSimPickup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                  >
                    {landmarks.map(lm => (
                      <option key={lm.id || lm.name} value={lm.name}>
                        {lm.name} ({lm.area})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Dropoff Destination</label>
                  <select
                    value={simDropoff}
                    onChange={(e) => setSimDropoff(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
                  >
                    {landmarks.map(lm => (
                      <option key={lm.id || lm.name} value={lm.name}>
                        {lm.name} ({lm.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculated Outputs */}
              {(() => {
                const simP = landmarks.find(l => l.name === simPickup) || landmarks[0] || TURBAT_LANDMARKS[0];
                const simD = landmarks.find(l => l.name === simDropoff) || landmarks[1] || landmarks[0] || TURBAT_LANDMARKS[1];
                const simDistanceKm = calculateRealtimeDistance(
                  { lat: Number(simP.lat), lng: Number(simP.lng) },
                  { lat: Number(simD.lat), lng: Number(simD.lng) }
                );
                const simBike = calculateTripFare('bike', simDistanceKm, pricingRates);
                const simRickshaw = calculateTripFare('rickshaw', simDistanceKm, pricingRates);
                const simCar = calculateTripFare('car', simDistanceKm, pricingRates);
                const deliveryRate = pricingRates.find(r => r.service_type === 'delivery');
                const simDelivery = deliveryRate 
                  ? Math.max(deliveryRate.minimum_fare, Math.round((deliveryRate.base_fare + simDistanceKm * deliveryRate.per_km_charge) / 10) * 10) 
                  : 150;

                return (
                  <div className="space-y-3 pt-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Calculated Road Distance</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black text-slate-900">{simDistanceKm}</span>
                          <span className="text-xs font-bold text-emerald-600">KM</span>
                        </div>
                        <span className="text-[11px] text-slate-500">Coordinates: ({Number(simP.lat).toFixed(4)}, {Number(simP.lng).toFixed(4)}) ➔ ({Number(simD.lat).toFixed(4)}, {Number(simD.lng).toFixed(4)})</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold block">Bike Fare</span>
                          <span className="text-sm font-black text-slate-900">PKR {simBike}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold block">Rickshaw</span>
                          <span className="text-sm font-black text-slate-900">PKR {simRickshaw}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold block">Car Fare</span>
                          <span className="text-sm font-black text-slate-900">PKR {simCar}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 font-bold block">Delivery</span>
                          <span className="text-sm font-black text-slate-900">PKR {simDelivery}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* CITY LOCATIONS & LANDMARKS MANAGER */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span>Turbat City Locations & Landmarks Manager ({landmarks.length})</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Locations and coordinates used to calculate customer distances in real-time.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingLandmark({
                      name: '',
                      name_urdu: '',
                      area: 'Central Turbat',
                      lat: 26.0031,
                      lng: 63.0544,
                      is_active: true
                    });
                    setLandmarkModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add City Location / Landmark</span>
                </button>
              </div>

              {/* Landmarks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Landmark / Place Name</th>
                      <th className="px-4 py-3">Urdu Name</th>
                      <th className="px-4 py-3">Area</th>
                      <th className="px-4 py-3">GPS Latitude</th>
                      <th className="px-4 py-3">GPS Longitude</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {landmarks.map((lm) => (
                      <tr key={lm.id || lm.name} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{lm.name}</td>
                        <td className="px-4 py-3 text-slate-700 font-urdu">{lm.nameUrdu || lm.name_urdu || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{lm.area}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{Number(lm.lat).toFixed(4)}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{Number(lm.lng).toFixed(4)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => triggerDelete(
                              'landmark',
                              lm.id,
                              `Delete Location ${lm.name}?`,
                              `Are you sure you want to remove ${lm.name} from Turbat city landmarks?`
                            )}
                            className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition cursor-pointer"
                            title="Delete Landmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INTERCITY ROUTES MANAGER */}
        {activeTab === 'intercity' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Intercity Highway Routes & Pricing Editor</h3>
                <span className="text-xs text-slate-500">Configure Fixed vs Per-KM rates and add new destinations</span>
              </div>

              <button
                onClick={() => {
                  setEditingRoute({
                    origin_city: 'Turbat',
                    destination_city: '',
                    estimated_distance_km: 150,
                    estimated_duration: '2.5 Hours',
                    pricing_model: 'fixed',
                    per_km_rate: 25,
                    car_economy_fare: 3500,
                    car_comfort_fare: 5000,
                    delivery_parcel_fare: 800,
                    is_active: true,
                  });
                  setRouteModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add New Highway Route</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {intercityRoutes.map((route) => (
                <div key={route.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-black text-slate-900 block">{route.origin_city} ➔ {route.destination_city}</span>
                      <span className="text-xs text-emerald-700 font-bold">{route.estimated_distance_km} KM • {route.estimated_duration}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingRoute(route);
                          setRouteModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="Edit Route"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => triggerDelete('route', route.id, `Delete Route ${route.origin_city} to ${route.destination_city}?`, 'Are you sure you want to remove this route?')}
                        className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition cursor-pointer"
                        title="Delete Route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Pricing Model:</span>
                      <span className="font-black text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {route.pricing_model === 'per_km' ? `Per-KM (@ PKR ${route.per_km_rate}/KM)` : 'Fixed Route Rate'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Economy Car:</span>
                      <span className="font-bold text-slate-900">PKR {route.car_economy_fare}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>AC Comfort Car:</span>
                      <span className="font-bold text-teal-700">PKR {route.car_comfort_fare}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Parcel Cargo:</span>
                      <span className="font-bold text-amber-700">PKR {route.delivery_parcel_fare}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ADS & PROMOTION BANNERS MANAGER */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Ads & Promotion Banners Hub</h3>
                <p className="text-xs text-slate-500">Manage promotional banners displayed on the home page carousel</p>
              </div>

              <button
                onClick={() => {
                  setEditingPromo({
                    title: '',
                    subtitle: '',
                    image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
                    link_url: '/#fares',
                    badge: 'Special Offer',
                    is_active: true,
                  });
                  setPromoModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add New Promo Banner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <div key={promo.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="relative h-44 w-full bg-slate-900">
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase">
                      {promo.badge || 'PROMO'}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 text-white font-bold text-[10px] px-2 py-0.5 rounded backdrop-blur">
                      {promo.is_active ? 'Active' : 'Disabled'}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h4 className="font-black text-slate-900 text-base">{promo.title}</h4>
                    <p className="text-xs text-slate-600">{promo.subtitle}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Link: {promo.link_url}</p>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingPromo(promo);
                        setPromoModalOpen(true);
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Banner</span>
                    </button>

                    <button
                      onClick={() => triggerDelete('promo', promo.id, `Delete Banner: ${promo.title}?`, 'This will remove it from the home page.')}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: ANALYTICS & REPORTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Trips by Service</span>
                <div className="space-y-2 text-xs">
                  {['bike', 'car', 'rickshaw', 'delivery', 'intercity'].map(s => {
                    const count = bookings.filter(b => b.service_type === s).length;
                    return (
                      <div key={s} className="flex justify-between items-center text-slate-700">
                        <span className="capitalize">{s}</span>
                        <span className="font-bold text-slate-900">{count} ({bookings.length > 0 ? Math.round((count/bookings.length)*100) : 0}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Trip Status Distribution</span>
                <div className="space-y-2 text-xs">
                  {['completed', 'pending', 'assigned', 'in_progress', 'cancelled'].map(s => {
                    const count = bookings.filter(b => b.booking_status === s).length;
                    return (
                      <div key={s} className="flex justify-between items-center text-slate-700">
                        <span className="capitalize">{s.replace('_', ' ')}</span>
                        <span className="font-bold text-slate-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Financial Summary</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Booking Value:</span>
                    <span className="font-bold text-slate-900">PKR {totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Platform Commission Rate:</span>
                    <span className="font-bold text-emerald-700">{settings.commission_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Cleared by Drivers:</span>
                    <span className="font-bold text-teal-700">PKR {totalSettledCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                    <span className="font-bold text-emerald-700">Net Platform Profit:</span>
                    <span className="font-black text-emerald-700">PKR {platformCommission.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 max-w-3xl shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Platform Identity & Contact Controls</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company Name (English)</label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Company Name (Urdu)</label>
                <input
                  type="text"
                  value={settings.company_name_urdu}
                  onChange={(e) => setSettings({ ...settings, company_name_urdu: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-urdu"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Helpline Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official WhatsApp Number</label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Platform Commission (%)</label>
                <input
                  type="number"
                  value={settings.commission_percentage}
                  onChange={(e) => setSettings({ ...settings, commission_percentage: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Master Admin PIN</label>
                <input
                  type="text"
                  value={settings.admin_pin}
                  onChange={(e) => setSettings({ ...settings, admin_pin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-sm cursor-pointer"
            >
              Save All Settings
            </button>
          </form>
        )}

      </main>

      {/* DRIVER CASH SETTLEMENT MODAL */}
      {settleModalOpen && selectedCaptainForSettle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900">Record Driver Cash Clearance</h3>
              </div>
              <button onClick={() => setSettleModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
            </div>

            <form onSubmit={handleRecordSettlementSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Captain / Driver</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedCaptainForSettle.full_name} (${selectedCaptainForSettle.vehicle_name})`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Cleared / Paid to Office (PKR)</label>
                <input
                  type="number"
                  required
                  min="10"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full bg-white border border-emerald-500 rounded-xl px-3 py-2 text-slate-900 font-black text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                >
                  <option value="cash">Cash (Hand-to-Hand at Office)</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt Note / Voucher Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared commission for August trips"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-xs"
                >
                  Clear Cash & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERCITY ROUTE MODAL */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900">Configure Intercity Route & Fares</h3>
              <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveRouteSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Origin City</label>
                  <input
                    type="text"
                    required
                    value={editingRoute.origin_city}
                    onChange={(e) => setEditingRoute({ ...editingRoute, origin_city: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gwadar"
                    value={editingRoute.destination_city}
                    onChange={(e) => setEditingRoute({ ...editingRoute, destination_city: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Distance (KM)</label>
                  <input
                    type="number"
                    required
                    value={editingRoute.estimated_distance_km}
                    onChange={(e) => setEditingRoute({ ...editingRoute, estimated_distance_km: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Travel Duration</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2.5 Hours"
                    value={editingRoute.estimated_duration}
                    onChange={(e) => setEditingRoute({ ...editingRoute, estimated_duration: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pricing Model</label>
                  <select
                    value={editingRoute.pricing_model || 'fixed'}
                    onChange={(e) => setEditingRoute({ ...editingRoute, pricing_model: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                  >
                    <option value="fixed">Fixed Flat Rate</option>
                    <option value="per_km">Per-KM Distance Rate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Per-KM Rate (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.per_km_rate || 25}
                    onChange={(e) => setEditingRoute({ ...editingRoute, per_km_rate: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Car Economy (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.car_economy_fare}
                    onChange={(e) => setEditingRoute({ ...editingRoute, car_economy_fare: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">AC Comfort (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.car_comfort_fare}
                    onChange={(e) => setEditingRoute({ ...editingRoute, car_comfort_fare: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parcel (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.delivery_parcel_fare}
                    onChange={(e) => setEditingRoute({ ...editingRoute, delivery_parcel_fare: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTION BANNER MODAL */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900">Manage Promotional Ad Banner</h3>
              <button onClick={() => setPromoModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
            </div>

            <form onSubmit={handleSavePromoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turbat Eid Special 20% Off"
                  value={editingPromo.title}
                  onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Valid on all city car and bike rides"
                  value={editingPromo.subtitle}
                  onChange={(e) => setEditingPromo({ ...editingPromo, subtitle: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={editingPromo.image_url}
                  onChange={(e) => setEditingPromo({ ...editingPromo, image_url: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. 20% OFF"
                    value={editingPromo.badge}
                    onChange={(e) => setEditingPromo({ ...editingPromo, badge: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Action Link</label>
                  <input
                    type="text"
                    value={editingPromo.link_url}
                    onChange={(e) => setEditingPromo({ ...editingPromo, link_url: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active_check"
                  checked={editingPromo.is_active}
                  onChange={(e) => setEditingPromo({ ...editingPromo, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="active_check" className="font-bold text-slate-700">Display this banner on Home Page</label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromoModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CITY LANDMARK / LOCATION MODAL */}
      {landmarkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Add Turbat City Location / Landmark</span>
              </h3>
              <button
                onClick={() => setLandmarkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLandmarkSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Landmark / Place Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turbat Gate Chowk"
                  value={editingLandmark.name}
                  onChange={(e) => setEditingLandmark({ ...editingLandmark, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Name in Urdu (اردو نام)</label>
                <input
                  type="text"
                  placeholder="مثلاً: تربت گیٹ چوک"
                  value={editingLandmark.name_urdu}
                  onChange={(e) => setEditingLandmark({ ...editingLandmark, name_urdu: e.target.value, nameUrdu: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-urdu text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City Zone / Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Absar Road, Main Bazaar, Ginna"
                  value={editingLandmark.area}
                  onChange={(e) => setEditingLandmark({ ...editingLandmark, area: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GPS Latitude (North)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="26.0031"
                    value={editingLandmark.lat}
                    onChange={(e) => setEditingLandmark({ ...editingLandmark, lat: parseFloat(e.target.value) || 26.0031 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Turbat bounds ~25.98 to 26.04</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GPS Longitude (East)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="63.0544"
                    value={editingLandmark.lng}
                    onChange={(e) => setEditingLandmark({ ...editingLandmark, lng: parseFloat(e.target.value) || 63.0544 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Turbat bounds ~63.02 to 63.12</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setLandmarkModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Save Landmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETIONS */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">{deleteModal.title}</h3>
              <p className="text-xs text-slate-500">{deleteModal.subtitle}</p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-700 text-center font-semibold">
              ⚠️ This action cannot be undone.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
              >
                Cancel / No
              </button>

              <button
                type="button"
                onClick={confirmExecuteDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
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
          <div className="bg-white rounded-3xl p-4 max-w-xl w-full space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Document Verification Preview</span>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                ✕
              </button>
            </div>
            <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-slate-100">
              <img src={previewDocUrl} alt="Document" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => setPreviewDocUrl(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
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
