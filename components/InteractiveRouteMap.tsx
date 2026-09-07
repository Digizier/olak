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
  Route, 
  Crosshair 
} from 'lucide-react';
import { resolveLocationCoords, getGoogleMapsDirectionsUrl } from '@/lib/routingHelper';

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
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  onPickupChange?: (name: string, coords?: { lat: number; lng: number }) => void;
  onDropoffChange?: (name: string, coords?: { lat: number; lng: number }) => void;
  onDistanceChange?: (distanceKm: number, durationMins: number) => void;
  distanceKm: number;
  landmarks?: CityLandmark[];
  isUrdu?: boolean;
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  pickupName,
  dropoffName,
  pickupCoords: pickupCoordsProp,
  dropoffCoords: dropoffCoordsProp,
  onPickupChange,
  onDropoffChange,
  onDistanceChange,
  distanceKm,
  landmarks = TURBAT_LANDMARKS,
  isUrdu = false,
}) => {
  const [pinPlacementMode, setPinPlacementMode] = useState<'none' | 'pickup' | 'dropoff'>('none');
  const [dynamicKm, setDynamicKm] = useState<number>(distanceKm);
  const [dynamicMins, setDynamicMins] = useState<number>(Math.max(4, Math.round(distanceKm * 2.5 + 2)));
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const currentLandmarks = landmarks.length > 0 ? landmarks : TURBAT_LANDMARKS;

  // Resolve coordinates safely
  const activePickupCoords = resolveLocationCoords(pickupName, pickupCoordsProp, currentLandmarks);
  const activeDropoffCoords = resolveLocationCoords(dropoffName, dropoffCoordsProp, currentLandmarks);

  // 1-Click Google Maps Direction URL for live GPS navigation
  const googleMapsUrl = getGoogleMapsDirectionsUrl(activePickupCoords, activeDropoffCoords, currentLandmarks);

  const handleOpenGoogleMaps = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  // User uses GPS live device location
  const handleGpsLocateMe = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert(isUrdu ? 'آپ کے براؤزر میں جی پی ایس لوکیشن سپورٹ نہیں ہے۔' : 'GPS location is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = isUrdu 
          ? `میری لائیو لوکیشن (${lat.toFixed(4)}, ${lng.toFixed(4)})` 
          : `My Live GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        if (onPickupChange) {
          onPickupChange(label, { lat, lng });
        }
        setPinPlacementMode('none');
      },
      () => {
        setIsLocatingUser(false);
        alert(isUrdu ? 'براہ کرم براؤزر / ڈیوائس میں لوکیشن کی اجازت آن کریں۔' : 'Please allow GPS location permission in your device/browser settings.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Helper to find nearest landmark or return label with coordinates
  const getNearestLandmarkLabel = (coords: { lat: number; lng: number }): { label: string; coords: { lat: number; lng: number } } => {
    let nearest = currentLandmarks[0];
    let minDist = Infinity;
    for (const lm of currentLandmarks) {
      const d = Math.hypot(lm.lat - coords.lat, lm.lng - coords.lng);
      if (d < minDist) {
        minDist = d;
        nearest = lm;
      }
    }
    // If within ~100m of a known landmark, use that landmark name
    if (minDist < 0.001) {
      return { label: nearest.name, coords: { lat: Number(nearest.lat), lng: Number(nearest.lng) } };
    }
    return {
      label: `Custom Pin (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      coords
    };
  };

  // When clicking on a landmark dot
  const handleLandmarkSelect = (lm: CityLandmark) => {
    const coords = { lat: Number(lm.lat), lng: Number(lm.lng) };
    if (pinPlacementMode === 'dropoff') {
      if (onDropoffChange) onDropoffChange(lm.name, coords);
      setPinPlacementMode('none');
    } else {
      if (onPickupChange) onPickupChange(lm.name, coords);
      setPinPlacementMode('none');
    }
  };

  // Explicit Set Pickup
  const handleSetPickup = (coords: { lat: number; lng: number }) => {
    const { label, coords: finalCoords } = getNearestLandmarkLabel(coords);
    if (onPickupChange) onPickupChange(label, finalCoords);
    setPinPlacementMode('none');
  };

  // Explicit Set Dropoff
  const handleSetDropoff = (coords: { lat: number; lng: number }) => {
    const { label, coords: finalCoords } = getNearestLandmarkLabel(coords);
    if (onDropoffChange) onDropoffChange(label, finalCoords);
    setPinPlacementMode('none');
  };

  // Draggable pin handlers
  const handlePickupDrag = (coords: { lat: number; lng: number }) => {
    const { label, coords: finalCoords } = getNearestLandmarkLabel(coords);
    if (onPickupChange) onPickupChange(label, finalCoords);
  };

  const handleDropoffDrag = (coords: { lat: number; lng: number }) => {
    const { label, coords: finalCoords } = getNearestLandmarkLabel(coords);
    if (onDropoffChange) onDropoffChange(label, finalCoords);
  };

  const handleRouteCalculated = (km: number, mins: number) => {
    setDynamicKm(km);
    setDynamicMins(mins);
    if (onDistanceChange) {
      onDistanceChange(km, mins);
    }
  };

  const displayKm = dynamicKm || distanceKm;
  const estimatedMins = dynamicMins || Math.max(4, Math.round(displayKm * 2.5 + 2));

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-5 shadow-md space-y-3.5">
      
      {/* Top Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>{isUrdu ? 'تربت لائیو روٹ میپ' : 'Live Turbat Route Map'}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                OSM Free
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {isUrdu ? 'نقشے پر پن کھینچیں یا اوپر سے منتخب کریں' : 'Drag pins on map or tap to set exact pickup & dropoff'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-end sm:self-auto">
          {/* GPS Quick Locator */}
          <button
            type="button"
            onClick={handleGpsLocateMe}
            disabled={isLocatingUser}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
              isLocatingUser 
                ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title={isUrdu ? 'میری لائیو ڈیوائس لوکیشن حاصل کریں' : 'Detect my live device GPS location'}
          >
            <Crosshair className={`w-3.5 h-3.5 text-emerald-600 ${isLocatingUser ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{isLocatingUser ? (isUrdu ? 'تلاش جاری...' : 'Locating...') : (isUrdu ? 'میری لوکیشن' : 'GPS Me')}</span>
          </button>

          {/* Mode Selector (Mobile Friendly Toggle) */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setPinPlacementMode(prev => prev === 'pickup' ? 'none' : 'pickup')}
              className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                pinPlacementMode === 'pickup' 
                  ? 'bg-emerald-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Click to activate pickup pin placement on map"
            >
              <MapPin className="w-3 h-3" />
              <span>{isUrdu ? 'پک اپ پن' : 'Pickup Pin'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPinPlacementMode(prev => prev === 'dropoff' ? 'none' : 'dropoff')}
              className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                pinPlacementMode === 'dropoff' 
                  ? 'bg-teal-700 text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Click to activate dropoff pin placement on map"
            >
              <Navigation className="w-3 h-3" />
              <span>{isUrdu ? 'منزل پن' : 'Dropoff Pin'}</span>
            </button>
          </div>

          {/* 1-Click Google Maps Link */}
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
            title={isUrdu ? '1-کلک گوگل میپس میں لائیو نیویگیشن کھولیں' : '1-Click Google Maps Live Navigation'}
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Google Maps</span>
          </button>
        </div>
      </div>

      {/* Pin Placement Mode Active Alert Banner */}
      {pinPlacementMode !== 'none' && (
        <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
          pinPlacementMode === 'pickup' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-teal-50 border-teal-300 text-teal-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            <span>
              {pinPlacementMode === 'pickup' 
                ? (isUrdu ? 'نقشے پر کہیں بھی کلک کریں تاکہ پک اپ پن لگایا جا سکے' : 'Tap anywhere on the map to place your PICKUP pin 📍')
                : (isUrdu ? 'نقشے پر کہیں بھی کلک کریں تاکہ منزل کا پن لگایا جا سکے' : 'Tap anywhere on the map to place your DROPOFF pin 🏁')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPinPlacementMode('none')}
            className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer font-bold"
          >
            {isUrdu ? 'منسوخ' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Real Interactive Leaflet OpenStreetMap Visualizer */}
      <LeafletRouteMap
        pickupCoords={activePickupCoords}
        dropoffCoords={activeDropoffCoords}
        pickupName={pickupName}
        dropoffName={dropoffName}
        landmarks={currentLandmarks}
        onLandmarkSelect={handleLandmarkSelect}
        onSetPickup={handleSetPickup}
        onSetDropoff={handleSetDropoff}
        onPickupDrag={handlePickupDrag}
        onDropoffDrag={handleDropoffDrag}
        activePinMode={pinPlacementMode}
        isUrdu={isUrdu}
        onRouteCalculated={handleRouteCalculated}
      />

      {/* AUTOMATED LIVE GPS DISTANCE METER — REAL TIME DISTANCE */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
          <p className="text-[11px] text-slate-500 truncate max-w-sm sm:max-w-md">
            {isUrdu 
              ? `${pickupName.split('(')[0]} ➔ ${dropoffName.split('(')[0]}`
              : `${pickupName.split('(')[0]} ➔ ${dropoffName.split('(')[0]}`}
          </p>
        </div>

        {/* Display Badge showing exact calculated KM & Travel Duration & 1-Click Link */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Est. Time</span>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>~{estimatedMins} Mins</span>
            </span>
          </div>

          <div className="bg-white border-2 border-emerald-500 rounded-xl px-3 py-1.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Distance</span>
            <span className="text-base font-black text-slate-900 leading-none">
              {displayKm} <span className="text-xs font-bold text-emerald-600">KM</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Open in Google Maps Navigation"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">1-Click Maps</span>
          </button>
        </div>
      </div>

    </div>
  );
};
