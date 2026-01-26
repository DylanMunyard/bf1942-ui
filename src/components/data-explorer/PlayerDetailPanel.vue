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
      <div class="text-slate-400 mb-4">{{ error }}</div>
      <div class="mb-4">
        <p class="text-slate-500 text-sm mb-3">Try selecting a different time period:</p>
        <div class="flex gap-2 justify-center">
          <button
            v-for="option in timeRangeOptions"
            :key="option.value"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              selectedTimeRange === option.value
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
            ]"
            @click="changeTimeRange(option.value)"
            :disabled="isLoading"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <button @click="loadData()" class="text-cyan-400 hover:text-cyan-300 text-sm">
        Try again
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="filteredPlayerData" class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">👤</span>
          <h2 class="text-2xl font-bold text-slate-200">{{ filteredPlayerData.playerName }}</h2>
        </div>

        <!-- Time Range Selector -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-400">
            {{ gameLabel }} &bull; Last {{ filteredPlayerData.dateRange.days }} days
          </div>
          <div class="flex gap-2">
            <button
              v-for="option in timeRangeOptions"
              :key="option.value"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                selectedTimeRange === option.value
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
              ]"
              @click="changeTimeRange(option.value)"
              :disabled="isLoading"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Overall Stats -->
      <div class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Overall Statistics</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-cyan-400">{{ formatNumber(filteredPlayerData.overallStats.totalScore) }}</div>
            <div class="text-xs text-slate-400 mt-1">Total Score</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-200">{{ filteredPlayerData.overallStats.kdRatio.toFixed(2) }}</div>
            <div class="text-xs text-slate-400 mt-1">K/D Ratio</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-200">{{ filteredPlayerData.overallStats.uniqueServers }}</div>
            <div class="text-xs text-slate-400 mt-1">Servers</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-200">{{ filteredPlayerData.overallStats.uniqueMaps }}</div>
            <div class="text-xs text-slate-400 mt-1">Maps</div>
          </div>
        </div>
      </div>

      <!-- #1 Rankings Section -->
      <div v-if="filteredPlayerData.numberOneRankings.length > 0" class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">
          <span class="text-yellow-400">#1</span> Rankings
        </h3>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="ranking in filteredPlayerData.numberOneRankings"
            :key="`${ranking.mapName}-${ranking.serverGuid}`"
            class="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm"
            :title="`${ranking.mapName} on ${ranking.serverName} - ${formatNumber(ranking.totalScore)} score`"
          >
            <span class="text-yellow-300">{{ ranking.mapName }}</span>
            <button
              @click="handleNavigateToServer(ranking.serverGuid)"
              class="text-slate-500 hover:text-cyan-400 text-xs ml-1 transition-colors"
            >
              ({{ truncateServerName(ranking.serverName) }})
            </button>
          </div>
        </div>
      </div>

      <!-- Map Rankings -->
      <div v-if="filteredPlayerData.mapGroups.length > 0">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Rankings by Map</h3>
        <div class="space-y-3">
          <details
            v-for="mapGroup in filteredPlayerData.mapGroups"
            :key="mapGroup.mapName"
            class="bg-slate-800/30 rounded-lg overflow-hidden group"
            :open="expandedMaps.has(mapGroup.mapName)"
          >
            <summary
              @click.prevent="toggleMapExpanded(mapGroup.mapName)"
              class="px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <span class="text-slate-200 font-medium">{{ mapGroup.mapName }}</span>
                <button
                  @click.stop="handleNavigateToMap(mapGroup.mapName)"
                  class="ml-2 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="View map details"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span
                  v-if="mapGroup.bestRank === 1"
                  class="inline-flex items-center justify-center px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-medium"
                >
                  #1
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-cyan-400 group-open:hidden">{{ formatNumber(mapGroup.aggregatedScore) }}</span>
                <span
                  v-if="mapGroup.bestRank && mapGroup.bestRank > 1"
                  class="text-sm text-slate-400 group-open:hidden"
                >
                  Best: #{{ mapGroup.bestRank }}
                </span>
                <svg class="w-5 h-5 text-slate-400 transform transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div class="px-4 pb-4 border-t border-slate-700/30">
              <div class="mt-3">
                <PlayerMapServerTable
                  :server-stats="mapGroup.serverStats"
                  @navigate-to-server="handleNavigateToServer"
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { PLAYER_STATS_TIME_RANGE_OPTIONS } from '@/utils/constants';
import { fetchPlayerMapRankings, type PlayerMapRankingsResponse, type GameType } from '../../services/dataExplorerService';
import PlayerMapServerTable from './PlayerMapServerTable.vue';

