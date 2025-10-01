import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { withCSRFProtection } from '@/lib/csrf';

async function handleLogin(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user by username or email
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
    const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
    const permissions = await Permission.find({
      _id: { $in: roles.flatMap(role => role.permissions) }
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

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
    const response = NextResponse.json({ 
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
    });

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
