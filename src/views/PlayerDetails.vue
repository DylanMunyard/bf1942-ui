<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats } from '../services/playerStatsService';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Router
const router = useRouter();
const route = useRoute();

const playerName = ref(route.params.playerName as string);
const playerStats = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
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

// Chart data for player activity by hour
const activityChartData = computed(() => {
  if (!playerStats.value?.insights?.activityByHour) return { labels: [], datasets: [] };

  // Convert hours to readable labels (00:00, 01:00, etc.)
  const labels = sortedLocalActivityHours.value.map(hourData => 
    `${hourData.localHour.toString().padStart(2, '0')}:00`
  );

  // Get activity values in minutes
  const data = sortedLocalActivityHours.value.map(hourData => hourData.minutesActive);

  return {
    labels,
    datasets: [
      {
        label: 'Activity (minutes)',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderColor: 'rgba(156, 39, 176, 0.8)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: 'rgba(156, 39, 176, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        data
      }
    ]
  };
});

// Chart options for the compact player activity chart
const activityChartOptions = computed(() => {
  // Get computed styles to access CSS variables
  const computedStyles = window.getComputedStyle(document.documentElement);
  const isDarkMode = computedStyles.getPropertyValue('--color-background').trim().includes('26, 16, 37') || 
                    document.documentElement.classList.contains('dark-mode') ||
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    scales: {
      y: {
        beginAtZero: true,
        display: false,
        grid: {
          display: false
        }
      },
      x: {
        display: false,
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(35, 21, 53, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: isDarkMode ? '#ffffff' : '#ffffff',
        bodyColor: isDarkMode ? '#ffffff' : '#ffffff',
        borderColor: isDarkMode ? '#9c27b0' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 12,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 11
        },
        callbacks: {
          title: function(context: any) {
            return `${context[0].label}`;
          },
          label: function(context: any) {
            return `${context.parsed.y} minutes active`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4
      }
    }
  };
});

// Clean up event listeners when component is unmounted
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="player-details-container">
    <div class="player-stats-header">
      <div class="player-name-container">
        <router-link to="/players" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Players
        </router-link>
        <h2 class="player-name-heading">Player Statistics: {{ playerName }}</h2>
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
              :to="`/servers/${encodeURIComponent(playerStats.currentServer.serverName)}`"
              class="server-link"
            >
              {{ playerStats.currentServer.serverName }}
            </router-link>
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
            <div class="activity-chart-wrapper">
              <div class="activity-chart-container">
                <!-- Background zones for time periods -->
                <div class="time-period-zones">
                  <div class="time-zone early-zone" title="Early (00:00 - 08:00)"></div>
                  <div class="time-zone day-zone" title="Day (08:00 - 16:00)"></div>
                  <div class="time-zone night-zone" title="Night (16:00 - 24:00)"></div>
                </div>
                <Line :data="activityChartData" :options="activityChartOptions" />
              </div>
              
              <!-- Time period section labels -->
              <div class="time-period-labels">
                <div class="period-label early-label">
                  <span class="period-name">Early</span>
                  <span class="period-hours">12AM-8AM</span>
                </div>
                <div class="period-label day-label">
                  <span class="period-name">Day</span>
                  <span class="period-hours">8AM-4PM</span>
                </div>
                <div class="period-label night-label">
                  <span class="period-name">Night</span>
                  <span class="period-hours">4PM-12AM</span>
                </div>
              </div>
              
              <!-- Individual hour labels -->
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
                    <td>
                      <router-link
                        :to="`/servers/${encodeURIComponent(ranking.serverName)}/rankings`"
                        class="server-link"
                      >
                        {{ ranking.serverName }}
                      </router-link>
                    </td>
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

.player-name-heading {
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

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-background-mute);
  border-radius: 6px;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
}

.back-button:hover {
  background-color: var(--color-primary);
  color: white;
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

.activity-chart-wrapper {
  margin: 10px 0;
}

.activity-chart-container {
  height: 80px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
  border: 1px solid rgba(156, 39, 176, 0.1);
  padding: 5px;
}

/* Time period background zones */
.time-period-zones {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  pointer-events: none;
  z-index: 1;
}

.time-zone {
  flex: 1;
  transition: opacity 0.2s ease;
}

.early-zone {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.25) 0%, rgba(103, 58, 183, 0.15) 100%);
  flex: 8; /* 8 hours: 00-08 */
}

.day-zone {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.3) 0%, rgba(156, 39, 176, 0.2) 100%);
  flex: 8; /* 8 hours: 08-16 */
}

.night-zone {
  background: linear-gradient(135deg, rgba(74, 20, 140, 0.35) 0%, rgba(74, 20, 140, 0.25) 100%);
  flex: 8; /* 8 hours: 16-24 */
}

/* Time period labels */
.time-period-labels {
  display: flex;
  margin: 8px 0 5px 0;
  padding: 0 5px;
}

.period-label {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.period-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.period-hours {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

.early-label .period-name {
  color: rgba(103, 58, 183, 0.9);
}

.day-label .period-name {
  color: rgba(156, 39, 176, 0.9);
}

.night-label .period-name {
  color: rgba(74, 20, 140, 0.9);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .early-label .period-name {
    color: rgba(159, 126, 219, 0.9); /* Lighter purple for dark mode */
  }
  
  .night-label .period-name {
    color: rgba(149, 117, 205, 0.9); /* Lighter purple for dark mode */
  }
}

/* Also handle explicit dark mode class if used */
.dark-mode .early-label .period-name,
:root.dark-mode .early-label .period-name {
  color: rgba(159, 126, 219, 0.9); /* Lighter purple for dark mode */
}

.dark-mode .night-label .period-name,
:root.dark-mode .night-label .period-name {
  color: rgba(149, 117, 205, 0.9); /* Lighter purple for dark mode */
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

  .activity-chart-container {
    height: 60px;
  }

  .activity-hour-label {
    font-size: 0.7rem;
  }

  .period-name {
    font-size: 0.75rem;
  }

  .period-hours {
    font-size: 0.65rem;
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
