import axios from 'axios';
import { ServerInfo } from '../types/server';

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

// New interfaces for server insights
export interface PingByHourData {
  hour: number;
  averagePing: number;
  medianPing: number;
  p95Ping: number;
}

export interface PingByHour {
  data: PingByHourData[];
}

export interface ServerInsights {
  serverGuid: string;
  serverName: string;
  startPeriod: string; // ISO date string
  endPeriod: string; // ISO date string
  pingByHour: PingByHour;
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
  mostActivePlayersByTime: MostActivePlayer[];
  playerCountMetrics: PlayerCountMetric[];
  popularMaps: PopularMap[];
  serverGuid: string;
  serverName: string;
  startPeriod: string; // ISO date string
  topScores: TopScore[];
  lastRounds: RecentRoundInfo[];
  averagePlayerCountChangePercent?: number; // Change in player counts from last 7 days vs 7 days before that
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  serverIp?: string;
  serverPort?: number;
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
 * @returns Server insights including ping data
 */
export async function fetchServerInsights(
  serverName: string
): Promise<ServerInsights> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<ServerInsights>(`/stats/servers/${encodeURIComponent(serverName)}/insights`);

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
  servers: ServerInfo[];
  lastUpdated: string;
  cacheHit: boolean;
}

/**
 * Fetches all servers from backend API with caching support for ServerTable component
 * @param game The game name used by the API
 * @returns All servers sorted by player count
 */
export async function fetchAllServers(
  game: 'bf1942' | 'fh2'
): Promise<ServerInfo[]> {
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
 * @param gameId The game ID ('fh2' for Forgotten Hope 2, 'bf1942' for BF1942)
 * @param serverIp The IP address of the server
 * @param serverPort The port of the server
 * @returns Live server information including current leaderboard
 */
export async function fetchLiveServerData(
  gameId: string, 
  serverIp: string, 
  serverPort: number
): Promise<ServerInfo> {
  try {
    // Validate gameId and convert to the correct format for the new API
    const game = gameId === 'fh2' ? 'fh2' : 'bf1942';
    
    // Use the backend API endpoint with separate IP and port parameters
    const response = await axios.get<ServerInfo>(
      `/stats/liveservers/${game}/${serverIp}/${serverPort}`
    );
    
    return response.data;
  } catch (err) {
    console.error('Error fetching live server data:', err);
    throw new Error('Failed to get live server data');
  }
}