<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchPlayersList, PlayerListItem, fetchPlayerStats } from '../services/playerStatsService';
import PlayerStatsModal from './PlayerStatsModal.vue';
import axios from 'axios';

// Router
const router = useRouter();
const route = useRoute();

// Props from router
interface Props {
  selectedPlayerName?: string;
  selectedSessionId?: number;
  showPlayerModal?: boolean;
  showSessionModal?: boolean;
}

const props = defineProps<Props>();

// State variables
const players = ref<PlayerListItem[]>([]);
const filteredPlayers = ref<PlayerListItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const sortBy = ref<string>('lastSeen');
const sortDirection = ref<'asc' | 'desc'>('desc');
const servers = ref<any[]>([]);

// Filter variables
const nameFilter = ref('');
const gameIdFilter = ref('');
const serverNameFilter = ref('');
const uniqueGameIds = ref<string[]>([]);
const uniqueServerNames = ref<string[]>([]);

// Player Stats Modal state
const showPlayerStatsModal = ref(false);
const selectedPlayerName = ref('');
const playerStats = ref(null);
const playerStatsLoading = ref(false);
const playerStatsError = ref<string | null>(null);

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

// Fetch servers data
const fetchServersData = async () => {
  try {
    // Use the same API URL as in ServerTable.vue
    const apiUrl = 'https://api.bflist.io/bf1942/v1/servers/1?perPage=100';
    const response = await axios.get(apiUrl);
    servers.value = response.data;
  } catch (err) {
    console.error('Error fetching servers data:', err);
  }
};

// Fetch players data
const fetchPlayersData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Fetch the players list
    players.value = await fetchPlayersList();

    // Initialize filteredPlayers with all players
    filteredPlayers.value = [...players.value];

    // Fetch server data if not already loaded
    if (servers.value.length === 0) {
      await fetchServersData();
    }

    // Mark active players in the list without fetching detailed stats
    // We'll fetch detailed stats only when a player is clicked
    filterAndSortPlayers();
  } catch (err) {
    console.error('Error fetching players data:', err);
    error.value = 'Failed to fetch players data. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Filter and sort players based on the current filter and sort settings
const filterAndSortPlayers = () => {
  // First, update the list of unique game IDs and server names
  updateUniqueGameIds();
  updateUniqueServerNames();

  // Filter players based on name, gameId, and server name filters
  filteredPlayers.value = players.value.filter(player => {
    // Filter by player name
    const nameMatch = player.playerName.toLowerCase().includes(nameFilter.value.toLowerCase());

    // Filter by game ID
    let gameIdMatch = true;
    if (gameIdFilter.value && player.currentServer && player.currentServer.gameId) {
      gameIdMatch = player.currentServer.gameId === gameIdFilter.value;
    } else if (gameIdFilter.value) {
      gameIdMatch = false;
    }

    // Filter by server name
    let serverNameMatch = true;
    if (serverNameFilter.value && player.currentServer && player.currentServer.serverName) {
      serverNameMatch = player.currentServer.serverName === serverNameFilter.value;
    } else if (serverNameFilter.value) {
      serverNameMatch = false;
    }

    return nameMatch && gameIdMatch && serverNameMatch;
  });

  // Sort the filtered players
  sortPlayers();
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

// Sort players based on the current sort settings
const sortPlayers = () => {
  filteredPlayers.value.sort((a, b) => {
    let comparison = 0;

    if (sortBy.value === 'playerName') {
      comparison = a.playerName.localeCompare(b.playerName);
    } else if (sortBy.value === 'totalPlayTimeMinutes') {
      comparison = a.totalPlayTimeMinutes - b.totalPlayTimeMinutes;
    } else if (sortBy.value === 'lastSeen') {
      comparison = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
    } else if (sortBy.value === 'isActive') {
      comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
    }

    return sortDirection.value === 'desc' ? -comparison : comparison;
  });
};

// Handle sort column click
const handleSort = (column: string) => {
  // If clicking the same column, toggle direction
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // If clicking a new column, set it as the sort column and default to descending
    sortBy.value = column;
    sortDirection.value = 'desc';
  }

  // Re-filter and sort the players
  filterAndSortPlayers();
};

// Function to fetch player stats data
const fetchPlayerStatsData = async (playerName: string) => {
  playerStatsLoading.value = true;
  playerStatsError.value = null;
  playerStats.value = null;

  try {
    // Fetch player statistics from the API
    const stats = await fetchPlayerStats(playerName);
    playerStats.value = stats;
  } catch (err) {
    console.error('Error fetching player stats:', err);
    playerStatsError.value = 'Failed to fetch player statistics';
  } finally {
    playerStatsLoading.value = false;
  }
};

// Function to open the player stats modal
const openPlayerStatsModal = (playerName: string) => {
  // Navigate to the player details page
  router.push(`/players/${encodeURIComponent(playerName)}`);
};

// Function to handle key events for the player stats modal
const handlePlayerStatsKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closePlayerStatsModal();
  }
};

// Function to close the player stats modal
const closePlayerStatsModal = () => {
  showPlayerStatsModal.value = false;
  window.removeEventListener('keydown', handlePlayerStatsKeyDown);

  // If we're on the player details page, navigate back to the players page
  if (route.name === 'player-details' || route.name === 'session-details') {
    router.push('/players');
  }
};

// Handle name filter change
const handleNameFilterChange = (event: Event) => {
  nameFilter.value = (event.target as HTMLInputElement).value;
  filterAndSortPlayers();
};

// Handle game ID filter change
const handleGameIdFilterChange = (event: Event) => {
  gameIdFilter.value = (event.target as HTMLSelectElement).value;
  filterAndSortPlayers();
};

