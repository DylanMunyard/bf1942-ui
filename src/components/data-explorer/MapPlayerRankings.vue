<template>
  <div class="rankings">
    <!-- Header with Search -->
    <div class="rankings-header">
      <div class="rankings-header-left">
        <h3 class="rankings-title">Top Players on This Map</h3>
        <div v-if="isRefreshing" class="rankings-spinner">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Search Input -->
      <div class="rankings-search">
        <span class="search-icon">$</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search players..."
          class="search-input"
          @input="handleSearchInput"
        />
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="rankings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="selectTab(tab.id)"
        :disabled="isRefreshing"
        :class="['rankings-tab', activeTab === tab.id && 'rankings-tab--active']"
      >
        {{ tab.label }}
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
const isInitialLoading = ref(false);
const isRefreshing = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const totalCount = ref(0);

const loadRankings = async () => {
  if (!props.mapName) return;

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
  rankings.value = [];
  loadRankings();
});

watch(() => props.game, () => {
  currentPage.value = 1;
  rankings.value = [];
  loadRankings();
});
</script>

<style scoped>
.rankings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rankings-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .rankings-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.rankings-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rankings-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--portal-text-bright);
  margin: 0;
}

.rankings-spinner {
  display: flex;
  align-items: center;
}

.spinner {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid var(--portal-border);
  border-top-color: var(--portal-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.rankings-search {
  position: relative;
  width: 100%;
  max-width: 12rem;
}

.search-icon {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--portal-accent);
  opacity: 0.7;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  font-weight: 600;
}

.search-input {
  width: 100%;
  padding: 0.35rem 0.5rem 0.35rem 1.5rem;
  font-size: 0.8rem;
  background: var(--portal-surface);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text-bright);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: var(--portal-text);
  opacity: 0.5;
}

.search-input:focus {
  outline: none;
  border-color: var(--portal-accent);
  box-shadow: 0 0 0 3px var(--portal-accent-dim);
}

.rankings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--portal-border);
}

.rankings-tab {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  color: var(--portal-text);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.rankings-tab:hover:not(:disabled) {
  color: var(--portal-text-bright);
}

.rankings-tab--active {
  color: var(--portal-accent);
  border-bottom-color: var(--portal-accent);
}

.rankings-tab:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
