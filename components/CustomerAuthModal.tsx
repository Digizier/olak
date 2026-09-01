'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { loginCustomer, registerCustomer } from '@/lib/db';
import { Customer } from '@/lib/types';
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Sparkles,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  serviceTitle?: string;
  estimatedFare?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  defaultTab?: 'register' | 'login';
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  serviceTitle = 'Ride Booking',
  estimatedFare,
  pickupLocation,
  dropoffLocation,
  defaultTab = 'register',
}) => {
  const { isUrdu } = useLanguage();
  const [tab, setTab] = useState<'register' | 'login'>(defaultTab);

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم اپنا پورا نام اور موبائل نمبر درج کریں۔' : 'Please enter your Full Name and Mobile Number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const cleanPhone = phone.trim();
      const cleanEmail = email.trim() ? email.trim().toLowerCase() : `${cleanPhone.replace(/\D/g, '') || Date.now()}@olak.pk`;
      
      const newCustomer = await registerCustomer({
        full_name: fullName.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password: 'customer_guest',
      });

      setIsLoading(false);
      onSuccess(newCustomer);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg(isUrdu ? 'اکاؤنٹ بنانے میں مسئلہ پیش آیا، دوبارہ کوشش کریں۔' : 'Registration failed. Please try again.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم اپنا موبائل نمبر یا ای میل درج کریں۔' : 'Please enter your registered Phone number or Email.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const customer = await loginCustomer(loginIdentifier.trim());
      if (customer) {
        setIsLoading(false);
        onSuccess(customer);
      } else {
        // If not found, suggest registering
        setIsLoading(false);
        setErrorMsg(isUrdu ? 'یہ نمبر رجسٹرڈ نہیں ہے۔ براہ کرم نیچے "نیا اکاؤنٹ بنائیں" پر کلک کریں۔' : 'Phone not found. Please switch to Register tab to create your account.');
        setTab('register');
        setPhone(loginIdentifier);
      }
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setErrorMsg('Login failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-md w-full space-y-5 shadow-2xl relative my-auto animate-scaleIn">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {isUrdu ? 'کسٹمر تصدیق ضروری ہے' : 'Customer Verification Required'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {tab === 'register' 
              ? (isUrdu ? 'پہلے رجسٹریشن مکمل کریں' : 'Register to Confirm Ride') 
              : (isUrdu ? 'کسٹمر لاگ ان کریں' : 'Customer Sign In')}
          </h3>

          <p className="text-xs text-slate-500 font-urdu">
            {isUrdu 
              ? 'سواری بک کرنے کے لیے اپنا نام اور موبائل نمبر درج کریں۔ رجسٹریشن کے فوراً بعد آپ کی رائیڈ ایکسیپٹ ہو جائے گی۔' 
              : 'Sign in or register your details once. Your booking will be confirmed and dispatched immediately.'}
          </p>
        </div>

        {/* Route & Fare Summary Chip */}
        {(pickupLocation || dropoffLocation || estimatedFare) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 font-semibold">
              <span className="truncate max-w-[200px]">{pickupLocation?.split(',')[0]} ➔ {dropoffLocation?.split(',')[0]}</span>
              {estimatedFare && (
                <span className="font-black text-emerald-600 text-sm">
                  PKR {estimatedFare}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{isUrdu ? 'رجسٹریشن کے بعد یہ رائیڈ فوری کنفرم ہو جائے گی' : 'This booking will be placed immediately upon submitting'}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher: Register (Default) vs Sign In */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              tab === 'register' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isUrdu ? 'نیا کسٹمر رجسٹریشن' : 'New Customer (Register)'}
          </button>

          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              tab === 'login' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isUrdu ? 'پہلے سے اکاؤنٹ ہے؟ لاگ ان' : 'Sign In (Existing)'}
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold animate-shake">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: REGISTRATION FORM (Default) */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isUrdu ? 'آپ کا پورا نام' : 'Full Name (as per CNIC)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={isUrdu ? 'مثلاً: اسلم بلوچ' : 'e.g. Aslam Baloch'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isUrdu ? 'واٹس ایپ یا موبائل نمبر' : 'WhatsApp / Mobile Number'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="0334 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isUrdu ? 'کیپٹن اس نمبر پر رائیڈ کے وقت رابطہ کرے گا' : 'Captain will contact you on this number'}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isUrdu ? 'ای میل ایڈریس (اختیاری)' : 'Email Address (Optional)'}
              </label>
              <input
                type="email"
                placeholder="aslam@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition transform active:scale-[0.99] disabled:opacity-50 text-sm cursor-pointer mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isUrdu ? 'رجسٹریشن مکمل ہو رہی ہے...' : 'Creating Account & Booking...'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{isUrdu ? 'رجسٹر کریں اور رائیڈ بک کریں' : 'Register & Confirm Booking'}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN IN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isUrdu ? 'موبائل نمبر یا ای میل' : 'Registered Mobile Number or Email'}
              </label>
              <input
                type="text"
                required
                placeholder="0334 1234567 or email@..."
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition transform active:scale-[0.99] disabled:opacity-50 text-sm cursor-pointer mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isUrdu ? 'لاگ ان ہو رہا ہے...' : 'Signing In & Booking...'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{isUrdu ? 'لاگ ان کریں اور رائیڈ بک کریں' : 'Sign In & Confirm Booking'}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>
        )}

        {/* Footer info link */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/customer/"
            target="_blank"
            className="text-[11px] text-slate-500 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 transition"
          >
            <span>{isUrdu ? 'کسٹمر پورٹل الگ ونڈو میں کھولیں' : 'Open Full Customer Portal in New Tab'}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>
  );
};
