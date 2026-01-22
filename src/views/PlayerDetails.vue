<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats } from '../services/playerStatsService';
import { TrendDataPoint, PlayerAchievementGroup } from '../types/playerStatsTypes';
// Removed unused imports - BestScores, BestScoreEntry
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import PlayerAchievementSummary from '../components/PlayerAchievementSummary.vue';
import PlayerRecentSessions from '../components/PlayerRecentSessions.vue';
import HeroBackButton from '../components/HeroBackButton.vue';
import PlayerAchievementHeroBadges from '../components/PlayerAchievementHeroBadges.vue';

import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';
import defaultIcon from '@/assets/servers.webp';
import dataExplorerImage from '@/assets/menu-item-data-explorer.webp';
import { fetchPlayerEngagementStats, type PlayerEngagementStats } from '../services/dataExplorerService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Router
const router = useRouter();
const route = useRoute();

const playerName = ref(route.params.playerName as string);
const playerStats = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showTrendCharts = ref(false);
const trendChartHideTimeout = ref<NodeJS.Timeout | null>(null);
const trendChartHoverCount = ref(0);
const showLastOnline = ref(false);
const achievementGroups = ref<PlayerAchievementGroup[]>([]);
const achievementGroupsLoading = ref(false);
const achievementGroupsError = ref<string | null>(null);

// Engagement stats for dynamic content
const playerEngagementStats = ref<PlayerEngagementStats['stats']>([]);
const currentEngagementStatIndex = ref(0);

// Computed property for current engagement stat
const currentEngagementStat = computed(() => {
  return playerEngagementStats.value[currentEngagementStatIndex.value] || null;
});

// New state for map stats
const expandedServerId = ref<string | null>(null);
const mapStats = ref<any[]>([]);
const mapStatsLoading = ref(false);
const selectedTimeRange = ref('Last30Days');

// Modal state for map statistics
const showMapModal = ref(false);
const selectedServerGuid = ref<string | null>(null);
const timeRangeOptions = [
  { value: 'Last30Days', label: '30 days' },
  { value: 'ThisYear', label: 'This Year' },
  { value: 'LastYear', label: 'Past Year' }
];

// New state for map stats sorting
const mapStatsSortField = ref('totalScore');
const mapStatsSortDirection = ref('desc');

// Best Scores state
const selectedBestScoresTab = ref<'allTime' | 'last30Days' | 'thisWeek'>('thisWeek');
const bestScoresTabOptions = [
  { key: 'allTime' as const, label: 'All Time' },
  { key: 'last30Days' as const, label: '30 Days' },
  { key: 'thisWeek' as const, label: 'This Week' }
] as const;

// Function to handle best scores tab change with scroll reset
const changeBestScoresTab = (tabKey: 'allTime' | 'last30Days' | 'thisWeek') => {
  selectedBestScoresTab.value = tabKey;
  
  // Reset scroll position of horizontal scroll container on mobile
  setTimeout(() => {
    const scrollContainer = document.querySelector('.best-scores-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollLeft = 0;
    }
  }, 50); // Small delay to ensure DOM has updated
};


