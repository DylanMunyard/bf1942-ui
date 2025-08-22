<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats, fetchSimilarPlayers, SimilarPlayersResponse, PlayerComparisonStats } from '../services/playerStatsService';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import PlayerAchievements from '../components/PlayerAchievements.vue';

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

// Recent rounds carousel state
const carouselCurrentIndex = ref(0);
const carouselItemsPerView = ref(3);
const carouselContainer = ref<HTMLElement | null>(null);

// Responsive carousel configuration
const updateCarouselItemsPerView = () => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth < 640) {
      carouselItemsPerView.value = 1; // Mobile: 1 item
    } else if (window.innerWidth < 1024) {
      carouselItemsPerView.value = 2; // Tablet: 2 items
    } else {
      carouselItemsPerView.value = 3; // Desktop: 3 items
    }
    // Reset carousel position if it's out of bounds
    if (carouselCurrentIndex.value > carouselMaxIndex.value) {
      carouselCurrentIndex.value = carouselMaxIndex.value;
    }
  }
};

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

// Enhanced K/D styling functions for battle highlights
const getKDColorClass = (session: any): string => {
  const kdr = session.totalDeaths === 0 ? session.totalKills : session.totalKills / session.totalDeaths;
  
  if (kdr >= 3.0) return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/60 shadow-purple-500/25';
  if (kdr >= 2.0) return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/60 shadow-emerald-500/25';
  if (kdr >= 1.5) return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/60 shadow-blue-500/25';
  if (kdr >= 1.0) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/60 shadow-yellow-500/25';
  if (kdr >= 0.5) return 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/60 shadow-orange-500/25';
  return 'bg-gradient-to-r from-red-500/20 to-red-700/20 border-red-500/60 shadow-red-500/25';
};

const getKDTextClass = (session: any): string => {
  const kdr = session.totalDeaths === 0 ? session.totalKills : session.totalKills / session.totalDeaths;
  
  if (kdr >= 3.0) return 'text-purple-300';
  if (kdr >= 2.0) return 'text-emerald-300';
  if (kdr >= 1.5) return 'text-blue-300';
  if (kdr >= 1.0) return 'text-yellow-300';
  if (kdr >= 0.5) return 'text-orange-300';
  return 'text-red-300';
};

