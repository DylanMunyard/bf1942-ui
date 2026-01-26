<template>
  <div class="space-y-4">
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

    <!-- Pagination Controls -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between gap-4 pt-2 border-t border-slate-700/30"
    >
      <!-- Pagination Info -->
      <div class="text-slate-400 text-sm">
        Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }}
      </div>

      <!-- Pagination Buttons -->
      <div class="flex items-center gap-1">
        <!-- Previous Page -->
        <button
          class="px-2 py-1 text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded transition-all hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1 || isLoading"
          @click="emit('pageChange', currentPage - 1)"
        >
          Prev
        </button>

        <!-- Page Numbers -->
        <button
          v-for="pageNum in paginationRange"
          :key="pageNum"
          class="px-2 py-1 text-xs font-medium rounded transition-all min-w-[24px]"
          :class="{
            'bg-cyan-600/80 border border-cyan-500/50 text-white': pageNum === currentPage,
            'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-600 hover:text-slate-200': pageNum !== currentPage
          }"
          :disabled="isLoading"
          @click="emit('pageChange', pageNum)"
        >
          {{ pageNum }}
        </button>

        <!-- Next Page -->
        <button
          class="px-2 py-1 text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded transition-all hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages || isLoading"
          @click="emit('pageChange', currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MapRotationItem } from '../../services/dataExplorerService';

const props = defineProps<{
  mapRotation: MapRotationItem[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'navigate', mapName: string): void;
  (e: 'pageChange', page: number): void;
}>();

const paginationRange = computed(() => {
  const range: number[] = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, props.currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(props.totalPages, startPage + maxVisiblePages - 1);

  if (endPage === props.totalPages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }

  return range;
});
</script>
