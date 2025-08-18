<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { formatLastSeen } from '@/utils/timeUtils';

// Interface for player search results - matching what's used in other parts of the app
interface PlayerSearchResult {
  playerName: string;
  totalPlayTimeMinutes: number;
  lastSeen: string;
  isActive: boolean;
  currentServer?: {
    serverGuid: string;
    serverName: string;
    sessionKills: number;
    sessionDeaths: number;
    mapName: string;
    gameId: string;
  };
}

interface PlayerSearchResponse {
  items: PlayerSearchResult[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Router
const router = useRouter();
const route = useRoute();

// State variables
const players = ref<PlayerSearchResult[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const sortBy = ref<string>('lastSeen');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Search functionality
const searchQuery = ref('');
const isSearchLoading = ref(false);
const searchTimeout = ref<number | null>(null);

// Pagination state - start with reasonable defaults
const currentPage = ref(1);
const pageSize = ref(25);
const totalItems = ref(0);
const totalPages = ref(0);

// No filters for now - just search

// Format minutes to hours and minutes - simpler format
const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

// Sort players function
const sortPlayers = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = field === 'lastSeen' ? 'desc' : 'asc';
  }
  
  currentPage.value = 1;
  fetchPlayers();
};

const getSortClass = (field: string) => {
  if (sortBy.value !== field) return '';
  return sortOrder.value === 'asc' ? 'asc' : 'desc';
};

// Pro gamer color coding functions (inspired by PlayersPanel.vue)
const getScoreClass = (score: number) => {
  if (score >= 100) return 'score-excellent';
  if (score >= 50) return 'score-good';
  if (score >= 25) return 'score-average';
  return 'score-low';
};

const getKillsClass = (kills: number) => {
  if (kills >= 30) return 'kills-excellent';
  if (kills >= 15) return 'kills-good';
  if (kills >= 5) return 'kills-average';
  return 'kills-low';
};

const getDeathsClass = (deaths: number) => {
  if (deaths >= 20) return 'deaths-high';
  if (deaths >= 10) return 'deaths-medium';
  if (deaths >= 5) return 'deaths-low';
  return 'deaths-minimal';
};



// Handle search input with debouncing
const onSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1; // Reset to first page when searching
    fetchPlayers();
  }, 300) as unknown as number;
};

// Navigate to player profile
const navigateToPlayer = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
};

