import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import Client from '@/models/Client';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { withCSRFProtection } from '@/lib/csrf';

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
    const responseData: any = { 
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
