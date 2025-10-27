<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { ServerDetails, RecentRoundInfo } from '@/services/serverDetailsService';

const props = defineProps<{
  serverDetails: ServerDetails;
  serverName: string;
}>();

const router = useRouter();
const showAll = ref(false);

// Show 8 rounds initially
const visibleRounds = computed(() => {
  if (showAll.value || !props.serverDetails.recentRounds) {
    return props.serverDetails.recentRounds;
  }
  return props.serverDetails.recentRounds.slice(0, 8);
});

const hasMoreRounds = computed(() => {
  return props.serverDetails.recentRounds && props.serverDetails.recentRounds.length > 8;
});

const toggleShowAll = () => {
  showAll.value = !showAll.value;
};

const formatPlayTime = (minutes: number): string => {
  if (minutes < 1) {
    return '<1m';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
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

const getDurationMinutes = (startTime: string, endTime: string): number => {
  if (!endTime || !startTime) return 0;
  const start = new Date(startTime.endsWith('Z') ? startTime : startTime + 'Z');
  const end = new Date(endTime.endsWith('Z') ? endTime : endTime + 'Z');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
};

const navigateToRoundReport = (round: RecentRoundInfo) => {
  router.push({
    name: 'round-report',
    params: {
      roundId: round.roundId,
    },
  });
};

// Helper to get team color
const getTeamColor = (teamLabel: string | null | undefined): string => {
  if (!teamLabel) return 'text-slate-300';
  const label = teamLabel.toLowerCase();
  if (label.includes('axis') || label.includes('red')) return 'text-red-400';
  if (label.includes('allies') || label.includes('blue')) return 'text-blue-400';
  if (label.includes('north') || label.includes('nva')) return 'text-red-400';
  if (label.includes('south') || label.includes('usa')) return 'text-blue-400';
  return 'text-purple-400';
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

// Get left border color
const getLeftBorderColor = (round: RecentRoundInfo): string => {
  if (round.isActive) return 'border-l-emerald-400';
  if (round.winningTeamLabel?.toLowerCase().includes('axis') || round.winningTeamLabel?.toLowerCase().includes('red')) {
    return 'border-l-red-400';
  }
  if (round.winningTeamLabel?.toLowerCase().includes('allies') || round.winningTeamLabel?.toLowerCase().includes('blue')) {
    return 'border-l-blue-400';
  }
  return 'border-l-cyan-400';
};
</script>

<template>
  <div
    v-if="serverDetails.recentRounds && serverDetails.recentRounds.length > 0"
    class="relative"
  >
    <!-- Match History Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-700/50">
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Time
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Map
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Winner
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Score
            </th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
              Top Player
            </th>
            <th class="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
              Players
            </th>
            <th class="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
              Duration
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(round, index) in visibleRounds"
            :key="index"
            class="group border-l-4 border-b border-slate-700/30 hover:bg-slate-800/40 transition-all duration-150 cursor-pointer"
            :class="[
              getLeftBorderColor(round),
              round.isActive && index === 0 ? 'bg-emerald-500/5' : ''
            ]"
            @click="navigateToRoundReport(round)"
          >
            <!-- Time Column -->
            <td class="py-3 px-4">
              <div class="flex flex-col">
                <span class="text-sm text-slate-300 font-medium">
                  {{ formatRelativeTime(round.startTime) }}
                </span>
                <span
                  v-if="round.isActive && index === 0"
                  class="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide mt-0.5"
                >
                  Live
                </span>
              </div>
            </td>

            <!-- Map Column -->
            <td class="py-3 px-4">
              <span
                class="text-sm font-bold"
                :class="round.isActive && index === 0 ? 'text-emerald-400' : getMapAccentColor(round.mapName)"
              >
                {{ round.mapName }}
              </span>
            </td>

            <!-- Winner Column -->
            <td class="py-3 px-4">
              <span
                v-if="round.winningTeamLabel"
                class="text-sm font-semibold"
                :class="getTeamColor(round.winningTeamLabel)"
              >
                {{ round.winningTeamLabel }}
              </span>
              <span
                v-else
                class="text-sm text-slate-500"
              >
                —
              </span>
            </td>

            <!-- Score Column -->
            <td class="py-3 px-4">
              <div
                v-if="round.winningTeamScore !== null && round.losingTeamScore !== null"
                class="flex items-center gap-1 font-mono text-sm"
              >
                <span class="text-slate-200 font-bold">{{ round.winningTeamScore }}</span>
                <span class="text-slate-600">-</span>
                <span class="text-slate-500">{{ round.losingTeamScore }}</span>
              </div>
              <span
                v-else
                class="text-sm text-slate-500"
              >
                —
              </span>
            </td>

            <!-- Top Player Column (hidden on mobile) -->
            <td class="py-3 px-4 hidden md:table-cell">
              <div
                v-if="round.topPlayerName"
                class="flex items-center gap-1.5"
              >
                <span class="text-amber-400 text-xs">🏆</span>
                <span class="text-sm text-amber-300 font-medium truncate max-w-[150px]">
                  {{ round.topPlayerName }}
                </span>
                <span class="text-xs text-slate-400 font-mono">
                  {{ round.topPlayerScore }}
                </span>
              </div>
              <span
                v-else
                class="text-sm text-slate-500"
              >
                —
              </span>
            </td>

            <!-- Players Column (hidden on mobile/tablet) -->
            <td class="py-3 px-4 text-center hidden lg:table-cell">
              <span class="text-sm text-slate-400">
                {{ round.participantCount }}
              </span>
            </td>

            <!-- Duration Column (hidden on mobile/tablet) -->
            <td class="py-3 px-4 text-center hidden lg:table-cell">
              <span class="text-sm text-slate-400 font-mono">
                {{ formatPlayTime(getDurationMinutes(round.startTime, round.endTime)) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Show More Button -->
    <div
      v-if="hasMoreRounds"
      class="mt-4 flex justify-center"
    >
      <button
        class="group px-6 py-2.5 bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-all duration-200 flex items-center gap-2"
        @click="toggleShowAll"
      >
        <span class="text-sm font-medium text-slate-300 group-hover:text-slate-200">
          {{ showAll ? 'Show Less' : `Show ${serverDetails.recentRounds.length - 8} More` }}
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
      No recent rounds
    </p>
    <p class="text-sm text-slate-500 mt-1">
      Round data will appear here once available
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
