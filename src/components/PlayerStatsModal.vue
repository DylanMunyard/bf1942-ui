<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics } from '../services/playerStatsService';
import SessionDetailsModal from './SessionDetailsModal.vue';

// Router
const router = useRouter();
const route = useRoute();

interface Props {
  playerName: string;
  playerStats: PlayerTimeStatistics | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  servers?: any[]; // Add servers prop to get player count
  selectedSessionId?: number | null;
  showSessionModal?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

// Session details modal state
const showSessionDetailsModal = ref(false);
const selectedSessionId = ref<number | null>(null);

// Function to open the session details modal
const openSessionDetailsModal = (sessionId: number) => {
  // Navigate to the session details page
  router.push(`/players/${encodeURIComponent(props.playerName)}/sessions/${sessionId}`);
};

// Function to close the session details modal
const closeSessionDetailsModal = () => {
  showSessionDetailsModal.value = false;

  // Navigate back to the player details page
  if (route.name === 'session-details') {
    router.push(`/players/${encodeURIComponent(props.playerName)}`);
  }
};

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
  const now = new Date();

  // Format time without seconds
  const timeFormat = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  // Calculate the difference in days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - dateDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Get day name
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];

  // Format date based on how recent it is
  if (diffDays === 0) {
    // Today
    return `Today at ${timeFormat}`;
  } else if (diffDays === 1) {
    // Yesterday
    return `Yesterday at ${timeFormat}`;
  } else if (diffDays < 7) {
    // Within the last week
    return `${dayName} at ${timeFormat}`;
  } else {
    // More than a week ago
    const formattedDate = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `${formattedDate} at ${timeFormat} (${diffDays} days ago)`;
  }
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

// Watch for changes to selectedSessionId and showSessionModal props
watch(() => [props.selectedSessionId, props.showSessionModal], ([newSessionId, newShowSessionModal]) => {
  if (newSessionId && newShowSessionModal) {
    selectedSessionId.value = newSessionId;
    showSessionDetailsModal.value = true;
  }
}, { immediate: true });

// Watch for route changes to close the modal when navigating back
watch(() => route.name, (newRouteName) => {
  if (props.isOpen && newRouteName !== 'player-details' && newRouteName !== 'session-details') {
    emit('close');
  }

  if (showSessionDetailsModal.value && newRouteName !== 'session-details') {
    showSessionDetailsModal.value = false;
  }
});

// Computed property to sort server play times by minutes played (descending)
const sortedServerPlayTimes = computed(() => {
  if (!props.playerStats?.insights?.serverPlayTimes) return [];
  return [...props.playerStats.insights.serverPlayTimes].sort((a, b) => b.minutesPlayed - a.minutesPlayed);
});

// Computed property to sort activity hours chronologically by local hour (0-23)
const sortedLocalActivityHours = computed(() => {
  if (!props.playerStats?.insights?.activityByHour) return [];

  // Create a new array with local hour information
  const hoursWithLocalTime = props.playerStats.insights.activityByHour.map(hourData => ({
    ...hourData,
    localHour: convertToLocalHour(hourData.hour)
  }));

  // Sort by local hour (0-23)
  return [...hoursWithLocalTime].sort((a, b) => a.localHour - b.localHour);
});

// Function to convert UTC hour to local hour
const convertToLocalHour = (utcHour: number): number => {
  const now = new Date();
  const localDate = new Date(now.setUTCHours(utcHour, 0, 0, 0));
  return localDate.getHours();
};

