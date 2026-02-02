<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ServerDetails, ServerInsights, LeaderboardsData, fetchServerDetails, fetchServerInsights, fetchServerLeaderboards, fetchLiveServerData, ServerBusyIndicator, ServerHourlyTimelineEntry, fetchServerBusyIndicators } from '../services/serverDetailsService';
import { fetchServerEngagementStats, type ServerEngagementStats, fetchServerMapRotation, type MapRotationItem } from '../services/dataExplorerService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { countryCodeToName } from '../types/countryCodes';
import { ServerSummary } from '../types/server';
import PlayersPanel from '../components/PlayersPanel.vue';
import PlayerHistoryChart from '../components/PlayerHistoryChart.vue';
import ServerLeaderboards from '../components/ServerLeaderboards.vue';
import RecentSessionsList from '../components/data-explorer/RecentSessionsList.vue';
import MapRotationTable from '../components/data-explorer/MapRotationTable.vue';
import ServerMapDetailPanel from '../components/data-explorer/ServerMapDetailPanel.vue';
import { formatDate } from '../utils/date';
import HeroBackButton from '../components/HeroBackButton.vue';
import ForecastModal from '../components/ForecastModal.vue';
import discordIcon from '@/assets/discord.webp';
import dataExplorerImage from '@/assets/menu-item-data-explorer.webp';
import { useAIContext } from '@/composables/useAIContext';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// AI Context
const { setContext, clearContext } = useAIContext();

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
const currentLeaderboardPeriod = ref<'week' | 'month' | 'alltime'>('week');
const minPlayersForWeighting = ref(15);
const minRoundsForKillBoards = ref(20);
const historyRollingWindow = ref('7d');
const historyPeriod = ref<'1d' | '3d' | '7d' | 'longer'>('7d');
const longerPeriod = ref<'1month' | '3months' | 'thisyear' | 'alltime'>('1month');
const showLongerDropdown = ref(false);
const showPlayerHistory = ref(false);
const hasLoadedPlayerHistory = ref(false);

// Maps state
const mapRotation = ref<MapRotationItem[]>([]);
const mapRotationPage = ref(1);
const mapRotationPageSize = ref(10);
const mapRotationTotalCount = ref(0);
const mapRotationTotalPages = computed(() => Math.max(1, Math.ceil(mapRotationTotalCount.value / mapRotationPageSize.value)));
const isMapsLoading = ref(false);
const mapsError = ref<string | null>(null);
const hasLoadedMaps = ref(false);
const showMapRotation = ref(true);

// Server-map detail panel state
const selectedMapName = ref<string | null>(null);
const showMapDetailPanel = ref(false);

// Busy indicator state
const serverBusyIndicator = ref<ServerBusyIndicator | null>(null);
const serverHourlyTimeline = ref<ServerHourlyTimelineEntry[]>([]);
const isBusyIndicatorLoading = ref(false);
const busyIndicatorError = ref<string | null>(null);
const showForecastOverlay = ref(false);

// Wide viewport: show slide-out panels side-by-side (lg: 1024px+)
const isWideScreen = ref(false);
const updateWideScreen = () => {
  isWideScreen.value = typeof window !== 'undefined' && window.innerWidth >= 1024;
};

// Engagement stats for dynamic content
const serverEngagementStats = ref<ServerEngagementStats['stats']>([]);
const currentEngagementStatIndex = ref(0);

// Computed property for current engagement stat
const currentEngagementStat = computed(() => {
  return serverEngagementStats.value[currentEngagementStatIndex.value] || null;
});

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

// Fetch engagement stats for dynamic content
const fetchEngagementStatsAsync = async () => {
  if (!serverDetails.value?.serverGuid) return;

  try {
    const response = await fetchServerEngagementStats(serverDetails.value.serverGuid);
    serverEngagementStats.value = response.stats;

    // Start rotating through stats every 6 seconds
    setInterval(() => {
      currentEngagementStatIndex.value = (currentEngagementStatIndex.value + 1) % serverEngagementStats.value.length;
    }, 6000);
  } catch (err) {
    console.error('Error fetching server engagement stats:', err);
    // Use minimal fallback
    serverEngagementStats.value = [
      { value: '0', label: 'rounds this month', context: 'Check back later', message: 'Break down peak hours, hot maps, and top fraggers in Data Explorer' }
    ];
  }
};

