<template>
  <div class="p-6">
    <!-- Initial Loading State (skeleton) - only when no data yet -->
    <div v-if="isLoading && !detail" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-8 bg-slate-700/50 rounded w-2/3 mb-2"></div>
        <div class="h-4 bg-slate-700/30 rounded w-1/4"></div>
      </div>
      <div class="h-24 bg-slate-700/30 rounded-lg animate-pulse"></div>
      <div class="h-32 bg-slate-700/30 rounded-lg animate-pulse"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="h-48 bg-slate-700/30 rounded-lg animate-pulse"></div>
        <div class="h-48 bg-slate-700/30 rounded-lg animate-pulse"></div>
        <div class="h-48 bg-slate-700/30 rounded-lg animate-pulse"></div>
        <div class="h-48 bg-slate-700/30 rounded-lg animate-pulse"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !detail" class="text-center py-8">
      <div class="text-red-400 mb-2">{{ error }}</div>
      <button @click="loadData(false)" class="text-cyan-400 hover:text-cyan-300 text-sm">
        Try again
      </button>
    </div>

    <!-- Content (shown even during refresh) -->
    <div v-else-if="detail" class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-3 mb-2">
          <!-- Back Button -->
          <button
            @click="emit('close')"
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Back to server details"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            :class="[
              'w-3 h-3 rounded-full flex-shrink-0',
              detail.isServerOnline ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'
            ]"
          />
          <router-link
            :to="getMapDetailsRoute(detail.mapName)"
            class="text-2xl font-bold text-slate-200 hover:text-cyan-400 transition-colors"
            :title="`View details for ${detail.mapName}`"
          >
            {{ detail.mapName }}
          </router-link>
        </div>
        <!-- Breadcrumb / Context -->
        <div class="flex items-center gap-2 text-sm text-slate-400 ml-11">
          <span class="px-2 py-0.5 bg-slate-700 rounded">{{ getGameLabel(detail.game) }}</span>
          <span class="text-slate-500">on</span>
          <span class="text-slate-300">{{ detail.serverName }}</span>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="selectedDays"
          @change="handlePeriodChange"
          :disabled="isRefreshing"
          class="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        >
          <option :value="30">Last 30 days</option>
          <option :value="60">Last 60 days</option>
          <option :value="90">Last 90 days</option>
          <option :value="180">Last 6 months</option>
          <option :value="365">Last year</option>
        </select>
        <!-- Inline refresh spinner -->
        <div v-if="isRefreshing" class="flex items-center gap-2 text-sm text-slate-400">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Updating...</span>
        </div>
        <div class="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded p-0.5">
          <button
            @click="showRegularsOnly = false"
            :class="[
              'px-3 py-1 text-sm rounded transition-colors',
              !showRegularsOnly
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            All (3+ rounds)
          </button>
          <button
            @click="showRegularsOnly = true"
            :class="[
              'px-3 py-1 text-sm rounded transition-colors',
              showRegularsOnly
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            Regulars (10+)
          </button>
        </div>
      </div>

      <!-- Map Activity Stats Grid -->
      <div class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Map Activity</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-200">
              {{ detail.mapActivity.totalRounds.toLocaleString() }}
            </div>
            <div class="text-xs text-slate-400 mt-1">Rounds</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-200">
              {{ formatPlayTime(detail.mapActivity.totalPlayTimeMinutes) }}
            </div>
            <div class="text-xs text-slate-400 mt-1">Total Playtime</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-200">
              {{ detail.mapActivity.avgConcurrentPlayers.toFixed(1) }}
            </div>
            <div class="text-xs text-slate-400 mt-1">Avg Players</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-slate-200">
              {{ detail.mapActivity.peakConcurrentPlayers }}
            </div>
            <div class="text-xs text-slate-400 mt-1">Peak Players</div>
          </div>
        </div>
      </div>

      <!-- Activity Heatmap -->
      <div v-if="detail.activityPatterns?.length > 0" class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">When is this map played?</h3>
        <p class="text-xs text-slate-500 mb-3">Times shown in your local timezone</p>
        <ActivityHeatmap :patterns="activityPatternsForHeatmap" />
      </div>

      <!-- Team Win % -->
      <div class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Team Win %</h3>
        <WinStatsBar :win-stats="detail.winStats" />
      </div>

      <!-- Leaderboards Section -->
      <div>
        <h3 class="text-sm font-medium text-slate-300 mb-3">Top Players</h3>

        <!-- 2x2 Leaderboard Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-800/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-slate-300 mb-3">Top by Score</h4>
            <LeaderboardTable
              :entries="filteredByScore"
              type="score"
            />
          </div>
          <div class="bg-slate-800/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-slate-300 mb-3">Top by Kills</h4>
            <LeaderboardTable
              :entries="filteredByKills"
              type="kills"
            />
          </div>
          <div class="bg-slate-800/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-slate-300 mb-3">Top by K/D Ratio</h4>
            <LeaderboardTable
              :entries="filteredByKdRatio"
              type="kdRatio"
            />
          </div>
          <div class="bg-slate-800/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-slate-300 mb-3">Top by Kill Rate</h4>
            <LeaderboardTable
              :entries="filteredByKillRate"
              type="killRate"
            />
          </div>
        </div>
      </div>

      <!-- Recent Sessions Section -->
      <div>
        <h3 class="text-sm font-medium text-slate-300 mb-3">Recent Sessions</h3>
        <RecentSessionsList
          :server-guid="serverGuid"
          :server-name="detail?.serverName"
          :map-name="mapName"
          :limit="5"
          empty-message="No recent sessions found for this map on this server"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { fetchServerMapDetail, type ServerMapDetail, type LeaderboardEntry } from '../../services/dataExplorerService';