// Computed properties for trend charts
const killRateTrendChartData = computed(() => {
  if (!playerStats.value?.recentStats?.killRateTrend) return { labels: [], datasets: [] };

  const trend = playerStats.value.recentStats.killRateTrend;
  const labels = trend.map((point: TrendDataPoint) => new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const data = trend.map((point: TrendDataPoint) => point.value);

  return {
    labels,
    datasets: [{
      label: 'Kill Rate',
      data,
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: '#4CAF50',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1,
    }]
  };
});

const kdRatioTrendChartData = computed(() => {
  if (!playerStats.value?.recentStats?.kdRatioTrend) return { labels: [], datasets: [] };

  const trend = playerStats.value.recentStats.kdRatioTrend;
  const labels = trend.map((point: TrendDataPoint) => new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const data = trend.map((point: TrendDataPoint) => point.value);

  return {
    labels,
    datasets: [{
      label: 'K/D Ratio',
      data,
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: '#a855f7',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1,
    }]
  };
});

const microChartOptions = computed(() => {
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
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: isDarkMode ? '#9c27b0' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        padding: 8,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
        callbacks: {
          title: function(context: any[]) {
            return context[0].label;
          },
          label: function(context: any) {
            const label = context.dataset.label;
            const value = context.parsed.y;
            if (label === 'Kill Rate') {
              return `${value.toFixed(3)} k/min`;
            } else if (label === 'K/D Ratio') {
              return `${value.toFixed(2)}`;
            }
            return `${value.toFixed(2)}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 2
      },
      line: {
        borderWidth: 1
      }
    }
  };
});

// Function to fetch map stats for a server
const fetchMapStats = async (serverGuid: string) => {
  mapStatsLoading.value = true;
  try {
    const response = await fetch(`/stats/players/${encodeURIComponent(playerName.value)}/server/${serverGuid}/mapstats?range=${selectedTimeRange.value}`);
    if (!response.ok) throw new Error('Failed to fetch map stats');
    const newData = await response.json();
    
    // Only update data after successful fetch to prevent flash
    mapStats.value = newData;
  } catch (err) {
    console.error('Error fetching map stats:', err);
    // Only clear on error if no existing data
    if (mapStats.value.length === 0) {
      mapStats.value = [];
    }
  } finally {
    mapStatsLoading.value = false;
  }
};

// Function to toggle server expansion and fetch map stats removed - was unused

// Function to open map modal
const openMapModal = async (serverGuid: string) => {
  selectedServerGuid.value = serverGuid;
  showMapModal.value = true;
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
  await fetchMapStats(serverGuid);
};

// Function to close map modal
const closeMapModal = () => {
  showMapModal.value = false;
  selectedServerGuid.value = null;
  // Restore body scrolling when modal is closed
  document.body.style.overflow = 'unset';
};

// Watch for time range changes
watch(selectedTimeRange, async () => {
  if (expandedServerId.value) {
    await fetchMapStats(expandedServerId.value);
  }
  if (selectedServerGuid.value) {
    await fetchMapStats(selectedServerGuid.value);
  }
});

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  fetchAchievementGroups();
  try {
    playerStats.value = await fetchPlayerStats(playerName.value);
    // Fetch engagement stats after player stats are loaded
    if (playerStats.value) {
      fetchEngagementStatsAsync();
    }
  } catch (err) {
    error.value = `Failed to fetch player stats for ${playerName.value}.`;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const fetchAchievementGroups = async () => {
  achievementGroupsLoading.value = true;
  achievementGroupsError.value = null;
  try {
    const response = await fetch(`/stats/gamification/player/${encodeURIComponent(playerName.value)}/achievement-groups`);
    if (!response.ok) throw new Error('Failed to fetch achievement groups');
    achievementGroups.value = await response.json();
  } catch (err) {
    console.error('Error fetching achievement groups:', err);
    achievementGroupsError.value = 'Failed to load achievements.';
    achievementGroups.value = [];
  } finally {
    achievementGroupsLoading.value = false;
  }
};

// Fetch engagement stats for dynamic content
const fetchEngagementStatsAsync = async () => {
  try {
    const response = await fetchPlayerEngagementStats(playerName.value, 'bf1942');
    playerEngagementStats.value = response.stats;

    // Start rotating through stats every 6 seconds
    setInterval(() => {
      currentEngagementStatIndex.value = (currentEngagementStatIndex.value + 1) % playerEngagementStats.value.length;
    }, 6000);
  } catch (err) {
    console.error('Error fetching player engagement stats:', err);
    // Use minimal fallback
    playerEngagementStats.value = [
      { value: '0', label: 'stats available', context: 'Keep playing!' }
    ];
  }
};

// Format minutes to hours and minutes
const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};


// Format date to a human-readable relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
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

// Function to navigate to round report using best score data
const navigateToRoundReport = (roundId: string) => {
  router.push({
    name: 'round-report',
    params: {
      roundId: roundId,
    },
    query: {
      players: playerName.value // Include the player name to pin them
    }
  });
};

// Function to change sort field and direction for map stats
const changeMapStatsSort = (field: string) => {
  if (mapStatsSortField.value === field) {
    // Toggle direction if clicking the same field
    mapStatsSortDirection.value = mapStatsSortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new field and default to descending
    mapStatsSortField.value = field;
    mapStatsSortDirection.value = 'desc';
  }
};

// Functions to handle sticky trend chart hover behavior using hover counter
const enterTrendChartArea = () => {
  trendChartHoverCount.value++;
  showTrendCharts.value = true;
  // Clear any pending hide timeout
  if (trendChartHideTimeout.value) {
    clearTimeout(trendChartHideTimeout.value);
    trendChartHideTimeout.value = null;
  }
};

const leaveTrendChartArea = () => {
  trendChartHoverCount.value = Math.max(0, trendChartHoverCount.value - 1);
  // Only hide if no areas are being hovered
  if (trendChartHoverCount.value === 0) {
    trendChartHideTimeout.value = setTimeout(() => {
      showTrendCharts.value = false;
      trendChartHideTimeout.value = null;
    }, 800); // Longer delay for moving between charts
  }
};



// Computed property to sort map stats
const sortedMapStats = computed(() => {
  if (!mapStats.value) return [];

  return [...mapStats.value].sort((a, b) => {
    const direction = mapStatsSortDirection.value === 'asc' ? 1 : -1;

    switch (mapStatsSortField.value) {
      case 'mapName':
        return direction * a.mapName.localeCompare(b.mapName);
      case 'totalScore':
        return direction * (a.totalScore - b.totalScore);
      case 'kdRatio': {
        const aKdr = a.totalDeaths === 0 ? a.totalKills : a.totalKills / a.totalDeaths;
        const bKdr = b.totalDeaths === 0 ? b.totalKills : b.totalKills / b.totalDeaths;
        return direction * (aKdr - bKdr);
      }
      case 'totalKills':
        return direction * (a.totalKills - b.totalKills);
      case 'totalDeaths':
        return direction * (a.totalDeaths - b.totalDeaths);
      case 'sessionsPlayed':
        return direction * (a.sessionsPlayed - b.sessionsPlayed);
      case 'totalPlayTimeMinutes':
        return direction * (a.totalPlayTimeMinutes - b.totalPlayTimeMinutes);
      default:
        return direction * (a.totalScore - b.totalScore);
    }
  });
});

// Computed property to get the current expanded server's name removed - was unused

// Computed property to get the selected server's name for modal
const selectedServerName = computed(() => {
  if (!selectedServerGuid.value || !playerStats.value?.insights?.serverRankings) return null;
  
  const server = playerStats.value.insights.serverRankings.find(
    ranking => ranking.serverGuid === selectedServerGuid.value
  );
  
  return server?.serverName || null;
});

// Computed property for current best scores
const currentBestScores = computed(() => {
  if (!playerStats.value?.bestScores) return [];
  return playerStats.value.bestScores[selectedBestScoresTab.value] || [];
});



onMounted(() => {
  fetchData();
  document.addEventListener('click', closeTooltipOnClickOutside);
});

const gameIcons: { [key: string]: string } = {
  bf1942: bf1942Icon,
  fh2: fh2Icon,
  bfv: bfvIcon,
};

const getGameIcon = (gameId: string): string => {
  if (!gameId) return defaultIcon;
  return gameIcons[gameId.toLowerCase()] || defaultIcon;
};

// --- Server Cards Computed ---
const hasServers = computed(() => !!playerStats.value?.servers && playerStats.value.servers.length > 0);
const sortedServers = computed(() => {
  if (!playerStats.value?.servers) return [];
  // Sort by totalMinutes descending
  return [...playerStats.value.servers].sort((a, b) => b.totalMinutes - a.totalMinutes);
});
// ... existing code ...





// Add watcher for route changes to update playerName and refetch data
watch(
  () => route.params.playerName,
  (newName, oldName) => {
    if (newName !== oldName) {
      playerName.value = newName as string;
      fetchData();
    }
  }
);

// Close tooltip when clicking outside
const closeTooltipOnClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.group.cursor-pointer')) {
    showLastOnline.value = false;
  }
};

// Cleanup function to restore body scroll and remove event listener when component unmounts
onUnmounted(() => {
  document.body.style.overflow = 'unset';
  document.removeEventListener('click', closeTooltipOnClickOutside);

  // Clear any pending trend chart hide timeout
  if (trendChartHideTimeout.value) {
    clearTimeout(trendChartHideTimeout.value);
  }
});

</script>

<template>
  <!-- Full-width Hero Section -->
  <div class="w-full bg-slate-800 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between mb-6">
        <HeroBackButton fallback-route="/players" />
      </div>
      
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
        <!-- Player Avatar Section (hidden on mobile) -->
        <div class="hidden lg:block flex-shrink-0">
          <div class="relative group cursor-pointer" @click="showLastOnline = !showLastOnline">
            <!-- Avatar -->
            <div class="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-1 transition-all duration-300 group-hover:scale-105"
                 :class="playerStats?.isActive ? 'animate-spin-slow' : 'animate-none'">
              <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xl font-bold text-slate-900">
                  {{ playerName?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>
            </div>
            <!-- Online/Offline Status Indicator -->
            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 flex items-center justify-center"
                 :class="playerStats?.isActive ? 'bg-green-500' : 'bg-slate-600'">
              <div v-if="playerStats?.isActive" class="w-2 h-2 bg-green-300 rounded-full animate-ping" />
              <div v-else class="w-2 h-2 bg-slate-400 rounded-full" />
            </div>
            <!-- Last Online Tooltip -->
            <div
              v-if="showLastOnline"
              class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap z-50 shadow-lg"
            >
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="playerStats?.isActive ? 'bg-green-400' : 'bg-slate-500'" />
                <span>
                  {{ playerStats?.isActive ? 'Currently Online' : `Last online: ${formatRelativeTime(playerStats?.lastPlayed || '')}` }}
                </span>
              </div>
              <!-- Arrow pointing up -->
              <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
            </div>
          </div>
        </div>

        <!-- Player Info -->
        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-4 flex-wrap mb-3">
            <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              {{ playerName }}
            </h1>
            <PlayerAchievementHeroBadges
              :player-name="playerName"
            />
          </div>
          
          <!-- Player Stats Summary -->
          <div class="flex items-center gap-6 text-slate-300 flex-wrap">
            <!-- K/D Ratio with Hover Trends -->
            <div class="relative" @mouseenter="enterTrendChartArea" @mouseleave="leaveTrendChartArea">
              <div class="flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg px-4 py-2 hover:border-purple-500/60 transition-all duration-200 cursor-pointer">
                <div class="text-center">
                  <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    {{ calculateKDR(playerStats?.totalKills || 0, playerStats?.totalDeaths || 0) }}
                  </div>
                  <div class="text-xs text-slate-400 font-medium">K/D</div>
                </div>
                <div class="w-px h-8 bg-gradient-to-b from-purple-500/50 to-transparent" />
                <div class="flex gap-4 text-sm">
                  <div class="text-center">
                    <div class="font-bold text-green-400">{{ playerStats?.totalKills?.toLocaleString() }}</div>
                    <div class="text-xs text-slate-400">K</div>
                  </div>
                  <div class="text-center">
                    <div class="font-bold text-red-400">{{ playerStats?.totalDeaths?.toLocaleString() }}</div>
                    <div class="text-xs text-slate-400">D</div>
                  </div>
                </div>
              </div>

              <!-- Trend Charts - Show on Hover (stays visible while hovering) -->
              <div
                v-if="showTrendCharts"
                class="absolute left-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-3 w-80 z-50 shadow-2xl transition-all duration-200"
                @mouseenter="enterTrendChartArea"
                @mouseleave="leaveTrendChartArea"
              >
                <!-- Chart content wrapper -->
                <div class="space-y-2">
                  <!-- Kill Rate Trend Mini -->
                  <div class="space-y-1">
                    <div class="text-xs font-semibold text-slate-300">Kill Rate Trend</div>
                    <div class="h-10 -mx-1 trend-chart-container">
                      <Line
                        :data="killRateTrendChartData"
                        :options="microChartOptions"
                      />
                    </div>
                  </div>
                  <!-- K/D Ratio Trend Mini -->
                  <div class="space-y-1">
                    <div class="text-xs font-semibold text-slate-300">K/D Trend</div>
                    <div class="h-10 -mx-1 trend-chart-container">
                      <Line
                        :data="kdRatioTrendChartData"
                        :options="microChartOptions"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-cyan-400"
              ><circle
                cx="12"
                cy="12"
                r="10"
              /><polyline points="12,6 12,12 16,14" /></svg>
              <span class="font-medium">{{ formatPlayTime(playerStats?.totalPlayTimeMinutes || 0) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-green-400"
              ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>
              <span>{{ formatRelativeTime(playerStats?.lastPlayed || '') }}</span>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="flex flex-col gap-4 items-end">
          <!-- Quick Actions -->
          <div class="flex flex-col sm:flex-row gap-3">
            <router-link 
              :to="{ path: '/players/compare', query: { player1: playerName } }"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200"
              title="Compare this player with another"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
              </svg>
              Compare Player
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="min-h-screen bg-slate-900">
    <div class="relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
        >
          <div class="relative">
            <div class="w-20 h-20 border-4 border-slate-700 rounded-full animate-spin">
              <div class="absolute top-0 left-0 w-20 h-20 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div class="text-center space-y-2">
            <p class="text-xl font-semibold text-slate-300">
              Loading Player Statistics...
            </p>
            <p class="text-slate-500">
              Analyzing battlefield performance data
            </p>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
        >
          <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-red-400"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <line
                x1="15"
                y1="9"
                x2="9"
                y2="15"
              />
              <line
                x1="9"
                y1="9"
                x2="15"
                y2="15"
              />
            </svg>
          </div>
          <div class="text-center space-y-2">
            <p class="text-xl font-semibold text-red-400">
              {{ error }}
            </p>
            <p class="text-slate-500">
              Unable to load player data
            </p>
          </div>
        </div>

        <!-- Main Content -->
        <div
          v-else-if="playerStats"
          class="max-w-7xl mx-auto px-3 sm:px-6 pb-6 sm:pb-12 space-y-4 sm:space-y-8"
        >
          <!-- Data Explorer Call-to-Action Section -->
          <div class="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <div class="p-6">
              <div class="flex flex-col lg:flex-row items-center gap-6">
                <!-- Data Explorer Image -->
                <div class="flex-shrink-0">
                  <div class="relative group">
                    <div class="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <img
                      :src="dataExplorerImage"
                      alt="Data Explorer"
                      class="relative w-20 h-20 lg:w-24 lg:h-24 rounded-xl object-cover shadow-2xl"
                    />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 text-center lg:text-left">
                  <h3 class="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Explore Advanced Analytics
                  </h3>
                  <p class="text-slate-300 text-sm mb-4 transition-all duration-500 ease-in-out">
                    <span v-if="currentEngagementStat">
                      Track <strong class="text-cyan-400">{{ currentEngagementStat.value }}</strong> {{ currentEngagementStat.label }}
                      <span v-if="currentEngagementStat.context" class="text-slate-400">• {{ currentEngagementStat.context }}</span>
                    </span>
                    <span v-else>
                      Discover detailed performance analytics and competitive insights
                    </span>
                  </p>

                  <!-- CTA Button -->
                  <router-link
                    :to="{ name: 'explore-player-detail', params: { playerName: playerName } }"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white rounded-md transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
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

          <!-- Recent Rounds Section -->
          <div
            v-if="playerStats.recentSessions && playerStats.recentSessions.length > 0"
            class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
          >
            <div class="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
                🎯 Recent Rounds
              </h3>
              <router-link
                :to="`/players/${encodeURIComponent(playerName)}/sessions`"
                class="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium px-4 py-2 bg-slate-700/50 hover:bg-slate-600/70 rounded-lg border border-slate-600/50"
              >
                View All Sessions
              </router-link>
            </div>
            <div class="p-6">
              <PlayerRecentSessions
                :sessions="playerStats.recentSessions"
              />
            </div>
          </div>

          <!-- Best Scores Section -->
          <div
            v-if="playerStats?.bestScores && (playerStats.bestScores.allTime?.length > 0 || playerStats.bestScores.last30Days?.length > 0 || playerStats.bestScores.thisWeek?.length > 0)"
            class="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-xl border border-slate-700/50 mt-8"
          >
            <div class="relative z-10 p-4 sm:p-6 lg:p-8 space-y-4">
              <!-- Sleek, minimal header -->
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-slate-200">Best Scores This Week</h3>
                <div class="flex gap-2 bg-slate-900/60 rounded-lg p-1 border border-slate-700/50">
                  <button
                    v-for="tab in bestScoresTabOptions"
                    :key="tab.key"
                    class="px-3 py-1 text-xs font-medium rounded transition-colors duration-200"
                    :class="{
                      'bg-slate-700 text-slate-100': selectedBestScoresTab === tab.key,
                      'text-slate-400 hover:text-slate-300': selectedBestScoresTab !== tab.key
                    }"
                    @click="changeBestScoresTab(tab.key)"
                  >
                    {{ tab.label }}
                  </button>
                </div>
              </div>

              <!-- Best Scores Content -->
              <div v-if="currentBestScores.length === 0" class="py-8 text-center text-slate-400">
                No scores recorded for this period
              </div>

              <!-- Condensed Score List -->
              <div v-else class="space-y-2">
                <div
                  v-for="(score, index) in currentBestScores.slice(0, 10)"
                  :key="`${score.roundId}-${index}`"
                  class="flex items-center gap-4 p-3 bg-slate-800/40 hover:bg-slate-800/60 rounded-lg border border-slate-700/30 hover:border-slate-700/60 transition-colors duration-200 cursor-pointer group"
                  @click="navigateToRoundReport(score.roundId)"
                >
                  <!-- Rank badge -->
                  <div class="flex-shrink-0 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center font-bold text-sm text-slate-200">
                    {{ index + 1 }}
                  </div>

                  <!-- Score -->
                  <div class="flex-shrink-0 w-24">
                    <div class="text-sm font-bold text-slate-100">{{ score.score.toLocaleString() }}</div>
                    <div class="text-xs text-slate-500">SCORE</div>
                  </div>

                  <!-- K/D -->
                  <div class="flex-shrink-0">
                    <div class="text-sm font-bold text-cyan-400">{{ calculateKDR(score.kills, score.deaths) }}</div>
                    <div class="text-xs text-slate-500">K/D</div>
                  </div>

                  <!-- Kills/Deaths -->
                  <div class="flex-shrink-0 text-sm">
                    <span class="text-green-400 font-semibold">{{ score.kills }}</span>
                    <span class="text-slate-500 mx-1">/</span>
                    <span class="text-red-400 font-semibold">{{ score.deaths }}</span>
                  </div>

                  <!-- Map -->
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-slate-300 truncate">{{ score.mapName }}</div>
                    <div class="text-xs text-slate-500 truncate">{{ score.serverName }}</div>
                  </div>

                  <!-- Time -->
                  <div class="flex-shrink-0 text-right text-xs text-slate-500">
                    {{ formatRelativeTime(score.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Servers Section -->
          <div class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8">
            <!-- Background Effects -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
            <div class="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
          
            <div class="relative z-10 p-8 space-y-6">
              <!-- Section Header -->
              <div class="space-y-2">
                <h3 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  🎮 Favorite Battlegrounds
                </h3>
                <p class="text-slate-400">
                  Your most active server destinations
                </p>
              </div>
            
              <!-- Server Cards Grid -->
              <div
                v-if="hasServers"
                class="w-full"
              >
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                  <div
                    v-for="server in sortedServers"
                    :key="server.serverGuid"
                    class="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <!-- Card Background Effects -->
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                    <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
                      <!-- Server Header -->
                      <div class="flex items-start gap-3">
                        <div class="flex-shrink-0">
                          <div class="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-2 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                            <img
                              :src="getGameIcon(server.gameId)"
                              alt="Server"
                              class="w-full h-full rounded object-cover"
                            >
                          </div>
                        </div>
                      
                        <div class="flex-1 min-w-0 space-y-2">
                          <div class="flex items-start justify-between gap-2">
                            <router-link
                              :to="`/servers/${encodeURIComponent(server.serverName)}`"
                              class="group/link font-bold text-white hover:text-cyan-400 transition-colors duration-200 line-clamp-2 leading-tight"
                              :title="`View server details for ${server.serverName}`"
                            >
                              {{ server.serverName }}
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
                                class="inline ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity"
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </router-link>
                            <span class="flex-shrink-0 px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
                              {{ server.gameId.toUpperCase() }}
                            </span>
                          </div>
                        
                          <!-- Quick Stats Bar -->
                          <div class="flex items-center gap-4 text-sm">
                            <div class="flex items-center gap-1">
                              <div class="w-2 h-2 bg-green-400 rounded-full" />
                              <span class="text-green-400 font-medium">{{ server.kdRatio.toFixed(2) }} K/D</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <div class="w-2 h-2 bg-blue-400 rounded-full" />
                              <span class="text-blue-400 font-medium">{{ server.totalRounds }} rounds</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <div class="w-2 h-2 bg-purple-400 rounded-full" />
                              <span class="text-purple-400 font-medium">{{ server.killsPerMinute.toFixed(2) }} KPM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    
                      <!-- Detailed Stats Grid -->
                      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                        <!-- Best Score -->
                        <div class="space-y-1">
                          <p class="text-xs text-slate-400 font-medium">
                            Best Score
                          </p>
                          <router-link
                            v-if="server.highestScoreRoundId"
                            class="group/score inline-flex items-center gap-1 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent hover:from-yellow-300 hover:to-orange-300 transition-all duration-200"
                            :to="{
                              name: 'round-report',
                              params: {
                                roundId: server.highestScoreRoundId
                              },
                              query: {
                                players: playerName
                              }
                            }"
                            :title="`View round report for best score${server.bestScoreDate ? ` (${formatRelativeTime(server.bestScoreDate)})` : ''}`"
                          >
                            {{ server.highestScore?.toLocaleString() }}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              class="opacity-0 group-hover/score:opacity-100 transition-opacity text-orange-400"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </router-link>
                          <span
                            v-else
                            class="text-lg font-bold text-white"
                          >
                            {{ server.highestScore?.toLocaleString() }}
                          </span>
                        </div>
                      
                        <!-- KPM -->
                        <div class="space-y-1">
                          <p class="text-xs text-slate-400 font-medium">
                            Kills/Min
                          </p>
                          <p class="text-lg font-bold text-cyan-400">
                            {{ server.killsPerMinute.toFixed(2) }}
                          </p>
                        </div>
                      
                        <!-- Combat Stats -->
                        <div class="space-y-1">
                          <p class="text-xs text-slate-400 font-medium">
                            Combat
                          </p>
                          <div class="flex items-center gap-2 text-sm font-bold">
                            <span class="text-green-400">{{ server.totalKills }}</span>
                            <span class="text-slate-500">/</span>
                            <span class="text-red-400">{{ server.totalDeaths }}</span>
                          </div>
                        </div>
                      
                        <!-- Play Time -->
                        <div class="space-y-1">
                          <p class="text-xs text-slate-400 font-medium">
                            Time Played
                          </p>
                          <p class="text-lg font-bold text-purple-400">
                            {{ formatPlayTime(Math.round(server.totalMinutes)) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Server Rankings within Favorite Battlegrounds -->
            <div
              v-if="playerStats.insights?.serverRankings && playerStats.insights.serverRankings.length > 0"
              class="relative z-10 px-8 pb-8 pt-4 space-y-6"
            >
              <!-- Server Rankings Header -->
              <div class="space-y-2">
                <h4 class="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent flex items-center gap-3">
                  🏅 Server Rankings
                </h4>
                <p class="text-slate-400">
                  Your competitive standings across servers
                </p>
              </div>
            
              <!-- Server Rankings Cards Grid -->
              <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                <div
                  v-for="(ranking, index) in playerStats.insights.serverRankings"
                  :key="ranking.serverGuid"
                  class="group relative overflow-hidden rounded-2xl"
                  :class="{
                    'bg-gradient-to-br from-yellow-500/20 via-amber-600/30 to-yellow-700/20 border-2 border-yellow-500/40 shadow-xl shadow-yellow-500/20': ranking.rank === 1,
                    'bg-gradient-to-br from-slate-400/20 via-slate-500/30 to-slate-600/20 border-2 border-slate-400/40 shadow-xl shadow-slate-400/20': ranking.rank === 2,
                    'bg-gradient-to-br from-orange-600/20 via-amber-700/30 to-orange-800/20 border-2 border-orange-600/40 shadow-xl shadow-orange-600/20': ranking.rank === 3,
                    'bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-black/80 border-2 border-slate-700/50 shadow-xl shadow-slate-900/30': ranking.rank > 3
                  }"
                  :style="{ animationDelay: `${index * 100}ms` }"
                >
                  <!-- Animated Background Particles -->
                  <div class="absolute inset-0 overflow-hidden">
                    <div 
                      class="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-xl opacity-30 animate-pulse"
                      :class="{
                        'bg-yellow-400': ranking.rank === 1,
                        'bg-slate-400': ranking.rank === 2,
                        'bg-orange-500': ranking.rank === 3,
                        'bg-purple-500': ranking.rank > 3
                      }"
                    />
                    <div 
                      class="absolute -bottom-8 -left-8 w-16 h-16 rounded-full blur-lg opacity-20 animate-pulse delay-700"
                      :class="{
                        'bg-yellow-300': ranking.rank === 1,
                        'bg-slate-300': ranking.rank === 2,
                        'bg-orange-400': ranking.rank === 3,
                        'bg-purple-400': ranking.rank > 3
                      }"
                    />
                  </div>

                  <!-- Trophy Icon for Top 3 -->
                  <div 
                    v-if="ranking.rank <= 3"
                    class="absolute top-4 right-4 z-20 animate-bounce"
                    style="animation-duration: 2s"
                  >
                    <div 
                      class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                      :class="{
                        'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900': ranking.rank === 1,
                        'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900': ranking.rank === 2,
                        'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-900': ranking.rank === 3
                      }"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </div>

                  <div class="relative z-10 p-8 h-full flex flex-col">
                    <!-- Rank Badge - More Prominent -->
                    <div class="text-center">
                      <div class="relative inline-block">
                        <div class="flex items-baseline justify-center gap-2">
                          <div 
                            class="text-6xl font-black leading-none"
                            :class="{
                              'text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600': ranking.rank === 1,
                              'text-transparent bg-clip-text bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500': ranking.rank === 2,
                              'text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600': ranking.rank === 3,
                              'text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400': ranking.rank > 3
                            }"
                          >
                            #{{ ranking.rank }}
                          </div>
                          <div 
                            class="text-lg font-semibold opacity-80 mt-4"
                            :class="{
                              'text-yellow-300': ranking.rank === 1,
                              'text-slate-300': ranking.rank === 2,
                              'text-orange-300': ranking.rank === 3,
                              'text-purple-300': ranking.rank > 3
                            }"
                          >
                            of {{ ranking.totalRankedPlayers }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Server Name -->
                    <div class="space-y-3 flex-grow">
                      <router-link
                        :to="`/servers/${encodeURIComponent(ranking.serverName)}`"
                        class="group/link block"
                        :title="`View server details for ${ranking.serverName}`"
                      >
                        <h5
                          class="text-xl font-bold text-white group-hover/link:text-transparent group-hover/link:bg-clip-text transition-all duration-300 leading-tight"
                          :class="{
                            'group-hover/link:bg-gradient-to-r group-hover/link:from-yellow-300 group-hover/link:to-yellow-500': ranking.rank === 1,
                            'group-hover/link:bg-gradient-to-r group-hover/link:from-slate-300 group-hover/link:to-slate-500': ranking.rank === 2,
                            'group-hover/link:bg-gradient-to-r group-hover/link:from-orange-300 group-hover/link:to-orange-500': ranking.rank === 3,
                            'group-hover/link:bg-gradient-to-r group-hover/link:from-purple-300 group-hover/link:to-pink-400': ranking.rank > 3
                          }"
                        >
                          {{ ranking.serverName }}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="inline ml-2 opacity-0 group-hover/link:opacity-100 transition-opacity transform group-hover/link:translate-x-1"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </h5>
                      </router-link>
                    </div>

                    <!-- Ping Display -->
                    <div class="text-center space-y-3">
                      <div class="text-xs uppercase tracking-widest font-bold opacity-60">
                        AVERAGE PING
                      </div>
                      <div class="flex items-center justify-center gap-2">
                        <div
                          v-if="ranking.averagePing > 0"
                          class="w-2 h-2 rounded-full animate-pulse"
                          :class="{
                            'bg-green-400': ranking.averagePing < 50,
                            'bg-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                            'bg-red-400': ranking.averagePing >= 100
                          }"
                        />
                        <div
                          class="text-2xl font-black"
                          :class="ranking.averagePing > 0 ? {
                            'text-green-400': ranking.averagePing < 50,
                            'text-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                            'text-red-400': ranking.averagePing >= 100
                          } : 'text-slate-600 opacity-50'"
                        >
                          <template v-if="ranking.averagePing > 0">
                            {{ ranking.averagePing }}<span class="text-base opacity-60">ms</span>
                          </template>
                          <template v-else>
                            –
                          </template>
                        </div>
                      </div>
                    </div>


                    <!-- Action Buttons - VIEW MAPS and VIEW RANKINGS -->
                    <div class="mt-auto pt-6 space-y-3">
                      <!-- View Rankings Link -->
                      <router-link
                        :to="`/servers/${encodeURIComponent(ranking.serverName)}/rankings`"
                        class="block w-full px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform hover:scale-105 active:scale-95 text-center"
                        :class="{
                          'bg-gradient-to-r from-yellow-600/30 to-yellow-700/30 border border-yellow-500/50 text-yellow-200 hover:from-yellow-600/40 hover:to-yellow-700/40 hover:border-yellow-400/60 shadow-lg shadow-yellow-500/15': ranking.rank === 1,
                          'bg-gradient-to-r from-slate-600/30 to-slate-700/30 border border-slate-500/50 text-slate-200 hover:from-slate-600/40 hover:to-slate-700/40 hover:border-slate-400/60 shadow-lg shadow-slate-500/15': ranking.rank === 2,
                          'bg-gradient-to-r from-orange-600/30 to-orange-700/30 border border-orange-500/50 text-orange-200 hover:from-orange-600/40 hover:to-orange-700/40 hover:border-orange-400/60 shadow-lg shadow-orange-500/15': ranking.rank === 3,
                          'bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-slate-600/50 text-slate-200 hover:from-slate-700/70 hover:to-slate-800/70 hover:border-slate-500/60 shadow-lg shadow-slate-900/30': ranking.rank > 3
                        }"
                      >
                        <div class="flex items-center justify-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="transition-transform group-hover:rotate-12"
                          >
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect
                              x="8"
                              y="2"
                              width="8"
                              height="4"
                              rx="1"
                              ry="1"
                            />
                            <path d="m9 14 2 2 4-4" />
                          </svg>
                          View Rankings
                        </div>
                      </router-link>
                    
                      <!-- View Maps Button -->
                      <button
                        class="w-full px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform hover:scale-105 active:scale-95"
                        :class="{
                          'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-300 hover:from-yellow-500/30 hover:to-yellow-600/30 hover:border-yellow-400/50 shadow-lg shadow-yellow-500/10': ranking.rank === 1,
                          'bg-gradient-to-r from-slate-500/20 to-slate-600/20 border border-slate-500/30 text-slate-300 hover:from-slate-500/30 hover:to-slate-600/30 hover:border-slate-400/50 shadow-lg shadow-slate-500/10': ranking.rank === 2,
                          'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 text-orange-300 hover:from-orange-500/30 hover:to-orange-600/30 hover:border-orange-400/50 shadow-lg shadow-orange-500/10': ranking.rank === 3,
                          'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/30 text-slate-300 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/50 shadow-lg shadow-slate-900/20': ranking.rank > 3
                        }"
                        @click="openMapModal(ranking.serverGuid)"
                      >
                        <div class="flex items-center justify-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="transition-transform group-hover:rotate-12"
                          >
                            <path d="M9 19c-5 0-8-3-8-7s3-7 8-7 8 3 8 7-3 7-8 7" />
                            <path d="m13.5 10.5 2.5-2.5" />
                            <path d="m13.5 13.5 2.5 2.5" />
                          </svg>
                          View Maps
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Player Achievements Section -->
          <div class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8">
            <!-- Background Effects -->
            <div class="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5" />
            <div class="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-3xl" />
          
            <div class="relative z-10 p-8 space-y-6">
              <!-- Section Header -->
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div class="space-y-2">
                  <h3 class="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    🏆 Achievements & Streaks
                  </h3>
                  <p class="text-slate-400">
                    Unlock your battlefield legacy
                  </p>
                </div>
                <router-link
                  :to="`/players/${encodeURIComponent(playerName)}/achievements`"
                  class="group inline-flex items-center gap-3 px-6 py-3 text-sm font-bold !text-white bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="group-hover:rotate-12 transition-transform duration-300"
                  >
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                  View All Achievements
                </router-link>
              </div>
            
              <!-- Achievements Component with Enhanced Container -->
              <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl" />
                <div class="relative z-10 p-6 rounded-xl border border-slate-700/30">
                  <PlayerAchievementSummary
                    :player-name="playerName"
                    :achievement-groups="achievementGroups"
                    :loading="achievementGroupsLoading"
                    :error="achievementGroupsError"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Map Statistics Modal -->
  <div
    v-if="showMapModal"
    class="modal-mobile-safe fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-0 p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
    @click.self="closeMapModal"
  >
    <div class="relative w-full max-w-7xl max-h-[calc(100vh-4rem)] sm:max-h-[90vh] bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      <!-- Modal Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80 gap-4">
        <div class="space-y-1">
          <h3 class="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            🗺️ Map Performance
          </h3>
          <p class="text-slate-400 text-sm">
            {{ selectedServerName || 'Selected Server' }}
          </p>
        </div>
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Time Range Selector -->
          <div class="flex flex-wrap gap-1 sm:gap-2">
            <button
              v-for="option in timeRangeOptions"
              :key="option.value"
              :class="[
                'px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
                selectedTimeRange === option.value 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
              ]"
              @click="selectedTimeRange = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <!-- Close Button -->
          <button
            class="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-all duration-200 border border-slate-600"
            @click="closeMapModal"
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
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="p-3 sm:p-6 overflow-auto max-h-[calc(100vh-8rem)] sm:max-h-[calc(90vh-120px)]">
        <div
          v-if="mapStats.length === 0 && mapStatsLoading"
          class="flex flex-col items-center justify-center p-12 space-y-4"
        >
          <div class="relative">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-600" />
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-amber-500 absolute top-0" />
          </div>
          <p class="text-slate-400 font-medium">
            Loading map statistics...
          </p>
        </div>
      
        <div
          v-else-if="mapStats.length > 0"
          class="relative overflow-hidden"
        >
          <!-- Loading Overlay for time range changes -->
          <div
            v-if="mapStatsLoading"
            class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20 transition-all duration-200"
          >
            <div class="flex items-center gap-3 px-4 py-2 bg-slate-800/90 rounded-lg border border-slate-700">
              <div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span class="text-amber-400 font-medium text-sm">Updating...</span>
            </div>
          </div>
          <!-- Map Stats Table -->
          <div class="overflow-x-auto -mx-3 sm:mx-0">
            <table class="w-full border-collapse min-w-[600px] sm:min-w-[800px]">
              <!-- Table Header -->
              <thead class="sticky top-0 z-10">
                <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-amber-500/50"
                    @click="changeMapStatsSort('mapName')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-amber-400 text-xs sm:text-sm">🗺️</span>
                      <span class="font-mono font-bold">MAP</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-amber-400 opacity-100': mapStatsSortField === 'mapName',
                          'opacity-50': mapStatsSortField !== 'mapName',
                          'rotate-0': mapStatsSortField === 'mapName' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'mapName' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-yellow-500/50"
                    @click="changeMapStatsSort('totalScore')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-yellow-400 text-xs sm:text-sm">🏆</span>
                      <span class="font-mono font-bold">SCORE</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-yellow-400 opacity-100': mapStatsSortField === 'totalScore',
                          'opacity-50': mapStatsSortField !== 'totalScore',
                          'rotate-0': mapStatsSortField === 'totalScore' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalScore' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-green-500/50"
                    @click="changeMapStatsSort('kdRatio')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-green-400 text-xs sm:text-sm">⚔️</span>
                      <span class="font-mono font-bold">K/D</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-green-400 opacity-100': mapStatsSortField === 'kdRatio',
                          'opacity-50': mapStatsSortField !== 'kdRatio',
                          'rotate-0': mapStatsSortField === 'kdRatio' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'kdRatio' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-red-500/50"
                    @click="changeMapStatsSort('totalKills')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-red-400 text-xs sm:text-sm">🎯</span>
                      <span class="font-mono font-bold">KILLS</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-red-400 opacity-100': mapStatsSortField === 'totalKills',
                          'opacity-50': mapStatsSortField !== 'totalKills',
                          'rotate-0': mapStatsSortField === 'totalKills' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalKills' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-purple-500/50"
                    @click="changeMapStatsSort('totalDeaths')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-purple-400 text-xs sm:text-sm">💀</span>
                      <span class="font-mono font-bold">DEATHS</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-purple-400 opacity-100': mapStatsSortField === 'totalDeaths',
                          'opacity-50': mapStatsSortField !== 'totalDeaths',
                          'rotate-0': mapStatsSortField === 'totalDeaths' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalDeaths' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-blue-500/50"
                    @click="changeMapStatsSort('sessionsPlayed')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-blue-400 text-xs sm:text-sm">🎮</span>
                      <span class="font-mono font-bold">SESSIONS</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-blue-400 opacity-100': mapStatsSortField === 'sessionsPlayed',
                          'opacity-50': mapStatsSortField !== 'sessionsPlayed',
                          'rotate-0': mapStatsSortField === 'sessionsPlayed' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'sessionsPlayed' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-cyan-500/50"
                    @click="changeMapStatsSort('totalPlayTimeMinutes')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-cyan-400 text-xs sm:text-sm">⏱️</span>
                      <span class="font-mono font-bold">TIME</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-cyan-400 opacity-100': mapStatsSortField === 'totalPlayTimeMinutes',
                          'opacity-50': mapStatsSortField !== 'totalPlayTimeMinutes',
                          'rotate-0': mapStatsSortField === 'totalPlayTimeMinutes' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalPlayTimeMinutes' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody>
                <tr
                  v-for="(map, mapIndex) in sortedMapStats"
                  :key="mapIndex"
                  class="group transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-800/40 hover:to-slate-900/40 border-b border-slate-800/50 hover:border-slate-700/50 hover:shadow-lg"
                >
                  <!-- Map Name -->
                  <td class="p-2 sm:p-3">
                    <router-link 
                      :to="{
                        path: `/players/${encodeURIComponent(playerName)}/sessions`,
                        query: { 
                          map: map.mapName,
                          ...(selectedServerName && { server: selectedServerName })
                        }
                      }"
                      class="block group-hover:text-amber-400 transition-all duration-300 no-underline"
                    >
                      <div class="font-bold text-slate-200 truncate max-w-xs text-sm sm:text-base">
                        {{ map.mapName }}
                      </div>
                    </router-link>
                  </td>

                  <!-- Score -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-yellow-400">
                      {{ (map.totalScore || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- K/D Ratio -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-green-400">
                      {{ calculateKDR(map.totalKills, map.totalDeaths) }}
                    </div>
                  </td>

                  <!-- Kills -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-red-400">
                      {{ (map.totalKills || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- Deaths -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-purple-400">
                      {{ (map.totalDeaths || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- Sessions -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-blue-400">
                      {{ (map.sessionsPlayed || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- Play Time -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-cyan-400">
                      {{ formatPlayTime(map.totalPlayTimeMinutes || 0) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      
        <div
          v-else
          class="text-center py-12"
        >
          <div class="space-y-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mx-auto text-slate-500"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <p class="text-slate-400 font-medium">
              No map statistics available for the selected time range
            </p>
            <p class="text-slate-500 text-sm">
              Try selecting a different time period
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations and styles that cannot be achieved with standard Tailwind */

/* Hide scrollbar for horizontal scroll */
.scrollbar-hide {
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Safari and Chrome */
}

/* Slow spin animation for avatar ring */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

/* Line clamp utility for text truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2; /* Standard property for compatibility */
}

/* Chart.js container positioning */
.relative .absolute {
  pointer-events: none;
}

/* Ensure trend chart containers allow mouse events to bubble up */
.trend-chart-container canvas {
  pointer-events: auto !important;
}

/* Performance node colors for timeline */
.timeline-node {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid;
  background: currentColor;
}

.performance-excellent .timeline-node {
  color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.performance-good .timeline-node {
  color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
}

.performance-average .timeline-node {
  color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
}

.performance-poor .timeline-node {
  color: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.2);
}

/* Timeline connecting lines */
.timeline-item:not(:last-child) .timeline-node-container::after {
  content: '';
  position: absolute;
  top: 28px;
  left: 50%;
  width: 2px;
  height: calc(100% + 16px);
  background: linear-gradient(to bottom, rgba(148, 163, 184, 0.3), transparent);
  transform: translateX(-50%);
}

/* Sort indicators for table headers */
.sort-indicator.desc {
  transform: rotate(180deg);
}

/* Toggle switch components */
.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: rgba(71, 85, 105, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 1px;
  left: 1px;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: #8b5cf6;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* Gaming-style glow effects */
.glow-cyan {
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}

.glow-purple {
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}

.glow-green {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}
</style>
