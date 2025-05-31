<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchPlayersList, PlayerListItem, fetchPlayerStats } from '../services/playerStatsService';
import PlayerStatsModal from './PlayerStatsModal.vue';
import axios from 'axios';

// State variables
const players = ref<PlayerListItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const sortBy = ref<string>('lastSeen');
const sortDirection = ref<'asc' | 'desc'>('desc');
const servers = ref<any[]>([]);

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

    // Fetch server data if not already loaded
    if (servers.value.length === 0) {
      await fetchServersData();
    }

    // Mark active players in the list without fetching detailed stats
    // We'll fetch detailed stats only when a player is clicked
    sortPlayers();
  } catch (err) {
    console.error('Error fetching players data:', err);
    error.value = 'Failed to fetch players data. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Sort players based on the current sort settings
const sortPlayers = () => {
  players.value.sort((a, b) => {
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

  // Re-sort the players
  sortPlayers();
};

// Function to open the player stats modal
const openPlayerStatsModal = async (playerName: string) => {
  selectedPlayerName.value = playerName;
  showPlayerStatsModal.value = true;
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

  window.addEventListener('keydown', handlePlayerStatsKeyDown);
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
};

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

    <div v-if="loading && players.length === 0" class="loading">Loading players data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="players.length > 0" class="players-table-container">
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
          <tr v-for="player in players" :key="player.playerName">
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
