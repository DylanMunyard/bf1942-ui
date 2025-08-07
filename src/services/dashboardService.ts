import { apiClient } from './apiClient';
import { DashboardResponse } from '../types/dashboardTypes';

/**
 * Fetches the authenticated user's dashboard data including online buddies and favorite servers
 * 
 * @returns Promise<DashboardResponse> Dashboard data with buddies and favorite servers
 */
export async function fetchDashboardData(): Promise<DashboardResponse> {
  try {
    const response = await apiClient.request('/stats/auth/dashboard', {
      method: 'GET',
      requiresAuth: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as DashboardResponse;
    
    return data;
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    throw new Error('Failed to get dashboard data');
  }
}

// Re-export types for convenience
export type { OnlineBuddy, FavoriteServer, DashboardResponse, OfflineBuddy } from '../types/dashboardTypes';