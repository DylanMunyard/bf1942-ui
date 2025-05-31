<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { ServerInfo, PlayerWithKdr } from '../types/server';
import TimeDisplay from './TimeDisplay.vue';
import LineChart from './LineChart.vue';
import DetailedChartPopup from './DetailedChartPopup.vue';
import PlayerStatsModal from './PlayerStatsModal.vue';
import { queryAI } from '../services/aiService';
import { marked } from 'marked';
import { fetchServerPlayerData } from '../services/prometheusService';
import { fetchPlayerStats, PlayerTimeStatistics } from '../services/playerStatsService';

// Function to format seconds to mm:ss
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const servers = ref<ServerInfo[]>([]);
const loading = ref(true);
const updating = ref(false); // New ref for tracking updates separately from initial load
const tabSwitchLoading = ref(false); // New ref for tracking loading state during tab switching
const error = ref<string | null>(null);
const showPlayerModal = ref(false);
const showServerInfoModal = ref(false);
const selectedTeamPlayers = ref<{ team1: PlayerWithKdr[], team2: PlayerWithKdr[] }>({ team1: [], team2: [] });
const selectedTeamLabels = ref<{ team1: string, team2: string }>({ team1: '', team2: '' });
const selectedServer = ref<ServerInfo | null>(null);
const refreshTimer = ref<number | null>(null);
const previousServersData = ref<Record<string, ServerInfo>>({});
const sortBy = ref<string>('score');
const sortDirection = ref<'asc' | 'desc'>('desc');
const serverMode = ref<'42' | 'FH2'>('42'); // Track which server list to display

// Chart popup state
const showChartModal = ref(false);
const chartData = ref<{ timestamp: number; value: number; }[]>([]);
const chartLoading = ref(false);
const chartError = ref<string | null>(null);

// AI Chat state
const showAIChatModal = ref(false);
const aiQuestion = ref('');
const aiResponse = ref('');
const aiLoading = ref(false);
const lastQuestion = ref('');

// Player Stats Modal state
const showPlayerStatsModal = ref(false);
const selectedPlayerName = ref('');
const playerStats = ref<PlayerTimeStatistics | null>(null);
const playerStatsLoading = ref(false);
const playerStatsError = ref<string | null>(null);

const fetchServerData = async () => {
  // If servers are already loaded, use updating state instead of loading
  if (servers.value.length > 0) {
    updating.value = true;
  } else {
    loading.value = true;
  }
  error.value = null;

  try {
    // Use different API URL based on selected mode
    const apiUrl = serverMode.value === '42' 
      ? 'https://api.bflist.io/bf1942/v1/servers/1?perPage=100'
      : 'https://api.bflist.io/fh2/v1/servers/1?perPage=100';

    const response = await axios.get<ServerInfo[]>(apiUrl);

    // Before updating servers, store the current data as previous data
    if (servers.value.length > 0) {
      // Create a map of current servers by GUID
      const newPreviousData: Record<string, ServerInfo> = {};
      servers.value.forEach(server => {
        newPreviousData[server.guid] = server;
      });
      previousServersData.value = newPreviousData;
    }

    // In a real application, we would fetch multiple servers and sort them
    servers.value = response.data;

    // Sort servers by numPlayers in descending order
    servers.value.sort((a, b) => b.numPlayers - a.numPlayers);
  } catch (err) {
    error.value = 'Failed to fetch server data. Please try again.';
    console.error(err);
  } finally {
    loading.value = false;
    updating.value = false;
    tabSwitchLoading.value = false;
  }
};