// Function to calculate the height of each bar in the activity chart
const getActivityBarHeight = (minutesActive: number): string => {
  if (!props.playerStats?.insights?.activityByHour) return "0%";

  // Find the maximum minutes active
  const maxMinutes = Math.max(...props.playerStats.insights.activityByHour.map(hour => hour.minutesActive));

  if (maxMinutes === 0) return "0%";

  // Calculate the percentage height (minimum 5% for visibility if there's any activity)
  const percentage = (minutesActive / maxMinutes) * 100;
  return minutesActive > 0 ? `${Math.max(5, percentage)}%` : "0%";
};

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
              <span v-if="playerStats.currentServer.gameId" class="game-id">
                Game: {{ playerStats.currentServer.gameId }}
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
                <div class="stat-label">Combat Stats</div>
                <div class="stat-value">
                  <div class="combat-stats">
                    <span class="stat-badge">Kills: {{ playerStats.totalKills }}</span>
                    <span class="stat-badge">Deaths: {{ playerStats.totalDeaths }}</span>
                    <span class="stat-badge">KDR: {{ calculateKDR(playerStats.totalKills, playerStats.totalDeaths) }}</span>
                  </div>
                </div>
              </div>
              <div class="stat-item best-session-container" v-if="playerStats.bestSession">
                <div class="stat-label">
                  <span class="trophy-icon">🏆</span> Best Session
                </div>
                <div class="best-session-card">
                  <div class="best-session-header">
                    <div class="best-session-score">{{ playerStats.bestSession.totalScore }}</div>
                    <span class="best-session-badge">
                      KDR: {{ calculateKDR(playerStats.bestSession.totalKills, playerStats.bestSession.totalDeaths) }}
                    </span>
                    <span class="best-session-badge">
                      K: {{ playerStats.bestSession.totalKills }}
                    </span>
                    <span class="best-session-badge">
                      D: {{ playerStats.bestSession.totalDeaths }}
                    </span>
                    <span v-if="playerStats.bestSession.isActive" class="active-session-badge">Active</span>
                  </div>
                  <div class="best-session-details">
                    {{ playerStats.bestSession.mapName }} ({{ playerStats.bestSession.gameType }})
                    | {{ playerStats.bestSession.serverName }}
                    | {{ formatDate(playerStats.bestSession.startTime) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Insights section -->
          <div v-if="playerStats.insights" class="stats-section">
            <h3>Player Insights</h3>
            <div class="insights-period">
              Data from {{ formatDate(playerStats.insights.startPeriod) }} to {{ formatDate(playerStats.insights.endPeriod) }}
            </div>

            <!-- Favorite Servers -->
            <div v-if="playerStats.insights.serverPlayTimes && playerStats.insights.serverPlayTimes.length > 0" class="insights-subsection">
              <h4>Favorite Servers</h4>
              <div class="insights-cards">
                <div v-for="(server, index) in sortedServerPlayTimes" :key="index" class="insights-card">
                  <div class="insights-card-title">{{ server.serverName }}</div>
                  <div class="insights-card-value">{{ formatPlayTime(server.minutesPlayed) }}</div>
                </div>
              </div>
            </div>

            <!-- Deadliest Map -->
            <div v-if="playerStats.insights.bestKillMap" class="insights-subsection">
              <h4>Deadliest Map</h4>
              <div class="insights-card best-kill-map">
                <div class="insights-card-title">{{ playerStats.insights.bestKillMap.mapName }}</div>
                <div class="insights-card-stats">
                  <div class="insights-card-stat">
                    <span class="stat-label">K/D Ratio:</span>
                    <span class="stat-value">{{ playerStats.insights.bestKillMap.kdRatio.toFixed(2) }}</span>
                  </div>
                  <div class="insights-card-stat">
                    <span class="stat-label">Kills:</span>
                    <span class="stat-value">{{ playerStats.insights.bestKillMap.totalKills }}</span>
                  </div>
                  <div class="insights-card-stat">
                    <span class="stat-label">Deaths:</span>
                    <span class="stat-value">{{ playerStats.insights.bestKillMap.totalDeaths }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Favorite Maps -->
            <div v-if="playerStats.insights.favoriteMaps && playerStats.insights.favoriteMaps.length > 0" class="insights-subsection">
              <h4>Favorite Maps</h4>
              <div class="insights-cards">
                <div v-for="(map, index) in playerStats.insights.favoriteMaps" :key="index" class="insights-card">
                  <div class="insights-card-title">{{ map.mapName }}</div>
                  <div class="insights-card-value">{{ formatPlayTime(map.minutesPlayed) }}</div>
                </div>
              </div>
            </div>

            <!-- Activity By Hour -->
            <div v-if="playerStats.insights.activityByHour && playerStats.insights.activityByHour.length > 0" class="insights-subsection">
              <h4>Activity By Hour (Local Time)</h4>
              <div class="activity-hours-container">
                <div class="activity-hours-summary">
                  When they're typically online
                </div>
                <div class="activity-hours-chart">
                  <div v-for="(hourData, index) in sortedLocalActivityHours" :key="index" 
                       class="activity-hour-bar" 
                       :style="{ height: getActivityBarHeight(hourData.minutesActive) }">
                    <div class="activity-hour-value" v-if="hourData.minutesActive > 0">
                      {{ hourData.minutesActive }}m
                    </div>
                  </div>
                </div>
                <div class="activity-hours-labels">
                  <div v-for="(hourData, index) in sortedLocalActivityHours" :key="index" 
                       class="activity-hour-label">
                    {{ hourData.localHour.toString().padStart(2, '0') }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent sessions section -->
          <div v-if="playerStats.recentSessions.length > 0" class="stats-section">
            <h3>Recent Sessions</h3>
            <div class="recent-servers-table">
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
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(session, index) in playerStats.recentSessions" :key="index" 
                      @click="openSessionDetailsModal(session.sessionId)" 
                      class="clickable-row">
                    <td>{{ session.serverName }}</td>
                    <td>{{ session.mapName }}</td>
                    <td>{{ session.gameType }}</td>
                    <td>{{ session.totalScore }}</td>
                    <td>{{ session.totalKills }}</td>
                    <td>{{ session.totalDeaths }}</td>
                    <td>{{ calculateKDR(session.totalKills, session.totalDeaths) }}</td>
                    <td>
                      <div>{{ formatRelativeTime(session.startTime) }}</div>
                      <div class="table-secondary-text">{{ formatDate(session.startTime) }}</div>
                    </td>
                    <td>
                      <span v-if="session.isActive" class="active-session-badge">Active</span>
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

  <!-- Session Details Modal -->
  <SessionDetailsModal
    v-if="showSessionDetailsModal && selectedSessionId !== null && playerStats"
    :player-name="playerName"
    :session-id="selectedSessionId"
    :is-open="showSessionDetailsModal"
    @close="closeSessionDetailsModal"
  />
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

.combat-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.stat-badge {
  display: inline-block;
  background-color: var(--color-background-soft);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--color-text);
  transition: background-color 0.2s;
}

.stat-badge:hover {
  background-color: var(--color-background-mute);
}

/* Best Session Styles */
.best-session-container {
  grid-column: 1 / -1; /* Make it span all columns */
}

.trophy-icon {
  font-size: 1.2rem;
  margin-right: 5px;
  color: gold;
}

.best-session-card {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
  margin-top: 5px;
}

.best-session-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.best-session-score {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-heading);
  margin-right: 8px;
}

.best-session-badge {
  background-color: var(--color-background-soft);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--color-text);
}

.best-session-details {
  font-size: 0.9rem;
  color: var(--color-text);
  line-height: 1.4;
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

.active-session-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #4CAF50;
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

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: var(--color-background-mute);
}

/* Insights Styles */
.insights-period {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 15px;
}

.insights-subsection {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

.insights-subsection h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: var(--color-heading);
}

.insights-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.insights-card {
  background-color: var(--color-background);
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  flex: 1;
  max-width: calc(33.333% - 8px);
}

.insights-card-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--color-heading);
  font-size: 0.95rem;
}

