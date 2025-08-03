<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchPlayerSessions, SessionListItem, PlayerContextInfo } from '../services/playerStatsService';

// Router
const router = useRouter();
const route = useRoute();

// Props from router
interface Props {
  playerName: string;
}

const props = defineProps<Props>();

// State variables
const sessions = ref<SessionListItem[]>([]);
const playerInfo = ref<PlayerContextInfo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = ref(20);
const totalItems = ref(0);
const totalPages = ref(0);

// Sorting state
const sortBy = ref<string>('startTime');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Filter variables
const mapFilter = ref('');
const serverFilter = ref('');
const gameTypeFilter = ref('');
const uniqueMaps = ref<string[]>([]);
const uniqueServers = ref<string[]>([]);
const uniqueGameTypes = ref<string[]>([]);

// Mobile filters state
const showFilters = ref(false);

// Debounced search functionality
const searchTimeout = ref<any>(null);

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
    minute: '2-digit'
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

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Update unique values for filters
const updateUniqueValues = () => {
  const maps = new Set<string>();
  const servers = new Set<string>();
  const gameTypes = new Set<string>();

  sessions.value.forEach(session => {
    if (session.mapName) maps.add(session.mapName);
    if (session.serverName) servers.add(session.serverName);
    if (session.gameType) gameTypes.add(session.gameType);
  });

  uniqueMaps.value = Array.from(maps).sort();
  uniqueServers.value = Array.from(servers).sort();
  uniqueGameTypes.value = Array.from(gameTypes).sort();
};

// Fetch player sessions data
const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Build filter object from current filter values
    const filters: Record<string, string> = {};
    if (mapFilter.value) filters.mapName = mapFilter.value;
    if (serverFilter.value) filters.serverName = serverFilter.value;
    if (gameTypeFilter.value) filters.gameType = gameTypeFilter.value;

    // Fetch the player sessions with pagination, filters, and sorting
    const result = await fetchPlayerSessions(
      props.playerName, 
      currentPage.value, 
      pageSize.value,
      filters,
      sortBy.value,
      sortOrder.value
    );

    // Update state with the fetched data
    sessions.value = result.items;
    playerInfo.value = result.playerInfo || null;
    totalItems.value = result.totalItems;
    totalPages.value = result.totalPages;

    // Update unique values for filters
    updateUniqueValues();
  } catch (err) {
    console.error('Error fetching player sessions:', err);
    error.value = 'Failed to fetch player sessions. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Function to navigate to round report
const navigateToRoundReport = (sessionId: number, event?: Event) => {
  // Prevent event propagation to stop any unwanted behavior
  if (event) {
    event.stopPropagation();
  }

  // Find the session to get the required data for the round report
  const session = sessions.value.find(s => s.sessionId === sessionId);
  if (session) {
    // Navigate to the round report page with the required parameters
    router.push({
      path: '/servers/round-report',
      query: {
        serverGuid: session.serverGuid,
        mapName: session.mapName,
        startTime: session.startTime,
        players: props.playerName // Include the player name to pin them
      }
    });
  }
};

// Filter handlers
const handleMapFilterChange = (event: Event) => {
  mapFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  updateQueryParams();
  fetchData();
};

const handleServerFilterChange = (event: Event) => {
  serverFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  updateQueryParams();
  fetchData();
};

const handleGameTypeFilterChange = (event: Event) => {
  gameTypeFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  updateQueryParams();
  fetchData();
};

// Reset all filters
const resetFilters = () => {
  mapFilter.value = '';
  serverFilter.value = '';
  gameTypeFilter.value = '';
  currentPage.value = 1; // Reset to first page when resetting filters
  updateQueryParams();
  fetchData();
};

// Handle sort column click
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
  fetchData();
};

// Function to handle pagination
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  updateQueryParams();
  fetchData();
};

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

// Watch for route props changes
watch(() => props.playerName, (newPlayerName) => {
  if (newPlayerName) {
    fetchData();
  }
}, { immediate: true });

