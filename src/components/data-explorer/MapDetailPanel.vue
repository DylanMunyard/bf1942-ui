<template>
  <div class="detail-content">
    <!-- Loading State -->
    <div v-if="isLoading" class="detail-loading">
      <div class="detail-skeleton detail-skeleton--title"></div>
      <div class="detail-skeleton detail-skeleton--subtitle"></div>
      <div class="detail-skeleton detail-skeleton--block"></div>
      <div class="detail-skeleton detail-skeleton--block-lg"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="detail-error">
      <div class="detail-error-text">{{ error }}</div>
      <button @click="loadData" class="detail-retry">
        Try again
      </button>
    </div>

    <!-- No Data State -->
    <div v-else-if="mapDetail === null" class="detail-empty">
      <div class="detail-empty-icon">{ }</div>
      <p class="detail-empty-title">No data available for this map</p>
      <p class="detail-empty-desc">This map may not have been played recently or data is not yet available.</p>
    </div>

    <!-- Content -->
    <div v-else-if="mapDetail" class="detail-body">
      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-row">
          <span class="detail-icon">{ }</span>
          <h2 class="detail-title">{{ mapDetail.mapName }}</h2>
        </div>
        <div class="detail-meta">
          Played on {{ mapDetail.servers.length }} server{{ mapDetail.servers.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Activity Heatmap -->
      <div v-if="activityPatterns && activityPatterns.length > 0" class="detail-section">
        <h3 class="detail-section-title">WHEN IS THIS MAP PLAYED?</h3>
        <div class="detail-card">
          <p class="detail-hint">Average player count when this map is in rotation (times shown in your local timezone)</p>
          <ActivityHeatmap :patterns="activityPatternsForHeatmap" />
        </div>
      </div>

      <!-- Aggregated Win Stats -->
      <div class="detail-section">
        <h3 class="detail-section-title">OVERALL WIN STATISTICS</h3>
        <div class="detail-card">
          <WinStatsBar :win-stats="mapDetail.aggregatedWinStats" />
        </div>
      </div>

      <!-- Server List -->
      <div class="detail-section">
        <h3 class="detail-section-title">SERVERS PLAYING THIS MAP</h3>
        <div class="detail-card">
          <ServerRotationTable
            :servers="mapDetail.servers"
            @navigate="emit('navigateToServer', $event)"
          />
        </div>
      </div>

      <!-- Player Rankings -->
      <div class="detail-section">
        <div class="detail-card">
          <MapPlayerRankings :map-name="mapDetail.mapName" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import {
  fetchMapDetail,
  fetchMapActivityPatterns,
  type MapDetail,
  type MapActivityPattern,
  type ActivityPattern
} from '../../services/dataExplorerService';
import WinStatsBar from './WinStatsBar.vue';
import ServerRotationTable from './ServerRotationTable.vue';
import MapPlayerRankings from './MapPlayerRankings.vue';
import ActivityHeatmap from './ActivityHeatmap.vue';

const props = defineProps<{
  mapName: string;
}>();

const emit = defineEmits<{
  (e: 'navigateToServer', serverGuid: string): void;
}>();

const mapDetail = ref<MapDetail | null>(null);
const activityPatterns = ref<MapActivityPattern[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Convert MapActivityPattern to ActivityPattern for the heatmap component
const activityPatternsForHeatmap = computed<ActivityPattern[]>(() => {
  return activityPatterns.value.map(p => ({
    dayOfWeek: p.dayOfWeek,
    hourOfDay: p.hourOfDay,
    avgPlayers: p.avgPlayers,
    medianPlayers: p.avgPlayers // Use avgPlayers as fallback for medianPlayers
  }));
});

const loadData = async () => {
  if (!props.mapName) return;

  isLoading.value = true;
  error.value = null;

  try {
    // Fetch map detail and activity patterns in parallel
    const [detail, patterns] = await Promise.all([
      fetchMapDetail(props.mapName),
      fetchMapActivityPatterns(props.mapName)
    ]);

    mapDetail.value = detail;
    activityPatterns.value = patterns?.activityPatterns ?? [];
  } catch (err) {
    console.error('Error loading map detail:', err);
    error.value = 'Failed to load map details';
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadData);
watch(() => props.mapName, loadData);
</script>

<style scoped>
.detail-content {
  padding: 1.5rem;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-skeleton {
  background: linear-gradient(
    90deg,
    var(--portal-surface-elevated) 0%,
    var(--portal-border) 50%,
    var(--portal-surface-elevated) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: 2px;
}

.detail-skeleton--title {
  height: 2rem;
  width: 33%;
}

.detail-skeleton--subtitle {
  height: 1rem;
  width: 25%;
}

.detail-skeleton--block {
  height: 8rem;
}

.detail-skeleton--block-lg {
  height: 12rem;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.detail-error {
  text-align: center;
  padding: 2rem;
}

.detail-error-text {
  color: var(--portal-danger);
  margin-bottom: 0.5rem;
}

.detail-retry {
  font-size: 0.8rem;
  color: var(--portal-accent);
  background: none;
  border: none;
  cursor: pointer;
}

.detail-retry:hover {
  color: #00f5a8;
}

.detail-empty {
  text-align: center;
  padding: 2rem;
}

.detail-empty-icon {
  font-size: 1.5rem;
  color: var(--portal-accent);
  opacity: 0.5;
  margin-bottom: 0.5rem;
  font-family: ui-monospace, monospace;
}

.detail-empty-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--portal-text-bright);
  margin: 0;
}

.detail-empty-desc {
  font-size: 0.8rem;
  color: var(--portal-text);
  margin-top: 0.35rem;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header {
  margin-bottom: 0.5rem;
}

.detail-header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.detail-icon {
  font-size: 1.5rem;
  font-family: ui-monospace, monospace;
  color: var(--portal-accent);
  opacity: 0.7;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--portal-text-bright);
  margin: 0;
}

.detail-meta {
  font-size: 0.8rem;
  color: var(--portal-text);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-section-title {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--portal-accent);
  margin: 0;
  font-family: ui-monospace, monospace;
}

.detail-card {
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  padding: 1rem;
}

.detail-hint {
  font-size: 0.7rem;
  color: var(--portal-text);
  margin: 0 0 0.75rem;
}
</style>
