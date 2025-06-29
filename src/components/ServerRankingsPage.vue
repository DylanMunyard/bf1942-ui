<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
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
  let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

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
  fetchRankings();
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
  <div class="server-rankings-container">
    <!-- Server Context Header -->
    <div v-if="serverContext" class="server-context">
      <div class="server-context-header">
        <h1>{{ serverContext.serverName }}</h1>
      </div>
    </div>

    <!-- Filter controls -->
    <div class="filter-section">
      <div class="filter-toggle">
        <button @click="showFilters = !showFilters" class="filter-toggle-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="filter-icon">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filters
          <span v-if="playerNameFilter || minScoreFilter !== '' || minKillsFilter !== '' || minDeathsFilter !== '' || minKdRatioFilter !== '' || minPlayTimeMinutesFilter !== ''" class="active-filter-indicator">●</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon" :class="{ 'rotated': showFilters }">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      
      <div class="filter-container" :class="{ 'filters-visible': showFilters }">
        <div class="filter-group">
          <label for="playerNameFilter">Filter by Player Name:</label>
          <div class="input-with-clear">
            <input 
              type="text" 
              id="playerNameFilter" 
              v-model="playerNameInputValue"
              @input="handlePlayerNameFilterChange(playerNameInputValue)" 
              placeholder="Enter player name"
              class="filter-input"
            />
            <span v-if="isSearching" class="search-indicator">🔍</span>
            <span 
              v-if="playerNameInputValue && !isSearching" 
              class="clear-input" 
              @click="clearPlayerNameFilter"
              title="Clear filter"
            >×</span>
          </div>
        </div>

        <div class="filter-group">
          <label for="minScoreFilter">Min Score:</label>
          <input 
            type="number" 
            id="minScoreFilter" 
            v-model="minScoreInputValue"
            @input="handleMinScoreChange(minScoreInputValue)"
            placeholder="e.g. 1000"
            class="filter-input"
            min="0"
          />
        </div>

        <div class="filter-group">
          <label for="minKillsFilter">Min Kills:</label>
          <input 
            type="number" 
            id="minKillsFilter" 
            v-model="minKillsInputValue"
            @input="handleMinKillsChange(minKillsInputValue)"
            placeholder="e.g. 100"
            class="filter-input"
            min="0"
          />
        </div>

        <div class="filter-group">
          <label for="minDeathsFilter">Min Deaths:</label>
          <input 
            type="number" 
            id="minDeathsFilter" 
            v-model="minDeathsInputValue"
            @input="handleMinDeathsChange(minDeathsInputValue)"
            placeholder="e.g. 50"
            class="filter-input"
            min="0"
          />
        </div>

        <div class="filter-group">
          <label for="minKdRatioFilter">Min K/D Ratio:</label>
          <input 
            type="number" 
            id="minKdRatioFilter" 
            v-model="minKdRatioInputValue"
            @input="handleMinKdRatioChange(minKdRatioInputValue)"
            placeholder="e.g. 1.5"
            class="filter-input"
            min="0"
            step="0.1"
          />
        </div>

        <div class="filter-group">
          <label for="minPlayTimeFilter">Min Play Time (minutes):</label>
          <input 
            type="number" 
            id="minPlayTimeFilter" 
            v-model="minPlayTimeInputValue"
            @input="handleMinPlayTimeChange(minPlayTimeInputValue)"
            placeholder="e.g. 60"
            class="filter-input"
            min="0"
          />
        </div>

        <button @click="resetFilters" class="reset-filters-button">
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Rankings Table -->
    <div class="rankings-section">
      <h2>Player Rankings</h2>
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading rankings...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
      </div>
      <div v-else-if="rankings.length > 0" class="rankings-table-container">
        <!-- Table header info -->
        <div class="table-header">
          <div class="rankings-count">
            Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} players
          </div>
          <div class="page-size-selector">
            <label for="pageSize">Items per page:</label>
            <select id="pageSize" v-model="pageSize" @change="handlePageSizeChange">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th class="desktop-only sortable" @click="handleSort('TotalScore')" :class="{ 'sorted': orderBy === 'TotalScore' }">
                Score {{ getSortIcon('TotalScore') }}
              </th>
              <th class="desktop-only sortable" @click="handleSort('TotalKills')" :class="{ 'sorted': orderBy === 'TotalKills' }">
                Kills {{ getSortIcon('TotalKills') }}
              </th>
              <th class="desktop-only sortable" @click="handleSort('TotalDeaths')" :class="{ 'sorted': orderBy === 'TotalDeaths' }">
                Deaths {{ getSortIcon('TotalDeaths') }}
              </th>
              <th class="desktop-only sortable" @click="handleSort('KDRatio')" :class="{ 'sorted': orderBy === 'KDRatio' }">
                K/D {{ getSortIcon('KDRatio') }}
              </th>
              <th class="desktop-only sortable" @click="handleSort('TotalPlayTimeMinutes')" :class="{ 'sorted': orderBy === 'TotalPlayTimeMinutes' }">
                Play Time {{ getSortIcon('TotalPlayTimeMinutes') }}
              </th>
              <th class="mobile-only">Stats</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ranking in rankings" :key="ranking.playerName" class="ranking-row">
              <td class="rank-cell">#{{ ranking.rank }}</td>
              <td class="player-cell">
                <router-link :to="`/players/${encodeURIComponent(ranking.playerName)}`" class="player-link">
                  <PlayerName 
                    :name="ranking.playerName" 
                    source="server-rankings"
                    :server-guid="serverContext?.serverGuid"
                    :clickable="true"
                    :showCompareIcon="true"
                  />
                </router-link>
              </td>
              <td class="desktop-only score-cell">🏆 {{ ranking.totalScore }}</td>
              <td class="desktop-only kills-cell">
                <img src="@/assets/kills.png" alt="Kills" class="kills-icon" /> {{ ranking.totalKills }}
              </td>
              <td class="desktop-only deaths-cell">
                <img src="@/assets/deaths.png" alt="Deaths" class="deaths-icon" /> {{ ranking.totalDeaths }}
              </td>
              <td class="desktop-only kd-cell">📊 {{ ranking.kdRatio.toFixed(2) }}</td>
              <td class="desktop-only playtime-cell">⏱️ {{ formatPlayTime(ranking.totalPlayTimeMinutes) }}</td>
              <td class="mobile-only stats-cell">
                <div class="mobile-stats">
                  <span class="stat-item" title="Score">🏆 {{ ranking.totalScore }}</span>
                  <span class="stat-item combat-badge" title="Kills • Deaths • K/D Ratio">
                    <img src="@/assets/kills.png" alt="Kills" class="kills-icon" /> {{ ranking.totalKills }} • <img src="@/assets/deaths.png" alt="Deaths" class="deaths-icon" /> {{ ranking.totalDeaths }} • 📊 {{ ranking.kdRatio.toFixed(2) }}
                  </span>
                  <span class="stat-item" title="Play Time">⏱️ {{ formatPlayTime(ranking.totalPlayTimeMinutes) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination-container">
          <div class="pagination-controls">
            <button 
              @click="changePage(1)" 
              class="pagination-button" 
              :disabled="currentPage === 1"
              title="First Page"
            >
              &laquo;
            </button>
            <button 
              @click="changePage(currentPage - 1)" 
              class="pagination-button" 
              :disabled="currentPage === 1"
              title="Previous Page"
            >
              &lsaquo;
            </button>
            <button 
              v-for="page in paginationRange" 
              :key="page" 
              @click="changePage(page)" 
              class="pagination-button" 
              :class="{ active: page === currentPage }"
            >
              {{ page }}
            </button>
            <button 
              @click="changePage(currentPage + 1)" 
              class="pagination-button" 
              :disabled="currentPage === totalPages"
              title="Next Page"
            >
              &rsaquo;
            </button>
            <button 
              @click="changePage(totalPages)" 
              class="pagination-button" 
              :disabled="currentPage === totalPages"
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
      <div v-else class="no-data-container">
        <p>No rankings available for this server.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-rankings-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 40px;
}

.server-context {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.server-context-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.server-context-header h1 {
  margin: 0;
  color: var(--color-heading);
}

.rankings-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 20px;
}

.rankings-section h2 {
  margin: 0 0 20px 0;
  color: var(--color-heading);
}

.rankings-table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

th {
  background-color: var(--color-background-mute);
  font-weight: bold;
  color: var(--color-heading);
}

/* Row hover highlight removed */

.rank-cell {
  font-weight: bold;
  color: var(--color-heading);
}

.player-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.player-link:hover {
  text-decoration: underline;
}

.loading-container, .error-container, .no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #ff5252;
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.pagination-info {
  color: var(--color-text-muted);
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  gap: 5px;
}

.pagination-button {
  padding: 8px 16px;
  background-color: var(--color-background-mute);
  border: none;
  border-radius: 4px;
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.active {
  background-color: var(--color-primary);
  color: white;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rankings-count {
  font-weight: bold;
  color: var(--color-text);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-size-selector label {
  color: var(--color-text-muted);
  font-size: 14px;
}

.page-size-selector select {
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-mute);
  color: var(--color-text);
}

/* Desktop column styling */
.desktop-only {
  display: table-cell;
}

.mobile-only {
  display: none;
}

.score-cell {
  font-weight: bold;
  color: var(--color-heading);
}

.combat-badge {
  background-color: var(--color-background);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid var(--color-border);
}

/* Hide mobile stats on desktop */
.mobile-stats {
  display: none;
}

/* Mobile styles */
@media (max-width: 768px) {
  .server-rankings-container {
    padding: 0 20px;
  }



  /* Hide filters by default on mobile */
  .filter-container {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    margin-bottom: 0;
    transition: all 0.3s ease;
  }

  /* Show filters when toggled */
  .filter-container.filters-visible {
    max-height: 800px;
    opacity: 1;
    margin-bottom: 20px;
  }

  .filter-group {
    min-width: 100%;
    margin-bottom: 15px;
  }

  .reset-filters-button {
    width: 100%;
    align-self: stretch;
  }

  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .page-size-selector {
    width: 100%;
    justify-content: space-between;
  }

  /* Hide desktop columns on mobile */
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: table-cell;
  }

  /* Mobile table layout: Use grid to create a compact layout per ranking */
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  thead th {
    display: none;
  }

  .ranking-row {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "player rank"
      "stats stats";
    gap: 4px 10px;
    background: transparent;
    border: none;
    border-radius: 0;
    margin-bottom: 0;
    padding: 12px 0;
    box-shadow: none;
    border-bottom: 1px solid var(--color-border);
  }

  /* Mobile row hover highlight removed */

  .ranking-row td {
    display: block;
    width: 100%;
    border: none;
    padding: 0;
    background: transparent;
  }

  /* Explicitly hide desktop column cells on mobile */
  .ranking-row .desktop-only {
    display: none !important;
  }

  /* Grid cell placement and styling */
  .rank-cell {
    grid-area: rank;
    align-self: center;
    text-align: right;
    font-weight: bold;
    color: var(--color-heading);
    font-size: 1.1rem;
  }

  .player-cell {
    grid-area: player;
    align-self: center;
    text-align: left;
    word-break: break-word;
    min-width: 0;
  }

  .player-link {
    font-size: 1.1rem;
    font-weight: 600;
  }

  /* Hide desktop stats on mobile */
  .desktop-stats {
    display: none;
  }

  /* Show mobile stats cell */
  .stats-cell {
    grid-area: stats;
  }

  .mobile-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .mobile-stats .stat-item {
    background-color: var(--color-background);
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
  }

  .pagination-container {
    justify-content: center;
    margin-top: 20px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    gap: 8px;
  }

  .pagination-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

.kills-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

.deaths-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

/* Filter section styles - matching PlayersPage.vue */
.filter-section {
  margin-bottom: 20px;
}

.filter-toggle {
  display: none;
  margin-bottom: 15px;
}

/* Show filter toggle only on mobile */
@media (max-width: 768px) {
  .filter-toggle {
    display: block;
  }
}

.filter-toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.filter-toggle-button:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-accent);
}

.filter-toggle-button:active {
  transform: translateY(1px);
}

.filter-icon {
  color: var(--color-accent);
}

.active-filter-indicator {
  color: var(--color-accent);
  font-size: 12px;
  margin-left: auto;
  margin-right: -4px;
}

.chevron-icon {
  transition: transform 0.2s ease;
  margin-left: auto;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  transition: all 0.3s ease;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

.filter-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: var(--color-text);
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.input-with-clear {
  position: relative;
  display: flex;
  align-items: center;
}

.search-indicator {
  position: absolute;
  right: 10px;
  font-size: 18px;
  color: var(--color-text-muted);
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-input {
  position: absolute;
  right: 10px;
  font-size: 18px;
  color: var(--color-text-muted);
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-input:hover {
  color: var(--color-text-muted);
  background-color: var(--color-background-mute);
}

.reset-filters-button {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  height: 36px;
  align-self: flex-end;
}

.reset-filters-button:hover {
  background-color: #5a6268;
}

/* Sortable column styles */
.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable:hover {
  background-color: var(--color-background-mute);
}

.sortable.sorted {
  background-color: var(--color-accent);
  color: white;
}
</style> 