<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchOnlinePlayersList, OnlinePlayerItem, OnlinePlayersResponse, OnlinePlayersFilters } from '../services/onlinePlayersService';

// Router
const router = useRouter();

// State variables
const playersResponse = ref<OnlinePlayersResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Filter variables (server-side)
// Single search filter (matches player or server names)
const nameFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(100);

// Debouncing
const searchDebounceTimeout = ref<number | null>(null);
const debounceMs = 500;

// Auto-refresh functionality
const autoRefreshInterval = ref<number | null>(null);
const refreshIntervalSeconds = 30;
const isAutoRefresh = ref(true);
// Add slide-out panel state management
const isPanelOpen = ref(false);
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
};

// Helper function to normalize game IDs for consistent filtering
const normalizeGameId = (gameId: string): string => {
  if (!gameId) return '';
  const normalized = gameId.toLowerCase();
  
  switch (normalized) {
    case 'bf1942':
    case '42':
      return 'bf1942';
    case 'fh2':
      return 'fh2';
    case 'bfv':
    case 'bfvietnam':
      return 'bfv';
    default:
      return normalized;
  }
};

// Get display name for game ID
const getGameDisplayName = (gameId: string): string => {
  const normalized = normalizeGameId(gameId);
  switch (normalized) {
    case 'bf1942': return 'BF1942';
    case 'fh2': return 'Forgotten Hope 2';
    case 'bfv': return 'BF Vietnam';
    default: return gameId.toUpperCase(); // Show original gameId for mods
  }
};

// (Removed gameTypes computed – game-specific filtering is deprecated)

// Current filters object
const currentFilters = computed((): OnlinePlayersFilters => {
  const filters: OnlinePlayersFilters = {
    page: currentPage.value,
    pageSize: pageSize.value
  };

  if (nameFilter.value.trim()) {
    // New unified search parameter handled by backend
    (filters as any).search = nameFilter.value.trim();
  }

  return filters;
});

// Format session duration
const formatSessionTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Get game icon class
const getGameIcon = (gameId: string): string => {
  const normalized = normalizeGameId(gameId);
  switch (normalized) {
    case 'bf1942': return 'game-icon bf1942';
    case 'fh2': return 'game-icon fh2';
    case 'bfv': return 'game-icon bfv';
    default: return 'game-icon default';
  }
};

// Get KDR with fallback
const getKDRatio = (kills: number = 0, deaths: number = 0): string => {
  if (deaths === 0) return kills > 0 ? kills.toString() : '0.00';
  return (kills / deaths).toFixed(2);
};

// ===== Added for grouping players by server =====
/** Collapsed state per server key */
const collapsedServers = ref<Record<string, boolean>>({});
/** Toggle collapse for given server */
const toggleServer = (key: string) => {
  collapsedServers.value[key] = !collapsedServers.value[key];
};
/** Group online players by their current server */
const groupedServers = computed(() => {
  if (!playersResponse.value?.items) return [];
  const groups: Record<string, { serverKey: string; serverName: string; gameId: string; mapName?: string; players: OnlinePlayerItem[] }> = {};

  playersResponse.value.items.forEach((player: OnlinePlayerItem) => {
    const serverName = player.currentServer?.serverName || 'Unknown';
    const gameId = player.currentServer?.gameId || '';
    const mapName = player.currentServer?.mapName || '';
    const key = `${serverName}|${gameId}`;

    if (!groups[key]) {
      groups[key] = {
        serverKey: key,
        serverName,
        gameId,
        mapName,
        players: []
      };
    }
    groups[key].players.push(player);
  });

  return Object.values(groups);
});
// ===== End added block =====

// Fetch online players data with filters
const fetchOnlinePlayersApiData = async (resetPage = false) => {
  if (resetPage) {
    currentPage.value = 1;
    // Clear existing results when applying new filters to avoid showing stale data
    playersResponse.value = null;
  }
  
  if (!loading.value) loading.value = true;
  error.value = null;

  try {
    // Build filters manually to ensure fresh values, especially when resetPage is true
    const filters: OnlinePlayersFilters = {
      page: resetPage ? 1 : currentPage.value,
      pageSize: pageSize.value
    };

    // Apply unified search term (player OR server name)
    if (nameFilter.value.trim()) {
      (filters as any).search = nameFilter.value.trim();
    }

    const result = await fetchOnlinePlayersList(filters);
    playersResponse.value = result;
    // Reset collapsed state whenever new data is fetched
    collapsedServers.value = {};
  } catch (err) {
    console.error('Error fetching online players data:', err);
    error.value = 'Failed to fetch online players data. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Debounced search function
const debouncedSearch = () => {
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value);
  }
  
  searchDebounceTimeout.value = window.setTimeout(() => {
    fetchOnlinePlayersApiData(true); // Reset to page 1 on new search
  }, debounceMs);
};

