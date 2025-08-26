<script setup lang="ts">
import { ref, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import type { ServerInsights } from '../services/serverDetailsService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{
  serverInsights: ServerInsights | null;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  'period-change': [period: string];
}>();

const isChartExpanded = ref(false);
const pingMetric = ref<'median' | 'p95'>('median');
const isPingExplainerCollapsed = ref(true);
const selectedPeriod = ref('7d');

// Period options for the filter
const periodOptions = [
  { value: '7d', label: '7 Days' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' }
];

// Chart data for player count with ping background zones
const chartData = computed(() => {
  const insights = props.serverInsights;
  if (!insights?.playerCountHistory) return { labels: [], datasets: [] };

  // Convert timestamps to readable dates
  const labels = insights.playerCountHistory.map(metric => {
    const date = new Date(metric.timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  });

  // Get player count values
  const playerData = insights.playerCountHistory.map(metric => metric.playerCount);

  // Calculate ping data for background zones and tooltips
  let pingData = null;
  if (insights.pingByHour?.data) {
    // Create a map of timestamps to ping data for efficient lookup
    const pingDataMap = new Map<string, { medianPing: number; p95Ping: number }>();
    
    insights.pingByHour.data.forEach(pingItem => {
      // Use the timePeriod as the key to match with playerCountHistory timestamps
      const timestamp = new Date(pingItem.timePeriod).toISOString().substring(0, 13) + ':00:00.000Z';
      pingDataMap.set(timestamp, {
        medianPing: pingItem.medianPing,
        p95Ping: pingItem.p95Ping
      });
    });
    
    // Map ping data to match playerCountHistory timeline
    pingData = insights.playerCountHistory.map(metric => {
      const timestamp = new Date(metric.timestamp).toISOString().substring(0, 13) + ':00:00.000Z';
      const pingInfo = pingDataMap.get(timestamp);
      
      if (!pingInfo) {
        return null; // No ping data for this timestamp
      }
      
      return pingMetric.value === 'median' ? pingInfo.medianPing : pingInfo.p95Ping;
    });
  }

  const datasets: any[] = [];

  // Add ping background zones if ping data is available
  if (pingData) {
    // Calculate ping thresholds for color zones
    const validPings = pingData.filter(p => p !== null) as number[];
    if (validPings.length > 0) {
      const minPing = Math.min(...validPings);
      const maxPing = Math.max(...validPings);
      const pingRange = maxPing - minPing;
      
      // Create thresholds: low (green), medium (yellow), high (red)
      const lowThreshold = minPing + (pingRange * 0.33);
      const highThreshold = minPing + (pingRange * 0.67);
      
      // Get the max player count for background zones
      const maxPlayerCount = Math.max(...playerData);
      const backgroundHeight = maxPlayerCount * 1.1;
      
      // Create background zones data
      const backgroundZoneData = labels.map((_, index) => backgroundHeight);
      const lowPingZoneData = labels.map((_, index) => {
        const ping = pingData[index];
        return ping !== null && ping <= lowThreshold ? backgroundHeight : null;
      });
      const mediumPingZoneData = labels.map((_, index) => {
        const ping = pingData[index];
        return ping !== null && ping > lowThreshold && ping <= highThreshold ? backgroundHeight : null;
      });
      const highPingZoneData = labels.map((_, index) => {
        const ping = pingData[index];
        return ping !== null && ping > highThreshold ? backgroundHeight : null;
      });

      // Only add background zone datasets that have actual data points
      const hasLowPingData = lowPingZoneData.some(d => d !== null);
      const hasMediumPingData = mediumPingZoneData.some(d => d !== null);
      const hasHighPingData = highPingZoneData.some(d => d !== null);

      // Add background zone datasets in a specific order to ensure correct legend mapping
      // Add them in reverse order so they appear correctly in the legend
      if (hasHighPingData) {
        datasets.push({
          label: 'High Ping Zone',
          backgroundColor: 'rgba(244, 67, 54, 0.15)', // Red for high ping
          borderColor: 'rgba(244, 67, 54, 0.8)', // Red border for legend
          borderWidth: 0,
          fill: true,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          data: highPingZoneData,
          yAxisID: 'y',
          order: 1,
          spanGaps: false
        });
      }
      
      if (hasMediumPingData) {
        datasets.push({
          label: 'Medium Ping Zone',
          backgroundColor: 'rgba(255, 152, 0, 0.15)', // Orange for medium ping
          borderColor: 'rgba(255, 152, 0, 0.8)', // Orange border for legend
          borderWidth: 0,
          fill: true,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          data: mediumPingZoneData,
          yAxisID: 'y',
          order: 2,
          spanGaps: false
        });
      }
      
      if (hasLowPingData) {
        datasets.push({
          label: 'Low Ping Zone',
          backgroundColor: 'rgba(76, 175, 80, 0.15)', // Green for low ping
          borderColor: 'rgba(76, 175, 80, 0.8)', // Green border for legend
          borderWidth: 0,
          fill: true,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          data: lowPingZoneData,
          yAxisID: 'y',
          order: 3,
          spanGaps: false
        });
      }
    }
  }

  // Add the main player count line (drawn on top)
  datasets.push({
    label: 'Player Count',
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderColor: 'rgba(33, 150, 243, 0.8)',
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 6,
    pointBackgroundColor: 'rgba(33, 150, 243, 1)',
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
    data: playerData,
    yAxisID: 'y',
    order: 0, // Highest priority - drawn on top
    pingData: pingData // Store ping data for tooltips
  });

  return {
    labels,
    datasets
  };
});

// Calculate max and median values for player count
const playerCountStats = computed(() => {
  if (!props.serverInsights?.playerCountSummary) {
    return { max: 0, median: 0 };
  }

  const summary = props.serverInsights.playerCountSummary;
  return { 
    max: summary.peakPlayerCount, 
    median: Math.round(summary.averagePlayerCount) 
  };
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
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: isChartExpanded.value,
        position: 'left' as const,
        beginAtZero: true,
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
        display: false // Disabled - background zones make legend unnecessary
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
        },
        callbacks: {
          label: function(context: any) {
            const datasetLabel = context.dataset.label || '';
            
            // Handle ping zone datasets differently
            if (datasetLabel.includes('Ping Zone')) {
              return datasetLabel; // Just return the zone name, no value
            }
            
            // Handle player count dataset
            if (datasetLabel === 'Player Count') {
              let label = 'Player Count: ' + Math.round(context.parsed.y) + ' players';
              
              // Add ping info if available
              if (context.dataset.pingData) {
                const pingValue = context.dataset.pingData[context.dataIndex];
                if (pingValue !== null && pingValue !== undefined) {
                  label += ` (${pingMetric.value === 'median' ? 'Median' : 'P95'} Ping: ${Math.round(pingValue)}ms)`;
                }
              }
              
              return label;
            }
            
            return datasetLabel;
          }
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


// Toggle ping metric between median and p95
const togglePingMetric = () => {
  pingMetric.value = pingMetric.value === 'median' ? 'p95' : 'median';
};

// Toggle ping explainer collapse state
const togglePingExplainer = () => {
  isPingExplainerCollapsed.value = !isPingExplainerCollapsed.value;
};

// Handle period change
const handlePeriodChange = (period: string) => {
  selectedPeriod.value = period;
  emit('period-change', period);
};
</script>

<template>
  <div
    v-if="serverInsights?.playerCountHistory && serverInsights.playerCountHistory.length > 0"
    class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
  >
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    <div class="relative z-10 space-y-6">
      <!-- Header with Period Controls -->
      <div class="p-8 pb-4 space-y-6">
        <!-- Title and Controls -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="space-y-2">
            <h4 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {{ serverInsights?.pingByHour?.data?.length > 0 ? '📈 Player Activity & Connection Analysis' : '📈 Player Activity Analysis' }}
            </h4>
            <p class="text-slate-400 text-sm">
              Real-time server population trends{{ serverInsights?.pingByHour?.data?.length > 0 ? ' with connection quality zones' : '' }}
            </p>
          </div>
          
          <!-- Action Controls -->
          <div class="flex items-center gap-3 flex-wrap">
            <!-- Ping Metric Toggle -->
            <button
              v-if="serverInsights?.pingByHour?.data?.length > 0"
              class="group/metric inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 bg-slate-700/50 hover:bg-cyan-500/20 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 rounded-lg transition-all duration-300"
              :title="`Switch to ${pingMetric === 'median' ? 'P95' : 'Median'} ping`"
              @click="togglePingMetric"
            >
              <span class="text-xs">📡</span>
              <span>{{ pingMetric === 'median' ? 'Median' : 'P95' }} Ping</span>
            </button>
            
            <!-- Expand Chart Button -->
            <button
              class="group/expand inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-slate-700/50 hover:bg-blue-500/20 backdrop-blur-sm border border-slate-600/50 hover:border-blue-500/50 rounded-lg transition-all duration-300 transform hover:scale-105"
              :title="isChartExpanded ? 'Collapse chart' : 'Expand chart for detailed view'"
              @click="toggleChartExpansion"
            >
              <span class="text-lg transition-transform duration-300" :class="isChartExpanded ? 'rotate-180' : 'group-hover/expand:scale-110'">{{ isChartExpanded ? '📉' : '📊' }}</span>
              <span>{{ isChartExpanded ? 'Collapse' : 'Expand' }}</span>
            </button>
          </div>
        </div>
        
        <!-- Period Selection Filters -->
        <div class="flex flex-wrap gap-2">
          <div class="text-sm text-slate-400 flex items-center gap-2 mr-4">
            <span class="text-xs">⏰</span>
            <span>Time Range:</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in periodOptions"
              :key="option.value"
              class="group/period relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg border backdrop-blur-sm"
              :class="{
                'text-white bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400/50 shadow-lg shadow-cyan-500/25': selectedPeriod === option.value,
                'text-slate-400 bg-slate-700/30 border-slate-600/50 hover:text-cyan-400 hover:bg-slate-600/50 hover:border-cyan-500/50': selectedPeriod !== option.value
              }"
              :title="`Show data for ${option.label.toLowerCase()}`"
              :disabled="props.isLoading"
              @click="handlePeriodChange(option.value)"
            >
              <div
                v-if="selectedPeriod === option.value && props.isLoading"
                class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              <span :class="{ 'opacity-80': selectedPeriod === option.value && props.isLoading }">{{ option.label }}</span>
              <div v-if="selectedPeriod === option.value" class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg animate-pulse"></div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Stats Cards -->
      <div class="px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Peak Players Card -->
          <div class="group/stat relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl border border-green-500/30 hover:border-green-400/50 transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
            <div class="relative z-10 p-4 space-y-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl">
                  🔥
                </div>
                <div>
                  <p class="text-green-400 text-sm font-medium">Peak Players</p>
                  <p class="text-2xl font-bold text-white">{{ playerCountStats.max }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Average Players Card -->
          <div class="group/stat relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-600/10 backdrop-blur-sm rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
            <div class="relative z-10 p-4 space-y-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-xl">
                  📊
                </div>
                <div>
                  <p class="text-blue-400 text-sm font-medium">Median Players</p>
                  <p class="text-2xl font-bold text-white">{{ playerCountStats.median }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Trend Card -->
          <div
            v-if="serverInsights?.playerCountSummary?.changePercentFromPreviousPeriod && serverInsights.playerCountSummary.changePercentFromPreviousPeriod !== 0"
            class="group/stat relative overflow-hidden backdrop-blur-sm rounded-xl border transition-all duration-300"
            :class="{
              'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 hover:border-green-400/50': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0,
              'bg-gradient-to-br from-red-500/10 to-rose-600/10 border-red-500/30 hover:border-red-400/50': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0
            }"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-current/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
            <div class="relative z-10 p-4 space-y-2">
              <div class="flex items-center gap-3">
                <div 
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  :class="{
                    'bg-gradient-to-br from-green-500 to-emerald-600': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0,
                    'bg-gradient-to-br from-red-500 to-rose-600': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0
                  }"
                >
                  {{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0 ? '📈' : '📉' }}
                </div>
                <div>
                  <p 
                    class="text-sm font-medium"
                    :class="{
                      'text-green-400': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0,
                      'text-red-400': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0
                    }"
                  >
                    Period Change
                  </p>
                  <p 
                    class="text-2xl font-bold"
                    :class="{
                      'text-green-300': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0,
                      'text-red-300': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0
                    }"
                  >
                    {{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0 ? '+' : '' }}{{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod }}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Chart Container -->
      <div class="px-8 pb-6">
        <div
          class="relative overflow-hidden rounded-xl border transition-all duration-500"
          :class="{
            'h-20 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/50 cursor-pointer hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/25': !isChartExpanded,
            'h-96 bg-slate-800/30 border-cyan-500/50 shadow-xl shadow-cyan-500/20': isChartExpanded
          }"
          @click="!isChartExpanded && toggleChartExpansion()"
        >
          <!-- Chart Overlay for Collapsed State -->
          <div 
            v-if="!isChartExpanded" 
            class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-10"
          >
            <div class="flex items-center gap-3 text-cyan-400 font-medium">
              <span class="text-2xl animate-pulse">📊</span>
              <span>Click to expand chart</span>
            </div>
          </div>
          
          <Line
            :data="chartData"
            :options="chartOptions"
          />
        </div>
      </div>
      
      <!-- Connection Quality Info -->
      <div
        v-if="serverInsights?.pingByHour?.data && serverInsights.pingByHour.data.length > 0"
        class="mx-8 mb-8"
      >
        <div 
          class="relative overflow-hidden bg-gradient-to-r from-purple-500/10 to-indigo-600/10 backdrop-blur-sm rounded-xl border transition-all duration-300"
          :class="isPingExplainerCollapsed ? 'border-purple-500/30 hover:border-purple-400/50' : 'border-purple-400/50'"
        >
          <!-- Collapsible Header -->
          <button
            class="w-full p-4 text-left hover:bg-purple-500/5 transition-colors duration-300 flex items-center justify-between"
            @click="togglePingExplainer"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">💡</span>
              <div>
                <p class="text-purple-400 font-semibold">Connection Quality Guide</p>
                <p class="text-slate-400 text-sm">Learn how to interpret ping zones</p>
              </div>
            </div>
            <div 
              class="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center transition-transform duration-300"
              :class="isPingExplainerCollapsed ? '' : 'rotate-180'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-400">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>
          
          <!-- Expandable Content -->
          <div 
            v-show="!isPingExplainerCollapsed"
            class="px-4 pb-4 space-y-3 border-t border-purple-500/20"
          >
            <div class="mt-4 space-y-4">
              <!-- Color Legend -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <p class="text-green-400 font-medium text-sm">Low Ping Zone</p>
                    <p class="text-slate-400 text-xs">Optimal connection</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <div>
                    <p class="text-orange-400 font-medium text-sm">Medium Ping Zone</p>
                    <p class="text-slate-400 text-xs">Moderate latency</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div class="w-4 h-4 bg-red-500 rounded-full"></div>
                  <div>
                    <p class="text-red-400 font-medium text-sm">High Ping Zone</p>
                    <p class="text-slate-400 text-xs">Higher latency</p>
                  </div>
                </div>
              </div>
              
              <!-- Usage Tips -->
              <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                <p class="text-slate-300 text-sm leading-relaxed">
                  <strong class="text-purple-400">Pro Tip:</strong> If you're playing from outside the host country, look for orange/red zones to find when players with similar connections are online for more balanced gameplay. Expand the chart and hover over data points to see exact ping values.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

/* Override default line chart styles for better integration */
:deep(.chart-container canvas) {
  border-radius: 0.75rem;
}
</style> 