'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'clients'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setSession] = useState<SessionData | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const router = useRouter();


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/admin/${activeTab}`, { headers });
      if (response.ok) {
        const data = await response.json();
        switch (activeTab) {
          case 'users':
            setUsers(data);
            break;
          case 'roles':
            setRoles(data);
            break;
          case 'permissions':
            setPermissions(data);
            break;
          case 'clients':
            setClients(data);
            break;
        }
      } else {
        setError('Failed to fetch data');
      }
    } catch {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const checkAuthAndFetchData = async () => {
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
  };

  useEffect(() => {
    checkAuthAndFetchData();
  }, [activeTab, fetchData]);

  

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/${type}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        setError('Failed to delete item');
      }
    } catch {
      setError('An error occurred while deleting item');
    }
  };

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users</h2>
        {!isReadOnly && (
          <button
            onClick={() => router.push('/admin/users/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add User
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.appMetadata && Object.keys(user.appMetadata).length > 0 ? (
                    <div className="max-w-xs">
                      <div className="text-xs text-gray-600 mb-1">
                        {Object.keys(user.appMetadata).length} metadata field(s)
                      </div>
                      <div className="space-y-1">
                        {Object.entries(user.appMetadata).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="font-medium text-gray-700">{key}:</span> {String(value)}
                          </div>
                        ))}
                        {Object.keys(user.appMetadata).length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{Object.keys(user.appMetadata).length - 2} more...
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No metadata</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => router.push(`/admin/users/${user._id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id, 'users')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {isReadOnly && (
                    <span className="text-gray-400 text-sm">Read Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoles = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Roles</h2>
        {!isReadOnly && (
          <button
            onClick={() => router.push('/admin/roles/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Role
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    role.isSystem ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {role.isSystem ? 'System' : 'Custom'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => router.push(`/admin/roles/${role._id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDelete(role._id, 'roles')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                  {isReadOnly && (
                    <span className="text-gray-400 text-sm">Read Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Permissions</h2>
        {!isReadOnly && (
          <button
            onClick={() => router.push('/admin/permissions/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Permission
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {permissions.map((permission) => (
              <tr key={permission._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permission.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permission.resource}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permission.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => router.push(`/admin/permissions/${permission._id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(permission._id, 'permissions')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {isReadOnly && (
                    <span className="text-gray-400 text-sm">Read Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Clients</h2>
        {!isReadOnly && (
          <button
            onClick={() => router.push('/admin/clients/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Client
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grant Types</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.clientId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.grantTypes.join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => router.push(`/admin/clients/${client._id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client._id, 'clients')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {isReadOnly && (
                    <span className="text-gray-400 text-sm">Read Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
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

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'users', name: 'Users' },
                { id: 'roles', name: 'Roles' },
                { id: 'permissions', name: 'Permissions' },
                { id: 'clients', name: 'Clients' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'users' | 'roles' | 'permissions' | 'clients')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'roles' && renderRoles()}
                {activeTab === 'permissions' && renderPermissions()}
                {activeTab === 'clients' && renderClients()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