// Handle server name filter change
const handleServerNameFilterChange = (event: Event) => {
  serverNameFilter.value = (event.target as HTMLSelectElement).value;
  filterAndSortPlayers();
};

// Clear name filter
const clearNameFilter = () => {
  nameFilter.value = '';
  filterAndSortPlayers();
};

// Reset all filters
const resetFilters = () => {
  nameFilter.value = '';
  gameIdFilter.value = '';
  serverNameFilter.value = '';
  filterAndSortPlayers();
};

// Watch for filter changes
watch([nameFilter, gameIdFilter, serverNameFilter], () => {
  filterAndSortPlayers();
});

// Watch for route props changes
watch(() => props.selectedPlayerName, (newPlayerName) => {
  if (newPlayerName && props.showPlayerModal) {
    selectedPlayerName.value = newPlayerName;
    showPlayerStatsModal.value = true;
    fetchPlayerStatsData(newPlayerName);
  }
}, { immediate: true });

// Watch for session ID changes
watch(() => props.selectedSessionId, (newSessionId) => {
  if (newSessionId && props.showSessionModal) {
    // This will be handled by the PlayerStatsModal component
  }
}, { immediate: true });

// Fetch data when component is mounted
onMounted(() => {
  // Fetch servers data first, then fetch players data
  fetchServersData().then(() => {
    fetchPlayersData();
  });
});
</script>

<template>
  <div class="players-page-container">
    <div class="header">
      <h1>Players</h1>
      <button @click="fetchPlayersData" class="refresh-button">
        <span v-if="!loading">Refresh</span>
        <span v-else class="spinner"></span>
      </button>
    </div>

    <!-- Filter controls -->
    <div class="filter-container">
      <div class="filter-group">
        <label for="nameFilter">Filter by Name:</label>
        <div class="input-with-clear">
          <input 
            type="text" 
            id="nameFilter" 
            v-model="nameFilter" 
            @input="handleNameFilterChange" 
            placeholder="Enter player name"
            class="filter-input"
          />
          <span 
            v-if="nameFilter" 
            class="clear-input" 
            @click="clearNameFilter"
            title="Clear filter"
          >×</span>
        </div>
      </div>

      <div class="filter-group">
        <label for="gameIdFilter">Currently Playing:</label>
        <select 
          id="gameIdFilter" 
          v-model="gameIdFilter" 
          @change="handleGameIdFilterChange"
          class="filter-select"
        >
          <option value="">All Games</option>
          <option v-for="gameId in uniqueGameIds" :key="gameId" :value="gameId">
            {{ gameId }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="serverNameFilter">Currently Playing On:</label>
        <select 
          id="serverNameFilter" 
          v-model="serverNameFilter" 
          @change="handleServerNameFilterChange"
          class="filter-select"
        >
          <option value="">All Servers</option>
          <option v-for="serverName in uniqueServerNames" :key="serverName" :value="serverName">
            {{ serverName }}
          </option>
        </select>
      </div>

      <button @click="resetFilters" class="reset-filters-button">
        Reset Filters
      </button>
    </div>

    <div v-if="loading && players.length === 0" class="loading">Loading players data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="filteredPlayers.length > 0" class="players-table-container">
      <table>
        <thead>
          <tr>
            <th @click="handleSort('playerName')" class="sortable">
              Player Name
              <span v-if="sortBy === 'playerName'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="handleSort('totalPlayTimeMinutes')" class="sortable">
              Total Play Time
              <span v-if="sortBy === 'totalPlayTimeMinutes'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="handleSort('lastSeen')" class="sortable">
              Last Seen
              <span v-if="sortBy === 'lastSeen'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="handleSort('isActive')" class="sortable">
              Status
              <span v-if="sortBy === 'isActive'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in filteredPlayers" :key="player.playerName">
            <td>
              <a href="#" @click.prevent="openPlayerStatsModal(player.playerName)" class="player-name-link">
                {{ player.playerName }}
              </a>
            </td>
            <td>{{ formatPlayTime(player.totalPlayTimeMinutes) }}</td>
            <td>
              <div>{{ formatRelativeTime(player.lastSeen) }}</div>
              <div class="secondary-text">{{ formatDate(player.lastSeen) }}</div>
            </td>
            <td>
              <div v-if="player.isActive" class="active-status">
                <div class="server-info">
                  {{ player.currentServer ? 
                    `Currently active on ${player.currentServer.serverName}` : 
                    'Currently active' }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="players.length > 0 && filteredPlayers.length === 0" class="no-data">
      No players match the current filters. <a href="#" @click.prevent="resetFilters">Reset filters</a>
    </div>
    <div v-else class="no-data">No players found.</div>

    <!-- Player Stats Modal -->
    <PlayerStatsModal
      v-if="showPlayerStatsModal"
      :player-name="selectedPlayerName"
      :player-stats="playerStats"
      :is-open="showPlayerStatsModal"
      :is-loading="playerStatsLoading"
      :error="playerStatsError"
      :servers="servers"
      :selected-session-id="props.selectedSessionId"
      :show-session-modal="props.showSessionModal"
      @close="closePlayerStatsModal"
    />
  </div>
</template>

<style scoped>
.players-page-container {
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

.filter-input, .filter-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
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

.clear-input {
  position: absolute;
  right: 10px;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-input:hover {
  color: #666;
  background-color: #f0f0f0;
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

.player-name-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
}

.player-name-link:hover {
  text-decoration: underline;
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

.secondary-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.active-status {
  background-color: var(--color-background-mute);
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: bold;
  color: var(--color-heading);
  border-left: 4px solid #4CAF50;
}

.server-info {
  font-size: 0.9rem;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .players-page-container {
    padding: 0 20px;
  }

  th, td {
    padding: 8px;
  }
}
</style>
