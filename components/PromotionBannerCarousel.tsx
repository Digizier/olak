'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPromotions } from '@/lib/db';
import { PromotionBanner } from '@/lib/types';
import { INITIAL_PROMOTIONS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { Sparkles, ChevronLeft, ChevronRight, ArrowRight, Tag } from 'lucide-react';

interface Props {
  isUrdu?: boolean;
}

export const PromotionBannerCarousel: React.FC<Props> = ({ isUrdu = false }) => {
  const [promotions, setPromotions] = useState<PromotionBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getPromotions().then(data => {
      if (isMounted && data && data.length > 0) {
        setPromotions(data.filter(p => p.is_active));
      }
    });

    const handleUpdate = () => {
      getPromotions().then(data => {
        if (isMounted && data && data.length > 0) {
          setPromotions(data.filter(p => p.is_active));
        }
      });
    };

    window.addEventListener('olak_promotions_updated', handleUpdate);

    // 0ms Supabase Realtime Channel
    const channel = supabase
      .channel('promotions-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        handleUpdate();
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener('olak_promotions_updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-slide every 5 seconds if multiple banners exist
  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  if (!promotions || promotions.length === 0) return null;

  const safeIndex = currentIndex >= promotions.length ? 0 : currentIndex;
  const current = promotions[safeIndex] || promotions[0];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % promotions.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + promotions.length) % promotions.length);
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl min-h-[220px] sm:min-h-[260px] flex items-center">
        
        {/* Banner Background Image with Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
          style={{ backgroundImage: `url(${current.image_url})` }}
        >
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        {/* Banner Content */}
        <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-3">
          {current.badge && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <Tag className="w-3.5 h-3.5" />
              <span>{current.badge}</span>
            </span>
          )}

          <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
            {current.title}
          </h3>

          {current.subtitle && (
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg">
              {current.subtitle}
            </p>
          )}

          <div className="pt-2">
            <Link
              href={current.link_url || '/#fares'}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              <span>{isUrdu ? 'آفر کا فائدہ اٹھائیں' : 'Claim Offer Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {promotions.length > 1 && (
          <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Slide Indicators / Dots */}
        {promotions.length > 1 && (
          <div className="absolute bottom-4 left-6 sm:left-10 z-20 flex items-center gap-1.5">
            {promotions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40'}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
