<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-slate-400 text-left border-b border-slate-700/50">
          <th class="pb-2 font-medium w-8">#</th>
          <th class="pb-2 font-medium">Player</th>
          <th class="pb-2 font-medium text-right">{{ primaryColumnHeader }}</th>
          <th class="pb-2 font-medium text-right hidden sm:table-cell">Rounds</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, index) in entries"
          :key="entry.playerName"
          class="border-b border-slate-700/30 last:border-b-0"
        >
          <td class="py-2">
            <span :class="getRankClass(index)">{{ index + 1 }}</span>
          </td>
          <td class="py-2 truncate max-w-[120px] sm:max-w-none">
            <router-link
              :to="getPlayerDetailsRoute(entry.playerName)"
              class="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {{ entry.playerName }}
            </router-link>
          </td>
          <td class="py-2 text-right text-cyan-400 font-medium">
            {{ formatPrimaryValue(entry) }}
          </td>
          <td class="py-2 text-right text-slate-400 hidden sm:table-cell">
            {{ entry.totalRounds }}
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="entries.length === 0" class="text-center text-slate-500 py-4">
      No player data available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardEntry } from '../../services/dataExplorerService';

export type LeaderboardType = 'score' | 'kills' | 'kdRatio' | 'killRate';

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'player-details',
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
