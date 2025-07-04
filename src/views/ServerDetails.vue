<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ServerDetails, RecentRoundInfo, ServerInsights, fetchServerDetails, fetchServerInsights, fetchLiveServerData } from '../services/serverDetailsService';
import { Line, Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { countryCodeToName } from '../types/countryCodes';
import { ServerInfo } from '../types/server';
import PlayersModal from '../components/PlayersModal.vue';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// State
const serverName = ref(route.params.serverName as string);
const serverDetails = ref<ServerDetails | null>(null);
const serverInsights = ref<ServerInsights | null>(null);
const liveServerInfo = ref<ServerInfo | null>(null);
const isLoading = ref(true);
const isInsightsLoading = ref(true);
const isLiveServerLoading = ref(false);
const error = ref<string | null>(null);
const insightsError = ref<string | null>(null);
const liveServerError = ref<string | null>(null);
const isChartExpanded = ref(false);
const isPingChartExpanded = ref(false);
const pingMetric = ref<'median' | 'p95'>('median');
const isPingExplainerCollapsed = ref(true);
const isServerInsightsCollapsed = ref(true);
const showPlayersModal = ref(false);
const selectedTimePeriod = ref<'week' | 'month'>('week');

// Fetch live server data asynchronously (non-blocking)
const fetchLiveServerDataAsync = async () => {
  if (!serverDetails.value?.serverIp || !serverDetails.value?.serverPort) return;

  isLiveServerLoading.value = true;
  liveServerError.value = null;

  try {
    // Determine game type from server name or use a default
    // You might want to add gameType to ServerDetails interface if available
    const gameId = serverName.value.toLowerCase().includes('fh2') ? 'fh2' : 'bf1942';
    
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
      fetchServerInsights(serverName.value)
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

// Format minutes to hours and minutes
const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

// Format date to a readable format in the user's locale
const formatDate = (dateString: string): string => {
  // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');

  // Format date
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Chart data for player count
const chartData = computed(() => {
  if (!serverDetails.value?.playerCountMetrics) return { labels: [], datasets: [] };

  // Convert timestamps to readable dates
  const labels = serverDetails.value.playerCountMetrics.map(metric => {
    const date = new Date(metric.timestamp * 1000);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  });

  // Get player count values
  const data = serverDetails.value.playerCountMetrics.map(metric => metric.value);

  return {
    labels,
    datasets: [
      {
        label: 'Player Count',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderColor: 'rgba(33, 150, 243, 0.8)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        data
      }
    ]
  };
});

// Calculate max and median values for player count
const playerCountStats = computed(() => {
  if (!serverDetails.value?.playerCountMetrics || serverDetails.value.playerCountMetrics.length === 0) {
    return { max: 0, median: 0 };
  }

  const values = serverDetails.value.playerCountMetrics.map(metric => metric.value);
  const max = Math.max(...values);
  
  // Calculate median
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];

  return { max, median: Math.round(median) };
});

// Chart options - computed to handle expanded vs compact view
const chartOptions = computed(() => {
  // Get computed styles to access CSS variables
  const computedStyles = window.getComputedStyle(document.documentElement);
  const textColor = computedStyles.getPropertyValue('--color-text').trim() || '#333333';
  const textMutedColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#666666';
  const isDarkMode = computedStyles.getPropertyValue('--color-background').trim().includes('26, 16, 37') || 
                    document.documentElement.classList.contains('dark-mode') ||
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Dynamic grid color based on theme
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    scales: {
      y: {
        beginAtZero: true,
        display: isChartExpanded.value,
        suggestedMax: Math.max(playerCountStats.value.max * 1.1, playerCountStats.value.max + 5),
        grid: {
          display: isChartExpanded.value,
          color: gridColor
        },
        title: {
          display: isChartExpanded.value,
          text: `Player Count (Max: ${playerCountStats.value.max}, Median: ${playerCountStats.value.median})`,
          color: textColor
        },
        ticks: {
          display: isChartExpanded.value,
          color: textMutedColor,
          callback: function(tickValue: any, index: number, ticks: any[]) {
            const value = Number(tickValue);
            const { max, median } = playerCountStats.value;
            
            // Always show 0, max, and median values
            if (value === 0 || value === max || value === median) {
              if (value === max) return `${value} (MAX)`;
              if (value === median) return `${value} (MED)`;
              return value.toString();
            }
            
            // Show other significant values
            const stepSize = Math.max(1, Math.floor(max / 5));
            if (value % stepSize === 0) {
              return value.toString();
            }
            
            return '';
          }
        }
      },
              x: {
          display: isChartExpanded.value,
          grid: {
            display: isChartExpanded.value,
            color: gridColor
          },
          title: {
            display: isChartExpanded.value,
            text: 'Time',
            color: textColor
          },
          ticks: {
            display: isChartExpanded.value,
            maxRotation: 45,
            minRotation: 45,
            color: textMutedColor,
            maxTicksLimit: isChartExpanded.value ? 8 : undefined,
            callback: function(tickValue: any, index: number) {
              if (!isChartExpanded.value) return '';
              const labels = chartData.value.labels;
              if (!labels || labels.length === 0) return '';
              
              // Show every nth label to reduce crowding
              const totalLabels = labels.length;
              const maxLabels = 8;
              const step = Math.ceil(totalLabels / maxLabels);
              
              if (index % step === 0 || index === totalLabels - 1) {
                // Extract just the date part for cleaner display
                const label = labels[index] as string;
                return label.split(' ')[0] + ' ' + label.split(' ')[1]; // "Dec 15"
              }
              return '';
            }
          }
        }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: isChartExpanded.value,
        backgroundColor: isDarkMode ? 'rgba(35, 21, 53, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: isDarkMode ? '#ffffff' : '#ffffff',
        bodyColor: isDarkMode ? '#ffffff' : '#ffffff',
        borderColor: isDarkMode ? '#805ad5' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        }
      }
    },
    elements: {
      point: {
        radius: isChartExpanded.value ? 0 : 0,
        hoverRadius: isChartExpanded.value ? 6 : 0
      }
    }
  };

  return baseOptions;
});



// Toggle chart expansion
const toggleChartExpansion = () => {
  isChartExpanded.value = !isChartExpanded.value;
};

