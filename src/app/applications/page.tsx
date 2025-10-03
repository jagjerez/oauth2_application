'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useSession, useRequireAuth } from '@/hooks/useAuth';

interface Application {
  clientId: string;
  name: string;
  description: string;
  logo: string;
  redirectUris: string[];
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get session data
  const { user, isLoading: authLoading, error: authError } = useSession();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Only fetch applications if user is authenticated
    if (authLoading || !user) {
      return;
    }

    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/applications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setApplications(data.applications);
        } else if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
        } else {
          setError('Failed to load applications');
        }
      } catch (err) {
        setError('An error occurred while loading applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [router, user, authLoading]);

  const handleApplicationClick = (application: Application) => {
    const redirectUri = application.redirectUris[0]; // Use first redirect URI
    if (redirectUri) {
      // For admin panel, redirect directly
      if (application.clientId === 'admin-panel') {
        window.location.href = '/admin';
        return;
      }
      
      // For other applications, redirect to their URL
      window.location.href = redirectUri;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Verifying authentication...' : 'Loading applications...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Select an Application
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Choose the application you want to access
          </p>
          {user && (
            <div className="mt-4 text-sm text-gray-500">
              Welcome, {user.firstName} {user.lastName} ({user.username})
            </div>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Available</h3>
            <p className="text-gray-600">There are no applications available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {applications.map((application) => (
              <div
                key={application.clientId}
                onClick={() => handleApplicationClick(application)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer transform hover:scale-105 transition-transform duration-200"
              >
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="mx-auto h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {application.logo && application.logo !== '/default-app-logo.svg' ? (
                        <Image
                          src={application.logo}
                          alt={`${application.name} logo`}
                          width={64}
                          height={64}
                          className="rounded-lg"
                          onError={(e) => {
                            // Fallback to default icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {application.name}
                  </h3>
                  {application.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {application.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <button
            onClick={async () => {
              // Clear tokens and redirect to login
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              document.cookie = 'access_token=; path=/; max-age=0';
              document.cookie = 'refresh_token=; path=/; max-age=0';
              router.push('/login');
            }}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Logout
          </button>
        </div>
      </div>
    </div>
  );
}