const props = defineProps<{
  playerName: string;
  game?: GameType;
  serverGuid?: string; // Optional: filter to a specific server
}>();

const emit = defineEmits<{
  'navigate-to-server': [serverGuid: string];
  'navigate-to-map': [mapName: string];
}>();

const handleNavigateToServer = (serverGuid: string) => {
  emit('navigate-to-server', serverGuid);
};

const handleNavigateToMap = (mapName: string) => {
  emit('navigate-to-map', mapName);
};

const playerData = ref<PlayerMapRankingsResponse | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const expandedMaps = ref<Set<string>>(new Set());

// Computed property - when serverGuid is provided, API filters server-side, so no client-side filtering needed
const filteredPlayerData = computed(() => {
  return playerData.value;
});

// Time range selection
const selectedTimeRange = ref<number>(60); // Default to 60 days
const timeRangeOptions = PLAYER_STATS_TIME_RANGE_OPTIONS;

const gameLabel = computed(() => {
  switch (playerData.value?.game?.toLowerCase()) {
    case 'bf1942': return 'Battlefield 1942';
    case 'fh2': return 'Forgotten Hope 2';
    case 'bfvietnam': return 'Battlefield Vietnam';
    default: return playerData.value?.game || 'Unknown';
  }
});

const loadData = async (days?: number) => {
  if (!props.playerName) return;

  const timeRange = days || selectedTimeRange.value;
  isLoading.value = true;
  error.value = null;

  try {
    console.log(`Loading player data for ${props.playerName} with ${timeRange} days`);
    // Pass serverGuid to filter on server side if provided
    playerData.value = await fetchPlayerMapRankings(
      props.playerName,
      props.game || 'bf1942',
      timeRange,
      props.serverGuid
    );

    // Clear expanded maps and set up new ones if we have data
    expandedMaps.value.clear();
    if (playerData.value && playerData.value.mapGroups.length > 0) {
      // Auto-expand first map with a #1 ranking, or just the first map
      const firstNumberOne = playerData.value.mapGroups.find(mg => mg.bestRank === 1);
      if (firstNumberOne) {
        expandedMaps.value.add(firstNumberOne.mapName);
      } else {
        expandedMaps.value.add(playerData.value.mapGroups[0].mapName);
      }
      // Update document title
      if (playerData.value?.playerName) {
        document.title = `${playerData.value.playerName} - Player Explorer | BF Stats`;
      }
    } else {
      error.value = `No data available for this player in the last ${timeRange} days`;
    }
  } catch (err: any) {
    console.error(`Error loading player data for ${timeRange} days:`, err);

    if (err.message === 'PLAYER_NOT_FOUND') {
      error.value = `No data available for this player in the last ${timeRange} days`;
    } else {
      error.value = 'Failed to load player details';
    }
  }

  isLoading.value = false;
};

const changeTimeRange = (days: number) => {
  selectedTimeRange.value = days;
  loadData(days);
};

const toggleMapExpanded = (mapName: string) => {
  if (expandedMaps.value.has(mapName)) {
    expandedMaps.value.delete(mapName);
  } else {
    expandedMaps.value.add(mapName);
  }
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const truncateServerName = (name: string): string => {
  return name.length > 20 ? name.substring(0, 20) + '...' : name;
};

onMounted(loadData);
watch(() => props.playerName, () => loadData());
watch(() => props.game, () => loadData());
watch(() => props.serverGuid, () => {
  // When serverGuid changes, reload data to get server-filtered results
  loadData();
});
</script>
