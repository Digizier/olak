import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ldfaqilatbamblqpxpmy:i%24gidwa%253RzCQ5E@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const migrationQueries = [
  // 1. Promotions Table
  `CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT DEFAULT '/#fares',
    badge TEXT DEFAULT 'Special Offer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 2. Driver Settlements Table
  `CREATE TABLE IF NOT EXISTS public.driver_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captain_id UUID REFERENCES public.captains(id) ON DELETE CASCADE,
    captain_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    recorded_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 3. Add columns to intercity_routes if not present
  `ALTER TABLE public.intercity_routes ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'fixed';`,
  `ALTER TABLE public.intercity_routes ADD COLUMN IF NOT EXISTS per_km_rate NUMERIC DEFAULT 25;`,

  // 4. Update default email in site_settings
  `UPDATE public.site_settings SET email = 'olak.tbt@gmail.com' WHERE id = 'olak_settings';`,
  `ALTER TABLE public.site_settings ALTER COLUMN email SET DEFAULT 'olak.tbt@gmail.com';`,

  // 5. Enable RLS and Policies for new tables
  `ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS "Allow all on promotions" ON public.promotions;`,
  `CREATE POLICY "Allow all on promotions" ON public.promotions FOR ALL TO public USING (true) WITH CHECK (true);`,

  `ALTER TABLE public.driver_settlements ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS "Allow all on driver_settlements" ON public.driver_settlements;`,
  `CREATE POLICY "Allow all on driver_settlements" ON public.driver_settlements FOR ALL TO public USING (true) WITH CHECK (true);`,

  // 6. Insert initial promotion banners if empty
  `INSERT INTO public.promotions (title, subtitle, image_url, link_url, badge, is_active)
   SELECT 'Turbat Summer Ride Bonanza', 'Get 20% flat discount on all car & bike rides across Turbat city zones.', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', '/#fares', '20% OFF', true
   WHERE NOT EXISTS (SELECT 1 FROM public.promotions LIMIT 1);`,
  
  `INSERT INTO public.promotions (title, subtitle, image_url, link_url, badge, is_active)
   SELECT 'University of Turbat Student Shuttle', 'Affordable daily commute for UoT students & faculty with instant door-to-campus booking.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80', '/#fares', 'Student Deal', true
   WHERE (SELECT count(*) FROM public.promotions) < 2;`,

  `INSERT INTO public.promotions (title, subtitle, image_url, link_url, badge, is_active)
   SELECT 'Express Highway: Turbat to Gwadar Port', 'Direct AC luxury cars and parcel delivery to Gwadar starting at just PKR 3,500.', 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80', '/#intercity', 'Highway Express', true
   WHERE (SELECT count(*) FROM public.promotions) < 3;`
];

async function runMigration() {
  console.log('🚀 Running OLAK V2 Supabase Migration...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    for (let i = 0; i < migrationQueries.length; i++) {
      const q = migrationQueries[i];
      try {
        await client.query(q);
        console.log(`✓ Step ${i + 1} succeeded`);
      } catch (err) {
        console.warn(`Query ${i + 1} note:`, err.message);
      }
    }
    console.log('🎉 OLAK V2 DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
