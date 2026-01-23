import { authService } from './authService';

export interface ApiClientOptions extends RequestInit {
  requiresAuth?: boolean;
  optionalAuth?: boolean; // Include auth header if available, but don't fail if not
}

class ApiClient {
  async request(url: string, options: ApiClientOptions = {}): Promise<Response> {
    const { requiresAuth = false, optionalAuth = false, ...fetchOptions } = options;

    // If authentication is required, ensure token is valid
    if (requiresAuth) {
      const isValid = await authService.ensureValidToken();
      if (!isValid) {
        throw new Error('Authentication required but token is invalid');
      }

      // Add auth header
      const token = localStorage.getItem('authToken');
      if (token) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${token}`,
        };
      }
    } else if (optionalAuth) {
      // Try to include auth header if token is available (but don't fail if not)
      const token = localStorage.getItem('authToken');
      if (token) {
        // Silently try to validate/refresh - if it fails, just proceed without auth
        try {
          const isValid = await authService.ensureValidToken();
          if (isValid) {
            const validToken = localStorage.getItem('authToken');
            if (validToken) {
              fetchOptions.headers = {
                ...fetchOptions.headers,
                'Authorization': `Bearer ${validToken}`,
              };
            }
          }
        } catch {
          // Ignore auth errors for optional auth
        }
      }
    }

    const response = await fetch(url, fetchOptions);

    // Handle 401 errors by attempting token refresh
    if (response.status === 401 && requiresAuth) {
      console.log('Received 401, attempting token refresh...');
      const refreshed = await authService.refreshToken();
      
      if (refreshed) {
        // Retry the request with new token
        const newToken = localStorage.getItem('authToken');
        if (newToken) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${newToken}`,
          };
          return fetch(url, fetchOptions);
        }
      } else {
        // Refresh failed, logout user
        await authService.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  }

  async get(url: string, options: ApiClientOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url: string, data?: any, options: ApiClientOptions = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return this.request(url, {
      ...options,
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(url: string, data?: any, options: ApiClientOptions = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return this.request(url, {
      ...options,
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(url: string, options: ApiClientOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();