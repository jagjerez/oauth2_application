'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';

interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  clientId?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  _id: string;
  clientId: string;
  name: string;
}

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchClients();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        // Remove duplicates based on _id
        const uniqueRoles = data.filter((role: Role, index: number, self: Role[]) => 
          index === self.findIndex(r => r._id === role._id)
        );
        setRoles(uniqueRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        // Remove duplicates based on _id
        const uniquePermissions = data.filter((permission: Permission, index: number, self: Permission[]) => 
          index === self.findIndex(p => p._id === permission._id)
        );
        setPermissions(uniquePermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        // Remove duplicates based on _id
        const uniqueClients = data.filter((client: Client, index: number, self: Client[]) => 
          index === self.findIndex(c => c._id === client._id)
        );
        setClients(uniqueClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole._id}` : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const requestData = editingRole ? { id: editingRole._id, ...formData } : formData;
      
      // Convert empty clientId to null
      if (requestData.clientId === '') {
        requestData.clientId = null;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        await fetchRoles();
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', clientId: '', permissions: [] });
      } else {
        const error = await response.json();
        alert(error.error || 'Error saving role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role');
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      clientId: role.clientId || '',
      permissions: role.permissions.map(p => p._id),
    });
    setShowModal(true);
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRoles();
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error deleting role');
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
            <button
              onClick={() => {
                setEditingRole(null);
                setFormData({ name: '', description: '', clientId: '', permissions: [] });
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create Role
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {roles.map((role) => (
                <li key={role._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {role.name}
                          {role.isSystem && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              System
                            </span>
                          )}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                      {role.clientId && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Client: {role.clientId}
                          </span>
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">
                          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <span
                              key={permission._id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {permission.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDelete(role._id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client (Optional)
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No client (Global role)</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client.clientId}>
                        {client.name} ({client.clientId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {permissions.map((permission) => (
                      <label key={permission._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission._id)}
                          onChange={(e) => handlePermissionChange(permission._id, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {permission.name} - {permission.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    {editingRole ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
