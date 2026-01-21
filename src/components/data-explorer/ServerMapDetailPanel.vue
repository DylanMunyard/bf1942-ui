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
          <h2 class="text-2xl font-bold text-slate-200">{{ detail.mapName }}</h2>
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

      <!-- Win Stats -->
      <div class="bg-slate-800/30 rounded-lg p-4">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Win Statistics</h3>
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

        <!-- Loading Sessions State -->
        <div v-if="isLoadingSessions" class="bg-slate-800/30 rounded-lg p-6">
          <div class="flex items-center justify-center py-8">
            <div class="w-8 h-8 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        </div>

        <!-- Sessions Error State -->
        <div v-else-if="sessionsError" class="bg-slate-800/30 rounded-lg p-6">
          <div class="text-center py-4">
            <div class="text-red-400 mb-2">{{ sessionsError }}</div>
            <button @click="loadSessions" class="text-cyan-400 hover:text-cyan-300 text-sm">
              Try again
            </button>
          </div>
        </div>

        <!-- Sessions List -->
        <div v-else-if="sessions.length > 0" class="bg-slate-800/30 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-700/50">
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Map & Server
                  </th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Team Matchup
                  </th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Top Players
                  </th>
                  <th class="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Participants
                  </th>
                  <th class="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(session, index) in sessions"
                  :key="session.roundId"
                  class="group border-l-4 border-b border-slate-700/30 hover:bg-slate-800/40 transition-all duration-150 cursor-pointer border-l-cyan-400"
                  :class="session.isActive && index === 0 ? 'bg-emerald-500/5' : ''"
                >
                  <!-- Map & Server Column -->
                  <td class="py-4 px-4">
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm font-bold"
                          :class="session.isActive && index === 0 ? 'text-emerald-400' : getMapAccentColor(session.mapName)"
                        >
                          {{ session.mapName }}
                        </span>
                        <span
                          v-if="session.isActive && index === 0"
                          class="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide px-1.5 py-0.5 bg-emerald-500/20 rounded"
                        >
                          Live
                        </span>
                      </div>
                      <span class="text-xs text-slate-500 font-medium">
                        {{ session.serverName }} • {{ formatRelativeTime(session.startTime) }} ago
                      </span>
                    </div>
                  </td>

                  <!-- Team Matchup Column (hidden on mobile) -->
                  <td class="py-4 px-4 hidden md:table-cell">
                    <div
                      v-if="session.team1Label && session.team2Label && session.team1Points !== undefined && session.team2Points !== undefined"
                      class="space-y-1"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm font-semibold"
                          :class="getTeamColor(session.team1Label)"
                        >
                          {{ session.team1Label }}
                        </span>
                        <span class="font-mono text-sm font-bold text-slate-200">{{ session.team1Points }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm font-semibold"
                          :class="getTeamColor(session.team2Label)"
                        >
                          {{ session.team2Label }}
                        </span>
                        <span class="font-mono text-sm font-bold text-slate-200">{{ session.team2Points }}</span>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-sm text-slate-500"
                    >
                      —
                    </span>
                  </td>

                  <!-- Top Players Column -->
                  <td class="py-4 px-4">
                    <div
                      v-if="session.topPlayers && session.topPlayers.length > 0"
                      class="space-y-1.5"
                    >
                      <div
                        v-for="(player, playerIdx) in session.topPlayers.slice(0, 3)"
                        :key="playerIdx"
                        class="text-xs rounded-lg px-2.5 py-1.5 transition-all duration-200"
                      >
                        <div class="flex items-center gap-2">
                          <span
                            class="font-bold tabular-nums text-slate-400"
                          >
                            {{ playerIdx + 1 }}.
                          </span>
                          <router-link
                            :to="getPlayerDetailsRoute(player.playerName)"
                            class="font-medium truncate max-w-[100px] text-cyan-400 hover:text-cyan-300 transition-colors"
                            :title="`View details for ${player.playerName}`"
                          >
                            {{ player.playerName }}
                          </router-link>
                          <span class="text-slate-600">/</span>
                          <span
                            class="font-mono font-semibold"
                            :class="getKDRColor(player.kills, player.deaths)"
                          >
                            {{ calculateKDR(player.kills, player.deaths) }}
                          </span>
                          <span class="text-slate-600">{{ player.score }}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-sm text-slate-500"
                    >
                      —
                    </span>
                  </td>

                  <!-- Participants Column (hidden on mobile/tablet) -->
                  <td class="py-4 px-4 text-center hidden lg:table-cell">
                    <span class="text-sm text-slate-400">
                      {{ session.participantCount }}
                    </span>
                  </td>

                  <!-- Duration Column (hidden on mobile/tablet) -->
                  <td class="py-4 px-4 text-center hidden lg:table-cell">
                    <span class="text-sm text-slate-400 font-mono">
                      {{ formatPlayTime(session.durationMinutes) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty Sessions State -->
        <div v-else class="bg-slate-800/30 rounded-lg p-6">
          <div class="text-center py-4 text-slate-500">
            No recent sessions found for this map on this server
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { fetchServerMapDetail, fetchServerMapSessions, type ServerMapDetail, type LeaderboardEntry, type ServerMapSession } from '../../services/dataExplorerService';
import WinStatsBar from './WinStatsBar.vue';
import LeaderboardTable from './LeaderboardTable.vue';

const props = defineProps<{
  serverGuid: string;
  mapName: string;
}>();

const emit = defineEmits<{
  (e: 'navigateToServer', serverGuid: string): void;
  (e: 'navigateToMap', mapName: string): void;
  (e: 'close'): void;
}>();

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'explore-player-detail',
  params: { playerName }
});

const detail = ref<ServerMapDetail | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const error = ref<string | null>(null);
const selectedDays = ref(60);
const showRegularsOnly = ref(false);

// Sessions state
const sessions = ref<ServerMapSession[]>([]);
const isLoadingSessions = ref(false);
const sessionsError = ref<string | null>(null);

const REGULARS_MIN_ROUNDS = 10;

const filterByMinRounds = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
  if (!showRegularsOnly.value) return entries;
  return entries.filter(e => e.totalRounds >= REGULARS_MIN_ROUNDS);
};