// Watch for page size changes
watch(() => pageSize.value, () => {
  currentPage.value = 1; // Reset to first page when changing page size
  updateQueryParams();
  fetchData();
});

// Initialize state from URL query parameters
const initializeFromQuery = () => {
  const query = route.query;
  
  // Set filters from query params
  if (query.map && typeof query.map === 'string') {
    mapFilter.value = query.map;
  }
  if (query.server && typeof query.server === 'string') {
    serverFilter.value = query.server;
  }
  if (query.gameType && typeof query.gameType === 'string') {
    gameTypeFilter.value = query.gameType;
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
    if (!isNaN(size) && [10, 20, 50, 100].includes(size)) {
      pageSize.value = size;
    }
  }
};

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string> = {};
  
  // Add filters to query
  if (mapFilter.value) query.map = mapFilter.value;
  if (serverFilter.value) query.server = serverFilter.value;
  if (gameTypeFilter.value) query.gameType = gameTypeFilter.value;
  
  // Add sorting to query
  if (sortBy.value !== 'startTime') query.sortBy = sortBy.value;
  if (sortOrder.value !== 'desc') query.sortOrder = sortOrder.value;
  
  // Add pagination to query
  if (currentPage.value !== 1) query.page = currentPage.value.toString();
  if (pageSize.value !== 20) query.pageSize = pageSize.value.toString();
  
  // Update URL without triggering navigation
  router.replace({ query });
};

// Fetch data when component is mounted
onMounted(() => {
  initializeFromQuery();
  fetchData();
});

// Timeline helper functions
const getPerformanceClass = (session: SessionListItem): string => {
  const kdr = session.deaths === 0 ? session.kills : session.kills / session.deaths;
  
  if (kdr >= 2.0) return 'performance-excellent';
  if (kdr >= 1.5) return 'performance-good';
  if (kdr >= 1.0) return 'performance-average';
  if (kdr >= 0.5) return 'performance-poor';
  return 'performance-bad';
};

const getPerformanceLabel = (session: SessionListItem): string => {
  const kdr = session.deaths === 0 ? session.kills : session.kills / session.deaths;
  
  if (kdr >= 2.0) return 'Excellent performance';
  if (kdr >= 1.5) return 'Good performance';
  if (kdr >= 1.0) return 'Average performance';
  if (kdr >= 0.5) return 'Challenging round';
  return 'Tough round';
};

