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
    v-if="serverDetails.lastRounds && serverDetails.lastRounds.length > 0"
    class="overflow-hidden rounded-lg border border-slate-700/50"
  >
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-700/50 bg-slate-800/50">
          <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Map</th>
          <th class="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Duration</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">When</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-700/50">
        <tr
          v-for="(round, index) in serverDetails.lastRounds"
          :key="index"
          @click="navigateToRoundReport(round)"
          class="hover:bg-slate-800/30 transition-colors cursor-pointer group"
        >
          <!-- Map Name -->
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <div
                v-if="round.isActive && index === 0"
                class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"
              ></div>
              <span 
                class="font-medium truncate group-hover:text-cyan-300 transition-colors"
                :class="round.isActive && index === 0 ? 'text-emerald-300' : 'text-slate-200'"
              >
                {{ round.mapName }}
              </span>
              <span
                v-if="round.isActive && index === 0"
                class="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded border border-emerald-500/30 flex-shrink-0"
              >
                LIVE
              </span>
            </div>
          </td>

          <!-- Duration -->
          <td class="px-4 py-3 text-center">
            <span class="text-slate-300 font-mono">
              {{ formatPlayTime(getDurationMinutes(round.startTime, round.endTime)) }}
            </span>
          </td>

          <!-- Time Ago -->
          <td class="px-4 py-3 text-right">
            <span class="text-slate-400">
              {{ formatRelativeTime(round.startTime) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* No custom styles needed - using Tailwind CSS */
</style> 