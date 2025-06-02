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

export interface ServerDetails {
  endPeriod: string; // ISO date string
  mostActivePlayersByTime: MostActivePlayer[];
  playerCountMetrics: PlayerCountMetric[];
  popularMaps: PopularMap[];
  serverGuid: string;
  serverName: string;
  startPeriod: string; // ISO date string
  topScores: TopScore[];
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