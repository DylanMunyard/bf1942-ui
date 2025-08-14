<template>
  <div class="compact-leaderboard-container">
    <table class="compact-leaderboard-table">
      <thead>
        <tr>
          <th class="rank-col">#</th>
          <th class="player-col">Player</th>
          <th class="score-col">{{ scoreLabel }}</th>
          <th class="kd-col">K/D</th>
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
}

interface PlayerWithRank extends Player {
  rank: number;
  playerName: string;
}

interface Props {
  players: Player[];
  source?: string;
  scoreLabel?: string;
  timePeriod?: 'week' | 'month';
}

const props = withDefaults(defineProps<Props>(), {
  source: 'server-leaderboard',
  scoreLabel: 'Score',
  timePeriod: 'week'
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
</script>

<style scoped>
.compact-leaderboard-container {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.compact-leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.compact-leaderboard-table th {
  background: var(--color-background-mute);
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  border-bottom: 2px solid var(--color-border);
}

.compact-leaderboard-table th.rank-col {
  width: 40px;
  text-align: center;
}

.compact-leaderboard-table th.score-col {
  width: 80px;
  text-align: center;
}

.compact-leaderboard-table th.kd-col {
  width: 70px;
  text-align: center;
}

.compact-leaderboard-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.player-row {
  transition: all 0.2s ease;
}

.player-row:hover {
  background: var(--color-background);
}

.player-row.rank-first {
  background: rgba(255, 215, 0, 0.08);
}

.player-row.rank-second {
  background: rgba(192, 192, 192, 0.08);
}

.player-row.rank-third {
  background: rgba(205, 127, 50, 0.08);
}

.rank-cell {
  text-align: center;
  width: 40px;
}

.rank-medal {
  font-size: 14px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.rank-number {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 600;
}

.player-cell {
  max-width: 200px;
}

.player-name-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: color 0.2s ease;
}

.player-name-link:hover {
  color: var(--color-primary);
}

.player-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-cell {
  text-align: center;
  width: 80px;
}

.score-value {
  font-weight: 600;
  color: var(--color-text);
}

.kd-cell {
  text-align: center;
  width: 70px;
}

.kd-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-weight: 600;
  font-size: 12px;
}

.kills {
  color: #4caf50;
}

.separator {
  color: var(--color-text-muted);
}

.deaths {
  color: #f44336;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .compact-leaderboard-table {
    font-size: 12px;
  }
  
  .compact-leaderboard-table th,
  .compact-leaderboard-table td {
    padding: 6px 8px;
  }
  
  .compact-leaderboard-table th.rank-col {
    width: 30px;
  }
  
  .compact-leaderboard-table th.score-col {
    width: 60px;
  }
  
  .compact-leaderboard-table th.kd-col {
    width: 60px;
  }
  
  .rank-medal {
    font-size: 12px;
  }
  
  .rank-number {
    font-size: 11px;
  }
  
  .player-name {
    font-size: 12px;
  }
  
  .kd-stats {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .compact-leaderboard-table {
    font-size: 11px;
  }
  
  .compact-leaderboard-table th,
  .compact-leaderboard-table td {
    padding: 4px 6px;
  }
  
  .compact-leaderboard-table th.rank-col {
    width: 25px;
  }
  
  .compact-leaderboard-table th.score-col {
    width: 50px;
  }
  
  .compact-leaderboard-table th.kd-col {
    width: 50px;
  }
  
  .rank-medal {
    font-size: 11px;
  }
  
  .rank-number {
    font-size: 10px;
  }
  
  .player-name {
    font-size: 11px;
  }
  
  .kd-stats {
    font-size: 10px;
  }
}
</style> 