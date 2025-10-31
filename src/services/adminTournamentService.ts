export interface TournamentListItem {
  id: number;
  name: string;
  organizer: string;
  createdAt: string;
  anticipatedRoundCount?: number;
  matchCount: number;
  teamCount: number;
  hasHeroImage: boolean;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  serverGuid?: string;
  serverName?: string;
  discordUrl?: string;
  forumUrl?: string;
}

export interface TournamentTeam {
  id: number;
  name: string;
  createdAt: string;
  players: TeamPlayerResponse[];
}

export interface TournamentMatchMap {
  id: number;
  mapName: string;
  mapOrder: number;
  roundId?: string;
  teamId?: number;
  teamName?: string;
  round?: {
    roundId: string;
    serverGuid: string;
    serverName: string;
    mapName: string;
    startTime: string;
    endTime?: string;
    tickets1?: number;
    tickets2?: number;
    team1Label?: string;
    team2Label?: string;
  } | null;
}

export interface TournamentMatch {
  id: number;
  scheduledDate: string;
  team1Name: string;
  team2Name: string;
  serverGuid?: string;
  serverName?: string;
  createdAt: string;
  maps: TournamentMatchMap[];
}

export interface TournamentDetail {
  id: number;
  name: string;
  organizer: string;
  createdAt: string;
  anticipatedRoundCount?: number;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  heroImageBase64?: string;
  heroImageContentType?: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  serverGuid?: string;
  serverName?: string;
  discordUrl?: string;
  forumUrl?: string;
}

export interface CreateTournamentRequest {
  name: string;
  organizer: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  anticipatedRoundCount?: number;
  heroImageBase64?: string;
  heroImageContentType?: string;
  serverGuid?: string;
  discordUrl?: string;
  forumUrl?: string;
}

export interface UpdateTournamentRequest {
  name?: string;
  organizer?: string;
  game?: 'bf1942' | 'fh2' | 'bfvietnam';
  anticipatedRoundCount?: number;
  heroImageBase64?: string;
  heroImageContentType?: string;
  serverGuid?: string;
  discordUrl?: string;
  forumUrl?: string;
}

// Teams interfaces
export interface CreateTeamRequest {
  name: string;
}

export interface UpdateTeamRequest {
  name?: string;
}

export interface AddPlayerRequest {
  playerName: string;
}

export interface TeamPlayerResponse {
  playerName: string;
}

// Matches interfaces
export interface CreateMatchRequest {
  scheduledDate: string;
  team1Id: number;
  team2Id: number;
  mapNames: string[];
  serverGuid?: string;
  serverName?: string;
}

export interface UpdateMatchRequest {
  scheduledDate?: string;
  team1Id?: number;
  team2Id?: number;
  mapNames?: string[];
  serverGuid?: string;
  serverName?: string;
}

export interface UpdateMatchMapRequest {
  mapId: number;
  mapName?: string;
  roundId?: string | null;
  updateRoundId: boolean;
  teamId?: number;
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

  // Get tournament community logo URL (owned by current user only)
  getTournamentLogoUrl(id: number): string {
    return `${this.baseUrl}/${id}/logo`;
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

  // ===== Teams Management =====

  // Get team detail with players
  async getTeamDetail(tournamentId: number, teamId: number): Promise<TournamentTeam> {
    return this.request<TournamentTeam>(`/${tournamentId}/teams/${teamId}`);
  }

  // Create a new team
  async createTeam(tournamentId: number, request: CreateTeamRequest): Promise<TournamentTeam> {
    return this.request<TournamentTeam>(`/${tournamentId}/teams`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Update team
  async updateTeam(tournamentId: number, teamId: number, request: UpdateTeamRequest): Promise<TournamentTeam> {
    return this.request<TournamentTeam>(`/${tournamentId}/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // Delete team
  async deleteTeam(tournamentId: number, teamId: number): Promise<void> {
    await this.request(`/${tournamentId}/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  // Add player to team
  async addPlayerToTeam(tournamentId: number, teamId: number, request: AddPlayerRequest): Promise<TournamentTeam> {
    return this.request<TournamentTeam>(`/${tournamentId}/teams/${teamId}/players`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Remove player from team
  async removePlayerFromTeam(tournamentId: number, teamId: number, playerName: string): Promise<TournamentTeam> {
    return this.request<TournamentTeam>(`/${tournamentId}/teams/${teamId}/players/${encodeURIComponent(playerName)}`, {
      method: 'DELETE',
    });
  }

  // ===== Matches Management =====

  // Get match detail
  async getMatchDetail(tournamentId: number, matchId: number): Promise<TournamentMatch> {
    return this.request<TournamentMatch>(`/${tournamentId}/matches/${matchId}`);
  }

  // Create a new match
  async createMatch(tournamentId: number, request: CreateMatchRequest): Promise<TournamentMatch> {
    return this.request<TournamentMatch>(`/${tournamentId}/matches`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Update match (including linking to round via roundId)
  async updateMatch(tournamentId: number, matchId: number, request: UpdateMatchRequest): Promise<TournamentMatch> {
    return this.request<TournamentMatch>(`/${tournamentId}/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // Delete match
  async deleteMatch(tournamentId: number, matchId: number): Promise<void> {
    await this.request(`/${tournamentId}/matches/${matchId}`, {
      method: 'DELETE',
    });
  }

  // Update match map (link/unlink round to specific map)
  async updateMatchMap(tournamentId: number, matchId: number, mapId: number, request: UpdateMatchMapRequest): Promise<TournamentMatchMap> {
    return this.request<TournamentMatchMap>(`/${tournamentId}/matches/${matchId}/maps/${mapId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }
}

export const adminTournamentService = new AdminTournamentService();
