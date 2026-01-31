<script setup lang="ts">
import { ref, computed } from 'vue';
import { calculateKDR } from '@/utils/statsUtils';

interface PerformanceStats {
  score: number;
  kills: number;
  deaths: number;
}

interface MapPerformance {
  mapName: string;
  player1Totals: PerformanceStats;
  player2Totals: PerformanceStats;
}

interface Props {
  mapPerformance: MapPerformance[];
  player1Name: string;
  player2Name: string;
}

const props = defineProps<Props>();

const sortColumn = ref<string>('');
const sortDirection = ref<'asc' | 'desc'>('asc');
const showExtraColumns = ref(false);
const hideNoScores = ref(false);

const sortMapPerformance = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'desc';
  }
};

const sortedMapPerformance = computed(() => {
  if (!props.mapPerformance) {
    return [];
  }

  let maps = props.mapPerformance;
  
  // Filter out maps with no scores if hideNoScores is enabled
  if (hideNoScores.value) {
    maps = maps.filter(map => 
      map.player1Totals.score > 0 && map.player2Totals.score > 0
    );
  }

  if (!sortColumn.value) {
    return maps;
  }

  return [...maps].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortColumn.value) {
      case 'map':
        aValue = a.mapName;
        bValue = b.mapName;
        break;
      case 'p1-score':
        aValue = a.player1Totals.score;
        bValue = b.player1Totals.score;
        break;
      case 'p1-kills':
        aValue = a.player1Totals.kills;
        bValue = b.player1Totals.kills;
        break;
      case 'p1-deaths':
        aValue = a.player1Totals.deaths;
        bValue = b.player1Totals.deaths;
        break;
      case 'p1-kdr':
        aValue = parseFloat(calculateKDR(a.player1Totals.kills, a.player1Totals.deaths));
        bValue = parseFloat(calculateKDR(b.player1Totals.kills, b.player1Totals.deaths));
        break;
      case 'p2-score':
        aValue = a.player2Totals.score;
        bValue = b.player2Totals.score;
        break;
      case 'p2-kills':
        aValue = a.player2Totals.kills;
        bValue = b.player2Totals.kills;
        break;
      case 'p2-deaths':
        aValue = a.player2Totals.deaths;
        bValue = b.player2Totals.deaths;
        break;
      case 'p2-kdr':
        aValue = parseFloat(calculateKDR(a.player2Totals.kills, a.player2Totals.deaths));
        bValue = parseFloat(calculateKDR(b.player2Totals.kills, b.player2Totals.deaths));
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection.value === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const numA = Number(aValue);
    const numB = Number(bValue);
    return sortDirection.value === 'asc' ? numA - numB : numB - numA;
  });
});
</script>

