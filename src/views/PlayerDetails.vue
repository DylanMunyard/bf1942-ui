<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats } from '../services/playerStatsService';
import axios from 'axios';

// Router
const router = useRouter();
const route = useRoute();

const playerName = ref(route.params.playerName as string);
const playerStats = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const servers = ref<any[]>([]);

const fetchServersData = async () => {
  try {
    const apiUrl = 'https://api.bflist.io/bf1942/v1/servers/1?perPage=100';
    const response = await axios.get(apiUrl);
    servers.value = response.data;
  } catch (err) {
    console.error('Error fetching servers data:', err);
  }
};

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  await fetchServersData();
  try {
    playerStats.value = await fetchPlayerStats(playerName.value);
  } catch (err) {
    error.value = `Failed to fetch player stats for ${playerName.value}.`;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// Function to open the round report page
const openSessionDetailsModal = (serverGuid: string, mapName: string, startTime: string, event?: Event) => {
  // Prevent event propagation to stop the modal from closing
  if (event) {
    event.stopPropagation();
  }

  // Navigate to the round report page with the required parameters
  router.push({
    path: '/servers/round-report',
    query: {
      serverGuid,
      mapName,
      startTime
    }
  });
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
  if (!servers.value || !serverGuid) return null;

  const server = servers.value.find(s => s.guid === serverGuid);
  return server ? server.numPlayers : null;
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Function to get round report route for a session
const getRoundReportRoute = (session: any) => {
  if (session.serverGuid) {
    return {
      path: '/servers/round-report',
      query: {
        serverGuid: session.serverGuid,
        mapName: session.mapName,
        startTime: session.startTime
      }
    };
  }
  
  // Fallback to player details if serverGuid not found
  return `/player/${encodeURIComponent(playerName.value)}`;
};

// Computed property to sort server play times by minutes played (descending)
const sortedServerPlayTimes = computed(() => {
  if (!playerStats.value?.insights?.serverPlayTimes) return [];
  return [...playerStats.value.insights.serverPlayTimes].sort((a, b) => b.minutesPlayed - a.minutesPlayed);
});

// Computed property to sort activity hours chronologically by local hour (0-23)
const sortedLocalActivityHours = computed(() => {
  if (!playerStats.value?.insights?.activityByHour) return [];

  // Create a new array with local hour information
  const hoursWithLocalTime = playerStats.value.insights.activityByHour.map(hourData => ({
    ...hourData,
    localHour: convertToLocalHour(hourData.hour)
  }));

  // Sort by local hour (0-23)
  return [...hoursWithLocalTime].sort((a, b) => a.localHour - b.localHour);
});

// State for favorite maps sorting
const favoriteMapsSortField = ref('kdRatio');
const favoriteMapsSortDirection = ref('desc');

// Function to change sort field and direction
const changeFavoriteMapsSort = (field: string) => {
  if (favoriteMapsSortField.value === field) {
    // Toggle direction if clicking the same field
    favoriteMapsSortDirection.value = favoriteMapsSortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new field and default to descending
    favoriteMapsSortField.value = field;
    favoriteMapsSortDirection.value = 'desc';
  }
};

// Computed property to sort favorite maps
const sortedFavoriteMaps = computed(() => {
  if (!playerStats.value?.insights?.favoriteMaps) return [];

  return [...playerStats.value.insights.favoriteMaps].sort((a, b) => {
    const direction = favoriteMapsSortDirection.value === 'asc' ? 1 : -1;

    switch (favoriteMapsSortField.value) {
      case 'mapName':
        return direction * a.mapName.localeCompare(b.mapName);
      case 'minutesPlayed':
        return direction * (a.minutesPlayed - b.minutesPlayed);
      case 'kdRatio':
        return direction * (a.kdRatio - b.kdRatio);
      case 'totalKills':
        return direction * (a.totalKills - b.totalKills);
      case 'totalDeaths':
        return direction * (a.totalDeaths - b.totalDeaths);
      default:
        return direction * (a.kdRatio - b.kdRatio);
    }
  });
});

// Function to convert UTC hour to local hour
const convertToLocalHour = (utcHour: number): number => {
  const now = new Date();
  const localDate = new Date(now.setUTCHours(utcHour, 0, 0, 0));
  return localDate.getHours();
};

// Function to calculate the height of each bar in the activity chart
const getActivityBarHeight = (minutesActive: number): string => {
  if (!playerStats.value?.insights?.activityByHour) return "0%";

  // Find the maximum minutes active
  const maxMinutes = Math.max(...playerStats.value.insights.activityByHour.map(hour => hour.minutesActive));

  if (maxMinutes === 0) return "0%";

  // Calculate the percentage height (minimum 5% for visibility if there's any activity)
  const percentage = (minutesActive / maxMinutes) * 100;
  return minutesActive > 0 ? `${Math.max(5, percentage)}%` : "0%";
};

// Clean up event listeners when component is unmounted
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="player-details-container">
    <div class="player-stats-header">
      <div class="player-name-container">
        <h2>Player Statistics: {{ playerName }}</h2>
        <span v-if="playerStats && playerStats.isActive" class="status-badge active">Active</span>
      </div>
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
            <router-link
              :to="`/servers/${encodeURIComponent(playerStats.currentServer.serverName)}/rankings`"
              class="server-link"
            >
              {{ playerStats.currentServer.serverName }}
            </router-link>
            <span v-if="getServerPlayerCount(playerStats.currentServer.serverGuid)" class="player-count">
              ({{ getServerPlayerCount(playerStats.currentServer.serverGuid) }} players online)
            </span>
            <span v-if="playerStats.currentServer.gameId" class="game-id">
              Game: {{ playerStats.currentServer.gameId }}
            </span>
          </div>
          <div v-if="playerStats.currentServer.sessionKills !== undefined && playerStats.currentServer.sessionDeaths !== undefined" class="session-stats">
            Session: {{ playerStats.currentServer.sessionKills }} 🔫 / {{ playerStats.currentServer.sessionDeaths }} 💀
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
                  <span class="stat-badge">🔫 {{ playerStats.totalKills }}</span>
                  <span class="stat-badge">💀 {{ playerStats.totalDeaths }}</span>
                  <span class="stat-badge">KDR: {{ calculateKDR(playerStats.totalKills, playerStats.totalDeaths) }}</span>
                </div>
              </div>
            </div>
            <div class="stat-item best-session-container" v-if="playerStats.bestSession">
              <div class="stat-label">
                <span class="trophy-icon">🏆</span> Best Session
              </div>
              <div 
                class="best-session-card clickable-best-session" 
                @click="openSessionDetailsModal(playerStats.bestSession.serverGuid, playerStats.bestSession.mapName, playerStats.bestSession.startTime)"
                title="Click to view round report"
              >
                <div class="best-session-header">
                  <div class="best-session-score">{{ playerStats.bestSession.totalScore }}</div>
                  <span class="best-session-badge">
                    KDR: {{ calculateKDR(playerStats.bestSession.totalKills, playerStats.bestSession.totalDeaths) }}
                  </span>
                  <span class="best-session-badge">
                    🔫 {{ playerStats.bestSession.totalKills }}
                  </span>
                  <span class="best-session-badge">
                    💀 {{ playerStats.bestSession.totalDeaths }}
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

          <!-- Activity By Hour -->
          <div v-if="playerStats.insights && playerStats.insights.activityByHour && playerStats.insights.activityByHour.length > 0" class="online-times-section">
            <h4>When they're typically online (Local Time)</h4>
            <div class="activity-hours-container">
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

        <!-- Insights section -->
        <div v-if="playerStats.insights" class="stats-section">
          <h3>Player Insights</h3>
          <div class="insights-period">
            Data from {{ formatDate(playerStats.insights.startPeriod) }} to {{ formatDate(playerStats.insights.endPeriod) }}
          </div>

          <!-- Server Rankings -->
          <div v-if="playerStats.insights?.serverRankings && playerStats.insights.serverRankings.length > 0" class="insights-subsection">
            <h4>Server Rankings</h4>
            <div class="server-rankings-table">
              <table>
                <thead>
                  <tr>
                    <th>Server Name</th>
                    <th>Rank</th>
                    <th>Score</th>
                    <th>Ping</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(ranking, index) in playerStats.insights.serverRankings" :key="index">
                    <td>{{ ranking.serverName }}</td>
                    <td>{{ ranking.rankDisplay }}</td>
                    <td>{{ ranking.scoreDisplay }}</td>
                    <td>
                      <span class="player-ping" :class="{
                        'ping-good': ranking.averagePing < 50,
                        'ping-ok': ranking.averagePing >= 50 && ranking.averagePing < 100,
                        'ping-bad': ranking.averagePing >= 100
                      }">
                        {{ ranking.averagePing }}ms
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Favorite Maps -->
          <div v-if="playerStats.insights.favoriteMaps && playerStats.insights.favoriteMaps.length > 0" class="insights-subsection">
            <h4>Favorite Maps</h4>
            <div class="favorite-maps-table">
              <table>
                <thead>
                  <tr>
                    <th @click="changeFavoriteMapsSort('mapName')" class="sortable-header">
                      Map Name
                      <span v-if="favoriteMapsSortField === 'mapName'" class="sort-indicator">
                        {{ favoriteMapsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="changeFavoriteMapsSort('minutesPlayed')" class="sortable-header">
                      Play Time
                      <span v-if="favoriteMapsSortField === 'minutesPlayed'" class="sort-indicator">
                        {{ favoriteMapsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="changeFavoriteMapsSort('kdRatio')" class="sortable-header">
                      K/D Ratio
                      <span v-if="favoriteMapsSortField === 'kdRatio'" class="sort-indicator">
                        {{ favoriteMapsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="changeFavoriteMapsSort('totalKills')" class="sortable-header">
                      🔫
                      <span v-if="favoriteMapsSortField === 'totalKills'" class="sort-indicator">
                        {{ favoriteMapsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th @click="changeFavoriteMapsSort('totalDeaths')" class="sortable-header">
                      💀
                      <span v-if="favoriteMapsSortField === 'totalDeaths'" class="sort-indicator">
                        {{ favoriteMapsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(map, index) in sortedFavoriteMaps" :key="index">
                    <td>{{ map.mapName }}</td>
                    <td>{{ formatPlayTime(map.minutesPlayed) }}</td>
                    <td>{{ map.kdRatio.toFixed(2) }}</td>
                    <td>{{ map.totalKills }}</td>
                    <td>{{ map.totalDeaths }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- Recent sessions section -->
        <div v-if="playerStats.recentSessions.length > 0" class="stats-section">
          <div class="section-header-with-action">
            <h3>Recent Sessions</h3>
            <router-link :to="`/players/${encodeURIComponent(playerName)}/sessions`" class="view-all-button">
              View All Sessions
            </router-link>
          </div>
          <div class="recent-servers-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Server Name</th>
                  <th>Map</th>
                  <th>Game Type</th>
                  <th>Score</th>
                  <th>🔫</th>
                  <th>💀</th>
                  <th>K/D</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(session, index) in playerStats.recentSessions" :key="index" 
                    @click="(event) => openSessionDetailsModal(session.serverGuid, session.mapName, session.startTime, event)" 
                    class="clickable-row">
                  <td>
                    <router-link 
                      :to="getRoundReportRoute(session)" 
                      class="time-link"
                      style="color: #1a73e8; text-decoration: underline;"
                    >
                      <div>{{ formatRelativeTime(session.startTime) }}</div>
                      <div class="table-secondary-text">{{ formatDate(session.startTime) }}</div>
                    </router-link>
                  </td>
                  <td>{{ session.serverName }}</td>
                  <td>{{ session.mapName }}</td>
                  <td>{{ session.gameType }}</td>
                  <td>{{ session.totalScore }}</td>
                  <td>{{ session.totalKills }}</td>
                  <td>{{ session.totalDeaths }}</td>
                  <td>{{ calculateKDR(session.totalKills, session.totalDeaths) }}</td>
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
</template>

<style scoped>
.player-details-container {
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 20px;
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

.player-stats-body {
  padding-top: 20px;
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

.section-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.section-header-with-action h3 {
  margin: 0;
  padding: 0;
  border-bottom: none;
}

.view-all-button {
  padding: 5px 10px;
  background-color: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 4px;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background-color 0.2s;
}

.view-all-button:hover {
  background-color: var(--color-accent);
  color: white;
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

.clickable-best-session {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-best-session:hover {
  background-color: var(--color-background-soft);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  border-color: var(--color-primary);
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

.online-times-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

.online-times-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: var(--color-heading);
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
  height: 100px;
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

/* Favorite Maps Table Styles */
.favorite-maps-table {
  overflow-x: auto;
  margin-top: 10px;
}

.sortable-header {
  cursor: pointer;
  position: relative;
  user-select: none;
  transition: background-color 0.2s;
}

.sortable-header:hover {
  background-color: var(--color-background);
}

.sort-indicator {
  margin-left: 5px;
  font-size: 0.8rem;
  display: inline-block;
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
    height: 80px;
  }

  .activity-hour-label {
    font-size: 0.7rem;
  }
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

.player-ping {
  text-align: center;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 6px;
  border-radius: 4px;
}

.ping-good {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.ping-ok {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.ping-bad {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}
</style>
