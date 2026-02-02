<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats } from '../services/playerStatsService';
import { TrendDataPoint, PlayerAchievementGroup } from '../types/playerStatsTypes';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import PlayerAchievementSummary from '../components/PlayerAchievementSummary.vue';
import PlayerRecentSessions from '../components/PlayerRecentSessions.vue';
import HeroBackButton from '../components/HeroBackButton.vue';
import PlayerAchievementHeroBadges from '../components/PlayerAchievementHeroBadges.vue';
import PlayerServerInsights from '../components/PlayerServerInsights.vue';
import PlayerServerMapStats from '../components/PlayerServerMapStats.vue';
import { formatRelativeTime } from '@/utils/timeUtils';
import { calculateKDR } from '@/utils/statsUtils';
import { useAIContext } from '@/composables/useAIContext';

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

// AI Context
const { setContext, clearContext } = useAIContext();

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
const playerServerInsightsRef = ref<InstanceType<typeof PlayerServerInsights> | null>(null);

// Engagement stats for dynamic content
const playerEngagementStats = ref<PlayerEngagementStats['stats']>([]);
const currentEngagementStatIndex = ref(0);

// Computed property for current engagement stat
const currentEngagementStat = computed(() => {
  return playerEngagementStats.value[currentEngagementStatIndex.value] || null;
});

// State for server map stats view
const selectedServerGuid = ref<string | null>(null);
const scrollPositionBeforeMapStats = ref(0);

// Wide viewport: show slide-out panel side-by-side (lg: 1024px+)
const isWideScreen = ref(false);
const updateWideScreen = () => {
  isWideScreen.value = typeof window !== 'undefined' && window.innerWidth >= 1024;
};

// Server filtering and navigation state
const serverSearchQuery = ref('');
const serverFilter = ref<'all' | 'top-performers' | 'most-played' | 'by-game'>('all');
const selectedGameFilter = ref<string | null>(null);
const serversViewMode = ref<'detailed' | 'compact'>('detailed');
const serversPerPage = ref(10);
const currentServerPage = ref(1);

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

