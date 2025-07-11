import axios from 'axios';
import {
  PagedResult,
  PlayerTimeStatistics,
  PlayerListItem,
  SessionDetails,
  SessionListItem,
  TeamKillerMetric,
  SimilarPlayer,
  SimilarPlayersResponse
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
      `/stats/players/${encodeURIComponent(playerName)}/sessions`,
      {
        params
      }
    );

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching player sessions:', err);
    throw new Error('Failed to get player sessions');
  }
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
 * @returns An array of players ordered by similarity.
 */
export async function fetchSimilarPlayers(playerName: string): Promise<SimilarPlayer[]> {
  try {
    const response = await axios.get<SimilarPlayersResponse>(
      `/stats/players/${encodeURIComponent(playerName)}/similar`
    );
    return response.data.similarPlayers;
  } catch (err) {
    console.error('Error fetching similar players:', err);
    throw new Error('Failed to get similar players');
  }
}