const openPlayerModal = (server: ServerInfo) => {
  selectedServer.value = server;

  // Group players by team and calculate KDR
  const team1Players: PlayerWithKdr[] = [];
  const team2Players: PlayerWithKdr[] = [];
  const teamLabels: Record<number, string> = {};

  // Get team labels
  server.teams.forEach(team => {
    teamLabels[team.index] = team.label;
  });

  // Get previous server data if available
  const previousServer = previousServersData.value[server.guid];

  // Process players
  server.players.forEach(player => {
    const kdr = player.deaths > 0 ? +(player.kills / player.deaths).toFixed(2) : player.kills;
    const playerWithKdr: PlayerWithKdr = { ...player, kdr };

    // Check if we have previous data for this server
    if (previousServer) {
      // Find the player in the previous data
      const previousPlayer = previousServer.players.find(p => p.name === player.name);
      if (previousPlayer) {
        playerWithKdr.previousScore = previousPlayer.score;

        // Determine if score has changed
        if (player.score > previousPlayer.score) {
          playerWithKdr.scoreChanged = 'up';
        } else if (player.score < previousPlayer.score) {
          playerWithKdr.scoreChanged = 'down';
        } else {
          playerWithKdr.scoreChanged = 'none';
        }
      }
    }

    if (player.team === 1) {
      team1Players.push(playerWithKdr);
    } else {
      team2Players.push(playerWithKdr);
    }
  });

  // Sort players based on the current sort settings
  const sortPlayers = (players: PlayerWithKdr[]) => {
    return [...players].sort((a, b) => {
      let comparison = 0;

      if (sortBy.value === 'kdr') {
        comparison = a.kdr - b.kdr;
      } else if (sortBy.value === 'score') {
        comparison = a.score - b.score;
      } else if (sortBy.value === 'kills') {
        comparison = a.kills - b.kills;
      } else if (sortBy.value === 'deaths') {
        comparison = a.deaths - b.deaths;
      }

      return sortDirection.value === 'desc' ? -comparison : comparison;
    });
  };

  selectedTeamPlayers.value = { 
    team1: sortPlayers(team1Players), 
    team2: sortPlayers(team2Players) 
  };

  selectedTeamLabels.value = { 
    team1: teamLabels[1] || 'Team 1', 
    team2: teamLabels[2] || 'Team 2' 
  };

  showPlayerModal.value = true;
  window.addEventListener('keydown', handleKeyDown);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closePlayerModal();
  }
};

const closePlayerModal = () => {
  showPlayerModal.value = false;
  window.removeEventListener('keydown', handleKeyDown);
};

const openServerInfoModal = (server: ServerInfo) => {
  selectedServer.value = server;
  showServerInfoModal.value = true;
  window.addEventListener('keydown', handleServerInfoKeyDown);
};

const handleServerInfoKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeServerInfoModal();
  }
};

const closeServerInfoModal = () => {
  showServerInfoModal.value = false;
  window.removeEventListener('keydown', handleServerInfoKeyDown);
};

// Function to open the chart popup
const openChartModal = async (server: ServerInfo) => {
  selectedServer.value = server;
  showChartModal.value = true;
  chartLoading.value = true;
  chartError.value = null;

  try {
    // Fetch player count data for the server
    chartData.value = await fetchServerPlayerData(server.name);
  } catch (err) {
    console.error('Error fetching chart data:', err);
    chartError.value = 'Failed to fetch chart data';
  } finally {
    chartLoading.value = false;
  }

  window.addEventListener('keydown', handleChartKeyDown);
};

// Function to handle key events for the chart popup
const handleChartKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeChartModal();
  }
};

// Function to close the chart popup
const closeChartModal = () => {
  showChartModal.value = false;
  window.removeEventListener('keydown', handleChartKeyDown);
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
  if (selectedServer.value) {
    openPlayerModal(selectedServer.value);
  }
};

// Function to join a server without changing focus
const joinServer = (server: ServerInfo) => {
  // Open the link in a new tab without changing focus
  const newWindow = window.open(server.joinLink, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    // Immediately blur the new window to return focus to the current window
    newWindow.blur();
    window.focus();
  }
};

onMounted(() => {
  fetchServerData();

  // Set up auto-refresh every 15 seconds
  refreshTimer.value = window.setInterval(() => {
    fetchServerData();
  }, 15000);
});

// Function to render markdown as HTML
const renderMarkdown = (text: string): string => {
  // Configure marked to minimize whitespace
  marked.setOptions({
    gfm: true,
    breaks: true,
    sanitize: false
  });

  // Process the markdown and return HTML
  return marked(text);
};

