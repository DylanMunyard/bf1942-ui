<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ServerDetails, RecentRoundInfo, ServerInsights, fetchServerDetails, fetchServerInsights, fetchLiveServerData } from '../services/serverDetailsService';
import { Line, Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { countryCodeToName } from '../types/countryCodes';
import { ServerSummary } from '../types/server';
import PlayersModal from '../components/PlayersModal.vue';
import PlayerListItem from '../components/PlayerListItem.vue';
import ServerPlayerActivityChart from '../components/ServerPlayerActivityChart.vue';
import ServerLeaderboards from '../components/ServerLeaderboards.vue';
import ServerRecentRounds from '../components/ServerRecentRounds.vue';
import { formatDate } from '../utils/date';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// State
const serverName = ref(route.params.serverName as string);
const serverDetails = ref<ServerDetails | null>(null);
const serverInsights = ref<ServerInsights | null>(null);
const liveServerInfo = ref<ServerSummary | null>(null);
const isLoading = ref(true);
const isInsightsLoading = ref(true);
const isLiveServerLoading = ref(false);
const error = ref<string | null>(null);
const insightsError = ref<string | null>(null);
const liveServerError = ref<string | null>(null);
const isServerInsightsCollapsed = ref(true);
const showPlayersModal = ref(false);
const currentPeriod = ref('7d');

// Fetch live server data asynchronously (non-blocking)
const fetchLiveServerDataAsync = async () => {
  if (!serverDetails.value?.serverIp || !serverDetails.value?.serverPort) return;

  isLiveServerLoading.value = true;
  liveServerError.value = null;

  try {
    // Use gameId from server details API response, fallback to guessing from server name
    const gameId = serverDetails.value.gameId || 
      (serverName.value.toLowerCase().includes('fh2') ? 'fh2' : 
       serverName.value.toLowerCase().includes('vietnam') || serverName.value.toLowerCase().includes('bfv') ? 'bfvietnam' : 'bf1942');
    
    liveServerInfo.value = await fetchLiveServerData(
      gameId,
      serverDetails.value.serverIp,
      serverDetails.value.serverPort
    );
  } catch (err) {
    console.error('Error fetching live server data:', err);
    liveServerError.value = 'Failed to load current server info.';
  } finally {
    isLiveServerLoading.value = false;
  }
};

// Fetch server details and insights in parallel
const fetchData = async () => {
  if (!serverName.value) return;

  isLoading.value = true;
  isInsightsLoading.value = true;
  error.value = null;
  insightsError.value = null;

  try {
    // Fetch both server details and insights in parallel
    const [detailsResult, insightsResult] = await Promise.allSettled([
      fetchServerDetails(serverName.value),
      fetchServerInsights(serverName.value, currentPeriod.value)
    ]);

    // Handle server details result
    if (detailsResult.status === 'fulfilled') {
      serverDetails.value = detailsResult.value;
      // Fetch live server data asynchronously after server details are loaded
      fetchLiveServerDataAsync();
    } else {
      console.error('Error fetching server details:', detailsResult.reason);
      error.value = 'Failed to load server details. Please try again later.';
    }

    // Handle insights result
    if (insightsResult.status === 'fulfilled') {
      serverInsights.value = insightsResult.value;
    } else {
      console.error('Error fetching server insights:', insightsResult.reason);
      insightsError.value = 'Failed to load server insights.';
    }
  } catch (err) {
    console.error('Unexpected error during fetch:', err);
    error.value = 'An unexpected error occurred. Please try again later.';
  } finally {
    isLoading.value = false;
    isInsightsLoading.value = false;
  }
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
});

// Toggle server insights collapse state
const toggleServerInsights = () => {
  isServerInsightsCollapsed.value = !isServerInsightsCollapsed.value;
};

// Helper to get current time and UTC offset for a timezone string
function getTimezoneDisplay(timezone: string | undefined): string | null {
  if (!timezone) return null;
  try {
    const now = new Date();
    // Get current time in the timezone
    const time = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit', minute: '2-digit', timeZone: timezone
    }).format(now);
    // Get UTC offset in hours
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMinutes = (tzDate.getTime() - now.getTime()) / 60000;
    const offsetHours = Math.round(offsetMinutes / 60);
    const sign = offsetHours >= 0 ? '+' : '-';
    return `${time} (${sign}${Math.abs(offsetHours)})`;
  } catch (e) {
    return timezone;
  }
}

// Helper to get full country name from code
function getCountryName(code: string | undefined, fallback: string | undefined): string | undefined {
  if (!code) return fallback;
  const name = countryCodeToName[code.toUpperCase()];
  return name || fallback;
}

// Helper to get the correct servers route based on gameId
const getServersRoute = (gameId?: string): string => {
  if (!gameId) return '/servers';
  
  const normalizedGameId = gameId.toLowerCase();
  switch (normalizedGameId) {
    case 'fh2':
      return '/servers/fh2';
    case 'bfv':
    case 'bfvietnam':
      return '/servers/bfv';
    case 'bf1942':
    case '42':
    default:
      return '/servers/bf1942';
  }
};

