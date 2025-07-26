// Type definitions for online players service

export interface OnlinePlayerItem {
  playerName: string;
  sessionDurationMinutes: number;
  joinedAt: string; // ISO date string when player joined current session
  currentServer?: OnlineServerInfo;
}

export interface OnlineServerInfo {
  serverGuid: string;
  serverName: string;
  gameId: string; // '42', 'FH2', 'BFV'
  mapName?: string;
  sessionKills?: number;
  sessionDeaths?: number;
  currentScore?: number;
  ping?: number;
  teamName?: string;
}

// API request/response interfaces
export interface OnlinePlayersResponse {
  players: OnlinePlayerItem[];
  totalOnline: number;
  lastUpdated: string; // ISO date string
  gameBreakdown: {
    bf1942: number;
    fh2: number;
    bfv: number;
  };
}

// Filter interface for API requests
export interface OnlinePlayersFilters {
  gameId?: string; // Filter by specific game ('42', 'FH2', 'BFV')
  serverName?: string; // Filter by server name (partial match)
  playerName?: string; // Filter by player name (partial match)
  minSessionTime?: number; // Minimum session duration in minutes
  maxSessionTime?: number; // Maximum session duration in minutes
}