<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

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
    const response = await axios.get<RankingsResponse>(`/stats/servers/${encodeURIComponent(route.params.serverName as string)}/rankings`, {
      params: { 
        page,
        pageSize: pageSize.value
      }
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
  router.push({
    query: { ...route.query, page: page.toString() }
  });
};

// Handle page size change
const handlePageSizeChange = () => {
  currentPage.value = 1; // Reset to first page when changing page size
  router.push({
    query: { ...route.query, page: '1', pageSize: pageSize.value.toString() }
  });
};

// Watch for route changes
watch(
  () => [route.params.serverName, route.query.page, route.query.pageSize],
  ([newServerName, newPage, newPageSize]) => {
    if (newServerName) {
      if (newPageSize) {
        pageSize.value = Number(newPageSize);
      }
      fetchRankings(Number(newPage) || 1);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="server-rankings-container">
    <!-- Server Context Header -->
    <div v-if="serverContext" class="server-context">
      <div class="server-context-header">
        <h1>{{ serverContext.serverName }}</h1>
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
              <th>Stats</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ranking in rankings" :key="ranking.playerName" class="ranking-row">
              <td class="rank-cell">#{{ ranking.rank }}</td>
              <td class="player-cell">
                <router-link :to="`/players/${encodeURIComponent(ranking.playerName)}`" class="player-link">
                  {{ ranking.playerName }}
                </router-link>
              </td>
              <td class="stats-cell">
                <div class="desktop-stats">
                  <span class="score" title="Score">🏆 {{ ranking.totalScore }}</span>
                  <span class="combat-badge" title="Kills • Deaths • K/D Ratio">
                    <img src="@/assets/kills.png" alt="Kills" class="kills-icon" /> {{ ranking.totalKills }} • <img src="@/assets/deaths.png" alt="Deaths" class="deaths-icon" /> {{ ranking.totalDeaths }} • 📊 {{ ranking.kdRatio.toFixed(2) }}
                  </span>
                  <span class="playtime" title="Play Time">⏱️ {{ formatPlayTime(ranking.totalPlayTimeMinutes) }}</span>
                </div>
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

/* Desktop stats styling */
.desktop-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  text-align: center;
}

.desktop-stats .score {
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

  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .page-size-selector {
    width: 100%;
    justify-content: space-between;
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
</style> 