// Toggle ping chart expansion
const togglePingChartExpansion = () => {
  isPingChartExpanded.value = !isPingChartExpanded.value;
};

// Toggle ping metric between median and p95
const togglePingMetric = () => {
  pingMetric.value = pingMetric.value === 'median' ? 'p95' : 'median';
};

// Toggle ping explainer collapse state
const togglePingExplainer = () => {
  isPingExplainerCollapsed.value = !isPingExplainerCollapsed.value;
};

// Toggle server insights collapse state
const toggleServerInsights = () => {
  isServerInsightsCollapsed.value = !isServerInsightsCollapsed.value;
};

// Chart data for ping by hour
const pingChartData = computed(() => {
  if (!serverInsights.value?.pingByHour?.data) return { labels: [], datasets: [] };

  const utcData = serverInsights.value.pingByHour.data;
  
  // Convert UTC hours to local timezone and re-group the data
  const localDataMap = new Map<number, { totalPing: number; count: number; p95Values: number[]; medianValues: number[] }>();
  
  utcData.forEach(item => {
    // Create a UTC date for the hour bucket (using a reference date)
    const utcDate = new Date();
    utcDate.setUTCHours(item.hour, 0, 0, 0);
    
    // Get the local hour for this UTC time
    const localHour = utcDate.getHours();
    
    // Group data by local hour
    if (!localDataMap.has(localHour)) {
      localDataMap.set(localHour, { 
        totalPing: 0, 
        count: 0, 
        p95Values: [], 
        medianValues: [] 
      });
    }
    
    const bucket = localDataMap.get(localHour)!;
    bucket.totalPing += item.averagePing;
    bucket.count += 1;
    bucket.p95Values.push(item.p95Ping);
    bucket.medianValues.push(item.medianPing);
  });
  
  // Create sorted array of local hours and their data
  const sortedLocalHours = Array.from(localDataMap.keys()).sort((a, b) => a - b);
  
  const labels = sortedLocalHours.map(hour => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      hour12: undefined // Let the locale decide 12/24 hour format
    });
  });

  // Calculate ping values for each local hour
  const pingValues = sortedLocalHours.map(hour => {
    const bucket = localDataMap.get(hour)!;
    
    if (pingMetric.value === 'median') {
      // For median, we take the average of median values if multiple UTC hours map to same local hour
      return bucket.medianValues.reduce((sum, val) => sum + val, 0) / bucket.medianValues.length;
    } else {
      // For P95, we take the average of P95 values if multiple UTC hours map to same local hour
      return bucket.p95Values.reduce((sum, val) => sum + val, 0) / bucket.p95Values.length;
    }
  });

  return {
    labels,
    datasets: [
      {
        label: `${pingMetric.value === 'median' ? 'Median' : 'P95'} Ping (ms)`,
        backgroundColor: 'rgba(156, 39, 176, 0.7)',
        borderColor: 'rgba(156, 39, 176, 1)',
        borderWidth: 1,
        data: pingValues
      }
    ]
  };
});

// Chart options for ping chart
const pingChartOptions = computed(() => {
  const computedStyles = window.getComputedStyle(document.documentElement);
  const textColor = computedStyles.getPropertyValue('--color-text').trim() || '#333333';
  const textMutedColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#666666';
  const isDarkMode = computedStyles.getPropertyValue('--color-background').trim().includes('26, 16, 37') || 
                    document.documentElement.classList.contains('dark-mode') ||
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        display: isPingChartExpanded.value,
        grid: {
          display: isPingChartExpanded.value,
          color: gridColor
        },
        title: {
          display: isPingChartExpanded.value,
          text: `${pingMetric.value === 'median' ? 'Median' : 'P95'} Ping (ms)`,
          color: textColor
        },
        ticks: {
          display: isPingChartExpanded.value,
          color: textMutedColor
        }
      },
      x: {
        display: isPingChartExpanded.value,
        grid: {
          display: isPingChartExpanded.value,
          color: gridColor
        },
        title: {
          display: isPingChartExpanded.value,
          text: 'Hour of Day',
          color: textColor
        },
        ticks: {
          display: isPingChartExpanded.value,
          color: textMutedColor
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: isPingChartExpanded.value,
        backgroundColor: isDarkMode ? 'rgba(35, 21, 53, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: isDarkMode ? '#9c27b0' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        callbacks: {
          title: function(context: any) {
            return `Hour: ${context[0].label}`;
          },
          label: function(context: any) {
            return `${pingMetric.value === 'median' ? 'Median' : 'P95'} Ping: ${context.parsed.y}ms`;
          }
        }
      }
    }
  };
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
  } catch (e) {
    return timezone;
  }
}

// Helper to get full country name from code
function getCountryName(code: string | undefined, fallback: string | undefined): string | undefined {
  if (!code) return fallback;
  const name = countryCodeToName[code.toUpperCase()];
  return name || fallback;
}

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

// Toggle time period between week and month
const toggleTimePeriod = (period: 'week' | 'month') => {
  selectedTimePeriod.value = period;
};

// Computed properties for current data based on selected time period
const currentMostActivePlayers = computed(() => {
  if (!serverDetails.value) return [];
  return selectedTimePeriod.value === 'week' 
    ? serverDetails.value.mostActivePlayersByTimeWeek 
    : serverDetails.value.mostActivePlayersByTimeMonth;
});

const currentTopScores = computed(() => {
  if (!serverDetails.value) return [];
  return selectedTimePeriod.value === 'week' 
    ? serverDetails.value.topScoresWeek 
    : serverDetails.value.topScoresMonth;
});
</script>

