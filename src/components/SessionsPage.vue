<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchSessions, PlayerContextInfo } from '../services/playerStatsService';
import HeroBackButton from './HeroBackButton.vue';
import { formatPlayTime, formatRelativeTimeShort as formatRelativeTime } from '@/utils/timeUtils';
import { calculateKDR, getKDRColor, getTeamColor, getMapAccentColor } from '@/utils/statsUtils';

// Router
const router = useRouter();

// Props from router
interface Props {
  playerName?: string;
  serverName?: string;
  mapName?: string;
}

const props = defineProps<Props>();

// Session data types
interface TopPlayer {
  sessionId: number;
  roundId: string;
  playerName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  score: number;
  kills: number;
  deaths: number;
  isActive: boolean;
}

interface RoundData {
  roundId: string;
  serverName: string;
  serverGuid: string;
  mapName: string;
  gameType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  participantCount: number;
  totalSessions: number;
  isActive: boolean;
  team1Label?: string;
  team2Label?: string;
  team1Points?: number;
  team2Points?: number;
  roundTimeRemain?: number;
  topPlayers?: TopPlayer[];
}

// State
const rounds = ref<RoundData[]>([]);
const playerInfo = ref<PlayerContextInfo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = ref(0);

const navigateToRoundReport = (roundId: string) => {
  router.push({
    name: 'round-report',
    params: {
      roundId: roundId,
    },
  });
};

