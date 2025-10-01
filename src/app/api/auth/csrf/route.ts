import { NextRequest, NextResponse } from 'next/server';
import { setCSRFToken } from '@/lib/csrf';

/**
 * @swagger
 * /api/auth/csrf:
 *   get:
 *     summary: Get CSRF token
 *     description: Generate and return a CSRF token for form protection
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: CSRF token
 *                   example: csrf-token-12345
 *         headers:
 *           Set-Cookie:
 *             description: CSRF token cookie
 *             schema:
 *               type: string
 *               example: csrf-token=csrf-token-12345; HttpOnly; Secure; SameSite=Lax
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