// Fetch server details, insights, and leaderboards in parallel
const fetchData = async () => {
  if (!serverName.value) return;

  // Set AI context immediately with server name from route so chat shows correct context before fetch
  setContext({
    pageType: 'server',
    serverName: serverName.value,
    game: 'bf1942'
  });

  isLoading.value = true;
  error.value = null;

  try {
    // Fetch server details first (blocks UI)
    serverDetails.value = await fetchServerDetails(serverName.value);

    // Update AI context with serverGuid once we have it (API uses serverGuid)
    setContext({
      pageType: 'server',
      serverGuid: serverDetails.value?.serverGuid,
      serverName: serverName.value,
      game: serverDetails.value?.gameId || 'bf1942'
    });

    // Fetch live server data and busy indicator data asynchronously after server details are loaded
    fetchLiveServerDataAsync();
    fetchBusyIndicatorData();
    fetchEngagementStatsAsync();

    // Now fetch leaderboards (non-blocking)
    // Player history and maps will be loaded when user expands those sections
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
    const days = getPeriodInDays();
    serverInsights.value = await fetchServerInsights(serverName.value, days, historyRollingWindow.value);
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
      minPlayersForWeighting.value,
      minRoundsForKillBoards.value
    );
  } catch (err) {
    console.error('Error fetching server leaderboards:', err);
    leaderboardsError.value = 'Failed to load server leaderboards.';
  } finally {
    isLeaderboardsLoading.value = false;
  }
};

// Fetch map rotation data asynchronously (non-blocking)
const fetchMapRotationAsync = async (page: number = 1) => {
  if (!serverDetails.value?.serverGuid) return;

  isMapsLoading.value = true;
  mapsError.value = null;

  try {
    const response = await fetchServerMapRotation(
      serverDetails.value.serverGuid,
      page,
      mapRotationPageSize.value
    );
    mapRotation.value = response.maps;
    mapRotationPage.value = response.page;
    mapRotationTotalCount.value = response.totalCount;
  } catch (err) {
    console.error('Error fetching server map rotation:', err);
    mapsError.value = 'Failed to load map rotation.';
  } finally {
    isMapsLoading.value = false;
  }
};

// Handle map rotation page change
const handleMapRotationPageChange = (page: number) => {
  if (page >= 1 && page <= mapRotationTotalPages.value) {
    fetchMapRotationAsync(page);
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

watch(
  () => serverDetails.value?.serverGuid,
  (guid) => {
    if (guid && !hasLoadedMaps.value) {
      hasLoadedMaps.value = true;
      fetchMapRotationAsync();
    }
  },
  { immediate: true }
);

onMounted(() => {
  fetchData();
  updateWideScreen();
  window.addEventListener('resize', updateWideScreen);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWideScreen);
  clearContext();
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
  showMapDetailPanel.value = false;
  showPlayersModal.value = true;
};

const closePlayersModal = () => {
  showPlayersModal.value = false;
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
      minPlayersForWeighting.value,
      minRoundsForKillBoards.value
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
      value,
      minRoundsForKillBoards.value
    );
  } catch (err) {
    console.error('Error refreshing leaderboards with new min players:', err);
    leaderboardsError.value = 'Failed to refresh leaderboards.';
  } finally {
    isLeaderboardsLoading.value = false;
  }
};

// Handle min rounds for kill boards update
const handleMinRoundsUpdate = async (value: number) => {
  minRoundsForKillBoards.value = value;

  // Refetch leaderboards with new min rounds value
  isLeaderboardsLoading.value = true;
  leaderboardsError.value = null;

  try {
    leaderboardsData.value = await fetchServerLeaderboards(
      serverName.value,
      currentLeaderboardPeriod.value,
      minPlayersForWeighting.value,
      value
    );
  } catch (err) {
    console.error('Error refreshing leaderboards with new min rounds:', err);
    leaderboardsError.value = 'Failed to refresh leaderboards.';
  } finally {
    isLeaderboardsLoading.value = false;
  }
};

