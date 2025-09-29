<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import PlayerName from '@/components/PlayerName.vue';
import HeroBackButton from './HeroBackButton.vue';

// Router
const route = useRoute();
const router = useRouter();

// Types
interface ServerRanking {
  rank: number;
  serverGuid: string;
  serverName: string;
  playerName: string;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  totalPlayTimeMinutes: number;
}

interface ServerContext {
  serverGuid: string;
  serverName: string;
}

interface RankingsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: ServerRanking[];
  serverContext: ServerContext;
}

// State
const rankings = ref<ServerRanking[]>([]);
const serverContext = ref<ServerContext | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const pageSize = ref(100);

// Mobile filters state
const showFilters = ref(false);

// Ordering state
const orderBy = ref<string>('TotalScore');
const orderDirection = ref<'asc' | 'desc'>('desc');

// Filter variables
const playerNameFilter = ref('');
const playerNameInputValue = ref(''); // Separate value for the input display
const minScoreFilter = ref<number | ''>('');
const minScoreInputValue = ref(''); // Separate display value
const minKillsFilter = ref<number | ''>('');
const minKillsInputValue = ref(''); // Separate display value
const minDeathsFilter = ref<number | ''>('');
const minDeathsInputValue = ref(''); // Separate display value
const minKdRatioFilter = ref<number | ''>('');
const minKdRatioInputValue = ref(''); // Separate display value
const minPlayTimeMinutesFilter = ref<number | ''>('');
const minPlayTimeInputValue = ref(''); // Separate display value

// Debounced search functionality
const searchTimeout = ref<any>(null);
const isSearching = ref(false);

// Computed property for pagination range
const paginationRange = computed(() => {
  const range = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

  // Adjust start page if end page is at max
  if (endPage === totalPages.value) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }

  return range;
});

// Format minutes to hours and minutes
const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};

