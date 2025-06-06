<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ServerDetails, fetchServerDetails } from '../services/serverDetailsService';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Props {
  serverName: string;
  game: string;
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

// Router
const router = useRouter();

// State
const serverDetails = ref<ServerDetails | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isChartExpanded = ref(false);

// Fetch server details
const fetchData = async () => {
  if (!props.serverName || !props.game) return;

  isLoading.value = true;
  error.value = null;

  try {
    serverDetails.value = await fetchServerDetails(props.serverName, props.game);
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

// Close the popup when clicking outside or pressing ESC
const handleOutsideClick = (event: MouseEvent) => {
  const popup = document.querySelector('.server-details-modal-content');
  if (popup && !popup.contains(event.target as Node)) {
    emit('close');
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
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
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        data
      }
    ]
  };
});

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Player Count'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Time'
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'nearest' as const,
      intersect: true
    }
  }
};

// Add and remove event listeners
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    fetchData();
  } else {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleKeyDown);
  }
});

// Toggle chart expansion
const toggleChartExpansion = () => {
  isChartExpanded.value = !isChartExpanded.value;
};

// Clean up event listeners when component is unmounted
onMounted(() => {
  if (props.isOpen) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    fetchData();
  }
});
</script>

<template>
  <div v-if="isOpen" class="server-details-modal-overlay">
    <div class="server-details-modal-content">
      <div class="server-details-header">
        <div class="server-name-container">
          <h2>Server Details: {{ serverName }}</h2>
        </div>
        <div class="modal-actions">
          <router-link 
            :to="`/servers/${encodeURIComponent(props.serverName)}/rankings`" 
            class="rankings-button"
          >
            🏆 View Rankings
          </router-link>
          <button class="close-button" @click="$emit('close')">&times;</button>
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
              <h3>Player Count Over Time</h3>
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
              <Bar :data="chartData" :options="chartOptions" />
              <div v-if="!isChartExpanded" class="chart-overlay">
                <div class="chart-overlay-text">
                  <span>Click to expand</span>
                </div>
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
                      <router-link :to="`/sessions/${encodeURIComponent(score.playerName)}/${score.sessionId}`" class="session-link">
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
          </div>
        </div>
        <div v-else class="no-data-container">
          <p>No server details available.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-details-modal-overlay {
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

.server-details-modal-content {
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 1200px;
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

.server-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
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

.server-details-body {
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
  height: 120px;
  margin-bottom: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
}

.chart-container:hover:not(.chart-expanded) {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

.chart-container.chart-expanded {
  height: 400px;
  cursor: default;
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

.chart-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(1px);
}

.chart-container:hover .chart-overlay {
  background: rgba(var(--color-primary-rgb, 33, 150, 243), 0.15);
}

.chart-overlay-text {
  background: var(--color-background);
  color: var(--color-primary);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid var(--color-primary);
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.chart-container:hover .chart-overlay-text {
  background: var(--color-primary);
  color: white;
  transform: scale(1.05);
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
.players-header, .scores-header {
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

.players-header {
  grid-template-columns: 50px 1fr 120px 80px;
  gap: 10px;
}

.scores-header {
  grid-template-columns: 50px 1fr 100px 80px 100px;
  gap: 10px;
}

/* Players List */
.players-list, .scores-list {
  max-height: 350px;
  overflow-y: auto;
}

.player-row, .score-row {
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

.player-row:hover, .score-row:hover {
  background: var(--color-background-soft);
}

.player-row:last-child, .score-row:last-child {
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
.player-link, .session-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-link:hover, .session-link:hover {
  text-decoration: underline;
  color: var(--color-primary-hover, var(--color-primary));
}

.session-link {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--color-background-mute);
  font-weight: 600;
  transition: all 0.2s ease;
}

.session-link:hover {
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .server-details-modal-content {
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
    height: 100px;
  }

  .chart-container.chart-expanded {
    height: 300px;
  }

  .expand-chart-button {
    padding: 6px 10px;
    font-size: 1rem;
  }
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
</style>
