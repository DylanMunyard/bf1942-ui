<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import DetailedChartPopup from './DetailedChartPopup.vue';
import { fetchServerPlayerData } from '../services/prometheusService';

interface PrometheusDataPoint {
  timestamp: number;
  value: number;
}

interface Props {
  serverName: string;
}

const props = defineProps<Props>();
const chartData = ref<PrometheusDataPoint[]>([]);
const fullChartData = ref<PrometheusDataPoint[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showDetailedChart = ref(false);

// Compute min and max values for y-axis labels
const maxValue = computed(() => {
  if (chartData.value.length === 0) return 0;
  return Math.max(...chartData.value.map(p => p.value));
});

const minValue = computed(() => {
  if (chartData.value.length === 0) return 0;
  return Math.min(...chartData.value.map(p => p.value));
});

// Pre-compute the polyline points for better performance
const polylinePoints = computed(() => {
  if (chartData.value.length === 0) return '';
  const max = maxValue.value;
  if (max === 0) return '';

  return chartData.value
    .map((point, index) => {
      const x = (index / (chartData.value.length - 1)) * 100;
      const y = 30 - (point.value / max * 30);
      return `${x},${y}`;
    })
    .join(' ');
});

const fetchPrometheusData = async () => {
  if (!props.serverName) return;

  loading.value = true;
  error.value = null;

  try {
    // Use the prometheusService to fetch data for the chart
    const data = await fetchServerPlayerData(props.serverName);
    chartData.value = data;
    fullChartData.value = data;
  } catch (err) {
    console.error('Error fetching Prometheus data:', err);
    error.value = 'Failed to fetch chart data';
  } finally {
    loading.value = false;
  }
};

// Fetch data when component is mounted or when serverName changes
onMounted(fetchPrometheusData);
watch(() => props.serverName, fetchPrometheusData);
</script>

<template>
  <div
    v-if="!error"
    class="line-chart-container"
  >
    <div
      v-if="loading"
      class="chart-loading"
    >
      Loading...
    </div>
    <div
      v-else-if="chartData.length === 0"
      class="chart-no-data"
    >
      No data
    </div>
    <div
      v-else
      class="chart"
      @click="showDetailedChart = true"
    >
      <!-- SVG line chart with min/max labels -->
      <svg
        width="100"
        height="30"
        viewBox="0 0 100 30"
        class="clickable-chart"
      >
        <!-- Chart line -->
        <polyline
          :points="polylinePoints"
          fill="none"
          stroke="#4CAF50"
          stroke-width="2"
        />

        <!-- Min/Max labels with semi-transparent backgrounds -->
        <rect
          x="0"
          y="20"
          width="15"
          height="12"
          fill="white"
          opacity="0.7"
        />
        <rect
          x="0"
          y="1"
          width="15"
          height="12"
          fill="white"
          opacity="0.7"
        />
        <text
          x="2"
          y="28"
          class="axis-label min-label"
        >{{ Math.round(minValue) }}</text>
        <text
          x="2"
          y="9"
          class="axis-label max-label"
        >{{ Math.round(maxValue) }}</text>
      </svg>
    </div>

    <!-- Detailed Chart Popup -->
    <DetailedChartPopup 
      :server-name="props.serverName"
      :chart-data="fullChartData.length > 0 ? fullChartData : chartData"
      :is-open="showDetailedChart"
      @close="showDetailedChart = false"
    />
  </div>
</template>

<style scoped>
.line-chart-container {
  display: inline-block;
  width: 100px;
  height: 30px;
  margin-left: 10px;
  vertical-align: middle;
}

.chart-loading, .chart-no-data {
  font-size: 10px;
  color: #666;
  text-align: center;
  line-height: 30px;
}

.chart {
  width: 100%;
  height: 100%;
}

.axis-label {
  font-size: 7px;
  fill: #666;
  font-family: Arial, sans-serif;
}

.clickable-chart {
  cursor: pointer;
  will-change: transform;
  transition: transform 0.2s ease;
}

.chart:hover .clickable-chart {
  transform: scale(1.05);
}

.chart {
  position: relative;
}

.chart::after {
  content: "🔍";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
  pointer-events: none;
  will-change: opacity;
}

.chart:hover::after {
  opacity: 0.8;
}
</style>
