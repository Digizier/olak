'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { INITIAL_INTERCITY_ROUTES } from '@/lib/constants';
import { getIntercityRoutes, createBooking } from '@/lib/db';
import { IntercityRoute, Booking } from '@/lib/types';
import { 
  Navigation, 
  Car, 
  Package, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Clock, 
  ShieldCheck,
  Sliders,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const IntercityWidget = () => {
  const { t, isUrdu } = useLanguage();
  const [routes, setRoutes] = useState<IntercityRoute[]>(INITIAL_INTERCITY_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(INITIAL_INTERCITY_ROUTES[0].id);
  const [vehicleClass, setVehicleClass] = useState<'economy' | 'comfort' | 'parcel'>('economy');
  
  // Dual Pricing Toggle: 'fixed' or 'per_km'
  const [pricingMode, setPricingMode] = useState<'fixed' | 'per_km'>('fixed');
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(INITIAL_INTERCITY_ROUTES[0].estimated_distance_km);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    getIntercityRoutes().then(data => {
      if (data && data.length > 0) setRoutes(data);
    });

    const handleUpdate = (e: any) => {
      if (e.detail) setRoutes(e.detail);
    };
    window.addEventListener('olak_intercity_updated', handleUpdate);
    return () => window.removeEventListener('olak_intercity_updated', handleUpdate);
  }, []);

  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  // Update distance when selected route changes
  useEffect(() => {
    if (currentRoute) {
      setCustomDistanceKm(currentRoute.estimated_distance_km);
      if (currentRoute.pricing_model) {
        setPricingMode(currentRoute.pricing_model);
      }
    }
  }, [selectedRouteId]);

  // Calculate Price: Supports Both Fixed Price and Per-KM Dynamic Price
  const getPrice = () => {
    if (pricingMode === 'fixed') {
      if (vehicleClass === 'economy') return currentRoute.car_economy_fare;
      if (vehicleClass === 'comfort') return currentRoute.car_comfort_fare;
      return currentRoute.delivery_parcel_fare;
    } else {
      // Per-KM Rate calculation
      const ratePerKm = currentRoute.per_km_rate || 25;
      const multiplier = vehicleClass === 'comfort' ? 1.35 : vehicleClass === 'parcel' ? 0.35 : 1.0;
      return Math.round((customDistanceKm * ratePerKm * multiplier) / 50) * 50;
    }
  };

  const finalFare = getPrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert(isUrdu ? 'برائے مہربانی اپنا نام اور موبائل نمبر درج کریں۔' : 'Please provide your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        service_type: 'intercity',
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_location: `${currentRoute.origin_city} (Intercity Departure Point)`,
        dropoff_location: `${currentRoute.destination_city} (City Center)`,
        intercity_origin: currentRoute.origin_city,
        intercity_destination: currentRoute.destination_city,
        notes: `Date: ${travelDate || 'Earliest available'} | Class: ${vehicleClass} | Pricing: ${pricingMode.toUpperCase()} (${customDistanceKm} KM) | ${notes}`,
        estimated_distance_km: customDistanceKm,
        estimated_fare: finalFare,
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
      alert('Could not submit intercity booking.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
      {confirmedBooking ? (
        <div className="text-center py-6 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {isUrdu ? 'انٹرسٹی سفر کی درخواست موصول ہوگئی' : 'Intercity Trip Registered'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {confirmedBooking.booking_code}
            </h3>
            <p className="text-sm text-slate-600 mt-1 font-urdu">
              {isUrdu 
                ? 'ہمارا انٹرسٹی ڈسپیچر جلد آپ سے روانگی کے وقت اور گاڑی کی تصدیق کے لیے رابطہ کرے گا۔' 
                : 'Our Intercity Dispatch Desk will contact you shortly to confirm departure timing.'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-700 pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'روٹ' : 'Route'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.intercity_origin} ➔ {confirmedBooking.intercity_destination}</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'مسافر' : 'Passenger'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.customer_name} ({confirmedBooking.customer_phone})</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'ماڈل' : 'Pricing Model'}:</span>
              <span className="font-bold text-emerald-700 uppercase">{pricingMode === 'fixed' ? 'Fixed Route Rate' : 'Distance Meter (Per KM)'}</span>
            </div>
            <div className="flex justify-between text-slate-900 pt-1 text-base">
              <span className="font-bold text-emerald-600">{isUrdu ? 'مکمل کرایہ' : 'Trip Fare'}:</span>
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
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition border border-slate-200"
            >
              {isUrdu ? 'نیا روٹ منتخب کریں' : 'Book Another Route'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {isUrdu ? 'بلوچستان انٹرسٹی ٹریول' : 'Balochistan Intercity Travel'}
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ہائی وے تصدیق شدہ' : 'Highway Inspected'}</span>
            </span>
          </div>

          {/* Route Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUrdu ? 'انٹرسٹی روٹ کا انتخاب کریں' : 'Select Intercity Route'}</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {currentRoute.estimated_distance_km} KM • {currentRoute.estimated_duration}
              </span>
            </label>

            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.origin_city} ➔ {r.destination_city} ({r.estimated_distance_km} KM - {r.estimated_duration})
                </option>
              ))}
            </select>
          </div>

          {/* DUAL PRICING TOGGLE: FIXED vs PER-KM */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUrdu ? 'کرایہ کا نظام منتخب کریں' : 'Pricing Mode'}</span>
              </span>
              <div className="flex bg-white p-0.5 rounded-lg border border-slate-300 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPricingMode('fixed')}
                  className={`px-3 py-1 rounded transition ${
                    pricingMode === 'fixed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isUrdu ? 'فکسڈ کرایہ' : 'Fixed Route'}
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('per_km')}
                  className={`px-3 py-1 rounded transition ${
                    pricingMode === 'per_km' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isUrdu ? 'فی کلو میٹر (KM)' : 'Per-KM Rate'}
                </button>
              </div>
            </div>

            {/* If Per-KM selected, allow customizing distance KM */}
            {pricingMode === 'per_km' && (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-600">{isUrdu ? 'فاصلہ ایڈٹ کریں:' : 'Custom Trip KM:'}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCustomDistanceKm(Math.max(10, customDistanceKm - 10))}
                    className="w-6 h-6 rounded bg-white border border-slate-300 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={customDistanceKm}
                    onChange={(e) => setCustomDistanceKm(Math.max(10, Number(e.target.value)))}
                    className="w-16 text-center font-black bg-white border border-emerald-500 rounded py-0.5 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomDistanceKm(customDistanceKm + 10)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 font-bold"
                  >
                    +
                  </button>
                  <span className="font-bold text-slate-500">KM</span>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Class Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isUrdu ? 'سفر کی کیٹیگری منتخب کریں' : 'Select Ride Category'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVehicleClass('economy')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  vehicleClass === 'economy'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <span className="block text-xs font-bold">{isUrdu ? 'اکانومی کار' : 'Car Economy'}</span>
                <span className="block text-[10px] text-emerald-700 font-bold mt-0.5">
                  {pricingMode === 'fixed' ? `PKR ${currentRoute.car_economy_fare}` : 'Standard Rate'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleClass('comfort')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  vehicleClass === 'comfort'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-4 h-4 mx-auto mb-1 text-teal-700" />
                <span className="block text-xs font-bold">{isUrdu ? 'کمفرٹ اے سی' : 'AC Comfort'}</span>
                <span className="block text-[10px] text-teal-700 font-bold mt-0.5">
                  {pricingMode === 'fixed' ? `PKR ${currentRoute.car_comfort_fare}` : '+35% Comfort'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleClass('parcel')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  vehicleClass === 'parcel'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span className="block text-xs font-bold">{isUrdu ? 'انٹرسٹی پارسل' : 'Parcel Cargo'}</span>
                <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
                  {pricingMode === 'fixed' ? `PKR ${currentRoute.delivery_parcel_fare}` : 'Cargo Rate'}
                </span>
              </button>
            </div>
          </div>

          {/* Passenger & Date Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>{t.name_label}</span>
              </label>
              <input
                type="text"
                required
                placeholder={t.name_placeholder}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{t.phone_label}</span>
              </label>
              <input
                type="tel"
                required
                placeholder={t.phone_placeholder}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{isUrdu ? 'روانگی کی متوقع تاریخ' : 'Travel Date'}</span>
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isUrdu ? 'مسافروں کی تعداد / سامان' : 'Passengers / Luggage'}
              </label>
              <input
                type="text"
                placeholder={isUrdu ? 'مثلاً 2 افراد، 1 بیگ' : 'e.g. 2 seats, 1 bag'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fare Summary */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {pricingMode === 'fixed' ? 'Fixed Route Fare' : `Distance Meter (${customDistanceKm} KM)`}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-emerald-600">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{finalFare}</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <span className="block font-bold text-slate-800">{currentRoute.estimated_duration}</span>
              <span className="text-emerald-700 font-semibold">{customDistanceKm} KM Highway</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] disabled:opacity-50 text-base cursor-pointer"
          >
            {isSubmitting ? (
              <span>{isUrdu ? 'درخواست بھیجی جا رہی ہے...' : 'Submitting Request...'}</span>
            ) : (
              <span className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                <span>{t.book_intercity_btn}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
