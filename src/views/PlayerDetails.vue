<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats, fetchSimilarPlayers, SimilarPlayersResponse, PlayerComparisonStats } from '../services/playerStatsService';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import PlayerAchievements from '../components/PlayerAchievements.vue';
import Card from 'primevue/card';

import bf1942Icon from '@/assets/bf1942.jpg';
import fh2Icon from '@/assets/fh2.jpg';
import bfvIcon from '@/assets/bfv.jpg';
import defaultIcon from '@/assets/servers.jpg';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Router
const router = useRouter();
const route = useRoute();

const playerName = ref(route.params.playerName as string);
const playerStats = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// New state for map stats
const expandedServerId = ref<string | null>(null);
const mapStats = ref<any[]>([]);
const mapStatsLoading = ref(false);
const selectedTimeRange = ref('Last30Days');
const timeRangeOptions = [
  { value: 'Last30Days', label: '30 days' },
  { value: 'ThisYear', label: 'This Year' },
  { value: 'LastYear', label: 'Last Year' }
];

// New state for map stats sorting
const mapStatsSortField = ref('totalScore');
const mapStatsSortDirection = ref('desc');

// --- Similar Players state & functions ---
const similarPlayersData = ref<SimilarPlayersResponse | null>(null);
const loadingSimilarPlayers = ref(false);
const similarPlayersError = ref<string | null>(null);
const similarSectionExpanded = ref(false);
const detectionMode = ref<'default' | 'aliasdetection'>('default');
const showOnlyComparable = ref(false);
const expandedPlayerCards = ref<Set<number>>(new Set());

const loadSimilarPlayers = async () => {
  loadingSimilarPlayers.value = true;
  similarPlayersError.value = null;
  try {
    similarPlayersData.value = await fetchSimilarPlayers(playerName.value, detectionMode.value);
  } catch (err: any) {
    console.error('Error loading similar players:', err);
    similarPlayersError.value = err.message || 'Failed to load similar players.';
  } finally {
    loadingSimilarPlayers.value = false;
  }
};

const toggleSimilarPlayersSection = async () => {
  similarSectionExpanded.value = !similarSectionExpanded.value;
  if (similarSectionExpanded.value && !similarPlayersData.value && !loadingSimilarPlayers.value) {
    await loadSimilarPlayers();
  }
};

const setDetectionMode = async (mode: 'default' | 'aliasdetection') => {
  detectionMode.value = mode;
  if (similarSectionExpanded.value) {
    await loadSimilarPlayers();
  }
};
// Helper functions for comparison data
const getCommonServers = (player1: PlayerComparisonStats, player2: PlayerComparisonStats): string[] => {
  const servers1 = Object.keys(player1.serverPings);
  const servers2 = Object.keys(player2.serverPings);
  return servers1.filter(server => servers2.includes(server));
};

const getCommonMaps = (player1: PlayerComparisonStats, player2: PlayerComparisonStats): string[] => {
  const maps1 = Object.keys(player1.mapDominanceScores);
  const maps2 = Object.keys(player2.mapDominanceScores);
  return maps1.filter(map => maps2.includes(map));
};

const getCommonOnlineHours = (player1: PlayerComparisonStats, player2: PlayerComparisonStats): number[] => {
  // Convert both players' UTC hours to local hours for comparison
  const convertUTCToLocal = (utcHours: number[]): number[] => {
    const today = new Date();
    return utcHours.map(utcHour => {
      const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), utcHour, 0, 0));
      return utcDate.getHours();
    });
  };
  
  const player1LocalHours = convertUTCToLocal(player1.typicalOnlineHours);
  const player2LocalHours = convertUTCToLocal(player2.typicalOnlineHours);
  
  // Find common local hours and remove duplicates
  const commonHours = player1LocalHours.filter(hour => player2LocalHours.includes(hour));
  return [...new Set(commonHours)];
};

const formatOnlineHours = (hours: number[]): string => {
  // Convert UTC hours to local hours
  const localHours = hours.map(utcHour => {
    // Create a UTC date with today's date and the UTC hour
    const today = new Date();
    const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), utcHour, 0, 0));
    
    // Convert to local time and extract the local hour
    return utcDate.getHours();
  });
  
  // Remove duplicates and sort
  const uniqueLocalHours = [...new Set(localHours)].sort((a, b) => a - b);
  
  return uniqueLocalHours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ');
};

// Toggle player card expansion
const togglePlayerCard = (index: number) => {
  if (expandedPlayerCards.value.has(index)) {
    expandedPlayerCards.value.delete(index);
  } else {
    expandedPlayerCards.value.add(index);
  }
};

const isPlayerCardExpanded = (index: number) => {
  return expandedPlayerCards.value.has(index);
};

// Computed properties for comparison data
const targetPlayerStats = computed(() => similarPlayersData.value?.targetPlayerStats || null);
const similarPlayers = computed(() => similarPlayersData.value?.similarPlayers || []);

// --- End Similar Players ---