<template>
  <div class="server-details-container">
    <div class="server-details-header">
      <div class="server-name-container" style="flex-direction: column; align-items: flex-start;">
        <router-link to="/servers" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Servers
        </router-link>
        <h2>Server Details: {{ serverName }}</h2>
        <div v-if="serverDetails && (serverDetails.region || serverDetails.country || serverDetails.timezone)" class="server-region-badge">
          <span>
            <template v-if="serverDetails.region">{{ serverDetails.region }}</template>
            <template v-if="serverDetails.region && (serverDetails.country || serverDetails.countryCode)"> <span class="dot">•</span> </template>
            <template v-if="serverDetails.country || serverDetails.countryCode">{{ getCountryName(serverDetails.country, serverDetails.country) }}</template>
            <template v-if="(serverDetails.region || serverDetails.country || serverDetails.countryCode) && serverDetails.timezone"> <span class="dot">•</span> </template>
            <template v-if="serverDetails.timezone">
              <span v-if="getTimezoneDisplay(serverDetails.timezone)"> {{ getTimezoneDisplay(serverDetails.timezone) }}</span>
            </template>
          </span>
        </div>
      </div>
      <div class="modal-actions">
        <!-- Current Players Link -->
        <button
          v-if="liveServerInfo && liveServerInfo.players.length > 0"
          @click="openPlayersModal"
          class="current-players-link"
        >
          <div class="players-info">
            <span class="player-count">{{ liveServerInfo.numPlayers }} Online</span>
            <span v-if="liveServerInfo.mapName" class="current-map">Currently playing {{ liveServerInfo.mapName }}</span>
          </div>
        </button>
        <div v-else-if="liveServerInfo && liveServerInfo.players.length === 0" class="current-players-empty">
          <div class="players-info">
            <span class="player-count">0 Online</span>
            <span v-if="liveServerInfo.mapName" class="current-map">Currently playing {{ liveServerInfo.mapName }}</span>
          </div>
        </div>
        <div v-else-if="isLiveServerLoading" class="current-players-loading">
          <div class="loading-spinner small"></div>
          <span>Loading...</span>
        </div>
        
        <!-- Join Server Button -->
        <button
          v-if="liveServerInfo?.joinLink"
          @click="joinServer"
          class="join-server-button"
        >
          🎮 Join Server
        </button>
        
      </div>
    </div>
    <div class="server-details-body">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading server details...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
      </div>
      <div v-else-if="serverDetails" class="stats-container">
        <!-- Period information -->
        <div class="period-info">
          Data from {{ formatDate(serverDetails.startPeriod) }} to {{ formatDate(serverDetails.endPeriod) }}
        </div>

        <!-- Server Insights Section -->
        <div v-if="serverInsights?.pingByHour?.data && serverInsights.pingByHour.data.length > 0" class="stats-section">
          <div class="insights-header" @click="toggleServerInsights">
            <h3>📊 Server Insights</h3>
            <button class="collapse-toggle" :title="isServerInsightsCollapsed ? 'Show insights' : 'Hide insights'">
              {{ isServerInsightsCollapsed ? '▶' : '▼' }}
            </button>
          </div>
          <div class="insights-content" v-show="!isServerInsightsCollapsed">
            <div class="chart-header">
              <div class="insights-controls">
                <button
                  class="metric-toggle-button"
                  @click="togglePingMetric"
                  :title="`Switch to ${pingMetric === 'median' ? 'P95' : 'Median'} ping`"
                >
                  {{ pingMetric === 'median' ? 'Median' : 'P95' }}
                </button>
                <button
                  class="expand-chart-button"
                  @click="togglePingChartExpansion"
                  :title="isPingChartExpanded ? 'Collapse chart' : 'Expand chart'"
                >
                  {{ isPingChartExpanded ? '📉' : '📊' }}
                </button>
              </div>
            </div>
            <div class="ping-explainer" :class="{ 'collapsed': isPingExplainerCollapsed }">
              <div class="ping-explainer-header" @click="togglePingExplainer">
                <span class="ping-explainer-title">💡 How to interpret ping data</span>
                <button class="collapse-toggle" :title="isPingExplainerCollapsed ? 'Show explanation' : 'Hide explanation'">
                  {{ isPingExplainerCollapsed ? '▶' : '▼' }}
                </button>
              </div>
              <div class="ping-explainer-content" v-show="!isPingExplainerCollapsed">
                <p>Higher ping times typically indicate players connecting from outside the server's host country. Lower ping times suggest local players are online.</p>
                <p>If you're playing from outside the host country, look for hours with higher ping averages to find when players with similar connections are online for more balanced gameplay.</p>
              </div>
            </div>
            <div
              class="chart-container ping-chart-container"
              :class="{ 'chart-expanded': isPingChartExpanded }"
              @click="!isPingChartExpanded && togglePingChartExpansion()"
            >
              <Bar :data="pingChartData" :options="pingChartOptions" />
            </div>
          </div>
        </div>
        <div v-else-if="isInsightsLoading" class="insights-loading">
          <div class="loading-spinner small"></div>
          <p>Loading insights...</p>
        </div>
        <div v-else-if="insightsError" class="insights-error">
          <p class="error-message-small">{{ insightsError }}</p>
        </div>

        <!-- Player Count Chart -->
        <div v-if="serverDetails.playerCountMetrics && serverDetails.playerCountMetrics.length > 0" class="stats-section">
          <div class="chart-header">
            <h3>Player Activity</h3>
            <button
              class="expand-chart-button"
              @click="toggleChartExpansion"
              :title="isChartExpanded ? 'Collapse chart' : 'Expand chart'"
            >
              {{ isChartExpanded ? '📉' : '📊' }}
            </button>
          </div>
          <div class="chart-stats">
            <div class="stat-item">
              <span class="stat-label">Peak:</span>
              <span class="stat-value stat-max">{{ playerCountStats.max }} players</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Median:</span>
              <span class="stat-value stat-median">{{ playerCountStats.median }} players</span>
            </div>
            <div v-if="serverDetails.averagePlayerCountChangePercent && serverDetails.averagePlayerCountChangePercent !== 0" class="stat-item">
              <span class="stat-label">7-day change:</span>
              <span class="stat-value" :class="{ 
                'stat-positive': serverDetails.averagePlayerCountChangePercent > 0, 
                'stat-negative': serverDetails.averagePlayerCountChangePercent < 0 
              }">
                {{ serverDetails.averagePlayerCountChangePercent > 0 ? '+' : '' }}{{ serverDetails.averagePlayerCountChangePercent }}%
              </span>
            </div>
          </div>
                       <div
             class="chart-container"
             :class="{ 'chart-expanded': isChartExpanded }"
             @click="!isChartExpanded && toggleChartExpansion()"
           >
             <Line :data="chartData" :options="chartOptions" />
           </div>
        </div>

        <!-- Enhanced Leaderboards Container -->
        <div class="enhanced-leaderboards-container">
          <!-- Most Active Players -->
          <div class="enhanced-leaderboard-section">
            <div class="enhanced-section-header">
              <div class="section-title">
                <div class="section-icon">⚡</div>
                <h3>Most Active Warriors</h3>
              </div>
              <div class="section-time-controls">
                <button 
                  @click="toggleTimePeriod('week')"
                  class="enhanced-time-tab"
                  :class="{ 'active': selectedTimePeriod === 'week' }"
                >
                  7 Days
                </button>
                <button 
                  @click="toggleTimePeriod('month')"
                  class="enhanced-time-tab"
                  :class="{ 'active': selectedTimePeriod === 'month' }"
                >
                  30 Days
                </button>
              </div>
            </div>
            
            <!-- Top 3 Podium -->
            <div class="podium-container" v-if="currentMostActivePlayers.length >= 3">
              <div class="podium-player second-place">
                <div class="podium-rank">🥈</div>
                <div class="podium-info">
                  <router-link :to="`/players/${encodeURIComponent(currentMostActivePlayers[1].playerName)}`" class="podium-name">
                    {{ currentMostActivePlayers[1].playerName }}
                  </router-link>
                  <div class="podium-stats">
                    <div class="stat-badge primary">{{ formatPlayTime(currentMostActivePlayers[1].minutesPlayed) }}</div>
                    <div class="stat-badge secondary"><span class="kills">{{ currentMostActivePlayers[1].totalKills }}</span><span class="separator">/</span><span class="deaths">{{ currentMostActivePlayers[1].totalDeaths }}</span></div>
                  </div>
                </div>
              </div>
              
              <div class="podium-player first-place">
                <div class="podium-rank">🏆</div>
                <div class="podium-info">
                  <router-link :to="`/players/${encodeURIComponent(currentMostActivePlayers[0].playerName)}`" class="podium-name">
                    {{ currentMostActivePlayers[0].playerName }}
                  </router-link>
                  <div class="podium-stats">
                    <div class="stat-badge primary">{{ formatPlayTime(currentMostActivePlayers[0].minutesPlayed) }}</div>
                    <div class="stat-badge secondary"><span class="kills">{{ currentMostActivePlayers[0].totalKills }}</span><span class="separator">/</span><span class="deaths">{{ currentMostActivePlayers[0].totalDeaths }}</span></div>
                  </div>
                </div>
              </div>
              
              <div class="podium-player third-place">
                <div class="podium-rank">🥉</div>
                <div class="podium-info">
                  <router-link :to="`/players/${encodeURIComponent(currentMostActivePlayers[2].playerName)}`" class="podium-name">
                    {{ currentMostActivePlayers[2].playerName }}
                  </router-link>
                  <div class="podium-stats">
                    <div class="stat-badge primary">{{ formatPlayTime(currentMostActivePlayers[2].minutesPlayed) }}</div>
                    <div class="stat-badge secondary"><span class="kills">{{ currentMostActivePlayers[2].totalKills }}</span><span class="separator">/</span><span class="deaths">{{ currentMostActivePlayers[2].totalDeaths }}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Remaining Players -->
            <div class="remaining-players" v-if="currentMostActivePlayers.length > 3">
              <div v-for="(player, index) in currentMostActivePlayers.slice(3)" :key="index + 3" class="player-card">
                <div class="player-rank-small">{{ index + 4 }}</div>
                <div class="player-card-content">
                  <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-card-name">
                    {{ player.playerName }}
                  </router-link>
                  <div class="player-card-stats">
                    <span class="stat-item">{{ formatPlayTime(player.minutesPlayed) }}</span>
                    <span class="stat-separator">•</span>
                    <span class="stat-item">
                      <span class="kills">{{ player.totalKills }}</span>/<span class="deaths">{{ player.totalDeaths }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Scores -->
          <div class="enhanced-leaderboard-section">
            <div class="enhanced-section-header">
              <div class="section-title">
                <div class="section-icon">🎯</div>
                <h3>Legendary Performances</h3>
              </div>
              <div class="section-controls">
                <div class="section-time-controls">
                  <button 
                    @click="toggleTimePeriod('week')"
                    class="enhanced-time-tab"
                    :class="{ 'active': selectedTimePeriod === 'week' }"
                  >
                    7 Days
                  </button>
                  <button 
                    @click="toggleTimePeriod('month')"
                    class="enhanced-time-tab"
                    :class="{ 'active': selectedTimePeriod === 'month' }"
                  >
                    30 Days
                  </button>
                </div>
                <router-link 
                  :to="`/servers/${encodeURIComponent(serverName)}/rankings`" 
                  class="view-all-button"
                >
                  View Rankings
                </router-link>
              </div>
            </div>
            
            <!-- Top 3 Podium -->
            <div class="podium-container scores-podium" v-if="currentTopScores.length >= 3">
              <div class="podium-player second-place">
                <div class="podium-rank">🥈</div>
                <div class="podium-info">
                  <router-link :to="`/players/${encodeURIComponent(currentTopScores[1].playerName)}`" class="podium-name">
                    {{ currentTopScores[1].playerName }}
                  </router-link>
                  <div class="podium-stats">
                    <div class="stat-badge primary">{{ currentTopScores[1].score.toLocaleString() }}</div>
                    <div class="stat-badge secondary"><span class="kills">{{ currentTopScores[1].kills }}</span><span class="separator">/</span><span class="deaths">{{ currentTopScores[1].deaths }}</span></div>
                    <div class="stat-badge tertiary">{{ currentTopScores[1].mapName }}</div>
                    <div class="stat-badge quaternary">{{ formatDate(currentTopScores[1].timestamp) }}</div>
                  </div>
                </div>
              </div>
              
              <div class="podium-player first-place">
                <div class="podium-rank">🏆</div>
                <div class="podium-info">
                  <router-link :to="`/players/${encodeURIComponent(currentTopScores[0].playerName)}`" class="podium-name">
                    {{ currentTopScores[0].playerName }}
                  </router-link>
                  <div class="podium-stats">
                    <div class="stat-badge primary">{{ currentTopScores[0].score.toLocaleString() }}</div>
                    <div class="stat-badge secondary"><span class="kills">{{ currentTopScores[0].kills }}</span><span class="separator">/</span><span class="deaths">{{ currentTopScores[0].deaths }}</span></div>
                    <div class="stat-badge tertiary">{{ currentTopScores[0].mapName }}</div>
                    <div class="stat-badge quaternary">{{ formatDate(currentTopScores[0].timestamp) }}</div>
                  </div>
                </div>
              </div>
              
              <div class="podium-player third-place">
                <div class="podium-rank">🥉</div>
                <div class="podium-info">
                  <router-link :to="`/players/${encodeURIComponent(currentTopScores[2].playerName)}`" class="podium-name">
                    {{ currentTopScores[2].playerName }}
                  </router-link>
                  <div class="podium-stats">
                    <div class="stat-badge primary">{{ currentTopScores[2].score.toLocaleString() }}</div>
                    <div class="stat-badge secondary"><span class="kills">{{ currentTopScores[2].kills }}</span><span class="separator">/</span><span class="deaths">{{ currentTopScores[2].deaths }}</span></div>
                    <div class="stat-badge tertiary">{{ currentTopScores[2].mapName }}</div>
                    <div class="stat-badge quaternary">{{ formatDate(currentTopScores[2].timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Remaining Scores -->
            <div class="remaining-players" v-if="currentTopScores.length > 3">
              <div v-for="(score, index) in currentTopScores.slice(3)" :key="index + 3" class="player-card">
                <div class="player-rank-small">{{ index + 4 }}</div>
                <div class="player-card-content">
                  <router-link :to="`/players/${encodeURIComponent(score.playerName)}`" class="player-card-name">
                    {{ score.playerName }}
                  </router-link>
                  <div class="player-card-stats">
                    <router-link
                      :to="{
                        path: '/servers/round-report',
                        query: {
                          serverGuid: serverDetails.serverGuid,
                          mapName: score.mapName,
                          startTime: score.timestamp,
                          players: score.playerName
                        }
                      }"
                      class="stat-item score-link"
                    >
                      {{ score.score.toLocaleString() }}
                    </router-link>
                    <span class="stat-separator">•</span>
                    <span class="stat-item">
                      <span class="kills">{{ score.kills }}</span>/<span class="deaths">{{ score.deaths }}</span>
                    </span>
                    <span class="stat-separator">•</span>
                    <span class="stat-item">{{ score.mapName }}</span>
                    <span class="stat-separator">•</span>
                    <span class="stat-item">{{ formatDate(score.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Rounds -->
          <div v-if="serverDetails.lastRounds && serverDetails.lastRounds.length > 0" class="enhanced-leaderboard-section recent-rounds-section">
            <div class="enhanced-section-header">
              <div class="section-title">
                <div class="section-icon">🎮</div>
                <h3>Recent Battles</h3>
              </div>
              <router-link 
                :to="{ path: '/rounds', query: { server: serverName } }" 
                class="view-all-button"
              >
                View all
              </router-link>
            </div>
            
            <div class="rounds-grid">
              <div v-for="(round, index) in serverDetails.lastRounds" :key="index" class="round-card">
                <div class="round-status">
                  <span v-if="round.isActive && index === 0" class="badge-live">🔴 LIVE</span>
                  <span v-else class="round-date">{{ formatDate(round.endTime) }}</span>
                </div>
                <div class="round-map-name">{{ round.mapName }}</div>
                <router-link
                  :to="{
                    path: '/servers/round-report',
                    query: {
                      serverGuid: serverDetails.serverGuid,
                      mapName: round.mapName,
                      startTime: round.startTime
                    }
                  }"
                  class="round-report-button"
                >
                  Battle Report
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data-container">
        <p>No server details available.</p>
      </div>
    </div>
    
    <!-- Players Modal -->
    <PlayersModal 
      :show="showPlayersModal" 
      :server="liveServerInfo" 
      @close="closePlayersModal" 
    />
  </div>
</template>

<style scoped>
.server-details-container {
  background-color: var(--color-background);
  border-radius: 0;
  box-shadow: none;
  padding: 12px;
}

.server-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;
}

.server-name-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
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
}

.back-button:hover {
  background-color: var(--color-primary);
  color: white;
}

.server-details-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}


.current-players-link {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.current-players-link:hover {
  background-color: var(--color-primary-hover);
}

.current-players-empty {
  padding: 8px 16px;
  background-color: var(--color-background-mute);
  color: var(--color-text-muted);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--color-border);
}

.players-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.player-count {
  font-weight: 600;
  font-size: 14px;
}

.current-map {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.9;
  text-align: center;
}

.current-players-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--color-background-soft);
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-size: 14px;
  color: var(--color-text-muted);
}

