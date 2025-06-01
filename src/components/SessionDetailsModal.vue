<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchSessionDetails, SessionDetails } from '../services/playerStatsService';

// Router
const router = useRouter();
const route = useRoute();

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
  playerName: string;
  sessionId: number;
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const sessionDetails = ref<SessionDetails | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Fetch session details when component is mounted or when props change
const fetchData = async () => {
  if (!props.playerName || !props.sessionId) return;

  loading.value = true;
  error.value = null;

  try {
    const data = await fetchSessionDetails(props.playerName, props.sessionId);
    sessionDetails.value = data;
  } catch (err) {
    console.error('Error fetching session details:', err);
    error.value = 'Failed to fetch session details';
  } finally {
    loading.value = false;
  }
};

// Format date to a readable format in the user's locale
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';

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

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Prepare data for the performance chart (score, kills, deaths)
const performanceChartData = computed(() => {
  if (!sessionDetails.value || !sessionDetails.value.observations.length) {
    return {
      labels: [],
      datasets: []
    };
  }

  // Sort observations by timestamp
  const sortedObservations = [...sessionDetails.value.observations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Extract timestamps for labels
  const labels = sortedObservations.map(obs => {
    const date = new Date(obs.timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
  });

  // Create datasets for score, kills, and deaths
  return {
    labels,
    datasets: [
      {
        label: 'Score',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
        borderWidth: 2,
        data: sortedObservations.map(obs => obs.score),
        tension: 0.1
      },
      {
        label: 'Kills',
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196F3',
        borderWidth: 2,
        data: sortedObservations.map(obs => obs.kills),
        tension: 0.1
      },
      {
        label: 'Deaths',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderColor: '#F44336',
        borderWidth: 2,
        data: sortedObservations.map(obs => obs.deaths),
        tension: 0.1
      }
    ]
  };
});

// Prepare data for the ping chart
const pingChartData = computed(() => {
  if (!sessionDetails.value || !sessionDetails.value.observations.length) {
    return {
      labels: [],
      datasets: []
    };
  }

  // Sort observations by timestamp
  const sortedObservations = [...sessionDetails.value.observations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Extract timestamps for labels
  const labels = sortedObservations.map(obs => {
    const date = new Date(obs.timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
  });

  // Create dataset for ping
  return {
    labels,
    datasets: [
      {
        label: 'Ping (ms)',
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        borderColor: '#FF9800',
        borderWidth: 2,
        data: sortedObservations.map(obs => obs.ping),
        tension: 0.1
      }
    ]
  };
});

// Chart options for performance chart with dynamic title
const performanceChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    },
    title: {
      display: true,
      text: `Player Performance - ${sessionDetails.value ? `📊 ${formattedKDR.value}` : ''}`,
      font: {
        size: 16
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time'
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Value'
      },
      ticks: {
        precision: 0
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
}));

// Chart options for ping chart
const pingChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    },
    title: {
      display: true,
      text: 'Player Ping',
      font: {
        size: 16
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time'
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Ping (ms)'
      },
      ticks: {
        precision: 0
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
};

// Close the popup when clicking outside or pressing ESC
const handleOutsideClick = (event: MouseEvent) => {
  const popup = document.querySelector('.session-details-modal-content');
  if (popup && !popup.contains(event.target as Node)) {
    emit('close');
    event.stopPropagation(); // Prevent the event from bubbling up to the PlayerStatsModal
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
    event.stopPropagation(); // Prevent the event from bubbling up to the PlayerStatsModal
  }
};

// Format KDR as "ratio (kills/deaths)" e.g., "0.33 (1/3)"
const formattedKDR = computed(() => {
  if (!sessionDetails.value) return '';
  const kills = sessionDetails.value.totalKills;
  const deaths = sessionDetails.value.totalDeaths;
  const ratio = calculateKDR(kills, deaths);
  return `${ratio} (${kills}/${deaths})`;
});

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

// Watch for route changes to close the modal when navigating back
watch(() => route.name, (newRouteName) => {
  if (props.isOpen && newRouteName !== 'session-details') {
    emit('close');
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
  <div v-if="isOpen" class="session-details-modal-overlay">
    <div class="session-details-modal-content">
      <div class="session-details-header">
        <h2>Session Details</h2>
        <button class="close-button" @click="$emit('close'); $event.stopPropagation()">&times;</button>
      </div>
      <div class="session-details-body">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading session details...</p>
        </div>
        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
        </div>
        <div v-else-if="sessionDetails" class="details-container">
          <!-- Session Info Section -->
          <div class="session-info">
            <div class="session-info-header">
              <h3>{{ sessionDetails.playerName }}</h3>
              <span v-if="sessionDetails.isActive" class="status-badge active">Active</span>
            </div>
            <div class="session-info-grid">
              <div class="info-item">
                <div class="info-label">Server</div>
                <div class="info-value">{{ sessionDetails.serverName }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Map</div>
                <div class="info-value">{{ sessionDetails.mapName }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Game Type</div>
                <div class="info-value">{{ sessionDetails.gameType }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Start Time</div>
                <div class="info-value">{{ formatDate(sessionDetails.startTime) }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">End Time</div>
                <div class="info-value">{{ sessionDetails.endTime ? formatDate(sessionDetails.endTime) : 'Session Active' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Duration</div>
                <div class="info-value">{{ formatPlayTime(sessionDetails.totalPlayTimeMinutes) }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Total Score</div>
                <div class="info-value">{{ sessionDetails.totalScore }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Team</div>
                <div class="info-value">{{ sessionDetails.observations.length > 0 ? sessionDetails.observations[0].teamLabel : 'N/A' }}</div>
              </div>
            </div>
          </div>

          <!-- Performance Chart Section -->
          <div v-if="sessionDetails.observations.length > 0" class="chart-section">
            <div class="chart-container">
              <Line :data="performanceChartData" :options="performanceChartOptions" />
            </div>
          </div>

          <!-- Ping Chart Section -->
          <div v-if="sessionDetails.observations.length > 0" class="chart-section">
            <div class="chart-container">
              <Line :data="pingChartData" :options="pingChartOptions" />
            </div>
          </div>

        </div>
        <div v-else class="no-data-container">
          <p>No session details available.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-details-modal-overlay {
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

.session-details-modal-content {
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 80%;
  max-width: 1000px;
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

.session-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
}

.session-details-header h2 {
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

.session-details-body {
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

.details-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.session-info {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 15px;
}

.session-info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.session-info-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-heading);
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.status-badge.active {
  background-color: #4CAF50;
}

.session-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.info-value {
  font-size: 1.1rem;
  font-weight: bold;
}

.chart-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 15px;
}

.chart-container {
  height: 300px;
}

.observations-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 15px;
}

.observations-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.observations-table {
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
  .session-details-modal-content {
    width: 95%;
  }

  .session-info-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 250px;
  }
}
</style>
