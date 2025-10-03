'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

interface SessionData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useSession(): SessionData {
  const [sessionData, setSessionData] = useState<SessionData>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  useEffect(() => {
    const initializeSession = () => {
      try {
        setSessionData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          setSessionData({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
          return;
        }

        // Sync token to cookies for middleware
        document.cookie = `access_token=${token}; path=/; max-age=3600; samesite=lax`;

        // Decode token to get user data (simplified approach)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            document.cookie = 'access_token=; path=/; max-age=0';
            document.cookie = 'refresh_token=; path=/; max-age=0';
            setSessionData({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: 'Session expired',
            });
            return;
          }

          // Create user object from token payload
          const user = {
            id: payload.sub,
            username: payload.username,
            email: payload.email,
            firstName: payload.firstName || '',
            lastName: payload.lastName || '',
            roles: payload.roles || [],
            permissions: payload.permissions || [],
          };

          setSessionData({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          document.cookie = 'access_token=; path=/; max-age=0';
          document.cookie = 'refresh_token=; path=/; max-age=0';
          setSessionData({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: 'Invalid token',
          });
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        setSessionData({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Session error',
        });
      }
    };

    initializeSession();
  }, []);

  return sessionData;
}

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated, error } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return { user, isLoading, isAuthenticated, error };
}

// Legacy hook for backward compatibility
export function useAuth(): SessionData {
  return useSession();
}
