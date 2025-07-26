<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, PlayerServerStats, fetchPlayerStats, fetchSimilarPlayers, SimilarPlayer } from '../services/playerStatsService';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

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
const similarPlayers = ref<SimilarPlayer[]>([]);
const loadingSimilarPlayers = ref(false);
const similarPlayersError = ref<string | null>(null);
const similarSectionExpanded = ref(false);

const loadSimilarPlayers = async () => {
  loadingSimilarPlayers.value = true;
  similarPlayersError.value = null;
  try {
    similarPlayers.value = await fetchSimilarPlayers(playerName.value);
  } catch (err: any) {
    console.error('Error loading similar players:', err);
    similarPlayersError.value = err.message || 'Failed to load similar players.';
  } finally {
    loadingSimilarPlayers.value = false;
  }
};

const toggleSimilarPlayersSection = async () => {
  similarSectionExpanded.value = !similarSectionExpanded.value;
  if (similarSectionExpanded.value && similarPlayers.value.length === 0 && !loadingSimilarPlayers.value) {
    await loadSimilarPlayers();
  }
};
// --- End Similar Players ---

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
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};

// Format date to a readable format in the user's locale
const formatDate = (dateString: string): string => {
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

// Computed property to sort server play times by minutes played (descending)
const sortedServerPlayTimes = computed(() => {
  if (!playerStats.value?.insights?.serverPlayTimes) return [];
  return [...playerStats.value.insights.serverPlayTimes].sort((a, b) => b.minutesPlayed - a.minutesPlayed);
});

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
      case 'kdRatio':
        const aKdr = a.totalDeaths === 0 ? a.totalKills : a.totalKills / a.totalDeaths;
        const bKdr = b.totalDeaths === 0 ? b.totalKills : b.totalKills / b.totalDeaths;
        return direction * (aKdr - bKdr);
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

const getSessionDuration = (session: any): string => {
  // If session has duration data, use it
  if (session.duration) {
    return `${session.duration}min`;
  }
  
  // Otherwise estimate based on typical session length
  // This is a placeholder - you might want to calculate this differently
  const estimatedDuration = Math.max(15, Math.min(60, Math.floor(session.totalScore / 20)));
  return `~${estimatedDuration}min`;
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

// --- Milestone Progress & Display ---
const MILESTONES = [5000, 10000, 20000, 40000, 50000, 100000];

const achievedMilestoneNumbers = computed(() =>
  (playerStats.value?.killMilestones || []).map(m => m.milestone)
);

const achievedMilestoneDetails = computed(() => {
  const details: Record<number, any> = {};
  (playerStats.value?.killMilestones || []).forEach(m => {
    details[m.milestone] = m;
  });
  return details;
});

const nextMilestoneIndex = computed(() => {
  const totalKills = playerStats.value?.totalKills || 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (totalKills < MILESTONES[i]) return i;
  }
  return MILESTONES.length; // all achieved
});

const milestoneProgress = (milestone: number) => {
  const totalKills = playerStats.value?.totalKills || 0;
  if (totalKills >= milestone) return 1;
  // Use reverse() and find() instead of findLast() for compatibility
  const prev = [...MILESTONES].reverse().find((m: number) => m < milestone) || 0;
  return (totalKills - prev) / (milestone - prev);
};

const getMilestoneImage = (milestone: number) => {
  return new URL(`../assets/milestone-${milestone/1000}k.png`, import.meta.url).href;
};

// For mobile badge flip
const flippedBadge = ref<number|null>(null);
const isMobile = ref(false);

onMounted(() => {
  // Simple mobile detection
  isMobile.value = window.innerWidth <= 768;
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
  });
});

const handleBadgeClick = (milestone: number) => {
  if (!isMobile.value) return;
  flippedBadge.value = flippedBadge.value === milestone ? null : milestone;
};

const hasReachedFirstMilestone = computed(() => {
  return (playerStats.value?.killMilestones?.length ?? 0) > 0;
});
const nextMilestone = computed(() => {
  if (hasReachedFirstMilestone.value) return null;
  return MILESTONES[nextMilestoneIndex.value];
});
const achievedMilestones = computed(() => {
  return playerStats.value?.killMilestones || [];
});

</script>

