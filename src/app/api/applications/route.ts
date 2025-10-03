import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import Role from '@/models/Role';

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get available applications for user
 *     description: Retrieve list of OAuth2 applications that the user can access
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       clientId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       logo:
 *                         type: string
 *                       redirectUris:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         description: Unauthorized
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

async function getApplications(request: NextRequest) {
  try {
    await connectDB();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's roles to determine which applications they can access
    const user = await User.findById(decoded.sub).populate('roles');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get roles with clientId information
    const roles = await Role.find({ _id: { $in: user.roles } }).lean();
    
    // Get client IDs from user's roles
    const clientIds = roles
      .map((role: { clientId?: string }) => role.clientId)
      .filter((clientId: string | undefined): clientId is string => Boolean(clientId)); // Filter out null/undefined values

    // If user has no specific client roles, they can access all applications
    // Otherwise, filter by their role's client IDs
    const query = clientIds.length > 0 
      ? { isActive: true, clientId: { $in: clientIds } }
      : { isActive: true };

    const applications = await Client.find(query)
      .select('clientId name description logo redirectUris')
      .lean();

    const filteredApplications = applications.map(app => ({
      clientId: app.clientId,
      name: app.name,
      description: app.description || '',
      logo: app.logo || '/default-app-logo.svg', // Default logo if none provided
      redirectUris: app.redirectUris
    }));

    return NextResponse.json({ applications: filteredApplications });

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = getApplications;
