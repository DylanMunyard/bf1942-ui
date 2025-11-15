<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  PlayerTimeStatistics,
  SimilarPlayersResponse,
  PlayerComparisonStats,
  fetchSimilarPlayers
} from '../../services/playerStatsService';

// Props
const props = defineProps<{
  playerName: string;
  playerStats: PlayerTimeStatistics | null;
}>();

// State
const similarPlayersData = ref<SimilarPlayersResponse | null>(null);
const loadingSimilarPlayers = ref(false);
const similarPlayersError = ref<string | null>(null);
const similarSectionExpanded = ref(false);
const detectionMode = ref<'default' | 'aliasdetection'>('default');
const showOnlyComparable = ref(false);
const expandedPlayerCards = ref<Set<number>>(new Set());

// Computed properties
const targetPlayerStats = computed(() => similarPlayersData.value?.targetPlayerStats || null);
const similarPlayers = computed(() => similarPlayersData.value?.similarPlayers || []);

// Functions
const loadSimilarPlayers = async () => {
  loadingSimilarPlayers.value = true;
  similarPlayersError.value = null;
  try {
    similarPlayersData.value = await fetchSimilarPlayers(props.playerName, detectionMode.value);
  } catch (err: any) {
    console.error('Error loading similar players:', err);
    similarPlayersError.value = err.message || 'Failed to load similar players.';
  } finally {
    loadingSimilarPlayers.value = false;
  }
};

const toggleSimilarPlayersSection = async () => {
  similarSectionExpanded.value = !similarSectionExpanded.value;
  if (similarSectionExpanded.value && !similarPlayersData.value && !loadingSimilarPlayers.value) {
    await loadSimilarPlayers();
  }
};

const setDetectionMode = async (mode: 'default' | 'aliasdetection') => {
  detectionMode.value = mode;
  if (similarSectionExpanded.value) {
    await loadSimilarPlayers();
  }
};

const togglePlayerCard = (index: number) => {
  if (expandedPlayerCards.value.has(index)) {
    expandedPlayerCards.value.delete(index);
  } else {
    expandedPlayerCards.value.add(index);
  }
};

const isPlayerCardExpanded = (index: number) => {
  return expandedPlayerCards.value.has(index);
};

// Helper functions
const getCommonServers = (player1: PlayerComparisonStats, player2: PlayerComparisonStats): string[] => {
  const servers1 = Object.keys(player1.serverPings);
  const servers2 = Object.keys(player2.serverPings);
  return servers1.filter(server => servers2.includes(server));
};

const getCommonMaps = (player1: PlayerComparisonStats, player2: PlayerComparisonStats): string[] => {
  const maps1 = Object.keys(player1.mapDominanceScores);
  const maps2 = Object.keys(player2.mapDominanceScores);
  return maps1.filter(map => maps2.includes(map));
};

const getCommonOnlineHours = (player1: PlayerComparisonStats, player2: PlayerComparisonStats): number[] => {
  // Convert both players' UTC hours to local hours for comparison
  const convertUTCToLocal = (utcHours: number[]): number[] => {
    const today = new Date();
    return utcHours.map(utcHour => {
      const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), utcHour, 0, 0));
      return utcDate.getHours();
    });
  };

  const player1LocalHours = convertUTCToLocal(player1.typicalOnlineHours);
  const player2LocalHours = convertUTCToLocal(player2.typicalOnlineHours);

  // Find common local hours and remove duplicates
  const commonHours = player1LocalHours.filter(hour => player2LocalHours.includes(hour));
  return [...new Set(commonHours)];
};

const formatOnlineHours = (hours: number[]): string => {
  // Convert UTC hours to local hours
  const localHours = hours.map(utcHour => {
    // Create a UTC date with today's date and the UTC hour
    const today = new Date();
    const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), utcHour, 0, 0));

    // Convert to local time and extract the local hour
    return utcDate.getHours();
  });

  // Remove duplicates and sort
  const uniqueLocalHours = [...new Set(localHours)].sort((a, b) => a - b);

  return uniqueLocalHours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ');
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};

const similarityColor = (score: number): string => {
  if (score >= 0.8) return '#4CAF50'; // green
  if (score >= 0.6) return '#FFC107'; // amber
  return '#F44336'; // red
};
</script>

