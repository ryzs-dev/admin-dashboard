// The CRM's own login service, not Supabase. The cookie keeps the name it has
// always had, so people stay signed in.
export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://agent.lunaawomencare.com/sb';
export const AUTH_COOKIE = 'sb-yowovtegtcjhbcuoztlw-auth-token';
