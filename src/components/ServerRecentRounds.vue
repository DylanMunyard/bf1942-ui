<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { ServerDetails, RecentRoundInfo } from '@/services/serverDetailsService';

const props = defineProps<{
  serverDetails: ServerDetails;
  serverName: string;
}>();

const router = useRouter();

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
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  if (diffMonths > 0) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  if (diffDays > 0) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  if (diffHours > 0) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  if (diffMinutes > 0) return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  return 'Just now';
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
const getTeamColor = (teamLabel: string | null | undefined): string => {
  if (!teamLabel) return 'slate';
  const label = teamLabel.toLowerCase();
  if (label.includes('axis') || label.includes('red')) return 'red';
  if (label.includes('allies') || label.includes('blue')) return 'blue';
  if (label.includes('north') || label.includes('nva')) return 'red';
  if (label.includes('south') || label.includes('usa')) return 'blue';
  return 'purple';
};
</script>

<template>
  <div
    v-if="serverDetails.recentRounds && serverDetails.recentRounds.length > 0"
    class="relative"
  >
    <!-- Card Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(round, index) in serverDetails.recentRounds"
        :key="index"
        class="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
        @click="navigateToRoundReport(round)"
      >
        <!-- Card -->
        <div
          class="relative bg-slate-800/50 hover:bg-slate-800/70 border rounded-lg p-4 h-full flex flex-col gap-3 transition-all duration-300"
          :class="round.isActive && index === 0
            ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20'
            : 'border-slate-700/50 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10'"
        >
          <!-- Live Badge -->
          <div
            v-if="round.isActive && index === 0"
            class="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-xs text-emerald-300 animate-pulse"
          >
            <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span class="font-semibold">LIVE</span>
          </div>

          <!-- Map Name Header -->
          <div class="flex items-start justify-between gap-2">
            <h4
              class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r flex-grow"
              :class="round.isActive && index === 0
                ? 'from-emerald-300 to-emerald-400'
                : 'from-cyan-300 to-blue-300 group-hover:from-cyan-200 group-hover:to-blue-200'"
            >
              {{ round.mapName }}
            </h4>
          </div>

          <!-- Winner Section -->
          <div
            v-if="round.winningTeamLabel"
            class="flex items-center gap-2 p-2 rounded-lg transition-colors"
            :class="{
              'bg-red-500/10 border border-red-500/20': getTeamColor(round.winningTeamLabel) === 'red',
              'bg-blue-500/10 border border-blue-500/20': getTeamColor(round.winningTeamLabel) === 'blue',
              'bg-purple-500/10 border border-purple-500/20': getTeamColor(round.winningTeamLabel) === 'purple',
              'bg-slate-700/30 border border-slate-600/30': getTeamColor(round.winningTeamLabel) === 'slate'
            }"
          >
            <div class="text-2xl">🏆</div>
            <div class="flex-grow min-w-0">
              <div
                class="font-semibold truncate"
                :class="{
                  'text-red-300': getTeamColor(round.winningTeamLabel) === 'red',
                  'text-blue-300': getTeamColor(round.winningTeamLabel) === 'blue',
                  'text-purple-300': getTeamColor(round.winningTeamLabel) === 'purple',
                  'text-slate-300': getTeamColor(round.winningTeamLabel) === 'slate'
                }"
              >
                {{ round.winningTeamLabel }}
              </div>
              <div class="text-xs text-slate-400">
                {{ round.winningTeamScore }} - {{ round.losingTeamScore }}
              </div>
            </div>
          </div>

          <!-- Top Player Section -->
          <div
            v-if="round.topPlayerName"
            class="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <div class="text-2xl">⭐</div>
            <div class="flex-grow min-w-0">
              <div class="font-semibold text-amber-300 truncate">
                {{ round.topPlayerName }}
              </div>
              <div class="text-xs text-slate-400">
                {{ round.topPlayerScore }} points
              </div>
            </div>
          </div>

          <!-- Stats Footer -->
          <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
            <div class="flex items-center gap-1">
              <span>👥</span>
              <span>{{ round.participantCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span>⏱️</span>
              <span>{{ formatPlayTime(getDurationMinutes(round.startTime, round.endTime)) }}</span>
            </div>
            <div class="text-right">
              {{ formatRelativeTime(round.startTime) }}
            </div>
          </div>
        </div>
      </div>
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
.group:hover .bg-slate-800\/50 {
  transition: all 0.3s ease;
}
</style>
