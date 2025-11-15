import { authService } from './authService';
import { logger } from './loggerService';

export interface ApiClientOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  async request(url: string, options: ApiClientOptions = {}): Promise<Response> {
    const { requiresAuth = false, ...fetchOptions } = options;

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
    }

    let response: Response;

    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      // Network error (no response received)
      logger.error('Network request failed', error as Error, {
        url,
        method: fetchOptions.method || 'GET',
        requiresAuth,
      });
      throw error;
    }

    // Handle 401 errors by attempting token refresh
    if (response.status === 401 && requiresAuth) {
      logger.info('Received 401, attempting token refresh', { url });
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
        logger.warn('Token refresh failed, logging out user', { url });
        await authService.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    // Log 4xx and 5xx errors
    if (response.status >= 400) {
      const logData = {
        url,
        method: fetchOptions.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        requiresAuth,
      };

      if (response.status >= 500) {
        logger.error('Server error response', undefined, logData);
      } else if (response.status >= 400 && response.status !== 401) {
        // 401 already handled above
        logger.warn('Client error response', logData);
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