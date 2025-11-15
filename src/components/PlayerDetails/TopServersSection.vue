<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { PlayerTimeStatistics } from '../../services/playerStatsService';

import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';
import defaultIcon from '@/assets/servers.webp';

// Props
interface Props {
  playerName: string;
  playerStats: PlayerTimeStatistics | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  openMapModal: [serverGuid: string];
}>();

// State for map stats modal
const showMapModal = ref(false);
const selectedServerGuid = ref<string | null>(null);
const selectedTimeRange = ref('Last30Days');
const mapStats = ref<any[]>([]);
const mapStatsLoading = ref(false);
const mapStatsSortField = ref('totalScore');
const mapStatsSortDirection = ref('desc');

const timeRangeOptions = [
  { value: 'Last30Days', label: '30 days' },
  { value: 'ThisYear', label: 'This Year' },
  { value: 'LastYear', label: 'Past Year' }
];

// Game icons mapping
const gameIcons: { [key: string]: string } = {
  bf1942: bf1942Icon,
  fh2: fh2Icon,
  bfv: bfvIcon,
};

const getGameIcon = (gameId: string): string => {
  if (!gameId) return defaultIcon;
  return gameIcons[gameId.toLowerCase()] || defaultIcon;
};

// Format minutes to hours and minutes
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

// Format date to a human-readable relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } else if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Fetch map stats
const fetchMapStats = async (serverGuid: string) => {
  mapStatsLoading.value = true;
  try {
    const response = await fetch(`/stats/players/${encodeURIComponent(props.playerName)}/server/${serverGuid}/mapstats?range=${selectedTimeRange.value}`);
    if (!response.ok) throw new Error('Failed to fetch map stats');
    const newData = await response.json();

    // Only update data after successful fetch to prevent flash
    mapStats.value = newData;
  } catch (err) {
    console.error('Error fetching map stats:', err);
    // Only clear on error if no existing data
    if (mapStats.value.length === 0) {
      mapStats.value = [];
    }
  } finally {
    mapStatsLoading.value = false;
  }
};

// Function to open map modal
const openMapModal = async (serverGuid: string) => {
  selectedServerGuid.value = serverGuid;
  showMapModal.value = true;
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
  await fetchMapStats(serverGuid);
};

// Function to close map modal
const closeMapModal = () => {
  showMapModal.value = false;
  selectedServerGuid.value = null;
  // Restore body scrolling when modal is closed
  document.body.style.overflow = 'unset';
};

// Function to change map stats sorting
const changeMapStatsSort = (field: string) => {
  if (mapStatsSortField.value === field) {
    // Toggle direction if clicking the same field
    mapStatsSortDirection.value = mapStatsSortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new field and default to descending
    mapStatsSortField.value = field;
    mapStatsSortDirection.value = 'desc';
  }
};

// Computed property to sort map stats
const sortedMapStats = computed(() => {
  if (!mapStats.value) return [];

  return [...mapStats.value].sort((a, b) => {
    const direction = mapStatsSortDirection.value === 'asc' ? 1 : -1;

    switch (mapStatsSortField.value) {
      case 'mapName':
        return direction * a.mapName.localeCompare(b.mapName);
      case 'totalScore':
        return direction * (a.totalScore - b.totalScore);
      case 'kdRatio': {
        const aKdr = a.totalDeaths === 0 ? a.totalKills : a.totalKills / a.totalDeaths;
        const bKdr = b.totalDeaths === 0 ? b.totalKills : b.totalKills / b.totalDeaths;
        return direction * (aKdr - bKdr);
      }
      case 'totalKills':
        return direction * (a.totalKills - b.totalKills);
      case 'totalDeaths':
        return direction * (a.totalDeaths - b.totalDeaths);
      case 'sessionsPlayed':
        return direction * (a.sessionsPlayed - b.sessionsPlayed);
      case 'totalPlayTimeMinutes':
        return direction * (a.totalPlayTimeMinutes - b.totalPlayTimeMinutes);
      default:
        return direction * (a.totalScore - b.totalScore);
    }
  });
});

// Computed property to get the selected server's name for modal
const selectedServerName = computed(() => {
  if (!selectedServerGuid.value || !props.playerStats?.insights?.serverRankings) return null;

  const server = props.playerStats.insights.serverRankings.find(
    (ranking: any) => ranking.serverGuid === selectedServerGuid.value
  );

  return server?.serverName || null;
});

