import { createClient } from '@supabase/supabase-js';
import { AUTH_URL } from './config';

export const supabase = createClient(
  AUTH_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
  }
);
