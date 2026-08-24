import { createClient, SupabaseClient } from '@supabase/supabase-js';

const isValidHttpUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleaned = url.trim().replace(/^["']|["']$/g, '');
  return cleaned.startsWith('http://') || cleaned.startsWith('https://');
};

const SUPABASE_URL = isValidHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  ? process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/^["']|["']$/g, '')
  : 'https://ldfaqilatbamblqpxpmy.supabase.co';

const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmFxaWxhdGJhbWJscXB4cG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTQwNDAsImV4cCI6MjEwMzA3MDA0MH0.2oOTag3Ppw3qsAccREjurHpNVgn9CurBm1f9TadOUJQ'
).trim().replace(/^["']|["']$/g, '');

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();
