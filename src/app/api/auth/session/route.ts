import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Try to get session from cookies first
    let session = await getSession();
    
    // If no session from cookies, try to get token from Authorization header
    if (!session) {
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        
        if (payload) {
          session = {
            userId: payload.sub,
            username: payload.username,
            email: payload.email,
            roles: payload.roles,
            permissions: payload.permissions,
            appMetadata: payload.appMetadata,
          };
        }
      }
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
