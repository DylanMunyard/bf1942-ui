export interface TournamentListItem {
  id: number;
  name: string;
  slug?: string;
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
  youTubeUrl?: string;
  forumUrl?: string;
  promoVideoUrl?: string;
  theme?: TournamentTheme;
}

export interface TournamentTeam {
  id: number;
  name: string;
  createdAt: string;
  players: TeamPlayerResponse[];
}

export interface TournamentMatchResult {
  id: number;
  team1Id?: number;
  team1Name?: string;
  team2Id?: number;
  team2Name?: string;
  winningTeamId?: number;
  winningTeamName?: string;
  team1Tickets: number;
  team2Tickets: number;
}

export interface TournamentMatchMap {
  id: number;
  mapName: string;
  mapOrder: number;
  teamId?: number;
  teamName?: string;
  imagePath?: string;
  matchResults: TournamentMatchResult[];
}

export interface TournamentMatch {
  id: number;
  scheduledDate: string;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  serverGuid?: string;
  serverName?: string;
  createdAt: string;
  maps: TournamentMatchMap[];
  week?: string | null;
}

export interface TournamentMatchesByWeek {
  week: string | null;
  matches: TournamentMatch[];
}

export interface TournamentTheme {
  backgroundColour?: string;
  textColour?: string;
  accentColour?: string;
  primaryColour?: string;
  secondaryColour?: string;
  radius?: string;
  borderWidth?: string;
}

export interface TournamentFile {
  id: number;
  name: string;
  url: string;
  category?: string;
  uploadedAt: string;
}

export interface TournamentWeekDate {
  id?: number;
  week: string;
  startDate: string;
  endDate: string;
}

export interface TournamentDetail {
  id: number;
  name: string;
  slug?: string;
  organizer: string;
  createdAt: string;
  anticipatedRoundCount?: number;
  status?: 'draft' | 'registration' | 'open' | 'closed';
  gameMode?: string;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  matchesByWeek?: TournamentMatchesByWeek[];
  latestMatches?: TournamentMatch[];
  weekDates?: TournamentWeekDate[];
  files?: TournamentFile[];
  heroImageBase64?: string;
  heroImageContentType?: string;
  communityLogoBase64?: string;
  communityLogoContentType?: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  serverGuid?: string;
  serverName?: string;
  discordUrl?: string;
  youTubeUrl?: string;
  twitchUrl?: string;
  forumUrl?: string;
  rules?: string;
  promoVideoUrl?: string;
  theme: TournamentTheme;
  hasHeroImage?: boolean;
  hasCommunityLogo?: boolean;
}

export interface CreateTournamentRequest {
  name: string;
  slug?: string;
  organizer: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  anticipatedRoundCount?: number;
  status?: 'draft' | 'registration' | 'open' | 'closed';
  gameMode?: string;
  heroImageBase64?: string;
  heroImageContentType?: string;
  communityLogoBase64?: string;
  communityLogoContentType?: string;
  serverGuid?: string;
  discordUrl?: string;
  youTubeUrl?: string;
  twitchUrl?: string;
  forumUrl?: string;
  rules?: string;
  registrationRules?: string;
  promoVideoUrl?: string;
  weekDates?: TournamentWeekDate[];
  files?: CreateTournamentFileRequest[];
  theme: TournamentTheme;
}

export interface UpdateTournamentRequest {
  name?: string;
  slug?: string;
  organizer?: string;
  game?: 'bf1942' | 'fh2' | 'bfvietnam';
  anticipatedRoundCount?: number;
  status?: 'draft' | 'registration' | 'open' | 'closed';
  gameMode?: string;
  heroImageBase64?: string;
  heroImageContentType?: string;
  communityLogoBase64?: string;
  communityLogoContentType?: string;
  serverGuid?: string;
  discordUrl?: string;
  youTubeUrl?: string;
  twitchUrl?: string;
  forumUrl?: string;
  rules?: string;
  registrationRules?: string;
  promoVideoUrl?: string;
  weekDates?: TournamentWeekDate[];
  files?: CreateTournamentFileRequest[];
  theme?: TournamentTheme;
}

// File management interfaces
export interface CreateTournamentFileRequest {
  name: string;
  url: string;
  category?: string;
}

export interface UpdateTournamentFileRequest {
  name?: string;
  url?: string;
  category?: string;
}

// Match files and comments interfaces
export interface CreateMatchFileRequest {
  name: string;
  url: string;
  tags: string;
}

export interface UpdateMatchFileRequest {
  name?: string;
  url?: string;
  tags?: string;
}

export interface MatchFile {
  id: number;
  name: string;
  url: string;
  tags: string;
  uploadedAt: string;
}

export interface CreateMatchCommentRequest {
  content: string;
}

export interface UpdateMatchCommentRequest {
  content: string;
}

