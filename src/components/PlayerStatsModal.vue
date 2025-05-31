<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { PlayerTimeStatistics } from '../services/playerStatsService';

interface Props {
  playerName: string;
  playerStats: PlayerTimeStatistics | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  servers?: any[]; // Add servers prop to get player count
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

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
  // Use toLocaleString with options to ensure proper locale conversion
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

// Get the number of players online for a server
const getServerPlayerCount = (serverGuid: string): number | null => {
  if (!props.servers || !serverGuid) return null;

  const server = props.servers.find(s => s.guid === serverGuid);
  return server ? server.numPlayers : null;
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Close the popup when clicking outside or pressing ESC
const handleOutsideClick = (event: MouseEvent) => {
  const popup = document.querySelector('.player-stats-modal-content');
  if (popup && !popup.contains(event.target as Node)) {
    emit('close');
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

// Add and remove event listeners
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
  } else {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleKeyDown);
  }
});

// Clean up event listeners when component is unmounted
onMounted(() => {
  if (props.isOpen) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
  }
});
</script>

<template>
  <div v-if="isOpen" class="player-stats-modal-overlay">
    <div class="player-stats-modal-content">
      <div class="player-stats-header">
        <div class="player-name-container">
          <h2>Player Statistics: {{ playerName }}</h2>
          <span v-if="playerStats && playerStats.isActive" class="status-badge active">Active</span>
        </div>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      <div class="player-stats-body">
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading player statistics...</p>
        </div>
        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
        </div>
        <div v-else-if="playerStats" class="stats-container">
          <div v-if="playerStats.isActive && playerStats.currentServer" class="current-server-banner">
            <div>
              Currently active on {{ playerStats.currentServer.serverName }}
              <span v-if="getServerPlayerCount(playerStats.currentServer.serverGuid)" class="player-count">
                ({{ getServerPlayerCount(playerStats.currentServer.serverGuid) }} players online)
              </span>
            </div>
            <div v-if="playerStats.currentServer.sessionKills !== undefined && playerStats.currentServer.sessionDeaths !== undefined" class="session-stats">
              Session: {{ playerStats.currentServer.sessionKills }} kills / {{ playerStats.currentServer.sessionDeaths }} deaths
              (K/D: {{ calculateKDR(playerStats.currentServer.sessionKills, playerStats.currentServer.sessionDeaths) }})
            </div>
          </div>

          <!-- General statistics section -->
          <div class="stats-section">
            <h3>General Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total Play Time</div>
                <div class="stat-value">{{ formatPlayTime(playerStats.totalPlayTimeMinutes) }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Last Seen</div>
                <div class="stat-value">
                  <div>{{ formatRelativeTime(playerStats.lastPlayed) }}</div>
                  <div class="stat-value-secondary">{{ formatDate(playerStats.lastPlayed) }}</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Highest Score</div>
                <div class="stat-value">{{ playerStats.highestScore }}</div>
              </div>
            </div>
          </div>

          <!-- Combat statistics section -->
          <div class="stats-section">
            <h3>Combat Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total Kills</div>
                <div class="stat-value">{{ playerStats.totalKills }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Total Deaths</div>
                <div class="stat-value">{{ playerStats.totalDeaths }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">K/D Ratio</div>
                <div class="stat-value">{{ calculateKDR(playerStats.totalKills, playerStats.totalDeaths) }}</div>
              </div>
            </div>
          </div>

          <!-- Recent servers section -->
          <div v-if="playerStats.recentServers.length > 0" class="stats-section">
            <h3>Recent Servers</h3>
            <div class="recent-servers-table">
              <table>
                <thead>
                  <tr>
                    <th>Server Name</th>
                    <th>Play Time</th>
                    <th>Kills</th>
                    <th>Deaths</th>
                    <th>K/D</th>
                    <th>Last Played</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(server, index) in playerStats.recentServers" :key="index">
                    <td>{{ server.serverName }}</td>
                    <td>{{ formatPlayTime(server.totalPlayTimeMinutes) }}</td>
                    <td>{{ server.totalKills }}</td>
                    <td>{{ server.totalDeaths }}</td>
                    <td>{{ calculateKDR(server.totalKills, server.totalDeaths) }}</td>
                    <td>
                      <div>{{ formatRelativeTime(server.lastPlayed) }}</div>
                      <div class="table-secondary-text">{{ formatDate(server.lastPlayed) }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else class="no-data-container">
          <p>No player statistics available.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-stats-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.player-stats-modal-content {
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 80%;
  max-width: 900px;
  max-height: 90vh;
  overflow: auto;
  padding: 0;
  animation: popup-fade-in 0.3s ease-out;
  color: var(--color-text);
}

@keyframes popup-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.player-stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
}

.player-name-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-stats-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #ff5252;
}

.status-badge.active {
  background-color: #4CAF50;
}

.current-server-banner {
  background-color: var(--color-background-mute);
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-weight: bold;
  color: var(--color-heading);
  border-left: 4px solid #4CAF50;
}

.session-stats {
  margin-top: 5px;
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: normal;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--color-primary);
}

.player-stats-body {
  padding: 20px;
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
  border: 4px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
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

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 15px;
}

.stats-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: bold;
}

.stat-value-secondary {
  font-size: 0.9rem;
  font-weight: normal;
  color: var(--color-text-muted);
  margin-top: 3px;
}

.player-count {
  font-size: 0.9rem;
  margin-left: 5px;
  color: var(--color-text);
}

.table-secondary-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.recent-servers-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

th {
  background-color: var(--color-background-mute);
  font-weight: bold;
  color: var(--color-heading);
}

tbody tr:hover {
  background-color: var(--color-background-mute);
}

@media (max-width: 768px) {
  .player-stats-modal-content {
    width: 95%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
