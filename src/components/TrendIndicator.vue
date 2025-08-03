<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { fetchServerPlayerData } from '../services/prometheusService';

interface Props {
  serverName: string;
}

const props = defineProps<Props>();
const loading = ref(false);
const error = ref<string | null>(null);
const trendData = ref<{ difference: number, trend: 'up' | 'down' | 'stable' }>({ difference: 0, trend: 'stable' });

// Function to fetch data and calculate trend
const fetchTrendData = async () => {
  if (!props.serverName) return;

  loading.value = true;
  error.value = null;

  try {
    // Fetch player count data for the last 7 days
    const data = await fetchServerPlayerData(props.serverName);

    // Filter data to only include the last 30 minutes
    const now = Math.floor(Date.now() / 1000);
    const thirtyMinutesAgo = now - 1800;
    const lastThirtyMinutesData = data.filter(point => point.timestamp >= thirtyMinutesAgo);

    if (lastThirtyMinutesData.length >= 2) {
      // Get first and last data points
      const firstPoint = lastThirtyMinutesData[0];
      const lastPoint = lastThirtyMinutesData[lastThirtyMinutesData.length - 1];

      // Calculate difference
      const difference = lastPoint.value - firstPoint.value;

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (difference > 0) {
        trend = 'up';
      } else if (difference < 0) {
        trend = 'down';
      }

      trendData.value = { difference: Math.abs(difference), trend };
    } else {
      // Not enough data points
      trendData.value = { difference: 0, trend: 'stable' };
    }
  } catch (err) {
    console.error('Error fetching trend data:', err);
    error.value = 'Failed to fetch trend data';
  } finally {
    loading.value = false;
  }
};

// Fetch data when component is mounted or when serverName changes
onMounted(fetchTrendData);
watch(() => props.serverName, fetchTrendData);
</script>

<template>
  <span class="trend-indicator">
    <span
      v-if="loading"
      class="loading"
    >...</span>
    <span
      v-else-if="error"
      class="error"
    >!</span>
    <span v-else>
      <span
        v-if="trendData.trend === 'up'"
        class="trend-up"
      >+{{ trendData.difference }}</span>
      <span
        v-else-if="trendData.trend === 'down'"
        class="trend-down"
      >-{{ trendData.difference }}</span>
      <span
        v-else
        class="trend-stable"
      >0</span>
    </span>
  </span>
</template>

<style scoped>
.trend-indicator {
  display: inline-block;
  margin-left: 5px;
  font-size: 0.9em;
  font-weight: bold;
}

.trend-up {
  color: #4CAF50; /* Always green regardless of theme */
}

.trend-down {
  color: #ff5252; /* A red that works well in both light and dark modes */
}

.trend-stable {
  color: var(--color-text-muted);
}

.loading {
  color: var(--color-text-muted);
  font-style: italic;
}

.error {
  color: #ff5252;
}
</style>
