import axios from 'axios';

// Define interfaces for the API response
export interface PlayerCountMetric {
  timestamp: number;
  value: number;
}

export interface MostActivePlayer {
  kdRatio: number;
  minutesPlayed: number;
  playerName: string;
  totalDeaths: number;
  totalKills: number;
}

export interface PopularMap {
  mapName: string;
  playerCount: number;
  totalMinutesPlayed: number;
  totalSessions: number;
}

export interface TopScore {
  deaths: number;
  kills: number;
  mapName: string;
  playerName: string;
  score: number;
  sessionId: number;
  timestamp: string; // ISO date string
}

export interface RecentRoundInfo {
  mapName: string;
  startTime: string; // ISO date string  
  endTime: string; // ISO date string
  sessionId: string;
  isActive?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  kills: number;
  deaths: number;
  ping: number;
  teamLabel: string;
}

export interface LeaderboardSnapshot {
  timestamp: string; // ISO date string
  entries: LeaderboardEntry[];
}

export interface RoundInfo {
  mapName: string;
  gameType: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  totalParticipants: number;
  isActive: boolean;
}

export interface SessionInfo {
  sessionId: number;
  playerName: string;
  serverName: string;
  serverGuid: string;
  gameId: string;
  kills: number;
  deaths: number;
  score: number;
}

export interface RoundReport {
  session: SessionInfo;
  round: RoundInfo;
  leaderboardSnapshots: LeaderboardSnapshot[];
}

export interface ServerDetails {
  endPeriod: string; // ISO date string
  mostActivePlayersByTime: MostActivePlayer[];
  playerCountMetrics: PlayerCountMetric[];
  popularMaps: PopularMap[];
  serverGuid: string;
  serverName: string;
  startPeriod: string; // ISO date string
  topScores: TopScore[];
  lastRounds: RecentRoundInfo[];
}

/**
 * Fetches server details from the API
 * @param serverName The name of the server to fetch details for
 * @param game The game type ('bf1942' or 'fh2')
 * @returns Server details
 */
export async function fetchServerDetails(
  serverName: string,
  game: string
): Promise<ServerDetails> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<ServerDetails>(`/stats/servers/${encodeURIComponent(serverName)}`, {
      params: {
        game
      }
    });

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching server details:', err);
    throw new Error('Failed to get server details');
  }
}

/**
 * Fetches round report for a specific round
 * @param serverGuid The GUID of the server
 * @param mapName The name of the map
 * @param startTime The start time of the round
 * @returns Round report with leaderboard snapshots
 */
export async function fetchRoundReport(serverGuid: string, mapName: string, startTime: string): Promise<RoundReport> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<RoundReport>('/stats/servers/round-report', {
      params: {
        serverGuid,
        mapName,
        startTime
      }
    });

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching round report:', err);
    throw new Error('Failed to get round report');
  }
}