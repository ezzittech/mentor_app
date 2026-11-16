import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when the app is connected to a real Supabase project (env vars set at build time). */
export const hasSupabase = !!(url && key);
export const demoEnabled = import.meta.env.VITE_DEMO_MODE !== 'false';

/** Browser client — uses only the public anon/publishable key. Access is enforced by RLS in Postgres. */
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'public-anon-key', {
  auth: { persistSession: hasSupabase, autoRefreshToken: hasSupabase, detectSessionInUrl: hasSupabase },
});
