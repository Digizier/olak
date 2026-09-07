import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.ldfaqilatbamblqpxpmy:i%24gidwa%253RzCQ5E@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL...');

  // 1. Allow any ID format (TEXT) instead of strictly UUID
  await client.query(`
    ALTER TABLE public.intercity_routes ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.intercity_routes ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.intercity_routes ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  `);
  console.log('Altered id to TEXT with gen_random_uuid()::text default.');

  // 2. Add coordinates columns
  await client.query(`
    ALTER TABLE public.intercity_routes ADD COLUMN IF NOT EXISTS origin_lat NUMERIC;
    ALTER TABLE public.intercity_routes ADD COLUMN IF NOT EXISTS origin_lng NUMERIC;
    ALTER TABLE public.intercity_routes ADD COLUMN IF NOT EXISTS destination_lat NUMERIC;
    ALTER TABLE public.intercity_routes ADD COLUMN IF NOT EXISTS destination_lng NUMERIC;
  `);
  console.log('Added origin_lat, origin_lng, destination_lat, destination_lng columns.');

  // 3. Reload schema cache for PostgREST
  await client.query('NOTIFY pgrst, \'reload schema\';');
  console.log('Notified PostgREST to reload schema.');

  // 4. Verify columns
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'intercity_routes'
    ORDER BY ordinal_position;
  `);
  console.log('Updated intercity_routes columns:', res.rows);

  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
