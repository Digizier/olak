import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ldfaqilatbamblqpxpmy:i%24gidwa%253RzCQ5E@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL...');

    await client.query(`
      ALTER TABLE public.captains 
        ADD COLUMN IF NOT EXISTS email TEXT,
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);
    console.log('Added auth columns to captains table.');

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_captains_email ON public.captains(email) WHERE email IS NOT NULL;
    `);
    console.log('Created unique index on captains(email).');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
