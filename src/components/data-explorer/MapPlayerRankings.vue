<template>
  <div class="space-y-4">
    <!-- Header with Search -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-medium text-slate-300">
          Top Players on This Map
        </h3>
        <!-- Inline refresh spinner -->
        <div v-if="isRefreshing" class="flex items-center gap-1.5 text-slate-400">
          <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>

      <!-- Search Input -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search players..."
          class="w-full sm:w-48 px-3 py-1.5 pl-8 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          @input="handleSearchInput"
        />
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex border-b border-slate-700/50">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="selectTab(tab.id)"
        :disabled="isRefreshing"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors relative',
          activeTab === tab.id
            ? 'text-cyan-400'
            : 'text-slate-400 hover:text-slate-200',
          isRefreshing ? 'cursor-not-allowed opacity-60' : ''
        ]"
      >
        {{ tab.label }}
        <!-- Active indicator -->
        <span
          v-if="activeTab === tab.id"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
        />
      </button>
    </div>

    <!-- Active Leaderboard -->
    <LeaderboardCard
      :title="activeTabConfig.title"
      :rankings="rankings"
      :is-loading="isInitialLoading"
      :is-refreshing="isRefreshing"
      :error="error"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-count="totalCount"
      :sort-type="activeTab"
      @page-change="goToPage"
      @retry="loadRankings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { fetchMapPlayerRankings, type MapPlayerRanking, type GameType, type MapRankingSortBy } from '../../services/dataExplorerService';
import LeaderboardCard from './LeaderboardCard.vue';

const props = defineProps<{
  mapName: string;
  game?: GameType;
}>();

// Tab configuration
const tabs = [
  { id: 'score' as const, label: 'Score', title: 'Top by Score' },
  { id: 'kills' as const, label: 'Kills', title: 'Top by Kills' },
  { id: 'kdRatio' as const, label: 'K/D Ratio', title: 'Top by K/D Ratio' },
  { id: 'killRate' as const, label: 'Kill Rate', title: 'Top by Kill Rate' },
];

// Active tab state
const activeTab = ref<MapRankingSortBy>('score');

const activeTabConfig = computed(() => 
  tabs.find(t => t.id === activeTab.value) || tabs[0]
);

// Search state
const searchQuery = ref('');
const debouncedSearch = ref('');
let searchTimeout: number | null = null;

// Pagination settings
const pageSize = 10;

// Rankings state (single leaderboard)
const rankings = ref<MapPlayerRanking[]>([]);
const isInitialLoading = ref(false);  // Only true when no data yet
const isRefreshing = ref(false);       // True when refreshing with existing data
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const totalCount = ref(0);

const loadRankings = async () => {
  if (!props.mapName) return;

  // Use initial loading only when we have no data yet
  if (rankings.value.length === 0) {
    isInitialLoading.value = true;
  } else {
    isRefreshing.value = true;
  }
  error.value = null;

  try {
    const response = await fetchMapPlayerRankings(
      props.mapName,
      props.game || 'bf1942',
      currentPage.value,
      pageSize,
      debouncedSearch.value || undefined,
      undefined,
      60,
      activeTab.value
    );

    rankings.value = response.rankings;
    totalPages.value = Math.ceil(response.totalCount / pageSize);
    totalCount.value = response.totalCount;
  } catch (err) {
    console.error(`Error loading ${activeTab.value} rankings:`, err);
    error.value = 'Failed to load rankings';
  } finally {
    isInitialLoading.value = false;
    isRefreshing.value = false;
  }
};

const selectTab = (tabId: MapRankingSortBy) => {
  if (tabId === activeTab.value || isRefreshing.value) return;
  activeTab.value = tabId;
  currentPage.value = 1;
  loadRankings();
};

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || isRefreshing.value) return;
  currentPage.value = page;
  loadRankings();
};

const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = searchQuery.value;
    currentPage.value = 1;
    loadRankings();
  }, 300) as unknown as number;
};

onMounted(loadRankings);

watch(() => props.mapName, () => {
  currentPage.value = 1;
  searchQuery.value = '';
  debouncedSearch.value = '';
  rankings.value = [];  // Clear data for new map (shows initial loading)
  loadRankings();
});

watch(() => props.game, () => {
  currentPage.value = 1;
  rankings.value = [];  // Clear data for new game
  loadRankings();
});
</script>
