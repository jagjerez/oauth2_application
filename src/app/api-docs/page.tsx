'use client';

import { useState, useEffect } from 'react';

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSwaggerSpec();
  }, []);

  const fetchSwaggerSpec = async () => {
    try {
      const response = await fetch('/api/swagger');
      if (response.ok) {
        const spec = await response.json();
        setSwaggerSpec(spec);
      } else {
        setError('Failed to load API documentation');
      }
    } catch (err) {
      setError('An error occurred while loading API documentation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Documentation</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchSwaggerSpec}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-indigo-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">OAuth2 Application API Documentation</h1>
          <p className="mt-2 text-indigo-200">
            Complete API reference for user management, authentication, and OAuth2 flows
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">API Endpoints</h2>
              
              {/* Authentication Endpoints */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Authentication</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          GET
                        </span>
                        <code className="text-sm font-mono text-gray-900">/api/auth/session</code>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Get current user session data including roles, permissions, and app metadata
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Authentication: Bearer Token or Cookie</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin - Users Endpoints */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Admin - Users</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          GET
                        </span>
                        <code className="text-sm font-mono text-gray-900">/api/admin/users</code>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Get all users with their roles and metadata
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Authentication: Bearer Token or Cookie | Permission: users:read</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          POST
                        </span>
                        <code className="text-sm font-mono text-gray-900">/api/admin/users</code>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Create a new user with roles and custom metadata
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Authentication: Bearer Token or Cookie | Permission: users:create</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Body:</strong> username, email, password, firstName, lastName, roles, appMetadata
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          GET
                        </span>
                        <code className="text-sm font-mono text-gray-900">/api/admin/users/{'{id}'}</code>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Get a specific user by ID
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Authentication: Bearer Token or Cookie | Permission: users:read</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                          PUT
                        </span>
                        <code className="text-sm font-mono text-gray-900">/api/admin/users/{'{id}'}</code>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Update a user's information including roles and metadata
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Authentication: Bearer Token or Cookie | Permission: users:update</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                          DELETE
                        </span>
                        <code className="text-sm font-mono text-gray-900">/api/admin/users/{'{id}'}</code>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Delete a user by ID
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Authentication: Bearer Token or Cookie | Permission: users:delete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OIDC Endpoints */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-800 mb-3">OIDC Endpoints</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          GET/POST
                        </span>
                        <code className="text-sm font-mono text-gray-900">/api/oidc/*</code>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      OpenID Connect endpoints for authentication flows
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Supports: authorization, token, userinfo, jwks, etc.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Models */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Data Models</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">User</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><code>_id</code> - User unique identifier</div>
                      <div><code>username</code> - Username</div>
                      <div><code>email</code> - User email address</div>
                      <div><code>firstName</code> - User first name</div>
                      <div><code>lastName</code> - User last name</div>
                      <div><code>isActive</code> - User active status</div>
                      <div><code>roles</code> - Array of user roles</div>
                      <div><code>appMetadata</code> - Custom metadata included in JWT tokens</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentication Info */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Authentication</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    This API supports two authentication methods:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• <strong>Bearer Token:</strong> Include <code>Authorization: Bearer {'{token}'}</code> header</li>
                    <li>• <strong>Cookie:</strong> Include session cookie in requests</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">
                    Get your access token by logging in through the OAuth2 flow or use the admin panel.
                  </p>
                </div>
              </div>

              {/* Try It Out */}
              <div className="mb-8">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Try It Out</h3>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm text-indigo-700 mb-2">
                    You can test the API endpoints using tools like:
                  </p>
                  <ul className="text-sm text-indigo-600 space-y-1 ml-4">
                    <li>• <strong>curl:</strong> Command line tool</li>
                    <li>• <strong>Postman:</strong> GUI API testing</li>
                    <li>• <strong>Insomnia:</strong> API client</li>
                    <li>• <strong>Browser:</strong> Direct API calls</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
