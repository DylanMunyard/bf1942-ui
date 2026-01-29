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

    <!-- Content -->
    <div v-else-if="serverDetail" class="detail-body">
      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-row">
          <div
            :class="['detail-status', serverDetail.isOnline ? 'detail-status--online' : 'detail-status--offline']"
          />
          <router-link
            :to="`/servers/${encodeURIComponent(serverDetail.name)}`"
            class="detail-title-link"
            :title="`View server details for ${serverDetail.name}`"
          >
            {{ serverDetail.name }}
            <svg class="detail-title-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" />
            </svg>
          </router-link>
        </div>
        <div class="detail-meta">
          <span class="detail-tag">{{ getGameLabel(serverDetail.game) }}</span>
          <span v-if="serverDetail.country">{{ serverDetail.country }}</span>
        </div>
      </div>

      <!-- Overall Win Stats -->
      <div class="detail-section">
        <h3 class="detail-section-title">OVERALL WIN STATISTICS</h3>
        <div class="detail-card">
          <WinStatsBar :win-stats="serverDetail.overallWinStats" />
        </div>
      </div>

      <!-- Map Rotation -->
      <div class="detail-section">
        <h3 class="detail-section-title">MAP ROTATION</h3>
        <div class="detail-card">
          <MapRotationTable
            :map-rotation="mapRotation"
            :current-page="mapRotationPage"
            :total-pages="mapRotationTotalPages"
            :total-count="mapRotationTotalCount"
            :page-size="mapRotationPageSize"
            :is-loading="isLoadingMapRotation"
            @navigate="emit('navigateToMap', $event)"
            @page-change="handleMapRotationPageChange"
          />
        </div>
      </div>

      <!-- Activity Heatmap -->
      <div v-if="serverDetail.activityPatterns.length > 0" class="detail-section">
        <h3 class="detail-section-title">ACTIVITY PATTERNS (LOCAL TIME)</h3>
        <div class="detail-card">
          <ActivityHeatmap :patterns="serverDetail.activityPatterns" />
        </div>
      </div>

      <!-- Per-Map Stats with Leaderboards -->
      <div v-if="serverDetail.perMapStats.length > 0" class="detail-section">
        <h3 class="detail-section-title">TOP PLAYERS BY MAP</h3>
        <div class="detail-accordions">
          <details
            v-for="mapStats in serverDetail.perMapStats.slice(0, 5)"
            :key="mapStats.mapName"
            class="detail-accordion"
          >
            <summary class="detail-accordion-header">
              <span class="detail-accordion-title">{{ mapStats.mapName }}</span>
              <div class="detail-accordion-meta">
                <span v-if="mapStats.topPlayers.length > 0" class="detail-accordion-preview">
                  <span class="detail-rank-1">#1</span>
                  <router-link
                    :to="getPlayerDetailsRoute(mapStats.topPlayers[0].playerName)"
                    class="detail-link"
                  >
                    {{ mapStats.topPlayers[0].playerName }}
                  </router-link>
                </span>
                <svg class="detail-accordion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div class="detail-accordion-content">
              <LeaderboardPreview :players="mapStats.topPlayers" />
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { fetchServerDetail, fetchServerMapRotation, type ServerDetail, type MapRotationItem } from '../../services/dataExplorerService';
import WinStatsBar from './WinStatsBar.vue';
import MapRotationTable from './MapRotationTable.vue';
import ActivityHeatmap from './ActivityHeatmap.vue';
import LeaderboardPreview from './LeaderboardPreview.vue';

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'explore-player-detail',
  params: { playerName }
});

const props = defineProps<{
  serverGuid: string;
}>();

const emit = defineEmits<{
  (e: 'navigateToMap', mapName: string): void;
}>();

const serverDetail = ref<ServerDetail | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Map rotation pagination state
const mapRotation = ref<MapRotationItem[]>([]);
const mapRotationPage = ref(1);
const mapRotationPageSize = ref(10);
const mapRotationTotalCount = ref(0);
const mapRotationTotalPages = computed(() => Math.max(1, Math.ceil(mapRotationTotalCount.value / mapRotationPageSize.value)));
const isLoadingMapRotation = ref(false);

const getGameLabel = (game: string): string => {
  switch (game.toLowerCase()) {
    case 'bf1942': return 'Battlefield 1942';
    case 'fh2': return 'Forgotten Hope 2';
    case 'bfvietnam': return 'Battlefield Vietnam';
    default: return game;
  }
};

const loadData = async () => {
  if (!props.serverGuid) return;

  isLoading.value = true;
  error.value = null;

  try {
    serverDetail.value = await fetchServerDetail(props.serverGuid);
    // Update document title with actual server name
    if (serverDetail.value?.name) {
      document.title = `${serverDetail.value.name} - Data Explorer | BF Stats`;
    }
    // Load first page of map rotation
    await loadMapRotation(1);
  } catch (err) {
    console.error('Error loading server detail:', err);
    error.value = 'Failed to load server details';
  } finally {
    isLoading.value = false;
  }
};

const loadMapRotation = async (page: number) => {
  if (!props.serverGuid) return;

  isLoadingMapRotation.value = true;
  try {
    const response = await fetchServerMapRotation(props.serverGuid, page, mapRotationPageSize.value);
    mapRotation.value = response.maps;
    mapRotationPage.value = response.page;
    mapRotationTotalCount.value = response.totalCount;
  } catch (err) {
    console.error('Error loading map rotation:', err);
    mapRotation.value = [];
    mapRotationTotalCount.value = 0;
  } finally {
    isLoadingMapRotation.value = false;
  }
};

const handleMapRotationPageChange = (page: number) => {
  if (page >= 1 && page <= mapRotationTotalPages.value) {
    loadMapRotation(page);
  }
};

onMounted(loadData);
watch(() => props.serverGuid, () => {
  loadData();
  mapRotationPage.value = 1;
});
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

.detail-status {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.detail-status--online {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
}

.detail-status--offline {
  background: var(--portal-text);
  opacity: 0.4;
}

.detail-title-link {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--portal-text-bright);
  text-decoration: none;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-title-link:hover {
  color: var(--portal-accent);
}

.detail-title-arrow {
  width: 1rem;
  height: 1rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.detail-title-link:hover .detail-title-arrow {
  opacity: 1;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--portal-text);
}

.detail-tag {
  padding: 0.125rem 0.5rem;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  font-size: 0.7rem;
  font-weight: 500;
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

.detail-accordions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-accordion {
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  overflow: hidden;
}

.detail-accordion-header {
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.2s;
  list-style: none;
}

.detail-accordion-header::-webkit-details-marker {
  display: none;
}

.detail-accordion-header:hover {
  background: var(--portal-accent-dim);
}

.detail-accordion-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--portal-text-bright);
}

.detail-accordion-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-accordion-preview {
  font-size: 0.8rem;
  color: var(--portal-text);
}

.detail-accordion[open] .detail-accordion-preview {
  display: none;
}

.detail-rank-1 {
  color: #fbbf24;
  font-weight: 600;
  margin-right: 0.25rem;
}

.detail-link {
  color: var(--portal-accent);
  text-decoration: none;
  transition: color 0.2s;
}

.detail-link:hover {
  color: #00f5a8;
}

.detail-accordion-arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--portal-text);
  transition: transform 0.2s;
}

.detail-accordion[open] .detail-accordion-arrow {
  transform: rotate(180deg);
}

.detail-accordion-content {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--portal-border);
}
</style>
