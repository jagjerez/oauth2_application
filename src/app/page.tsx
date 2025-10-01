'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionData {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
        
        // Check if user has admin role or permission
        const isAdmin = sessionData.roles.includes('administrator') || sessionData.roles.includes('admin');
        const hasAdminPermission = sessionData.permissions.includes('admin:read') || sessionData.permissions.includes('admin:write');
        
        if (isAdmin || hasAdminPermission) {
          router.push('/admin');
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}