const filteredByScore = computed(() => filterByMinRounds(detail.value?.topByScore ?? []));
const filteredByKills = computed(() => filterByMinRounds(detail.value?.topByKills ?? []));
const filteredByKdRatio = computed(() => filterByMinRounds(detail.value?.topByKdRatio ?? []));
const filteredByKillRate = computed(() => filterByMinRounds(detail.value?.topByKillRate ?? []));

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

const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return diffDays === 1 ? '1d' : `${diffDays}d`;
  if (diffHours > 0) return diffHours === 1 ? '1h' : `${diffHours}h`;
  if (diffMinutes > 0) return diffMinutes === 1 ? '1m' : `${diffMinutes}m`;
  return 'now';
};

const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills > 0 ? `${kills.toFixed(1)}` : '0.0';
  return (kills / deaths).toFixed(2);
};

const getKDRColor = (kills: number, deaths: number): string => {
  const kdr = deaths === 0 ? (kills > 0 ? kills : 0) : kills / deaths;
  if (kdr >= 2.0) return 'text-emerald-400';
  if (kdr >= 1.5) return 'text-cyan-400';
  if (kdr >= 1.0) return 'text-blue-400';
  if (kdr >= 0.5) return 'text-orange-400';
  return 'text-red-400';
};

const getTeamColor = (teamLabel: string | null | undefined): string => {
  if (!teamLabel) return 'text-slate-300';
  const label = teamLabel.toLowerCase();
  if (label.includes('axis') || label.includes('red') || label.includes('team 2')) return 'text-red-400';
  if (label.includes('allies') || label.includes('blue') || label.includes('team 1')) return 'text-blue-400';
  if (label.includes('north') || label.includes('nva')) return 'text-red-400';
  if (label.includes('south') || label.includes('usa')) return 'text-blue-400';
  return 'text-purple-400';
};

const getMapAccentColor = (mapName: string): string => {
  let hash = 0;
  for (let i = 0; i < mapName.length; i++) {
    hash = mapName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    'text-cyan-400',
    'text-emerald-400',
    'text-violet-400',
    'text-orange-400',
    'text-pink-400',
    'text-amber-400',
    'text-lime-400',
    'text-sky-400',
    'text-fuchsia-400',
    'text-indigo-400',
  ];

  return colors[Math.abs(hash) % colors.length];
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

const loadSessions = async () => {
  if (!props.serverGuid || !props.mapName) return;

  isLoadingSessions.value = true;
  sessionsError.value = null;

  try {
    sessions.value = await fetchServerMapSessions(props.serverGuid, props.mapName, 5);
  } catch (err) {
    console.error('Error loading sessions:', err);
    sessionsError.value = 'Failed to load sessions';
  } finally {
    isLoadingSessions.value = false;
  }
};

onMounted(() => {
  loadData(false);
  loadSessions();
});
watch(() => [props.serverGuid, props.mapName], () => {
  loadData(false);
  loadSessions();
});
</script>