<template>
  <div
    v-if="sortedMapPerformance.length > 0"
    class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
  >
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h3 class="text-2xl font-bold text-cyan-400 flex items-center gap-3">
          Map Performance
        </h3>
        <div class="flex items-center gap-3">
          <button 
            class="p-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300" 
            :title="hideNoScores ? 'Show all maps including those with no scores' : 'Hide maps where either player has no scores'"
            @click="hideNoScores = !hideNoScores"
          >
            {{ hideNoScores ? '👁️' : '👁️‍🗨️' }}
          </button>
          <button
            class="px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 font-medium text-sm"
            @click="showExtraColumns = !showExtraColumns"
          >
            {{ showExtraColumns ? 'Hide' : 'Show' }} Kills/Deaths
          </button>
        </div>
      </div>
    </div>
    <div class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <!-- Table Header -->
          <thead class="sticky top-0 z-10">
            <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
              <th 
                class="group p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-blue-500/50 min-w-[180px]"
                :class="{ 'text-blue-400': sortColumn === 'map' }"
                @click="sortMapPerformance('map')"
              >
                <div class="flex items-center gap-2">
                  <span class="text-blue-400 text-xs">🗺️</span>
                  <span class="font-mono font-bold">MAP</span>
                  <span
                    v-if="sortColumn === 'map'"
                    class="text-xs transition-transform duration-200"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              
              <!-- Player 1 Headers -->
              <th
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-cyan-400 border-b border-slate-700/30 bg-cyan-500/10 border-l-4 border-l-cyan-400/60"
                :colspan="showExtraColumns ? 4 : 2"
              >
                <div class="flex items-center justify-center gap-2">
                  <span class="font-mono font-bold text-sm">{{ player1Name }}</span>
                </div>
              </th>
              
              <!-- Player 2 Headers -->
              <th
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-orange-400 border-b border-slate-700/30 bg-orange-500/10 border-l-4 border-l-orange-400/60"
                :colspan="showExtraColumns ? 4 : 2"
              >
                <div class="flex items-center justify-center gap-2">
                  <span class="font-mono font-bold text-sm">{{ player2Name }}</span>
                </div>
              </th>
            </tr>
            <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
              <th class="p-2 border-b border-slate-700/30" />
              
              <!-- Player 1 Sub Headers -->
              <th 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5 border-l-4 border-l-cyan-400/60"
                :class="{ 'text-cyan-400': sortColumn === 'p1-score' }"
                @click="sortMapPerformance('p1-score')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>🎖️</span>
                  <span class="font-mono">SCORE</span>
                  <span
                    v-if="sortColumn === 'p1-score'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              <th
                v-if="showExtraColumns" 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5"
                :class="{ 'text-cyan-400': sortColumn === 'p1-kills' }"
                @click="sortMapPerformance('p1-kills')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>⚔️</span>
                  <span class="font-mono">K</span>
                  <span
                    v-if="sortColumn === 'p1-kills'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              <th
                v-if="showExtraColumns" 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5"
                :class="{ 'text-cyan-400': sortColumn === 'p1-deaths' }"
                @click="sortMapPerformance('p1-deaths')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>☠️</span>
                  <span class="font-mono">D</span>
                  <span
                    v-if="sortColumn === 'p1-deaths'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              <th 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5 border-r-4 border-r-cyan-400/60"
                :class="{ 'text-cyan-400': sortColumn === 'p1-kdr' }"
                @click="sortMapPerformance('p1-kdr')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>🎯</span>
                  <span class="font-mono">K/D</span>
                  <span
                    v-if="sortColumn === 'p1-kdr'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              
              <!-- Player 2 Sub Headers -->
              <th 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5 border-l-4 border-l-orange-400/60"
                :class="{ 'text-orange-400': sortColumn === 'p2-score' }"
                @click="sortMapPerformance('p2-score')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>🎖️</span>
                  <span class="font-mono">SCORE</span>
                  <span
                    v-if="sortColumn === 'p2-score'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              <th
                v-if="showExtraColumns" 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                :class="{ 'text-orange-400': sortColumn === 'p2-kills' }"
                @click="sortMapPerformance('p2-kills')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>⚔️</span>
                  <span class="font-mono">K</span>
                  <span
                    v-if="sortColumn === 'p2-kills'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              <th
                v-if="showExtraColumns" 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                :class="{ 'text-orange-400': sortColumn === 'p2-deaths' }"
                @click="sortMapPerformance('p2-deaths')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>☠️</span>
                  <span class="font-mono">D</span>
                  <span
                    v-if="sortColumn === 'p2-deaths'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
              <th 
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                :class="{ 'text-orange-400': sortColumn === 'p2-kdr' }"
                @click="sortMapPerformance('p2-kdr')"
              >
                <div class="flex items-center justify-center gap-1">
                  <span>🎯</span>
                  <span class="font-mono">K/D</span>
                  <span
                    v-if="sortColumn === 'p2-kdr'"
                    class="text-xs"
                    :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                  >▲</span>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody>
            <tr
              v-for="map in sortedMapPerformance"
              :key="map.mapName"
              class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/20"
            >
              <!-- Map Name -->
              <td class="p-2">
                <div class="font-bold text-blue-400 text-xs truncate max-w-[180px] font-mono uppercase">
                  {{ map.mapName }}
                </div>
              </td>

              <!-- Player 1 Stats -->
              <td class="p-2 text-center bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ map.player1Totals.score?.toLocaleString() }}
                </div>
              </td>
              <td
                v-if="showExtraColumns"
                class="p-2 text-center bg-cyan-500/5"
              >
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ map.player1Totals.kills?.toLocaleString() }}
                </div>
              </td>
              <td
                v-if="showExtraColumns"
                class="p-2 text-center bg-cyan-500/5"
              >
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ map.player1Totals.deaths?.toLocaleString() }}
                </div>
              </td>
              <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                <div
                  class="font-bold text-xs font-mono"
                  :class="{
                    'text-green-400': parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) > parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)),
                    'text-cyan-400': parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) <= parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths))
                  }"
                >
                  {{ calculateKDR(map.player1Totals.kills, map.player1Totals.deaths) }}
                </div>
              </td>

              <!-- Player 2 Stats -->
              <td class="p-2 text-center bg-orange-500/5 border-l-2 border-l-orange-400/40">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ map.player2Totals.score?.toLocaleString() }}
                </div>
              </td>
              <td
                v-if="showExtraColumns"
                class="p-2 text-center bg-orange-500/5"
              >
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ map.player2Totals.kills?.toLocaleString() }}
                </div>
              </td>
              <td
                v-if="showExtraColumns"
                class="p-2 text-center bg-orange-500/5"
              >
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ map.player2Totals.deaths?.toLocaleString() }}
                </div>
              </td>
              <td class="p-2 text-center bg-orange-500/5">
                <div
                  class="font-bold text-xs font-mono"
                  :class="{
                    'text-green-400': parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) > parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)),
                    'text-orange-400': parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) <= parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths))
                  }"
                >
                  {{ calculateKDR(map.player2Totals.kills, map.player2Totals.deaths) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
