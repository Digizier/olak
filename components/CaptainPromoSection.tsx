'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  UserPlus, 
  CheckCircle2, 
  Banknote, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const CaptainPromoSection = () => {
  const { t, isUrdu } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-olak-navy-950 via-olak-navy-900 to-olak-navy-950 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-olak-teal/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-olak-teal bg-olak-teal/10 border border-olak-teal/30 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'کیپٹن بنیں اور روزانہ کمائیں' : 'Drive with OLAK & Earn Daily'}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {t.captain_banner_title}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-urdu">
            {t.captain_banner_sub}
          </p>
        </div>

        {/* Dual Banner Promo Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Card 1: Bike Captain Banner */}
          <div className="bg-olak-navy-900/90 rounded-3xl p-6 sm:p-8 border border-olak-navy-800 hover:border-olak-teal/60 transition-all duration-300 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-olak-navy-800">
              <Image
                src="/assets/bike-poster.jpg"
                alt="OLAK Bike Captain Registration"
                fill
                className="object-cover hover:scale-105 transition-all duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-olak-navy-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-xs font-bold bg-olak-teal text-olak-navy-950 px-2.5 py-1 rounded-full uppercase">
                  Motorcycle 70cc / 125cc
                </span>
                <h4 className="text-lg font-black text-white mt-1">اپنی بائیک رجسٹر کروائیں — آزادی سے کمائیں</h4>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-olak-teal flex-shrink-0" />
                <span>{isUrdu ? 'روزانہ کی بنیاد پر نقد کمائی (Daily Cash Income)' : 'Daily Cash Earnings on Every Trip'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-olak-teal flex-shrink-0" />
                <span>{isUrdu ? 'صرف 10% کمیشن — باقی 90% آپ کی اپنی کمائی' : 'Only 10% Platform Fee — Keep 90%'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-olak-teal flex-shrink-0" />
                <span>{isUrdu ? 'جب دل چاہے آن لائن ہوں اور سواریاں لیں' : 'Flexible Hours — Work When You Want'}</span>
              </div>
            </div>

            <Link
              href="/captain/"
              prefetch={false}
              className="w-full bg-olak-teal hover:bg-olak-teal-hover text-olak-navy-950 font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-teal-glow transition text-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isUrdu ? 'بائیک کیپٹن رجسٹر کریں' : 'Register Bike Captain'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Car & Rickshaw Captain Banner */}
          <div className="bg-olak-navy-900/90 rounded-3xl p-6 sm:p-8 border border-olak-navy-800 hover:border-olak-teal/60 transition-all duration-300 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-olak-navy-800">
              <Image
                src="/assets/car-poster.jpg"
                alt="OLAK Car & Commercial Registration"
                fill
                className="object-cover hover:scale-105 transition-all duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-olak-navy-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-xs font-bold bg-emerald-400 text-olak-navy-950 px-2.5 py-1 rounded-full uppercase">
                  Car / Bolan / Rickshaw
                </span>
                <h4 className="text-lg font-black text-white mt-1">آسان سفر، آسان کمائی — آپ کا اعتماد</h4>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{isUrdu ? 'تربت سٹی، ایئرپورٹ اور انٹرسٹی ہائی وے سواریاں' : 'City Rides, Airport Pickups & Intercity Trips'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{isUrdu ? 'فیملی اور معزز مسافروں کے ساتھ باوقار روزگار' : 'Respectful & Dignified Family Commuters'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{isUrdu ? 'آسان رجسٹریشن — فوری منظوری 24 گھنٹوں میں' : 'Quick Online Verification in 24 Hours'}</span>
              </div>
            </div>

            <Link
              href="/captain/"
              prefetch={false}
              className="w-full bg-gradient-to-r from-emerald-500 to-olak-teal hover:from-olak-teal hover:to-emerald-400 text-olak-navy-950 font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-teal-glow transition text-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isUrdu ? 'کار یا رکشہ رجسٹر کریں' : 'Register Car / Rickshaw'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