// Handle rolling window change for player history chart
const handleRollingWindowChange = async (rollingWindow: string) => {
  historyRollingWindow.value = rollingWindow;
  // Refetch insights with new rolling window - the API will recalculate rolling average
  await fetchInsightsAsync();
};

// Convert period string to days for API
const getPeriodInDays = (): number => {
  if (historyPeriod.value === 'longer') {
    switch (longerPeriod.value) {
      case '1month': return 30;
      case '3months': return 90;
      case 'thisyear': {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      }
      case 'alltime': return 36500; // ~100 years
    }
  }

  switch (historyPeriod.value) {
    case '1d': return 1;
    case '3d': return 3;
    case '7d': return 7;
    default: return 7;
  }
};

// Handle period change
const handleHistoryPeriodChange = async (period: '1d' | '3d' | '7d') => {
  historyPeriod.value = period;
  showLongerDropdown.value = false;
  await fetchInsightsAsync();
};

// Handle longer period selection
const selectLongerPeriod = async (period: '1month' | '3months' | 'thisyear' | 'alltime') => {
  longerPeriod.value = period;
  historyPeriod.value = 'longer';
  showLongerDropdown.value = false;
  await fetchInsightsAsync();
};

// Toggle longer period dropdown
const toggleLongerDropdown = () => {
  showLongerDropdown.value = !showLongerDropdown.value;
};

// Get label for longer period button
const getLongerPeriodLabel = () => {
  if (historyPeriod.value !== 'longer') return 'More';
  const labels = {
    '1month': '1 Month',
    '3months': '3 Months',
    'thisyear': 'This Year',
    'alltime': 'All Time'
  };
  return labels[longerPeriod.value];
};

// Toggle player history visibility and fetch data on first expand
const togglePlayerHistory = () => {
  showPlayerHistory.value = !showPlayerHistory.value;

  // Fetch data on first expand
  if (showPlayerHistory.value && !hasLoadedPlayerHistory.value) {
    hasLoadedPlayerHistory.value = true;
    fetchInsightsAsync();
  }
};

// Toggle map rotation section (expand to show maps inline)
const toggleMapRotation = () => {
  showMapRotation.value = !showMapRotation.value;
  if (showMapRotation.value && !hasLoadedMaps.value) {
    hasLoadedMaps.value = true;
    fetchMapRotationAsync();
  }
};

// Handle map navigation from MapRotationTable - open same server-map detail panel as DataExplorer
const handleMapNavigate = (mapName: string) => {
  if (!serverDetails.value?.serverGuid) return;
  showPlayersModal.value = false;
  selectedMapName.value = mapName;
  showMapDetailPanel.value = true;
};

// Handle close map detail panel
const handleCloseMapDetailPanel = () => {
  showMapDetailPanel.value = false;
  selectedMapName.value = null;
};

// Handle navigation from map detail panel
const handleNavigateToServerFromMap = (_serverGuid: string) => {
  // Already on server details page, just close the panel
  handleCloseMapDetailPanel();
};