// AI Chat functions
const openAIChatModal = () => {
  showAIChatModal.value = true;
  window.addEventListener('keydown', handleAIChatKeyDown);
};

const closeAIChatModal = () => {
  showAIChatModal.value = false;
  window.removeEventListener('keydown', handleAIChatKeyDown);
};

const handleAIChatKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeAIChatModal();
  }
};

const submitAIQuestion = async () => {
  if (!aiQuestion.value.trim()) return;

  aiLoading.value = true;
  try {
    // Store the question before sending it
    lastQuestion.value = aiQuestion.value;
    aiResponse.value = await queryAI(aiQuestion.value);
    // Clear the question field after receiving a response
    aiQuestion.value = '';
  } catch (error) {
    aiResponse.value = 'Sorry, I encountered an error while processing your question.';
    console.error('AI query error:', error);
  } finally {
    aiLoading.value = false;
  }
};

// Function to toggle between 42 and FH2 server modes
const toggleServerMode = () => {
  serverMode.value = serverMode.value === '42' ? 'FH2' : '42';
  // Set tab switch loading state
  tabSwitchLoading.value = true;
  // Refresh data when mode changes
  fetchServerData();
};

onUnmounted(() => {
  // Clear the timer when component is unmounted
  if (refreshTimer.value !== null) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
});
</script>

