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
}

export interface MapRotationItem {
  mapName: string;
  totalRounds: number;
  playTimePercentage: number;
  avgConcurrentPlayers: number;
  winStats: WinStats;
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
 * Fetches all servers with summary information
 * @param game - Game filter: bf1942 (default), fh2, or bfvietnam
 */
export async function fetchServers(game: GameType = 'bf1942'): Promise<ServerListResponse> {
  try {
    const response = await axios.get<ServerListResponse>('/stats/data-explorer/servers', {
      params: { game }
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
export async function fetchMapDetail(mapName: string, game: GameType = 'bf1942'): Promise<MapDetail> {
  try {
    const response = await axios.get<MapDetail>(`/stats/data-explorer/maps/${encodeURIComponent(mapName)}`, {
      params: { game }
    });
    return response.data;
  } catch (err) {
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