<template>
  <!-- Player Comparison & Analysis Section -->
  <div
    v-if="playerStats"
    class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8"
  >
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5" />
    <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl" />
    <div class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl" />

    <div class="relative z-10 p-8 space-y-6">
      <!-- Section Header -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 cursor-pointer group p-2 -m-2 rounded-xl hover:bg-slate-800/30 transition-all duration-300"
        @click="toggleSimilarPlayersSection"
      >
        <div class="space-y-2">
          <h3 class="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:via-blue-300 group-hover:to-purple-300 transition-all duration-300">
            🔍 Player Intelligence & Analysis
          </h3>
          <p class="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
            Advanced behavioral pattern recognition and player comparison
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-slate-400 group-hover:text-cyan-400 transition-colors duration-300 font-medium">
            {{ similarSectionExpanded ? '▲ Collapse' : '▼ Expand' }}
          </div>
          <div
            v-if="!similarSectionExpanded"
            class="hidden lg:block text-sm text-slate-500 italic group-hover:text-slate-400 transition-colors duration-300"
          >
            Click to find players like {{ playerName }}
          </div>
        </div>
      </div>
      <div
        v-if="similarSectionExpanded"
        class="space-y-6"
      >
        <!-- Detection Mode Selector -->
        <div class="p-1 bg-slate-800/40 rounded-xl border border-slate-600/50 backdrop-blur-sm">
          <div class="flex rounded-lg overflow-hidden">
            <button
              :class="[
                'flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold transition-all duration-300 ease-out',
                detectionMode === 'default'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-white hover:shadow-md'
              ]"
              @click="setDetectionMode('default')"
            >
              <span class="text-xl">👥</span>
              <span class="hidden sm:inline">Similar Players</span>
              <span class="sm:hidden">Similar</span>
            </button>
            <button
              :class="[
                'flex-1 flex items-center justify-center gap-3 px-6 py-4 font-semibold transition-all duration-300 ease-out',
                detectionMode === 'aliasdetection'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-white hover:shadow-md'
              ]"
              @click="setDetectionMode('aliasdetection')"
            >
              <span class="text-xl">🔍</span>
              <span class="hidden sm:inline">Find Aliases</span>
              <span class="sm:hidden">Aliases</span>
            </button>
          </div>
        </div>

        <!-- Filter Controls -->
        <div
          v-if="similarPlayers.length > 0 && targetPlayerStats"
          class="p-4 bg-slate-800/40 rounded-xl border border-slate-600/50 backdrop-blur-sm"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-slate-300">🔧 Filters</span>
              <div class="h-4 w-px bg-slate-600" />
            </div>
            <label class="flex items-center gap-3 cursor-pointer group">
              <span class="text-sm font-medium text-slate-300 group-hover:text-cyan-400 transition-colors">
                Show only comparable data
              </span>
              <div class="relative">
                <input
                  v-model="showOnlyComparable"
                  type="checkbox"
                  class="sr-only"
                >
                <div
                  :class="[
                    'relative w-11 h-6 rounded-full border transition-all duration-300 ease-out',
                    showOnlyComparable
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400 shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-700 border-slate-600'
                  ]"
                >
                  <div
                    :class="[
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-out',
                      showOnlyComparable ? 'transform translate-x-5' : 'transform translate-x-0'
                    ]"
                  />
                </div>
              </div>
            </label>
          </div>
        </div>

        <div
          v-if="loadingSimilarPlayers"
          class="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-xl border border-slate-600/50 backdrop-blur-sm"
        >
          <div class="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p class="text-slate-300 font-medium animate-pulse">
            Loading similar players...
          </p>
        </div>
        <div
          v-else-if="similarPlayersError"
          class="p-6 bg-red-500/10 border border-red-400/50 rounded-xl backdrop-blur-sm"
        >
          <p class="text-red-300 font-medium flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            {{ similarPlayersError }}
          </p>
        </div>
        <div
          v-else-if="similarPlayers.length > 0 && targetPlayerStats"
          class="space-y-4"
        >
          <!-- Comparison cards for each similar player -->
          <div
            v-for="(similarPlayer, idx) in similarPlayers"
            :key="idx"
            :class="[
              'group relative overflow-hidden rounded-xl border transition-all duration-500 ease-out',
              'bg-gradient-to-br from-slate-800/70 via-slate-800/50 to-slate-900/50 backdrop-blur-md',
              'border-slate-600/50 hover:border-cyan-400/60',
              'shadow-lg hover:shadow-xl hover:shadow-cyan-500/10',
              isPlayerCardExpanded(idx)
                ? 'ring-2 ring-cyan-400/50 shadow-xl shadow-cyan-500/20 transform scale-[1.01]'
                : 'hover:transform hover:scale-[1.005]'
            ]"
          >
            <!-- Animated background gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div
              class="relative p-6 cursor-pointer"
              @click="togglePlayerCard(idx)"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex-1">
                  <h4 class="text-lg font-bold text-cyan-400 mb-1">
                    {{ targetPlayerStats.playerName }}
                  </h4>
                  <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Target Player</span>
                </div>

                <div class="flex items-center gap-4 mx-6">
                  <span class="text-slate-400 font-bold text-2xl">VS</span>
                  <div
                    class="px-3 py-1.5 rounded-full text-white font-bold text-sm shadow-lg border border-white/20"
                    :style="{ backgroundColor: similarityColor(similarPlayer.similarityScore) }"
                  >
                    {{ (similarPlayer.similarityScore * 100).toFixed(0) }}%
                  </div>
                </div>

                <div class="flex-1 text-right">
                  <router-link
                    :to="{ name: 'player-comparison', query: { player1: playerName, player2: similarPlayer.playerName } }"
                    class="text-lg font-bold text-white hover:text-cyan-300 transition-colors duration-200 block mb-1"
                    @click.stop
                  >
                    {{ similarPlayer.playerName }}
                  </router-link>
                  <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {{ detectionMode === 'aliasdetection' ? 'Potential Alias' : 'Similar Player' }}
                  </span>
                </div>
              </div>

              <!-- Compact stats summary when collapsed -->
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 mb-4">
                <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                  <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">K/D Ratio</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-cyan-400">{{ targetPlayerStats.killDeathRatio.toFixed(2) }}</span>
                    <span class="text-xs text-slate-500">vs</span>
                    <span class="text-sm font-bold text-slate-200">{{ similarPlayer.killDeathRatio.toFixed(2) }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                  <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Kills/Min</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-cyan-400">{{ targetPlayerStats.killsPerMinute.toFixed(2) }}</span>
                    <span class="text-xs text-slate-500">vs</span>
                    <span class="text-sm font-bold text-slate-200">{{ similarPlayer.killsPerMinute.toFixed(2) }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                  <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Server Match</span>
                  <span
                    :class="[
                      'text-sm font-bold',
                      targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName
                        ? 'text-green-400'
                        : 'text-orange-400'
                    ]"
                  >
                    {{ targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName ? '✓ Same' : '✗ Different' }}
                  </span>
                </div>
                <div class="flex flex-col items-center p-3 bg-slate-700/40 rounded-lg border border-slate-600/30">
                  <span class="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Common Servers</span>
                  <span class="text-sm font-bold text-purple-400">
                    {{ getCommonServers(targetPlayerStats, similarPlayer).length }}
                  </span>
                </div>
              </div>

              <!-- Key similarity reasons - always show top 2 -->
              <div class="mb-4">
                <div class="flex flex-wrap gap-2 mb-3">
                  <div
                    v-for="(reason, rIdx) in similarPlayer.similarityReasons.slice(0, 2)"
                    :key="rIdx"
                    class="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-xs font-medium text-cyan-300"
                  >
                    {{ reason }}
                  </div>
                  <div
                    v-if="similarPlayer.similarityReasons.length > 2"
                    class="px-3 py-1.5 bg-slate-600/30 border border-slate-500/40 rounded-full text-xs font-medium text-slate-400"
                  >
                    +{{ similarPlayer.similarityReasons.length - 2 }} more
                  </div>
                </div>
              </div>

              <!-- Expand/collapse indicator -->
              <div class="flex items-center justify-between pt-2 border-t border-slate-600/30">
                <span class="text-xs text-slate-400">
                  {{ isPlayerCardExpanded(idx) ? 'Click to collapse detailed analysis' : 'Click for detailed comparison' }}
                </span>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span class="text-slate-400 text-lg">{{ isPlayerCardExpanded(idx) ? '▲' : '▼' }}</span>
                </div>
              </div>
            </div>

            <!-- Detailed comparison stats - only show when expanded -->
            <div
              v-if="isPlayerCardExpanded(idx)"
              class="border-t border-slate-600/30 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/30 rounded-b-xl"
            >
              <!-- Advanced Performance Analytics -->
              <div class="p-6 space-y-8">
                <div class="relative">
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span class="text-white text-sm font-bold">📊</span>
                    </div>
                    <h5 class="text-lg font-bold text-slate-200">
                      Performance Analytics
                    </h5>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="relative overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/40 p-6 rounded-xl border border-slate-600/40 hover:shadow-lg transition-all duration-300">
                      <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
                      <div class="relative">
                        <span class="text-xs font-medium text-slate-400 mb-2 block uppercase tracking-widest">Kill/Death Performance</span>
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-2xl font-bold text-cyan-400">{{ targetPlayerStats.killDeathRatio.toFixed(2) }}</span>
                          <div class="text-slate-400 px-2">
                            VS
                          </div>
                          <span class="text-2xl font-bold text-slate-200">{{ similarPlayer.killDeathRatio.toFixed(2) }}</span>
                        </div>
                        <div class="flex items-center justify-center">
                          <div
                            :class="[
                              'px-3 py-1 rounded-full text-xs font-bold',
                              targetPlayerStats.killDeathRatio > similarPlayer.killDeathRatio
                                ? 'bg-green-500/20 text-green-400'
                                : targetPlayerStats.killDeathRatio < similarPlayer.killDeathRatio
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                            ]"
                          >
                            {{ targetPlayerStats.killDeathRatio > similarPlayer.killDeathRatio ? '↑ Better' :
                              targetPlayerStats.killDeathRatio < similarPlayer.killDeathRatio ? '↓ Lower' : '≈ Equal' }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="relative overflow-hidden bg-gradient-to-br from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30 hover:shadow-lg transition-all duration-300">
                      <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
                      <div class="relative">
                        <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Killing Efficiency</span>
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-2xl font-bold text-bf-primary">{{ targetPlayerStats.killsPerMinute.toFixed(2) }}</span>
                          <div class="text-bf-text-muted px-2">
                            VS
                          </div>
                          <span class="text-2xl font-bold text-white">{{ similarPlayer.killsPerMinute.toFixed(2) }}</span>
                        </div>
                        <div class="flex items-center justify-center">
                          <div
                            :class="[
                              'px-3 py-1 rounded-full text-xs font-bold',
                              targetPlayerStats.killsPerMinute > similarPlayer.killsPerMinute
                                ? 'bg-green-500/20 text-green-400'
                                : targetPlayerStats.killsPerMinute < similarPlayer.killsPerMinute
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                            ]"
                          >
                            {{ targetPlayerStats.killsPerMinute > similarPlayer.killsPerMinute ? '↑ Faster' :
                              targetPlayerStats.killsPerMinute < similarPlayer.killsPerMinute ? '↓ Slower' : '≈ Equal' }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="relative overflow-hidden bg-gradient-to-br from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30 hover:shadow-lg transition-all duration-300">
                      <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
                      <div class="relative">
                        <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Experience Level</span>
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-lg font-bold text-bf-primary">{{ formatPlayTime(targetPlayerStats.totalPlayTimeMinutes) }}</span>
                          <div class="text-bf-text-muted px-2">
                            VS
                          </div>
                          <span class="text-lg font-bold text-white">{{ formatPlayTime(similarPlayer.totalPlayTimeMinutes) }}</span>
                        </div>
                        <div class="flex items-center justify-center">
                          <div
                            :class="[
                              'px-3 py-1 rounded-full text-xs font-bold',
                              targetPlayerStats.totalPlayTimeMinutes > similarPlayer.totalPlayTimeMinutes
                                ? 'bg-blue-500/20 text-blue-400'
                                : targetPlayerStats.totalPlayTimeMinutes < similarPlayer.totalPlayTimeMinutes
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                            ]"
                          >
                            {{ targetPlayerStats.totalPlayTimeMinutes > similarPlayer.totalPlayTimeMinutes ? '↑ More' :
                              targetPlayerStats.totalPlayTimeMinutes < similarPlayer.totalPlayTimeMinutes ? '↓ Less' : '≈ Similar' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Server Intelligence Analysis -->
                <div
                  v-if="!showOnlyComparable || getCommonServers(targetPlayerStats, similarPlayer).length > 0"
                  class="relative"
                >
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span class="text-white text-sm font-bold">🌐</span>
                    </div>
                    <h5 class="text-lg font-bold text-bf-heading">
                      Server Intelligence & Geography
                    </h5>
                  </div>

                  <!-- Favorite Server Comparison -->
                  <div class="bg-gradient-to-r from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30 mb-6">
                    <div class="grid grid-cols-2 gap-6">
                      <div class="text-center">
                        <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Favorite Server</span>
                        <div
                          class="text-bf-primary font-bold text-lg truncate"
                          :title="targetPlayerStats.favoriteServerName"
                        >
                          {{ targetPlayerStats.favoriteServerName }}
                        </div>
                      </div>
                      <div class="text-center">
                        <span class="text-xs font-medium text-bf-text-secondary mb-2 block uppercase tracking-widest">Their Favorite</span>
                        <div
                          class="text-white font-bold text-lg truncate"
                          :title="similarPlayer.favoriteServerName"
                        >
                          {{ similarPlayer.favoriteServerName }}
                        </div>
                      </div>
                    </div>
                    <div class="mt-4 text-center">
                      <div
                        :class="[
                          'inline-flex px-4 py-2 rounded-full text-sm font-bold',
                          targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        ]"
                      >
                        {{ targetPlayerStats.favoriteServerName === similarPlayer.favoriteServerName ? '🎯 Same Server!' : '🔄 Different Servers' }}
                      </div>
                    </div>
                  </div>

                  <!-- Common Servers Network Analysis -->
                  <div
                    v-if="getCommonServers(targetPlayerStats, similarPlayer).length > 0"
                    class="space-y-4"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <h6 class="text-bf-text-primary font-semibold">
                        Shared Server Network ({{ getCommonServers(targetPlayerStats, similarPlayer).length }})
                      </h6>
                      <div class="text-xs px-3 py-1 bg-bf-primary/20 text-bf-primary rounded-full">
                        {{ getCommonServers(targetPlayerStats, similarPlayer).length === 1 ? 'Single Connection' : 'Multi-Node Network' }}
                      </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div
                        v-for="server in getCommonServers(targetPlayerStats, similarPlayer).slice(0, 4)"
                        :key="server"
                        class="relative overflow-hidden bg-gradient-to-br from-bf-card-bg/50 to-bf-card-bg/30 p-4 rounded-xl border border-bf-border/30"
                      >
                        <div class="flex items-center justify-between mb-3">
                          <div
                            class="font-medium text-bf-text-primary text-sm truncate flex-1"
                            :title="server"
                          >
                            {{ server }}
                          </div>
                          <div class="ml-2 flex items-center gap-1">
                            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span class="text-xs text-bf-text-secondary">Active</span>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 text-center">
                          <div class="bg-bf-card-bg/40 p-3 rounded-lg">
                            <span class="text-xs text-bf-text-secondary block mb-1">Your Ping</span>
                            <span
                              :class="[
                                'font-bold text-lg',
                                targetPlayerStats.serverPings[server] <= 50 ? 'text-green-400' :
                                targetPlayerStats.serverPings[server] <= 100 ? 'text-yellow-400' : 'text-red-400'
                              ]"
                            >
                              {{ Math.round(targetPlayerStats.serverPings[server]) }}ms
                            </span>
                          </div>
                          <div class="bg-bf-card-bg/40 p-3 rounded-lg">
                            <span class="text-xs text-bf-text-secondary block mb-1">Their Ping</span>
                            <span
                              :class="[
                                'font-bold text-lg',
                                similarPlayer.serverPings[server] <= 50 ? 'text-green-400' :
                                similarPlayer.serverPings[server] <= 100 ? 'text-yellow-400' : 'text-red-400'
                              ]"
                            >
                              {{ Math.round(similarPlayer.serverPings[server]) }}ms
                            </span>
                          </div>
                        </div>

                        <div class="mt-3 text-center">
                          <div
                            :class="[
                              'inline-flex px-3 py-1 rounded-full text-xs font-medium',
                              Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 10
                                ? 'bg-green-500/20 text-green-400'
                                : Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 30
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                            ]"
                          >
                            {{ Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 10 ? '🎯 Similar Latency' :
                              Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]) <= 30 ? '⚠️ Moderate Diff' : '🌍 Geographic Diff' }}
                            ({{ Math.abs(targetPlayerStats.serverPings[server] - similarPlayer.serverPings[server]).toFixed(0) }}ms)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="getCommonServers(targetPlayerStats, similarPlayer).length > 4"
                      class="text-center p-4 bg-bf-card-bg/20 rounded-lg border border-bf-border/20"
                    >
                      <span class="text-sm text-bf-text-secondary">
                        🌐 +{{ getCommonServers(targetPlayerStats, similarPlayer).length - 4 }} additional servers in your shared network
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Battlefield Mastery Analysis -->
                <div
                  v-if="!showOnlyComparable || getCommonMaps(targetPlayerStats, similarPlayer).length > 0"
                  class="relative"
                >
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <span class="text-white text-sm font-bold">🗺️</span>
                    </div>
                    <h5 class="text-lg font-bold text-bf-heading">
                      Battlefield Mastery & Tactical Analysis
                    </h5>
                  </div>

                  <div
                    v-if="getCommonMaps(targetPlayerStats, similarPlayer).length > 0"
                    class="space-y-4"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <h6 class="text-bf-text-primary font-semibold">
                        Shared Combat Zones ({{ getCommonMaps(targetPlayerStats, similarPlayer).length }})
                      </h6>
                      <div class="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-full">
                        Tactical Intelligence
                      </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div
                        v-for="map in getCommonMaps(targetPlayerStats, similarPlayer).slice(0, 4)"
                        :key="map"
                        class="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-orange-500/5 p-5 rounded-xl border border-red-500/20 hover:shadow-lg transition-all duration-300"
                      >
                        <div class="absolute top-2 right-2">
                          <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        </div>

                        <div class="mb-4">
                          <h6 class="font-bold text-white text-lg mb-1">
                            {{ map }}
                          </h6>
                          <span class="text-xs text-bf-text-secondary uppercase tracking-wide">Battlefield Analysis</span>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mb-4">
                          <div class="text-center bg-bf-card-bg/30 p-3 rounded-lg">
                            <span class="text-xs text-bf-text-secondary block mb-1">Your Dominance</span>
                            <span class="text-xl font-bold text-bf-primary">
                              {{ targetPlayerStats.mapDominanceScores[map].toFixed(1) }}
                            </span>
                          </div>
                          <div class="text-center bg-bf-card-bg/30 p-3 rounded-lg">
                            <span class="text-xs text-bf-text-secondary block mb-1">Their Dominance</span>
                            <span class="text-xl font-bold text-white">
                              {{ similarPlayer.mapDominanceScores[map].toFixed(1) }}
                            </span>
                          </div>
                        </div>

                        <div class="text-center">
                          <div
                            :class="[
                              'inline-flex px-3 py-1.5 rounded-full text-xs font-bold',
                              targetPlayerStats.mapDominanceScores[map] > similarPlayer.mapDominanceScores[map]
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : targetPlayerStats.mapDominanceScores[map] < similarPlayer.mapDominanceScores[map]
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            ]"
                          >
                            {{ targetPlayerStats.mapDominanceScores[map] > similarPlayer.mapDominanceScores[map] ? '🎯 Superior Tactics' :
                              targetPlayerStats.mapDominanceScores[map] < similarPlayer.mapDominanceScores[map] ? '⚔️ They Excel Here' : '⚖️ Matched Skills' }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="getCommonMaps(targetPlayerStats, similarPlayer).length > 4"
                      class="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20"
                    >
                      <span class="text-sm text-red-400">
                        🗺️ +{{ getCommonMaps(targetPlayerStats, similarPlayer).length - 4 }} additional battlefields where you both have combat experience
                      </span>
                    </div>
                  </div>

                  <div
                    v-else-if="!showOnlyComparable"
                    class="text-center p-6 bg-bf-card-bg/20 rounded-lg border border-bf-border/20"
                  >
                    <span class="text-bf-text-secondary">🚫 No common battlefield experience detected</span>
                  </div>
                </div>

                <!-- Temporal Analysis Intelligence -->
                <div
                  v-if="!showOnlyComparable || getCommonOnlineHours(targetPlayerStats, similarPlayer).length > 0"
                  class="relative"
                >
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span class="text-white text-sm font-bold">⏰</span>
                    </div>
                    <h5 class="text-lg font-bold text-bf-heading">
                      Temporal Behavioral Analysis
                    </h5>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                    <!-- Common Activity Hours -->
                    <div
                      v-if="getCommonOnlineHours(targetPlayerStats, similarPlayer).length > 0"
                      class="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-6 rounded-xl border border-purple-500/20"
                    >
                      <div class="flex items-center justify-between mb-4">
                        <h6 class="font-semibold text-bf-text-primary">
                          Synchronized Activity
                        </h6>
                        <div class="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                          {{ getCommonOnlineHours(targetPlayerStats, similarPlayer).length }} hours overlap
                        </div>
                      </div>

                      <div class="bg-bf-card-bg/30 p-4 rounded-lg mb-4">
                        <div class="text-center">
                          <div class="text-lg font-bold text-purple-300 mb-1">
                            {{ formatOnlineHours(getCommonOnlineHours(targetPlayerStats, similarPlayer)) }}
                          </div>
                          <div class="text-xs text-bf-text-secondary uppercase tracking-wide">
                            Common Active Hours (Your Time)
                          </div>
                        </div>
                      </div>

                      <div
                        :class="[
                          'text-center px-3 py-2 rounded-lg text-sm font-medium',
                          getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 4
                            ? 'bg-green-500/20 text-green-400'
                            : getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 2
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        ]"
                      >
                        {{ getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 4 ? '🎯 High Synchronization' :
                          getCommonOnlineHours(targetPlayerStats, similarPlayer).length >= 2 ? '⚠️ Moderate Overlap' : '❌ Minimal Sync' }}
                      </div>
                    </div>

                    <!-- Temporal Overlap Metrics -->
                    <div class="bg-gradient-to-br from-bf-card-bg/40 to-bf-card-bg/20 p-6 rounded-xl border border-bf-border/30">
                      <h6 class="font-semibold text-bf-text-primary mb-4">
                        Behavioral Metrics
                      </h6>

                      <div class="space-y-4">
                        <div class="flex items-center justify-between p-3 bg-bf-card-bg/30 rounded-lg">
                          <span class="text-sm text-bf-text-secondary">Temporal Overlap</span>
                          <span class="font-bold text-bf-primary">{{ formatPlayTime(similarPlayer.temporalOverlapMinutes) }}</span>
                        </div>

                        <div class="flex items-center justify-between p-3 bg-bf-card-bg/30 rounded-lg">
                          <span class="text-sm text-bf-text-secondary">Pattern Similarity</span>
                          <div class="flex items-center gap-2">
                            <span
                              :class="[
                                'font-bold text-lg',
                                similarPlayer.temporalNonOverlapScore > 0.8 ? 'text-green-400' :
                                similarPlayer.temporalNonOverlapScore > 0.6 ? 'text-yellow-400' : 'text-red-400'
                              ]"
                            >
                              {{ (similarPlayer.temporalNonOverlapScore * 100).toFixed(0) }}%
                            </span>
                            <div
                              :class="[
                                'text-xs px-2 py-1 rounded-full',
                                similarPlayer.temporalNonOverlapScore > 0.8 ? 'bg-green-500/20 text-green-400' :
                                similarPlayer.temporalNonOverlapScore > 0.6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                              ]"
                            >
                              {{ similarPlayer.temporalNonOverlapScore > 0.8 ? 'High' :
                                similarPlayer.temporalNonOverlapScore > 0.6 ? 'Medium' : 'Low' }}
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
        </div>
        <div
          v-else
          class="text-center p-8 bg-slate-800/30 rounded-xl border border-slate-700/40 backdrop-blur-sm"
        >
          <div class="w-16 h-16 mx-auto mb-4 bg-slate-600/30 rounded-full flex items-center justify-center">
            <span class="text-2xl">🔍</span>
          </div>
          <p class="text-slate-300 font-medium">
            No similar players found.
          </p>
          <p class="text-sm text-slate-400 mt-1">
            Try adjusting your detection mode or filter settings.
          </p>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex items-center justify-center p-8"
  >
    <p class="text-bf-text-muted">
      No player statistics available.
    </p>
  </div>
</template>
