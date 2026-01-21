<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-slate-400 text-left border-b border-slate-700/50">
          <th class="pb-2 font-medium">Map</th>
          <th class="pb-2 font-medium text-right">Play %</th>
          <th class="pb-2 font-medium text-right">Rounds</th>
          <th class="pb-2 font-medium text-right hidden sm:table-cell">Avg Players</th>
          <th class="pb-2 font-medium w-32 hidden md:table-cell">Win Stats</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="map in mapRotation"
          :key="map.mapName"
          class="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
          @click="emit('navigate', map.mapName)"
        >
          <td class="py-2">
            <div class="flex items-center gap-2">
              <span class="text-slate-200">{{ map.mapName }}</span>
              <span class="text-cyan-400 text-xs">→</span>
            </div>
          </td>
          <td class="py-2 text-right text-slate-300">{{ map.playTimePercentage }}%</td>
          <td class="py-2 text-right text-slate-400">{{ map.totalRounds }}</td>
          <td class="py-2 text-right text-slate-400 hidden sm:table-cell">{{ map.avgConcurrentPlayers }}</td>
          <td class="py-2 hidden md:table-cell">
            <div class="h-2 rounded-full overflow-hidden bg-slate-700/50 flex">
              <div
                class="bg-red-500"
                :style="{ width: `${map.winStats.team1WinPercentage}%` }"
                :title="`${map.winStats.team1Label}: ${map.winStats.team1WinPercentage}%`"
              />
              <div
                class="bg-blue-500"
                :style="{ width: `${map.winStats.team2WinPercentage}%` }"
                :title="`${map.winStats.team2Label}: ${map.winStats.team2WinPercentage}%`"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { MapRotationItem } from '../../services/dataExplorerService';

defineProps<{
  mapRotation: MapRotationItem[];
}>();

const emit = defineEmits<{
  (e: 'navigate', mapName: string): void;
}>();
</script>