// Server cards computed
const hasServers = computed(() => !!props.playerStats?.servers && props.playerStats.servers.length > 0);
const sortedServers = computed(() => {
  if (!props.playerStats?.servers) return [];
  // Sort by totalMinutes descending
  return [...props.playerStats.servers].sort((a, b) => b.totalMinutes - a.totalMinutes);
});

// Watch for time range changes
watch(selectedTimeRange, async () => {
  if (selectedServerGuid.value) {
    await fetchMapStats(selectedServerGuid.value);
  }
});
</script>

<template>
  <!-- Top Servers Section -->
  <div class="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 mt-8">
    <!-- Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
    <div class="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />

    <div class="relative z-10 p-8 space-y-6">
      <!-- Section Header -->
      <div class="space-y-2">
        <h3 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          🎮 Favorite Battlegrounds
        </h3>
        <p class="text-slate-400">
          Your most active server destinations
        </p>
      </div>

      <!-- Server Cards Grid -->
      <div
        v-if="hasServers"
        class="w-full"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
          <div
            v-for="server in sortedServers"
            :key="server.serverGuid"
            class="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
          >
            <!-- Card Background Effects -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div class="relative z-10 p-3 sm:p-6 space-y-3 sm:space-y-4">
              <!-- Server Header -->
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-2 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    <img
                      :src="getGameIcon(server.gameId)"
                      alt="Server"
                      class="w-full h-full rounded object-cover"
                    >
                  </div>
                </div>

                <div class="flex-1 min-w-0 space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <router-link
                      :to="`/servers/${encodeURIComponent(server.serverName)}`"
                      class="group/link font-bold text-white hover:text-cyan-400 transition-colors duration-200 line-clamp-2 leading-tight"
                      :title="`View server details for ${server.serverName}`"
                    >
                      {{ server.serverName }}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="inline ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </router-link>
                    <span class="flex-shrink-0 px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
                      {{ server.gameId.toUpperCase() }}
                    </span>
                  </div>

                  <!-- Quick Stats Bar -->
                  <div class="flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-1">
                      <div class="w-2 h-2 bg-green-400 rounded-full" />
                      <span class="text-green-400 font-medium">{{ server.kdRatio.toFixed(2) }} K/D</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-2 h-2 bg-blue-400 rounded-full" />
                      <span class="text-blue-400 font-medium">{{ server.totalRounds }} rounds</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-2 h-2 bg-purple-400 rounded-full" />
                      <span class="text-purple-400 font-medium">{{ server.killsPerMinute.toFixed(2) }} KPM</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed Stats Grid -->
              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                <!-- Best Score -->
                <div class="space-y-1">
                  <p class="text-xs text-slate-400 font-medium">
                    Best Score
                  </p>
                  <router-link
                    v-if="server.highestScoreRoundId"
                    class="group/score inline-flex items-center gap-1 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent hover:from-yellow-300 hover:to-orange-300 transition-all duration-200"
                    :to="{
                      name: 'round-report',
                      params: {
                        roundId: server.highestScoreRoundId
                      },
                      query: {
                        players: playerName
                      }
                    }"
                    :title="`View round report for best score on ${server.highestScoreMapName || server.mapName} (${formatRelativeTime((server.highestScoreStartTime || server.bestScoreDate) ?? '')})`"
                  >
                    {{ server.highestScore?.toLocaleString() }}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="opacity-0 group-hover/score:opacity-100 transition-opacity text-orange-400"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </router-link>
                  <span
                    v-else
                    class="text-lg font-bold text-white"
                  >
                    {{ server.highestScore?.toLocaleString() }}
                  </span>
                </div>

                <!-- KPM -->
                <div class="space-y-1">
                  <p class="text-xs text-slate-400 font-medium">
                    Kills/Min
                  </p>
                  <p class="text-lg font-bold text-cyan-400">
                    {{ server.killsPerMinute.toFixed(2) }}
                  </p>
                </div>

                <!-- Combat Stats -->
                <div class="space-y-1">
                  <p class="text-xs text-slate-400 font-medium">
                    Combat
                  </p>
                  <div class="flex items-center gap-2 text-sm font-bold">
                    <span class="text-green-400">{{ server.totalKills }}</span>
                    <span class="text-slate-500">/</span>
                    <span class="text-red-400">{{ server.totalDeaths }}</span>
                  </div>
                </div>

                <!-- Play Time -->
                <div class="space-y-1">
                  <p class="text-xs text-slate-400 font-medium">
                    Time Played
                  </p>
                  <p class="text-lg font-bold text-purple-400">
                    {{ formatPlayTime(Math.round(server.totalMinutes)) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Server Rankings within Favorite Battlegrounds -->
    <div
      v-if="playerStats?.insights?.serverRankings && playerStats.insights.serverRankings.length > 0"
      class="relative z-10 px-8 pb-8 pt-4 space-y-6"
    >
      <!-- Server Rankings Header -->
      <div class="space-y-2">
        <h4 class="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent flex items-center gap-3">
          🏅 Server Rankings
        </h4>
        <p class="text-slate-400">
          Your competitive standings across servers
        </p>
      </div>

      <!-- Server Rankings Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <div
          v-for="(ranking, index) in playerStats.insights.serverRankings"
          :key="ranking.serverGuid"
          class="group relative overflow-hidden rounded-2xl"
          :class="{
            'bg-gradient-to-br from-yellow-500/20 via-amber-600/30 to-yellow-700/20 border-2 border-yellow-500/40 shadow-xl shadow-yellow-500/20': ranking.rank === 1,
            'bg-gradient-to-br from-slate-400/20 via-slate-500/30 to-slate-600/20 border-2 border-slate-400/40 shadow-xl shadow-slate-400/20': ranking.rank === 2,
            'bg-gradient-to-br from-orange-600/20 via-amber-700/30 to-orange-800/20 border-2 border-orange-600/40 shadow-xl shadow-orange-600/20': ranking.rank === 3,
            'bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-black/80 border-2 border-slate-700/50 shadow-xl shadow-slate-900/30': ranking.rank > 3
          }"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <!-- Animated Background Particles -->
          <div class="absolute inset-0 overflow-hidden">
            <div
              class="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-xl opacity-30 animate-pulse"
              :class="{
                'bg-yellow-400': ranking.rank === 1,
                'bg-slate-400': ranking.rank === 2,
                'bg-orange-500': ranking.rank === 3,
                'bg-purple-500': ranking.rank > 3
              }"
            />
            <div
              class="absolute -bottom-8 -left-8 w-16 h-16 rounded-full blur-lg opacity-20 animate-pulse delay-700"
              :class="{
                'bg-yellow-300': ranking.rank === 1,
                'bg-slate-300': ranking.rank === 2,
                'bg-orange-400': ranking.rank === 3,
                'bg-purple-400': ranking.rank > 3
              }"
            />
          </div>

          <!-- Trophy Icon for Top 3 -->
          <div
            v-if="ranking.rank <= 3"
            class="absolute top-4 right-4 z-20 animate-bounce"
            style="animation-duration: 2s"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              :class="{
                'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900': ranking.rank === 1,
                'bg-gradient-to-br from-slate-400 to-slate-600 text-slate-900': ranking.rank === 2,
                'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-900': ranking.rank === 3
              }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>

          <div class="relative z-10 p-8 h-full flex flex-col">
            <!-- Rank Badge - More Prominent -->
            <div class="text-center">
              <div class="relative inline-block">
                <div class="flex items-baseline justify-center gap-2">
                  <div
                    class="text-6xl font-black leading-none"
                    :class="{
                      'text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600': ranking.rank === 1,
                      'text-transparent bg-clip-text bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500': ranking.rank === 2,
                      'text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600': ranking.rank === 3,
                      'text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400': ranking.rank > 3
                    }"
                  >
                    #{{ ranking.rank }}
                  </div>
                  <div
                    class="text-lg font-semibold opacity-80 mt-4"
                    :class="{
                      'text-yellow-300': ranking.rank === 1,
                      'text-slate-300': ranking.rank === 2,
                      'text-orange-300': ranking.rank === 3,
                      'text-purple-300': ranking.rank > 3
                    }"
                  >
                    of {{ ranking.totalRankedPlayers }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Server Name -->
            <div class="space-y-3 flex-grow">
              <router-link
                :to="`/servers/${encodeURIComponent(ranking.serverName)}`"
                class="group/link block"
                :title="`View server details for ${ranking.serverName}`"
              >
                <h5
                  class="text-xl font-bold text-white group-hover/link:text-transparent group-hover/link:bg-clip-text transition-all duration-300 leading-tight"
                  :class="{
                    'group-hover/link:bg-gradient-to-r group-hover/link:from-yellow-300 group-hover/link:to-yellow-500': ranking.rank === 1,
                    'group-hover/link:bg-gradient-to-r group-hover/link:from-slate-300 group-hover/link:to-slate-500': ranking.rank === 2,
                    'group-hover/link:bg-gradient-to-r group-hover/link:from-orange-300 group-hover/link:to-orange-500': ranking.rank === 3,
                    'group-hover/link:bg-gradient-to-r group-hover/link:from-purple-300 group-hover/link:to-pink-400': ranking.rank > 3
                  }"
                >
                  {{ ranking.serverName }}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="inline ml-2 opacity-0 group-hover/link:opacity-100 transition-opacity transform group-hover/link:translate-x-1"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </h5>
              </router-link>
            </div>

            <!-- Ping Display -->
            <div class="text-center space-y-3">
              <div class="text-xs uppercase tracking-widest font-bold opacity-60">
                AVERAGE PING
              </div>
              <div class="flex items-center justify-center gap-2">
                <div
                  v-if="ranking.averagePing > 0"
                  class="w-2 h-2 rounded-full animate-pulse"
                  :class="{
                    'bg-green-400': ranking.averagePing < 50,
                    'bg-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                    'bg-red-400': ranking.averagePing >= 100
                  }"
                />
                <div
                  class="text-2xl font-black"
                  :class="ranking.averagePing > 0 ? {
                    'text-green-400': ranking.averagePing < 50,
                    'text-yellow-400': ranking.averagePing >= 50 && ranking.averagePing < 100,
                    'text-red-400': ranking.averagePing >= 100
                  } : 'text-slate-600 opacity-50'"
                >
                  <template v-if="ranking.averagePing > 0">
                    {{ ranking.averagePing }}<span class="text-base opacity-60">ms</span>
                  </template>
                  <template v-else>
                    –
                  </template>
                </div>
              </div>
            </div>


            <!-- Action Buttons - VIEW MAPS and VIEW RANKINGS -->
            <div class="mt-auto pt-6 space-y-3">
              <!-- View Rankings Link -->
              <router-link
                :to="`/servers/${encodeURIComponent(ranking.serverName)}/rankings`"
                class="block w-full px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform hover:scale-105 active:scale-95 text-center"
                :class="{
                  'bg-gradient-to-r from-yellow-600/30 to-yellow-700/30 border border-yellow-500/50 text-yellow-200 hover:from-yellow-600/40 hover:to-yellow-700/40 hover:border-yellow-400/60 shadow-lg shadow-yellow-500/15': ranking.rank === 1,
                  'bg-gradient-to-r from-slate-600/30 to-slate-700/30 border border-slate-500/50 text-slate-200 hover:from-slate-600/40 hover:to-slate-700/40 hover:border-slate-400/60 shadow-lg shadow-slate-500/15': ranking.rank === 2,
                  'bg-gradient-to-r from-orange-600/30 to-orange-700/30 border border-orange-500/50 text-orange-200 hover:from-orange-600/40 hover:to-orange-700/40 hover:border-orange-400/60 shadow-lg shadow-orange-500/15': ranking.rank === 3,
                  'bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-slate-600/50 text-slate-200 hover:from-slate-700/70 hover:to-slate-800/70 hover:border-slate-500/60 shadow-lg shadow-slate-900/30': ranking.rank > 3
                }"
              >
                <div class="flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform group-hover:rotate-12"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect
                      x="8"
                      y="2"
                      width="8"
                      height="4"
                      rx="1"
                      ry="1"
                    />
                    <path d="m9 14 2 2 4-4" />
                  </svg>
                  View Rankings
                </div>
              </router-link>

              <!-- View Maps Button -->
              <button
                class="w-full px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform hover:scale-105 active:scale-95"
                :class="{
                  'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-300 hover:from-yellow-500/30 hover:to-yellow-600/30 hover:border-yellow-400/50 shadow-lg shadow-yellow-500/10': ranking.rank === 1,
                  'bg-gradient-to-r from-slate-500/20 to-slate-600/20 border border-slate-500/30 text-slate-300 hover:from-slate-500/30 hover:to-slate-600/30 hover:border-slate-400/50 shadow-lg shadow-slate-500/10': ranking.rank === 2,
                  'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 text-orange-300 hover:from-orange-500/30 hover:to-orange-600/30 hover:border-orange-400/50 shadow-lg shadow-orange-500/10': ranking.rank === 3,
                  'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/30 text-slate-300 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/50 shadow-lg shadow-slate-900/20': ranking.rank > 3
                }"
                @click="openMapModal(ranking.serverGuid)"
              >
                <div class="flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform group-hover:rotate-12"
                  >
                    <path d="M9 19c-5 0-8-3-8-7s3-7 8-7 8 3 8 7-3 7-8 7" />
                    <path d="m13.5 10.5 2.5-2.5" />
                    <path d="m13.5 13.5 2.5 2.5" />
                  </svg>
                  View Maps
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Map Statistics Modal -->
  <div
    v-if="showMapModal"
    class="modal-mobile-safe fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-0 p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
    @click.self="closeMapModal"
  >
    <div class="relative w-full max-w-7xl max-h-[calc(100vh-4rem)] sm:max-h-[90vh] bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      <!-- Modal Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80 gap-4">
        <div class="space-y-1">
          <h3 class="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            🗺️ Map Performance
          </h3>
          <p class="text-slate-400 text-sm">
            {{ selectedServerName || 'Selected Server' }}
          </p>
        </div>
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Time Range Selector -->
          <div class="flex flex-wrap gap-1 sm:gap-2">
            <button
              v-for="option in timeRangeOptions"
              :key="option.value"
              :class="[
                'px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
                selectedTimeRange === option.value
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
              ]"
              @click="selectedTimeRange = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <!-- Close Button -->
          <button
            class="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-all duration-200 border border-slate-600"
            @click="closeMapModal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="p-3 sm:p-6 overflow-auto max-h-[calc(100vh-8rem)] sm:max-h-[calc(90vh-120px)]">
        <div
          v-if="mapStats.length === 0 && mapStatsLoading"
          class="flex flex-col items-center justify-center p-12 space-y-4"
        >
          <div class="relative">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-600" />
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-amber-500 absolute top-0" />
          </div>
          <p class="text-slate-400 font-medium">
            Loading map statistics...
          </p>
        </div>

        <div
          v-else-if="mapStats.length > 0"
          class="relative overflow-hidden"
        >
          <!-- Loading Overlay for time range changes -->
          <div
            v-if="mapStatsLoading"
            class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20 transition-all duration-200"
          >
            <div class="flex items-center gap-3 px-4 py-2 bg-slate-800/90 rounded-lg border border-slate-700">
              <div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span class="text-amber-400 font-medium text-sm">Updating...</span>
            </div>
          </div>
          <!-- Map Stats Table -->
          <div class="overflow-x-auto -mx-3 sm:mx-0">
            <table class="w-full border-collapse min-w-[600px] sm:min-w-[800px]">
              <!-- Table Header -->
              <thead class="sticky top-0 z-10">
                <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-amber-500/50"
                    @click="changeMapStatsSort('mapName')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-amber-400 text-xs sm:text-sm">🗺️</span>
                      <span class="font-mono font-bold">MAP</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-amber-400 opacity-100': mapStatsSortField === 'mapName',
                          'opacity-50': mapStatsSortField !== 'mapName',
                          'rotate-0': mapStatsSortField === 'mapName' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'mapName' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-yellow-500/50"
                    @click="changeMapStatsSort('totalScore')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-yellow-400 text-xs sm:text-sm">🏆</span>
                      <span class="font-mono font-bold">SCORE</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-yellow-400 opacity-100': mapStatsSortField === 'totalScore',
                          'opacity-50': mapStatsSortField !== 'totalScore',
                          'rotate-0': mapStatsSortField === 'totalScore' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalScore' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-green-500/50"
                    @click="changeMapStatsSort('kdRatio')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-green-400 text-xs sm:text-sm">⚔️</span>
                      <span class="font-mono font-bold">K/D</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-green-400 opacity-100': mapStatsSortField === 'kdRatio',
                          'opacity-50': mapStatsSortField !== 'kdRatio',
                          'rotate-0': mapStatsSortField === 'kdRatio' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'kdRatio' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-red-500/50"
                    @click="changeMapStatsSort('totalKills')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-red-400 text-xs sm:text-sm">🎯</span>
                      <span class="font-mono font-bold">KILLS</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-red-400 opacity-100': mapStatsSortField === 'totalKills',
                          'opacity-50': mapStatsSortField !== 'totalKills',
                          'rotate-0': mapStatsSortField === 'totalKills' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalKills' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-purple-500/50"
                    @click="changeMapStatsSort('totalDeaths')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-purple-400 text-xs sm:text-sm">💀</span>
                      <span class="font-mono font-bold">DEATHS</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-purple-400 opacity-100': mapStatsSortField === 'totalDeaths',
                          'opacity-50': mapStatsSortField !== 'totalDeaths',
                          'rotate-0': mapStatsSortField === 'totalDeaths' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalDeaths' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-blue-500/50"
                    @click="changeMapStatsSort('sessionsPlayed')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-blue-400 text-xs sm:text-sm">🎮</span>
                      <span class="font-mono font-bold">SESSIONS</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-blue-400 opacity-100': mapStatsSortField === 'sessionsPlayed',
                          'opacity-50': mapStatsSortField !== 'sessionsPlayed',
                          'rotate-0': mapStatsSortField === 'sessionsPlayed' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'sessionsPlayed' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    class="group p-2 sm:p-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/50 hover:border-cyan-500/50"
                    @click="changeMapStatsSort('totalPlayTimeMinutes')"
                  >
                    <div class="flex items-center gap-1 sm:gap-2">
                      <span class="text-cyan-400 text-xs sm:text-sm">⏱️</span>
                      <span class="font-mono font-bold">TIME</span>
                      <span
                        class="text-xs sm:text-sm transition-transform duration-200"
                        :class="{
                          'text-cyan-400 opacity-100': mapStatsSortField === 'totalPlayTimeMinutes',
                          'opacity-50': mapStatsSortField !== 'totalPlayTimeMinutes',
                          'rotate-0': mapStatsSortField === 'totalPlayTimeMinutes' && mapStatsSortDirection === 'asc',
                          'rotate-180': mapStatsSortField === 'totalPlayTimeMinutes' && mapStatsSortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody>
                <tr
                  v-for="(map, mapIndex) in sortedMapStats"
                  :key="mapIndex"
                  class="group transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-800/40 hover:to-slate-900/40 border-b border-slate-800/50 hover:border-slate-700/50 hover:shadow-lg"
                >
                  <!-- Map Name -->
                  <td class="p-2 sm:p-3">
                    <router-link
                      :to="{
                        path: `/players/${encodeURIComponent(playerName)}/sessions`,
                        query: {
                          map: map.mapName,
                          ...(selectedServerName && { server: selectedServerName })
                        }
                      }"
                      class="block group-hover:text-amber-400 transition-all duration-300 no-underline"
                    >
                      <div class="font-bold text-slate-200 truncate max-w-xs text-sm sm:text-base">
                        {{ map.mapName }}
                      </div>
                    </router-link>
                  </td>

                  <!-- Score -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-yellow-400">
                      {{ (map.totalScore || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- K/D Ratio -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-green-400">
                      {{ calculateKDR(map.totalKills, map.totalDeaths) }}
                    </div>
                  </td>

                  <!-- Kills -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-red-400">
                      {{ (map.totalKills || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- Deaths -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-purple-400">
                      {{ (map.totalDeaths || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- Sessions -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-blue-400">
                      {{ (map.sessionsPlayed || 0).toLocaleString() }}
                    </div>
                  </td>

                  <!-- Play Time -->
                  <td class="p-2 sm:p-3">
                    <div class="font-mono text-sm sm:text-base font-bold text-cyan-400">
                      {{ formatPlayTime(map.totalPlayTimeMinutes || 0) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-else
          class="text-center py-12"
        >
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
    </div>
  </div>
</template>

<style scoped>
/* Line clamp utility for text truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
