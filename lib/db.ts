import { supabase } from './supabase';
import { 
  Booking, 
  Captain, 
  PricingRate, 
  IntercityRoute, 
  SiteSettings, 
  Customer,
  BookingStatus, 
  CaptainStatus,
  PromotionBanner,
  DriverSettlement,
  CityLandmark,
  ServiceType,
  DriverPromoCard,
  ActivityAlert,
  AdvancedAnalyticsSummary
} from './types';
import { 
  INITIAL_PRICING_RATES, 
  INITIAL_INTERCITY_ROUTES, 
  INITIAL_SITE_SETTINGS,
  INITIAL_PROMOTIONS,
  INITIAL_LANDMARKS,
  INITIAL_DRIVER_PROMOS
} from './constants';

const STORAGE_KEYS = {
  BOOKINGS: 'olak_cached_bookings',
  CAPTAINS: 'olak_cached_captains',
  CUSTOMERS: 'olak_cached_customers',
  CURRENT_CUSTOMER: 'olak_current_customer',
  CURRENT_CAPTAIN: 'olak_current_captain',
  RATES: 'olak_cached_pricing_rates',
  INTERCITY: 'olak_cached_intercity_routes',
  SETTINGS: 'olak_cached_site_settings',
  PROMOTIONS: 'olak_cached_promotions',
  DRIVER_PROMOS: 'olak_cached_driver_promos',
  SETTLEMENTS: 'olak_cached_driver_settlements',
  LANDMARKS: 'olak_cached_landmarks',
};

const dispatchCustomEvent = (eventName: string, detail?: any) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
};

// ==========================================
// 1. SITE SETTINGS MODULE
// ==========================================
export const getSiteSettings = async (): Promise<SiteSettings> => {
  if (typeof window === 'undefined') return INITIAL_SITE_SETTINGS;
  
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    let fallback = INITIAL_SITE_SETTINGS;
    if (cached) {
      try {
        fallback = { ...INITIAL_SITE_SETTINGS, ...JSON.parse(cached) };
      } catch {}
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'olak_settings')
        .maybeSingle();

      if (data && !error) {
        const merged = { ...fallback, ...data };
        if (merged.admin_pin === 'admin123') {
          merged.admin_pin = 'admin@olak1234@#&678';
        }
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        return merged as SiteSettings;
      }
    } catch (e) {
      // Supabase offline fallback
    }

    if (fallback.admin_pin === 'admin123') {
      fallback.admin_pin = 'admin@olak1234@#&678';
    }
    return fallback;
  } catch (err) {
    console.warn('Error fetching site settings, using fallback:', err);
    return INITIAL_SITE_SETTINGS;
  }
};

export const saveSiteSettings = async (settings: Partial<SiteSettings>): Promise<SiteSettings> => {
  // Read current cached settings from localStorage first to prevent stale overwrite
  let current = INITIAL_SITE_SETTINGS;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (cached) {
      try { current = { ...INITIAL_SITE_SETTINGS, ...JSON.parse(cached) }; } catch {}
    }
  }
  const updated: SiteSettings = { ...current, ...settings };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    dispatchCustomEvent('olak_settings_updated', updated);
  }

  try {
    await supabase.from('site_settings').upsert({
      id: 'olak_settings',
      company_name: updated.company_name,
      company_name_urdu: updated.company_name_urdu,
      tagline: updated.tagline,
      tagline_urdu: updated.tagline_urdu,
      phone: updated.phone,
      whatsapp: updated.whatsapp,
      email: updated.email,
      address: updated.address,
      address_urdu: updated.address_urdu,
      operating_cities: updated.operating_cities,
      commission_percentage: updated.commission_percentage,
      is_booking_active: updated.is_booking_active,
      admin_pin: updated.admin_pin,
    });
  } catch (err) {
    console.error('Remote DB save error for settings:', err);
  }

  return updated;
};

// ==========================================
// 2. CUSTOMER AUTH & MANAGEMENT
// ==========================================
export const getCurrentCustomer = (): Customer | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_CUSTOMER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentCustomer = (customer: Customer | null) => {
  if (typeof window === 'undefined') return;
  if (customer) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customer));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CUSTOMER);
  }
  dispatchCustomEvent('olak_customer_auth_changed', customer);
};

