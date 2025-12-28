import { ApiResponse, User, CreateUserInput, UpdateUserInput } from '../types';

const API_BASE = '/api';

// Token getter function - set by AuthContext
let getAuthToken: (() => Promise<string | null>) | null = null;

/**
 * Set the auth token getter function
 * Called by AuthContext to provide token access
 */
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter;
}

/**
 * Generic API request wrapper
 * Handles auth headers, error handling, and JSON parsing
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error' };
  }
}

/**
 * API request for file uploads (FormData)
 * Does not set Content-Type header (browser sets it with boundary)
 */
async function apiUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {};

    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    console.error('API upload failed:', error);
    return { error: 'Network error' };
  }
}

/**
 * Users API
 */
export const usersApi = {
  get: () => apiRequest<User>('/users'),
  create: (data: CreateUserInput) =>
    apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: UpdateUserInput) =>
    apiRequest<User>('/users', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// TODO: Add your application-specific API modules here
// Example:
// export const itemsApi = {
//   list: () => apiRequest<Item[]>('/items'),
//   get: (id: string) => apiRequest<Item>(`/items/${id}`),
//   create: (data: CreateItemInput) =>
//     apiRequest<Item>('/items', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     }),
//   update: (id: string, data: UpdateItemInput) =>
//     apiRequest<Item>(`/items/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(data),
//     }),
//   delete: (id: string) =>
//     apiRequest<void>(`/items/${id}`, {
//       method: 'DELETE',
//     }),
// };

// Export for file uploads if needed
export { apiUpload };
