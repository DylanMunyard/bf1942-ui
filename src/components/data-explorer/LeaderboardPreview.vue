<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-slate-400 text-left border-b border-slate-700/50">
          <th class="pb-2 font-medium">#</th>
          <th class="pb-2 font-medium">Player</th>
          <th class="pb-2 font-medium text-right">Score</th>
          <th class="pb-2 font-medium text-right">Kills</th>
          <th class="pb-2 font-medium text-right">K/D</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(player, index) in players"
          :key="player.playerName"
          class="border-b border-slate-700/30"
        >
          <td class="py-1.5">
            <span :class="getRankClass(index)">{{ index + 1 }}</span>
          </td>
          <td class="py-1.5">
            <router-link
              :to="getPlayerDetailsRoute(player.playerName)"
              class="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {{ player.playerName }}
            </router-link>
          </td>
          <td class="py-1.5 text-right text-slate-300">{{ player.totalScore.toLocaleString() }}</td>
          <td class="py-1.5 text-right text-slate-400">{{ player.totalKills.toLocaleString() }}</td>
          <td class="py-1.5 text-right text-slate-400">{{ player.kdRatio.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="players.length === 0" class="text-center text-slate-500 py-4">
      No player data available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TopPlayer } from '../../services/dataExplorerService';

defineProps<{
  players: TopPlayer[];
}>();

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'explore-player-detail',
  params: { playerName }
});

const getRankClass = (index: number): string => {
  const base = 'inline-flex items-center justify-center w-5 h-5 rounded text-xs font-medium';
  switch (index) {
    case 0: return `${base} bg-yellow-500/20 text-yellow-400`;
    case 1: return `${base} bg-slate-400/20 text-slate-300`;
    case 2: return `${base} bg-orange-500/20 text-orange-400`;
    default: return `${base} text-slate-500`;
  }
};
</script>