export const registerCustomer = async (data: { full_name: string; email: string; phone: string; password?: string }): Promise<Customer> => {
  const newCustomer: Customer = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cust-${Date.now()}`,
    full_name: data.full_name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    password_hash: data.password || 'password123',
    total_rides: 0,
    created_at: new Date().toISOString(),
  };

  const existing = await getCustomers();
  const updated = [newCustomer, ...existing];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    setCurrentCustomer(newCustomer);
    dispatchCustomEvent('olak_customers_updated', updated);
  }

  try {
    await supabase.from('customers').insert(newCustomer);
  } catch (err) {
    console.error('Remote DB customer insert error:', err);
  }

  return newCustomer;
};

export const loginCustomer = async (emailOrPhone: string, password?: string): Promise<Customer | null> => {
  const cleanInput = emailOrPhone.trim().toLowerCase();
  const all = await getCustomers();
  
  const match = all.find(c => 
    c.email.toLowerCase() === cleanInput || 
    c.phone.replace(/\D/g, '') === cleanInput.replace(/\D/g, '')
  );

  if (match) {
    setCurrentCustomer(match);
    return match;
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`email.eq.${cleanInput},phone.eq.${cleanInput}`)
      .maybeSingle();

    if (data && !error) {
      setCurrentCustomer(data as Customer);
      return data as Customer;
    }
  } catch (err) {
    console.warn('Login lookup failed:', err);
  }

  return null;
};

export const logoutCustomer = () => {
  setCurrentCustomer(null);
};

const getSuspendedIdentifiers = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('olak_suspended_customer_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSuspendedIdentifiers = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('olak_suspended_customer_ids', JSON.stringify(ids));
  } catch {}
};

export const getCustomers = async (): Promise<Customer[]> => {
  if (typeof window === 'undefined') return [];

  let localCustomers: Customer[] = [];
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (cached) localCustomers = JSON.parse(cached);
  } catch {}

  const suspendedSet = new Set(getSuspendedIdentifiers());

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mapped: Customer[] = data.map((row: any) => {
        const isSuspended = row.password_hash === 'SUSPENDED' || 
          row.password_hash === 'BLOCKED' ||
          suspendedSet.has(row.id) ||
          suspendedSet.has(row.phone);

        if (isSuspended) {
          suspendedSet.add(row.id);
          suspendedSet.add(row.phone);
        }

        return {
          ...row,
          status: isSuspended ? 'suspended' : 'active',
          is_blocked: isSuspended,
        };
      });

      // Keep any local-only customers
      const map = new Map<string, Customer>();
      mapped.forEach(c => map.set(c.id, c));
      localCustomers.forEach(loc => {
        if (!map.has(loc.id)) {
          const isSusp = suspendedSet.has(loc.id) || suspendedSet.has(loc.phone) || loc.status === 'suspended';
          map.set(loc.id, { ...loc, status: isSusp ? 'suspended' : 'active', is_blocked: isSusp });
        }
      });

      saveSuspendedIdentifiers(Array.from(suspendedSet));
      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching customers from Supabase:', err);
  }

  return localCustomers.map(c => {
    const isSusp = suspendedSet.has(c.id) || suspendedSet.has(c.phone) || c.status === 'suspended';
    return {
      ...c,
      status: isSusp ? 'suspended' : 'active',
      is_blocked: isSusp,
    };
  });
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const all = await getCustomers();
  const updated = all.filter(c => c.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    const current = getCurrentCustomer();
    if (current && current.id === id) {
      setCurrentCustomer(null);
    }
    dispatchCustomEvent('olak_customers_updated', updated);
  }

  try {
    await supabase.from('customers').delete().eq('id', id);
  } catch (err) {
    console.error('Remote DB customer delete error:', err);
  }
};

export const toggleCustomerStatus = async (id: string, newStatus: 'active' | 'suspended'): Promise<Customer[]> => {
  const suspendedSet = new Set(getSuspendedIdentifiers());
  const all = await getCustomers();
  const target = all.find(c => c.id === id || c.phone === id);

  if (newStatus === 'suspended') {
    if (target) {
      suspendedSet.add(target.id);
      suspendedSet.add(target.phone);
    } else {
      suspendedSet.add(id);
    }
  } else {
    if (target) {
      suspendedSet.delete(target.id);
      suspendedSet.delete(target.phone);
    } else {
      suspendedSet.delete(id);
    }
  }

  saveSuspendedIdentifiers(Array.from(suspendedSet));

  const updated = all.map(c => {
    const isTarget = c.id === id || (target && c.id === target.id);
    if (isTarget) {
      return {
        ...c,
        status: newStatus,
        is_blocked: newStatus === 'suspended',
      };
    }
    return c;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    const current = getCurrentCustomer();
    if (current && (current.id === id || (target && current.id === target.id))) {
      setCurrentCustomer({ ...current, status: newStatus, is_blocked: newStatus === 'suspended' });
    }
    dispatchCustomEvent('olak_customers_updated', updated);
  }

  try {
    const password_hash = newStatus === 'suspended' ? 'SUSPENDED' : 'customer_guest';
    const query = target 
      ? supabase.from('customers').update({ password_hash }).or(`id.eq.${target.id},phone.eq.${target.phone}`) 
      : supabase.from('customers').update({ password_hash }).eq('id', id);
    const { error } = await query;
    if (error) console.warn('Supabase customer status update warning:', error.message);
  } catch (err) {
    console.error('Remote DB customer status update error:', err);
  }

  return updated;
};

// ==========================================
// 3. PRICING RATES MODULE
// ==========================================
export const getPricingRates = async (): Promise<PricingRate[]> => {
  if (typeof window === 'undefined') return INITIAL_PRICING_RATES;

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.RATES);
    const fallback = cached ? JSON.parse(cached) : INITIAL_PRICING_RATES;

    const { data, error } = await supabase
      .from('pricing_rates')
      .select('id, service_name, service_name_urdu, service_type, vehicle_models, base_fare, per_km_charge, waiting_charge_per_min, minimum_fare, cancellation_fee, operating_hours, service_areas, is_active, icon_name')
      .order('base_fare', { ascending: true });

    if (data && !error && data.length > 0) {
      const merged = data.map((d: any) => ({
        ...d,
        tagline: INITIAL_PRICING_RATES.find(r => r.service_type === d.service_type)?.tagline || '',
        capacity: INITIAL_PRICING_RATES.find(r => r.service_type === d.service_type)?.capacity || '',
      }));
      localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(merged));
      return merged as PricingRate[];
    }

    return fallback;
  } catch (err) {
    console.warn('Error fetching pricing rates:', err);
    return INITIAL_PRICING_RATES;
  }
};

export const savePricingRate = async (rate: PricingRate): Promise<PricingRate> => {
  const current = await getPricingRates();
  const updated = current.map(r => r.id === rate.id ? { ...r, ...rate } : r);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(updated));
    dispatchCustomEvent('olak_fares_updated', updated);
  }

  try {
    const { tagline, capacity, ...cleanRate } = rate;
    await supabase.from('pricing_rates').upsert({
      ...cleanRate,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Remote pricing rates update error:', err);
  }

  return rate;
};

// ==========================================
// 3.1 REAL-TIME DISTANCE & FARE CALCULATOR
// ==========================================
export const calculateRealtimeDistance = (
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number => {
  if (!p1 || !p2) return 3.5;
  if (p1.lat === p2.lat && p1.lng === p2.lng) return 1.5;

  const R = 6371; // Earth radius in km
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const aerialKm = R * c;
  // Turbat road network curvature factor (1.30)
  const roadKm = aerialKm * 1.30;
  return Math.max(1.5, Math.round(roadKm * 10) / 10);
};

export const calculateTripFare = (
  serviceType: ServiceType,
  distanceKm: number,
  rates?: PricingRate[]
): number => {
  const currentRates = rates || INITIAL_PRICING_RATES;
  const rate = currentRates.find(r => r.service_type === serviceType) || currentRates[0];
  const rawFare = rate.base_fare + (distanceKm * rate.per_km_charge);
  return Math.max(rate.minimum_fare, Math.round(rawFare / 10) * 10);
};

// ==========================================
// 3.2 CITY LANDMARKS MODULE
// ==========================================
export const getCityLandmarks = async (): Promise<CityLandmark[]> => {
  if (typeof window === 'undefined') return INITIAL_LANDMARKS;

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.LANDMARKS);
    const fallback = cached ? JSON.parse(cached) : INITIAL_LANDMARKS;

    const { data, error } = await supabase
      .from('city_landmarks')
      .select('*')
      .order('name', { ascending: true });

    if (data && !error && data.length > 0) {
      const formatted = data.map((d: any) => ({
        ...d,
        nameUrdu: d.name_urdu || d.nameUrdu || d.name,
      }));
      localStorage.setItem(STORAGE_KEYS.LANDMARKS, JSON.stringify(formatted));
      return formatted as CityLandmark[];
    }

    return fallback;
  } catch (err) {
    console.warn('Error fetching landmarks:', err);
    return INITIAL_LANDMARKS;
  }
};

export const saveCityLandmark = async (landmarkData: Partial<CityLandmark>): Promise<CityLandmark> => {
  const all = await getCityLandmarks();
  let updatedLandmark: CityLandmark;

  if (landmarkData.id && all.some(l => l.id === landmarkData.id)) {
    updatedLandmark = { ...all.find(l => l.id === landmarkData.id)!, ...landmarkData } as CityLandmark;
    const updated = all.map(l => l.id === updatedLandmark.id ? updatedLandmark : l);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LANDMARKS, JSON.stringify(updated));
      dispatchCustomEvent('olak_landmarks_updated', updated);
    }
  } else {
    updatedLandmark = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lm-${Date.now()}`,
      name: landmarkData.name || 'New Landmark',
      name_urdu: landmarkData.name_urdu || landmarkData.nameUrdu || '',
      nameUrdu: landmarkData.nameUrdu || landmarkData.name_urdu || '',
      area: landmarkData.area || 'Turbat',
      lat: Number(landmarkData.lat) || 26.0031,
      lng: Number(landmarkData.lng) || 63.0544,
      is_active: landmarkData.is_active !== undefined ? landmarkData.is_active : true,
    };
    const updated = [...all, updatedLandmark];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LANDMARKS, JSON.stringify(updated));
      dispatchCustomEvent('olak_landmarks_updated', updated);
    }
  }

  try {
    const { nameUrdu, ...dbPayload } = updatedLandmark as any;
    if (!dbPayload.name_urdu) dbPayload.name_urdu = updatedLandmark.nameUrdu || updatedLandmark.name;
    await supabase.from('city_landmarks').upsert(dbPayload);
  } catch (err) {
    console.error('Remote landmark sync error:', err);
  }

  return updatedLandmark;
};

