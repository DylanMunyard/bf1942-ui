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
const game = ref(route.params.game as string);
const serverDetails = ref<ServerDetails | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isChartExpanded = ref(false);

// Fetch server details
const fetchData = async () => {
  if (!serverName.value || !game.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    serverDetails.value = await fetchServerDetails(serverName.value, game.value);
  } catch (err) {
    console.error('Error fetching server details:', err);
    error.value = 'Failed to load server details. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

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
          color: 'rgba(0, 0, 0, 0.1)'
        },
        title: {
          display: isChartExpanded.value,
          text: 'Player Count',
          color: 'var(--color-text)'
        },
        ticks: {
          display: isChartExpanded.value,
          color: 'var(--color-text-muted)'
        }
      },
              x: {
          display: isChartExpanded.value,
          grid: {
            display: isChartExpanded.value,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: isChartExpanded.value,
            text: 'Time',
            color: 'var(--color-text)'
          },
          ticks: {
            display: isChartExpanded.value,
            maxRotation: 45,
            minRotation: 45,
            color: 'var(--color-text-muted)',
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#666666',
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

// Analyze player count data to determine activity levels
const activityAnalysis = computed(() => {
  if (!serverDetails.value?.playerCountMetrics || serverDetails.value.playerCountMetrics.length === 0) {
    return { zones: [], labels: [], timeRanges: [] };
  }

  const metrics = serverDetails.value.playerCountMetrics;
  
  // Calculate average player count for each time period
  const averages = [];
  const chunkSize = Math.ceil(metrics.length / 3);
  
  for (let i = 0; i < 3; i++) {
    const chunk = metrics.slice(i * chunkSize, (i + 1) * chunkSize);
    const average = chunk.reduce((sum, metric) => sum + metric.value, 0) / chunk.length;
    averages.push({ index: i, average });
  }
  
  // Sort by average player count
  averages.sort((a, b) => b.average - a.average);
  
  // Fixed time ranges for the thirds
  const timeRanges = ['Midnight - 8am', '8am - 4pm', '4pm - Late'];
  
  // Assign labels based on activity level
  const labels = ['', '', ''];
  const zones = ['', '', ''];
  
  labels[averages[0].index] = 'Busiest';
  labels[averages[1].index] = 'Busy';
  labels[averages[2].index] = 'Quietest';
  
  zones[averages[0].index] = 'busiest-zone';
  zones[averages[1].index] = 'busy-zone';
  zones[averages[2].index] = 'quietest-zone';
  
  return { zones, labels, timeRanges };
});

// Toggle chart expansion
const toggleChartExpansion = () => {
  isChartExpanded.value = !isChartExpanded.value;
};

// Clean up event listeners when component is unmounted
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="server-details-container">
    <div class="server-details-header">
      <div class="server-name-container">
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
                             <!-- Activity zone backgrounds for collapsed view -->
              <div v-if="!isChartExpanded && activityAnalysis.zones.length > 0" class="activity-zones">
                <div
                  v-for="(zone, index) in activityAnalysis.zones"
                  :key="index"
                  class="activity-zone"
                  :class="zone"
                  :title="`${activityAnalysis.labels[index]} - ${activityAnalysis.timeRanges[index]}`"
                >
                  <div class="time-range-label">{{ activityAnalysis.timeRanges[index] }}</div>
                </div>
              </div>

             <Line :data="chartData" :options="chartOptions" />
           </div>

           <!-- Activity level legend for collapsed view -->
           <div v-if="!isChartExpanded && activityAnalysis.labels.length > 0" class="activity-legend">
             <div class="legend-item">
               <div class="legend-color busiest-color"></div>
               <span>Busiest</span>
             </div>
             <div class="legend-item">
               <div class="legend-color busy-color"></div>
               <span>Busy</span>
             </div>
             <div class="legend-item">
               <div class="legend-color quietest-color"></div>
               <span>Quietest</span>
             </div>
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
                <div class="header-name">Player</div>
                <div class="header-playtime">Time</div>
                <div class="header-kd">K/D</div>
              </div>
              <div class="players-list">
                <div v-for="(player, index) in serverDetails.mostActivePlayersByTime" :key="index" class="player-row">
                  <div class="player-rank">
                    <span v-if="index === 0" class="rank-medal">🥇</span>
                    <span v-else-if="index === 1" class="rank-medal">🥈</span>
                    <span v-else-if="index === 2" class="rank-medal">🥉</span>
                    <span v-else class="rank-number">{{ index + 1 }}</span>
                  </div>
                  <div class="player-name">
                    <router-link :to="`/player/${encodeURIComponent(player.playerName)}`" class="player-link">
                      {{ player.playerName }}
                    </router-link>
                  </div>
                  <div class="player-playtime">{{ formatPlayTime(player.minutesPlayed) }}</div>
                  <div class="player-kd">
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
                <div class="header-name">Player</div>
                <div class="header-score">Score</div>
                <div class="header-kd">K/D</div>
                <div class="header-map">Map</div>
              </div>
              <div class="scores-list">
                <div v-for="(score, index) in serverDetails.topScores" :key="index" class="score-row">
                  <div class="score-rank">
                    <span v-if="index === 0" class="rank-medal">🥇</span>
                    <span v-else-if="index === 1" class="rank-medal">🥈</span>
                    <span v-else-if="index === 2" class="rank-medal">🥉</span>
                    <span v-else class="rank-number">{{ index + 1 }}</span>
                  </div>
                  <div class="score-name">
                    <router-link :to="`/player/${encodeURIComponent(score.playerName)}`" class="player-link">
                      {{ score.playerName }}
                    </router-link>
                  </div>
                  <div class="score-value">
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
                  <div class="score-kd">
                    <span class="kills">{{ score.kills }}</span>
                    <span class="separator">/</span>
                    <span class="deaths">{{ score.deaths }}</span>
                  </div>
                  <div class="score-map">{{ score.mapName }}</div>
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
                <div class="header-map">Map</div>
                <div class="header-end-time">End Time</div>
                <div class="header-report">Report</div>
              </div>
              <div class="rounds-list">
                <div v-for="(round, index) in serverDetails.lastRounds" :key="index" class="round-row">
                  <div class="round-map">
                    {{ round.mapName }}
                  </div>
                  <div class="round-end-time">
                    <span v-if="round.isActive && index === 0" class="badge-active">In Progress</span>
                    <span v-else>{{ formatDate(round.endTime) }}</span>
                  </div>
                  <div class="round-report">
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
  padding: 20px;
}

.server-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.server-name-container {
  display: flex;
  align-items: center;
  gap: 10px;
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
  gap: 20px;
}

.period-info {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 10px;
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
  margin-bottom: 20px;
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

/* Activity zones background for collapsed view */
.activity-zones {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 1;
  pointer-events: none;
}

.activity-zone {
  flex: 1;
  transition: all 0.2s ease;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.activity-zone:last-child {
  border-right: none;
}

.busiest-zone {
  background: linear-gradient(to right, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.15));
  border-right-color: rgba(34, 197, 94, 0.1);
}

.busy-zone {
  background: linear-gradient(to right, rgba(251, 191, 36, 0.08), rgba(251, 191, 36, 0.15));
  border-right-color: rgba(251, 191, 36, 0.1);
}

.quietest-zone {
  background: linear-gradient(to right, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.15));
  border-right-color: rgba(239, 68, 68, 0.1);
}

.chart-container:hover .activity-zones .activity-zone {
  opacity: 0.8;
}

/* Time range labels on activity zones */
.activity-zone {
  position: relative;
}

.time-range-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  opacity: 0.8;
  transition: all 0.2s ease;
  z-index: 2;
}