// Navigate to player details
const goToPlayerDetails = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
};

// Navigate to server details
const goToServerDetails = (serverName: string) => {
  router.push(`/servers/${encodeURIComponent(serverName)}`);
};

// Pagination functions
const goToPage = (page: number) => {
  if (page >= 1 && playersResponse.value && page <= playersResponse.value.totalPages) {
    currentPage.value = page;
    fetchOnlinePlayersApiData();
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
};

const nextPage = () => {
  if (playersResponse.value && currentPage.value < playersResponse.value.totalPages) {
    goToPage(currentPage.value + 1);
  }
};

// Auto-refresh functionality
const startAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
  }
  
  autoRefreshInterval.value = window.setInterval(() => {
    if (isAutoRefresh.value) {
      fetchOnlinePlayersApiData();
    }
  }, refreshIntervalSeconds * 1000);
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
};

const toggleAutoRefresh = () => {
  isAutoRefresh.value = !isAutoRefresh.value;
  if (isAutoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

// Clear filters
const clearFilters = () => {
  nameFilter.value = '';
  currentPage.value = 1;
  fetchOnlinePlayersApiData();
};

// Watch for filter changes
watch(nameFilter, () => {
  debouncedSearch();
});

// Add body scroll lock when the slide-out panel is open
watch(isPanelOpen, (open) => {
  if (open) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
});

// Lifecycle
onMounted(() => {
  fetchOnlinePlayersApiData();
  if (isAutoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value);
  }
  // Ensure body scrolling is re-enabled when component is destroyed
  document.body.classList.remove('no-scroll');
});
</script>

<template>
  <div class="online-players-container">
    <!-- Toggle handle fixed to the right edge -->
    <button class="online-toggle-btn" @click="togglePanel">
      <span v-if="!isPanelOpen">👥 {{ playersResponse ? playersResponse.totalItems : 0 }}</span>
      <span v-else>×</span>
    </button>

    <!-- Slide-out panel -->
    <div class="online-panel" :class="{ open: isPanelOpen }">
      <div class="panel-header">
        <h3>Online Players ({{ playersResponse ? playersResponse.totalItems : 0 }})</h3>
        <input
          v-model="nameFilter"
          type="text"
          class="player-search-input"
          placeholder="Search player or server..."
        />
        <!-- (Removed game filter badges) -->
      </div>

      <!-- States -->
      <div v-if="loading && !playersResponse" class="loading-state">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
      </div>
      <div v-else-if="playersResponse && playersResponse.items.length">
        <div class="players-list">
          <div
            v-for="server in groupedServers"
            :key="server.serverKey"
            class="server-group"
          >
            <div class="server-header" @click="toggleServer(server.serverKey)">
              <div class="server-header-info">
                <span class="server">{{ server.serverName }}</span>
                <span class="player-count">({{ server.players.length }})</span>
                <span v-if="server.mapName" class="separator">•</span>
                <span v-if="server.mapName" class="map">{{ server.mapName }}</span>
              </div>
              <div class="server-player-count">
                <span v-if="collapsedServers[server.serverKey]">▼</span>
                <span v-else>▲</span>
              </div>
            </div>
            <transition name="collapse">
              <div v-if="!collapsedServers[server.serverKey]" class="server-players">
                <div
                  v-for="player in server.players"
                  :key="player.playerName"
                  class="player-row"
                  @click="goToPlayerDetails(player.playerName)"
                  :title="player.currentServer ? 'Kills: ' + (player.currentServer.sessionKills || 0) + ', Deaths: ' + (player.currentServer.sessionDeaths || 0) + ', KDR: ' + getKDRatio(player.currentServer.sessionKills, player.currentServer.sessionDeaths) : ''"
                >
                  <div class="name-row">
                    <span class="online-dot"></span>
                    <span class="player-name">{{ player.playerName }}</span>
                  </div>
                  <div class="stats-row">
                    <span class="kills">{{ player.currentServer?.sessionKills || 0 }}</span>/<span class="deaths">{{ player.currentServer?.sessionDeaths || 0 }}</span>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
      <div v-else class="no-players-state">
        <div class="no-players-icon">👥</div>
        <p>No online players</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.online-players-container {
  background: var(--color-background);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Header */
.header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 10px;
}

.online-indicator {
  width: 12px;
  height: 12px;
  background-color: #4CAF50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.player-count {
  font-size: 0.8em;
  color: var(--color-text-muted);
  font-weight: normal;
}

.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.auto-refresh-button {
  padding: 8px 12px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.auto-refresh-button.active {
  background-color: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.auto-refresh-button:hover {
  background-color: var(--color-background-mute);
}

.auto-refresh-button.active:hover {
  background-color: var(--color-accent-hover);
}

.refresh-button {
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.refresh-button:hover {
  background-color: var(--color-accent-hover);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Game Filter Tabs */
.game-filter-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.game-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.game-tab:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-accent);
}

.game-tab.active {
  background-color: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.tab-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.tab-count {
  background-color: var(--color-background-mute);
  color: var(--color-text);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.game-tab.active .tab-count {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Search Controls */
.filter-section {
  margin-bottom: 20px;
}

.search-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.1);
}

.clear-filters-button {
  padding: 10px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.clear-filters-button:hover {
  background-color: #5a6268;
}

/* Loading/Error States */
.loading-state, .error-state, .no-players-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-background-mute);
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.no-players-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.retry-button {
  padding: 10px 20px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.retry-button:hover {
  background-color: var(--color-accent-hover);
}

/* Players Grid */
.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.player-card {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.player-card:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Player Info */
.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.player-details {
  flex: 1;
}

.player-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-heading);
}

.player-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background-color: #4CAF50;
  animation: pulse 2s infinite;
}

/* Game Info */
.game-info {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.game-info:hover {
  background-color: var(--color-background-mute);
}

.game-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.game-icon-small {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.server-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--color-text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-info {
  margin-left: 24px;
}

.map-name {
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Session Stats */
.session-stats {
  display: flex;
  gap: 12px;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--color-text);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.pagination-top {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.pagination-bottom {
  margin-top: 20px;
  border-top: 1px solid var(--color-border);
}

.pagination-button {
  padding: 10px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.pagination-button:disabled {
  background-color: var(--color-background-mute);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.page-info {
  font-weight: 600;
  color: var(--color-text);
}

.results-info {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Game Icons */
.game-icon.bf1942, .tab-icon.bf1942, .game-icon-small.bf1942 {
  background-image: url('../assets/bf1942.jpg');
}

.game-icon.fh2, .tab-icon.fh2, .game-icon-small.fh2 {
  background-image: url('../assets/fh2.jpg');
}

.game-icon.bfv, .tab-icon.bfv, .game-icon-small.bfv {
  background-image: url('../assets/bfv.jpg');
}

.game-icon.default, .tab-icon.default, .game-icon-small.default {
  background-image: url('../assets/servers.jpg');
}

/* Sliding Online Panel */
.online-toggle-btn {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background-color: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: 6px 0 0 6px;
  padding: 10px 12px;
  cursor: pointer;
  z-index: 1001;
}

.online-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  max-width: 90vw;
  height: 100vh;
  background-color: var(--color-background);
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow-y: auto; /* Allow internal scrolling */
}

.online-panel.open {
  transform: translateX(0);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.players-list {
  flex: 1;
  overflow-y: auto;
}

.player-row {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-row:hover {
  background-color: var(--color-background-soft);
}

/* Stats row & K/D colour coding */
.stats-row {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  gap: 2px;
}

.kills {
  color: #4CAF50; /* green */
}

.deaths {
  color: #e74c3c; /* red */
}

/* Map name in server header */
.map {
  font-style: italic;
  color: var(--color-text-muted);
}

/* ===== Added styles for server grouping ===== */
.server-header {
  padding: 12px 16px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.server-header:hover {
  background-color: var(--color-background-mute);
}

.server-players {
  border-bottom: 1px solid var(--color-border);
}

.collapse-enter-active, .collapse-leave-active {
  transition: max-height 0.3s ease;
}
.collapse-enter-from, .collapse-leave-to {
  max-height: 0;
}
.collapse-enter-to, .collapse-leave-from {
  max-height: 500px;
}
/* ===== End added styles ===== */

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-heading);
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4CAF50;
  animation: pulse 2s infinite;
}

.details-row {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
  display: flex;
  gap: 4px;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.separator {
  color: var(--color-text-muted);
}

.player-search-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  margin-top: 8px;
}

.player-search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.1);
}

.game-badge-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.game-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.game-badge:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-accent);
}

.game-badge.active {
  background-color: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.badge-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.badge-count {
  background-color: var(--color-background-mute);
  color: var(--color-text);
  padding: 0 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
}

.game-badge.active .badge-count {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .online-players-container {
    padding: 15px;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
  }

  .game-filter-tabs {
    flex-wrap: wrap;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-group {
    min-width: auto;
  }

  .players-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .player-card {
    padding: 12px;
  }

  .pagination {
    flex-direction: column;
    gap: 15px;
  }

  .pagination-info {
    order: -1;
  }
}

@media (max-width: 480px) {
  .online-players-container {
    padding: 10px;
  }

  .player-info {
    gap: 8px;
  }

  .player-avatar {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .session-stats {
    gap: 8px;
  }
}
</style>

<style>
body.no-scroll {
  overflow: hidden;
}
</style>