'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getRoadRoute } from '@/lib/routingHelper';
import { ExternalLink, Route, Clock, MapPin, Navigation } from 'lucide-react';

interface Props {
  originCity: string;
  destinationCity: string;
  distanceKm?: number;
  duration?: string;
  isUrdu?: boolean;
  heightClass?: string;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  onRouteCalculated?: (distanceKm: number, durationMins: number) => void;
  allowPinDrop?: boolean;
  onOriginChange?: (name: string, coords: { lat: number; lng: number }) => void;
  onDestinationChange?: (name: string, coords: { lat: number; lng: number }) => void;
}

// Comprehensive regional coordinates for Balochistan, Sindh & Pakistan transport hubs
export const INTERCITY_CITY_COORDINATES: Record<string, { lat: number; lng: number; nameUrdu: string }> = {
  'turbat': { lat: 26.0031, lng: 63.0544, nameUrdu: 'تربت' },
  'gwadar': { lat: 25.1264, lng: 62.3225, nameUrdu: 'گوادر' },
  'pasni': { lat: 25.2631, lng: 63.4692, nameUrdu: 'پسنی' },
  'jiwani': { lat: 25.0485, lng: 61.7410, nameUrdu: 'جیونی' },
  'tump': { lat: 26.0827, lng: 62.5938, nameUrdu: 'تمپ' },
  'mand': { lat: 26.0450, lng: 62.0620, nameUrdu: 'مند' },
  'panjgur': { lat: 26.9644, lng: 64.0903, nameUrdu: 'پنجگور' },
  'quetta': { lat: 30.1798, lng: 66.9750, nameUrdu: 'کوئٹہ' },
  'hub chowki': { lat: 25.0270, lng: 66.8833, nameUrdu: 'حب چوکی' },
  'hub': { lat: 25.0270, lng: 66.8833, nameUrdu: 'حب' },
  'karachi': { lat: 24.8607, lng: 67.0011, nameUrdu: 'کراچی' },
  'khuzdar': { lat: 27.8000, lng: 66.6167, nameUrdu: 'خضدار' },
  'awaran': { lat: 26.4500, lng: 65.2333, nameUrdu: 'آواران' },
  'ormara': { lat: 25.2088, lng: 64.6357, nameUrdu: 'اورماڑہ' },
  'hoshab': { lat: 26.0028, lng: 63.9014, nameUrdu: 'ہوشاب' },
  'bela': { lat: 26.2271, lng: 66.3115, nameUrdu: 'بیلہ' },
  'uthal': { lat: 25.8072, lng: 66.6219, nameUrdu: 'اوتھل' },
  'buleda': { lat: 26.2625, lng: 63.0289, nameUrdu: 'بلیدہ' },
  'zamuran': { lat: 26.4167, lng: 62.5000, nameUrdu: 'زامران' },
  'dasht': { lat: 25.8333, lng: 62.2500, nameUrdu: 'دشت' },
  'surab': { lat: 28.4914, lng: 66.2585, nameUrdu: 'سوراب' },
  'kalat': { lat: 29.0266, lng: 66.5936, nameUrdu: 'قلات' },
  'mastung': { lat: 29.7997, lng: 66.8455, nameUrdu: 'مستونگ' },
  'pishin': { lat: 30.5803, lng: 66.9961, nameUrdu: 'پشین' },
  'chaman': { lat: 30.9236, lng: 66.4512, nameUrdu: 'چمن' },
  'sibi': { lat: 29.5448, lng: 67.8764, nameUrdu: 'سبی' },
  'nushki': { lat: 29.5542, lng: 66.0215, nameUrdu: 'نوشکی' },
  'dalbandin': { lat: 28.8885, lng: 64.4062, nameUrdu: 'دالبندین' },
  'taftan': { lat: 28.9667, lng: 61.5833, nameUrdu: 'تفتان' },
  'lasbela': { lat: 25.8072, lng: 66.6219, nameUrdu: 'لسبیلہ' },
  'sukkur': { lat: 27.7052, lng: 68.8574, nameUrdu: 'سکھر' },
  'larkana': { lat: 27.5590, lng: 68.2120, nameUrdu: 'لاڑکانہ' },
  'hyderabad': { lat: 25.3960, lng: 68.3578, nameUrdu: 'حیدرآباد' },
  'multan': { lat: 30.1575, lng: 71.5249, nameUrdu: 'ملتان' },
  'lahore': { lat: 31.5204, lng: 74.3587, nameUrdu: 'لاہور' },
  'islamabad': { lat: 33.6844, lng: 73.0479, nameUrdu: 'اسلام آباد' },
  'rawalpindi': { lat: 33.5651, lng: 73.0169, nameUrdu: 'راولپنڈی' },
  'peshawar': { lat: 34.0151, lng: 71.5249, nameUrdu: 'پشاور' },
};

