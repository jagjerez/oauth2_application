import { NextRequest, NextResponse } from 'next/server';
import { setCSRFToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const token = await setCSRFToken();
    const response = NextResponse.json({ token });
    
    // Set the CSRF token cookie in the response
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}
