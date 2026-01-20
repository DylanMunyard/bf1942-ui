import { apiClient } from './apiClient';

// Player name linking
export interface LinkedPlayerName {
  id: number;
  playerName: string;
}

// Request DTOs
export interface CreateTeamRequest {
  teamName: string;
  tag?: string;
  playerName: string;
  rulesAcknowledged: boolean;
}

export interface JoinTeamRequest {
  playerName: string;
  rulesAcknowledged: boolean;
}

export interface UpdateTeamRequest {
  teamName: string;
  tag?: string;
}

export interface AddPlayerRequest {
  playerName: string;
}

// Response DTOs
export interface CreateTeamResponse {
  teamId: number;
  teamName: string;
  tag?: string;
  createdAt: string;
}

export interface RegistrationStatusResponse {
  isRegistrationOpen: boolean;
  linkedPlayerNames: string[];
  teamMembership?: TeamMembershipInfo;
}

export interface TeamMembershipInfo {
  teamId: number;
  teamName: string;
  tag?: string;
  isLeader: boolean;
  playerName: string;
  joinedAt: string;
}

export interface TeamDetailsResponse {
  teamId: number;
  teamName: string;
  tag?: string;
  createdAt: string;
  players: TeamPlayerInfo[];
}

export interface TeamPlayerInfo {
  playerName: string;
  isLeader: boolean;
  rulesAcknowledged: boolean;
  joinedAt: string;
  userId?: number;
}

export interface AvailableTeam {
  id: number;
  name: string;
  tag?: string;
  playerCount: number;
}

class TeamRegistrationService {
  private baseUrl = '/stats/tournament';
  private authUrl = '/stats/auth';

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
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
    return response.json();
  }

  async getRegistrationStatus(tournamentId: number): Promise<RegistrationStatusResponse> {
    const response = await apiClient.get(
      `${this.baseUrl}/${tournamentId}/registration/my-status`,
      { requiresAuth: true }
    );
    return this.handleResponse<RegistrationStatusResponse>(response);
  }

  async getAvailableTeams(tournamentId: number): Promise<AvailableTeam[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/${tournamentId}/registration/teams`,
      { requiresAuth: true }
    );
    return this.handleResponse<AvailableTeam[]>(response);
  }

  async createTeam(tournamentId: number, request: CreateTeamRequest): Promise<CreateTeamResponse> {
    const response = await apiClient.post(
      `${this.baseUrl}/${tournamentId}/registration/teams`,
      request,
      { requiresAuth: true }
    );
    return this.handleResponse<CreateTeamResponse>(response);
  }

  async joinTeam(tournamentId: number, teamId: number, request: JoinTeamRequest): Promise<void> {
    const response = await apiClient.post(
      `${this.baseUrl}/${tournamentId}/registration/teams/${teamId}/join`,
      request,
      { requiresAuth: true }
    );
    if (!response.ok) {
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
  }

  async getTeamDetails(tournamentId: number): Promise<TeamDetailsResponse> {
    const response = await apiClient.get(
      `${this.baseUrl}/${tournamentId}/my-team`,
      { requiresAuth: true }
    );
    return this.handleResponse<TeamDetailsResponse>(response);
  }

  async updateTeam(tournamentId: number, request: UpdateTeamRequest): Promise<void> {
    const response = await apiClient.put(
      `${this.baseUrl}/${tournamentId}/my-team`,
      request,
      { requiresAuth: true }
    );
    if (!response.ok) {
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
  }

  async addPlayer(tournamentId: number, request: AddPlayerRequest): Promise<void> {
    const response = await apiClient.post(
      `${this.baseUrl}/${tournamentId}/my-team/players`,
      request,
      { requiresAuth: true }
    );
    if (!response.ok) {
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
  }

  async removePlayer(tournamentId: number, playerName: string): Promise<void> {
    const response = await apiClient.delete(
      `${this.baseUrl}/${tournamentId}/my-team/players/${encodeURIComponent(playerName)}`,
      { requiresAuth: true }
    );
    if (!response.ok) {
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
  }

  async leaveTeam(tournamentId: number, teamId: number): Promise<void> {
    const response = await apiClient.delete(
      `${this.baseUrl}/${tournamentId}/registration/teams/${teamId}/leave`,
      { requiresAuth: true }
    );
    if (!response.ok) {
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
  }

  async deleteTeam(tournamentId: number): Promise<void> {
    const response = await apiClient.delete(
      `${this.baseUrl}/${tournamentId}/my-team`,
      { requiresAuth: true }
    );
    if (!response.ok) {
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
  }

  // Player name linking methods
  async getLinkedPlayerNames(): Promise<LinkedPlayerName[]> {
    const response = await apiClient.get(
      `${this.authUrl}/player-names`,
      { requiresAuth: true }
    );
    return this.handleResponse<LinkedPlayerName[]>(response);
  }

  async linkPlayerName(playerName: string): Promise<LinkedPlayerName> {
    const response = await apiClient.post(
      `${this.authUrl}/player-names`,
      { playerName },
      { requiresAuth: true }
    );
    return this.handleResponse<LinkedPlayerName>(response);
  }
}

export const teamRegistrationService = new TeamRegistrationService();
