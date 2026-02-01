import { RoundReport, LeaderboardSnapshot, LeaderboardEntry } from '../services/serverDetailsService';

// Enhanced battle event types
export type BattleEventType =
  | 'kill'
  | 'death'
  | 'objective'
  | 'spawn'
  | 'first_blood'
  | 'killing_spree'
  | 'spree_ended'
  | 'lead_change'
  | 'domination'
  | 'revenge'
  | 'system';

export interface BattleEvent {
  timestamp: string;
  type: BattleEventType;
  player: string;
  target?: string;
  message: string;
  color: string;
  icon: string;
  isHighlight: boolean;
  value?: number;  // For streaks, point values, etc.
}

export interface BattleHighlight {
  type: 'first_blood' | 'killing_spree' | 'lead_change' | 'comeback' | 'domination' | 'mvp';
  timestamp: string;
  playerName: string;
  description: string;
  value?: number;
  icon: string;
}

export interface RoundSummary {
  duration: string;
  durationMs: number;
  totalKills: number;
  totalDeaths: number;
  participants: number;
  avgKD: number;
  leadChanges: number;
  closestGap: number;
  mvp: {
    playerName: string;
    score: number;
    kills: number;
    deaths: number;
    kd: number;
  } | null;
  longestStreak: {
    playerName: string;
    streak: number;
  } | null;
  firstBlood: {
    playerName: string;
    timestamp: string;
  } | null;
}

// Track player state across snapshots
interface PlayerState {
  kills: number;
  deaths: number;
  score: number;
  currentStreak: number;
  bestStreak: number;
  killsBy: Record<string, number>;  // Track who killed this player
  killedBy: Record<string, number>; // Track who this player killed
}

// Track team state for lead changes
interface TeamState {
  totalScore: number;
  playerCount: number;
}

const STREAK_THRESHOLDS = {
  KILLING_SPREE: 3,
  RAMPAGE: 5,
  DOMINATING: 7,
  UNSTOPPABLE: 10,
  GODLIKE: 15,
};

const STREAK_NAMES: Record<number, { name: string; icon: string }> = {
  3: { name: 'KILLING SPREE', icon: '🔥' },
  5: { name: 'RAMPAGE', icon: '💥' },
  7: { name: 'DOMINATING', icon: '⚡' },
  10: { name: 'UNSTOPPABLE', icon: '🌟' },
  15: { name: 'GODLIKE', icon: '👑' },
};

