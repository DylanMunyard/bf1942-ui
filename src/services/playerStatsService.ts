import axios from 'axios';

// Define interfaces for the API response
export interface PlayerListItem {
  playerName: string;
  totalPlayTimeMinutes: number;
  lastSeen: string; // ISO date string
  isActive: boolean;
  currentServer?: ServerInfo;
}
export interface ServerInfo {
  serverGuid: string;
  serverName: string;
  sessionKills?: number;
  sessionDeaths?: number;
  mapName?: string;
  gameId?: string;
}

export interface Session {
  startTime: string; // ISO date string
  lastSeenTime: string; // ISO date string
  isActive: boolean;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  mapName: string;
  gameType: string;
  serverName: string;
  sessionId: number;
}

export interface ActivityByHour {
  formattedHour: string;
  hour: number;
  minutesActive: number;
}

export interface BestKillMap {
  kdRatio: number;
  mapName: string;
  totalDeaths: number;
  totalKills: number;
}

export interface FavoriteMap {
  mapName: string;
  minutesPlayed: number;
}

export interface ServerPlayTime {
  minutesPlayed: number;
  serverGuid: string;
  serverName: string;
}

export interface PlayerInsights {
  activityByHour: ActivityByHour[];
  bestKillMap: BestKillMap;
  endPeriod: string; // ISO date string
  favoriteMaps: FavoriteMap[];
  playerName: string;
  serverPlayTimes: ServerPlayTime[];
  startPeriod: string; // ISO date string
}

export interface PlayerTimeStatistics {
  totalPlayTimeMinutes: number;
  totalSessions: number;
  firstPlayed: string; // ISO date string
  lastPlayed: string; // ISO date string
  highestScore: number;
  totalKills: number;
  totalDeaths: number;
  isActive: boolean;
  currentServer: ServerInfo | null;
  bestSession: Session | null;
  recentSessions: Session[];
  insights?: PlayerInsights;
}

/**
 * Fetches player statistics from the API
 * @param playerName The name of the player to fetch statistics for
 * @returns Player statistics
 */
export async function fetchPlayerStats(playerName: string): Promise<PlayerTimeStatistics> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<PlayerTimeStatistics>(`/stats/players/${encodeURIComponent(playerName)}`);

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching player stats:', err);
    throw new Error('Failed to get player statistics');
  }
}

/**
 * Fetches the list of all players from the API
 * @returns List of players
 */
export async function fetchPlayersList(): Promise<PlayerListItem[]> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<PlayerListItem[]>('/stats/players');

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching players list:', err);
    throw new Error('Failed to get players list');
  }
}

export interface SessionObservation {
  deaths: number;
  kills: number;
  ping: number;
  score: number;
  teamLabel: string;
  timestamp: string; // ISO date string
}

export interface PlayerDetails {
  firstSeen: string; // ISO date string
  isAiBot: boolean;
  lastSeen: string; // ISO date string
  name: string;
  totalPlayTimeMinutes: number;
}

export interface ServerDetails {
  address: string;
  country: string;
  countryCode: string;
  gameId: string;
  guid: string;
  maxPlayers: number;
  name: string;
  port: number;
}

export interface SessionDetails {
  endTime: string | null; // ISO date string or null if session is active
  gameType: string;
  isActive: boolean;
  mapName: string;
  observations: SessionObservation[];
  playerDetails: PlayerDetails;
  playerName: string;
  serverDetails: ServerDetails;
  serverName: string;
  sessionId: number;
  startTime: string; // ISO date string
  totalDeaths: number;
  totalKills: number;
  totalPlayTimeMinutes: number;
  totalScore: number;
}

/**
 * Fetches session details for a specific player and session
 * @param playerName The name of the player
 * @param sessionId The ID of the session
 * @returns Session details
 */
export async function fetchSessionDetails(playerName: string, sessionId: number): Promise<SessionDetails> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<SessionDetails>(`/stats/players/${encodeURIComponent(playerName)}/sessions/${sessionId}`);

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching session details:', err);
    throw new Error('Failed to get session details');
  }
}