export const deleteCityLandmark = async (id: string): Promise<void> => {
  const all = await getCityLandmarks();
  const updated = all.filter(l => l.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LANDMARKS, JSON.stringify(updated));
    dispatchCustomEvent('olak_landmarks_updated', updated);
  }

  try {
    await supabase.from('city_landmarks').delete().eq('id', id);
  } catch (err) {
    console.error('Remote landmark delete error:', err);
  }
};

// ==========================================
// 4. INTERCITY ROUTES MODULE
// ==========================================
export const getIntercityRoutes = async (): Promise<IntercityRoute[]> => {
  if (typeof window === 'undefined') return INITIAL_INTERCITY_ROUTES;

  try {
    // 1. Read deleted IDs & deleted city pairs
    let deletedIdentifiers: string[] = [];
    try {
      const deletedIdsRaw = localStorage.getItem('olak_deleted_route_ids');
      if (deletedIdsRaw) deletedIdentifiers = JSON.parse(deletedIdsRaw);
    } catch {}

    const isDeleted = (r: { id: string; origin_city?: string; destination_city?: string }) => {
      if (deletedIdentifiers.includes(r.id)) return true;
      if (r.origin_city && r.destination_city) {
        const pair = `${r.origin_city.toLowerCase()}-${r.destination_city.toLowerCase()}`;
        if (deletedIdentifiers.includes(pair)) return true;
      }
      return false;
    };

    // 2. Read local cache
    const cached = localStorage.getItem(STORAGE_KEYS.INTERCITY);
    let loadedRoutes: IntercityRoute[] = [];

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedRoutes = parsed.filter(r => !isDeleted(r));
        }
      } catch {
        loadedRoutes = [];
      }
    }

    // 3. Remote sync with Supabase
    try {
      const { data, error } = await supabase
        .from('intercity_routes')
        .select('*')
        .order('car_economy_fare', { ascending: true });

      if (data && !error && data.length > 0) {
        const validRemote = (data as IntercityRoute[]).filter(r => !isDeleted(r));
        const sbIds = new Set(validRemote.map((d: any) => d.id));
        const localCustom = loadedRoutes.filter(r => !sbIds.has(r.id) && !isDeleted(r));
        loadedRoutes = [...validRemote, ...localCustom];
      }
    } catch (e) {
      // Offline / fallback mode
    }

    // 4. MERGE WITH DEFAULT BALUCHISTAN ROUTES (only if not explicitly deleted)
    const existingIds = new Set(loadedRoutes.map(r => r.id));
    const existingPairs = new Set(loadedRoutes.map(r => `${r.origin_city.toLowerCase()}-${r.destination_city.toLowerCase()}`));
    const merged = [...loadedRoutes];

    for (const defRoute of INITIAL_INTERCITY_ROUTES) {
      const defPair = `${defRoute.origin_city.toLowerCase()}-${defRoute.destination_city.toLowerCase()}`;
      if (!existingIds.has(defRoute.id) && !existingPairs.has(defPair) && !isDeleted(defRoute)) {
        merged.push(defRoute);
      }
    }

    const finalRoutes = merged.filter(r => !isDeleted(r));
    localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(finalRoutes));
    return finalRoutes;
  } catch (err) {
    console.warn('Error fetching intercity routes:', err);
    return INITIAL_INTERCITY_ROUTES;
  }
};

export const resetIntercityRoutesToDefaults = async (): Promise<IntercityRoute[]> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('olak_deleted_route_ids');
    localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(INITIAL_INTERCITY_ROUTES));
    dispatchCustomEvent('olak_intercity_updated', INITIAL_INTERCITY_ROUTES);
    return INITIAL_INTERCITY_ROUTES;
  }
  return INITIAL_INTERCITY_ROUTES;
};

export const saveIntercityRoute = async (routeData: Partial<IntercityRoute>): Promise<IntercityRoute> => {
  const all = await getIntercityRoutes();
  let updatedRoute: IntercityRoute;

  // If re-adding or updating, unmark from deleted list
  if (typeof window !== 'undefined') {
    try {
      const deletedIdsRaw = localStorage.getItem('olak_deleted_route_ids');
      if (deletedIdsRaw) {
        let deletedList: string[] = JSON.parse(deletedIdsRaw);
        if (routeData.id) deletedList = deletedList.filter(x => x !== routeData.id);
        if (routeData.origin_city && routeData.destination_city) {
          const pair = `${routeData.origin_city.toLowerCase()}-${routeData.destination_city.toLowerCase()}`;
          deletedList = deletedList.filter(x => x !== pair);
        }
        localStorage.setItem('olak_deleted_route_ids', JSON.stringify(deletedList));
      }
    } catch {}
  }

  if (routeData.id && all.some(r => r.id === routeData.id)) {
    updatedRoute = { ...all.find(r => r.id === routeData.id)!, ...routeData } as IntercityRoute;
    const updated = all.map(r => r.id === updatedRoute.id ? updatedRoute : r);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(updated));
      dispatchCustomEvent('olak_intercity_updated', updated);
    }
  } else {
    updatedRoute = {
      id: generateUUID(),
      origin_city: routeData.origin_city || 'Turbat',
      destination_city: routeData.destination_city || 'Gwadar',
      estimated_distance_km: Number(routeData.estimated_distance_km) || 100,
      estimated_duration: routeData.estimated_duration || '2 Hours',
      pricing_model: routeData.pricing_model || 'fixed',
      per_km_rate: Number(routeData.per_km_rate) || 25,
      car_economy_fare: Number(routeData.car_economy_fare) || 3000,
      car_comfort_fare: Number(routeData.car_comfort_fare) || 4500,
      delivery_parcel_fare: Number(routeData.delivery_parcel_fare) || 800,
      is_active: routeData.is_active !== undefined ? routeData.is_active : true,
    };
    
    // Merge so default routes are preserved alongside the newly added route
    const existingIds = new Set(all.map(r => r.id));
    const mergedAll = [...all];
    for (const defRoute of INITIAL_INTERCITY_ROUTES) {
      if (!existingIds.has(defRoute.id)) {
        mergedAll.push(defRoute);
      }
    }
    const updated = [updatedRoute, ...mergedAll];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(updated));
      dispatchCustomEvent('olak_intercity_updated', updated);
    }
  }

  try {
    await supabase.from('intercity_routes').upsert(updatedRoute);
  } catch (err) {
    console.error('Remote intercity sync error:', err);
  }

  return updatedRoute;
};

export const deleteIntercityRoute = async (id: string): Promise<void> => {
  const all = await getIntercityRoutes();
  const target = all.find(r => r.id === id);

  const deletedPairs: string[] = [];
  if (target) {
    deletedPairs.push(`${target.origin_city.toLowerCase()}-${target.destination_city.toLowerCase()}`);
  }

  if (typeof window !== 'undefined') {
    try {
      const deletedIdsRaw = localStorage.getItem('olak_deleted_route_ids');
      const deletedIds: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
      if (!deletedIds.includes(id)) deletedIds.push(id);
      for (const pair of deletedPairs) {
        if (!deletedIds.includes(pair)) deletedIds.push(pair);
      }
      localStorage.setItem('olak_deleted_route_ids', JSON.stringify(deletedIds));
    } catch {}

    const updated = all.filter(r => {
      if (r.id === id) return false;
      if (target && r.origin_city.toLowerCase() === target.origin_city.toLowerCase() && r.destination_city.toLowerCase() === target.destination_city.toLowerCase()) {
        return false;
      }
      return true;
    });

    localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(updated));
    dispatchCustomEvent('olak_intercity_updated', updated);
  }

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      await supabase.from('intercity_routes').delete().eq('id', id);
    }
    if (target) {
      await supabase.from('intercity_routes').delete().match({
        origin_city: target.origin_city,
        destination_city: target.destination_city
      });
    }
  } catch (err) {
    console.error('Remote intercity route delete error:', err);
  }
};