const getTimeGap = (currentSession: SessionListItem, nextSession: SessionListItem): string => {
  const current = new Date(currentSession.startTime.endsWith('Z') ? currentSession.startTime : currentSession.startTime + 'Z');
  const next = new Date(nextSession.startTime.endsWith('Z') ? nextSession.startTime : nextSession.startTime + 'Z');
  
  const diffMs = current.getTime() - next.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays >= 1) {
    return diffDays === 1 ? '1 day later' : `${diffDays} days later`;
  } else if (diffHours >= 2) {
    return `${diffHours} hours later`;
  }
  
  return ''; // Don't show gap for sessions close together
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
  <div class="player-sessions-page-container">
    <div class="header">
      <div class="header-left">
        <h1>{{ playerName }}'s Sessions</h1>
        <div
          v-if="playerInfo"
          class="player-info"
        >
          <div class="info-item">
            <span class="info-label">Total Play Time:</span>
            <span class="info-value">{{ formatPlayTime(playerInfo.totalPlayTimeMinutes) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Sessions:</span>
            <span class="info-value">{{ playerInfo.totalSessions }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">KDR:</span>
            <span class="info-value">{{ calculateKDR(playerInfo.totalKills, playerInfo.totalDeaths) }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <router-link
          :to="`/players/${encodeURIComponent(playerName)}`"
          class="back-button"
        >
          Back to Player Details
        </router-link>
        <button
          class="refresh-button"
          @click="fetchData"
        >
          <span v-if="!loading">Refresh</span>
          <span
            v-else
            class="spinner"
          />
        </button>
      </div>
    </div>

    <!-- Mobile filter toggle -->
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
        Filters
        <span
          v-if="mapFilter || serverFilter || gameTypeFilter"
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

    <!-- Filter controls -->
    <div
      class="filter-container"
      :class="{ 'filters-visible': showFilters }"
    >
      <div class="filter-group">
        <label for="mapFilter">Map:</label>
        <select 
          id="mapFilter" 
          v-model="mapFilter" 
          class="filter-select"
          @change="handleMapFilterChange"
        >
          <option value="">
            All Maps
          </option>
          <option
            v-for="map in uniqueMaps"
            :key="map"
            :value="map"
          >
            {{ map }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="serverFilter">Server:</label>
        <select 
          id="serverFilter" 
          v-model="serverFilter" 
          class="filter-select"
          @change="handleServerFilterChange"
        >
          <option value="">
            All Servers
          </option>
          <option
            v-for="server in uniqueServers"
            :key="server"
            :value="server"
          >
            {{ server }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="gameTypeFilter">Game Type:</label>
        <select 
          id="gameTypeFilter" 
          v-model="gameTypeFilter" 
          class="filter-select"
          @change="handleGameTypeFilterChange"
        >
          <option value="">
            All Game Types
          </option>
          <option
            v-for="gameType in uniqueGameTypes"
            :key="gameType"
            :value="gameType"
          >
            {{ gameType }}
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

    <div
      v-if="loading && sessions.length === 0"
      class="loading"
    >
      Loading sessions data...
    </div>
    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="sessions.length > 0"
      class="sessions-table-container"
    >
      <!-- Sessions count and pagination info -->
      <div class="table-header">
        <div class="sessions-count">
          Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} sessions
        </div>
        <div class="page-size-selector">
          <label for="pageSize">Sessions per page:</label>
          <select
            id="pageSize"
            v-model="pageSize"
            @change="currentPage = 1; updateQueryParams(); fetchData()"
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

      <div class="timeline-container">
        <template
          v-for="(session, index) in sessions"
          :key="session.sessionId"
        >
          <!-- Session timeline item -->
          <div class="timeline-item">
            <!-- Timeline node -->
            <div class="timeline-node-container">
              <div 
                class="timeline-node" 
                :class="getPerformanceClass(session)"
                :title="getPerformanceLabel(session)"
              />
            </div>
            
            <!-- Session card -->
            <div 
              class="session-card"
              @click="(event) => navigateToRoundReport(session.sessionId, event)"
            >
              <div class="session-line-1">
                <span class="time-link">{{ formatRelativeTime(session.startTime) }}</span>
                <span class="session-separator">-</span>
                <router-link 
                  :to="`/servers/${encodeURIComponent(session.serverName)}`" 
                  class="server-link"
                >
                  {{ session.serverName }}
                </router-link>
              </div>
              
              <div class="session-line-2">
                <span class="map-name">{{ session.mapName }}</span>
                <span class="game-type">({{ session.gameType }})</span>
              </div>
              
              <div class="session-line-3">
                <span class="session-score">{{ session.score }} pts</span>
                <span class="stat-separator">•</span>
                <span class="stat-item">
                  {{ calculateKDR(session.kills, session.deaths) }} KDR (<span class="kills-count">{{ session.kills }}</span> / <span class="deaths-count">{{ session.deaths }}</span>)
                </span>
                <span class="stat-separator">•</span>
                <span class="duration-text">{{ formatPlayTime(session.durationMinutes) }}</span>
              </div>
            </div>
          </div>

          <!-- Time gap as a separate timeline item -->
          <div 
            v-if="index < sessions.length - 1 && getTimeGap(session, sessions[index + 1])" 
            class="timeline-gap-item"
          >
            <div class="time-gap-separator">
              <div class="time-gap-line" />
              <div class="time-gap-badge">
                {{ getTimeGap(session, sessions[index + 1]) }}
              </div>
              <div class="time-gap-line" />
            </div>
          </div>
        </template>
      </div>

      <!-- Pagination controls -->
      <div
        v-if="totalPages > 1"
        class="pagination-container"
      >
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} sessions
        </div>
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
        <div class="page-size-selector">
          <label for="pageSize">Items per page:</label>
          <select
            id="pageSize"
            v-model="pageSize"
          >
            <option value="10">
              10
            </option>
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
    </div>
    <div
      v-else
      class="no-data"
    >
      No sessions found for this player.
    </div>
  </div>
</template>

<style scoped>
.player-sessions-page-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: var(--color-heading);
}

.player-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  gap: 5px;
}

.info-label {
  font-weight: 500;
  color: var(--color-text-muted);
}

.info-value {
  font-weight: bold;
  color: var(--color-text);
}

.back-button {
  padding: 8px 16px;
  background-color: var(--color-background-mute);
  color: var(--color-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--color-background-soft);
}

.refresh-button {
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-button:hover {
  background-color: var(--color-accent-hover);
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  align-items: flex-end;
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

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-accent);
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

.sessions-table-container {
  width: 100%;
}

/* Timeline Styles */
.timeline-container {
  position: relative;
  padding: 0;
  margin: 12px 0;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--color-border);
  z-index: 1;
}

.timeline-node-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 12px;
  min-width: 16px;
  z-index: 2;
  align-self: flex-start;
  margin-top: 1.8em;
}

.timeline-node {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--color-background);
  position: relative;
  z-index: 3;
  transition: all 0.2s ease;
  cursor: pointer;
}

