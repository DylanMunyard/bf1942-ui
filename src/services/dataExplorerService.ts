import axios from 'axios';

// Types for Data Explorer API

export interface WinStats {
  team1Label: string;
  team2Label: string;
  team1Victories: number;
  team2Victories: number;
  team1WinPercentage: number;
  team2WinPercentage: number;
  totalRounds: number;
}

export interface ServerSummary {
  guid: string;
  name: string;
  game: string;
  country?: string;
  isOnline: boolean;
  currentPlayers: number;
  maxPlayers: number;
  totalMaps: number;
  totalRoundsLast30Days: number;
}

export interface ServerListResponse {
  servers: ServerSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MapRotationItem {
  mapName: string;
  totalRounds: number;
  playTimePercentage: number;
  avgConcurrentPlayers: number;
  winStats: WinStats;
}

export interface MapRotationResponse {
  maps: MapRotationItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TopPlayer {
  playerName: string;
  totalScore: number;
  totalKills: number;
  kdRatio: number;
}

export interface PerMapStats {
  mapName: string;
  winStats: WinStats;
  topPlayers: TopPlayer[];
}

export interface ActivityPattern {
  dayOfWeek: number;
  hourOfDay: number;
  avgPlayers: number;
  medianPlayers: number;
}

export interface ServerDetail {
  guid: string;
  name: string;
  game: string;
  country?: string;
  isOnline: boolean;
  mapRotation: MapRotationItem[];
  overallWinStats: WinStats;
  perMapStats: PerMapStats[];
  activityPatterns: ActivityPattern[];
}

export interface MapSummary {
  mapName: string;
  serversPlayingCount: number;
  totalRoundsLast30Days: number;
  avgPlayersWhenPlayed: number;
}

export interface MapListResponse {
  maps: MapSummary[];
  totalCount: number;
}

export interface ServerOnMap {
  serverGuid: string;
  serverName: string;
  game: string;
  isOnline: boolean;
  totalRoundsOnMap: number;
  winStats: WinStats;
}

export interface MapDetail {
  mapName: string;
  servers: ServerOnMap[];
  aggregatedWinStats: WinStats;
}

/**
 * Valid game types for filtering
 */
export type GameType = 'bf1942' | 'fh2' | 'bfvietnam';

/**
 * Fetches paginated servers with summary information
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 * @param page - Page number (1-based, default 1)
 * @param pageSize - Number of results per page (default 50)
 */
export async function fetchServers(
  game: GameType = 'bf1942',
  page: number = 1,
  pageSize: number = 50
): Promise<ServerListResponse> {
  try {
    const response = await axios.get<ServerListResponse>('/stats/data-explorer/servers', {
      params: { game, page, pageSize }
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching servers for data explorer:', err);
    throw new Error('Failed to get servers');
  }
}

/**
 * Fetches detailed information for a specific server
 */
export async function fetchServerDetail(serverGuid: string): Promise<ServerDetail> {
  try {
    const response = await axios.get<ServerDetail>(`/stats/data-explorer/servers/${encodeURIComponent(serverGuid)}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching server detail:', err);
    throw new Error('Failed to get server detail');
  }
}

/**
 * Fetches paginated map rotation for a specific server
 * @param serverGuid - The server GUID
 * @param page - Page number (1-based, default 1)
 * @param pageSize - Number of results per page (default 10)
 */
export async function fetchServerMapRotation(
  serverGuid: string,
  page: number = 1,
  pageSize: number = 10
): Promise<MapRotationResponse> {
  try {
    const response = await axios.get<MapRotationResponse>(
      `/stats/data-explorer/servers/${encodeURIComponent(serverGuid)}/map-rotation`,
      {
        params: { page, pageSize }
      }
    );
    return response.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Error('Server not found');
    }
    console.error('Error fetching server map rotation:', err);
    throw new Error('Failed to get server map rotation');
  }
}

/**
 * Fetches all maps with summary information
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 */
export async function fetchMaps(game: GameType = 'bf1942'): Promise<MapListResponse> {
  try {
    const response = await axios.get<MapListResponse>('/stats/data-explorer/maps', {
      params: { game }
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching maps for data explorer:', err);
    throw new Error('Failed to get maps');
  }
}

/**
 * Fetches detailed information for a specific map
 * @param mapName - The map name
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 */
export async function fetchMapDetail(mapName: string, game: GameType = 'bf1942'): Promise<MapDetail | null> {
  try {
    const response = await axios.get<MapDetail>(`/stats/data-explorer/maps/${encodeURIComponent(mapName)}`, {
      params: { game }
    });
    return response.data;
  } catch (err: any) {
    // Handle 404 as "no data available" instead of an error
    if (err.response?.status === 404) {
      console.log(`Map '${mapName}' not found for game '${game}' - no data available`);
      return null;
    }
    console.error('Error fetching map detail:', err);
    throw new Error('Failed to get map detail');
  }
}

// Server-Map Detail Types

export interface MapActivityStats {
  totalRounds: number;
  totalPlayTimeMinutes: number;
  avgConcurrentPlayers: number;
  peakConcurrentPlayers: number;
}

export interface LeaderboardEntry {
  playerName: string;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  killsPerMinute: number;
  totalRounds: number;
  playTimeMinutes: number;
}

export interface DateRange {
  days: number;
  fromDate: string;
  toDate: string;
}

// Session types for server-map sessions
export interface TopPlayer {
  sessionId: number;
  roundId: string;
  playerName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  score: number;
  kills: number;
  deaths: number;
  isActive: boolean;
}

export interface ServerMapSession {
  roundId: string;
  serverName: string;
  serverGuid: string;
  mapName: string;
  gameType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  participantCount: number;
  totalSessions: number;
  isActive: boolean;
  team1Label?: string;
  team2Label?: string;
  team1Points?: number;
  team2Points?: number;
  roundTimeRemain?: number;
  topPlayers?: TopPlayer[];
}

// Player Search Types

export interface PlayerSearchResult {
  playerName: string;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  totalRounds: number;
  uniqueMaps: number;
  uniqueServers: number;
}

export interface PlayerSearchResponse {
  players: PlayerSearchResult[];
  totalCount: number;
  query: string;
}

// Player Map Rankings Types

export interface PlayerOverallStats {
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  totalRounds: number;
  uniqueServers: number;
  uniqueMaps: number;
}

export interface PlayerServerStats {
  serverGuid: string;
  serverName: string;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  totalRounds: number;
  rank: number;
}

export interface PlayerMapGroup {
  mapName: string;
  aggregatedScore: number;
  serverStats: PlayerServerStats[];
  bestRank: number | null;
  bestRankServer: string | null;
}

export interface NumberOneRanking {
  mapName: string;
  serverName: string;
  serverGuid: string;
  totalScore: number;
}

export interface PlayerMapRankingsResponse {
  playerName: string;
  game: string;
  overallStats: PlayerOverallStats;
  mapGroups: PlayerMapGroup[];
  numberOneRankings: NumberOneRanking[];
  dateRange: DateRange;
}

export interface ServerMapDetail {
  serverGuid: string;
  serverName: string;
  mapName: string;
  game: string;
  isServerOnline: boolean;
  mapActivity: MapActivityStats;
  winStats: WinStats;
  topByScore: LeaderboardEntry[];
  topByKills: LeaderboardEntry[];
  topByKdRatio: LeaderboardEntry[];
  topByKillRate: LeaderboardEntry[];
  activityPatterns: ActivityPattern[];
  dateRange: DateRange;
}

/**
 * Fetches detailed information for a specific server-map combination
 */
export async function fetchServerMapDetail(
  serverGuid: string,
  mapName: string,
  days: number = 60
): Promise<ServerMapDetail> {
  try {
    const response = await axios.get<ServerMapDetail>(
      `/stats/data-explorer/servers/${encodeURIComponent(serverGuid)}/maps/${encodeURIComponent(mapName)}`,
      { params: { days } }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching server-map detail:', err);
    throw new Error('Failed to get server-map detail');
  }
}

/**
 * Fetches the last sessions for a specific server-map combination
 */
export async function fetchServerMapSessions(
  serverGuid: string,
  mapName: string,
  limit: number = 5
): Promise<ServerMapSession[]> {
  try {
    // Import fetchSessions from playerStatsApi to reuse existing functionality
    const { fetchSessions } = await import('./playerStatsApi');
    const response = await fetchSessions(1, limit, {
      serverGuid: serverGuid, // Filter by server GUID
      mapName: mapName
    }, 'startTime', 'desc');

    return response.items as unknown as ServerMapSession[];
  } catch (err) {
    console.error('Error fetching server-map sessions:', err);
    throw new Error('Failed to get server-map sessions');
  }
}

/**
 * Search for players by name prefix
 * Requires at least 3 characters. Returns top 50 matches by score.
 * @param query - Search query (min 3 characters)
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 */
export async function searchPlayers(
  query: string,
  game: GameType = 'bf1942'
): Promise<PlayerSearchResponse> {
  try {
    const response = await axios.get<PlayerSearchResponse>('/stats/data-explorer/players/search', {
      params: { query, game }
    });
    return response.data;
  } catch (err) {
    console.error('Error searching players:', err);
    throw new Error('Failed to search players');
  }
}

/**
 * Fetches player map rankings with per-server breakdown
 * @param playerName - The player name
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 * @param days - Number of days to look back (default 60)
 * @param serverGuid - Optional server GUID to filter results to a specific server
 */
export async function fetchPlayerMapRankings(
  playerName: string,
  game: GameType = 'bf1942',
  days: number = 60,
  serverGuid?: string
): Promise<PlayerMapRankingsResponse> {
  try {
    const params: Record<string, string | number> = { game, days };
    if (serverGuid) {
      params.serverGuid = serverGuid;
    }
    
    const response = await axios.get<PlayerMapRankingsResponse>(
      `/stats/data-explorer/players/${encodeURIComponent(playerName)}/maps`,
      { params }
    );
    return response.data;
  } catch (err: any) {
    console.error('Error fetching player map rankings:', err);

    // Check if it's a 404 (player not found/no data)
    if (err.response?.status === 404) {
      throw new Error('PLAYER_NOT_FOUND');
    }

    // For other errors, throw the original error message
    throw new Error('Failed to get player map rankings');
  }
}

// Map Player Rankings Types

export interface MapPlayerRanking {
  rank: number;
  playerName: string;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  killsPerMinute: number;
  totalRounds: number;
  playTimeMinutes: number;
  uniqueServers: number;
}

export type MapRankingSortBy = 'score' | 'kills' | 'kdRatio' | 'killRate';

export interface MapPlayerRankingsResponse {
  mapName: string;
  game: string;
  rankings: MapPlayerRanking[];
  totalCount: number;
  page: number;
  pageSize: number;
  dateRange: DateRange;
}

// Engagement Stats for encouraging exploration
export interface ServerEngagementStat {
  value: string;
  label: string;
  context?: string;
  message: string;  // Complete engaging message for CTA display
}

export interface ServerEngagementStats {
  stats: ServerEngagementStat[];
}

export interface PlayerEngagementStat {
  value: string;
  label: string;
  context?: string;
  message: string;  // Complete engaging message for CTA display
}

export interface PlayerEngagementStats {
  stats: PlayerEngagementStat[];
}

/**
 * Fetch randomized engagement statistics for a server to encourage exploration
 */
export async function fetchServerEngagementStats(serverGuid: string): Promise<ServerEngagementStats> {
  try {
    const response = await axios.get<ServerEngagementStats>(`/stats/data-explorer/engagement/server/${encodeURIComponent(serverGuid)}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching server engagement stats:', err);
    throw new Error('Failed to get server engagement stats');
  }
}

/**
 * Fetch randomized engagement statistics for a player to encourage exploration
 */
export async function fetchPlayerEngagementStats(playerName: string, game: GameType = 'bf1942'): Promise<PlayerEngagementStats> {
  try {
    const response = await axios.get<PlayerEngagementStats>(`/stats/data-explorer/engagement/player/${encodeURIComponent(playerName)}`, {
      params: { game }
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching player engagement stats:', err);
    throw new Error('Failed to get player engagement stats');
  }
}

/**
 * Fetches paginated player rankings for a specific map (aggregated across all servers)
 * @param mapName - The map name
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 * @param page - Page number (1-based)
 * @param pageSize - Number of results per page
 * @param search - Optional player name search filter
 * @param serverGuid - Optional server GUID filter
 * @param days - Number of days to look back (default 60)
 * @param sortBy - Sort field: score (default), kills, kdRatio, killRate
 */
export async function fetchMapPlayerRankings(
  mapName: string,
  game: GameType = 'bf1942',
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  serverGuid?: string,
  days: number = 60,
  sortBy: MapRankingSortBy = 'score'
): Promise<MapPlayerRankingsResponse> {
  try {
    const response = await axios.get<MapPlayerRankingsResponse>(
      `/stats/data-explorer/maps/${encodeURIComponent(mapName)}/rankings`,
      {
        params: {
          game,
          page,
          pageSize,
          search: search || undefined,
          serverGuid: serverGuid || undefined,
          days,
          sortBy
        }
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching map player rankings:', err);
    throw new Error('Failed to get map player rankings');
  }
}

// Map Activity Patterns Types

export interface MapActivityPattern {
  dayOfWeek: number;
  hourOfDay: number;
  avgPlayers: number;
  timesPlayed: number;
}

export interface MapActivityPatternsResponse {
  mapName: string;
  game: string;
  activityPatterns: MapActivityPattern[];
  totalDataPoints: number;
}

/**
 * Fetches activity patterns for a specific map showing when it's typically played.
 * @param mapName - The map name
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 */
export async function fetchMapActivityPatterns(
  mapName: string,
  game: GameType = 'bf1942'
): Promise<MapActivityPatternsResponse | null> {
  try {
    const response = await axios.get<MapActivityPatternsResponse>(
      `/stats/data-explorer/maps/${encodeURIComponent(mapName)}/activity-patterns`,
      { params: { game } }
    );
    return response.data;
  } catch (err: any) {
    // Handle 404 as "no data available" instead of an error
    if (err.response?.status === 404) {
      console.log(`No activity patterns found for map '${mapName}' in game '${game}'`);
      return null;
    }
    console.error('Error fetching map activity patterns:', err);
    throw new Error('Failed to get map activity patterns');
  }
}
