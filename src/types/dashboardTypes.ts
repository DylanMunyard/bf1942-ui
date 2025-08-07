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

export interface OfflineBuddy {
  playerName: string;
  lastSeen: string; // ISO date string
  lastSeenIso: string;
  totalPlayTimeMinutes: number;
  addedAt: string; // ISO date string
}

export interface DashboardResponse {
  onlineBuddies: OnlineBuddy[];
  favoriteServers: FavoriteServer[];
  offlineBuddies: OfflineBuddy[];
}