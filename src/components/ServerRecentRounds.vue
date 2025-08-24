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
    path: '/servers/round-report',
    query: {
      serverGuid: props.serverDetails.serverGuid,
      mapName: round.mapName,
      startTime: round.startTime,
    },
  });
};
</script>

<template>
  <div
    v-if="serverDetails.recentRounds && serverDetails.recentRounds.length > 0"
    class="relative"
  >
    <!-- Compact horizontal timeline -->
    <div class="flex items-start gap-6 overflow-x-auto pb-2 px-2">
      <div
        v-for="(round, index) in serverDetails.recentRounds"
        :key="index"
        @click="navigateToRoundReport(round)"
        class="flex-shrink-0 group cursor-pointer transition-all duration-300"
      >
        <div class="flex flex-col items-center text-center min-w-0 w-24">
          <!-- Map name above -->
          <div class="mb-2 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50 group-hover:border-cyan-500/50 transition-colors min-h-[2.5rem] flex items-center">
            <span class="text-xs font-medium text-slate-300 group-hover:text-cyan-300 transition-colors leading-tight truncate"
                  :class="round.isActive && index === 0 ? 'text-emerald-300' : ''">
              {{ round.mapName }}
            </span>
          </div>

          <!-- Timeline dot -->
          <div class="relative flex items-center">
            <!-- Main dot -->
            <div class="relative">
              <div 
                class="w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125"
                :class="round.isActive && index === 0 
                  ? 'bg-emerald-400 border-emerald-300 animate-pulse shadow-lg shadow-emerald-400/50' 
                  : 'bg-cyan-500/80 border-cyan-400 group-hover:bg-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-400/30'"
              ></div>
              
              <!-- Live indicator -->
              <div
                v-if="round.isActive && index === 0"
                class="absolute -top-1 -right-1 w-2 h-2 bg-emerald-300 rounded-full animate-ping"
              ></div>
            </div>
          </div>

          <!-- Round details below -->
          <div class="mt-2 space-y-1">
            <!-- Duration -->
            <div class="text-xs font-mono text-slate-300 group-hover:text-cyan-300 transition-colors">
              {{ formatPlayTime(getDurationMinutes(round.startTime, round.endTime)) }}
            </div>
            <!-- Time ago -->
            <div class="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
              {{ formatRelativeTime(round.startTime) }}
            </div>
          </div>
        </div>
      </div>

      <!-- End padding -->
      <div class="flex-shrink-0 w-4"></div>
    </div>

    <!-- Subtle scroll hint -->
    <div class="flex justify-center mt-3">
      <div class="text-slate-500 text-xs opacity-60">
        {{ serverDetails.recentRounds.length }} recent rounds • Scroll to see all
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div
    v-else
    class="flex flex-col items-center justify-center py-8 text-slate-400"
  >
    <div class="text-3xl mb-2 opacity-50">🎮</div>
    <p class="text-sm font-medium">No recent rounds</p>
  </div>
</template>

<style scoped>
/* Custom scrollbar for better cross-browser support */
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
  transition: background-color 0.2s ease;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}

/* For Firefox */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

/* Smooth scroll behavior */
.overflow-x-auto {
  scroll-behavior: smooth;
}
</style> 