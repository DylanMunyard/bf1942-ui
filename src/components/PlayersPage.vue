<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchPlayersList, PlayerListItem } from '../services/playerStatsService';

// Router
const router = useRouter();
const route = useRoute();

// State variables
const players = ref<PlayerListItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const sortBy = ref<string>('lastSeen');
const sortOrder = ref<'asc' | 'desc'>('desc');
// Pagination state
const currentPage = ref(1);
const pageSize = ref(50);
const totalItems = ref(0);
const totalPages = ref(0);
// Mobile filters state
const showFilters = ref(false);

// Filter variables
const nameFilter = ref('');
const nameInputValue = ref(''); // Separate value for the input display
const gameIdFilter = ref('');
const serverNameFilter = ref('');
const uniqueGameIds = ref<string[]>([]);
const uniqueServerNames = ref<string[]>([]);

// Debounced search functionality
const searchTimeout = ref<any>(null);
const isSearching = ref(false);

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

// Format date to a readable format in the user's locale
const formatDate = (dateString: string): string => {
  // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
};

// Format date to a human-readable relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString: string): string => {
  // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } else if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
};



// Fetch players data with pagination, sorting, and filtering
const fetchPlayersData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Build filter object from current filter values
    const filters: Record<string, string> = {};
    if (nameFilter.value) filters.playerName = nameFilter.value;
    if (gameIdFilter.value) filters.gameId = gameIdFilter.value;
    if (serverNameFilter.value) filters.serverName = serverNameFilter.value;

    // Fetch the players list with pagination, sorting, and filtering
    const result = await fetchPlayersList(
      currentPage.value,
      pageSize.value,
      sortBy.value,
      sortOrder.value,
      filters
    );

    players.value = result.items;
    totalItems.value = result.totalItems;
    totalPages.value = result.totalPages;

    // Update unique values for filters (these will come from server response eventually)
    updateUniqueGameIds();
    updateUniqueServerNames();
  } catch (err) {
    console.error('Error fetching players data:', err);
    error.value = 'Failed to fetch players data. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Update the list of unique game IDs from the players
const updateUniqueGameIds = () => {
  const gameIds = new Set<string>();

  players.value.forEach(player => {
    if (player.currentServer && player.currentServer.gameId) {
      gameIds.add(player.currentServer.gameId);
    }
  });

  uniqueGameIds.value = Array.from(gameIds).sort();
};

// Update the list of unique server names from the players
const updateUniqueServerNames = () => {
  const serverNames = new Set<string>();

  players.value.forEach(player => {
    if (player.currentServer && player.currentServer.serverName) {
      serverNames.add(player.currentServer.serverName);
    }
  });

  uniqueServerNames.value = Array.from(serverNames).sort();
};

// Handle sort column click - now refetches data from server
const handleSort = (column: string) => {
  // If clicking the same column, toggle order
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    // If clicking a new column, set it as the sort column and default to descending
    sortBy.value = column;
    sortOrder.value = 'desc';
  }

  // Reset to first page and refetch data
  currentPage.value = 1;
  updateQueryParams();
  fetchPlayersData();
};

// Debounced name filter function
const debouncedNameSearch = (searchTerm: string) => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  isSearching.value = true;

  // Set new timeout
  searchTimeout.value = setTimeout(() => {
    nameFilter.value = searchTerm;
    currentPage.value = 1; // Reset to first page when filtering
    isSearching.value = false;
    updateQueryParams();
    fetchPlayersData();
  }, 500); // 500ms delay
};

// Handle name filter change - now with debouncing
const handleNameFilterChange = (searchTerm: string) => {
  debouncedNameSearch(searchTerm);
};

// Handle game ID filter change - now triggers server-side search
const handleGameIdFilterChange = (event: Event) => {
  gameIdFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  updateQueryParams();
  fetchPlayersData();
};

// Handle server name filter change - now triggers server-side search
const handleServerNameFilterChange = (event: Event) => {
  serverNameFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  updateQueryParams();
  fetchPlayersData();
};

