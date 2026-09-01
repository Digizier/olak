'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { getBookingByCode, getCaptains } from '@/lib/db';
import { Booking, Captain } from '@/lib/types';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Car, 
  Bike, 
  Package, 
  CheckCircle2, 
  Clock, 
  Phone, 
  ShieldCheck, 
  User, 
  MessageCircle,
  Truck,
  ArrowRight
} from 'lucide-react';

function TrackContent() {
  const { t, isUrdu } = useLanguage();
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get('code') || '';

  const [bookingCode, setBookingCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [captain, setCaptain] = useState<Captain | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchStatus = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await getBookingByCode(codeToSearch.trim());
      setBooking(data);
      if (data && data.assigned_captain_id) {
        const allCaptains = await getCaptains();
        const cap = allCaptains.find(c => c.id === data.assigned_captain_id);
        setCaptain(cap || null);
      } else {
        setCaptain(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchStatus(initialCode);
    }
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(bookingCode);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'assigned': return 2;
      case 'arrived': return 3;
      case 'in_progress': return 4;
      case 'completed': return 5;
      default: return 0;
    }
  };

  const currentStep = booking ? getStatusStep(booking.booking_status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-grow">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          {isUrdu ? 'لائیو ٹرپ و پارسل ٹریکر' : 'Live Trip & Parcel Tracker'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          {isUrdu ? 'اپنی سواری یا پارسل کا اسٹیٹس چیک کریں' : 'Track Your Ride or Delivery'}
        </h1>
        <p className="text-sm text-slate-600 font-urdu">
          {isUrdu 
            ? 'اپنا بکنگ ٹوکن کوڈ (مثلاً: OLK-8492) درج کریں اور کیپٹن کی لائیو صورتحال معلوم کریں۔' 
            : 'Enter your Booking Code (e.g. OLK-8492) to view live assigned captain and trip progress.'}
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-300 focus-within:border-emerald-500 shadow-lg">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-3" />
            <input
              type="text"
              required
              placeholder="e.g. OLK-8492"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
              className="w-full bg-transparent pl-10 pr-3 py-2 text-slate-900 font-mono uppercase tracking-wider text-base focus:outline-none placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>{isUrdu ? 'تلاش کریں' : 'Track'}</span>
            )}
          </button>
        </div>
      </form>

      {/* Result View */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-urdu">
            {isUrdu ? 'ڈیٹا حاصل کیا جا رہا ہے...' : 'Fetching live trip status...'}
          </p>
        </div>
      ) : booking ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
          
          {/* Top Token Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {isUrdu ? 'بکنگ ٹوکن کوڈ' : 'Booking Token'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                {booking.booking_code}
              </h2>
              <span className="text-xs text-slate-500">
                Created: {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                booking.booking_status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : booking.booking_status === 'cancelled'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse'
              }`}>
                ● {booking.booking_status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {booking.booking_status !== 'cancelled' && (
            <div className="py-2">
              <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs">
                {[
                  { step: 1, label: isUrdu ? 'درخواست' : 'Requested' },
                  { step: 2, label: isUrdu ? 'کیپٹن تفویض' : 'Assigned' },
                  { step: 3, label: isUrdu ? 'پہنچ گیا' : 'Arrived' },
                  { step: 4, label: isUrdu ? 'سفر جاری' : 'On Trip' },
                  { step: 5, label: isUrdu ? 'مکمل' : 'Completed' },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                      currentStep >= s.step
                        ? 'bg-emerald-600 text-white font-black shadow-md'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {currentStep >= s.step ? '✓' : s.step}
                    </div>
                    <span className={`truncate w-full ${currentStep >= s.step ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Assigned Captain Card (if assigned) */}
          {captain ? (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black text-lg">
                  {captain.full_name.charAt(0)}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                    {isUrdu ? 'تفویض شدہ کیپٹن' : 'Assigned Captain'}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    {captain.full_name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {captain.vehicle_name} • <span className="font-mono text-emerald-700 font-bold">{captain.vehicle_number_plate}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${captain.phone}`}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Captain</span>
                </a>

                {captain.whatsapp_number && (
                  <a
                    href={`https://wa.me/${captain.whatsapp_number.replace(/\D/g, '')}?text=Hello%20Captain%20${encodeURIComponent(captain.full_name)}%20I%20am%20passenger%20for%20trip%20${booking.booking_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl border border-emerald-200 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-urdu">
              {isUrdu 
                ? 'قریبی کیپٹن تفویض کیا جا رہا ہے۔ ایڈمن ڈسپیچ پینل جلد کیپٹن مقرر کرے گا۔' 
                : 'Searching and assigning the nearest available verified captain in Turbat...'}
            </div>
          )}

          {/* Trip Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">{isUrdu ? 'پک اپ' : 'Pickup'}:</span>
                  <span className="text-slate-900 font-semibold">{booking.pickup_location}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-500 block">{isUrdu ? 'منزل' : 'Dropoff'}:</span>
                  <span className="text-slate-900 font-semibold">{booking.dropoff_location}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isUrdu ? 'سروس کی قسم' : 'Service'}:</span>
                <span className="font-bold text-slate-900 uppercase">{booking.service_type}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isUrdu ? 'مسافر / صارف' : 'Customer'}:</span>
                <span className="font-semibold text-slate-900">{booking.customer_name}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-base">
                <span className="font-bold text-emerald-600">{isUrdu ? 'کرایہ' : 'Fare'}:</span>
                <span className="font-black text-emerald-600">PKR {booking.final_fare || booking.estimated_fare}</span>
              </div>
            </div>
          </div>

          {/* Helpline Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Turbat Dispatch Desk: <strong className="text-slate-800">+92 335 0455599</strong></span>
            <button
              onClick={() => fetchStatus(booking.booking_code)}
              className="text-emerald-700 hover:underline font-bold"
            >
              ↻ Refresh Live Status
            </button>
          </div>

        </div>
      ) : searched ? (
        <div className="bg-white border border-red-200 rounded-3xl p-8 text-center space-y-3 shadow-md">
          <h3 className="text-xl font-bold text-slate-900">
            {isUrdu ? 'کوئی بکنگ نہیں ملی' : 'Booking Not Found'}
          </h3>
          <p className="text-sm text-slate-600 font-urdu">
            {isUrdu 
              ? 'درج کیا گیا ٹوکن کوڈ درست نہیں ہے یا بکنگ ایکسپائر ہوچکی ہے۔ برائے مہربانی کوڈ دوبارہ چیک کریں۔' 
              : 'Please check your booking token code or contact OLAK Turbat helpline.'}
          </p>
        </div>
      ) : null}

    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading Tracker...</div>}>
        <TrackContent />
      </Suspense>
      <Footer />
    </div>
  );
}
