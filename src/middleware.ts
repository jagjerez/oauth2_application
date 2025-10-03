import { NextRequest, NextResponse } from 'next/server';
import { validateTokenSimple } from './lib/jwt-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Check for active session (check both cookies and Authorization header)
  const cookieToken = request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  const accessToken = cookieToken || headerToken;
  const isAuthenticated = Boolean(accessToken && validateTokenSimple(accessToken));


  // If user is authenticated and trying to access login page, redirect to applications
  if (isAuthenticated && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/applications', request.url));
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Skip authentication checks for API routes
  if (pathname.startsWith('/api/')) {
    return response;
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/favicon.ico', '/_next', '/api'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original URL as a parameter for redirect after login
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only redirect if accessing root path
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/applications', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