.insights-card-value {
  color: var(--color-text);
  font-size: 0.9rem;
}

.best-kill-map {
  max-width: 100%;
  background-color: var(--color-background-soft);
  border-left: 4px solid var(--color-accent);
}

.insights-card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.insights-card-stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

.insights-card-stat .stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.insights-card-stat .stat-value {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--color-text);
}

.activity-hours-container {
  margin-top: 10px;
}

.activity-hours-summary {
  margin-bottom: 15px;
  font-size: 0.95rem;
  color: var(--color-text);
  line-height: 1.4;
}

.activity-hours-chart {
  display: flex;
  align-items: flex-end;
  height: 150px;
  gap: 2px;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--color-border);
}

.activity-hour-bar {
  flex: 1;
  background-color: var(--color-accent);
  border-radius: 3px 3px 0 0;
  min-height: 1px;
  position: relative;
  transition: height 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.activity-hour-value {
  position: absolute;
  top: -20px;
  font-size: 0.75rem;
  color: var(--color-text);
  white-space: nowrap;
}

.activity-hours-labels {
  display: flex;
  gap: 2px;
}

.activity-hour-label {
  flex: 1;
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  padding-top: 5px;
}

@media (max-width: 768px) {
  .player-stats-modal-content {
    width: 95%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .insights-card {
    max-width: 100%;
  }

  .activity-hours-chart {
    height: 120px;
  }

  .activity-hour-label {
    font-size: 0.7rem;
  }
}
</style>
