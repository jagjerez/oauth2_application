import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
  
  return token;
}

export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null;
}

export async function verifyCSRFToken(request: NextRequest): Promise<boolean> {
  const cookieToken = await getCSRFToken();
  const headerToken = request.headers.get(CSRF_HEADER);
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  return cookieToken === headerToken;
}

export function withCSRFProtection(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for GET requests and API routes that don't need it
    if (request.method === 'GET') {
      return handler(request);
    }
    
    // Skip CSRF for OIDC endpoints (they have their own security)
    if (request.url.includes('/api/oidc/')) {
      return handler(request);
    }
    
    // For development, skip CSRF validation
    if (process.env.NODE_ENV === 'development') {
      return handler(request);
    }
    
    // In production, validate CSRF token
    const isValidCSRF = await verifyCSRFToken(request);
    if (!isValidCSRF) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
    
    return handler(request);
  };
}
