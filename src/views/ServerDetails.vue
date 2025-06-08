<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ServerDetails, RecentRoundInfo, fetchServerDetails } from '../services/serverDetailsService';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// State
const serverName = ref(route.params.serverName as string);
const serverDetails = ref<ServerDetails | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isChartExpanded = ref(false);

// Fetch server details
const fetchData = async (isRefreshing = false) => {
  if (!serverName.value) return;

  if (!isRefreshing) {
    isLoading.value = true;
  }
  error.value = null;

  try {
    serverDetails.value = await fetchServerDetails(serverName.value);
  } catch (err) {
    console.error('Error fetching server details:', err);
    error.value = 'Failed to load server details. Please try again later.';
  } finally {
    if (!isRefreshing) {
      isLoading.value = false;
    }
  }
};

const autoRefreshData = () => {
  fetchData(true);
};

watch(
  () => route.params.serverName,
  (newName, oldName) => {
    if (newName !== oldName) {
      serverName.value = newName as string;
      fetchData();
    }
  }
);

onMounted(() => {
  fetchData();
  setInterval(autoRefreshData, 30000); // Auto-refresh every 30 seconds
});

// Format minutes to hours and minutes
const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

// Format date to a readable format in the user's locale
const formatDate = (dateString: string): string => {
  // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');

  // Format date
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Chart data for player count
const chartData = computed(() => {
  if (!serverDetails.value?.playerCountMetrics) return { labels: [], datasets: [] };

  // Convert timestamps to readable dates
  const labels = serverDetails.value.playerCountMetrics.map(metric => {
    const date = new Date(metric.timestamp * 1000);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  });

  // Get player count values
  const data = serverDetails.value.playerCountMetrics.map(metric => metric.value);

  return {
    labels,
    datasets: [
      {
        label: 'Player Count',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderColor: 'rgba(33, 150, 243, 0.8)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        data
      }
    ]
  };
});

// Chart options - computed to handle expanded vs compact view
const chartOptions = computed(() => {
  // Get computed styles to access CSS variables
  const computedStyles = window.getComputedStyle(document.documentElement);
  const textColor = computedStyles.getPropertyValue('--color-text').trim() || '#333333';
  const textMutedColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#666666';
  const isDarkMode = computedStyles.getPropertyValue('--color-background').trim().includes('26, 16, 37') || 
                    document.documentElement.classList.contains('dark-mode') ||
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Dynamic grid color based on theme
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    scales: {
      y: {
        beginAtZero: true,
        display: isChartExpanded.value,
        grid: {
          display: isChartExpanded.value,
          color: gridColor
        },
        title: {
          display: isChartExpanded.value,
          text: 'Player Count',
          color: textColor
        },
        ticks: {
          display: isChartExpanded.value,
          color: textMutedColor
        }
      },
              x: {
          display: isChartExpanded.value,
          grid: {
            display: isChartExpanded.value,
            color: gridColor
          },
          title: {
            display: isChartExpanded.value,
            text: 'Time',
            color: textColor
          },
          ticks: {
            display: isChartExpanded.value,
            maxRotation: 45,
            minRotation: 45,
            color: textMutedColor,
            maxTicksLimit: isChartExpanded.value ? 8 : undefined,
            callback: function(tickValue: any, index: number) {
              if (!isChartExpanded.value) return '';
              const labels = chartData.value.labels;
              if (!labels || labels.length === 0) return '';
              
              // Show every nth label to reduce crowding
              const totalLabels = labels.length;
              const maxLabels = 8;
              const step = Math.ceil(totalLabels / maxLabels);
              
              if (index % step === 0 || index === totalLabels - 1) {
                // Extract just the date part for cleaner display
                const label = labels[index] as string;
                return label.split(' ')[0] + ' ' + label.split(' ')[1]; // "Dec 15"
              }
              return '';
            }
          }
        }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: isChartExpanded.value,
        backgroundColor: isDarkMode ? 'rgba(35, 21, 53, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: isDarkMode ? '#ffffff' : '#ffffff',
        bodyColor: isDarkMode ? '#ffffff' : '#ffffff',
        borderColor: isDarkMode ? '#805ad5' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        }
      }
    },
    elements: {
      point: {
        radius: isChartExpanded.value ? 0 : 0,
        hoverRadius: isChartExpanded.value ? 6 : 0
      }
    }
  };

  return baseOptions;
});



// Toggle chart expansion
const toggleChartExpansion = () => {
  isChartExpanded.value = !isChartExpanded.value;
};
</script>