.join-server-button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.join-server-button:hover {
  background-color: #45a049;
}


.server-details-body {
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

.period-info {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.stats-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 12px;
}

.stats-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: none;
  padding-bottom: 0;
}

.expand-chart-button {
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  color: var(--color-text);
}

.expand-chart-button:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
}

.insights-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.metric-toggle-button {
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  color: var(--color-text);
  min-width: 70px;
}

.metric-toggle-button:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
}

.ping-explainer {
  margin-bottom: 15px;
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(156, 39, 176, 0.03) 100%);
  border-radius: 8px;
  border: 1px solid rgba(156, 39, 176, 0.2);
  transition: all 0.3s ease;
}

.ping-explainer.collapsed {
  background: linear-gradient(135deg, var(--color-background-mute) 0%, rgba(156, 39, 176, 0.02) 100%);
}

.ping-explainer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ping-explainer-header:hover {
  background: rgba(156, 39, 176, 0.05);
  border-radius: 8px;
}

.ping-explainer-title {
  font-weight: 600;
  color: var(--color-heading);
  font-size: 0.95rem;
}

.collapse-toggle {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-toggle:hover {
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}

.ping-explainer-content {
  padding: 0 12px 12px 12px;
  transition: all 0.3s ease;
}

.ping-explainer-content p {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--color-text);
}

