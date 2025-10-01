'use client';

import { useState, useEffect } from 'react';
import AdminNavigation from '@/components/AdminNavigation';

interface Client {
  _id: string;
  clientId: string;
  name: string;
  description?: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  scopes: string[];
  isConfidential: boolean;
  isActive: boolean;
  tokenEndpointAuthMethod: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    redirectUris: [''],
    grantTypes: ['authorization_code'],
    responseTypes: ['code'],
    scopes: [''],
    isConfidential: true,
    isActive: true,
    tokenEndpointAuthMethod: 'client_secret_basic',
  });

  const grantTypeOptions = [
    'authorization_code',
    'client_credentials',
    'refresh_token'
  ];

  const responseTypeOptions = [
    'code',
    'id_token',
    'token'
  ];

  const authMethodOptions = [
    'client_secret_basic',
    'client_secret_post',
    'none'
  ];

  useEffect(() => {
    fetchClients();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingClient ? `/api/admin/clients/${editingClient._id}` : '/api/admin/clients';
      const method = editingClient ? 'PUT' : 'POST';
      
      // Clean up empty strings from arrays
      const cleanedData = {
        ...formData,
        redirectUris: formData.redirectUris.filter(uri => uri.trim() !== ''),
        scopes: formData.scopes.filter(scope => scope.trim() !== ''),
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingClient ? { id: editingClient._id, ...cleanedData } : cleanedData),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchClients();
        setShowModal(false);
        setEditingClient(null);
        setFormData({
          name: '',
          description: '',
          redirectUris: [''],
          grantTypes: ['authorization_code'],
          responseTypes: ['code'],
          scopes: [''],
          isConfidential: true,
          isActive: true,
          tokenEndpointAuthMethod: 'client_secret_basic',
        });
        
        // Show client secret if it's a new client
        if (!editingClient && result.client?.clientSecret) {
          setShowSecret(result.client.clientSecret);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Error saving client');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      description: client.description || '',
      redirectUris: client.redirectUris.length > 0 ? client.redirectUris : [''],
      grantTypes: client.grantTypes,
      responseTypes: client.responseTypes,
      scopes: client.scopes.length > 0 ? client.scopes : [''],
      isConfidential: client.isConfidential,
      isActive: client.isActive,
      tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
    });
    setShowModal(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchClients();
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client');
    }
  };

  const handleRegenerateSecret = async (clientId: string) => {
    if (!confirm('Are you sure you want to regenerate the client secret? The old secret will no longer work.')) return;

    try {
      const response = await fetch(`/api/admin/clients/${clientId}/regenerate-secret`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setShowSecret(result.client.clientSecret);
        await fetchClients();
      } else {
        const error = await response.json();
        alert(error.error || 'Error regenerating client secret');
      }
    } catch (error) {
      console.error('Error regenerating client secret:', error);
      alert('Error regenerating client secret');
    }
  };

  const addArrayItem = (field: 'redirectUris' | 'scopes') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'redirectUris' | 'scopes', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: 'redirectUris' | 'scopes', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Clients Management</h1>
            <button
              onClick={() => {
                setEditingClient(null);
                setFormData({
                  name: '',
                  description: '',
                  redirectUris: [''],
                  grantTypes: ['authorization_code'],
                  responseTypes: ['code'],
                  scopes: [''],
                  isConfidential: true,
                  isActive: true,
                  tokenEndpointAuthMethod: 'client_secret_basic',
                });
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create Client
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {clients.map((client) => (
                <li key={client._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {client.name}
                        </h3>
                        <div className="ml-2 flex space-x-1">
                          {client.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                          {client.isConfidential && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Confidential
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{client.description}</p>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <strong>Client ID:</strong> {client.clientId}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {client.grantTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRegenerateSecret(client._id)}
                        className="text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                      >
                        Regenerate Secret
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Secret Modal */}
      {showSecret && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Client Secret
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Important:</strong> Save this secret securely. It will not be shown again.
                </p>
                <div className="bg-gray-100 p-3 rounded-md">
                  <code className="text-sm break-all">{showSecret}</code>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSecret(null)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingClient ? 'Edit Client' : 'Create Client'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redirect URIs
                  </label>
                  {formData.redirectUris.map((uri, index) => (
                    <div key={`redirect-${index}-${uri}`} className="flex mb-2">
                      <input
                        type="url"
                        value={uri}
                        onChange={(e) => updateArrayItem('redirectUris', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/callback"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('redirectUris', index)}
                        className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('redirectUris')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add URI
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grant Types
                    </label>
                    <div className="space-y-2">
                      {grantTypeOptions.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.grantTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  grantTypes: [...prev.grantTypes, type]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  grantTypes: prev.grantTypes.filter(t => t !== type)
                                }));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Types
                    </label>
                    <div className="space-y-2">
                      {responseTypeOptions.map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.responseTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  responseTypes: [...prev.responseTypes, type]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  responseTypes: prev.responseTypes.filter(t => t !== type)
                                }));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scopes
                  </label>
                  {formData.scopes.map((scope, index) => (
                    <div key={`scope-${index}-${scope}`} className="flex mb-2">
                      <input
                        type="text"
                        value={scope}
                        onChange={(e) => updateArrayItem('scopes', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="read write admin"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('scopes', index)}
                        className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('scopes')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Scope
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auth Method
                    </label>
                    <select
                      value={formData.tokenEndpointAuthMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenEndpointAuthMethod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {authMethodOptions.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isConfidential}
                        onChange={(e) => setFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Confidential</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
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
                    {editingClient ? 'Update' : 'Create'}
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