const getKDBadgeClass = (session: any): string => {
  const kdr = session.totalDeaths === 0 ? session.totalKills : session.totalKills / session.totalDeaths;
  
  if (kdr >= 3.0) return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
  if (kdr >= 2.0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  if (kdr >= 1.5) return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
  if (kdr >= 1.0) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
  if (kdr >= 0.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
  return 'bg-red-500/20 text-red-300 border-red-500/50';
};

const getKDPerformanceLabel = (session: any): string => {
  const kdr = session.totalDeaths === 0 ? session.totalKills : session.totalKills / session.totalDeaths;
  
  if (kdr >= 3.0) return '🔥';
  if (kdr >= 2.0) return '⚡';
  if (kdr >= 1.5) return '💪';
  if (kdr >= 1.0) return '✓';
  if (kdr >= 0.5) return '⚠️';
  return '💀';
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

// Recent rounds carousel functions
const carouselMaxIndex = computed(() => {
  if (!playerStats.value?.recentSessions) return 0;
  return Math.max(0, playerStats.value.recentSessions.length - carouselItemsPerView.value);
});

const nextSlide = () => {
  if (carouselCurrentIndex.value < carouselMaxIndex.value) {
    carouselCurrentIndex.value++;
  }
};

const prevSlide = () => {
  if (carouselCurrentIndex.value > 0) {
    carouselCurrentIndex.value--;
  }
};

const goToSlide = (index: number) => {
  carouselCurrentIndex.value = Math.max(0, Math.min(index, carouselMaxIndex.value));
};

const getHighestPerformanceRound = computed(() => {
  if (!playerStats.value?.recentSessions) return null;
  return playerStats.value.recentSessions.reduce((best, current) => {
    const currentScore = current.totalScore || 0;
    const bestScore = best?.totalScore || 0;
    return currentScore > bestScore ? current : best;
  }, playerStats.value.recentSessions[0]);
});

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
  // Initialize carousel responsiveness
  updateCarouselItemsPerView();
  window.addEventListener('resize', updateCarouselItemsPerView);
});

// Add cleanup for resize listener
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateCarouselItemsPerView);
  }
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
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Hero Section with Player Profile -->
    <div class="relative overflow-hidden">
      <!-- Animated Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20"></div>
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <!-- Navigation -->
      <div class="relative z-10 p-6">
        <button
          class="group inline-flex items-center gap-3 px-6 py-3 text-sm font-medium text-cyan-400 bg-slate-800/50 hover:bg-slate-700/70 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 rounded-lg transition-all duration-300 cursor-pointer"
          @click="goBack"
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
            class="group-hover:-translate-x-1 transition-transform duration-300"
          ><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to Players
        </button>
      </div>

      <!-- Player Hero Card -->
      <div class="relative z-10 px-6 pb-12">
        <div class="max-w-7xl mx-auto">
          <div class="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
            <!-- Glow Effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>
            
            <!-- Content -->
            <div class="relative z-10 p-8 md:p-12">
              <div class="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                <!-- Player Avatar Section -->
                <div class="flex-shrink-0">
                  <div class="relative">
                    <!-- Avatar Ring -->
                    <div class="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-1 animate-spin-slow">
                      <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-3xl font-bold text-slate-900">
                          {{ playerName?.charAt(0)?.toUpperCase() || '?' }}
                        </div>
                      </div>
                    </div>
                    <!-- Online Status Indicator -->
                    <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                      <div class="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>

                <!-- Player Info -->
                <div class="flex-grow space-y-4">
                  <div class="space-y-2">
                    <div class="flex items-center gap-4 flex-wrap">
                      <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {{ playerName }}
                      </h1>
                      <!-- Currently in game badge -->
                      <div
                        v-if="playerStats?.isActive && playerStats?.currentServer"
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full animate-pulse"
                      >
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                        🎮 LIVE
                      </div>
                    </div>
                    
                    <!-- Player Stats Summary -->
                    <div class="flex flex-col gap-4">
                      <div class="flex items-center gap-6 text-slate-300 text-lg flex-wrap">
                        <div class="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                          <span class="font-medium">{{ formatPlayTime(playerStats?.totalPlayTimeMinutes || 0) }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                          <span>{{ formatRelativeTime(playerStats?.lastPlayed || '') }}</span>
                        </div>
                      </div>
                      
                      <!-- Current session info -->
                      <div
                        v-if="playerStats?.isActive && playerStats?.currentServer"
                        class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                      >
                        <div class="flex-1">
                          <router-link
                            :to="`/servers/${encodeURIComponent(playerStats.currentServer.serverName)}`"
                            class="font-semibold text-green-400 hover:text-green-300 transition-colors"
                          >
                            {{ playerStats.currentServer.serverName }}
                          </router-link>
                          <p class="text-sm text-slate-400">{{ playerStats.currentServer.gameId?.toUpperCase() }}</p>
                        </div>
                        <div
                          v-if="playerStats.currentServer.sessionKills !== undefined && playerStats.currentServer.sessionDeaths !== undefined"
                          class="flex items-center gap-4 text-sm font-medium"
                        >
                          <div class="flex items-center gap-2">
                            <span class="text-green-400">{{ playerStats.currentServer.sessionKills }}</span>
                            <img src="@/assets/kills.png" alt="Kills" class="w-4 h-4" />
                          </div>
                          <span class="text-slate-500">/</span>
                          <div class="flex items-center gap-2">
                            <span class="text-red-400">{{ playerStats.currentServer.sessionDeaths }}</span>
                            <img src="@/assets/deaths.png" alt="Deaths" class="w-4 h-4" />
                          </div>
                          <span class="text-cyan-400">
                            K/D: {{ calculateKDR(playerStats.currentServer.sessionKills, playerStats.currentServer.sessionDeaths) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Quick Actions -->
                  <div class="flex items-center gap-4 pt-4">
                    <router-link 
                      :to="{ path: '/players/compare', query: { player1: playerName } }"
                      class="group inline-flex items-center gap-3 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
                      title="Compare this player with another"
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
        </div>
      </div>
    </div>
    <!-- Main Content Area -->
    <div class="relative min-h-screen">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
      >
        <div class="relative">
          <div class="w-20 h-20 border-4 border-slate-700 rounded-full animate-spin">
            <div class="absolute top-0 left-0 w-20 h-20 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="text-center space-y-2">
          <p class="text-xl font-semibold text-slate-300">Loading Player Statistics...</p>
          <p class="text-slate-500">Analyzing battlefield performance data</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
      >
        <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="text-center space-y-2">
          <p class="text-xl font-semibold text-red-400">{{ error }}</p>
          <p class="text-slate-500">Unable to load player data</p>
        </div>
      </div>

      <!-- Main Content -->
      <div
        v-else-if="playerStats"
        class="max-w-7xl mx-auto px-6 pb-12 space-y-8"
      >

        <!-- Recent Battles Carousel -->
        <div 
          v-if="playerStats.recentSessions && playerStats.recentSessions.length > 0"
          class="relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-lg rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-500"
        >
          <!-- Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div class="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div class="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          
          <div class="relative z-10 p-8">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div class="space-y-2">
                <h3 class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🏆 Recent Battles
                </h3>
              </div>
              <div class="flex items-center gap-2 sm:gap-3">
                <!-- Navigation buttons -->
                <button
                  @click="prevSlide"
                  :disabled="carouselCurrentIndex <= 0"
                  class="group flex items-center justify-center w-12 h-12 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-cyan-500/50 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <button
                  @click="nextSlide"
                  :disabled="carouselCurrentIndex >= carouselMaxIndex"
                  class="group flex items-center justify-center w-12 h-12 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-cyan-500/50 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
                <router-link
                  :to="`/players/${encodeURIComponent(playerName)}/sessions`"
                  class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 bg-slate-800/50 hover:bg-slate-700/70 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg transition-all duration-300"
                >
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </router-link>
              </div>
            </div>

            <!-- Carousel Container -->
            <div class="relative overflow-hidden">
              <div 
                ref="carouselContainer"
                class="flex transition-transform duration-500 ease-out"
                :style="{ transform: `translateX(-${carouselCurrentIndex * (100 / carouselItemsPerView)}%)` }"
              >
                <div
                  v-for="(session, index) in playerStats.recentSessions"
                  :key="`session-${index}`"
                  class="flex-none px-2"
                  :style="{ width: `${100 / carouselItemsPerView}%` }"
                >
                  <!-- Round Card -->
                  <div 
                    class="group relative overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full"
                    @click="(event) => openSessionDetailsModal(session.serverGuid, session.mapName, session.startTime, event)"
                  >
                    <!-- Card Background Effects -->
                    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <!-- Performance Badge -->
                    <div 
                      v-if="session === getHighestPerformanceRound"
                      class="absolute -top-2 -right-2 z-20 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
                    >
                      🔥 Best
                    </div>
                    
                    <div class="relative z-10 p-3 space-y-3">
                      <!-- Header: Server name only -->
                      <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-1 text-slate-300 truncate flex-1 min-w-0">
                          <router-link 
                            :to="`/servers/${encodeURIComponent(session.serverName)}`" 
                            class="hover:text-white transition-colors truncate"
                          >
                            {{ session.serverName }}
                          </router-link>
                        </div>
                        <span
                          v-if="session.isActive"
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full animate-pulse shrink-0 ml-2"
                        >
                          <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          Live
                        </span>
                      </div>

                      <!-- Compact Battle Stats -->
                      <div class="p-3 rounded-lg border transition-all duration-300" :class="getKDColorClass(session)">
                        <div class="space-y-3">
                          <!-- Upper Stats Row -->
                          <div class="flex items-center justify-between">
                            <!-- K/D and Performance Icon -->
                            <div class="flex items-center gap-3">
                              <div class="text-center">
                                <div class="text-xl font-bold" :class="getKDTextClass(session)">
                                  {{ calculateKDR(session.totalKills, session.totalDeaths) }}
                                </div>
                                <div class="text-xs text-slate-400">K/D</div>
                              </div>
                              <div class="text-lg">{{ getKDPerformanceLabel(session) }}</div>
                            </div>
                            
                            <!-- Compact Stats -->
                            <div class="flex items-center gap-4 text-sm">
                              <div class="text-center">
                                <div class="font-semibold text-emerald-400">{{ session.totalKills }}</div>
                                <div class="text-xs text-slate-500">K</div>
                              </div>
                              <div class="text-center">
                                <div class="font-semibold text-red-400">{{ session.totalDeaths }}</div>
                                <div class="text-xs text-slate-500">D</div>
                              </div>
                              <div class="text-center">
                                <div class="font-semibold text-yellow-400">{{ session.totalScore }}</div>
                                <div class="text-xs text-slate-500">S</div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Lower Row: Time (left) and Map (right) -->
                          <div class="flex items-center justify-between text-sm">
                            <router-link 
                              :to="getRoundReportRoute(session)" 
                              class="text-cyan-400 hover:text-cyan-300 font-medium"
                            >
                              {{ formatRelativeTime(session.startTime) }}
                            </router-link>
                            <span class="text-slate-400 truncate">{{ session.mapName }}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Carousel Indicators -->
            <div v-if="playerStats.recentSessions.length > carouselItemsPerView" class="flex justify-center gap-2 mt-6">
              <button
                v-for="index in Math.ceil(playerStats.recentSessions.length / carouselItemsPerView)"
                :key="index"
                @click="goToSlide(index - 1)"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="carouselCurrentIndex === index - 1 
                  ? 'bg-cyan-500 w-8' 
                  : 'bg-slate-600 hover:bg-slate-500'"
              ></button>
            </div>
          </div>
        </div>

        <!-- Performance Analytics Section -->
        <div 
          v-if="playerStats?.recentStats"
          class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8"
        >
          <!-- Section Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
          
          <div class="relative z-10 p-8 space-y-8">
            <!-- Section Header -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div class="space-y-2">
                <h3 class="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  📊 Performance Analytics
                </h3>
                <p class="text-slate-400">Real-time battlefield performance metrics</p>
              </div>
              <div class="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <p class="text-cyan-400 font-semibold">
                  {{ Math.ceil((new Date(playerStats.recentStats.analysisPeriodEnd).getTime() - new Date(playerStats.recentStats.analysisPeriodStart).getTime()) / (1000 * 60 * 60 * 24)) }} days analysis
                </p>
                <p class="text-slate-500 text-sm">{{ playerStats.recentStats.totalRoundsAnalyzed }} rounds tracked</p>
              </div>
            </div>
            
            <!-- Performance Metrics Grid -->
            <div class="space-y-8">
              <!-- Trend Charts -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- K/D Ratio Card -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300">
                  <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative z-10 p-6 space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                          <span class="text-2xl">📈</span>
                        </div>
                        <div>
                          <h4 class="text-lg font-bold text-white">K/D Ratio</h4>
                          <p class="text-slate-400 text-sm">Kill/Death Performance</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-3xl font-bold" :style="{ color: getGaugeColor(currentKDRatio, 'kdr') }">
                          {{ currentKDRatio.toFixed(3) }}
                        </div>
                        <div class="text-slate-400 text-sm">Current Ratio</div>
                      </div>
                    </div>
                    
                    <div class="h-20 -mx-2">
                      <Line :data="kdTrendChartData" :options="tickerChartOptions" />
                    </div>
                  </div>
                </div>
                
                <!-- Kill Rate Card -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                  <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative z-10 p-6 space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <span class="text-2xl">⚡</span>
                        </div>
                        <div>
                          <h4 class="text-lg font-bold text-white">Kill Rate</h4>
                          <p class="text-slate-400 text-sm">Kills per Minute</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-3xl font-bold" :style="{ color: getGaugeColor(currentKillRate, 'killrate') }">
                          {{ currentKillRate.toFixed(2) }}
                        </div>
                        <div class="text-slate-400 text-sm">k/min</div>
                      </div>
                    </div>
                    
                    <div class="h-20 -mx-2">
                      <Line :data="killRateTrendChartData" :options="tickerChartOptions" />
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Total Stats Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Total Kills -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                  <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
                  
                  <div class="relative z-10 p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300">
                        🎯
                      </div>
                      <div class="space-y-1">
                        <div class="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          {{ playerStats.totalKills.toLocaleString() }}
                        </div>
                        <div class="text-slate-400 font-medium">Total Eliminations</div>
                        <div class="text-green-400 text-sm">+{{ Math.round(currentKillRate * 60 * 24) }} avg daily</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Total Deaths -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-red-500/50 transition-all duration-300">
                  <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
                  
                  <div class="relative z-10 p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300">
                        💀
                      </div>
                      <div class="space-y-1">
                        <div class="text-4xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                          {{ playerStats.totalDeaths.toLocaleString() }}
                        </div>
                        <div class="text-slate-400 font-medium">Total Deaths</div>
                        <div class="text-red-400 text-sm">{{ ((playerStats.totalDeaths / playerStats.totalKills) * 100).toFixed(1) }}% of kills</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Servers Section -->
        <div class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8">
          <!-- Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
          <div class="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
          
          <div class="relative z-10 p-8 space-y-6">
            <!-- Section Header -->
            <div class="space-y-2">
              <h3 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                🎮 Favorite Battlegrounds
              </h3>
              <p class="text-slate-400">Your most active server destinations</p>
            </div>
            
            <!-- Server Cards Grid -->
            <div v-if="hasServers" class="w-full">
              <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div
                  v-for="server in sortedServers"
                  :key="server.serverGuid"
                  class="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <!-- Card Background Effects -->
                  <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative z-10 p-6 space-y-4">
                    <!-- Server Header -->
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-2 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                          <img
                            :src="getGameIcon(server.gameId)"
                            alt="Server"
                            class="w-full h-full rounded object-cover"
                          />
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity">
                              <path d="m9 18 6-6-6-6"/>
                            </svg>
                          </router-link>
                          <span class="flex-shrink-0 px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
                            {{ server.gameId.toUpperCase() }}
                          </span>
                        </div>
                        
                        <!-- Quick Stats Bar -->
                        <div class="flex items-center gap-4 text-sm">
                          <div class="flex items-center gap-1">
                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span class="text-green-400 font-medium">{{ server.kdRatio.toFixed(2) }} K/D</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span class="text-blue-400 font-medium">{{ server.totalRounds }} rounds</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span class="text-purple-400 font-medium">{{ server.killsPerMinute.toFixed(2) }} KPM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Detailed Stats Grid -->
                    <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                      <!-- Best Score -->
                      <div class="space-y-1">
                        <p class="text-xs text-slate-400 font-medium">Best Score</p>
                        <router-link
                          v-if="(server.serverGuid && server.highestScoreMapName && server.highestScoreStartTime) || (server.serverGuid && server.mapName && server.bestScoreDate)"
                          class="group/score inline-flex items-center gap-1 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent hover:from-yellow-300 hover:to-orange-300 transition-all duration-200"
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
                        >
                          {{ server.highestScore?.toLocaleString() }}
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-hover/score:opacity-100 transition-opacity text-orange-400">
                            <path d="m9 18 6-6-6-6"/>
                          </svg>
                        </router-link>
                        <span v-else class="text-lg font-bold text-white">
                          {{ server.highestScore?.toLocaleString() }}
                        </span>
                      </div>
                      
                      <!-- KPM -->
                      <div class="space-y-1">
                        <p class="text-xs text-slate-400 font-medium">Kills/Min</p>
                        <p class="text-lg font-bold text-cyan-400">{{ server.killsPerMinute.toFixed(2) }}</p>
                      </div>
                      
                      <!-- Combat Stats -->
                      <div class="space-y-1">
                        <p class="text-xs text-slate-400 font-medium">Combat</p>
                        <div class="flex items-center gap-2 text-sm font-bold">
                          <span class="text-green-400">{{ server.totalKills }}</span>
                          <span class="text-slate-500">/</span>
                          <span class="text-red-400">{{ server.totalDeaths }}</span>
                        </div>
                      </div>
                      
                      <!-- Play Time -->
                      <div class="space-y-1">
                        <p class="text-xs text-slate-400 font-medium">Time Played</p>
                        <p class="text-lg font-bold text-purple-400">{{ formatPlayTime(Math.round(server.totalMinutes)) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- No Servers State -->
            <div v-else class="text-center py-12">
              <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-10 5L2 7"/>
                </svg>
              </div>
              <p class="text-slate-400">No server data available</p>
            </div>
          </div>
        </div>

        <!-- Player Achievements Section -->
        <div class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8">
          <!-- Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5"></div>
          <div class="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-3xl"></div>
          
          <div class="relative z-10 p-8 space-y-6">
            <!-- Section Header -->
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div class="space-y-2">
                <h3 class="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  🏆 Achievements & Streaks
                </h3>
                <p class="text-slate-400">Unlock your battlefield legacy</p>
              </div>
              <router-link
                :to="`/players/${encodeURIComponent(playerName)}/achievements`"
                class="group inline-flex items-center gap-3 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-12 transition-transform duration-300">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
                View All Achievements
              </router-link>
            </div>
            
            <!-- Achievements Component with Enhanced Container -->
            <div class="relative">
              <div class="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl"></div>
              <div class="relative z-10 p-6 rounded-xl border border-slate-700/30">
                <PlayerAchievements
                  :player-name="playerName"
                  :player-stats="playerStats"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Player Insights Section -->
        <div
          v-if="playerStats.insights"
          class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8"
        >
          <!-- Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-indigo-500/5"></div>
          <div class="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
          
          <div class="relative z-10 p-8 space-y-8">
            <!-- Section Header -->
            <div class="space-y-2">
              <h3 class="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                🧠 Player Intelligence
              </h3>
              <p class="text-slate-400">Advanced behavioral analytics and patterns</p>
            </div>

            <!-- Activity By Hour -->
            <div
              v-if="playerStats.insights && playerStats.insights.activityByHour && playerStats.insights.activityByHour.length > 0"
              class="space-y-6"
            >
              <!-- Activity Header -->
              <div class="space-y-2">
                <h4 class="text-2xl font-bold text-white flex items-center gap-3">
                  ⏰ Activity Timeline
                  <span class="text-sm font-normal text-slate-400">
                    ({{ daysBetween(playerStats.insights.startPeriod, playerStats.insights.endPeriod) }} days analysis)
                  </span>
                </h4>
                <p class="text-slate-400">Gaming activity patterns in your local timezone</p>
              </div>

              <!-- Enhanced Chart Container -->
              <div class="space-y-6">
                <div class="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                  <!-- Time Period Background Zones with Enhanced Styling -->
                  <div class="absolute inset-0 flex">
                    <!-- Early Hours (12AM-8AM) -->
                    <div class="flex-1 bg-gradient-to-b from-blue-500/10 to-blue-600/5 relative">
                      <div class="absolute top-2 left-2 opacity-50">
                        <span class="text-blue-400 text-xs font-medium">🌙 Early</span>
                      </div>
                    </div>
                    <!-- Day Hours (8AM-4PM) -->
                    <div class="flex-1 bg-gradient-to-b from-yellow-500/10 to-orange-600/5 relative">
                      <div class="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-50">
                        <span class="text-yellow-400 text-xs font-medium">☀️ Day</span>
                      </div>
                    </div>
                    <!-- Night Hours (4PM-12AM) -->
                    <div class="flex-1 bg-gradient-to-b from-purple-500/10 to-indigo-600/5 relative">
                      <div class="absolute top-2 right-2 opacity-50">
                        <span class="text-purple-400 text-xs font-medium">🌆 Evening</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Chart with Improved Padding -->
                  <div class="relative z-10 p-6 h-64">
                    <Line
                      :data="activityChartData"
                      :options="activityChartOptions"
                    />
                  </div>
                </div>
                
                <!-- Enhanced Time Period Labels -->
                <div class="grid grid-cols-3 gap-4">
                  <div class="group text-center p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span class="text-2xl">🌙</span>
                    </div>
                    <div class="space-y-1">
                      <h5 class="font-bold text-blue-400">Early Hours</h5>
                      <p class="text-xs text-slate-400">Midnight - 8AM</p>
                      <p class="text-lg font-bold text-white">
                        {{ Math.round(sortedLocalActivityHours.filter((h: any) => h.localHour >= 0 && h.localHour < 8).reduce((sum: number, h: any) => sum + h.minutesActive, 0) / 60) }}h
                      </p>
                    </div>
                  </div>
                  
                  <div class="group text-center p-4 bg-gradient-to-br from-yellow-900/20 to-orange-800/10 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
                    <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span class="text-2xl">☀️</span>
                    </div>
                    <div class="space-y-1">
                      <h5 class="font-bold text-yellow-400">Daytime</h5>
                      <p class="text-xs text-slate-400">8AM - 4PM</p>
                      <p class="text-lg font-bold text-white">
                        {{ Math.round(sortedLocalActivityHours.filter((h: any) => h.localHour >= 8 && h.localHour < 16).reduce((sum: number, h: any) => sum + h.minutesActive, 0) / 60) }}h
                      </p>
                    </div>
                  </div>
                  
                  <div class="group text-center p-4 bg-gradient-to-br from-purple-900/20 to-indigo-800/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span class="text-2xl">🌆</span>
                    </div>
                    <div class="space-y-1">
                      <h5 class="font-bold text-purple-400">Evening</h5>
                      <p class="text-xs text-slate-400">4PM - Midnight</p>
                      <p class="text-lg font-bold text-white">
                        {{ Math.round(sortedLocalActivityHours.filter((h: any) => h.localHour >= 16 && h.localHour < 24).reduce((sum: number, h: any) => sum + h.minutesActive, 0) / 60) }}h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Server Rankings -->
            <div
              v-if="playerStats.insights?.serverRankings && playerStats.insights.serverRankings.length > 0"
              class="space-y-6"
            >
              <!-- Server Rankings Header -->
              <div class="space-y-2">
                <h4 class="text-2xl font-bold text-white flex items-center gap-3">
                  🏅 Server Rankings
                </h4>
                <p class="text-slate-400">Your competitive standings across servers</p>
              </div>
              <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <table class="w-full">
                <thead class="bg-bf-background-mute">
                  <tr class="border-b border-bf-border">
                    <th class="px-4 py-3 text-left text-sm font-semibold text-bf-heading">Server Name</th>
                    <th class="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-bf-heading">
                      Rank
                    </th>
                    <th class="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-bf-heading">
                      Score
                    </th>
                    <th class="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-bf-heading">
                      Ping
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-bf-border">
                  <template
                    v-for="ranking in playerStats.insights.serverRankings"
                    :key="ranking.serverGuid"
                  >
                    <tr
                      class="hover:bg-bf-background-soft cursor-pointer transition-colors duration-200"
                      @click="toggleServerExpansion(ranking.serverGuid)"
                    >
                      <td class="px-4 py-3">
                        <div class="flex items-center space-x-2">
                          <span class="text-bf-text-muted">{{ expandedServerId === ranking.serverGuid ? '▼' : '▶' }}</span>
                          <span class="font-medium text-bf-text hover:text-bf-primary transition-colors duration-200">{{ ranking.serverName }}</span>
                        </div>
                        <div class="md:hidden mt-2 flex flex-wrap items-center gap-2 text-sm text-bf-text-muted">
                          <span>Rank: {{ ranking.rankDisplay }}</span>
                          <span>•</span>
                          <span>Score: {{ ranking.scoreDisplay }}</span>
                          <span>•</span>
                          <span>
                            <span
                              :class="{
                                'text-green-400': ranking.averagePing < 50,
                                'text-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                                'text-red-400': ranking.averagePing >= 100
                              }"
                            >
                              {{ ranking.averagePing }}ms
                            </span>
                          </span>
                        </div>
                      </td>
                      <td class="hidden md:table-cell px-4 py-3">
                        {{ ranking.rankDisplay }}
                      </td>
                      <td class="hidden md:table-cell px-4 py-3">
                        {{ ranking.scoreDisplay }}
                      </td>
                      <td class="hidden md:table-cell px-4 py-3">
                        <span
                          :class="{
                            'text-green-400': ranking.averagePing < 50,
                            'text-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                            'text-red-400': ranking.averagePing >= 100
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
                class="mt-4 p-4 bg-bf-background-mute border-t border-bf-border"
              >
                <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-4">
                  <span class="font-medium text-bf-text">Time Range:</span>
                  <div class="flex space-x-2">
                    <button
                      v-for="option in timeRangeOptions"
                      :key="option.value"
                      :class="['px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200', selectedTimeRange === option.value ? 'bg-bf-primary text-white' : 'bg-bf-background text-bf-text hover:bg-bf-background-soft border border-bf-border']"
                      @click="selectedTimeRange = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
                <div
                  v-if="mapStatsLoading"
                  class="flex flex-col items-center justify-center p-8 space-y-4"
                >
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-bf-primary" />
                  <p class="text-bf-text-muted">Loading map statistics...</p>
                </div>
                <div
                  v-else-if="mapStats.length > 0"
                  class="space-y-4"
                >
                  <!-- Table view with horizontal scrolling for mobile -->
                  <div class="overflow-x-auto">
                    <table class="w-full min-w-full bg-bf-background border border-bf-border rounded-lg overflow-hidden">
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
                  class="text-center text-bf-text-muted py-8"
                >
                  <p>No map statistics available for the selected time range.</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Player Comparison section -->
        <div
          v-if="playerStats"
          class="bg-bf-background-soft border border-bf-border rounded-lg p-6 space-y-4 mt-8"
        >
          <h3
            class="flex items-center justify-between text-xl font-bold text-bf-heading cursor-pointer hover:text-bf-primary transition-colors duration-200"
            @click="toggleSimilarPlayersSection"
          >
            Player Comparison & Analysis
            <span class="text-bf-text-muted">{{ similarSectionExpanded ? '▲' : '▼' }}</span>
            <span
              v-if="!similarSectionExpanded"
              class="text-sm text-bf-text-muted ml-2"
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

      </div>
      <div
        v-else
        class="flex items-center justify-center p-8"
      >
        <p class="text-bf-text-muted">No player statistics available.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations and styles that cannot be achieved with standard Tailwind */

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
}

/* Chart.js container positioning */
.relative .absolute {
  pointer-events: none;
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