.ping-explainer-content p:last-child {
  margin-bottom: 0;
}

.ping-explainer-content strong {
  color: var(--color-heading);
}

.ping-chart-container {
  height: 80px;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
}

.ping-chart-container:hover:not(.chart-expanded) {
  border-color: #9c27b0;
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.2);
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(156, 39, 176, 0.05) 100%);
}

.ping-chart-container.chart-expanded {
  height: 400px;
  border-color: #9c27b0;
  box-shadow: 0 8px 25px rgba(156, 39, 176, 0.3);
}

.insights-loading, .insights-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--color-background-soft);
  border-radius: 8px;
  margin-bottom: 12px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  margin-bottom: 0;
}

.error-message-small {
  color: #ff5252;
  font-size: 0.9rem;
  margin: 0;
}

.chart-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 8px 12px;
  background: var(--color-background-mute);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  font-size: 0.95rem;
}

.stat-max {
  color: #4caf50;
}

.stat-median {
  color: var(--color-primary);
}

.stat-positive {
  color: #4caf50;
  font-weight: 600;
}

.stat-negative {
  color: #f44336;
  font-weight: 600;
}

.chart-container {
  height: 80px;
  margin-bottom: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
}

.chart-container:hover:not(.chart-expanded) {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 100%);
}

.chart-container.chart-expanded {
  height: 400px;
  cursor: default;
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  background: var(--color-background);
}

