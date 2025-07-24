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

// Chart data for player count with ping overlay
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

  const datasets: any[] = [
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
      data: playerData,
      yAxisID: 'y'
    }
  ];

  // Add ping data if available
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
    const pingData = insights.playerCountHistory.map(metric => {
      const timestamp = new Date(metric.timestamp).toISOString().substring(0, 13) + ':00:00.000Z';
      const pingInfo = pingDataMap.get(timestamp);
      
      if (!pingInfo) {
        return null; // No ping data for this timestamp
      }
      
      return pingMetric.value === 'median' ? pingInfo.medianPing : pingInfo.p95Ping;
    });

    datasets.push({
      label: `${pingMetric.value === 'median' ? 'Median' : 'P95'} Ping (ms)`,
      backgroundColor: 'rgba(156, 39, 176, 0.0)',
      borderColor: 'rgba(156, 39, 176, 0.8)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointBackgroundColor: 'rgba(156, 39, 176, 1)',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1,
      data: pingData,
      yAxisID: 'y1',
      spanGaps: true // This will connect across null values
    });
  }

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
      y1: {
        type: 'linear' as const,
        display: isChartExpanded.value && !!props.serverInsights?.pingByHour?.data,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: isChartExpanded.value,
          text: `${pingMetric.value === 'median' ? 'Median' : 'P95'} Ping (ms)`,
          color: 'rgba(156, 39, 176, 0.8)'
        },
        ticks: {
          display: isChartExpanded.value,
          color: 'rgba(156, 39, 176, 0.8)'
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
  <div v-if="serverInsights?.playerCountHistory && serverInsights.playerCountHistory.length > 0" class="stats-section">
    <div class="chart-header">
      <h3>Player Activity {{ serverInsights?.pingByHour?.data?.length > 0 ? '& Connection Quality' : '' }}</h3>
      <div class="chart-controls">
        <div class="period-filters">
          <button
            v-for="option in periodOptions"
            :key="option.value"
            class="period-filter-button"
            :class="{ 'active': selectedPeriod === option.value, 'loading': selectedPeriod === option.value && props.isLoading }"
            @click="handlePeriodChange(option.value)"
            :title="`Show data for ${option.label.toLowerCase()}`"
            :disabled="props.isLoading"
          >
            <div v-if="selectedPeriod === option.value && props.isLoading" class="button-spinner"></div>
            <span :class="{ 'loading-text': selectedPeriod === option.value && props.isLoading }">{{ option.label }}</span>
          </button>
        </div>
        <button
          v-if="serverInsights?.pingByHour?.data?.length > 0"
          class="metric-toggle-button"
          @click="togglePingMetric"
          :title="`Switch to ${pingMetric === 'median' ? 'P95' : 'Median'} ping`"
        >
          {{ pingMetric === 'median' ? 'Median' : 'P95' }} Ping
        </button>
        <button
          class="expand-chart-button"
          @click="toggleChartExpansion"
          :title="isChartExpanded ? 'Collapse chart' : 'Expand chart'"
        >
          {{ isChartExpanded ? '📉' : '📊' }}
        </button>
      </div>
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
      <div v-if="serverInsights?.playerCountSummary?.changePercentFromPreviousPeriod && serverInsights.playerCountSummary.changePercentFromPreviousPeriod !== 0" class="stat-item">
        <span class="stat-label">Period change:</span>
        <span class="stat-value" :class="{ 
          'stat-positive': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0, 
          'stat-negative': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0 
        }">
          {{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0 ? '+' : '' }}{{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod }}%
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
    
    <!-- Ping Data Explanation -->
    <div v-if="serverInsights?.pingByHour?.data && serverInsights.pingByHour.data.length > 0" class="ping-explainer" :class="{ 'collapsed': isPingExplainerCollapsed }">
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
  </div>
</template>

<style scoped>
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

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.period-filters {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.period-filter-button {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  color: var(--color-text-muted);
  min-width: 50px;
  white-space: nowrap;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.period-filter-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.period-filter-button:disabled:not(.active) {
  opacity: 0.4;
}

.period-filter-button:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.period-filter-button.active {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

.period-filter-button.active:hover {
  background: var(--color-primary-hover);
}

.button-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.loading-text {
  opacity: 0.8;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
</style> 