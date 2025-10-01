import { NextRequest, NextResponse } from 'next/server';

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

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Skip authentication checks for API routes
  if (pathname.startsWith('/api/')) {
    return response;
  }

  // Handle admin panel access with OAuth flow
  if (pathname.startsWith('/admin') && pathname !== '/admin/settings') {
    // Check if user is already authenticated via cookies
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      // Redirect to login with admin client parameters
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('client_id', 'admin-panel');
      loginUrl.searchParams.set('redirect_uri', request.url);
      loginUrl.searchParams.set('response_type', 'code');
      loginUrl.searchParams.set('scope', 'openid profile email admin');
      
      return NextResponse.redirect(loginUrl);
    }
  }

  // For now, let the pages handle their own authentication
  // This is a temporary solution while we debug the session issue
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
