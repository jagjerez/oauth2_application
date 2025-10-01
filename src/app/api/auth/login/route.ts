import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import { verifyPassword, createSession } from '@/lib/auth';
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

    // Create session
    await createSession(user, roles, permissions);

    return NextResponse.json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles.map(role => role.name),
        permissions: permissions.map(permission => permission.name),
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withCSRFProtection(handleLogin);