<template>
  <div class="server-details-container">
    <div class="server-details-header">
      <div class="server-name-container">
        <router-link to="/servers" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Servers
        </router-link>
        <h2>Server Details: {{ serverName }}</h2>
      </div>
      <div class="modal-actions">
        <router-link
          :to="`/servers/${encodeURIComponent(serverName)}/rankings`"
          class="rankings-button"
        >
          🏆 View Rankings
        </router-link>
      </div>
    </div>
    <div class="server-details-body">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading server details...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
      </div>
      <div v-else-if="serverDetails" class="stats-container">
        <!-- Period information -->
        <div class="period-info">
          Data from {{ formatDate(serverDetails.startPeriod) }} to {{ formatDate(serverDetails.endPeriod) }}
        </div>

        <!-- Player Count Chart -->
        <div v-if="serverDetails.playerCountMetrics && serverDetails.playerCountMetrics.length > 0" class="stats-section">
          <div class="chart-header">
            <h3>Player Activity</h3>
            <button
              class="expand-chart-button"
              @click="toggleChartExpansion"
              :title="isChartExpanded ? 'Collapse chart' : 'Expand chart'"
            >
              {{ isChartExpanded ? '📉' : '📊' }}
            </button>
          </div>
                       <div
             class="chart-container"
             :class="{ 'chart-expanded': isChartExpanded }"
             @click="!isChartExpanded && toggleChartExpansion()"
           >
             <Line :data="chartData" :options="chartOptions" />
           </div>
        </div>

        <!-- Leaderboards Container -->
        <div class="leaderboards-container">
          <!-- Most Active Players -->
          <div class="leaderboard-section">
            <div class="leaderboard-header">
              <h3>🏃 Most Active Players</h3>
            </div>
            <div class="leaderboard-content">
              <div class="players-header">
                <div class="header-rank">#</div>
                <div class="header-player-info">Player</div>
                <div class="header-playtime desktop-only">Time</div>
                <div class="header-kd desktop-only">K/D</div>
              </div>
              <div class="players-list">
                <div v-for="(player, index) in serverDetails.mostActivePlayersByTime" :key="index" class="player-row">
                  <div class="player-rank">
                    <span v-if="index === 0" class="rank-medal">🥇</span>
                    <span v-else-if="index === 1" class="rank-medal">🥈</span>
                    <span v-else-if="index === 2" class="rank-medal">🥉</span>
                    <span v-else class="rank-number">{{ index + 1 }}</span>
                  </div>
                  <div class="player-info">
                    <div class="player-name">
                      <router-link :to="`/player/${encodeURIComponent(player.playerName)}`" class="player-link">
                        {{ player.playerName }}
                      </router-link>
                    </div>
                    <div class="player-details mobile-only">
                      <span class="detail-item">{{ formatPlayTime(player.minutesPlayed) }}</span>
                      <span class="detail-separator">•</span>
                      <span class="detail-item">
                        <span class="kills">{{ player.totalKills }}</span>/<span class="deaths">{{ player.totalDeaths }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="player-playtime desktop-only">{{ formatPlayTime(player.minutesPlayed) }}</div>
                  <div class="player-kd desktop-only">
                    <span class="kills">{{ player.totalKills }}</span>
                    <span class="separator">/</span>
                    <span class="deaths">{{ player.totalDeaths }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Scores -->
          <div class="leaderboard-section">
            <div class="leaderboard-header">
              <h3>🏆 Top Scores</h3>
            </div>
            <div class="leaderboard-content">
              <div class="scores-header">
                <div class="header-rank">#</div>
                <div class="header-player-info">Player</div>
                <div class="header-score desktop-only">Score</div>
                <div class="header-kd desktop-only">K/D</div>
                <div class="header-map desktop-only">Map</div>
              </div>
              <div class="scores-list">
                <div v-for="(score, index) in serverDetails.topScores" :key="index" class="score-row">
                  <div class="score-rank">
                    <span v-if="index === 0" class="rank-medal">🥇</span>
                    <span v-else-if="index === 1" class="rank-medal">🥈</span>
                    <span v-else-if="index === 2" class="rank-medal">🥉</span>
                    <span v-else class="rank-number">{{ index + 1 }}</span>
                  </div>
                  <div class="player-info">
                    <div class="score-name">
                      <router-link :to="`/player/${encodeURIComponent(score.playerName)}`" class="player-link">
                        {{ score.playerName }}
                      </router-link>
                    </div>
                    <div class="score-details mobile-only">
                      <span class="detail-item">
                        <router-link
                          :to="{
                            path: '/servers/round-report',
                            query: {
                              serverGuid: serverDetails.serverGuid,
                              mapName: score.mapName,
                              startTime: score.timestamp
                            }
                          }"
                          class="session-link"
                        >
                          {{ score.score.toLocaleString() }}
                        </router-link>
                      </span>
                      <span class="detail-separator">•</span>
                      <span class="detail-item">
                        <span class="kills">{{ score.kills }}</span>/<span class="deaths">{{ score.deaths }}</span>
                      </span>
                      <span class="detail-separator">•</span>
                      <span class="detail-item">{{ score.mapName }}</span>
                    </div>
                  </div>
                  <div class="score-value desktop-only">
                    <router-link
                      :to="{
                        path: '/servers/round-report',
                        query: {
                          serverGuid: serverDetails.serverGuid,
                          mapName: score.mapName,
                          startTime: score.timestamp
                        }
                      }"
                      class="session-link"
                    >
                      {{ score.score.toLocaleString() }}
                    </router-link>
                  </div>
                  <div class="score-kd desktop-only">
                    <span class="kills">{{ score.kills }}</span>
                    <span class="separator">/</span>
                    <span class="deaths">{{ score.deaths }}</span>
                  </div>
                  <div class="score-map desktop-only">{{ score.mapName }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Rounds -->
          <div v-if="serverDetails.lastRounds && serverDetails.lastRounds.length > 0" class="leaderboard-section recent-rounds-section">
            <div class="leaderboard-header">
              <h3>🎮 Recent Rounds</h3>
            </div>
            <div class="leaderboard-content">
              <div class="rounds-header">
                <div class="header-round-info">Round</div>
                <div class="header-end-time desktop-only">End Time</div>
                <div class="header-report desktop-only">Report</div>
              </div>
              <div class="rounds-list">
                <div v-for="(round, index) in serverDetails.lastRounds" :key="index" class="round-row">
                  <div class="round-info">
                    <div class="round-map">
                      {{ round.mapName }}
                    </div>
                    <div class="round-details mobile-only">
                      <span class="detail-item">
                        <span v-if="round.isActive && index === 0" class="badge-active">Live</span>
                        <span v-else>{{ formatDate(round.endTime) }}</span>
                      </span>
                      <span class="detail-separator">•</span>
                      <span class="detail-item">
                        <router-link
                          :to="{
                            path: '/servers/round-report',
                            query: {
                              serverGuid: serverDetails.serverGuid,
                              mapName: round.mapName,
                              startTime: round.startTime
                            }
                          }"
                          class="report-link-inline"
                        >
                          View Report
                        </router-link>
                      </span>
                    </div>
                  </div>
                  <div class="round-end-time desktop-only">
                    <span v-if="round.isActive && index === 0" class="badge-active">Live</span>
                    <span v-else>{{ formatDate(round.endTime) }}</span>
                  </div>
                  <div class="round-report desktop-only">
                    <router-link
                      :to="{
                        path: '/servers/round-report',
                        query: {
                          serverGuid: serverDetails.serverGuid,
                          mapName: round.mapName,
                          startTime: round.startTime
                        }
                      }"
                      class="report-link"
                    >
                      View Report
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data-container">
        <p>No server details available.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-details-container {
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 12px;
}