/* Enhanced Leaderboards Container */
.enhanced-leaderboards-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
}

/* Enhanced Leaderboard Section */
.enhanced-leaderboard-section {
  background: linear-gradient(135deg, var(--color-background-soft) 0%, var(--color-background) 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.enhanced-leaderboard-section:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.enhanced-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.section-title h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.4rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-time-controls {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.enhanced-time-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
  text-align: center;
}

.enhanced-time-tab:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.enhanced-time-tab.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

.view-all-button {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.view-all-button:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

/* Podium Container */
.podium-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 0%, rgba(156, 39, 176, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.1);
}

.podium-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  min-width: 140px;
  position: relative;
  overflow: hidden;
}

.podium-player::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
}

.podium-player:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.first-place {
  order: 2;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  border-color: #ffd700;
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
}

.first-place .podium-name {
  color: #333 !important;
}

.first-place .podium-avatar {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
}

.second-place {
  order: 1;
  background: linear-gradient(135deg, #c0c0c0 0%, #e6e6e6 100%);
  color: #333;
  border-color: #c0c0c0;
  box-shadow: 0 6px 18px rgba(192, 192, 192, 0.3);
}

.second-place .podium-name {
  color: #333 !important;
}

.second-place .podium-avatar {
  background: linear-gradient(135deg, #607d8b 0%, #78909c 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(96, 125, 139, 0.4);
}

.third-place {
  order: 3;
  background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
  color: #333;
  border-color: #cd7f32;
  box-shadow: 0 6px 18px rgba(205, 127, 50, 0.3);
}

.third-place .podium-name {
  color: #333 !important;
}

.third-place .podium-avatar {
  background: linear-gradient(135deg, #8d6e63 0%, #a1887f 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(141, 110, 99, 0.4);
}

.podium-rank {
  font-size: 2rem;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.podium-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

.podium-avatar.champion {
  width: 56px;
  height: 56px;
  font-size: 1.4rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.podium-info {
  text-align: center;
  width: 100%;
}

.podium-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  margin-bottom: 8px;
  display: block;
  word-break: break-word;
}

.podium-name:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.podium-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.stat-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-badge.primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  color: white;
}

.stat-badge.secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.stat-badge.tertiary {
  background: var(--color-background-soft);
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

/* Remaining Players */
.remaining-players {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.player-card:hover {
  background: var(--color-background-soft);
  border-color: var(--color-primary);
  transform: translateX(4px);
}

.player-rank-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--color-background-mute);
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
}

.player-card-content {
  flex: 1;
  min-width: 0;
}

.player-card-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  display: block;
  margin-bottom: 4px;
}

.player-card-name:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.player-card-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  flex-wrap: wrap;
}

.score-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.score-link:hover {
  text-decoration: underline;
}

/* Recent Rounds */
.recent-rounds-section {
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(76, 175, 80, 0.05) 100%);
  border-color: rgba(76, 175, 80, 0.2);
}

.rounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.round-card {
  background: var(--color-background);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.round-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary) 0%, #9c27b0 100%);
}

.round-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.round-status {
  margin-bottom: 8px;
}

.badge-live {
  background: linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.round-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.round-map-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.round-report-button {
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-block;
}

.round-report-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}


/* Base mobile improvements */
.server-details-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Enhanced Mobile Responsive Design */

