'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

interface Props {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  placeName?: string;
}

export const AdminLocationPickerMap: React.FC<Props> = ({
  lat,
  lng,
  onLocationChange,
  placeName = 'Selected Landmark',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Validate coordinates or fallback to Central Turbat
  const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : 26.0031;
  const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : 63.0544;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [validLat, validLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>')
      .addTo(map);

    // Custom Draggable Pin
    const pinHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 10px; font-weight: 900; background: #064e3b; color: #a7f3d0; padding: 1px 6px; border-radius: 6px; border: 1px solid #10b981; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
          PIN
        </span>
      </div>
    `;

    const pinIcon = L.divIcon({
      html: pinHtml,
      className: 'admin-picker-pin',
      iconSize: [36, 50],
      iconAnchor: [18, 48],
    });

    const marker = L.marker([validLat, validLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const newPos = e.target.getLatLng();
      onLocationChange(
        Math.round(newPos.lat * 100000) / 100000,
        Math.round(newPos.lng * 100000) / 100000
      );
    });

    // Click anywhere on map to reposition pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange(
        Math.round(e.latlng.lat * 100000) / 100000,
        Math.round(e.latlng.lng * 100000) / 100000
      );
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync marker when lat/lng props change from outside (e.g., Google Maps link paste or manual inputs)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const cur = marker.getLatLng();
    if (Math.abs(cur.lat - validLat) > 0.0001 || Math.abs(cur.lng - validLng) > 0.0001) {
      marker.setLatLng([validLat, validLng]);
      map.panTo([validLat, validLng], { animate: true });
    }
  }, [validLat, validLng]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
        <span className="flex items-center gap-1 text-emerald-700">
          <MapPin className="w-3.5 h-3.5" />
          <span>Interactive Map (Click anywhere or drag pin to set exact coordinates)</span>
        </span>
        <button
          type="button"
          onClick={() => onLocationChange(26.0031, 63.0544)}
          className="text-[10px] text-slate-500 hover:text-emerald-600 hover:underline cursor-pointer"
        >
          Reset to Central Turbat
        </button>
      </div>

      <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        {/* Floating coordinates chip */}
        <div className="absolute top-2 left-2 z-[500] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-[10px] font-mono font-bold text-slate-800 pointer-events-none">
          GPS: {validLat.toFixed(5)}, {validLng.toFixed(5)}
        </div>
      </div>
    </div>
  );
};
