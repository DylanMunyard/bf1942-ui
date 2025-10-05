<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ServerDetails, ServerInsights, LeaderboardsData, fetchServerDetails, fetchServerInsights, fetchServerLeaderboards, fetchLiveServerData, ServerBusyIndicator, ServerHourlyTimelineEntry, fetchServerBusyIndicators } from '../services/serverDetailsService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { countryCodeToName } from '../types/countryCodes';
import { ServerSummary } from '../types/server';
import PlayersPanel from '../components/PlayersPanel.vue';
import ServerPlayerActivityChart from '../components/ServerPlayerActivityChart.vue';
import ServerLeaderboards from '../components/ServerLeaderboards.vue';
import ServerRecentRounds from '../components/ServerRecentRounds.vue';
import { formatDate } from '../utils/date';
import HeroBackButton from '../components/HeroBackButton.vue';
import ForecastModal from '../components/ForecastModal.vue';
import discordIcon from '@/assets/discord.png';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const route = useRoute();

// State
const serverName = ref(route.params.serverName as string);
const serverDetails = ref<ServerDetails | null>(null);
const serverInsights = ref<ServerInsights | null>(null);
const leaderboardsData = ref<LeaderboardsData | null>(null);
const liveServerInfo = ref<ServerSummary | null>(null);
const isLoading = ref(true);
const isInsightsLoading = ref(true);
const isLeaderboardsLoading = ref(true);
const isLiveServerLoading = ref(false);
const error = ref<string | null>(null);
const insightsError = ref<string | null>(null);
const leaderboardsError = ref<string | null>(null);
const liveServerError = ref<string | null>(null);
const showPlayersModal = ref(false);
const currentPeriod = ref(1);
const currentLeaderboardPeriod = ref<'week' | 'month' | 'alltime'>('week');
const minPlayersForWeighting = ref(15);

// Busy indicator state
const serverBusyIndicator = ref<ServerBusyIndicator | null>(null);
const serverHourlyTimeline = ref<ServerHourlyTimelineEntry[]>([]);
const isBusyIndicatorLoading = ref(false);
const busyIndicatorError = ref<string | null>(null);
const showForecastOverlay = ref(false);

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

// Fetch busy indicator data for the server
const fetchBusyIndicatorData = async () => {
  if (!serverDetails.value?.serverGuid) return;

  isBusyIndicatorLoading.value = true;
  busyIndicatorError.value = null;

  try {
    const response = await fetchServerBusyIndicators([serverDetails.value.serverGuid]);
    if (response.serverResults.length > 0) {
      const result = response.serverResults[0];
      serverBusyIndicator.value = result.busyIndicator;
      serverHourlyTimeline.value = result.hourlyTimeline;
    }
  } catch (err) {
    console.error('Error fetching busy indicator data:', err);
    busyIndicatorError.value = 'Failed to load server activity forecast.';
  } finally {
    isBusyIndicatorLoading.value = false;
  }
};