export interface MatchComment {
  id: number;
  content: string;
  createdByUserId: number;
  createdByUserEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMatchFilesAndComments {
  tournamentId: number;
  matchId: number;
  files: MatchFile[];
  comments: MatchComment[];
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
  maps: Array<{
    mapName: string;
    teamId?: number;
    imagePath?: string;
  }>;
  serverGuid?: string;
  serverName?: string;
  week?: string | null;
}

export interface UpdateMatchRequest {
  scheduledDate?: string;
  team1Id?: number;
  team2Id?: number;
  maps?: Array<{
    mapName: string;
    teamId?: number;
    imagePath?: string;
  }>;
  serverGuid?: string;
  serverName?: string;
  week?: string | null;
}

export interface OverrideTeamMappingRequest {
  team1Id: number;
  team2Id: number;
}

export interface CreateManualResultRequest {
  mapId: number;
  team1Id?: number;
  team2Id?: number;
  team1Tickets?: number;
  team2Tickets?: number;
  winningTeamId?: number;
  roundId?: string; // Optional: When provided alone, backend populates from round data
}

// Custom error class for validation errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
    public status: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface UpdateManualResultRequest {
  team1Id: number;
  team2Id: number;
  team1Tickets: number;
  team2Tickets: number;
  winningTeamId: number;
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
        
        // Check if this is a validation error response (has 'errors' object)
        if (errorData.errors && typeof errorData.errors === 'object') {
          const validationErrors: Record<string, string[]> = {};
          
          // Extract all validation errors
          for (const [key, value] of Object.entries(errorData.errors)) {
            if (Array.isArray(value)) {
              validationErrors[key] = value as string[];
            } else if (typeof value === 'string') {
              validationErrors[key] = [value];
            }
          }
          
          // Use title if available, otherwise use a default message
          errorMessage = errorData.title || 'Validation errors occurred';
          
          throw new ValidationError(errorMessage, validationErrors, response.status);
        }
        
        // Fallback to message field if available
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.title) {
          errorMessage = errorData.title;
        }
      } catch (err) {
        // If we already threw a ValidationError, re-throw it
        if (err instanceof ValidationError) {
          throw err;
        }
        // Otherwise, ignore JSON parsing errors and use default message
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

  // Recalculate leaderboard
  async recalculateLeaderboard(
    id: number,
    options?: { week?: string; fromWeek?: string }
  ): Promise<void> {
    const payload: Record<string, string> = {};
    if (options?.week) {
      payload.week = options.week;
    }
    if (options?.fromWeek) {
      payload.fromWeek = options.fromWeek;
    }

    await this.request(`/${id}/leaderboard/recalculate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ===== Tournament Files Management =====

  // Create tournament file
  async createTournamentFile(
    tournamentId: number,
    request: CreateTournamentFileRequest
  ): Promise<TournamentFile> {
    return this.request<TournamentFile>(`/${tournamentId}/files`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Update tournament file
  async updateTournamentFile(
    tournamentId: number,
    fileId: number,
    request: UpdateTournamentFileRequest
  ): Promise<TournamentFile> {
    return this.request<TournamentFile>(
      `/${tournamentId}/files/${fileId}`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
  }

  // Delete tournament file
  async deleteTournamentFile(tournamentId: number, fileId: number): Promise<void> {
    await this.request(`/${tournamentId}/files/${fileId}`, {
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

  // Update match map (name only)
  async updateMatchMap(tournamentId: number, matchId: number, mapId: number, request: { mapId: number; mapName: string }): Promise<TournamentMatchMap> {
    return this.request<TournamentMatchMap>(`/${tournamentId}/matches/${matchId}/maps/${mapId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // ===== Match Results Management =====

  // Override team mapping for match result
  async overrideTeamMapping(tournamentId: number, resultId: number, request: OverrideTeamMappingRequest): Promise<TournamentMatchResult> {
    return this.request<TournamentMatchResult>(`/${tournamentId}/match-results/${resultId}/override-teams`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // Create manual match result
  async createManualResult(tournamentId: number, matchId: number, mapId: number, request: CreateManualResultRequest): Promise<TournamentMatchResult> {
    return this.request<TournamentMatchResult>(`/${tournamentId}/matches/${matchId}/maps/${mapId}/result`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Update manual match result
  async updateManualResult(tournamentId: number, resultId: number, request: UpdateManualResultRequest): Promise<TournamentMatchResult> {
    return this.request<TournamentMatchResult>(`/${tournamentId}/match-results/${resultId}/manual-update`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // Delete match result
  async deleteMatchResult(tournamentId: number, resultId: number): Promise<void> {
    await this.request(`/${tournamentId}/match-results/${resultId}`, {
      method: 'DELETE',
    });
  }

  // Link round to match result
  async linkRoundToResult(tournamentId: number, resultId: number, roundId: string): Promise<TournamentMatchResult> {
    return this.request<TournamentMatchResult>(`/${tournamentId}/match-results/${resultId}/round`, {
      method: 'PUT',
      body: JSON.stringify({ roundId }),
    });
  }

  // Unlink round from match result
  async unlinkRoundFromResult(tournamentId: number, resultId: number): Promise<TournamentMatchResult> {
    return this.request<TournamentMatchResult>(`/${tournamentId}/match-results/${resultId}/round`, {
      method: 'PUT',
      body: JSON.stringify({ roundId: null }),
    });
  }


  // Week management
  async createWeek(tournamentId: number, weekData: Omit<TournamentWeekDate, 'id'>): Promise<TournamentWeekDate> {
    return this.request<TournamentWeekDate>(`/${tournamentId}/weeks`, {
      method: 'POST',
      body: JSON.stringify(weekData),
    });
  }

  async updateWeek(tournamentId: number, weekId: number, weekData: Omit<TournamentWeekDate, 'id'>): Promise<TournamentWeekDate> {
    return this.request<TournamentWeekDate>(`/${tournamentId}/weeks/${weekId}`, {
      method: 'PUT',
      body: JSON.stringify(weekData),
    });
  }

  async deleteWeek(tournamentId: number, weekId: number): Promise<void> {
    return this.request<void>(`/${tournamentId}/weeks/${weekId}`, {
      method: 'DELETE',
    });
  }


  // File management
  async createFile(tournamentId: number, fileData: Omit<TournamentFile, 'id'>): Promise<TournamentFile> {
    return this.request<TournamentFile>(`/${tournamentId}/files`, {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  }

  async updateFile(tournamentId: number, fileId: number, fileData: Partial<Omit<TournamentFile, 'id'>>): Promise<TournamentFile> {
    return this.request<TournamentFile>(`/${tournamentId}/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(fileData),
    });
  }

  async deleteFile(tournamentId: number, fileId: number): Promise<void> {
    return this.request<void>(`/${tournamentId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Match files management
  async createMatchFile(
    tournamentId: number,
    matchId: number,
    request: CreateMatchFileRequest
  ): Promise<MatchFile> {
    return this.request<MatchFile>(`/${tournamentId}/matches/${matchId}/files`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateMatchFile(
    tournamentId: number,
    matchId: number,
    fileId: number,
    request: UpdateMatchFileRequest
  ): Promise<MatchFile> {
    return this.request<MatchFile>(
      `/${tournamentId}/matches/${matchId}/files/${fileId}`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
  }

  async deleteMatchFile(
    tournamentId: number,
    matchId: number,
    fileId: number
  ): Promise<void> {
    await this.request(`/${tournamentId}/matches/${matchId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Get match files and comments
  async getMatchFilesAndComments(
    tournamentId: number,
    matchId: number
  ): Promise<AdminMatchFilesAndComments> {
    return this.request<AdminMatchFilesAndComments>(
      `/${tournamentId}/matches/${matchId}/files-and-comments`
    );
  }

  // Match comments management
  async createMatchComment(
    tournamentId: number,
    matchId: number,
    request: CreateMatchCommentRequest
  ): Promise<MatchComment> {
    return this.request<MatchComment>(`/${tournamentId}/matches/${matchId}/comments`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateMatchComment(
    tournamentId: number,
    matchId: number,
    commentId: number,
    request: UpdateMatchCommentRequest
  ): Promise<MatchComment> {
    return this.request<MatchComment>(
      `/${tournamentId}/matches/${matchId}/comments/${commentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
  }

  async deleteMatchComment(
    tournamentId: number,
    matchId: number,
    commentId: number
  ): Promise<void> {
    await this.request(
      `/${tournamentId}/matches/${matchId}/comments/${commentId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ===== Tournament Posts Management =====

  async getPosts(tournamentId: number): Promise<TournamentPost[]> {
    return this.request<TournamentPost[]>(`/${tournamentId}/posts`);
  }

  async createPost(
    tournamentId: number,
    request: CreateTournamentPostRequest
  ): Promise<TournamentPost> {
    return this.request<TournamentPost>(`/${tournamentId}/posts`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updatePost(
    tournamentId: number,
    postId: number,
    request: UpdateTournamentPostRequest
  ): Promise<TournamentPost> {
    return this.request<TournamentPost>(`/${tournamentId}/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deletePost(tournamentId: number, postId: number): Promise<void> {
    await this.request(`/${tournamentId}/posts/${postId}`, {
      method: 'DELETE',
    });
  }
}

// Tournament Posts interfaces
export interface TournamentPost {
  id: number;
  tournamentId: number;
  title: string;
  content: string;
  publishAt: string | null;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentPostRequest {
  title: string;
  content: string;
  publishAt?: string | null;
  status?: 'draft' | 'published';
}

export interface UpdateTournamentPostRequest {
  title?: string;
  content?: string;
  publishAt?: string | null;
  status?: 'draft' | 'published';
}

export const adminTournamentService = new AdminTournamentService();
