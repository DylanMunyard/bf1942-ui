<script setup lang="ts">
import { onMounted, watch, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PrometheusDataPoint {
  timestamp: number;
  value: number;
}

interface Props {
  serverName: string;
  serverIp?: string;
  chartData: PrometheusDataPoint[];
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);


// Helper function to get day of week with date in format "Monday (dd/mm)"
const getDayWithDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${day} (${dd}/${mm})`;
};

// Group data points by day
const groupDataByDay = (data: PrometheusDataPoint[]) => {
  const groupedData: Record<string, PrometheusDataPoint[]> = {};

  data.forEach(point => {
    const dayKey = getDayWithDate(point.timestamp);
    if (!groupedData[dayKey]) {
      groupedData[dayKey] = [];
    }
    groupedData[dayKey].push(point);
  });

  return groupedData;
};

// Generate a color for each day
const getColorForDay = (index: number) => {
  const colors = [
    { bg: 'rgba(76, 175, 80, 0.2)', border: '#4CAF50' },    // Green
    { bg: 'rgba(33, 150, 243, 0.2)', border: '#2196F3' },   // Blue
    { bg: 'rgba(255, 152, 0, 0.2)', border: '#FF9800' },    // Orange
    { bg: 'rgba(156, 39, 176, 0.2)', border: '#9C27B0' },   // Purple
    { bg: 'rgba(244, 67, 54, 0.2)', border: '#F44336' },    // Red
    { bg: 'rgba(0, 188, 212, 0.2)', border: '#00BCD4' },    // Cyan
    { bg: 'rgba(255, 0, 128, 0.2)', border: '#FF0080' }     // Pink (changed from Deep Orange for better distinction)
  ];

  return colors[index % colors.length];
};

// Prepare data for Chart.js
const chartData = computed(() => {
  // Group data by day
  const groupedData = groupDataByDay(props.chartData);

  // Create a normalized 24-hour time scale (hourly intervals)
  const normalizedHours = Array.from({ length: 24 }, (_, i) => i);
  const hourLabels = normalizedHours.map(hour => 
    `${hour.toString().padStart(2, '0')}:00`
  );

  // Create datasets for each day
  const datasets = Object.entries(groupedData)
    .sort(([dayKeyA], [dayKeyB]) => {
      // Extract day names from the keys (format is "DayName (dd/mm)")
      const dayNameA = dayKeyA.split(' ')[0];
      const dayNameB = dayKeyB.split(' ')[0];

      // Define the priority order: Friday, Saturday, Sunday, then alphabetical
      const dayPriority = {
        'Friday': 1,
        'Saturday': 2,
        'Sunday': 3
      };

      // Get priority for each day (default to 10 for other days)
      const priorityA = dayPriority[dayNameA] || 10;
      const priorityB = dayPriority[dayNameB] || 10;

      // If both days have the same priority (both are weekdays or both are in our priority list)
      if (priorityA === priorityB) {
        // For days with the same priority, sort alphabetically
        return dayNameA.localeCompare(dayNameB);
      }

      // Otherwise, sort by priority
      return priorityA - priorityB;
    })
    .map(([dayKey, points], index) => {
      const color = getColorForDay(index);

    // Group points by hour of day
    const hourToValue = new Map();
    points.forEach(point => {
      const date = new Date(point.timestamp * 1000);
      const hour = date.getHours();
      // If multiple points exist for the same hour, use the latest one
      hourToValue.set(hour, point.value);
    });

    // Create data array with null for missing hours
    const data = normalizedHours.map(hour => 
      hourToValue.has(hour) ? hourToValue.get(hour) : null
    );

    return {
      label: dayKey,
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color.border,
      data,
      spanGaps: true // Connect points even if there are gaps (null values)
    };
  });

  return {
    labels: hourLabels,
    datasets
  };
});

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      onClick: (_e: any, _legendItem: any, _legend: any) => {
        // Get the index of the clicked dataset
        const index = _legendItem.datasetIndex;

        // Check if the clicked dataset is the only visible one
        const isOnlyVisibleDataset = _legend.chart.data.datasets.every((_dataset: any, i: number) =>
          i === index ? _legend.chart.getDatasetMeta(i).hidden === false : _legend.chart.getDatasetMeta(i).hidden === true
        );

        if (isOnlyVisibleDataset) {
          // If it's the only visible dataset, show all datasets (unselect)
          _legend.chart.data.datasets.forEach((_dataset: any, i: number) => {
            _legend.chart.setDatasetVisibility(i, true);
          });
        } else {
          // Otherwise, hide all datasets and show only the clicked one (select)
          _legend.chart.data.datasets.forEach((_dataset: any, i: number) => {
            _legend.chart.setDatasetVisibility(i, false);
          });
          _legend.chart.setDatasetVisibility(index, true);
        }

        // Update the chart
        _legend.chart.update();
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (tooltipItems: any) => {
          // Get the hour from the label (format is "HH:00")
          const label = tooltipItems[0].label;
          const hour = parseInt(label.split(':')[0]);

          // Create a date object for today with the specified hour (UTC)
          const date = new Date();
          date.setUTCHours(hour, 0, 0, 0);

          // Format the time in user's local timezone
          const localTime = new Intl.DateTimeFormat(navigator.language, {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          }).format(date);

          // The base time is AEST (UTC+10)
          // Calculate times for different timezones relative to AEST
          let franceHour = (hour - 8) % 24; // France is UTC+2, AEST is UTC+10, so -8 hours
          if (franceHour < 0) franceHour += 24;

          let usEastHour = (hour - 14) % 24; // US East is UTC-4, AEST is UTC+10, so -14 hours
          if (usEastHour < 0) usEastHour += 24;

          let usWestHour = (hour - 17) % 24; // US West is UTC-7, AEST is UTC+10, so -17 hours
          if (usWestHour < 0) usWestHour += 24;

          // Format hours with leading zeros and add timezone information
          const aestTime = `${hour.toString().padStart(2, '0')}:00`;
          const franceTime = `${franceHour.toString().padStart(2, '0')}:00`;
          const usEastTime = `${usEastHour.toString().padStart(2, '0')}:00`;
          const usWestTime = `${usWestHour.toString().padStart(2, '0')}:00`;

          // Return timezone information including user's local time
          return `🏠 ${localTime} | 🇦🇺 ${aestTime} | 🇫🇷 ${franceTime} | 🇺🇸E ${usEastTime} | 🇺🇸W ${usWestTime}`;
        },
        label: (context: any) => {
          return `${context.dataset.label}: ${context.raw}`;
        },
        afterLabel: () => {
          // No additional information needed as timezone info is now in the title
          return [];
        }
      }
    },
    title: {
      display: true,
      text: `Player Count History for ${props.serverName}`,
      font: {
        size: 16
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time (Local Hours)'
      },
      ticks: {
        display: true,
        callback: function(value: any, index: any) {
          // Only show every 3 hours to avoid overcrowding
          if (index % 3 !== 0) return null;

          // Check if value is a string before attempting to split
          const hour = typeof value === 'string' ? parseInt(value.split(':')[0]) : index;

          // Create a date object for today with the specified hour (UTC)
          const date = new Date();
          date.setUTCHours(hour, 0, 0, 0);

          // Format the time in user's local timezone (hours only)
          return new Intl.DateTimeFormat(navigator.language, {
            hour: '2-digit',
            hour12: false
          }).format(date);
        },
        font: {
          size: 9
        },
        maxRotation: 0,
        autoSkip: false,
        padding: 10
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Player Count'
      },
      ticks: {
        precision: 0
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
};

// Close the popup when clicking outside or pressing ESC
const handleOutsideClick = (event: MouseEvent) => {
  const popup = document.querySelector('.detailed-chart-popup-content');
  if (popup && !popup.contains(event.target as Node)) {
    emit('close');
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

// Add and remove event listeners
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
  } else {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleKeyDown);
  }
});

// Clean up event listeners when component is unmounted
onMounted(() => {
  if (props.isOpen) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
  }
});

// Helper functions for chart info section
const getCurrentPlayers = () => {
  // Get the most recent data point from the most recent day's dataset
  if (chartData.value.datasets.length === 0) return 0;

  // Find the most recent dataset (the one with the latest day)
  const latestDataset = chartData.value.datasets[chartData.value.datasets.length - 1];

  // Get the last non-null value from this dataset
  for (let i = latestDataset.data.length - 1; i >= 0; i--) {
    if (latestDataset.data[i] !== null) {
      return latestDataset.data[i];
    }
  }

  return 0;
};

const getMaxPlayers = () => {
  // Find the maximum player count across all datasets
  if (chartData.value.datasets.length === 0) return 0;

  let max = 0;
  chartData.value.datasets.forEach(dataset => {
    const datasetMax = Math.max(...dataset.data.filter(value => value !== null).map(value => value || 0));
    if (datasetMax > max) max = datasetMax;
  });

  return max;
};

const getMinPlayers = () => {
  // Find the minimum player count across all datasets
  if (chartData.value.datasets.length === 0) return 0;

  let min = Infinity;
  chartData.value.datasets.forEach(dataset => {
    const nonNullValues = dataset.data.filter(value => value !== null);
    if (nonNullValues.length > 0) {
      const datasetMin = Math.min(...nonNullValues.map(value => value || 0));
      if (datasetMin < min) min = datasetMin;
    }
  });

  return min === Infinity ? 0 : min;
};
</script>

<template>
  <div
    v-if="isOpen"
    class="detailed-chart-popup-overlay"
  >
    <div class="detailed-chart-popup-content">
      <div class="detailed-chart-header">
        <h2>Player Count History</h2>
        <button
          class="close-button"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>
      <div class="detailed-chart-body">
        <div class="chart-container">
          <Line
            :data="chartData"
            :options="chartOptions"
          />
          <div class="timezone-legend">
            <span><strong>Timezone Legend:</strong></span>
            <span>🏠 Local Time ({{ new Intl.DateTimeFormat().resolvedOptions().timeZone }})</span>
            <span>🇦🇺 AEST (UTC+10)</span>
            <span>🇫🇷 France (UTC+2)</span>
            <span>🇺🇸E US East (UTC-4)</span>
            <span>🇺🇸W US West (UTC-7)</span>
          </div>
        </div>
        <div class="chart-info">
          <p><strong>Server:</strong> {{ serverName }}</p>
          <p v-if="serverIp">
            <strong>IP:</strong> {{ serverIp }}
          </p>
          <p><strong>Time Range:</strong> Last 7 days</p>
          <p v-if="chartData.datasets.length > 0">
            <strong>Current Players:</strong> {{ getCurrentPlayers() }}
          </p>
          <p v-if="chartData.datasets.length > 0">
            <strong>Max Players:</strong> {{ getMaxPlayers() }}
          </p>
          <p v-if="chartData.datasets.length > 0">
            <strong>Min Players:</strong> {{ getMinPlayers() }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./DetailedChartPopup.vue.css"></style>
