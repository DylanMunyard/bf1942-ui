<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchSessions } from '@/services/playerStatsApi';
import { formatRelativeTimeShort as formatRelativeTime } from '@/utils/timeUtils';
import { calculateKDR, getKDRColor, getTeamColor, getMapAccentColor } from '@/utils/statsUtils';

// ServerMapSession interface (matches RoundWithPlayers from API)
interface ServerMapSession {
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
  topPlayers?: Array<{
    playerName: string;
    score: number;
    kills: number;
    deaths: number;
  }>;
}

const props = defineProps<{
  serverGuid?: string;
  serverName?: string; // Server name for building navigation links
  mapName?: string;
  limit?: number;
  emptyMessage?: string;
  initialVisibleCount?: number; // If set, only show this many initially with expand option
}>();

const router = useRouter();
const sessions = ref<ServerMapSession[]>([]);
const isLoadingSessions = ref(false);
const sessionsError = ref<string | null>(null);
const isExpanded = ref(false);

// Computed property for visible sessions
const visibleSessions = computed(() => {
  if (props.initialVisibleCount && !isExpanded.value) {
    return sessions.value.slice(0, props.initialVisibleCount);
  }
  return sessions.value;
});

const hasMoreSessions = computed(() => {
  return props.initialVisibleCount && sessions.value.length > props.initialVisibleCount;
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// Build route to sessions page
const getSessionsRoute = () => {
  if (!props.serverName) return null;
  
  const route: any = {
    name: 'server-sessions',
    params: { serverName: props.serverName }
  };
  
  if (props.mapName) {
    route.query = { mapName: props.mapName };
  }
  
  return route;
};

const formatPlayTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

const getPlayerDetailsRoute = (playerName: string) => ({
  name: 'explore-player-detail',
  params: { playerName }
});

const navigateToRoundReport = (session: ServerMapSession) => {
  router.push({
    name: 'round-report',
    params: {
      roundId: session.roundId,
    },
  });
};

const loadSessions = async () => {
  if (!props.serverGuid) return;

  isLoadingSessions.value = true;
  sessionsError.value = null;

  try {
    const filters: Record<string, string> = {
      serverGuid: props.serverGuid
    };
    
    if (props.mapName) {
      filters.mapName = props.mapName;
    }

    const response = await fetchSessions(1, props.limit || 5, filters, 'startTime', 'desc');
    
    // Cast to ServerMapSession since fetchSessions returns RoundWithPlayers
    sessions.value = response.items as unknown as ServerMapSession[];
  } catch (err) {
    console.error('Error loading sessions:', err);
    sessionsError.value = 'Failed to load sessions';
  } finally {
    isLoadingSessions.value = false;
  }
};

onMounted(() => {
  loadSessions();
});

watch(() => [props.serverGuid, props.mapName], () => {
  loadSessions();
});
</script>

<template>
  <div>
    <!-- Loading Sessions State -->
    <div v-if="isLoadingSessions" class="bg-neutral-800/30 rounded-lg p-6">
      <div class="flex items-center justify-center py-8">
        <div class="w-8 h-8 border-4 border-neutral-600 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    </div>

    <!-- Sessions Error State -->
    <div v-else-if="sessionsError" class="bg-neutral-800/30 rounded-lg p-6">
      <div class="text-center py-4">
        <div class="text-red-400 mb-2">{{ sessionsError }}</div>
        <button @click="loadSessions" class="text-cyan-400 hover:text-cyan-300 text-sm">
          Try again
        </button>
      </div>
    </div>

    <!-- Sessions List -->
    <div v-else-if="sessions.length > 0" class="bg-neutral-800/30 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-neutral-700/50">
              <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Map & Server
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden md:table-cell">
                Team Matchup
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Top Players
              </th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden lg:table-cell">
                Participants
              </th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden lg:table-cell">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(session, index) in visibleSessions"
              :key="session.roundId"
              class="group border-l-4 border-b border-neutral-700/30 hover:bg-neutral-800/40 transition-all duration-150 cursor-pointer border-l-cyan-400"
              :class="session.isActive && index === 0 ? 'bg-emerald-500/5' : ''"
              @click="navigateToRoundReport(session)"
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
                  <span class="text-xs text-neutral-500 font-medium">
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
                    <span class="font-mono text-sm font-bold text-neutral-200">{{ session.team1Points }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-sm font-semibold"
                      :class="getTeamColor(session.team2Label)"
                    >
                      {{ session.team2Label }}
                    </span>
                    <span class="font-mono text-sm font-bold text-neutral-200">{{ session.team2Points }}</span>
                  </div>
                </div>
                <span
                  v-else
                  class="text-sm text-neutral-500"
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
                        class="font-bold tabular-nums text-neutral-400"
                      >
                        {{ playerIdx + 1 }}.
                      </span>
                      <router-link
                        :to="getPlayerDetailsRoute(player.playerName)"
                        class="font-medium truncate max-w-[100px] text-cyan-400 hover:text-cyan-300 transition-colors"
                        :title="`View details for ${player.playerName}`"
                        @click.stop
                      >
                        {{ player.playerName }}
                      </router-link>
                      <span class="text-neutral-600">/</span>
                      <span
                        class="font-mono font-semibold"
                        :class="getKDRColor(player.kills, player.deaths)"
                      >
                        {{ calculateKDR(player.kills, player.deaths) }}
                      </span>
                      <span class="text-neutral-600">{{ player.score }}</span>
                    </div>
                  </div>
                </div>
                <span
                  v-else
                  class="text-sm text-neutral-500"
                >
                  —
                </span>
              </td>

              <!-- Participants Column (hidden on mobile/tablet) -->
              <td class="py-4 px-4 text-center hidden lg:table-cell">
                <span class="text-sm text-neutral-400">
                  {{ session.participantCount }}
                </span>
              </td>

              <!-- Duration Column (hidden on mobile/tablet) -->
              <td class="py-4 px-4 text-center hidden lg:table-cell">
                <span class="text-sm text-neutral-400 font-mono">
                  {{ formatPlayTime(session.durationMinutes) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Show More / View All Button -->
      <div
        v-if="hasMoreSessions"
        class="mt-4 flex justify-center pb-4"
      >
        <button
          v-if="!isExpanded"
          class="group px-6 py-2.5 bg-neutral-800/60 hover:bg-neutral-800/80 border border-neutral-700/50 hover:border-neutral-600 rounded-lg transition-all duration-200 flex items-center gap-2"
          @click="toggleExpand"
        >
          <span class="text-sm font-medium text-neutral-300 group-hover:text-neutral-200">
            Show {{ sessions.length - (initialVisibleCount || 0) }} More
          </span>
          <span class="text-neutral-400 transition-transform duration-200">
            ▼
          </span>
        </button>
        <div
          v-else
          class="flex items-center gap-4"
        >
          <button
            class="text-sm font-medium text-neutral-400 hover:text-neutral-300 transition-colors"
            @click="toggleExpand"
          >
            Show Less
          </button>
          <router-link
            v-if="getSessionsRoute()"
            :to="getSessionsRoute()"
            class="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <span>View All</span>
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
              class="transition-transform group-hover:translate-x-0.5"
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Empty Sessions State -->
    <div v-else class="bg-neutral-800/30 rounded-lg p-6">
      <div class="text-center py-4 text-neutral-500">
        {{ emptyMessage || 'No recent sessions found' }}
      </div>
    </div>
  </div>
</template>
