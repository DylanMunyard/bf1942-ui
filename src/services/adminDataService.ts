// Types matching backend AdminData API

export interface QuerySuspiciousSessionsRequest {
  serverGuid?: string;
  minScore?: number;
  minKd?: number;
  dateFrom?: string;
  dateTo?: string;
  /** When true, include sessions from rounds that have been marked as deleted (so they can be undeleted). */
  includeDeletedRounds?: boolean;
  /** Game type filter: bf1942, fh2, bfvietnam. From server record. */
  game?: string;
}

export interface SuspiciousSessionResponse {
  playerName: string;
  serverName: string;
  serverGuid?: string;
  totalScore: number;
  totalKills: number;
  totalDeaths?: number;
  kdRatio?: number;
  roundId: string;
  sessionId?: string;
  /** Round start time (ISO string from backend). */
  roundStartTime?: string;
  /** True when the round has been marked as deleted. */
  roundIsDeleted?: boolean;
}

export interface PagedSuspiciousSessionsResponse {
  items: SuspiciousSessionResponse[];
  totalCount: number;
  page?: number;
  pageSize?: number;
}

export interface RoundPlayerEntry {
  playerName: string;
  score: number;
  kills: number;
  deaths: number;
  /** Backend may send totalScore/totalKills/totalDeaths (camelCase) */
  totalScore?: number;
  totalKills?: number;
  totalDeaths?: number;
}

export interface RoundDetailResponse {
  roundId: string;
  mapName?: string;
  serverName?: string;
  serverGuid?: string;
  startTime?: string;
  endTime?: string;
  players: RoundPlayerEntry[];
  achievementCountToDelete: number;
  observationCountToDelete?: number;
  sessionCountToDelete?: number;
  /** True when this round has been marked as deleted (soft-delete). Excluded from aggregates. */
  isDeleted?: boolean;
}

export interface RoundAchievement {
  playerName: string;
  achievementType?: string;
  achievementId: string;
  achievementName: string;
  tier: string;
  value?: number;
  achievedAt: string;
  mapName?: string;
  roundId?: string;
}

export interface DeleteRoundResponse {
  success: boolean;
  achievementsDeleted?: number;
  observationsDeleted?: number;
  sessionsDeleted?: number;
  roundsDeleted?: number;
}

export interface BulkDeleteRoundsResponse {
  roundsDeleted: number;
  deletedAchievements: number;
  deletedSessions: number;
  affectedPlayers: number;
}

export interface UndeleteRoundResponse {
  roundId: string;
  sessionsRestored: number;
  roundRestored: number;
  affectedPlayers: number;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  adminEmail: string;
  timestamp: string;
}

export interface UserWithRoleResponse {
  userId: number;
  email: string;
  role: string;
}

export interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp?: string;
  serverPort?: number;
}

class AdminDataService {
  private baseUrl = '/stats/admin/data';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { authService } = await import('./authService');

