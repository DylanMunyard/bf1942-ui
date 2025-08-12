interface Player {
  name: string;
  firstSeen: string;
  lastSeen: string;
  totalPlayTimeMinutes: number;
  aiBot: boolean;
  isOnline: boolean;
  lastSeenIso: string;
  currentServer: string;
  currentSessionScore?: number;
  currentSessionKills?: number;
  currentSessionDeaths?: number;
}

interface UserProfile {
  id: number;
  playerName: string;
  createdAt: string;
  player: Player;
}

interface FavoriteServer {
  id: number;
  serverGuid: string;
  serverName: string;
  createdAt: string;
}

interface Buddy {
  id: number;
  buddyPlayerName: string;
  createdAt: string;
  player: Player;
}

interface DashboardProfile {
  id: number;
  email: string;
  createdAt: string;
  lastLoggedIn: string;
  isActive: boolean;
  playerNames: UserProfile[];
  favoriteServers: FavoriteServer[];
  buddies: Buddy[];
}

class StatsService {
  private baseUrl = '/stats';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { authService } = await import('./authService');
    
    // Ensure we have a valid token
    const isValid = await authService.ensureValidToken();
    if (!isValid) {
      throw new Error('Authentication required but token is invalid');
    }
    
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // Handle 401 errors by attempting token refresh
    if (response.status === 401) {
      console.log('Received 401 in statsService, attempting token refresh...');
      const refreshed = await authService.refreshToken();
      
      if (refreshed) {
        // Retry the request with new token
        const newToken = localStorage.getItem('authToken');
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(newToken && { 'Authorization': `Bearer ${newToken}` }),
            ...options.headers,
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        
        // Handle empty responses for retry
        const retryContentType = retryResponse.headers.get('content-type');
        const retryHasJsonContent = retryContentType && retryContentType.includes('application/json');
        
        if (!retryHasJsonContent || retryResponse.status === 204) {
          return {} as T;
        }
        
        return retryResponse.json();
      } else {
        // Refresh failed, logout user
        await authService.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle empty responses (e.g., DELETE operations)
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');
    
    if (!hasJsonContent || response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async getUserProfile(): Promise<DashboardProfile> {
    return this.request<DashboardProfile>('/auth/profile');
  }

  async addPlayerName(playerName: string): Promise<void> {
    await this.request('/auth/player-names', {
      method: 'POST',
      body: JSON.stringify({ playerName: playerName }),
    });
  }

  async removePlayerName(id: number): Promise<void> {
    await this.request(`/auth/player-names/${id}`, {
      method: 'DELETE',
    });
  }

  async addFavoriteServer(serverGuid: string): Promise<void> {
    await this.request('/auth/favorite-servers', {
      method: 'POST',
      body: JSON.stringify({ serverGuid: serverGuid }),
    });
  }

  async removeFavoriteServer(id: number): Promise<void> {
    await this.request(`/auth/favorite-servers/${id}`, {
      method: 'DELETE',
    });
  }

  async addBuddy(buddyPlayerName: string): Promise<void> {
    await this.request('/auth/buddies', {
      method: 'POST',
      body: JSON.stringify({ buddyPlayerName: buddyPlayerName }),
    });
  }

  async removeBuddy(id: number): Promise<void> {
    await this.request(`/auth/buddies/${id}`, {
      method: 'DELETE',
    });
  }
}

export const statsService = new StatsService();