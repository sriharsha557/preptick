// API utility functions

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
 * Make an API request with the correct base URL
 */
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  return fetch(url, options);
}
