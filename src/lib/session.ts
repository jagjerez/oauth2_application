import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import connectDB from './db';
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface ServerSession {
  user: SessionUser | null;
  isAuthenticated: boolean;
  error?: string;
}

/**
 * Get session data from server-side (middleware, API routes, etc.)
 * This function can be used in middleware and server components
 */
export async function getServerSession(): Promise<ServerSession> {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return {
        user: null,
        isAuthenticated: false,
      };
    }

    // Verify token
    const decoded = verifyToken(accessToken);
    if (!decoded) {
      return {
        user: null,
        isAuthenticated: false,
        error: 'Invalid token',
      };
    }

    // Connect to database
    await connectDB();

    // Get user data from database
    const user = await User.findById(decoded.sub)
      .populate('roles')
      .lean();

    if (!user) {
      return {
        user: null,
        isAuthenticated: false,
        error: 'User not found',
      };
    }

    // Get roles and permissions
    const roles = await Role.find({ _id: { $in: user.roles } }).lean();
    const permissions = await Permission.find({
      _id: { $in: roles.flatMap(role => role.permissions) }
    }).lean();

    const sessionUser: SessionUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: roles.map(role => role.name),
      permissions: permissions.map(permission => permission.name),
    };

    return {
      user: sessionUser,
      isAuthenticated: true,
    };

  } catch (error) {
    console.error('Server session error:', error);
    return {
      user: null,
      isAuthenticated: false,
      error: 'Session error',
    };
  }
}

/**
 * Get session data from request headers (for API routes)
 * This function can be used in API routes that receive Authorization header
 */
export async function getSessionFromRequest(request: NextRequest): Promise<ServerSession> {
  try {
    await connectDB();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        isAuthenticated: false,
        error: 'No authorization header',
      };
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        user: null,
        isAuthenticated: false,
        error: 'Invalid token',
      };
    }

    // Get user data from database
    const user = await User.findById(decoded.sub)
      .populate('roles')
      .lean();

    if (!user) {
      return {
        user: null,
        isAuthenticated: false,
        error: 'User not found',
      };
    }

    // Get roles and permissions
    const roles = await Role.find({ _id: { $in: user.roles } }).lean();
    const permissions = await Permission.find({
      _id: { $in: roles.flatMap(role => role.permissions) }
    }).lean();

    const sessionUser: SessionUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: roles.map(role => role.name),
      permissions: permissions.map(permission => permission.name),
    };

    return {
      user: sessionUser,
      isAuthenticated: true,
    };

  } catch (error) {
    console.error('Request session error:', error);
    return {
      user: null,
      isAuthenticated: false,
      error: 'Session error',
    };
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has specific role
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}
