import axios from 'axios';

// Default to environment variable or fallback to a default value
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface PrometheusDataPoint {
  timestamp: number;
  value: number;
}

// Common function to process Prometheus response
function processPrometheusResponse(response: any): PrometheusDataPoint[] {
  if (response.data.status === 'success' && response.data.data.result.length > 0) {
    const result = response.data.data.result[0];

    // Transform the data for the chart
    return result.values.map((point: [number, string]) => ({
      timestamp: point[0],
      value: parseFloat(point[1])
    }));
  }

  return [];
}

/**
 * Fetches player count data from Prometheus for a specific server
 * @param serverName The name of the server to fetch data for
 * @param game The game type ('bf1942', 'fh2', or 'bfvietnam')
 * @returns Array of data points with timestamp and value for the last 7 days
 */
export async function fetchServerPlayerData(
  serverName: string,
  game: string
): Promise<PrometheusDataPoint[]> {
  try {
    // Make the request to the secure backend API endpoint
    // This endpoint fetches data for the last 7 days
    const response = await axios.get(`${API_BASE_URL}/api/prometheus/server_players`, {
      params: {
        serverName,
        game
      }
    });

    return processPrometheusResponse(response);
  } catch (err) {
    console.error('Error fetching Prometheus data:', err);
    throw new Error('Failed to fetch chart data');
  }
}
