import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyToken } from '@/lib/auth';

/**
 * @swagger
 * /api/auth/session:
 *   get:
 *     summary: Get current user session
 *     description: Returns the current authenticated user's session data including roles, permissions, and app metadata
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SessionData'
 *                 - type: object
 *                   properties:
 *                     appMetadata:
 *                       type: object
 *                       description: Custom user metadata from JWT token
 *                       additionalProperties: true
 *                       example:
 *                         department: "Engineering"
 *                         level: "Senior"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