/* Tablet styles */
@media (max-width: 1024px) {
  .enhanced-leaderboards-container {
    gap: 16px;
  }
  
  .enhanced-leaderboard-section {
    padding: 16px;
  }
  
  .server-details-container {
    padding: 8px;
  }
  
  .podium-container {
    padding: 16px;
    gap: 12px;
  }
  
  .podium-player {
    min-width: 120px;
    padding: 12px;
  }
  
  .section-title h3 {
    font-size: 1.3rem;
  }
  
  .rounds-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .server-details-container {
    padding: 4px;
  }
  
  .enhanced-leaderboard-section {
    padding: 12px;
    border-radius: 12px;
  }
  
  .enhanced-section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .section-controls {
    justify-content: space-between;
    width: 100%;
  }
  
  .podium-container {
    flex-direction: column;
    align-items: center;
    padding: 12px;
    gap: 8px;
  }
  
  .podium-player {
    order: unset !important;
    min-width: 100%;
    max-width: 280px;
    flex-direction: row;
    text-align: left;
    padding: 12px;
  }
  
  .podium-info {
    text-align: left;
    flex: 1;
    margin-left: 12px;
  }
  
  .podium-stats {
    flex-direction: row;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .stat-badge {
    flex: 1;
    min-width: fit-content;
  }
  
  .rounds-grid {
    grid-template-columns: 1fr;
  }
  
  .section-time-controls {
    flex: 1;
  }
  
  .enhanced-time-tab {
    flex: 1;
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .server-details-container {
    padding: 4px;
  }
  
  .enhanced-leaderboards-container {
    gap: 12px;
  }
  
  .enhanced-leaderboard-section {
    padding: 8px;
  }
  
  .section-title h3 {
    font-size: 1.1rem;
  }
  
  .section-icon {
    font-size: 1.2rem;
  }
  
  .podium-container {
    padding: 8px;
  }
  
  .podium-player {
    padding: 8px;
  }
  
  .podium-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .podium-avatar.champion {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }
  
  .podium-rank {
    font-size: 1.5rem;
    margin-bottom: 4px;
  }
  
  .stat-badge {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .player-card {
    padding: 8px;
  }
  
  .player-rank-small {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .round-card {
    padding: 12px;
  }
  
  .view-all-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .server-details-container {
    padding: 2px;
  }

  .server-details-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    padding: 8px 0;
    margin-bottom: 8px;
  }

  .server-name-container {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .server-name-container h2 {
    font-size: 1.1rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .modal-actions {
    width: 100%;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
  }

  .current-players-link,
  .current-players-empty,
  .current-players-loading {
    width: 100%;
    text-align: center;
  }

  .current-players-loading {
    justify-content: center;
  }

  .players-info {
    width: 100%;
  }

  .current-map {
    font-size: 10px;
  }

  .join-server-button {
    width: 100%;
    text-align: center;
    padding: 10px 16px;
  }

  .back-button {
    width: fit-content;
    padding: 8px 12px;
  }

  .enhanced-leaderboards-container {
    gap: 8px;
  }

  .enhanced-leaderboard-section {
    padding: 6px;
  }

  .section-title h3 {
    font-size: 1rem;
  }

  .section-icon {
    font-size: 1rem;
  }

  .chart-container {
    height: 60px;
    margin: 0;
  }

  .chart-container.chart-expanded {
    height: 280px;
  }

  .ping-chart-container.chart-expanded {
    height: 280px;
  }

  .expand-chart-button {
    padding: 6px 10px;
    font-size: 1rem;
  }

  .metric-toggle-button {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-width: 60px;
  }

  .insights-controls {
    gap: 6px;
  }

  .chart-stats {
    gap: 15px;
    padding: 6px 10px;
    margin-bottom: 10px;
  }

  .stat-label, .stat-value {
    font-size: 0.85rem;
  }

  .period-info {
    font-size: 0.85rem;
    text-align: center;
    padding: 6px;
    margin: 0 0 8px 0;
    background: var(--color-background-soft);
    border-radius: 6px;
  }

  .ping-explainer {
    margin-bottom: 10px;
  }

  .ping-explainer-header {
    padding: 8px;
  }

  .ping-explainer-title {
    font-size: 0.9rem;
  }

  .collapse-toggle {
    font-size: 0.75rem;
    min-width: 18px;
  }

  .ping-explainer-content {
    padding: 0 8px 8px 8px;
  }

  .ping-explainer-content p {
    font-size: 0.85rem;
    line-height: 1.3;
  }

  .stats-container {
    gap: 8px;
  }

  .stats-section {
    padding: 8px 0;
    margin: 0;
  }
}

/* Enhanced Design Utility Styles */
.kills {
  color: #4caf50;
  font-weight: 600;
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

.stat-separator {
  color: var(--color-text-muted);
  font-weight: normal;
  opacity: 0.6;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.badge-active {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  background-color: #4caf50;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  vertical-align: middle;
  line-height: 1;
}

.server-region-badge {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 14px;
  margin-bottom: 0;
  padding: 0;
  width: auto;
}

.server-region-badge > span {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(90deg, #7b2ff2 0%, #f357a8 100%);
  color: #fff;
  border-radius: 7px;
  padding: 3px 10px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(123,47,242,0.10);
  letter-spacing: 0.01em;
  min-height: 22px;
  min-width: 50px;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}

.server-region-badge .dot {
  font-size: 1.2em;
  margin: 0 8px;
  color: #fff;
  opacity: 0.7;
}

@media (max-width: 600px) {
  .server-region-badge {
    margin-top: 10px;
    margin-bottom: 0;
    justify-content: flex-start;
  }
  .server-region-badge > span {
    font-size: 0.8rem;
    padding: 2px 7px;
    min-height: 18px;
    min-width: 36px;
  }
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 8px;
  border-radius: 6px;
}

.insights-header:hover {
  background: rgba(156, 39, 176, 0.05);
}

.insights-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: none;
  padding-bottom: 0;
}

.insights-content {
  transition: all 0.3s ease;
}

@media (max-width: 600px) {
  .rank-number {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }

  .rank-medal {
    font-size: 1.1rem;
  }

  .leaderboard-header h3 {
    font-size: 1.1rem;
    margin: 0;
  }

  .chart-container {
    height: 60px;
    margin: 0;
  }

  .chart-container.chart-expanded {
    height: 280px;
  }

  .ping-chart-container.chart-expanded {
    height: 280px;
  }

  .expand-chart-button {
    padding: 6px 10px;
    font-size: 1rem;
  }

  .metric-toggle-button {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-width: 60px;
  }

  .insights-controls {
    gap: 6px;
  }

  .chart-stats {
    gap: 15px;
    padding: 6px 10px;
    margin-bottom: 10px;
  }

  .stat-label, .stat-value {
    font-size: 0.85rem;
  }

  .period-info {
    font-size: 0.85rem;
    text-align: center;
    padding: 6px;
    margin: 0 0 8px 0;
    background: var(--color-background-soft);
    border-radius: 6px;
  }

  .ping-explainer {
    margin-bottom: 10px;
  }

  .ping-explainer-header {
    padding: 8px;
  }

  .ping-explainer-title {
    font-size: 0.9rem;
  }

  .collapse-toggle {
    font-size: 0.75rem;
    min-width: 18px;
  }

  .ping-explainer-content {
    padding: 0 8px 8px 8px;
  }

  .ping-explainer-content p {
    font-size: 0.85rem;
    line-height: 1.3;
  }

  .stats-container {
    gap: 8px;
  }

  .stats-section {
    padding: 8px 0;
    margin: 0;
  }

  .time-period-tabs {
    margin-bottom: 15px;
    padding: 3px;
  }

  .time-period-tab {
    padding: 8px 12px;
    font-size: 13px;
  }

  /* Mobile specific details styling */
  .player-details, .score-details, .round-details {
    font-size: 0.8rem;
    margin-top: 6px;
    line-height: 1.3;
  }

  .detail-item {
    white-space: nowrap;
  }

  .badge-active {
    margin-left: 0;
    font-size: 0.6rem;
    padding: 1px 4px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .server-details-container {
    padding: 4px;
  }

  .server-details-header {
    gap: 6px;
    padding: 6px 0;
    margin-bottom: 6px;
  }

  .server-name-container h2 {
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .back-button {
    padding: 6px 10px;
    font-size: 0.9rem;
  }


  .leaderboard-section {
    padding: 6px 0;
  }

  .leaderboard-header {
    margin-bottom: 6px;
    padding: 0 0 6px 0;
  }

  .leaderboard-header h3 {
    font-size: 1rem;
  }

  .players-header, .scores-header, .rounds-header {
    padding: 6px 8px;
    font-size: 0.7rem;
  }



  .player-row, .score-row, .round-row {
    padding: 10px 8px;
    font-size: 0.85rem;
  }



  .rank-number {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .rank-medal {
    font-size: 0.95rem;
  }

  .player-details, .score-details, .round-details {
    font-size: 0.75rem;
    margin-top: 4px;
    gap: 3px;
  }

  .detail-item {
    font-size: 0.75rem;
  }

  .chart-container {
    height: 50px;
    margin: 0;
  }

  .chart-container.chart-expanded {
    height: 250px;
  }

  .ping-chart-container.chart-expanded {
    height: 250px;
  }

  .expand-chart-button {
    padding: 5px 8px;
    font-size: 0.9rem;
  }

  .metric-toggle-button {
    padding: 5px 8px;
    font-size: 0.8rem;
    min-width: 55px;
  }

  .chart-stats {
    gap: 12px;
    padding: 5px 8px;
    margin-bottom: 8px;
    flex-direction: column;
  }

  .stat-item {
    justify-content: space-between;
  }

  .stat-label, .stat-value {
    font-size: 0.8rem;
  }

  .period-info {
    margin: 0 0 6px 0;
    padding: 4px;
  }

  .ping-explainer {
    margin-bottom: 8px;
  }

  .ping-explainer-header {
    padding: 6px;
  }

  .ping-explainer-title {
    font-size: 0.85rem;
  }

  .collapse-toggle {
    font-size: 0.7rem;
    min-width: 16px;
  }

  .ping-explainer-content {
    padding: 0 6px 6px 6px;
  }

  .ping-explainer-content p {
    font-size: 0.8rem;
    line-height: 1.25;
    margin: 0 0 6px 0;
  }

  .stats-container {
    gap: 6px;
  }

  .stats-section {
    padding: 6px 0;
  }

  .time-period-tabs {
    margin-bottom: 12px;
    padding: 2px;
  }

  .time-period-tab {
    padding: 6px 10px;
    font-size: 12px;
  }

  .badge-active {
    padding: 1px 3px;
    font-size: 0.55rem;
  }

  .report-link-inline {
    font-size: 0.75rem;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .server-details-container {
    padding: 2px;
  }

  .server-details-header {
    padding: 4px 0;
  }

  .server-name-container h2 {
    font-size: 1.1rem;
  }





  .rank-number {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }

  .rank-medal {
    font-size: 0.85rem;
  }

  .player-details, .score-details, .round-details {
    font-size: 0.7rem;
    gap: 2px;
  }

  .detail-item {
    font-size: 0.7rem;
  }

  .stats-container {
  }

  .period-info {
    margin: 0 0 4px 0;
  }

  .badge-active {
    padding: 1px 2px;
    font-size: 0.5rem;
  }

  .report-link-inline {
    font-size: 0.7rem;
  }
}

/* Players Header */
.players-header, .scores-header, .rounds-header {
  display: grid;
  padding: 12px 15px;
  background: var(--color-background-mute);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}

.player-playtime, .score-value, .score-map {
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
}

/* Round row styling */
.round-end-time {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: center;
}

.round-report {
  text-align: center;
}

.score-value {
  font-weight: 600;
  color: var(--color-primary);
}

/* K/D Styling */
.player-kd, .score-kd {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.9rem;
}

.kills {
  color: #4caf50;
  font-weight: 600;
}

.separator {
  color: var(--color-text-muted);
  font-weight: 400;
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

/* Link styles */
.player-link, .report-link {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-link:hover, .report-link:hover {
  text-decoration: underline;
  color: var(--color-primary-hover, var(--color-primary));
}

.report-link {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--color-background-mute);
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.report-link:hover {
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge-active {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  background-color: #4caf50;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  vertical-align: middle;
  line-height: 1;
}

.server-region-badge {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 14px;
  margin-bottom: 0;
  padding: 0;
  width: auto;
}
.server-region-badge > span {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(90deg, #7b2ff2 0%, #f357a8 100%);
  color: #fff;
  border-radius: 7px;
  padding: 3px 10px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(123,47,242,0.10);
  letter-spacing: 0.01em;
  min-height: 22px;
  min-width: 50px;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}
.server-region-badge .dot {
  font-size: 1.2em;
  margin: 0 8px;
  color: #fff;
  opacity: 0.7;
}
@media (max-width: 600px) {
  .server-region-badge {
    margin-top: 10px;
    margin-bottom: 0;
    justify-content: flex-start;
  }
  .server-region-badge > span {
    font-size: 0.8rem;
    padding: 2px 7px;
    min-height: 18px;
    min-width: 36px;
  }
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 8px;
  border-radius: 6px;
}

.insights-header:hover {
  background: rgba(156, 39, 176, 0.05);
}

.insights-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.2rem;
  border-bottom: none;
  padding-bottom: 0;
}

.insights-content {
  transition: all 0.3s ease;
}

/* Kill/Death styling */
.kills {
  color: #4caf50;
  font-weight: 600;
}

.separator {
  color: var(--color-text-muted);
}

.deaths {
  color: #f44336;
  font-weight: 600;
}
</style>
