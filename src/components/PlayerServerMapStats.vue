<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-8 bg-slate-700/50 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-slate-700/30 rounded w-1/4"></div>
      </div>
      <div class="h-64 bg-slate-700/30 rounded-lg animate-pulse"></div>
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
    <div v-else-if="mapStats.length > 0" class="space-y-4">
      <!-- Time Range Selector -->
      <div class="flex items-center justify-between">
        <div class="text-sm text-slate-400">
          {{ mapStats.length }} map{{ mapStats.length !== 1 ? 's' : '' }} played
          <span v-if="playerData" class="text-slate-500">
            &bull; Last {{ playerData.dateRange.days }} days
          </span>
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

      <!-- Map Stats Table -->
      <div class="bg-slate-800/30 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-slate-400 text-left border-b border-slate-700/50 bg-slate-800/50">
                <th
                  class="p-3 font-medium cursor-pointer hover:bg-slate-700/30 transition-colors"
                  @click="changeSort('rank')"
                >
                  <div class="flex items-center gap-2">
                    <span>#</span>
                    <span
                      class="text-xs transition-transform"
                      :class="{
                        'text-yellow-400 opacity-100': sortField === 'rank',
                        'opacity-50': sortField !== 'rank',
                        'rotate-0': sortField === 'rank' && sortDirection === 'asc',
                        'rotate-180': sortField === 'rank' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-3 font-medium cursor-pointer hover:bg-slate-700/30 transition-colors"
                  @click="changeSort('mapName')"
                >
                  <div class="flex items-center gap-2">
                    <span>Map</span>
                    <span
                      class="text-xs transition-transform"
                      :class="{
                        'text-cyan-400 opacity-100': sortField === 'mapName',
                        'opacity-50': sortField !== 'mapName',
                        'rotate-0': sortField === 'mapName' && sortDirection === 'asc',
                        'rotate-180': sortField === 'mapName' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-3 font-medium text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                  @click="changeSort('totalScore')"
                >
                  <div class="flex items-center justify-end gap-2">
                    <span>Score</span>
                    <span
                      class="text-xs transition-transform"
                      :class="{
                        'text-yellow-400 opacity-100': sortField === 'totalScore',
                        'opacity-50': sortField !== 'totalScore',
                        'rotate-0': sortField === 'totalScore' && sortDirection === 'asc',
                        'rotate-180': sortField === 'totalScore' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-3 font-medium text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                  @click="changeSort('kdRatio')"
                >
                  <div class="flex items-center justify-end gap-2">
                    <span>K/D</span>
                    <span
                      class="text-xs transition-transform"
                      :class="{
                        'text-green-400 opacity-100': sortField === 'kdRatio',
                        'opacity-50': sortField !== 'kdRatio',
                        'rotate-0': sortField === 'kdRatio' && sortDirection === 'asc',
                        'rotate-180': sortField === 'kdRatio' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-3 font-medium text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                  @click="changeSort('totalKills')"
                >
                  <div class="flex items-center justify-end gap-2">
                    <span>Kills</span>
                    <span
                      class="text-xs transition-transform"
                      :class="{
                        'text-red-400 opacity-100': sortField === 'totalKills',
                        'opacity-50': sortField !== 'totalKills',
                        'rotate-0': sortField === 'totalKills' && sortDirection === 'asc',
                        'rotate-180': sortField === 'totalKills' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-3 font-medium text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                  @click="changeSort('totalDeaths')"
                >
                  <div class="flex items-center justify-end gap-2">
                    <span>Deaths</span>
                    <span
                      class="text-xs transition-transform"
                      :class="{
                        'text-purple-400 opacity-100': sortField === 'totalDeaths',
                        'opacity-50': sortField !== 'totalDeaths',
                        'rotate-0': sortField === 'totalDeaths' && sortDirection === 'asc',
                        'rotate-180': sortField === 'totalDeaths' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-3 font-medium text-right cursor-pointer hover:bg-slate-700/30 transition-colors"
                  @click="changeSort('sessionsPlayed')"
                >
                  <div class="flex items-center justify-end gap-2">
                    <span>Sessions</span>
                    <span
                      class="text-xs transition-transform"
                      :class="{
                        'text-blue-400 opacity-100': sortField === 'sessionsPlayed',
                        'opacity-50': sortField !== 'sessionsPlayed',
                        'rotate-0': sortField === 'sessionsPlayed' && sortDirection === 'asc',
                        'rotate-180': sortField === 'sessionsPlayed' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(map, index) in sortedMapStats"
                :key="map.mapName"
                class="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
              >
                <td class="p-3">
                  <span v-if="map.rank !== null" :class="getRankClass(map.rank)">{{ map.rank }}</span>
                  <span v-else class="text-slate-500 text-xs">-</span>
                </td>
                <td class="p-3">
                  <router-link
                    :to="{
                      path: `/players/${encodeURIComponent(playerName)}/sessions`,
                      query: { map: map.mapName, server: serverGuid }
                    }"
                    class="text-slate-200 hover:text-cyan-400 transition-colors font-medium"
                  >
                    {{ map.mapName }}
                  </router-link>
                </td>
                <td class="p-3 text-right text-yellow-400 font-mono font-bold">
                  {{ map.totalScore.toLocaleString() }}
                </td>
                <td class="p-3 text-right text-green-400 font-mono font-bold">
                  {{ map.kdRatio.toFixed(2) }}
                </td>
                <td class="p-3 text-right text-red-400 font-mono">
                  {{ map.totalKills.toLocaleString() }}
                </td>
                <td class="p-3 text-right text-purple-400 font-mono">
                  {{ map.totalDeaths.toLocaleString() }}
                </td>
                <td class="p-3 text-right text-blue-400 font-mono">
                  {{ map.sessionsPlayed.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="space-y-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mx-auto text-slate-500"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <p class="text-slate-400 font-medium">
          No map statistics available for the selected time range
        </p>
        <p class="text-slate-500 text-sm">
          Try selecting a different time period
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { calculateKDR, getRankClass } from '@/utils/statsUtils';
import { formatPlayTime } from '@/utils/timeUtils';
import { PLAYER_STATS_TIME_RANGE_OPTIONS } from '@/utils/constants';
import { fetchPlayerMapRankings, type PlayerMapRankingsResponse, type GameType } from '../services/dataExplorerService';

interface MapStat {
  mapName: string;
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
  sessionsPlayed: number;
  totalPlayTimeMinutes: number;
  rank: number | null;
  kdRatio: number;
}

const props = defineProps<{
  playerName: string;
  serverGuid: string;
  game?: GameType;
}>();

const playerData = ref<PlayerMapRankingsResponse | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const sortField = ref<'mapName' | 'totalScore' | 'kdRatio' | 'totalKills' | 'totalDeaths' | 'sessionsPlayed' | 'rank'>('totalScore');
const sortDirection = ref<'asc' | 'desc'>('desc');

const selectedTimeRange = ref<number>(60);
const timeRangeOptions = PLAYER_STATS_TIME_RANGE_OPTIONS;

// Flatten mapGroups into a single array of map stats for this server
// Since we're filtering by serverGuid in the API, each mapGroup should only have one serverStat
const mapStats = computed<MapStat[]>(() => {
  if (!playerData.value) return [];

  return playerData.value.mapGroups
    .map(mapGroup => {
      // With server filtering, there should only be one serverStat per mapGroup
      const serverStat = mapGroup.serverStats[0];
      
      if (!serverStat) return null;

      return {
        mapName: mapGroup.mapName,
        totalScore: serverStat.totalScore,
        totalKills: serverStat.totalKills,
        totalDeaths: serverStat.totalDeaths,
        sessionsPlayed: serverStat.totalRounds,
        totalPlayTimeMinutes: 0, // Not available in PlayerMapRankingsResponse
        rank: serverStat.rank,
        kdRatio: serverStat.kdRatio
      };
    })
    .filter((stat): stat is MapStat => stat !== null);
});

const sortedMapStats = computed(() => {
  if (!mapStats.value || mapStats.value.length === 0) return [];

  return [...mapStats.value].sort((a, b) => {
    const direction = sortDirection.value === 'asc' ? 1 : -1;

    switch (sortField.value) {
      case 'mapName':
        return direction * a.mapName.localeCompare(b.mapName);
      case 'totalScore':
        return direction * (a.totalScore - b.totalScore);
      case 'kdRatio':
        return direction * (a.kdRatio - b.kdRatio);
      case 'totalKills':
        return direction * (a.totalKills - b.totalKills);
      case 'totalDeaths':
        return direction * (a.totalDeaths - b.totalDeaths);
      case 'sessionsPlayed':
        return direction * (a.sessionsPlayed - b.sessionsPlayed);
      case 'rank': {
        // Handle null ranks (put them at the end)
        if (a.rank === null && b.rank === null) return 0;
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return direction * (a.rank - b.rank);
      }
      default:
        return direction * (a.totalScore - b.totalScore);
    }
  });
});

const changeSort = (field: typeof sortField.value) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = field === 'rank' ? 'asc' : 'desc'; // Rank defaults to ascending
  }
};


const loadData = async (days?: number) => {
  if (!props.playerName || !props.serverGuid) return;

  const timeRange = days || selectedTimeRange.value;
  isLoading.value = true;
  error.value = null;

  try {
    // Pass serverGuid to filter on the server side
    playerData.value = await fetchPlayerMapRankings(
      props.playerName,
      props.game || 'bf1942',
      timeRange,
      props.serverGuid
    );

    // Check if player has any stats on this server
    if (playerData.value.mapGroups.length === 0) {
      error.value = `No statistics found for this player on this server for the selected time period`;
    }
  } catch (err: any) {
    console.error('Error fetching map rankings:', err);
    if (err.message === 'PLAYER_NOT_FOUND') {
      error.value = `No statistics found for this player on this server for the selected time period`;
    } else {
      error.value = 'Failed to load map statistics';
    }
    playerData.value = null;
  } finally {
    isLoading.value = false;
  }
};

const changeTimeRange = (days: number) => {
  selectedTimeRange.value = days;
  loadData(days);
};

onMounted(() => loadData());
watch(() => props.playerName, () => loadData());
watch(() => props.serverGuid, () => loadData());
</script>