function getStreakInfo(streak: number): { name: string; icon: string } | null {
  const thresholds = Object.keys(STREAK_NAMES).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (streak >= threshold) {
      return STREAK_NAMES[threshold];
    }
  }
  return null;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function generateBattleReport(roundReport: RoundReport): {
  events: BattleEvent[];
  highlights: BattleHighlight[];
  summary: RoundSummary;
} {
  const events: BattleEvent[] = [];
  const highlights: BattleHighlight[] = [];
  const snapshots = roundReport.leaderboardSnapshots;

  if (!snapshots || snapshots.length === 0) {
    return {
      events: [],
      highlights: [],
      summary: createEmptySummary(),
    };
  }

  // Player state tracking
  const playerStates: Record<string, PlayerState> = {};

  // Team tracking for lead changes
  let previousLeadTeam: string | null = null;
  let leadChanges = 0;
  let closestGap = Infinity;

  // First blood tracking
  let firstBloodPlayer: string | null = null;
  let firstBloodTimestamp: string | null = null;

  // Add round start event
  events.push({
    timestamp: roundReport.round.startTime,
    type: 'system',
    player: 'SYSTEM',
    message: `Battle begins on ${roundReport.round.mapName}`,
    color: 'text-cyan-400',
    icon: '🚁',
    isHighlight: false,
  });

  // Process each snapshot
  for (let i = 1; i < snapshots.length; i++) {
    const prevSnapshot = snapshots[i - 1];
    const currentSnapshot = snapshots[i];
    const timestamp = currentSnapshot.timestamp;

    // Calculate team scores for lead change detection
    const teamScores = calculateTeamScores(currentSnapshot.entries);
    const teamNames = Object.keys(teamScores);

    if (teamNames.length >= 2) {
      const sortedTeams = teamNames.sort((a, b) => teamScores[b].totalScore - teamScores[a].totalScore);
      const leadTeam = sortedTeams[0];
      const gap = teamScores[sortedTeams[0]].totalScore - teamScores[sortedTeams[1]].totalScore;

      closestGap = Math.min(closestGap, gap);

      // Detect lead change
      if (previousLeadTeam !== null && previousLeadTeam !== leadTeam && gap > 50) {
        leadChanges++;
        events.push({
          timestamp,
          type: 'lead_change',
          player: 'SYSTEM',
          message: `${leadTeam} takes the lead!`,
          color: 'text-purple-400',
          icon: '📈',
          isHighlight: true,
          value: gap,
        });

        highlights.push({
          type: 'lead_change',
          timestamp,
          playerName: leadTeam,
          description: `${leadTeam} takes the lead with ${gap} point advantage`,
          value: gap,
          icon: '📈',
        });
      }
      previousLeadTeam = leadTeam;
    }

    // Process each player in current snapshot
    for (const currentPlayer of currentSnapshot.entries) {
      const prevPlayer = prevSnapshot.entries.find(p => p.playerName === currentPlayer.playerName);

      // Initialize player state if new
      if (!playerStates[currentPlayer.playerName]) {
        playerStates[currentPlayer.playerName] = {
          kills: 0,
          deaths: 0,
          score: 0,
          currentStreak: 0,
          bestStreak: 0,
          killsBy: {},
          killedBy: {},
        };
      }

      const state = playerStates[currentPlayer.playerName];

      if (prevPlayer) {
        const killsDiff = currentPlayer.kills - prevPlayer.kills;
        const deathsDiff = currentPlayer.deaths - prevPlayer.deaths;
        const scoreDiff = currentPlayer.score - prevPlayer.score;

        // Process kills
        if (killsDiff > 0) {
          // Check for first blood
          if (!firstBloodPlayer) {
            firstBloodPlayer = currentPlayer.playerName;
            firstBloodTimestamp = timestamp;

            events.push({
              timestamp,
              type: 'first_blood',
              player: currentPlayer.playerName,
              message: `FIRST BLOOD! ${currentPlayer.playerName} draws first blood!`,
              color: 'text-red-500',
              icon: '🩸',
              isHighlight: true,
            });

            highlights.push({
              type: 'first_blood',
              timestamp,
              playerName: currentPlayer.playerName,
              description: `${currentPlayer.playerName} draws first blood`,
              icon: '🩸',
            });
          }

          // Update streak
          state.currentStreak += killsDiff;
          state.bestStreak = Math.max(state.bestStreak, state.currentStreak);

          // Check for streak milestones
          const streakInfo = getStreakInfo(state.currentStreak);
          const prevStreakInfo = getStreakInfo(state.currentStreak - killsDiff);

          if (streakInfo && (!prevStreakInfo || streakInfo.name !== prevStreakInfo.name)) {
            events.push({
              timestamp,
              type: 'killing_spree',
              player: currentPlayer.playerName,
              message: `${streakInfo.icon} ${streakInfo.name}! ${currentPlayer.playerName} is on a ${state.currentStreak} kill streak!`,
              color: 'text-orange-400',
              icon: streakInfo.icon,
              isHighlight: true,
              value: state.currentStreak,
            });

            highlights.push({
              type: 'killing_spree',
              timestamp,
              playerName: currentPlayer.playerName,
              description: `${streakInfo.name} - ${state.currentStreak} kill streak`,
              value: state.currentStreak,
              icon: streakInfo.icon,
            });
          }

          // Regular kill events
          const pointsPerKill = Math.floor(scoreDiff / (killsDiff + deathsDiff) || 10);
          for (let k = 0; k < killsDiff; k++) {
            events.push({
              timestamp,
              type: 'kill',
              player: currentPlayer.playerName,
              message: `${currentPlayer.playerName} eliminated an enemy (+${pointsPerKill} pts)`,
              color: 'text-emerald-400',
              icon: '💀',
              isHighlight: false,
              value: pointsPerKill,
            });
          }
        }

        // Process deaths
        if (deathsDiff > 0) {
          // Reset streak on death
          if (state.currentStreak >= STREAK_THRESHOLDS.KILLING_SPREE) {
            events.push({
              timestamp,
              type: 'spree_ended',
              player: currentPlayer.playerName,
              message: `${currentPlayer.playerName}'s ${state.currentStreak} kill streak has ended!`,
              color: 'text-gray-400',
              icon: '💔',
              isHighlight: false,
              value: state.currentStreak,
            });
          }
          state.currentStreak = 0;

          for (let d = 0; d < deathsDiff; d++) {
            events.push({
              timestamp,
              type: 'death',
              player: currentPlayer.playerName,
              message: `${currentPlayer.playerName} was eliminated`,
              color: 'text-red-400',
              icon: '⚰️',
              isHighlight: false,
            });
          }
        }

        // Objective completion
        if (scoreDiff > 50 && killsDiff === 0) {
          events.push({
            timestamp,
            type: 'objective',
            player: currentPlayer.playerName,
            message: `${currentPlayer.playerName} completed an objective (+${scoreDiff} pts)`,
            color: 'text-purple-400',
            icon: '🎯',
            isHighlight: false,
            value: scoreDiff,
          });
        }
      } else {
        // New player joined - we'll track this separately with showJoinEvents toggle
        events.push({
          timestamp,
          type: 'spawn',
          player: currentPlayer.playerName,
          message: `${currentPlayer.playerName} joined the battle`,
          color: 'text-blue-400',
          icon: '🪂',
          isHighlight: false,
        });
      }
    }

    // Periodic status updates (every 5th snapshot instead of 3rd for less noise)
    if (i % 5 === 0 && currentSnapshot.entries.length > 0) {
      const topPlayer = currentSnapshot.entries[0];
      events.push({
        timestamp,
        type: 'system',
        player: 'SYSTEM',
        message: `${topPlayer.playerName} leads with ${topPlayer.score} points (${topPlayer.kills}/${topPlayer.deaths})`,
        color: 'text-yellow-400',
        icon: '📊',
        isHighlight: false,
      });
    }
  }

  // Calculate summary
  const finalSnapshot = snapshots[snapshots.length - 1];
  const summary = calculateSummary(
    roundReport,
    finalSnapshot,
    playerStates,
    leadChanges,
    closestGap,
    firstBloodPlayer,
    firstBloodTimestamp
  );

  // Add MVP highlight
  if (summary.mvp) {
    highlights.push({
      type: 'mvp',
      timestamp: roundReport.round.endTime || finalSnapshot.timestamp,
      playerName: summary.mvp.playerName,
      description: `MVP with ${summary.mvp.score} points and ${summary.mvp.kills} kills`,
      value: summary.mvp.score,
      icon: '🏆',
    });
  }

  // Add round end event
  const winner = finalSnapshot.entries[0];
  if (winner) {
    events.push({
      timestamp: finalSnapshot.timestamp,
      type: 'system',
      player: 'SYSTEM',
      message: `Battle concluded! ${winner.playerName} achieved victory with ${winner.score} points!`,
      color: 'text-yellow-400',
      icon: '🏆',
      isHighlight: true,
    });
  }

  // Sort events by timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    events,
    highlights: highlights.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    summary,
  };
}