const handleNavigateToMapFromMap = (mapName: string) => {
  // Navigate to map detail in Data Explorer
  router.push({
    name: 'explore-map-detail',
    params: { mapName }
  });
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
  <div class="portal-page">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
  <!-- Full-width Hero Section -->
  <div class="w-full rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] mb-6">
    <div class="w-full px-2 sm:px-6 lg:px-12 py-6">
      <div class="flex items-center justify-between">
        <HeroBackButton :on-click="() => $router.push(getServersRoute(serverDetails?.gameId || (liveServerInfo?.gameType as string)))" />
      </div>
      
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 mt-6">
        <!-- Server Info -->
        <div class="flex-grow min-w-0">
          <h1 class="text-3xl md:text-4xl font-bold text-neutral-200 mb-3">
            {{ serverName }}
          </h1>
          
          <!-- Server Metadata -->
          <div
            v-if="serverDetails && (serverDetails.region || serverDetails.country || serverDetails.timezone || liveServerInfo?.discordUrl || liveServerInfo?.forumUrl)"
            class="flex flex-wrap gap-3 mb-4"
          >
            <div
              v-if="serverDetails.region"
              class="inline-flex items-center px-3 py-1 bg-neutral-800 rounded-lg text-sm text-neutral-300 border border-neutral-700"
            >
              📍 {{ serverDetails.region }}
            </div>
            <div
              v-if="serverDetails.country || serverDetails.countryCode"
              class="inline-flex items-center px-3 py-1 bg-neutral-800 rounded-lg text-sm text-neutral-300 border border-neutral-700"
            >
              🌍 {{ getCountryName(serverDetails.countryCode, serverDetails.country) }}
            </div>
            <div
              v-if="serverDetails.timezone && getTimezoneDisplay(serverDetails.timezone)"
              class="inline-flex items-center px-3 py-1 bg-neutral-800 rounded-lg text-sm text-neutral-300 border border-neutral-700"
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
            class="text-neutral-400 text-sm"
          >
            📊 Data from {{ formatDate(serverDetails.startPeriod) }} to {{ formatDate(serverDetails.endPeriod) }}
          </div>

          <!-- Server Activity Forecast Widget (Ultra Condensed) -->
          <div
            v-if="serverBusyIndicator && serverHourlyTimeline.length > 0"
            class="mt-3 bg-neutral-800/50 rounded-lg p-2 border border-neutral-700/50 group/forecast relative inline-block cursor-pointer"
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
                  :class="entry.isCurrentHour ? 'bg-cyan-400' : 'bg-neutral-600'"
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
            class="mt-4 bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50"
          >
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <span class="text-sm text-neutral-400">Loading activity forecast...</span>
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
            type="button"
            @click.stop="openPlayersModal"
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
            class="bg-neutral-800 text-neutral-400 rounded-xl border border-neutral-700 px-4 py-3 min-w-[140px] cursor-pointer hover:bg-neutral-700/80 transition-colors"
            role="button"
            tabindex="0"
            @click.stop="openPlayersModal"
            @keydown.enter.prevent="openPlayersModal"
            @keydown.space.prevent="openPlayersModal"
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
            class="bg-neutral-800 text-neutral-400 rounded-xl border border-neutral-700 flex items-center justify-center gap-3 px-4 py-3 min-w-[140px]"
          >
            <div class="w-4 h-4 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>

          <!-- Join Server Button -->
          <button
            v-if="liveServerInfo?.joinLink"
            class="bg-cyan-500 hover:bg-cyan-400 text-neutral-900 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-bold shadow-lg hover:shadow-cyan-500/40"
            @click="joinServer"
          >
            <span class="text-base">🎮</span>
            <span>Join Server</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area: flex row on lg when a panel is open for side-by-side layout -->
  <div class="min-h-screen bg-neutral-950">
    <div
      class="relative flex flex-col min-h-0"
      :class="{ 'lg:flex-row': showPlayersModal || showMapDetailPanel }"
    >
      <div
        class="flex-1 min-w-0"
        @click="closeForecastOverlay"
      >
        <div class="relative">
          <div class="relative py-6 sm:py-8">
            <div class="w-full px-2 sm:px-6 lg:px-12">
          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center py-20 text-neutral-400"
          >
            <div class="w-12 h-12 border-4 border-neutral-700 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <p class="text-lg text-neutral-300">
              Loading server profile...
            </p>
          </div>

          <!-- Error State -->
          <div
            v-else-if="error"
            class="bg-neutral-900/80 border border-red-800/50 rounded-xl p-8 text-center"
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
            class="space-y-4 sm:space-y-6"
          >
            <!-- Data Explorer Call-to-Action Section -->
            <div class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden">
              <div class="p-3 sm:p-6">
                <div class="flex flex-col lg:flex-row items-center gap-6">
                  <!-- Data Explorer Image -->
                  <div class="flex-shrink-0">
                    <div class="relative group">
                      <div class="absolute -inset-2 bg-cyan-500 rounded-xl blur-lg opacity-20 group-hover:opacity-35 transition-opacity duration-300"></div>
                      <img
                        :src="dataExplorerImage"
                        alt="Data Explorer"
                        class="relative w-20 h-20 lg:w-24 lg:h-24 rounded-xl object-cover shadow-2xl"
                      />
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 text-center lg:text-left">
                    <h3 class="text-xl font-semibold text-neutral-200 mb-2">
                      Explore Advanced Analytics
                    </h3>
                    <p class="text-neutral-300 text-sm mb-4 transition-all duration-500 ease-in-out">
                      <span v-if="currentEngagementStat && currentEngagementStat.message">
                        {{ currentEngagementStat.message }}
                      </span>
                      <span v-else>
                        Break down peak hours, hot maps, and top fraggers in Data Explorer
                      </span>
                    </p>

                    <!-- CTA Button -->
                    <router-link
                      :to="{ name: 'explore-server-detail', params: { serverGuid: serverDetails?.serverGuid } }"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-600 hover:border-neutral-500 text-neutral-300 hover:text-white rounded-md transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                    >
                      <span>View in Data Explorer</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-0.5">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </router-link>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Sessions Section -->
<div class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden">
            <div class="px-3 sm:px-6 py-4 border-b border-neutral-700/50 flex items-center justify-between">
                <h3 class="text-xl font-semibold text-neutral-200 flex items-center gap-3">
                  🎯 Recent Sessions
                </h3>
                <router-link
                  :to="`/servers/${encodeURIComponent(serverName)}/sessions`"
                  class="inline-flex items-center gap-1.5 text-neutral-300 hover:text-neutral-200 transition-colors text-sm font-medium group"
                >
                  <span>View All Sessions</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform group-hover:translate-x-0.5"
                  >
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </router-link>
              </div>
              <div class="p-3 sm:p-6">
                <RecentSessionsList
                  v-if="serverDetails?.serverGuid"
                  :server-guid="serverDetails.serverGuid"
                  :server-name="serverName"
                  :limit="5"
                  :initial-visible-count="2"
                  empty-message="No recent sessions found for this server"
                />
              </div>
            </div>

            <!-- Map Rotation Section (Collapsible: expand to show maps, click map to open ServerMapDetailPanel) -->
            <div class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden">
              <button
                class="w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-all duration-300 group"
                @click="toggleMapRotation"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                    <span class="text-neutral-200 text-sm font-bold">🗺️</span>
                  </div>
                  <div class="text-left">
                    <div class="text-base font-semibold text-neutral-200">
                      Map Rotation
                    </div>
                    <div class="text-xs text-neutral-400">
                      Server map rotation and statistics — click a map for details
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-neutral-400 hidden sm:block">{{ showMapRotation ? 'Hide' : 'Show' }}</span>
                  <div
                    class="transform transition-transform duration-300"
                    :class="{ 'rotate-180': showMapRotation }"
                  >
                    <svg
                      class="w-5 h-5 text-neutral-400 group-hover:text-neutral-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </button>

              <div v-if="showMapRotation" class="border-t border-neutral-700/50">
                <div v-if="mapRotation.length > 0" class="bg-neutral-800/30 overflow-hidden relative">
                  <div
                    v-if="isMapsLoading"
                    class="absolute inset-0 bg-neutral-900/80 rounded-xl flex items-center justify-center z-10"
                  >
                    <div class="flex flex-col items-center gap-3">
                      <div class="w-8 h-8 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
                      <div class="text-orange-400 text-sm font-medium">Loading map rotation...</div>
                    </div>
                  </div>
                  <div class="p-3 sm:p-6">
                    <MapRotationTable
                      :map-rotation="mapRotation"
                      :current-page="mapRotationPage"
                      :total-pages="mapRotationTotalPages"
                      :total-count="mapRotationTotalCount"
                      :page-size="mapRotationPageSize"
                      :is-loading="isMapsLoading"
                      @navigate="handleMapNavigate"
                      @page-change="handleMapRotationPageChange"
                    />
                  </div>
                </div>
                <div v-else-if="isMapsLoading" class="p-6 flex justify-center py-8">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
                    <div class="text-orange-400 text-sm font-medium">Loading map rotation...</div>
                  </div>
                </div>
                <div v-else-if="mapsError" class="p-3 sm:p-6">
                  <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                    <span class="text-sm text-red-400">{{ mapsError }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Player Activity History Section (Collapsible) -->
            <div class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden">
              <!-- Toggle Button -->
              <button
                class="w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-all duration-300 group"
                @click="togglePlayerHistory"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                    <span class="text-neutral-200 text-sm font-bold">📈</span>
                  </div>
                  <div class="text-left">
                    <div class="text-base font-semibold text-neutral-200">
                      Player Activity History
                    </div>
                    <div class="text-xs text-neutral-400">
                      Server population trends
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-neutral-400 hidden sm:block">{{ showPlayerHistory ? 'Hide' : 'Show' }}</span>
                  <div
                    class="transform transition-transform duration-300"
                    :class="{ 'rotate-180': showPlayerHistory }"
                  >
                    <svg
                      class="w-5 h-5 text-neutral-400 group-hover:text-neutral-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              <!-- Collapsible Content -->
              <div
                v-if="showPlayerHistory"
                class="border-t border-neutral-700/50"
              >
                <div
                  v-if="serverInsights?.playersOnlineHistory"
                  class="animate-in slide-in-from-top duration-300"
                >
                  <!-- Period Selector -->
                  <div class="px-6 py-4 bg-neutral-800/30 flex justify-center">
                    <div class="flex items-center gap-2 bg-neutral-800/30 rounded-lg p-1">
                      <!-- Short periods -->
                      <button
                        v-for="period in ['1d', '3d', '7d']"
                        :key="period"
                        :class="[
                          'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                          historyPeriod === period
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
                        ]"
                        @click="handleHistoryPeriodChange(period as '1d' | '3d' | '7d')"
                      >
                        {{ period === '1d' ? '24h' : period === '3d' ? '3 days' : '7 days' }}
                      </button>

                      <!-- Longer periods dropdown -->
                      <div class="relative">
                        <button
                          :class="[
                            'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1',
                            historyPeriod === 'longer'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
                          ]"
                          @click="toggleLongerDropdown"
                        >
                          {{ getLongerPeriodLabel() }}
                          <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        <!-- Dropdown menu -->
                        <div
                          v-if="showLongerDropdown"
                          class="absolute top-full mt-1 right-0 bg-neutral-900/95 rounded-lg border border-neutral-700/50 shadow-xl z-50 min-w-[120px]"
                        >
                          <button
                            v-for="period in [{ id: '1month', label: '1 Month' }, { id: '3months', label: '3 Months' }, { id: 'thisyear', label: 'This Year' }, { id: 'alltime', label: 'All Time' }]"
                            :key="period.id"
                            :class="[
                              'w-full text-left px-3 py-2 text-xs hover:bg-neutral-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg',
                              longerPeriod === period.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-300'
                            ]"
                            @click="selectLongerPeriod(period.id as '1month' | '3months' | 'thisyear' | 'alltime')"
                          >
                            {{ period.label }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Chart -->
                  <div class="p-3 sm:p-6">
                    <PlayerHistoryChart
                      :chart-data="serverInsights.playersOnlineHistory.dataPoints"
                      :insights="serverInsights.playersOnlineHistory.insights"
                      :period="serverInsights.playersOnlineHistory.period"
                      :rolling-window="historyRollingWindow"
                      :loading="isInsightsLoading"
                      :error="insightsError"
                      @rolling-window-change="handleRollingWindowChange"
                    />
                  </div>
                </div>
                <div
                  v-else-if="isInsightsLoading"
                  class="p-3 sm:p-6"
                >
                  <div class="flex items-center justify-center py-8">
                    <div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Server Rankings & Leaderboards Section -->
            <div class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden">
              <div class="px-3 sm:px-6 py-4 border-b border-neutral-700/50">
                <h3 class="text-xl font-semibold text-neutral-200 flex items-center gap-3">
                  🏆 Player Statistics & Rankings
                </h3>
              </div>

              <!-- Prominent Full-Width Rankings Button -->
              <div class="px-6 pt-6 pb-4">
                <div class="relative group">
                  <!-- Background Glow Effect -->
                  <div class="absolute -inset-0.5 bg-cyan-500 rounded-lg blur opacity-20 group-hover:opacity-35 transition duration-300" />

                  <!-- Main Button -->
                  <router-link
                    :to="{ name: 'explore-server-detail', params: { serverGuid: serverDetails?.serverGuid } }"
                    class="relative group/btn block w-full bg-neutral-800 border border-neutral-700 rounded-lg p-4 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 hover:border-neutral-600"
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
              <div class="px-3 sm:px-6 pb-6">
                <ServerLeaderboards
                  :leaderboards-data="leaderboardsData"
                  :is-loading="isLeaderboardsLoading"
                  :error="leaderboardsError"
                  :server-name="serverName"
                  :server-guid="serverDetails.serverGuid"
                  :min-players-for-weighting="minPlayersForWeighting"
                  :min-rounds-for-kill-boards="minRoundsForKillBoards"
                  @update-min-players-for-weighting="handleMinPlayersUpdate"
                  @update-min-rounds-for-kill-boards="handleMinRoundsUpdate"
                  @period-change="handleLeaderboardPeriodChange"
                />
              </div>
            </div>
          </div>

          <!-- No Data State -->
          <div
            v-else
            class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl p-12 text-center"
          >
            <div class="text-6xl mb-4 opacity-50">
              📊
            </div>
            <p class="text-neutral-400 text-lg">
              No server data available
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>

      <!-- Players Panel: overlay on mobile, side-by-side on lg when space allows (must be inside flex container) -->
      <div
        v-if="showPlayersModal"
        class="fixed inset-0 md:right-20 z-[100] lg:relative lg:inset-auto lg:z-auto lg:w-[640px] xl:w-[720px] 2xl:w-[800px] lg:mr-20 lg:flex-shrink-0 lg:border-l lg:border-neutral-800 lg:min-h-0"
      >
      <PlayersPanel
        :show="showPlayersModal"
        :server="liveServerInfo"
        :inline="isWideScreen"
        @close="closePlayersModal"
      />
      </div>

      <!-- Server Map Detail Panel: overlay on mobile, side-by-side on lg when space allows (same as DataExplorer server→map view) -->
    <template v-if="showMapDetailPanel && selectedMapName && serverDetails?.serverGuid">
      <div
        class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] lg:hidden"
        aria-hidden="true"
        @click="handleCloseMapDetailPanel"
      />
      <div
        class="fixed inset-y-0 left-0 right-0 md:right-20 z-[100] flex items-stretch lg:relative lg:inset-auto lg:z-auto lg:w-[720px] xl:w-[840px] 2xl:w-[960px] lg:mr-20 lg:flex-shrink-0 lg:min-h-0 lg:border-l lg:border-neutral-800"
        @click.stop
      >
        <div
          class="bg-neutral-950 w-full max-w-6xl lg:max-w-none shadow-2xl animate-slide-in-left overflow-hidden flex flex-col border-r border-neutral-800 lg:border-r-0"
          :class="{ 'h-[calc(100vh-4rem)]': true, 'md:h-full': true, 'mt-16': true, 'md:mt-0': true }"
        >
      <!-- Header -->
      <div class="sticky top-0 z-20 bg-neutral-950/95 border-b border-neutral-800 p-4 flex justify-between items-center">
        <div class="flex flex-col min-w-0 flex-1 mr-4">
          <h2 class="text-xl font-bold text-neutral-200 truncate">
            {{ selectedMapName }}
          </h2>
          <p class="text-sm text-neutral-400 mt-1 truncate">
            on {{ serverName }}
          </p>
        </div>
        <button 
          class="group p-2 text-neutral-400 hover:text-white hover:bg-red-500/20 border border-neutral-600 hover:border-red-500/50 rounded-lg transition-all duration-300 flex items-center justify-center w-10 h-10 flex-shrink-0"
          title="Close panel"
          @click="handleCloseMapDetailPanel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="group-hover:text-red-400"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 min-h-0 overflow-y-auto">
        <ServerMapDetailPanel
          :server-guid="serverDetails.serverGuid"
          :map-name="selectedMapName"
          @navigate-to-server="handleNavigateToServerFromMap"
          @navigate-to-map="handleNavigateToMapFromMap"
          @close="handleCloseMapDetailPanel"
        />
      </div>
        </div>
      </div>
    </template>
      </div>
  </div>
    </div>
  </div>
</template>

<style src="./portal-layout.css"></style>
<style scoped>
/* Map-details style: darker, sleeker slate theme (no neon overrides) */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #171717;
}

::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #525252;
}
</style>
