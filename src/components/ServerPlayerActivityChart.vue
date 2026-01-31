<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import CombinedPlayerPingChart from './CombinedPlayerPingChart.vue';
import type { ServerInsights } from '../services/serverDetailsService';

const $route = useRoute();


const props = defineProps<{
  serverInsights: ServerInsights | null;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  'period-change': [period: number];
}>();

const pingMetric = ref<'median' | 'p95'>('median');
const selectedPeriod = ref<'1d' | '3d' | '7d' | 'longer'>('1d');
const longerPeriod = ref<'1month' | '3months' | 'thisyear' | 'alltime'>('1month');
const showLongerDropdown = ref(false);

// Maps table sorting
const mapsSortField = ref('totalPlayTime');
const mapsSortDirection = ref('desc');

// Convert period identifiers to integers for API calls
const getPeriodDays = (period: string): number => {
  switch (period) {
    case '1d': return 1;
    case '3d': return 3;
    case '7d': return 7;
    case '1month': return 30;
    case '3months': return 90;
    case 'thisyear': return 365;
    case 'alltime': return 3650; // 10 years
    default: return 7;
  }
};

const getCurrentPeriod = () => {
  return selectedPeriod.value === 'longer' ? longerPeriod.value : selectedPeriod.value;
};

const getCurrentPeriodForAPI = (): number => {
  const currentPeriod = getCurrentPeriod();
  return getPeriodDays(currentPeriod);
};


// Calculate max and median values for player count
const playerCountStats = computed(() => {
  if (!props.serverInsights?.playerCountSummary) {
    return { max: 0, median: 0 };
  }

  const summary = props.serverInsights.playerCountSummary;
  return { 
    max: summary.peakPlayerCount, 
    median: Math.round(summary.averagePlayerCount) 
  };
});






// Toggle ping metric between median and p95
const togglePingMetric = () => {
  pingMetric.value = pingMetric.value === 'median' ? 'p95' : 'median';
};


// Handle period change for short periods
const changePeriod = (period: '1d' | '3d' | '7d') => {
  selectedPeriod.value = period;
  showLongerDropdown.value = false;
  emit('period-change', getCurrentPeriodForAPI());
};

// Handle longer period selection
const selectLongerPeriod = (period: '1month' | '3months' | 'thisyear' | 'alltime') => {
  longerPeriod.value = period;
  selectedPeriod.value = 'longer';
  showLongerDropdown.value = false;
  emit('period-change', getCurrentPeriodForAPI());
};

// Toggle longer dropdown
const toggleLongerDropdown = () => {
  showLongerDropdown.value = !showLongerDropdown.value;
};

// Get label for longer period button
const getLongerPeriodLabel = () => {
  if (selectedPeriod.value !== 'longer') return 'More';
  const labels = {
    '1month': '1 Month',
    '3months': '3 Months',
    'thisyear': 'This Year',
    'alltime': 'All Time'
  };
  return labels[longerPeriod.value];
};

// Maps table sorting
const sortMapsBy = (field: string) => {
  if (mapsSortField.value === field) {
    mapsSortDirection.value = mapsSortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    mapsSortField.value = field;
    // Default sorting directions
    if (field === 'totalPlayTime') {
      mapsSortDirection.value = 'desc';
    } else {
      mapsSortDirection.value = 'asc';
    }
  }
};