import WinStatsBar from './WinStatsBar.vue';
import LeaderboardTable from './LeaderboardTable.vue';
import ActivityHeatmap from './ActivityHeatmap.vue';
import RecentSessionsList from './RecentSessionsList.vue';

const props = defineProps<{
  serverGuid: string;
  mapName: string;
}>();

const emit = defineEmits<{
  (e: 'navigateToServer', serverGuid: string): void;
  (e: 'navigateToMap', mapName: string): void;
  (e: 'close'): void;
}>();

const getMapDetailsRoute = (mapName: string) => ({
  name: 'explore-map-detail',
  params: { mapName }
});

const detail = ref<ServerMapDetail | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const error = ref<string | null>(null);
const selectedDays = ref(60);
const showRegularsOnly = ref(false);


const REGULARS_MIN_ROUNDS = 10;

const filterByMinRounds = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
  if (!showRegularsOnly.value) return entries;
  return entries.filter(e => e.totalRounds >= REGULARS_MIN_ROUNDS);
};

const filteredByScore = computed(() => filterByMinRounds(detail.value?.topByScore ?? []));
const filteredByKills = computed(() => filterByMinRounds(detail.value?.topByKills ?? []));
const filteredByKdRatio = computed(() => filterByMinRounds(detail.value?.topByKdRatio ?? []));
const filteredByKillRate = computed(() => filterByMinRounds(detail.value?.topByKillRate ?? []));

// Activity patterns for heatmap (already in correct format from API)
const activityPatternsForHeatmap = computed(() => detail.value?.activityPatterns ?? []);

const getGameLabel = (game: string): string => {
  switch (game.toLowerCase()) {
    case 'bf1942': return 'Battlefield 1942';
    case 'fh2': return 'Forgotten Hope 2';
    case 'bfvietnam': return 'Battlefield Vietnam';
    default: return game;
  }
};

const formatPlayTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

const loadData = async (isRefresh = false) => {
  if (!props.serverGuid || !props.mapName) return;

  // Use refreshing state if we already have data
  if (isRefresh && detail.value) {
    isRefreshing.value = true;
  } else {
    isLoading.value = true;
  }
  error.value = null;

  try {
    detail.value = await fetchServerMapDetail(props.serverGuid, props.mapName, selectedDays.value);
    // Update document title with actual server and map names
    if (detail.value?.serverName && detail.value?.mapName) {
      document.title = `${detail.value.mapName} on ${detail.value.serverName} - Data Explorer | BF Stats`;
    }
  } catch (err) {
    console.error('Error loading server-map detail:', err);
    error.value = 'Failed to load server-map details';
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
};

const handlePeriodChange = () => {
  loadData(true);
};

onMounted(() => {
  loadData(false);
});
watch(() => [props.serverGuid, props.mapName], () => {
  loadData(false);
});
</script>