    const isValid = await authService.ensureValidToken();
    if (!isValid) {
      throw new Error('Authentication required but token is invalid');
    }

    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        const newToken = localStorage.getItem('authToken');
        if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
        const retry = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${retry.status}`);
        }
        const ct = retry.headers.get('content-type');
        if (!ct?.includes('application/json') || retry.status === 204) {
          return {} as T;
        }
        return retry.json();
      }
      await authService.logout();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.title || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json') || response.status === 204) {
      return {} as T;
    }
    return response.json();
  }

  async querySuspiciousSessions(
    req: QuerySuspiciousSessionsRequest,
    page = 1,
    pageSize = 50,
    _sortField = 'totalScore',
    _sortOrder: 1 | -1 = -1
  ): Promise<PagedSuspiciousSessionsResponse> {
    const body: Record<string, unknown> = {
      page,
      pageSize,
    };
    if (req.serverGuid != null) body.serverGuid = req.serverGuid;
    if (req.minScore != null) body.minScore = req.minScore;
    if (req.minKd != null) body.minKdRatio = req.minKd;
    if (req.dateFrom != null) body.startDate = req.dateFrom;
    if (req.dateTo != null) body.endDate = req.dateTo;
    if (req.includeDeletedRounds === true) body.includeDeletedRounds = true;
    if (req.game != null && req.game !== '') body.game = req.game;
    return this.request<PagedSuspiciousSessionsResponse>('/sessions/query', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getRoundDetail(roundId: string): Promise<RoundDetailResponse> {
    const raw = await this.request<RoundDetailResponse & { achievementCount?: number; isDeleted?: boolean }>(
      `/rounds/${encodeURIComponent(roundId)}`,
      { method: 'GET' }
    );
    return {
      ...raw,
      achievementCountToDelete: raw.achievementCount ?? raw.achievementCountToDelete ?? 0,
      isDeleted: raw.isDeleted ?? false,
    };
  }

  /** Fetches achievements for a round via the public round report endpoint. */
  async getRoundAchievements(roundId: string): Promise<RoundAchievement[]> {
    const res = await fetch(`/stats/rounds/${encodeURIComponent(roundId)}/report`);
    if (!res.ok) throw new Error(`Failed to load round report: ${res.status}`);
    const data = await res.json();
    return (data.achievements ?? []) as RoundAchievement[];
  }

  async deleteRound(roundId: string): Promise<DeleteRoundResponse> {
    return this.request<DeleteRoundResponse>(`/rounds/${encodeURIComponent(roundId)}`, {
      method: 'DELETE',
    });
  }

  async deleteRounds(roundIds: string[]): Promise<BulkDeleteRoundsResponse> {
    return this.request<BulkDeleteRoundsResponse>('/rounds/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ roundIds }),
    });
  }

  async undeleteRound(roundId: string): Promise<UndeleteRoundResponse> {
    return this.request<UndeleteRoundResponse>(`/rounds/${encodeURIComponent(roundId)}/undelete`, {
      method: 'POST',
    });
  }

  // App Data (KVP) methods
  async getAppData(key: string): Promise<{ id: string; value: string; updatedAt: string } | null> {
    try {
      return await this.request<{ id: string; value: string; updatedAt: string }>(
        `/app-data/${encodeURIComponent(key)}`,
        { method: 'GET' }
      );
    } catch (e) {
      // Return null for 404 (not found)
      if (e instanceof Error && e.message.includes('404')) {
        return null;
      }
      throw e;
    }
  }

  async setAppData(key: string, value: string): Promise<void> {
    await this.request<void>(`/app-data/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  async deleteAppData(key: string): Promise<void> {
    await this.request<void>(`/app-data/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }

  async getAuditLog(_page = 1, pageSize = 50): Promise<{
    items: AuditLogEntry[];
    totalCount: number;
  }> {
    const res = await this.request<AuditLogEntry[] | { items: AuditLogEntry[]; totalCount: number }>(
      `/audit-log?limit=${pageSize}`,
      { method: 'GET' }
    );
    if (Array.isArray(res)) {
      return { items: res, totalCount: res.length };
    }
    return { items: res.items ?? [], totalCount: res.totalCount ?? res.items?.length ?? 0 };
  }

  async listUsers(): Promise<UserWithRoleResponse[]> {
    return this.request<UserWithRoleResponse[]>('/users', { method: 'GET' });
  }

  async setUserRole(userId: number, role: string): Promise<void> {
    await this.request<void>(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }
}

// Server search for the query form (uses existing /stats/servers/search; no admin auth required for read)
// game: bf1942 | fh2 | bfvietnam — filters by server's game type
export async function searchServersForAdmin(
  query: string,
  pageSize = 20,
  game: string = 'bf1942'
): Promise<ServerSearchResult[]> {
  const q = query?.trim() || '';
  const url = `/stats/servers/search?query=${encodeURIComponent(q)}&game=${encodeURIComponent(game)}&pageSize=${pageSize}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? data) || [];
}

const adminDataService = new AdminDataService();
export { adminDataService };
