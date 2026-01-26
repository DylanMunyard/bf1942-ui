<template>
  <div class="bg-slate-800/30 rounded-lg p-4">
    <h4 class="text-sm font-medium text-slate-300 mb-3">
      {{ title }}
      <span v-if="totalCount > 0" class="text-slate-500 font-normal text-xs">
        ({{ totalCount.toLocaleString() }})
      </span>
    </h4>

    <!-- Initial Loading State (no data yet) -->
    <div v-if="isLoading && rankings.length === 0" class="flex items-center justify-center py-8">
      <div class="w-5 h-5 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error && rankings.length === 0" class="text-center py-4">
      <div class="text-red-400 text-sm">{{ error }}</div>
      <button @click="emit('retry')" class="text-cyan-400 hover:text-cyan-300 text-sm mt-1">
        Try again
      </button>
    </div>

    <!-- Rankings Table (shown even while refreshing) -->
    <div v-else-if="rankings.length > 0" :class="{ 'opacity-50 pointer-events-none': isRefreshing }">
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
              v-for="entry in rankings"
              :key="entry.playerName"
              class="border-b border-slate-700/30 last:border-b-0"
            >
              <td class="py-2">
                <span :class="getRankClass(entry.rank)">{{ entry.rank }}</span>
              </td>
              <td class="py-2 truncate max-w-[100px] sm:max-w-[120px]">
                <button
                  @click="navigateToPlayer(entry.playerName)"
                  class="text-cyan-400 hover:text-cyan-300 transition-colors text-left"
                >
                  {{ entry.playerName }}
                </button>
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
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex flex-wrap items-center justify-center gap-1 pt-3 mt-3 border-t border-slate-700/30"
      >
        <!-- Previous Page -->
        <button
          class="px-2 py-1 text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded transition-all hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1 || isRefreshing"
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
          :disabled="isRefreshing"
          @click="emit('pageChange', pageNum)"
        >
          {{ pageNum }}
        </button>

        <!-- Next Page -->
        <button
          class="px-2 py-1 text-xs font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded transition-all hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages || isRefreshing"
          @click="emit('pageChange', currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-4 text-slate-500 text-sm">
      No player data available
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getRankClass } from '@/utils/statsUtils';
import type { MapPlayerRanking, MapRankingSortBy } from '../../services/dataExplorerService';

const router = useRouter();

const props = defineProps<{
  title: string;
  rankings: MapPlayerRanking[];
  isLoading: boolean;
  isRefreshing?: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  sortType: MapRankingSortBy;
}>();

const emit = defineEmits<{
  (e: 'pageChange', page: number): void;
  (e: 'retry'): void;
}>();

const navigateToPlayer = (playerName: string) => {
  router.push({
    name: 'explore-player-detail',
    params: { playerName }
  });
};

const primaryColumnHeader = computed(() => {
  switch (props.sortType) {
    case 'score': return 'Score';
    case 'kills': return 'Kills';
    case 'kdRatio': return 'K/D';
    case 'killRate': return 'Kills/Min';
    default: return 'Score';
  }
});

const formatPrimaryValue = (entry: MapPlayerRanking): string => {
  switch (props.sortType) {
    case 'score':
      return entry.totalScore.toLocaleString();
    case 'kills':
      return entry.totalKills.toLocaleString();
    case 'kdRatio':
      return entry.kdRatio.toFixed(2);
    case 'killRate':
      return entry.killsPerMinute.toFixed(3);
    default:
      return entry.totalScore.toLocaleString();
  }
};


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
