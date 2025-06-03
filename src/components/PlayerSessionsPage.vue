<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchPlayerSessions, PagedResult, SessionListItem, PlayerContextInfo, fetchSessionDetails } from '../services/playerStatsService';
import SessionDetailsModal from './SessionDetailsModal.vue';

// Router
const router = useRouter();
const route = useRoute();

// Props from router
interface Props {
  playerName: string;
  selectedSessionId?: number;
  showSessionModal?: boolean;
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

// Session Details Modal state
const showSessionDetailsModal = ref(false);
const selectedSessionId = ref<number | null>(null);
const sessionDetailsLoading = ref(false);
const sessionDetailsError = ref<string | null>(null);


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

// Fetch player sessions data
const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Fetch the player sessions with pagination
    const result = await fetchPlayerSessions(props.playerName, currentPage.value, pageSize.value);

    // Update state with the fetched data
    sessions.value = result.items;
    playerInfo.value = result.playerInfo || null;
    totalItems.value = result.totalItems;
    totalPages.value = result.totalPages;
  } catch (err) {
    console.error('Error fetching player sessions:', err);
    error.value = 'Failed to fetch player sessions. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Function to open the session details modal
const openSessionDetailsModal = (sessionId: number, event?: Event) => {
  // Prevent event propagation to stop the modal from closing
  if (event) {
    event.stopPropagation();
  }

  // Navigate to the session details page
  router.push(`/players/${encodeURIComponent(props.playerName)}/sessions/${sessionId}`);
};

// Function to close the session details modal
const closeSessionDetailsModal = () => {
  showSessionDetailsModal.value = false;

  // Navigate back to the player sessions page
  if (route.name === 'session-details') {
    router.push(`/players/${encodeURIComponent(props.playerName)}/sessions`);
  }
};


// Function to handle pagination
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchData();
};

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

// Watch for route props changes
watch(() => [props.playerName, props.selectedSessionId, props.showSessionModal], ([newPlayerName, newSessionId, newShowSessionModal]) => {
  if (newPlayerName) {
    fetchData();
  }

  if (newSessionId && newShowSessionModal) {
    selectedSessionId.value = newSessionId;
    showSessionDetailsModal.value = true;
  }
}, { immediate: true });

// Watch for page size changes
watch(() => pageSize.value, () => {
  currentPage.value = 1; // Reset to first page when changing page size
  fetchData();
});

// Fetch data when component is mounted
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="player-sessions-page-container">
    <div class="header">
      <div class="header-left">
        <h1>{{ playerName }}'s Sessions</h1>
        <div v-if="playerInfo" class="player-info">
          <div class="info-item">
            <span class="info-label">Total Play Time:</span>
            <span class="info-value">{{ formatPlayTime(playerInfo.totalPlayTimeMinutes) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Sessions:</span>
            <span class="info-value">{{ playerInfo.totalSessions }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">K/D Ratio:</span>
            <span class="info-value">{{ calculateKDR(playerInfo.totalKills, playerInfo.totalDeaths) }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <router-link :to="`/players/${encodeURIComponent(playerName)}`" class="back-button">
          Back to Player Details
        </router-link>
        <button @click="fetchData" class="refresh-button">
          <span v-if="!loading">Refresh</span>
          <span v-else class="spinner"></span>
        </button>
      </div>
    </div>

    <div v-if="loading && sessions.length === 0" class="loading">Loading sessions data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="sessions.length > 0" class="sessions-table-container">
      <table>
        <thead>
          <tr>
            <th>Server Name</th>
            <th>Map</th>
            <th>Game Type</th>
            <th>Score</th>
            <th>Kills</th>
            <th>Deaths</th>
            <th>K/D</th>
            <th>Start Time</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.sessionId" 
              @click="(event) => openSessionDetailsModal(session.sessionId, event)" 
              class="clickable-row">
            <td>
              <router-link :to="`/servers/${encodeURIComponent(session.serverName)}`" class="server-link">
                {{ session.serverName }}
              </router-link>
            </td>
            <td>{{ session.mapName }}</td>
            <td>{{ session.gameType }}</td>
            <td>{{ session.score }}</td>
            <td>{{ session.kills }}</td>
            <td>{{ session.deaths }}</td>
            <td>{{ calculateKDR(session.kills, session.deaths) }}</td>
            <td>
              <div>{{ formatRelativeTime(session.startTime) }}</div>
              <div class="secondary-text">{{ formatDate(session.startTime) }}</div>
            </td>
            <td>{{ formatPlayTime(session.durationMinutes) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination controls -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} sessions
        </div>
        <div class="pagination-controls">
          <button 
            @click="goToPage(1)" 
            class="pagination-button" 
            :disabled="currentPage === 1"
            title="First Page"
          >
            &laquo;
          </button>
          <button 
            @click="goToPage(currentPage - 1)" 
            class="pagination-button" 
            :disabled="currentPage === 1"
            title="Previous Page"
          >
            &lsaquo;
          </button>
          <button 
            v-for="page in paginationRange" 
            :key="page" 
            @click="goToPage(page)" 
            class="pagination-button" 
            :class="{ active: page === currentPage }"
          >
            {{ page }}
          </button>
          <button 
            @click="goToPage(currentPage + 1)" 
            class="pagination-button" 
            :disabled="currentPage === totalPages"
            title="Next Page"
          >
            &rsaquo;
          </button>
          <button 
            @click="goToPage(totalPages)" 
            class="pagination-button" 
            :disabled="currentPage === totalPages"
            title="Last Page"
          >
            &raquo;
          </button>
        </div>
        <div class="page-size-selector">
          <label for="pageSize">Items per page:</label>
          <select id="pageSize" v-model="pageSize">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
    <div v-else class="no-data">No sessions found for this player.</div>

    <!-- Session Details Modal -->
    <SessionDetailsModal
      v-if="showSessionDetailsModal && selectedSessionId !== null"
      :player-name="playerName"
      :session-id="selectedSessionId"
      :is-open="showSessionDetailsModal"
      @close="closeSessionDetailsModal"
    />

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

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: var(--color-background-mute);
}

.secondary-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 2px;
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

  th, td {
    padding: 8px;
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
</style>