function calculateTeamScores(entries: LeaderboardEntry[]): Record<string, TeamState> {
  const teams: Record<string, TeamState> = {};

  for (const entry of entries) {
    if (!teams[entry.teamLabel]) {
      teams[entry.teamLabel] = { totalScore: 0, playerCount: 0 };
    }
    teams[entry.teamLabel].totalScore += entry.score;
    teams[entry.teamLabel].playerCount++;
  }

  return teams;
}

function calculateSummary(
  roundReport: RoundReport,
  finalSnapshot: LeaderboardSnapshot,
  playerStates: Record<string, PlayerState>,
  leadChanges: number,
  closestGap: number,
  firstBloodPlayer: string | null,
  firstBloodTimestamp: string | null
): RoundSummary {
  const entries = finalSnapshot.entries;

  const totalKills = entries.reduce((sum, e) => sum + e.kills, 0);
  const totalDeaths = entries.reduce((sum, e) => sum + e.deaths, 0);
  const participants = entries.length;
  const avgKD = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;

  // Find MVP (highest score)
  const mvpEntry = entries.length > 0 ? entries[0] : null;
  const mvp = mvpEntry ? {
    playerName: mvpEntry.playerName,
    score: mvpEntry.score,
    kills: mvpEntry.kills,
    deaths: mvpEntry.deaths,
    kd: mvpEntry.deaths > 0 ? mvpEntry.kills / mvpEntry.deaths : mvpEntry.kills,
  } : null;

  // Find longest streak
  let longestStreak: { playerName: string; streak: number } | null = null;
  for (const [playerName, state] of Object.entries(playerStates)) {
    if (!longestStreak || state.bestStreak > longestStreak.streak) {
      longestStreak = { playerName, streak: state.bestStreak };
    }
  }
  if (longestStreak && longestStreak.streak < 3) {
    longestStreak = null; // Only show streaks of 3+
  }

  // Calculate duration
  const startTime = new Date(roundReport.round.startTime).getTime();
  const endTime = new Date(roundReport.round.endTime || finalSnapshot.timestamp).getTime();
  const durationMs = endTime - startTime;

  return {
    duration: formatDuration(durationMs),
    durationMs,
    totalKills,
    totalDeaths,
    participants,
    avgKD: Math.round(avgKD * 100) / 100,
    leadChanges,
    closestGap: closestGap === Infinity ? 0 : closestGap,
    mvp,
    longestStreak,
    firstBlood: firstBloodPlayer && firstBloodTimestamp ? {
      playerName: firstBloodPlayer,
      timestamp: firstBloodTimestamp,
    } : null,
  };
}

function createEmptySummary(): RoundSummary {
  return {
    duration: '0m 0s',
    durationMs: 0,
    totalKills: 0,
    totalDeaths: 0,
    participants: 0,
    avgKD: 0,
    leadChanges: 0,
    closestGap: 0,
    mvp: null,
    longestStreak: null,
    firstBlood: null,
  };
}

// Filter events based on display preferences
export function filterBattleEvents(
  events: BattleEvent[],
  options: {
    showJoinEvents: boolean;
    showDeathEvents: boolean;
    highlightsOnly: boolean;
  }
): BattleEvent[] {
  return events.filter(event => {
    if (options.highlightsOnly && !event.isHighlight) {
      return false;
    }
    if (!options.showJoinEvents && event.type === 'spawn') {
      return false;
    }
    if (!options.showDeathEvents && event.type === 'death') {
      return false;
    }
    return true;
  });
}