<template>
  <div class="player-details-container">
    <div class="player-stats-header">
      <div class="player-name-container">
        <button @click="goBack" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Players
        </button>
        <div class="player-header-info">
          <div class="player-name-row">
            <h2 class="player-name-heading">{{ playerName }}</h2>
            <router-link 
              :to="{ path: '/players/compare', query: { player1: playerName } }"
              class="compare-player-btn"
              title="Compare this player with another"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
                <path d="M11 3 8 9l4 13 4-13-3-6"/>
              </svg>
              Compare Player
            </router-link>
          </div>
          <div class="player-header-meta">
            <span class="player-playtime">{{ formatPlayTime(playerStats?.totalPlayTimeMinutes || 0) }}</span>
            <span class="player-last-seen">Last seen: {{ formatRelativeTime(playerStats?.lastPlayed || '') }}</span>
          </div>
          <div v-if="playerStats" class="player-header-stats">
            <div class="header-stat milestone-progress-container" v-if="!hasReachedFirstMilestone">
              <div class="milestone-progress-wrapper" :title="`Progress to ${nextMilestone} Kills!`">
                <svg class="milestone-progress-ring" width="60" height="60">
                  <circle class="milestone-progress-bg" cx="30" cy="30" r="26" fill="none" stroke="#eee" stroke-width="6" />
                  <circle
                    class="milestone-progress-bar"
                    cx="30" cy="30" r="26" fill="none"
                    :stroke="milestoneProgress(nextMilestone) > 0.95 ? '#FFD700' : '#9c27b0'"
                    stroke-width="6"
                    :stroke-dasharray="2 * Math.PI * 26"
                    :stroke-dashoffset="(1 - milestoneProgress(nextMilestone)) * 2 * Math.PI * 26"
                    stroke-linecap="round"
                  />
                </svg>
                <span class="header-stat-value header-stat-kills milestone-progress-text">{{ playerStats.totalKills }}</span>
              </div>
              <span class="header-stat-label milestone-progress-label">
                <span v-if="milestoneProgress(nextMilestone) < 1">{{ Math.floor(milestoneProgress(nextMilestone) * 100) }}% to {{ nextMilestone }} Kills!</span>
                <span v-else>Milestone Achieved!</span>
              </span>
            </div>
            <div class="header-stat" v-else>
              <span class="header-stat-value header-stat-kills">{{ playerStats.totalKills }}</span>
              <span class="header-stat-label">Kills</span>
            </div>
            <div class="header-stat">
              <span class="header-stat-value header-stat-deaths">{{ playerStats.totalDeaths }}</span>
              <span class="header-stat-label">Deaths</span>
            </div>
            <div class="header-stat">
              <span class="header-stat-value">{{ calculateKDR(playerStats.totalKills, playerStats.totalDeaths) }}</span>
              <span class="header-stat-label">K/D</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="player-stats-body">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading player statistics...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
      </div>
      <div v-else-if="playerStats" class="stats-container">
        <!-- Milestone badges row: full width, above Top Servers -->
        <div class="milestone-badges-row">
          <div
            v-for="(milestone, idx) in MILESTONES"
            :key="milestone"
            class="milestone-badge-image-wrapper"
            :class="{
              achieved: achievedMilestoneNumbers.includes(milestone),
              next: nextMilestoneIndex === idx,
              future: nextMilestoneIndex < idx,
              flipped: isMobile && flippedBadge === milestone
            }"
            :title="!isMobile && achievedMilestoneNumbers.includes(milestone) && achievedMilestoneDetails[milestone] ?
              `Achieved: ${formatRelativeTime(achievedMilestoneDetails[milestone].achievedDate)} | ${achievedMilestoneDetails[milestone].totalKillsAtMilestone} kills | ${achievedMilestoneDetails[milestone].daysToAchieve} days`
              :
              achievedMilestoneNumbers.includes(milestone)
                ? `Achieved ${milestone.toLocaleString()} Kills!`
                : nextMilestoneIndex === idx
                  ? `Next milestone: ${milestone.toLocaleString()} Kills (${Math.floor(milestoneProgress(milestone)*100)}%)`
                  : `Locked: ${milestone.toLocaleString()} Kills`
            "
            @click="handleBadgeClick(milestone)"
          >
            <div class="milestone-badge-flip">
              <div class="milestone-badge-front">
                <div class="milestone-badge-image-container">
                  <img
                    :src="getMilestoneImage(milestone)"
                    :alt="`${milestone.toLocaleString()} Kills Badge`"
                    class="milestone-badge-image"
                  />
                  <div
                    v-if="nextMilestoneIndex === idx && milestoneProgress(milestone) < 1"
                    class="milestone-badge-progress-overlay"
                    :style="{ height: `${100 - milestoneProgress(milestone) * 100}%` }"
                  ></div>
                  <div v-if="nextMilestoneIndex === idx && milestoneProgress(milestone) < 1" class="milestone-badge-progress-label">
                    {{ Math.floor(milestoneProgress(milestone) * 100) }}%
                  </div>
                </div>
                <div class="milestone-badge-caption">{{ milestone.toLocaleString() }} Kills</div>
              </div>
              <div class="milestone-badge-back" v-if="isMobile && achievedMilestoneNumbers.includes(milestone) && achievedMilestoneDetails[milestone]">
                <div class="milestone-badge-back-content">
                  <div class="milestone-badge-back-label">Achieved</div>
                  <div class="milestone-badge-back-date">{{ formatRelativeTime(achievedMilestoneDetails[milestone].achievedDate) }}</div>
                  <div class="milestone-badge-back-kills">{{ achievedMilestoneDetails[milestone].totalKillsAtMilestone }} kills</div>
                  <div class="milestone-badge-back-days">in {{ achievedMilestoneDetails[milestone].daysToAchieve }} days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="playerStats.isActive && playerStats.currentServer" class="current-server-banner">
          <div class="server-info-line">
            <router-link
              :to="`/servers/${encodeURIComponent(playerStats.currentServer.serverName)}`"
              class="server-link"
            >
              {{ playerStats.currentServer.serverName }}
            </router-link>
            <span v-if="playerStats && playerStats.isActive" class="status-badge active">Active</span>
            <span v-if="playerStats.currentServer.gameId" class="game-id">
              Game: {{ playerStats.currentServer.gameId }}
            </span>
          </div>
          <div v-if="playerStats.currentServer.sessionKills !== undefined && playerStats.currentServer.sessionDeaths !== undefined" class="session-stats">
            Session: {{ playerStats.currentServer.sessionKills }} <img src="@/assets/kills.png" alt="Kills" class="kills-icon" /> / {{ playerStats.currentServer.sessionDeaths }} <img src="@/assets/deaths.png" alt="Deaths" class="deaths-icon" />
            (<img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /> {{ calculateKDR(playerStats.currentServer.sessionKills, playerStats.currentServer.sessionDeaths) }})
          </div>
        </div>

        <!-- General statistics section -->
        <div class="stats-section">
          <h3>Top Servers</h3>
          <div class="stats-grid">
            <!-- Server Cards Section -->
            <div class="server-cards-section" v-if="hasServers">
              <div class="server-cards-grid">
                <div v-for="(server, idx) in sortedServers" :key="server.serverGuid" class="server-card-gamified">
                  <div class="server-card-header">
                    <span class="server-card-title">
                      <img :src="getGameIcon(server.gameId)" alt="Server" style="width: 24px; height: 24px; margin-right: 8px; border-radius: 6px; vertical-align: middle;" />
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
        <div v-if="playerStats.insights" class="stats-section">
          <h3>Player Insights</h3>
          <!-- Remove the .insights-period div -->

          <!-- Activity By Hour -->
          <div v-if="playerStats.insights && playerStats.insights.activityByHour && playerStats.insights.activityByHour.length > 0" class="insights-subsection">
            <h4>
              When they've been online in the last {{ daysBetween(playerStats.insights.startPeriod, playerStats.insights.endPeriod) }} days (your time)
            </h4>
            <div class="activity-chart-wrapper">
              <div class="activity-chart-container">
                <!-- Background zones for time periods -->
                <div class="time-period-zones">
                  <div class="time-zone early-zone" title="Early (00:00 - 08:00)"></div>
                  <div class="time-zone day-zone" title="Day (08:00 - 16:00)"></div>
                  <div class="time-zone night-zone" title="Night (16:00 - 24:00)"></div>
                </div>
                <Line :data="activityChartData" :options="activityChartOptions" />
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
          <div v-if="playerStats.insights?.serverRankings && playerStats.insights.serverRankings.length > 0" class="insights-subsection">
            <h4>Server Rankings</h4>
            <div class="server-rankings-table">
              <table>
                <thead>
                  <tr>
                    <th>Server Name</th>
                    <th class="desktop-only">Rank</th>
                    <th class="desktop-only">Score</th>
                    <th class="desktop-only">Ping</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(ranking, index) in playerStats.insights.serverRankings" :key="index">
                    <tr class="server-row" @click="toggleServerExpansion(ranking.serverGuid)">
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
                            <span class="player-ping" :class="{
                              'ping-good': ranking.averagePing < 50,
                              'ping-ok': ranking.averagePing >= 50 && ranking.averagePing < 100,
                              'ping-bad': ranking.averagePing >= 100
                            }">
                              {{ ranking.averagePing }}ms
                            </span>
                          </span>
                        </div>
                      </td>
                      <td class="desktop-only">{{ ranking.rankDisplay }}</td>
                      <td class="desktop-only">{{ ranking.scoreDisplay }}</td>
                      <td class="desktop-only">
                        <span class="player-ping" :class="{
                          'ping-good': ranking.averagePing < 50,
                          'ping-ok': ranking.averagePing >= 50 && ranking.averagePing < 100,
                          'ping-bad': ranking.averagePing >= 100
                        }">
                          {{ ranking.averagePing }}ms
                        </span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
              
              <!-- Expanded map stats section - outside the table -->
              <div v-if="expandedServerId" class="map-stats-expansion">
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
                <div v-if="mapStatsLoading" class="map-stats-loading">
                  <div class="loading-spinner"></div>
                  <p>Loading map statistics...</p>
                </div>
                <div v-else-if="mapStats.length > 0" class="map-stats-content">
                  <!-- Desktop grid view -->
                  <div class="desktop-only map-stats-grid">
                    <!-- Headers -->
                    <div class="header-cell" @click="changeMapStatsSort('mapName')">
                      Map Name
                      <span v-if="mapStatsSortField === 'mapName'" class="sort-indicator">
                        {{ mapStatsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </div>
                    <div class="header-cell" @click="changeMapStatsSort('totalScore')">
                      Score
                      <span v-if="mapStatsSortField === 'totalScore'" class="sort-indicator">
                        {{ mapStatsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </div>
                    <div class="header-cell" @click="changeMapStatsSort('kdRatio')">
                      <img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" />
                      <span v-if="mapStatsSortField === 'kdRatio'" class="sort-indicator">
                        {{ mapStatsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </div>
                    <div class="header-cell" @click="changeMapStatsSort('totalKills')">
                      <img src="@/assets/kills.png" alt="Kills" class="kills-icon" />
                      <span v-if="mapStatsSortField === 'totalKills'" class="sort-indicator">
                        {{ mapStatsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </div>
                    <div class="header-cell" @click="changeMapStatsSort('totalDeaths')">
                      <img src="@/assets/deaths.png" alt="Deaths" class="deaths-icon" />
                      <span v-if="mapStatsSortField === 'totalDeaths'" class="sort-indicator">
                        {{ mapStatsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </div>
                    <div class="header-cell" @click="changeMapStatsSort('sessionsPlayed')">
                      Sessions
                      <span v-if="mapStatsSortField === 'sessionsPlayed'" class="sort-indicator">
                        {{ mapStatsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </div>
                    <div class="header-cell" @click="changeMapStatsSort('totalPlayTimeMinutes')">
                      Play Time
                      <span v-if="mapStatsSortField === 'totalPlayTimeMinutes'" class="sort-indicator">
                        {{ mapStatsSortDirection === 'asc' ? '▲' : '▼' }}
                      </span>
                    </div>
                    
                    <!-- Data rows -->
                    <template v-for="(map, mapIndex) in sortedMapStats" :key="mapIndex">
                      <div class="data-cell">
                        <router-link 
                          :to="{
                            path: `/players/${encodeURIComponent(playerName)}/sessions`,
                            query: { 
                              map: map.mapName,
                              ...(expandedServerName && { server: expandedServerName })
                            }
                          }"
                          class="map-link"
                        >
                          {{ map.mapName }}
                        </router-link>
                      </div>
                      <div class="data-cell">{{ map.totalScore }}</div>
                      <div class="data-cell">{{ calculateKDR(map.totalKills, map.totalDeaths) }}</div>
                      <div class="data-cell">{{ map.totalKills }}</div>
                      <div class="data-cell">{{ map.totalDeaths }}</div>
                      <div class="data-cell">{{ map.sessionsPlayed }}</div>
                      <div class="data-cell">{{ formatPlayTime(map.totalPlayTimeMinutes) }}</div>
                    </template>
                  </div>

                  <!-- Mobile card view -->
                  <div class="mobile-only map-stats-cards">
                    <div class="mobile-sort-controls">
                      <label>Sort by:</label>
                      <select v-model="mapStatsSortField" @change="changeMapStatsSort(mapStatsSortField)" class="mobile-sort-select">
                        <option value="totalScore">Score</option>
                        <option value="kdRatio">K/D Ratio</option>
                        <option value="mapName">Map Name</option>
                        <option value="totalKills">Kills</option>
                        <option value="totalDeaths">Deaths</option>
                        <option value="sessionsPlayed">Sessions</option>
                        <option value="totalPlayTimeMinutes">Play Time</option>
                      </select>
                      <button @click="mapStatsSortDirection = mapStatsSortDirection === 'asc' ? 'desc' : 'asc'" class="mobile-sort-direction">
                        {{ mapStatsSortDirection === 'asc' ? '↑' : '↓' }}
                      </button>
                    </div>
                    <div v-for="(map, mapIndex) in sortedMapStats" :key="mapIndex" class="map-stat-card">
                      <div class="map-stat-header">
                        <h5 class="map-name">
                          <router-link 
                            :to="{
                              path: `/players/${encodeURIComponent(playerName)}/sessions`,
                              query: { 
                                map: map.mapName,
                                ...(expandedServerName && { server: expandedServerName })
                              }
                            }"
                            class="map-link"
                          >
                            {{ map.mapName }}
                          </router-link>
                        </h5>
                        <div class="map-score">{{ map.totalScore }}</div>
                      </div>
                      <div class="map-stat-details">
                        <div class="stat-row-condensed">
                          <span class="stat-item">
                            <img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" />
                            {{ calculateKDR(map.totalKills, map.totalDeaths) }}
                          </span>
                          <span class="stat-separator">•</span>
                          <span class="stat-item">
                            <img src="@/assets/kills.png" alt="Kills" class="kills-icon" />
                            {{ map.totalKills }}
                          </span>
                          <span class="stat-separator">•</span>
                          <span class="stat-item">
                            <img src="@/assets/deaths.png" alt="Deaths" class="deaths-icon" />
                            {{ map.totalDeaths }}
                          </span>
                        </div>
                        <div class="stat-row-condensed">
                          <span class="stat-item">Sessions: {{ map.sessionsPlayed }}</span>
                          <span class="stat-separator">•</span>
                          <span class="stat-item">{{ formatPlayTime(map.totalPlayTimeMinutes) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="no-map-stats">
                  <p>No map statistics available for the selected time range.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Similar Players section -->
        <div v-if="playerStats" class="stats-section">
          <h3 @click="toggleSimilarPlayersSection" class="collapsible-header">
            Similar Players
            <span class="toggle-icon">{{ similarSectionExpanded ? '▲' : '▼' }}</span>
            <span v-if="!similarSectionExpanded" class="expand-hint">Click to find players like {{ playerName }}</span>
          </h3>
          <div v-if="similarSectionExpanded">
            <div v-if="loadingSimilarPlayers" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Loading similar players...</p>
            </div>
            <div v-else-if="similarPlayersError" class="error-container">
              <p class="error-message">{{ similarPlayersError }}</p>
            </div>
            <div v-else-if="similarPlayers.length > 0" class="similar-players-table-wrapper">
              <table class="similar-players-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Similarity</th>
                    <th class="reasons-col">Why</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(sim, idx) in similarPlayers" :key="idx">
                    <td>
                      <router-link
                        :to="{ name: 'player-comparison', query: { player1: playerName, player2: sim.playerName } }"
                        class="similar-player-name"
                      >
                        {{ sim.playerName }}
                      </router-link>
                    </td>
                    <td :style="{ color: similarityColor(sim.similarityScore) }">
                      {{ (sim.similarityScore * 100).toFixed(0) }}%
                    </td>
                    <td>
                      <ul class="similarity-reasons">
                        <li v-for="(reason, rIdx) in sim.similarityReasons" :key="rIdx">{{ reason }}</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="no-data-container">
              <p>No similar players found.</p>
            </div>
          </div>
        </div>

        <!-- Recent rounds section -->
        <div v-if="playerStats.recentSessions.length > 0" class="stats-section">
          <div class="section-header-with-action">
            <h3>Recent Rounds</h3>
            <router-link :to="`/players/${encodeURIComponent(playerName)}/sessions`" class="view-all-button">
              View All
            </router-link>
          </div>
          <!-- Timeline container -->
          <div class="timeline-container">
            <template v-for="(session, index) in playerStats.recentSessions" :key="index">
              <!-- Session timeline item -->
              <div class="timeline-item">
                <!-- Timeline node -->
                <div class="timeline-node-container">
                  <div 
                    class="timeline-node" 
                    :class="getPerformanceClass(session)"
                    :title="getPerformanceLabel(session)"
                  ></div>
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
                    <span v-if="session.isActive" class="active-session-badge">Active</span>
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
                  <div class="time-gap-line"></div>
                  <div class="time-gap-badge">
                    {{ getTimeGap(session, playerStats.recentSessions[index + 1]) }}
                  </div>
                  <div class="time-gap-line"></div>
                </div>
              </div>
            </template>
          </div>
        </div>

      </div>
      <div v-else class="no-data-container">
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
    padding: 6px;
    font-size: 0.9rem;
  }

  .map-stats-table th.sortable-header {
    padding-right: 20px;
  }

  .map-stats-table .sort-indicator {
    right: 6px;
    font-size: 0.7rem;
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
    padding: 4px;
    font-size: 0.8rem;
  }

  .map-stats-table th.sortable-header {
    padding-right: 16px;
  }

  .map-stats-table .sort-indicator {
    right: 4px;
    font-size: 0.65rem;
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
}
.server-cards-grid {
  display: flex;
  flex-wrap: wrap;
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
  max-width: 380px;
  flex: 1 1 320px;
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
}
.server-cards-grid {
  display: flex;
  flex-wrap: wrap;
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
  max-width: 380px;
  flex: 1 1 320px;
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
  gap: 18px;
  margin: 18px 0 10px 0;
  justify-content: center;
  align-items: flex-end;
}
.milestone-badge-image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  opacity: 0.45;
  filter: grayscale(1) brightness(0.8);
  transition: opacity 0.2s, filter 0.2s;
  cursor: pointer;
  perspective: 600px;
}
.milestone-badge-image-wrapper.achieved {
  opacity: 1;
  filter: none;
}
.milestone-badge-image-wrapper.next {
  opacity: 0.85;
  filter: grayscale(0.3) brightness(1);
}
.milestone-badge-image-wrapper.future {
  opacity: 0.45;
  filter: grayscale(1) brightness(0.8);
}
.milestone-badge-flip {
  width: 64px;
  height: 90px;
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
  background: #fffbe6;
  color: #7c4dff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.08);
  transform: rotateX(180deg);
  padding: 10px 0;
  font-size: 0.95rem;
}
.milestone-badge-back-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.milestone-badge-back-label {
  font-weight: bold;
  color: #ff9800;
}
.milestone-badge-back-date,
.milestone-badge-back-kills,
.milestone-badge-back-days {
  font-size: 0.95rem;
  color: #7c4dff;
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
  background: #fff;
}
.milestone-badge-progress-overlay {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  background: rgba(156,39,176,0.45);
  border-radius: 0 0 50% 50%;
  pointer-events: none;
  z-index: 2;
  transition: height 0.4s cubic-bezier(0.4,0,0.2,1);
}
.milestone-badge-progress-label {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 0 1px 4px #000;
  z-index: 3;
}
.milestone-badge-caption {
  margin-top: 6px;
  font-size: 0.95rem;
  color: #7c4dff;
  font-weight: 600;
  text-align: center;
}
@media (max-width: 768px) {
  .milestone-badges-row {
    gap: 10px;
  }
  .milestone-badge-flip {
    width: 54px;
    height: 76px;
  }
  .milestone-badge-image-container, .milestone-badge-image {
    width: 54px;
    height: 54px;
  }
}
</style>
