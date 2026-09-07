'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CityLandmark } from '@/lib/types';
import { calculateRealtimeDistance } from '@/lib/db';
import { Search, X, Check, ChevronDown, MapPin, LucideIcon, Compass } from 'lucide-react';

interface Props {
  label: string;
  icon?: LucideIcon;
  iconColor?: string;
  value: string;
  onChange: (name: string, landmark?: CityLandmark) => void;
  landmarks: CityLandmark[];
  isUrdu?: boolean;
  placeholder?: string;
  badge?: string;
  referenceCoords?: { lat: number; lng: number };
  allowCurrentLocation?: boolean;
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
  referenceCoords,
  allowCurrentLocation = false,
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

  // Filter landmarks in real-time with smart word matching
  const query = searchQuery.trim().toLowerCase();
  const queryWords = query ? query.split(/\s+/).filter(Boolean) : [];
  
  const filtered = landmarks.filter(lm => {
    if (!query) return true;
    const name = lm.name.toLowerCase();
    const area = (lm.area || '').toLowerCase();
    const urdu = (lm.nameUrdu || lm.name_urdu || '').toLowerCase();
    
    // Exact or substring match
    if (name.includes(query) || area.includes(query) || urdu.includes(query)) return true;
    
    // Multi-word partial matching (e.g. "turbat road")
    return queryWords.some(w => name.includes(w) || area.includes(w) || urdu.includes(w));
  });

  // Calculate live road distance from referenceCoords (e.g. pickup to dropoff or user GPS)
  const landmarksWithDistance = filtered.map(lm => {
    const dist = referenceCoords && lm.lat && lm.lng
      ? calculateRealtimeDistance(referenceCoords, { lat: lm.lat, lng: lm.lng })
      : null;
    return { ...lm, distanceKm: dist };
  });

  // Sort by nearest distance first when referenceCoords is provided
  if (referenceCoords) {
    landmarksWithDistance.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert(isUrdu ? 'آپ کے براؤزر میں جی پی ایس لوکیشن سپورٹ نہیں ہے۔' : 'GPS location is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const liveLm: CityLandmark = {
          id: 'live-gps',
          name: `My Live GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          nameUrdu: 'میری لائیو لوکیشن (GPS)',
          area: 'Current Device Location',
          lat,
          lng,
        };
        onChange(liveLm.name, liveLm);
        setIsOpen(false);
        setSearchQuery('');
      },
      (err) => {
        setIsLocating(false);
        alert(isUrdu ? 'براہ کرم براؤزر / ڈیوائس میں لوکیشن کی اجازت آن کریں۔' : 'Please allow location permission in your browser or device settings.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSelect = (lm: CityLandmark) => {
    onChange(lm.name, lm);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectCustom = (customName: string) => {
    if (!customName.trim()) return;
    onChange(customName.trim());
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
            <span className="text-[10px] text-slate-500 font-medium block truncate">
              {selectedLandmark?.area || (isUrdu ? 'تربت کسٹم مقام' : 'Turbat Location')}
            </span>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered.length > 0) {
                      handleSelect(filtered[0]);
                    } else if (searchQuery.trim()) {
                      handleSelectCustom(searchQuery.trim());
                    }
                  }
                }}
                placeholder={placeholder || (isUrdu ? 'مقام یا پتہ تلاش کریں...' : 'Search location, area, or type address...')}
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
              <span>{isUrdu ? `${filtered.length} نشانات دستیاب` : `${filtered.length} presets found`}</span>
              {searchQuery && (
                <span className="text-emerald-600 font-bold">
                  {isUrdu ? 'لائیو فلٹر' : 'Live Filter'}
                </span>
              )}
            </div>
          </div>

          {/* Locations List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1.5">
            {/* Live GPS Current Location Detector Button */}
            {allowCurrentLocation && !searchQuery.trim() && (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="w-full p-2.5 mb-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl text-left flex items-center justify-between gap-2 text-emerald-950 font-bold transition shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-white' : ''}`} />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-black truncate text-emerald-900">
                      {isUrdu ? '🎯 میری موجودہ لوکیشن (GPS)' : '🎯 Use My Live Location (GPS)'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {isLocating 
                        ? (isUrdu ? 'سیٹلائٹ سگنل موصول ہو رہا ہے...' : 'Locating device via GPS...')
                        : (isUrdu ? 'خودکار طور پر موجودہ جگہ کا پتہ لگائیں' : 'Auto-detect exact current spot')}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold shrink-0">
                  {isLocating ? '...' : (isUrdu ? 'شناخت کریں' : 'Locate')}
                </span>
              </button>
            )}

            {/* Custom Location Option if Query is Typed */}
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => handleSelectCustom(searchQuery.trim())}
                className="w-full p-2.5 mb-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-left flex items-center justify-between gap-2 text-emerald-950 font-bold transition shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-black truncate">
                      {isUrdu ? `بطور مقام منتخب کریں: "${searchQuery.trim()}"` : `Use: "${searchQuery.trim()}"`}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {isUrdu ? 'کسٹم پتہ / مخصوص جگہ' : 'Custom Address / Specific Location'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-md font-bold shrink-0 shadow-2xs">
                  {isUrdu ? 'منتخب کریں' : 'Select'}
                </span>
              </button>
            )}

            {landmarksWithDistance.length === 0 ? (
              <div className="py-5 text-center text-slate-500 space-y-2.5 px-2">
                <p className="text-xs font-semibold text-slate-700">
                  {isUrdu ? `"${searchQuery}" کا کوئی پہلے سے درج لینڈ مارک نہیں ملا` : `No preset landmark matching "${searchQuery}"`}
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectCustom(searchQuery.trim())}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isUrdu ? `"${searchQuery}" بطور پتہ استعمال کریں` : `Use "${searchQuery}" as ${label}`}</span>
                </button>
                <p className="text-[10px] text-slate-400">
                  {isUrdu ? '💡 آپ نقشے پر ٹیپ کر کے بھی اپنی پن لگا سکتے ہیں' : '💡 Tip: You can also tap anywhere on the map to pin your exact spot!'}
                </p>
              </div>
            ) : (
              landmarksWithDistance.map((lm) => {
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {lm.distanceKm !== null && (
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md font-mono">
                          {lm.distanceKm} KM
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
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