// Fetch rankings data
const fetchRankings = async (page: number = 1) => {
  if (!route.params.serverName) return;
  
  loading.value = true;
  error.value = null;

  try {
    // Build filter object from current filter values
    const filters: Record<string, string | number> = {
      page,
      pageSize: pageSize.value,
      orderBy: orderBy.value,
      orderDirection: orderDirection.value
    };
    if (playerNameFilter.value) filters.playerName = playerNameFilter.value;
    if (minScoreFilter.value !== '') filters.minScore = minScoreFilter.value;
    if (minKillsFilter.value !== '') filters.minKills = minKillsFilter.value;
    if (minDeathsFilter.value !== '') filters.minDeaths = minDeathsFilter.value;
    if (minKdRatioFilter.value !== '') filters.minKdRatio = minKdRatioFilter.value;
    if (minPlayTimeMinutesFilter.value !== '') filters.minPlayTimeMinutes = minPlayTimeMinutesFilter.value;

    const response = await axios.get<RankingsResponse>(`/stats/servers/${encodeURIComponent(route.params.serverName as string)}/rankings`, {
      params: filters
    });

    rankings.value = response.data.items;
    serverContext.value = response.data.serverContext;
    currentPage.value = response.data.currentPage;
    totalPages.value = response.data.totalPages;
    totalItems.value = response.data.totalItems;
  } catch (err) {
    error.value = 'Failed to load server rankings. Please try again.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Handle page change
const changePage = (page: number) => {
  currentPage.value = page;
  updateQueryParams();
  fetchRankings(page);
};

// Initialize state from URL query parameters
const initializeFromQuery = () => {
  const query = route.query;
  
  // Set ordering from query params
  if (query.orderBy && typeof query.orderBy === 'string') {
    const validOrderBy = ['TotalScore', 'TotalKills', 'TotalDeaths', 'KDRatio', 'TotalPlayTimeMinutes'];
    if (validOrderBy.includes(query.orderBy)) {
      orderBy.value = query.orderBy;
    }
  }
  if (query.orderDirection && typeof query.orderDirection === 'string') {
    if (query.orderDirection === 'asc' || query.orderDirection === 'desc') {
      orderDirection.value = query.orderDirection;
    }
  }
  
  // Set filters from query params
  if (query.playerName && typeof query.playerName === 'string') {
    playerNameFilter.value = query.playerName;
    playerNameInputValue.value = query.playerName;
  }
  if (query.minScore && typeof query.minScore === 'string') {
    const value = Number(query.minScore);
    if (!isNaN(value)) {
      minScoreFilter.value = value;
      minScoreInputValue.value = query.minScore;
    }
  }
  if (query.minKills && typeof query.minKills === 'string') {
    const value = Number(query.minKills);
    if (!isNaN(value)) {
      minKillsFilter.value = value;
      minKillsInputValue.value = query.minKills;
    }
  }
  if (query.minDeaths && typeof query.minDeaths === 'string') {
    const value = Number(query.minDeaths);
    if (!isNaN(value)) {
      minDeathsFilter.value = value;
      minDeathsInputValue.value = query.minDeaths;
    }
  }
  if (query.minKdRatio && typeof query.minKdRatio === 'string') {
    const value = Number(query.minKdRatio);
    if (!isNaN(value)) {
      minKdRatioFilter.value = value;
      minKdRatioInputValue.value = query.minKdRatio;
    }
  }
  if (query.minPlayTimeMinutes && typeof query.minPlayTimeMinutes === 'string') {
    const value = Number(query.minPlayTimeMinutes);
    if (!isNaN(value)) {
      minPlayTimeMinutesFilter.value = value;
      minPlayTimeInputValue.value = query.minPlayTimeMinutes;
    }
  }
  
  // Set pagination from query params
  if (query.page && typeof query.page === 'string') {
    const pageNum = parseInt(query.page);
    if (!isNaN(pageNum) && pageNum > 0) {
      currentPage.value = pageNum;
    }
  }
  if (query.pageSize && typeof query.pageSize === 'string') {
    const size = parseInt(query.pageSize);
    if (!isNaN(size) && [10, 20, 50, 100].includes(size)) {
      pageSize.value = size;
    }
  }
};

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string> = {};
  
  // Add ordering to query
  if (orderBy.value !== 'TotalScore') query.orderBy = orderBy.value;
  if (orderDirection.value !== 'desc') query.orderDirection = orderDirection.value;
  
  // Add filters to query
  if (playerNameFilter.value) query.playerName = playerNameFilter.value;
  if (minScoreFilter.value !== '') query.minScore = minScoreFilter.value.toString();
  if (minKillsFilter.value !== '') query.minKills = minKillsFilter.value.toString();
  if (minDeathsFilter.value !== '') query.minDeaths = minDeathsFilter.value.toString();
  if (minKdRatioFilter.value !== '') query.minKdRatio = minKdRatioFilter.value.toString();
  if (minPlayTimeMinutesFilter.value !== '') query.minPlayTimeMinutes = minPlayTimeMinutesFilter.value.toString();
  
  // Add pagination to query
  if (currentPage.value !== 1) query.page = currentPage.value.toString();
  if (pageSize.value !== 100) query.pageSize = pageSize.value.toString();
  
  // Update URL without triggering navigation
  router.replace({ query });
};

// Handle page size change
const handlePageSizeChange = () => {
  currentPage.value = 1; // Reset to first page when changing page size
  updateQueryParams();
  fetchRankings();
};

// Generic debounced filter function
const debouncedFilterSearch = (filterUpdater: () => void) => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  isSearching.value = true;

  // Set new timeout
  searchTimeout.value = setTimeout(() => {
    filterUpdater();
    currentPage.value = 1; // Reset to first page when filtering
    isSearching.value = false;
    updateQueryParams();
    fetchRankings();
  }, 500); // 500ms delay
};

// Handle name filter change - now with debouncing
const handlePlayerNameFilterChange = (searchTerm: string) => {
  debouncedFilterSearch(() => {
    playerNameFilter.value = searchTerm;
  });
};

// Handle numeric filter changes - all debounced
const handleMinScoreChange = (value: string) => {
  debouncedFilterSearch(() => {
    minScoreFilter.value = value === '' ? '' : Number(value);
  });
};

const handleMinKillsChange = (value: string) => {
  debouncedFilterSearch(() => {
    minKillsFilter.value = value === '' ? '' : Number(value);
  });
};

const handleMinDeathsChange = (value: string) => {
  debouncedFilterSearch(() => {
    minDeathsFilter.value = value === '' ? '' : Number(value);
  });
};

