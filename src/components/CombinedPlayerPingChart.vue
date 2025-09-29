<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';
import type { ServerInsights } from '../services/serverDetailsService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps<{
  serverInsights: ServerInsights | null;
  pingMetric: 'median' | 'p95';
}>();

// Computed property for chart key to force re-rendering
const chartKey = computed(() => {
  if (!props.serverInsights?.playerCountHistory) return 'no-data';
  const dataLength = props.serverInsights.playerCountHistory.length;
  const startPeriod = props.serverInsights.startPeriod;
  const endPeriod = props.serverInsights.endPeriod;
  const pingMetric = props.pingMetric;
  return `chart-${dataLength}-${startPeriod}-${endPeriod}-${pingMetric}`;
});

// Chart data computation
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
  const currentPeriodData = insights.playerCountHistory.map(metric => metric.playerCount);
  const comparisonPeriodData = insights.playerCountHistoryComparison?.map(metric => metric.playerCount) || [];

  // Calculate ping data for line chart
  let pingData: (number | null)[] = [];
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

      return props.pingMetric === 'median' ? pingInfo.medianPing : pingInfo.p95Ping;
    });
  }

  // Prepare embedded bar data - smaller values embedded in larger ones
  const embeddedCurrentData: number[] = [];
  const embeddedComparisonData: number[] = [];

  currentPeriodData.forEach((current, index) => {
    const comparison = comparisonPeriodData[index] || 0;

    if (current >= comparison) {
      // Current is larger, show full current bar and embedded comparison
      embeddedCurrentData.push(current);
      embeddedComparisonData.push(comparison);
    } else {
      // Comparison is larger, show full comparison bar and embedded current
      embeddedCurrentData.push(current);
      embeddedComparisonData.push(comparison);
    }
  });

  const datasets: any[] = [];

  // Add comparison period bars (rendered first, can be overlapped)
  if (comparisonPeriodData.length > 0) {
    datasets.push({
      label: 'Previous Period',
      type: 'bar',
      backgroundColor: 'rgba(156, 39, 176, 0.6)',
      borderColor: 'rgba(156, 39, 176, 0.8)',
      borderWidth: 1,
      data: embeddedComparisonData,
      yAxisID: 'y',
      order: 2, // Lower priority (rendered first)
      barPercentage: 0.8,
      categoryPercentage: 0.9,
    });
  }

  // Add current period bars (rendered second, overlaps comparison when smaller)
  datasets.push({
    label: 'Current Period',
    type: 'bar',
    backgroundColor: 'rgba(33, 150, 243, 0.7)',
    borderColor: 'rgba(33, 150, 243, 0.9)',
    borderWidth: 1,
    data: embeddedCurrentData,
    yAxisID: 'y',
    order: 1, // Higher priority (rendered second)
    barPercentage: 0.6, // Slightly smaller to create embedded effect
    categoryPercentage: 0.9,
  });

  // Add ping line chart if data is available
  if (pingData.length > 0 && pingData.some(p => p !== null)) {
    datasets.push({
      label: `${props.pingMetric === 'median' ? 'Median' : 'P95'} Ping`,
      type: 'line',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      borderColor: 'rgba(255, 193, 7, 0.8)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointBackgroundColor: 'rgba(255, 193, 7, 1)',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      data: pingData,
      yAxisID: 'y1', // Secondary y-axis for ping
      order: 0, // Highest priority (rendered on top)
      spanGaps: false,
    });
  }

  return {
    labels,
    datasets
  };
});

// Calculate max values for both metrics
const maxValues = computed(() => {
  if (!props.serverInsights?.playerCountHistory) {
    return { maxPlayers: 0, maxPing: 0 };
  }

  const playerData = props.serverInsights.playerCountHistory.map(m => m.playerCount);
  const comparisonData = props.serverInsights.playerCountHistoryComparison?.map(m => m.playerCount) || [];
  const allPlayerCounts = [...playerData, ...comparisonData];
  const maxPlayers = Math.max(...allPlayerCounts);

  let maxPing = 0;
  if (props.serverInsights.pingByHour?.data) {
    const pingValues = props.serverInsights.pingByHour.data.map(p =>
      props.pingMetric === 'median' ? p.medianPing : p.p95Ping
    );
    maxPing = Math.max(...pingValues);
  }

  return { maxPlayers, maxPing };
});

// Chart options
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

  return {
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
      x: {
        display: true,
        grid: {
          display: true,
          color: gridColor
        },
        title: {
          display: true,
          text: 'Time',
          color: textColor
        },
        ticks: {
          display: true,
          maxRotation: 45,
          minRotation: 45,
          color: textMutedColor,
          maxTicksLimit: 8,
          callback: function(_tickValue: any, index: number) {
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
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        suggestedMax: Math.max(maxValues.value.maxPlayers * 1.1, maxValues.value.maxPlayers + 5),
        grid: {
          display: true,
          color: gridColor
        },
        title: {
          display: true,
          text: 'Player Count',
          color: textColor
        },
        ticks: {
          display: true,
          color: textMutedColor,
          callback: function(tickValue: any) {
            return Number(tickValue).toString();
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: maxValues.value.maxPing > 0,
        position: 'right' as const,
        beginAtZero: true,
        suggestedMax: Math.max(maxValues.value.maxPing * 1.1, maxValues.value.maxPing + 10),
        grid: {
          display: false, // Don't show grid for secondary axis
        },
        title: {
          display: maxValues.value.maxPing > 0,
          text: 'Ping (ms)',
          color: textColor
        },
        ticks: {
          display: maxValues.value.maxPing > 0,
          color: textMutedColor,
          callback: function(tickValue: any) {
            return Number(tickValue) + 'ms';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          color: textColor,
          font: {
            size: 12,
            weight: 'normal' as const
          },
          filter: function() {
            // Show all datasets in legend
            return true;
          }
        }
      },
      tooltip: {
        enabled: true,
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
          label: function(context: TooltipItem<any>) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;

            if (datasetLabel.includes('Ping')) {
              return `${datasetLabel}: ${Math.round(value)}ms`;
            } else {
              return `${datasetLabel}: ${Math.round(value)} players`;
            }
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6
      }
    }
  };
});

</script>

<template>
  <Bar
    :key="chartKey"
    :data="chartData"
    :options="chartOptions"
  />
</template>