// ==========================================
// 5. PROMOTIONS & ADS MODULE
// ==========================================
export const getPromotions = async (): Promise<PromotionBanner[]> => {
  if (typeof window === 'undefined') return INITIAL_PROMOTIONS;

  try {
    let deletedIds: string[] = [];
    try {
      const raw = localStorage.getItem('olak_deleted_promo_ids');
      if (raw) deletedIds = JSON.parse(raw);
    } catch {}

    let loadedPromos: PromotionBanner[] = [];

    // 1. Primary: Fetch from Supabase cloud database
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        loadedPromos = (data as PromotionBanner[]).filter(p => !deletedIds.includes(p.id));
        try {
          localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(loadedPromos));
        } catch {}
        return loadedPromos;
      }
    } catch (e) {
      console.warn('Supabase promotions fetch warning:', e);
    }

    // 2. Fallback: LocalStorage cache
    const cached = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(p => !deletedIds.includes(p.id));
          if (valid.length > 0) return valid;
        }
      } catch {}
    }

    // 3. Fallback: Initial static constants (only if DB & cache are completely empty)
    return INITIAL_PROMOTIONS.filter(p => !deletedIds.includes(p.id));
  } catch (err) {
    console.warn('Error fetching promotions:', err);
    return INITIAL_PROMOTIONS;
  }
};

export const savePromotion = async (promoData: Partial<PromotionBanner>): Promise<PromotionBanner> => {
  const all = await getPromotions();
  let updatedPromo: PromotionBanner;

  if (promoData.id && all.some(p => p.id === promoData.id)) {
    updatedPromo = { ...all.find(p => p.id === promoData.id)!, ...promoData } as PromotionBanner;
    const updated = all.map(p => p.id === updatedPromo.id ? updatedPromo : p);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
      } catch (quotaErr) {
        console.warn('LocalStorage quota warning in savePromotion:', quotaErr);
      }
      dispatchCustomEvent('olak_promotions_updated', updated);
    }
  } else {
    updatedPromo = {
      id: promoData.id || generateUUID(),
      title: promoData.title || 'New Special Offer',
      subtitle: promoData.subtitle || '',
      image_url: promoData.image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
      link_url: promoData.link_url || '/#fares',
      badge: promoData.badge || 'Offer',
      is_active: promoData.is_active !== undefined ? promoData.is_active : true,
      created_at: new Date().toISOString(),
    };
    const updated = [updatedPromo, ...all];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
      } catch (quotaErr) {
        console.warn('LocalStorage quota warning in savePromotion:', quotaErr);
      }
      dispatchCustomEvent('olak_promotions_updated', updated);
    }
  }

  // Remove from deleted list if re-adding or updating
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('olak_deleted_promo_ids');
      if (raw) {
        const deletedIds: string[] = JSON.parse(raw);
        const filtered = deletedIds.filter(x => x !== updatedPromo.id);
        localStorage.setItem('olak_deleted_promo_ids', JSON.stringify(filtered));
      }
    } catch {}
  }

  try {
    const { error } = await supabase.from('promotions').upsert(updatedPromo);
    if (error) console.error('Supabase promotion upsert error:', error.message);
  } catch (err) {
    console.error('Remote promotion sync error:', err);
  }

  return updatedPromo;
};

export const deletePromotion = async (id: string): Promise<void> => {
  const all = await getPromotions();
  const updated = all.filter(p => p.id !== id);

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('olak_deleted_promo_ids');
      const deletedIds: string[] = raw ? JSON.parse(raw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('olak_deleted_promo_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    try {
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
    } catch {}
    dispatchCustomEvent('olak_promotions_updated', updated);
  }

  try {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) console.error('Supabase promotion delete error:', error.message);
  } catch (err) {
    console.error('Remote promotion delete error:', err);
  }
};

// ==========================================
// 5B. DRIVER RECRUITMENT PROMO CARDS MODULE
// ==========================================
export const getDriverPromoCards = async (): Promise<DriverPromoCard[]> => {
  if (typeof window === 'undefined') return INITIAL_DRIVER_PROMOS;

  try {
    let deletedIds: string[] = [];
    try {
      const raw = localStorage.getItem('olak_deleted_driver_promo_ids');
      if (raw) deletedIds = JSON.parse(raw);
    } catch {}

    let loadedCards: DriverPromoCard[] = [];

    // 1. Primary: Fetch from Supabase cloud database
    try {
      const { data, error } = await supabase
        .from('driver_promos')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && !error && data.length > 0) {
        loadedCards = (data as DriverPromoCard[]).filter(c => !deletedIds.includes(c.id));
        try {
          localStorage.setItem(STORAGE_KEYS.DRIVER_PROMOS, JSON.stringify(loadedCards));
        } catch {}
        return loadedCards;
      }
    } catch (e) {
      console.warn('Supabase driver_promos fetch warning:', e);
    }

    // 2. Fallback: LocalStorage cache
    const cached = localStorage.getItem(STORAGE_KEYS.DRIVER_PROMOS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(c => !deletedIds.includes(c.id));
          if (valid.length > 0) return valid;
        }
      } catch {}
    }

    // 3. Fallback: Initial static constants (only if DB & cache are empty)
    return INITIAL_DRIVER_PROMOS.filter(c => !deletedIds.includes(c.id));
  } catch (err) {
    console.warn('Error fetching driver promo cards:', err);
    return INITIAL_DRIVER_PROMOS;
  }
};

export const saveDriverPromoCard = async (cardData: Partial<DriverPromoCard>): Promise<DriverPromoCard> => {
  const all = await getDriverPromoCards();
  let updatedCard: DriverPromoCard;

  if (cardData.id && all.some(c => c.id === cardData.id)) {
    updatedCard = { ...all.find(c => c.id === cardData.id)!, ...cardData } as DriverPromoCard;
    const updated = all.map(c => c.id === updatedCard.id ? updatedCard : c);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.DRIVER_PROMOS, JSON.stringify(updated));
      } catch (e) {}
      dispatchCustomEvent('olak_driver_promos_updated', updated);
    }
  } else {
    updatedCard = {
      id: cardData.id || generateUUID(),
      category_badge: cardData.category_badge || 'Motorcycle 70cc / 125cc',
      title: cardData.title || 'Register Driver Account',
      title_urdu: cardData.title_urdu || 'اپنی سواری رجسٹر کروائیں',
      image_url: cardData.image_url || '/assets/bike-poster.jpg',
      bullets: cardData.bullets || ['Daily Cash Earnings', 'Only 10% Fee', 'Flexible Hours'],
      cta_text: cardData.cta_text || 'Register Captain',
      cta_link: cardData.cta_link || '/captain/',
      is_active: cardData.is_active !== undefined ? cardData.is_active : true,
      created_at: new Date().toISOString(),
    };
    const updated = [...all, updatedCard];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.DRIVER_PROMOS, JSON.stringify(updated));
      } catch (e) {}
      dispatchCustomEvent('olak_driver_promos_updated', updated);
    }
  }

  // Remove from deleted list if re-adding or updating
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('olak_deleted_driver_promo_ids');
      if (raw) {
        const deletedIds: string[] = JSON.parse(raw);
        const filtered = deletedIds.filter(x => x !== updatedCard.id);
        localStorage.setItem('olak_deleted_driver_promo_ids', JSON.stringify(filtered));
      }
    } catch {}
  }

  try {
    const { error } = await supabase.from('driver_promos').upsert(updatedCard);
    if (error) console.error('Supabase driver_promos upsert error:', error.message);
  } catch (err) {
    console.error('Remote driver_promos error:', err);
  }

  return updatedCard;
};