const handleMinKdRatioChange = (value: string) => {
  debouncedFilterSearch(() => {
    minKdRatioFilter.value = value === '' ? '' : Number(value);
  });
};

const handleMinPlayTimeChange = (value: string) => {
  debouncedFilterSearch(() => {
    minPlayTimeMinutesFilter.value = value === '' ? '' : Number(value);
  });
};

// Clear name filter
const clearPlayerNameFilter = () => {
  // Cancel any pending search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
    searchTimeout.value = null;
  }
  
  playerNameFilter.value = '';
  playerNameInputValue.value = '';
  isSearching.value = false;
  currentPage.value = 1; // Reset to first page when clearing filter
  updateQueryParams();
  fetchRankings();
};

// Reset all filters
const resetFilters = () => {
  // Cancel any pending search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
    searchTimeout.value = null;
  }
  
  playerNameFilter.value = '';
  playerNameInputValue.value = '';
  minScoreFilter.value = '';
  minScoreInputValue.value = '';
  minKillsFilter.value = '';
  minKillsInputValue.value = '';
  minDeathsFilter.value = '';
  minDeathsInputValue.value = '';
  minKdRatioFilter.value = '';
  minKdRatioInputValue.value = '';
  minPlayTimeMinutesFilter.value = '';
  minPlayTimeInputValue.value = '';
  isSearching.value = false;
  currentPage.value = 1; // Reset to first page when resetting filters
  updateQueryParams();
  fetchRankings();
};

// Watch for route changes
watch(
  () => route.params.serverName,
  (newServerName) => {
    if (newServerName) {
      initializeFromQuery();
      fetchRankings();
    }
  },
  { immediate: true }
);

// Watch for external changes to filters and sync with input values
watch(playerNameFilter, (newValue) => {
  if (newValue !== playerNameInputValue.value) {
    playerNameInputValue.value = newValue;
  }
});

watch(minScoreFilter, (newValue) => {
  const stringValue = newValue === '' ? '' : newValue.toString();
  if (stringValue !== minScoreInputValue.value) {
    minScoreInputValue.value = stringValue;
  }
});

watch(minKillsFilter, (newValue) => {
  const stringValue = newValue === '' ? '' : newValue.toString();
  if (stringValue !== minKillsInputValue.value) {
    minKillsInputValue.value = stringValue;
  }
});

watch(minDeathsFilter, (newValue) => {
  const stringValue = newValue === '' ? '' : newValue.toString();
  if (stringValue !== minDeathsInputValue.value) {
    minDeathsInputValue.value = stringValue;
  }
});

watch(minKdRatioFilter, (newValue) => {
  const stringValue = newValue === '' ? '' : newValue.toString();
  if (stringValue !== minKdRatioInputValue.value) {
    minKdRatioInputValue.value = stringValue;
  }
});

watch(minPlayTimeMinutesFilter, (newValue) => {
  const stringValue = newValue === '' ? '' : newValue.toString();
  if (stringValue !== minPlayTimeInputValue.value) {
    minPlayTimeInputValue.value = stringValue;
  }
});

// Handle column sorting
const handleSort = (column: string) => {
  if (orderBy.value === column) {
    // Toggle direction if same column
    orderDirection.value = orderDirection.value === 'desc' ? 'asc' : 'desc';
  } else {
    // Set new column with default desc direction
    orderBy.value = column;
    orderDirection.value = 'desc';
  }
  
  currentPage.value = 1; // Reset to first page when sorting
  updateQueryParams();
  fetchRankings();
};

// Get sort icon for column
const getSortIcon = (column: string) => {
  if (orderBy.value !== column) return '';
  return orderDirection.value === 'desc' ? '▼' : '▲';
};

