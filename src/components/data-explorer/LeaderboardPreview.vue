<template>
  <div class="leaderboard-preview-wrap">
    <table class="leaderboard-preview">
      <thead>
        <tr>
          <th class="col-rank">#</th>
          <th class="col-player">Player</th>
          <th class="col-score">Score</th>
          <th class="col-kills">Kills</th>
          <th class="col-kd">K/D</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(player, index) in players"
          :key="player.playerName"
        >
          <td class="col-rank">
            <span :class="getRankClass(index + 1)">{{ index + 1 }}</span>
          </td>
          <td class="col-player">
            <router-link
              :to="getPlayerDetailsRoute(player.playerName)"
              class="player-link"
            >
              {{ player.playerName }}
            </router-link>
          </td>
          <td class="col-score">{{ player.totalScore.toLocaleString() }}</td>
          <td class="col-kills">{{ player.totalKills.toLocaleString() }}</td>
          <td class="col-kd">{{ player.kdRatio.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="players.length === 0" class="leaderboard-empty">
      No player data available
    </div>
  </div>
</template>

<script setup lang="ts">
import { getRankClass } from '@/utils/statsUtils';
import type { TopPlayer } from '../../services/dataExplorerService';

defineProps<{
  players: TopPlayer[];
}>();

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'explore-player-detail',
  params: { playerName }
});

</script>

<style scoped>
.leaderboard-preview-wrap {
  overflow-x: auto;
}

.leaderboard-preview {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
}

.leaderboard-preview th {
  text-align: left;
  padding: 0.35rem 0.5rem;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--portal-border);
}

.leaderboard-preview th.col-score,
.leaderboard-preview th.col-kills,
.leaderboard-preview th.col-kd {
  text-align: right;
}

.leaderboard-preview td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}

.leaderboard-preview td.col-score {
  text-align: right;
  color: var(--portal-text-bright);
}

.leaderboard-preview td.col-kills,
.leaderboard-preview td.col-kd {
  text-align: right;
  color: var(--portal-text);
}

.leaderboard-preview tbody tr:last-child td {
  border-bottom: none;
}

.col-rank {
  width: 1.5rem;
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