// Fetch data
const fetchData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const filters: Record<string, string> = {};
    if (props.playerName) {
      filters.playerNames = props.playerName;
    }
    if (props.serverName) {
      filters.serverName = props.serverName;
    }
    if (props.mapName) {
      filters.mapName = props.mapName;
    }

    const response = await fetchSessions(
      currentPage.value,
      pageSize.value,
      filters,
      'startTime',
      'desc'
    );

    rounds.value = response.items as unknown as RoundData[];
    playerInfo.value = response.playerInfo || null;
    totalItems.value = response.totalItems;
    totalPages.value = response.totalPages;
  } catch (err) {
    console.error('Error fetching sessions:', err);
    error.value = 'Failed to load sessions. Please try again.';
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

onMounted(() => {
  fetchData();
});

watch(() => pageSize.value, () => {
  currentPage.value = 1;
  fetchData();
});

watch(() => currentPage.value, () => {
  fetchData();
});

// Cleanup
onUnmounted(() => {
  // Cleanup if needed
});
</script>

<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Hero Section -->
    <div class="w-full bg-slate-800 border-b border-slate-700">
      <div class="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 py-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex-grow">
            <div class="flex items-center gap-3 mb-2">
              <HeroBackButton :on-click="() => router.back()" />
              <h1 class="text-3xl md:text-4xl font-bold text-cyan-400">
                {{ playerInfo ? `${playerInfo.name}'s Sessions` : 'Game Sessions' }}
              </h1>
            </div>
            <p class="text-slate-400 text-sm">
              {{ totalItems }} session{{ totalItems !== 1 ? 's' : '' }} found
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20 text-slate-400"
      >
        <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p class="text-lg text-slate-300">Loading sessions...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-slate-800/70 backdrop-blur-sm border border-red-800/50 rounded-xl p-8 text-center"
      >
        <div class="text-6xl mb-4">⚠️</div>
        <p class="text-red-400 text-lg font-medium">{{ error }}</p>
      </div>

      <!-- Sessions Table -->
      <div
        v-else-if="rounds.length > 0"
        class="space-y-4"
      >
        <!-- Pagination Info -->
        <div class="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-400">
              Showing <span class="text-cyan-400 font-medium">{{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalItems) }}</span>
              of <span class="text-cyan-400 font-medium">{{ totalItems }}</span> sessions
            </span>
          </div>
          <div class="flex items-center gap-2">
            <label
              for="pageSize"
              class="text-xs text-slate-500"
            >Per page:</label>
            <select
              id="pageSize"
              v-model="pageSize"
              class="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <!-- Sessions List -->
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
                v-for="(round, index) in rounds"
                :key="round.roundId"
                class="group border-l-4 border-b border-slate-700/30 hover:bg-slate-800/40 transition-all duration-150 cursor-pointer border-l-cyan-400"
                :class="round.isActive && index === 0 ? 'bg-emerald-500/5' : ''"
                @click="navigateToRoundReport(round.roundId)"
              >
                <!-- Map & Server Column -->
                <td class="py-4 px-4">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <span
                        class="text-sm font-bold"
                        :class="round.isActive && index === 0 ? 'text-emerald-400' : getMapAccentColor(round.mapName)"
                      >
                        {{ round.mapName }}
                      </span>
                      <span
                        v-if="round.isActive && index === 0"
                        class="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide px-1.5 py-0.5 bg-emerald-500/20 rounded"
                      >
                        Live
                      </span>
                    </div>
                    <span class="text-xs text-slate-500 font-medium">
                      {{ round.serverName }} • {{ formatRelativeTime(round.startTime) }} ago
                    </span>
                  </div>
                </td>

                <!-- Team Matchup Column (hidden on mobile) -->
                <td class="py-4 px-4 hidden md:table-cell">
                  <div
                    v-if="round.team1Label && round.team2Label && round.team1Points !== undefined && round.team2Points !== undefined"
                    class="space-y-1"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-sm font-semibold"
                        :class="getTeamColor(round.team1Label)"
                      >
                        {{ round.team1Label }}
                      </span>
                      <span class="font-mono text-sm font-bold text-slate-200">{{ round.team1Points }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        class="text-sm font-semibold"
                        :class="getTeamColor(round.team2Label)"
                      >
                        {{ round.team2Label }}
                      </span>
                      <span class="font-mono text-sm font-bold text-slate-200">{{ round.team2Points }}</span>
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
                    v-if="round.topPlayers && round.topPlayers.length > 0"
                    class="space-y-1.5"
                  >
                    <div
                      v-for="(player, playerIdx) in round.topPlayers.slice(0, 3)"
                      :key="playerIdx"
                      class="text-xs rounded-lg px-2.5 py-1.5 transition-all duration-200"
                      :class="player.playerName === props.playerName
                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/20 border border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                        : ''"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="font-bold tabular-nums"
                          :class="player.playerName === props.playerName
                            ? 'text-cyan-300 drop-shadow-sm'
                            : 'text-slate-400'"
                        >
                          {{ playerIdx + 1 }}.
                        </span>
                        <span
                          class="font-medium truncate max-w-[100px]"
                          :class="player.playerName === props.playerName
                            ? 'text-cyan-200 font-semibold'
                            : 'text-slate-200'"
                          :title="player.playerName"
                        >
                          {{ player.playerName }}
                        </span>
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
                    {{ round.participantCount }}
                  </span>
                </td>

                <!-- Duration Column (hidden on mobile/tablet) -->
                <td class="py-4 px-4 text-center hidden lg:table-cell">
                  <span class="text-sm text-slate-400 font-mono">
                    {{ formatPlayTime(round.durationMinutes) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="mt-6 flex justify-center items-center gap-2"
        >
          <button
            :disabled="currentPage === 1"
            class="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg transition-colors text-sm text-slate-300"
            @click="goToPage(currentPage - 1)"
          >
            ← Previous
          </button>

          <div class="flex items-center gap-1">
            <button
              v-for="page in Math.min(5, totalPages)"
              :key="page"
              :class="[
                'px-3 py-2 rounded-lg border transition-colors text-sm',
                currentPage === page
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-slate-700/50 hover:bg-slate-700 border-slate-600/50 text-slate-300'
              ]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <span
              v-if="totalPages > 5"
              class="text-slate-500"
            >...</span>
          </div>

          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg transition-colors text-sm text-slate-300"
            @click="goToPage(currentPage + 1)"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-slate-400"
      >
        <div class="text-5xl mb-3 opacity-50">🎮</div>
        <p class="text-base font-medium">No sessions found</p>
        <p class="text-sm text-slate-500 mt-1">Try adjusting your filters or check back later</p>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SessionsPage.vue.css"></style>
