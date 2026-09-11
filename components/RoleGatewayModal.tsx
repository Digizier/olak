'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Car, 
  Bike, 
  Package, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Award,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getCurrentCustomer, getCurrentCaptain } from '@/lib/db';

interface RoleGatewayModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export const RoleGatewayModal: React.FC<RoleGatewayModalProps> = ({
  isOpen: propIsOpen,
  onClose,
  forceShow = false,
}) => {
  const router = useRouter();
  const { isUrdu } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      return;
    }
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      return;
    }

    // Auto prompt on first visit if no customer and no captain logged in
    if (typeof window !== 'undefined') {
      const hasChosenRole = localStorage.getItem('olak_user_role_selected');
      const currentCust = getCurrentCustomer();
      const currentCapt = getCurrentCaptain();

      if (!hasChosenRole && !currentCust && !currentCapt) {
        setIsOpen(true);
      }
    }
  }, [propIsOpen, forceShow]);

  const selectRole = (role: 'customer' | 'captain') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('olak_user_role_selected', role);
    }
    setIsOpen(false);
    if (onClose) onClose();

    if (role === 'captain') {
      router.push('/captain/');
    } else {
      router.push('/customer/');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute left-1/2 -top-10 w-44 h-44 bg-teal-400/15 rounded-full blur-2xl pointer-events-none" />

          {onClose && (
            <button
              onClick={() => {
                setIsOpen(false);
                onClose();
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white flex items-center justify-center transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-bold text-emerald-100 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>{isUrdu ? 'خوش آمدید اولاک موبلٹی میں' : 'Welcome to OLAK Mobility'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isUrdu ? 'آپ اولاک کو کس طرح استعمال کرنا چاہتے ہیں؟' : 'How would you like to use OLAK today?'}
          </h2>
          <p className="text-sm text-emerald-100/90 mt-1.5 max-w-md leading-relaxed">
            {isUrdu 
              ? 'سواری حاصل کرنے یا ڈرائیو کر کے کمانے کے لیے اپنا پسندیدہ پورٹل منتخب کریں۔'
              : 'Select your portal to book rides, deliver parcels, or drive and earn daily with 100% verified security.'}
          </p>
        </div>

        {/* Role Options Container */}
        <div className="p-5 sm:p-7 space-y-4 bg-slate-50/50">
          {/* Option 1: Customer / Passenger */}
          <button
            onClick={() => selectRole('customer')}
            className="group w-full text-left bg-white hover:bg-emerald-50/40 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition duration-200 shadow-xs">
                <Car className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition">
                    {isUrdu ? '🚗 سواری یا ڈلیوری چاہیے (کسٹمر پورٹل)' : '🚗 I Need a Ride / Delivery'}
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                    {isUrdu ? 'مسافر' : 'Customer'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {isUrdu 
                    ? 'بائیک، رکشہ، کار اور پارسل ڈلیوری سیکنڈز میں بک کریں۔ تربت و بلوچستان ہائی ویز پر محفوظ سفر۔'
                    : 'Book bikes, rickshaws, cars, and parcel delivery in seconds across Turbat and Balochistan highways.'}
                </p>

                <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CNIC Verified
                  </span>
                  <span>•</span>
                  <span>Live Map Routing</span>
                  <span>•</span>
                  <span>Fair Fares</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition self-center shrink-0" />
            </div>
          </button>

          {/* Option 2: Captain / Driver */}
          <button
            onClick={() => selectRole('captain')}
            className="group w-full text-left bg-white hover:bg-emerald-50/40 border-2 border-slate-200 hover:border-emerald-600 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 group-hover:bg-teal-700 group-hover:text-white transition duration-200 shadow-xs">
                <Bike className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-800 transition">
                    {isUrdu ? '🚖 اولاک کے ساتھ ڈرائیو کریں (کیپٹن پورٹل)' : '🚖 Drive & Earn with OLAK'}
                  </h3>
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full shrink-0">
                    {isUrdu ? 'ڈرائیور' : 'Captain'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {isUrdu 
                    ? 'اپنی بائیک یا کار رجسٹر کروائیں، 24 گھنٹے میں تصدیق حاصل کریں اور روزانہ کیش کمائیں۔ صرف 10% کمیشن۔'
                    : 'Register your bike, car or rickshaw, get verified in 24 hours, and earn daily cash. Only 10% commission.'}
                </p>

                <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-teal-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Daily Cash Earnings
                  </span>
                  <span>•</span>
                  <span>Flexible Timings</span>
                  <span>•</span>
                  <span>Fast Approvals</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition self-center shrink-0" />
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isUrdu ? '100% محفوظ و تصدیق شدہ پلیٹ فارم' : '100% Safe & Verified Balochistan Platform'}</span>
          </div>
          <span>{isUrdu ? 'آپ بعد میں بھی مینیو سے رول تبدیل کر سکتے ہیں' : 'You can switch roles anytime from the menu'}</span>
        </div>
      </div>
    </div>
  );
};
