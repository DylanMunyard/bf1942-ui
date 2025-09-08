<template>
  <div class="compact-leaderboard-container">
    <table class="compact-leaderboard-table">
      <thead>
        <tr>
          <th class="rank-col">
            #
          </th>
          <th class="player-col">
            Player
          </th>
          <th class="score-col">
            {{ scoreLabel }}
          </th>
          <th class="kd-col">
            K/D
          </th>
          <th
            v-if="showTotalRounds"
            class="rounds-col"
          >
            Rounds
          </th>
          <th
            v-if="showRoundLinks"
            class="round-col"
          >
            Round
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="player in playersWithRank"
          :key="`${player.playerName}-${props.timePeriod}`"
          class="player-row"
          :class="getRankClass(player.rank)"
        >
          <td class="rank-cell">
            <span
              v-if="player.rank === 1"
              class="rank-medal"
            >🥇</span>
            <span
              v-else-if="player.rank === 2"
              class="rank-medal"
            >🥈</span>
            <span
              v-else-if="player.rank === 3"
              class="rank-medal"
            >🥉</span>
            <span
              v-else
              class="rank-number"
            >{{ player.rank }}</span>
          </td>
          <td class="player-cell">
            <router-link
              :to="`/players/${encodeURIComponent(player.playerName)}`"
              class="player-name-link"
            >
              <div class="player-name">
                <PlayerName
                  :name="player.playerName"
                  :source="source"
                />
              </div>
            </router-link>
          </td>
          <td class="score-cell">
            <span class="score-value">{{ player.score.toLocaleString() }}</span>
          </td>
          <td class="kd-cell">
            <div class="kd-stats">
              <span class="kills">{{ player.kills }}</span>
              <span class="separator">/</span>
              <span class="deaths">{{ player.deaths }}</span>
            </div>
          </td>
          <td
            v-if="showTotalRounds"
            class="rounds-cell"
          >
            <span class="rounds-value">{{ player.totalRounds || 0 }}</span>
          </td>
          <td
            v-if="showRoundLinks"
            class="round-cell"
          >
            <router-link
              v-if="getRoundReportLink(player)"
              :to="getRoundReportLink(player)!"
              class="round-link"
              :title="`View round report for ${player.mapName}`"
            >
              <span class="round-icon">📊</span>
            </router-link>
            <span
              v-else
              class="no-round"
            >-</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PlayerName from './PlayerName.vue';

interface Player {
  name?: string;
  playerName?: string;
  score: number;
  kills: number;
  deaths: number;
  mapName?: string;
  timestamp?: string;
  totalRounds?: number;
}

interface PlayerWithRank extends Player {
  rank: number;
  playerName: string;
}

interface Props {
  players: Player[];
  source?: string;
  scoreLabel?: string;
  timePeriod?: 'alltime' |'week' | 'month';
  serverGuid?: string;
  showRoundLinks?: boolean;
  showTotalRounds?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  source: 'server-leaderboard',
  scoreLabel: 'Score',
  timePeriod: 'week',
  showRoundLinks: false,
  showTotalRounds: false
});

// Sort players by score and assign ranks
const playersWithRank = computed(() => {
  if (!props.players.length) return [];
  
  const sortedPlayers = [...props.players].sort((a, b) => b.score - a.score);
  return sortedPlayers.map((player, index): PlayerWithRank => ({
    ...player,
    rank: index + 1,
    playerName: player.playerName || player.name || 'Unknown'
  }));
});

// Get CSS class for rank-based styling
const getRankClass = (rank: number): string => {
  if (rank === 1) return 'rank-first';
  if (rank === 2) return 'rank-second';
  if (rank === 3) return 'rank-third';
  return '';
};

// Generate round report link
const getRoundReportLink = (player: PlayerWithRank): string | null => {
  // Round report links are no longer supported with the old URL format
  // The new format requires roundId which is not available in this context
  return null;
};
</script>

<style scoped>
/* Modern Cyberpunk Table Container */
.compact-leaderboard-container {
  overflow: hidden;
}

/* High-Density Cyberpunk Table */
.compact-leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* Table Headers */
.compact-leaderboard-table thead {
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.compact-leaderboard-table th {
  padding: 0.375rem 0.5rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(148, 163, 184, 1);
  border-bottom: 1px solid rgba(100, 116, 139, 0.3);
  background: transparent;
}

.compact-leaderboard-table th.rank-col {
  width: 2rem;
  text-align: center;
}

.compact-leaderboard-table th.score-col {
  width: 4rem;
  text-align: center;
}

.compact-leaderboard-table th.kd-col {
  width: 3.5rem;
  text-align: center;
}

.compact-leaderboard-table th.rounds-col {
  width: 3rem;
  text-align: center;
}

.compact-leaderboard-table th.round-col {
  width: 2.5rem;
  text-align: center;
}

/* Table Body Rows */
.compact-leaderboard-table td {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  vertical-align: middle;
  line-height: 1.2;
}

.player-row {
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.player-row:hover {
  background: rgba(30, 41, 59, 0.4);
  border-left-color: rgba(6, 182, 212, 0.6);
}

/* Rank-based styling with cyberpunk colors */
.player-row.rank-first {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
  border-left-color: rgba(255, 215, 0, 0.6);
}

.player-row.rank-second {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.1) 0%, rgba(192, 192, 192, 0.05) 100%);
  border-left-color: rgba(192, 192, 192, 0.6);
}