// Cleanup when component is unmounted
onUnmounted(() => {
  // Clear any pending search timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<template>
  <!-- Full-width Hero Section -->
  <div class="w-full bg-slate-800 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between">
        <HeroBackButton />
      </div>
      
      <div
        v-if="serverContext"
        class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 mt-6"
      >
        <!-- Server Leaderboard Icon -->
        <div class="flex-shrink-0">
          <div class="relative">
            <div class="w-20 h-20 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center">
              <span class="text-2xl">🏆</span>
            </div>
            <!-- Status indicator -->
            <div class="absolute -bottom-1 -right-1">
              <div class="w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" />
            </div>
          </div>
        </div>

        <!-- Server Info -->
        <div class="flex-grow min-w-0">
          <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 mb-3">
            {{ serverContext.serverName }} Leaderboard
          </h1>
          
          <div class="text-slate-400 text-sm">
            🏆 Elite soldiers ranked by battlefield supremacy • {{ totalItems.toLocaleString() }} warriors
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            :disabled="loading"
            class="group bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-500 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-amber-500/25 disabled:shadow-none flex items-center gap-2"
            @click="fetchRankings(currentPage)"
          >
            <svg
              v-if="!loading"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="group-hover:rotate-180 transition-transform duration-300"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            <div
              v-else
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            <span class="font-medium text-sm">{{ loading ? 'Loading...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="min-h-screen bg-slate-900">
    <div class="relative">
      <div class="relative py-6 sm:py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Rankings Content -->
          <div
            v-if="!loading || rankings.length > 0"
            class="space-y-6"
          >
            <!-- Compact Filters and Sort -->
            <div class="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 mb-4">
              <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <!-- Sort Controls (moved from below) -->
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="sortOption in [
                      { key: 'TotalScore', label: 'Score', icon: '🏆' },
                      { key: 'TotalKills', label: 'Kills', icon: '⚔️' },
                      { key: 'KDRatio', label: 'K/D', icon: '📊' },
                      { key: 'TotalPlayTimeMinutes', label: 'Time', icon: '⏱️' }
                    ]"
                    :key="sortOption.key"
                    class="group flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium"
                    :class="orderBy === sortOption.key 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-sm' 
                      : 'bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 hover:text-white border border-slate-600/50 hover:border-amber-500/50'"
                    @click="handleSort(sortOption.key)"
                  >
                    <span>{{ sortOption.icon }}</span>
                    <span>{{ sortOption.label }}</span>
                    <span
                      v-if="orderBy === sortOption.key"
                      class="text-xs opacity-75"
                    >
                      {{ orderDirection === 'desc' ? '↓' : '↑' }}
                    </span>
                  </button>
                </div>

                <!-- Filter Button -->
                <button
                  class="group bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600/50 hover:border-amber-500/50 rounded-lg px-4 py-2 transition-all duration-300 flex items-center gap-2"
                  @click="showFilters = !showFilters"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-amber-400"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span class="text-amber-400 font-medium text-sm">Filters</span>
                  <span
                    v-if="playerNameFilter || minScoreFilter !== '' || minKillsFilter !== '' || minDeathsFilter !== '' || minKdRatioFilter !== '' || minPlayTimeMinutesFilter !== ''"
                    class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                  />
                </button>
              </div>
        
              <!-- Collapsible Filter Panel -->
              <div
                class="transition-all duration-300 ease-in-out overflow-hidden"
                :class="showFilters ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-700/50">
                  <!-- Soldier Name Filter -->
                  <div class="space-y-2">
                    <label
                      for="playerNameFilter"
                      class="block text-xs font-medium text-slate-400"
                    >Soldier Name</label>
                    <div class="relative">
                      <input 
                        id="playerNameFilter" 
                        v-model="playerNameInputValue" 
                        type="text"
                        placeholder="Search..." 
                        class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm"
                        @input="handlePlayerNameFilterChange(playerNameInputValue)"
                      >
                      <button 
                        v-if="playerNameInputValue" 
                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                        @click="clearPlayerNameFilter"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <!-- Min Score -->
                  <div class="space-y-2">
                    <label
                      for="minScoreFilter"
                      class="block text-xs font-medium text-slate-400"
                    >Min Score</label>
                    <input 
                      id="minScoreFilter" 
                      v-model="minScoreInputValue" 
                      type="number"
                      placeholder="1000"
                      class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm"
                      @input="handleMinScoreChange(minScoreInputValue)"
                    >
                  </div>

                  <!-- Min Kills -->
                  <div class="space-y-2">
                    <label
                      for="minKillsFilter"
                      class="block text-xs font-medium text-slate-400"
                    >Min Kills</label>
                    <input 
                      id="minKillsFilter" 
                      v-model="minKillsInputValue" 
                      type="number"
                      placeholder="100"
                      class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm"
                      @input="handleMinKillsChange(minKillsInputValue)"
                    >
                  </div>

                  <!-- Min Play Time -->
                  <div class="space-y-2">
                    <label
                      for="minPlayTimeFilter"
                      class="block text-xs font-medium text-slate-400"
                    >Min Play Time (min)</label>
                    <input 
                      id="minPlayTimeFilter" 
                      v-model="minPlayTimeInputValue" 
                      type="number"
                      placeholder="60"
                      class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm"
                      @input="handleMinPlayTimeChange(minPlayTimeInputValue)"
                    >
                  </div>

                  <!-- Actions -->
                  <div class="space-y-2">
                    <label class="block text-xs font-medium text-slate-400">Actions</label>
                    <button
                      class="w-full px-3 py-2 bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 hover:text-white rounded-lg transition-all duration-200 text-sm"
                      @click="resetFilters"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Elite Leaderboard -->
            <div
              v-if="rankings.length > 0"
              class="space-y-6"
            >
              <!-- Results Summary -->
              <div class="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-slate-400">
                      Showing <span class="text-amber-400 font-medium">{{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalItems) }}</span> 
                      of <span class="text-amber-400 font-medium">{{ totalItems.toLocaleString() }}</span> warriors
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <label
                      for="pageSize"
                      class="text-xs text-slate-500"
                    >Per page:</label>
                    <select
                      id="pageSize"
                      v-model="pageSize"
                      class="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-xs focus:ring-1 focus:ring-amber-400 focus:border-transparent"
                      @change="handlePageSizeChange"
                    >
                      <option value="10">
                        10
                      </option>
                      <option value="20">
                        20
                      </option>
                      <option value="50">
                        50
                      </option>
                      <option value="100">
                        100
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Rankings Grid -->
              <div class="space-y-4">
                <div
                  v-for="(ranking, index) in rankings"
                  :key="ranking.playerName"
                  class="group relative"
                >
                  <!-- Special Treatment for Top 3 -->
                  <div
                    v-if="ranking.rank <= 3"
                    class="relative bg-gradient-to-r backdrop-blur-lg rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-2xl"
                    :class="{
                      'from-yellow-900/40 to-amber-900/40 border-yellow-500/30 hover:border-yellow-500/60 shadow-yellow-500/10': ranking.rank === 1,
                      'from-slate-600/40 to-slate-700/40 border-slate-400/30 hover:border-slate-400/60 shadow-slate-500/10': ranking.rank === 2,
                      'from-orange-900/40 to-amber-900/40 border-amber-600/30 hover:border-amber-600/60 shadow-amber-600/10': ranking.rank === 3
                    }"
                  >
                    <!-- Rank Crown/Medal -->
                    <div class="absolute top-4 left-4">
                      <div class="relative">
                        <div
                          class="w-16 h-16 rounded-full flex items-center justify-center border-4 relative"
                          :class="{
                            'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300': ranking.rank === 1,
                            'bg-gradient-to-br from-slate-300 to-slate-500 border-slate-200': ranking.rank === 2,
                            'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400': ranking.rank === 3
                          }"
                        >
                          <div class="text-2xl">
                            {{ ranking.rank === 1 ? '👑' : ranking.rank === 2 ? '🥈' : '🥉' }}
                          </div>
                        </div>
                        <div
                          class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          :class="{
                            'bg-yellow-500 text-yellow-900': ranking.rank === 1,
                            'bg-slate-500 text-white': ranking.rank === 2,
                            'bg-amber-600 text-white': ranking.rank === 3
                          }"
                        >
                          {{ ranking.rank }}
                        </div>
                      </div>
                    </div>

                    <!-- Player Card Content -->
                    <div class="pl-24 pr-6 py-4">
                      <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                        <!-- Player Info -->
                        <div class="flex-grow">
                          <router-link
                            :to="`/players/${encodeURIComponent(ranking.playerName)}`"
                            class="block transition-colors duration-300"
                          >
                            <h3
                              class="text-xl font-bold mb-1 hover:text-amber-300 transition-colors"
                              :class="{
                                'text-yellow-400': ranking.rank === 1,
                                'text-slate-300': ranking.rank === 2,
                                'text-amber-400': ranking.rank === 3
                              }"
                            >
                              <PlayerName 
                                :name="ranking.playerName" 
                                source="server-rankings"
                                :server-guid="serverContext?.serverGuid"
                                :clickable="true"
                                :show-compare-icon="false"
                              />
                            </h3>
                          </router-link>
                        </div>

                        <!-- Elite Stats -->
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div class="text-center">
                            <div class="text-lg mb-1">
                              🏆
                            </div>
                            <div class="text-xs text-slate-400 mb-1">
                              Battle Score
                            </div>
                            <div class="font-bold text-amber-400">
                              {{ ranking.totalScore.toLocaleString() }}
                            </div>
                          </div>
                          <div class="text-center">
                            <div class="text-lg mb-1">
                              ⚔️
                            </div>
                            <div class="text-xs text-slate-400 mb-1">
                              K/D
                            </div>
                            <div class="font-bold text-emerald-400">
                              {{ ranking.kdRatio.toFixed(2) }}
                            </div>
                          </div>
                          <div class="text-center">
                            <div class="text-lg mb-1">
                              🎯
                            </div>
                            <div class="text-xs text-slate-400 mb-1">
                              Kills
                            </div>
                            <div class="font-bold text-red-400">
                              {{ ranking.totalKills.toLocaleString() }}
                            </div>
                          </div>
                          <div class="text-center">
                            <div class="text-lg mb-1">
                              ⏱️
                            </div>
                            <div class="text-xs text-slate-400 mb-1">
                              Campaign
                            </div>
                            <div class="font-bold text-cyan-400 text-sm">
                              {{ formatPlayTime(ranking.totalPlayTimeMinutes) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Standard Ranking Card (Rank 4+) -->
                  <div
                    v-else
                    class="group relative"
                  >
                    <!-- Performance indicator line -->
                    <div
                      class="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                      :class="{
                        'bg-gradient-to-b from-purple-500 to-pink-500': ranking.rank <= 10,
                        'bg-gradient-to-b from-blue-500 to-cyan-500': ranking.rank <= 25 && ranking.rank > 10,
                        'bg-gradient-to-b from-emerald-500 to-green-500': ranking.rank <= 50 && ranking.rank > 25,
                        'bg-slate-500': ranking.rank > 50
                      }"
                    />
              
                    <!-- Main Ranking Card -->
                    <div class="ml-4 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-amber-500/30 overflow-hidden transition-all duration-200 cursor-pointer group-hover:bg-slate-800/60">
                      <div class="p-4">
                        <div class="flex items-center justify-between gap-4">
                          <!-- Rank and Player Info -->
                          <div class="flex items-center gap-4 flex-grow min-w-0">
                            <div class="relative flex-shrink-0">
                              <div class="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center border-2 border-slate-600/50 group-hover:border-amber-500/50 transition-colors">
                                <span class="text-sm font-bold text-slate-300 group-hover:text-amber-400">{{ ranking.rank }}</span>
                              </div>
                              <!-- Rank tier indicator -->
                              <div
                                class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full"
                                :class="{
                                  'bg-gradient-to-r from-purple-500 to-pink-500': ranking.rank <= 10,
                                  'bg-gradient-to-r from-blue-500 to-cyan-500': ranking.rank <= 25 && ranking.rank > 10,
                                  'bg-gradient-to-r from-emerald-500 to-green-500': ranking.rank <= 50 && ranking.rank > 25,
                                  'bg-slate-500': ranking.rank > 50
                                }"
                              />
                            </div>
                      
                            <div class="min-w-0">
                              <router-link
                                :to="`/players/${encodeURIComponent(ranking.playerName)}`"
                                class="font-semibold text-white hover:text-amber-300 transition-colors truncate block"
                              >
                                <PlayerName 
                                  :name="ranking.playerName" 
                                  source="server-rankings"
                                  :server-guid="serverContext?.serverGuid"
                                  :clickable="true"
                                  :show-compare-icon="false"
                                />
                              </router-link>
                            </div>
                          </div>

                          <!-- Compact Stats -->
                          <div class="flex items-center gap-4 text-sm flex-shrink-0">
                            <div class="text-center">
                              <div class="font-semibold text-amber-400">
                                {{ ranking.totalScore.toLocaleString() }}
                              </div>
                              <div class="text-xs text-slate-500">
                                Score
                              </div>
                            </div>
                            <div class="text-center">
                              <div class="font-semibold text-emerald-400">
                                {{ ranking.kdRatio.toFixed(2) }}
                              </div>
                              <div class="text-xs text-slate-500">
                                K/D
                              </div>
                            </div>
                            <div class="text-center">
                              <div class="font-semibold text-red-400">
                                {{ ranking.totalKills.toLocaleString() }}
                              </div>
                              <div class="text-xs text-slate-500">
                                Kills
                              </div>
                            </div>
                            <div class="text-center hidden sm:block">
                              <div class="text-cyan-400 font-semibold text-xs">
                                {{ formatPlayTime(ranking.totalPlayTimeMinutes) }}
                              </div>
                              <div class="text-xs text-slate-500">
                                Time
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Enhanced Pagination -->
              <div
                v-if="totalPages > 1"
                class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
              >
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div class="text-slate-400 text-sm">
                    <span class="font-semibold text-amber-400">Page {{ currentPage }}</span> of {{ totalPages }} 
                    • <span class="font-semibold text-amber-400">{{ totalItems.toLocaleString() }}</span> total warriors
                  </div>
            
                  <div class="flex items-center gap-2 justify-center lg:justify-end">
                    <button 
                      :disabled="currentPage === 1"
                      class="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600/50 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold" 
                      title="First Page"
                      @click="changePage(1)"
                    >
                      ⟨⟨
                    </button>
                    <button 
                      :disabled="currentPage === 1"
                      class="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600/50 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold" 
                      title="Previous Page"
                      @click="changePage(currentPage - 1)"
                    >
                      ⟨
                    </button>
              
                    <!-- Page Numbers -->
                    <div class="hidden sm:flex items-center gap-2 mx-2">
                      <button 
                        v-for="page in paginationRange" 
                        :key="page" 
                        class="px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                        :class="page === currentPage 
                          ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
                          : 'bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600/50 hover:border-amber-500/50 text-slate-300 hover:text-white'"
                        @click="changePage(page)"
                      >
                        {{ page }}
                      </button>
                    </div>
              
                    <!-- Current Page (Mobile) -->
                    <div class="sm:hidden px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-lg font-semibold mx-2">
                      {{ currentPage }}
                    </div>
              
                    <button 
                      :disabled="currentPage === totalPages"
                      class="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600/50 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold" 
                      title="Next Page"
                      @click="changePage(currentPage + 1)"
                    >
                      ⟩
                    </button>
                    <button 
                      :disabled="currentPage === totalPages"
                      class="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600/50 hover:border-amber-500/50 rounded-lg text-slate-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold" 
                      title="Last Page"
                      @click="changePage(totalPages)"
                    >
                      ⟩⟩
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-else-if="loading && rankings.length === 0"
            class="flex flex-col items-center justify-center py-20 text-slate-400"
          >
            <div class="w-12 h-12 border-4 border-slate-600 border-t-amber-400 rounded-full animate-spin mb-4" />
            <p class="text-lg text-slate-300">
              Loading elite warriors...
            </p>
          </div>

          <!-- Error State -->
          <div
            v-else-if="error"
            class="bg-slate-800/70 backdrop-blur-sm border border-red-800/50 rounded-xl p-8 text-center"
          >
            <div class="text-6xl mb-4">
              ⚠️
            </div>
            <p class="text-red-400 text-lg font-medium mb-4">
              {{ error }}
            </p>
            <button 
              class="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              @click="fetchRankings(currentPage)"
            >
              🔄 Retry Mission
            </button>
          </div>

          <!-- No Rankings State -->
          <div
            v-else
            class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center"
          >
            <div class="text-6xl mb-4 opacity-50">
              🏆
            </div>
            <h3 class="text-2xl font-bold text-slate-400 mb-2">
              No Warriors Found
            </h3>
            <p class="text-slate-500 mb-6">
              This battlefield awaits its first legends, or they're still earning their stripes.
            </p>
            <button 
              class="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 font-semibold" 
              @click="fetchRankings(currentPage)"
            >
              🔄 Refresh Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

 