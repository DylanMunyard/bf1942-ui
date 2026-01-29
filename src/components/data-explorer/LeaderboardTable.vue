<template>
  <div class="leaderboard-table-wrap">
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th class="col-rank">#</th>
          <th class="col-player">Player</th>
          <th class="col-value">{{ primaryColumnHeader }}</th>
          <th class="col-rounds">Rounds</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, index) in entries"
          :key="entry.playerName"
        >
          <td class="col-rank">
            <span :class="getRankClass(index + 1)">{{ index + 1 }}</span>
          </td>
          <td class="col-player">
            <router-link
              :to="getPlayerDetailsRoute(entry.playerName)"
              class="player-link"
            >
              {{ entry.playerName }}
            </router-link>
          </td>
          <td class="col-value">
            {{ formatPrimaryValue(entry) }}
          </td>
          <td class="col-rounds">
            {{ entry.totalRounds }}
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="entries.length === 0" class="leaderboard-empty">
      No player data available
    </div>
  </div>
</template>

<script setup lang="ts">
import { getRankClass } from '@/utils/statsUtils';
import type { LeaderboardEntry } from '../../services/dataExplorerService';

export type LeaderboardType = 'score' | 'kills' | 'kdRatio' | 'killRate';

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'explore-player-detail',
  params: { playerName }
});

const props = defineProps<{
  entries: LeaderboardEntry[];
  type: LeaderboardType;
}>();

const primaryColumnHeader = {
  score: 'Score',
  kills: 'Kills',
  kdRatio: 'K/D',
  killRate: 'Kills/Min'
}[props.type];

const formatPrimaryValue = (entry: LeaderboardEntry): string => {
  switch (props.type) {
    case 'score':
      return entry.totalScore.toLocaleString();
    case 'kills':
      return entry.totalKills.toLocaleString();
    case 'kdRatio':
      return entry.kdRatio.toFixed(2);
    case 'killRate':
      return entry.killsPerMinute.toFixed(3);
  }
};

</script>

<style scoped>
.leaderboard-table-wrap {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
}

.leaderboard-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--portal-border);
}

.leaderboard-table th.col-value,
.leaderboard-table th.col-rounds {
  text-align: right;
}

.leaderboard-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}

.leaderboard-table td.col-value {
  text-align: right;
  color: var(--portal-accent);
  font-weight: 500;
  font-family: ui-monospace, monospace;
}

.leaderboard-table td.col-rounds {
  text-align: right;
  color: var(--portal-text);
}

.leaderboard-table tbody tr:last-child td {
  border-bottom: none;
}

.leaderboard-table tbody tr:hover td {
  background: var(--portal-accent-dim);
}

.col-rank {
  width: 2rem;
}

.col-player {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .col-player {
    max-width: none;
  }
}

.col-rounds {
  display: none;
}

@media (min-width: 640px) {
  .col-rounds {
    display: table-cell;
  }
}

.player-link {
  color: var(--portal-accent);
  text-decoration: none;
  transition: color 0.2s;
}

.player-link:hover {
  color: #00f5a8;
}

.leaderboard-empty {
  text-align: center;
  padding: 1rem;
  color: var(--portal-text);
  font-size: 0.8rem;
}
</style>