.timeline-node:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

/* Performance-based node colors */
.performance-excellent {
  background-color: #4CAF50;
  border-color: #2E7D32;
}

.performance-good {
  background-color: #8BC34A;
  border-color: #558B2F;
}

.performance-average {
  background-color: #FFC107;
  border-color: #F57F17;
}

.performance-poor {
  background-color: #FF9800;
  border-color: #E65100;
}

.performance-bad {
  background-color: #F44336;
  border-color: #C62828;
}

.session-card {
  flex: 1;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
  border-radius: 4px;
}

.timeline-item:hover::before {
  background: var(--color-primary);
}

.session-line-1 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
  flex-wrap: wrap;
}

.session-line-1 .time-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.session-line-1 .time-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.session-separator {
  color: var(--color-text-muted);
  font-weight: normal;
  margin: 0 4px;
}

.session-line-1 .server-link {
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: normal;
  transition: color 0.2s;
}

.session-line-1 .server-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.session-line-2 {
  margin-bottom: 3px;
}

.map-name {
  font-weight: 500;
  color: var(--color-text);
  margin-right: 4px;
  font-size: 0.9rem;
}

.game-type {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: normal;
}

.session-line-3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: var(--color-text);
}

.session-score {
  font-weight: 500;
  color: var(--color-text);
}

.session-line-3 .stat-item {
  display: inline;
}

.duration-text {
  color: var(--color-text-muted);
  font-style: italic;
}

.kills-count {
  color: #4CAF50;
  font-weight: 500;
}

.deaths-count {
  color: #F44336;
  font-weight: 500;
}

.time-gap {
  display: none;
}

.active-session-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #4CAF50;
}

.completed-session-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #9e9e9e;
}

/* Mobile filter toggle styles */
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

.server-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.server-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-info {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.pagination-controls {
  display: flex;
  gap: 5px;
}

.pagination-button {
  padding: 5px 10px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
  transition: background-color 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--color-background-mute);
}