.activity-zone:hover .time-range-label {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.05);
}

/* Activity level legend */
.activity-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 8px;
  padding: 8px;
  font-size: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.busiest-color {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(34, 197, 94, 0.6));
}

.busy-color {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(251, 191, 36, 0.6));
}

.quietest-color {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.6));
}

/* Leaderboards Container */
.leaderboards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

/* Leaderboard Section */
.leaderboard-section {
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.leaderboard-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.leaderboard-header {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

.leaderboard-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.2rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.leaderboard-content {
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
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

/* Header cell alignment */
.header-rank, .header-score {
  text-align: center;
}

.header-playtime, .header-kd, .header-map {
  text-align: center;
}

.header-map {
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

/* Players List */
.players-list, .scores-list, .rounds-list {
  max-height: 350px;
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

/* Player Name */
.player-name, .score-name {
  font-weight: 500;
  color: var(--color-text);
  min-width: 0;
  overflow: hidden;
}

.player-playtime, .score-value, .score-map {
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
}

/* Round row styling */
.round-map {
  font-weight: 600;
  color: var(--color-text);
}

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
  margin-left: 8px;
  padding: 3px 8px;
  border-radius: 12px;
  background-color: #4caf50;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  vertical-align: middle;
}

@media (max-width: 768px) {
  .server-details-container {
    width: 95%;
  }

  .leaderboards-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .leaderboard-section {
    padding: 15px;
  }

  .players-header, .scores-header {
    padding: 10px 12px;
    font-size: 0.75rem;
  }

  .players-header {
    grid-template-columns: 40px 1fr 100px 70px;
    gap: 8px;
  }

  .scores-header {
    grid-template-columns: 40px 1fr 80px 70px 80px;
    gap: 8px;
  }

  .rounds-header {
    grid-template-columns: 1fr 120px 80px;
    gap: 6px;
  }

  .player-row, .score-row {
    padding: 10px 12px;
    font-size: 0.85rem;
  }

  .player-row {
    grid-template-columns: 40px 1fr 100px 70px;
    gap: 8px;
  }

  .score-row {
    grid-template-columns: 40px 1fr 80px 70px 80px;
    gap: 8px;
  }

  .round-row {
    grid-template-columns: 1fr 120px 80px;
    gap: 6px;
  }

  .rank-number {
    width: 24px;
    height: 24px;
  }

  .rank-medal {
    font-size: 1rem;
  }

  .leaderboard-header h3 {
    font-size: 1.1rem;
  }

  .chart-container {
    height: 60px;
  }

  .chart-container.chart-expanded {
    height: 300px;
  }

  .expand-chart-button {
    padding: 6px 10px;
    font-size: 1rem;
  }

  .activity-legend {
    gap: 15px;
    font-size: 0.7rem;
  }

  .legend-color {
    width: 10px;
    height: 10px;
  }

  .time-range-label {
    font-size: 0.55rem;
    padding: 1px 4px;
  }
}
</style>
