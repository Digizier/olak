'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getRoadRoute } from '@/lib/routingHelper';
import { Navigation, ExternalLink, Route, Clock } from 'lucide-react';

interface Props {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  duration: string;
  isUrdu?: boolean;
}

// Known regional coordinates for Balochistan & Sindh intercity destinations
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
  'karachi': { lat: 24.8607, lng: 67.0011, nameUrdu: 'کراچی' },
  'khuzdar': { lat: 27.8000, lng: 66.6167, nameUrdu: 'خضدار' },
  'awaran': { lat: 26.4500, lng: 65.2333, nameUrdu: 'آواران' },
};

export const IntercityRouteMap: React.FC<Props> = ({
  originCity,
  destinationCity,
  distanceKm,
  duration,
  isUrdu = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [actualKm, setActualKm] = useState<number>(distanceKm);

  const cleanOrigin = (originCity || 'Turbat').toLowerCase().trim();
  const cleanDest = (destinationCity || 'Gwadar').toLowerCase().trim();

  const originCoords = INTERCITY_CITY_COORDINATES[cleanOrigin] || { lat: 26.0031, lng: 63.0544, nameUrdu: originCity };
  const destCoords = INTERCITY_CITY_COORDINATES[cleanDest] || { lat: 25.1264, lng: 62.3225, nameUrdu: destinationCity };

  // Google Maps Direction URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&travelmode=driving`;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [originCoords.lat, originCoords.lng],
      zoom: 8,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>')
      .addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    routeLayerRef.current = routeLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route and Pins on city change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // Origin Pin (Emerald)
    const originHtml = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="width: 30px; height: 30px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 10px; font-weight: 900; background: #064e3b; color: #a7f3d0; padding: 1px 6px; border-radius: 6px; border: 1px solid #10b981; white-space: nowrap;">
          ${originCity}
        </span>
      </div>
    `;

    const originIcon = L.divIcon({
      html: originHtml,
      className: 'intercity-origin-pin',
      iconSize: [36, 48],
      iconAnchor: [18, 44],
    });

    // Destination Pin (Teal)
    const destHtml = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="width: 30px; height: 30px; border-radius: 50%; background: #0f766e; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 10px; font-weight: 900; background: #0f172a; color: #5eead4; padding: 1px 6px; border-radius: 6px; border: 1px solid #14b8a6; white-space: nowrap;">
          ${destinationCity}
        </span>
      </div>
    `;

    const destIcon = L.divIcon({
      html: destHtml,
      className: 'intercity-dest-pin',
      iconSize: [36, 48],
      iconAnchor: [18, 44],
    });

    L.marker([originCoords.lat, originCoords.lng], { icon: originIcon, zIndexOffset: 1000 })
      .addTo(markersLayer)
      .bindPopup(`<strong>${originCity}</strong><br/>Highway Departure Terminal`);

    L.marker([destCoords.lat, destCoords.lng], { icon: destIcon, zIndexOffset: 950 })
      .addTo(markersLayer)
      .bindPopup(`<strong>${destinationCity}</strong><br/>Arrival Terminal`);

    // Fetch Highway Route & Draw Line
    getRoadRoute(originCoords, destCoords)
      .then((routeResult) => {
        if (!routeLayerRef.current) return;

        L.polyline(routeResult.coordinates, {
          color: '#059669',
          weight: 6,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current);

        L.polyline(routeResult.coordinates, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.9,
          dashArray: '6, 8',
          lineCap: 'round',
        }).addTo(routeLayerRef.current);

        setActualKm(routeResult.distanceKm);

        const bounds = L.latLngBounds([
          [originCoords.lat, originCoords.lng],
          [destCoords.lat, destCoords.lng],
        ]);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 12,
          animate: true,
        });
      })
      .catch(() => {});
  }, [cleanOrigin, cleanDest, originCity, destinationCity]);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
      
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Route className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-slate-900">
            {isUrdu ? 'ہائی وے روٹ لائیو میپ' : 'Live Highway Route Corridor'}
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            {actualKm || distanceKm} KM
          </span>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-600 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          title="Open in Google Maps"
        >
          <ExternalLink className="w-3 h-3 text-emerald-600" />
          <span className="hidden sm:inline">Google Maps</span>
        </a>
      </div>

      {/* Map view */}
      <div className="relative w-full h-52 sm:h-60 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Route Banner */}
        <div className="absolute top-2.5 left-2.5 z-[500] bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-800 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{originCity} ➔ {destinationCity}</span>
        </div>

        {/* Floating Duration Tag */}
        <div className="absolute bottom-2 right-2 z-[500] bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md pointer-events-none">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>{duration}</span>
        </div>
      </div>

    </div>
  );
};
