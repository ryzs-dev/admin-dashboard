// lib/auth/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, AUTH_URL } from './config';

// Define your route protection rules
const PUBLIC_ROUTES = ['/login', '/forget-password', '/reset-password', '/privacy'];
const AUTH_ROUTES = ['/login', '/forget-password', '/reset-password']; // Routes auth users shouldn't access
const PROTECTED_ROUTES = ['/dashboard', '/orders', '/customers', '/settings']; // Add your protected routes

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    AUTH_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: AUTH_COOKIE },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is auth-only (login/signup)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If user is logged in and trying to access auth routes, redirect to dashboard
  if (user && (isAuthRoute || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';

    return NextResponse.redirect(url);
  }

  // If user is not logged in and trying to access protected routes, redirect to login
  if (!user && (isProtectedRoute || (!isPublicRoute && pathname !== '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';

    return NextResponse.redirect(url);
  }

  // Add user info to response headers (optional, for debugging)
  if (user) {
    supabaseResponse.headers.set('x-user-id', user.id);
    supabaseResponse.headers.set('x-user-email', user.email || '');
  }

  return supabaseResponse;
}
