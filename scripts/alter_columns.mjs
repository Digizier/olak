import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ldfaqilatbamblqpxpmy:i%24gidwa%253RzCQ5E@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const alterSQL = [
  `ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;`,
  `ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS assigned_captain_id UUID REFERENCES public.captains(id) ON DELETE SET NULL;`,
  `ALTER TABLE IF EXISTS public.captains ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;`,
  `ALTER TABLE IF EXISTS public.captains ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0;`,
  `ALTER TABLE IF EXISTS public.captains ADD COLUMN IF NOT EXISTS total_trips_completed INT DEFAULT 0;`,
];

async function runAlter() {
  console.log('Syncing all column updates to Supabase PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    for (const q of alterSQL) {
      try {
        await client.query(q);
        console.log('Executed:', q.slice(0, 60), '...');
      } catch (err) {
        console.warn('Note:', err.message);
      }
    }
    console.log('✅ Column migrations complete!');
  } catch (err) {
    console.error('Fatal alter error:', err);
  } finally {
    await client.end();
  }
}

runAlter();
