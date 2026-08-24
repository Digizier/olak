'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  PricingRate, 
  ServiceType, 
  Booking 
} from '@/lib/types';
import { 
  TURBAT_LANDMARKS, 
  INITIAL_PRICING_RATES 
} from '@/lib/constants';
import { 
  getPricingRates, 
  createBooking 
} from '@/lib/db';
import { 
  Bike, 
  Car, 
  Truck, 
  Package, 
  MapPin, 
  Navigation, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  initialRates?: PricingRate[];
}

export const RideBookingWidget: React.FC<Props> = ({ initialRates }) => {
  const { t, isUrdu } = useLanguage();
  const [rates, setRates] = useState<PricingRate[]>(initialRates || INITIAL_PRICING_RATES);
  const [selectedService, setSelectedService] = useState<ServiceType>('bike');

  // Form State
  const [pickup, setPickup] = useState(TURBAT_LANDMARKS[0].name);
  const [dropoff, setDropoff] = useState(TURBAT_LANDMARKS[2].name);
  const [customPickup, setCustomPickup] = useState('');
  const [customDropoff, setCustomDropoff] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Dynamic Rates Hydration
  useEffect(() => {
    getPricingRates().then(setRates);

    const handleRatesUpdate = (e: any) => {
      if (e.detail) setRates(e.detail);
    };
    window.addEventListener('olak_fares_updated', handleRatesUpdate);
    return () => window.removeEventListener('olak_fares_updated', handleRatesUpdate);
  }, []);

  // Distance & Fare Calculation
  const activeRate = rates.find(r => r.service_type === selectedService) || rates[0];

  // Approximate distance based on selected landmarks or default 4.5 KM
  const calculateDistance = (): number => {
    const pIndex = TURBAT_LANDMARKS.findIndex(l => l.name === (customPickup || pickup));
    const dIndex = TURBAT_LANDMARKS.findIndex(l => l.name === (customDropoff || dropoff));
    if (pIndex >= 0 && dIndex >= 0 && pIndex !== dIndex) {
      return Math.max(2.5, Math.abs(pIndex - dIndex) * 1.8 + 1.2);
    }
    return 4.5;
  };

  const estimatedDistance = calculateDistance();
  const rawFare = activeRate.base_fare + (estimatedDistance * activeRate.per_km_charge);
  const estimatedFare = Math.round(Math.max(activeRate.minimum_fare, rawFare) / 10) * 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert(isUrdu ? 'برائے مہربانی اپنا نام اور موبائل نمبر درج کریں۔' : 'Please enter your Name and Mobile Number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalPickup = customPickup.trim() || pickup;
      const finalDropoff = customDropoff.trim() || dropoff;

      const booking = await createBooking({
        service_type: selectedService,
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_location: finalPickup,
        dropoff_location: finalDropoff,
        notes: notes,
        estimated_distance_km: parseFloat(estimatedDistance.toFixed(1)),
        estimated_fare: estimatedFare,
        payment_method: 'cash',
      });

      setConfirmedBooking(booking);
      setIsSubmitting(false);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00D084', '#10B981', '#ffffff', '#0A192F']
        });
      } catch (cErr) {
        // ignore
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setIsSubmitting(false);
      alert('Could not submit booking. Please try again.');
    }
  };

  return (
    <div className="bg-olak-navy-900/95 border border-olak-navy-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-olak-teal/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Success Modal / Banner */}
      {confirmedBooking ? (
        <div className="text-center py-6 sm:py-8 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-olak-teal/20 text-olak-teal rounded-full flex items-center justify-center mx-auto border border-olak-teal/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-olak-teal bg-olak-teal/10 px-3 py-1 rounded-full border border-olak-teal/30">
              {t.booking_success}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {confirmedBooking.booking_code}
            </h3>
            <p className="text-sm text-slate-300 mt-1 font-urdu">
              {isUrdu 
                ? 'آپ کی بکنگ درج کرلی گئی ہے۔ قریبی کیپٹن کو اطلاع روانہ کردی گئی ہے۔' 
                : 'Your ride request has been dispatched to nearby verified captains in Turbat.'}
            </p>
          </div>

          {/* Trip Summary Card */}
          <div className="bg-olak-navy-950/80 rounded-2xl p-4 border border-olak-navy-800 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-300 pb-2 border-b border-olak-navy-800">
              <span className="text-slate-400">{isUrdu ? 'سروس' : 'Service'}:</span>
              <span className="font-bold text-white uppercase">{confirmedBooking.service_type}</span>
            </div>
            <div className="flex justify-between text-slate-300 pb-2 border-b border-olak-navy-800">
              <span className="text-slate-400">{isUrdu ? 'پک اپ' : 'Pickup'}:</span>
              <span className="font-semibold text-slate-200">{confirmedBooking.pickup_location}</span>
            </div>
            <div className="flex justify-between text-slate-300 pb-2 border-b border-olak-navy-800">
              <span className="text-slate-400">{isUrdu ? 'منزل' : 'Dropoff'}:</span>
              <span className="font-semibold text-slate-200">{confirmedBooking.dropoff_location}</span>
            </div>
            <div className="flex justify-between text-slate-300 pt-1 text-base">
              <span className="font-bold text-olak-teal">{isUrdu ? 'تخمینی کرایہ' : 'Fare'}:</span>
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
              {isUrdu ? 'نئی بکنگ کریں' : 'Book Another Ride'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Header Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-olak-teal"></span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isUrdu ? 'سواری کی فوری بکنگ' : 'Instant Ride Request'}
              </h3>
            </div>
            <span className="text-xs text-olak-teal font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{isUrdu ? '3-7 منٹ میں آمد' : '3-7 Min Pickup'}</span>
            </span>
          </div>

          {/* Service Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-olak-navy-950 p-1.5 rounded-2xl border border-olak-navy-800">
            {rates.filter(r => r.service_type !== 'delivery').map((rate) => {
              const isSelected = selectedService === rate.service_type;
              return (
                <button
                  key={rate.id}
                  type="button"
                  onClick={() => setSelectedService(rate.service_type)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-b from-olak-teal to-emerald-600 text-olak-navy-950 font-bold shadow-lg shadow-olak-teal/20 scale-[1.02]' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-olak-navy-900'
                  }`}
                >
                  <div className="mb-1">
                    {rate.service_type === 'bike' && <Bike className="w-5 h-5" />}
                    {rate.service_type === 'rickshaw' && <Truck className="w-5 h-5" />}
                    {rate.service_type === 'car' && <Car className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-bold truncate max-w-full">
                    {isUrdu ? rate.service_name_urdu : rate.service_name}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-olak-navy-950/80 font-semibold' : 'text-slate-500'}`}>
                    Base PKR {rate.base_fare}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Location Selection */}
          <div className="space-y-3.5">
            {/* Pickup */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-olak-teal" />
                  <span>{t.pickup_label}</span>
                </span>
                <span className="text-[10px] text-slate-400">Turbat</span>
              </label>

              <select
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  setCustomPickup('');
                }}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-olak-teal transition"
              >
                {TURBAT_LANDMARKS.map((lm) => (
                  <option key={lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu} (${lm.area})` : `${lm.name} (${lm.area})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropoff */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.dropoff_label}</span>
                </span>
                <span className="text-[10px] text-slate-400">Turbat</span>
              </label>

              <select
                value={dropoff}
                onChange={(e) => {
                  setDropoff(e.target.value);
                  setCustomDropoff('');
                }}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-olak-teal transition"
              >
                {TURBAT_LANDMARKS.map((lm) => (
                  <option key={lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu} (${lm.area})` : `${lm.name} (${lm.area})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Specific Address (Optional) */}
            <input
              type="text"
              placeholder={isUrdu ? 'کوئی خاص گلی یا مکان نمبر (اختیاری)...' : 'Specific street, office, or house number (optional)...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-olak-navy-950/60 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
            />
          </div>

          {/* Customer Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
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
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
            </div>
          </div>

          {/* Live Fare Estimation Box */}
          <div className="bg-gradient-to-r from-olak-navy-950 via-olak-navy-850 to-olak-navy-950 border border-olak-teal/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                {t.est_fare} (~{estimatedDistance.toFixed(1)} KM)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-olak-teal">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {estimatedFare}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 space-y-0.5">
              <span className="block text-slate-300">
                {isUrdu ? 'کیش آن پک اپ' : 'Cash on Pickup'}
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'کوئی پوشیدہ چارج نہیں' : 'Zero Hidden Fees'}</span>
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-olak-teal to-emerald-500 hover:from-emerald-400 hover:to-olak-teal text-olak-navy-950 font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-teal-glow hover:shadow-teal-glow transition transform active:scale-[0.99] disabled:opacity-50 text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-olak-navy-950 border-t-transparent rounded-full animate-spin"></span>
                <span>{isUrdu ? 'درخواست بھیجی جا رہی ہے...' : 'Connecting with Captains...'}</span>
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
    </div>
  );
};
