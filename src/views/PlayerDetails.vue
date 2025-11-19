<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PlayerTimeStatistics, fetchPlayerStats } from '../services/playerStatsService';
import { TrendDataPoint } from '../types/playerStatsTypes';
// Removed unused imports - BestScores, BestScoreEntry
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import PlayerAchievements from '../components/PlayerAchievements.vue';
import PlayerRecentSessions from '../components/PlayerRecentSessions.vue';
import PlayerHero from '../components/PlayerDetails/PlayerHero.vue';
import BestScoresSection from '../components/PlayerDetails/BestScoresSection.vue';
import SimilarPlayersSection from '../components/PlayerDetails/SimilarPlayersSection.vue';
import TopServersSection from '../components/PlayerDetails/TopServersSection.vue';

import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';
import defaultIcon from '@/assets/servers.webp';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Router
const router = useRouter();
const route = useRoute();

const playerName = ref(route.params.playerName as string);
const playerStats = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Map stats state moved to TopServersSection component
// Best Scores state moved to BestScoresSection component
// Similar Players code moved to SimilarPlayersSection component

// Computed properties for trend charts
const kdTrendChartData = computed(() => {
  if (!playerStats.value?.recentStats?.kdRatioTrend) return { labels: [], datasets: [] };

  const trend = playerStats.value.recentStats.kdRatioTrend;
  const labels = trend.map((point: TrendDataPoint) => new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const data = trend.map((point: TrendDataPoint) => point.value);

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
          title: function(context: any[]) {
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

// Map stats functions moved to TopServersSection component

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

// Map stats sorting and computed properties moved to TopServersSection component

// Computed property for current best scores
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

const gameIcons: { [key: string]: string } = {
  bf1942: bf1942Icon,
  fh2: fh2Icon,
  bfv: bfvIcon,
};

const getGameIcon = (gameId: string): string => {
  if (!gameId) return defaultIcon;
  return gameIcons[gameId.toLowerCase()] || defaultIcon;
};

// Server Cards Computed moved to TopServersSection component





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

// Cleanup function to restore body scroll when component unmounts
onUnmounted(() => {
  document.body.style.overflow = 'unset';
});

</script>

<template>
  <!-- Full-width Hero Section -->
  <PlayerHero
    :player-name="playerName"
    :player-stats="playerStats"
  />

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
          <BestScoresSection
            :player-name="playerName"
            :player-stats="playerStats"
          />

          <!-- Performance Analytics Section -->
          <div 
            v-if="playerStats?.recentStats"
            class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8"
          >
            <!-- Section Background Effects -->
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
            <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl" />
          
            <div class="relative z-10 p-4 sm:p-8 space-y-4 sm:space-y-8">
              <!-- Section Header -->
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div class="space-y-2">
                  <h3 class="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    📊 Performance Analytics
                  </h3>
                  <p class="text-slate-400">
                    Real-time battlefield performance metrics
                  </p>
                </div>
                <div class="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p class="text-cyan-400 font-semibold">
                    {{ Math.ceil((new Date(playerStats.recentStats.analysisPeriodEnd).getTime() - new Date(playerStats.recentStats.analysisPeriodStart).getTime()) / (1000 * 60 * 60 * 24)) }} days analysis
                  </p>
                  <p class="text-slate-500 text-sm">
                    {{ playerStats.recentStats.totalRoundsAnalyzed }} rounds tracked
                  </p>
                </div>
              </div>
            
              <!-- Performance Metrics Grid -->
              <div class="space-y-8">
                <!-- Trend Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  <!-- K/D Ratio Card -->
                  <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300">
                    <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                    <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                            <span class="text-2xl">📈</span>
                          </div>
                          <div>
                            <h4 class="text-lg font-bold text-white">
                              K/D Ratio
                            </h4>
                            <p class="text-slate-400 text-sm">
                              Kill/Death Performance
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <div
                            class="text-3xl font-bold"
                            :style="{ color: getGaugeColor(currentKDRatio, 'kdr') }"
                          >
                            {{ currentKDRatio.toFixed(3) }}
                          </div>
                          <div class="text-slate-400 text-sm">
                            Current Ratio
                          </div>
                        </div>
                      </div>
                    
                      <div class="h-20 -mx-2">
                        <Line
                          :data="kdTrendChartData"
                          :options="tickerChartOptions"
                        />
                      </div>
                    </div>
                  </div>
                
                  <!-- Kill Rate Card -->
                  <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                    <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                    <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <span class="text-2xl">⚡</span>
                          </div>
                          <div>
                            <h4 class="text-lg font-bold text-white">
                              Kill Rate
                            </h4>
                            <p class="text-slate-400 text-sm">
                              Kills per Minute
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <div
                            class="text-3xl font-bold"
                            :style="{ color: getGaugeColor(currentKillRate, 'killrate') }"
                          >
                            {{ currentKillRate.toFixed(2) }}
                          </div>
                          <div class="text-slate-400 text-sm">
                            k/min
                          </div>
                        </div>
                      </div>
                    
                      <div class="h-20 -mx-2">
                        <Line
                          :data="killRateTrendChartData"
                          :options="tickerChartOptions"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              
                <!-- Total Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <!-- Total Kills -->
                  <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                    <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
                  
                    <div class="relative z-10 p-3 sm:p-6">
                      <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300">
                          🎯
                        </div>
                        <div class="space-y-1">
                          <div class="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            {{ playerStats.totalKills.toLocaleString() }}
                          </div>
                          <div class="text-slate-400 font-medium">
                            Total Eliminations
                          </div>
                          <div class="text-green-400 text-sm">
                            +{{ Math.round(currentKillRate * 60 * 24) }} avg daily
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                
                  <!-- Total Deaths -->
                  <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-red-500/50 transition-all duration-300">
                    <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
                  
                    <div class="relative z-10 p-3 sm:p-6">
                      <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300">
                          💀
                        </div>
                        <div class="space-y-1">
                          <div class="text-4xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                            {{ playerStats.totalDeaths.toLocaleString() }}
                          </div>
                          <div class="text-slate-400 font-medium">
                            Total Deaths
                          </div>
                          <div class="text-red-400 text-sm">
                            {{ ((playerStats.totalDeaths / playerStats.totalKills) * 100).toFixed(1) }}% of kills
                          </div>
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
                  <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                  <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <span class="text-2xl">⏰</span>
                        </div>
                        <div>
                          <h4 class="text-lg font-bold text-white">
                            Typical online hours
                          </h4>
                          <p class="text-slate-400 text-sm">
                            Last {{ daysBetween(playerStats.insights.startPeriod, playerStats.insights.endPeriod) }} days
                          </p>
                        </div>
                      </div>
                    </div>
                  
                    <!-- Activity Chart -->
                    <div class="relative overflow-hidden bg-slate-900/50 rounded-lg border border-slate-600/30">
                      <!-- Time Period Background Zones -->
                      <div class="absolute inset-0 flex">
                        <div class="flex-1 bg-gradient-to-b from-blue-500/5 to-blue-600/5" />
                        <div class="flex-1 bg-gradient-to-b from-yellow-500/5 to-orange-600/5" />
                        <div class="flex-1 bg-gradient-to-b from-purple-500/5 to-indigo-600/5" />
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
          <TopServersSection
            :player-name="playerName"
            :player-stats="playerStats"
          />


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
                  <PlayerAchievements
                    :player-name="playerName"
                    :player-stats="playerStats"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Player Comparison & Analysis Section -->
          <SimilarPlayersSection
            :player-name="playerName"
            :player-stats="playerStats"
          />
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
