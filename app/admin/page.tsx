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
  resetIntercityRoutesToDefaults,
  getCaptains, 
  updateCaptainStatus, 
  deleteCaptain,
  getBookings, 
  updateBookingStatus, 
  deleteBooking,
  getCustomers,
  deleteCustomer,
  toggleCustomerStatus,
  getPromotions,
  savePromotion,
  deletePromotion,
  getDriverPromoCards,
  saveDriverPromoCard,
  deleteDriverPromoCard,
  getDriverSettlements,
  recordDriverSettlement,
  deleteDriverSettlement,
  getCaptainFinancialSummary,
  getCityLandmarks,
  saveCityLandmark,
  deleteCityLandmark,
  calculateRealtimeDistance,
  calculateTripFare,
  fileToBase64,
  uploadFileToStorage,
  getTodayActivityAlerts,
  getDetailedAnalytics
} from '@/lib/db';
import { supabase } from '@/lib/supabase';
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
  CityLandmark,
  DriverPromoCard,
  ActivityAlert,
  AdvancedAnalyticsSummary
} from '@/lib/types';
import { 
  INITIAL_SITE_SETTINGS, 
  INITIAL_PRICING_RATES, 
  INITIAL_INTERCITY_ROUTES,
  INITIAL_PROMOTIONS,
  TURBAT_LANDMARKS,
  INITIAL_DRIVER_PROMOS
} from '@/lib/constants';
import { PrintableReceipt } from '@/components/PrintableReceipt';
import { AnalyticsReportModal } from '@/components/AnalyticsReportModal';
import { Toast, ToastMessage } from '@/components/Toast';
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
  Receipt, 
  UploadCloud, 
  Check, 
  RotateCcw, 
  Ban, 
  Layers,
  Bell,
  BellRing,
  Calendar,
  BarChart3,
  PieChart,
  Award,
  FileText,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface DeleteModalState {
  isOpen: boolean;
  type: 'booking' | 'captain' | 'customer' | 'route' | 'promo' | 'driver_promo' | 'settlement' | 'landmark';
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
    'alerts' | 'bookings' | 'captains' | 'settlements' | 'customers' | 'pricing' | 'intercity' | 'promotions' | 'analytics' | 'settings'
  >('bookings');

  // Live Alerts Filters
  const [alertCategory, setAlertCategory] = useState<'all' | 'booking' | 'captain' | 'customer' | 'financial'>('all');
  const [alertSearch, setAlertSearch] = useState('');

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
    image_url: '',
    link_url: '/#fares',
    badge: 'Special Deal',
    is_active: true,
  });

  // Home Driver Recruitment Promos State
  const [driverPromos, setDriverPromos] = useState<DriverPromoCard[]>(INITIAL_DRIVER_PROMOS);
  const [promoSubTab, setPromoSubTab] = useState<'carousel' | 'driver_cards'>('carousel');
  const [driverPromoModalOpen, setDriverPromoModalOpen] = useState(false);
  const [editingDriverPromo, setEditingDriverPromo] = useState<Partial<DriverPromoCard>>({
    category_badge: 'Motorcycle 70cc / 125cc',
    title: '',
    title_urdu: '',
    image_url: '',
    bullets: ['', '', ''],
    cta_text: 'Register Now',
    cta_link: '/captain/',
    is_active: true,
  });

  // UI Toast State (Replaces native browser alerts)
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    setToast({ message, type, title });
  };

  // Advanced Analytics & Financials State
  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>(getThirtyDaysAgo);
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>(getTodayStr);
  const [analyticsPreset, setAnalyticsPreset] = useState<'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'all'>('30days');
  const [isAnalyticsReportOpen, setIsAnalyticsReportOpen] = useState(false);

  const applyAnalyticsPreset = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'all') => {
    setAnalyticsPreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setAnalyticsStartDate(todayStr);
      setAnalyticsEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setAnalyticsStartDate(yStr);
      setAnalyticsEndDate(yStr);
    } else if (preset === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      setAnalyticsStartDate(d7.toISOString().split('T')[0]);
      setAnalyticsEndDate(todayStr);
    } else if (preset === '30days') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      setAnalyticsStartDate(d30.toISOString().split('T')[0]);
      setAnalyticsEndDate(todayStr);
    } else if (preset === 'this_month') {
      const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
      setAnalyticsStartDate(mStart.toISOString().split('T')[0]);
      setAnalyticsEndDate(todayStr);
    } else if (preset === 'all') {
      setAnalyticsStartDate('2025-01-01');
      setAnalyticsEndDate(todayStr);
    }
  };

  const detailedAnalytics = React.useMemo(() => {
    return getDetailedAnalytics(
      bookings,
      captains,
      customers,
      settlements,
      settings.commission_percentage,
      analyticsStartDate,
      analyticsEndDate
    );
  }, [bookings, captains, customers, settlements, settings.commission_percentage, analyticsStartDate, analyticsEndDate]);

  // Google Maps URL Auto-Extractor for Landmarks
  const [mapsUrlInput, setMapsUrlInput] = useState('');
  const [detectedMapsInfo, setDetectedMapsInfo] = useState<{ lat: number; lng: number; placeName?: string } | null>(null);

  const parseGoogleMapsUrl = (input: string) => {
    const text = input.trim();
    if (!text) return null;

    let lat: number | null = null;
    let lng: number | null = null;
    let placeName: string | null = null;

    // 1. Extract place name from /place/PLACE_NAME/
    const placeMatch = text.match(/\/place\/([^/@?]+)/i);
    if (placeMatch && placeMatch[1]) {
      try {
        placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
      } catch {
        placeName = placeMatch[1].replace(/\+/g, ' ').trim();
      }
    }

    // 2. Exact place coordinates in data parameter: !3dLAT!4dLNG
    const pinpointMatch = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinpointMatch) {
      lat = parseFloat(pinpointMatch[1]);
      lng = parseFloat(pinpointMatch[2]);
    }

    // 3. Center map coordinates: @LAT,LNG
    if (lat === null || isNaN(lat)) {
      const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
      }
    }

    // 4. Query coordinates: ?q=LAT,LNG or ll=LAT,LNG
    if (lat === null || isNaN(lat)) {
      const queryMatch = text.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (queryMatch) {
        lat = parseFloat(queryMatch[1]);
        lng = parseFloat(queryMatch[2]);
      }
    }

    // 5. Raw comma-separated coordinates: LAT, LNG
    if (lat === null || isNaN(lat)) {
      const rawMatch = text.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
      if (rawMatch) {
        lat = parseFloat(rawMatch[1]);
        lng = parseFloat(rawMatch[2]);
      }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, placeName: placeName || undefined };
    }
    return null;
  };

  const handleMapsUrlChange = (value: string) => {
    setMapsUrlInput(value);
    const parsed = parseGoogleMapsUrl(value);
    if (parsed) {
      setDetectedMapsInfo(parsed);
      setEditingLandmark(prev => ({
        ...prev,
        lat: parsed.lat,
        lng: parsed.lng,
        name: prev.name && prev.name.trim() !== '' ? prev.name : (parsed.placeName || prev.name),
      }));
      showToast(`Detected: Lat ${parsed.lat.toFixed(4)}, Lng ${parsed.lng.toFixed(4)}`, 'success', 'Google Maps Auto-Detected');
    } else {
      setDetectedMapsInfo(null);
    }
  };

  // Load All Data
  const loadData = async () => {
    try {
      const [st, bk, cp, cust, pr, ir, prm, stl, lm, dp] = await Promise.all([
        getSiteSettings(),
        getBookings(),
        getCaptains(),
        getCustomers(),
        getPricingRates(),
        getIntercityRoutes(),
        getPromotions(),
        getDriverSettlements(),
        getCityLandmarks(),
        getDriverPromoCards(),
      ]);
      setSettings(st);
      setBookings(bk);
      setCaptains(cp);
      setCustomers(cust);
      setPricingRates(pr);
      if (ir && ir.length > 0) {
        setIntercityRoutes(ir);
      } else {
        setIntercityRoutes(INITIAL_INTERCITY_ROUTES);
      }
      setPromotions(prm);
      setSettlements(stl);
      if (lm && lm.length > 0) {
        setLandmarks(lm);
      } else {
        setLandmarks(TURBAT_LANDMARKS);
      }
      if (dp && dp.length > 0) {
        setDriverPromos(dp);
      } else {
        setDriverPromos(INITIAL_DRIVER_PROMOS);
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

    // 0ms Supabase Real-Time Broadcast
    const channel = supabase
      .channel('admin-portal-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => {
        handleUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        handleUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_settlements' }, () => {
        handleUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        handleUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_promos' }, () => {
        handleUpdate();
      })
      .subscribe();

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
      supabase.removeChannel(channel);
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
    showToast(`Saved ${rate.service_name} rates successfully!`, 'success', 'Pricing Updated');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await saveSiteSettings(settings);
      setSettings(saved);
      await loadData();
      showToast('Platform settings and identity updated successfully!', 'success', 'System Settings Saved');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings.', 'error', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = (bk: Booking) => {
    setSelectedBookingForPrint(bk);
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
    setSettleMethod('cash');
    setSettleNotes('');
    setSettleModalOpen(true);
  };

  const handleRecordSettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptainForSettle || settleAmount <= 0) {
      showToast('Please enter a valid payment amount.', 'error', 'Invalid Amount');
      return;
    }

    setIsSaving(true);
    await recordDriverSettlement({
      captain_id: selectedCaptainForSettle.id,
      captain_name: selectedCaptainForSettle.full_name,
      amount: Number(settleAmount),
      payment_method: settleMethod,
      notes: settleNotes,
    });
    setIsSaving(false);
    setSettleModalOpen(false);
    await loadData();
    showToast(`Cleared PKR ${Number(settleAmount).toLocaleString()} for ${selectedCaptainForSettle.full_name}!`, 'success', 'Payment Recorded');
  };

  // Intercity Route Handlers
  const handleSaveRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute.origin_city || !editingRoute.destination_city) {
      showToast('Please provide Origin and Destination cities.', 'error', 'Missing Information');
      return;
    }
    setIsSaving(true);
    await saveIntercityRoute(editingRoute);
    setIsSaving(false);
    setRouteModalOpen(false);
    await loadData();
    showToast(`Highway route ${editingRoute.origin_city} ➔ ${editingRoute.destination_city} saved successfully!`, 'success', 'Route Configured');
  };

  // Promotion Handlers
  const handleSavePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo.title || !editingPromo.image_url) {
      showToast('Please provide a banner title and upload an image.', 'error', 'Image Required');
      return;
    }
    setIsSaving(true);
    try {
      await savePromotion(editingPromo);
      setPromoModalOpen(false);
      await loadData();
      showToast('Promotional banner saved and published successfully!', 'success', 'Promotion Saved');
    } catch (err) {
      console.error(err);
      showToast('Failed to save promotional banner.', 'error', 'Save Error');
    } finally {
      setIsSaving(false);
    }
  };

  // Home Driver Recruitment Promo Handlers
  const handleSaveDriverPromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriverPromo.title || !editingDriverPromo.image_url) {
      showToast('Please provide a title and upload an image.', 'error', 'Missing Information');
      return;
    }
    setIsSaving(true);
    try {
      await saveDriverPromoCard(editingDriverPromo);
      setDriverPromoModalOpen(false);
      await loadData();
      showToast('Driver recruitment card saved and updated on home page!', 'success', 'Banner Saved');
    } catch (err) {
      console.error(err);
      showToast('Failed to save driver promo card.', 'error', 'Save Error');
    } finally {
      setIsSaving(false);
    }
  };

  // City Landmark Handlers
  const handleSaveLandmarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLandmark.name) {
      showToast('Please provide a landmark name.', 'error', 'Name Required');
      return;
    }
    setIsSaving(true);
    await saveCityLandmark(editingLandmark);
    setIsSaving(false);
    setLandmarkModalOpen(false);
    await loadData();
    showToast(`City location "${editingLandmark.name}" saved with GPS coordinates!`, 'success', 'Landmark Added');
  };

  // Prompt and Execute Deletions
  const triggerDelete = (
    type: 'booking' | 'captain' | 'customer' | 'route' | 'promo' | 'driver_promo' | 'settlement' | 'landmark', 
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
      } else if (deleteModal.type === 'driver_promo') {
        await deleteDriverPromoCard(deleteModal.id);
      } else if (deleteModal.type === 'settlement') {
        await deleteDriverSettlement(deleteModal.id);
      } else if (deleteModal.type === 'landmark') {
        await deleteCityLandmark(deleteModal.id);
      }
      await loadData();
      showToast(`${deleteModal.title} removed successfully.`, 'info', 'Deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Failed to delete item.', 'error');
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

  // Today's Live Alerts Feed Calculation
  const todayAlerts = getTodayActivityAlerts({
    bookings,
    captains,
    customers,
    settlements,
  });

  const filteredAlerts = todayAlerts.filter(a => {
    const matchesCategory = alertCategory === 'all' || a.category === alertCategory;
    const q = alertSearch.trim().toLowerCase();
    const matchesSearch = !q || 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      (a.metadata?.code && a.metadata.code.toLowerCase().includes(q)) ||
      (a.metadata?.customerName && a.metadata.customerName.toLowerCase().includes(q)) ||
      (a.metadata?.customerPhone && a.metadata.customerPhone.includes(q)) ||
      (a.metadata?.captainName && a.metadata.captainName.toLowerCase().includes(q)) ||
      (a.metadata?.captainPhone && a.metadata.captainPhone.includes(q));
    return matchesCategory && matchesSearch;
  });

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
          <div className="flex flex-col items-center gap-3">
            <OlakLogo size="lg" />
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200">
              <Lock className="w-6 h-6" />
            </div>
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
            <OlakLogo size="sm" />
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
            { id: 'alerts', label: "Live Alerts", icon: Bell, badge: todayAlerts.length, isAlert: true },
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
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSel ? 'bg-white text-emerald-700' : (tab as any).isAlert ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 0: LIVE ALERTS & TODAY'S ACTIVITY FEED */}
        {activeTab === 'alerts' && (
          <div className="space-y-5">
            {/* Top Hub Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                      Supabase 0ms Live Feed
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    Today's Live Operations Feed
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Real-time activity logs for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} across all Turbat city zones.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={loadData}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Sync Live Activity</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-800 mt-5">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-emerald-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-300">Total Alerts</span>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">{todayAlerts.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Recorded today</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-teal-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-300">Rides & Orders</span>
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {todayAlerts.filter(a => a.category === 'booking').length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">City & Intercity</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-blue-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-300">Driver Actions</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {todayAlerts.filter(a => a.category === 'captain').length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Signups & Statuses</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-purple-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-300">Customer Logins</span>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {todayAlerts.filter(a => a.category === 'customer').length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">New signups & accounts</div>
                </div>
              </div>
            </div>

            {/* Filter Chips & Realtime Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All Alerts', count: todayAlerts.length },
                  { id: 'booking', label: 'Bookings & Trips', count: todayAlerts.filter(a => a.category === 'booking').length },
                  { id: 'captain', label: 'Captains & Drivers', count: todayAlerts.filter(a => a.category === 'captain').length },
                  { id: 'customer', label: 'Customers', count: todayAlerts.filter(a => a.category === 'customer').length },
                  { id: 'financial', label: 'Cash Settlements', count: todayAlerts.filter(a => a.category === 'financial').length },
                ].map((chip) => {
                  const isSelected = alertCategory === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setAlertCategory(chip.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  placeholder="Search alert by token, name, phone..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9.5 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Alerts Feed Cards */}
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-xs">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {alertSearch ? 'No alerts matching your search' : 'No activity alerts recorded today yet'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      {alertSearch 
                        ? 'Try searching with another passenger name, driver name, or token.' 
                        : 'Any new ride booking, driver registration, customer signup, or cash clearance happening today will automatically appear here in real time.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  return (
                    <div
                      key={alert.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          alert.category === 'booking' ? 'bg-emerald-100 text-emerald-700' :
                          alert.category === 'captain' ? 'bg-blue-100 text-blue-700' :
                          alert.category === 'customer' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {alert.category === 'booking' && <Car className="w-5 h-5" />}
                          {alert.category === 'captain' && <Users className="w-5 h-5" />}
                          {alert.category === 'customer' && <UserCheck className="w-5 h-5" />}
                          {alert.category === 'financial' && <Banknote className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              {alert.title}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              alert.statusBadge.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              alert.statusBadge.color === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              alert.statusBadge.color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              alert.statusBadge.color === 'rose' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {alert.statusBadge.text}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {alert.subtitle}
                          </p>

                          {/* Metadata Tags */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                            {alert.metadata?.code && (
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                {alert.metadata.code}
                              </span>
                            )}
                            {alert.metadata?.fare && (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                PKR {alert.metadata.fare}
                              </span>
                            )}
                            {alert.metadata?.customerPhone && (
                              <a href={`tel:${alert.metadata.customerPhone}`} className="hover:text-emerald-600 flex items-center gap-1 font-semibold">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{alert.metadata.customerPhone}</span>
                              </a>
                            )}
                            {alert.metadata?.captainPhone && (
                              <a href={`tel:${alert.metadata.captainPhone}`} className="hover:text-blue-600 flex items-center gap-1 font-semibold">
                                <Phone className="w-3 h-3 text-blue-600" />
                                <span>{alert.metadata.captainPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action & Timestamp */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{alert.timeFormatted}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {alert.category === 'booking' && alert.metadata?.code && (
                            <button
                              onClick={() => {
                                setBookingFilter('all');
                                setSearchQuery(alert.metadata!.code!);
                                setActiveTab('bookings');
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer"
                            >
                              Inspect Booking →
                            </button>
                          )}
                          {alert.category === 'captain' && (
                            <button
                              onClick={() => setActiveTab('captains')}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer"
                            >
                              Inspect Driver →
                            </button>
                          )}
                          {alert.category === 'customer' && (
                            <button
                              onClick={() => setActiveTab('customers')}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-purple-200 transition cursor-pointer"
                            >
                              View Customer →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

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

                    {/* Documents Preview Thumbnails Gallery */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Driver Documents & Verification Photos:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {/* Driver Photo */}
                        <div className="space-y-1">
                          {cap.profile_photo_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocUrl(cap.profile_photo_url!)}
                              className="w-full h-16 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition relative group cursor-pointer bg-slate-100 block"
                              title="Click to view Driver Photo"
                            >
                              <img src={cap.profile_photo_url} alt="Driver Profile" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-full h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-semibold text-center px-1">
                              No Photo
                            </div>
                          )}
                          <span className="text-[9px] font-bold text-slate-600 block text-center truncate">Driver Photo</span>
                        </div>

                        {/* CNIC Front */}
                        <div className="space-y-1">
                          {cap.cnic_front_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocUrl(cap.cnic_front_url!)}
                              className="w-full h-16 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition relative group cursor-pointer bg-slate-100 block"
                              title="Click to view CNIC"
                            >
                              <img src={cap.cnic_front_url} alt="CNIC Front" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-full h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-semibold">
                              No CNIC
                            </div>
                          )}
                          <span className="text-[9px] font-bold text-slate-600 block text-center truncate">CNIC</span>
                        </div>

                        {/* License */}
                        <div className="space-y-1">
                          {cap.license_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocUrl(cap.license_url!)}
                              className="w-full h-16 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition relative group cursor-pointer bg-slate-100 block"
                              title="Click to view License"
                            >
                              <img src={cap.license_url} alt="License" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-full h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-semibold">
                              No License
                            </div>
                          )}
                          <span className="text-[9px] font-bold text-slate-600 block text-center truncate">License</span>
                        </div>

                        {/* Vehicle Photo */}
                        <div className="space-y-1">
                          {cap.vehicle_photo_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocUrl(cap.vehicle_photo_url!)}
                              className="w-full h-16 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition relative group cursor-pointer bg-slate-100 block"
                              title="Click to view Vehicle Photo"
                            >
                              <img src={cap.vehicle_photo_url} alt="Vehicle" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-full h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-semibold">
                              No Vehicle
                            </div>
                          )}
                          <span className="text-[9px] font-bold text-slate-600 block text-center truncate">Vehicle</span>
                        </div>
                      </div>
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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">Total: <strong>{customers.length}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-emerald-700 font-bold">Active: {customers.filter(c => c.status !== 'suspended' && !c.is_blocked).length}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-red-600 font-bold">Suspended: {customers.filter(c => c.status === 'suspended' || c.is_blocked).length}</span>
                </div>
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
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCustomers.map((c) => {
                    const isSuspended = c.status === 'suspended' || c.is_blocked;
                    return (
                      <tr key={c.id} className={isSuspended ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500 transition' : 'hover:bg-slate-50 transition'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {isSuspended ? <Ban className="w-3.5 h-3.5" /> : c.full_name.charAt(0)}
                            </div>
                            <div>
                              <span className={`font-bold text-slate-900 block ${isSuspended ? 'line-through text-slate-500' : ''}`}>{c.full_name}</span>
                              {isSuspended && (
                                <span className="text-[10px] font-black text-red-600 block">Booking Blocked</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">{c.phone}</td>
                        <td className="px-4 py-3 text-slate-500">{c.email}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-800 border border-red-200 shadow-xs animate-pulse">
                              <Ban className="w-3.5 h-3.5 text-red-600" />
                              <span>Suspended / Blocked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {isSuspended ? (
                            <button
                              onClick={async () => {
                                await toggleCustomerStatus(c.id, 'active');
                                await loadData();
                                showToast(`Customer ${c.full_name} is now unblocked and active.`, 'success', 'Account Activated');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition text-xs font-black cursor-pointer transform active:scale-95"
                              title="Unblock / Reactivate Customer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Unblock / Activate</span>
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                await toggleCustomerStatus(c.id, 'suspended');
                                await loadData();
                                showToast(`Customer ${c.full_name} has been suspended. Booking blocked.`, 'error', 'Customer Suspended');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-red-600 text-amber-800 hover:text-white rounded-xl border border-amber-300 hover:border-red-600 transition text-xs font-black cursor-pointer shadow-xs"
                              title="Suspend or Temporary Block Rude Customer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspend / Block</span>
                            </button>
                          )}

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
                              `Are you sure you want to permanently delete customer ${c.full_name}?`
                            )}
                            className="inline-flex p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                    setMapsUrlInput('');
                    setDetectedMapsInfo(null);
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

        {/* TAB 6: INTERCITY ROUTES & REAL-TIME DISPATCH */}
        {activeTab === 'intercity' && (() => {
          const intercityBookings = bookings.filter(b => 
            b.service_type === 'intercity' || 
            Boolean(b.intercity_origin || b.intercity_destination)
          );
          const totalIntercityFare = intercityBookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare || 0), 0);
          const displayRoutes = intercityRoutes && intercityRoutes.length > 0 ? intercityRoutes : INITIAL_INTERCITY_ROUTES;

          return (
            <div className="space-y-6">
              {/* Header & Action Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Intercity Highway Routes & Real-Time Booking Manager</h3>
                  <span className="text-xs text-slate-500">Configure Fixed vs Per-KM rates and monitor live intercity passenger & parcel bookings</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={async () => {
                      const restored = await resetIntercityRoutesToDefaults();
                      setIntercityRoutes(restored);
                      showToast('All 11 Baluchistan highway routes restored successfully!', 'success', 'Routes Reset');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                    title="Reload Gwadar, Pasni, Karachi, Quetta, Panjgur, etc."
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reset 11 Baluchistan Routes</span>
                  </button>

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
              </div>

              {/* Intercity Real-Time Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Highway Destinations</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">{displayRoutes.length}</span>
                    <span className="text-xs font-bold text-emerald-600">Active Routes</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Gwadar, Pasni, Karachi, Quetta, Panjgur...</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Live Intercity Bookings</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-emerald-700">{intercityBookings.length}</span>
                    <span className="text-xs font-bold text-slate-500">
                      ({intercityBookings.filter(b => b.booking_status === 'pending').length} Pending)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Real-time rider and cargo requests</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Intercity Gross Volume</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xs font-bold text-slate-500">PKR</span>
                    <span className="text-2xl font-black text-slate-900">{totalIntercityFare}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Total intercity revenue</span>
                </div>
              </div>
              
              {/* Active Highway Routes Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>Configured Highway Routes & Pricing ({displayRoutes.length})</span>
                  </h4>
                  <span className="text-xs text-slate-500">Click edit to change fares or toggle Fixed vs Per-KM</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayRoutes.map((route) => (
                    <div key={route.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:border-emerald-300 transition">
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

              {/* REAL-TIME INTERCITY BOOKINGS & DISPATCH DESK */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-emerald-600" />
                      <span>Real-Time Intercity Passenger & Cargo Dispatch Desk</span>
                    </h4>
                    <span className="text-xs text-slate-500">Live booking requests submitted by riders & parcel senders</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {intercityBookings.length} Live Bookings
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {intercityBookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Token & Date</th>
                            <th className="px-4 py-3">Customer Contact</th>
                            <th className="px-4 py-3">Route (Origin ➔ Destination)</th>
                            <th className="px-4 py-3">Seats / Details</th>
                            <th className="px-4 py-3">Fare</th>
                            <th className="px-4 py-3">Assigned Captain</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions & Dispatch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {intercityBookings.map((b) => {
                            const assignedCap = captains.find(c => c.id === b.assigned_captain_id);
                            return (
                              <tr key={b.id} className="hover:bg-slate-50 transition">
                                <td className="px-4 py-3">
                                  <span className="font-mono font-bold text-slate-900 block">{b.booking_code}</span>
                                  <span className="text-[10px] text-slate-500 block">
                                    Date: {b.intercity_travel_date || new Date(b.created_at).toLocaleDateString()}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <span className="font-bold text-slate-900 block">{b.customer_name}</span>
                                  <a href={`tel:${b.customer_phone}`} className="text-emerald-700 hover:underline flex items-center gap-1 font-mono text-[11px]">
                                    <Phone className="w-3 h-3" />
                                    <span>{b.customer_phone}</span>
                                  </a>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-900 block">{b.pickup_location}</span>
                                    <span className="text-slate-400 text-[10px]">➔ {b.dropoff_location}</span>
                                    {b.estimated_distance_km && (
                                      <span className="text-[10px] text-emerald-700 font-bold block">{b.estimated_distance_km} KM</span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <span className="font-bold text-slate-800 block">
                                    {b.intercity_seats ? `${b.intercity_seats} Seat(s)` : 'Standard'}
                                  </span>
                                  {b.notes && (
                                    <span className="text-[10px] text-slate-500 block max-w-xs truncate">{b.notes}</span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  <span className="font-black text-slate-900 text-sm block">PKR {b.final_fare || b.estimated_fare}</span>
                                  <span className="text-[10px] uppercase font-bold text-slate-400">{b.payment_method}</span>
                                </td>

                                <td className="px-4 py-3">
                                  {assignedCap ? (
                                    <div>
                                      <span className="font-bold text-emerald-800 block">{assignedCap.full_name}</span>
                                      <span className="text-[10px] text-slate-500 block">{assignedCap.vehicle_name} ({assignedCap.vehicle_number_plate})</span>
                                    </div>
                                  ) : (
                                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-bold">
                                      Unassigned
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  <select
                                    value={b.booking_status}
                                    onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as BookingStatus)}
                                    className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                      b.booking_status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      b.booking_status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      b.booking_status === 'in_progress' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      b.booking_status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>

                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <a
                                      href={getPassengerWhatsAppLink(b, assignedCap)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-200 transition cursor-pointer"
                                      title="WhatsApp Passenger"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>

                                    <button
                                      onClick={() => handlePrint(b)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                                      title="Print Receipt"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => triggerDelete('booking', b.id, `Delete Intercity Booking #${b.booking_code}?`, `Customer: ${b.customer_name} (${b.pickup_location} ➔ ${b.dropoff_location})`)}
                                      className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition cursor-pointer"
                                      title="Delete Booking"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 space-y-1">
                      <Car className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <span className="font-bold text-slate-600 block text-xs">No Intercity Bookings Placed Yet</span>
                      <span className="text-[11px] text-slate-400 block">When customers book a passenger seat or cargo parcel on the Intercity page, it will immediately show here in real-time.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })()}

        {/* TAB 7: ADS & PROMOTION BANNERS MANAGER */}
        {/* TAB 7: ADS & PROMOTION BANNERS MANAGER */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Ads & Promotion Banners Hub</h3>
                <p className="text-xs text-slate-500">Manage promotional hero banners & home page driver recruitment cards</p>
              </div>

              {promoSubTab === 'carousel' ? (
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
                  <span>+ Add New Hero Banner</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingDriverPromo({
                      category_badge: 'Motorcycle / Car / Bolan',
                      title: 'Register Driver Account',
                      title_urdu: 'اپنی سواری رجسٹر کروائیں',
                      image_url: '/assets/bike-poster.jpg',
                      bullets: [
                        'Daily Cash Earnings on Every Trip',
                        'Only 10% Platform Fee — Keep 90%',
                        'Flexible Hours — Work When You Want'
                      ],
                      cta_text: 'Register Captain',
                      cta_link: '/captain/',
                      is_active: true,
                    });
                    setDriverPromoModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Driver Recruitment Banner</span>
                </button>
              )}
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setPromoSubTab('carousel')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  promoSubTab === 'carousel' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Top Hero Carousel Banners ({promotions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPromoSubTab('driver_cards')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  promoSubTab === 'driver_cards' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Home Driver Cards ("Register Your Bike or Car") ({driverPromos.length})</span>
              </button>
            </div>

            {/* Sub-Tab 1: Carousel Hero Banners */}
            {promoSubTab === 'carousel' && (
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
                        className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
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
            )}

            {/* Sub-Tab 2: Driver Recruitment Promos */}
            {promoSubTab === 'driver_cards' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Live Home Page Driver Recruitment Section</span>
                    <span>These cards appear under the "Register Your Bike or Car With OLAK" section on the home page. You can edit images, badges, bullet descriptions, and registration CTA links, or delete and add new vehicle categories at any time.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {driverPromos.map((card) => (
                    <div key={card.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                      <div className="relative h-48 w-full bg-slate-900">
                        <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase">
                          {card.category_badge || 'Driver'}
                        </div>
                        <div className="absolute top-3 right-3 bg-black/60 text-white font-bold text-[10px] px-2 py-0.5 rounded backdrop-blur">
                          {card.is_active ? 'Active' : 'Disabled'}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <h4 className="font-black text-slate-900 text-base">{card.title}</h4>
                          {card.title_urdu && (
                            <p className="text-sm font-bold text-emerald-700 font-urdu mt-0.5">{card.title_urdu}</p>
                          )}
                        </div>

                        {card.bullets && card.bullets.length > 0 && (
                          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                            {card.bullets.map((b, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 flex justify-between items-center">
                          <span>CTA Button: <strong className="text-slate-800">{card.cta_text}</strong></span>
                          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">{card.cta_link}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setEditingDriverPromo(card);
                            setDriverPromoModalOpen(true);
                          }}
                          className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Card</span>
                        </button>

                        <button
                          onClick={() => triggerDelete('driver_promo', card.id, `Delete Driver Card: ${card.title}?`, 'This will remove this banner card from the home page.')}
                          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Card</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 8: ADVANCED ANALYTICS & FINANCIAL AUDIT HUB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">

            {/* Header & Date Range Selector Control Bar */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      <span>Advanced Analytics & Financials Intelligence</span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Live real-time operational auditing across all ride bookings, driver earnings, and revenue streams.
                  </p>
                </div>

                {/* 1-Click Executive PDF Report Button */}
                <button
                  onClick={() => setIsAnalyticsReportOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 sm:px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition cursor-pointer shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Executive PDF Report</span>
                </button>
              </div>

              {/* Date Range Selection Controls */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Custom Date Pickers */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">From:</span>
                    <input
                      type="date"
                      value={analyticsStartDate}
                      onChange={(e) => {
                        setAnalyticsStartDate(e.target.value);
                        setAnalyticsPreset('all');
                      }}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none shadow-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <span className="font-bold">To:</span>
                    <input
                      type="date"
                      value={analyticsEndDate}
                      onChange={(e) => {
                        setAnalyticsEndDate(e.target.value);
                        setAnalyticsPreset('all');
                      }}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'yesterday', label: 'Yesterday' },
                    { key: '7days', label: 'Last 7 Days' },
                    { key: '30days', label: 'Last 30 Days' },
                    { key: 'this_month', label: 'This Month' },
                    { key: 'all', label: 'All Time' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => applyAnalyticsPreset(p.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        analyticsPreset === p.key
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

              </div>

              {/* Active Period Summary Badge */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Audited Range: <strong className="text-slate-800">{detailedAnalytics.dateRange.label}</strong> ({detailedAnalytics.dateRange.daysCount} days)</span>
                </span>
                <span>
                  Showing <strong>{detailedAnalytics.trips.total}</strong> total operations recorded
                </span>
              </div>

            </div>

            {/* 6 Executive KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* 1. Gross Volume */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Gross Ride Volume (GMV)</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950">
                  PKR {detailedAnalytics.financials.grossVolume.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Average Fare / Trip:</span>
                  <strong className="text-slate-800">PKR {detailedAnalytics.financials.averageOrderValue}</strong>
                </div>
              </div>

              {/* 2. Platform Commission */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Platform Profit / Fee</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  PKR {detailedAnalytics.financials.platformCommission.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Commission Rate:</span>
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                    {detailedAnalytics.financials.commissionRate}% platform share
                  </span>
                </div>
              </div>

              {/* 3. Driver Earnings */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Driver Take-Home Pay</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-900">
                  PKR {detailedAnalytics.financials.driverEarnings.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Distributed to:</span>
                  <strong className="text-slate-800">{captains.length} registered captains</strong>
                </div>
              </div>

              {/* 4. Cash Clearance */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Settled vs Pending Cash</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-950">
                  PKR {detailedAnalytics.financials.clearedCash.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Pending Driver Balance:</span>
                  <strong className="text-red-600">PKR {detailedAnalytics.financials.pendingClearance.toLocaleString()}</strong>
                </div>
              </div>

              {/* 5. Trip Volume & Conversion */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Trip Conversion Success</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-800">
                  {detailedAnalytics.trips.completionRate}%
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Completed Trips:</span>
                  <strong className="text-slate-800">{detailedAnalytics.trips.completed} of {detailedAnalytics.trips.total}</strong>
                </div>
              </div>

              {/* 6. Active Customers & Signups */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Active Riders & Growth</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {detailedAnalytics.users.activeBookingCustomers}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>New Signups in Range:</span>
                  <strong className="text-emerald-700">+{detailedAnalytics.users.newCustomersInRange} passengers</strong>
                </div>
              </div>

            </div>

            {/* Service Category Performance & Funnel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Service Category Performance Matrix */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-black text-slate-900">Service Category Matrix</h4>
                  </div>
                  <span className="text-xs text-slate-500">Revenue & Volume</span>
                </div>

                <div className="space-y-3">
                  {detailedAnalytics.services.map((s) => (
                    <div key={s.service} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">{s.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{s.trips} trips ({s.percentage}%)</span>
                          <strong className="text-slate-900">PKR {s.revenue.toLocaleString()}</strong>
                        </div>
                      </div>
                      {/* Visual Progress Bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${s.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operations & Trip Funnel Status */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <h4 className="text-sm font-black text-slate-900">Trip Funnel & Fleet Operations</h4>
                  </div>
                  <span className="text-xs text-slate-500">Status Distribution</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Completed */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-emerald-800">Completed Trips</span>
                      <strong className="text-emerald-700">{detailedAnalytics.trips.completed} ({detailedAnalytics.trips.completionRate}%)</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${detailedAnalytics.trips.completionRate}%` }}></div>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-blue-800">In Progress / Dispatched</span>
                      <strong className="text-blue-700">{detailedAnalytics.trips.inProgress}</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${detailedAnalytics.trips.total > 0 ? (detailedAnalytics.trips.inProgress / detailedAnalytics.trips.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  {/* Pending */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-amber-800">Pending Assignment</span>
                      <strong className="text-amber-700">{detailedAnalytics.trips.pending}</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${detailedAnalytics.trips.total > 0 ? (detailedAnalytics.trips.pending / detailedAnalytics.trips.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  {/* Cancelled */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-rose-800">Cancelled Trips</span>
                      <strong className="text-rose-700">{detailedAnalytics.trips.cancelled} ({detailedAnalytics.trips.cancellationRate}%)</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${detailedAnalytics.trips.cancellationRate}%` }}></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                    <span>Total Estimated Distance:</span>
                    <strong className="text-slate-900">~{detailedAnalytics.trips.totalDistanceKm} KM (Avg ~{detailedAnalytics.trips.avgDistanceKm} KM/ride)</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Top Captains Leaderboard & Top Customers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top Captains Leaderboard */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-black text-slate-900">Top Captains Leaderboard</h4>
                  </div>
                  <span className="text-xs text-slate-500">By Completed Trips</span>
                </div>

                {detailedAnalytics.topCaptains.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No completed trips recorded in this date range.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {detailedAnalytics.topCaptains.slice(0, 5).map((cap, idx) => (
                      <div key={cap.id || idx} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                            idx === 0 ? 'bg-amber-400 text-slate-950 font-bold' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{cap.name}</span>
                            <span className="text-[11px] text-slate-500">{cap.vehicle} ({cap.plate})</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-emerald-700 block">{cap.trips} trips</span>
                          <span className="text-[11px] text-slate-500">Net: PKR {cap.netEarnings.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top High-Value Customers */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <h4 className="text-sm font-black text-slate-900">High-Value Passengers</h4>
                  </div>
                  <span className="text-xs text-slate-500">By Total Spend</span>
                </div>

                {detailedAnalytics.topCustomers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No passenger activity recorded in this date range.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {detailedAnalytics.topCustomers.slice(0, 5).map((cust, idx) => (
                      <div key={cust.phone || idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{cust.name}</span>
                          <span className="text-[11px] text-slate-500">{cust.phone} • {cust.trips} bookings</span>
                        </div>

                        <div className="text-right">
                          <strong className="text-slate-900 block">PKR {cust.totalSpent.toLocaleString()}</strong>
                          <span className="text-[11px] text-slate-500">Avg PKR {cust.avgFare}/trip</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Popular Routes Demand Section */}
            {detailedAnalytics.popularRoutes.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-black text-slate-900">High-Demand Turbat Routes</h4>
                  </div>
                  <span className="text-xs text-slate-500">Most requested city journeys</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {detailedAnalytics.popularRoutes.slice(0, 6).map((r, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="truncate pr-2">{r.pickup}</span>
                        <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                          {r.count} rides
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>➔</span>
                        <span className="truncate">{r.dropoff}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        Generated PKR {r.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

              {/* Direct Banner Image File Uploader (Manual URL Removed) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Banner Image (Upload File)</span>
                  {editingPromo.image_url && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Image Attached
                    </span>
                  )}
                </label>

                {editingPromo.image_url ? (
                  <div className="space-y-2">
                    <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img
                        src={editingPromo.image_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  showToast('Uploading banner to cloud storage...', 'info', 'Uploading');
                                  const cloudUrl = await uploadFileToStorage(file, 'banners');
                                  setEditingPromo(prev => ({ ...prev, image_url: cloudUrl }));
                                  showToast('Banner image uploaded successfully!', 'success', 'Image Uploaded');
                                } catch (err) {
                                  showToast('Failed to upload image file.', 'error');
                                }
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditingPromo(prev => ({ ...prev, image_url: '' }))}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-900 block">Click to upload banner image</span>
                      <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Uploaded to Supabase Cloud)</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            showToast('Uploading banner to cloud storage...', 'info', 'Uploading');
                            const cloudUrl = await uploadFileToStorage(file, 'banners');
                            setEditingPromo(prev => ({ ...prev, image_url: cloudUrl }));
                            showToast('Banner image uploaded successfully!', 'success', 'Image Ready');
                          } catch (err) {
                            showToast('Failed to upload image file.', 'error');
                          }
                        }
                      }}
                    />
                  </label>
                )}
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

      {/* DRIVER RECRUITMENT BANNER MODAL */}
      {driverPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Driver Recruitment Banner Card</h3>
                <p className="text-[11px] text-slate-500">Manage card shown under "Register Your Bike or Car With OLAK"</p>
              </div>
              <button onClick={() => setDriverPromoModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveDriverPromoSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Badge</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Motorcycle 70cc / 125cc"
                    value={editingDriverPromo.category_badge || ''}
                    onChange={(e) => setEditingDriverPromo({ ...editingDriverPromo, category_badge: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Register Bike Captain"
                    value={editingDriverPromo.cta_text || ''}
                    onChange={(e) => setEditingDriverPromo({ ...editingDriverPromo, cta_text: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Card Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Register Your Bike Captain Account"
                  value={editingDriverPromo.title || ''}
                  onChange={(e) => setEditingDriverPromo({ ...editingDriverPromo, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Card Title (Urdu)</label>
                <input
                  type="text"
                  placeholder="e.g. اپنی بائیک رجسٹر کروائیں — آزادی سے کمائیں"
                  value={editingDriverPromo.title_urdu || ''}
                  onChange={(e) => setEditingDriverPromo({ ...editingDriverPromo, title_urdu: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-urdu"
                  dir="rtl"
                />
              </div>

              {/* Banner Image Uploader */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Card Background / Vehicle Photo (Upload File)</span>
                  {editingDriverPromo.image_url && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Image Attached
                    </span>
                  )}
                </label>

                {editingDriverPromo.image_url ? (
                  <div className="space-y-2">
                    <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img
                        src={editingDriverPromo.image_url}
                        alt="Card Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  showToast('Uploading driver poster to cloud storage...', 'info', 'Uploading');
                                  const cloudUrl = await uploadFileToStorage(file, 'driver-promos');
                                  setEditingDriverPromo(prev => ({ ...prev, image_url: cloudUrl }));
                                  showToast('Card image uploaded successfully!', 'success', 'Image Uploaded');
                                } catch (err) {
                                  showToast('Failed to upload image file.', 'error');
                                }
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditingDriverPromo(prev => ({ ...prev, image_url: '' }))}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-900 block">Click to upload banner photo</span>
                      <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Uploaded to Supabase Cloud)</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            showToast('Uploading driver poster to cloud storage...', 'info', 'Uploading');
                            const cloudUrl = await uploadFileToStorage(file, 'driver-promos');
                            setEditingDriverPromo(prev => ({ ...prev, image_url: cloudUrl }));
                            showToast('Card image loaded successfully!', 'success', 'Image Ready');
                          } catch (err) {
                            showToast('Failed to upload image file.', 'error');
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Bullet Descriptions */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Feature Bullet Points (Shown on Card)</label>
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Feature / Benefit point ${idx + 1}`}
                    value={(editingDriverPromo.bullets && editingDriverPromo.bullets[idx]) || ''}
                    onChange={(e) => {
                      const currentBullets = [...(editingDriverPromo.bullets || ['', '', ''])];
                      currentBullets[idx] = e.target.value;
                      setEditingDriverPromo({ ...editingDriverPromo, bullets: currentBullets });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Target Link</label>
                  <input
                    type="text"
                    value={editingDriverPromo.cta_link || '/captain/'}
                    onChange={(e) => setEditingDriverPromo({ ...editingDriverPromo, cta_link: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="driver_active_check"
                    checked={editingDriverPromo.is_active !== false}
                    onChange={(e) => setEditingDriverPromo({ ...editingDriverPromo, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="driver_active_check" className="font-bold text-slate-700 text-xs">Visible on Home Page</label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDriverPromoModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl cursor-pointer shadow-sm transition"
                >
                  Save Card Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
              
              {/* Google Maps Link / Coordinates Auto-Detector */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2">
                <label className="block font-bold text-emerald-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paste Google Maps Link (Auto-detect Lat/Lng & Place Name)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Smart Parser
                  </span>
                </label>
                
                <input
                  type="text"
                  placeholder="Paste Google Maps URL (e.g. https://www.google.com/maps/place/... or coordinates)"
                  value={mapsUrlInput}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />

                {detectedMapsInfo && (
                  <div className="bg-white border border-emerald-200 rounded-xl p-2 text-[11px] text-emerald-800 flex items-center justify-between shadow-xs">
                    <span className="flex items-center gap-1.5 truncate mr-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">
                        Auto-detected: <strong>{detectedMapsInfo.lat.toFixed(5)}, {detectedMapsInfo.lng.toFixed(5)}</strong>
                        {detectedMapsInfo.placeName && ` • "${detectedMapsInfo.placeName}"`}
                      </span>
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${detectedMapsInfo.lat},${detectedMapsInfo.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-0.5 text-[10px] flex-shrink-0"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

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

      {/* Official Printable & PDF Invoice Modal */}
      {selectedBookingForPrint && (
        <PrintableReceipt
          booking={selectedBookingForPrint}
          captain={captains.find(c => c.id === selectedBookingForPrint.assigned_captain_id)}
          settings={settings}
          onClose={() => setSelectedBookingForPrint(null)}
        />
      )}

      {/* Official Executive Analytics & Financial Audit Report Modal */}
      {isAnalyticsReportOpen && (
        <AnalyticsReportModal
          analytics={detailedAnalytics}
          settings={settings}
          onClose={() => setIsAnalyticsReportOpen(false)}
        />
      )}

      {/* Modern UI Toast Notifications (No localhost browser alert popups) */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
