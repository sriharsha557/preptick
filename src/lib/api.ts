// API utility functions for making authenticated requests
// Handles base URL configuration for different environments

/**
 * Get the API base URL based on environment
 * In production, uses VITE_API_URL environment variable
 * In development, uses relative path (proxied by Vite)
 */
export function getApiBaseUrl(): string {
  // Check if we're in production and have a custom API URL
  if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In development or if no custom URL, use relative path (Vite proxy handles it)
  return '';
}

/**
 * Get the full API URL for a given path
 */
export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Refresh the Supabase token if needed
 */
async function refreshTokenIfNeeded(): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // Import supabase from supabaseClient (not supabase.ts to avoid circular deps)
    const { supabase } = await import('./supabaseClient');
    
    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error('Token refresh failed:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      return null;
    }
    
    // Update token in localStorage
    const newToken = data.session.access_token;
    localStorage.setItem('token', newToken);
    return newToken;
  } catch (err) {
    console.error('Error refreshing token:', err);
    return token; // Return existing token as fallback
  }
}

/**
 * Make an API request with the correct base URL and optional authentication
 * @deprecated Use the typed apiGet, apiPost, apiPut, apiDelete helpers instead
 */
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  let token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get a 401, try refreshing the token once
  if (response.status === 401 && token) {
    console.log('Got 401, attempting token refresh...');
    const newToken = await refreshTokenIfNeeded();
    
    if (newToken && newToken !== token) {
      // Retry with new token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

/**
 * Make a typed API request with automatic JSON parsing and error handling
 */
export async function apiRequestTyped<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiRequest(path, options);

  // Handle non-JSON responses (like 405 errors returning HTML)
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        'REQUEST_FAILED',
        `Request failed with status ${response.status}`
      );
    }
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const errorCode = data?.error?.code || 'REQUEST_FAILED';
    throw new ApiError(response.status, errorCode, errorMessage);
  }

  return data as T;
}

/**
 * GET request helper
 */
export async function apiGet<T>(path: string): Promise<T> {
  return apiRequestTyped<T>(path, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T, B = unknown>(path: string, body?: B): Promise<T> {
  return apiRequestTyped<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T, B = unknown>(path: string, body?: B): Promise<T> {
  return apiRequestTyped<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequestTyped<T>(path, { method: 'DELETE' });
}
