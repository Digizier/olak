'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { PricingRate, ServiceType, Booking, CityLandmark, Customer } from '@/lib/types';
import { TURBAT_LANDMARKS, INITIAL_PRICING_RATES } from '@/lib/constants';
import { getPricingRates, createBooking, getCityLandmarks, calculateRealtimeDistance, getCurrentCustomer } from '@/lib/db';
import { InteractiveRouteMap } from '@/components/InteractiveRouteMap';
import { CustomerAuthModal } from '@/components/CustomerAuthModal';
import { Toast, ToastMessage } from '@/components/Toast';
import { 
  Bike, 
  Car, 
  Truck, 
  MapPin, 
  Navigation, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Route,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  initialRates?: PricingRate[];
}

export const RideBookingWidget: React.FC<Props> = ({ initialRates }) => {
  const { t, isUrdu } = useLanguage();
  const [rates, setRates] = useState<PricingRate[]>(initialRates || INITIAL_PRICING_RATES);
  const [landmarks, setLandmarks] = useState<CityLandmark[]>(TURBAT_LANDMARKS);
  const [selectedService, setSelectedService] = useState<ServiceType>('bike');

  // Customer Session & Auth Modal
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form State
  const [pickup, setPickup] = useState(TURBAT_LANDMARKS[0].name);
  const [dropoff, setDropoff] = useState(TURBAT_LANDMARKS[2].name);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Dynamic Rates, Landmarks & Customer Hydration
  useEffect(() => {
    getPricingRates().then(setRates);
    getCityLandmarks().then(setLandmarks);
    
    const cur = getCurrentCustomer();
    if (cur) {
      setCurrentCustomer(cur);
      setCustomerName(cur.full_name);
      setCustomerPhone(cur.phone);
    }

    const handleRatesUpdate = (e: any) => {
      if (e.detail) setRates(e.detail);
    };
    const handleLandmarksUpdate = (e: any) => {
      if (e.detail) setLandmarks(e.detail);
    };
    const handleCustomerAuth = (e: any) => {
      setCurrentCustomer(e.detail);
      if (e.detail) {
        setCustomerName(e.detail.full_name);
        setCustomerPhone(e.detail.phone);
      }
    };

    window.addEventListener('olak_fares_updated', handleRatesUpdate);
    window.addEventListener('olak_landmarks_updated', handleLandmarksUpdate);
    window.addEventListener('olak_customer_auth_changed', handleCustomerAuth);
    return () => {
      window.removeEventListener('olak_fares_updated', handleRatesUpdate);
      window.removeEventListener('olak_landmarks_updated', handleLandmarksUpdate);
      window.removeEventListener('olak_customer_auth_changed', handleCustomerAuth);
    };
  }, []);

  // Compute Real-time Distance between selected pickup & dropoff coordinates
  const pickupPoint = landmarks.find(l => l.name === pickup) || landmarks[0] || TURBAT_LANDMARKS[0];
  const dropoffPoint = landmarks.find(l => l.name === dropoff) || landmarks[2] || landmarks[0] || TURBAT_LANDMARKS[2];
  
  const realTimeDistanceKm = calculateRealtimeDistance(
    { lat: Number(pickupPoint.lat), lng: Number(pickupPoint.lng) },
    { lat: Number(dropoffPoint.lat), lng: Number(dropoffPoint.lng) }
  );

  // Dynamic Fare Calculation based on Admin's Rates & Real-Time KM
  const activeRate = rates.find(r => r.service_type === selectedService) || rates[0];
  const rawFare = activeRate.base_fare + (realTimeDistanceKm * activeRate.per_km_charge);
  const estimatedFare = Math.round(Math.max(activeRate.minimum_fare, rawFare) / 10) * 10;

  // Actual Ride Creation Execution
  const executeBooking = async (name: string, phone: string) => {
    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        service_type: selectedService,
        customer_name: name,
        customer_phone: phone,
        pickup_location: pickup,
        dropoff_location: dropoff,
        notes: notes,
        estimated_distance_km: realTimeDistanceKm,
        estimated_fare: estimatedFare,
        payment_method: 'cash',
      });

      setConfirmedBooking(booking);
      setIsSubmitting(false);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D084', '#10B981', '#061325', '#3b82f6']
        });
      } catch (cErr) {}
    } catch (err) {
      console.error('Booking failed:', err);
      setToast({
        type: 'error',
        title: 'Booking Error',
        message: 'Could not submit ride booking. Please check connection and try again.'
      });
    }
  };

  // When User presses "Request Ride Now"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if customer is ALREADY logged in
    const activeCustomer = getCurrentCustomer() || currentCustomer;
    if (!activeCustomer) {
      // NOT logged in -> Popup Customer Login / Register modal
      setShowAuthModal(true);
      return;
    }

    // ALREADY logged in -> Immediately place and accept booking without any login prompt!
    await executeBooking(activeCustomer.full_name || customerName, activeCustomer.phone || customerPhone);
  };

  // Called when user completes Registration or Login in the popup
  const handleAuthSuccess = async (customer: Customer) => {
    setCurrentCustomer(customer);
    setCustomerName(customer.full_name);
    setCustomerPhone(customer.phone);
    setShowAuthModal(false);

    // IMMEDIATELY accept and submit booking!
    await executeBooking(customer.full_name, customer.phone);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
      {confirmedBooking ? (
        /* Confirmation Voucher */
        <div className="text-center py-6 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              {t.booking_success}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {confirmedBooking.booking_code}
            </h3>
            <p className="text-sm text-slate-600 mt-1 font-urdu">
              {isUrdu 
                ? 'آپ کی رائیڈ بکنگ درج ہوچکی ہے۔ تربت کے قریبی کیپٹن کو اطلاع روانہ کردی گئی ہے۔' 
                : 'Your ride request has been dispatched to verified captains in Turbat.'}
            </p>
          </div>

          {/* Trip Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'سروس' : 'Service'}:</span>
              <span className="font-bold text-slate-900 uppercase">{confirmedBooking.service_type}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'مسافر' : 'Passenger'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.customer_name} ({confirmedBooking.customer_phone})</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'پک اپ' : 'Pickup'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.pickup_location}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'منزل' : 'Dropoff'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.dropoff_location}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'فاصلہ' : 'Distance'}:</span>
              <span className="font-bold text-emerald-700">{confirmedBooking.estimated_distance_km} KM</span>
            </div>
            <div className="flex justify-between text-slate-900 pt-1 text-base">
              <span className="font-bold text-emerald-600">{isUrdu ? 'کرایہ' : 'Fare'}:</span>
              <span className="font-black text-emerald-600">PKR {confirmedBooking.estimated_fare}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`/track/?code=${confirmedBooking.booking_code}`}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>{t.track_status_btn}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => setConfirmedBooking(null)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition border border-slate-200 cursor-pointer"
            >
              {isUrdu ? 'نئی بکنگ کریں' : 'Book Another Ride'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Header Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {isUrdu ? 'سواری کی فوری بکنگ' : 'Instant Ride Booking'}
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Clock className="w-3.5 h-3.5" />
              <span>{isUrdu ? '3-7 منٹ میں آمد' : '3-7 Min Pickup'}</span>
            </span>
          </div>

          {/* Service Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {rates.filter(r => r.service_type !== 'delivery' && r.service_type !== 'intercity').map((rate) => {
              const isSelected = selectedService === rate.service_type;
              return (
                <button
                  key={rate.id}
                  type="button"
                  onClick={() => setSelectedService(rate.service_type)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-600 text-white font-bold shadow-md scale-[1.02]' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="mb-1">
                    {rate.service_type === 'bike' && <Bike className="w-5 h-5" />}
                    {rate.service_type === 'rickshaw' && <Truck className="w-5 h-5" />}
                    {rate.service_type === 'car' && <Car className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-bold truncate max-w-full">
                    {isUrdu ? (rate.service_name_urdu || rate.service_name) : rate.service_name}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    Base PKR {rate.base_fare}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Location Selection Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.pickup_label}</span>
                </span>
                <span className="text-[10px] text-slate-400">Turbat</span>
              </label>

              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {landmarks.map((lm) => (
                  <option key={lm.id || lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu || lm.name_urdu || lm.name} (${lm.area})` : `${lm.name} (${lm.area})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-teal-700" />
                  <span>{t.dropoff_label}</span>
                </span>
                <span className="text-[10px] text-slate-400">Turbat</span>
              </label>

              <select
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {landmarks.map((lm) => (
                  <option key={lm.id || lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu || lm.name_urdu || lm.name} (${lm.area})` : `${lm.name} (${lm.area})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Embedded Real-Time Interactive Google Map */}
          <InteractiveRouteMap
            pickupName={pickup}
            dropoffName={dropoff}
            onPickupChange={(name) => setPickup(name)}
            onDropoffChange={(name) => setDropoff(name)}
            distanceKm={realTimeDistanceKm}
            landmarks={landmarks}
            isUrdu={isUrdu}
          />

          {/* Optional Street / Gate Notes */}
          <div>
            <input
              type="text"
              placeholder={isUrdu ? 'کوئی خاص گلی، دکان یا گیٹ نمبر (اختیاری)...' : 'Specific street, shop, or gate number (optional)...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Customer Authentication State Indicator or Inputs */}
          {currentCustomer ? (
            /* Logged in Passenger Badge */
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    {isUrdu ? 'لاگ ان شدہ کسٹمر' : 'Verified Customer'}
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {currentCustomer.full_name} ({currentCustomer.phone})
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                Auto-Confirmed
              </span>
            </div>
          ) : (
            /* Passenger Name & Phone Details (If not yet logged in) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{t.name_label}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.name_placeholder}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{t.phone_label}</span>
                </label>
                <input
                  type="tel"
                  placeholder={t.phone_placeholder}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Live Dynamic Fare Estimation Card */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {t.est_fare} ({realTimeDistanceKm} KM @ PKR {activeRate.per_km_charge}/KM)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-emerald-600">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {estimatedFare}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500 space-y-0.5">
              <span className="block font-bold text-slate-800">
                {isUrdu ? 'کیش آن پک اپ' : 'Cash on Delivery'}
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'فکسڈ شفاف کرایہ' : 'Transparent Meter'}</span>
              </span>
            </div>
          </div>

          {/* Submit Request Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition transform active:scale-[0.99] disabled:opacity-50 text-base cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{isUrdu ? 'کیپٹن سے رابطہ ہو رہا ہے...' : 'Connecting with Captains...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{t.book_now_btn}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      )}

      {/* CUSTOMER AUTHENTICATION MODAL (If user clicks Request Ride without being logged in) */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        serviceTitle={`OLAK ${selectedService.toUpperCase()}`}
        estimatedFare={estimatedFare}
        pickupLocation={pickup}
        dropoffLocation={dropoff}
        defaultTab="register"
      />

      {/* Modern UI Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
};
