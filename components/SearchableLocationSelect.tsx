'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CityLandmark } from '@/lib/types';
import { Search, X, Check, ChevronDown, MapPin, LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  icon?: LucideIcon;
  iconColor?: string;
  value: string;
  onChange: (name: string) => void;
  landmarks: CityLandmark[];
  isUrdu?: boolean;
  placeholder?: string;
  badge?: string;
}

export const SearchableLocationSelect: React.FC<Props> = ({
  label,
  icon: Icon = MapPin,
  iconColor = 'text-emerald-600',
  value,
  onChange,
  landmarks,
  isUrdu = false,
  placeholder,
  badge = 'Turbat',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Find currently selected landmark
  const selectedLandmark = landmarks.find(lm => lm.name === value);

  // Filter landmarks in real-time
  const query = searchQuery.trim().toLowerCase();
  const filtered = landmarks.filter(lm => {
    if (!query) return true;
    const nameMatch = lm.name.toLowerCase().includes(query);
    const areaMatch = lm.area ? lm.area.toLowerCase().includes(query) : false;
    const urduMatch = (lm.nameUrdu || lm.name_urdu || '').toLowerCase().includes(query);
    return nameMatch || areaMatch || urduMatch;
  });

  const handleSelect = (lm: CityLandmark) => {
    onChange(lm.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Label */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
        <span className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span>{label}</span>
        </span>
        {badge && <span className="text-[10px] font-semibold text-slate-400">{badge}</span>}
      </div>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-white border rounded-xl px-3 py-2.5 text-left flex items-center justify-between gap-2 transition cursor-pointer shadow-xs hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' : 'border-slate-300'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
          <div className="truncate flex-1 min-w-0">
            <span className="text-xs sm:text-sm text-slate-900 font-bold block truncate">
              {isUrdu 
                ? (selectedLandmark?.nameUrdu || selectedLandmark?.name_urdu || value)
                : value
              }
            </span>
            {selectedLandmark?.area && (
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                {selectedLandmark.area}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-md hidden xs:inline">
            {isUrdu ? 'تلاش کریں' : 'Search'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </button>

      {/* Dropdown Popover with Search Filter */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* Search Header Input */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder || (isUrdu ? 'مقام یا علاقہ تلاش کریں...' : 'Search location, area, or landmark...')}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Result Counter */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-1 pt-1.5">
              <span>{isUrdu ? `${filtered.length} مقامات دستیاب` : `${filtered.length} locations available`}</span>
              {searchQuery && (
                <span className="text-emerald-600 font-bold">
                  {isUrdu ? 'فلٹر فعال ہے' : 'Filtering live'}
                </span>
              )}
            </div>
          </div>

          {/* Locations List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-slate-500 space-y-2">
                <p className="text-xs font-semibold">
                  {isUrdu ? `"${searchQuery}" کا کوئی مقام نہیں ملا` : `No location found matching "${searchQuery}"`}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                >
                  {isUrdu ? 'تمام مقامات دیکھیں' : 'Clear search to view all'}
                </button>
              </div>
            ) : (
              filtered.map((lm) => {
                const isSelected = lm.name === value;
                return (
                  <button
                    key={lm.id || lm.name}
                    type="button"
                    onClick={() => handleSelect(lm)}
                    className={`w-full px-3 py-2 text-left rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 text-emerald-900 font-bold'
                        : 'hover:bg-slate-100/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-semibold block truncate">
                          {isUrdu ? (lm.nameUrdu || lm.name_urdu || lm.name) : lm.name}
                        </span>
                        {lm.area && (
                          <span className="text-[10px] text-slate-500 font-medium block truncate">
                            {lm.area}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
