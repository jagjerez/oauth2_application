'use client';

import { useEffect, useState } from 'react';

// Declare global SwaggerUIBundle
declare global {
  interface Window {
    SwaggerUIBundle?: {
      (config: {
        url: string;
        dom_id: string;
        deepLinking: boolean;
        presets: unknown[];
        plugins: unknown[];
        layout: string;
        tryItOutEnabled: boolean;
        requestInterceptor: (request: unknown) => unknown;
      }): void;
      presets: {
        apis: unknown;
        standalone: unknown;
      };
      plugins: {
        DownloadUrl: unknown;
      };
    };
  }
}

export default function ApiDocsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Swagger UI dynamically
    const loadSwaggerUI = async () => {
      try {
        setLoading(true);
        setError('');

        // Check if Swagger UI is already loaded
        if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
          initializeSwaggerUI();
          return;
        }

        // Load Swagger UI CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css';
        link.onerror = () => {
          setError('Failed to load Swagger UI CSS');
          setLoading(false);
        };
        document.head.appendChild(link);

        // Load Swagger UI JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js';
        script.onload = () => {
          if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
            initializeSwaggerUI();
          } else {
            setError('SwaggerUIBundle not available after loading');
            setLoading(false);
          }
        };
        script.onerror = () => {
          setError('Failed to load Swagger UI JavaScript');
          setLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        setError('Error loading Swagger UI');
        setLoading(false);
      }
    };

    const initializeSwaggerUI = () => {
      try {
        if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
          window.SwaggerUIBundle({
          url: '/api/swagger',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIBundle.presets.standalone
          ],
          plugins: [
            window.SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          tryItOutEnabled: true,
          requestInterceptor: (request: unknown) => {
            // Add CORS headers if needed
            const req = request as { headers: Record<string, string> };
            req.headers = {
              ...req.headers,
              'Content-Type': 'application/json'
            };
            return req;
          }
        });
        setLoading(false);
        } else {
          setError('SwaggerUIBundle not available');
          setLoading(false);
        }
      } catch (err) {
        setError('Error initializing Swagger UI');
        setLoading(false);
      }
    };

    loadSwaggerUI();
  }, []);

  if (loading) {
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
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Swagger UI...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Swagger UI</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
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
      
      <div className="max-w-7xl mx-auto">
        <div id="swagger-ui" className="swagger-ui"></div>
      </div>
    </div>
  );
}