// Function to show map stats for a server
const showServerMapStats = (serverGuid: string) => {
  scrollPositionBeforeMapStats.value = window.scrollY;
  selectedServerGuid.value = serverGuid;
  // On wide screens the panel is side-by-side; scroll to top so the panel is visible. On mobile the panel is a fixed overlay, so don't scroll.
  if (isWideScreen.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Function to close server map stats view
const closeServerMapStats = () => {
  selectedServerGuid.value = null;
  window.scrollTo({ top: scrollPositionBeforeMapStats.value, behavior: 'auto' });
};

// Reset pagination when filters change
watch([serverSearchQuery, serverFilter, selectedGameFilter], () => {
  currentServerPage.value = 1;
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
      { value: '0', label: 'stats available', context: 'Keep playing!', message: 'Break down every map, matchup, and streak in Data Explorer' }
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
  updateWideScreen();
  window.addEventListener('resize', updateWideScreen);

  // Set AI context for player page
  setContext({
    pageType: 'player',
    playerName: playerName.value,
    game: 'bf1942'
  });
});

onUnmounted(() => {
  clearContext();
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

// Filtered and sorted servers
const filteredAndSortedServers = computed(() => {
  if (!playerStats.value?.servers) return [];
  
  let servers = [...playerStats.value.servers];
  
  // Apply search filter
  if (serverSearchQuery.value.trim()) {
    const query = serverSearchQuery.value.toLowerCase().trim();
    servers = servers.filter(server => 
      server.serverName.toLowerCase().includes(query) ||
      server.gameId.toLowerCase().includes(query)
    );
  }
  
  // Apply quick filters
  if (serverFilter.value === 'top-performers') {
    servers = servers.filter(server => {
      const indicator = getServerPerformanceIndicator(server);
      return indicator?.type === 'excellent' || indicator?.type === 'good';
    });
  } else if (serverFilter.value === 'most-played') {
    // Already sorted by playtime, just take top ones
    servers = servers.slice(0, Math.min(5, servers.length));
  } else if (serverFilter.value === 'by-game' && selectedGameFilter.value) {
    servers = servers.filter(server => server.gameId.toLowerCase() === selectedGameFilter.value?.toLowerCase());
  }
  
  // Sort based on filter
  if (serverFilter.value === 'top-performers') {
    servers.sort((a, b) => {
      const aKd = typeof a.kdRatio === 'number' ? a.kdRatio : parseFloat(String(a.kdRatio)) || 0;
      const bKd = typeof b.kdRatio === 'number' ? b.kdRatio : parseFloat(String(b.kdRatio)) || 0;
      return bKd - aKd;
    });
  } else {
    // Default: sort by totalMinutes descending
    servers.sort((a, b) => b.totalMinutes - a.totalMinutes);
  }
  
  return servers;
});

// Get servers with insights (to filter them out from the server cards list)
const serversWithInsights = computed(() => {
  if (!playerServerInsightsRef.value) return [];
  try {
    // Access the exposed serversWithInsights from the child component
    const exposed = playerServerInsightsRef.value as any;
    return exposed.serversWithInsights || [];
  } catch {
    return [];
  }
});

// Servers without insights (to show in the server cards list)
const serversWithoutInsights = computed(() => {
  if (!playerStats.value?.servers) return [];
  
  const insightServerGuids = new Set(
    serversWithInsights.value.map((s: any) => s.server.serverGuid)
  );
  
  return filteredAndSortedServers.value.filter(
    server => !insightServerGuids.has(server.serverGuid)
  );
});

// Paginated servers (only those without insights)
const paginatedServers = computed(() => {
  const start = (currentServerPage.value - 1) * serversPerPage.value;
  const end = start + serversPerPage.value;
  return serversWithoutInsights.value.slice(start, end);
});

const totalServerPages = computed(() => {
  return Math.ceil(serversWithoutInsights.value.length / serversPerPage.value);
});

// Available games for filtering
const availableGames = computed(() => {
  if (!playerStats.value?.servers) return [];
  const games = new Set(playerStats.value.servers.map(s => s.gameId));
  return Array.from(games);
});

// Server count by game
const serverCountByGame = computed(() => {
  if (!playerStats.value?.servers) return {};
  const counts: Record<string, number> = {};
  playerStats.value.servers.forEach(server => {
    counts[server.gameId] = (counts[server.gameId] || 0) + 1;
  });
  return counts;
});

// Compute overall averages for comparison
const overallAverages = computed<{ kdRatio: number; killsPerMinute: number; totalMinutes: number }>(() => {
  if (!playerStats.value?.servers || playerStats.value.servers.length === 0) {
    return { kdRatio: 0, killsPerMinute: 0, totalMinutes: 0 };
  }
  const servers = playerStats.value.servers;
  const totalKills = servers.reduce((sum, s) => sum + s.totalKills, 0);
  const totalDeaths = servers.reduce((sum, s) => sum + s.totalDeaths, 0);
  const totalMinutes = servers.reduce((sum, s) => sum + s.totalMinutes, 0);
  
  const kdRatio = calculateKDR(totalKills, totalDeaths);
  const kdRatioNum = typeof kdRatio === 'number' ? kdRatio : parseFloat(String(kdRatio)) || 0;
  
  return {
    kdRatio: kdRatioNum,
    killsPerMinute: totalKills / Math.max(totalMinutes, 1) * 60,
    totalMinutes: totalMinutes / servers.length
  };
});

// Helper function to get performance indicator for a server
const getServerPerformanceIndicator = (server: { kdRatio: number | string; killsPerMinute: number | string }) => {
  const avg = overallAverages.value;
  const serverKd = typeof server.kdRatio === 'number' ? server.kdRatio : parseFloat(String(server.kdRatio)) || 0;
  const serverKpm = typeof server.killsPerMinute === 'number' ? server.killsPerMinute : parseFloat(String(server.killsPerMinute)) || 0;
  const avgKd = typeof avg.kdRatio === 'number' ? avg.kdRatio : 0;
  const avgKpm = typeof avg.killsPerMinute === 'number' ? avg.killsPerMinute : 0;
  const kdMultiplier = avgKd > 0 ? serverKd / avgKd : 1;
  const kpmMultiplier = avgKpm > 0 ? serverKpm / avgKpm : 1;
  
  if (kdMultiplier >= 1.3 || kpmMultiplier >= 1.3) {
    return { 
      type: 'excellent', 
      label: 'Top Performer', 
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/50'
    };
  } else if (kdMultiplier >= 1.1 || kpmMultiplier >= 1.1) {
    return { 
      type: 'good', 
      label: 'Strong', 
      color: 'from-emerald-500/20 to-green-500/20',
      borderColor: 'border-emerald-500/50'
    };
  } else if (kdMultiplier < 0.9) {
    return { 
      type: 'below', 
      label: 'Developing', 
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/50'
    };
  }
  return null;
};

// Helper to get playtime percentage
const getPlaytimePercentage = (serverMinutes: number) => {
  if (!playerStats.value?.servers) return 0;
  const total = playerStats.value.servers.reduce((sum, s) => sum + s.totalMinutes, 0);
  return total > 0 ? (serverMinutes / total) * 100 : 0;
};

// Helper to get K/D comparison class
const getKdComparisonClass = (serverKd: number | string, avgKd: number | string) => {
  const serverKdNum = Number(serverKd);
  const avgKdNum = Number(avgKd);
  if (serverKdNum > avgKdNum * 1.1) {
    return 'bg-green-500/20 text-green-400';
  } else if (serverKdNum < avgKdNum * 0.9) {
    return 'bg-amber-500/20 text-amber-400';
  }
  return 'bg-neutral-700/50 text-neutral-400';
};

// Helper to get K/D comparison text
const getKdComparisonText = (serverKd: number | string, avgKd: number | string) => {
  const serverKdNum = Number(serverKd);
  const avgKdNum = Number(avgKd);
  const diff = avgKdNum > 0 ? ((serverKdNum / avgKdNum - 1) * 100) : 0;
  return `${serverKdNum > avgKdNum ? '+' : ''}${diff.toFixed(0)}%`;
};

// Numeric rank for ServerRanking (API may send rankDisplay instead of rank)
const rankNum = (ranking: { rank?: number; rankDisplay?: string }): number => {
  if (typeof ranking.rank === 'number' && !Number.isNaN(ranking.rank)) return ranking.rank;
  const parsed = parseInt(ranking.rankDisplay ?? '', 10);
  return Number.isNaN(parsed) ? 99 : parsed;
};

// High-level rankings summary for hero strip
const rankingsSummary = computed(() => {
  const rankings = playerStats.value?.insights?.serverRankings ?? [];
  if (rankings.length === 0) return null;
  const numOnes = rankings.filter(r => rankNum(r) === 1).length;
  const numTop10 = rankings.filter(r => rankNum(r) <= 10).length;
  const best = [...rankings].sort((a, b) => rankNum(a) - rankNum(b))[0];
  return { totalRanked: rankings.length, numOnes, numTop10, best };
});

// Top servers by playtime for compact "favourite battlefields" preview (first 6)
const topServersPreview = computed(() => {
  if (!playerStats.value?.servers?.length) return [];
  const sorted = [...playerStats.value.servers].sort((a, b) => b.totalMinutes - a.totalMinutes);
  return sorted.slice(0, 6);
});





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
  window.removeEventListener('resize', updateWideScreen);

  // Clear any pending trend chart hide timeout
  if (trendChartHideTimeout.value) {
    clearTimeout(trendChartHideTimeout.value);
  }
});

</script>

<template>
  <div class="portal-page">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
  <!-- Full-width Hero Section -->
  <div class="w-full rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] mb-6">
    <div class="w-full px-2 sm:px-6 lg:px-12 py-6">
      <div class="flex items-center justify-between mb-6 px-2 sm:px-0">
        <HeroBackButton fallback-route="/players" />
      </div>
      
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 px-2 sm:px-0">
        <!-- Player Avatar Section (hidden on mobile) -->
        <div class="hidden lg:block flex-shrink-0">
          <div class="relative group cursor-pointer" @click="showLastOnline = !showLastOnline">
            <!-- Avatar -->
            <div class="w-20 h-20 rounded-full p-1 transition-all duration-300 group-hover:scale-105 bg-neutral-800 border border-neutral-700"
                 :class="playerStats?.isActive ? 'animate-spin-slow' : 'animate-none'">
              <div class="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold text-neutral-200">
                  {{ playerName?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>
            </div>
            <!-- Online/Offline Status Indicator -->
            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-neutral-900 flex items-center justify-center"
                 :class="playerStats?.isActive ? 'bg-green-500' : 'bg-neutral-600'">
              <div v-if="playerStats?.isActive" class="w-2 h-2 bg-green-300 rounded-full animate-ping" />
              <div v-else class="w-2 h-2 bg-neutral-400 rounded-full" />
            </div>
            <!-- Last Online Tooltip -->
            <div
              v-if="showLastOnline"
              class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-300 whitespace-nowrap z-50 shadow-lg"
            >
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="playerStats?.isActive ? 'bg-green-400' : 'bg-neutral-500'" />
                <span>
                  {{ playerStats?.isActive ? 'Currently Online' : `Last online: ${formatRelativeTime(playerStats?.lastPlayed || '')}` }}
                </span>
              </div>
              <!-- Arrow pointing up -->
              <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-neutral-950 border-l border-t border-neutral-700 rotate-45" />
            </div>
          </div>
        </div>

        <!-- Player Info -->
        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-4 flex-wrap mb-3">
            <h1 class="text-3xl md:text-4xl font-bold text-neutral-200">
              {{ playerName }}
            </h1>
            <PlayerAchievementHeroBadges
              :player-name="playerName"
            />
          </div>
          
          <!-- Player Stats Summary -->
          <div class="flex items-center gap-6 text-neutral-300 flex-wrap">
            <!-- K/D Ratio with Hover Trends -->
            <div class="relative" @mouseenter="enterTrendChartArea" @mouseleave="leaveTrendChartArea">
              <div class="flex items-center gap-3 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 hover:border-neutral-600 transition-all duration-200 cursor-pointer">
                <div class="text-center">
                  <div class="text-2xl font-bold text-neutral-200">
                    {{ calculateKDR(playerStats?.totalKills || 0, playerStats?.totalDeaths || 0) }}
                  </div>
                  <div class="text-xs text-neutral-400 font-medium">K/D</div>
                </div>
                <div class="w-px h-8 bg-neutral-600" />
                <div class="flex gap-4 text-sm">
                  <div class="text-center">
                    <div class="font-bold text-green-400">{{ playerStats?.totalKills?.toLocaleString() }}</div>
                    <div class="text-xs text-neutral-400">K</div>
                  </div>
                  <div class="text-center">
                    <div class="font-bold text-red-400">{{ playerStats?.totalDeaths?.toLocaleString() }}</div>
                    <div class="text-xs text-neutral-400">D</div>
                  </div>
                </div>
              </div>

              <!-- Trend Charts - Show on Hover (stays visible while hovering) -->
              <div
                v-if="showTrendCharts"
                class="absolute left-0 top-full mt-2 bg-neutral-950 border border-neutral-700 rounded-lg p-3 w-80 z-50 shadow-2xl transition-all duration-200"
                @mouseenter="enterTrendChartArea"
                @mouseleave="leaveTrendChartArea"
              >
                <!-- Chart content wrapper -->
                <div class="space-y-2">
                  <!-- Kill Rate Trend Mini -->
                  <div class="space-y-1">
                    <div class="text-xs font-semibold text-neutral-300">Kill Rate Trend</div>
                    <div class="h-10 -mx-1 trend-chart-container">
                      <Line
                        :data="killRateTrendChartData"
                        :options="microChartOptions"
                      />
                    </div>
                  </div>
                  <!-- K/D Ratio Trend Mini -->
                  <div class="space-y-1">
                    <div class="text-xs font-semibold text-neutral-300">K/D Trend</div>
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
                class="text-neutral-400"
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
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-neutral-900 bg-neutral-200 hover:bg-neutral-100 rounded-lg transition-all duration-200 shadow-lg hover:shadow-neutral-500/40"
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

  <!-- Main Content Area: flex row on lg when map stats panel is open for side-by-side layout -->
  <div class="min-h-screen bg-neutral-950">
    <div
      class="relative flex flex-col min-h-0"
      :class="{ 'lg:flex-row': selectedServerGuid && playerStats?.servers }"
    >
      <div class="flex-1 min-w-0">
        <div class="relative">
          <div class="w-full px-2 sm:px-6 lg:px-12 py-6">
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
        >
          <div class="relative">
            <div class="w-20 h-20 border-4 border-neutral-700 rounded-full animate-spin">
              <div class="absolute top-0 left-0 w-20 h-20 border-4 border-neutral-400 rounded-full border-t-transparent animate-spin" />
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-8 h-8 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" />
            </div>
          </div>
          <div class="text-center space-y-2">
            <p class="text-xl font-semibold text-neutral-300">
              Loading Player Statistics...
            </p>
            <p class="text-neutral-500">
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
            <p class="text-neutral-500">
              Unable to load player data
            </p>
          </div>
        </div>

        <!-- Main Content -->
        <div
          v-else-if="playerStats"
          class="w-full px-1 sm:px-4 pb-6 sm:pb-12 space-y-4 sm:space-y-8">
        >
          <!-- Data Explorer Call-to-Action Section -->
          <div class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden">
            <div class="p-2 sm:p-6">
              <div class="flex flex-col lg:flex-row items-center gap-6">
                <!-- Data Explorer Image -->
                <div class="flex-shrink-0">
                  <div class="relative group">
                    <div class="absolute -inset-2 bg-neutral-600 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
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
                      Break down every map, matchup, and streak in Data Explorer
                    </span>
                  </p>

                  <!-- CTA Button -->
                  <router-link
                    :to="{ name: 'explore-player-detail', params: { playerName: playerName } }"
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

          <!-- Recent Rounds Section -->
          <div
            v-if="playerStats.recentSessions && playerStats.recentSessions.length > 0"
            class="bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden"
          >
            <div class="px-3 sm:px-6 py-4 border-b border-neutral-700/50 flex items-center justify-between">
              <h3 class="text-xl font-semibold text-neutral-200 flex items-center gap-3">
                🎯 Recent Rounds
              </h3>
              <router-link
                :to="`/players/${encodeURIComponent(playerName)}/sessions`"
                class="text-neutral-300 hover:text-neutral-200 transition-colors text-sm font-medium px-4 py-2 bg-neutral-700/50 hover:bg-neutral-600/70 rounded-lg border border-neutral-600/50"
              >
                View All Sessions
              </router-link>
            </div>
            <div class="p-2 sm:p-6">
              <PlayerRecentSessions
                :sessions="playerStats.recentSessions"
              />
            </div>
          </div>

          <!-- Best Scores Section -->
          <div
            v-if="playerStats?.bestScores && (playerStats.bestScores.allTime?.length > 0 || playerStats.bestScores.last30Days?.length > 0 || playerStats.bestScores.thisWeek?.length > 0)"
            class="relative bg-neutral-900/80 rounded-xl border border-neutral-700/50 mt-8"
          >
            <div class="relative z-10 p-2 sm:p-6 lg:p-8 space-y-4">
              <!-- Sleek, minimal header -->
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold text-neutral-200">Best Scores This Week</h3>
                <div class="flex gap-2 bg-neutral-900/60 rounded-lg p-1 border border-neutral-700/50">
                  <button
                    v-for="tab in bestScoresTabOptions"
                    :key="tab.key"
                    class="px-3 py-1 text-xs font-medium rounded transition-colors duration-200"
                    :class="{
                      'bg-neutral-700 text-neutral-100': selectedBestScoresTab === tab.key,
                      'text-neutral-400 hover:text-neutral-300': selectedBestScoresTab !== tab.key
                    }"
                    @click="changeBestScoresTab(tab.key)"
                  >
                    {{ tab.label }}
                  </button>
                </div>
              </div>

              <!-- Best Scores Content -->
              <div v-if="currentBestScores.length === 0" class="py-8 text-center text-neutral-400">
                No scores recorded for this period
              </div>

              <!-- Condensed Score List -->
              <div v-else class="space-y-2">
                <div
                  v-for="(score, index) in currentBestScores.slice(0, 10)"
                  :key="`${score.roundId}-${index}`"
                  class="p-3 bg-neutral-800/40 hover:bg-neutral-800/60 rounded-lg border border-neutral-700/30 hover:border-neutral-700/60 transition-colors duration-200 cursor-pointer group"
                  @click="navigateToRoundReport(score.roundId)"
                >
                  <!-- Mobile layout (stacked) -->
                  <div class="sm:hidden space-y-2">
                    <div class="flex items-center gap-3">
                      <!-- Rank badge -->
                      <div class="flex-shrink-0 w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center font-bold text-sm text-neutral-200">
                        {{ index + 1 }}
                      </div>
                      <!-- Map & Server -->
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-neutral-200 font-medium truncate">{{ score.mapName }}</div>
                        <div class="text-xs text-neutral-500 truncate">{{ score.serverName }}</div>
                      </div>
                      <!-- Time -->
                      <div class="flex-shrink-0 text-xs text-neutral-500">
                        {{ formatRelativeTime(score.timestamp) }}
                      </div>
                    </div>
                    <div class="flex items-center gap-4 pl-9">
                      <!-- Score -->
                      <div>
                        <span class="text-sm font-bold text-neutral-100">{{ score.score.toLocaleString() }}</span>
                        <span class="text-xs text-neutral-500 ml-1">pts</span>
                      </div>
                      <!-- K/D -->
                      <div>
                        <span class="text-sm font-bold text-neutral-200">{{ calculateKDR(score.kills, score.deaths) }}</span>
                        <span class="text-xs text-neutral-500 ml-1">K/D</span>
                      </div>
                      <!-- Kills/Deaths -->
                      <div class="text-sm">
                        <span class="text-green-400 font-semibold">{{ score.kills }}</span>
                        <span class="text-neutral-500 mx-1">/</span>
                        <span class="text-red-400 font-semibold">{{ score.deaths }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Desktop layout (horizontal) -->
                  <div class="hidden sm:flex items-center gap-4">
                    <!-- Rank badge -->
                    <div class="flex-shrink-0 w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center font-bold text-sm text-neutral-200">
                      {{ index + 1 }}
                    </div>

                    <!-- Score -->
                    <div class="flex-shrink-0 w-24">
                      <div class="text-sm font-bold text-neutral-100">{{ score.score.toLocaleString() }}</div>
                      <div class="text-xs text-neutral-500">SCORE</div>
                    </div>

                    <!-- K/D -->
                    <div class="flex-shrink-0">
                      <div class="text-sm font-bold text-neutral-200">{{ calculateKDR(score.kills, score.deaths) }}</div>
                      <div class="text-xs text-neutral-500">K/D</div>
                    </div>

                    <!-- Kills/Deaths -->
                    <div class="flex-shrink-0 text-sm">
                      <span class="text-green-400 font-semibold">{{ score.kills }}</span>
                      <span class="text-neutral-500 mx-1">/</span>
                      <span class="text-red-400 font-semibold">{{ score.deaths }}</span>
                    </div>

                    <!-- Map -->
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-neutral-300 truncate">{{ score.mapName }}</div>
                      <div class="text-xs text-neutral-500 truncate">{{ score.serverName }}</div>
                    </div>

                    <!-- Time -->
                    <div class="flex-shrink-0 text-right text-xs text-neutral-500">
                      {{ formatRelativeTime(score.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Favourite Battlefields & Server Rankings – High-level summary (hacker theme) -->
          <div
            v-if="hasServers || (playerStats?.insights?.serverRankings && playerStats.insights.serverRankings.length > 0)"
            class="player-servers-section bg-neutral-900/80 border border-neutral-700/50 rounded-xl overflow-hidden mt-8"
          >
            <!-- Hero strip: rankings at a glance -->
            <div
              v-if="rankingsSummary"
              class="player-servers-hero flex flex-wrap items-center gap-4 sm:gap-6 px-3 sm:px-6 py-4 border-b border-neutral-700/50 bg-neutral-800/40"
            >
              <div class="flex items-center gap-2">
                <span class="rankings-hero-accent font-mono">◆</span>
                <span class="text-neutral-300 font-medium">
                  <span class="rankings-hero-accent font-bold">{{ rankingsSummary.totalRanked }}</span> server{{ rankingsSummary.totalRanked !== 1 ? 's' : '' }} ranked
                </span>
              </div>
              <div v-if="rankingsSummary.numOnes > 0" class="flex items-center gap-2">
                <span class="text-amber-400 font-bold">#1</span>
                <span class="text-neutral-400">on {{ rankingsSummary.numOnes }} server{{ rankingsSummary.numOnes !== 1 ? 's' : '' }}</span>
              </div>
              <div v-if="rankingsSummary.numTop10 > 0 && rankingsSummary.numTop10 !== rankingsSummary.numOnes" class="flex items-center gap-2">
                <span class="text-neutral-300">Top 10 on <span class="text-neutral-200 font-semibold">{{ rankingsSummary.numTop10 }}</span></span>
              </div>
              <div v-if="rankingsSummary.best" class="flex items-center gap-2 ml-auto">
                <span class="text-neutral-400 text-sm">Best:</span>
                <router-link
                  :to="`/servers/${encodeURIComponent(rankingsSummary.best.serverName)}`"
                  class="rankings-hero-accent hover:opacity-90 font-medium text-sm truncate max-w-[180px] sm:max-w-none transition-colors"
                >
                  #{{ rankingsSummary.best.rankDisplay ?? rankingsSummary.best.rank }} {{ rankingsSummary.best.serverName }}
                </router-link>
              </div>
            </div>

            <div class="p-2 sm:p-6 space-y-6">
              <!-- Favourite Battlefields: compact strip (only when player has servers) -->
              <div v-if="hasServers">
                <h3 class="text-lg font-bold text-neutral-200 mb-1 flex items-center gap-2">
                  <span class="text-cyan-400 text-sm font-mono">▸</span>
                  Favourite Battlefields
                </h3>
                <p class="text-neutral-500 text-sm mb-4">
                  Your top servers by playtime — drill into maps or full rankings from Data Explorer
                </p>

                <PlayerServerInsights
                  v-if="playerStats?.servers && playerStats.servers.length > 0"
                  ref="playerServerInsightsRef"
                  :player-name="playerName"
                  :servers="playerStats.servers"
                  :overall-averages="overallAverages"
                  :open-map-modal="showServerMapStats"
                />

                <div v-if="topServersPreview.length > 0" class="space-y-2">
                  <div
                    v-for="server in topServersPreview"
                    :key="server.serverGuid"
                    class="player-server-strip flex items-center gap-3 sm:gap-4 p-3 rounded-lg border border-neutral-700/50 bg-neutral-800/40 hover:border-cyan-500/30 hover:bg-neutral-800/60 transition-all"
                  >
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center p-1.5">
                      <img :src="getGameIcon(server.gameId)" alt="" class="w-full h-full rounded object-cover" />
                    </div>
                    <router-link
                      :to="`/servers/${encodeURIComponent(server.serverName)}`"
                      class="flex-1 min-w-0 font-medium text-neutral-200 hover:text-cyan-400 truncate"
                    >
                      {{ server.serverName }}
                    </router-link>
                    <span class="flex-shrink-0 text-sm font-mono text-cyan-400">{{ Number(server.kdRatio).toFixed(2) }} K/D</span>
                    <span class="flex-shrink-0 text-xs text-neutral-500">{{ getPlaytimePercentage(server.totalMinutes).toFixed(0) }}%</span>
                    <button
                      type="button"
                      class="flex-shrink-0 px-2.5 py-1.5 text-xs font-medium rounded border border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 transition-colors"
                      @click="showServerMapStats(server.serverGuid)"
                    >
                      Maps
                    </button>
                  </div>
                </div>
                <div v-else class="py-4 text-neutral-500 text-sm text-center">
                  No server data to display
                </div>

                <router-link
                  v-if="playerStats?.servers && playerStats.servers.length > 6"
                  :to="{ name: 'explore-player-detail', params: { playerName } }"
                  class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  View all {{ playerStats.servers.length }} servers in Data Explorer
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                </router-link>
              </div>

              <!-- Server Rankings: compact strip list -->
              <div v-if="playerStats?.insights?.serverRankings && playerStats.insights.serverRankings.length > 0">
                <h3 class="text-lg font-bold text-neutral-200 mb-1 flex items-center gap-2">
                  <span class="text-amber-400 text-sm font-mono">◆</span>
                  Server Rankings
                </h3>
                <p class="text-neutral-500 text-sm mb-4">
                  Your standing on each server — open full leaderboards or map stats
                </p>
                <div class="space-y-2">
                  <div
                    v-for="ranking in playerStats.insights.serverRankings"
                    :key="ranking.serverGuid"
                    class="player-ranking-strip flex flex-col gap-2 p-3 rounded-lg border border-neutral-700/50 bg-neutral-800/40 hover:border-neutral-600 transition-all"
                  >
                    <router-link
                      :to="`/servers/${encodeURIComponent(ranking.serverName)}`"
                      class="w-full font-medium text-neutral-200 hover:text-cyan-400 break-words"
                    >
                      {{ ranking.serverName }}
                    </router-link>
                    <div class="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span class="text-neutral-500 text-sm">{{ ranking.rankDisplay ?? ranking.rank }} of {{ ranking.totalRankedPlayers }}</span>
                      <span
                        v-if="ranking.averagePing > 0"
                        class="text-xs font-mono font-medium"
                        :class="{
                          'ping-good': ranking.averagePing < 50,
                          'ping-warning': ranking.averagePing >= 50 && ranking.averagePing < 100,
                          'ping-bad': ranking.averagePing >= 100
                        }"
                      >
                        {{ ranking.averagePing }}ms
                      </span>
                      <div class="flex flex-shrink-0 gap-2 ml-auto">
                        <router-link
                          :to="{ name: 'explore-server-detail', params: { serverGuid: ranking.serverGuid } }"
                          class="rankings-list-btn px-2.5 py-1.5 text-xs font-medium rounded border transition-colors"
                        >
                          Rankings
                        </router-link>
                        <button
                          type="button"
                          class="px-2.5 py-1.5 text-xs font-medium rounded border border-neutral-600 text-neutral-300 hover:bg-neutral-700 transition-colors"
                          @click="showServerMapStats(ranking.serverGuid)"
                        >
                          Maps
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Player Achievements Section -->
          <div class="relative overflow-hidden bg-neutral-900/80 rounded-2xl border border-neutral-700/50 mt-8">
            <!-- Background Effects (subtle dark theme accent) -->
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
            <div class="relative z-10 p-2 sm:p-6 lg:p-8 space-y-6">
              <!-- Section Header -->
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div class="space-y-2">
                  <h3 class="text-3xl font-bold text-neutral-200">
                    🏆 Achievements & Streaks
                  </h3>
                  <p class="text-neutral-400">
                    Unlock your battlefield legacy
                  </p>
                </div>
                <router-link
                  :to="`/players/${encodeURIComponent(playerName)}/achievements`"
                  class="group inline-flex items-center gap-3 px-6 py-3 text-sm font-bold text-neutral-200 hover:text-cyan-400 bg-neutral-800 border border-neutral-600 hover:border-cyan-500/50 hover:bg-neutral-700/80 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-cyan-500/10"
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
    </div>
    </div>

      <!-- Server Map Statistics Panel: overlay on mobile, side-by-side on lg when space allows (must be inside flex container) -->
      <template v-if="selectedServerGuid && playerStats?.servers">
      <div
        class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] lg:hidden"
        aria-hidden="true"
        @click="closeServerMapStats"
      ></div>
      <div
        class="fixed inset-y-0 left-0 right-0 md:right-20 z-[100] flex items-stretch lg:relative lg:inset-auto lg:z-auto lg:w-2/5 lg:mr-20 lg:flex-shrink-0 lg:min-h-0 lg:border-l lg:border-neutral-800"
        @click.stop
      >
        <div
          class="bg-neutral-950 w-full max-w-6xl lg:max-w-none shadow-2xl animate-slide-in-left overflow-hidden flex flex-col border-r border-neutral-800 lg:border-r-0"
          :class="{ 'h-[calc(100vh-4rem)]': true, 'md:h-full': true, 'mt-16': true, 'md:mt-0': true }"
        >
          <!-- Header -->
          <div class="sticky top-0 z-20 bg-neutral-950/95 border-b border-neutral-800 p-2 sm:p-4 flex justify-between items-center">
            <div class="flex flex-col min-w-0 flex-1 mr-4">
              <h2 class="text-xl font-bold text-neutral-200 truncate">
                Map Performance
              </h2>
              <p class="text-sm text-neutral-400 mt-1 truncate">
                {{ selectedServerName || 'Selected Server' }}
              </p>
            </div>
            <button 
              class="group p-2 text-neutral-400 hover:text-white hover:bg-red-500/20 border border-neutral-600 hover:border-red-500/50 rounded-lg transition-all duration-300 flex items-center justify-center w-10 h-10 flex-shrink-0"
              title="Close panel"
              @click="closeServerMapStats"
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
            <PlayerServerMapStats
              :player-name="playerName"
              :server-guid="selectedServerGuid"
              :game="(playerStats?.servers?.find(s => s.serverGuid === selectedServerGuid)?.gameId as any) || 'bf1942'"
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
<style scoped src="./PlayerDetails.vue.css"></style>