.player-row.rank-third {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.1) 0%, rgba(205, 127, 50, 0.05) 100%);
  border-left-color: rgba(205, 127, 50, 0.6);
}

/* Rank Cell */
.rank-cell {
  text-align: center;
  width: 2rem;
}

.rank-medal {
  font-size: 0.875rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.rank-number {
  font-size: 0.6875rem;
  color: rgba(148, 163, 184, 1);
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* Player Cell */
.player-cell {
  max-width: 0;
  width: 100%;
}

.player-name-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: color 0.3s ease;
}

.player-name-link:hover {
  color: #06b6d4;
}

.player-name {
  font-weight: 600;
  color: rgba(226, 232, 240, 1);
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.player-name-link:hover .player-name {
  color: #06b6d4;
}

/* Score Cell */
.score-cell {
  text-align: center;
  width: 4rem;
}

.score-value {
  font-weight: 700;
  color: #fbbf24;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.75rem;
}

/* K/D Cell */
.kd-cell {
  text-align: center;
  width: 3.5rem;
}

/* Rounds Cell */
.rounds-cell {
  text-align: center;
  width: 3rem;
}

.rounds-value {
  font-weight: 600;
  color: #a78bfa;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.75rem;
}

.kd-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  font-weight: 700;
  font-size: 0.6875rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

.kills {
  color: #10b981;
}

.separator {
  color: rgba(148, 163, 184, 0.6);
}

.deaths {
  color: #ef4444;
}

/* Round Cell */
.round-cell {
  text-align: center;
  width: 2.5rem;
}

.round-link {
  text-decoration: none;
  color: rgba(148, 163, 184, 0.8);
  transition: color 0.3s ease, transform 0.2s ease;
  display: inline-block;
}

.round-link:hover {
  color: #06b6d4;
  transform: scale(1.1);
}

.round-icon {
  font-size: 0.875rem;
}

.no-round {
  color: rgba(148, 163, 184, 0.4);
  font-size: 0.75rem;
}

/* Custom scrollbar for table container */
.compact-leaderboard-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.compact-leaderboard-container::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 3px;
}

.compact-leaderboard-container::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, rgba(6, 182, 212, 0.6), rgba(59, 130, 246, 0.6));
  border-radius: 3px;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.compact-leaderboard-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, rgba(6, 182, 212, 0.8), rgba(59, 130, 246, 0.8));
  border-color: rgba(6, 182, 212, 0.4);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .compact-leaderboard-table {
    font-size: 0.6875rem;
  }
  
  .compact-leaderboard-table th,
  .compact-leaderboard-table td {
    padding: 0.25rem 0.375rem;
  }
  
  .compact-leaderboard-table th.rank-col {
    width: 1.75rem;
  }
  
  .compact-leaderboard-table th.score-col {
    width: 3.5rem;
  }
  
  .compact-leaderboard-table th.kd-col {
    width: 3rem;
  }
  
  .compact-leaderboard-table th.rounds-col {
    width: 2.5rem;
  }
  
  .compact-leaderboard-table th.round-col {
    width: 2rem;
  }
  
  .rank-medal {
    font-size: 0.75rem;
  }
  
  .rank-number {
    font-size: 0.625rem;
  }
  
  .player-name {
    font-size: 0.6875rem;
  }
  
  .score-value {
    font-size: 0.6875rem;
  }
  
  .kd-stats {
    font-size: 0.625rem;
  }
  
  .rounds-value {
    font-size: 0.6875rem;
  }
}

@media (max-width: 480px) {
  .compact-leaderboard-table {
    font-size: 0.625rem;
  }
  
  .compact-leaderboard-table th,
  .compact-leaderboard-table td {
    padding: 0.1875rem 0.25rem;
  }
  
  .compact-leaderboard-table th.rank-col {
    width: 1.5rem;
  }
  
  .compact-leaderboard-table th.score-col {
    width: 3rem;
  }
  
  .compact-leaderboard-table th.kd-col {
    width: 2.5rem;
  }
  
  .compact-leaderboard-table th.rounds-col {
    width: 2rem;
  }
  
  .compact-leaderboard-table th.round-col {
    width: 1.75rem;
  }
  
  .rank-medal {
    font-size: 0.6875rem;
  }
  
  .rank-number {
    font-size: 0.5625rem;
  }
  
  .player-name {
    font-size: 0.625rem;
  }
  
  .score-value {
    font-size: 0.625rem;
  }
  
  .kd-stats {
    font-size: 0.5625rem;
  }
  
  .rounds-value {
    font-size: 0.625rem;
  }
}
</style> 