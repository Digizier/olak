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
  ServiceType
} from './types';
import { 
  INITIAL_PRICING_RATES, 
  INITIAL_INTERCITY_ROUTES, 
  INITIAL_SITE_SETTINGS,
  INITIAL_PROMOTIONS,
  INITIAL_LANDMARKS
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
    const fallback = cached ? JSON.parse(cached) : INITIAL_SITE_SETTINGS;

    const { data, error } = await supabase
      .from('site_settings')
      .select('id, company_name, company_name_urdu, tagline, tagline_urdu, phone, whatsapp, email, address, address_urdu, operating_cities, commission_percentage, is_booking_active, admin_pin')
      .eq('id', 'olak_settings')
      .maybeSingle();

    if (data && !error) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
      return data as SiteSettings;
    }

    return fallback;
  } catch (err) {
    console.warn('Error fetching site settings, using fallback:', err);
    return INITIAL_SITE_SETTINGS;
  }
};

export const saveSiteSettings = async (settings: Partial<SiteSettings>): Promise<SiteSettings> => {
  const current = await getSiteSettings();
  const updated: SiteSettings = { ...current, ...settings };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    dispatchCustomEvent('olak_settings_updated', updated);
  }

  try {
    await supabase.from('site_settings').upsert({
      ...updated,
      id: 'olak_settings',
      updated_at: new Date().toISOString(),
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

export const getCustomers = async (): Promise<Customer[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const localCustomers: Customer[] = cached ? JSON.parse(cached) : [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data));
      return data as Customer[];
    }

    return localCustomers;
  } catch (err) {
    console.warn('Error fetching customers:', err);
    return [];
  }
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
    const cached = localStorage.getItem(STORAGE_KEYS.INTERCITY);
    let fallback = INITIAL_INTERCITY_ROUTES;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          fallback = parsed;
        }
      } catch {
        fallback = INITIAL_INTERCITY_ROUTES;
      }
    }

    const { data, error } = await supabase
      .from('intercity_routes')
      .select('*')
      .order('car_economy_fare', { ascending: true });

    if (data && !error && data.length > 0) {
      localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(data));
      return data as IntercityRoute[];
    }

    // Always ensure valid default routes are saved in localStorage
    localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(fallback));
    return fallback;
  } catch (err) {
    console.warn('Error fetching intercity routes:', err);
    return INITIAL_INTERCITY_ROUTES;
  }
};

export const resetIntercityRoutesToDefaults = async (): Promise<IntercityRoute[]> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(INITIAL_INTERCITY_ROUTES));
    dispatchCustomEvent('olak_intercity_updated', INITIAL_INTERCITY_ROUTES);
  }
  return INITIAL_INTERCITY_ROUTES;
};

export const saveIntercityRoute = async (routeData: Partial<IntercityRoute>): Promise<IntercityRoute> => {
  const all = await getIntercityRoutes();
  let updatedRoute: IntercityRoute;

  if (routeData.id && all.some(r => r.id === routeData.id)) {
    updatedRoute = { ...all.find(r => r.id === routeData.id)!, ...routeData } as IntercityRoute;
    const updated = all.map(r => r.id === updatedRoute.id ? updatedRoute : r);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(updated));
      dispatchCustomEvent('olak_intercity_updated', updated);
    }
  } else {
    updatedRoute = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `route-${Date.now()}`,
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
    const updated = [updatedRoute, ...all];
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
  const updated = all.filter(r => r.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(updated));
    dispatchCustomEvent('olak_intercity_updated', updated);
  }

  try {
    await supabase.from('intercity_routes').delete().eq('id', id);
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
    const cached = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
    const fallback = cached ? JSON.parse(cached) : INITIAL_PROMOTIONS;

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error && data.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(data));
      return data as PromotionBanner[];
    }

    return fallback;
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
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
      dispatchCustomEvent('olak_promotions_updated', updated);
    }
  } else {
    updatedPromo = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `promo-${Date.now()}`,
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
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
      dispatchCustomEvent('olak_promotions_updated', updated);
    }
  }

  try {
    await supabase.from('promotions').upsert(updatedPromo);
  } catch (err) {
    console.error('Remote promotion sync error:', err);
  }

  return updatedPromo;
};

export const deletePromotion = async (id: string): Promise<void> => {
  const all = await getPromotions();
  const updated = all.filter(p => p.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(updated));
    dispatchCustomEvent('olak_promotions_updated', updated);
  }

  try {
    await supabase.from('promotions').delete().eq('id', id);
  } catch (err) {
    console.error('Remote promotion delete error:', err);
  }
};

// ==========================================
// 6. CAPTAINS MODULE
// ==========================================
export const getCaptains = async (): Promise<Captain[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CAPTAINS);
    const localCaptains: Captain[] = cached ? JSON.parse(cached) : [];

    const { data, error } = await supabase
      .from('captains')
      .select('id, full_name, phone, whatsapp_number, cnic_number, city, service_type, vehicle_name, vehicle_model_year, vehicle_number_plate, cnic_front_url, cnic_back_url, license_url, vehicle_photo_url, status, is_online, total_trips_completed, total_earnings, rating, created_at')
      .order('created_at', { ascending: false });

    if (data && !error) {
      localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(data));
      return data as Captain[];
    }

    return localCaptains;
  } catch (err) {
    console.warn('Error fetching captains:', err);
    return [];
  }
};

export const createCaptain = async (captainData: Omit<Captain, 'id' | 'created_at' | 'status' | 'is_online' | 'total_trips_completed' | 'total_earnings' | 'rating'>): Promise<Captain> => {
  const newCaptain: Captain = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cap-${Date.now()}`,
    ...captainData,
    status: 'pending',
    is_online: false,
    total_trips_completed: 0,
    total_earnings: 0,
    rating: 5.0,
    created_at: new Date().toISOString(),
  };

  const existing = await getCaptains();
  const updated = [newCaptain, ...existing];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updated));
    setCurrentCaptain(newCaptain);
    dispatchCustomEvent('olak_captains_updated', updated);
  }

  try {
    await supabase.from('captains').insert(newCaptain);
  } catch (err) {
    console.error('Remote DB captain insert error:', err);
  }

  return newCaptain;
};

export const updateCaptainStatus = async (id: string, status: CaptainStatus): Promise<void> => {
  const captains = await getCaptains();
  const updated = captains.map(c => c.id === id ? { ...c, status } : c);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updated));
    dispatchCustomEvent('olak_captains_updated', updated);
  }

  try {
    await supabase.from('captains').update({ status }).eq('id', id);
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
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
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
