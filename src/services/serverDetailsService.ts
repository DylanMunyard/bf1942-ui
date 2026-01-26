import axios from 'axios';
import { ServerSummary } from '../types/server';
import { ServerRank } from '../types/playerStatsTypes';

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
  averagePlayerCount: number;
  peakPlayerCount: number;
  totalPlayTime: number;
  playTimePercentage: number;
}

export interface TopScore {
  deaths: number;
  kills: number;
  mapName: string;
  playerName: string;
  score: number;
  killRate?: number;
  kdRatio?: number;
  totalRounds?: number;
  sessionId: number;
  timestamp: string; // ISO date string
}

export interface TopPlacement {
  rank: number;
  playerName: string;
  firstPlaces: number;
  secondPlaces: number;
  thirdPlaces: number;
  totalPlacements: number;
  placementPoints: number;
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
  playerCountHistoryComparison?: PlayerCountHistoryData[];
  playersOnlineHistory?: {
    dataPoints: { timestamp: string; totalPlayers: number; }[];
    insights: {
      overallAverage: number;
      rollingAverage: { timestamp: string; average: number; }[];
      trendDirection: 'increasing' | 'decreasing' | 'stable';
      percentageChange: number;
      peakPlayers: number;
      peakTimestamp: string;
      lowestPlayers: number;
      lowestTimestamp: string;
      calculationMethod?: string;
    };
    period: string;
    game: string;
    lastUpdated: string;
  };
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
  serverName: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  totalParticipants: number;
  isActive: boolean;
  tickets1?: number;
  tickets2?: number;
  team1Label?: string;
  team2Label?: string;
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
  round: RoundInfo;
  leaderboardSnapshots: LeaderboardSnapshot[];
}

export interface LeaderboardsData {
  serverGuid: string;
  serverName: string;
  timePeriod: string; // "week", "month", or "alltime"
  startPeriod: string; // ISO date string
  endPeriod: string; // ISO date string
  mostActivePlayersByTime: MostActivePlayer[];
  topScores: TopScore[];
  topKDRatios: TopScore[];
  topKillRates: TopScore[];
  topPlacements: TopPlacement[];
  weightedTopPlacements?: TopPlacement[];
  minPlayersForWeighting?: number;
}

export interface ServerDetails {
  endPeriod: string; // ISO date string
  popularMaps: PopularMap[];
  serverGuid: string;
  serverName: string;
  startPeriod: string; // ISO date string
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
    const url = `/stats/servers/${encodeURIComponent(serverName)}`;
    const response = await axios.get<ServerDetails>(url);
    return response.data;
  } catch (err) {
    console.error('Error fetching server details:', err);
    throw new Error('Failed to get server details');
  }
}

/**
 * Fetches server leaderboards from the API
 * @param serverName The name of the server to fetch leaderboards for
 * @param timePeriod The time period: 'week', 'month', or 'alltime'
 * @param minPlayersForWeighting Optional minimum players required for weighted placements
 * @param minRoundsForKillBoards Optional minimum rounds required for kill rate and K/D ratio leaderboards
 * @returns Server leaderboards data
 */
