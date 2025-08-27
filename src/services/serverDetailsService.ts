import axios from 'axios';
import { ServerSummary } from '../types/server';

// Define interfaces for the API response

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

// New interfaces for server insights
export interface PingByHourData {
  timePeriod: string; // ISO date string
  averagePing: number;
  medianPing: number;
  p95Ping: number;
  hour: number;
}

export interface PingByHour {
  data: PingByHourData[];
}

export interface PlayerCountHistoryData {
  timestamp: string; // ISO date string
  playerCount: number;
  uniquePlayersStarted: number;
}

export interface PlayerCountSummary {
  averagePlayerCount: number;
  peakPlayerCount: number;
  peakTimestamp: string; // ISO date string
  changePercentFromPreviousPeriod: number;
  totalUniquePlayersInPeriod: number;
}

export interface ServerInsights {
  serverGuid: string;
  serverName: string;
  startPeriod: string; // ISO date string
  endPeriod: string; // ISO date string
  pingByHour: PingByHour;
  playerCountHistory: PlayerCountHistoryData[];
  playerCountSummary: PlayerCountSummary;
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
  serverIp: string;
  serverPort: number;
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
  mostActivePlayersByTimeWeek: MostActivePlayer[]; // Last 7 days
  mostActivePlayersByTimeMonth: MostActivePlayer[]; // Last 30 days
  mostActivePlayersByTimeAllTime: MostActivePlayer[]; // All time
  popularMaps: PopularMap[];
  serverGuid: string;
  serverName: string;
  startPeriod: string; // ISO date string
  topScoresWeek: TopScore[]; // Last 7 days
  topScoresMonth: TopScore[]; // Last 30 days
  topScoresAllTime: TopScore[]; // All time
  recentRounds: RecentRoundInfo[];
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  serverIp?: string;
  serverPort?: number;
  gameId?: string;
}

/**
 * Fetches server details from the API
 * @param serverName The name of the server to fetch details for
 * @returns Server details
 */
export async function fetchServerDetails(
  serverName: string
): Promise<ServerDetails> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<ServerDetails>(`/stats/servers/${encodeURIComponent(serverName)}`);

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching server details:', err);
    throw new Error('Failed to get server details');
  }
}

/**
 * Fetches server insights from the API
 * @param serverName The name of the server to fetch insights for
 * @param period The time period for insights (7d, 1m, 3m, 6m, 1y)
 * @returns Server insights including ping data
 */
export async function fetchServerInsights(
  serverName: string,
  period: string = '7d'
): Promise<ServerInsights> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<ServerInsights>(`/stats/servers/${encodeURIComponent(serverName)}/insights`, {
      params: { period }
    });

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching server insights:', err);
    throw new Error('Failed to get server insights');
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

// API response interface for servers endpoint
interface ServersResponse {
  servers: ServerSummary[];
  lastUpdated: string;
}

/**
 * Fetches all servers from backend API with caching support
 * @param game The game name used by the API
 * @returns All servers sorted by player count
 */
export async function fetchAllServers(
  game: 'bf1942' | 'fh2' | 'bfvietnam'
): Promise<ServerSummary[]> {
  try {
    const response = await axios.get<ServersResponse>(`/stats/liveservers/${game}/servers`);
    return response.data.servers;
  } catch (err) {
    console.error('Error fetching all servers:', err);
    throw new Error('Failed to get all servers');
  }
}

/**
 * Fetches live server data from backend API using cached endpoint
 * @param gameId The game ID ('fh2' for Forgotten Hope 2, 'bf1942' for BF1942, 'bfvietnam' for Battlefield Vietnam)
 * @param serverIp The IP address of the server
 * @param serverPort The port of the server
 * @returns Live server information including current leaderboard
 */
export async function fetchLiveServerData(
  gameId: string, 
  serverIp: string, 
  serverPort: number
): Promise<ServerSummary> {
  try {
    // Map gameId to the correct format for the API endpoint
    let game: string;
    switch (gameId.toLowerCase()) {
      case 'fh2':
        game = 'fh2';
        break;
      case 'bfvietnam':
      case 'bfv':
        game = 'bfvietnam';
        break;
      case 'bf1942':
      case '42':
      default:
        game = 'bf1942';
        break;
    }
    
    // Use the backend API endpoint with separate IP and port parameters
    const response = await axios.get<ServerSummary>(
      `/stats/liveservers/${game}/${serverIp}/${serverPort}`
    );
    
    return response.data;
  } catch (err) {
    console.error('Error fetching live server data:', err);
    throw new Error('Failed to get live server data');
  }
}