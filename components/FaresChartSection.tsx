'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { INITIAL_PRICING_RATES } from '@/lib/constants';
import { getPricingRates } from '@/lib/db';
import { PricingRate } from '@/lib/types';
import { 
  Bike, 
  Car, 
  Truck, 
  Package, 
  Check, 
  Clock, 
  MapPin, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const FaresChartSection = () => {
  const { isUrdu } = useLanguage();
  const [rates, setRates] = useState<PricingRate[]>(INITIAL_PRICING_RATES);

  useEffect(() => {
    getPricingRates().then(setRates);
    const handleUpdate = (e: any) => {
      if (e.detail) setRates(e.detail);
    };
    window.addEventListener('olak_fares_updated', handleUpdate);
    return () => window.removeEventListener('olak_fares_updated', handleUpdate);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'bike': return Bike;
      case 'rickshaw': return Truck;
      case 'car': return Car;
      default: return Package;
    }
  };

  return (
    <section id="fares" className="py-16 sm:py-24 bg-olak-navy-900/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-olak-teal bg-olak-teal/10 border border-olak-teal/30 px-3 py-1 rounded-full">
            {isUrdu ? '100% شفاف اور مقررہ کرایہ' : '100% Transparent Fares'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {isUrdu ? 'تربت شہر و مضافات کا مکمل ریٹ چارٹ' : 'Turbat City & Suburbs Official Rate Card'}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-urdu">
            {isUrdu 
              ? 'کوئی اوور چارجنگ نہیں، میٹر کے مطابق منصفانہ کرایہ۔ کیپٹن اور سواری دونوں کا تحفظ۔' 
              : 'Fair, regulated pricing structured for affordable daily commuting and safe driver earnings.'}
          </p>
        </div>

        {/* Rate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rates.map((rate) => {
            const Icon = getIcon(rate.service_type);
            return (
              <div
                key={rate.id}
                className="bg-olak-navy-950 border border-olak-navy-800 hover:border-olak-teal rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl"
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-olak-teal/10 border border-olak-teal/30 text-olak-teal flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-olak-navy-900 px-2.5 py-1 rounded-full border border-olak-navy-800">
                      {rate.operating_hours}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white">
                    {isUrdu ? rate.service_name_urdu : rate.service_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {rate.vehicle_models}
                  </p>

                  {/* Main Pricing Breakdown */}
                  <div className="my-6 space-y-2.5 bg-olak-navy-900/60 p-3.5 rounded-2xl border border-olak-navy-850 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">{isUrdu ? 'بنیادی کرایہ (Base Fare):' : 'Base Fare:'}</span>
                      <span className="font-bold text-white">PKR {rate.base_fare}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">{isUrdu ? 'فی کلومیٹر چارج:' : 'Per KM Rate:'}</span>
                      <span className="font-bold text-olak-teal">PKR {rate.per_km_charge} / KM</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">{isUrdu ? 'کم سے کم کرایہ:' : 'Minimum Fare:'}</span>
                      <span className="font-bold text-white">PKR {rate.minimum_fare}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">{isUrdu ? 'ویٹنگ چارج:' : 'Waiting Charge:'}</span>
                      <span className="text-slate-400">PKR {rate.waiting_charge_per_min} / min</span>
                    </div>
                  </div>

                  {/* Coverage */}
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-olak-teal flex-shrink-0" />
                      <span>{rate.service_areas}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{isUrdu ? 'کینسلشن چارج: PKR ' + rate.cancellation_fee : 'Cancel Fee: PKR ' + rate.cancellation_fee}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <a
                    href="#top"
                    className="w-full bg-olak-navy-900 hover:bg-olak-teal hover:text-olak-navy-950 text-slate-200 border border-olak-navy-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>{isUrdu ? 'یہ سروس بک کریں' : 'Book This Service'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