.server-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;
}

.server-name-container {
  display: flex;
  align-items: center;
  gap: 10px;
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

.server-details-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.rankings-button {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  transition: background-color 0.2s;
}

.rankings-button:hover {
  background-color: var(--color-primary-hover);
}

.server-details-body {
  padding: 0;
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
  gap: 12px;
}

.period-info {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.stats-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 12px;
}

.stats-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: none;
  padding-bottom: 0;
}

.expand-chart-button {
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  color: var(--color-text);
}

.expand-chart-button:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
}

.chart-container {
  height: 80px;
  margin-bottom: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
}

.chart-container:hover:not(.chart-expanded) {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 100%);
}

.chart-container.chart-expanded {
  height: 400px;
  cursor: default;
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  background: var(--color-background);
}



/* Leaderboards Container */
.leaderboards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

/* Leaderboard Section */
.leaderboard-section {
  padding: 8px 0;
}

.leaderboard-header {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.leaderboard-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.2rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.leaderboard-content {
  overflow: hidden;
}

/* Header cell alignment */
.header-rank, .header-score {
  text-align: center;
}

.header-playtime, .header-kd, .header-map {
  text-align: center;
}

.header-map, .header-player-info, .header-round-info {
  text-align: left;
}

.header-end-time, .header-report {
  text-align: center;
}

.players-header {
  grid-template-columns: 50px 1fr 120px 80px;
  gap: 10px;
}

.scores-header {
  grid-template-columns: 50px 1fr 100px 80px 100px;
  gap: 10px;
}

.rounds-header {
  grid-template-columns: 1fr 180px 120px;
  gap: 10px;
}

/* Show/hide classes for responsive design */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* Players List */
.players-list, .scores-list, .rounds-list {
  max-height: none;
  overflow-y: auto;
}

.player-row, .score-row, .round-row {
  display: grid;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s ease;
  align-items: center;
}

.player-row {
  grid-template-columns: 50px 1fr 120px 80px;
}

.score-row {
  grid-template-columns: 50px 1fr 100px 80px 100px;
}

.round-row {
  grid-template-columns: 1fr 180px 120px;
}

.player-row:hover, .score-row:hover, .round-row:hover {
  background: var(--color-background-soft);
}

.player-row:last-child, .score-row:last-child, .round-row:last-child {
  border-bottom: none;
}

/* Player Info Container */
.player-info, .round-info {
  min-width: 0;
  overflow: hidden;
}

.player-name, .score-name, .round-map {
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

/* Mobile condensed details */
.player-details, .score-details, .round-details {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.detail-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.detail-separator {
  color: var(--color-text-muted);
  font-weight: normal;
  opacity: 0.6;
}

.report-link-inline {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.85rem;
}

.report-link-inline:hover {
  text-decoration: underline;
}

/* Rank Styling */
.player-rank, .score-rank {
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
}

.rank-medal {
  font-size: 1.2rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.rank-number {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-background-mute);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* Link styles */
.player-link, .report-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-link:hover, .report-link:hover {
  text-decoration: underline;
  color: var(--color-primary-hover, var(--color-primary));
}

.report-link {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--color-background-mute);
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.report-link:hover {
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge-active {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  background-color: #4caf50;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  vertical-align: middle;
  line-height: 1;
}

/* Base mobile improvements */
.server-details-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .leaderboards-container {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 10px;
  }
  
  .server-details-container {
    padding: 8px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .server-details-container {
    padding: 4px;
  }

  .server-details-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    padding: 8px 0;
    margin-bottom: 8px;
  }

  .server-name-container {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .server-name-container h2 {
    font-size: 1.3rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .modal-actions {
    width: 100%;
    justify-content: center;
  }

  .rankings-button {
    width: 100%;
    text-align: center;
    padding: 10px 16px;
  }

  .back-button {
    width: fit-content;
    padding: 8px 12px;
  }

  .leaderboards-container {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .leaderboard-section {
    padding: 8px 0;
    margin: 0;
  }

  .leaderboard-header {
    margin-bottom: 8px;
    padding: 0 0 8px 0;
  }

  .leaderboard-content {
    overflow: hidden;
  }

  /* Show/hide content for mobile */
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
  }

  .players-header, .scores-header, .rounds-header {
    padding: 8px 10px;
    font-size: 0.75rem;
  }

  .players-header {
    grid-template-columns: 50px 1fr;
    gap: 10px;
  }

  .scores-header {
    grid-template-columns: 50px 1fr;
    gap: 10px;
  }

  .rounds-header {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .player-row, .score-row, .round-row {
    padding: 12px 10px;
    font-size: 0.9rem;
  }

  .player-row {
    grid-template-columns: 50px 1fr;
    gap: 10px;
  }

  .score-row {
    grid-template-columns: 50px 1fr;
    gap: 10px;
  }

  .round-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .rank-number {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }

  .rank-medal {
    font-size: 1.1rem;
  }

  .leaderboard-header h3 {
    font-size: 1.1rem;
    margin: 0;
  }

  .chart-container {
    height: 60px;
    margin: 0;
  }

  .chart-container.chart-expanded {
    height: 280px;
  }

  .expand-chart-button {
    padding: 6px 10px;
    font-size: 1rem;
  }

  .period-info {
    font-size: 0.85rem;
    text-align: center;
    padding: 6px;
    margin: 0 0 8px 0;
    background: var(--color-background-soft);
    border-radius: 6px;
  }

  .stats-container {
    gap: 8px;
  }

  .stats-section {
    padding: 8px 0;
    margin: 0;
  }

  /* Mobile specific details styling */
  .player-details, .score-details, .round-details {
    font-size: 0.8rem;
    margin-top: 6px;
    line-height: 1.3;
  }

  .detail-item {
    white-space: nowrap;
  }

  .badge-active {
    margin-left: 0;
    font-size: 0.6rem;
    padding: 1px 4px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .server-details-container {
    padding: 4px;
  }

  .server-details-header {
    gap: 6px;
    padding: 6px 0;
    margin-bottom: 6px;
  }

  .server-name-container h2 {
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .back-button {
    padding: 6px 10px;
    font-size: 0.9rem;
  }

  .rankings-button {
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .leaderboard-section {
    padding: 6px 0;
  }

  .leaderboard-header {
    margin-bottom: 6px;
    padding: 0 0 6px 0;
  }

  .leaderboard-header h3 {
    font-size: 1rem;
  }

  .players-header, .scores-header, .rounds-header {
    padding: 6px 8px;
    font-size: 0.7rem;
  }

  .players-header {
    grid-template-columns: 45px 1fr;
    gap: 8px;
  }

  .scores-header {
    grid-template-columns: 45px 1fr;
    gap: 8px;
  }

  .rounds-header {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .player-row, .score-row, .round-row {
    padding: 10px 8px;
    font-size: 0.85rem;
  }

  .player-row {
    grid-template-columns: 45px 1fr;
    gap: 8px;
  }

  .score-row {
    grid-template-columns: 45px 1fr;
    gap: 8px;
  }

  .round-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .rank-number {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .rank-medal {
    font-size: 0.95rem;
  }

  .player-details, .score-details, .round-details {
    font-size: 0.75rem;
    margin-top: 4px;
    gap: 3px;
  }

  .detail-item {
    font-size: 0.75rem;
  }

  .chart-container {
    height: 50px;
    margin: 0;
  }

  .chart-container.chart-expanded {
    height: 250px;
  }

  .expand-chart-button {
    padding: 5px 8px;
    font-size: 0.9rem;
  }

  .period-info {
    margin: 0 0 6px 0;
    padding: 4px;
  }

  .stats-container {
    gap: 6px;
  }

  .stats-section {
    padding: 6px 0;
  }

  .badge-active {
    padding: 1px 3px;
    font-size: 0.55rem;
  }

  .report-link-inline {
    font-size: 0.75rem;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .server-details-container {
    padding: 2px;
  }

  .server-details-header {
    padding: 4px 0;
  }

  .server-name-container h2 {
    font-size: 1.1rem;
  }

  .players-header {
    grid-template-columns: 40px 1fr;
    gap: 6px;
  }

  .scores-header {
    grid-template-columns: 40px 1fr;
    gap: 6px;
  }

  .rounds-header {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .player-row {
    grid-template-columns: 40px 1fr;
    gap: 6px;
  }

  .score-row {
    grid-template-columns: 40px 1fr;
    gap: 6px;
  }

  .round-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .rank-number {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }

  .rank-medal {
    font-size: 0.85rem;
  }

  .player-details, .score-details, .round-details {
    font-size: 0.7rem;
    gap: 2px;
  }

  .detail-item {
    font-size: 0.7rem;
  }

  .stats-container {
  }

  .period-info {
    margin: 0 0 4px 0;
  }

  .badge-active {
    padding: 1px 2px;
    font-size: 0.5rem;
  }

  .report-link-inline {
    font-size: 0.7rem;
  }
}

/* Players Header */
.players-header, .scores-header, .rounds-header {
  display: grid;
  padding: 12px 15px;
  background: var(--color-background-mute);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}

.player-playtime, .score-value, .score-map {
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
}

/* Round row styling */
.round-end-time {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: center;
}

.round-report {
  text-align: center;
}

.score-value {
  font-weight: 600;
  color: var(--color-primary);
}

/* K/D Styling */
.player-kd, .score-kd {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.9rem;
}

.kills {
  color: #4caf50;
  font-weight: 600;
}

.separator {
  color: var(--color-text-muted);
  font-weight: 400;
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

/* Link styles */
.player-link, .report-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-link:hover, .report-link:hover {
  text-decoration: underline;
  color: var(--color-primary-hover, var(--color-primary));
}

.report-link {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--color-background-mute);
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.report-link:hover {
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge-active {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  background-color: #4caf50;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  vertical-align: middle;
  line-height: 1;
}
</style>
