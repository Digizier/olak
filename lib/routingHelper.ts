/**
 * Free Road Routing and Distance Calculation Engine (OSRM + Offline Fallback)
 * 100% Free, zero API key, zero limits.
 */

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] array for Leaflet polyline
  distanceKm: number;
  durationMins: number;
  isFallback: boolean;
}

// In-memory cache to prevent duplicate network calls
const routeCache = new Map<string, RouteResult>();

/**
 * Calculates Haversine aerial distance with road curvature factor (Balochistan terrain ~1.30)
 */
export function calculateFallbackDistance(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): { distanceKm: number; durationMins: number } {
  if (!p1 || !p2) return { distanceKm: 3.5, durationMins: 10 };
  if (p1.lat === p2.lat && p1.lng === p2.lng) return { distanceKm: 1.0, durationMins: 3 };

  const R = 6371; // Earth radius in KM
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const aerialKm = R * c;

  // Curvature factor for roads
  const roadKm = Math.max(1.0, Math.round(aerialKm * 1.30 * 10) / 10);
  const durationMins = Math.max(3, Math.round(roadKm * 2.5 + 2));

  return { distanceKm: roadKm, durationMins };
}

/**
 * Generates an interpolated curved line between two coordinates as visual fallback
 */
function generateFallbackCoordinates(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): [number, number][] {
  const points: [number, number][] = [];
  const steps = 15;
  const midLat = (p1.lat + p2.lat) / 2;
  const midLng = (p1.lng + p2.lng) / 2;
  
  // Slight offset to give a natural road curve
  const offsetLat = (p2.lng - p1.lng) * 0.08;
  const offsetLng = -(p2.lat - p1.lat) * 0.08;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bezier curve
    const lat = (1 - t) * (1 - t) * p1.lat + 2 * (1 - t) * t * (midLat + offsetLat) + t * t * p2.lat;
    const lng = (1 - t) * (1 - t) * p1.lng + 2 * (1 - t) * t * (midLng + offsetLng) + t * t * p2.lng;
    points.push([lat, lng]);
  }

  return points;
}

/**
 * Fetches real road route from OSRM with 3.5-second timeout and instant local caching
 */
export async function getRoadRoute(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): Promise<RouteResult> {
  const cacheKey = `${p1.lat.toFixed(4)},${p1.lng.toFixed(4)}-${p2.lat.toFixed(4)},${p2.lng.toFixed(4)}`;
  
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Check if points are virtually identical
  if (Math.abs(p1.lat - p2.lat) < 0.0001 && Math.abs(p1.lng - p2.lng) < 0.0001) {
    const result: RouteResult = {
      coordinates: [[p1.lat, p1.lng], [p2.lat, p2.lng]],
      distanceKm: 1.0,
      durationMins: 3,
      isFallback: false,
    };
    routeCache.set(cacheKey, result);
    return result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM GeoJSON coords are [lng, lat] -> convert to Leaflet [lat, lng]
        const coords: [number, number][] = route.geometry.coordinates.map(
          (pt: [number, number]) => [pt[1], pt[0]]
        );
        const distanceKm = Math.max(1.0, Math.round((route.distance / 1000) * 10) / 10);
        const durationMins = Math.max(3, Math.round(route.duration / 60));

        const result: RouteResult = {
          coordinates: coords,
          distanceKm,
          durationMins,
          isFallback: false,
        };

        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Network timeout or error - continue to fallback
  }

  // High-precision offline fallback
  const fallback = calculateFallbackDistance(p1, p2);
  const fallbackResult: RouteResult = {
    coordinates: generateFallbackCoordinates(p1, p2),
    distanceKm: fallback.distanceKm,
    durationMins: fallback.durationMins,
    isFallback: true,
  };

  routeCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}
