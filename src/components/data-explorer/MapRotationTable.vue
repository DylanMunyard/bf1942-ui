<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm table-fixed">
      <thead>
        <tr class="text-slate-400 text-left border-b border-slate-700/50 whitespace-nowrap">
          <th class="pb-2 pr-2 font-medium w-28">Map</th>
          <th class="pb-2 px-2 font-medium text-right w-14">Play %</th>
          <th class="pb-2 px-2 font-medium text-right w-14">Rounds</th>
          <th class="pb-2 px-2 font-medium text-right w-12 hidden sm:table-cell">Avg</th>
          <th class="pb-2 pl-3 font-medium w-24 hidden md:table-cell">Win Stats</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="map in mapRotation"
          :key="map.mapName"
          class="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
          @click="emit('navigate', map.mapName)"
        >
          <td class="py-2 pr-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-slate-200 truncate">{{ map.mapName }}</span>
              <span class="text-cyan-400 text-xs flex-shrink-0">→</span>
            </div>
          </td>
          <td class="py-2 px-2 text-right text-slate-300 tabular-nums">{{ map.playTimePercentage }}%</td>
          <td class="py-2 px-2 text-right text-slate-400 tabular-nums">{{ map.totalRounds }}</td>
          <td class="py-2 px-2 text-right text-slate-400 tabular-nums hidden sm:table-cell">{{ map.avgConcurrentPlayers }}</td>
          <td class="py-2 pl-3 hidden md:table-cell">
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
