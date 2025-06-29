import axios from 'axios';

// Define interfaces for the Rounds API response
export interface RoundPagedResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  serverContext?: ServerContextInfo;
}

export interface ServerContextInfo {
  serverName: string;
  serverGuid: string;
}

export interface RoundListItem {
  roundId: string;
  serverName: string;
  serverGuid: string;
  mapName: string;
  gameType: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  durationMinutes: number;
  participantCount: number;
  totalSessions: number;
  isActive: boolean;
}

/**
 * Fetches the list of all rounds from the API with pagination, sorting, and filtering
 * @param page The page number (1-based)
 * @param pageSize The number of items per page
 * @param sortBy The field to sort by
 * @param sortOrder The sort order ('asc' or 'desc')
 * @param filters Object containing filter parameters (e.g. { serverName: 'Server 1', mapName: 'Berlin' })
 * @returns Paged list of rounds
 */
export async function fetchRoundsList(
  page: number = 1,
  pageSize: number = 50,
  sortBy: string = 'startTime',
  sortOrder: 'asc' | 'desc' = 'desc',
  filters: Record<string, string> = {}
): Promise<RoundPagedResult<RoundListItem>> {
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
    const response = await axios.get<RoundPagedResult<RoundListItem>>('/stats/rounds', {
      params
    });

    // Return the response data
    return response.data;
  } catch (err) {
    console.error('Error fetching rounds list:', err);
    throw new Error('Failed to get rounds list');
  }
}