<template>
  <div class="server-table-container">
    <div class="tabs-container">
      <div class="tabs">
        <div 
          class="tab" 
          :class="{ 'active': serverMode === '42' }" 
          @click="serverMode !== '42' && toggleServerMode()"
        >
          BF1942
        </div>
        <div 
          class="tab" 
          :class="{ 'active': serverMode === 'FH2' }" 
          @click="serverMode !== 'FH2' && toggleServerMode()"
        >
          FH2
        </div>
      </div>
      <div class="header-right">
        <TimeDisplay />
        <button @click="openAIChatModal" class="ai-chat-button">
          <span>Metrics Chat</span>
        </button>
        <button @click="fetchServerData" class="update-button">
          <span v-if="!updating">Update</span>
          <span v-else class="spinner"></span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading server data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="servers.length > 0" class="server-info">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Server Name</th>
              <th>Players</th>
              <th>Map</th>
              <th>Game Type</th>
              <th>Join</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in servers" :key="server.guid">
              <td>
                <a href="#" @click.prevent="openChartModal(server)" class="server-name-link">
                  {{ server.name }}
                </a> 
                ({{ formatTime(server.roundTimeRemain) }} | {{ server.tickets1 }} | {{ server.tickets2 }})
              </td>
              <td>
                <a href="#" @click.prevent="openPlayerModal(server)">
                  {{ server.numPlayers }} / {{ server.maxPlayers }}
                </a>
              </td>
              <td>{{ server.mapName }}</td>
              <td>{{ server.gameType }}</td>
              <td>
                <a href="#" @click.prevent="joinServer(server)" class="join-link">Join Server</a>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Transparent loading overlay for tab switching -->
        <div v-if="tabSwitchLoading" class="table-loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading data...</div>
        </div>
      </div>
    </div>

    <!-- Player Modal -->
    <div v-if="showPlayerModal" class="modal-overlay" @click="closePlayerModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Player List</h2>
          <button @click="closePlayerModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="teams-container">
            <div class="team">
              <h3>{{ selectedTeamLabels.team1 }}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th @click="handleSort('score')" class="sortable">
                      Score
                      <span v-if="sortBy === 'score'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="handleSort('kills')" class="sortable">
                      🎯
                      <span v-if="sortBy === 'kills'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="handleSort('deaths')" class="sortable">
                      💀
                      <span v-if="sortBy === 'deaths'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="handleSort('kdr')" class="sortable">
                      KDR
                      <span v-if="sortBy === 'kdr'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in selectedTeamPlayers.team1" :key="player.name">
                    <td>
                      <a href="#" @click.prevent="openPlayerStatsModal(player.name)" class="player-name-link">
                        {{ player.name }}
                      </a>
                      <span v-if="player.scoreChanged === 'up'" class="score-up">▲</span>
                      <span v-else-if="player.scoreChanged === 'down'" class="score-down">▼</span>
                    </td>
                    <td>{{ player.score }}</td>
                    <td>{{ player.kills }}</td>
                    <td>{{ player.deaths }}</td>
                    <td>{{ player.kdr }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="team">
              <h3>{{ selectedTeamLabels.team2 }}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th @click="handleSort('score')" class="sortable">
                      Score
                      <span v-if="sortBy === 'score'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="handleSort('kills')" class="sortable">
                      🎯
                      <span v-if="sortBy === 'kills'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="handleSort('deaths')" class="sortable">
                      💀
                      <span v-if="sortBy === 'deaths'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="handleSort('kdr')" class="sortable">
                      KDR
                      <span v-if="sortBy === 'kdr'" class="sort-indicator">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in selectedTeamPlayers.team2" :key="player.name">
                    <td>
                      <a href="#" @click.prevent="openPlayerStatsModal(player.name)" class="player-name-link">
                        {{ player.name }}
                      </a>
                      <span v-if="player.scoreChanged === 'up'" class="score-up">▲</span>
                      <span v-else-if="player.scoreChanged === 'down'" class="score-down">▼</span>
                    </td>
                    <td>{{ player.score }}</td>
                    <td>{{ player.kills }}</td>
                    <td>{{ player.deaths }}</td>
                    <td>{{ player.kdr }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Server Info Modal -->
    <div v-if="showServerInfoModal" class="modal-overlay" @click="closeServerInfoModal">
      <div class="modal-content server-info-modal" @click.stop>
        <div class="modal-header">
          <h2>Server Information</h2>
          <button @click="closeServerInfoModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedServer" class="server-details">
            <div class="server-detail-item">
              <strong>Server Name:</strong> {{ selectedServer.name }}
            </div>
            <div class="server-detail-item">
              <strong>IP Address:</strong> {{ selectedServer.ip }}
            </div>
            <div class="server-detail-item">
              <strong>Port:</strong> {{ selectedServer.port }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Chat Modal -->
    <div v-if="showAIChatModal" class="modal-overlay" @click="closeAIChatModal">
      <div class="modal-content ai-chat-modal" @click.stop>
        <div class="modal-header">
          <h2>Metrics Chat</h2>
          <button @click="closeAIChatModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="ai-chat-container">
            <div class="ai-response-container">
              <div v-if="aiResponse" class="ai-response">
                <div class="ai-question">
                  <strong>Question:</strong> {{ lastQuestion }}
                </div>
                <div class="ai-answer">
                  <strong>Answer:</strong> <span v-html="renderMarkdown(aiResponse)"></span>
                </div>
              </div>
              <div v-else class="ai-response-placeholder">
                Ask me anything about server metrics!
              </div>
            </div>
            <div class="ai-input-container">
              <input 
                v-model="aiQuestion" 
                @keyup.enter="submitAIQuestion"
                placeholder="Ask a question about metrics..." 
                class="ai-input"
                :disabled="aiLoading"
              />
              <button 
                @click="submitAIQuestion" 
                class="ai-submit-button"
                :disabled="aiLoading || !aiQuestion.trim()"
              >
                <span v-if="!aiLoading">Ask</span>
                <span v-else class="spinner"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Count History Modal -->
    <DetailedChartPopup 
      v-if="showChartModal"
      :server-name="selectedServer?.name || ''"
      :server-ip="selectedServer?.ip || ''"
      :chart-data="chartData"
      :is-open="showChartModal"
      @close="closeChartModal"
    />

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
.server-table-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h1 {
  margin: 0;
}

.update-button {
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.update-button:hover {
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

/* Add alternating row colors for better readability */
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

.join-link {
  display: inline-block;
  padding: 6px 12px;
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.join-link:hover {
  background-color: var(--color-primary-hover);
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: #ff5252; /* A red that works well in both light and dark modes */
}

.server-info {
  align-self: flex-start;
  width: 100%;
}

.table-container {
  position: relative;
  width: 100%;
}

.table-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(var(--color-background-rgb, 255, 255, 255), 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

.loading-text {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-primary);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* Slightly darker for better contrast in both modes */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-background);
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow for better visibility */
  color: var(--color-text);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.teams-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.team {
  flex: 1;
  min-width: 300px;
}

@media (max-width: 768px) {
  .teams-container {
    flex-direction: column;
  }
}

/* Styles for sortable headers and score indicators */
.sortable {
  cursor: pointer;
  position: relative;
  user-select: none;
}

.sortable:hover {
  background-color: #e8e8e8;
}

.sort-indicator {
  margin-left: 5px;
  font-size: 12px;
}

.score-up {
  color: var(--color-accent);
  margin-left: 5px;
  font-size: 12px;
}

.score-down {
  color: #ff5252; /* A red that works well in both light and dark modes */
  margin-left: 5px;
  font-size: 12px;
}

/* Server name link styles */
.server-name-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
}

.server-name-link:hover {
  text-decoration: underline;
}

/* Player name link styles */
.player-name-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
}

.player-name-link:hover {
  text-decoration: underline;
}

/* Chart link styles */
.chart-link {
  display: inline-block;
  margin-left: 5px;
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.chart-link:hover {
  transform: scale(1.2);
}

.chart-icon {
  font-size: 14px;
}

/* Server info modal styles */
.server-info-modal {
  max-width: 500px;
}

.server-details {
  padding: 10px;
}

.server-detail-item {
  margin-bottom: 10px;
  font-size: 16px;
}

/* Tabs container and tabs styles */
.tabs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.tabs {
  display: flex;
  gap: 2px;
}

.tab {
  padding: 12px 24px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  border: 1px solid var(--color-border);
  border-bottom: none;
  transition: all 0.2s ease;
}

.tab:hover {
  background-color: var(--color-background-mute);
}

.tab.active {
  background-color: var(--color-background);
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  position: relative;
  z-index: 1;
}

/* Header right section */
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Metrics Chat button styles */
.ai-chat-button {
  padding: 8px 16px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-weight: bold;
  border: 2px solid var(--color-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.ai-chat-button:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
  background-color: var(--color-background-soft);
}

/* Metrics Chat modal styles */
.ai-chat-modal {
  max-width: 600px;
}

.ai-chat-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-response-container {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 15px;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
}

.ai-response {
  line-height: 1.5;
}

.ai-question {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.ai-answer {
  margin-top: 5px;
}

/* Markdown styling */
.ai-answer ul, .ai-answer ol {
  padding-left: 20px;
  margin: 5px 0;
}

.ai-answer li {
  margin-bottom: 5px;
}

/* Reduce space between paragraphs and lists */
.ai-answer p + ul, 
.ai-answer p + ol {
  margin-top: 0;
}

.ai-answer code {
  background-color: var(--color-background-mute);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.ai-answer pre {
  background-color: var(--color-background-mute);
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  margin: 10px 0;
}

.ai-answer blockquote {
  border-left: 4px solid var(--color-border);
  padding-left: 10px;
  margin-left: 0;
  color: var(--color-text-muted, var(--color-text));
}

.ai-answer h1, .ai-answer h2, .ai-answer h3, .ai-answer h4, .ai-answer h5, .ai-answer h6 {
  margin-top: 15px;
  margin-bottom: 10px;
}

.ai-answer p {
  margin: 5px 0;
}

/* Ensure no extra space between elements */
.ai-answer > *:first-child {
  margin-top: 0;
}

.ai-answer > *:last-child {
  margin-bottom: 0;
}

.ai-response-placeholder {
  color: var(--color-text-muted);
  font-style: italic;
}

.ai-input-container {
  display: flex;
  gap: 10px;
}

.ai-input {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 16px;
  background-color: var(--color-background);
  color: var(--color-text);
}

.ai-submit-button {
  padding: 10px 20px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.ai-submit-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.ai-submit-button:disabled {
  background-color: var(--color-background-mute);
  color: var(--color-border);
  cursor: not-allowed;
}
</style>
