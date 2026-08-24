'use client';

import React, { useState } from 'react';
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
  Pill
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
  const [parcelWeight, setParcelWeight] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Delivery Fare Formula
  const baseRate = 100;
  const perKmRate = 30;
  const estimatedDistance = 4.5;
  const weightSurcharge = parcelWeight > 3 ? (parcelWeight - 3) * 20 : 0;
  const estimatedFare = Math.max(150, Math.round(baseRate + (estimatedDistance * perKmRate) + weightSurcharge));

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
        delivery_weight_kg: parcelWeight,
        delivery_receiver_name: receiverName,
        delivery_receiver_phone: receiverPhone,
        notes: notes,
        estimated_distance_km: estimatedDistance,
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
          colors: ['#00D084', '#10B981', '#ffffff']
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert('Delivery booking failed. Please try again.');
    }
  };

  return (
    <div className="bg-olak-navy-900/95 border border-olak-navy-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
      {confirmedBooking ? (
        <div className="text-center py-6 sm:py-8 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-olak-teal/20 text-olak-teal rounded-full flex items-center justify-center mx-auto border border-olak-teal/40">
            <Package className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-olak-teal bg-olak-teal/10 px-3 py-1 rounded-full border border-olak-teal/30">
              {isUrdu ? 'پارسل ڈسپیچ درج ہوگیا' : 'Parcel Order Created'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {confirmedBooking.booking_code}
            </h3>
            <p className="text-sm text-slate-300 mt-1 font-urdu">
              {isUrdu 
                ? 'رائڈر کو فوری پارسل پک اپ کے لیے اطلاع روانہ کردی گئی ہے۔' 
                : 'A rider is being assigned to collect your parcel in Turbat.'}
            </p>
          </div>

          <div className="bg-olak-navy-950/80 rounded-2xl p-4 border border-olak-navy-800 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-300 pb-1.5 border-b border-olak-navy-800">
              <span className="text-slate-400">{isUrdu ? 'سامان' : 'Item'}:</span>
              <span className="font-semibold text-slate-200">{confirmedBooking.delivery_parcel_type} ({confirmedBooking.delivery_weight_kg} KG)</span>
            </div>
            <div className="flex justify-between text-slate-300 pb-1.5 border-b border-olak-navy-800">
              <span className="text-slate-400">{isUrdu ? 'وصول کنندہ' : 'Receiver'}:</span>
              <span className="font-semibold text-slate-200">{confirmedBooking.delivery_receiver_name || 'N/A'} ({confirmedBooking.delivery_receiver_phone})</span>
            </div>
            <div className="flex justify-between text-slate-300 pt-1 text-base">
              <span className="font-bold text-olak-teal">{isUrdu ? 'ڈلیوری کرایہ' : 'Delivery Fare'}:</span>
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
              {isUrdu ? 'دوسرا پارسل بھیجیں' : 'Send Another Parcel'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-olak-teal"></span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isUrdu ? 'تربت پارسل و ڈلیوری سروس' : 'Turbat Parcel Delivery'}
              </h3>
            </div>
            <span className="text-xs text-olak-teal font-medium">
              {isUrdu ? 'دروازے سے دروازے تک' : 'Door-to-Door'}
            </span>
          </div>

          {/* Parcel Category Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {isUrdu ? 'پارسل کی قسم منتخب کریں' : 'Select Parcel Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: isUrdu ? 'دستاویزات' : 'Documents', val: 'Documents & Files', icon: FileText },
                { label: isUrdu ? 'کھانا / گروسری' : 'Food / Grocery', val: 'Food & Groceries', icon: Utensils },
                { label: isUrdu ? 'سامان / الیکٹرانکس' : 'Goods / Devices', val: 'Electronics & Goods', icon: Smartphone },
                { label: isUrdu ? 'ادویات' : 'Medicine', val: 'Medicine & Pharmacy', icon: Pill },
              ].map((item) => {
                const isSelected = parcelType === item.val;
                const Icon = item.icon;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setParcelType(item.val)}
                    className={`flex items-center gap-2 py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-olak-teal/20 border-olak-teal text-olak-teal shadow-sm'
                        : 'bg-olak-navy-950 border-olak-navy-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-olak-teal" />
                <span>{isUrdu ? 'کہاں سے اٹھانا ہے (پک اپ)' : 'Pickup Point'}</span>
              </label>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-olak-teal"
              >
                {TURBAT_LANDMARKS.map(lm => (
                  <option key={lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu}` : `${lm.name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isUrdu ? 'کہاں پہنچانا ہے (منزل)' : 'Delivery Destination'}</span>
              </label>
              <select
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-olak-teal"
              >
                {TURBAT_LANDMARKS.map(lm => (
                  <option key={lm.name} value={lm.name}>
                    {isUrdu ? `${lm.nameUrdu}` : `${lm.name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sender & Receiver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {isUrdu ? 'بھیجنے والے کی تفصیل' : 'Sender Info'}
              </span>
              <input
                type="text"
                required
                placeholder={isUrdu ? 'بھیجنے والے کا نام' : 'Sender Full Name'}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
              <input
                type="tel"
                required
                placeholder={isUrdu ? 'بھیجنے والے کا فون' : 'Sender WhatsApp / Mobile'}
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {isUrdu ? 'وصول کنندہ کی تفصیل' : 'Receiver Info'}
              </span>
              <input
                type="text"
                placeholder={isUrdu ? 'وصول کنندہ کا نام' : 'Receiver Full Name'}
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
              <input
                type="tel"
                required
                placeholder={isUrdu ? 'وصول کنندہ کا فون نمبر' : 'Receiver Mobile Number'}
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
            </div>
          </div>

          {/* Weight & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isUrdu ? 'وزن (کلوگرام میں)' : 'Weight (KG)'}
              </label>
              <select
                value={parcelWeight}
                onChange={(e) => setParcelWeight(Number(e.target.value))}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-olak-teal"
              >
                <option value={1}>1 KG (PKR 150 min)</option>
                <option value={2}>2 KG</option>
                <option value={3}>3 KG (Standard Base)</option>
                <option value={5}>5 KG (+ PKR 40)</option>
                <option value={10}>10 KG (+ PKR 140)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isUrdu ? 'کوئی خاص ہدایت (اختیاری)' : 'Special Handling Notes'}
              </label>
              <input
                type="text"
                placeholder={isUrdu ? 'نازک سامان، کال کر کے آئیں وغیرہ' : 'Fragile, call on arrival, etc.'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-olak-navy-950 border border-olak-navy-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-olak-teal"
              />
            </div>
          </div>

          {/* Fare Summary & Submit */}
          <div className="bg-gradient-to-r from-olak-navy-950 via-olak-navy-850 to-olak-navy-950 border border-olak-teal/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                {isUrdu ? 'تخمینی ڈلیوری چارجز' : 'Estimated Delivery Charge'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-olak-teal">PKR</span>
                <span className="text-2xl sm:text-3xl font-black text-white">{estimatedFare}</span>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{isUrdu ? 'محفوظ و تیز ترین' : 'Fast & Secure'}</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-olak-teal to-emerald-500 hover:from-emerald-400 hover:to-olak-teal text-olak-navy-950 font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-teal-glow transition active:scale-[0.99] disabled:opacity-50 text-base"
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
