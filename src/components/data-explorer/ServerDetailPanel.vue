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

    <!-- Content -->
    <div v-else-if="serverDetail" class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              serverDetail.isOnline ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'
            ]"
          />
          <h2 class="text-2xl font-bold text-slate-200">{{ serverDetail.name }}</h2>
        </div>
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <span class="px-2 py-0.5 bg-slate-700 rounded">{{ getGameLabel(serverDetail.game) }}</span>
          <span v-if="serverDetail.country">{{ serverDetail.country }}</span>
        </div>
      </div>

      <!-- Overall Win Stats -->
      <div class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Overall Win Statistics</h3>
        <WinStatsBar :win-stats="serverDetail.overallWinStats" />
      </div>

      <!-- Map Rotation -->
      <div>
        <h3 class="text-sm font-medium text-slate-300 mb-3">Map Rotation</h3>
        <div class="bg-slate-800/30 rounded-lg p-4">
          <MapRotationTable
            :map-rotation="serverDetail.mapRotation.slice(0, 10)"
            @navigate="emit('navigateToMap', $event)"
          />
        </div>
      </div>

      <!-- Activity Heatmap -->
      <div v-if="serverDetail.activityPatterns.length > 0">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Activity Patterns (UTC)</h3>
        <div class="bg-slate-800/30 rounded-lg p-4">
          <ActivityHeatmap :patterns="serverDetail.activityPatterns" />
        </div>
      </div>

      <!-- Per-Map Stats with Leaderboards -->
      <div v-if="serverDetail.perMapStats.length > 0">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Top Players by Map</h3>
        <div class="space-y-3">
          <details
            v-for="mapStats in serverDetail.perMapStats.slice(0, 5)"
            :key="mapStats.mapName"
            class="bg-slate-800/30 rounded-lg overflow-hidden group"
          >
            <summary class="px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors flex items-center justify-between">
              <span class="text-slate-200 font-medium">{{ mapStats.mapName }}</span>
              <div class="flex items-center gap-3">
                <span v-if="mapStats.topPlayers.length > 0" class="text-sm text-slate-400 group-open:hidden">
                  <span class="text-yellow-400">#1</span>
                  <router-link
                    :to="getPlayerDetailsRoute(mapStats.topPlayers[0].playerName)"
                    class="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {{ mapStats.topPlayers[0].playerName }}
                  </router-link>
                </span>
                <svg class="w-5 h-5 text-slate-400 transform transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div class="px-4 pb-4 border-t border-slate-700/30">
              <div class="mt-3">
                <LeaderboardPreview :players="mapStats.topPlayers" />
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { fetchServerDetail, type ServerDetail } from '../../services/dataExplorerService';
import WinStatsBar from './WinStatsBar.vue';
import MapRotationTable from './MapRotationTable.vue';
import ActivityHeatmap from './ActivityHeatmap.vue';
import LeaderboardPreview from './LeaderboardPreview.vue';

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'player-details',
  params: { playerName: encodeURIComponent(playerName) }
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
  } catch (err) {
    console.error('Error loading server detail:', err);
    error.value = 'Failed to load server details';
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadData);
watch(() => props.serverGuid, loadData);
</script>
