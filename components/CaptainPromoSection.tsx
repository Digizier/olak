'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { getDriverPromoCards } from '@/lib/db';
import { DriverPromoCard } from '@/lib/types';
import { INITIAL_DRIVER_PROMOS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';

export const CaptainPromoSection = () => {
  const { t, isUrdu } = useLanguage();
  const [cards, setCards] = useState<DriverPromoCard[]>([]);

  useEffect(() => {
    let isMounted = true;
    getDriverPromoCards().then((res) => {
      if (isMounted && res && res.length > 0) setCards(res);
    });

    const handleUpdate = (e?: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setCards(e.detail);
      } else {
        getDriverPromoCards().then(res => {
          if (res && res.length > 0) setCards(res);
        });
      }
    };

    window.addEventListener('olak_driver_promos_updated', handleUpdate);

    // 0ms Supabase Realtime Channel
    const channel = supabase
      .channel('driver-promos-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_promos' }, () => {
        handleUpdate();
      })
      .subscribe();

    return () => {
      window.removeEventListener('olak_driver_promos_updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const activeCards = cards.filter(c => c.is_active);
  if (activeCards.length === 0) return null;

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

        {/* Dynamic Banner Promo Showcase Grid */}
        <div className={`grid grid-cols-1 ${activeCards.length > 1 ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'} gap-8 items-stretch`}>
          {activeCards.map((card, idx) => (
            <div 
              key={card.id || idx}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 hover:border-emerald-500 transition-all duration-300 shadow-md flex flex-col justify-between space-y-6"
            >
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <Image
                  src={card.image_url}
                  alt={card.title}
                  fill
                  className="object-cover hover:scale-105 transition-all duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  {card.category_badge && (
                    <span className="text-xs font-bold bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full uppercase inline-block">
                      {card.category_badge}
                    </span>
                  )}
                  <h4 className={`text-lg font-black text-white mt-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu && card.title_urdu ? card.title_urdu : card.title}
                  </h4>
                </div>
              </div>

              {card.bullets && card.bullets.length > 0 && (
                <div className="space-y-3 text-sm text-slate-700 flex-1">
                  {card.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href={card.cta_link || '/captain/'}
                prefetch={false}
                className={`w-full ${idx === 0 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-900 hover:bg-emerald-600'} text-white font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md transition text-center`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{card.cta_text || 'Register Captain'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