// Clear name filter
const clearNameFilter = () => {
  // Cancel any pending search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
    searchTimeout.value = null;
  }
  
  nameFilter.value = '';
  nameInputValue.value = '';
  isSearching.value = false;
  currentPage.value = 1; // Reset to first page when clearing filter
  updateQueryParams();
  fetchPlayersData();
};

// Reset all filters
const resetFilters = () => {
  nameFilter.value = '';
  nameInputValue.value = '';
  gameIdFilter.value = '';
  serverNameFilter.value = '';
  currentPage.value = 1; // Reset to first page when resetting filters
  updateQueryParams();
  fetchPlayersData();
};

// Function to go to a specific page
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  updateQueryParams();
  fetchPlayersData();
};

// Function to change page size
const changePageSize = (newPageSize: number) => {
  pageSize.value = newPageSize;
  currentPage.value = 1; // Reset to first page
  updateQueryParams();
  fetchPlayersData();
};

// Computed property for pagination range display
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

// Initialize state from URL query parameters
const initializeFromQuery = () => {
  const query = route.query;
  
  // Set filters from query params
  if (query.name && typeof query.name === 'string') {
    nameFilter.value = query.name;
    nameInputValue.value = query.name;
  }
  if (query.gameId && typeof query.gameId === 'string') {
    gameIdFilter.value = query.gameId;
  }
  if (query.server && typeof query.server === 'string') {
    serverNameFilter.value = query.server;
  }
  
  // Set sorting from query params
  if (query.sortBy && typeof query.sortBy === 'string') {
    sortBy.value = query.sortBy;
  }
  if (query.sortOrder && (query.sortOrder === 'asc' || query.sortOrder === 'desc')) {
    sortOrder.value = query.sortOrder;
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
    if (!isNaN(size) && [25, 50, 100].includes(size)) {
      pageSize.value = size;
    }
  }
};

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string> = {};
  
  // Add filters to query
  if (nameFilter.value) query.name = nameFilter.value;
  if (gameIdFilter.value) query.gameId = gameIdFilter.value;
  if (serverNameFilter.value) query.server = serverNameFilter.value;
  
  // Add sorting to query
  if (sortBy.value !== 'lastSeen') query.sortBy = sortBy.value;
  if (sortOrder.value !== 'desc') query.sortOrder = sortOrder.value;
  
  // Add pagination to query
  if (currentPage.value !== 1) query.page = currentPage.value.toString();
  if (pageSize.value !== 50) query.pageSize = pageSize.value.toString();
  
  // Update URL without triggering navigation
  router.replace({ query });
};

// Fetch data when component is mounted
onMounted(() => {
  initializeFromQuery();
  fetchPlayersData();
});

// Watch for external changes to nameFilter and sync with input
watch(nameFilter, (newValue) => {
  if (newValue !== nameInputValue.value) {
    nameInputValue.value = newValue;
  }
});