// Computed properties for trend charts
const kdTrendChartData = computed(() => {
  if (!playerStats.value?.recentStats?.kdRatioTrend) return { labels: [], datasets: [] };

  const trend = playerStats.value.recentStats.kdRatioTrend;
  const labels = trend.map((point: any) => new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const data = trend.map((point: any) => point.value);

  return {
    labels,
    datasets: [{
      label: 'K/D Ratio',
      data,
      borderColor: '#ff6b35',
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: '#ff6b35',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1,
    }]
  };
});

const killRateTrendChartData = computed(() => {
  if (!playerStats.value?.recentStats?.killRateTrend) return { labels: [], datasets: [] };

  const trend = playerStats.value.recentStats.killRateTrend;
  const labels = trend.map((point: any) => new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const data = trend.map((point: any) => point.value);

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

const tickerChartOptions = computed(() => {
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
        titleFont: { size: 10, weight: 'bold' as const },
        bodyFont: { size: 9 },
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const label = context.dataset.label;
            const value = context.parsed.y;
            if (label === 'Kill Rate') {
              return `${value.toFixed(3)} kills/min`;
            }
            return `${label}: ${value.toFixed(3)}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4
      },
      line: {
        borderWidth: 2
      }
    }
  };
});

// Computed properties for gauge data
const currentKDRatio = computed(() => {
  if (!playerStats.value?.recentStats?.kdRatioTrend?.length) return 0;
  return playerStats.value.recentStats.kdRatioTrend[playerStats.value.recentStats.kdRatioTrend.length - 1].value;
});

const currentKillRate = computed(() => {
  if (!playerStats.value?.recentStats?.killRateTrend?.length) return 0;
  return playerStats.value.recentStats.killRateTrend[playerStats.value.recentStats.killRateTrend.length - 1].value;
});

const getGaugeColor = (value: number, type: 'kdr' | 'killrate') => {
  if (type === 'kdr') {
    if (value >= 3.0) return '#4CAF50'; // Excellent (green)
    if (value >= 2.0) return '#8BC34A'; // Great (light green)
    if (value >= 1.5) return '#FFC107'; // Good (yellow)
    if (value >= 1.0) return '#FF9800'; // Average (orange)
    return '#F44336'; // Below average (red)
  } else { // killrate
    if (value >= 1.2) return '#4CAF50'; // Excellent (green)
    if (value >= 0.8) return '#8BC34A'; // Great (light green)
    if (value >= 0.6) return '#FFC107'; // Good (yellow)
    if (value >= 0.4) return '#FF9800'; // Average (orange)
    return '#F44336'; // Below average (red)
  }
};

// Function to fetch map stats for a server
const fetchMapStats = async (serverGuid: string) => {
  mapStatsLoading.value = true;
  try {
    const response = await fetch(`/stats/players/${encodeURIComponent(playerName.value)}/server/${serverGuid}/mapstats?range=${selectedTimeRange.value}`);
    if (!response.ok) throw new Error('Failed to fetch map stats');
    mapStats.value = await response.json();
  } catch (err) {
    console.error('Error fetching map stats:', err);
    mapStats.value = [];
  } finally {
    mapStatsLoading.value = false;
  }
};

// Function to toggle server expansion and fetch map stats
const toggleServerExpansion = async (serverGuid: string) => {
  if (expandedServerId.value === serverGuid) {
    expandedServerId.value = null;
  } else {
    expandedServerId.value = serverGuid;
    await fetchMapStats(serverGuid);
  }
};

// Watch for time range changes
watch(selectedTimeRange, async () => {
  if (expandedServerId.value) {
    await fetchMapStats(expandedServerId.value);
  }
});

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    playerStats.value = await fetchPlayerStats(playerName.value);
  } catch (err) {
    error.value = `Failed to fetch player stats for ${playerName.value}.`;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// Function to open the round report page
const openSessionDetailsModal = (serverGuid: string, mapName: string, startTime: string, event?: Event) => {
  // Prevent event propagation to stop the modal from closing
  if (event) {
    event.stopPropagation();
  }

  // Navigate to the round report page with the required parameters
  router.push({
    path: '/servers/round-report',
    query: {
      serverGuid,
      mapName,
      startTime,
      players: playerName.value // Include the player name to pin them
    }
  });
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

// Function to get round report route for a session
const getRoundReportRoute = (session: any) => {
  if (session.serverGuid) {
    return {
      path: '/servers/round-report',
      query: {
        serverGuid: session.serverGuid,
        mapName: session.mapName,
        startTime: session.startTime,
        players: playerName.value // Include the player name to pin them
      }
    };
  }
  
  // Fallback to player details if serverGuid not found
  return `/players/${encodeURIComponent(playerName.value)}`;
};


// Computed property to sort activity hours chronologically by local hour (0-23)
const sortedLocalActivityHours = computed(() => {
  if (!playerStats.value?.insights?.activityByHour) return [];

  // Create a new array with local hour information
  const hoursWithLocalTime = playerStats.value.insights.activityByHour.map(hourData => ({
    ...hourData,
    localHour: convertToLocalHour(hourData.hour)
  }));

  // Sort by local hour (0-23)
  return [...hoursWithLocalTime].sort((a, b) => a.localHour - b.localHour);
});

// Function to convert UTC hour to local hour
const convertToLocalHour = (utcHour: number): number => {
  const now = new Date();
  const localDate = new Date(now.setUTCHours(utcHour, 0, 0, 0));
  return localDate.getHours();
};

// Chart data for player activity by hour
const activityChartData = computed(() => {
  if (!playerStats.value?.insights?.activityByHour) return { labels: [], datasets: [] };

  // Convert hours to readable labels (00:00, 01:00, etc.)
  const labels = sortedLocalActivityHours.value.map(hourData => 
    `${hourData.localHour.toString().padStart(2, '0')}:00`
  );

  // Get activity values in minutes
  const data = sortedLocalActivityHours.value.map(hourData => hourData.minutesActive);

  return {
    labels,
    datasets: [
      {
        label: 'Activity (minutes)',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderColor: 'rgba(156, 39, 176, 0.8)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: 'rgba(156, 39, 176, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        data
      }
    ]
  };
});

// Chart options for the compact player activity chart
const activityChartOptions = computed(() => {
  // Get computed styles to access CSS variables
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
        beginAtZero: true,
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
        titleColor: isDarkMode ? '#ffffff' : '#ffffff',
        bodyColor: isDarkMode ? '#ffffff' : '#ffffff',
        borderColor: isDarkMode ? '#9c27b0' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 12,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 11
        },
        callbacks: {
          title: function(context: any) {
            return `${context[0].label}`;
          },
          label: function(context: any) {
            return `${context.parsed.y} minutes active`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4
      }
    }
  };
});

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

// Computed property to get the current expanded server's name
const expandedServerName = computed(() => {
  if (!expandedServerId.value || !playerStats.value?.insights?.serverRankings) return null;
  
  const server = playerStats.value.insights.serverRankings.find(
    ranking => ranking.serverGuid === expandedServerId.value
  );
  
  return server?.serverName || null;
});

// Handle back button navigation
const goBack = () => {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // Fallback to players page if no history
    router.push('/players');
  }
};

// Timeline helper functions
const getPerformanceClass = (session: any): string => {
  const kdr = session.totalDeaths === 0 ? session.totalKills : session.totalKills / session.totalDeaths;
  
  if (kdr >= 2.0) return 'performance-excellent';
  if (kdr >= 1.5) return 'performance-good';
  if (kdr >= 1.0) return 'performance-average';
  if (kdr >= 0.5) return 'performance-poor';
  return 'performance-bad';
};

const getPerformanceLabel = (session: any): string => {
  const kdr = session.totalDeaths === 0 ? session.totalKills : session.totalKills / session.totalDeaths;
  
  if (kdr >= 2.0) return 'Excellent performance';
  if (kdr >= 1.5) return 'Good performance';
  if (kdr >= 1.0) return 'Average performance';
  if (kdr >= 0.5) return 'Challenging round';
  return 'Tough round';
};


const getTimeGap = (currentSession: any, nextSession: any): string => {
  const current = new Date(currentSession.startTime.endsWith('Z') ? currentSession.startTime : currentSession.startTime + 'Z');
  const next = new Date(nextSession.startTime.endsWith('Z') ? nextSession.startTime : nextSession.startTime + 'Z');
  
  const diffMs = current.getTime() - next.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays >= 1) {
    return diffDays === 1 ? '1 day later' : `${diffDays} days later`;
  } else if (diffHours >= 2) {
    return `${diffHours} hours later`;
  }
  
  return ''; // Don't show gap for sessions close together
};

// Clean up event listeners when component is unmounted
onMounted(() => {
  fetchData();
});

// Add this helper function to the <script setup> section:
const daysBetween = (start: string, end: string): number => {
  const startDate = new Date(start.endsWith('Z') ? start : start + 'Z');
  const endDate = new Date(end.endsWith('Z') ? end : end + 'Z');
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

// Color helper for similarity score
const similarityColor = (score: number): string => {
  if (score >= 0.8) return '#4CAF50'; // green
  if (score >= 0.6) return '#FFC107'; // amber
  return '#F44336'; // red
};

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

</script>

<template>
  <div class="player-details-container">
    <div class="player-stats-header">
      <div class="player-name-container">
        <button
          class="back-button"
          @click="goBack"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-arrow-left"
          ><line
            x1="19"
            y1="12"
            x2="5"
            y2="12"
          /><polyline points="12 19 5 12 12 5" /></svg>
          Back to Players
        </button>
        <div class="player-header-info">
          <div class="player-name-row">
            <h2 class="player-name-heading">
              {{ playerName }}
            </h2>
            <router-link 
              :to="{ path: '/players/compare', query: { player1: playerName } }"
              class="compare-player-btn"
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
          <div class="player-header-meta">
            <span class="player-playtime">{{ formatPlayTime(playerStats?.totalPlayTimeMinutes || 0) }}</span>
            <span class="player-last-seen">Last seen: {{ formatRelativeTime(playerStats?.lastPlayed || '') }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="player-stats-body">
      <div
        v-if="isLoading"
        class="loading-container"
      >
        <div class="loading-spinner" />
        <p>Loading player statistics...</p>
      </div>
      <div
        v-else-if="error"
        class="error-container"
      >
        <p class="error-message">
          {{ error }}
        </p>
      </div>
      <div
        v-else-if="playerStats"
        class="stats-container"
      >
        <div
          v-if="playerStats.isActive && playerStats.currentServer"
          class="current-server-banner"
        >
          <div class="server-info-line">
            <router-link
              :to="`/servers/${encodeURIComponent(playerStats.currentServer.serverName)}`"
              class="server-link"
            >
              {{ playerStats.currentServer.serverName }}
            </router-link>
            <span
              v-if="playerStats && playerStats.isActive"
              class="status-badge active"
            >Active</span>
            <span
              v-if="playerStats.currentServer.gameId"
              class="game-id"
            >
              Game: {{ playerStats.currentServer.gameId }}
            </span>
          </div>
          <div
            v-if="playerStats.currentServer.sessionKills !== undefined && playerStats.currentServer.sessionDeaths !== undefined"
            class="session-stats"
          >
            Session: {{ playerStats.currentServer.sessionKills }} <img
              src="@/assets/kills.png"
              alt="Kills"
              class="kills-icon"
            > / {{ playerStats.currentServer.sessionDeaths }} <img
              src="@/assets/deaths.png"
              alt="Deaths"
              class="deaths-icon"
            >
            (<img
              src="@/assets/kdr.png"
              alt="KDR"
              class="kdr-icon"
            > {{ calculateKDR(playerStats.currentServer.sessionKills, playerStats.currentServer.sessionDeaths) }})
          </div>
        </div>

        <!-- Performance Analytics section -->
        <div 
          v-if="playerStats?.recentStats"
          class="stats-section performance-analytics"
        >
          <div class="section-header-with-action">
            <h3>📊 Performance Analytics</h3>
            <div class="analytics-period">
              {{ Math.ceil((new Date(playerStats.recentStats.analysisPeriodEnd).getTime() - new Date(playerStats.recentStats.analysisPeriodStart).getTime()) / (1000 * 60 * 60 * 24)) }} days 
              ({{ playerStats.recentStats.totalRoundsAnalyzed }} rounds)
            </div>
          </div>
          
          <!-- Performance Metrics Section -->
          <div class="performance-metrics">
            <!-- Compact Trend Tickers -->
            <div class="trend-tickers">
              <div class="ticker-item">
                <div class="ticker-header">
                  <div class="ticker-label">
                    <span class="ticker-icon">📈</span>
                    <span>K/D Ratio</span>
                  </div>
                  <div class="ticker-value" :style="{ color: getGaugeColor(currentKDRatio, 'kdr') }">
                    {{ currentKDRatio.toFixed(3) }}
                  </div>
                </div>
                <div class="ticker-chart">
                  <Line 
                    :data="kdTrendChartData" 
                    :options="tickerChartOptions" 
                  />
                </div>
              </div>
              
              <div class="ticker-item">
                <div class="ticker-header">
                  <div class="ticker-label">
                    <span class="ticker-icon">⚡</span>
                    <span>Kill Rate</span>
                  </div>
                  <div class="ticker-value" :style="{ color: getGaugeColor(currentKillRate, 'killrate') }">
                    {{ currentKillRate.toFixed(2) }} <span class="ticker-unit">k/min</span>
                  </div>
                </div>
                <div class="ticker-chart">
                  <Line 
                    :data="killRateTrendChartData" 
                    :options="tickerChartOptions" 
                  />
                </div>
              </div>
            </div>
            
            <!-- Total Stats Cards -->
            <div class="flex gap-3 mt-4">
              <Card class="flex-1">
                <template #content>
                  <div class="flex align-items-center gap-3">
                    <div class="text-3xl">🎯</div>
                    <div>
                      <div class="text-2xl font-bold text-primary">{{ playerStats.totalKills.toLocaleString() }}</div>
                      <div class="text-600">Total Kills</div>
                    </div>
                  </div>
                </template>
              </Card>
              
              <Card class="flex-1">
                <template #content>
                  <div class="flex align-items-center gap-3">
                    <div class="text-3xl">💀</div>
                    <div>
                      <div class="text-2xl font-bold text-red-500">{{ playerStats.totalDeaths.toLocaleString() }}</div>
                      <div class="text-600">Total Deaths</div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </div>

        <!-- Player Achievements section -->
        <div class="stats-section">
          <div class="section-header-with-action">
            <h3>🏆 Achievements & Streaks</h3>
            <router-link
              :to="`/players/${encodeURIComponent(playerName)}/achievements`"
              class="view-all-button"
            >
              View All
            </router-link>
          </div>
          <PlayerAchievements
            :player-name="playerName"
            :player-stats="playerStats"
          />
        </div>

        <!-- General statistics section -->
        <div class="stats-section">
          <h3>Top Servers</h3>
          <div class="stats-grid">
            <!-- Server Cards Section -->
            <div
              v-if="hasServers"
              class="server-cards-section"
            >
              <div class="server-cards-grid">
                <div
                  v-for="server in sortedServers"
                  :key="server.serverGuid"
                  class="server-card-gamified"
                >
                  <div class="server-card-header">
                    <span class="server-card-title">
                      <img
                        :src="getGameIcon(server.gameId)"
                        alt="Server"
                        style="width: 24px; height: 24px; margin-right: 8px; border-radius: 6px; vertical-align: middle;"
                      >
                      <router-link
                        :to="`/servers/${encodeURIComponent(server.serverName)}`"
                        class="server-link"
                        :title="`View server details for ${server.serverName}`"
                        style="font-weight: 700; color: inherit; text-decoration: underline;"
                      >
                        {{ server.serverName }}
                      </router-link>
                    </span>
                    <span class="server-game-id">{{ server.gameId.toUpperCase() }}</span>
                  </div>
                  <div class="server-card-stats-compact">
                    <div class="server-stat-block">
                      <span class="server-stat-label">Best Score</span>
                      <router-link
                        v-if="(server.serverGuid && server.highestScoreMapName && server.highestScoreStartTime) || (server.serverGuid && server.mapName && server.bestScoreDate)"
                        class="server-stat-value highlight-badge best-score-link"
                        :to="{
                          path: '/servers/round-report',
                          query: {
                            serverGuid: server.serverGuid,
                            mapName: server.highestScoreMapName || server.mapName,
                            startTime: server.highestScoreStartTime || server.bestScoreDate,
                            players: playerName
                          }
                        }"
                        :title="`View round report for best score on ${server.highestScoreMapName || server.mapName} (${formatRelativeTime((server.highestScoreStartTime || server.bestScoreDate) ?? '')})`"
                        style="cursor:pointer; text-decoration:underline;"
                      >
                        {{ server.highestScore }}
                      </router-link>
                      <span
                        v-else
                        class="server-stat-value highlight-badge"
                      >
                        {{ server.highestScore }}
                      </span>
                    </div>
                    <div
                      v-if="server.ranking"
                      class="server-stat-block"
                    >
                      <span class="server-stat-label">Rank</span>
                      <span class="server-stat-value ranking-badge">{{ server.ranking.rankDisplay }}</span>
                    </div>
                    <div class="server-stat-block">
                      <span class="server-stat-label">KPM</span>
                      <span class="server-stat-value">{{ server.killsPerMinute.toFixed(2) }}</span>
                    </div>
                    <div class="server-stat-block">
                      <span class="server-stat-label">Rounds</span>
                      <span class="server-stat-value">{{ server.totalRounds }}</span>
                    </div>
                    <div class="server-stat-block">
                      <span class="server-stat-label">K/D</span>
                      <span class="server-stat-value">{{ server.kdRatio.toFixed(2) }}</span>
                    </div>
                    <div class="server-stat-block">
                      <span class="server-stat-label">Kills</span>
                      <span class="server-stat-value kills-count">{{ server.totalKills }}</span>
                    </div>
                    <div class="server-stat-block">
                      <span class="server-stat-label">Deaths</span>
                      <span class="server-stat-value deaths-count">{{ server.totalDeaths }}</span>
                    </div>
                    <div class="server-stat-block playtime-block">
                      <span class="server-stat-label">Play Time</span>
                      <span class="server-stat-value">{{ formatPlayTime(Math.round(server.totalMinutes)) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- End Server Cards Section -->
          </div>
        </div>

        <!-- Insights section -->
        <div
          v-if="playerStats.insights"
          class="stats-section"
        >
          <h3>Player Insights</h3>
          <!-- Remove the .insights-period div -->

          <!-- Activity By Hour -->
          <div
            v-if="playerStats.insights && playerStats.insights.activityByHour && playerStats.insights.activityByHour.length > 0"
            class="insights-subsection"
          >
            <h4>
              When they've been online in the last {{ daysBetween(playerStats.insights.startPeriod, playerStats.insights.endPeriod) }} days (your time)
            </h4>
            <div class="activity-chart-wrapper">
              <div class="activity-chart-container">
                <!-- Background zones for time periods -->
                <div class="time-period-zones">
                  <div
                    class="time-zone early-zone"
                    title="Early (00:00 - 08:00)"
                  />
                  <div
                    class="time-zone day-zone"
                    title="Day (08:00 - 16:00)"
                  />
                  <div
                    class="time-zone night-zone"
                    title="Night (16:00 - 24:00)"
                  />
                </div>
                <Line
                  :data="activityChartData"
                  :options="activityChartOptions"
                />
              </div>
              
              <!-- Time period section labels -->
              <div class="time-period-labels">
                <div class="period-label early-label">
                  <span class="period-name">Early</span>
                  <span class="period-hours">12AM-8AM</span>
                </div>
                <div class="period-label day-label">
                  <span class="period-name">Day</span>
                  <span class="period-hours">8AM-4PM</span>
                </div>
                <div class="period-label night-label">
                  <span class="period-name">Night</span>
                  <span class="period-hours">4PM-12AM</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Server Rankings -->
          <div
            v-if="playerStats.insights?.serverRankings && playerStats.insights.serverRankings.length > 0"
            class="insights-subsection"
          >
            <h4>Server Rankings</h4>
            <div class="server-rankings-table">
              <table>
                <thead>
                  <tr>
                    <th>Server Name</th>
                    <th class="desktop-only">
                      Rank
                    </th>
                    <th class="desktop-only">
                      Score
                    </th>
                    <th class="desktop-only">
                      Ping
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template
                    v-for="(ranking, index) in playerStats.insights.serverRankings"
                    :key="index"
                  >
                    <tr
                      class="server-row"
                      @click="toggleServerExpansion(ranking.serverGuid)"
                    >
                      <td>
                        <div class="server-name-container">
                          <span class="expand-icon">{{ expandedServerId === ranking.serverGuid ? '▼' : '▶' }}</span>
                          <span class="server-link">{{ ranking.serverName }}</span>
                        </div>
                        <div class="mobile-only ranking-details">
                          <span class="detail-item">Rank: {{ ranking.rankDisplay }}</span>
                          <span class="detail-separator">•</span>
                          <span class="detail-item">Score: {{ ranking.scoreDisplay }}</span>
                          <span class="detail-separator">•</span>
                          <span class="detail-item">
                            <span
                              class="player-ping"
                              :class="{
                                'ping-good': ranking.averagePing < 50,
                                'ping-ok': ranking.averagePing >= 50 && ranking.averagePing < 100,
                                'ping-bad': ranking.averagePing >= 100
                              }"
                            >
                              {{ ranking.averagePing }}ms
                            </span>
                          </span>
                        </div>
                      </td>
                      <td class="desktop-only">
                        {{ ranking.rankDisplay }}
                      </td>
                      <td class="desktop-only">
                        {{ ranking.scoreDisplay }}
                      </td>
                      <td class="desktop-only">
                        <span
                          class="player-ping"
                          :class="{
                            'ping-good': ranking.averagePing < 50,
                            'ping-ok': ranking.averagePing >= 50 && ranking.averagePing < 100,
                            'ping-bad': ranking.averagePing >= 100
                          }"
                        >
                          {{ ranking.averagePing }}ms
                        </span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
              
              <!-- Expanded map stats section - outside the table -->
              <div
                v-if="expandedServerId"
                class="map-stats-expansion"
              >
                <div class="time-range-filter">
                  <span class="time-range-label">Time Range:</span>
                  <div class="time-range-buttons">
                    <button
                      v-for="option in timeRangeOptions"
                      :key="option.value"
                      :class="['time-range-button', { active: selectedTimeRange === option.value }]"
                      @click="selectedTimeRange = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
                <div
                  v-if="mapStatsLoading"
                  class="map-stats-loading"
                >
                  <div class="loading-spinner" />
                  <p>Loading map statistics...</p>
                </div>
                <div
                  v-else-if="mapStats.length > 0"
                  class="map-stats-content"
                >
                  <!-- Table view with horizontal scrolling for mobile -->
                  <div class="map-stats-table-container">
                    <table class="map-stats-table">
                      <thead>
                        <tr>
                          <th @click="changeMapStatsSort('mapName')" class="sortable">
                            Map Name
                            <span
                              v-if="mapStatsSortField === 'mapName'"
                              class="sort-indicator"
                              :class="mapStatsSortDirection"
                            >▲</span>
                          </th>
                          <th @click="changeMapStatsSort('totalScore')" class="sortable">
                            Score
                            <span
                              v-if="mapStatsSortField === 'totalScore'"
                              class="sort-indicator"
                              :class="mapStatsSortDirection"
                            >▲</span>
                          </th>
                          <th @click="changeMapStatsSort('kdRatio')" class="sortable">
                            K/D Ratio
                            <span
                              v-if="mapStatsSortField === 'kdRatio'"
                              class="sort-indicator"
                              :class="mapStatsSortDirection"
                            >▲</span>
                          </th>
                          <th @click="changeMapStatsSort('totalKills')" class="sortable">
                            Kills
                            <span
                              v-if="mapStatsSortField === 'totalKills'"
                              class="sort-indicator"
                              :class="mapStatsSortDirection"
                            >▲</span>
                          </th>
                          <th @click="changeMapStatsSort('totalDeaths')" class="sortable">
                            Deaths
                            <span
                              v-if="mapStatsSortField === 'totalDeaths'"
                              class="sort-indicator"
                              :class="mapStatsSortDirection"
                            >▲</span>
                          </th>
                          <th @click="changeMapStatsSort('sessionsPlayed')" class="sortable">
                            Sessions
                            <span
                              v-if="mapStatsSortField === 'sessionsPlayed'"
                              class="sort-indicator"
                              :class="mapStatsSortDirection"
                            >▲</span>
                          </th>
                          <th @click="changeMapStatsSort('totalPlayTimeMinutes')" class="sortable">
                            Play Time
                            <span
                              v-if="mapStatsSortField === 'totalPlayTimeMinutes'"
                              class="sort-indicator"
                              :class="mapStatsSortDirection"
                            >▲</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(map, mapIndex) in sortedMapStats"
                          :key="mapIndex"
                          class="map-row"
                        >
                          <td class="map-name-cell">
                            <router-link 
                              :to="{
                                path: `/players/${encodeURIComponent(playerName)}/sessions`,
                                query: { 
                                  map: map.mapName,
                                  ...(expandedServerName && { server: expandedServerName })
                                }
                              }"
                              class="map-name-link"
                            >
                              {{ map.mapName }}
                            </router-link>
                          </td>
                          <td class="score-cell">
                            {{ map.totalScore }}
                          </td>
                          <td class="kdr-cell">
                            {{ calculateKDR(map.totalKills, map.totalDeaths) }}
                          </td>
                          <td class="kills-cell">
                            {{ map.totalKills }}
                          </td>
                          <td class="deaths-cell">
                            {{ map.totalDeaths }}
                          </td>
                          <td class="sessions-cell">
                            {{ map.sessionsPlayed }}
                          </td>
                          <td class="playtime-cell">
                            {{ formatPlayTime(map.totalPlayTimeMinutes) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>


                </div>
                <div
                  v-else
                  class="no-map-stats"
                >
                  <p>No map statistics available for the selected time range.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Player Comparison section -->
        <div
          v-if="playerStats"
          class="stats-section"
        >
          <h3
            class="collapsible-header"
            @click="toggleSimilarPlayersSection"
          >
            Player Comparison & Analysis
            <span class="toggle-icon">{{ similarSectionExpanded ? '▲' : '▼' }}</span>
            <span
              v-if="!similarSectionExpanded"
              class="expand-hint"
            >Click to find players like {{ playerName }}</span>
          </h3>
          <div v-if="similarSectionExpanded">
            <!-- Detection Mode Selector -->
            <div class="detection-mode-selector">
              <div class="segmented-control">
                <button 
                  :class="['segment', { active: detectionMode === 'default' }]"
                  @click="setDetectionMode('default')"
                >
                  <span class="segment-icon">👥</span>
                  Similar Players
                </button>
                <button 
                  :class="['segment', { active: detectionMode === 'aliasdetection' }]"
                  @click="setDetectionMode('aliasdetection')"
                >
                  <span class="segment-icon">🔍</span>
                  Find Aliases
                </button>
              </div>
            </div>
            
            <!-- Filter Controls -->
            <div
              v-if="similarPlayers.length > 0 && targetPlayerStats"
              class="comparison-filters"
            >
              <div class="filter-toggle">
                <label class="toggle-switch">
                  <input
                    v-model="showOnlyComparable"
                    type="checkbox"
                  >
                  <span class="toggle-slider" />
                  <span class="toggle-label">Show only comparable data</span>
                </label>
              </div>
            </div>
            
            <div
              v-if="loadingSimilarPlayers"
              class="loading-container"
            >
              <div class="loading-spinner" />
              <p>Loading similar players...</p>
            </div>
            <div
              v-else-if="similarPlayersError"
              class="error-container"
            >
              <p class="error-message">
                {{ similarPlayersError }}
              </p>
            </div>
            <div
              v-else-if="similarPlayers.length > 0 && targetPlayerStats"
              class="comparison-cards-container"
            >
              <!-- Comparison cards for each similar player -->
              <div
                v-for="(similarPlayer, idx) in similarPlayers"
                :key="idx"
                class="comparison-card"
                :class="{ expanded: isPlayerCardExpanded(idx) }"
              >
                <div 
                  class="comparison-card-header"
                  @click="togglePlayerCard(idx)"
                >
                  <div class="player-comparison-summary">
                    <div class="target-player-info">
                      <h4 class="player-name">
                        {{ targetPlayerStats.playerName }}
                      </h4>
                      <span class="player-label">Target Player</span>
                    </div>
                    <div class="vs-divider">
                      <span class="vs-text">vs</span>
                      <div 
                        class="similarity-score"
                        :style="{ backgroundColor: similarityColor(similarPlayer.similarityScore) }"
                      >
                        {{ (similarPlayer.similarityScore * 100).toFixed(0) }}%
                      </div>
                    </div>
                    <div class="similar-player-info">
                      <router-link
                        :to="{ name: 'player-comparison', query: { player1: playerName, player2: similarPlayer.playerName } }"
                        class="player-name similar-player-link"
                        @click.stop
                      >
                        {{ similarPlayer.playerName }}
                      </router-link>
                      <span class="player-label">
                        {{ detectionMode === 'aliasdetection' ? 'Potential Alias' : 'Similar Player' }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Compact stats summary when collapsed -->
                  <div class="compact-stats-summary">
                    <div class="compact-stat">
                      <span class="compact-label">K/D:</span>
                      <span class="compact-values">
                        {{ targetPlayerStats.killDeathRatio.toFixed(2) }} vs {{ similarPlayer.killDeathRatio.toFixed(2) }}
                      </span>
                    </div>
                    <div class="compact-stat">
                      <span class="compact-label">KPM:</span>
                      <span class="compact-values">
                        {{ targetPlayerStats.killsPerMinute.toFixed(2) }} vs {{ similarPlayer.killsPerMinute.toFixed(2) }}
                      </span>
                    </div>
                    <div class="compact-stat">
                      <span class="compact-label">Server:</span>
                      <span class="compact-values">
                        {{ targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName ? '✓ Same' : '✗ Different' }}
                      </span>
                    </div>
                    <div class="compact-stat">
                      <span class="compact-label">Common Servers:</span>
                      <span class="compact-values">
                        {{ getCommonServers(targetPlayerStats, similarPlayer).length }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Key similarity reasons - always show top 2 -->
                  <div class="similarity-reasons-summary">
                    <div class="reasons-grid compact">
                      <div
                        v-for="(reason, rIdx) in similarPlayer.similarityReasons.slice(0, 2)"
                        :key="rIdx"
                        class="reason-chip compact"
                      >
                        {{ reason }}
                      </div>
                      <div
                        v-if="similarPlayer.similarityReasons.length > 2"
                        class="reason-chip more-reasons compact"
                      >
                        +{{ similarPlayer.similarityReasons.length - 2 }} more
                      </div>
                    </div>
                  </div>

                  <!-- Expand/collapse indicator -->
                  <div class="expand-indicator">
                    <span class="expand-text">{{ isPlayerCardExpanded(idx) ? 'Click to collapse' : 'Click for detailed comparison' }}</span>
                    <span class="expand-icon">{{ isPlayerCardExpanded(idx) ? '▲' : '▼' }}</span>
                  </div>
                </div>

                <!-- Detailed comparison stats - only show when expanded -->
                <div 
                  v-if="isPlayerCardExpanded(idx)"
                  class="comparison-stats-grid"
                >
                  <!-- Basic stats comparison -->
                  <div class="stats-category">
                    <h5 class="category-title">
                      Performance Stats
                    </h5>
                    <div class="stat-comparison-row">
                      <div class="stat-comparison-item">
                        <span class="stat-label">K/D Ratio</span>
                        <div class="stat-values">
                          <span class="target-value">{{ targetPlayerStats.killDeathRatio.toFixed(2) }}</span>
                          <span class="comparison-divider">vs</span>
                          <span class="similar-value">{{ similarPlayer.killDeathRatio.toFixed(2) }}</span>
                        </div>
                      </div>
                      <div class="stat-comparison-item">
                        <span class="stat-label">Kills/Min</span>
                        <div class="stat-values">
                          <span class="target-value">{{ targetPlayerStats.killsPerMinute.toFixed(2) }}</span>
                          <span class="comparison-divider">vs</span>
                          <span class="similar-value">{{ similarPlayer.killsPerMinute.toFixed(2) }}</span>
                        </div>
                      </div>
                      <div class="stat-comparison-item">
                        <span class="stat-label">Play Time</span>
                        <div class="stat-values">
                          <span class="target-value">{{ formatPlayTime(targetPlayerStats.totalPlayTimeMinutes) }}</span>
                          <span class="comparison-divider">vs</span>
                          <span class="similar-value">{{ formatPlayTime(similarPlayer.totalPlayTimeMinutes) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Server preferences comparison -->
                  <div 
                    v-if="!showOnlyComparable || getCommonServers(targetPlayerStats, similarPlayer).length > 0"
                    class="stats-category"
                  >
                    <h5 class="category-title">
                      Server Preferences
                    </h5>
                    <div class="stat-comparison-row">
                      <div class="stat-comparison-item full-width">
                        <span class="stat-label">Favorite Server</span>
                        <div class="stat-values vertical">
                          <span class="target-value">{{ targetPlayerStats.favoriteServerName }}</span>
                          <span class="similar-value">{{ similarPlayer.favoriteServerName }}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      v-if="getCommonServers(targetPlayerStats, similarPlayer).length > 0"
                      class="common-data-section"
                    >
                      <span class="common-label">Common Servers ({{ getCommonServers(targetPlayerStats, similarPlayer).length }}):</span>
                      <div class="server-ping-comparison-grid">
                        <div
                          v-for="server in getCommonServers(targetPlayerStats, similarPlayer).slice(0, 4)"
                          :key="server"
                          class="server-ping-item"
                        >
                          <span class="server-name">{{ server }}</span>
                          <div class="ping-comparison">
                            <span class="target-ping">{{ Math.round(targetPlayerStats.serverPings[server]) }}ms</span>
                            <span class="vs">vs</span>
                            <span class="similar-ping">{{ Math.round(similarPlayer.serverPings[server]) }}ms</span>
                            <span 
                              class="ping-diff"
                              :class="{ 
                                'similar-pings': Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 10,
                                'different-pings': Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) > 30
                              }"
                            >
                              ({{ Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]).toFixed(0) }}ms diff)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="getCommonServers(targetPlayerStats, similarPlayer).length > 4"
                        class="more-servers-indicator"
                      >
                        +{{ getCommonServers(targetPlayerStats, similarPlayer).length - 4 }} more servers in common
                      </div>
                    </div>
                  </div>

                  <!-- Map performance comparison -->
                  <div 
                    v-if="!showOnlyComparable || getCommonMaps(targetPlayerStats, similarPlayer).length > 0"
                    class="stats-category"
                  >
                    <h5 class="category-title">
                      Map Performance
                    </h5>
                    <div
                      v-if="getCommonMaps(targetPlayerStats, similarPlayer).length > 0"
                      class="common-data-section"
                    >
                      <span class="common-label">Common Maps ({{ getCommonMaps(targetPlayerStats, similarPlayer).length }}):</span>
                      <div class="map-comparison-grid">
                        <div
                          v-for="map in getCommonMaps(targetPlayerStats, similarPlayer).slice(0, 4)"
                          :key="map"
                          class="map-comparison-item"
                        >
                          <span class="map-name">{{ map }}</span>
                          <div class="map-scores">
                            <span class="target-score">{{ targetPlayerStats.mapDominanceScores[map].toFixed(1) }}</span>
                            <span class="vs">vs</span>
                            <span class="similar-score">{{ similarPlayer.mapDominanceScores[map].toFixed(1) }}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="getCommonMaps(targetPlayerStats, similarPlayer).length > 4"
                        class="more-maps-indicator"
                      >
                        +{{ getCommonMaps(targetPlayerStats, similarPlayer).length - 4 }} more maps in common
                      </div>
                    </div>
                    <div
                      v-else-if="!showOnlyComparable"
                      class="no-common-data"
                    >
                      <span class="no-common-label">No common maps found</span>
                    </div>
                  </div>

                  <!-- Online hours comparison -->
                  <div 
                    v-if="!showOnlyComparable || getCommonOnlineHours(targetPlayerStats, similarPlayer).length > 0"
                    class="stats-category"
                  >
                    <h5 class="category-title">
                      Activity Patterns
                    </h5>
                    <div
                      v-if="getCommonOnlineHours(targetPlayerStats, similarPlayer).length > 0"
                      class="common-data-section"
                    >
                      <span class="common-label">Common Online Hours - Your Time ({{ getCommonOnlineHours(targetPlayerStats, similarPlayer).length }}):</span>
                      <div class="common-hours">
                        {{ formatOnlineHours(getCommonOnlineHours(targetPlayerStats, similarPlayer)) }}
                      </div>
                    </div>
                    <div class="temporal-overlap-info">
                      <div class="overlap-stat">
                        <span class="stat-label">Temporal Overlap:</span>
                        <span class="stat-value">{{ formatPlayTime(similarPlayer.temporalOverlapMinutes) }}</span>
                      </div>
                      <div class="overlap-stat">
                        <span class="stat-label">Non-overlap Score:</span>
                        <span 
                          class="stat-value"
                          :class="{ 'high-score': similarPlayer.temporalNonOverlapScore > 0.8 }"
                        >
                          {{ (similarPlayer.temporalNonOverlapScore * 100).toFixed(0) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="no-data-container"
            >
              <p>No similar players found.</p>
            </div>
          </div>
        </div>

        <!-- Recent rounds section -->
        <div
          v-if="playerStats.recentSessions.length > 0"
          class="stats-section"
        >
          <div class="section-header-with-action">
            <h3>Recent Rounds</h3>
            <router-link
              :to="`/players/${encodeURIComponent(playerName)}/sessions`"
              class="view-all-button"
            >
              View All
            </router-link>
          </div>
          <!-- Timeline container -->
          <div class="timeline-container">
            <template
              v-for="(session, index) in playerStats.recentSessions"
              :key="index"
            >
              <!-- Session timeline item -->
              <div class="timeline-item">
                <!-- Timeline node -->
                <div class="timeline-node-container">
                  <div 
                    class="timeline-node" 
                    :class="getPerformanceClass(session)"
                    :title="getPerformanceLabel(session)"
                  />
                </div>
                
                <!-- Session card -->
                <div 
                  class="session-card"
                  @click="(event) => openSessionDetailsModal(session.serverGuid, session.mapName, session.startTime, event)"
                >
                  <div class="session-line-1">
                    <router-link 
                      :to="getRoundReportRoute(session)" 
                      class="time-link"
                    >
                      {{ formatRelativeTime(session.startTime) }}
                    </router-link>
                    <span class="session-separator">-</span>
                    <router-link 
                      :to="`/servers/${encodeURIComponent(session.serverName)}`" 
                      class="server-link"
                    >
                      {{ session.serverName }}
                    </router-link>
                    <span
                      v-if="session.isActive"
                      class="active-session-badge"
                    >Active</span>
                  </div>
                  
                  <div class="session-line-2">
                    <span class="map-name">{{ session.mapName }}</span>
                    <span class="game-type">({{ session.gameType }})</span>
                  </div>
                  
                  <div class="session-line-3">
                    <span class="session-score">{{ session.totalScore }} pts</span>
                    <span class="stat-separator">•</span>
                    <span class="stat-item">
                      {{ calculateKDR(session.totalKills, session.totalDeaths) }} KDR (<span class="kills-count">{{ session.totalKills }}</span> / <span class="deaths-count">{{ session.totalDeaths }}</span>)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Time gap as a separate timeline item -->
              <div 
                v-if="index < playerStats.recentSessions.length - 1 && getTimeGap(session, playerStats.recentSessions[index + 1])" 
                class="timeline-gap-item"
              >
                <div class="time-gap-separator">
                  <div class="time-gap-line" />
                  <div class="time-gap-badge">
                    {{ getTimeGap(session, playerStats.recentSessions[index + 1]) }}
                  </div>
                  <div class="time-gap-line" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <div
        v-else
        class="no-data-container"
      >
        <p>No player statistics available.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Show/hide classes for responsive design */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* Base mobile improvements */
.player-details-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 10px;
  }
  
  .player-details-container {
    padding: 8px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .player-details-container {
    padding: 4px;
  }

  .player-stats-header {
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
    padding: 4px 0;
    margin-bottom: 6px;
  }

  .player-name-container {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }

  .player-name-heading {
    font-size: 1.3rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .back-button {
    width: fit-content;
    padding: 6px 10px;
  }

  .stats-container {
    padding: 0;
    gap: 6px;
  }

  .stats-section {
    padding: 6px 0;
    margin: 0;
    background: transparent;
    border-radius: 0;
  }

  .stats-section h3 {
    font-size: 1.1rem;
    margin: 0 0 6px 0;
    padding: 0 0 4px 0;
  }

  .section-header-with-action h3 {
    font-size: 1.1rem;
  }

  .view-all-button {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .best-session-container {
    grid-column: 1;
  }

  .insights-period {
    font-size: 0.85rem;
    text-align: center;
    padding: 4px;
    margin: 0 0 6px 0;
    background: var(--color-background-soft);
    border-radius: 6px;
  }

  .insights-subsection {
    margin-top: 12px;
    padding-top: 8px;
  }

  .insights-subsection h4 {
    font-size: 1rem;
    margin-bottom: 6px;
  }

  .activity-chart-container {
    height: 60px;
    margin: 6px 0;
  }

  .time-period-labels {
    margin: 4px 0 2px 0;
  }

  .period-name {
    font-size: 0.75rem;
  }

  .period-hours {
    font-size: 0.65rem;
  }

  /* Show/hide content for mobile */
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
  }

  /* Table improvements for mobile */
  .recent-servers-table, .server-rankings-table, .favorite-maps-table {
    overflow-x: auto;
    margin: 0;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 6px 4px;
  }

  th {
    font-size: 0.75rem;
  }

  .table-secondary-text {
    font-size: 0.75rem;
    margin-top: 2px;
  }

  .time-link {
    font-size: 0.85rem;
  }

  .current-server-banner {
    padding: 6px 8px;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  .session-stats {
    font-size: 0.8rem;
    margin-top: 4px;
  }

  .best-session-card {
    padding: 8px;
    margin-top: 4px;
  }

  .best-session-score {
    font-size: 1.5rem;
    margin-right: 6px;
  }

  .best-session-badge {
    padding: 3px 6px;
    font-size: 0.8rem;
  }

  .best-session-details {
    font-size: 0.8rem;
    line-height: 1.3;
  }

  .stat-badge {
    font-size: 0.8rem;
    padding: 3px 6px;
  }

  .player-ping {
    font-size: 0.75rem;
    padding: 3px 5px;
  }

  .active-session-badge {
    font-size: 0.75rem;
    padding: 2px 5px;
  }

  /* Mobile details styling */
  .ranking-details, .map-details, .session-details {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: 4px;
    line-height: 1.3;
  }

  .session-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .session-info, .session-stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .detail-item {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .detail-separator {
    color: var(--color-text-muted);
    font-weight: normal;
    opacity: 0.6;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .player-details-container {
    padding: 4px;
  }

  .player-stats-header {
    gap: 4px;
    padding: 2px 0;
    margin-bottom: 4px;
  }

  .player-name-heading {
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .back-button {
    padding: 5px 8px;
    font-size: 0.9rem;
  }

  .stats-container {
    gap: 4px;
  }

  .stats-section {
    padding: 4px 0;
  }

  .stats-section h3 {
    font-size: 1rem;
    margin: 0 0 4px 0;
    padding: 0 0 2px 0;
  }

  .section-header-with-action h3 {
    font-size: 1rem;
  }

  .view-all-button {
    padding: 4px 6px;
    font-size: 0.8rem;
  }

  .stats-grid {
    gap: 8px;
  }

  .insights-period {
    margin: 0 0 4px 0;
    padding: 3px;
    font-size: 0.8rem;
  }

  .insights-subsection {
    margin-top: 10px;
    padding-top: 6px;
  }

  .insights-subsection h4 {
    font-size: 0.95rem;
    margin-bottom: 4px;
  }

  .activity-chart-container {
    height: 50px;
    margin: 4px 0;
  }

  .time-period-labels {
    margin: 2px 0 1px 0;
  }

  .period-name {
    font-size: 0.7rem;
  }

  .period-hours {
    font-size: 0.6rem;
  }

  table {
    font-size: 0.8rem;
  }

  th, td {
    padding: 4px 3px;
  }

  th {
    font-size: 0.7rem;
  }

  .table-secondary-text {
    font-size: 0.7rem;
  }

  .time-link {
    font-size: 0.8rem;
  }

  .current-server-banner {
    padding: 4px 6px;
    margin-bottom: 6px;
    font-size: 0.85rem;
  }

  .session-stats {
    font-size: 0.75rem;
  }

  .best-session-card {
    padding: 6px;
  }

  .best-session-score {
    font-size: 1.3rem;
    margin-right: 4px;
  }

  .best-session-badge {
    padding: 2px 4px;
    font-size: 0.75rem;
  }

  .best-session-details {
    font-size: 0.75rem;
  }

  .stat-badge {
    font-size: 0.75rem;
    padding: 2px 4px;
  }

  .player-ping {
    font-size: 0.7rem;
    padding: 1px 3px;
  }

  .active-session-badge {
    font-size: 0.7rem;
    padding: 1px 4px;
  }

  .trophy-icon {
    font-size: 1rem;
  }

  .activity-chart-container {
    height: 45px;
  }

  .stats-grid {
    gap: 6px;
  }

  /* Mobile details styling for smaller screens */
  .ranking-details, .map-details, .session-details {
    font-size: 0.75rem;
    margin-top: 3px;
  }

  .session-info, .session-stats {
    gap: 3px;
  }

  .detail-item {
    font-size: 0.75rem;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .player-details-container {
    padding: 4px;
  }

  .player-stats-header {
    padding: 2px 0;
  }

  .player-name-heading {
    font-size: 1.1rem;
  }

  .back-button {
    padding: 4px 6px;
    font-size: 0.85rem;
  }

  .stats-container {
    gap: 3px;
  }

  .stats-section {
    padding: 3px 0;
  }

  .insights-period {
    margin: 0 0 3px 0;
    padding: 2px;
    font-size: 0.75rem;
  }

  .insights-subsection {
    margin-top: 8px;
    padding-top: 4px;
  }

  .insights-subsection h4 {
    font-size: 0.9rem;
    margin-bottom: 3px;
  }

  table {
    font-size: 0.75rem;
  }

  th, td {
    padding: 3px 2px;
  }

  th {
    font-size: 0.65rem;
  }

  .table-secondary-text {
    font-size: 0.65rem;
  }

  .time-link {
    font-size: 0.75rem;
  }

  .current-server-banner {
    padding: 3px 4px;
    margin-bottom: 4px;
    font-size: 0.8rem;
  }

  .session-stats {
    font-size: 0.7rem;
  }

  .best-session-card {
    padding: 4px;
  }

  .best-session-score {
    font-size: 1.2rem;
  }

  .best-session-badge {
    padding: 1px 3px;
    font-size: 0.7rem;
  }

  .best-session-details {
    font-size: 0.7rem;
  }

  .stat-badge {
    font-size: 0.7rem;
    padding: 1px 3px;
  }

  .player-ping {
    font-size: 0.65rem;
    padding: 1px 2px;
  }

  .active-session-badge {
    font-size: 0.65rem;
    padding: 1px 3px;
  }

  .trophy-icon {
    font-size: 0.9rem;
  }

  .activity-chart-container {
    height: 45px;
  }

  .stats-grid {
    gap: 6px;
  }

  /* Mobile details styling for extra small screens */
  .ranking-details, .map-details, .session-details {
    font-size: 0.7rem;
    margin-top: 2px;
  }

  .session-info, .session-stats {
    gap: 2px;
  }

  .detail-item {
    font-size: 0.7rem;
  }
}

.player-details-container {
  background-color: var(--color-background);
  border-radius: 0;
  box-shadow: none;
  padding: 12px;
}

.player-stats-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 8px;
}

.player-name-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.player-name-heading {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #ff5252;
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
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.back-button:hover {
  background-color: var(--color-primary);
  color: white;
}

.status-badge.active {
  background-color: #4CAF50;
}

.current-server-banner {
  background-color: var(--color-background-mute);
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-weight: bold;
  color: var(--color-heading);
  border-left: 4px solid #4CAF50;
}

.server-info-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.game-id {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: normal;
}

.session-stats {
  margin-top: 5px;
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: normal;
}

.player-stats-body {
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

.stats-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 8px;
}

.stats-section h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 6px;
}

.section-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 6px;
}

.section-header-with-action h3 {
  margin: 0;
  padding: 0;
  border-bottom: none;
}

.view-all-button {
  padding: 5px 10px;
  background-color: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 4px;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background-color 0.2s;
}

.view-all-button:hover {
  background-color: var(--color-accent);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: bold;
}

.stat-value-secondary {
  font-size: 0.9rem;
  font-weight: normal;
  color: var(--color-text-muted);
  margin-top: 3px;
}

.combat-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.stat-badge {
  display: inline-block;
  background-color: var(--color-background-soft);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--color-text);
  transition: background-color 0.2s;
}

.stat-badge:hover {
  background-color: var(--color-background-mute);
}

/* Best Session Styles */
.best-session-container {
  grid-column: 1 / -1; /* Make it span all columns */
}

/* Desktop alignment for best session */
@media (min-width: 769px) {
  .best-session-container {
    text-align: left;
    align-items: flex-start;
    justify-self: stretch;
  }
  
  .best-session-container .stat-item {
    align-items: flex-start;
    text-align: left;
  }
  
  .best-session-card {
    text-align: left;
    width: 100%;
    align-self: flex-start;
  }
  
  .best-session-header {
    justify-content: flex-start;
    text-align: left;
  }
  
  .best-session-details {
    text-align: left;
  }
}

.trophy-icon {
  font-size: 1.2rem;
  margin-right: 5px;
  color: gold;
}

.best-session-card {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
  display: block;
}

.best-session-flex {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18px;
}

.best-session-icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 100%;
  gap: 4px;
}

.best-session-details-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clickable-best-session {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-best-session:hover {
  background-color: var(--color-background-soft);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  border-color: var(--color-primary);
}

.best-session-title {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 8px;
  font-weight: 600;
}

.best-session-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.best-session-score {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-heading);
  margin-right: 8px;
}

.best-session-badge {
  background-color: var(--color-background-soft);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--color-text);
}

.best-session-details {
  font-size: 0.9rem;
  color: var(--color-text);
  line-height: 1.4;
}

.online-times-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

.online-times-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: var(--color-heading);
}

.player-count {
  font-size: 0.9rem;
  margin-left: 5px;
  color: var(--color-text);
}

.table-secondary-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.active-session-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #4CAF50;
  margin-top: 2px;
}


table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  table-layout: fixed;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

th {
  background-color: var(--color-background-mute);
  font-weight: bold;
  color: var(--color-heading);
}

tbody tr:hover {
  background-color: var(--color-background-mute);
}

/* Desktop table styles - ensure proper column layout */
@media (min-width: 769px) {
  .server-rankings-table table {
    table-layout: auto;
    width: 100%;
    min-width: 100%;
  }
  
  .server-rankings-table th,
  .server-rankings-table td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .server-rankings-table th:first-child,
  .server-rankings-table td:first-child {
    width: 40%;
    white-space: normal;
  }
  
  .server-rankings-table th:nth-child(2),
  .server-rankings-table td:nth-child(2) {
    width: 15%;
    text-align: center;
  }
  
  .server-rankings-table th:nth-child(3),
  .server-rankings-table td:nth-child(3) {
    width: 20%;
    text-align: center;
  }
  
  .server-rankings-table th:nth-child(4),
  .server-rankings-table td:nth-child(4) {
    width: 15%;
    text-align: center;
  }
  
  /* Ensure desktop-only columns are properly displayed */
  .desktop-only {
    display: table-cell !important;
  }
  
  .mobile-only {
    display: none !important;
  }
  
  /* Desktop styles for favorite maps table */
  .favorite-maps-table th:first-child,
  .favorite-maps-table td:first-child {
    width: 25%;
    white-space: normal;
  }
  
  .favorite-maps-table th:nth-child(2),
  .favorite-maps-table td:nth-child(2) {
    width: 20%;
    text-align: center;
  }
  
  .favorite-maps-table th:nth-child(3),
  .favorite-maps-table td:nth-child(3) {
    width: 15%;
    text-align: center;
  }
  
  .favorite-maps-table th:nth-child(4),
  .favorite-maps-table td:nth-child(4) {
    width: 12%;
    text-align: center;
  }
  
  .favorite-maps-table th:nth-child(5),
  .favorite-maps-table td:nth-child(5) {
    width: 12%;
    text-align: center;
  }
  
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: var(--color-background-mute);
}

/* Insights Styles */
.insights-period {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 15px;
}

.insights-subsection {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

/* Remove border-top from the first .insights-subsection after Player Insights heading */
.stats-section > .insights-subsection:first-of-type {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}

.insights-subsection h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: var(--color-heading);
}

.insights-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.insights-card {
  background-color: var(--color-background);
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  flex: 1;
  max-width: calc(33.333% - 8px);
}

.insights-card-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--color-heading);
  font-size: 0.95rem;
}

.insights-card-value {
  color: var(--color-text);
  font-size: 0.9rem;
}

.best-kill-map {
  max-width: 100%;
  background-color: var(--color-background-soft);
  border-left: 4px solid var(--color-accent);
}

.insights-card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.insights-card-stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

.insights-card-stat .stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.insights-card-stat .stat-value {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--color-text);
}

.activity-chart-wrapper {
  margin: 10px 0;
}

.activity-chart-container {
  height: 80px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
  border: 1px solid rgba(156, 39, 176, 0.1);
  padding: 5px;
}

/* Time period background zones */
.time-period-zones {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  pointer-events: none;
  z-index: 1;
}

.time-zone {
  flex: 1;
  transition: opacity 0.2s ease;
}

.early-zone {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.25) 0%, rgba(103, 58, 183, 0.15) 100%);
  flex: 8; /* 8 hours: 00-08 */
}

.day-zone {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.3) 0%, rgba(156, 39, 176, 0.2) 100%);
  flex: 8; /* 8 hours: 08-16 */
}

.night-zone {
  background: linear-gradient(135deg, rgba(74, 20, 140, 0.35) 0%, rgba(74, 20, 140, 0.25) 100%);
  flex: 8; /* 8 hours: 16-24 */
}

/* Time period labels */
.time-period-labels {
  display: flex;
  margin: 8px 0 5px 0;
  padding: 0 5px;
}

.period-label {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.period-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.period-hours {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

.early-label .period-name {
  color: rgba(103, 58, 183, 0.9);
}

.day-label .period-name {
  color: rgba(156, 39, 176, 0.9);
}

.night-label .period-name {
  color: rgba(74, 20, 140, 0.9);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .early-label .period-name {
    color: rgba(159, 126, 219, 0.9); /* Lighter purple for dark mode */
  }
  
  .night-label .period-name {
    color: rgba(149, 117, 205, 0.9); /* Lighter purple for dark mode */
  }
}

/* Also handle explicit dark mode class if used */
.dark-mode .early-label .period-name,
:root.dark-mode .early-label .period-name {
  color: rgba(159, 126, 219, 0.9); /* Lighter purple for dark mode */
}

.dark-mode .night-label .period-name,
:root.dark-mode .night-label .period-name {
  color: rgba(149, 117, 205, 0.9); /* Lighter purple for dark mode */
}

/* Favorite Maps Table Styles */
.favorite-maps-table {
  overflow-x: auto;
  margin-top: 10px;
}

.sortable-header {
  cursor: pointer;
  position: relative;
  user-select: none;
  transition: background-color 0.2s;
}

.sortable-header:hover {
  background-color: var(--color-background);
}

.sort-indicator {
  margin-left: 5px;
  font-size: 0.8rem;
  display: inline-block;
}

@media (max-width: 768px) {
  .player-stats-modal-content {
    width: 95%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .insights-card {
    max-width: 100%;
  }

  .activity-chart-container {
    height: 60px;
  }

  .period-name {
    font-size: 0.75rem;
  }

  .period-hours {
    font-size: 0.65rem;
  }
}

.server-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.server-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.player-ping {
  text-align: center;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 6px;
  border-radius: 4px;
}

.ping-good {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.ping-ok {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.ping-bad {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.kills-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

.deaths-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

.kdr-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

/* Server Rankings and Map Stats Styles */
.server-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.server-row:hover {
  background-color: var(--color-background-mute);
}

/* Map Stats Table - Adopting LandingPage.vue styling */
.map-stats-table-container {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  overflow-x: auto;
}

.map-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

.map-stats-table th {
  background: var(--color-background-mute);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  border-bottom: 2px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.map-stats-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  user-select: none;
}

.map-stats-table th.sortable:hover {
  background: var(--color-background);
}

.map-stats-table .sort-indicator {
  display: inline-block;
  margin-left: 6px;
  font-size: 10px;
  transition: transform 0.2s;
  opacity: 0.5;
}

.map-stats-table .sort-indicator.asc {
  transform: rotate(0deg);
  opacity: 1;
  color: var(--color-primary);
}

.map-stats-table .sort-indicator.desc {
  transform: rotate(180deg);
  opacity: 1;
  color: var(--color-primary);
}

.map-stats-table td {
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.map-stats-table .map-row {
  transition: all 0.2s ease;
}

.map-stats-table .map-row:hover {
  background: var(--color-background);
}

.map-stats-table .map-name-cell {
  max-width: 200px;
}

.map-stats-table .map-name-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: color 0.2s ease;
  color: #ff9800;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-stats-table .map-name-link:hover {
  color: var(--color-primary);
}

.map-stats-table .score-cell {
  text-align: center;
  font-weight: 600;
}

.map-stats-table .kdr-cell {
  text-align: center;
  font-weight: 600;
  color: var(--color-text);
}

.map-stats-table .kills-cell {
  text-align: center;
  color: #4caf50;
  font-weight: 500;
}

.map-stats-table .deaths-cell {
  text-align: center;
  color: #f44336;
  font-weight: 500;
}

.map-stats-table .sessions-cell {
  text-align: center;
  color: var(--color-text-muted);
}

.map-stats-table .playtime-cell {
  text-align: center;
  color: var(--color-text-muted);
}

.server-name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  transition: transform 0.2s;
}

.map-stats-expansion {
  background-color: var(--color-background-soft);
  padding: 16px;
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.map-stats-content {
  margin-top: 12px;
  overflow-x: auto;
  width: 100%;
}

.map-stats-grid {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) minmax(80px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(80px, 1fr) minmax(100px, 1.2fr);
  gap: 1px;
  background-color: var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
  min-width: 640px;
}

.header-cell {
  background-color: var(--color-background-mute);
  padding: 12px 8px;
  font-weight: bold;
  color: var(--color-heading);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.header-cell:nth-child(1) {
  justify-content: flex-start;
}

.header-cell:hover {
  background-color: var(--color-background);
}

.sort-indicator {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  opacity: 0.7;
}

.data-cell {
  background-color: var(--color-background);
  padding: 10px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.data-cell:nth-child(7n+1) {
  justify-content: flex-start;
}

.time-range-filter {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.time-range-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.time-range-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.time-range-button {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.time-range-button:hover {
  background-color: var(--color-background-mute);
}

.time-range-button.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.map-stats-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--color-text-muted);
}

/* Mobile responsive styles for map stats */
@media (max-width: 768px) {
  .map-stats-expansion {
    padding: 12px;
    margin-top: 8px;
  }

  .map-stats-grid {
    font-size: 0.9rem;
  }

  .header-cell {
    padding: 8px 6px;
    font-size: 0.85rem;
  }

  .data-cell {
    padding: 8px 6px;
    font-size: 0.85rem;
  }
}

.no-map-stats {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
}

.map-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.map-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}



/* Mobile Styles */
@media (max-width: 768px) {
  .map-stats-container {
    padding: 8px;
  }

  .time-range-filter {
    margin-bottom: 12px;
    gap: 8px;
  }

  .time-range-label {
    width: 100%;
  }

  .time-range-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .time-range-button {
    flex: 1;
    padding: 4px 8px;
    font-size: 0.8rem;
    text-align: center;
  }

  .map-stats-table th,
  .map-stats-table td {
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .map-stats-table th.sortable {
    padding-right: 24px;
  }

  .map-stats-table .sort-indicator {
    font-size: 0.8rem;
  }

  .stat-row-condensed {
    gap: 4px;
    font-size: 0.85rem;
  }

  .stat-item {
    gap: 3px;
    font-size: 0.85rem;
  }

  .map-stat-details {
    gap: 4px;
  }
}

/* Mobile Card Layout Styles */
.map-stats-cards {
  display: none;
}

.mobile-sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background-color: var(--color-background);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.mobile-sort-controls label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  min-width: fit-content;
}

.mobile-sort-select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

.mobile-sort-direction {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-mute);
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 40px;
}

.mobile-sort-direction:hover {
  background-color: var(--color-primary);
  color: white;
}

.map-stat-card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.map-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.map-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  flex: 1;
  line-height: 1.2;
}

.map-score {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-primary);
  min-width: fit-content;
}

.map-stat-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.stat-row-condensed {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: var(--color-text);
}

.stat-separator {
  color: var(--color-text-muted);
  font-weight: normal;
  opacity: 0.6;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Mobile styles */
@media (max-width: 768px) {
  .map-stats-cards {
    display: block !important;
  }

  .time-range-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .time-range-label {
    text-align: center;
    font-weight: 600;
  }

  .time-range-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .time-range-button {
    padding: 8px 12px;
    font-size: 0.9rem;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .map-stats-container {
    padding: 6px;
  }

  .time-range-button {
    padding: 6px 8px;
    font-size: 0.8rem;
    min-height: 40px;
  }

  .mobile-sort-controls {
    padding: 6px;
    margin-bottom: 8px;
    gap: 6px;
  }

  .mobile-sort-controls label {
    font-size: 0.8rem;
  }

  .mobile-sort-select {
    padding: 4px 6px;
    font-size: 0.8rem;
  }

  .mobile-sort-direction {
    padding: 4px 8px;
    min-width: 36px;
  }

  .map-stat-card {
    padding: 8px;
    margin-bottom: 6px;
  }

  .map-name {
    font-size: 0.9rem;
  }

  .map-score {
    font-size: 1.1rem;
  }

  .stat-row {
    padding: 2px 0;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 0.85rem;
  }

  .map-stats-table th,
  .map-stats-table td {
    padding: 6px 8px;
    font-size: 0.85rem;
  }

  .map-stats-table th.sortable {
    padding-right: 20px;
  }

  .map-stats-table .sort-indicator {
    font-size: 0.7rem;
  }
}

/* ------------------------------------------------------------------ */
/* Fix map stats grid layout on desktop                                */
/* The generic desktop-only rule sets display: table-cell! important   */
/* which breaks the CSS grid we rely on for the map stats section.     */
/* Ensure the grid container keeps its grid display on ≥769px screens. */
@media (min-width: 769px) {
  .desktop-only.map-stats-grid {
    display: grid !important;
  }
}

/* ------------------------------------------------------------------ */
/* Timeline Styles                                                     */
/* ------------------------------------------------------------------ */

.timeline-container {
  position: relative;
  padding: 0;
  margin: 12px 0;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--color-border);
  z-index: 1;
}

.timeline-node-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 12px;
  min-width: 16px;
  z-index: 2;
  align-self: flex-start;
  margin-top: 1.8em;
}


.timeline-node {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--color-background);
  position: relative;
  z-index: 3;
  transition: all 0.2s ease;
  cursor: pointer;
}

.timeline-node:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

/* Performance-based node colors */
.performance-excellent {
  background-color: #4CAF50;
  border-color: #2E7D32;
}

.performance-good {
  background-color: #8BC34A;
  border-color: #558B2F;
}

.performance-average {
  background-color: #FFC107;
  border-color: #F57F17;
}

.performance-poor {
  background-color: #FF9800;
  border-color: #E65100;
}

.performance-bad {
  background-color: #F44336;
  border-color: #C62828;
}

.session-card {
  flex: 1;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
  border-radius: 4px;
}

.timeline-item:hover::before {
  background: var(--color-primary);
}

.session-line-1 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
  flex-wrap: wrap;
}

.session-line-1 .time-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.session-line-1 .time-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.session-separator {
  color: var(--color-text-muted);
  font-weight: normal;
  margin: 0 4px;
}

.session-line-1 .server-link {
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: normal;
  transition: color 0.2s;
}

.session-line-1 .server-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.session-line-2 {
  margin-bottom: 3px;
}

.map-name {
  font-weight: 500;
  color: var(--color-text);
  margin-right: 4px;
  font-size: 0.9rem;
}

.game-type {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: normal;
}

.session-line-3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: var(--color-text);
}

.session-score {
  font-weight: 500;
  color: var(--color-text);
}

.session-line-3 .stat-item {
  display: inline;
}

.kills-count {
  color: #4CAF50;
  font-weight: 500;
}

.deaths-count {
  color: #F44336;
  font-weight: 500;
}

.time-gap-container {
  display: flex;
  justify-content: flex-start;
  margin: 8px 0 16px 16px; /* Adjust margin to align with timeline */
  pointer-events: none;
}

.time-gap-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0;
}

.time-gap-line {
  flex: 1;
  height: 8px;
  background-image: repeating-linear-gradient(-45deg,
    var(--color-border) 0px,
    var(--color-border) 4px,
    transparent 4px,
    transparent 8px);
  background-size: 8px 8px;
}

.time-gap-badge {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  font-style: italic;
  white-space: nowrap;
  pointer-events: auto;
  z-index: 2;
}

/* Mobile responsive styles for time gap */
@media (max-width: 768px) {
  .time-gap-container {
    margin: 6px 0 12px 14px;
  }
  
  .time-gap-badge {
    font-size: 0.75rem;
    padding: 1px 6px;
  }
}

@media (max-width: 480px) {
  .time-gap-container {
    margin: 4px 0 10px 12px;
  }
  
  .time-gap-badge {
    font-size: 0.7rem;
    padding: 1px 4px;
  }
}

.time-gap-container {
  display: flex;
  justify-content: flex-start;
  margin: 0 0 12px 40px; /* left margin aligns with timeline content */
  pointer-events: none;
}

.time-gap-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding-left: 0;
}

.time-gap-line {
  width: 40px;
  height: 8px;
  background-image: repeating-linear-gradient(-45deg,
    var(--color-border) 0px,
    var(--color-border) 4px,
    transparent 4px,
    transparent 8px);
  background-size: 8px 8px;
}

.time-gap-badge {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  font-style: italic;
  white-space: nowrap;
  pointer-events: auto;
  z-index: 2;
}

/* Mobile responsive styles for timeline */
@media (max-width: 768px) {
  .timeline-container {
    margin: 8px 0;
  }
  
  .timeline-item {
    margin-bottom: 12px;
  }
  
  .timeline-item::before {
    left: 5px;
  }
  
  .timeline-node-container {
    margin-right: 10px;
    min-width: 12px;
    margin-top: 1.5em;
  }
  
  .timeline-node {
    width: 6px;
    height: 6px;
  }
  
  .session-card {
    padding: 4px 6px;
  }
  
  .session-line-1 .time-link,
  .session-line-1 .server-link {
    font-size: 0.85rem;
  }
  
  .map-name {
    font-size: 0.85rem;
  }
  
  .game-type {
    font-size: 0.8rem;
  }
  
  .session-line-3 {
    font-size: 0.8rem;
    gap: 6px;
  }
  
  .time-gap {
    left: 15px;
    bottom: -5px;
    font-size: 0.7rem;
    padding: 1px 6px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .timeline-item::before {
    left: 4px;
  }
  
  .timeline-node-container {
    margin-right: 8px;
    min-width: 10px;
    margin-top: 1.3em;
  }
  
  .timeline-node {
    width: 5px;
    height: 5px;
  }
  
  .session-card {
    padding: 3px 5px;
  }
  
  .session-line-1 {
    gap: 4px;
    margin-bottom: 2px;
  }
  
  .session-line-2 {
    margin-bottom: 2px;
  }
  
  .session-line-1 .time-link,
  .session-line-1 .server-link {
    font-size: 0.8rem;
  }
  
  .map-name {
    font-size: 0.8rem;
  }
  
  .game-type {
    font-size: 0.75rem;
  }
  
  .session-line-3 {
    font-size: 0.75rem;
    gap: 4px;
  }
}

.time-gap-container {
  display: flex;
  justify-content: flex-start; /* left align the separator */
  margin: 4px 0 12px 0;
  pointer-events: none;
}

.time-gap-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 28px; /* align with timeline node */
  width: fit-content;
}

.time-gap-line {
  width: 40px;
  height: 8px;
  background-image: repeating-linear-gradient(-45deg,
    var(--color-border) 0px,
    var(--color-border) 4px,
    transparent 4px,
    transparent 8px);
  background-size: 8px 8px;
}

.time-gap-badge {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  font-style: italic;
  white-space: nowrap;
  pointer-events: auto;
  z-index: 2;
}

@media (max-width: 768px) {
  .time-gap-separator {
    padding-left: 20px;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .time-gap-separator {
    padding-left: 16px;
    gap: 4px;
  }
  .time-gap-badge {
    font-size: 0.75rem;
    padding: 1px 6px;
  }
}

.player-header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compare-player-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid var(--color-primary);
}

.compare-player-btn:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.compare-player-btn svg {
  flex-shrink: 0;
}

.player-playtime {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-top: -4px;
  margin-bottom: 2px;
  font-weight: 400;
}

.player-combat-header {
  display: flex;
  gap: 32px;
  margin-top: 6px;
  align-items: center;
}

.combat-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.kdr-icon-large, .kills-icon-large, .deaths-icon-large {
  width: 60px;
  height: 60px;
  margin-bottom: 6px;
}

.combat-value-large {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-heading);
}

.combat-label-large {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Add styles for .player-header-meta and .player-last-seen */
.player-header-meta {
  display: flex;
  gap: 18px;
  align-items: center; /* Ensure vertical alignment */
  margin-top: -4px;
  margin-bottom: 2px;
}

.player-playtime,
.player-last-seen {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 400;
  line-height: 1.2;
  margin: 0; /* Remove any margin that could cause misalignment */
  vertical-align: middle;
  display: flex;
  align-items: center;
}

/* Enhanced styles for large combat stats - make more prominent and visually appealing */
.combat-stats-container {
  grid-column: 1 / -1; /* Span all columns in the grid */
  margin-bottom: 16px;
}

.combat-stats-large {
  display: flex;
  flex-direction: row;
  gap: 24px;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 24px;
  /* Remove background, border, border-radius, and box-shadow for flat look */
  background: none;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.stat-badge-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Remove background, border, and border-radius for flat look */
  background: none;
  border: none;
  border-radius: 0;
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text);
  transition: all 0.3s ease;
  /* Remove backdrop-filter and position/overflow */
  /* Remove hover effect */
  padding: 20px 16px;
}

.stat-badge-large:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.kills-icon-large, .deaths-icon-large, .kdr-icon-large {
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.stat-badge-large:hover .kills-icon-large,
.stat-badge-large:hover .deaths-icon-large,
.stat-badge-large:hover .kdr-icon-large {
  transform: scale(1.1);
}

.combat-value-large {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-heading);
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  line-height: 1;
}

.combat-label-large {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Enhanced best session styling - make it pop more */
.best-session-card {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, var(--color-background) 50%, rgba(255, 215, 0, 0.08) 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 48px rgba(255, 215, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  display: block;
  border: 2px solid rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.best-session-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 50%, rgba(255, 215, 0, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.best-session-card:hover::before {
  opacity: 1;
}

.best-session-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 215, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
}

.best-session-flex {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.best-session-icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 100%;
  gap: 8px;
}

.trophy-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.4));
  animation: pulse-glow 2s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  0% {
    filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.4));
  }
  100% {
    filter: drop-shadow(0 6px 12px rgba(255, 215, 0, 0.6));
  }
}

.best-badge {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  font-size: 0.9rem;
  font-weight: 800;
  border-radius: 12px;
  padding: 6px 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.best-session-details-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-line-1 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-weight: 600;
}

.session-line-2 {
  font-size: 1.1rem;
  color: var(--color-text);
  font-weight: 500;
}

.map-name {
  font-weight: 600;
  color: var(--color-heading);
}

.session-line-3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.session-score {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



/* Mobile-responsive enhancements for combat stats */
@media (max-width: 768px) {
  .combat-stats-container {
    margin-bottom: 12px;
  }

  .combat-stats-large {
    flex-direction: row; /* Keep horizontal layout */
    gap: 8px; /* Reduced gap */
    margin: 0;
    padding: 16px 8px;
    border-radius: 12px;
    justify-content: space-between; /* Distribute evenly */
  }

  .stat-badge-large {
    padding: 12px 6px;
    border-radius: 10px;
    min-width: 0; /* Remove min-width constraint */
    flex: 1; /* Equal width for all badges */
    max-width: calc(33.333% - 6px); /* Ensure they fit */
  }

  .kills-icon-large, .deaths-icon-large, .kdr-icon-large {
    width: 32px; /* Smaller icons */
    height: 32px;
    margin-bottom: 6px;
  }

  .combat-value-large {
    font-size: 1.4rem; /* Smaller values */
    margin-bottom: 2px;
  }

  .combat-label-large {
    font-size: 0.8rem; /* Smaller labels */
    margin-top: 2px;
  }

  .best-session-card {
    padding: 16px;
    border-radius: 12px;
    margin-top: 12px;
  }

  .best-session-flex {
    gap: 16px;
  }

  .best-session-icon-col {
    min-width: 48px;
    gap: 6px;
  }

  .trophy-icon {
    font-size: 2rem;
  }

  .best-badge {
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 8px;
  }

  .session-score {
    font-size: 1.2rem;
  }

  .session-line-2 {
    font-size: 1rem;
  }

  /* Improve hover effects for mobile/touch devices */
  .stat-badge-large:hover {
    transform: translateY(-2px);
  }

  .best-session-card:hover {
    transform: translateY(-3px) scale(1.01);
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .combat-stats-large {
    padding: 12px 6px;
    gap: 6px;
  }

  .stat-badge-large {
    padding: 10px 4px;
    min-width: 0;
    max-width: calc(33.333% - 4px); /* Tighter fit */
  }

  .kills-icon-large, .deaths-icon-large, .kdr-icon-large {
    width: 28px; /* Even smaller icons */
    height: 28px;
    margin-bottom: 4px;
  }

  .combat-value-large {
    font-size: 1.2rem; /* More compact */
  }

  .combat-label-large {
    font-size: 0.75rem; /* Smaller labels */
  }

  .best-session-card {
    padding: 12px;
  }

  .best-session-flex {
    gap: 12px;
  }

  .trophy-icon {
    font-size: 1.8rem;
  }

  .best-badge {
    font-size: 0.75rem;
    padding: 3px 6px;
  }
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
}

.toggle-icon {
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.similar-players-list {
  margin-top: 10px;
}

.similar-player-card {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.similar-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.similar-player-name {
  color: var(--color-primary);
  font-weight: 500;
}

.similarity-score {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.similarity-reasons {
  list-style: none;
  padding-left: 20px;
}

.no-data-container {
  text-align: center;
  padding: 20px;
  color: var(--color-text-muted);
}

.expand-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-left: 10px;
}

.similar-players-table-wrapper {
  overflow-x: auto;
  margin-top: 10px;
}

.similar-players-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}

.similar-players-table th, .similar-players-table td {
  padding: 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.similar-players-table th {
  background-color: var(--color-background-mute);
  font-weight: bold;
  color: var(--color-heading);
}

.similar-players-table tbody tr:hover {
  background-color: var(--color-background);
}

.reasons-col {
  width: 60%;
}

.similarity-score {
  font-weight: 600;
}

/* Server Cards Gamified Styles */
.server-cards-section {
  margin-top: 24px;
  grid-column: 1 / -1; /* Span all columns in the stats-grid */
}
.server-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
  margin-top: 8px;
}
.server-card-gamified {
  background: linear-gradient(135deg, rgba(156,39,176,0.08) 0%, var(--color-background) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(156,39,176,0.08), 0 1.5px 6px rgba(0,0,0,0.07);
  border: 2px solid var(--color-primary);
  padding: 14px 16px;
  min-width: 320px;
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  transition: box-shadow 0.2s, transform 0.2s;
}
.server-card-gamified:hover {
  box-shadow: 0 8px 32px rgba(156,39,176,0.18), 0 3px 12px rgba(0,0,0,0.12);
  transform: translateY(-4px) scale(1.01);
  border-color: var(--color-accent);
}
.server-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.server-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 8px;
}
.server-game-id {
  background: var(--color-background-mute);
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 3px 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.server-card-stats-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 12px;
  align-items: center;
  margin-top: 2px;
  margin-bottom: 0;
}
.server-stat-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
}
.server-stat-label {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 500;
  margin-bottom: 1px;
}
.server-stat-value {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}
.highlight-badge {
  background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  font-weight: 700;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 1.05rem;
  box-shadow: 0 2px 8px rgba(255,215,0,0.12);
}
@media (max-width: 768px) {
  .server-cards-grid {
    gap: 12px;
  }
  .server-card-gamified {
    min-width: 0;
    max-width: 100%;
    padding: 10px 6px;
  }
  .server-card-title {
    font-size: 1rem;
  }
  .server-game-id {
    font-size: 0.8rem;
    padding: 2px 7px;
  }
  .server-stat-badge {
    font-size: 0.9rem;
    padding: 5px 8px;
  }
  .highlight-badge {
    font-size: 0.9rem;
    padding: 2px 7px;
  }
}
.kills-count {
  color: #4CAF50;
  font-weight: 500;
}
.deaths-count {
  color: #F44336;
  font-weight: 500;
}
.playtime-block {
  grid-column: 1 / -1;
  margin-top: 2px;
}
.server-card-stats-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 12px;
  align-items: center;
  margin-top: 2px;
  margin-bottom: 0;
}
@media (max-width: 768px) {
  .server-card-stats-compact {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px 8px;
  }
  .playtime-block {
    grid-column: 1 / -1;
  }
}

.player-header-stats {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.header-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.header-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-heading);
}

.header-stat-kills {
  color: #4CAF50;
}

.header-stat-deaths {
  color: #F44336;
}

.header-stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compare-player-btn:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.compare-player-btn svg {
  flex-shrink: 0;
}

.player-playtime {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-top: -4px;
  margin-bottom: 2px;
  font-weight: 400;
}

/* Add styles for .player-header-meta and .player-last-seen */
.player-header-meta {
  display: flex;
  gap: 18px;
  align-items: center; /* Ensure vertical alignment */
  margin-top: -4px;
  margin-bottom: 2px;
}

.player-playtime,
.player-last-seen {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 400;
  line-height: 1.2;
  margin: 0; /* Remove any margin that could cause misalignment */
  vertical-align: middle;
  display: flex;
  align-items: center;
}

/* Enhanced best session styling - make it pop more */
.best-session-card {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, var(--color-background) 50%, rgba(255, 215, 0, 0.08) 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 48px rgba(255, 215, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  display: block;
  border: 2px solid rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.best-session-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 50%, rgba(255, 215, 0, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.best-session-card:hover::before {
  opacity: 1;
}

.best-session-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 215, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
}

.best-session-flex {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.best-session-icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 100%;
  gap: 8px;
}

.trophy-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.4));
  animation: pulse-glow 2s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  0% {
    filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.4));
  }
  100% {
    filter: drop-shadow(0 6px 12px rgba(255, 215, 0, 0.6));
  }
}

.best-badge {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  font-size: 0.9rem;
  font-weight: 800;
  border-radius: 12px;
  padding: 6px 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.best-session-details-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-line-1 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-weight: 600;
}

.session-line-2 {
  font-size: 1.1rem;
  color: var(--color-text);
  font-weight: 500;
}

.map-name {
  font-weight: 600;
  color: var(--color-heading);
}

.session-line-3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.session-score {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



/* Mobile-responsive enhancements for combat stats */
@media (max-width: 768px) {
  .best-session-card {
    padding: 16px;
    border-radius: 12px;
    margin-top: 12px;
  }

  .best-session-flex {
    gap: 16px;
  }

  .best-session-icon-col {
    min-width: 48px;
    gap: 6px;
  }

  .trophy-icon {
    font-size: 2rem;
  }

  .best-badge {
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 8px;
  }

  .session-score {
    font-size: 1.2rem;
  }

  .session-line-2 {
    font-size: 1rem;
  }

  .player-header-stats {
    gap: 20px;
    margin-top: 10px;
  }

  .header-stat-value {
    font-size: 1.3rem;
  }

  .header-stat-label {
    font-size: 0.75rem;
  }

  /* Improve hover effects for mobile/touch devices */
  .best-session-card:hover {
    transform: translateY(-3px) scale(1.01);
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .best-session-card {
    padding: 12px;
  }

  .best-session-flex {
    gap: 12px;
  }

  .trophy-icon {
    font-size: 1.8rem;
  }

  .best-badge {
    font-size: 0.75rem;
    padding: 3px 6px;
  }

  .player-header-stats {
    gap: 16px;
    justify-content: space-between;
    width: 100%;
  }

  .header-stat-value {
    font-size: 1.2rem;
  }
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
}

.toggle-icon {
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.similar-players-list {
  margin-top: 10px;
}

.similar-player-card {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.similar-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.similar-player-name {
  color: var(--color-primary);
  font-weight: 500;
}

.similarity-score {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.similarity-reasons {
  list-style: none;
  padding-left: 20px;
}

.no-data-container {
  text-align: center;
  padding: 20px;
  color: var(--color-text-muted);
}

.expand-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-left: 10px;
}

.similar-players-table-wrapper {
  overflow-x: auto;
  margin-top: 10px;
}

.similar-players-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
}

.similar-players-table th, .similar-players-table td {
  padding: 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.similar-players-table th {
  background-color: var(--color-background-mute);
  font-weight: bold;
  color: var(--color-heading);
}

.similar-players-table tbody tr:hover {
  background-color: var(--color-background);
}

.reasons-col {
  width: 60%;
}

.similarity-score {
  font-weight: 600;
}

/* Server Cards Gamified Styles */
.server-cards-section {
  margin-top: 24px;
  grid-column: 1 / -1; /* Span all columns in the stats-grid */
}
.server-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
  margin-top: 8px;
}
.server-card-gamified {
  background: linear-gradient(135deg, rgba(156,39,176,0.08) 0%, var(--color-background) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(156,39,176,0.08), 0 1.5px 6px rgba(0,0,0,0.07);
  border: 2px solid var(--color-primary);
  padding: 14px 16px;
  min-width: 320px;
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  transition: box-shadow 0.2s, transform 0.2s;
}
.server-card-gamified:hover {
  box-shadow: 0 8px 32px rgba(156,39,176,0.18), 0 3px 12px rgba(0,0,0,0.12);
  transform: translateY(-4px) scale(1.01);
  border-color: var(--color-accent);
}
.server-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.server-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 8px;
}
.server-game-id {
  background: var(--color-background-mute);
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 3px 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.server-card-stats-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 12px;
  align-items: center;
  margin-top: 2px;
  margin-bottom: 0;
}
.server-stat-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
}
.server-stat-label {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 500;
  margin-bottom: 1px;
}
.server-stat-value {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}
.highlight-badge {
  background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  font-weight: 700;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 1.05rem;
  box-shadow: 0 2px 8px rgba(255,215,0,0.12);
}
@media (max-width: 768px) {
  .server-cards-grid {
    gap: 12px;
  }
  .server-card-gamified {
    min-width: 0;
    max-width: 100%;
    padding: 10px 6px;
  }
  .server-card-title {
    font-size: 1rem;
  }
  .server-game-id {
    font-size: 0.8rem;
    padding: 2px 7px;
  }
  .server-stat-badge {
    font-size: 0.9rem;
    padding: 5px 8px;
  }
  .highlight-badge {
    font-size: 0.9rem;
    padding: 2px 7px;
  }
}
.kills-count {
  color: #4CAF50;
  font-weight: 500;
}
.deaths-count {
  color: #F44336;
  font-weight: 500;
}
.playtime-block {
  grid-column: 1 / -1;
  margin-top: 2px;
}
.server-card-stats-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 12px;
  align-items: center;
  margin-top: 2px;
  margin-bottom: 0;
}
@media (max-width: 768px) {
  .server-card-stats-compact {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px 8px;
  }
  .playtime-block {
    grid-column: 1 / -1;
  }
}

.milestone-progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
}
.milestone-progress-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.milestone-progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
.milestone-progress-bg {
  stroke: #eee;
}
.milestone-progress-bar {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.milestone-progress-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.3rem;
  font-weight: bold;
  color: #9c27b0;
  z-index: 2;
}
.milestone-progress-label {
  margin-top: 4px;
  font-size: 0.95rem;
  color: #9c27b0;
  font-weight: 500;
}
.milestone-badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}
.milestone-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: linear-gradient(90deg, #fffbe6 0%, #ffe0f7 100%);
  border: 2px solid #ffd700;
  border-radius: 10px;
  padding: 8px 14px;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.08);
  font-size: 1rem;
  font-weight: 600;
  color: #7c4dff;
  min-width: 160px;
  position: relative;
  transition: box-shadow 0.2s;
}
.milestone-badge-icon {
  font-size: 1.5rem;
  margin-bottom: 2px;
}
.milestone-badge-label {
  font-size: 1.1rem;
  font-weight: bold;
  color: #ff9800;
}
.milestone-badge-date {
  font-size: 0.95rem;
  color: #757575;
}
.milestone-badge-details {
  font-size: 0.9rem;
  color: #ab47bc;
}

.milestone-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 18px 0 10px 0;
  justify-content: center;
  align-items: flex-end;
  padding: 0 10px;
  max-width: 100%;
}
.milestone-badge-image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  opacity: 1;
  transition: opacity 0.2s, filter 0.2s;
  cursor: pointer;
  perspective: 600px;
}
.milestone-badge-image-wrapper.achieved {
  opacity: 1;
  filter: none;
}
.milestone-badge-image-wrapper.next {
  opacity: 0.45;
  transition: opacity 0.2s, filter 0.2s;
}
.milestone-badge-image-wrapper.next .milestone-badge-image {
  filter: grayscale(1) brightness(0.8);
}
.milestone-badge-image-wrapper.next .milestone-progress-border {
  opacity: 1;
  filter: none;
}
.milestone-badge-image-wrapper.future {
  opacity: 0.45;
}
.milestone-badge-image-wrapper.future .milestone-badge-image {
  filter: grayscale(1) brightness(0.8);
}
.milestone-badge-flip {
  width: 64px;
  height: 64px;
  position: relative;
  transition: transform 0.5s;
  transform-style: preserve-3d;
}
.milestone-badge-image-wrapper.flipped .milestone-badge-flip {
  transform: rotateX(180deg);
}
.milestone-badge-front, .milestone-badge-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.milestone-badge-back {
  background: var(--color-background-soft) !important;
  color: var(--color-text);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.08);
  transform: rotateX(180deg);
  padding: 10px 0;
  font-size: 0.95rem;
  border: 1px solid var(--color-border);
}
.milestone-badge-back-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.milestone-badge-back-label {
  font-weight: bold;
  color: #4CAF50;
  font-size: 0.8rem;
}
.milestone-badge-back-date,
.milestone-badge-back-kills,
.milestone-badge-back-days {
  font-size: 0.75rem;
  color: var(--color-text);
  text-align: center;
  line-height: 1.2;
}
.milestone-badge-image-container {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.milestone-badge-image {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.08);
  background: transparent !important;
}
.milestone-progress-border {
  position: absolute;
  top: -4px;
  left: -4px;
  z-index: 2;
  pointer-events: none;
}
.progress-bg {
  opacity: 0.3;
}
.progress-bar {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
@media (max-width: 768px) {
  .milestone-badges-row {
    gap: 8px;
    padding: 0 5px;
    margin: 12px 0 8px 0;
  }
  .milestone-badge-flip {
    width: 54px;
    height: 54px;
  }
  .milestone-badge-image-container, .milestone-badge-image {
    width: 54px;
    height: 54px;
  }
  .milestone-progress-border {
    width: 54px;
    height: 54px;
    top: 0;
    left: 0;
  }
}

/* --- Milestone badge opacity fix and progress icon --- */
.milestone-badge-image-wrapper {
  opacity: 1;
}
.milestone-badge-image-wrapper.future,
.milestone-badge-image-wrapper.next {
  opacity: 0.45;
}
.milestone-progress-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  z-index: 1;
}
.milestone-progress-ring {
  z-index: 2;
}
.milestone-progress-text {
  z-index: 3;
}

/* --- Detection Mode Selector Styles --- */
.detection-mode-selector {
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.segmented-control {
  display: flex;
  background-color: var(--color-background-mute);
  border-radius: 6px;
  padding: 2px;
  position: relative;
  overflow: hidden;
}

.segment {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.segment:hover {
  color: var(--color-text);
}

.segment.active {
  background-color: var(--color-background);
  color: var(--color-heading);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.segment-icon {
  font-size: 1rem;
  filter: grayscale(0.8);
  transition: filter 0.2s ease;
}

.segment.active .segment-icon {
  filter: grayscale(0);
}

@media (max-width: 768px) {
  .detection-mode-selector {
    margin-bottom: 12px;
    padding: 10px;
  }
  
  .segment {
    padding: 6px 8px;
    font-size: 0.85rem;
    gap: 4px;
  }
  
  .segment-icon {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .segment {
    padding: 6px 4px;
    font-size: 0.8rem;
    flex-direction: column;
    gap: 2px;
  }
  
  .segment-icon {
    font-size: 0.85rem;
  }
}

/* Player Comparison Styles */
.comparison-filters {
  margin: 16px 0;
  padding: 12px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  background-color: var(--color-border);
  border-radius: 24px;
  transition: background-color 0.3s ease;
}

.toggle-slider:before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: 500;
}

.comparison-cards-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 16px;
}

.comparison-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.comparison-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comparison-card.expanded {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.comparison-card-header {
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.comparison-card-header:hover {
  background: var(--color-background-mute);
}

.comparison-card.expanded .comparison-card-header {
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
}

.player-comparison-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.target-player-info,
.similar-player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  text-align: center;
}

.similar-player-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.similar-player-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.player-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.vs-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.vs-text {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: uppercase;
}

.similarity-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 32px;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: 16px;
  padding: 0 12px;
}

.similarity-reasons-summary {
  margin-top: 12px;
}

.reasons-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reason-chip {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--color-text);
  white-space: nowrap;
  transition: all 0.2s ease;
}

.reason-chip:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.reason-chip.more-reasons {
  background: var(--color-text-muted);
  color: white;
  border-color: var(--color-text-muted);
}

.compact-stats-summary {
  display: flex;
  gap: 16px;
  margin: 12px 0 8px 0;
  flex-wrap: wrap;
}

.compact-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-background-mute);
  border-radius: 12px;
  font-size: 0.85rem;
}

.compact-label {
  color: var(--color-text-muted);
  font-weight: 600;
}

.compact-values {
  color: var(--color-text);
  font-weight: 500;
}

.reasons-grid.compact {
  gap: 6px;
}

.reason-chip.compact {
  font-size: 0.8rem;
  padding: 4px 8px;
}

.expand-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.expand-text {
  font-style: italic;
}

.expand-icon {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--color-primary);
}

.comparison-stats-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
  padding: 20px;
}

.stats-category {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.category-title {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.stat-comparison-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-comparison-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-comparison-item.full-width {
  grid-column: 1 / -1;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-values {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-values.vertical {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.target-value,
.similar-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--color-background-soft);
}

.target-value {
  border-left: 3px solid var(--color-primary);
}

.similar-value {
  border-left: 3px solid var(--color-accent);
}

.comparison-divider {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.common-data-section {
  margin-top: 12px;
  padding: 12px;
  background: var(--color-background-mute);
  border-radius: 6px;
}

.common-label {
  font-size: 0.85rem;
  color: var(--color-text);
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
}

.common-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.common-item {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--color-primary);
}

.common-item.more {
  background: var(--color-text-muted);
  color: white;
  border-color: var(--color-text-muted);
}

.common-hours {
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: 500;
  font-family: monospace;
  background: var(--color-background);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.map-comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.map-comparison-item {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.map-name {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 4px;
}

.map-scores {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.85rem;
}

.target-score,
.similar-score {
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 3px;
}

.target-score {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.similar-score {
  color: var(--color-accent);
  background: var(--color-accent-bg);
}

.map-scores .vs {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.server-ping-comparison-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 8px;
}

.server-ping-item {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px;
}

.server-ping-item .server-name {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 4px;
}

.ping-comparison {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.target-ping,
.similar-ping {
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 3px;
}

.target-ping {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.similar-ping {
  color: var(--color-accent);
  background: var(--color-accent-bg);
}

.ping-comparison .vs {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.ping-diff {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.ping-diff.similar-pings {
  color: var(--color-success);
  font-weight: 600;
}

.ping-diff.different-pings {
  color: var(--color-warning);
  font-weight: 600;
}

.more-servers-indicator {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: 8px;
  font-style: italic;
  margin-top: 8px;
}

.more-maps-indicator {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: 8px;
  font-style: italic;
}

.no-common-data {
  margin-top: 12px;
  padding: 12px;
  background: var(--color-background-mute);
  border-radius: 6px;
  text-align: center;
}

.no-common-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.temporal-overlap-info {
  margin-top: 12px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.overlap-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.overlap-stat .stat-label {
  font-size: 0.8rem;
  margin: 0;
}

.overlap-stat .stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
  padding: 4px 8px;
  background: var(--color-background-soft);
  border-radius: 4px;
  text-align: center;
}

.overlap-stat .stat-value.high-score {
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .comparison-card-header {
    padding: 12px 16px;
  }
  
  .comparison-stats-grid {
    padding: 16px;
  }
  
  .player-comparison-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .target-player-info,
  .similar-player-info {
    width: 100%;
    max-width: none;
  }
  
  .vs-divider {
    order: 2;
    flex-direction: row;
    width: 100%;
    justify-content: center;
  }
  
  .compact-stats-summary {
    gap: 8px;
    margin: 8px 0 6px 0;
  }
  
  .compact-stat {
    font-size: 0.8rem;
    padding: 3px 6px;
  }
  
  .stat-comparison-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .map-comparison-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }
  
  .server-ping-item .server-name {
    font-size: 0.75rem;
  }
  
  .ping-comparison {
    font-size: 0.8rem;
    gap: 3px;
  }
  
  .ping-diff {
    font-size: 0.7rem;
  }
  
  .temporal-overlap-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .comparison-filters {
    padding: 10px;
    margin: 12px 0;
  }
}

@media (max-width: 480px) {
  .comparison-card-header {
    padding: 10px 12px;
  }
  
  .comparison-stats-grid {
    padding: 12px;
  }
  
  .compact-stats-summary {
    gap: 6px;
    margin: 6px 0 4px 0;
  }
  
  .compact-stat {
    font-size: 0.75rem;
    padding: 2px 4px;
  }
  
  .expand-indicator {
    margin-top: 8px;
    padding-top: 6px;
    font-size: 0.75rem;
  }
  
  .category-title {
    font-size: 0.9rem;
  }
  
  .stat-comparison-item {
    gap: 6px;
  }
  
  .map-comparison-grid {
    grid-template-columns: 1fr;
  }
  
  .reasons-grid {
    gap: 6px;
  }
  
  .reason-chip {
    font-size: 0.8rem;
    padding: 4px 8px;
  }
  
  .reason-chip.compact {
    font-size: 0.75rem;
    padding: 3px 6px;
  }
  
  .server-ping-item .server-name {
    font-size: 0.7rem;
  }
  
  .ping-comparison {
    font-size: 0.75rem;
    gap: 2px;
  }
  
  .ping-diff {
    font-size: 0.65rem;
  }
}

/* Large desktop styles */
@media (min-width: 1200px) {
  .comparison-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-category:first-child {
    grid-column: 1 / -1;
  }
}

/* Ranking badge styles */
.ranking-badge {
  background: linear-gradient(90deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  font-weight: 700;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 1.05rem;
  box-shadow: 0 2px 8px rgba(76,175,80,0.12);
}

@media (max-width: 768px) {
  .ranking-badge {
    font-size: 0.9rem;
    padding: 2px 7px;
  }
}

/* Performance Analytics Styles */
.performance-analytics {
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
  border: 2px solid var(--color-border-hover);
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
}


.analytics-period {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-align: right;
  white-space: nowrap;
}

.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.trend-tickers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.ticker-item {
  background: var(--color-background-soft);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.ticker-item:hover {
  border-color: var(--color-border-hover);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.ticker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ticker-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
}

.ticker-icon {
  font-size: 1rem;
}

.ticker-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-heading);
}

.ticker-unit {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.7;
}

.ticker-chart {
  height: 40px;
  position: relative;
  background: var(--color-background-mute);
  border-radius: 6px;
  padding: 4px;
}

/* Removed .stat-cards, .stat-card, .kills-card, .deaths-card, .stat-card-icon, .stat-card-content, .stat-card-value, .stat-card-label styles - now using PrimeVue Card components */


/* Mobile responsiveness for performance analytics */
@media (max-width: 768px) {
  .performance-analytics {
    padding: 16px;
    margin: 16px 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .analytics-period {
    font-size: 0.75rem;
    text-align: center;
    white-space: normal;
  }
  
  
  .performance-metrics {
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .trend-tickers {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
    overflow-x: hidden;
  }
  
  .ticker-item {
    padding: 12px;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
  
  .ticker-header {
    margin-bottom: 10px;
  }
  
  .ticker-label {
    font-size: 0.85rem;
  }
  
  .ticker-value {
    font-size: 1.1rem;
  }
  
  .ticker-chart {
    height: 35px;
    width: 100%;
    overflow: hidden;
  }
  
  /* Removed mobile .stat-cards and .stat-card styles - using PrimeVue responsive utilities */
}

@media (max-width: 480px) {
  .performance-analytics {
    padding: 12px;
    margin: 12px 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .analytics-period {
    font-size: 0.7rem;
  }


  .performance-metrics {
    gap: 12px;
  }
  
  .ticker-item {
    padding: 10px;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
  
  .ticker-chart {
    height: 30px;
    width: 100%;
    overflow: hidden;
  }
  
  .stat-card {
    padding: 12px;
    gap: 12px;
  }
  
}
</style>
