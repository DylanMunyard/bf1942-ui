<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import PlayerName from '@/components/PlayerName.vue';

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
const pageSize = ref(20);

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

// Format date to a readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
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
  if (pageSize.value !== 20) query.pageSize = pageSize.value.toString();
  
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
  <div class="min-h-screen bg-slate-900 px-3 sm:px-6">
    <!-- Server Context Header -->
    <div
      v-if="serverContext"
      class="bg-slate-800/40 rounded-xl p-6 mb-6"
    >
      <div class="flex items-center gap-3 mb-6">
        <h1 class="text-2xl font-bold text-white">{{ serverContext.serverName }}</h1>
      </div>
    </div>

    <!-- Filter controls -->
    <div class="mb-6">
      <div class="lg:hidden mb-4">
        <button
          class="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:border-cyan-500/50 transition-all duration-200 font-medium"
          @click="showFilters = !showFilters"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-cyan-400"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          <span
            v-if="playerNameFilter || minScoreFilter !== '' || minKillsFilter !== '' || minDeathsFilter !== '' || minKdRatioFilter !== '' || minPlayTimeMinutesFilter !== ''"
            class="text-cyan-400 text-sm ml-auto mr-2"
          >●</span>
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
            class="transition-transform duration-200"
            :class="{ 'rotate-180': showFilters }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      
      <div
        class="transition-all duration-300 overflow-hidden lg:max-h-none lg:opacity-100"
        :class="showFilters ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100'"
      >
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex flex-col min-w-48">
            <label for="playerNameFilter" class="mb-2 text-sm font-medium text-slate-300">Filter by Player Name:</label>
            <div class="relative">
              <input 
                id="playerNameFilter" 
                v-model="playerNameInputValue" 
                type="text"
                placeholder="Enter player name" 
                class="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                @input="handlePlayerNameFilterChange(playerNameInputValue)"
              >
              <span
                v-if="isSearching"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              >🔍</span>
              <button 
                v-if="playerNameInputValue && !isSearching" 
                class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-full transition-all duration-200" 
                title="Clear filter"
                @click="clearPlayerNameFilter"
              >×</button>
            </div>
          </div>

          <div class="flex flex-col min-w-32">
            <label for="minScoreFilter" class="mb-2 text-sm font-medium text-slate-300">Min Score:</label>
            <input 
              id="minScoreFilter" 
              v-model="minScoreInputValue" 
              type="number"
              placeholder="e.g. 1000"
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              min="0"
              @input="handleMinScoreChange(minScoreInputValue)"
            >
          </div>

          <div class="flex flex-col min-w-32">
            <label for="minKillsFilter" class="mb-2 text-sm font-medium text-slate-300">Min Kills:</label>
            <input 
              id="minKillsFilter" 
              v-model="minKillsInputValue" 
              type="number"
              placeholder="e.g. 100"
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              min="0"
              @input="handleMinKillsChange(minKillsInputValue)"
            >
          </div>

          <div class="flex flex-col min-w-32">
            <label for="minDeathsFilter" class="mb-2 text-sm font-medium text-slate-300">Min Deaths:</label>
            <input 
              id="minDeathsFilter" 
              v-model="minDeathsInputValue" 
              type="number"
              placeholder="e.g. 50"
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              min="0"
              @input="handleMinDeathsChange(minDeathsInputValue)"
            >
          </div>

          <div class="flex flex-col min-w-32">
            <label for="minKdRatioFilter" class="mb-2 text-sm font-medium text-slate-300">Min K/D Ratio:</label>
            <input 
              id="minKdRatioFilter" 
              v-model="minKdRatioInputValue" 
              type="number"
              placeholder="e.g. 1.5"
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              min="0"
              step="0.1"
              @input="handleMinKdRatioChange(minKdRatioInputValue)"
            >
          </div>

          <div class="flex flex-col min-w-40">
            <label for="minPlayTimeFilter" class="mb-2 text-sm font-medium text-slate-300">Min Play Time (minutes):</label>
            <input 
              id="minPlayTimeFilter" 
              v-model="minPlayTimeInputValue" 
              type="number"
              placeholder="e.g. 60"
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              min="0"
              @input="handleMinPlayTimeChange(minPlayTimeInputValue)"
            >
          </div>

          <button
            class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all duration-200 font-medium"
            @click="resetFilters"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Rankings Table -->
    <div class="bg-slate-800/40 rounded-xl p-6">
      <h2 class="text-xl font-bold text-white mb-6">Player Rankings</h2>
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20"
      >
        <div class="w-12 h-12 border-4 border-slate-700/50 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <p class="text-slate-300">Loading rankings...</p>
      </div>
      <div
        v-else-if="error"
        class="flex items-center justify-center py-20"
      >
        <p class="text-red-400 font-semibold">
          {{ error }}
        </p>
      </div>
      <div
        v-else-if="rankings.length > 0"
        class="overflow-x-auto"
      >
        <!-- Table header info -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
          <div class="font-semibold text-slate-300">
            Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} players
          </div>
          <div class="flex items-center gap-3">
            <label for="pageSize" class="text-sm text-slate-400">Items per page:</label>
            <select
              id="pageSize"
              v-model="pageSize"
              class="px-3 py-1 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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

        <table class="w-full border-collapse border border-slate-700/30">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
              <th class="p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">Rank</th>
              <th class="p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">Player</th>
              <th
                class="hidden lg:table-cell p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30"
                :class="{ 'bg-cyan-500/20 text-cyan-400': orderBy === 'TotalScore' }"
                @click="handleSort('TotalScore')"
              >
                Score {{ getSortIcon('TotalScore') }}
              </th>
              <th
                class="hidden lg:table-cell p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30"
                :class="{ 'bg-cyan-500/20 text-cyan-400': orderBy === 'TotalKills' }"
                @click="handleSort('TotalKills')"
              >
                Kills {{ getSortIcon('TotalKills') }}
              </th>
              <th
                class="hidden lg:table-cell p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30"
                :class="{ 'bg-cyan-500/20 text-cyan-400': orderBy === 'TotalDeaths' }"
                @click="handleSort('TotalDeaths')"
              >
                Deaths {{ getSortIcon('TotalDeaths') }}
              </th>
              <th
                class="hidden lg:table-cell p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30"
                :class="{ 'bg-cyan-500/20 text-cyan-400': orderBy === 'KDRatio' }"
                @click="handleSort('KDRatio')"
              >
                K/D {{ getSortIcon('KDRatio') }}
              </th>
              <th
                class="hidden lg:table-cell p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30"
                :class="{ 'bg-cyan-500/20 text-cyan-400': orderBy === 'TotalPlayTimeMinutes' }"
                @click="handleSort('TotalPlayTimeMinutes')"
              >
                Play Time {{ getSortIcon('TotalPlayTimeMinutes') }}
              </th>
              <th class="lg:hidden p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                Stats
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ranking in rankings"
              :key="ranking.playerName"
              class="lg:table-row flex flex-col lg:hover:bg-slate-800/20 border-b border-slate-700/30 transition-all duration-300"
            >
              <td class="lg:table-cell lg:p-3 lg:font-bold lg:text-white flex justify-between lg:justify-start items-center p-4 lg:border-0 border-b border-slate-700/20">
                <span class="lg:hidden text-slate-400 text-sm font-medium">Rank:</span>
                <span class="text-lg lg:text-base font-bold text-white">#{{ ranking.rank }}</span>
              </td>
              <td class="lg:table-cell lg:p-3 flex justify-between lg:justify-start items-center p-4 pb-2 lg:pb-3 lg:border-0">
                <span class="lg:hidden text-slate-400 text-sm font-medium">Player:</span>
                <router-link
                  :to="`/players/${encodeURIComponent(ranking.playerName)}`"
                  class="text-cyan-400 hover:text-cyan-300 font-medium no-underline hover:underline transition-colors"
                >
                  <PlayerName 
                    :name="ranking.playerName" 
                    source="server-rankings"
                    :server-guid="serverContext?.serverGuid"
                    :clickable="true"
                    :show-compare-icon="true"
                  />
                </router-link>
              </td>
              <td class="hidden lg:table-cell p-3 text-white font-semibold">
                🏆 {{ ranking.totalScore }}
              </td>
              <td class="hidden lg:table-cell p-3 text-white">
                <div class="flex items-center gap-1">
                  <img
                    src="@/assets/kills.png"
                    alt="Kills"
                    class="w-5 h-5"
                  > {{ ranking.totalKills }}
                </div>
              </td>
              <td class="hidden lg:table-cell p-3 text-white">
                <div class="flex items-center gap-1">
                  <img
                    src="@/assets/deaths.png"
                    alt="Deaths"
                    class="w-5 h-5"
                  > {{ ranking.totalDeaths }}
                </div>
              </td>
              <td class="hidden lg:table-cell p-3 text-white font-semibold">
                📊 {{ ranking.kdRatio.toFixed(2) }}
              </td>
              <td class="hidden lg:table-cell p-3 text-white">
                ⏱️ {{ formatPlayTime(ranking.totalPlayTimeMinutes) }}
              </td>
              <td class="lg:hidden p-4 pt-2">
                <div class="flex flex-wrap gap-3">
                  <span
                    class="inline-flex items-center gap-1 px-3 py-1 bg-slate-900/60 rounded-lg text-sm font-medium text-slate-200"
                    title="Score"
                  >🏆 {{ ranking.totalScore }}</span>
                  <span
                    class="inline-flex items-center gap-1 px-3 py-1 bg-slate-900/60 rounded-lg text-sm font-medium text-slate-200"
                    title="Kills • Deaths • K/D Ratio"
                  >
                    <img
                      src="@/assets/kills.png"
                      alt="Kills"
                      class="w-4 h-4"
                    > {{ ranking.totalKills }} • <img
                      src="@/assets/deaths.png"
                      alt="Deaths"
                      class="w-4 h-4"
                    > {{ ranking.totalDeaths }} • 📊 {{ ranking.kdRatio.toFixed(2) }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-3 py-1 bg-slate-900/60 rounded-lg text-sm font-medium text-slate-200"
                    title="Play Time"
                  >⏱️ {{ formatPlayTime(ranking.totalPlayTimeMinutes) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex justify-center mt-6"
        >
          <div class="flex items-center gap-2">
            <button 
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              :disabled="currentPage === 1" 
              title="First Page"
              @click="changePage(1)"
            >
              &laquo;
            </button>
            <button 
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              :disabled="currentPage === 1" 
              title="Previous Page"
              @click="changePage(currentPage - 1)"
            >
              &lsaquo;
            </button>
            <button 
              v-for="page in paginationRange" 
              :key="page" 
              class="px-3 py-2 border rounded-lg transition-all duration-200 font-medium" 
              :class="page === currentPage ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50'" 
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <button 
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              :disabled="currentPage === totalPages" 
              title="Next Page"
              @click="changePage(currentPage + 1)"
            >
              &rsaquo;
            </button>
            <button 
              class="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              :disabled="currentPage === totalPages" 
              title="Last Page"
              @click="changePage(totalPages)"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
      <div
        v-else
        class="flex items-center justify-center py-20"
      >
        <p class="text-slate-400">No rankings available for this server.</p>
      </div>
    </div>
  </div>
</template>

 