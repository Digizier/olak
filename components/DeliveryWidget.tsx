'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { TURBAT_LANDMARKS } from '@/lib/constants';
import { createBooking } from '@/lib/db';
import { Booking } from '@/lib/types';
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
  Sliders,
  Scale
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DeliveryWidget = () => {
  const { t, isUrdu } = useLanguage();
  
  const [pickup, setPickup] = useState(TURBAT_LANDMARKS[0].name);
  const [dropoff, setDropoff] = useState(TURBAT_LANDMARKS[1].name);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [parcelType, setParcelType] = useState('Documents & Files');
  
  // Customizable KM and KG
  const [distanceKm, setDistanceKm] = useState<number>(4.0);
  const [parcelWeightKg, setParcelWeightKg] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Update distance dynamically when landmarks change
  useEffect(() => {
    const pIndex = TURBAT_LANDMARKS.findIndex(l => l.name === pickup);
    const dIndex = TURBAT_LANDMARKS.findIndex(l => l.name === dropoff);
    if (pIndex >= 0 && dIndex >= 0 && pIndex !== dIndex) {
      const calculated = Math.max(1.5, Math.round((Math.abs(pIndex - dIndex) * 1.4 + 1.0) * 10) / 10);
      setDistanceKm(calculated);
    }
  }, [pickup, dropoff]);

  // Accurate Delivery Fare Formula with Editable KM & KG
  const baseRate = 100;
  const perKmRate = 25;
  // Weight surcharge: 1-2 KG is included in base. Above 2 KG, PKR 20 per extra KG.
  const weightSurcharge = parcelWeightKg > 2 ? Math.round((parcelWeightKg - 2) * 20) : 0;
  const rawFare = baseRate + (distanceKm * perKmRate) + weightSurcharge;
  const estimatedFare = Math.max(150, Math.round(rawFare / 10) * 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderPhone || !receiverPhone) {
      alert(isUrdu ? 'برائے مہربانی بھیجنے اور وصول کرنے والے کی تفصیلات مکمل کریں۔' : 'Please fill sender and receiver contact details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        service_type: 'delivery',
        customer_name: senderName,
        customer_phone: senderPhone,
        pickup_location: pickup,
        dropoff_location: dropoff,
        delivery_parcel_type: parcelType,
        delivery_weight_kg: parcelWeightKg,
        delivery_receiver_name: receiverName,
        delivery_receiver_phone: receiverPhone,
        notes: notes,
        estimated_distance_km: distanceKm,
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
      alert('Delivery booking failed. Please try again.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
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
                ? 'رائڈر کو فوری پارسل پک اپ کے لیے اطلاع روانہ کردی گئی ہے۔' 
                : 'A rider is being assigned to collect your parcel in Turbat.'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-700 pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'سامان' : 'Item'}:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.delivery_parcel_type} ({confirmedBooking.delivery_weight_kg} KG)</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'فاصلہ' : 'Distance'}:</span>
              <span className="font-bold text-emerald-700">{confirmedBooking.estimated_distance_km} KM</span>
            </div>
            <div className="flex justify-between text-slate-700 pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">{isUrdu ? 'وصول کنندہ' : 'Receiver'}:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.delivery_receiver_name || 'N/A'} ({confirmedBooking.delivery_receiver_phone})</span>
            </div>
            <div className="flex justify-between text-slate-900 pt-1 text-base">
              <span className="font-bold text-emerald-600">{isUrdu ? 'ڈلیوری کرایہ' : 'Delivery Fare'}:</span>
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
              {isUrdu ? 'دوسرا پارسل بھیجیں' : 'Send Another Parcel'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {isUrdu ? 'تربت پارسل و ڈلیوری سروس' : 'Turbat Parcel Delivery'}
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {isUrdu ? 'دروازے سے دروازے تک' : 'Door-to-Door'}
            </span>
          </div>

          {/* Parcel Category Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isUrdu ? 'پارسل کی قسم منتخب کریں' : 'Select Parcel Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: isUrdu ? 'دستاویزات' : 'Documents', val: 'Documents & Files', icon: FileText },
                { label: isUrdu ? 'کھانا / گروسری' : 'Food / Grocery', val: 'Food & Groceries', icon: Utensils },
                { label: isUrdu ? 'سامان / آلات' : 'Electronics & Goods', val: 'Electronics & Goods', icon: Smartphone },
                { label: isUrdu ? 'ادویات' : 'Medicine', val: 'Medicine & Pharmacy', icon: Pill },
              ].map((item) => {
                const isSelected = parcelType === item.val;
                const Icon = item.icon;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setParcelType(item.val)}
                    className={`flex items-center gap-2 py-2 px-2.5 rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isUrdu ? 'کہاں سے اٹھانا ہے (پک اپ)' : 'Pickup Point'}</span>
              </label>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              >
                {TURBAT_LANDMARKS.map(lm => (
                  <option key={lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu}` : `${lm.name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-teal-700" />
                <span>{isUrdu ? 'کہاں پہنچانا ہے (منزل)' : 'Delivery Destination'}</span>
              </label>
              <select
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              >
                {TURBAT_LANDMARKS.map(lm => (
                  <option key={lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu}` : `${lm.name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* EDITABLE KM & KG PRICING SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Editable Distance (KM) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isUrdu ? 'ڈلیوری کا فاصلہ (کلو میٹر)' : 'Distance (KM - Editable)'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">PKR 25/KM</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDistanceKm(Math.max(0.5, Math.round((distanceKm - 0.5) * 10) / 10))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-black flex items-center justify-center hover:bg-slate-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="100"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Math.max(0.5, parseFloat(e.target.value) || 1.0))}
                    className="flex-1 bg-white border border-slate-300 font-black text-center text-sm py-1.5 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setDistanceKm(Math.round((distanceKm + 0.5) * 10) / 10)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-black flex items-center justify-center hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Editable Weight (KG) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-teal-700" />
                    <span>{isUrdu ? 'پارسل کا وزن (کلوگرام)' : 'Parcel Weight (KG)'}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{parcelWeightKg > 2 ? `+PKR ${weightSurcharge}` : 'Base weight'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setParcelWeightKg(Math.max(0.5, Math.round((parcelWeightKg - 0.5) * 10) / 10))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-black flex items-center justify-center hover:bg-slate-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={parcelWeightKg}
                    onChange={(e) => setParcelWeightKg(Math.max(0.5, parseFloat(e.target.value) || 1.0))}
                    className="flex-1 bg-white border border-slate-300 font-black text-center text-sm py-1.5 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setParcelWeightKg(Math.round((parcelWeightKg + 0.5) * 10) / 10)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-black flex items-center justify-center hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Sender & Receiver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {isUrdu ? 'بھیجنے والے کی تفصیل' : 'Sender Info'}
              </span>
              <input
                type="text"
                required
                placeholder={isUrdu ? 'بھیجنے والے کا نام' : 'Sender Full Name'}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                required
                placeholder={isUrdu ? 'بھیجنے والے کا فون' : 'Sender WhatsApp / Mobile'}
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {isUrdu ? 'وصول کنندہ کی تفصیل' : 'Receiver Info'}
              </span>
              <input
                type="text"
                placeholder={isUrdu ? 'وصول کنندہ کا نام' : 'Receiver Full Name'}
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                required
                placeholder={isUrdu ? 'وصول کنندہ کا فون نمبر' : 'Receiver Mobile Number'}
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
              placeholder={isUrdu ? 'کوئی خاص ہدایت: نازک سامان، کال کر کے آئیں وغیرہ' : 'Special notes: Fragile, call before pickup, etc.'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Fare Summary & Submit */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {isUrdu ? 'تخمینی ڈلیوری چارجز' : 'Estimated Delivery Fare'} ({distanceKm} KM, {parcelWeightKg} KG)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-emerald-600">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{estimatedFare}</span>
              </div>
            </div>
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{isUrdu ? 'محفوظ و تیز ترین' : 'Fast & Secure'}</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] disabled:opacity-50 text-base cursor-pointer"
          >
            {isSubmitting ? (
              <span>{isUrdu ? 'پارسل درج ہو رہا ہے...' : 'Booking Courier...'}</span>
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
    </div>
  );
};
