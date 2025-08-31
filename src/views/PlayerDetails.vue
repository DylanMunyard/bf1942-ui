<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats, fetchSimilarPlayers, SimilarPlayersResponse, PlayerComparisonStats } from '../services/playerStatsService';
// Removed unused imports - BestScores, BestScoreEntry
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import PlayerAchievements from '../components/PlayerAchievements.vue';
import HeroBackButton from '../components/HeroBackButton.vue';

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

// Best Scores state
const selectedBestScoresTab = ref<'allTime' | 'last30Days' | 'thisWeek'>('allTime');
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

// Function to navigate to round report using best score data
const navigateToRoundReport = (roundId: string) => {
  // Find the score entry that matches this roundId
  const scoreEntry = currentBestScores.value.find(score => score.roundId === roundId);
  
  if (scoreEntry) {
    // Subtract 1 minute from the raw UTC timestamp for round report lookup
    // Work with the timestamp as UTC to avoid timezone conversion issues
    const originalTime = new Date(scoreEntry.timestamp + (scoreEntry.timestamp.endsWith('Z') ? '' : 'Z'));
    const adjustedTime = new Date(originalTime.getTime() - 60000); // subtract 60,000ms (1 minute)
    
    router.push({
      path: '/servers/round-report',
      query: {
        serverGuid: scoreEntry.serverGuid,
        mapName: scoreEntry.mapName,
        startTime: adjustedTime.toISOString(),
        players: playerName.value
      }
    });
  } else {
    // Fallback if score entry not found
    router.push({
      path: '/servers/round-report',
      query: {
        roundId: roundId,
        players: playerName.value
      }
    });
  }
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

// Computed property for current best scores
const currentBestScores = computed(() => {
  if (!playerStats.value?.bestScores) return [];
  return playerStats.value.bestScores[selectedBestScoresTab.value] || [];
});


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
// Enhanced similarity color function with more gradients
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
  <!-- Full-width Hero Section -->
  <div class="w-full bg-slate-800 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between mb-6">
        <HeroBackButton fallback-route="/players" />
      </div>
      
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
        <!-- Player Avatar Section (hidden on mobile) -->
        <div class="hidden lg:block flex-shrink-0">
          <div class="relative">
            <!-- Avatar -->
            <div class="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-1 animate-spin-slow">
              <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xl font-bold text-slate-900">
                  {{ playerName?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>
            </div>
            <!-- Online Status Indicator -->
            <div v-if="playerStats?.isActive" class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
          </div>
        </div>

        <!-- Player Info -->
        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-4 flex-wrap mb-3">
            <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              {{ playerName }}
            </h1>
            <!-- Currently in game badge -->
            <div
              v-if="playerStats?.isActive && playerStats?.currentServer"
              class="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-green-400 bg-green-500/20 border border-green-500/30 rounded-full animate-pulse"
            >
              <div class="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              Online
            </div>
          </div>
          
          <!-- Player Stats Summary -->
          <div class="flex items-center gap-6 text-slate-300 flex-wrap">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              <span class="font-medium">{{ formatPlayTime(playerStats?.totalPlayTimeMinutes || 0) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
              <span>{{ formatRelativeTime(playerStats?.lastPlayed || '') }}</span>
            </div>
          </div>
                      
        </div>

        <!-- Actions Section -->
        <div class="flex flex-col gap-4 items-end">
          <!-- Current session info -->
          <div
            v-if="playerStats?.isActive && playerStats?.currentServer"
            class="bg-green-500/10 border border-green-500/20 rounded-xl p-4 min-w-[250px]"
          >
            <div class="mb-2">
              <router-link
                :to="`/servers/${encodeURIComponent(playerStats.currentServer.serverName)}`"
                class="font-semibold text-green-300 hover:text-green-200 transition-colors"
              >
                {{ playerStats.currentServer.serverName }}
              </router-link>
              <p class="text-sm text-slate-400">{{ playerStats.currentServer.gameId?.toUpperCase() }}</p>
            </div>
            <div
              v-if="playerStats.currentServer.sessionKills !== undefined && playerStats.currentServer.sessionDeaths !== undefined"
              class="flex items-center justify-between text-sm font-medium"
            >
              <!-- K/D Ratio -->
              <div class="text-center">
                <div class="text-lg font-bold text-cyan-400">
                  {{ calculateKDR(playerStats.currentServer.sessionKills, playerStats.currentServer.sessionDeaths) }}
                </div>
                <div class="text-xs text-slate-400">K/D</div>
              </div>
              <!-- Kills -->
              <div class="text-center">
                <div class="text-lg font-bold text-green-400">{{ playerStats.currentServer.sessionKills }}</div>
                <div class="text-xs text-slate-400">K</div>
              </div>
              <!-- Deaths -->
              <div class="text-center">
                <div class="text-lg font-bold text-red-400">{{ playerStats.currentServer.sessionDeaths }}</div>
                <div class="text-xs text-slate-400">D</div>
              </div>
              <!-- Score (if available) -->
              <div v-if="(playerStats.currentServer as any).sessionScore !== undefined || (playerStats.currentServer as any).score !== undefined" class="text-center">
                <div class="text-lg font-bold text-yellow-400">{{ (playerStats.currentServer as any).sessionScore || (playerStats.currentServer as any).score }}</div>
                <div class="text-xs text-slate-400">S</div>
              </div>
            </div>
          </div>

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
        class="max-w-7xl mx-auto px-3 sm:px-6 pb-6 sm:pb-12 space-y-4 sm:space-y-8"
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
          
          <div class="relative z-10 p-4 sm:p-8">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div class="space-y-2">
                <h3 class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🏆 Recent Battles
                </h3>
                <p class="text-slate-400 text-sm">Scroll horizontally to view more battles</p>
              </div>
              <div class="flex items-center gap-2 sm:gap-3">
                <router-link
                  :to="`/players/${encodeURIComponent(playerName)}/sessions`"
                  class="flex items-center gap-2 px-4 py-2 text-sm font-medium !text-white hover:!text-cyan-100 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-600/70 hover:border-cyan-500/70 rounded-lg transition-all duration-300"
                >
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </router-link>
              </div>
            </div>

            <!-- Horizontal Scroll Container -->
            <div class="overflow-x-auto pb-4">
              <div class="flex gap-4 min-w-max">
                <div
                  v-for="(session, index) in playerStats.recentSessions"
                  :key="`session-${index}`"
                  class="flex-none w-80"
                >
                  <!-- Round Card -->
                  <div 
                    class="group relative overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full"
                    @click="(event) => openSessionDetailsModal(session.serverGuid, session.mapName, session.startTime, event)"
                  >
                    <!-- Card Background Effects -->
                    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    
                    <div class="relative z-10 p-3 space-y-3">
                      <!-- Header: Server name only -->
                      <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-1 text-white truncate flex-1 min-w-0">
                          <router-link 
                            :to="`/servers/${encodeURIComponent(session.serverName)}`" 
                            class="!text-white hover:!text-cyan-300 transition-colors truncate"
                          >
                            {{ session.serverName }}
                          </router-link>
                        </div>
                        <span
                          v-if="session.isActive"
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full animate-pulse shrink-0 ml-2"
                        >
                          <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          Online
                        </span>
                      </div>

                      <!-- Compact Battle Stats -->
                      <div class="p-3 rounded-lg border transition-all duration-300" :class="getKDColorClass(session)">
                        <div class="space-y-3">
                          <!-- Upper Stats Row -->
                          <div class="flex items-center justify-between">
                            <!-- K/D -->
                            <div class="text-center">
                              <div class="text-xl font-bold" :class="getKDTextClass(session)">
                                {{ calculateKDR(session.totalKills, session.totalDeaths) }}
                              </div>
                              <div class="text-xs text-slate-400">K/D</div>
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
                              class="!text-cyan-300 hover:!text-cyan-200 font-medium"
                            >
                              {{ formatRelativeTime(session.startTime) }}
                            </router-link>
                            <span class="text-slate-300 truncate">{{ session.mapName }}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Best Scores Section -->
        <div 
          v-if="playerStats?.bestScores && (playerStats.bestScores.allTime?.length > 0 || playerStats.bestScores.last30Days?.length > 0 || playerStats.bestScores.thisWeek?.length > 0)"
          class="relative bg-gradient-to-br from-amber-900/20 via-slate-800/80 to-slate-900/80 backdrop-blur-lg rounded-2xl border border-amber-500/30 shadow-2xl"
        >
          <!-- Spectacular Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10"></div>
          <div class="absolute top-0 left-1/3 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-yellow-500/15 to-orange-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div class="absolute top-1/2 left-0 w-32 h-32 bg-amber-400/20 rounded-full blur-xl animate-ping delay-300"></div>
          
          <!-- Crown decoration -->
          <div class="absolute top-4 right-8 text-4xl md:text-6xl opacity-20 animate-bounce">👑</div>
          
          <div class="relative z-10 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            <!-- Header with dramatic styling - More compact on mobile -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
              <div class="space-y-2">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-lg sm:text-2xl animate-spin-slow">
                    🏆
                  </div>
                  <h3 class="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
                    Best Scores
                  </h3>
                </div>
                <p class="text-amber-200/90 text-sm sm:text-lg font-medium">Your greatest battlefield achievements</p>
              </div>
              
              <!-- Tab Controls with premium styling - More compact on mobile -->
              <div class="flex items-center bg-slate-900/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 sm:p-2 border border-amber-500/20 shadow-xl">
                <div
                  v-for="tab in bestScoresTabOptions"
                  :key="tab.key"
                  class="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base cursor-pointer transition-all duration-300 group"
                  :class="{
                    'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg transform scale-105': selectedBestScoresTab === tab.key,
                    'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10': selectedBestScoresTab !== tab.key
                  }"
                  @click="changeBestScoresTab(tab.key)"
                >
                  <span>{{ tab.label }}</span>
                  <div 
                    v-if="selectedBestScoresTab === tab.key"
                    class="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-lg sm:rounded-xl animate-pulse"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Best Scores Content -->
            <div class="space-y-3 sm:space-y-4">
              <!-- No scores message -->
              <div
                v-if="currentBestScores.length === 0"
                class="flex flex-col items-center justify-center py-8 sm:py-16 text-center space-y-3 sm:space-y-4"
              >
                <div class="text-4xl sm:text-8xl opacity-30">🎯</div>
                <p class="text-lg sm:text-xl font-semibold text-amber-300">No scores recorded yet</p>
                <p class="text-amber-200/70 text-sm sm:text-base">Start playing to build your legendary scores!</p>
              </div>

              <!-- Mobile: Horizontal Scroll Layout / Desktop: Grid Layout -->
              <div v-else>
                <!-- Mobile Horizontal Scroll (< lg screens) -->
                <div class="lg:hidden">
                  <div class="overflow-x-auto pb-4 scrollbar-hide best-scores-scroll-container">
                    <div class="flex gap-3 min-w-max px-1 pt-4 pb-2">
                      <div
                        v-for="(score, index) in currentBestScores.slice(0, 6)"
                        :key="`${score.roundId}-${index}`"
                        class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-400/50 transition-all duration-500 hover:scale-105 cursor-pointer flex-none w-72"
                        @click="navigateToRoundReport(score.roundId)"
                      >
                        <!-- Mobile Card Content - More Compact -->
                        <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                        
                        <!-- Rank badge - smaller on mobile -->
                        <div class="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-black text-slate-900 text-sm shadow-lg z-20">
                          {{ index + 1 }}
                        </div>
                        
                        <div class="relative z-10 p-4 space-y-3">
                          <!-- Compact Score Header -->
                          <div class="flex items-center justify-between">
                            <div class="space-y-1">
                              <div class="text-2xl font-black text-amber-300">
                                {{ score.score.toLocaleString() }}
                              </div>
                              <div class="text-xs text-amber-200/70">SCORE</div>
                            </div>
                            <div class="text-right space-y-1">
                              <div class="text-lg font-bold text-emerald-400">
                                {{ calculateKDR(score.kills, score.deaths) }}
                              </div>
                              <div class="text-xs text-slate-400">K/D</div>
                            </div>
                          </div>

                          <!-- Compact Stats Row -->
                          <div class="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <div class="flex items-center gap-3">
                              <div class="text-center">
                                <div class="text-sm font-bold text-emerald-400">{{ score.kills }}</div>
                                <div class="text-xs text-slate-500">K</div>
                              </div>
                              <div class="w-px h-6 bg-slate-600"></div>
                              <div class="text-center">
                                <div class="text-sm font-bold text-red-400">{{ score.deaths }}</div>
                                <div class="text-xs text-slate-500">D</div>
                              </div>
                            </div>
                            <div class="text-lg opacity-50">⚔️</div>
                          </div>

                          <!-- Map & Server Info - Compact -->
                          <div class="space-y-2">
                            <div class="text-xs text-amber-300 font-semibold truncate">{{ score.mapName }}</div>
                            <div class="text-xs text-slate-400 truncate">{{ score.serverName }}</div>
                            <div class="flex items-center gap-1 text-xs text-slate-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                              </svg>
                              <span>{{ formatRelativeTime(score.timestamp) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Show More Button for Mobile -->
                  <div 
                    v-if="currentBestScores.length > 6"
                    class="text-center pt-3"
                  >
                    <router-link
                      :to="`/players/${encodeURIComponent(playerName)}/achievements`"
                      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-400/50 rounded-lg transition-all duration-300"
                    >
                      <span>View All {{ currentBestScores.length }} Scores</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </router-link>
                  </div>
                </div>

                <!-- Desktop Grid Layout (lg+ screens) -->
                <div class="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-6 pt-6">
                  <div
                    v-for="(score, index) in currentBestScores"
                    :key="`${score.roundId}-${index}`"
                    class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-amber-500/20 hover:border-amber-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer"
                    @click="navigateToRoundReport(score.roundId)"
                  >
                    <!-- Card background effects -->
                    <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <!-- Rank badge -->
                    <div class="absolute -top-5 -right-5 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-black text-slate-900 text-base shadow-xl z-20">
                      {{ index + 1 }}
                    </div>
                    
                    <!-- Hover overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                    
                    <!-- Click indicator -->
                    <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <div class="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-400">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>

                    <div class="relative z-10 p-6 space-y-4">
                      <!-- Score Header -->
                      <div class="flex items-center justify-between">
                        <div class="space-y-1">
                          <div class="text-3xl font-black text-amber-300">
                            {{ score.score.toLocaleString() }}
                          </div>
                          <div class="text-sm text-amber-200/70">SCORE</div>
                        </div>
                        <div class="text-right space-y-1">
                          <div class="text-lg font-bold text-emerald-400">
                            {{ calculateKDR(score.kills, score.deaths) }}
                          </div>
                          <div class="text-sm text-slate-400">K/D</div>
                        </div>
                      </div>

                      <!-- Stats Row -->
                      <div class="flex items-center justify-between py-3 px-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <div class="flex items-center gap-4">
                          <div class="text-center">
                            <div class="text-lg font-bold text-emerald-400">{{ score.kills }}</div>
                            <div class="text-xs text-slate-500">KILLS</div>
                          </div>
                          <div class="w-px h-8 bg-slate-600"></div>
                          <div class="text-center">
                            <div class="text-lg font-bold text-red-400">{{ score.deaths }}</div>
                            <div class="text-xs text-slate-500">DEATHS</div>
                          </div>
                        </div>
                        <div class="text-2xl opacity-50">⚔️</div>
                      </div>

                      <!-- Map & Server Info -->
                      <div class="space-y-3">
                        <div class="space-y-1">
                          <div class="text-sm text-amber-300 font-semibold">{{ score.mapName }}</div>
                          <div class="text-xs text-slate-400 truncate">{{ score.serverName }}</div>
                        </div>
                        
                        <!-- Timestamp -->
                        <div class="flex items-center gap-2 text-xs text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                          </svg>
                          <span>{{ formatRelativeTime(score.timestamp) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
          
          <div class="relative z-10 p-4 sm:p-8 space-y-4 sm:space-y-8">
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
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                <!-- K/D Ratio Card -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300">
                  <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
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
                  
                  <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
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
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                <!-- Total Kills -->
                <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                  <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
                  
                  <div class="relative z-10 p-3 sm:p-6">
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
                  
                  <div class="relative z-10 p-3 sm:p-6">
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
              
              <!-- Activity Timeline Chart -->
              <div 
                v-if="playerStats.insights && playerStats.insights.activityByHour && playerStats.insights.activityByHour.length > 0"
                class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300"
              >
                <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span class="text-2xl">⏰</span>
                      </div>
                      <div>
                        <h4 class="text-lg font-bold text-white">Typical online hours</h4>
                        <p class="text-slate-400 text-sm">Last {{ daysBetween(playerStats.insights.startPeriod, playerStats.insights.endPeriod) }} days</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Activity Chart -->
                  <div class="relative overflow-hidden bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <!-- Time Period Background Zones -->
                    <div class="absolute inset-0 flex">
                      <div class="flex-1 bg-gradient-to-b from-blue-500/5 to-blue-600/5"></div>
                      <div class="flex-1 bg-gradient-to-b from-yellow-500/5 to-orange-600/5"></div>
                      <div class="flex-1 bg-gradient-to-b from-purple-500/5 to-indigo-600/5"></div>
                    </div>
                    
                    <!-- Chart -->
                    <div class="relative z-10 p-4 h-32">
                      <Line
                        :data="activityChartData"
                        :options="activityChartOptions"
                      />
                    </div>
                  </div>
                  
                  <!-- Time Period Labels - Below Chart -->
                  <div class="flex px-4 pb-2">
                    <div class="flex-1 flex justify-center">
                      <span class="text-xs text-slate-500">🌙 Night</span>
                    </div>
                    <div class="flex-1 flex justify-center">
                      <span class="text-xs text-slate-500">☀️ Day</span>
                    </div>
                    <div class="flex-1 flex justify-center">
                      <span class="text-xs text-slate-500">🌆 Evening</span>
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
              <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                <div
                  v-for="server in sortedServers"
                  :key="server.serverGuid"
                  class="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <!-- Card Background Effects -->
                  <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
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
              <p class="text-slate-400">Your competitive standings across servers</p>
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
                  ></div>
                  <div 
                    class="absolute -bottom-8 -left-8 w-16 h-16 rounded-full blur-lg opacity-20 animate-pulse delay-700"
                    :class="{
                      'bg-yellow-300': ranking.rank === 1,
                      'bg-slate-300': ranking.rank === 2,
                      'bg-orange-400': ranking.rank === 3,
                      'bg-purple-400': ranking.rank > 3
                    }"
                  ></div>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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
                      <h5 class="text-xl font-bold text-white group-hover/link:text-transparent group-hover/link:bg-clip-text transition-all duration-300 leading-tight"
                        :class="{
                          'group-hover/link:bg-gradient-to-r group-hover/link:from-yellow-300 group-hover/link:to-yellow-500': ranking.rank === 1,
                          'group-hover/link:bg-gradient-to-r group-hover/link:from-slate-300 group-hover/link:to-slate-500': ranking.rank === 2,
                          'group-hover/link:bg-gradient-to-r group-hover/link:from-orange-300 group-hover/link:to-orange-500': ranking.rank === 3,
                          'group-hover/link:bg-gradient-to-r group-hover/link:from-purple-300 group-hover/link:to-pink-400': ranking.rank > 3
                        }"
                      >
                        {{ ranking.serverName }}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline ml-2 opacity-0 group-hover/link:opacity-100 transition-opacity transform group-hover/link:translate-x-1">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </h5>
                    </router-link>
                  </div>

                  <!-- Ping Display -->
                  <div class="text-center space-y-3">
                    <div class="text-xs uppercase tracking-widest font-bold opacity-60">AVERAGE PING</div>
                    <div class="flex items-center justify-center gap-2">
                      <div 
                        class="w-2 h-2 rounded-full animate-pulse"
                        :class="{
                          'bg-green-400': ranking.averagePing < 50,
                          'bg-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                          'bg-red-400': ranking.averagePing >= 100
                        }"
                      ></div>
                      <div 
                        class="text-2xl font-black"
                        :class="{
                          'text-green-400': ranking.averagePing < 50,
                          'text-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                          'text-red-400': ranking.averagePing >= 100
                        }"
                      >
                        {{ ranking.averagePing }}<span class="text-base opacity-60">ms</span>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:rotate-12">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                          <path d="m9 14 2 2 4-4"/>
                        </svg>
                        View Rankings
                      </div>
                    </router-link>
                    
                    <!-- View Maps Button -->
                    <button
                      @click="toggleServerExpansion(ranking.serverGuid)"
                      class="w-full px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform hover:scale-105 active:scale-95"
                      :class="{
                        'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-300 hover:from-yellow-500/30 hover:to-yellow-600/30 hover:border-yellow-400/50 shadow-lg shadow-yellow-500/10': ranking.rank === 1,
                        'bg-gradient-to-r from-slate-500/20 to-slate-600/20 border border-slate-500/30 text-slate-300 hover:from-slate-500/30 hover:to-slate-600/30 hover:border-slate-400/50 shadow-lg shadow-slate-500/10': ranking.rank === 2,
                        'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 text-orange-300 hover:from-orange-500/30 hover:to-orange-600/30 hover:border-orange-400/50 shadow-lg shadow-orange-500/10': ranking.rank === 3,
                        'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/30 text-slate-300 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/50 shadow-lg shadow-slate-900/20': ranking.rank > 3
                      }"
                    >
                      <div class="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:rotate-12">
                          <path d="M9 19c-5 0-8-3-8-7s3-7 8-7 8 3 8 7-3 7-8 7"/>
                          <path d="m13.5 10.5 2.5-2.5"/>
                          <path d="m13.5 13.5 2.5 2.5"/>
                        </svg>
                        {{ expandedServerId === ranking.serverGuid ? 'Hide Maps' : 'View Maps' }}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Expanded Map Stats Section -->
            <div
              v-if="expandedServerId"
              class="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
            >
              <div class="p-3 sm:p-6 border-b border-slate-700/50">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div class="space-y-1">
                    <h5 class="text-xl font-bold text-white">Map Performance</h5>
                    <p class="text-slate-400 text-sm">{{ expandedServerName || 'Selected Server' }}</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="option in timeRangeOptions"
                      :key="option.value"
                      :class="[
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        selectedTimeRange === option.value 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
                      ]"
                      @click="selectedTimeRange = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="p-3 sm:p-6">
                <div
                  v-if="mapStats.length === 0 && mapStatsLoading"
                  class="flex flex-col items-center justify-center p-12 space-y-4"
                >
                  <div class="relative">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-600"></div>
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-amber-500 absolute top-0"></div>
                  </div>
                  <p class="text-slate-400 font-medium">Loading map statistics...</p>
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
                      <div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-amber-400 font-medium text-sm">Updating...</span>
                    </div>
                  </div>
                  <!-- Map Stats Table -->
                  <table class="w-full border-collapse">
                    <!-- Table Header -->
                    <thead class="sticky top-0 z-10">
                      <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                        <th @click="changeMapStatsSort('mapName')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-amber-500/50">
                          <div class="flex items-center gap-1.5">
                            <span class="text-amber-400 text-xs">🗺️</span>
                            <span class="font-mono font-bold">MAP</span>
                            <span class="text-xs transition-transform duration-200" :class="{
                              'text-amber-400 opacity-100': mapStatsSortField === 'mapName',
                              'opacity-50': mapStatsSortField !== 'mapName',
                              'rotate-0': mapStatsSortField === 'mapName' && mapStatsSortDirection === 'asc',
                              'rotate-180': mapStatsSortField === 'mapName' && mapStatsSortDirection === 'desc'
                            }">▲</span>
                          </div>
                        </th>
                        <th @click="changeMapStatsSort('totalScore')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-yellow-500/50">
                          <div class="flex items-center gap-1.5">
                            <span class="text-yellow-400 text-xs">🏆</span>
                            <span class="font-mono font-bold">SCORE</span>
                            <span class="text-xs transition-transform duration-200" :class="{
                              'text-yellow-400 opacity-100': mapStatsSortField === 'totalScore',
                              'opacity-50': mapStatsSortField !== 'totalScore',
                              'rotate-0': mapStatsSortField === 'totalScore' && mapStatsSortDirection === 'asc',
                              'rotate-180': mapStatsSortField === 'totalScore' && mapStatsSortDirection === 'desc'
                            }">▲</span>
                          </div>
                        </th>
                        <th @click="changeMapStatsSort('kdRatio')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-green-500/50">
                          <div class="flex items-center gap-1.5">
                            <span class="text-green-400 text-xs">⚔️</span>
                            <span class="font-mono font-bold">K/D</span>
                            <span class="text-xs transition-transform duration-200" :class="{
                              'text-green-400 opacity-100': mapStatsSortField === 'kdRatio',
                              'opacity-50': mapStatsSortField !== 'kdRatio',
                              'rotate-0': mapStatsSortField === 'kdRatio' && mapStatsSortDirection === 'asc',
                              'rotate-180': mapStatsSortField === 'kdRatio' && mapStatsSortDirection === 'desc'
                            }">▲</span>
                          </div>
                        </th>
                        <th @click="changeMapStatsSort('totalKills')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-red-500/50">
                          <div class="flex items-center gap-1.5">
                            <span class="text-red-400 text-xs">🎯</span>
                            <span class="font-mono font-bold">KILLS</span>
                            <span class="text-xs transition-transform duration-200" :class="{
                              'text-red-400 opacity-100': mapStatsSortField === 'totalKills',
                              'opacity-50': mapStatsSortField !== 'totalKills',
                              'rotate-0': mapStatsSortField === 'totalKills' && mapStatsSortDirection === 'asc',
                              'rotate-180': mapStatsSortField === 'totalKills' && mapStatsSortDirection === 'desc'
                            }">▲</span>
                          </div>
                        </th>
                        <th @click="changeMapStatsSort('totalDeaths')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-purple-500/50">
                          <div class="flex items-center gap-1.5">
                            <span class="text-purple-400 text-xs">💀</span>
                            <span class="font-mono font-bold">DEATHS</span>
                            <span class="text-xs transition-transform duration-200" :class="{
                              'text-purple-400 opacity-100': mapStatsSortField === 'totalDeaths',
                              'opacity-50': mapStatsSortField !== 'totalDeaths',
                              'rotate-0': mapStatsSortField === 'totalDeaths' && mapStatsSortDirection === 'asc',
                              'rotate-180': mapStatsSortField === 'totalDeaths' && mapStatsSortDirection === 'desc'
                            }">▲</span>
                          </div>
                        </th>
                        <th @click="changeMapStatsSort('sessionsPlayed')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-blue-500/50">
                          <div class="flex items-center gap-1.5">
                            <span class="text-blue-400 text-xs">🎮</span>
                            <span class="font-mono font-bold">SESSIONS</span>
                            <span class="text-xs transition-transform duration-200" :class="{
                              'text-blue-400 opacity-100': mapStatsSortField === 'sessionsPlayed',
                              'opacity-50': mapStatsSortField !== 'sessionsPlayed',
                              'rotate-0': mapStatsSortField === 'sessionsPlayed' && mapStatsSortDirection === 'asc',
                              'rotate-180': mapStatsSortField === 'sessionsPlayed' && mapStatsSortDirection === 'desc'
                            }">▲</span>
                          </div>
                        </th>
                        <th @click="changeMapStatsSort('totalPlayTimeMinutes')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-cyan-500/50">
                          <div class="flex items-center gap-1.5">
                            <span class="text-cyan-400 text-xs">⏱️</span>
                            <span class="font-mono font-bold">TIME</span>
                            <span class="text-xs transition-transform duration-200" :class="{
                              'text-cyan-400 opacity-100': mapStatsSortField === 'totalPlayTimeMinutes',
                              'opacity-50': mapStatsSortField !== 'totalPlayTimeMinutes',
                              'rotate-0': mapStatsSortField === 'totalPlayTimeMinutes' && mapStatsSortDirection === 'asc',
                              'rotate-180': mapStatsSortField === 'totalPlayTimeMinutes' && mapStatsSortDirection === 'desc'
                            }">▲</span>
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
                        <td class="p-1.5">
                          <router-link 
                            :to="{
                              path: `/players/${encodeURIComponent(playerName)}/sessions`,
                              query: { 
                                map: map.mapName,
                                ...(expandedServerName && { server: expandedServerName })
                              }
                            }"
                            class="block group-hover:text-amber-400 transition-all duration-300 no-underline"
                          >
                            <div class="font-bold text-slate-200 truncate max-w-xs text-sm">{{ map.mapName }}</div>
                          </router-link>
                        </td>

                        <!-- Score -->
                        <td class="p-1.5">
                          <div class="font-mono text-sm font-bold text-yellow-400">{{ map.totalScore.toLocaleString() }}</div>
                        </td>

                        <!-- K/D Ratio -->
                        <td class="p-1.5">
                          <div class="font-mono text-sm font-bold text-green-400">{{ calculateKDR(map.totalKills, map.totalDeaths) }}</div>
                        </td>

                        <!-- Kills -->
                        <td class="p-1.5">
                          <div class="font-mono text-sm font-bold text-red-400">{{ map.totalKills }}</div>
                        </td>

                        <!-- Deaths -->
                        <td class="p-1.5">
                          <div class="font-mono text-sm font-bold text-purple-400">{{ map.totalDeaths }}</div>
                        </td>

                        <!-- Sessions -->
                        <td class="p-1.5">
                          <div class="font-mono text-sm font-bold text-blue-400">{{ map.sessionsPlayed }}</div>
                        </td>

                        <!-- Play Time -->
                        <td class="p-1.5">
                          <div class="font-mono text-sm font-bold text-cyan-400">{{ formatPlayTime(map.totalPlayTimeMinutes) }}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div
                  v-else
                  class="text-center py-12"
                >
                  <div class="space-y-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-slate-500">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <p class="text-slate-400 font-medium">No map statistics available for the selected time range</p>
                    <p class="text-slate-500 text-sm">Try selecting a different time period</p>
                  </div>
                </div>
              </div>
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
                class="group inline-flex items-center gap-3 px-6 py-3 text-sm font-bold !text-white bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
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

        <!-- Player Comparison & Analysis Section -->
        <div 
          v-if="playerStats"
          class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8"
        >
          <!-- Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5"></div>
          <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
          
          <div class="relative z-10 p-8 space-y-6">
            <!-- Section Header -->
            <div 
              class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 cursor-pointer group p-2 -m-2 rounded-xl hover:bg-slate-800/30 transition-all duration-300"
              @click="toggleSimilarPlayersSection"
            >
              <div class="space-y-2">
                <h3 class="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:via-blue-300 group-hover:to-purple-300 transition-all duration-300">
                  🔍 Player Intelligence & Analysis
                </h3>
                <p class="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">Advanced behavioral pattern recognition and player comparison</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-slate-400 group-hover:text-cyan-400 transition-colors duration-300 font-medium">
                  {{ similarSectionExpanded ? '▲ Collapse' : '▼ Expand' }}
                </div>
                <div
                  v-if="!similarSectionExpanded"
                  class="hidden lg:block text-sm text-slate-500 italic group-hover:text-slate-400 transition-colors duration-300"
                >
                  Click to find players like {{ playerName }}
                </div>
              </div>
            </div>
            <div v-if="similarSectionExpanded" class="space-y-6">
              <!-- Detection Mode Selector -->
              <div class="p-1 bg-slate-800/40 rounded-xl border border-slate-600/50 backdrop-blur-sm">
                <div class="flex rounded-lg overflow-hidden">
                  <button 
                    :class="[
                      'flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold transition-all duration-300 ease-out',
                      detectionMode === 'default' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-white hover:shadow-md'
                    ]"
                    @click="setDetectionMode('default')"
                  >
                    <span class="text-xl">👥</span>
                    <span class="hidden sm:inline">Similar Players</span>
                    <span class="sm:hidden">Similar</span>
                  </button>
                  <button 
                    :class="[
                      'flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold transition-all duration-300 ease-out',
                      detectionMode === 'aliasdetection' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-white hover:shadow-md'
                    ]"
                    @click="setDetectionMode('aliasdetection')"
                  >
                    <span class="text-xl">🔍</span>
                    <span class="hidden sm:inline">Find Aliases</span>
                    <span class="sm:hidden">Aliases</span>
                  </button>
                </div>
              </div>
            
              <!-- Filter Controls -->
              <div
                v-if="similarPlayers.length > 0 && targetPlayerStats"
                class="p-4 bg-slate-800/40 rounded-xl border border-slate-600/50 backdrop-blur-sm"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium text-slate-300">🔧 Filters</span>
                    <div class="h-4 w-px bg-slate-600"></div>
                  </div>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <span class="text-sm font-medium text-slate-300 group-hover:text-cyan-400 transition-colors">
                      Show only comparable data
                    </span>
                    <div class="relative">
                      <input
                        v-model="showOnlyComparable"
                        type="checkbox"
                        class="sr-only"
                      >
                      <div :class="[
                        'relative w-11 h-6 rounded-full border transition-all duration-300 ease-out',
                        showOnlyComparable 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400 shadow-lg shadow-cyan-500/25' 
                          : 'bg-slate-700 border-slate-600'
                      ]">
                        <div :class="[
                          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-out',
                          showOnlyComparable ? 'transform translate-x-5' : 'transform translate-x-0'
                        ]"></div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            
              <div
                v-if="loadingSimilarPlayers"
                class="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-xl border border-slate-600/50 backdrop-blur-sm"
              >
                <div class="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-slate-300 font-medium animate-pulse">Loading similar players...</p>
              </div>
              <div
                v-else-if="similarPlayersError"
                class="p-6 bg-red-500/10 border border-red-400/50 rounded-xl backdrop-blur-sm"
              >
                <p class="text-red-300 font-medium flex items-center gap-2">
                  <span class="text-xl">⚠️</span>
                  {{ similarPlayersError }}
                </p>
              </div>
              <div
                v-else-if="similarPlayers.length > 0 && targetPlayerStats"
                class="space-y-4"
              >
                <!-- Comparison cards for each similar player -->
                <div
                  v-for="(similarPlayer, idx) in similarPlayers"
                  :key="idx"
                  :class="[
                    'group relative overflow-hidden rounded-xl border transition-all duration-500 ease-out',
                    'bg-gradient-to-br from-slate-800/70 via-slate-800/50 to-slate-900/50 backdrop-blur-md',
                    'border-slate-600/50 hover:border-cyan-400/60',
                    'shadow-lg hover:shadow-xl hover:shadow-cyan-500/10',
                    isPlayerCardExpanded(idx) 
                      ? 'ring-2 ring-cyan-400/50 shadow-xl shadow-cyan-500/20 transform scale-[1.01]' 
                      : 'hover:transform hover:scale-[1.005]'
                  ]"
                >
                  <!-- Animated background gradient -->
                  <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div 
                    class="relative p-6 cursor-pointer"
                    @click="togglePlayerCard(idx)"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex-1">
                        <h4 class="text-lg font-bold text-cyan-400 mb-1">
                          {{ targetPlayerStats.playerName }}
                        </h4>
                        <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Target Player</span>
                      </div>
                      
                      <div class="flex items-center gap-4 mx-6">
                        <span class="text-slate-400 font-bold text-2xl">VS</span>
                        <div 
                          class="px-3 py-1.5 rounded-full text-white font-bold text-sm shadow-lg border border-white/20"
                          :style="{ backgroundColor: similarityColor(similarPlayer.similarityScore) }"
                        >
                          {{ (similarPlayer.similarityScore * 100).toFixed(0) }}%
                        </div>
                      </div>
                      
                      <div class="flex-1 text-right">
                        <router-link
                          :to="{ name: 'player-comparison', query: { player1: playerName, player2: similarPlayer.playerName } }"
                          class="text-lg font-bold text-white hover:text-cyan-300 transition-colors duration-200 block mb-1"
                          @click.stop
                        >
                          {{ similarPlayer.playerName }}
                        </router-link>
                        <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">
                          {{ detectionMode === 'aliasdetection' ? 'Potential Alias' : 'Similar Player' }}
                        </span>
                      </div>
                    </div>
                  
                    <!-- Compact stats summary when collapsed -->
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 mb-4">
                      <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                        <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">K/D Ratio</span>
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-bold text-cyan-400">{{ targetPlayerStats.killDeathRatio.toFixed(2) }}</span>
                          <span class="text-xs text-slate-500">vs</span>
                          <span class="text-sm font-bold text-slate-200">{{ similarPlayer.killDeathRatio.toFixed(2) }}</span>
                        </div>
                      </div>
                      <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                        <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Kills/Min</span>
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-bold text-cyan-400">{{ targetPlayerStats.killsPerMinute.toFixed(2) }}</span>
                          <span class="text-xs text-slate-500">vs</span>
                          <span class="text-sm font-bold text-slate-200">{{ similarPlayer.killsPerMinute.toFixed(2) }}</span>
                        </div>
                      </div>
                      <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                        <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Server Match</span>
                        <span :class="[
                          'text-sm font-bold',
                          targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName 
                            ? 'text-green-400' 
                            : 'text-orange-400'
                        ]">
                          {{ targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName ? '✓ Same' : '✗ Different' }}
                        </span>
                      </div>
                      <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                        <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Common Servers</span>
                        <span class="text-sm font-bold text-purple-400">
                          {{ getCommonServers(targetPlayerStats, similarPlayer).length }}
                        </span>
                      </div>
                    </div>
                  
                    <!-- Key similarity reasons - always show top 2 -->
                    <div class="mb-4">
                      <div class="flex flex-wrap gap-2 mb-3">
                        <div
                          v-for="(reason, rIdx) in similarPlayer.similarityReasons.slice(0, 2)"
                          :key="rIdx"
                          class="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-xs font-medium text-cyan-300"
                        >
                          {{ reason }}
                        </div>
                        <div
                          v-if="similarPlayer.similarityReasons.length > 2"
                          class="px-3 py-1.5 bg-slate-600/30 border border-slate-500/40 rounded-full text-xs font-medium text-slate-400"
                        >
                          +{{ similarPlayer.similarityReasons.length - 2 }} more
                        </div>
                      </div>
                    </div>

                    <!-- Expand/collapse indicator -->
                    <div class="flex items-center justify-between pt-2 border-t border-slate-600/30">
                      <span class="text-xs text-slate-400">
                        {{ isPlayerCardExpanded(idx) ? 'Click to collapse detailed analysis' : 'Click for detailed comparison' }}
                      </span>
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span class="text-slate-400 text-lg">{{ isPlayerCardExpanded(idx) ? '▲' : '▼' }}</span>
                      </div>
                    </div>
                </div>

                  <!-- Detailed comparison stats - only show when expanded -->
                  <div 
                    v-if="isPlayerCardExpanded(idx)"
                    class="border-t border-slate-600/30 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/30 rounded-b-xl"
                  >
                  <!-- Advanced Performance Analytics -->
                  <div class="p-6 space-y-8">
                    <div class="relative">
                      <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <span class="text-white text-sm font-bold">📊</span>
                        </div>
                        <h5 class="text-lg font-bold text-slate-200">
                          Performance Analytics
                        </h5>
                      </div>
                      
                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="relative overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/40 p-6 rounded-xl border border-slate-600/40 hover:shadow-lg transition-all duration-300">
                          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
                          <div class="relative">
                            <span class="text-xs font-medium text-slate-400 mb-2 block uppercase tracking-widest">Kill/Death Performance</span>
                            <div class="flex items-center justify-between mb-3">
                              <span class="text-2xl font-bold text-cyan-400">{{ targetPlayerStats.killDeathRatio.toFixed(2) }}</span>
                              <div class="text-slate-400 px-2">VS</div>
                              <span class="text-2xl font-bold text-slate-200">{{ similarPlayer.killDeathRatio.toFixed(2) }}</span>
                            </div>
                            <div class="flex items-center justify-center">
                              <div :class="[
                                'px-3 py-1 rounded-full text-xs font-bold',
                                targetPlayerStats.killDeathRatio > similarPlayer.killDeathRatio 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : targetPlayerStats.killDeathRatio < similarPlayer.killDeathRatio 
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              ]">
                                {{ targetPlayerStats.killDeathRatio > similarPlayer.killDeathRatio ? '↑ Better' : 
                                   targetPlayerStats.killDeathRatio < similarPlayer.killDeathRatio ? '↓ Lower' : '≈ Equal' }}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div class="relative overflow-hidden bg-gradient-to-br from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30 hover:shadow-lg transition-all duration-300">
                          <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                          <div class="relative">
                            <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Killing Efficiency</span>
                            <div class="flex items-center justify-between mb-3">
                              <span class="text-2xl font-bold text-bf-primary">{{ targetPlayerStats.killsPerMinute.toFixed(2) }}</span>
                              <div class="text-bf-text-muted px-2">VS</div>
                              <span class="text-2xl font-bold text-white">{{ similarPlayer.killsPerMinute.toFixed(2) }}</span>
                            </div>
                            <div class="flex items-center justify-center">
                              <div :class="[
                                'px-3 py-1 rounded-full text-xs font-bold',
                                targetPlayerStats.killsPerMinute > similarPlayer.killsPerMinute 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : targetPlayerStats.killsPerMinute < similarPlayer.killsPerMinute 
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              ]">
                                {{ targetPlayerStats.killsPerMinute > similarPlayer.killsPerMinute ? '↑ Faster' : 
                                   targetPlayerStats.killsPerMinute < similarPlayer.killsPerMinute ? '↓ Slower' : '≈ Equal' }}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div class="relative overflow-hidden bg-gradient-to-br from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30 hover:shadow-lg transition-all duration-300">
                          <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
                          <div class="relative">
                            <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Experience Level</span>
                            <div class="flex items-center justify-between mb-3">
                              <span class="text-lg font-bold text-bf-primary">{{ formatPlayTime(targetPlayerStats.totalPlayTimeMinutes) }}</span>
                              <div class="text-bf-text-muted px-2">VS</div>
                              <span class="text-lg font-bold text-white">{{ formatPlayTime(similarPlayer.totalPlayTimeMinutes) }}</span>
                            </div>
                            <div class="flex items-center justify-center">
                              <div :class="[
                                'px-3 py-1 rounded-full text-xs font-bold',
                                targetPlayerStats.totalPlayTimeMinutes > similarPlayer.totalPlayTimeMinutes 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : targetPlayerStats.totalPlayTimeMinutes < similarPlayer.totalPlayTimeMinutes 
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              ]">
                                {{ targetPlayerStats.totalPlayTimeMinutes > similarPlayer.totalPlayTimeMinutes ? '↑ More' : 
                                   targetPlayerStats.totalPlayTimeMinutes < similarPlayer.totalPlayTimeMinutes ? '↓ Less' : '≈ Similar' }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Server Intelligence Analysis -->
                    <div 
                      v-if="!showOnlyComparable || getCommonServers(targetPlayerStats, similarPlayer).length > 0"
                      class="relative"
                    >
                      <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <span class="text-white text-sm font-bold">🌐</span>
                        </div>
                        <h5 class="text-lg font-bold text-bf-heading">
                          Server Intelligence & Geography
                        </h5>
                      </div>
                      
                      <!-- Favorite Server Comparison -->
                      <div class="bg-gradient-to-r from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30 mb-6">
                        <div class="grid grid-cols-2 gap-6">
                          <div class="text-center">
                            <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Favorite Server</span>
                            <div class="text-bf-primary font-bold text-lg truncate" title="{{ targetPlayerStats.favoriteServerName }}">
                              {{ targetPlayerStats.favoriteServerName }}
                            </div>
                          </div>
                          <div class="text-center">
                            <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Their Favorite</span>
                            <div class="text-white font-bold text-lg truncate" title="{{ similarPlayer.favoriteServerName }}">
                              {{ similarPlayer.favoriteServerName }}
                            </div>
                          </div>
                        </div>
                        <div class="mt-4 text-center">
                          <div :class="[
                            'inline-flex px-4 py-2 rounded-full text-sm font-bold',
                            targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          ]">
                            {{ targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName ? '🎯 Same Server!' : '🔄 Different Servers' }}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Common Servers Network Analysis -->
                      <div
                        v-if="getCommonServers(targetPlayerStats, similarPlayer).length > 0"
                        class="space-y-4"
                      >
                        <div class="flex items-center justify-between mb-4">
                          <h6 class="text-bf-text-primary font-semibold">
                            Shared Server Network ({{ getCommonServers(targetPlayerStats, similarPlayer).length }})
                          </h6>
                          <div class="text-xs px-3 py-1 bg-bf-primary/20 text-bf-primary rounded-full">
                            {{ getCommonServers(targetPlayerStats, similarPlayer).length === 1 ? 'Single Connection' : 'Multi-Node Network' }}
                          </div>
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div
                            v-for="server in getCommonServers(targetPlayerStats, similarPlayer).slice(0, 4)"
                            :key="server"
                            class="relative overflow-hidden bg-gradient-to-br from-bf-card-bg/50 to-bf-card-bg/30 p-4 rounded-xl border border-bf-border/30"
                          >
                            <div class="flex items-center justify-between mb-3">
                              <div class="font-medium text-bf-text-primary text-sm truncate flex-1" :title="server">
                                {{ server }}
                              </div>
                              <div class="ml-2 flex items-center gap-1">
                                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span class="text-xs text-bf-text-secondary">Active</span>
                              </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 text-center">
                              <div class="bg-bf-card-bg/40 p-3 rounded-lg">
                                <span class="text-xs text-bf-text-secondary block mb-1">Your Ping</span>
                                <span :class="[
                                  'font-bold text-lg',
                                  targetPlayerStats.serverPings[server] <= 50 ? 'text-green-400' :
                                  targetPlayerStats.serverPings[server] <= 100 ? 'text-yellow-400' : 'text-red-400'
                                ]">
                                  {{ Math.round(targetPlayerStats.serverPings[server]) }}ms
                                </span>
                              </div>
                              <div class="bg-bf-card-bg/40 p-3 rounded-lg">
                                <span class="text-xs text-bf-text-secondary block mb-1">Their Ping</span>
                                <span :class="[
                                  'font-bold text-lg',
                                  similarPlayer.serverPings[server] <= 50 ? 'text-green-400' :
                                  similarPlayer.serverPings[server] <= 100 ? 'text-yellow-400' : 'text-red-400'
                                ]">
                                  {{ Math.round(similarPlayer.serverPings[server]) }}ms
                                </span>
                              </div>
                            </div>
                            
                            <div class="mt-3 text-center">
                              <div :class="[
                                'inline-flex px-3 py-1 rounded-full text-xs font-medium',
                                Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 10 
                                  ? 'bg-green-500/20 text-green-400'
                                  : Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 30
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              ]">
                                {{ Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 10 ? '🎯 Similar Latency' :
                                   Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 30 ? '⚠️ Moderate Diff' : '🌍 Geographic Diff' }}
                                ({{ Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]).toFixed(0) }}ms)
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div
                          v-if="getCommonServers(targetPlayerStats, similarPlayer).length > 4"
                          class="text-center p-4 bg-bf-card-bg/20 rounded-lg border border-bf-border/20"
                        >
                          <span class="text-sm text-bf-text-secondary">
                            🌐 +{{ getCommonServers(targetPlayerStats, similarPlayer).length - 4 }} additional servers in your shared network
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Battlefield Mastery Analysis -->
                    <div 
                      v-if="!showOnlyComparable || getCommonMaps(targetPlayerStats, similarPlayer).length > 0"
                      class="relative"
                    >
                      <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <span class="text-white text-sm font-bold">🗺️</span>
                        </div>
                        <h5 class="text-lg font-bold text-bf-heading">
                          Battlefield Mastery & Tactical Analysis
                        </h5>
                      </div>
                      
                      <div
                        v-if="getCommonMaps(targetPlayerStats, similarPlayer).length > 0"
                        class="space-y-4"
                      >
                        <div class="flex items-center justify-between mb-4">
                          <h6 class="text-bf-text-primary font-semibold">
                            Shared Combat Zones ({{ getCommonMaps(targetPlayerStats, similarPlayer).length }})
                          </h6>
                          <div class="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-full">
                            Tactical Intelligence
                          </div>
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div
                            v-for="map in getCommonMaps(targetPlayerStats, similarPlayer).slice(0, 4)"
                            :key="map"
                            class="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-orange-500/5 p-5 rounded-xl border border-red-500/20 hover:shadow-lg transition-all duration-300"
                          >
                            <div class="absolute top-2 right-2">
                              <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            </div>
                            
                            <div class="mb-4">
                              <h6 class="font-bold text-white text-lg mb-1">{{ map }}</h6>
                              <span class="text-xs text-bf-text-secondary uppercase tracking-wide">Battlefield Analysis</span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-3 mb-4">
                              <div class="text-center bg-bf-card-bg/30 p-3 rounded-lg">
                                <span class="text-xs text-bf-text-secondary block mb-1">Your Dominance</span>
                                <span class="text-xl font-bold text-bf-primary">
                                  {{ targetPlayerStats.mapDominanceScores[map].toFixed(1) }}
                                </span>
                              </div>
                              <div class="text-center bg-bf-card-bg/30 p-3 rounded-lg">
                                <span class="text-xs text-bf-text-secondary block mb-1">Their Dominance</span>
                                <span class="text-xl font-bold text-white">
                                  {{ similarPlayer.mapDominanceScores[map].toFixed(1) }}
                                </span>
                              </div>
                            </div>
                            
                            <div class="text-center">
                              <div :class="[
                                'inline-flex px-3 py-1.5 rounded-full text-xs font-bold',
                                targetPlayerStats.mapDominanceScores[map] > similarPlayer.mapDominanceScores[map] 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : targetPlayerStats.mapDominanceScores[map] < similarPlayer.mapDominanceScores[map] 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              ]">
                                {{ targetPlayerStats.mapDominanceScores[map] > similarPlayer.mapDominanceScores[map] ? '🎯 Superior Tactics' : 
                                   targetPlayerStats.mapDominanceScores[map] < similarPlayer.mapDominanceScores[map] ? '⚔️ They Excel Here' : '⚖️ Matched Skills' }}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div
                          v-if="getCommonMaps(targetPlayerStats, similarPlayer).length > 4"
                          class="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20"
                        >
                          <span class="text-sm text-red-400">
                            🗺️ +{{ getCommonMaps(targetPlayerStats, similarPlayer).length - 4 }} additional battlefields where you both have combat experience
                          </span>
                        </div>
                      </div>
                      
                      <div
                        v-else-if="!showOnlyComparable"
                        class="text-center p-6 bg-bf-card-bg/20 rounded-lg border border-bf-border/20"
                      >
                        <span class="text-bf-text-secondary">🚫 No common battlefield experience detected</span>
                      </div>
                    </div>

                    <!-- Temporal Analysis Intelligence -->
                    <div 
                      v-if="!showOnlyComparable || getCommonOnlineHours(targetPlayerStats, similarPlayer).length > 0"
                      class="relative"
                    >
                      <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span class="text-white text-sm font-bold">⏰</span>
                        </div>
                        <h5 class="text-lg font-bold text-bf-heading">
                          Temporal Behavioral Analysis
                        </h5>
                      </div>
                      
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                        <!-- Common Activity Hours -->
                        <div
                          v-if="getCommonOnlineHours(targetPlayerStats, similarPlayer).length > 0"
                          class="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-6 rounded-xl border border-purple-500/20"
                        >
                          <div class="flex items-center justify-between mb-4">
                            <h6 class="font-semibold text-bf-text-primary">Synchronized Activity</h6>
                            <div class="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                              {{ getCommonOnlineHours(targetPlayerStats, similarPlayer).length }} hours overlap
                            </div>
                          </div>
                          
                          <div class="bg-bf-card-bg/30 p-4 rounded-lg mb-4">
                            <div class="text-center">
                              <div class="text-lg font-bold text-purple-300 mb-1">
                                {{ formatOnlineHours(getCommonOnlineHours(targetPlayerStats, similarPlayer)) }}
                              </div>
                              <div class="text-xs text-bf-text-secondary uppercase tracking-wide">
                                Common Active Hours (Your Time)
                              </div>
                            </div>
                          </div>
                          
                          <div :class="[
                            'text-center px-3 py-2 rounded-lg text-sm font-medium',
                            getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 4 
                              ? 'bg-green-500/20 text-green-400' 
                              : getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 2
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          ]">
                            {{ getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 4 ? '🎯 High Synchronization' :
                               getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 2 ? '⚠️ Moderate Overlap' : '❌ Minimal Sync' }}
                          </div>
                        </div>
                        
                        <!-- Temporal Overlap Metrics -->
                        <div class="bg-gradient-to-br from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30">
                          <h6 class="font-semibold text-bf-text-primary mb-4">Behavioral Metrics</h6>
                          
                          <div class="space-y-4">
                            <div class="flex items-center justify-between p-3 bg-bf-card-bg/30 rounded-lg">
                              <span class="text-sm text-bf-text-secondary">Temporal Overlap</span>
                              <span class="font-bold text-bf-primary">{{ formatPlayTime(similarPlayer.temporalOverlapMinutes) }}</span>
                            </div>
                            
                            <div class="flex items-center justify-between p-3 bg-bf-card-bg/30 rounded-lg">
                              <span class="text-sm text-bf-text-secondary">Pattern Similarity</span>
                              <div class="flex items-center gap-2">
                                <span :class="[
                                  'font-bold text-lg',
                                  similarPlayer.temporalNonOverlapScore > 0.8 ? 'text-green-400' :
                                  similarPlayer.temporalNonOverlapScore > 0.6 ? 'text-yellow-400' : 'text-red-400'
                                ]">
                                  {{ (similarPlayer.temporalNonOverlapScore * 100).toFixed(0) }}%
                                </span>
                                <div :class="[
                                  'text-xs px-2 py-1 rounded-full',
                                  similarPlayer.temporalNonOverlapScore > 0.8 ? 'bg-green-500/20 text-green-400' :
                                  similarPlayer.temporalNonOverlapScore > 0.6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                ]">
                                  {{ similarPlayer.temporalNonOverlapScore > 0.8 ? 'High' :
                                     similarPlayer.temporalNonOverlapScore > 0.6 ? 'Medium' : 'Low' }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              <div
                v-else
                class="text-center p-8 bg-slate-800/30 rounded-xl border border-slate-700/40 backdrop-blur-sm"
              >
                <div class="w-16 h-16 mx-auto mb-4 bg-slate-600/30 rounded-full flex items-center justify-center">
                  <span class="text-2xl">🔍</span>
                </div>
                <p class="text-slate-300 font-medium">No similar players found.</p>
                <p class="text-sm text-slate-400 mt-1">Try adjusting your detection mode or filter settings.</p>
              </div>
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
