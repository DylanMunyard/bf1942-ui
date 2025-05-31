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
}

export interface RecentServerActivity {
  serverGuid: string;
  serverName: string;
  totalPlayTimeMinutes: number;
  totalKills: number;
  totalDeaths: number;
  lastPlayed: string; // ISO date string
}

export interface PlayerTimeStatistics {
  totalPlayTimeMinutes: number;
  totalObservations: number;
  firstPlayed: string; // ISO date string
  lastPlayed: string; // ISO date string
  highestScore: number;
  totalKills: number;
  totalDeaths: number;
  isActive: boolean;
  currentServer: ServerInfo | null;
  recentServers: RecentServerActivity[];
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