.pagination-button.active {
  background-color: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sessions-count {
  font-weight: bold;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-selector label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.page-size-selector select {
  padding: 5px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

/* Mobile responsive styles for timeline */
@media (max-width: 768px) {
  .player-sessions-page-container {
    padding: 0 20px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .player-info {
    flex-direction: column;
    gap: 5px;
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
    flex-direction: column;
    gap: 10px;
    transition: all 0.3s ease;
  }

  /* Show filters when toggled */
  .filter-container.filters-visible {
    max-height: 500px;
    opacity: 1;
    margin-bottom: 20px;
  }

  .filter-group {
    min-width: 0;
  }

  .reset-filters-button {
    align-self: stretch;
    margin-top: 10px;
  }

  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .timeline-container {
    margin: 8px 0;
  }
  
  .timeline-item {
    margin-bottom: 12px;
  }
  
  .timeline-item::before {
    left: 5px;
  }
  
  .timeline-node-container {
    margin-right: 10px;
    min-width: 12px;
    margin-top: 1.5em;
  }
  
  .timeline-node {
    width: 6px;
    height: 6px;
  }
  
  .session-card {
    padding: 4px 6px;
  }
  
  .session-line-1 .time-link,
  .session-line-1 .server-link {
    font-size: 0.85rem;
  }
  
  .map-name {
    font-size: 0.85rem;
  }
  
  .game-type {
    font-size: 0.8rem;
  }
  
  .session-line-3 {
    font-size: 0.8rem;
    gap: 6px;
  }
  
  .time-gap {
    left: 15px;
    bottom: -5px;
    font-size: 0.7rem;
    padding: 1px 6px;
  }

  .pagination-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-controls {
    order: 2;
    margin-top: 10px;
  }

  .pagination-info {
    order: 1;
  }

  .page-size-selector {
    order: 3;
    margin-top: 10px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .timeline-item::before {
    left: 4px;
  }
  
  .timeline-node-container {
    margin-right: 8px;
    min-width: 10px;
    margin-top: 1.3em;
  }
  
  .timeline-node {
    width: 5px;
    height: 5px;
  }
  
  .session-card {
    padding: 3px 5px;
  }
  
  .session-line-1 {
    gap: 4px;
    margin-bottom: 2px;
  }
  
  .session-line-2 {
    margin-bottom: 2px;
  }
  
  .session-line-1 .time-link,
  .session-line-1 .server-link {
    font-size: 0.8rem;
  }
  
  .map-name {
    font-size: 0.8rem;
  }
  
  .game-type {
    font-size: 0.75rem;
  }
  
  .session-line-3 {
    font-size: 0.75rem;
    gap: 4px;
  }
  
  .time-gap {
    left: 12px;
    bottom: -4px;
    font-size: 0.65rem;
  }
}

.timeline-gap-item {
  position: relative;
  padding: 8px 0;
  margin-left: 28px; /* Align with the timeline content */
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-start;
}

.time-gap-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  min-width: 200px;
  max-width: 400px;
}

.time-gap-line {
  flex: 1;
  height: 2px;
  min-width: 40px;
  max-width: 100px;
  background-image: repeating-linear-gradient(-45deg,
    var(--color-border) 0px,
    var(--color-border) 4px,
    transparent 4px,
    transparent 8px);
  background-size: 8px 2px;
}

.time-gap-badge {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  font-style: italic;
  white-space: nowrap;
  z-index: 2;
}

/* Mobile responsive styles for time gap */
@media (max-width: 768px) {
  .timeline-gap-item {
    margin-left: 24px;
    padding: 6px 0;
    margin-bottom: 12px;
  }
  
  .time-gap-separator {
    min-width: 160px;
    max-width: 300px;
  }

  .time-gap-line {
    min-width: 30px;
    max-width: 80px;
    height: 1px;
  }
  
  .time-gap-badge {
    font-size: 0.75rem;
    padding: 1px 6px;
  }
}

@media (max-width: 480px) {
  .timeline-gap-item {
    margin-left: 20px;
    padding: 4px 0;
    margin-bottom: 10px;
  }
  
  .time-gap-separator {
    min-width: 120px;
    max-width: 240px;
  }

  .time-gap-line {
    min-width: 20px;
    max-width: 60px;
  }
  
  .time-gap-badge {
    font-size: 0.7rem;
    padding: 1px 4px;
  }
}

/* Remove the old time-gap styles */
.time-gap {
  display: none;
}

</style>