// Cleanup when component is unmounted
onUnmounted(() => {
  // Clear any pending search timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<template>
  <div class="players-page-container">
    <div class="header">
      <h1>Players</h1>
      <button
        class="refresh-button"
        @click="fetchPlayersData"
      >
        <span v-if="!loading">Refresh</span>
        <span
          v-else
          class="spinner"
        />
      </button>
    </div>

    <!-- Filter controls -->
    <div class="filter-section">
      <!-- Always visible name search on mobile -->
      <div class="mobile-name-search">
        <div class="filter-group">
          <label for="mobileNameFilter">Search Players:</label>
          <div class="input-with-clear">
            <input 
              id="mobileNameFilter" 
              v-model="nameInputValue" 
              type="text"
              placeholder="Enter player name" 
              class="filter-input"
              @input="handleNameFilterChange(nameInputValue)"
            >
            <span
              v-if="isSearching"
              class="search-indicator"
            >🔍</span>
            <span 
              v-if="nameInputValue && !isSearching" 
              class="clear-input" 
              title="Clear filter"
              @click="clearNameFilter"
            >×</span>
          </div>
        </div>
      </div>

      <div class="filter-toggle">
        <button
          class="filter-toggle-button"
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
            class="filter-icon"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          More Filters
          <span
            v-if="gameIdFilter || serverNameFilter"
            class="active-filter-indicator"
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
            class="chevron-icon"
:class="{ 'rotated': showFilters }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      
      <div
        class="filter-container"
        :class="{ 'filters-visible': showFilters }"
      >
        <div class="filter-group desktop-name-filter">
          <label for="nameFilter">Filter by Name:</label>
          <div class="input-with-clear">
            <input 
              id="nameFilter" 
              v-model="nameInputValue" 
              type="text"
              placeholder="Enter player name" 
              class="filter-input"
              @input="handleNameFilterChange(nameInputValue)"
            >
            <span
              v-if="isSearching"
              class="search-indicator"
            >🔍</span>
            <span 
              v-if="nameInputValue && !isSearching" 
              class="clear-input" 
              title="Clear filter"
              @click="clearNameFilter"
            >×</span>
          </div>
        </div>

        <div class="filter-group">
          <label for="gameIdFilter">Currently Playing:</label>
          <select 
            id="gameIdFilter" 
            v-model="gameIdFilter" 
            class="filter-select"
            @change="handleGameIdFilterChange"
          >
            <option value="">
              All Games
            </option>
            <option
              v-for="gameId in uniqueGameIds"
              :key="gameId"
              :value="gameId"
            >
              {{ gameId }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="serverNameFilter">Currently Playing On:</label>
          <select 
            id="serverNameFilter" 
            v-model="serverNameFilter" 
            class="filter-select"
            @change="handleServerNameFilterChange"
          >
            <option value="">
              All Servers
            </option>
            <option
              v-for="serverName in uniqueServerNames"
              :key="serverName"
              :value="serverName"
            >
              {{ serverName }}
            </option>
          </select>
        </div>

        <button
          class="reset-filters-button"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <div
      v-if="loading && players.length === 0"
      class="loading"
    >
      Loading players data...
    </div>
    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="players.length > 0"
      class="players-table-container"
    >
      <!-- Players count and pagination info -->
      <div class="table-header">
        <div class="players-count">
          Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} players
        </div>
        <div class="page-size-selector">
          <label for="pageSize">Players per page:</label>
          <select
            id="pageSize"
            :value="pageSize"
            @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
          >
            <option value="25">
              25
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

      <table>
        <thead>
          <tr>
            <th
              class="sortable"
              @click="handleSort('playerName')"
            >
              Player Name
              <span
                v-if="sortBy === 'playerName'"
                class="sort-indicator"
              >
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th
              class="sortable"
              @click="handleSort('totalPlayTimeMinutes')"
            >
              Total Play Time
              <span
                v-if="sortBy === 'totalPlayTimeMinutes'"
                class="sort-indicator"
              >
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th
              class="sortable"
              @click="handleSort('lastSeen')"
            >
              Last Seen
              <span
                v-if="sortBy === 'lastSeen'"
                class="sort-indicator"
              >
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th
              class="sortable"
              @click="handleSort('isActive')"
            >
              Status
              <span
                v-if="sortBy === 'isActive'"
                class="sort-indicator"
              >
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="player in players"
            :key="player.playerName"
            class="player-row"
          >
            <td class="player-name-cell">
              <router-link
                :to="`/players/${encodeURIComponent(player.playerName)}`"
                class="player-name-link"
              >
                {{ player.playerName }}
              </router-link>
              <div
                v-if="player.currentServer"
                class="current-server"
              >
                <router-link
                  :to="`/servers/${encodeURIComponent(player.currentServer.serverName)}`"
                  class="server-name-link"
                >
                  {{ player.currentServer.serverName }}
                </router-link>
              </div>
            </td>
            <td class="play-time-cell">
              {{ formatPlayTime(player.totalPlayTimeMinutes) }}
            </td>
            <td
              class="last-seen-cell"
              :title="formatDate(player.lastSeen)"
            >
              <span
                v-if="formatRelativeTime(player.lastSeen) === 'Just now'"
                class="online-badge"
              >Online</span>
              <span v-else>{{ formatRelativeTime(player.lastSeen) }}</span>
            </td>
            <td class="status-cell">
              <div
                v-if="player.isActive"
                class="active-status"
              >
                <div class="server-info">
                  <router-link
                    v-if="player.currentServer"
                    :to="`/servers/${encodeURIComponent(player.currentServer.serverName)}`"
                    class="server-name-link"
                  >
                    {{ player.currentServer.serverName }}
                  </router-link>
                  <span v-else>Online</span>
                </div>
                <div
                  v-if="player.currentServer && (player.currentServer.sessionKills !== undefined || player.currentServer.sessionDeaths !== undefined)"
                  class="player-stats"
                >
                  <span class="stat-item">K: {{ player.currentServer.sessionKills || 0 }}</span>
                  <span class="stat-item">D: {{ player.currentServer.sessionDeaths || 0 }}</span>
                  <span class="stat-item"><img
                    src="@/assets/kdr.png"
                    alt="KDR"
                    class="kdr-icon"
                  > {{ player.currentServer.sessionDeaths ? ((player.currentServer.sessionKills || 0) / player.currentServer.sessionDeaths).toFixed(2) : player.currentServer.sessionKills || 0 }}</span>
                </div>
              </div>
              <div
                v-else
                class="inactive-status"
              >
                Offline
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination controls -->
      <div
        v-if="totalPages > 1"
        class="pagination-container"
      >
        <div class="pagination-controls">
          <button 
            class="pagination-button" 
            :disabled="currentPage === 1" 
            title="First Page"
            @click="goToPage(1)"
          >
            &laquo;
          </button>
          <button 
            class="pagination-button" 
            :disabled="currentPage === 1" 
            title="Previous Page"
            @click="goToPage(currentPage - 1)"
          >
            &lsaquo;
          </button>
          <button 
            v-for="page in paginationRange" 
            :key="page" 
            class="pagination-button" 
            :class="{ active: page === currentPage }" 
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button 
            class="pagination-button" 
            :disabled="currentPage === totalPages" 
            title="Next Page"
            @click="goToPage(currentPage + 1)"
          >
            &rsaquo;
          </button>
          <button 
            class="pagination-button" 
            :disabled="currentPage === totalPages" 
            title="Last Page"
            @click="goToPage(totalPages)"
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
    <div
      v-else
      class="no-data"
    >
      No players found.
    </div>
  </div>
</template>

<style scoped>
.players-page-container {
  background: var(--color-background);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: var(--color-heading);
}

.refresh-button {
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.refresh-button:hover {
  background-color: var(--color-accent-hover);
}

.filter-section {
  margin-bottom: 20px;
}

.mobile-name-search {
  display: none;
  margin-bottom: 15px;
}

.filter-toggle {
  display: none;
  margin-bottom: 15px;
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
  min-width: 200px;
}

.filter-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: var(--color-text);
}

.filter-input, .filter-select {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.filter-input:focus, .filter-select:focus {
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

.game-id {
  margin-left: 10px;
  padding: 2px 6px;
  background-color: var(--color-accent);
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading, .error, .no-data {
  padding: 20px;
  text-align: center;
}

.error {
  color: #ff5252;
}

.players-table-container {
  width: 100%;
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
  color: var(--color-text);
}

tbody tr:nth-child(even) {
  background-color: var(--color-background-soft);
}

tbody tr:hover {
  background-color: var(--color-background-mute);
}

th {
  background-color: var(--color-background-mute);
  font-weight: bold;
  color: var(--color-heading);
}

.sortable {
  cursor: pointer;
  position: relative;
  user-select: none;
}

.sortable:hover {
  background-color: var(--color-background-soft);
}

.sort-indicator {
  margin-left: 5px;
  font-size: 12px;
}

.sort-option {
  display: inline-block;
  background-color: var(--color-background-soft);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  color: var(--color-text);
}

.status-column {
  min-width: 200px;
}

.sort-badges {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.sort-badge {
  display: inline-block;
  background-color: var(--color-background-soft);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.sort-badge:hover {
  background-color: var(--color-background-mute);
}

.sort-badge.active {
  background-color: var(--color-accent);
  color: white;
}

.player-name-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
}

.player-name-link:hover {
  text-decoration: underline;
}

.server-name-link {
  color: var(--color-accent);
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}

.server-name-link:hover {
  text-decoration: underline;
  color: var(--color-accent-hover);
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.status-badge.active {
  background-color: #4CAF50;
}

.status-badge.inactive {
  background-color: #9e9e9e;
}

.active-status {
  background-color: var(--color-background-mute);
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: bold;
  color: var(--color-heading);
  border-left: 4px solid #4CAF50;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.server-info {
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: 600;
}

.player-stats {
  margin-top: 0;
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
}

.stat-item {
  background-color: var(--color-background);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.current-server {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.players-count {
  font-weight: bold;
}

.page-size-selector {
  display: flex;
  align-items: center;
}

.page-size-selector label {
  margin-right: 5px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.pagination-controls {
  display: flex;
  gap: 5px;
}

.pagination-button {
  padding: 8px 16px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination-button:hover {
  background-color: var(--color-background-mute);
}

.pagination-button.active {
  background-color: var(--color-accent);
  color: white;
}

/* Mobile styles */
@media (max-width: 768px) {
  .players-page-container {
    padding: 15px;
  }

  /* Show mobile name search */
  .mobile-name-search {
    display: block;
  }

  /* Hide desktop name filter on mobile */
  .desktop-name-filter {
    display: none;
  }

  /* Show filter toggle on mobile */
  .filter-toggle {
    display: block;
  }

  /* Hide filters by default on mobile */
  .filter-container {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    margin-bottom: 0;
  }

  /* Show filters when toggled */
  .filter-container.filters-visible {
    max-height: 500px;
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

  /* Mobile table layout: Use grid to create a two-line layout per player */
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  thead th {
    display: none;
  }

  .player-row {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "name lastseen"
      "status status";
    gap: 4px 10px;
    /* Remove box styles and adopt row styles */
    background: transparent;
    border: none;
    border-radius: 0;
    margin-bottom: 0;
    padding: 12px 0;
    box-shadow: none;
    border-bottom: 1px solid var(--color-border);
  }

  .player-row:hover {
    box-shadow: none;
    background-color: var(--color-background-mute);
  }

  .player-row td {
    display: block;
    width: 100%;
    border: none;
    padding: 0;
    background: transparent; /* Cells inherit background from row */
  }

  /* Hide desktop-only cells on mobile */
  .player-row .play-time-cell {
    display: none;
  }
  
  /* --- Grid cell placement and styling --- */

  .player-name-cell {
    grid-area: name;
    align-self: center;
    /* Allow long names to break and prevent overflow */
    word-break: break-all;
    min-width: 0; /* Ensures the cell can shrink */
  }

  .player-name-link {
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .current-server {
    display: none; /* Hide desktop server name under player name */
  }

  .last-seen-cell {
    grid-area: lastseen;
    font-size: 0.9rem;
    color: var(--color-text-muted);
    text-align: right;
    align-self: center;
  }
  
  .status-cell {
    grid-area: status;
  }
  
  /* Re-style active/inactive status for mobile's second row */
  .status-cell .active-status {
    background: var(--color-background-mute);
    padding: 6px 8px;
    border-radius: 4px;
    border-left: 4px solid #4CAF50;
    font-size: 0.8rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
    margin-top: 8px;
  }

  .status-cell .inactive-status {
    display: none;
  }

  .status-cell .server-info {
    font-weight: 600;
  }

  .status-cell .player-stats {
    gap: 6px;
    font-size: 0.8rem;
  }

  .status-cell .stat-item {
    padding: 2px 4px;
    font-size: 0.75rem;
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

  .pagination-controls {
    flex-wrap: wrap;
    gap: 8px;
  }

  .pagination-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

/* Hide mobile details on desktop */
@media (min-width: 769px) {
  .mobile-details-cell {
    display: none;
  }

  /* Hide mobile name search on desktop */
  .mobile-name-search {
    display: none;
  }
}

.online-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #4CAF50;
}

.kdr-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}
</style>
