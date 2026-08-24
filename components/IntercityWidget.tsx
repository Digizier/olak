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
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const IntercityWidget = () => {
  const { t, isUrdu } = useLanguage();
  const [routes, setRoutes] = useState<IntercityRoute[]>(INITIAL_INTERCITY_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(INITIAL_INTERCITY_ROUTES[0].id);
  const [vehicleClass, setVehicleClass] = useState<'economy' | 'comfort' | 'parcel'>('economy');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    getIntercityRoutes().then(setRoutes);
    const handleUpdate = (e: any) => {
      if (e.detail) setRoutes(e.detail);
    };
    window.addEventListener('olak_intercity_updated', handleUpdate);
    return () => window.removeEventListener('olak_intercity_updated', handleUpdate);
  }, []);

  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const getPrice = () => {
    if (vehicleClass === 'economy') return currentRoute.car_economy_fare;
    if (vehicleClass === 'comfort') return currentRoute.car_comfort_fare;
    return currentRoute.delivery_parcel_fare;
  };

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
        pickup_location: `${currentRoute.origin_city} (Intercity Point)`,
        dropoff_location: `${currentRoute.destination_city} (City Center)`,
        intercity_origin: currentRoute.origin_city,
        intercity_destination: currentRoute.destination_city,
        notes: `Date: ${travelDate || 'Earliest available'} | Class: ${vehicleClass} | ${notes}`,
        estimated_distance_km: currentRoute.estimated_distance_km,
        estimated_fare: getPrice(),
        payment_method: 'cash',
      });

      setConfirmedBooking(booking);
      setIsSubmitting(false);

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
      setIsSubmitting(false);
      alert('Could not submit intercity booking.');
    }
  };

  return (
    <div className="bg-olak-navy-900/95 border border-olak-navy-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
      {confirmedBooking ? (
        <div className="text-center py-6 sm:py-8 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-olak-teal/20 text-olak-teal rounded-full flex items-center justify-center mx-auto border border-olak-teal/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-olak-teal bg-olak-teal/10 px-3 py-1 rounded-full border border-olak-teal/30">
              {isUrdu ? 'انٹرسٹی سفر کی درخواست موصول ہوگئی' : 'Intercity Trip Registered'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {confirmedBooking.booking_code}
            </h3>
            <p className="text-sm text-slate-300 mt-1 font-urdu">
              {isUrdu 
                ? 'ہمارا انٹرسٹی ڈسپیچر جلد آپ سے روانگی کے وقت اور گاڑی کی تصدیق کے لیے رابطہ کرے گا۔' 
                : 'Our Intercity Dispatch Desk will contact you shortly to confirm departure timing.'}
            </p>
          </div>

          <div className="bg-olak-navy-950/80 rounded-2xl p-4 border border-olak-navy-800 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-300 pb-1.5 border-b border-olak-navy-800">
              <span className="text-slate-400">{isUrdu ? 'روٹ' : 'Route'}:</span>
              <span className="font-bold text-white">{confirmedBooking.intercity_origin} ➔ {confirmedBooking.intercity_destination}</span>
            </div>
            <div className="flex justify-between text-slate-300 pb-1.5 border-b border-olak-navy-800">
              <span className="text-slate-400">{isUrdu ? 'مسافر' : 'Passenger'}:</span>
              <span className="font-semibold text-slate-200">{confirmedBooking.customer_name} ({confirmedBooking.customer_phone})</span>
            </div>
            <div className="flex justify-between text-slate-300 pt-1 text-base">
              <span className="font-bold text-olak-teal">{isUrdu ? 'مکمل کرایہ' : 'Trip Fare'}:</span>
              <span className="font-black text-olak-teal">PKR {confirmedBooking.estimated_fare}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`/track/?code=${confirmedBooking.booking_code}`}
              className="flex-1 bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-teal-glow transition"
            >
              <span>{t.track_status_btn}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => setConfirmedBooking(null)}
              className="px-4 py-3 bg-olak-navy-800 hover:bg-olak-navy-700 text-slate-200 rounded-xl font-semibold transition"
            >
              {isUrdu ? 'نیا روٹ منتخب کریں' : 'Book Another Route'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-olak-teal"></span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isUrdu ? 'بلوچستان و سندھ انٹرسٹی ٹریول' : 'Balochistan Intercity Travel'}
              </h3>
            </div>
            <span className="text-xs text-olak-teal font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ہائی وے تصدیق شدہ کاریں' : 'Highway Inspected'}</span>
            </span>
          </div>

          {/* Route Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-olak-teal" />
                <span>{isUrdu ? 'انٹرسٹی روٹ کا انتخاب کریں' : 'Select Intercity Route'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {currentRoute.estimated_distance_km} KM • {currentRoute.estimated_duration}
              </span>
            </label>

            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-100 focus:outline-none focus:border-olak-teal"
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.origin_city} ➔ {r.destination_city} ({r.estimated_distance_km} KM - {r.estimated_duration})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Class Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {isUrdu ? 'سفر کی کیٹیگری منتخب کریں' : 'Select Ride Category'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVehicleClass('economy')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  vehicleClass === 'economy'
                    ? 'bg-olak-teal/20 border-olak-teal text-white shadow-sm'
                    : 'bg-olak-navy-950 border-olak-navy-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-4 h-4 mx-auto mb-1 text-olak-teal" />
                <span className="block text-xs font-bold">{isUrdu ? 'اکانومی کار' : 'Car Economy'}</span>
                <span className="block text-[10px] text-olak-teal mt-0.5">PKR {currentRoute.car_economy_fare}</span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleClass('comfort')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  vehicleClass === 'comfort'
                    ? 'bg-olak-teal/20 border-olak-teal text-white shadow-sm'
                    : 'bg-olak-navy-950 border-olak-navy-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="block text-xs font-bold">{isUrdu ? 'کمفرٹ اے سی' : 'AC Comfort'}</span>
                <span className="block text-[10px] text-emerald-400 mt-0.5">PKR {currentRoute.car_comfort_fare}</span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleClass('parcel')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  vehicleClass === 'parcel'
                    ? 'bg-olak-teal/20 border-olak-teal text-white shadow-sm'
                    : 'bg-olak-navy-950 border-olak-navy-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="block text-xs font-bold">{isUrdu ? 'انٹرسٹی پارسل' : 'Parcel Cargo'}</span>
                <span className="block text-[10px] text-amber-400 mt-0.5">PKR {currentRoute.delivery_parcel_fare}</span>
              </button>
            </div>
          </div>

          {/* Passenger & Date Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>{t.name_label}</span>
              </label>
              <input
                type="text"
                required
                placeholder={t.name_placeholder}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{t.phone_label}</span>
              </label>
              <input
                type="tel"
                required
                placeholder={t.phone_placeholder}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{isUrdu ? 'روانگی کی متوقع تاریخ' : 'Travel Date'}</span>
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-olak-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isUrdu ? 'مسافروں کی تعداد / سامان' : 'Passengers / Luggage'}
              </label>
              <input
                type="text"
                placeholder={isUrdu ? 'مثلاً 2 افراد، 1 بیگ' : 'e.g. 2 seats, 1 bag'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
            </div>
          </div>

          {/* Fare Summary */}
          <div className="bg-gradient-to-r from-olak-navy-950 via-olak-navy-850 to-olak-navy-950 border border-olak-teal/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                {isUrdu ? 'روٹ کا طے شدہ کرایہ' : 'Fixed Intercity Fare'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-olak-teal">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-white">{getPrice()}</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <span className="block text-slate-300">{currentRoute.estimated_duration}</span>
              <span className="text-emerald-400 font-medium">{currentRoute.estimated_distance_km} KM Highway</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-olak-teal to-emerald-500 hover:from-emerald-400 hover:to-olak-teal text-olak-navy-950 font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-teal-glow transition active:scale-[0.99] disabled:opacity-50 text-base"
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
