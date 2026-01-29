<template>
  <div class="win-stats">
    <!-- Labels -->
    <div class="win-stats-labels">
      <span>{{ winStats.team1Label }} ({{ winStats.team1WinPercentage }}%)</span>
      <span>{{ winStats.team2Label }} ({{ winStats.team2WinPercentage }}%)</span>
    </div>

    <!-- Stacked Bar -->
    <div class="win-stats-bar">
      <div
        v-if="winStats.team1WinPercentage > 0"
        class="win-stats-bar-team1"
        :style="{ width: `${winStats.team1WinPercentage}%` }"
        :title="`${winStats.team1Label}: ${winStats.team1Victories} wins (${winStats.team1WinPercentage}%)`"
      />
      <div
        v-if="winStats.team2WinPercentage > 0"
        class="win-stats-bar-team2"
        :style="{ width: `${winStats.team2WinPercentage}%` }"
        :title="`${winStats.team2Label}: ${winStats.team2Victories} wins (${winStats.team2WinPercentage}%)`"
      />
    </div>

    <!-- Total Rounds -->
    <div class="win-stats-total">
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

<style scoped>
.win-stats {
  width: 100%;
}

.win-stats-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--portal-text);
  margin-bottom: 0.35rem;
}

.win-stats-bar {
  height: 0.375rem;
  border-radius: 2px;
  overflow: hidden;
  background: var(--portal-surface);
  display: flex;
}

.win-stats-bar-team1 {
  background: #ef4444;
  transition: width 0.3s;
}

.win-stats-bar-team2 {
  background: #3b82f6;
  transition: width 0.3s;
}

.win-stats-total {
  font-size: 0.65rem;
  color: var(--portal-text);
  text-align: center;
  margin-top: 0.35rem;
  opacity: 0.8;
}
</style>
