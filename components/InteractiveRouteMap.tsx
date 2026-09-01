'use client';

import React, { useState } from 'react';
import { CityLandmark } from '@/lib/types';
import { TURBAT_LANDMARKS } from '@/lib/constants';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  ExternalLink, 
  Clock,
  ShieldCheck,
  CheckCircle2,
  Route
} from 'lucide-react';

interface InteractiveRouteMapProps {
  pickupName: string;
  dropoffName: string;
  onPickupChange?: (name: string, coords?: { lat: number; lng: number }) => void;
  onDropoffChange?: (name: string, coords?: { lat: number; lng: number }) => void;
  distanceKm: number;
  landmarks?: CityLandmark[];
  isUrdu?: boolean;
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  pickupName,
  dropoffName,
  onPickupChange,
  onDropoffChange,
  distanceKm,
  landmarks = TURBAT_LANDMARKS,
  isUrdu = false,
}) => {
  const [activePinSelection, setActivePinSelection] = useState<'pickup' | 'dropoff'>('pickup');

  // Find landmarks coords
  const currentLandmarks = landmarks.length > 0 ? landmarks : TURBAT_LANDMARKS;
  const pickupLandmark = currentLandmarks.find(l => l.name === pickupName) || currentLandmarks[0];
  const dropoffLandmark = currentLandmarks.find(l => l.name === dropoffName) || currentLandmarks[2] || currentLandmarks[0];

  // Turbat coordinate bounds
  const minLat = 25.9800;
  const maxLat = 26.0400;
  const minLng = 63.0200;
  const maxLng = 63.1200;

  // Convert coords to percentage position on canvas
  const getCanvasCoords = (lat: number, lng: number) => {
    const x = Math.max(10, Math.min(90, ((lng - minLng) / (maxLng - minLng)) * 100));
    const y = Math.max(10, Math.min(90, 100 - ((lat - minLat) / (maxLat - minLat)) * 100));
    return { x, y };
  };

  const pPos = getCanvasCoords(pickupLandmark.lat, pickupLandmark.lng);
  const dPos = getCanvasCoords(dropoffLandmark.lat, dropoffLandmark.lng);

  // Google Maps Direction URL for live GPS navigation
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickupLandmark.lat},${pickupLandmark.lng}&destination=${dropoffLandmark.lat},${dropoffLandmark.lng}&travelmode=driving`;

  const handleLandmarkClick = (lm: CityLandmark) => {
    if (activePinSelection === 'pickup') {
      if (onPickupChange) onPickupChange(lm.name, { lat: lm.lat, lng: lm.lng });
      setActivePinSelection('dropoff');
    } else {
      if (onDropoffChange) onDropoffChange(lm.name, { lat: lm.lat, lng: lm.lng });
      setActivePinSelection('pickup');
    }
  };

  // Estimated driving time (approx 2.5 min per km + 2 min pickup buffer)
  const estimatedMins = Math.max(4, Math.round(distanceKm * 2.5 + 2));

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-md space-y-4">
      
      {/* Top Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>{isUrdu ? 'تربت لائیو روٹ میپ' : 'Live Turbat Route Map'}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                GPS
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {isUrdu ? 'نقشے پر مقام منتخب کریں — فاصلہ خودکار طریقے سے طے ہوگا' : 'Select points on map — Real-time distance is calculated automatically'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActivePinSelection('pickup')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                activePinSelection === 'pickup' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📍 {isUrdu ? 'پک اپ' : 'Pickup'}
            </button>
            <button
              type="button"
              onClick={() => setActivePinSelection('dropoff')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                activePinSelection === 'dropoff' 
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏁 {isUrdu ? 'منزل' : 'Dropoff'}
            </button>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">Google Maps</span>
          </a>
        </div>
      </div>

      {/* Interactive Map Visualizer Container */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 select-none">
        
        {/* Background Map Graphic (Vector Turbat City Grid + Roads) */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern-user" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>
            {/* Kech River Flow Pattern */}
            <linearGradient id="riverGradientUser" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.8" />
            </linearGradient>
            {/* Pulsing Dash on Route */}
            <linearGradient id="routeGradientUser" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D084" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* City Grid Background */}
          <rect width="100%" height="100%" fill="url(#grid-pattern-user)" />

          {/* Kech River Flow Simulation Path */}
          <path
            d="M 0 160 Q 150 180 300 130 T 600 110"
            fill="none"
            stroke="url(#riverGradientUser)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Main M-8 CPEC Arterial Road Across Turbat */}
          <line x1="0" y1="60" x2="600" y2="240" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
          <line x1="0" y1="60" x2="600" y2="240" stroke="#f8fafc" strokeWidth="2" strokeDasharray="6 6" />

          {/* Thana Road & Hospital Road Crossings */}
          <line x1="160" y1="0" x2="220" y2="300" stroke="#e2e8f0" strokeWidth="5" />
          <line x1="380" y1="0" x2="320" y2="300" stroke="#e2e8f0" strokeWidth="5" />

          {/* Live Connecting Route Vector between Pickup & Dropoff */}
          <path
            d={`M ${pPos.x}% ${pPos.y}% Q ${(pPos.x + dPos.x) / 2 + 5}% ${(pPos.y + dPos.y) / 2 - 10}% ${dPos.x}% ${dPos.y}%`}
            fill="none"
            stroke="url(#routeGradientUser)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="8 6"
            className="animate-pulse"
          />
        </svg>

        {/* Real Landmarks Points Clickable on Map */}
        {currentLandmarks.map((lm, idx) => {
          const pos = getCanvasCoords(lm.lat, lm.lng);
          const isPickup = lm.name === pickupLandmark.name;
          const isDropoff = lm.name === dropoffLandmark.name;

          return (
            <div
              key={lm.id || idx}
              onClick={() => handleLandmarkClick(lm)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              title={`${lm.name} (${lm.area})`}
            >
              {isPickup ? (
                /* Pickup Marker (Emerald Pin) */
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                    <MapPin className="w-5 h-5 fill-white text-emerald-600" />
                  </div>
                  <span className="mt-1 text-[10px] font-black bg-emerald-900 text-white px-2 py-0.5 rounded-md shadow-md whitespace-nowrap border border-emerald-500">
                    {isUrdu ? 'پک اپ پوائنٹ' : 'PICKUP'}
                  </span>
                </div>
              ) : isDropoff ? (
                /* Dropoff Marker (Teal Pin) */
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                    <Navigation className="w-4 h-4 fill-white text-teal-800" />
                  </div>
                  <span className="mt-1 text-[10px] font-black bg-slate-900 text-teal-300 px-2 py-0.5 rounded-md shadow-md whitespace-nowrap border border-teal-500">
                    {isUrdu ? 'منزل' : 'DROPOFF'}
                  </span>
                </div>
              ) : (
                /* Subtle City Landmark Dots */
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-slate-400 group-hover:bg-emerald-500 group-hover:scale-150 transition-all border border-white shadow-xs"></div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 text-[9px] font-bold bg-white text-slate-800 px-1.5 py-0.5 rounded shadow border border-slate-200 whitespace-nowrap pointer-events-none">
                    {lm.name.split(',')[0]}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Route Badge */}
        <div className="absolute top-3 left-3 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{pickupLandmark.area} ➔ {dropoffLandmark.area}</span>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-2 left-2 z-30 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-semibold flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Pickup</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-800"></span>
            <span>Dropoff</span>
          </span>
          <span className="hidden sm:inline text-slate-400">| Turbat City Network</span>
        </div>
      </div>

      {/* AUTOMATED LIVE GPS DISTANCE METER — NO CONFUSING MANUAL USER INPUT */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-slate-900">
              {isUrdu ? 'رئیل ٹائم جی پی ایس روٹ فاصلہ' : 'Real-Time GPS Route Distance'}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
              Automated
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isUrdu 
              ? `${pickupLandmark.name.split(',')[0]} سے ${dropoffLandmark.name.split(',')[0]} تک روڈ فاصلہ`
              : `Road distance from ${pickupLandmark.name.split(',')[0]} to ${dropoffLandmark.name.split(',')[0]}`}
          </p>
        </div>

        {/* Display Badge showing exact calculated KM & Travel Duration */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Est. Time</span>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>~{estimatedMins} Mins</span>
            </span>
          </div>

          <div className="bg-white border-2 border-emerald-500 rounded-xl px-3.5 py-1.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Distance</span>
            <span className="text-base font-black text-slate-900 leading-none">
              {distanceKm} <span className="text-xs font-bold text-emerald-600">KM</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