export async function fetchServerLeaderboards(
  serverName: string,
  timePeriod: 'week' | 'month' | 'alltime',
  minPlayersForWeighting?: number,
  minRoundsForKillBoards?: number
): Promise<LeaderboardsData> {
  try {
    const params = new URLSearchParams();

    // Map time period to API parameter
    if (timePeriod === 'alltime') {
      // Calculate days from current date back to Jan 1, 2025
      const startDate = new Date('2025-01-01');
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      params.set('days', diffDays.toString());
    } else if (timePeriod === 'week') {
      params.set('days', '7');
    } else if (timePeriod === 'month') {
      params.set('days', '30');
    }

    if (minPlayersForWeighting !== undefined) {
      params.set('minPlayersForWeighting', minPlayersForWeighting.toString());
    }

    if (minRoundsForKillBoards !== undefined) {
      params.set('minRoundsForKillBoards', minRoundsForKillBoards.toString());
    }

    const url = `/stats/v2/servers/${encodeURIComponent(serverName)}/leaderboards?${params.toString()}`;
    const response = await axios.get<LeaderboardsData>(url);
    return response.data;
  } catch (err) {
    console.error('Error fetching server leaderboards:', err);
    throw new Error('Failed to get server leaderboards');
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
  period: number = 1,
  rollingWindow: string = '7d'
): Promise<ServerInsights> {
  try {
    // Convert rolling window to days (e.g., '7d' -> 7)
    const rollingWindowDays = parseInt(rollingWindow.replace('d', ''));
    
    // Make the request to the API endpoint
    const response = await axios.get<ServerInsights>(`/stats/servers/${encodeURIComponent(serverName)}/insights`, {
      params: { 
        days: period,
        rollingWindowDays: rollingWindowDays
      }
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
 * @param roundId The ID of the round
 * @returns Round report with leaderboard snapshots and achievements
 */
export async function fetchRoundReport(roundId: string): Promise<RoundReport> {
  try {
    // Make the request to the API endpoint
    const response = await axios.get<RoundReport>(`/stats/rounds/${encodeURIComponent(roundId)}/report`);

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching round report:', err);
    throw new Error('Failed to get round report');
  }
}

/**
 * Fetches server rankings by total playtime for the last N days
 * @param serverGuids List of server GUIDs to get rankings for
 * @param days Number of days to look back (default: 30)
 * @returns List of server rankings
 */
export async function fetchServerRankings(
  serverGuids: string[],
  days: number = 30
): Promise<ServerRank[]> {
  try {
    const params = new URLSearchParams();
    serverGuids.forEach(guid => params.append('serverGuids', guid));
    params.set('days', days.toString());

    const response = await axios.get<ServerRank[]>(
      `/stats/servers/rankings?${params.toString()}`
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching server rankings:', err);
    throw new Error('Failed to get server rankings');
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

// === Server Busy Indicator / Trends (per-server) ===

export type BusyLevel = 'very_busy' | 'busy' | 'moderate' | 'quiet' | 'very_quiet';

export interface ServerBusyHistoricalRange {
  min: number;
  q25: number;
  median: number;
  q75: number;
  q90: number;
  max: number;
  average: number;
}

export interface ServerBusyIndicator {
  busyLevel: BusyLevel;
  busyText: string;
  currentPlayers: number;
  typicalPlayers: number;
  percentile: number;
  historicalRange: ServerBusyHistoricalRange;
  generatedAt: string; // ISO datetime
}

export interface ServerHourlyTimelineEntry {
  hour: number; // UTC hour 0-23
  typicalPlayers: number;
  busyLevel: BusyLevel;
  isCurrentHour: boolean;
}

export interface ServerBusyIndicatorResult {
  serverGuid: string;
  serverName: string;
  game: string;
  busyIndicator: ServerBusyIndicator;
  hourlyTimeline: ServerHourlyTimelineEntry[];
}

export interface ServerBusyIndicatorResponse {
  serverResults: ServerBusyIndicatorResult[];
  generatedAt: string;
}

/**
 * Fetch busy indicators and hourly timelines for a list of server GUIDs.
 * The API expects repeated serverGuids query params (no [] array notation).
 */
export async function fetchServerBusyIndicators(serverGuids: string[]): Promise<ServerBusyIndicatorResponse> {
  if (!serverGuids || serverGuids.length === 0) {
    return { serverResults: [], generatedAt: new Date().toISOString() };
  }

  // Build query string with repeated keys
  const query = serverGuids.map(g => `serverGuids=${encodeURIComponent(g)}`).join('&');
  const url = `/stats/v2/game-trends/busy-indicator?${query}`;

  try {
    const response = await axios.get<ServerBusyIndicatorResponse>(url);
    return response.data;
  } catch (err) {
    console.error('Error fetching server busy indicators:', err);
    throw new Error('Failed to get server busy indicators');
  }
}