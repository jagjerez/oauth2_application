import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { IUser } from '@/models/User';
import { IRole } from '@/models/Role';
import { IPermission } from '@/models/Permission';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  appMetadata?: Record<string, unknown>;
  iat?: number;
  exp?: number;
}

export interface SessionData {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  appMetadata?: Record<string, unknown>;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT token generation
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    algorithm: 'HS256'
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Session management
export async function createSession(user: IUser, roles: IRole[], permissions: IPermission[]): Promise<SessionData> {
  const sessionData: SessionData = {
    userId: (user._id as unknown as string).toString(),
    username: user.username,
    email: user.email,
    roles: roles.map(role => role.name),
    permissions: permissions.map(permission => permission.name),
    appMetadata: user.appMetadata,
  };

  // Set secure HTTP-only cookies
  const cookieStore = await cookies();
  const accessToken = generateAccessToken({
    sub: (user._id as unknown as string).toString(),
    username: user.username,
    email: user.email,
    roles: sessionData.roles,
    permissions: sessionData.permissions,
    appMetadata: user.appMetadata,
  });

  const refreshToken = generateRefreshToken((user._id as unknown as string).toString());

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return sessionData;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return null;
    }

    const payload = verifyToken(accessToken);
    if (!payload) {
      return null;
    }

    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      appMetadata: payload.appMetadata,
    };
  } catch (error) {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

// CSRF protection
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// User permissions check
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

export function hasAllRoles(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}