export const deleteDriverPromoCard = async (id: string): Promise<void> => {
  const all = await getDriverPromoCards();
  const updated = all.filter(c => c.id !== id);

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('olak_deleted_driver_promo_ids');
      const deletedIds: string[] = raw ? JSON.parse(raw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('olak_deleted_driver_promo_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    try {
      localStorage.setItem(STORAGE_KEYS.DRIVER_PROMOS, JSON.stringify(updated));
    } catch {}
    dispatchCustomEvent('olak_driver_promos_updated', updated);
  }

  try {
    const { error } = await supabase.from('driver_promos').delete().eq('id', id);
    if (error) console.error('Supabase driver_promos delete error:', error.message);
  } catch (err) {
    console.error('Remote driver_promos delete error:', err);
  }
};

// ==========================================
// 6. CAPTAINS MODULE
// ==========================================
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const serializeCaptainForSupabase = (captain: Partial<Captain>) => {
  const { profile_photo_url, ...rest } = captain as any;
  return {
    ...rest,
    // Store profile_photo_url in cnic_back_url column in Supabase captains table
    cnic_back_url: profile_photo_url || captain.cnic_back_url || null,
  };
};

const deserializeCaptainFromSupabase = (row: any): Captain => {
  return {
    ...row,
    profile_photo_url: row.profile_photo_url || row.cnic_back_url || '',
  };
};

export const getCaptains = async (): Promise<Captain[]> => {
  if (typeof window === 'undefined') return [];

  let localCaptains: Captain[] = [];
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CAPTAINS);
    if (cached) localCaptains = JSON.parse(cached);
  } catch {}

  try {
    const { data, error } = await supabase
      .from('captains')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const remoteCaptains: Captain[] = data.map(deserializeCaptainFromSupabase);

      const map = new Map<string, Captain>();
      remoteCaptains.forEach(c => map.set(c.id, c));

      // Auto-merge local captains so they never disappear on refresh
      localCaptains.forEach(loc => {
        if (!map.has(loc.id)) {
          map.set(loc.id, loc);
          try {
            const row = serializeCaptainForSupabase(loc);
            supabase.from('captains').insert(row).then(({ error: insErr }) => {
              if (insErr) console.warn('Background captain sync warning:', insErr.message);
            });
          } catch {}
        } else {
          const rem = map.get(loc.id)!;
          if (!rem.profile_photo_url && loc.profile_photo_url) {
            rem.profile_photo_url = loc.profile_photo_url;
          }
        }
      });

      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching captains from Supabase:', err);
  }

  return localCaptains;
};

export const createCaptain = async (captainData: Omit<Captain, 'id' | 'created_at' | 'status' | 'is_online' | 'total_trips_completed' | 'total_earnings' | 'rating'>): Promise<Captain> => {
  const newCaptain: Captain = {
    id: generateUUID(),
    ...captainData,
    status: 'pending',
    is_online: false,
    total_trips_completed: 0,
    total_earnings: 0,
    rating: 5.0,
    created_at: new Date().toISOString(),
  };

  const existing = await getCaptains();
  const updated = [newCaptain, ...existing.filter(c => c.id !== newCaptain.id)];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updated));
    setCurrentCaptain(newCaptain);
    dispatchCustomEvent('olak_captains_updated', updated);
  }

  try {
    const row = serializeCaptainForSupabase(newCaptain);
    const { data, error } = await supabase.from('captains').insert(row).select();
    if (error) {
      console.warn('Supabase captain insert warning:', error.message);
    } else if (data && data[0]) {
      console.log('Captain inserted to Supabase successfully:', data[0].id);
    }
  } catch (err) {
    console.error('Remote DB captain insert error:', err);
  }

  return newCaptain;
};

export const updateCaptainProfile = async (id: string, updates: Partial<Captain>): Promise<Captain | null> => {
  const captains = await getCaptains();
  const existing = captains.find(c => c.id === id);
  if (!existing) return null;

  const updatedCaptain: Captain = {
    ...existing,
    ...updates,
  };

  const updatedList = captains.map(c => c.id === id ? updatedCaptain : c);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updatedList));
    const current = getCurrentCaptain();
    if (current && current.id === id) {
      setCurrentCaptain(updatedCaptain);
    }
    dispatchCustomEvent('olak_captains_updated', updatedList);
  }

  try {
    const row = serializeCaptainForSupabase(updatedCaptain);
    const { error } = await supabase.from('captains').update(row).eq('id', id);
    if (error) console.warn('Supabase captain update warning:', error.message);
  } catch (err) {
    console.error('Remote DB captain profile update error:', err);
  }

  return updatedCaptain;
};

export const updateCaptainStatus = async (id: string, status: CaptainStatus): Promise<void> => {
  const captains = await getCaptains();
  const target = captains.find(c => c.id === id);
  const updated = captains.map(c => c.id === id ? { ...c, status, is_online: status === 'approved' ? c.is_online : false } : c);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updated));
    const current = getCurrentCaptain();
    if (current && (
      current.id === id || 
      (target && (current.phone === target.phone || current.vehicle_number_plate === target.vehicle_number_plate))
    )) {
      const updatedCur = { ...current, status, is_online: status === 'approved' ? current.is_online : false };
      setCurrentCaptain(updatedCur);
    }
    dispatchCustomEvent('olak_captains_updated', updated);
  }

  try {
    const { error } = await supabase.from('captains').update({ 
      status,
      is_online: status === 'approved' ? undefined : false
    }).eq('id', id);
    if (error) console.warn('Supabase captain status update warning:', error.message);
  } catch (err) {
    console.error('Remote DB captain status update error:', err);
  }
};

export const deleteCaptain = async (id: string): Promise<void> => {
  const captains = await getCaptains();
  const updated = captains.filter(c => c.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updated));
    const current = getCurrentCaptain();
    if (current && current.id === id) {
      setCurrentCaptain(null);
    }
    dispatchCustomEvent('olak_captains_updated', updated);
  }

  try {
    await supabase.from('captains').delete().eq('id', id);
  } catch (err) {
    console.error('Remote DB captain delete error:', err);
  }
};

export const getCurrentCaptain = (): Captain | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_CAPTAIN);
  return data ? JSON.parse(data) : null;
};

export const setCurrentCaptain = (captain: Captain | null) => {
  if (typeof window === 'undefined') return;
  if (captain) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CAPTAIN, JSON.stringify(captain));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CAPTAIN);
  }
  dispatchCustomEvent('olak_captain_auth_changed', captain);
};

export const logoutCaptain = () => {
  setCurrentCaptain(null);
};

export const loginCaptain = async (phoneOrPlate: string): Promise<Captain | null> => {
  const clean = phoneOrPlate.trim().toLowerCase();
  const all = await getCaptains();
  const match = all.find(c => 
    c.phone.replace(/\D/g, '').includes(clean.replace(/\D/g, '')) ||
    (c.whatsapp_number && c.whatsapp_number.replace(/\D/g, '').includes(clean.replace(/\D/g, ''))) ||
    c.vehicle_number_plate.toLowerCase().replace(/\s/g, '') === clean.replace(/\s/g, '')
  );

  if (match) {
    setCurrentCaptain(match);
    return match;
  }
  return null;
};