// Join server function
const joinServer = () => {
  if (!liveServerInfo.value?.joinLink) return;
  
  const newWindow = window.open(liveServerInfo.value.joinLink, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    newWindow.blur();
    window.focus();
  }
};

// Players modal functions
const openPlayersModal = () => {
  if (!liveServerInfo.value) return;
  showPlayersModal.value = true;
};

const closePlayersModal = () => {
  showPlayersModal.value = false;
};

// Handle period change from chart component
const handlePeriodChange = async (period: string) => {
  if (period === currentPeriod.value) return;
  
  currentPeriod.value = period;
  isInsightsLoading.value = true;
  insightsError.value = null;

  try {
    serverInsights.value = await fetchServerInsights(serverName.value, period);
  } catch (err) {
    console.error('Error fetching server insights for period:', period, err);
    insightsError.value = 'Failed to load server insights for selected period.';
  } finally {
    isInsightsLoading.value = false;
  }
};
</script>

<template>
  <div class="server-details-container">
    <div class="server-details-header">
      <div class="server-name-container" style="flex-direction: column; align-items: flex-start;">
        <router-link :to="getServersRoute(serverDetails?.gameId || (liveServerInfo?.gameType as string))" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Servers
        </router-link>
        <h2>Server Details: {{ serverName }}</h2>
        <div v-if="serverDetails && (serverDetails.region || serverDetails.country || serverDetails.timezone)" class="server-region-badge">
          <span>
            <template v-if="serverDetails.region">{{ serverDetails.region }}</template>
            <template v-if="serverDetails.region && (serverDetails.country || serverDetails.countryCode)"> <span class="dot">•</span> </template>
            <template v-if="serverDetails.country || serverDetails.countryCode">{{ getCountryName(serverDetails.country, serverDetails.country) }}</template>
            <template v-if="(serverDetails.region || serverDetails.country || serverDetails.countryCode) && serverDetails.timezone"> <span class="dot">•</span> </template>
            <template v-if="serverDetails.timezone">
              <span v-if="getTimezoneDisplay(serverDetails.timezone)"> {{ getTimezoneDisplay(serverDetails.timezone) }}</span>
            </template>
          </span>
        </div>
      </div>
      <div class="modal-actions">
        <!-- Current Players Link -->
        <button
          v-if="liveServerInfo && liveServerInfo.players.length > 0"
          @click="openPlayersModal"
          class="current-players-link"
        >
          <div class="players-info">
            <span class="player-count">{{ liveServerInfo.numPlayers }} Online</span>
            <span v-if="liveServerInfo.mapName" class="current-map">Currently playing {{ liveServerInfo.mapName }}</span>
          </div>
        </button>
        <div v-else-if="liveServerInfo && liveServerInfo.players.length === 0" class="current-players-empty">
          <div class="players-info">
            <span class="player-count">0 Online</span>
            <span v-if="liveServerInfo.mapName" class="current-map">Currently playing {{ liveServerInfo.mapName }}</span>
          </div>
        </div>
        <div v-else-if="isLiveServerLoading" class="current-players-loading">
          <div class="loading-spinner small"></div>
          <span>Loading...</span>
        </div>
        
        <!-- Join Server Button -->
        <button
          v-if="liveServerInfo?.joinLink"
          @click="joinServer"
          class="join-server-button"
        >
          🎮 Join Server
        </button>
        
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

        <!-- Player Activity Section -->
        <ServerPlayerActivityChart :server-insights="serverInsights" :is-loading="isInsightsLoading" @period-change="handlePeriodChange" />
        <div v-if="insightsError" class="insights-error">
          <p class="error-message-small">{{ insightsError }}</p>
        </div>

        <!-- Enhanced Leaderboards Container -->
        <ServerLeaderboards :server-details="serverDetails" :server-name="serverName" />

        <!-- Recent Rounds -->
        <ServerRecentRounds v-if="serverDetails" :server-details="serverDetails" :server-name="serverName" />
      </div>
      <div v-else class="no-data-container">
        <p>No server details available.</p>
      </div>
    </div>
    
    <!-- Players Modal -->
    <PlayersModal 
      :show="showPlayersModal" 
      :server="liveServerInfo" 
      @close="closePlayersModal" 
    />
  </div>
</template>

<style scoped>
.server-details-container {
  background-color: var(--color-background);
  border-radius: 0;
  box-shadow: none;
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
  flex-direction: column;
  align-items: flex-start;
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
  flex-wrap: wrap;
}


.current-players-link {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.current-players-link:hover {
  background-color: var(--color-primary-hover);
}

.current-players-empty {
  padding: 8px 16px;
  background-color: var(--color-background-mute);
  color: var(--color-text-muted);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--color-border);
}

.players-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.player-count {
  font-weight: 600;
  font-size: 14px;
}

.current-map {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.9;
  text-align: center;
}

.current-players-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--color-background-soft);
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-size: 14px;
  color: var(--color-text-muted);
}

.join-server-button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.join-server-button:hover {
  background-color: #45a049;
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

.insights-loading, .insights-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--color-background-soft);
  border-radius: 8px;
  margin-bottom: 12px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  margin-bottom: 0;
}

.error-message-small {
  color: #ff5252;
  font-size: 0.9rem;
  margin: 0;
}
</style>
