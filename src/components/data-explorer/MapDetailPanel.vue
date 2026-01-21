<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-8 bg-slate-700/50 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-slate-700/30 rounded w-1/4"></div>
      </div>
      <div class="h-32 bg-slate-700/30 rounded-lg animate-pulse"></div>
      <div class="h-48 bg-slate-700/30 rounded-lg animate-pulse"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-400 mb-2">{{ error }}</div>
      <button @click="loadData" class="text-cyan-400 hover:text-cyan-300 text-sm">
        Try again
      </button>
    </div>

    <!-- No Data State -->
    <div v-else-if="mapDetail === null" class="text-center py-8">
      <div class="text-slate-400 mb-2">No data available for this map</div>
      <div class="text-sm text-slate-500">This map may not have been played recently or data is not yet available.</div>
    </div>

    <!-- Content -->
    <div v-else-if="mapDetail" class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl">🗺️</span>
          <h2 class="text-2xl font-bold text-slate-200">{{ mapDetail.mapName }}</h2>
        </div>
        <div class="text-sm text-slate-400">
          Played on {{ mapDetail.servers.length }} server{{ mapDetail.servers.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Aggregated Win Stats -->
      <div class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Overall Win Statistics</h3>
        <WinStatsBar :win-stats="mapDetail.aggregatedWinStats" />
      </div>

      <!-- Server List -->
      <div>
        <h3 class="text-sm font-medium text-slate-300 mb-3">Servers Playing This Map</h3>
        <div class="bg-slate-800/30 rounded-lg p-4">
          <ServerRotationTable
            :servers="mapDetail.servers"
            @navigate="emit('navigateToServer', $event)"
          />
        </div>
      </div>

      <!-- Player Rankings -->
      <div class="bg-slate-800/30 rounded-lg p-4">
        <MapPlayerRankings :map-name="mapDetail.mapName" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { fetchMapDetail, type MapDetail } from '../../services/dataExplorerService';
import WinStatsBar from './WinStatsBar.vue';
import ServerRotationTable from './ServerRotationTable.vue';
import MapPlayerRankings from './MapPlayerRankings.vue';

const props = defineProps<{
  mapName: string;
}>();

const emit = defineEmits<{
  (e: 'navigateToServer', serverGuid: string): void;
}>();

const mapDetail = ref<MapDetail | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const loadData = async () => {
  if (!props.mapName) return;

  isLoading.value = true;
  error.value = null;

  try {
    mapDetail.value = await fetchMapDetail(props.mapName);
    // mapDetail will be null if the map has no data (404 response)
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