export const toggleCaptainOnline = async (id: string, is_online: boolean): Promise<void> => {
  const captains = await getCaptains();
  const updated = captains.map(c => c.id === id ? { ...c, is_online } : c);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updated));
    const current = getCurrentCaptain();
    if (current && current.id === id) {
      setCurrentCaptain({ ...current, is_online });
    }
    dispatchCustomEvent('olak_captains_updated', updated);
  }

  try {
    await supabase.from('captains').update({ is_online }).eq('id', id);
  } catch (err) {
    console.error('Remote DB captain status update error:', err);
  }
};

// ==========================================
// 7. DRIVER SETTLEMENTS & CASH CLEARANCE MODULE
// ==========================================
export const getDriverSettlements = async (captainId?: string): Promise<DriverSettlement[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
    let settlements: DriverSettlement[] = cached ? JSON.parse(cached) : [];

    const { data, error } = await supabase
      .from('driver_settlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      settlements = data as DriverSettlement[];
      localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    }

    if (captainId) {
      return settlements.filter(s => s.captain_id === captainId);
    }
    return settlements;
  } catch (err) {
    console.warn('Error fetching settlements:', err);
    return [];
  }
};

export const recordDriverSettlement = async (data: {
  captain_id: string;
  captain_name: string;
  amount: number;
  payment_method?: string;
  notes?: string;
}): Promise<DriverSettlement> => {
  const newSettlement: DriverSettlement = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `stl-${Date.now()}`,
    captain_id: data.captain_id,
    captain_name: data.captain_name,
    amount: Number(data.amount),
    payment_method: data.payment_method || 'cash',
    notes: data.notes || '',
    recorded_by: 'admin',
    created_at: new Date().toISOString(),
  };

  const existing = await getDriverSettlements();
  const updated = [newSettlement, ...existing];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(updated));
    dispatchCustomEvent('olak_settlements_updated', updated);
  }

  try {
    await supabase.from('driver_settlements').insert(newSettlement);
  } catch (err) {
    console.error('Remote settlement insert error:', err);
  }

  return newSettlement;
};

export const deleteDriverSettlement = async (id: string): Promise<void> => {
  const all = await getDriverSettlements();
  const updated = all.filter(s => s.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(updated));
    dispatchCustomEvent('olak_settlements_updated', updated);
  }

  try {
    await supabase.from('driver_settlements').delete().eq('id', id);
  } catch (err) {
    console.error('Remote settlement delete error:', err);
  }
};

export const getCaptainFinancialSummary = async (captainId: string) => {
  const [bookings, settlements, settings] = await Promise.all([
    getBookings(),
    getDriverSettlements(captainId),
    getSiteSettings(),
  ]);

  const completedTrips = bookings.filter(
    b => b.assigned_captain_id === captainId && b.booking_status === 'completed'
  );

  const grossFares = completedTrips.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
  const commissionRate = settings.commission_percentage || 10;
  const commissionDue = Math.round(grossFares * (commissionRate / 100));
  const driverEarnings = grossFares - commissionDue;
  const totalSettled = settlements.reduce((sum, s) => sum + Number(s.amount), 0);
  const netBalanceDue = commissionDue - totalSettled;

  return {
    totalTrips: completedTrips.length,
    grossFares,
    commissionRate,
    commissionDue,
    driverEarnings,
    totalSettled,
    netBalanceDue,
    isCleared: netBalanceDue <= 0,
    recentSettlements: settlements,
  };
};

// ==========================================
// 8. BOOKINGS DISPATCH MODULE
// ==========================================
export const getBookings = async (): Promise<Booking[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const localBookings: Booking[] = cached ? JSON.parse(cached) : [];

    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_code, service_type, customer_name, customer_phone, pickup_location, dropoff_location, intercity_origin, intercity_destination, delivery_parcel_type, delivery_weight_kg, delivery_receiver_name, delivery_receiver_phone, estimated_distance_km, estimated_fare, final_fare, payment_method, payment_status, booking_status, assigned_captain_id, notes, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (data && !error) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data));
      return data as Booking[];
    }

    return localBookings;
  } catch (err) {
    console.warn('Error fetching bookings:', err);
    return [];
  }
};

export const getCustomerBookings = async (phoneOrEmail: string): Promise<Booking[]> => {
  const all = await getBookings();
  const clean = phoneOrEmail.trim().toLowerCase();
  return all.filter(b => 
    b.customer_phone.replace(/\D/g, '').includes(clean.replace(/\D/g, '')) ||
    b.customer_name.toLowerCase().includes(clean)
  );
};

export const getCaptainBookings = async (captainId: string): Promise<Booking[]> => {
  const all = await getBookings();
  return all.filter(b => b.assigned_captain_id === captainId);
};

export const getBookingByCode = async (bookingCode: string): Promise<Booking | null> => {
  const cleanCode = bookingCode.trim().toUpperCase();
  const all = await getBookings();
  const match = all.find(b => b.booking_code.toUpperCase() === cleanCode);
  if (match) return match;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_code', cleanCode)
      .maybeSingle();

    if (data && !error) return data as Booking;
  } catch (err) {
    console.warn('Error fetching booking by code:', err);
  }

  return null;
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'booking_status' | 'payment_status'>): Promise<Booking> => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const booking_code = `OLK-${randomSuffix}`;
  
  const newBooking: Booking = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `book-${Date.now()}`,
    booking_code,
    ...bookingData,
    booking_status: 'pending',
    payment_status: 'unpaid',
    created_at: new Date().toISOString(),
  };

  const existing = await getBookings();
  const updated = [newBooking, ...existing];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    dispatchCustomEvent('olak_bookings_updated', updated);
  }

  try {
    await supabase.from('bookings').insert(newBooking);
  } catch (err) {
    console.error('Remote DB booking insert error:', err);
  }

  return newBooking;
};

export const updateBookingStatus = async (
  id: string, 
  booking_status: BookingStatus, 
  assigned_captain_id?: string,
  final_fare?: number
): Promise<void> => {
  const all = await getBookings();
  const updated = all.map(b => {
    if (b.id === id) {
      return {
        ...b,
        booking_status,
        assigned_captain_id: assigned_captain_id !== undefined ? assigned_captain_id : b.assigned_captain_id,
        final_fare: final_fare !== undefined ? final_fare : b.final_fare || b.estimated_fare,
        updated_at: new Date().toISOString(),
      };
    }
    return b;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    dispatchCustomEvent('olak_bookings_updated', updated);
  }

  try {
    const payload: any = { booking_status, updated_at: new Date().toISOString() };
    if (assigned_captain_id !== undefined) payload.assigned_captain_id = assigned_captain_id;
    if (final_fare !== undefined) payload.final_fare = final_fare;
    await supabase.from('bookings').update(payload).eq('id', id);
  } catch (err) {
    console.error('Remote DB booking status update error:', err);
  }
};

export const deleteBooking = async (id: string): Promise<void> => {
  const all = await getBookings();
  const updated = all.filter(b => b.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    dispatchCustomEvent('olak_bookings_updated', updated);
  }

  try {
    await supabase.from('bookings').delete().eq('id', id);
  } catch (err) {
    console.error('Remote DB booking delete error:', err);
  }
};

// ==========================================
// 9. STORAGE & FILE UPLOADS
// ==========================================
export const compressAndResizeImage = (file: File, maxWidth = 1200, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = err => reject(err);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = err => reject(err);
  });
};

