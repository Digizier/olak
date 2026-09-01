'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OlakLogo } from '@/components/OlakLogo';
import { useLanguage } from '@/lib/LanguageContext';
import { getCurrentCustomer, getCurrentCaptain, logoutCustomer, logoutCaptain } from '@/lib/db';
import { Customer, Captain } from '@/lib/types';
import { 
  Phone, 
  Menu, 
  X, 
  Car, 
  Search, 
  UserPlus, 
  Lock,
  Globe,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  Mail
} from 'lucide-react';

export const Navbar = () => {
  const { lang, setLang, t, isUrdu } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentCustomer, setCurrentCustomerState] = useState<Customer | null>(null);
  const [currentCaptain, setCurrentCaptainState] = useState<Captain | null>(null);

  useEffect(() => {
    const updateAuth = () => {
      setCurrentCustomerState(getCurrentCustomer());
      setCurrentCaptainState(getCurrentCaptain());
    };
    updateAuth();

    window.addEventListener('olak_customer_auth_changed', updateAuth);
    window.addEventListener('olak_captain_auth_changed', updateAuth);
    return () => {
      window.removeEventListener('olak_customer_auth_changed', updateAuth);
      window.removeEventListener('olak_captain_auth_changed', updateAuth);
    };
  }, []);

  const handleLogout = () => {
    if (currentCustomer) logoutCustomer();
    if (currentCaptain) logoutCaptain();
    setCurrentCustomerState(null);
    setCurrentCaptainState(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-colors">
      {/* Top Notification Strip */}
      <div className="bg-slate-100/90 border-b border-slate-200 text-[11px] py-1.5 px-3 sm:px-4 text-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-emerald-700 truncate max-w-[200px] sm:max-w-none">
              {t.hero_badge}
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline text-slate-600 font-urdu font-semibold">
              سفر ہر قدم آسان
            </span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <a 
              href="mailto:olak.tbt@gmail.com" 
              className="hidden lg:flex items-center gap-1 text-slate-600 hover:text-emerald-600 font-medium transition"
            >
              <Mail className="w-3 h-3 text-emerald-600" />
              <span>olak.tbt@gmail.com</span>
            </a>

            <a 
              href="tel:+923350455599" 
              className="flex items-center gap-1 text-slate-800 hover:text-emerald-600 font-bold transition"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>+92 335 0455599</span>
            </a>

            <button
              onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
              className="flex items-center gap-1 bg-white hover:bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-slate-300 shadow-xs transition"
              title="Switch Language"
            >
              <Globe className="w-3 h-3 text-emerald-600" />
              <span>{lang === 'ur' ? 'English' : 'اردو'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Container in Pure White */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo with Emblem (O) + LAK on Crisp White */}
          <Link href="/" className="flex items-center gap-3 group py-2">
            <OlakLogo size="md" textColor="text-slate-900" innerCircleColor="#ffffff" />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-2.5">
              <span className="text-xs font-bold text-emerald-600 font-urdu">
                اولاک تربت
              </span>
              <span className="text-[10px] text-slate-500 font-urdu">
                سفر ہر قدم آسان
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link 
              href="/" 
              prefetch={false}
              className="text-sm font-bold text-slate-700 hover:text-emerald-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              {t.nav_home}
            </Link>

            <Link 
              href="/#fares" 
              prefetch={false}
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              {t.nav_services}
            </Link>

            <Link 
              href="/#intercity" 
              prefetch={false}
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              {t.nav_intercity}
            </Link>

            <Link 
              href="/track/" 
              prefetch={false}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              <Search className="w-4 h-4 text-emerald-600" />
              <span>{t.nav_track}</span>
            </Link>

            {/* Captain / Driver Portal CTA */}
            <Link 
              href="/captain/" 
              prefetch={false}
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3.5 py-2 rounded-xl border border-emerald-300/80 transition shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{currentCaptain ? (isUrdu ? 'کیپٹن ڈیش بورڈ' : 'Captain Hub') : (isUrdu ? 'کیپٹن بنیں' : 'Drive with OLAK')}</span>
            </Link>

            {/* Customer Login / Dashboard Link */}
            {currentCustomer ? (
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1">
                <Link
                  href="/customer/"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-emerald-600"
                >
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate max-w-[110px]">{currentCustomer.full_name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link 
                href="/customer/" 
                prefetch={false}
                className="flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-300 transition shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{isUrdu ? 'کسٹمر لاگ ان' : 'Customer Login'}</span>
              </Link>
            )}

            {/* Admin Console Entry */}
            <Link 
              href="/admin/" 
              prefetch={false}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              title="Admin Portal"
            >
              <Lock className="w-4 h-4" />
            </Link>
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/customer/"
              className="p-2 bg-slate-100 border border-slate-200 text-emerald-700 rounded-xl text-xs font-bold"
              title="Customer Hub"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu in Clean White */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 animate-fadeIn shadow-xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-bold text-slate-800 hover:bg-slate-50 hover:text-emerald-600"
          >
            {t.nav_home}
          </Link>
          <Link
            href="/#fares"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
          >
            {t.nav_services}
          </Link>
          <Link
            href="/#intercity"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
          >
            {t.nav_intercity}
          </Link>
          <Link
            href="/track/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span>{t.nav_track}</span>
          </Link>
          
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <Link
              href="/customer/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-slate-100 border border-slate-200"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{currentCustomer ? currentCustomer.full_name : (isUrdu ? 'کسٹمر پورٹل' : 'Customer Account')}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">{currentCustomer ? 'Active' : 'Sign In'}</span>
            </Link>

            <Link
              href="/captain/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-300"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isUrdu ? 'کیپٹن ڈیش بورڈ و رجسٹریشن' : 'Drive with OLAK (Captain)'}</span>
            </Link>

            <Link
              href="/admin/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Command Center</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
