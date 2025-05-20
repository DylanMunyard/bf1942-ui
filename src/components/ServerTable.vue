<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { ServerInfo, PlayerWithKdr } from '../types/server';
import TimeDisplay from './TimeDisplay.vue';
import LineChart from './LineChart.vue';
import { queryAI } from '../services/aiService';

// Function to format seconds to mm:ss
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const servers = ref<ServerInfo[]>([]);
const loading = ref(true);
const updating = ref(false); // New ref for tracking updates separately from initial load
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

// AI Chat state
const showAIChatModal = ref(false);
const aiQuestion = ref('');
const aiResponse = ref('');
const aiLoading = ref(false);
const lastQuestion = ref('');

const fetchServerData = async () => {
  // If servers are already loaded, use updating state instead of loading
  if (servers.value.length > 0) {
    updating.value = true;
  } else {
    loading.value = true;
  }
  error.value = null;

  try {
    const response = await axios.get<ServerInfo[]>('https://api.bflist.io/bf1942/v1/servers/1?perPage=100');

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
    <div class="header">
      <div class="header-left">
        <h1>BF1942 servers</h1>
        <TimeDisplay />
      </div>
      <div class="header-right">
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
              <a href="#" @click.prevent="openServerInfoModal(server)" class="server-name-link">
                {{ server.name }}
              </a> 
              <LineChart v-if="server.guid === '42b98b-61f0b93-183a06c-49be6b0' || server.guid === '7b3a63-12e36b3-6dac2c-8c0a76c' || server.guid === '42ba49-61f1d04-183a4bc-49bf3d2'" :server-name="server.name" />
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
                      {{ player.name }}
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
                      {{ player.name }}
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
                  <strong>Answer:</strong> {{ aiResponse }}
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
  </div>
</template>

<style scoped>
.server-table-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 40px;
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
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.update-button:hover {
  background-color: #45a049;
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
  border-bottom: 1px solid #ddd;
  color: #333; /* Ensure text is dark enough for readability */
}

/* Add alternating row colors for better readability */
tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

tbody tr:hover {
  background-color: #f0f0f0;
}

th {
  background-color: #e0e0e0; /* Slightly darker for better contrast */
  font-weight: bold;
  color: #333; /* Ensure text is dark enough for readability */
}

.join-link {
  display: inline-block;
  padding: 6px 12px;
  background-color: #2196F3;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.join-link:hover {
  background-color: #0b7dda;
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: #f44336;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3); /* Lighter overlay for better readability */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow for better visibility */
  color: #333; /* Ensure text is dark enough for readability */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ddd;
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
  color: #4CAF50;
  margin-left: 5px;
  font-size: 12px;
}

.score-down {
  color: #f44336;
  margin-left: 5px;
  font-size: 12px;
}

/* Server name link styles */
.server-name-link {
  color: #2196F3;
  text-decoration: none;
  cursor: pointer;
}

.server-name-link:hover {
  text-decoration: underline;
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

/* Header right section */
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Metrics Chat button styles */
.ai-chat-button {
  padding: 8px 16px;
  background-color: white;
  color: #333;
  font-weight: bold;
  border: 2px solid #2196F3;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.ai-chat-button:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
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
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
}

.ai-response {
  white-space: pre-line;
  line-height: 1.5;
}

.ai-question {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.ai-answer {
  margin-top: 5px;
}

.ai-response-placeholder {
  color: #888;
  font-style: italic;
}

.ai-input-container {
  display: flex;
  gap: 10px;
}

.ai-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.ai-submit-button {
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.ai-submit-button:hover:not(:disabled) {
  background-color: #0b7dda;
}

.ai-submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
