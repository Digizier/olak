'use client';

import React from 'react';
import Link from 'next/link';
import { OlakLogo } from '@/components/OlakLogo';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ShieldCheck, 
  Car, 
  Bike, 
  Package, 
  ArrowUpRight,
  User 
} from 'lucide-react';

export const Footer = () => {
  const { t, isUrdu } = useLanguage();

  return (
    <footer className="bg-olak-navy-950 border-t border-olak-navy-800 text-slate-400">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <OlakLogo size="lg" textColor="text-white" />
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-urdu">
              {t.hero_desc}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://facebook.com/olak.turbat" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-olak-navy-900 hover:bg-olak-teal hover:text-olak-navy-950 border border-olak-navy-800 flex items-center justify-center text-slate-300 transition"
                title="Facebook"
              >
                <span className="font-bold text-sm">f</span>
              </a>
              <a 
                href="https://instagram.com/olak.turbat" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-olak-navy-900 hover:bg-olak-teal hover:text-olak-navy-950 border border-olak-navy-800 flex items-center justify-center text-slate-300 transition"
                title="Instagram"
              >
                <span className="font-bold text-sm">ig</span>
              </a>
              <a 
                href="https://wa.me/923340468649" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-emerald-950/80 hover:bg-emerald-500 hover:text-white border border-emerald-700/50 flex items-center justify-center text-emerald-400 transition"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-olak-teal" />
              <span>{isUrdu ? 'ہماری سروسز' : 'Our Services'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-olak-teal flex items-center gap-1.5 transition">
                  <Bike className="w-4 h-4 text-olak-teal" />
                  <span>{isUrdu ? 'اولاک بائیک رائیڈ (PKR 50 Base)' : 'OLAK Bike Ride (PKR 50 Base)'}</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-olak-teal flex items-center gap-1.5 transition">
                  <Car className="w-4 h-4 text-olak-teal" />
                  <span>{isUrdu ? 'اولاک کار رائیڈ (PKR 150 Base)' : 'OLAK Car Ride (PKR 150 Base)'}</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-olak-teal flex items-center gap-1.5 transition">
                  <Car className="w-4 h-4 text-olak-teal" />
                  <span>{isUrdu ? 'اولاک رکشہ / بولان' : 'OLAK Rickshaw / Bolan'}</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-olak-teal flex items-center gap-1.5 transition">
                  <Package className="w-4 h-4 text-olak-teal" />
                  <span>{isUrdu ? 'اولاک پارسل و ڈلیوری' : 'OLAK Parcel Delivery'}</span>
                </Link>
              </li>
              <li>
                <Link href="/#intercity" className="hover:text-olak-teal flex items-center gap-1.5 transition">
                  <ArrowUpRight className="w-4 h-4 text-olak-teal" />
                  <span>{isUrdu ? 'انٹرسٹی ہائی وے سفر' : 'Intercity Travel'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Dedicated Portals */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-olak-teal" />
              <span>{isUrdu ? 'پورٹلز اور ڈیش بورڈز' : 'Dashboards & Hubs'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/customer/" prefetch={false} className="hover:text-white flex items-center gap-1.5 transition">
                  <User className="w-4 h-4 text-olak-teal" />
                  <span>{isUrdu ? 'کسٹمر ڈیش بورڈ و لاگ ان' : 'Customer Portal & Trips'}</span>
                </Link>
              </li>
              <li>
                <Link href="/captain/" prefetch={false} className="text-olak-teal font-bold hover:underline flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{isUrdu ? 'کیپٹن پورٹل و کمائی ڈیش بورڈ' : 'Drive with OLAK (Captain)'}</span>
                </Link>
              </li>
              <li>
                <Link href="/track/" prefetch={false} className="hover:text-white flex items-center gap-1.5 transition">
                  <span>{isUrdu ? 'لائیو ٹرپ ٹریکنگ (بکنگ ٹوکن)' : 'Live Trip Tracker'}</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/" prefetch={false} className="hover:text-white flex items-center gap-1.5 transition">
                  <span>{isUrdu ? 'ایڈمن کمانڈ سینٹر' : 'Admin Command Center'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Office */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-olak-teal" />
              <span>{isUrdu ? 'مرکزی رابطہ و پتہ' : 'Head Office & Help'}</span>
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-olak-teal mt-1 flex-shrink-0" />
                <span className="text-slate-300">{t.footer_office}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-olak-teal flex-shrink-0" />
                <a href="tel:+923350455599" className="text-slate-200 hover:text-olak-teal font-semibold">
                  +92 335 0455599
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href="https://wa.me/923340468649" target="_blank" rel="noreferrer" className="text-slate-200 hover:text-emerald-400 font-semibold">
                  +92 334 0468649 (WhatsApp)
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-olak-teal flex-shrink-0" />
                <a href="mailto:olak.bln@gmail.com" className="text-slate-300 hover:text-white">
                  olak.bln@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-olak-navy-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OLAK Mobility Platform. {t.footer_rights}</p>
          <div className="flex items-center gap-4">
            <span>Turbat • Gwadar • Panjgur • Quetta</span>
            <span>Zero-Cost Edge Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
