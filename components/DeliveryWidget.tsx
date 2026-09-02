'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { TURBAT_LANDMARKS, INITIAL_PRICING_RATES } from '@/lib/constants';
import { createBooking, getPricingRates, getCityLandmarks, calculateRealtimeDistance, getCurrentCustomer } from '@/lib/db';
import { Booking, CityLandmark, PricingRate, Customer } from '@/lib/types';
import { CustomerAuthModal } from '@/components/CustomerAuthModal';
import { Toast, ToastMessage } from '@/components/Toast';
import { SearchableLocationSelect } from '@/components/SearchableLocationSelect';
import { 
  Package, 
  MapPin, 
  Navigation, 
  User, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  FileText,
  Utensils,
  Smartphone,
  Pill,
  Scale,
  Route,
  Clock,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DeliveryWidget = () => {
  const { t, isUrdu } = useLanguage();
  
  const [landmarks, setLandmarks] = useState<CityLandmark[]>(TURBAT_LANDMARKS);
  const [rates, setRates] = useState<PricingRate[]>(INITIAL_PRICING_RATES);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [pickup, setPickup] = useState(TURBAT_LANDMARKS[0].name);
  const [dropoff, setDropoff] = useState(TURBAT_LANDMARKS[1].name);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [parcelType, setParcelType] = useState('Documents & Files');
  
  // Package Weight (KG)
  const [parcelWeightKg, setParcelWeightKg] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    getPricingRates().then(setRates);
    getCityLandmarks().then(setLandmarks);

    const cur = getCurrentCustomer();
    if (cur) {
      setCurrentCustomer(cur);
      setSenderName(cur.full_name);
      setSenderPhone(cur.phone);
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
        setSenderName(e.detail.full_name);
        setSenderPhone(e.detail.phone);
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

  // Compute Real-time Distance between selected landmarks
  const pickupPoint = landmarks.find(l => l.name === pickup) || landmarks[0] || TURBAT_LANDMARKS[0];
  const dropoffPoint = landmarks.find(l => l.name === dropoff) || landmarks[1] || landmarks[0] || TURBAT_LANDMARKS[1];
  
  const realTimeDistanceKm = calculateRealtimeDistance(
    { lat: Number(pickupPoint.lat), lng: Number(pickupPoint.lng) },
    { lat: Number(dropoffPoint.lat), lng: Number(dropoffPoint.lng) }
  );

  // Delivery Pricing Formula using Admin Rates
  const deliveryRate = rates.find(r => r.service_type === 'delivery') || {
    base_fare: 100,
    per_km_charge: 25,
    minimum_fare: 150
  };
  
  const baseRate = deliveryRate.base_fare;
  const perKmRate = deliveryRate.per_km_charge;
  // Weight surcharge: 1-2 KG included in base. Above 2 KG, PKR 20 per extra KG.
  const weightSurcharge = parcelWeightKg > 2 ? Math.round((parcelWeightKg - 2) * 20) : 0;
  const rawFare = baseRate + (realTimeDistanceKm * perKmRate) + weightSurcharge;
  const estimatedFare = Math.max(deliveryRate.minimum_fare, Math.round(rawFare / 10) * 10);

  const executeDelivery = async (sName: string, sPhone: string) => {
    if (!receiverPhone) {
      setToast({
        type: 'error',
        title: 'Missing Details',
        message: isUrdu ? 'برائے مہربانی وصول کنندہ کا موبائل نمبر درج کریں۔' : 'Please enter receiver mobile number.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        service_type: 'delivery',
        customer_name: sName,
        customer_phone: sPhone,
        pickup_location: pickup,
        dropoff_location: dropoff,
        delivery_parcel_type: parcelType,
        delivery_weight_kg: parcelWeightKg,
        delivery_receiver_name: receiverName,
        delivery_receiver_phone: receiverPhone,
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
          colors: ['#00D084', '#10B981', '#061325']
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setToast({
        type: 'error',
        title: 'Booking Error',
        message: 'Delivery booking failed. Please check connection and try again.'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if customer is already logged in
    const activeCustomer = getCurrentCustomer() || currentCustomer;
    if (!activeCustomer) {
      setShowAuthModal(true);
      return;
    }

    await executeDelivery(activeCustomer.full_name || senderName, activeCustomer.phone || senderPhone);
  };

  const handleAuthSuccess = async (customer: Customer) => {
    setCurrentCustomer(customer);
    setSenderName(customer.full_name);
    setSenderPhone(customer.phone);
    setShowAuthModal(false);

    await executeDelivery(customer.full_name, customer.phone);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xl space-y-3.5 sm:space-y-5">
      {confirmedBooking ? (
        <div className="text-center py-6 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <Package className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {isUrdu ? 'پارسل ڈسپیچ درج ہوگیا' : 'Parcel Order Created'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {confirmedBooking.booking_code}
            </h3>
            <p className="text-sm text-slate-600 mt-1 font-urdu">
              {isUrdu 
                ? 'آپ کا پارسل آرڈر کامیابی کے ساتھ سسٹم میں درج ہوگیا ہے۔' 
                : 'Your courier order has been placed. Verified captain dispatched.'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'پارسل کی قسم' : 'Parcel Type'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.delivery_parcel_type} ({confirmedBooking.delivery_weight_kg || 1} KG)</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'ارسال کنندہ' : 'Sender'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.customer_name} ({confirmedBooking.customer_phone})</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'وصول کنندہ' : 'Receiver'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.delivery_receiver_name || 'Recipient'} ({confirmedBooking.delivery_receiver_phone})</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'پک اپ پوائنٹ' : 'Pickup Point'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.pickup_location}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'منزل' : 'Delivery Destination'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.dropoff_location}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'فاصلہ' : 'Distance'}:</span>
              <span className="font-bold text-emerald-700">{confirmedBooking.estimated_distance_km} KM</span>
            </div>
            <div className="flex justify-between text-slate-900 pt-1 text-base">
              <span className="font-bold text-emerald-600">{isUrdu ? 'ڈلیوری فیس' : 'Total Fare'}:</span>
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
              {isUrdu ? 'دوسرا پارسل بھیجیں' : 'Send Another Parcel'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-base sm:text-xl font-black text-slate-900">
                {isUrdu ? 'شہر کے اندر فوری پارسل ڈلیوری' : 'Turbat Express Parcel Delivery'}
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {isUrdu ? 'ڈور ٹو ڈور سروس' : 'Doorstep Courier'}
            </span>
          </div>

          {/* Parcel Type Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.parcel_type}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'docs', label: t.parcel_type_docs, icon: FileText },
                { id: 'food', label: t.parcel_type_food, icon: Utensils },
                { id: 'goods', label: t.parcel_type_goods, icon: Smartphone },
                { id: 'meds', label: t.parcel_type_medicine, icon: Pill },
              ].map(item => {
                const isSelected = parcelType === item.label;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setParcelType(item.label)}
                    className={`flex items-center gap-1.5 p-2 sm:p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations with Search Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableLocationSelect
              label={isUrdu ? 'کہاں سے اٹھانا ہے (پک اپ)' : 'Pickup Point'}
              icon={MapPin}
              iconColor="text-emerald-600"
              value={pickup}
              onChange={(name) => setPickup(name)}
              landmarks={landmarks}
              isUrdu={isUrdu}
              badge="Turbat"
              placeholder={isUrdu ? 'پک اپ مقام تلاش کریں...' : 'Search pickup location...'}
            />

            <SearchableLocationSelect
              label={isUrdu ? 'کہاں پہنچانا ہے (منزل)' : 'Delivery Destination'}
              icon={Navigation}
              iconColor="text-teal-700"
              value={dropoff}
              onChange={(name) => setDropoff(name)}
              landmarks={landmarks}
              isUrdu={isUrdu}
              badge="Turbat"
              placeholder={isUrdu ? 'منزل کا مقام تلاش کریں...' : 'Search delivery destination...'}
            />
          </div>

          {/* AUTOMATED ROUTE DISTANCE & WEIGHT SPECIFICATION CARD */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              
              {/* Automated Real-Time Distance Meter (NO User Input) */}
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isUrdu ? 'روٹ فاصلہ (خودکار جی پی ایس میٹر)' : 'Route Distance (GPS Automated)'}</span>
                </span>
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2">
                  <span className="text-base font-black text-slate-900">
                    {realTimeDistanceKm} <span className="text-xs font-bold text-emerald-600">KM</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (PKR {perKmRate}/KM rate)
                  </span>
                </div>
              </div>

              {/* Package Weight (KG) Selector */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isUrdu ? 'پارسل کا وزن (کلوگرام)' : 'Parcel Weight (KG)'}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">&gt;2KG +PKR 20/KG</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setParcelWeightKg(Math.max(1, parcelWeightKg - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-black flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={parcelWeightKg}
                    onChange={(e) => setParcelWeightKg(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-white border border-slate-300 rounded-lg py-1 px-2 text-center text-xs font-black text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setParcelWeightKg(Math.min(50, parcelWeightKg + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-black flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-slate-500">KG</span>
                </div>
              </div>

            </div>
          </div>

          {/* Contact Details (Sender info auto-filled if logged in) */}
          {currentCustomer ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Sender: {currentCustomer.full_name} ({currentCustomer.phone})</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">Verified</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{t.sender_name}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aslam Baloch"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Sender Mobile</span>
                </label>
                <input
                  type="tel"
                  placeholder="0334 1234567"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Receiver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>{t.receiver_name}</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tariq Murad"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{t.receiver_phone}</span>
              </label>
              <input
                type="tel"
                required
                placeholder="0333 7654321"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <input
              type="text"
              placeholder={isUrdu ? 'پارسل کے متعلق کوئی خاص ہدایت (اختیاری)...' : 'Delivery instructions (e.g. fragile, call before arriving)...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Price Breakdown Banner */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {isUrdu ? 'ڈلیوری کا مکمل کرایہ' : 'Total Delivery Fare'} ({realTimeDistanceKm} KM • {parcelWeightKg} KG)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-emerald-600">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{estimatedFare}</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <span className="block font-bold text-slate-800">{isUrdu ? 'فوری ڈسپیچ' : 'Doorstep Pickup'}</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'محفوظ ترسیل' : 'Inspected Delivery'}</span>
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition transform active:scale-[0.99] disabled:opacity-50 text-base cursor-pointer"
          >
            {isSubmitting ? (
              <span>{isUrdu ? 'درخواست درج ہو رہی ہے...' : 'Placing Delivery Order...'}</span>
            ) : (
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>{t.book_delivery_btn}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      )}

      {/* Customer Auth Modal for Parcel Delivery */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        serviceTitle="OLAK Parcel Delivery"
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
