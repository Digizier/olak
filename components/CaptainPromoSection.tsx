'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  UserPlus, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const CaptainPromoSection = () => {
  const { t, isUrdu } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'کیپٹن بنیں اور روزانہ کمائیں' : 'Drive with OLAK & Earn Daily'}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            {t.captain_banner_title}
          </h2>

          <p className={`text-base sm:text-lg text-slate-600 ${isUrdu ? 'font-urdu leading-relaxed' : ''}`}>
            {t.captain_banner_sub}
          </p>
        </div>

        {/* Dual Banner Promo Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Card 1: Bike Captain Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 hover:border-emerald-500 transition-all duration-300 shadow-md flex flex-col justify-between space-y-6">
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200">
              <Image
                src="/assets/bike-poster.jpg"
                alt="OLAK Bike Captain Registration"
                fill
                className="object-cover hover:scale-105 transition-all duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-xs font-bold bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full uppercase">
                  Motorcycle 70cc / 125cc
                </span>
                <h4 className="text-lg font-black text-white mt-1">اپنی بائیک رجسٹر کروائیں — آزادی سے کمائیں</h4>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{isUrdu ? 'روزانہ کی بنیاد پر نقد کمائی (Daily Cash Income)' : 'Daily Cash Earnings on Every Trip'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{isUrdu ? 'صرف 10% کمیشن — باقی 90% آپ کی اپنی کمائی' : 'Only 10% Platform Fee — Keep 90%'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{isUrdu ? 'جب دل چاہے آن لائن ہوں اور سواریاں لیں' : 'Flexible Hours — Work When You Want'}</span>
              </div>
            </div>

            <Link
              href="/captain/"
              prefetch={false}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md transition text-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isUrdu ? 'بائیک کیپٹن رجسٹر کریں' : 'Register Bike Captain'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Car & Rickshaw Captain Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 hover:border-emerald-500 transition-all duration-300 shadow-md flex flex-col justify-between space-y-6">
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200">
              <Image
                src="/assets/car-poster.jpg"
                alt="OLAK Car & Commercial Registration"
                fill
                className="object-cover hover:scale-105 transition-all duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-xs font-bold bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full uppercase">
                  Car / Bolan / Rickshaw
                </span>
                <h4 className="text-lg font-black text-white mt-1">آسان سفر، آسان کمائی — آپ کا اعتماد</h4>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{isUrdu ? 'تربت سٹی، ایئرپورٹ اور انٹرسٹی ہائی وے سواریاں' : 'City Rides, Airport Pickups & Intercity Trips'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{isUrdu ? 'فیملی اور معزز مسافروں کے ساتھ باوقار روزگار' : 'Respectful & Dignified Family Commuters'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{isUrdu ? 'آسان رجسٹریشن — فوری منظوری 24 گھنٹوں میں' : 'Quick Online Verification in 24 Hours'}</span>
              </div>
            </div>

            <Link
              href="/captain/"
              prefetch={false}
              className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md transition text-center"
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
