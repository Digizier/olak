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
  const [mapStyle, setMapStyle] = useState<'voyager' | 'osm'>('voyager');

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

  const CARTO_API_KEY = 'cb1_30a9_1_52c71ad4bffb3a768ffb3eaf';

  // Handle map style change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrl = mapStyle === 'voyager'
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const subdomains = mapStyle === 'voyager' ? ['a', 'b', 'c', 'd'] : ['a', 'b', 'c'];
    const maxZoom = mapStyle === 'voyager' ? 20 : 19;

    const newTile = L.tileLayer(tileUrl, { maxZoom, subdomains }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double initialization

    // Turbat center with street zoom
    const defaultCenter: [number, number] = [
      pickupCoords.lat || 26.0031,
      pickupCoords.lng || 63.0544,
    ];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    // Detailed Streets Tile Layer with verified CARTO API Key
    const tileUrl = mapStyle === 'voyager'
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const subdomains = mapStyle === 'voyager' ? ['a', 'b', 'c', 'd'] : ['a', 'b', 'c'];

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Attribution control in bottom right
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank">CARTO</a>')
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



    // 1. Pickup Icon (Compact Emerald)
    const pickupHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.35); border: 2px solid white;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 9px; font-weight: 800; background: #064e3b; color: #a7f3d0; padding: 1px 5px; border-radius: 5px; border: 1px solid #10b981; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.25);">
          ${isUrdu ? 'پک اپ' : '📍 Pickup'}
        </span>
      </div>
    `;

    const pickupIcon = L.divIcon({
      html: pickupHtml,
      className: 'custom-pickup-pin',
      iconSize: [36, 46],
      iconAnchor: [18, 44],
    });

    // 2. Dropoff Icon (Compact Teal)
    const dropoffHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #0f766e; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.35); border: 2px solid white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 9px; font-weight: 800; background: #0f172a; color: #5eead4; padding: 1px 5px; border-radius: 5px; border: 1px solid #14b8a6; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.25);">
          ${isUrdu ? 'منزل' : '🏁 Dropoff'}
        </span>
      </div>
    `;

    const dropoffIcon = L.divIcon({
      html: dropoffHtml,
      className: 'custom-dropoff-pin',
      iconSize: [36, 46],
      iconAnchor: [18, 44],
    });

    // Add Pickup & Dropoff Markers as DRAGGABLE pins
    const pMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { 
      icon: pickupIcon, 
      zIndexOffset: 1000,
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
      zIndexOffset: 950,
      draggable: true,
    }).addTo(markersLayer);

    dMarker.bindPopup(`<strong>${isUrdu ? 'منزل' : 'Dropoff Point'}</strong><br/>${dropoffName}<br/><span style="font-size: 10px; color: #0f766e; font-weight: bold;">(Drag to fine-tune exact spot)</span>`);

    dMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      if (onDropoffDrag) {
        onDropoffDrag({ lat: pos.lat, lng: pos.lng });
      }
    });

    // 3. Fetch Real Road Routing & Draw Polyline
    setIsLoadingRoute(true);
    getRoadRoute(pickupCoords, dropoffCoords)
      .then((routeResult) => {
        setIsLoadingRoute(false);
        if (!routeLayerRef.current) return;

        // Base glow line
        L.polyline(routeResult.coordinates, {
          color: '#059669',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerRef.current);

        // Center dashed bright line
        L.polyline(routeResult.coordinates, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.95,
          dashArray: '5, 8',
          lineCap: 'round',
        }).addTo(routeLayerRef.current);

        if (onRouteCalculated) {
          onRouteCalculated(routeResult.distanceKm, routeResult.durationMins);
        }

        // Fit map bounds smoothly with high street zoom
        const bounds = L.latLngBounds([
          [pickupCoords.lat, pickupCoords.lng],
          [dropoffCoords.lat, dropoffCoords.lng],
        ]);
        map.fitBounds(bounds, {
          padding: [35, 35],
          maxZoom: 16,
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

      {/* Map Style Switcher Toggle */}
      <button
        type="button"
        onClick={() => setMapStyle(prev => prev === 'voyager' ? 'osm' : 'voyager')}
        className="absolute top-2.5 right-2.5 z-[500] bg-white/95 hover:bg-white text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-300 shadow-md flex items-center gap-1 transition cursor-pointer backdrop-blur-xs"
        title="Toggle between Detailed Street Map and Standard OSM"
      >
        <span>{mapStyle === 'voyager' ? '🗺️ Detailed Streets' : '🌍 OSM Standard'}</span>
      </button>

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

