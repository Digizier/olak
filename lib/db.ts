import { supabase } from './supabase';
import { 
  Booking, 
  Captain, 
  PricingRate, 
  IntercityRoute, 
  SiteSettings, 
  Customer,
  BookingStatus,
  CaptainStatus 
} from './types';
import { 
  INITIAL_PRICING_RATES, 
  INITIAL_INTERCITY_ROUTES, 
  INITIAL_SITE_SETTINGS 
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
    console.warn('Error during customer login query:', err);
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
    const local: Customer[] = cached ? JSON.parse(cached) : [];

    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, email, phone, total_rides, created_at')
      .order('created_at', { ascending: false });

    if (data && !error) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data));
      return data as Customer[];
    }

    return local;
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
    dispatchCustomEvent('olak_customers_updated', updated);
  }

  try {
    await supabase.from('customers').delete().eq('id', id);
  } catch (err) {
    console.error('Remote DB customer delete error:', err);
  }
};

// ==========================================
// 3. CAPTAIN AUTH & DRIVER HUB
// ==========================================
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

export const loginCaptain = async (phone: string, cnicLastDigits?: string): Promise<Captain | null> => {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  const all = await getCaptains();

  const match = all.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
  if (match) {
    setCurrentCaptain(match);
    return match;
  }

  try {
    const { data, error } = await supabase
      .from('captains')
      .select('*')
      .eq('phone', phone.trim())
      .maybeSingle();

    if (data && !error) {
      setCurrentCaptain(data as Captain);
      return data as Captain;
    }
  } catch (err) {
    console.warn('Error logging in captain:', err);
  }

  return null;
};

export const logoutCaptain = () => {
  setCurrentCaptain(null);
};

// ==========================================
// 4. PRICING RATES MODULE
// ==========================================
export const getPricingRates = async (): Promise<PricingRate[]> => {
  if (typeof window === 'undefined') return INITIAL_PRICING_RATES;

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.RATES);
    const localRates = cached ? JSON.parse(cached) : INITIAL_PRICING_RATES;

    const { data, error } = await supabase
      .from('pricing_rates')
      .select('id, service_name, service_name_urdu, service_type, vehicle_models, base_fare, per_km_charge, waiting_charge_per_min, minimum_fare, cancellation_fee, operating_hours, service_areas, is_active, icon_name')
      .order('service_type');

    if (data && data.length > 0 && !error) {
      localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(data));
      return data as PricingRate[];
    }

    return localRates;
  } catch (err) {
    console.warn('Error fetching pricing rates:', err);
    return INITIAL_PRICING_RATES;
  }
};

export const savePricingRate = async (rate: PricingRate): Promise<PricingRate> => {
  const allRates = await getPricingRates();
  const index = allRates.findIndex(r => r.id === rate.id);
  
  let updatedList: PricingRate[];
  if (index >= 0) {
    updatedList = [...allRates];
    updatedList[index] = rate;
  } else {
    updatedList = [rate, ...allRates];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(updatedList));
    dispatchCustomEvent('olak_fares_updated', updatedList);
  }

  try {
    await supabase.from('pricing_rates').upsert(rate);
  } catch (err) {
    console.error('Failed to sync rate to Supabase:', err);
  }

  return rate;
};

// ==========================================
// 5. INTERCITY ROUTES MODULE
// ==========================================
export const getIntercityRoutes = async (): Promise<IntercityRoute[]> => {
  if (typeof window === 'undefined') return INITIAL_INTERCITY_ROUTES;

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.INTERCITY);
    const localRoutes = cached ? JSON.parse(cached) : INITIAL_INTERCITY_ROUTES;

    const { data, error } = await supabase
      .from('intercity_routes')
      .select('id, origin_city, destination_city, estimated_distance_km, estimated_duration, bike_fare, car_economy_fare, car_comfort_fare, delivery_parcel_fare, is_active')
      .order('origin_city');

    if (data && data.length > 0 && !error) {
      localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(data));
      return data as IntercityRoute[];
    }

    return localRoutes;
  } catch (err) {
    console.warn('Error fetching intercity routes:', err);
    return INITIAL_INTERCITY_ROUTES;
  }
};

export const saveIntercityRoute = async (route: IntercityRoute): Promise<IntercityRoute> => {
  const all = await getIntercityRoutes();
  const index = all.findIndex(r => r.id === route.id);
  const updatedList = index >= 0 ? all.map(r => r.id === route.id ? route : r) : [route, ...all];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.INTERCITY, JSON.stringify(updatedList));
    dispatchCustomEvent('olak_intercity_updated', updatedList);
  }

  try {
    await supabase.from('intercity_routes').upsert(route);
  } catch (err) {
    console.error('Remote intercity sync error:', err);
  }

  return route;
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
  const all = await getCaptains();
  const updated = all.filter(c => c.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CAPTAINS, JSON.stringify(updated));
    dispatchCustomEvent('olak_captains_updated', updated);
  }

  try {
    await supabase.from('captains').delete().eq('id', id);
  } catch (err) {
    console.error('Remote DB captain delete error:', err);
  }
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
    console.error('Remote DB captain online status error:', err);
  }
};

// ==========================================
// 7. BOOKINGS & TRIP LIFECYCLE
// ==========================================
export const getBookings = async (): Promise<Booking[]> => {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const localBookings: Booking[] = cached ? JSON.parse(cached) : [];

    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_code, service_type, customer_id, customer_name, customer_phone, pickup_location, pickup_landmark, dropoff_location, dropoff_landmark, intercity_origin, intercity_destination, delivery_parcel_type, delivery_weight_kg, delivery_receiver_name, delivery_receiver_phone, notes, estimated_distance_km, estimated_fare, final_fare, payment_method, payment_status, booking_status, assigned_captain_id, cancellation_reason, created_at, updated_at')
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

export const getCustomerBookings = async (customerId?: string, customerPhone?: string): Promise<Booking[]> => {
  const all = await getBookings();
  return all.filter(b => 
    (customerId && b.customer_id === customerId) ||
    (customerPhone && b.customer_phone.replace(/\D/g, '') === customerPhone.replace(/\D/g, ''))
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
// 8. STORAGE & FILE UPLOADS
// ==========================================
export const uploadFileToStorage = async (file: File, folder = 'documents'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('olak-uploads')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.warn('Supabase storage upload fallback to local ObjectURL:', error.message);
      return URL.createObjectURL(file);
    }

    const { data: publicData } = supabase.storage
      .from('olak-uploads')
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    console.warn('Storage upload error, using local fallback:', err);
    return URL.createObjectURL(file);
  }
};
