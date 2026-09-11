'use client';

import React from 'react';
import { Home, Car, Navigation, ReceiptText, User } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export type CustomerNavTab = 'home' | 'book' | 'track' | 'rides' | 'account';

interface CustomerBottomNavProps {
  activeTab: CustomerNavTab;
  onTabChange: (tab: CustomerNavTab) => void;
  activeRidesCount?: number;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  activeTab,
  onTabChange,
  activeRidesCount = 0,
}) => {
  const { isUrdu } = useLanguage();

  const navItems: { id: CustomerNavTab; label: string; urduLabel: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', urduLabel: 'ہوم', icon: Home },
    { id: 'book', label: 'Book', urduLabel: 'بک کریں', icon: Car },
    { id: 'track', label: 'Track', urduLabel: 'ٹریک کریں', icon: Navigation },
    { id: 'rides', label: 'My Rides', urduLabel: 'میری رائیڈز', icon: ReceiptText },
    { id: 'account', label: 'Account', urduLabel: 'اکاؤنٹ', icon: User },
  ];

  return (
    <nav 
      aria-label="Customer Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] px-1 py-1.5 sm:hidden"
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
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all duration-200 cursor-pointer flex-1 min-w-0 ${
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
                {item.id === 'rides' && activeRidesCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {activeRidesCount}
                  </span>
                )}
                {item.id === 'track' && activeRidesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight truncate max-w-full ${isUrdu ? 'font-urdu text-[11px]' : ''}`}>
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