// Fetch players list for main table
const fetchPlayers = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Available query parameters for future use:
    // page, pageSize, sortBy, sortOrder, playerName, minPlayTime, maxPlayTime,
    // lastSeenFrom, lastSeenTo, isActive, serverName, gameId, mapName
    
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });

    // Add search query if provided - use playerName parameter
    if (searchQuery.value.trim()) {
      params.append('playerName', searchQuery.value.trim());
      // Don't filter by isActive when searching to include offline players
    } else {
      // Only show active players when not searching
      params.append('isActive', 'true');
    }

    const response = await fetch(`/stats/players?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch players');
    }

    const data: PlayerSearchResponse = await response.json();
    players.value = data.items;
    totalItems.value = data.totalItems;
    totalPages.value = data.totalPages;

  } catch (err) {
    console.error('Error fetching players:', err);
    error.value = 'Failed to fetch players data. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Pagination functions
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchPlayers();
};

const changePageSize = (newPageSize: number) => {
  pageSize.value = newPageSize;
  currentPage.value = 1;
  fetchPlayers();
};

// Handle enter key in search
const onSearchEnter = () => {
  if (searchQuery.value.trim() && players.value.length === 1) {
    // If there's exactly one result, navigate to that player
    navigateToPlayer(players.value[0].playerName);
  } else if (searchQuery.value.trim() && players.value.length > 0) {
    // If there are multiple results, navigate to the first one
    navigateToPlayer(players.value[0].playerName);
  }
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  fetchPlayers();
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

// Lifecycle hooks
onMounted(() => {
  // Load active players by default on page load
  fetchPlayers();
});

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<template>
  <div class="players-page">
    <!-- Prominent Search Section -->
    <div class="search-section">
      <h1>Find Players</h1>
      <div class="search-container">
        <div class="search-input-wrapper">
          <i class="search-icon">🔍</i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search players..."
            class="search-input"
            @input="onSearchInput"
            @keyup.enter="onSearchEnter"
          >
          <div v-if="isSearchLoading" class="search-spinner">
            🔄
          </div>
          <button v-if="searchQuery" @click="clearSearch" class="clear-search">×</button>
        </div>
      </div>
      
    </div>

    <!-- Players Table -->
    <div v-if="loading" class="loading">
      Loading players...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else-if="!searchQuery.trim() && players.length === 0" class="hero-section">
      <div class="hero-content">
        <p>Start typing a player name above to find their stats and recent activity.</p>
        <div class="search-tips">
          <div class="tip">💡 <strong>Tip:</strong> You can search by partial names</div>
          <div class="tip">⚡ <strong>Quick:</strong> Press Enter to go to the first result</div>
        </div>
      </div>
    </div>
    
    <div v-else-if="searchQuery.trim() && players.length === 0" class="no-results-section">
      <div class="no-results-content">
        <h3>🔍 No players found</h3>
        <p>No players match "<strong>{{ searchQuery }}</strong>"</p>
        <p class="suggestion">Try a different spelling or partial name.</p>
      </div>
    </div>
    
    <div v-else class="players-table-section">
      <!-- Table Header -->
      <div class="table-header">
        <div class="players-count">
          {{ totalItems }} players found
        </div>
        <div class="page-size-selector">
          <label>Show:</label>
          <select :value="pageSize" @change="changePageSize(Number(($event.target as HTMLSelectElement).value))">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <!-- Compact Table -->
      <div class="table-container">
        <table class="players-table">
          <thead>
            <tr>
              <th @click="sortPlayers('playerName')" class="sortable">
                Player
                <span class="sort-indicator" :class="getSortClass('playerName')">▲</span>
              </th>
              <th @click="sortPlayers('totalPlayTimeMinutes')" class="sortable">
                Playtime
                <span class="sort-indicator" :class="getSortClass('totalPlayTimeMinutes')">▲</span>
              </th>
              <th @click="sortPlayers('lastSeen')" class="sortable">
                Last Seen
                <span class="sort-indicator" :class="getSortClass('lastSeen')">▲</span>
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="player in players"
              :key="player.playerName"
              class="player-row"
              :class="{ 'online': player.isActive }"
            >
              <td class="player-cell">
                <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-name">
                  {{ player.playerName }}
                </router-link>
              </td>
              <td class="playtime-cell">
                {{ formatPlayTime(player.totalPlayTimeMinutes) }}
              </td>
              <td class="lastseen-cell">
                {{ formatLastSeen(player.lastSeen) }}
              </td>
              <td class="status-cell">
                <div v-if="player.isActive" class="status online-status">
                  <span class="online-indicator">🟢</span>
                  <div v-if="player.currentServer" class="server-info">
                    <router-link 
                      :to="`/servers/${encodeURIComponent(player.currentServer.serverName)}`" 
                      class="server-name server-link"
                    >
                      {{ player.currentServer.serverName }}
                    </router-link>
                    <div class="game-stats">
                      <span class="score-stat" :class="getScoreClass(player.currentServer.sessionKills + player.currentServer.sessionDeaths)">
                        {{ (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) }}
                      </span>
                      <span class="separator"> / </span>
                      <span class="kills-stat" :class="getKillsClass(player.currentServer.sessionKills || 0)">
                        {{ player.currentServer.sessionKills || 0 }}
                      </span>
                      <span class="separator"> / </span>
                      <span class="deaths-stat" :class="getDeathsClass(player.currentServer.sessionDeaths || 0)">
                        {{ player.currentServer.sessionDeaths || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="status offline-status">
                  <span class="offline-indicator">⚫</span>
                  <span>Offline</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1" 
          @click="goToPage(1)"
        >
          ««
        </button>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1" 
          @click="goToPage(currentPage - 1)"
        >
          ‹
        </button>
        <button 
          v-for="page in paginationRange" 
          :key="page" 
          class="pagination-btn" 
          :class="{ active: page === currentPage }" 
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages" 
          @click="goToPage(currentPage + 1)"
        >
          ›
        </button>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages" 
          @click="goToPage(totalPages)"
        >
          ››
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.players-page {
  min-height: 100vh;
  background: var(--color-background);
  padding: 20px;
}

/* Search Section */
.search-section {
  max-width: 800px;
  margin: 0 auto 40px auto;
  text-align: center;
}

.search-section h1 {
  font-size: 2.5rem;
  color: var(--color-heading);
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 10px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 16px;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 16px 50px 16px 50px;
  font-size: 18px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-text);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-spinner {
  position: absolute;
  right: 50px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  animation: spin 1s linear infinite;
}

.clear-search {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  color: var(--color-text-muted);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search:hover {
  background: var(--color-background-mute);
  color: var(--color-text);
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}


/* Loading and Error States */
.loading, .error {
  text-align: center;
  padding: 40px 20px;
  font-size: 18px;
}

.error {
  color: #e74c3c;
}

/* Hero Section */
.hero-section {
  max-width: 600px;
  margin: 60px auto;
  text-align: center;
}

.hero-content h2 {
  font-size: 2rem;
  color: var(--color-heading);
  margin-bottom: 16px;
}

.hero-content p {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  margin-bottom: 32px;
  line-height: 1.5;
}

.search-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--color-border);
}

.tip {
  font-size: 14px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip strong {
  color: var(--color-primary);
}

/* No Results Section */
.no-results-section {
  max-width: 500px;
  margin: 60px auto;
  text-align: center;
}

.no-results-content h3 {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin-bottom: 12px;
}

.no-results-content p {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.suggestion {
  font-style: italic;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Table Section */
.players-table-section {
  max-width: 1200px;
  margin: 0 auto;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.players-count {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 600;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text);
}

.page-size-selector select {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
}

/* Table Container - matching LandingPage style */
.table-container {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.players-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.players-table th {
  background: var(--color-background-mute);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  border-bottom: 2px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.players-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
}

.players-table th.sortable:hover {
  background: var(--color-background);
}

.sort-indicator {
  display: inline-block;
  margin-left: 6px;
  font-size: 10px;
  transition: transform 0.2s;
  opacity: 0.5;
}

.sort-indicator.asc {
  transform: rotate(0deg);
  opacity: 1;
  color: var(--color-primary);
}

.sort-indicator.desc {
  transform: rotate(180deg);
  opacity: 1;
  color: var(--color-primary);
}

.players-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.player-row {
  transition: all 0.2s ease;
}

.player-row:hover {
  background: var(--color-background);
}

.player-row.online {
  background: rgba(76, 175, 80, 0.02);
}

.player-cell {
  max-width: 200px;
}

.player-name {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-name:hover {
  text-decoration: underline;
}

.playtime-cell, .lastseen-cell {
  font-size: 13px;
  color: var(--color-text);
  white-space: nowrap;
}

.status-cell {
  min-width: 200px;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.online-status {
  color: var(--color-text);
}

.offline-status {
  color: var(--color-text-muted);
}

.online-indicator, .offline-indicator {
  font-size: 12px;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.server-name {
  font-weight: 500;
  font-size: 12px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.server-link {
  text-decoration: none;
  color: var(--color-primary);
  transition: color 0.2s ease;
}

.server-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.game-stats {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.separator {
  color: var(--color-text-muted);
}

/* Pro gamer color coding (from PlayersPanel.vue) */
.score-excellent {
  color: #4caf50;
  font-weight: 700;
}

.score-good {
  color: #2196f3;
  font-weight: 600;
}

.score-average {
  color: #ff9800;
  font-weight: 500;
}

.score-low {
  color: var(--color-text-muted);
}

.kills-excellent {
  color: #f44336;
  font-weight: 700;
}

.kills-good {
  color: #ff9800;
  font-weight: 600;
}

.kills-average {
  color: #4caf50;
  font-weight: 500;
}

.kills-low {
  color: var(--color-text-muted);
}

.deaths-high {
  color: #f44336;
  font-weight: 600;
}

.deaths-medium {
  color: #ff9800;
  font-weight: 500;
}

.deaths-low {
  color: #4caf50;
  font-weight: 500;
}

.deaths-minimal {
  color: #2196f3;
  font-weight: 500;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
}

.pagination-btn {
  padding: 8px 12px;
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  min-width: 36px;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
}

.pagination-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .players-page {
    padding: 15px;
  }

  .search-section h1 {
    font-size: 2rem;
  }

  .search-input {
    padding: 12px 40px 12px 40px;
    font-size: 16px;
  }

  .hero-section {
    margin: 40px auto;
    padding: 0 10px;
  }

  .hero-content h2 {
    font-size: 1.6rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .search-tips {
    padding: 20px;
  }

  .tip {
    font-size: 13px;
  }

  .no-results-section {
    margin: 40px auto;
    padding: 0 10px;
  }

  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .page-size-selector {
    justify-content: space-between;
  }

  .players-table {
    min-width: 600px;
  }

  .table-container {
    overflow-x: auto;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 6px;
  }

  .pagination-btn {
    padding: 6px 10px;
    font-size: 12px;
    min-width: 32px;
  }
}

@media (max-width: 480px) {
  .search-section {
    margin-bottom: 30px;
  }

  .search-section h1 {
    font-size: 1.8rem;
  }

  .players-table th,
  .players-table td {
    padding: 8px 12px;
  }

  .server-name {
    max-width: 120px;
  }
}
</style>