export const fileToBase64 = async (file: File): Promise<string> => {
  try {
    return await compressAndResizeImage(file, 1200, 0.75);
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
};

export const uploadFileToStorage = async (file: File, folder = 'documents'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('olak-uploads')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.warn('Supabase storage upload fallback to base64:', error.message);
      return await fileToBase64(file);
    }

    const { data: publicData } = supabase.storage
      .from('olak-uploads')
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    console.warn('Storage upload error, using base64 fallback:', err);
    try {
      return await fileToBase64(file);
    } catch {
      return URL.createObjectURL(file);
    }
  }
};

// ==========================================
// 12. LIVE TODAY ACTIVITY ALERTS MODULE
// ==========================================
export const getTodayActivityAlerts = (
  customData?: {
    bookings?: Booking[];
    captains?: Captain[];
    customers?: Customer[];
    settlements?: DriverSettlement[];
  }
): ActivityAlert[] => {
  const todayDateStr = new Date().toDateString();

  const allBookings = customData?.bookings || [];
  const allCaptains = customData?.captains || [];
  const allCustomers = customData?.customers || [];
  const allSettlements = customData?.settlements || [];

  const alerts: ActivityAlert[] = [];

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      return new Date(dateStr).toDateString() === todayDateStr;
    } catch {
      return false;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // 1. Process Bookings for today
  for (const b of allBookings) {
    if (isToday(b.created_at)) {
      alerts.push({
        id: `alert-bk-new-${b.id}`,
        type: 'booking_new',
        category: 'booking',
        title: `New ${b.service_type.toUpperCase()} Booking (${b.booking_code})`,
        subtitle: `${b.customer_name} requested a ride: ${b.pickup_location} ➔ ${b.dropoff_location}`,
        timestamp: b.created_at,
        timeFormatted: formatTime(b.created_at),
        statusBadge: {
          text: b.booking_status.toUpperCase(),
          color: b.booking_status === 'pending' ? 'amber' : b.booking_status === 'completed' ? 'emerald' : 'blue',
        },
        iconName: b.service_type === 'bike' ? 'Bike' : b.service_type === 'delivery' ? 'Package' : 'Car',
        metadata: {
          code: b.booking_code,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          fare: b.final_fare || b.estimated_fare,
          service: b.service_type,
          pickup: b.pickup_location,
          dropoff: b.dropoff_location,
        },
      });
    }

    if (b.updated_at && isToday(b.updated_at) && b.updated_at !== b.created_at) {
      if (b.booking_status === 'completed') {
        alerts.push({
          id: `alert-bk-done-${b.id}`,
          type: 'booking_completed',
          category: 'booking',
          title: `Trip Completed (${b.booking_code})`,
          subtitle: `Ride successfully completed for ${b.customer_name}. Fare collected: PKR ${b.final_fare || b.estimated_fare}`,
          timestamp: b.updated_at,
          timeFormatted: formatTime(b.updated_at),
          statusBadge: { text: 'COMPLETED', color: 'emerald' },
          iconName: 'CheckCircle',
          metadata: {
            code: b.booking_code,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            fare: b.final_fare || b.estimated_fare,
            service: b.service_type,
          },
        });
      } else if (b.booking_status === 'cancelled') {
        alerts.push({
          id: `alert-bk-cancel-${b.id}`,
          type: 'booking_cancelled',
          category: 'booking',
          title: `Trip Cancelled (${b.booking_code})`,
          subtitle: `Ride cancelled. Reason: ${b.cancellation_reason || 'Cancelled by customer/captain'}`,
          timestamp: b.updated_at,
          timeFormatted: formatTime(b.updated_at),
          statusBadge: { text: 'CANCELLED', color: 'rose' },
          iconName: 'Ban',
          metadata: {
            code: b.booking_code,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
          },
        });
      } else if (b.booking_status === 'assigned' || b.booking_status === 'in_progress') {
        alerts.push({
          id: `alert-bk-assign-${b.id}`,
          type: 'booking_assigned',
          category: 'booking',
          title: `Captain Dispatched for ${b.booking_code}`,
          subtitle: `Trip in progress with passenger ${b.customer_name}`,
          timestamp: b.updated_at,
          timeFormatted: formatTime(b.updated_at),
          statusBadge: { text: b.booking_status === 'in_progress' ? 'IN PROGRESS' : 'ASSIGNED', color: 'blue' },
          iconName: 'Navigation',
          metadata: {
            code: b.booking_code,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            captainName: b.assigned_captain?.full_name,
            captainPhone: b.assigned_captain?.phone,
          },
        });
      }
    }
  }

  // 2. Process Captains for today
  for (const c of allCaptains) {
    if (isToday(c.created_at)) {
      alerts.push({
        id: `alert-cap-reg-${c.id}`,
        type: 'captain_registered',
        category: 'captain',
        title: `New Driver Registration: ${c.full_name}`,
        subtitle: `Registered with ${c.vehicle_name} (${c.vehicle_number_plate}) - CNIC: ${c.cnic_number}`,
        timestamp: c.created_at,
        timeFormatted: formatTime(c.created_at),
        statusBadge: {
          text: c.status.toUpperCase(),
          color: c.status === 'approved' ? 'emerald' : c.status === 'rejected' ? 'rose' : 'amber',
        },
        iconName: 'Users',
        metadata: {
          captainName: c.full_name,
          captainPhone: c.phone,
          service: c.service_type,
        },
      });
    }

    if (c.updated_at && isToday(c.updated_at) && c.updated_at !== c.created_at) {
      alerts.push({
        id: `alert-cap-status-${c.id}`,
        type: 'captain_status',
        category: 'captain',
        title: `Captain Status Updated: ${c.full_name}`,
        subtitle: `Application status updated to ${c.status.toUpperCase()} in admin desk`,
        timestamp: c.updated_at,
        timeFormatted: formatTime(c.updated_at),
        statusBadge: {
          text: c.status.toUpperCase(),
          color: c.status === 'approved' ? 'emerald' : c.status === 'rejected' ? 'rose' : 'amber',
        },
        iconName: 'ShieldCheck',
        metadata: {
          captainName: c.full_name,
          captainPhone: c.phone,
        },
      });
    }
  }

  // 3. Process Customers for today
  for (const cust of allCustomers) {
    if (isToday(cust.created_at)) {
      alerts.push({
        id: `alert-cust-reg-${cust.id}`,
        type: 'customer_registered',
        category: 'customer',
        title: `New Customer Signup: ${cust.full_name}`,
        subtitle: `Phone: ${cust.phone}${cust.email ? ` | ${cust.email}` : ''}`,
        timestamp: cust.created_at,
        timeFormatted: formatTime(cust.created_at),
        statusBadge: {
          text: cust.is_suspended ? 'SUSPENDED' : 'ACTIVE',
          color: cust.is_suspended ? 'rose' : 'emerald',
        },
        iconName: 'UserCheck',
        metadata: {
          customerName: cust.full_name,
          customerPhone: cust.phone,
        },
      });
    }
  }

  // 4. Process Driver Settlements for today
  for (const s of allSettlements) {
    if (isToday(s.created_at)) {
      alerts.push({
        id: `alert-settle-${s.id}`,
        type: 'settlement',
        category: 'financial',
        title: `Cash Clearance Settled: PKR ${s.amount}`,
        subtitle: `Settlement cleared for Captain ${s.captain_name} via ${s.payment_method}`,
        timestamp: s.created_at,
        timeFormatted: formatTime(s.created_at),
        statusBadge: { text: 'CLEARED', color: 'emerald' },
        iconName: 'Banknote',
        metadata: {
          captainName: s.captain_name,
          fare: s.amount,
        },
      });
    }
  }

  // Sort descending: newest activities first
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return alerts;
};

