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
    <section id="fares" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
            {isUrdu ? '100% شفاف اور مقررہ کرایہ' : '100% Transparent Fares'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            {isUrdu ? 'تربت شہر و مضافات کا مکمل ریٹ چارٹ' : 'Turbat City & Suburbs Official Rate Card'}
          </h2>
          <p className={`text-sm sm:text-base text-slate-600 ${isUrdu ? 'font-urdu leading-relaxed' : ''}`}>
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
                className="bg-white border border-slate-200 hover:border-emerald-500 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl"
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {rate.operating_hours}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900">
                    {isUrdu ? rate.service_name_urdu : rate.service_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rate.vehicle_models}
                  </p>

                  {/* Main Pricing Breakdown */}
                  <div className="my-6 space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500">{isUrdu ? 'بنیادی کرایہ (Base Fare):' : 'Base Fare:'}</span>
                      <span className="font-bold text-slate-900">PKR {rate.base_fare}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500">{isUrdu ? 'فی کلومیٹر چارج:' : 'Per KM Rate:'}</span>
                      <span className="font-bold text-emerald-600">PKR {rate.per_km_charge} / KM</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500">{isUrdu ? 'کم سے کم کرایہ:' : 'Minimum Fare:'}</span>
                      <span className="font-bold text-slate-900">PKR {rate.minimum_fare}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500">{isUrdu ? 'ویٹنگ چارج:' : 'Waiting Charge:'}</span>
                      <span className="text-slate-600">PKR {rate.waiting_charge_per_min} / min</span>
                    </div>
                  </div>

                  {/* Coverage */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{rate.service_areas}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{isUrdu ? 'کینسلشن چارج: PKR ' + rate.cancellation_fee : 'Cancel Fee: PKR ' + rate.cancellation_fee}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <a
                    href="#top"
                    className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
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
