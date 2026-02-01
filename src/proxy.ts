/**
 * Next.js Proxy for Route Protection
 * Handles authentication checks before pages render
 * (Updated from middleware.ts to proxy.ts for Next.js 16+)
 */

import { NextRequest, NextResponse } from 'next/server';

// Define protected routes by role
const studentRoutes = [
  '/student/dashboard',
];

const driverRoutes = [
  '/driver/dashboard',
];

const adminRoutes = [
  '/admin/dashboard',
  '/admin/verify-drivers',
  '/admin/students',
  '/admin/drivers',
];

const protectedRoutes = [
  '/profile',
  '/delete-account',
  '/change-password',
  '/checkout',
  '/payment/success',
  '/payment/failure',
  ...studentRoutes,
  ...driverRoutes,
];

const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth status from cookie
  const hasAuthCookie = request.cookies.has('__session') || 
                        request.cookies.has('firebaseAuthToken');
  
  // Get user data from cookie for role checking
  const userDataCookie = request.cookies.get('userData')?.value;
  let userRole: string | null = null;
  
  if (userDataCookie) {
    try {
      const userData = JSON.parse(userDataCookie);
      userRole = userData.role || null;
    } catch {
      // Invalid cookie data
    }
  }

  // Check route types
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route));
  const isDriverRoute = driverRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if ((isProtectedRoute || isAdminRoute) && !hasAuthCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    url.searchParams.set('message', 'Please sign in to continue');
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (except admin login)
  if (isAuthRoute && hasAuthCookie && !pathname.includes('/admin')) {
    // Redirect to role-specific dashboard
    if (userRole === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    } else if (userRole === 'driver') {
      return NextResponse.redirect(new URL('/driver/dashboard', request.url));
    } else if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
