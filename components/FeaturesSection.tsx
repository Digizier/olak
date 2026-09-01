'use client';

import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  ShieldCheck, 
  Banknote, 
  Zap, 
  Map, 
  Clock, 
  Users 
} from 'lucide-react';

export const FeaturesSection = () => {
  const { t, isUrdu } = useLanguage();

  const features = [
    {
      icon: ShieldCheck,
      title: t.feat_1_title,
      desc: t.feat_1_desc,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      icon: Banknote,
      title: t.feat_2_title,
      desc: t.feat_2_desc,
      color: 'text-teal-700',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
    },
    {
      icon: Zap,
      title: t.feat_3_title,
      desc: t.feat_3_desc,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      icon: Map,
      title: t.feat_4_title,
      desc: t.feat_4_desc,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50 border-y border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
            {isUrdu ? 'تربت کا قابل اعتماد نیٹ ورک' : 'Turbat’s Trusted Mobility'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            {t.features_title}
          </h2>
          <p className={`text-sm sm:text-base text-slate-600 ${isUrdu ? 'font-urdu leading-relaxed' : ''}`}>
            {isUrdu 
              ? 'ہم تربت کے عوام اور مہمانوں کے لیے محفوظ، تیز اور باوقار سفری سہولیات فراہم کرنے کے لیے ہمہ وقت تیار ہیں۔' 
              : 'Empowering commuters and businesses across Turbat and Balochistan with seamless on-demand mobility.'}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i}
                className={`rounded-3xl p-6 sm:p-7 bg-white border ${f.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 shadow-sm space-y-4`}
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center border ${f.border}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {f.title}
                </h3>
                <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
