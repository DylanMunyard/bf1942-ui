import axios from 'axios';
import {
  PagedResult,
  PlayerTimeStatistics,
  PlayerListItem,
  SessionDetails,
  SessionListItem,
  TeamKillerMetric,
  SimilarPlayersResponse,
  InitialData,
  PlayerOnlineHistoryResponse
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
export async function fetchSessions(
  page: number = 1,
  pageSize: number = 10,
  filters: Record<string, string> = {},
  sortBy: string = 'startTime',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PagedResult<SessionListItem>> {
  try {
    // Build query parameters
    const params: Record<string, any> = {
      page,
      pageSize,
      sortBy,
      sortOrder,
      ...filters // Spread filter parameters into the query
    };

    // Make the request to the API endpoint
    const response = await axios.get<PagedResult<SessionListItem>>(
      '/stats/sessions',
      {
        params
      }
    );

    // Return the response data
    return response.data;
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


/**
 * Fetches team killer metrics from the analytics API
 * @returns List of team killer metrics
 */
export async function fetchTeamKillerMetrics(): Promise<TeamKillerMetric[]> {
  try {
    const response = await axios.get<TeamKillerMetric[]>(
      '/stats/realtimeanalytics/teamkillers'
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching team killer metrics:', err);
    throw new Error('Failed to get team killer metrics');
  }
}

/**
 * Fetch players with similar statistics to the specified player.
 * The backend computes a similarity score and provides reasons for the match.
 * @param playerName The player to find neighbours for
 * @param mode The detection mode: 'default' for similar players, 'aliasdetection' for aliases
 * @returns Full response with target player stats and similar players.
 */
export async function fetchSimilarPlayers(playerName: string, mode: 'default' | 'aliasdetection' = 'default'): Promise<SimilarPlayersResponse> {
  try {
    const response = await axios.get<SimilarPlayersResponse>(
      `/stats/players/${encodeURIComponent(playerName)}/similar`,
      {
        params: { mode }
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching similar players:', err);
    throw new Error('Failed to get similar players');
  }
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
 * @param period The time period ('1d', '3d', '7d') - defaults to '7d'
 * @returns Historical player count data
 */
export async function fetchPlayerOnlineHistory(
  game: 'bf1942' | 'fh2' | 'bfvietnam',
  period: '1d' | '3d' | '7d' = '7d'
): Promise<PlayerOnlineHistoryResponse> {
  try {
    const response = await axios.get<PlayerOnlineHistoryResponse>(
      `/stats/LiveServers/${game}/players-online-history`,
      {
        params: { period }
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching player online history:', err);
    throw new Error('Failed to get player online history');
  }
}