// Type definitions for player statistics service

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  playerInfo?: PlayerContextInfo;
}

export interface PlayerContextInfo {
  name: string;
  totalPlayTimeMinutes: number;
  firstSeen: string; // ISO date string
  lastSeen: string; // ISO date string
  isActive: boolean;
  totalSessions: number;
  totalKills: number;
  totalDeaths: number;
  currentServer?: ServerInfo;
}

export interface SessionListItem {
  sessionId: number;
  serverName: string;
  serverGuid: string;
  mapName: string;
  gameType: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  durationMinutes: number;
  score: number;
  kills: number;
  deaths: number;
  isActive: boolean;
}

export interface PlayerListItem {
  playerName: string;
  totalPlayTimeMinutes: number;
  lastSeen: string; // ISO date string
  isActive: boolean;
  currentServer?: ServerInfo;
}

export interface ServerInfo {
  serverGuid: string;
  serverName: string;
  sessionKills?: number;
  sessionDeaths?: number;
  mapName?: string;
  gameId?: string;
}

export interface Session {
  startTime: string; // ISO date string
  lastSeenTime: string; // ISO date string
  isActive: boolean;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  mapName: string;
  gameType: string;
  serverName: string;
  serverGuid: string;
  sessionId: number;
}

export interface ActivityByHour {
  formattedHour: string;
  hour: number;
  minutesActive: number;
}

export interface BestKillMap {
  kdRatio: number;
  mapName: string;
  totalDeaths: number;
  totalKills: number;
}

export interface MapPlayTime {
  mapName: string;
  minutesPlayed: number;
  kdRatio: number;
  totalDeaths: number;
  totalKills: number;
}

export interface ServerPlayTime {
  minutesPlayed: number;
  serverGuid: string;
  serverName: string;
}

export interface ServerRanking {
  serverGuid: string;
  serverName: string;
  rank: number;
  totalScore: number;
  totalRankedPlayers: number;
  rankDisplay: string;
  scoreDisplay: string;
  averagePing: number;
}

export interface PlayerInsights {
  activityByHour: ActivityByHour[];
  bestKillMap?: BestKillMap;
  endPeriod: string; // ISO date string
  favoriteMaps: MapPlayTime[];
  playerName: string;
  serverPlayTimes: ServerPlayTime[];
  serverRankings: ServerRanking[];
  startPeriod: string; // ISO date string
}

export interface KillMilestone {
  milestone: number;
  achievedDate: string; // ISO date string
  totalKillsAtMilestone: number;
  daysToAchieve: number;
}

// Add BestScore interface
export interface BestScore {
  serverGuid: string;
  serverName: string;
  bestScore: number;
  totalKills: number;
  totalDeaths: number;
  playTimeMinutes: number;
  bestScoreDate: string; // ISO date string
  mapName: string;
  sessionId: number;
}

export interface PlayerTimeStatistics {
  totalPlayTimeMinutes: number;
  totalSessions: number;
  firstPlayed: string; // ISO date string
  lastPlayed: string; // ISO date string
  highestScore: number;
  totalKills: number;
  totalDeaths: number;
  isActive: boolean;
  currentServer: ServerInfo | null;
  bestSession: Session | null;
  servers: PlayerServerStats[];
  recentSessions: Session[];
  insights?: PlayerInsights;
  killMilestones: KillMilestone[];
}

// New interface for server stats in PlayerTimeStatistics
export interface PlayerServerStats {
  serverGuid: string;
  serverName: string;
  gameId: string;
  totalMinutes: number;
  totalKills: number;
  totalDeaths: number;
  highestScore: number;
  killsPerMinute: number;
  totalRounds: number;
  kdRatio: number;
  // Optional: for navigation to best score round report
  bestScoreDate?: string;
  mapName?: string;
  // New fields for best score round report navigation
  highestScoreSessionId?: string;
  highestScoreMapName?: string;
  highestScoreStartTime?: string;
}

export interface TeamKillerMetric {
  serverName: string;
  serverGuid: string;
  playerName: string;
  teamName: string;
  mapName: string;
  currentScore: number;
  currentKills: number;
  currentDeaths: number;
  unexplainedDropsLast10Min: number;
  totalPenaltiesLast10Min: number;
  tkProbability: number;
  lastActivity: string; // ISO date string
}

export interface SimilarPlayer {
  playerName: string;
  totalKills: number;
  totalDeaths: number;
  totalPlayTimeMinutes: number;
  killDeathRatio: number;
  favoriteServerGuid?: string;
  similarityScore: number;
  similarityReasons: string[];
}

export interface SimilarPlayersResponse {
  targetPlayer: string;
  targetPlayerStats: Partial<PlayerTimeStatistics> & { playerName: string };
  similarPlayers: SimilarPlayer[];
}

export interface SessionObservation {
  deaths: number;
  kills: number;
  ping: number;
  score: number;
  teamLabel: string;
  timestamp: string; // ISO date string
}

export interface PlayerDetails {
  firstSeen: string; // ISO date string
  isAiBot: boolean;
  lastSeen: string; // ISO date string
  name: string;
  totalPlayTimeMinutes: number;
}

export interface ServerDetails {
  address: string;
  country: string;
  countryCode: string;
  gameId: string;
  guid: string;
  maxPlayers: number;
  name: string;
  port: number;
}

export interface SessionDetails {
  endTime: string | null; // ISO date string or null if session is active
  gameType: string;
  isActive: boolean;
  mapName: string;
  observations: SessionObservation[];
  playerDetails: PlayerDetails;
  playerName: string;
  serverDetails: ServerDetails;
  serverName: string;
  sessionId: number;
  startTime: string; // ISO date string
  totalDeaths: number;
  totalKills: number;
  totalPlayTimeMinutes: number;
  totalScore: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  tier: string;
  category: string;
  description: string;
}

export interface InitialData {
  badgeDefinitions: BadgeDefinition[];
  categories: string[];
  tiers: string[];
  generatedAt: string;
}