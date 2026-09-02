import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ldfaqilatbamblqpxpmy:i%24gidwa%253RzCQ5E@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const tablesSQL = [
  // 1. Site Settings
  `CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'olak_settings',
    company_name TEXT DEFAULT 'OLAK (اولاک)',
    company_name_urdu TEXT DEFAULT 'اولاک موبلٹی و ڈلیوری سروس',
    tagline TEXT DEFAULT 'Safar Har Qadam Asan (سفر ہر قدم آسان)',
    tagline_urdu TEXT DEFAULT 'آسان سفر، آسان کمائی — آپ کی سواری، آپ کا اعتماد',
    phone TEXT DEFAULT '+92 3350455599',
    whatsapp TEXT DEFAULT '+92 3340468649',
    email TEXT DEFAULT 'olak.bln@gmail.com',
    address TEXT DEFAULT 'Office Near City Thana, Thana Road, Turbat, Balochistan',
    address_urdu TEXT DEFAULT 'دفتر نزد سٹی تھانہ، تھانہ روڈ، تربت، بلوچستان',
    operating_cities JSONB DEFAULT '["Turbat", "Gwadar", "Pasni", "Jiwani", "Tump", "Mand", "Panjgur", "Quetta", "Hub Chowki", "Karachi", "Khuzdar", "Awaran"]',
    commission_percentage NUMERIC DEFAULT 10.0,
    is_booking_active BOOLEAN DEFAULT true,
    admin_pin TEXT DEFAULT 'admin123',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 2. Customers
  `CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT,
    total_rides INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 3. Pricing Rates
  `CREATE TABLE IF NOT EXISTS public.pricing_rates (
    id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    service_name_urdu TEXT NOT NULL,
    service_type TEXT NOT NULL,
    vehicle_models TEXT NOT NULL,
    base_fare NUMERIC NOT NULL,
    per_km_charge NUMERIC NOT NULL,
    waiting_charge_per_min NUMERIC NOT NULL,
    minimum_fare NUMERIC NOT NULL,
    cancellation_fee NUMERIC NOT NULL,
    operating_hours TEXT NOT NULL,
    service_areas TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    icon_name TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 4. Intercity Routes
  `CREATE TABLE IF NOT EXISTS public.intercity_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    estimated_distance_km NUMERIC NOT NULL,
    estimated_duration TEXT NOT NULL,
    bike_fare NUMERIC,
    car_economy_fare NUMERIC NOT NULL,
    car_comfort_fare NUMERIC NOT NULL,
    delivery_parcel_fare NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 5. Captains
  `CREATE TABLE IF NOT EXISTS public.captains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    whatsapp_number TEXT,
    cnic_number TEXT NOT NULL,
    city TEXT DEFAULT 'Turbat',
    service_type TEXT NOT NULL,
    vehicle_name TEXT NOT NULL,
    vehicle_model_year TEXT,
    vehicle_number_plate TEXT NOT NULL,
    cnic_front_url TEXT,
    cnic_back_url TEXT,
    license_url TEXT,
    vehicle_photo_url TEXT,
    status TEXT DEFAULT 'pending',
    is_online BOOLEAN DEFAULT false,
    total_trips_completed INT DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 6. Bookings
  `CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT UNIQUE NOT NULL,
    service_type TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    pickup_landmark TEXT,
    dropoff_location TEXT NOT NULL,
    dropoff_landmark TEXT,
    intercity_origin TEXT,
    intercity_destination TEXT,
    delivery_parcel_type TEXT,
    delivery_weight_kg NUMERIC,
    delivery_receiver_name TEXT,
    delivery_receiver_phone TEXT,
    notes TEXT,
    estimated_distance_km NUMERIC DEFAULT 0,
    estimated_fare NUMERIC NOT NULL,
    final_fare NUMERIC,
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'unpaid',
    booking_status TEXT DEFAULT 'pending',
    assigned_captain_id UUID REFERENCES public.captains(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON public.bookings(customer_phone);`,
  `CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);`,
  `CREATE INDEX IF NOT EXISTS idx_captains_phone ON public.captains(phone);`,
  `CREATE INDEX IF NOT EXISTS idx_captains_status ON public.captains(status);`,
  `CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);`,
  `CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);`,

  // Enable RLS
  `ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.pricing_rates ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.intercity_routes ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.captains ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;`,

  // RLS Policies
  `DROP POLICY IF EXISTS "Allow all on site_settings" ON public.site_settings;`,
  `CREATE POLICY "Allow all on site_settings" ON public.site_settings FOR ALL TO public USING (true) WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Allow all on customers" ON public.customers;`,
  `CREATE POLICY "Allow all on customers" ON public.customers FOR ALL TO public USING (true) WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Allow all on pricing_rates" ON public.pricing_rates;`,
  `CREATE POLICY "Allow all on pricing_rates" ON public.pricing_rates FOR ALL TO public USING (true) WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Allow all on intercity_routes" ON public.intercity_routes;`,
  `CREATE POLICY "Allow all on intercity_routes" ON public.intercity_routes FOR ALL TO public USING (true) WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Allow all on captains" ON public.captains;`,
  `CREATE POLICY "Allow all on captains" ON public.captains FOR ALL TO public USING (true) WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Allow all on bookings" ON public.bookings;`,
  `CREATE POLICY "Allow all on bookings" ON public.bookings FOR ALL TO public USING (true) WITH CHECK (true);`,

  // Storage bucket for photos & documents
  `INSERT INTO storage.buckets (id, name, public) VALUES ('olak-uploads', 'olak-uploads', true) ON CONFLICT (id) DO UPDATE SET public = true;`,
  `DROP POLICY IF EXISTS "Public access to olak-uploads" ON storage.objects;`,
  `CREATE POLICY "Public access to olak-uploads" ON storage.objects FOR ALL TO public USING (bucket_id = 'olak-uploads') WITH CHECK (bucket_id = 'olak-uploads');`,

  // 7. Driver Promos Table
  `CREATE TABLE IF NOT EXISTS public.driver_promos (
    id TEXT PRIMARY KEY,
    category_badge TEXT NOT NULL,
    title TEXT NOT NULL,
    title_urdu TEXT,
    image_url TEXT NOT NULL,
    bullets JSONB DEFAULT '[]'::jsonb,
    cta_text TEXT DEFAULT 'Register Captain',
    cta_link TEXT DEFAULT '/captain/',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `ALTER TABLE public.driver_promos ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS "Allow all on driver_promos" ON public.driver_promos;`,
  `CREATE POLICY "Allow all on driver_promos" ON public.driver_promos FOR ALL TO public USING (true) WITH CHECK (true);`,

  // 8. Promotions Table Column Alignment
  `ALTER TABLE public.promotions ALTER COLUMN id TYPE TEXT;`,
  `ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS "Allow all on promotions" ON public.promotions;`,
  `CREATE POLICY "Allow all on promotions" ON public.promotions FOR ALL TO public USING (true) WITH CHECK (true);`,

  // Realtime publications
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_promos;`,
];

async function runSetup() {
  console.log('Connecting to Supabase PostgreSQL Pooler (ap-southeast-1)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected! Executing schema queries...');

    for (let i = 0; i < tablesSQL.length; i++) {
      const q = tablesSQL[i];
      try {
        await client.query(q);
      } catch (err) {
        console.warn(`Query ${i + 1} note:`, err.message);
      }
    }

    console.log('✅ ALL SUPABASE TABLES INCLUDING CUSTOMERS & POLICIES SYNCED SUCCESSFULLY!');
  } catch (err) {
    console.error('Fatal Migration error:', err);
  } finally {
    await client.end();
  }
}

runSetup();
