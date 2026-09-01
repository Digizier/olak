import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ldfaqilatbamblqpxpmy:i%24gidwa%253RzCQ5E@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const initialLandmarks = [
  { id: 'lm-1', name: 'City Thana, Thana Road', name_urdu: 'سٹی تھانہ، تھانہ روڈ', area: 'Central Turbat', lat: 26.0031, lng: 63.0544 },
  { id: 'lm-2', name: 'Turbat International Airport', name_urdu: 'تربت انٹرنیشنل ایئرپورٹ', area: 'Airport Road', lat: 25.9863, lng: 63.0312 },
  { id: 'lm-3', name: 'University of Turbat (UoT)', name_urdu: 'یونیورسٹی آف تربت', area: 'M-8 Ginna', lat: 26.0289, lng: 63.0978 },
  { id: 'lm-4', name: 'Main Bazaar / Shahi Bazaar', name_urdu: 'مین بازار / شاہی بازار', area: 'Central Turbat', lat: 26.0055, lng: 63.0501 },
  { id: 'lm-5', name: 'District Headquarters (DHQ) Hospital', name_urdu: 'ڈی ایچ کیو ہسپتال تربت', area: 'Hospital Road', lat: 26.0082, lng: 63.0485 },
  { id: 'lm-6', name: 'Absar Chowk', name_urdu: 'ابسر چوک', area: 'Absar', lat: 25.9924, lng: 63.0721 },
  { id: 'lm-7', name: 'Malikabad / Aabsar Road', name_urdu: 'ملک آباد / ابسر روڈ', area: 'Malikabad', lat: 26.0125, lng: 63.0655 },
  { id: 'lm-8', name: 'D-Baloch Chowk', name_urdu: 'ڈی بلوچ چوک', area: 'D-Baloch', lat: 26.0188, lng: 63.0412 },
  { id: 'lm-9', name: 'Singanisar Chowk', name_urdu: 'سنگانی سر چوک', area: 'Singanisar', lat: 25.9875, lng: 63.0611 },
  { id: 'lm-10', name: 'Ginna Road / M-8 CPEC Junction', name_urdu: 'گنہ روڈ / ایم 8 جنکشن', area: 'Ginna', lat: 26.0351, lng: 63.1120 },
  { id: 'lm-11', name: 'Circuit House Turbat', name_urdu: 'سرکٹ ہاؤس تربت', area: 'Officers Colony', lat: 26.0101, lng: 63.0588 },
  { id: 'lm-12', name: 'Turbat Public School & College', name_urdu: 'تربت پبلک اسکول و کالج', area: 'Absar Road', lat: 25.9981, lng: 63.0699 },
  { id: 'lm-13', name: 'Kech River View Point', name_urdu: 'کیچ ریور ویو پوائنٹ', area: 'Kech River', lat: 26.0150, lng: 63.0380 },
  { id: 'lm-14', name: 'Government Degree College Turbat', name_urdu: 'گورنمنٹ ڈگری کالج تربت', area: 'College Road', lat: 26.0012, lng: 63.0531 },
];

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.city_landmarks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_urdu TEXT NOT NULL,
      area TEXT NOT NULL,
      lat NUMERIC NOT NULL,
      lng NUMERIC NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await client.query(`ALTER TABLE public.city_landmarks ENABLE ROW LEVEL SECURITY;`);
  await client.query(`DROP POLICY IF EXISTS "Allow all on city_landmarks" ON public.city_landmarks;`);
  await client.query(`CREATE POLICY "Allow all on city_landmarks" ON public.city_landmarks FOR ALL TO public USING (true) WITH CHECK (true);`);

  for (const lm of initialLandmarks) {
    await client.query(`
      INSERT INTO public.city_landmarks (id, name, name_urdu, area, lat, lng, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name, name_urdu = EXCLUDED.name_urdu, area = EXCLUDED.area, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
    `, [lm.id, lm.name, lm.name_urdu, lm.area, lm.lat, lm.lng]);
  }

  console.log('✓ city_landmarks table created and seeded successfully!');
  await client.end();
}

run().catch(console.error);
