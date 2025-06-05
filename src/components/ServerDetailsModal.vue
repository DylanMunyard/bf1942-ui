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
      mode: 'nearest',
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
            <h3>Player Count</h3>
            <div class="chart-container">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
          </div>

          <!-- Most Active Players -->
          <div class="stats-section">
            <h3>Most Active Players</h3>
            <div class="players-table">
              <table>
                <thead>
                  <tr>
                    <th>Player Name</th>
                    <th>Play Time</th>
                    <th>Kills</th>
                    <th>Deaths</th>
                    <th>K/D Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(player, index) in serverDetails.mostActivePlayersByTime" :key="index">
                    <td>
                      <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
                        {{ player.playerName }}
                      </router-link>
                    </td>
                    <td>{{ formatPlayTime(player.minutesPlayed) }}</td>
                    <td>{{ player.totalKills }}</td>
                    <td>{{ player.totalDeaths }}</td>
                    <td>{{ calculateKDR(player.totalKills, player.totalDeaths) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


          <!-- Top Scores -->
          <div class="stats-section">
            <h3>Top Scores</h3>
            <div class="scores-table">
              <table>
                <thead>
                  <tr>
                    <th>Player Name</th>
                    <th>Score</th>
                    <th>Kills</th>
                    <th>Deaths</th>
                    <th>K/D Ratio</th>
                    <th>Map</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(score, index) in serverDetails.topScores" :key="index">
                    <td>
                      <router-link :to="`/players/${encodeURIComponent(score.playerName)}`" class="player-link">
                        {{ score.playerName }}
                      </router-link>
                    </td>
                    <td>
                      <router-link :to="`/players/${encodeURIComponent(score.playerName)}/sessions/${score.sessionId}`" class="session-link">
                        {{ score.score }}
                      </router-link>
                    </td>
                    <td>{{ score.kills }}</td>
                    <td>{{ score.deaths }}</td>
                    <td>{{ calculateKDR(score.kills, score.deaths) }}</td>
                    <td>{{ score.mapName }}</td>
                    <td>{{ formatDate(score.timestamp) }}</td>
                  </tr>
                </tbody>
              </table>
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

.chart-container {
  height: 300px;
  margin-bottom: 20px;
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

/* Link styles */
.player-link, .session-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
}

.player-link:hover, .session-link:hover {
  text-decoration: underline;
}

.session-link {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--color-background-mute);
  transition: background-color 0.2s;
}

.session-link:hover {
  background-color: var(--color-accent);
  color: white;
  text-decoration: none;
}

@media (max-width: 768px) {
  .server-details-modal-content {
    width: 95%;
  }

  table {
    font-size: 0.9rem;
  }

  th, td {
    padding: 8px 5px;
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
