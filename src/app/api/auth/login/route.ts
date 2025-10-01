import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import Client from '@/models/Client';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { withCSRFProtection } from '@/lib/csrf';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with username/email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username or email
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: password123
 *               clientId:
 *                 type: string
 *                 description: OAuth2 client ID (optional)
 *                 example: my-app-client
 *               redirectUri:
 *                 type: string
 *                 description: OAuth2 redirect URI (optional)
 *                 example: http://localhost:3000/callback
 *               state:
 *                 type: string
 *                 description: OAuth2 state parameter (optional)
 *                 example: random-state-string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                 expiresIn:
 *                   type: number
 *                   description: Token expiration time in seconds
 *                   example: 3600
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
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

async function handleLogin(request: NextRequest) {
  try {
    await connectDB();

    const { username, password, clientId, redirectUri, state } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user by username or email
    // Ensure Role model is registered before populating
    const RoleModel = mongoose.models.Role || (await import('@/models/Role')).default;
    
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true,
    }).populate('roles');

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Get user roles and permissions
    // Ensure Permission model is registered before populating
    const PermissionModel = mongoose.models.Permission || (await import('@/models/Permission')).default;
    
    const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
    const permissions = await Permission.find({
      _id: { $in: roles.flatMap(role => role.permissions) }
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Validate client if provided
    let client = null;
    let authorizationCode = null;
    
    if (clientId) {
      client = await Client.findOne({ clientId, isActive: true });
      if (!client) {
        return NextResponse.json({ error: 'Invalid client' }, { status: 400 });
      }
      
      // Validate redirect URI
      if (redirectUri && !client.redirectUris.includes(redirectUri)) {
        return NextResponse.json({ error: 'Invalid redirect URI' }, { status: 400 });
      }
      
      // Generate authorization code for OAuth flow
      if (redirectUri) {
        authorizationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // In a real implementation, you would store this code with expiration
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      roles: roles.map(role => role.name),
      permissions: permissions.map(permission => permission.name),
      appMetadata: user.appMetadata,
    });

    const refreshToken = generateRefreshToken(user._id.toString());

    // Create response with tokens
    const responseData: Record<string, unknown> = { 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles.map(role => role.name),
        permissions: permissions.map(permission => permission.name),
      },
      accessToken,
      refreshToken
    };

    // Add OAuth-specific data if client is provided
    if (client && redirectUri) {
      responseData.redirectUri = redirectUri;
      if (authorizationCode) {
        responseData.code = authorizationCode;
      }
    }

    const response = NextResponse.json(responseData);

    // Set cookies using NextResponse methods
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withCSRFProtection(handleLogin);
