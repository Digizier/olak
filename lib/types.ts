export type ServiceType = 'bike' | 'rickshaw' | 'car' | 'delivery' | 'intercity';

export type BookingStatus = 
  | 'pending' 
  | 'assigned' 
  | 'arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type PaymentMethod = 'cash' | 'easypaisa' | 'jazzcash';
export type PaymentStatus = 'unpaid' | 'paid';

export type CaptainStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface CityLandmark {
  id: string;
  name: string;
  name_urdu?: string;
  nameUrdu?: string;
  area: string;
  lat: number;
  lng: number;
  is_active?: boolean;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  password_hash?: string;
  total_rides: number;
  status?: 'active' | 'suspended';
  is_suspended?: boolean;
  is_blocked?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PricingRate {
  id: string;
  service_name: string;
  service_name_urdu: string;
  service_type: ServiceType;
  vehicle_models: string;
  base_fare: number;
  per_km_charge: number;
  waiting_charge_per_min: number;
  minimum_fare: number;
  cancellation_fee: number;
  operating_hours: string;
  service_areas: string;
  is_active: boolean;
  icon_name: string;
  tagline?: string;
  capacity?: string;
}

export interface IntercityRoute {
  id: string;
  origin_city: string;
  destination_city: string;
  estimated_distance_km: number;
  estimated_duration: string;
  pricing_model?: 'fixed' | 'per_km';
  per_km_rate?: number;
  bike_fare?: number;
  car_economy_fare: number;
  car_comfort_fare: number;
  delivery_parcel_fare: number;
  is_active: boolean;
}

export interface Captain {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_number?: string;
  cnic_number: string;
  city: string;
  service_type: ServiceType;
  vehicle_name: string;
  vehicle_model_year?: string;
  vehicle_number_plate: string;
  cnic_front_url?: string;
  cnic_back_url?: string;
  license_url?: string;
  vehicle_photo_url?: string;
  profile_photo_url?: string;
  status: CaptainStatus;
  is_online: boolean;
  total_trips_completed: number;
  total_earnings: number;
  rating: number;
  created_at: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  service_type: ServiceType;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  pickup_landmark?: string;
  dropoff_location: string;
  dropoff_landmark?: string;
  pickup_coords?: LocationCoords;
  dropoff_coords?: LocationCoords;
  intercity_origin?: string;
  intercity_destination?: string;
  intercity_travel_date?: string;
  intercity_seats?: number;
  delivery_parcel_type?: string;
  delivery_weight_kg?: number;
  delivery_receiver_name?: string;
  delivery_receiver_phone?: string;
  notes?: string;
  estimated_distance_km: number;
  estimated_fare: number;
  final_fare?: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  assigned_captain_id?: string;
  assigned_captain?: Captain;
  cancellation_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface PromotionBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  badge?: string;
  is_active: boolean;
  created_at: string;
}

export interface DriverPromoCard {
  id: string;
  category_badge: string;
  title: string;
  title_urdu: string;
  image_url: string;
  bullets: string[];
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  created_at?: string;
}

export interface DriverSettlement {
  id: string;
  captain_id: string;
  captain_name: string;
  amount: number;
  payment_method: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  company_name: string;
  company_name_urdu: string;
  tagline: string;
  tagline_urdu: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  address_urdu: string;
  operating_cities: string[];
  commission_percentage: number;
  is_booking_active: boolean;
  admin_pin: string;
}

export type Language = 'en' | 'ur';

export interface ActivityAlert {
  id: string;
  type: 
    | 'booking_new' 
    | 'booking_assigned' 
    | 'booking_completed' 
    | 'booking_cancelled' 
    | 'captain_registered' 
    | 'captain_status' 
    | 'captain_online' 
    | 'customer_registered' 
    | 'customer_status' 
    | 'settlement';
  category: 'booking' | 'captain' | 'customer' | 'financial';
  title: string;
  subtitle: string;
  timestamp: string;
  timeFormatted: string;
  statusBadge: {
    text: string;
    color: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
  };
  iconName: string;
  metadata?: {
    code?: string;
    customerName?: string;
    customerPhone?: string;
    captainName?: string;
    captainPhone?: string;
    fare?: number;
    service?: string;
    pickup?: string;
    dropoff?: string;
  };
}

export interface ServiceMetric {
  service: string;
  label: string;
  trips: number;
  revenue: number;
  percentage: number;
}

export interface CaptainLeaderboardItem {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  trips: number;
  grossRevenue: number;
  commissionPaid: number;
  netEarnings: number;
  rating: number;
}

export interface CustomerLeaderboardItem {
  id?: string;
  name: string;
  phone: string;
  trips: number;
  totalSpent: number;
  avgFare: number;
  lastTripDate: string;
}

export interface RoutePopularityItem {
  route: string;
  pickup: string;
  dropoff: string;
  count: number;
  totalRevenue: number;
}

export interface AdvancedAnalyticsSummary {
  dateRange: {
    startDate: string;
    endDate: string;
    label: string;
    daysCount: number;
  };
  financials: {
    grossVolume: number;
    platformCommission: number;
    commissionRate: number;
    driverEarnings: number;
    clearedCash: number;
    pendingClearance: number;
    averageOrderValue: number;
    cashPaymentsTotal: number;
    onlinePaymentsTotal: number;
  };
  trips: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    cancelled: number;
    completionRate: number;
    cancellationRate: number;
    totalDistanceKm: number;
    avgDistanceKm: number;
  };
  users: {
    totalCustomers: number;
    newCustomersInRange: number;
    activeBookingCustomers: number;
    totalCaptains: number;
    newCaptainsInRange: number;
    approvedCaptains: number;
  };
  services: ServiceMetric[];
  topCaptains: CaptainLeaderboardItem[];
  topCustomers: CustomerLeaderboardItem[];
  popularRoutes: RoutePopularityItem[];
}