// Sorted maps for the table
const sortedMaps = computed(() => {
  const maps = props.serverInsights?.maps || [];
  if (maps.length === 0) return [];
  
  return [...maps].sort((a, b) => {
    let aVal, bVal;
    
    switch (mapsSortField.value) {
      case 'mapName':
        aVal = a.mapName.toLowerCase();
        bVal = b.mapName.toLowerCase();
        break;
      case 'averagePlayerCount':
        aVal = a.averagePlayerCount;
        bVal = b.averagePlayerCount;
        break;
      case 'peakPlayerCount':
        aVal = a.peakPlayerCount;
        bVal = b.peakPlayerCount;
        break;
      case 'totalPlayTime':
        aVal = a.totalPlayTime;
        bVal = b.totalPlayTime;
        break;
      case 'playTimePercentage':
        aVal = a.playTimePercentage;
        bVal = b.playTimePercentage;
        break;
      default:
        aVal = a.totalPlayTime;
        bVal = b.totalPlayTime;
    }
    
    if (mapsSortDirection.value === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
});

// Helper function to format play time in hours
const formatPlayTimeHours = (minutes: number): string => {
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
};

// Close dropdown on outside click

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

const handleOutsideClick = (e: Event) => {
  const target = e.target as Element;
  if (!target.closest('.relative')) {
    showLongerDropdown.value = false;
  }
};
</script>

<template>
  <div
    class="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
  >
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div class="relative z-10 space-y-6">
      <!-- Header with Period Controls -->
      <div class="p-8 pb-4 space-y-6">
        <!-- Title and Controls -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="space-y-2">
            <h4 class="text-2xl font-bold text-cyan-400">
              {{ serverInsights?.pingByHour?.data?.length > 0 ? 'Player Activity & Connection Analysis' : 'Player Activity Analysis' }}{{ (serverInsights?.maps && serverInsights.maps.length > 0) ? ' • Map Analytics' : '' }}
            </h4>
            <p class="text-slate-400 text-sm">
              Player count trends{{ serverInsights?.playerCountHistoryComparison?.length > 0 ? ' with period comparison' : '' }}{{ serverInsights?.pingByHour?.data?.length > 0 ? ' and ping analysis' : '' }}{{ (serverInsights?.maps && serverInsights.maps.length > 0) ? ' • Map analytics for the selected time period' : '' }}
            </p>
          </div>
          
          <!-- Action Controls -->
          <div class="flex items-center gap-3 flex-wrap">
            <!-- Ping Metric Toggle -->
            <button
              v-if="serverInsights?.pingByHour?.data?.length > 0"
              class="group/metric inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 bg-slate-700/50 hover:bg-cyan-500/20 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 rounded-lg transition-all duration-300"
              :title="`Switch to ${pingMetric === 'median' ? 'P95' : 'Median'} ping`"
              @click="togglePingMetric"
            >
              <span class="text-xs">📡</span>
              <span>{{ pingMetric === 'median' ? 'Median' : 'P95' }} Ping</span>
            </button>
          </div>
        </div>
        
        <!-- Period Selection Filters (matching LandingPageV2) -->
        <div class="flex justify-center gap-1 bg-slate-800/30 rounded-lg p-1">
          <!-- Short periods -->
          <button
            v-for="period in ['1d', '3d', '7d']"
            :key="period"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 relative',
              selectedPeriod === period
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
              props.isLoading ? 'opacity-60 cursor-not-allowed' : ''
            ]"
            :disabled="props.isLoading"
            @click="changePeriod(period as '1d' | '3d' | '7d')"
          >
            <div
              v-if="selectedPeriod === period && props.isLoading"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="w-3 h-3 border border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
            <span :class="{ 'opacity-0': selectedPeriod === period && props.isLoading }">
              {{ period === '1d' ? '24h' : period === '3d' ? '3 days' : '7 days' }}
            </span>
          </button>

          <!-- Longer periods dropdown -->
          <div class="relative">
            <button
              :class="[
                'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 relative',
                selectedPeriod === 'longer'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                props.isLoading ? 'opacity-60 cursor-not-allowed' : ''
              ]"
              :disabled="props.isLoading"
              @click="toggleLongerDropdown"
            >
              <div
                v-if="selectedPeriod === 'longer' && props.isLoading"
                class="w-3 h-3 border border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mr-1"
              />
              <span :class="{ 'opacity-0': selectedPeriod === 'longer' && props.isLoading }">
                {{ getLongerPeriodLabel() }}
              </span>
              <svg
                class="w-3 h-3"
                :class="{ 'opacity-0': selectedPeriod === 'longer' && props.isLoading }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="showLongerDropdown"
              class="absolute top-full mt-1 right-0 bg-slate-800/95 backdrop-blur-lg rounded-lg border border-slate-700/50 shadow-xl z-50 min-w-[120px]"
            >
              <button
                v-for="period in [{ id: '1month', label: '1 Month' }, { id: '3months', label: '3 Months' }, { id: 'thisyear', label: 'This Year' }, { id: 'alltime', label: 'All Time' }]"
                :key="period.id"
                :class="[
                  'w-full text-left px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg',
                  longerPeriod === period.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300'
                ]"
                @click="selectLongerPeriod(period.id as '1month' | '3months' | 'thisyear' | 'alltime')"
              >
                {{ period.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats Cards (only show if we have data) -->
      <div
        v-if="serverInsights?.playerCountHistory && serverInsights.playerCountHistory.length > 0"
        class="px-8"
      >
        <div class="relative">
          <!-- Loading Overlay for Stats -->
          <div
            v-if="props.isLoading"
            class="absolute inset-0 bg-slate-800/30 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
          >
            <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>

          <!-- Compact Stats Bar -->
          <div class="bg-slate-800/20 rounded-lg p-3 border border-slate-700/30">
            <div class="flex items-center justify-between gap-6 text-sm">
              <!-- Peak Players -->
              <div class="flex items-center gap-2">
                <span class="text-green-400">🔥</span>
                <span class="text-slate-400 font-medium">Peak:</span>
                <span class="text-white font-bold">{{ playerCountStats.max }}</span>
              </div>

              <!-- Median Players -->
              <div class="flex items-center gap-2">
                <span class="text-blue-400">📊</span>
                <span class="text-slate-400 font-medium">Median:</span>
                <span class="text-white font-bold">{{ playerCountStats.median }}</span>
              </div>

              <!-- Period Comparison (with detailed tooltip) -->
              <div
                v-if="serverInsights?.playerCountSummary?.changePercentFromPreviousPeriod && serverInsights.playerCountSummary.changePercentFromPreviousPeriod !== 0"
                class="flex items-center gap-2 relative group/tooltip cursor-pointer hover:bg-slate-700/20 rounded-md px-2 py-1 transition-all duration-200"
              >
                <span
                  :class="{
                    'text-green-400': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0,
                    'text-red-400': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0
                  }"
                >
                  {{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0 ? '📈' : '📉' }}
                </span>
                <span class="text-slate-400 font-medium">vs Previous:</span>
                <span
                  class="font-bold"
                  :class="{
                    'text-green-300': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0,
                    'text-red-300': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0
                  }"
                >
                  {{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0 ? '+' : '' }}{{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod }}%
                </span>

                <!-- Info Icon with Animation -->
                <div class="relative">
                  <div class="w-4 h-4 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40 group-hover/tooltip:border-cyan-400/60 transition-all duration-200">
                    <span class="text-[10px] text-cyan-400 font-bold group-hover/tooltip:text-cyan-300">ℹ</span>
                  </div>
                  <!-- Subtle pulse animation to draw attention -->
                  <div class="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping opacity-75 group-hover/tooltip:opacity-0" />
                </div>

                <!-- Hint Text -->
                <span class="text-xs text-slate-500 opacity-60 group-hover/tooltip:opacity-100 transition-opacity duration-200">
                  hover for details
                </span>

                <!-- Detailed Tooltip -->
                <div class="absolute bottom-full mb-2 right-0 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                  <div class="bg-slate-800/95 backdrop-blur-lg rounded-lg border border-slate-700/50 p-3 shadow-xl min-w-[300px]">
                    <div class="space-y-2 text-xs">
                      <div class="text-cyan-400 font-semibold border-b border-slate-700/50 pb-1">
                        Period Comparison Details
                      </div>
                      <div class="space-y-1">
                        <div class="flex justify-between">
                          <span class="text-slate-400">Current Period Avg:</span>
                          <span class="text-white font-mono">{{ Math.round(serverInsights.playerCountSummary.averagePlayerCount) }} players</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-400">Previous Period Avg:</span>
                          <span class="text-slate-300 font-mono">
                            {{ Math.round(serverInsights.playerCountSummary.averagePlayerCount / (1 + serverInsights.playerCountSummary.changePercentFromPreviousPeriod / 100)) }} players
                          </span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-400">Absolute Change:</span>
                          <span
                            class="font-mono"
                            :class="{
                              'text-green-300': serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0,
                              'text-red-300': serverInsights.playerCountSummary.changePercentFromPreviousPeriod < 0
                            }"
                          >
                            {{ serverInsights.playerCountSummary.changePercentFromPreviousPeriod > 0 ? '+' : '' }}{{ Math.round(serverInsights.playerCountSummary.averagePlayerCount - (serverInsights.playerCountSummary.averagePlayerCount / (1 + serverInsights.playerCountSummary.changePercentFromPreviousPeriod / 100))) }} players
                          </span>
                        </div>
                        <div class="pt-1 border-t border-slate-700/50 text-slate-500">
                          Comparison based on average player count over equivalent time periods. Hover for methodology details.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Container (only show if we have data) -->
      <div
        v-if="serverInsights?.playerCountHistory && serverInsights.playerCountHistory.length > 0"
        class="px-8 pb-6"
      >
        <div class="relative h-64 bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
          <!-- Loading Overlay -->
          <div
            v-if="props.isLoading"
            class="absolute inset-0 bg-slate-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
          >
            <div class="flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <div class="text-cyan-400 text-sm font-medium">
                Updating chart...
              </div>
            </div>
          </div>

          <CombinedPlayerPingChart
            :server-insights="serverInsights"
            :ping-metric="pingMetric"
          />
        </div>
      </div>

      <!-- No Data State -->
      <div
        v-if="!serverInsights?.playerCountHistory || serverInsights.playerCountHistory.length === 0"
        class="px-8 pb-6"
      >
        <div class="bg-slate-800/30 rounded-xl p-8 text-center border border-slate-700/50">
          <div class="text-6xl mb-4 opacity-50">
            📊
          </div>
          <p class="text-slate-400 text-lg mb-2">
            No player activity data available
          </p>
          <p class="text-slate-500 text-sm">
            Try selecting a different time period or check back later
          </p>
        </div>
      </div>

      <!-- Maps Analytics Table Section -->
      <div
        v-if="sortedMaps.length > 0"
        class="mx-8 mb-8"
      >
        <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-xl border border-slate-700/50 overflow-hidden relative">
          <!-- Loading Overlay for Maps Analytics -->
          <div
            v-if="props.isLoading"
            class="absolute inset-0 bg-slate-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
          >
            <div class="flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
              <div class="text-orange-400 text-sm font-medium">
                Updating map analytics...
              </div>
            </div>
          </div>
          <div class="p-4 border-b border-slate-700/50">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-lg">
                🗺️
              </div>
              <h5 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                Map Analytics
              </h5>
              <div class="text-xs text-slate-500 bg-slate-700/30 px-2 py-1 rounded-md">
                {{ sortedMaps.length }} maps
              </div>
            </div>
            <p class="text-slate-400 text-sm">
              All maps played during the selected time period - click column headers to sort
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <!-- Table Header -->
              <thead class="sticky top-0 z-10">
                <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                  <th
                    class="group p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50"
                    @click="sortMapsBy('mapName')"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-orange-400 text-xs">🗺️</span>
                      <span class="font-mono font-bold">MAP NAME</span>
                      <span
                        class="text-xs transition-transform duration-200"
                        :class="{
                          'text-orange-400 opacity-100': mapsSortField === 'mapName',
                          'opacity-50': mapsSortField !== 'mapName',
                          'rotate-0': mapsSortField === 'mapName' && mapsSortDirection === 'asc',
                          'rotate-180': mapsSortField === 'mapName' && mapsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50"
                    @click="sortMapsBy('totalPlayTime')"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-cyan-400 text-xs">⏱️</span>
                      <span class="font-mono font-bold">TOTAL HOURS</span>
                      <span
                        class="text-xs transition-transform duration-200"
                        :class="{
                          'text-cyan-400 opacity-100': mapsSortField === 'totalPlayTime',
                          'opacity-50': mapsSortField !== 'totalPlayTime',
                          'rotate-0': mapsSortField === 'totalPlayTime' && mapsSortDirection === 'asc',
                          'rotate-180': mapsSortField === 'totalPlayTime' && mapsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-purple-500/50"
                    @click="sortMapsBy('playTimePercentage')"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-purple-400 text-xs">📊</span>
                      <span class="font-mono font-bold">% PLAYTIME</span>
                      <span
                        class="text-xs transition-transform duration-200"
                        :class="{
                          'text-purple-400 opacity-100': mapsSortField === 'playTimePercentage',
                          'opacity-50': mapsSortField !== 'playTimePercentage',
                          'rotate-0': mapsSortField === 'playTimePercentage' && mapsSortDirection === 'asc',
                          'rotate-180': mapsSortField === 'playTimePercentage' && mapsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-green-500/50"
                    @click="sortMapsBy('averagePlayerCount')"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-green-400 text-xs">👥</span>
                      <span class="font-mono font-bold">AVG PLAYERS</span>
                      <span
                        class="text-xs transition-transform duration-200"
                        :class="{
                          'text-green-400 opacity-100': mapsSortField === 'averagePlayerCount',
                          'opacity-50': mapsSortField !== 'averagePlayerCount',
                          'rotate-0': mapsSortField === 'averagePlayerCount' && mapsSortDirection === 'asc',
                          'rotate-180': mapsSortField === 'averagePlayerCount' && mapsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-yellow-500/50"
                    @click="sortMapsBy('peakPlayerCount')"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-yellow-400 text-xs">🔥</span>
                      <span class="font-mono font-bold">PEAK PLAYERS</span>
                      <span
                        class="text-xs transition-transform duration-200"
                        :class="{
                          'text-yellow-400 opacity-100': mapsSortField === 'peakPlayerCount',
                          'opacity-50': mapsSortField !== 'peakPlayerCount',
                          'rotate-0': mapsSortField === 'peakPlayerCount' && mapsSortDirection === 'asc',
                          'rotate-180': mapsSortField === 'peakPlayerCount' && mapsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                </tr>
              </thead>
              
              <!-- Table Body -->
              <tbody>
                <tr
                  v-for="(map, index) in sortedMaps"
                  :key="map.mapName"
                  class="group transition-all duration-300 hover:bg-slate-800/20 border-b border-slate-700/30"
                >
                  <!-- Map Name -->
                  <td class="p-3">
                    <router-link 
                      :to="`/servers/${encodeURIComponent($route.params.serverName)}/sessions?mapName=${encodeURIComponent(map.mapName)}`"
                      class="font-bold text-slate-200 hover:text-cyan-400 text-sm capitalize transition-colors duration-200 cursor-pointer hover:underline"
                      :title="`View all sessions for ${map.mapName.replace(/_/g, ' ')}`"
                    >
                      {{ map.mapName.replace(/_/g, ' ') }}
                    </router-link>
                  </td>
                  
                  <!-- Total Hours -->
                  <td class="p-3">
                    <div class="font-bold text-cyan-400 text-sm font-mono">
                      {{ formatPlayTimeHours(map.totalPlayTime) }}
                    </div>
                  </td>
                  
                  <!-- Percentage with Progress Bar -->
                  <td class="p-3">
                    <div class="flex items-center gap-3">
                      <div class="font-bold text-purple-400 text-sm font-mono min-w-0">
                        {{ map.playTimePercentage.toFixed(1) }}%
                      </div>
                      <div class="flex-1 max-w-[100px]">
                        <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            class="h-full transition-all duration-500 rounded-full" 
                            :style="{ 
                              width: map.playTimePercentage + '%', 
                              backgroundColor: '#a855f7',
                              boxShadow: '0 0 6px #a855f760'
                            }"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <!-- Average Players -->
                  <td class="p-3">
                    <div class="font-bold text-green-400 text-sm font-mono">
                      {{ Math.round(map.averagePlayerCount) }}
                    </div>
                  </td>
                  
                  <!-- Peak Players -->
                  <td class="p-3">
                    <div class="font-bold text-yellow-400 text-sm font-mono">
                      {{ map.peakPlayerCount }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations for enhanced visual effects */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Override default line chart styles for better integration */
:deep(.chart-container canvas) {
  border-radius: 0.75rem;
}
</style> 