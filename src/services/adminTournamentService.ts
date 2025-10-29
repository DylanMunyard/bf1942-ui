export interface TournamentListItem {
  id: number;
  name: string;
  organizer: string;
  createdAt: string;
  anticipatedRoundCount?: number;
  roundCount: number;
  hasHeroImage: boolean;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  serverGuid?: string;
  serverName?: string;
}

export interface TournamentRound {
  roundId: string;
  serverGuid: string;
  serverName: string;
  mapName: string;
  startTime: string;
  endTime: string;
  winningTeam?: string;
  winningPlayers?: string[];
  tickets1: number;
  tickets2: number;
  team1Label: string;
  team2Label: string;
}

export interface TournamentDetail {
  id: number;
  name: string;
  organizer: string;
  createdAt: string;
  anticipatedRoundCount?: number;
  rounds: TournamentRound[];
  overallWinner?: {
    team: string;
    players: string[];
  };
  heroImageBase64?: string;
  heroImageContentType?: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  serverGuid?: string;
  serverName?: string;
}

export interface CreateTournamentRequest {
  name: string;
  organizer: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  anticipatedRoundCount?: number;
  roundIds?: string[];
  heroImageBase64?: string;
  heroImageContentType?: string;
  serverGuid?: string;
}

export interface UpdateTournamentRequest {
  name?: string;
  organizer?: string;
  game?: 'bf1942' | 'fh2' | 'bfvietnam';
  anticipatedRoundCount?: number;
  roundIds?: string[];
  heroImageBase64?: string;
  heroImageContentType?: string;
  serverGuid?: string;
}

export interface AddRoundRequest {
  roundId: string;
}

class AdminTournamentService {
  private baseUrl = '/stats/admin/tournaments';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { authService } = await import('./authService');

    // Ensure we have a valid token
    const isValid = await authService.ensureValidToken();
    if (!isValid) {
      throw new Error('Authentication required but token is invalid');
    }

    const token = localStorage.getItem('authToken');

    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 errors by attempting token refresh
    if (response.status === 401) {
      console.log('Received 401 in adminTournamentService, attempting token refresh...');
      const refreshed = await authService.refreshToken();

      if (refreshed) {
        // Retry the request with new token
        const newToken = localStorage.getItem('authToken');
        headers['Authorization'] = `Bearer ${newToken}`;

        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
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
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses (e.g., DELETE operations)
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    if (!hasJsonContent || response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Get all tournaments created by current user
  async getAllTournaments(): Promise<TournamentListItem[]> {
    return this.request<TournamentListItem[]>('');
  }

  // Get tournament details (owned by current user only)
  async getTournamentDetail(id: number): Promise<TournamentDetail> {
    return this.request<TournamentDetail>(`/${id}`);
  }

  // Get tournament hero image URL (owned by current user only)
  getTournamentImageUrl(id: number): string {
    return `${this.baseUrl}/${id}/image`;
  }

  // Create tournament
  async createTournament(request: CreateTournamentRequest): Promise<TournamentDetail> {
    return this.request<TournamentDetail>('', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Update tournament (owned by current user only)
  async updateTournament(id: number, request: UpdateTournamentRequest): Promise<TournamentDetail> {
    return this.request<TournamentDetail>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // Delete tournament (owned by current user only)
  async deleteTournament(id: number): Promise<void> {
    await this.request(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Add round to tournament (owned by current user only)
  async addRoundToTournament(id: number, request: AddRoundRequest): Promise<TournamentDetail> {
    return this.request<TournamentDetail>(`/${id}/rounds`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Remove round from tournament (owned by current user only)
  async removeRoundFromTournament(id: number, roundId: string): Promise<void> {
    await this.request(`/${id}/rounds/${roundId}`, {
      method: 'DELETE',
    });
  }

  // Helper to convert image file to base64
  async imageToBase64(file: File): Promise<{ base64: string; contentType: string }> {
    return new Promise((resolve, reject) => {
      // Check file size (4MB limit)
      if (file.size > 4 * 1024 * 1024) {
        reject(new Error('Image size must be less than 4MB'));
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        reject(new Error('Invalid image type. Allowed types: JPEG, PNG, GIF, WEBP'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64.split(',')[1];
        resolve({
          base64: base64Data,
          contentType: file.type,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}

export const adminTournamentService = new AdminTournamentService();