// Fetch server details, insights, and leaderboards in parallel
const fetchData = async () => {
  if (!serverName.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    // Fetch server details first (blocks UI)
    serverDetails.value = await fetchServerDetails(serverName.value);

    // Fetch live server data and busy indicator data asynchronously after server details are loaded
    fetchLiveServerDataAsync();
    fetchBusyIndicatorData();

    // Now fetch insights and leaderboards in parallel (non-blocking)
    fetchInsightsAsync();
    fetchLeaderboardsAsync();
  } catch (err) {
    console.error('Error fetching server details:', err);
    error.value = 'Failed to load server details. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

// Fetch insights asynchronously (non-blocking)
const fetchInsightsAsync = async () => {
  isInsightsLoading.value = true;
  insightsError.value = null;

  try {
    serverInsights.value = await fetchServerInsights(serverName.value, currentPeriod.value);
  } catch (err) {
    console.error('Error fetching server insights:', err);
    insightsError.value = 'Failed to load server insights.';
  } finally {
    isInsightsLoading.value = false;
  }
};

// Fetch leaderboards asynchronously (non-blocking)
const fetchLeaderboardsAsync = async () => {
  isLeaderboardsLoading.value = true;
  leaderboardsError.value = null;

  try {
    leaderboardsData.value = await fetchServerLeaderboards(
      serverName.value,
      currentLeaderboardPeriod.value,
      minPlayersForWeighting.value
    );
  } catch (err) {
    console.error('Error fetching server leaderboards:', err);
    leaderboardsError.value = 'Failed to load server leaderboards.';
  } finally {
    isLeaderboardsLoading.value = false;
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
  } catch {
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
const handlePeriodChange = async (period: number) => {
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

// Handle leaderboard period change
const handleLeaderboardPeriodChange = async (period: 'week' | 'month' | 'alltime') => {
  if (period === currentLeaderboardPeriod.value) return;

  currentLeaderboardPeriod.value = period;
  isLeaderboardsLoading.value = true;
  leaderboardsError.value = null;

  try {
    leaderboardsData.value = await fetchServerLeaderboards(
      serverName.value,
      period,
      minPlayersForWeighting.value
    );
  } catch (err) {
    console.error('Error fetching leaderboards for period:', period, err);
    leaderboardsError.value = 'Failed to load leaderboards for selected period.';
  } finally {
    isLeaderboardsLoading.value = false;
  }
};

// Handle min players for weighting update
const handleMinPlayersUpdate = async (value: number) => {
  minPlayersForWeighting.value = value;

  // Refetch leaderboards with new min players value
  isLeaderboardsLoading.value = true;
  leaderboardsError.value = null;

  try {
    leaderboardsData.value = await fetchServerLeaderboards(
      serverName.value,
      currentLeaderboardPeriod.value,
      value
    );
  } catch (err) {
    console.error('Error refreshing leaderboards with new min players:', err);
    leaderboardsError.value = 'Failed to refresh leaderboards.';
  } finally {
    isLeaderboardsLoading.value = false;
  }
};

// Helper functions for mini forecast bars
const getMiniTimelineBarHeight = (entry: ServerHourlyTimelineEntry): number => {
  const timeline = serverHourlyTimeline.value || [];
  const maxTypical = Math.max(1, ...timeline.map(e => Math.max(0, e.typicalPlayers || 0)));
  const pct = Math.max(0, Math.min(1, (entry.typicalPlayers || 0) / maxTypical));
  const maxHeight = 20; // px for mini bars (h-6 = 24px container)
  const minHeight = 2;
  return Math.max(minHeight, Math.round(pct * maxHeight));
};

const formatTimelineTooltip = (entry: ServerHourlyTimelineEntry): string => {
  // Convert UTC hour to local "HH:00" display
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), entry.hour, 0, 0));
  const local = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const levelLabel = getBusyLevelLabel(entry.busyLevel);
  return `${local} • Typical ${Math.round(entry.typicalPlayers)} • ${levelLabel}`;
};

const getBusyLevelLabel = (level: string): string => {
  switch (level) {
    case 'very_busy': return 'Very busy';
    case 'busy': return 'Busy';
    case 'moderate': return 'Moderate';
    case 'quiet': return 'Quiet';
    case 'very_quiet': return 'Very quiet';
    default: return 'Unknown';
  }
};

// Toggle forecast overlay for mobile
const toggleForecastOverlay = () => {
  showForecastOverlay.value = !showForecastOverlay.value;
};

// Close forecast overlay when clicking outside
const closeForecastOverlay = () => {
  showForecastOverlay.value = false;
};
</script>

<template>
  <!-- Full-width Hero Section -->
  <div class="w-full bg-slate-800 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between">
        <HeroBackButton :on-click="() => $router.push(getServersRoute(serverDetails?.gameId || (liveServerInfo?.gameType as string)))" />
      </div>
      
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 mt-6">
        <!-- Server Info -->
        <div class="flex-grow min-w-0">
          <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-3">
            {{ serverName }}
          </h1>
          
          <!-- Server Metadata -->
          <div
            v-if="serverDetails && (serverDetails.region || serverDetails.country || serverDetails.timezone || liveServerInfo?.discordUrl || liveServerInfo?.forumUrl)"
            class="flex flex-wrap gap-3 mb-4"
          >
            <div
              v-if="serverDetails.region"
              class="inline-flex items-center px-3 py-1 bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-600"
            >
              📍 {{ serverDetails.region }}
            </div>
            <div
              v-if="serverDetails.country || serverDetails.countryCode"
              class="inline-flex items-center px-3 py-1 bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-600"
            >
              🌍 {{ getCountryName(serverDetails.countryCode, serverDetails.country) }}
            </div>
            <div
              v-if="serverDetails.timezone && getTimezoneDisplay(serverDetails.timezone)"
              class="inline-flex items-center px-3 py-1 bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-600"
            >
              🕒 {{ getTimezoneDisplay(serverDetails.timezone) }}
            </div>

            <!-- Community Links -->
            <a
              v-if="liveServerInfo?.discordUrl"
              :href="liveServerInfo.discordUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-200"
              title="Join Discord"
            >
              <img
                :src="discordIcon"
                alt="Discord"
                class="w-4 h-4"
              >
            </a>

            <a
              v-if="liveServerInfo?.forumUrl"
              :href="liveServerInfo.forumUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-3 py-1 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg border border-orange-500/30 hover:border-orange-500/50 transition-all duration-200"
              title="Visit Forum"
            >
              <span class="text-orange-400 text-sm">📋</span>
            </a>
          </div>

          <!-- Period Info -->
          <div
            v-if="serverDetails"
            class="text-slate-400 text-sm"
          >
            📊 Data from {{ formatDate(serverDetails.startPeriod) }} to {{ formatDate(serverDetails.endPeriod) }}
          </div>

          <!-- Server Activity Forecast Widget (Ultra Condensed) -->
          <div
            v-if="serverBusyIndicator && serverHourlyTimeline.length > 0"
            class="mt-3 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50 group/forecast relative inline-block cursor-pointer"
            @click.stop="toggleForecastOverlay"
          >
            <!-- Mini Forecast Bars Only -->
            <div class="flex items-end justify-center gap-0.5 h-6">
              <div 
                v-for="(entry, index) in serverHourlyTimeline" 
                :key="index"
                class="flex flex-col items-center gap-0.5 w-3 group"
              >
                <!-- Mini vertical bar -->
                <div 
                  class="w-1.5 rounded-t transition-all duration-300"
                  :class="entry.isCurrentHour ? 'bg-cyan-400' : 'bg-slate-600'"
                  :style="{ 
                    height: getMiniTimelineBarHeight(entry) + 'px' 
                  }"
                  :title="formatTimelineTooltip(entry)"
                />
              </div>
            </div>

            <!-- Forecast Modal Component -->
            <ForecastModal
              :show-overlay="true"
              :show-modal="showForecastOverlay"
              :hourly-timeline="serverHourlyTimeline"
              :current-status="`${serverBusyIndicator.currentPlayers} players (typical: ${Math.round(serverBusyIndicator.typicalPlayers)})`"
              :current-players="serverBusyIndicator.currentPlayers"
              overlay-class="opacity-0 group-hover/forecast:opacity-100"
              @close="closeForecastOverlay"
            />
          </div>

          <!-- Busy Indicator Loading State -->
          <div
            v-else-if="isBusyIndicatorLoading"
            class="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
          >
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <span class="text-sm text-slate-400">Loading activity forecast...</span>
            </div>
          </div>

          <!-- Busy Indicator Error State -->
          <div
            v-else-if="busyIndicatorError"
            class="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          >
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
                <span class="text-red-400 text-xs">⚠️</span>
              </div>
              <span class="text-sm text-red-400">{{ busyIndicatorError }}</span>
            </div>
          </div>
        </div>

        <!-- Live Server Status & Actions -->
        <div class="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
          <!-- Current Players -->
          <button
            v-if="liveServerInfo && liveServerInfo.players.length > 0"
            class="group bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 px-4 py-3 min-w-[140px]"
            @click="openPlayersModal"
          >
            <div class="flex flex-col items-center">
              <div class="font-bold text-xl">
                {{ liveServerInfo.numPlayers }}
              </div>
              <div class="text-xs opacity-90">
                Players Online
              </div>
              <div
                v-if="liveServerInfo.mapName"
                class="text-xs opacity-75 mt-1 truncate max-w-[120px]"
              >
                {{ liveServerInfo.mapName }}
              </div>
            </div>
          </button>
          
          <div
            v-else-if="liveServerInfo && liveServerInfo.players.length === 0"
            class="bg-slate-700 text-slate-400 rounded-xl border border-slate-600 px-4 py-3 min-w-[140px]"
          >
            <div class="flex flex-col items-center">
              <div class="font-bold text-xl">
                0
              </div>
              <div class="text-xs">
                Players Online
              </div>
              <div
                v-if="liveServerInfo.mapName"
                class="text-xs opacity-75 mt-1 truncate max-w-[120px]"
              >
                {{ liveServerInfo.mapName }}
              </div>
            </div>
          </div>

          <div
            v-else-if="isLiveServerLoading"
            class="bg-slate-700 text-slate-400 rounded-xl border border-slate-600 flex items-center justify-center gap-3 px-4 py-3 min-w-[140px]"
          >
            <div class="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>

          <!-- Join Server Button -->
          <button
            v-if="liveServerInfo?.joinLink"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
            @click="joinServer"
          >
            <span class="text-base">🎮</span>
            <span>Join Server</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div
    class="min-h-screen bg-slate-900"
    @click="closeForecastOverlay"
  >
    <div class="relative">
      <div class="relative py-6 sm:py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center py-20 text-slate-400"
          >
            <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <p class="text-lg text-slate-300">
              Loading server profile...
            </p>
          </div>

          <!-- Error State -->
          <div
            v-else-if="error"
            class="bg-slate-800/70 backdrop-blur-sm border border-red-800/50 rounded-xl p-8 text-center"
          >
            <div class="text-6xl mb-4">
              ⚠️
            </div>
            <p class="text-red-400 text-lg font-medium">
              {{ error }}
            </p>
          </div>

          <!-- Server Content -->
          <div
            v-else-if="serverDetails"
            class="space-y-6"
          >
            <!-- Server Rankings & Leaderboards Section -->
            <div class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
              <div class="px-6 py-4 border-b border-slate-700/50">
                <h3 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
                  🏆 Player Statistics & Rankings
                </h3>
              </div>

              <!-- Prominent Full-Width Rankings Button -->
              <div class="px-6 pt-6 pb-4">
                <div class="relative group">
                  <!-- Background Glow Effect -->
                  <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300" />
                  
                  <!-- Main Button -->
                  <router-link 
                    :to="`/servers/${encodeURIComponent(serverName)}/rankings`" 
                    class="relative group/btn block w-full bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-lg p-4 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <div class="flex items-center justify-center gap-3 text-white">
                      <span class="text-2xl">🏆</span>
                      <span class="text-lg font-bold">VIEW FULL RANKINGS</span>
                      <span class="text-xl group-hover/btn:translate-x-1 transition-transform duration-200">→</span>
                    </div>
                  </router-link>
                </div>
              </div>

              <!-- Leaderboards Content -->
              <div class="px-6 pb-6">
                <ServerLeaderboards
                  :leaderboards-data="leaderboardsData"
                  :is-loading="isLeaderboardsLoading"
                  :error="leaderboardsError"
                  :server-name="serverName"
                  :server-guid="serverDetails.serverGuid"
                  :min-players-for-weighting="minPlayersForWeighting"
                  @update-min-players-for-weighting="handleMinPlayersUpdate"
                  @period-change="handleLeaderboardPeriodChange"
                />
              </div>
            </div>

            <!-- Recent Rounds Section -->
            <div class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
              <div class="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <h3 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
                  🎯 Recent Rounds
                </h3>
                <router-link 
                  :to="`/servers/${encodeURIComponent(serverName)}/sessions`" 
                  class="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium px-4 py-2 bg-slate-700/50 hover:bg-slate-600/70 rounded-lg border border-slate-600/50"
                >
                  View All Sessions
                </router-link>
              </div>
              <div class="p-6">
                <ServerRecentRounds
                  :server-details="serverDetails"
                  :server-name="serverName"
                />
              </div>
            </div>

            <!-- Player Activity Section -->
            <div class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
              <ServerPlayerActivityChart
                :server-insights="serverInsights"
                :is-loading="isInsightsLoading"
                @period-change="handlePeriodChange"
              />
            </div>
            <div
              v-if="insightsError"
              class="bg-red-900/20 border border-red-700/50 rounded-xl p-4"
            >
              <p class="text-red-400 text-sm">
                {{ insightsError }}
              </p>
            </div>
          </div>

          <!-- No Data State -->
          <div
            v-else
            class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center"
          >
            <div class="text-6xl mb-4 opacity-50">
              📊
            </div>
            <p class="text-slate-400 text-lg">
              No server data available
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
    
  <!-- Players Panel -->
  <PlayersPanel 
    :show="showPlayersModal" 
    :server="liveServerInfo" 
    @close="closePlayersModal" 
  />
</template>

<style scoped>
/* Custom animations for enhanced visual effects */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>
