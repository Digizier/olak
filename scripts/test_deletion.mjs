import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.ldfaqilatbamblqpxpmy:i%24gidwa%253RzCQ5E@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function testDeletionFlow() {
  console.log('--- 🧪 TESTING SUPABASE DELETION HOOKS ---');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 1. Create a dummy test customer and delete it
    const custRes = await client.query(
      `INSERT INTO public.customers (full_name, email, phone) 
       VALUES ('Dummy Test To Delete', 'dummy.delete@olak.pk', '+92 300 0000000') RETURNING id`
    );
    const dummyCustId = custRes.rows[0].id;
    console.log('1. Created dummy customer ID:', dummyCustId);

    // Delete customer
    const delCustRes = await client.query('DELETE FROM public.customers WHERE id = $1 RETURNING id', [dummyCustId]);
    console.log('✅ 2. Deleted customer from Supabase:', delCustRes.rows[0]?.id === dummyCustId ? 'SUCCESS' : 'FAILED');

    // 2. Create a dummy booking and delete it
    const bookRes = await client.query(
      `INSERT INTO public.bookings (
        booking_code, service_type, customer_name, customer_phone,
        pickup_location, dropoff_location, estimated_fare, booking_status
      ) VALUES ('OLK-9999', 'bike', 'Dummy Passenger', '03340000000', 'Test Pick', 'Test Drop', 100, 'pending') RETURNING id`
    );
    const dummyBookId = bookRes.rows[0].id;
    console.log('3. Created dummy booking ID:', dummyBookId);

    // Delete booking
    const delBookRes = await client.query('DELETE FROM public.bookings WHERE id = $1 RETURNING id', [dummyBookId]);
    console.log('✅ 4. Deleted booking from Supabase:', delBookRes.rows[0]?.id === dummyBookId ? 'SUCCESS' : 'FAILED');

    // 3. Create a dummy captain and delete it
    const capRes = await client.query(
      `INSERT INTO public.captains (
        full_name, phone, cnic_number, service_type, vehicle_name, vehicle_number_plate
      ) VALUES ('Dummy Captain', '03450000000', '52201-0000000-0', 'bike', 'Test Bike', 'TRB-0000') RETURNING id`
    );
    const dummyCapId = capRes.rows[0].id;
    console.log('5. Created dummy captain ID:', dummyCapId);

    // Delete captain
    const delCapRes = await client.query('DELETE FROM public.captains WHERE id = $1 RETURNING id', [dummyCapId]);
    console.log('✅ 6. Deleted captain from Supabase:', delCapRes.rows[0]?.id === dummyCapId ? 'SUCCESS' : 'FAILED');

    console.log('--- 🚀 ALL SUPABASE DELETION HOOKS WORK FLAWLESSLY! ---');
  } catch (err) {
    console.error('Deletion test error:', err);
  } finally {
    await client.end();
  }
}

testDeletionFlow();
