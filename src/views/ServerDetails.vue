<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ServerDetails, ServerInsights, fetchServerDetails, fetchServerInsights, fetchLiveServerData } from '../services/serverDetailsService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { countryCodeToName } from '../types/countryCodes';
import { ServerSummary } from '../types/server';
import PlayersPanel from '../components/PlayersPanel.vue';
import ServerPlayerActivityChart from '../components/ServerPlayerActivityChart.vue';
import ServerLeaderboards from '../components/ServerLeaderboards.vue';
import ServerRecentRounds from '../components/ServerRecentRounds.vue';
import { formatDate } from '../utils/date';
import HeroBackButton from '../components/HeroBackButton.vue';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const route = useRoute();

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
  <div class="relative min-h-screen px-2 sm:px-6">
    <div class="relative z-10">

      <div class="relative z-10 py-3 sm:py-12">
        <div class="max-w-7xl mx-auto">
          <!-- Server Profile Hero -->
          <div class="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden mb-4 sm:mb-8">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 opacity-50"></div>
            
            <HeroBackButton :on-click="() => $router.push(getServersRoute(serverDetails?.gameId || (liveServerInfo?.gameType as string)))" />
            <div class="relative z-10 p-3 sm:p-8 md:p-12">
              <div class="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8">
                <!-- Server Icon/Avatar -->
                <div class="flex-shrink-0">
                  <div class="relative">
                    <div class="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 p-1">
                      <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-slate-900">
                          🖥️
                        </div>
                      </div>
                    </div>
                    <!-- Status indicator -->
                    <div class="absolute -bottom-2 -right-2">
                      <div class="w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <!-- Server Info -->
                <div class="flex-grow">
                  <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4">
                    {{ serverName }}
                  </h1>
                  
                  <!-- Server Metadata -->
                  <div 
                    v-if="serverDetails && (serverDetails.region || serverDetails.country || serverDetails.timezone)"
                    class="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6"
                  >
                    <div v-if="serverDetails.region" class="px-3 py-1 bg-slate-700/50 backdrop-blur-sm rounded-full text-sm text-slate-300 border border-slate-600/50">
                      📍 {{ serverDetails.region }}
                    </div>
                    <div v-if="serverDetails.country || serverDetails.countryCode" class="px-3 py-1 bg-slate-700/50 backdrop-blur-sm rounded-full text-sm text-slate-300 border border-slate-600/50">
                      🌍 {{ getCountryName(serverDetails.countryCode, serverDetails.country) }}
                    </div>
                    <div v-if="serverDetails.timezone && getTimezoneDisplay(serverDetails.timezone)" class="px-3 py-1 bg-slate-700/50 backdrop-blur-sm rounded-full text-sm text-slate-300 border border-slate-600/50">
                      🕒 {{ getTimezoneDisplay(serverDetails.timezone) }}
                    </div>
                  </div>

                  <!-- Period Info -->
                  <div v-if="serverDetails" class="text-slate-400 text-sm mb-4 sm:mb-6">
                    📊 Data from {{ formatDate(serverDetails.startPeriod) }} to {{ formatDate(serverDetails.endPeriod) }}
                  </div>
                </div>

                <!-- Live Server Status & Actions -->
                <div class="flex flex-col gap-4 items-end">
                  <!-- Current Players -->
                  <button
                    v-if="liveServerInfo && liveServerInfo.players.length > 0"
                    @click="openPlayersModal"
                    class="group bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                    :class="{
                      'px-4 py-3': true, // Mobile: smaller padding
                      'md:px-6 md:py-4': true // Desktop: larger padding
                    }"
                  >
                    <div class="flex flex-col items-center">
                      <div class="font-bold" :class="{ 'text-lg': true, 'md:text-2xl': true }">{{ liveServerInfo.numPlayers }}</div>
                      <div class="opacity-90" :class="{ 'text-xs': true, 'md:text-sm': true }">Players Online</div>
                      <div v-if="liveServerInfo.mapName" class="opacity-75 mt-1" :class="{ 'text-xs': true, 'md:text-xs': true }">
                        Playing {{ liveServerInfo.mapName }}
                      </div>
                    </div>
                  </button>
                  
                  <div
                    v-else-if="liveServerInfo && liveServerInfo.players.length === 0"
                    class="bg-slate-700/50 backdrop-blur-sm text-slate-400 rounded-xl border border-slate-600/50"
                    :class="{
                      'px-4 py-3': true, // Mobile: smaller padding
                      'md:px-6 md:py-4': true // Desktop: larger padding
                    }"
                  >
                    <div class="flex flex-col items-center">
                      <div class="font-bold" :class="{ 'text-lg': true, 'md:text-2xl': true }">0</div>
                      <div class="" :class="{ 'text-xs': true, 'md:text-sm': true }">Players Online</div>
                      <div v-if="liveServerInfo.mapName" class="opacity-75 mt-1" :class="{ 'text-xs': true, 'md:text-xs': true }">
                        Playing {{ liveServerInfo.mapName }}
                      </div>
                    </div>
                  </div>

                  <div
                    v-else-if="isLiveServerLoading"
                    class="bg-slate-700/50 backdrop-blur-sm text-slate-400 rounded-xl border border-slate-600/50 flex items-center gap-3"
                    :class="{
                      'px-4 py-3': true, // Mobile: smaller padding
                      'md:px-6 md:py-4': true // Desktop: larger padding
                    }"
                  >
                    <div class="w-4 h-4 md:w-5 md:h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-xs md:text-sm">Loading...</span>
                  </div>

                  <!-- Join Server Button - Hidden on mobile -->
                  <button
                    v-if="liveServerInfo?.joinLink"
                    @click="joinServer"
                    class="hidden md:flex group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 items-center gap-2"
                  >
                    <span class="text-xl">🎮</span>
                    <span class="font-semibold">Join Server</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center py-20 text-slate-400"
          >
            <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
            <p class="text-lg">Loading server profile...</p>
          </div>

          <!-- Error State -->
          <div
            v-else-if="error"
            class="bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 text-center"
          >
            <div class="text-6xl mb-4">⚠️</div>
            <p class="text-red-400 text-lg font-semibold">{{ error }}</p>
          </div>

          <!-- Server Content -->
          <div v-else-if="serverDetails" class="space-y-3 sm:space-y-8">

            <!-- Recent Rounds Section -->
            <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
              <div class="p-3 sm:p-6 border-b border-slate-700/50">
                <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
                  🎯 Recent Rounds
                </h3>
              </div>
              <div class="p-3 sm:p-6">
                <ServerRecentRounds
                    :server-details="serverDetails"
                    :server-name="serverName"
                />
              </div>
            </div>

            <!-- Popular Maps Section -->
            <div 
              v-if="serverInsights?.popularMaps && serverInsights.popularMaps.length > 0"
              class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
            >
              <div class="p-3 sm:p-6 border-b border-slate-700/50">
                <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 flex items-center gap-3">
                  🗺️ Popular Maps
                </h3>
                <p class="text-slate-400 text-sm mt-2">Most played maps during the selected period</p>
              </div>
              <div class="p-3 sm:p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div
                    v-for="(map, index) in serverInsights.popularMaps"
                    :key="map.mapName"
                    class="group relative bg-gradient-to-br from-slate-700/30 to-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/50 hover:border-orange-500/50 transition-all duration-300 overflow-hidden"
                  >
                    <!-- Background gradient effect -->
                    <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <!-- Rank indicator -->
                    <div class="absolute top-3 right-3 z-10">
                      <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {{ index + 1 }}
                      </div>
                    </div>
                    
                    <div class="relative z-10 p-4 space-y-3">
                      <!-- Map Name -->
                      <div class="pr-10">
                        <h4 class="text-lg font-bold text-white capitalize">
                          {{ map.mapName.replace(/_/g, ' ') }}
                        </h4>
                      </div>
                      
                      <!-- Stats Grid -->
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="space-y-1">
                          <div class="flex items-center gap-2 text-cyan-400">
                            <span class="text-xs">👥</span>
                            <span class="text-slate-300">Avg Players</span>
                          </div>
                          <div class="font-bold text-white">{{ Math.round(map.averagePlayerCount) }}</div>
                        </div>
                        
                        <div class="space-y-1">
                          <div class="flex items-center gap-2 text-green-400">
                            <span class="text-xs">🔥</span>
                            <span class="text-slate-300">Peak Players</span>
                          </div>
                          <div class="font-bold text-white">{{ map.peakPlayerCount }}</div>
                        </div>
                        
                        <div class="space-y-1">
                          <div class="flex items-center gap-2 text-purple-400">
                            <span class="text-xs">⏱️</span>
                            <span class="text-slate-300">Play Time</span>
                          </div>
                          <div class="font-bold text-white">{{ Math.round(map.totalPlayTime / 60) }}h</div>
                        </div>
                        
                        <div class="space-y-1">
                          <div class="flex items-center gap-2 text-orange-400">
                            <span class="text-xs">📊</span>
                            <span class="text-slate-300">% of Total</span>
                          </div>
                          <div class="font-bold text-white">{{ map.playTimePercentage.toFixed(1) }}%</div>
                        </div>
                      </div>
                      
                      <!-- Progress bar for play time percentage -->
                      <div class="space-y-1">
                        <div class="w-full bg-slate-600/30 rounded-full h-2">
                          <div 
                            class="h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
                            :style="{ width: `${Math.min(map.playTimePercentage, 100)}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Player Activity Section -->
            <ServerPlayerActivityChart
              :server-insights="serverInsights"
              :is-loading="isInsightsLoading"
              @period-change="handlePeriodChange"
            />
            <div
              v-if="insightsError"
              class="mt-4 bg-red-900/20 border border-red-700/50 rounded-lg p-4"
            >
              <p class="text-red-400 text-sm">{{ insightsError }}</p>
            </div>

            <!-- Leaderboards Section -->
            <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
              <div class="p-2 sm:p-6 border-b border-slate-700/50 flex items-center justify-between">
                <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
                  🏆 Server Leaderboards
                </h3>
                <router-link 
                  :to="`/servers/${encodeURIComponent(serverName)}/rankings`" 
                  class="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium px-4 py-2 bg-slate-700/50 hover:bg-slate-600/70 rounded-lg border border-slate-600/50 hover:border-cyan-500/50 backdrop-blur-sm"
                >
                  View Rankings
                </router-link>
              </div>
              <div class="p-2 sm:p-6">
                <ServerLeaderboards
                  :server-details="serverDetails"
                  :server-name="serverName"
                />
              </div>
            </div>
          </div>

          <!-- No Data State -->
          <div
            v-else
            class="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-12 text-center"
          >
            <div class="text-6xl mb-4 opacity-50">📊</div>
            <p class="text-slate-400 text-lg">No server data available</p>
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
  </div>
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
