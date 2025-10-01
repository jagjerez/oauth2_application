'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ConsentData {
  client: {
    name: string;
    description?: string;
  };
  scopes: string[];
  redirectUri: string;
  state?: string;
  nonce?: string;
}

export default function ConsentPage() {
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchConsentData = async () => {
      try {
        const response = await fetch('/api/auth/consent', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConsentData(data);
        } else {
          setError('Failed to load consent data');
        }
      } catch (err) {
        setError('An error occurred while loading consent data');
      } finally {
        setLoading(false);
      }
    };

    fetchConsentData();
  }, []);

  const handleConsent = async (accepted: boolean) => {
    try {
      const response = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirectUri) {
          window.location.href = data.redirectUri;
        } else {
          router.push('/');
        }
      } else {
        setError('Failed to process consent');
      }
    } catch (err) {
      setError('An error occurred while processing consent');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consent information...</p>
        </div>
      </div>
    );
  }

  if (error || !consentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error || 'Failed to load consent data'}</div>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const scopeDescriptions: Record<string, string> = {
    openid: 'Access your basic profile information',
    profile: 'Access your name and profile details',
    email: 'Access your email address',
    roles: 'Access your role information',
    permissions: 'Access your permission information',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authorize Application
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {consentData.client.name} wants to access your account
          </p>
          {consentData.client.description && (
            <p className="mt-1 text-center text-sm text-gray-500">
              {consentData.client.description}
            </p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            This application will be able to:
          </h3>
          <ul className="space-y-2">
            {consentData.scopes.map((scope) => (
              <li key={scope} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{scope}</p>
                  <p className="text-sm text-gray-500">
                    {scopeDescriptions[scope] || 'Access to this resource'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => handleConsent(false)}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Deny
          </button>
          <button
            onClick={() => handleConsent(true)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            Allow
          </button>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Redirect URI: {consentData.redirectUri}</p>
        </div>
      </div>
    </div>
  );
}