// ==========================================
// 13. ADVANCED ANALYTICS & FINANCIAL AUDIT ENGINE
// ==========================================
export const getDetailedAnalytics = (
  bookings: Booking[],
  captains: Captain[],
  customers: Customer[],
  settlements: DriverSettlement[],
  commissionPercentage: number,
  startDateStr: string,
  endDateStr: string
): AdvancedAnalyticsSummary => {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // 1. Filter Bookings in date range
  const rangeBookings = bookings.filter(b => {
    const d = new Date(b.created_at);
    return d >= start && d <= end;
  });

  // 2. Filter Captains in range
  const newCaptainsInRange = captains.filter(c => {
    const d = new Date(c.created_at);
    return d >= start && d <= end;
  }).length;

  // 3. Filter Customers in range
  const newCustomersInRange = customers.filter(c => {
    const d = new Date(c.created_at);
    return d >= start && d <= end;
  }).length;

  // 4. Filter Settlements in range
  const rangeSettlements = settlements.filter(s => {
    const d = new Date(s.created_at);
    return d >= start && d <= end;
  });

  // Financial calculations
  const grossVolume = rangeBookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
  const platformCommission = Math.round(grossVolume * (commissionPercentage / 100));
  const driverEarnings = Math.max(0, grossVolume - platformCommission);
  const clearedCash = rangeSettlements.reduce((sum, s) => sum + Number(s.amount), 0);
  const pendingClearance = Math.max(0, platformCommission - clearedCash);
  const averageOrderValue = rangeBookings.length > 0 ? Math.round(grossVolume / rangeBookings.length) : 0;

  const cashPaymentsTotal = rangeBookings
    .filter(b => !b.payment_method || b.payment_method.toLowerCase() === 'cash')
    .reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
  const onlinePaymentsTotal = rangeBookings
    .filter(b => b.payment_method && b.payment_method.toLowerCase() !== 'cash')
    .reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);

  // Trips breakdown
  const completed = rangeBookings.filter(b => b.booking_status === 'completed').length;
  const inProgress = rangeBookings.filter(b => b.booking_status === 'in_progress' || b.booking_status === 'assigned' || b.booking_status === 'arrived').length;
  const pending = rangeBookings.filter(b => b.booking_status === 'pending').length;
  const cancelled = rangeBookings.filter(b => b.booking_status === 'cancelled').length;
  const total = rangeBookings.length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  const totalDistanceKm = Math.round(rangeBookings.reduce((sum, b) => sum + (b.estimated_distance_km || 0), 0) * 10) / 10;
  const avgDistanceKm = total > 0 ? Math.round((totalDistanceKm / total) * 10) / 10 : 0;

  // Services Breakdown
  const serviceKeys: Array<{ key: string; label: string }> = [
    { key: 'bike', label: 'OLAK Bike' },
    { key: 'rickshaw', label: 'OLAK Rickshaw' },
    { key: 'car', label: 'OLAK Car' },
    { key: 'delivery', label: 'Parcel Delivery' },
    { key: 'intercity', label: 'Intercity Travel' },
  ];

  const services = serviceKeys.map(s => {
    const sBookings = rangeBookings.filter(b => b.service_type === s.key);
    const rev = sBookings.reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);
    return {
      service: s.key,
      label: s.label,
      trips: sBookings.length,
      revenue: rev,
      percentage: total > 0 ? Math.round((sBookings.length / total) * 100) : 0,
    };
  });

  // Top Captains Leaderboard
  const captainMap = new Map<string, { trips: number; revenue: number }>();
  for (const b of rangeBookings) {
    if (b.assigned_captain_id && b.booking_status === 'completed') {
      const existing = captainMap.get(b.assigned_captain_id) || { trips: 0, revenue: 0 };
      existing.trips += 1;
      existing.revenue += (b.final_fare || b.estimated_fare);
      captainMap.set(b.assigned_captain_id, existing);
    }
  }

  const topCaptains: any[] = [];
  for (const [capId, stat] of captainMap.entries()) {
    const cap = captains.find(c => c.id === capId);
    if (cap) {
      const comm = Math.round(stat.revenue * (commissionPercentage / 100));
      topCaptains.push({
        id: cap.id,
        name: cap.full_name,
        phone: cap.phone,
        vehicle: cap.vehicle_name,
        plate: cap.vehicle_number_plate,
        trips: stat.trips,
        grossRevenue: stat.revenue,
        commissionPaid: comm,
        netEarnings: stat.revenue - comm,
        rating: cap.rating || 5.0,
      });
    }
  }
  topCaptains.sort((a, b) => b.trips - a.trips || b.grossRevenue - a.grossRevenue);

  // Top Customers Leaderboard
  const customerMap = new Map<string, { name: string; phone: string; trips: number; spent: number; lastDate: string }>();
  for (const b of rangeBookings) {
    const phone = b.customer_phone;
    const existing = customerMap.get(phone) || { 
      name: b.customer_name, 
      phone, 
      trips: 0, 
      spent: 0, 
      lastDate: b.created_at 
    };
    existing.trips += 1;
    existing.spent += (b.final_fare || b.estimated_fare);
    if (new Date(b.created_at) > new Date(existing.lastDate)) {
      existing.lastDate = b.created_at;
    }
    customerMap.set(phone, existing);
  }

  const topCustomers = Array.from(customerMap.values()).map(c => ({
    name: c.name,
    phone: c.phone,
    trips: c.trips,
    totalSpent: c.spent,
    avgFare: Math.round(c.spent / c.trips),
    lastTripDate: new Date(c.lastDate).toLocaleDateString('en-GB'),
  }));
  topCustomers.sort((a, b) => b.totalSpent - a.totalSpent || b.trips - a.trips);

  // Popular Routes
  const routeMap = new Map<string, { pickup: string; dropoff: string; count: number; rev: number }>();
  for (const b of rangeBookings) {
    const key = `${b.pickup_location} ➔ ${b.dropoff_location}`;
    const existing = routeMap.get(key) || {
      pickup: b.pickup_location,
      dropoff: b.dropoff_location,
      count: 0,
      rev: 0,
    };
    existing.count += 1;
    existing.rev += (b.final_fare || b.estimated_fare);
    routeMap.set(key, existing);
  }

  const popularRoutes = Array.from(routeMap.entries()).map(([route, r]) => ({
    route,
    pickup: r.pickup,
    dropoff: r.dropoff,
    count: r.count,
    totalRevenue: r.rev,
  }));
  popularRoutes.sort((a, b) => b.count - a.count || b.totalRevenue - a.totalRevenue);

  const activeBookingCustomers = customerMap.size;

  return {
    dateRange: {
      startDate: startDateStr,
      endDate: endDateStr,
      label: `${new Date(startDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(endDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      daysCount,
    },
    financials: {
      grossVolume,
      platformCommission,
      commissionRate: commissionPercentage,
      driverEarnings,
      clearedCash,
      pendingClearance,
      averageOrderValue,
      cashPaymentsTotal,
      onlinePaymentsTotal,
    },
    trips: {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      completionRate,
      cancellationRate,
      totalDistanceKm,
      avgDistanceKm,
    },
    users: {
      totalCustomers: customers.length,
      newCustomersInRange,
      activeBookingCustomers,
      totalCaptains: captains.length,
      newCaptainsInRange,
      approvedCaptains: captains.filter(c => c.status === 'approved').length,
    },
    services,
    topCaptains: topCaptains.slice(0, 10),
    topCustomers: topCustomers.slice(0, 10),
    popularRoutes: popularRoutes.slice(0, 10),
  };
};
