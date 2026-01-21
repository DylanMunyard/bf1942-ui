<template>
  <div class="w-full">
    <!-- Labels -->
    <div class="flex justify-between text-xs text-slate-400 mb-1">
      <span>{{ winStats.team1Label }} ({{ winStats.team1WinPercentage }}%)</span>
      <span>{{ winStats.team2Label }} ({{ winStats.team2WinPercentage }}%)</span>
    </div>

    <!-- Stacked Bar -->
    <div class="h-4 rounded-full overflow-hidden bg-slate-700/50 flex">
      <div
        v-if="winStats.team1WinPercentage > 0"
        class="bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
        :style="{ width: `${winStats.team1WinPercentage}%` }"
        :title="`${winStats.team1Label}: ${winStats.team1Victories} wins (${winStats.team1WinPercentage}%)`"
      />
      <div
        v-if="winStats.team2WinPercentage > 0"
        class="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
        :style="{ width: `${winStats.team2WinPercentage}%` }"
        :title="`${winStats.team2Label}: ${winStats.team2Victories} wins (${winStats.team2WinPercentage}%)`"
      />
    </div>

    <!-- Total Rounds -->
    <div class="text-xs text-slate-500 text-center mt-1">
      {{ winStats.totalRounds }} total rounds
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WinStats } from '../../services/dataExplorerService';

defineProps<{
  winStats: WinStats;
}>();
</script>
