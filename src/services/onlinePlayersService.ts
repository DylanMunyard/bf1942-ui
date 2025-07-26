import axios from 'axios';
import {
  OnlinePlayerItem,
  OnlinePlayersResponse,
  OnlinePlayersFilters
} from '../types/onlinePlayersTypes';

/**
 * Fetches the comprehensive online players data
 * 
 * @param filters Optional filters to apply to the results
 * @returns Promise<OnlinePlayersResponse> Comprehensive online players data including players list, counts, and metadata
 */
export async function fetchOnlinePlayersList(filters?: OnlinePlayersFilters): Promise<OnlinePlayersResponse> {
  try {
    const response = await axios.get<OnlinePlayersResponse>('/stats/players/online', { 
      params: filters 
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching online players data:', err);
    throw new Error('Failed to get online players data');
  }
}

// Re-export types for convenience
export type { OnlinePlayerItem, OnlinePlayersResponse, OnlinePlayersFilters } from '../types/onlinePlayersTypes';