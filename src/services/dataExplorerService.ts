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
 * Fetches all servers with summary information
 */
export async function fetchServers(): Promise<ServerListResponse> {
  try {
    const response = await axios.get<ServerListResponse>('/stats/data-explorer/servers');
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
 */
export async function fetchMaps(): Promise<MapListResponse> {
  try {
    const response = await axios.get<MapListResponse>('/stats/data-explorer/maps');
    return response.data;
  } catch (err) {
    console.error('Error fetching maps for data explorer:', err);
    throw new Error('Failed to get maps');
  }
}

/**
 * Fetches detailed information for a specific map
 */
export async function fetchMapDetail(mapName: string): Promise<MapDetail> {
  try {
    const response = await axios.get<MapDetail>(`/stats/data-explorer/maps/${encodeURIComponent(mapName)}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching map detail:', err);
    throw new Error('Failed to get map detail');
  }
}
