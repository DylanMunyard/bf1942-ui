import { apiClient } from './apiClient';

// Team recruitment status enum (matches backend)
export enum TeamRecruitmentStatus {
  Open = 0,
  Closed = 1,
  LookingForBTeam = 2
}

// Membership status enum (matches backend)
export enum MembershipStatus {
  Pending = 0,
  Approved = 1
}

// Helper to get display text for recruitment status
export const getRecruitmentStatusText = (status: TeamRecruitmentStatus): string => {
  switch (status) {
    case TeamRecruitmentStatus.Open:
      return 'Recruiting';
    case TeamRecruitmentStatus.Closed:
      return 'Not Recruiting';
    case TeamRecruitmentStatus.LookingForBTeam:
      return 'Looking for B Team';
    default:
      return 'Unknown';
  }
};

// Helper to get recruitment status message for team cards
export const getRecruitmentStatusMessage = (status: TeamRecruitmentStatus, leaderName?: string): string => {
  switch (status) {
    case TeamRecruitmentStatus.Open:
      return 'Looking for members (full-time, backup, etc.)';
    case TeamRecruitmentStatus.Closed:
      return 'Not currently recruiting new members';
    case TeamRecruitmentStatus.LookingForBTeam:
      return leaderName 
        ? `Looking to start a second team. Contact ${leaderName} on Discord to discuss.`
        : 'Looking to start a second team. Contact the team leader on Discord to discuss.';
    default:
      return '';
  }
};

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
  isTournamentAdmin?: boolean;
}

export interface TeamMembershipInfo {
  teamId: number;
  teamName: string;
  tag?: string;
  isLeader: boolean;
  playerName: string;
  joinedAt: string;
  membershipStatus?: MembershipStatus | null;
}

export interface TeamDetailsResponse {
  teamId: number;
  teamName: string;
  tag?: string;
  createdAt: string;
  recruitmentStatus: TeamRecruitmentStatus;
  players: TeamPlayerInfo[];
}

export interface TeamPlayerInfo {
  playerName: string;
  isLeader: boolean;
  rulesAcknowledged: boolean;
  joinedAt: string;
  userId?: number;
  membershipStatus?: MembershipStatus | null;
}

export interface AvailableTeam {
  id: number;
  name: string;
  tag?: string;
  playerCount: number;
  recruitmentStatus: TeamRecruitmentStatus;
  leaderPlayerName?: string;
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

  async getTeamDetails(tournamentId: number, teamId?: number): Promise<TeamDetailsResponse> {
    const url = teamId 
      ? `${this.baseUrl}/${tournamentId}/my-team?teamId=${teamId}`
      : `${this.baseUrl}/${tournamentId}/my-team`;
    const response = await apiClient.get(url, { requiresAuth: true });
    return this.handleResponse<TeamDetailsResponse>(response);
  }

  async updateTeam(tournamentId: number, request: UpdateTeamRequest, teamId?: number): Promise<void> {
    const url = teamId
      ? `${this.baseUrl}/${tournamentId}/my-team?teamId=${teamId}`
      : `${this.baseUrl}/${tournamentId}/my-team`;
    const response = await apiClient.put(url, request, { requiresAuth: true });
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

  async addPlayer(tournamentId: number, request: AddPlayerRequest, teamId?: number): Promise<void> {
    const url = teamId
      ? `${this.baseUrl}/${tournamentId}/my-team/players?teamId=${teamId}`
      : `${this.baseUrl}/${tournamentId}/my-team/players`;
    const response = await apiClient.post(url, request, { requiresAuth: true });
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

  async removePlayer(tournamentId: number, playerName: string, teamId?: number): Promise<void> {
    const url = teamId
      ? `${this.baseUrl}/${tournamentId}/my-team/players/${encodeURIComponent(playerName)}?teamId=${teamId}`
      : `${this.baseUrl}/${tournamentId}/my-team/players/${encodeURIComponent(playerName)}`;
    const response = await apiClient.delete(url, { requiresAuth: true });
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

  async approveMember(tournamentId: number, playerName: string, teamId?: number): Promise<void> {
    const url = teamId
      ? `${this.baseUrl}/${tournamentId}/my-team/players/${encodeURIComponent(playerName)}/approve?teamId=${teamId}`
      : `${this.baseUrl}/${tournamentId}/my-team/players/${encodeURIComponent(playerName)}/approve`;
    const response = await apiClient.post(url, {}, { requiresAuth: true });
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

  async deleteTeam(tournamentId: number, teamId?: number): Promise<void> {
    const url = teamId
      ? `${this.baseUrl}/${tournamentId}/my-team?teamId=${teamId}`
      : `${this.baseUrl}/${tournamentId}/my-team`;
    const response = await apiClient.delete(url, { requiresAuth: true });
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

  async updateRecruitmentStatus(tournamentId: number, recruitmentStatus: TeamRecruitmentStatus, teamId?: number): Promise<void> {
    const url = teamId
      ? `${this.baseUrl}/${tournamentId}/my-team/recruitment-status?teamId=${teamId}`
      : `${this.baseUrl}/${tournamentId}/my-team/recruitment-status`;
    const response = await apiClient.put(url, { recruitmentStatus }, { requiresAuth: true });
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
