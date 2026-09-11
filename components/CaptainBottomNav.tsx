'use client';

import React from 'react';
import { Home, DollarSign, ReceiptText, PackageCheck, User } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export type CaptainNavTab = 'home' | 'earnings' | 'trips' | 'requests' | 'account';

interface CaptainBottomNavProps {
  activeTab: CaptainNavTab;
  onTabChange: (tab: CaptainNavTab) => void;
  requestsCount?: number;
  hasActiveTrip?: boolean;
}

export const CaptainBottomNav: React.FC<CaptainBottomNavProps> = ({
  activeTab,
  onTabChange,
  requestsCount = 0,
  hasActiveTrip = false,
}) => {
  const { isUrdu } = useLanguage();

  const navItems: { id: CaptainNavTab; label: string; urduLabel: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', urduLabel: 'ہوم', icon: Home },
    { id: 'earnings', label: 'Earnings', urduLabel: 'آمدنی', icon: DollarSign },
    { id: 'trips', label: 'Trips', urduLabel: 'ٹرپس', icon: ReceiptText },
    { id: 'requests', label: 'Requests', urduLabel: 'آرڈرز', icon: PackageCheck },
    { id: 'account', label: 'Account', urduLabel: 'اکاؤنٹ', icon: User },
  ];

  return (
    <nav 
      aria-label="Captain Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] px-2 py-1.5 sm:hidden"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex-1 ${
                isActive
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-400 hover:text-slate-700 font-semibold'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-emerald-100 text-emerald-700 scale-110' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {item.id === 'requests' && requestsCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-4 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {requestsCount}
                  </span>
                )}

                {item.id === 'home' && hasActiveTrip && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? item.urduLabel : item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-5 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
