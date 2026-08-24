'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  Bike, 
  Car, 
  MapPin, 
  Navigation, 
  Star, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Clock,
  Sparkles,
  CheckCircle,
  Truck
} from 'lucide-react';

export const MobileAppMockup = () => {
  const { isUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bike' | 'car' | 'rickshaw'>('bike');
  const [simState, setSimState] = useState<number>(0);

  // Auto-advance simulator state for live dynamic feel
  useEffect(() => {
    const timer = setInterval(() => {
      setSimState((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto max-w-sm">
      {/* Outer Phone Bezel */}
      <div className="relative rounded-[45px] p-3 bg-gradient-to-b from-slate-700 via-slate-850 to-slate-900 shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/10">
        
        {/* Screen Container */}
        <div className="relative rounded-[36px] bg-olak-navy-950 overflow-hidden border border-olak-navy-800 text-white min-h-[580px] flex flex-col justify-between p-4">
          
          {/* Dynamic Island / Top Notch */}
          <div className="flex items-center justify-between px-2 pt-1 pb-3 text-xs text-slate-400">
            <span className="font-semibold text-white">9:41</span>
            <div className="w-20 h-4 bg-black/80 rounded-full flex items-center justify-center gap-1.5 px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-olak-teal animate-ping"></span>
              <span className="text-[9px] font-bold text-olak-teal">OLAK LIVE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-olak-teal rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Map Simulation Canvas */}
          <div className="relative h-44 rounded-2xl bg-gradient-to-br from-slate-900 via-olak-navy-900 to-slate-950 border border-olak-navy-850 overflow-hidden p-3 flex flex-col justify-between">
            {/* Map Roads & Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#00D084" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Roads */}
                <path d="M 20 120 Q 150 40 320 90" fill="none" stroke="#1E4C8A" strokeWidth="4" strokeDasharray="6 4" />
                <path d="M 80 10 L 120 150" fill="none" stroke="#1E4C8A" strokeWidth="3" />
              </svg>
            </div>

            {/* Pickup Marker */}
            <div className="relative z-10 flex items-center gap-1.5 bg-olak-navy-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-olak-teal/50 shadow-sm self-start text-[10px]">
              <span className="w-2 h-2 rounded-full bg-olak-teal animate-pulse"></span>
              <span className="font-semibold text-white">City Thana, Turbat</span>
            </div>

            {/* Driver Avatar moving along route */}
            <div className="relative z-10 self-center transform transition-all duration-1000">
              <div className="relative bg-olak-teal text-olak-navy-950 p-2 rounded-full shadow-teal-glow animate-bounce">
                {activeTab === 'bike' && <Bike className="w-5 h-5" />}
                {activeTab === 'car' && <Car className="w-5 h-5" />}
                {activeTab === 'rickshaw' && <Truck className="w-5 h-5" />}
              </div>
            </div>

            {/* Dropoff Marker */}
            <div className="relative z-10 flex items-center gap-1.5 bg-olak-navy-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-400/50 shadow-sm self-end text-[10px]">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-white">University of Turbat (UoT)</span>
            </div>
          </div>

          {/* Vehicle Switcher in App */}
          <div className="grid grid-cols-3 gap-1.5 bg-olak-navy-900/90 p-1 rounded-xl border border-olak-navy-800 my-2">
            {[
              { id: 'bike', label: 'Bike', price: 'PKR 120', icon: Bike },
              { id: 'rickshaw', label: 'Rickshaw', price: 'PKR 190', icon: Truck },
              { id: 'car', label: 'Car', price: 'PKR 280', icon: Car },
            ].map(item => {
              const isSelected = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`py-1.5 px-1 rounded-lg text-center transition ${
                    isSelected ? 'bg-olak-teal text-olak-navy-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span className="block text-[10px] leading-tight">{item.label}</span>
                  <span className="block text-[8px] opacity-80">{item.price}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Simulator Status Card */}
          <div className="bg-olak-navy-900 rounded-2xl p-3 border border-olak-navy-800 space-y-2">
            {simState === 0 && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-olak-teal uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-olak-teal animate-ping"></span>
                    {isUrdu ? 'کیپٹن کی تلاش جاری ہے' : 'Searching Nearby Captain'}
                  </span>
                  <span className="text-[10px] text-slate-400">~2 mins</span>
                </div>
                <div className="w-full bg-olak-navy-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-olak-teal to-emerald-400 h-full w-2/3 animate-pulse"></div>
                </div>
                <p className="text-[10px] text-slate-300">
                  {isUrdu ? 'تربت سٹی میں قریبی تصدیق شدہ رائڈرز کو پیغام بھیجا گیا ہے...' : 'Finding verified captains near Thana Road, Turbat...'}
                </p>
              </div>
            )}

            {simState === 1 && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-olak-teal/20 border border-olak-teal/40 flex items-center justify-center text-olak-teal font-black text-xs">
                      TB
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white leading-tight">Tariq Baloch</h5>
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>4.9 (184 trips)</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-olak-teal block">Honda CD-70</span>
                    <span className="text-[9px] text-slate-400">TRB-8492</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-olak-navy-800 text-[10px] text-slate-300">
                  <span>Arriving in <strong>3 mins</strong></span>
                  <span className="text-emerald-400 font-bold">PKR 120</span>
                </div>
              </div>
            )}

            {simState === 2 && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>{isUrdu ? 'کیپٹن پہنچ چکا ہے' : 'Captain Arrived'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">At Pickup Gate</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href="tel:+923350455599"
                    className="flex-1 bg-olak-teal text-olak-navy-950 text-center py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Captain</span>
                  </a>
                  <button className="px-3 bg-olak-navy-950 text-slate-300 rounded-lg text-[10px] border border-olak-navy-800">
                    Safety SOS
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom In-App Button */}
          <div className="pt-2">
            <button
              onClick={() => setSimState((prev) => (prev + 1) % 3)}
              className="w-full bg-olak-teal/20 hover:bg-olak-teal/30 border border-olak-teal/40 text-olak-teal font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isUrdu ? 'ٹرپ سمیلیشن کا اگلا مرحلہ' : 'Next Trip Simulation Step'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
