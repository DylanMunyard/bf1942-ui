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
  playerName: string;
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
  roundId: string; // Added for round report navigation
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

export interface TrendDataPoint {
  timestamp: string; // ISO date string
  value: number;
}

export interface RecentStats {
  analysisPeriodStart: string; // ISO date string
  analysisPeriodEnd: string; // ISO date string
  totalRoundsAnalyzed: number;
  kdRatioTrend: TrendDataPoint[];
  killRateTrend: TrendDataPoint[];
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
  recentStats?: RecentStats;
  bestScores?: BestScores;
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
  highestScoreRoundId?: string;
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
  requirements?: {
    [key: string]: any;
    performance_tiers?: {
      legend?: string;
      gold?: string;
      silver?: string;
      bronze?: string;
    };
  };
}

// Achievement system interfaces
export interface PlayerAchievementSummary {
  playerName: string;
  recentAchievements: Achievement[];
  allBadges: Achievement[];
  milestones: Achievement[];
  teamVictories: Achievement[];
  bestStreaks: KillStreakStats;
  lastCalculated: string; // DateTime in ISO format
}

export interface PlayerAchievementGroup {
  achievementId: string;
  achievementName: string;
  achievementType: string;
  tier: string;
  game: string;
  count: number;
  latestValue: number;
  latestAchievedAt: string; // DateTime in ISO format
}

export interface Achievement {
  playerName: string;
  achievementType: string; // 'kill_streak', 'badge', 'milestone', 'ranking', 'round_placement', 'team_victory'
  achievementId: string;   // e.g., 'kill_streak_15', 'sharpshooter_gold'
  achievementName: string;
  tier: string;           // 'bronze', 'silver', 'gold', 'legend'
  value: number;
  achievedAt: string;     // DateTime in ISO format
  processedAt: string;    // DateTime in ISO format
  serverGuid: string;
  mapName: string;
  roundId: string;
  metadata: string;       // JSON string for additional context
  game: string;           // 'bf1942', 'fh2', 'bfvietnam'
  version: string;        // DateTime in ISO format for deduplication
}

export interface KillStreakStats {
  bestSingleRoundStreak: number;
  bestStreakMap: string;
  bestStreakServer: string;
  bestStreakDate: string; // DateTime in ISO format
  recentStreaks: KillStreak[];
}

export interface KillStreak {
  playerName: string;
  streakCount: number;
  streakStart: string;    // DateTime in ISO format
  streakEnd: string;      // DateTime in ISO format
  serverGuid: string;
  mapName: string;
  roundId: string;
  isActive: boolean;
}

// Notification interfaces
export interface BuddyNotificationMessage {
  type: string;           // 'buddy_online' or 'server_map_change'
  buddyName?: string;     // Present for buddy notifications
  serverName: string;
  mapName: string;
  joinLink?: string;      // Present for server map change notifications
  timestamp: string;      // DateTime in ISO format
  message: string;        // Human-readable message
}

export interface BestScoreEntry {
  score: number;
  kills: number;
  deaths: number;
  mapName: string;
  serverName: string;
  serverGuid: string;
  timestamp: string;
  roundId: string;
}

export interface BestScores {
  thisWeek: BestScoreEntry[];
  last30Days: BestScoreEntry[];
  allTime: BestScoreEntry[];
}

export interface SiteNotice {
  id: string;           // UUID for dismiss tracking
  content: string;      // Markdown content
  type: 'info' | 'warning' | 'success' | 'error';
  dismissible: boolean;
  expiresAt?: string;   // ISO date (optional)
  createdAt: string;    // ISO date
}

export interface InitialData {
  badgeDefinitions: BadgeDefinition[];
  categories: string[];
  tiers: string[];
  generatedAt: string;
  siteNotice?: SiteNotice | null;
}

export interface PlayerHistoryDataPoint {
  timestamp: string; // ISO date string
  totalPlayers: number;
}

export interface RollingAverageDataPoint {
  timestamp: string; // ISO date string
  average: number;
}

export interface PlayerHistoryInsights {
  overallAverage: number;
  rollingAverage: RollingAverageDataPoint[];
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  peakPlayers: number;
  peakTimestamp: string;
  lowestPlayers: number;
  lowestTimestamp: string;
  calculationMethod?: string;
}

export interface PlayerHistoryResponse {
  dataPoints: PlayerHistoryDataPoint[];
  insights: PlayerHistoryInsights;
  period: string;
  game: string;
  lastUpdated: string;
}

// Server ranking by total playtime
export interface ServerRank {
  serverGuid: string;
  rank: number;
  totalPlayTimeMinutes: number;
}

export interface PlayerOnlineHistoryResponse {
  dataPoints: PlayerHistoryDataPoint[];
  period: string;
  game: string;
  lastUpdated: string; // ISO date string
}