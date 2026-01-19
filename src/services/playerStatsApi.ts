import axios from 'axios';
import {
  PagedResult,
  PlayerTimeStatistics,
  PlayerListItem,
  SessionDetails,
  SessionListItem,
  InitialData,
  PlayerHistoryResponse
} from '../types/playerStatsTypes';

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
 * Fetches the list of all players from the API with pagination, sorting, and filtering
 * @param page The page number (1-based)
 * @param pageSize The number of items per page
 * @param sortBy The field to sort by
 * @param sortOrder The sort order ('asc' or 'desc')
 * @param filters Object containing filter parameters (e.g. { playerName: 'john', gameId: 'fh2' })
 * @returns Paged list of players
 */
export async function fetchPlayersList(
  page: number = 1,
  pageSize: number = 50,
  sortBy: string = 'lastSeen',
  sortOrder: 'asc' | 'desc' = 'desc',
  filters: Record<string, string> = {}
): Promise<PagedResult<PlayerListItem>> {
  try {
    // Build query parameters
    const params: Record<string, any> = {
      page,
      pageSize,
      sortBy,
      sortOrder,
      ...filters // Spread filter parameters into the query
    };

    // Make the request to the API endpoint with pagination, sorting, and filtering
    const response = await axios.get<PagedResult<PlayerListItem>>('/stats/players', {
      params
    });

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching players list:', err);
    throw new Error('Failed to get players list');
  }
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

/**
 * Fetches sessions with pagination support, filtering, and sorting
 * @param page The page number (1-based)
 * @param pageSize The number of items per page
 * @param filters Object containing filter parameters (e.g. { playerName: 'john', mapName: 'Berlin', serverName: 'Server 1' })
 * @param sortBy The field to sort by (default: 'startTime')
 * @param sortOrder The sort order ('asc' or 'desc', default: 'desc')
 * @returns Paged result of session list items
 */
// Import types from rounds service
import { RoundPagedResult } from './roundsService';

// Interface for rounds response with nested player data
interface RoundWithPlayers {
  roundId: string;
  serverName: string;
  serverGuid: string;
  mapName: string;
  gameType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  participantCount: number;
  isActive: boolean;
  team1Label?: string;
  team2Label?: string;
  players?: {
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
  }[];
}

export async function fetchSessions(
  page: number = 1,
  pageSize: number = 10,
  filters: Record<string, string | string[]> = {},
  sortBy: string = 'startTime',
  sortOrder: 'asc' | 'desc' = 'desc',
  onlySpecifiedPlayers: boolean = false
): Promise<PagedResult<SessionListItem>> {
  try {
    // Handle parameter mapping for the rounds API
    const roundFilters: Record<string, any> = { ...filters };
    
    // Map old parameter names to new ones
    if (filters.lastSeenFrom) {
      roundFilters.endTimeFrom = filters.lastSeenFrom;
      delete roundFilters.lastSeenFrom;
    }
    if (filters.lastSeenTo) {
      roundFilters.endTimeTo = filters.lastSeenTo;
      delete roundFilters.lastSeenTo;
    }
    if (filters.minPlayTime) {
      roundFilters.minDuration = filters.minPlayTime;
      delete roundFilters.minPlayTime;
    }
    if (filters.maxPlayTime) {
      roundFilters.maxDuration = filters.maxPlayTime;
      delete roundFilters.maxPlayTime;
    }

    // Build query parameters
    const params: Record<string, any> = {
      page,
      pageSize,
      sortBy,
      sortOrder,
      includeTopPlayers: true, // Include top 3 players for each round
      onlySpecifiedPlayers,
      ...roundFilters
    };

    // Make the request to the new rounds API endpoint
    const response = await axios.get<RoundPagedResult<RoundWithPlayers>>(
      '/stats/rounds',
      {
        params,
        paramsSerializer: {
          indexes: null // This prevents axios from adding [] to array parameters
        }
      }
    );

    // Return the API response directly
    return {
      items: response.data.items,
      page: response.data.currentPage,
      pageSize: pageSize,
      totalItems: response.data.totalItems,
      totalPages: response.data.totalPages
    };

  } catch (err) {
    console.error('Error fetching sessions:', err);
    throw new Error('Failed to get sessions');
  }
}

/**
 * Fetches all sessions for a player with pagination support, filtering, and sorting
 * @param playerName The name of the player
 * @param page The page number (1-based)
 * @param pageSize The number of items per page
 * @param filters Object containing filter parameters (e.g. { mapName: 'Berlin', serverName: 'Server 1' })
 * @param sortBy The field to sort by (default: 'startTime')
 * @param sortOrder The sort order ('asc' or 'desc', default: 'desc')
 * @returns Paged result of session list items
 */
export async function fetchPlayerSessions(
  playerName: string,
  page: number = 1,
  pageSize: number = 10,
  filters: Record<string, string> = {},
  sortBy: string = 'startTime',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PagedResult<SessionListItem>> {
  // Add playerName to filters and call the generic fetchSessions function
  const filtersWithPlayer = { ...filters, playerName };
  return fetchSessions(page, pageSize, filtersWithPlayer, sortBy, sortOrder);
}


// Cache for initial data
let initialDataCache: InitialData | null = null;
let initialDataCacheTimestamp: number | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetches initial application data including badge definitions
 * This data is cached client-side as it rarely changes
 * @returns Initial application data containing badge definitions
 */
export async function fetchInitialData(): Promise<InitialData> {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (initialDataCache && initialDataCacheTimestamp && (now - initialDataCacheTimestamp) < CACHE_DURATION) {
      return initialDataCache;
    }

    // Fetch fresh data from API
    const response = await axios.get<InitialData>('/stats/app/initialdata');
    
    // Update cache
    initialDataCache = response.data;
    initialDataCacheTimestamp = now;
    
    return response.data;
  } catch (err) {
    console.error('Error fetching initial data:', err);
    throw new Error('Failed to get initial data');
  }
}

/**
 * Clear the initial data cache (useful for testing or force refresh)
 */
export function clearInitialDataCache(): void {
  initialDataCache = null;
  initialDataCacheTimestamp = null;
}

/**
 * Fetches historical player count data for a specific game
 * @param game The game type ('bf1942', 'fh2', 'bfvietnam')
 * @param period The time period ('1d', '3d', '7d', '1month', '3months', 'thisyear', 'alltime') - defaults to '7d'
 * @param rollingWindow The rolling window for averaging in days (7, 14, 30) - defaults to 7
 * @returns Historical player count data
 */
export async function fetchPlayerOnlineHistory(
  game: 'bf1942' | 'fh2' | 'bfvietnam',
  period: string = '7d',
  rollingWindow: number = 7
): Promise<PlayerHistoryResponse> {
  try {
    const response = await axios.get<PlayerHistoryResponse>(
      `/stats/v2/liveservers/${game}/players-online-history`,
      {
        params: { period, rollingWindowDays: rollingWindow }
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching player online history:', err);
    throw new Error('Failed to get player online history');
  }
}