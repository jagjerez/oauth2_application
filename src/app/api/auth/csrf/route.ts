import { NextRequest, NextResponse } from 'next/server';
import { setCSRFToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const token = await setCSRFToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}
