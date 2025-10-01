'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  appMetadata?: Record<string, unknown>;
  createdAt: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface Client {
  _id: string;
  clientId: string;
  name: string;
  description?: string;
  redirectUris: string[];
  grantTypes: string[];
  scopes: string[];
  isActive: boolean;
}

interface SessionData {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [usersRes, rolesRes, permissionsRes, clientsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/roles', { headers }),
        fetch('/api/admin/permissions', { headers }),
        fetch('/api/admin/clients', { headers }),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        // Remove duplicates based on _id
        const uniqueUsers = usersData.filter((user: User, index: number, self: User[]) => 
          index === self.findIndex(u => u._id === user._id)
        );
        setUsers(uniqueUsers);
      }
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        // Remove duplicates based on _id
        const uniqueRoles = rolesData.filter((role: Role, index: number, self: Role[]) => 
          index === self.findIndex(r => r._id === role._id)
        );
        setRoles(uniqueRoles);
      }
      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        // Remove duplicates based on _id
        const uniquePermissions = permissionsData.filter((permission: Permission, index: number, self: Permission[]) => 
          index === self.findIndex(p => p._id === permission._id)
        );
        setPermissions(uniquePermissions);
      }
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        // Remove duplicates based on _id
        const uniqueClients = clientsData.filter((client: Client, index: number, self: Client[]) => 
          index === self.findIndex(c => c._id === client._id)
        );
        setClients(uniqueClients);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthAndFetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/auth/session', { headers });
      
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
        
        // Check if user has admin role or write permissions
        const isAdmin = sessionData.roles.includes('administrator') || sessionData.roles.includes('admin');
        const hasWritePermission = sessionData.permissions.includes('admin:write');
        
        // Set read-only mode if user doesn't have admin role or write permissions
        setIsReadOnly(!isAdmin && !hasWritePermission);
        
        // Fetch data after authentication check
        fetchData();
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login?returnTo=/admin';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/login?returnTo=/admin';
    }
  }, [fetchData]);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Read-only mode indicator */}
          {isReadOnly && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Read-Only Mode
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You are viewing this page in read-only mode. You can view data but cannot make changes.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Overview of your OAuth2 application management system</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Active: {users.filter(u => u.isActive).length}</span>
                    <span className="text-red-600">Inactive: {users.filter(u => !u.isActive).length}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Users
                  </button>
                </div>
              </div>
            </div>

            {/* Roles Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Roles</dt>
                      <dd className="text-lg font-medium text-gray-900">{roles.length}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">System: {roles.filter(r => r.isSystem).length}</span>
                    <span className="text-gray-600">Custom: {roles.filter(r => !r.isSystem).length}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/admin/roles')}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Roles
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Permissions</dt>
                      <dd className="text-lg font-medium text-gray-900">{permissions.length}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">
                    <span>Resources: {new Set(permissions.map(p => p.resource)).size}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/admin/permissions')}
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Permissions
                  </button>
                </div>
              </div>
            </div>

            {/* Clients Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">OAuth2 Clients</dt>
                      <dd className="text-lg font-medium text-gray-900">{clients.length}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Active: {clients.filter(c => c.isActive).length}</span>
                    <span className="text-red-600">Inactive: {clients.filter(c => !c.isActive).length}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/admin/clients')}
                    className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Clients
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {!isReadOnly && (
                  <>
                    <button
                      onClick={() => router.push('/admin/users/new')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add User
                    </button>
                    <button
                      onClick={() => router.push('/admin/roles')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Role
                    </button>
                    <button
                      onClick={() => router.push('/admin/permissions')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Permission
                    </button>
                    <button
                      onClick={() => router.push('/admin/clients')}
                      className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Client
                    </button>
                  </>
                )}
                <button
                  onClick={() => router.push('/admin/settings')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={() => router.push('/api-docs')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  API Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}