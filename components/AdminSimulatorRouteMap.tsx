'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getRoadRoute } from '@/lib/routingHelper';

interface Props {
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
  pickupName: string;
  dropoffName: string;
}

export const AdminSimulatorRouteMap: React.FC<Props> = ({
  pickupCoords,
  dropoffCoords,
  pickupName,
  dropoffName,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [pickupCoords.lat || 26.0031, pickupCoords.lng || 63.0544],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

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

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // Pickup Icon
    const pIcon = L.divIcon({
      html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: #059669; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
      className: 'admin-sim-p',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Dropoff Icon
    const dIcon = L.divIcon({
      html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: #0f766e; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
      className: 'admin-sim-d',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pIcon }).addTo(markersLayer);
    L.marker([dropoffCoords.lat, dropoffCoords.lng], { icon: dIcon }).addTo(markersLayer);

    getRoadRoute(pickupCoords, dropoffCoords)
      .then((res) => {
        if (!routeLayerRef.current) return;
        L.polyline(res.coordinates, { color: '#059669', weight: 4, opacity: 0.85 }).addTo(routeLayerRef.current);
        L.polyline(res.coordinates, { color: '#ffffff', weight: 1.5, opacity: 0.9, dashArray: '4, 6' }).addTo(routeLayerRef.current);

        const bounds = L.latLngBounds([
          [pickupCoords.lat, pickupCoords.lng],
          [dropoffCoords.lat, dropoffCoords.lng],
        ]);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15, animate: true });
      })
      .catch(() => {});
  }, [pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng]);

  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-2 left-2 z-[500] bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 shadow-xs pointer-events-none">
        {pickupName.split(',')[0]} ➔ {dropoffName.split(',')[0]}
      </div>
    </div>
  );
};
