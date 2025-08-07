import { apiClient } from './apiClient';
import { DashboardResponse, OfflineBuddy } from '../types/dashboardTypes';

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
    
    // Add mock offline buddies for demonstration (until API provides this data)
    const mockOfflineBuddies: OfflineBuddy[] = [
      {
        playerName: "SniperWolf",
        lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        lastSeenServer: "Berlin Outskirts 24/7"
      },
      {
        playerName: "TankCommander",
        lastSeenAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        lastSeenServer: "El Alamein Classic"
      },
      {
        playerName: "AirAce",
        lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        lastSeenServer: "Battle of Britain"
      }
    ];
    
    return {
      ...data,
      offlineBuddies: mockOfflineBuddies
    } as DashboardResponse & { offlineBuddies: OfflineBuddy[] };
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    throw new Error('Failed to get dashboard data');
  }
}

// Re-export types for convenience
export type { OnlineBuddy, FavoriteServer, DashboardResponse, OfflineBuddy } from '../types/dashboardTypes';