import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AUTH_COOKIE, AUTH_URL } from './config';

// Reads the session from the cookies the server-side login (lib/auth/actions.ts) sets.
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      AUTH_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookieOptions: { name: AUTH_COOKIE } }
    );
  }
  return client;
}

/** The signed-in user's access token, refreshed by supabase-js when it's about to expire. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await getBrowserSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}