export function resolveIntercityCoords(cityName: string, fallbackCoords?: { lat: number; lng: number }): { lat: number; lng: number; nameUrdu: string } {
  if (fallbackCoords && Number.isFinite(fallbackCoords.lat) && Number.isFinite(fallbackCoords.lng)) {
    return { lat: fallbackCoords.lat, lng: fallbackCoords.lng, nameUrdu: cityName };
  }

  const clean = (cityName || '').toLowerCase().trim();
  if (!clean) return { lat: 26.0031, lng: 63.0544, nameUrdu: 'تربت' };

  if (INTERCITY_CITY_COORDINATES[clean]) {
    return INTERCITY_CITY_COORDINATES[clean];
  }

  // Substring match
  for (const [key, val] of Object.entries(INTERCITY_CITY_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val;
    }
  }

  return { lat: 26.0031, lng: 63.0544, nameUrdu: cityName };
}

export const IntercityRouteMap: React.FC<Props> = ({
  originCity,
  destinationCity,
  distanceKm = 150,
  duration = '2.5 Hours',
  isUrdu = false,
  heightClass = 'h-56 sm:h-64',
  originCoords: propOriginCoords,
  destinationCoords: propDestCoords,
  onRouteCalculated,
  allowPinDrop = false,
  onOriginChange,
  onDestinationChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [actualKm, setActualKm] = useState<number>(distanceKm);
  const [actualDuration, setActualDuration] = useState<string>(duration);
  const [pinPlacementMode, setPinPlacementMode] = useState<'none' | 'origin' | 'destination'>('none');

  const [resolvedOrigin, setResolvedOrigin] = useState<{ lat: number; lng: number; nameUrdu: string }>(() =>
    resolveIntercityCoords(originCity, propOriginCoords)
  );
  const [resolvedDest, setResolvedDest] = useState<{ lat: number; lng: number; nameUrdu: string }>(() =>
    resolveIntercityCoords(destinationCity || 'Gwadar', propDestCoords)
  );

  // Callbacks ref for map event handling
  const callbacksRef = useRef({
    pinPlacementMode,
    onOriginChange,
    onDestinationChange,
    allowPinDrop,
  });

  useEffect(() => {
    callbacksRef.current = {
      pinPlacementMode,
      onOriginChange,
      onDestinationChange,
      allowPinDrop,
    };
  }, [pinPlacementMode, onOriginChange, onDestinationChange, allowPinDrop]);

  // Sync coords when props change
  useEffect(() => {
    setResolvedOrigin(resolveIntercityCoords(originCity, propOriginCoords));
  }, [originCity, propOriginCoords?.lat, propOriginCoords?.lng]);

  useEffect(() => {
    setResolvedDest(resolveIntercityCoords(destinationCity || 'Gwadar', propDestCoords));
  }, [destinationCity, propDestCoords?.lat, propDestCoords?.lng]);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${resolvedOrigin.lat},${resolvedOrigin.lng}&destination=${resolvedDest.lat},${resolvedDest.lng}&travelmode=driving`;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [resolvedOrigin.lat, resolvedOrigin.lng],
      zoom: 8,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false, // Smooth page scroll without hijacking
      touchZoom: true,
      doubleClickZoom: true,
      dragging: true,
    });

    // Google Maps standard road tiles
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; Google Maps',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; Google Maps')
      .addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    routeLayerRef.current = routeLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Interactive map click for pin placement
    map.on('click', (e: L.LeafletMouseEvent) => {
      const cb = callbacksRef.current;
      if (!cb.allowPinDrop) return;
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (cb.pinPlacementMode === 'origin') {
        const label = `Pickup (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
        if (cb.onOriginChange) cb.onOriginChange(label, coords);
        setPinPlacementMode('none');
      } else if (cb.pinPlacementMode === 'destination') {
        const label = `Dropoff (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
        if (cb.onDestinationChange) cb.onDestinationChange(label, coords);
        setPinPlacementMode('none');
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route and Pins when coordinates or cities change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // 1. High-Contrast Origin Pin (Emerald)
    const originHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.45); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 10px; font-weight: 900; background: #064e3b; color: #a7f3d0; padding: 2px 6px; border-radius: 6px; border: 1px solid #10b981; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.35);">
          ${isUrdu ? '📍 آغاز: ' : '📍 '}${originCity || 'Turbat'}
        </span>
      </div>
    `;

    const originIcon = L.divIcon({
      html: originHtml,
      className: 'intercity-origin-pin',
      iconSize: [42, 52],
      iconAnchor: [21, 50],
    });

    // 2. High-Contrast Destination Pin (Red Flag)
    const destHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.45); border: 2.5px solid white;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 10px; font-weight: 900; background: #7f1d1d; color: #fecaca; padding: 2px 6px; border-radius: 6px; border: 1px solid #ef4444; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.35);">
          ${isUrdu ? '🏁 منزل: ' : '🏁 '}${destinationCity || 'Gwadar'}
        </span>
      </div>
    `;

    const destIcon = L.divIcon({
      html: destHtml,
      className: 'intercity-dest-pin',
      iconSize: [42, 52],
      iconAnchor: [21, 50],
    });

    const pMarker = L.marker([resolvedOrigin.lat, resolvedOrigin.lng], { 
      icon: originIcon, 
      zIndexOffset: 1000,
      draggable: Boolean(allowPinDrop),
    }).addTo(markersLayer);

    pMarker.bindPopup(`<strong>${originCity || 'Origin'}</strong><br/>${isUrdu ? 'ہائی وے روانگی مقام' : 'Highway Departure Point'}`);

    if (allowPinDrop) {
      pMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const coords = { lat: pos.lat, lng: pos.lng };
        const label = `${originCity || 'Origin'} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
        if (onOriginChange) onOriginChange(label, coords);
      });
    }

    const dMarker = L.marker([resolvedDest.lat, resolvedDest.lng], { 
      icon: destIcon, 
      zIndexOffset: 950,
      draggable: Boolean(allowPinDrop),
    }).addTo(markersLayer);

    dMarker.bindPopup(`<strong>${destinationCity || 'Destination'}</strong><br/>${isUrdu ? 'ہائی وے آمد مقام' : 'Highway Arrival Destination'}`);

    if (allowPinDrop) {
      dMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const coords = { lat: pos.lat, lng: pos.lng };
        const label = `${destinationCity || 'Destination'} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
        if (onDestinationChange) onDestinationChange(label, coords);
      });
    }

    // Initial bounds fit
    const initialBounds = L.latLngBounds([
      [resolvedOrigin.lat, resolvedOrigin.lng],
      [resolvedDest.lat, resolvedDest.lng],
    ]);
    map.fitBounds(initialBounds, { padding: [45, 45], maxZoom: 14, animate: false });

    // 3. Fetch Road Routing & Draw 3-Layer Polyline
    getRoadRoute(resolvedOrigin, resolvedDest)
      .then((routeResult) => {
        if (!routeLayerRef.current) return;

        // Base dark glow
        L.polyline(routeResult.coordinates, {
          color: '#064e3b',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current);

        // Vibrant emerald road line
        L.polyline(routeResult.coordinates, {
          color: '#10b981',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current);

        // Center dashed bright tracer
        L.polyline(routeResult.coordinates, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.9,
          dashArray: '5, 7',
          lineCap: 'round',
        }).addTo(routeLayerRef.current);

        setActualKm(routeResult.distanceKm);
        const hours = (routeResult.distanceKm / 65).toFixed(1);
        const durStr = `${hours} Hours`;
        setActualDuration(durStr);

        if (onRouteCalculated) {
          onRouteCalculated(routeResult.distanceKm, routeResult.durationMins);
        }

        // Fit map bounds smoothly to the full route
        const routeBounds = L.latLngBounds([
          [resolvedOrigin.lat, resolvedOrigin.lng],
          [resolvedDest.lat, resolvedDest.lng],
        ]);
        if (routeResult.coordinates && routeResult.coordinates.length > 0) {
          routeResult.coordinates.forEach((pt) => routeBounds.extend(pt));
        }

        map.fitBounds(routeBounds, {
          padding: [45, 45],
          maxZoom: 14,
          animate: true,
        });
      })
      .catch(() => {});
  }, [resolvedOrigin.lat, resolvedOrigin.lng, resolvedDest.lat, resolvedDest.lng, originCity, destinationCity, isUrdu, allowPinDrop]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3 space-y-2.5 shadow-sm">
      {/* Top Header with Pin Mode Selectors & Google Maps Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Route className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-slate-900">
                {isUrdu ? 'ہائی وے روٹ لائیو میپ' : 'Live Highway Route Corridor'}
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                Google Maps
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {isUrdu ? 'نقشے پر پن لگائیں یا اوپر سے تلاش کریں' : 'Drag pins on map or tap to set exact pickup & dropoff'}
            </p>
          </div>
        </div>

        {/* Pin placement tools (if enabled) + Google Maps Link */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-end sm:self-auto">
          {allowPinDrop && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPinPlacementMode(prev => prev === 'origin' ? 'none' : 'origin');
                }}
                className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                  pinPlacementMode === 'origin'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tap map to set Origin / Pickup spot"
              >
                <MapPin className="w-2.5 h-2.5" />
                <span>{isUrdu ? 'پک اپ' : 'Pickup'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPinPlacementMode(prev => prev === 'destination' ? 'none' : 'destination');
                }}
                className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                  pinPlacementMode === 'destination'
                    ? 'bg-red-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tap map to set Destination / Dropoff spot"
              >
                <Navigation className="w-2.5 h-2.5" />
                <span>{isUrdu ? 'منزل' : 'Dropoff'}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
            title={isUrdu ? 'گوگل میپس میں کھولیں' : 'Open in Google Maps'}
          >
            <ExternalLink className="w-3 h-3" />
            <span>Google Maps</span>
          </button>
        </div>
      </div>

      {/* Pin Placement Mode Active Alert Banner */}
      {pinPlacementMode !== 'none' && (
        <div className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs ${
          pinPlacementMode === 'origin'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0"></span>
            <span className="truncate">
              {pinPlacementMode === 'origin'
                ? (isUrdu ? 'نقشے پر ٹیپ کر کے روانگی مقام (پک اپ) پن لگائیں 📍' : 'Tap map to set ORIGIN PICKUP 📍')
                : (isUrdu ? 'نقشے پر ٹیپ کر کے منزل (ڈراپ آف) پن لگائیں 🏁' : 'Tap map to set DESTINATION DROPOFF 🏁')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPinPlacementMode('none')}
            className="text-slate-500 hover:text-slate-900 text-[10px] underline cursor-pointer shrink-0"
          >
            {isUrdu ? 'منسوخ' : 'Done'}
          </button>
        </div>
      )}

      {/* Map view container - NO overlapping badge on top-left to avoid Leaflet +/- zoom buttons */}
      <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Google Maps Indicator Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-[500] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-black text-slate-800 shadow-xs flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Maps</span>
        </div>

        {/* Floating Duration Tag (Bottom Right) */}
        <div className="absolute bottom-2 right-2 z-[500] bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md pointer-events-none">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>{actualDuration || duration}</span>
        </div>

        {/* Legend (Bottom Left) */}
        <div className="absolute bottom-2 left-2 z-[500] bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-200 text-[9px] text-slate-700 font-bold flex items-center gap-1.5 shadow-xs pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Origin</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>Destination</span>
          </span>
        </div>
      </div>

      {/* City-Rides-Style Bottom Summary Bar (No zoom overlap, 100% clean & responsive) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 px-1 text-xs border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-0">
          <Route className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{originCity || 'Turbat'} ➔ {destinationCity || 'Gwadar'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs">
            DISTANCE {actualKm || distanceKm} KM
          </span>
          <button
            type="button"
            onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
            className="text-[10px] text-emerald-700 font-black hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <ExternalLink className="w-2.5 h-2.5" /> 1-Click Maps
          </button>
        </div>
      </div>
    </div>
  );
};
