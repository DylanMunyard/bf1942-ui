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
  gameId: string; // '42', 'FH2', 'BFV', or custom mod IDs
  mapName?: string;
  sessionKills?: number;
  sessionDeaths?: number;
  currentScore?: number;
  ping?: number;
  teamName?: string;
}

// API request/response interfaces
export interface OnlinePlayersResponse {
  items: OnlinePlayerItem[]; // Changed from 'players' to 'items'
  page: number; // Changed from 'currentPage' to 'page'
  pageSize: number;
  totalItems: number; // Changed from 'totalOnline' to 'totalItems'
  totalPages: number;
  playerInfo: any; // Added missing property from API response
}

// Filter interface for API requests
export interface OnlinePlayersFilters {
  /** Unified search across player and server names */
  search?: string;
  gameId?: string; // Filter by specific game ('42', 'FH2', 'BFV', or custom mod IDs)
  serverName?: string; // Filter by server name (partial match)
  playerName?: string; // Filter by player name (partial match)
  minSessionTime?: number; // Minimum session duration in minutes
  maxSessionTime?: number; // Maximum session duration in minutes
  page?: number; // Page number (1-based)
  pageSize?: number; // Number of items per page
}