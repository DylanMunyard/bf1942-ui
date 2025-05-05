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
  chartData: PrometheusDataPoint[];
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

// Define timezones for each region (same as in TimeDisplay.vue)
const timezones = {
  france: 'Europe/Paris',
  usEast: 'America/New_York',
  usWest: 'America/Los_Angeles'
};

// Format timestamp to readable date/time
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

// Format timestamp for a specific timezone
const formatTimestampForTimezone = (timestamp: number, timezone: string, locale: string = 'en-US'): string => {
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  }).format(date);
};

// Prepare data for Chart.js
const chartData = computed(() => {
  return {
    labels: props.chartData.map(point => formatTimestamp(point.timestamp)),
    datasets: [
      {
        label: `Player Count for ${props.serverName}`,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
        borderWidth: 2,
        pointBackgroundColor: '#4CAF50',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4CAF50',
        data: props.chartData.map(point => point.value)
      }
    ]
  };
});

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (tooltipItems) => {
          return tooltipItems[0].label;
        },
        label: (context) => {
          return `Players: ${context.raw}`;
        },
        afterLabel: (context) => {
          // Get the timestamp from the original data
          const timestamp = props.chartData[context.dataIndex].timestamp;

          // Format the timestamp for each timezone
          const franceTime = formatTimestampForTimezone(timestamp, timezones.france, 'fr-FR');
          const usEastTime = formatTimestampForTimezone(timestamp, timezones.usEast);
          const usWestTime = formatTimestampForTimezone(timestamp, timezones.usWest);

          // Return formatted times with emoji flags
          return [
            `🇫🇷 ${franceTime}`,
            `🇺🇸 East ${usEastTime}`,
            `🇺🇸 West ${usWestTime}`
          ];
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
        display: false,
        text: 'Time'
      },
      ticks: {
        display: false
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
</script>

<template>
  <div v-if="isOpen" class="detailed-chart-popup-overlay">
    <div class="detailed-chart-popup-content">
      <div class="detailed-chart-header">
        <h2>Player Count History</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      <div class="detailed-chart-body">
        <div class="chart-container">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <div class="chart-info">
          <p><strong>Server:</strong> {{ serverName }}</p>
          <p><strong>Time Range:</strong> Last 24 hours</p>
          <p v-if="chartData.datasets[0].data.length > 0">
            <strong>Current Players:</strong> {{ chartData.datasets[0].data[chartData.datasets[0].data.length - 1] }}
          </p>
          <p v-if="chartData.datasets[0].data.length > 0">
            <strong>Max Players:</strong> {{ Math.max(...chartData.datasets[0].data) }}
          </p>
          <p v-if="chartData.datasets[0].data.length > 0">
            <strong>Min Players:</strong> {{ Math.min(...chartData.datasets[0].data) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detailed-chart-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.detailed-chart-popup-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 80%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: auto;
  padding: 0;
  animation: popup-fade-in 0.3s ease-out;
}

@keyframes popup-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detailed-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.detailed-chart-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.close-button:hover {
  color: #000;
}

.detailed-chart-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chart-container {
  height: 400px;
  margin-bottom: 20px;
}

.chart-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
}

.chart-info p {
  margin: 0;
  flex: 1 0 calc(33.333% - 20px);
  min-width: 200px;
}

@media (max-width: 768px) {
  .detailed-chart-popup-content {
    width: 95%;
  }

  .chart-container {
    height: 300px;
  }

  .chart-info p {
    flex: 1 0 100%;
  }
}
</style>
