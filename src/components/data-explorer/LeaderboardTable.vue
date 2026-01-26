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
            <span :class="getRankClass(index + 1)">{{ index + 1 }}</span>
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
