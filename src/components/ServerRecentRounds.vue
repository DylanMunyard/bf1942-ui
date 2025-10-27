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

// Show 6 cards initially (2 rows × 3 columns on desktop)
const visibleRounds = computed(() => {
  if (showAll.value || !props.serverDetails.recentRounds) {
    return props.serverDetails.recentRounds;
  }
  return props.serverDetails.recentRounds.slice(0, 6);
});

const hasMoreRounds = computed(() => {
  return props.serverDetails.recentRounds && props.serverDetails.recentRounds.length > 6;
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

  if (diffDays > 0) return diffDays === 1 ? '1d ago' : `${diffDays}d ago`;
  if (diffHours > 0) return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
  if (diffMinutes > 0) return diffMinutes === 1 ? '1m ago' : `${diffMinutes}m ago`;
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

// Helper to get team color based on label
const getTeamColor = (teamLabel: string | null | undefined): { bg: string; border: string; text: string } => {
  if (!teamLabel) return { bg: 'bg-slate-700/30', border: 'border-slate-600/30', text: 'text-slate-300' };
  const label = teamLabel.toLowerCase();
  if (label.includes('axis') || label.includes('red')) {
    return { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400' };
  }
  if (label.includes('allies') || label.includes('blue')) {
    return { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400' };
  }
  if (label.includes('north') || label.includes('nva')) {
    return { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400' };
  }
  if (label.includes('south') || label.includes('usa')) {
    return { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400' };
  }
  return { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-400' };
};

// Generate vibrant accent color for map name based on hash
const getMapAccentColor = (mapName: string): string => {
  let hash = 0;
  for (let i = 0; i < mapName.length; i++) {
    hash = mapName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    'from-cyan-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-violet-400 to-purple-500',
    'from-orange-400 to-red-500',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500',
    'from-lime-400 to-green-500',
    'from-sky-400 to-cyan-500',
    'from-fuchsia-400 to-pink-500',
    'from-indigo-400 to-violet-500',
  ];

  return colors[Math.abs(hash) % colors.length];
};

// Get left border accent color
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
    <!-- Cards Container with Gradient Overlay -->
    <div class="relative">
      <!-- Compact Card Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="(round, index) in visibleRounds"
          :key="index"
          class="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          @click="navigateToRoundReport(round)"
        >
        <!-- Compact Card with Left Accent Border -->
        <div
          class="relative bg-slate-800/40 hover:bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600 rounded-lg overflow-hidden border-l-4 transition-all duration-200"
          :class="[
            getLeftBorderColor(round),
            round.isActive && index === 0 ? 'shadow-lg shadow-emerald-500/10' : 'hover:shadow-lg hover:shadow-cyan-500/5'
          ]"
        >
          <!-- Header Section: Map Name + Badge -->
          <div class="px-3 py-2 bg-slate-900/40 border-b border-slate-700/30 flex items-center justify-between gap-2">
            <h4
              class="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r truncate flex-grow"
              :class="round.isActive && index === 0
                ? 'from-emerald-300 to-emerald-400'
                : getMapAccentColor(round.mapName)"
            >
              {{ round.mapName }}
            </h4>

            <!-- Current Map Badge -->
            <div
              v-if="round.isActive && index === 0"
              class="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-[10px] text-emerald-300 font-semibold uppercase tracking-wide flex-shrink-0"
            >
              <div class="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
              <span>Current Map</span>
            </div>
            <div
              v-else
              class="text-[10px] text-slate-500 font-medium flex-shrink-0"
            >
              {{ formatRelativeTime(round.startTime) }}
            </div>
          </div>

          <!-- Content Section: Text-Based Layout -->
          <div class="p-3 space-y-1.5">
            <!-- Winner Text -->
            <div
              v-if="round.winningTeamLabel"
              class="text-sm text-slate-400"
            >
              <span
                class="font-bold"
                :class="getTeamColor(round.winningTeamLabel).text"
              >
                {{ round.winningTeamLabel }}
              </span>
              <span>{{ round.isActive ? ' winning ' : ' won ' }}</span>
              <span class="font-bold text-slate-200">{{ round.winningTeamScore }}</span>
              <span> to </span>
              <span class="font-bold text-slate-400">{{ round.losingTeamScore }}</span>
            </div>

            <!-- Top Player Text with Trophy -->
            <div
              v-if="round.topPlayerName"
              class="text-xs text-slate-400 flex items-center gap-1.5"
            >
              <span class="text-amber-400">🏆</span>
              <span class="font-semibold text-amber-300 truncate">{{ round.topPlayerName }}</span>
              <span class="font-mono text-slate-300">{{ round.topPlayerScore }}</span>
            </div>

            <!-- Stats Footer -->
            <div class="flex items-center gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-700/30">
              <span>👥 {{ round.participantCount }}</span>
              <span class="text-slate-700">•</span>
              <span>⏱️ {{ formatPlayTime(getDurationMinutes(round.startTime, round.endTime)) }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Gradient Fade Overlay (when collapsed) -->
      <div
        v-if="hasMoreRounds && !showAll"
        class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none"
      />
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
          {{ showAll ? 'Show Less' : `Show ${serverDetails.recentRounds.length - 6} More` }}
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
/* Smooth animations */
.group:hover .bg-slate-800\/40 {
  transition: all 0.2s ease;
}

/* Smooth transition for showing/hiding cards */
.grid {
  transition: max-height 0.3s ease-in-out;
}
</style>
