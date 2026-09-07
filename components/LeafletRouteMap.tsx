'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CityLandmark } from '@/lib/types';
import { getRoadRoute } from '@/lib/routingHelper';

interface Props {
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
  pickupName: string;
  dropoffName: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  landmarks?: CityLandmark[];
  onLandmarkSelect?: (lm: CityLandmark) => void;
  activePinMode?: 'pickup' | 'dropoff';
  heightClass?: string;
  isUrdu?: boolean;
  onRouteCalculated?: (distanceKm: number, durationMins: number) => void;
}

export const LeafletRouteMap: React.FC<Props> = ({
  pickupCoords,
  dropoffCoords,
  pickupName,
  dropoffName,
  onMapClick,
  landmarks = [],
  onLandmarkSelect,
  activePinMode = 'pickup',
  heightClass = 'h-64 sm:h-72',
  isUrdu = false,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double initialization

    // Turbat default center
    const defaultCenter: [number, number] = [
      pickupCoords.lat || 26.0031,
      pickupCoords.lng || 63.0544,
    ];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // High-performance OpenStreetMap standard tiles (100% Free, zero API key, zero watermark)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // Attribution control in bottom right
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>')
      .addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    routeLayerRef.current = routeLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Handle map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    // Invalidate size after layout renders
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Routing when coordinates or landmarks change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !markersLayer || !routeLayer) return;

    // Clear previous elements
    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // 1. Pickup Icon (Emerald)
    const pickupHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span style="margin-top: 3px; font-size: 10px; font-weight: 900; background: #064e3b; color: #a7f3d0; padding: 1px 6px; border-radius: 6px; border: 1px solid #10b981; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
          ${isUrdu ? 'پک اپ' : 'PICKUP'}
        </span>
      </div>
    `;

    const pickupIcon = L.divIcon({
      html: pickupHtml,
      className: 'custom-pickup-pin',
      iconSize: [36, 50],
      iconAnchor: [18, 48],
    });

    // 2. Dropoff Icon (Teal/Dark Slate)
    const dropoffHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #0f766e; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <span style="margin-top: 3px; font-size: 10px; font-weight: 900; background: #0f172a; color: #5eead4; padding: 1px 6px; border-radius: 6px; border: 1px solid #14b8a6; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
          ${isUrdu ? 'منزل' : 'DROPOFF'}
        </span>
      </div>
    `;

    const dropoffIcon = L.divIcon({
      html: dropoffHtml,
      className: 'custom-dropoff-pin',
      iconSize: [36, 50],
      iconAnchor: [18, 48],
    });

    // Add Pickup & Dropoff Markers
    const pMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon, zIndexOffset: 1000 })
      .addTo(markersLayer)
      .bindPopup(`<strong>${isUrdu ? 'پک اپ مقام' : 'Pickup Point'}</strong><br/>${pickupName}`);

    const dMarker = L.marker([dropoffCoords.lat, dropoffCoords.lng], { icon: dropoffIcon, zIndexOffset: 950 })
      .addTo(markersLayer)
      .bindPopup(`<strong>${isUrdu ? 'منزل' : 'Dropoff Point'}</strong><br/>${dropoffName}`);

    // 3. Add Landmark Hotspots (Clickable dots)
    landmarks.forEach((lm) => {
      const isCurrentPickup = Math.abs(lm.lat - pickupCoords.lat) < 0.0005 && Math.abs(lm.lng - pickupCoords.lng) < 0.0005;
      const isCurrentDropoff = Math.abs(lm.lat - dropoffCoords.lat) < 0.0005 && Math.abs(lm.lng - dropoffCoords.lng) < 0.0005;
      if (isCurrentPickup || isCurrentDropoff) return; // Already rendered as major pin

      const dotHtml = `
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #64748b; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3); transition: all 0.2s;" title="${lm.name}"></div>
      `;

      const dotIcon = L.divIcon({
        html: dotHtml,
        className: 'landmark-dot',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const lmMarker = L.marker([lm.lat, lm.lng], { icon: dotIcon, zIndexOffset: 100 })
        .addTo(markersLayer)
        .bindTooltip(lm.name.split(',')[0], { direction: 'top', offset: [0, -5] });

      if (onLandmarkSelect) {
        lmMarker.on('click', () => onLandmarkSelect(lm));
      }
    });

    // 4. Fetch Real Road Routing & Draw Polyline
    setIsLoadingRoute(true);
    getRoadRoute(pickupCoords, dropoffCoords)
      .then((routeResult) => {
        setIsLoadingRoute(false);
        if (!routeLayerRef.current) return;

        // Base glow line
        L.polyline(routeResult.coordinates, {
          color: '#059669',
          weight: 6,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current);

        // Center dashed bright line
        L.polyline(routeResult.coordinates, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.9,
          dashArray: '5, 8',
          lineCap: 'round',
        }).addTo(routeLayerRef.current);

        if (onRouteCalculated) {
          onRouteCalculated(routeResult.distanceKm, routeResult.durationMins);
        }

        // Fit map bounds smoothly
        const bounds = L.latLngBounds([
          [pickupCoords.lat, pickupCoords.lng],
          [dropoffCoords.lat, dropoffCoords.lng],
        ]);
        map.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 15,
          animate: true,
        });
      })
      .catch(() => {
        setIsLoadingRoute(false);
      });
  }, [
    pickupCoords.lat,
    pickupCoords.lng,
    dropoffCoords.lat,
    dropoffCoords.lng,
    pickupName,
    dropoffName,
    landmarks.length,
    isUrdu,
  ]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Floating Mode Indicator / Instruction */}
      <div className="absolute top-2.5 left-2.5 z-[500] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-800 flex items-center gap-2 pointer-events-none">
        <span className={`w-2.5 h-2.5 rounded-full animate-ping ${activePinMode === 'pickup' ? 'bg-emerald-500' : 'bg-teal-600'}`}></span>
        <span>
          {isUrdu 
            ? (activePinMode === 'pickup' ? 'نقشے پر کلک کر کے پک اپ سیٹ کریں' : 'نقشے پر کلک کر کے منزل سیٹ کریں')
            : (activePinMode === 'pickup' ? 'Click map to place Pickup' : 'Click map to place Dropoff')}
        </span>
      </div>

      {/* Loading Indicator */}
      {isLoadingRoute && (
        <div className="absolute top-2.5 right-2.5 z-[500] bg-emerald-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-spin"></span>
          <span>{isUrdu ? 'روٹ کا حساب ہو رہا ہے...' : 'Routing...'}</span>
        </div>
      )}

      {/* Quick Map Legend */}
      <div className="absolute bottom-2 left-2 z-[500] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-700 font-bold flex items-center gap-3 shadow-xs pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>{isUrdu ? 'پک اپ' : 'Pickup'}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
          <span>{isUrdu ? 'منزل' : 'Dropoff'}</span>
        </span>
        <span className="text-slate-400 hidden sm:inline">| OpenStreetMap</span>
      </div>
    </div>
  );
};
