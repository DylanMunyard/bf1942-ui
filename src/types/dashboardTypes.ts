// Type definitions for dashboard service

export interface OnlineBuddy {
  playerName: string;
  serverName: string;
  serverGuid: string;
  currentMap: string;
  joinLink: string;
  sessionDurationMinutes: number;
  currentScore: number;
  currentKills: number;
  currentDeaths: number;
  joinedAt: string; // ISO date string
}

export interface FavoriteServer {
  id: number;
  serverGuid: string;
  serverName: string;
  currentPlayers: number;
  maxPlayers: number;
  currentMap: string;
  joinLink: string;
}

export interface DashboardResponse {
  onlineBuddies: OnlineBuddy[];
  favoriteServers: FavoriteServer[];
}

// Future offline buddy data (when available)
export interface OfflineBuddy {
  playerName: string;
  lastSeenAt: string; // ISO date string
  lastSeenServer?: string;
}