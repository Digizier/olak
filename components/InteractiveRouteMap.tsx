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

import dynamic from 'next/dynamic';

const LeafletRouteMap = dynamic(
  () => import('@/components/LeafletRouteMap').then((mod) => mod.LeafletRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 sm:h-72 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 animate-pulse">
        <Compass className="w-7 h-7 animate-spin text-emerald-500" />
        <span className="text-xs font-bold text-slate-600">Loading Live Turbat OpenStreetMap...</span>
      </div>
    ),
  }
);

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
  const [dynamicKm, setDynamicKm] = useState<number>(distanceKm);
  const [dynamicMins, setDynamicMins] = useState<number>(Math.max(4, Math.round(distanceKm * 2.5 + 2)));

  // Find landmarks coords
  const currentLandmarks = landmarks.length > 0 ? landmarks : TURBAT_LANDMARKS;
  const pickupLandmark = currentLandmarks.find(l => l.name === pickupName) || currentLandmarks[0];
  const dropoffLandmark = currentLandmarks.find(l => l.name === dropoffName) || currentLandmarks[2] || currentLandmarks[0];

  const pickupCoords = { lat: Number(pickupLandmark.lat), lng: Number(pickupLandmark.lng) };
  const dropoffCoords = { lat: Number(dropoffLandmark.lat), lng: Number(dropoffLandmark.lng) };

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

  // When clicking on an arbitrary location on map, snap to nearest landmark or create custom point
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    // Find nearest landmark to user click
    let nearest: CityLandmark = currentLandmarks[0];
    let minDist = Infinity;

    for (const lm of currentLandmarks) {
      const d = Math.hypot(lm.lat - coords.lat, lm.lng - coords.lng);
      if (d < minDist) {
        minDist = d;
        nearest = lm;
      }
    }

    if (minDist < 0.015) {
      // Snapped to nearby landmark
      handleLandmarkClick(nearest);
    } else {
      // Custom coordinate location
      const label = `Location (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`;
      if (activePinSelection === 'pickup') {
        if (onPickupChange) onPickupChange(label, coords);
        setActivePinSelection('dropoff');
      } else {
        if (onDropoffChange) onDropoffChange(label, coords);
        setActivePinSelection('pickup');
      }
    }
  };

  const handleRouteCalculated = (km: number, mins: number) => {
    setDynamicKm(km);
    setDynamicMins(mins);
  };

  const displayKm = dynamicKm || distanceKm;
  const estimatedMins = dynamicMins || Math.max(4, Math.round(displayKm * 2.5 + 2));

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
              <span>{isUrdu ? 'تربت لائیو اوپن اسٹریٹ میپ' : 'Live Turbat Route Map'}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                OSM Free
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {isUrdu ? 'نقشے پر مقام منتخب کریں — فاصلہ خودکار طریقے سے طے ہوگا' : 'Select points on real map — Real-time road distance is calculated automatically'}
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

      {/* Real Interactive Leaflet OpenStreetMap Visualizer */}
      <LeafletRouteMap
        pickupCoords={pickupCoords}
        dropoffCoords={dropoffCoords}
        pickupName={pickupLandmark.name}
        dropoffName={dropoffLandmark.name}
        landmarks={currentLandmarks}
        onMapClick={handleMapClick}
        onLandmarkSelect={handleLandmarkClick}
        activePinMode={activePinSelection}
        isUrdu={isUrdu}
        onRouteCalculated={handleRouteCalculated}
      />

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
