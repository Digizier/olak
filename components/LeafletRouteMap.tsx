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
  onPickupDrag?: (coords: { lat: number; lng: number }) => void;
  onDropoffDrag?: (coords: { lat: number; lng: number }) => void;
  onSetPickup?: (coords: { lat: number; lng: number }) => void;
  onSetDropoff?: (coords: { lat: number; lng: number }) => void;
  landmarks?: CityLandmark[];
  onLandmarkSelect?: (lm: CityLandmark) => void;
  activePinMode?: 'none' | 'pickup' | 'dropoff';
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
  onPickupDrag,
  onDropoffDrag,
  onSetPickup,
  onSetDropoff,
  landmarks = [],
  onLandmarkSelect,
  activePinMode = 'none',
  heightClass = 'h-64 sm:h-72',
  isUrdu = false,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Keep latest callbacks in ref for map click event handler
  const callbacksRef = useRef({
    activePinMode,
    onMapClick,
    onSetPickup,
    onSetDropoff,
    isUrdu,
  });

  useEffect(() => {
    callbacksRef.current = {
      activePinMode,
      onMapClick,
      onSetPickup,
      onSetDropoff,
      isUrdu,
    };
  }, [activePinMode, onMapClick, onSetPickup, onSetDropoff, isUrdu]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double initialization

    // Turbat center with street zoom
    const defaultCenter: [number, number] = [
      pickupCoords.lat || 26.0031,
      pickupCoords.lng || 63.0544,
    ];

    // Scroll-friendly map: scrollWheelZoom is disabled so page scrolling is smooth
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      maxZoom: 20,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false, // Fix: never hijacks user page scroll
      touchZoom: true,
      doubleClickZoom: true,
      dragging: true,
    });

    // Google Maps standard road tiles (full streets, shops, houses, landmarks)
    const tileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; Google Maps',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Attribution control in bottom right
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; Google Maps')
      .addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    routeLayerRef.current = routeLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Mobile-friendly click handling: prevent random unwanted pin overwrites
    map.on('click', (e: L.LeafletMouseEvent) => {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      const current = callbacksRef.current;

      if (current.activePinMode === 'pickup') {
        if (current.onSetPickup) current.onSetPickup(coords);
        else if (current.onMapClick) current.onMapClick(coords);
        return;
      }
      
      if (current.activePinMode === 'dropoff') {
        if (current.onSetDropoff) current.onSetDropoff(coords);
        else if (current.onMapClick) current.onMapClick(coords);
        return;
      }

      // If in browsing / pan mode ('none'), show a confirmation popup with 2 explicit buttons (with type="button" and event prevention)
      const popupDiv = document.createElement('div');
      popupDiv.style.textAlign = 'center';
      popupDiv.style.padding = '4px 2px';
      popupDiv.style.minWidth = '140px';
      popupDiv.innerHTML = `
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          📍 ${current.isUrdu ? 'منتخب شدہ مقام' : 'Selected Location'}
        </div>
        <div style="font-size: 9px; color: #64748b; margin-bottom: 8px; font-family: monospace;">
          ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}
        </div>
        <div style="display: flex; gap: 4px; justify-content: center;">
          <button id="btn-popup-set-pickup" type="button" style="background: #059669; color: white; border: none; border-radius: 6px; padding: 5px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
            📍 ${current.isUrdu ? 'پک اپ بنائیں' : 'Set Pickup'}
          </button>
          <button id="btn-popup-set-dropoff" type="button" style="background: #0f766e; color: white; border: none; border-radius: 6px; padding: 5px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
            🏁 ${current.isUrdu ? 'منزل بنائیں' : 'Set Dropoff'}
          </button>
        </div>
      `;

      L.popup()
        .setLatLng(e.latlng)
        .setContent(popupDiv)
        .openOn(map);

      setTimeout(() => {
        const btnP = document.getElementById('btn-popup-set-pickup');
        const btnD = document.getElementById('btn-popup-set-dropoff');
        if (btnP) {
          btnP.onclick = (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
            map.closePopup();
            if (current.onSetPickup) current.onSetPickup(coords);
            else if (current.onMapClick) current.onMapClick(coords);
          };
        }
        if (btnD) {
          btnD.onclick = (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
            map.closePopup();
            if (current.onSetDropoff) current.onSetDropoff(coords);
            else if (current.onMapClick) current.onMapClick(coords);
          };
        }
      }, 50);
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



    // 1. Pickup Icon (High-contrast Emerald)
    const pickupHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.45); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 10px; font-weight: 900; background: #064e3b; color: #a7f3d0; padding: 2px 6px; border-radius: 6px; border: 1px solid #10b981; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.35);">
          ${isUrdu ? '📍 پک اپ' : '📍 Pickup'}
        </span>
      </div>
    `;

    const pickupIcon = L.divIcon({
      html: pickupHtml,
      className: 'custom-pickup-pin',
      iconSize: [42, 52],
      iconAnchor: [21, 50],
    });

    // 2. Dropoff Icon (High-contrast Red/Indigo Flag)
    const dropoffHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.45); border: 2.5px solid white;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 10px; font-weight: 900; background: #7f1d1d; color: #fecaca; padding: 2px 6px; border-radius: 6px; border: 1px solid #ef4444; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.35);">
          ${isUrdu ? '🏁 منزل' : '🏁 Dropoff'}
        </span>
      </div>
    `;

    const dropoffIcon = L.divIcon({
      html: dropoffHtml,
      className: 'custom-dropoff-pin',
      iconSize: [42, 52],
      iconAnchor: [21, 50],
    });

    // Add Pickup & Dropoff Markers as DRAGGABLE pins
    const pMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { 
      icon: pickupIcon, 
      zIndexOffset: 2000,
      draggable: true,
    }).addTo(markersLayer);

    pMarker.bindPopup(`<strong>${isUrdu ? 'پک اپ مقام' : 'Pickup Point'}</strong><br/>${pickupName}<br/><span style="font-size: 10px; color: #059669; font-weight: bold;">(Drag to fine-tune exact spot)</span>`);

    pMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      if (onPickupDrag) {
        onPickupDrag({ lat: pos.lat, lng: pos.lng });
      }
    });

    const dMarker = L.marker([dropoffCoords.lat, dropoffCoords.lng], { 
      icon: dropoffIcon, 
      zIndexOffset: 1950,
      draggable: true,
    }).addTo(markersLayer);

    dMarker.bindPopup(`<strong>${isUrdu ? 'منزل' : 'Dropoff Point'}</strong><br/>${dropoffName}<br/><span style="font-size: 10px; color: #dc2626; font-weight: bold;">(Drag to fine-tune exact spot)</span>`);

    dMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      if (onDropoffDrag) {
        onDropoffDrag({ lat: pos.lat, lng: pos.lng });
      }
    });

    // 3. Add Turbat Local Landmark POIs on Map only for local views (<= 25 km)
    const dLat = (pickupCoords.lat - dropoffCoords.lat) * 111;
    const dLng = (pickupCoords.lng - dropoffCoords.lng) * 100;
    const distBetweenKm = Math.hypot(dLat, dLng);

    if (distBetweenKm <= 25) {
      const poiCategoryIcons: Record<string, { bg: string; icon: string }> = {
        hospital: { bg: '#dc2626', icon: '🏥' },
        shopping: { bg: '#d97706', icon: '🛍️' },
        education: { bg: '#2563eb', icon: '🎓' },
        bank: { bg: '#059669', icon: '🏦' },
        transit: { bg: '#4f46e5', icon: '🚌' },
        airport: { bg: '#0284c7', icon: '✈️' },
        govt: { bg: '#475569', icon: '🏛️' },
        park: { bg: '#16a34a', icon: '🌳' },
        area: { bg: '#7c3aed', icon: '📍' },
      };

      const curatedLandmarks = landmarks.slice(0, 20);
      curatedLandmarks.forEach((lm) => {
        const isAtPickup = Math.abs(lm.lat - pickupCoords.lat) < 0.0008 && Math.abs(lm.lng - pickupCoords.lng) < 0.0008;
        const isAtDropoff = Math.abs(lm.lat - dropoffCoords.lat) < 0.0008 && Math.abs(lm.lng - dropoffCoords.lng) < 0.0008;
        if (isAtPickup || isAtDropoff) return;

        const category = poiCategoryIcons[lm.category || 'area'] || { bg: '#059669', icon: '📍' };
        const shortDisplay = lm.shortName || lm.name.split(',')[0].slice(0, 16);

        const poiHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;" title="${lm.name}">
            <div style="width: 20px; height: 20px; border-radius: 50%; background: ${category.bg}; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.3); border: 1.5px solid white; font-size: 10px;">
              ${category.icon}
            </div>
            <span style="margin-top: 1px; font-size: 7.5px; font-weight: 800; background: rgba(15, 23, 42, 0.85); color: #f8fafc; padding: 0.5px 3px; border-radius: 3px; white-space: nowrap; max-width: 70px; overflow: hidden; text-overflow: ellipsis; pointer-events: none;">
              ${shortDisplay}
            </span>
          </div>
        `;

        const poiIcon = L.divIcon({
          html: poiHtml,
          className: 'custom-poi-pin',
          iconSize: [70, 32],
          iconAnchor: [35, 10],
        });

        const poiMarker = L.marker([lm.lat, lm.lng], {
          icon: poiIcon,
          zIndexOffset: 300,
        }).addTo(markersLayer);

        const popupDiv = document.createElement('div');
        popupDiv.style.textAlign = 'center';
        popupDiv.style.padding = '4px 2px';
        popupDiv.style.minWidth = '130px';
        popupDiv.innerHTML = `
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
            ${category.icon} ${isUrdu ? (lm.nameUrdu || lm.name_urdu || lm.name) : lm.name}
          </div>
          <div style="font-size: 9px; color: #64748b; margin-bottom: 8px;">
            ${lm.area || ''}
          </div>
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button id="btn-poi-p-${lm.id}" type="button" style="background: #059669; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
              📍 ${isUrdu ? 'پک اپ' : 'Pickup'}
            </button>
            <button id="btn-poi-d-${lm.id}" type="button" style="background: #0f766e; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
              🏁 ${isUrdu ? 'منزل' : 'Dropoff'}
            </button>
          </div>
        `;

        poiMarker.bindPopup(popupDiv);

        poiMarker.on('popupopen', () => {
          const btnP = document.getElementById(`btn-poi-p-${lm.id}`);
          const btnD = document.getElementById(`btn-poi-d-${lm.id}`);
          if (btnP) {
            btnP.onclick = (evt: MouseEvent) => {
              evt.preventDefault();
              evt.stopPropagation();
              map.closePopup();
              if (callbacksRef.current.onSetPickup) callbacksRef.current.onSetPickup({ lat: lm.lat, lng: lm.lng });
            };
          }
          if (btnD) {
            btnD.onclick = (evt: MouseEvent) => {
              evt.preventDefault();
              evt.stopPropagation();
              map.closePopup();
              if (callbacksRef.current.onSetDropoff) callbacksRef.current.onSetDropoff({ lat: lm.lat, lng: lm.lng });
            };
          }
        });
      });
    }

    // Immediately fit bounds to both points with safe padding
    const initialBounds = L.latLngBounds([
      [pickupCoords.lat, pickupCoords.lng],
      [dropoffCoords.lat, dropoffCoords.lng],
    ]);
    map.fitBounds(initialBounds, {
      padding: [45, 45],
      maxZoom: 15,
      animate: false,
    });

    // 4. Fetch Real Road Routing & Draw Polyline
    setIsLoadingRoute(true);
    getRoadRoute(pickupCoords, dropoffCoords)
      .then((routeResult) => {
        setIsLoadingRoute(false);
        if (!routeLayerRef.current) return;

        // Base dark glow line
        L.polyline(routeResult.coordinates, {
          color: '#064e3b',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current);

        // Vibrant main green line
        L.polyline(routeResult.coordinates, {
          color: '#10b981',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current);

        // Center dashed bright tracer line
        L.polyline(routeResult.coordinates, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.9,
          dashArray: '5, 7',
          lineCap: 'round',
        }).addTo(routeLayerRef.current);

        if (onRouteCalculated) {
          onRouteCalculated(routeResult.distanceKm, routeResult.durationMins);
        }

        // Fit map bounds smoothly to the full route line
        const routeBounds = L.latLngBounds([
          [pickupCoords.lat, pickupCoords.lng],
          [dropoffCoords.lat, dropoffCoords.lng],
        ]);
        if (routeResult.coordinates && routeResult.coordinates.length > 0) {
          routeResult.coordinates.forEach(pt => routeBounds.extend(pt));
        }

        map.fitBounds(routeBounds, {
          padding: [45, 45],
          maxZoom: 15,
          animate: true,
        });

        // For extremely close points in Turbat city (<= 3 km), keep street details sharp
        if (distBetweenKm <= 3 && map.getZoom() < 14) {
          map.setZoom(14);
        }
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

      {/* Google Maps Indicator Badge */}
      <div className="absolute top-2.5 right-2.5 z-[500] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-black text-slate-800 shadow-xs flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Google Maps</span>
      </div>

      {/* Floating Mode Indicator / Instruction (when pin mode is active) */}
      {activePinMode !== 'none' && (
        <div className="absolute top-2.5 left-2.5 z-[500] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-300 shadow-md text-xs font-black text-emerald-950 flex items-center gap-2 animate-pulse">
          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${activePinMode === 'pickup' ? 'bg-emerald-500' : 'bg-teal-600'}`}></span>
          <span>
            {isUrdu 
              ? (activePinMode === 'pickup' ? '📍 نقشے پر کسی جگہ کلک کر کے پک اپ پن لگائیں' : '🏁 نقشے پر کسی جگہ کلک کر کے منزل پن لگائیں')
              : (activePinMode === 'pickup' ? '📍 Tap on map to place Pickup Pin' : '🏁 Tap on map to place Dropoff Pin')}
          </span>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoadingRoute && (
        <div className="absolute top-11 right-2.5 z-[500] bg-emerald-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-spin"></span>
          <span>{isUrdu ? 'روٹ کا حساب ہو رہا ہے...' : 'Routing...'}</span>
        </div>
      )}

      {/* Quick Map Legend & Drag Tip */}
      <div className="absolute bottom-2 left-2 z-[500] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-700 font-bold flex items-center gap-2 shadow-xs">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>{isUrdu ? 'پک اپ' : 'Pickup'}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
          <span>{isUrdu ? 'منزل' : 'Dropoff'}</span>
        </span>
        <span className="text-slate-400 font-medium">| {isUrdu ? 'پن کو پکڑ کر کھینچیں' : 'Drag pin to adjust'}</span>
      </div>
    </div>
  );
};

