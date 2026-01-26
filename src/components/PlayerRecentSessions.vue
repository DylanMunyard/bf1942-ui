<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Session } from '@/types/playerStatsTypes';
import { formatPlayTime, formatRelativeTimeShort as formatRelativeTime, getDurationMinutes } from '@/utils/timeUtils';
import { calculateKDR, getKDRColor } from '@/utils/statsUtils';

const props = defineProps<{
  sessions: Session[];
}>();

const router = useRouter();
const showAll = ref(false);

// Show 3 sessions initially
const visibleSessions = computed(() => {
  if (showAll.value || !props.sessions) {
    return props.sessions;
  }
  return props.sessions.slice(0, 3);
});

const hasMoreSessions = computed(() => {
  return props.sessions && props.sessions.length > 3;
});

const toggleShowAll = () => {
  showAll.value = !showAll.value;
};

const navigateToRoundReport = (session: Session) => {
  router.push({
    name: 'round-report',
    params: {
      roundId: session.roundId,
    },
  });
};

// Generate vibrant accent color for map name
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

// Get left border color based on performance
const getLeftBorderColor = (session: Session): string => {
  if (session.isActive) return 'border-l-emerald-400';
  const kdr = session.totalDeaths === 0 ? (session.totalKills > 0 ? session.totalKills : 0) : session.totalKills / session.totalDeaths;
  if (kdr >= 2.0) return 'border-l-emerald-400';
  if (kdr >= 1.5) return 'border-l-cyan-400';
  if (kdr >= 1.0) return 'border-l-blue-400';
  return 'border-l-orange-400';
};
</script>

<template>
  <div
    v-if="sessions && sessions.length > 0"
    class="relative"
  >
    <!-- Sessions Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-700/50">
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Map
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              K/D
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kills / Deaths
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
              Score
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
              Server
            </th>
            <th class="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
              Duration
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(session, index) in visibleSessions"
            :key="index"
            class="group border-l-4 border-b border-slate-700/30 hover:bg-slate-800/40 transition-all duration-150 cursor-pointer"
            :class="[
              getLeftBorderColor(session),
              session.isActive && index === 0 ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent border-l-emerald-400 shadow-lg shadow-emerald-500/10 animate-pulse' : ''
            ]"
            @click="navigateToRoundReport(session)"
          >
            <!-- Map Column (with time as subheading) -->
            <td class="py-3 px-4">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span
                    class="text-sm font-bold"
                    :class="session.isActive && index === 0 ? 'text-emerald-300 drop-shadow-sm' : getMapAccentColor(session.mapName)"
                  >
                    {{ session.mapName }}
                  </span>
                  <span
                    v-if="session.isActive && index === 0"
                    class="text-[10px] text-emerald-300 font-bold uppercase tracking-wider px-2 py-1 bg-emerald-500/30 border border-emerald-400/50 rounded-full animate-pulse shadow-sm shadow-emerald-400/20"
                  >
                    🔴 LIVE
                  </span>
                </div>
                <span class="text-xs text-slate-500 font-medium">
                  {{ formatRelativeTime(session.startTime) }} ago
                </span>
              </div>
            </td>

            <!-- K/D Ratio Column -->
            <td class="py-3 px-4">
              <span
                class="text-lg font-bold font-mono"
                :class="getKDRColor(session.totalKills, session.totalDeaths)"
              >
                {{ calculateKDR(session.totalKills, session.totalDeaths) }}
              </span>
            </td>

            <!-- Kills / Deaths Column -->
            <td class="py-3 px-4">
              <div class="flex items-center gap-1 font-mono text-sm">
                <span class="text-emerald-400 font-bold">{{ session.totalKills }}</span>
                <span class="text-slate-600">/</span>
                <span class="text-red-400">{{ session.totalDeaths }}</span>
              </div>
            </td>

            <!-- Score Column (hidden on mobile) -->
            <td class="py-3 px-4 hidden md:table-cell">
              <span class="text-sm font-mono text-yellow-400 font-bold">
                {{ session.totalScore }}
              </span>
            </td>

            <!-- Server Column (hidden on mobile/tablet) -->
            <td class="py-3 px-4 hidden lg:table-cell">
              <span class="text-sm text-slate-400 truncate max-w-[150px]">
                {{ session.serverName }}
              </span>
            </td>

            <!-- Duration Column (hidden on mobile/tablet) -->
            <td class="py-3 px-4 text-center hidden lg:table-cell">
              <span class="text-sm text-slate-400 font-mono">
                {{ formatPlayTime(getDurationMinutes(session.startTime, session.lastSeenTime)) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Show More Button -->
    <div
      v-if="hasMoreSessions"
      class="mt-4 flex justify-center"
    >
      <button
        class="group px-6 py-2.5 bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-all duration-200 flex items-center gap-2"
        @click="toggleShowAll"
      >
        <span class="text-sm font-medium text-slate-300 group-hover:text-slate-200">
          {{ showAll ? 'Show Less' : `Show ${sessions.length - 3} More` }}
        </span>
        <span
          class="text-slate-400 transition-transform duration-200"
          :class="showAll ? 'rotate-180' : ''"
        >
          ▼
        </span>
      </button>
    </div>
  </div>

  <!-- Empty state -->
  <div
    v-else
    class="flex flex-col items-center justify-center py-12 text-slate-400"
  >
    <div class="text-5xl mb-3 opacity-50">
      🎮
    </div>
    <p class="text-base font-medium">
      No recent sessions
    </p>
    <p class="text-sm text-slate-500 mt-1">
      Session data will appear here once available
    </p>
  </div>
</template>

<style scoped>
/* Smooth row hover transitions */
tbody tr {
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

/* Table responsive scrolling */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
