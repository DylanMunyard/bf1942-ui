<template>
  <div
    class="relative flex items-start gap-4 p-4 rounded-lg transition-all"
    :style="{ backgroundColor: backgroundSoftColor }"
  >
    <!-- Event icon -->
    <div
      class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
      :style="{ backgroundColor: getIconBackground() }"
    >
      <!-- Match result icon -->
      <svg v-if="item.type === 'match_result'" class="w-5 h-5" :style="{ color: accentColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <!-- Team created icon -->
      <svg v-else-if="item.type === 'team_created'" class="w-5 h-5" :style="{ color: accentColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <!-- Match scheduled icon -->
      <svg v-else-if="item.type === 'match_scheduled'" class="w-5 h-5" :style="{ color: accentColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>

    <!-- Event content -->
    <div class="flex-grow min-w-0">
      <!-- Match result -->
      <template v-if="item.type === 'match_result' && isMatchResultData(item.data)">
        <p class="text-sm font-medium" :style="{ color: textColor }">
          <span :style="{ color: item.data.winningTeamName === item.data.team1Name ? accentColor : textMutedColor }">{{ item.data.team1Name }}</span>&nbsp;<span :style="{ color: textMutedColor }">{{ item.data.team1Tickets }} - {{ item.data.team2Tickets }}</span>&nbsp;<span :style="{ color: item.data.winningTeamName === item.data.team2Name ? accentColor : textMutedColor }">{{ item.data.team2Name }}</span>
        </p>
        <p class="text-xs mt-1" :style="{ color: textMutedColor }">
          on {{ item.data.mapName }}
        </p>
      </template>

      <!-- Team created -->
      <template v-else-if="item.type === 'team_created' && isTeamCreatedData(item.data)">
        <p class="text-sm font-medium" :style="{ color: textColor }">
          Team <span :style="{ color: accentColor }">{{ item.data.teamName }}</span> joined the tournament
        </p>
      </template>

      <!-- Match scheduled -->
      <template v-else-if="item.type === 'match_scheduled' && isMatchScheduledData(item.data)">
        <p class="text-sm font-medium" :style="{ color: textColor }">
          <span :style="{ color: accentColor }">{{ item.data.team1Name }}</span>
          <span :style="{ color: textMutedColor }"> vs </span>
          <span :style="{ color: accentColor }">{{ item.data.team2Name }}</span>
        </p>
        <p class="text-xs mt-1" :style="{ color: textMutedColor }">
          {{ formatScheduledDate(item.data.scheduledDate) }}
          <span v-if="item.data.week"> &middot; {{ item.data.week }}</span>
          <span v-if="item.data.maps.length > 0"> &middot; {{ item.data.maps.join(', ') }}</span>
        </p>
      </template>

      <!-- Timestamp -->
      <p class="text-xs mt-2" :style="{ color: textMutedColor, opacity: 0.7 }">
        {{ formatRelativeTime(item.timestamp) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeedItem, FeedMatchResultData, FeedTeamCreatedData, FeedMatchScheduledData } from '@/services/tournamentFeedService';
import { isMatchResultData, isTeamCreatedData, isMatchScheduledData } from '@/services/tournamentFeedService';

const props = defineProps<{
  item: FeedItem;
  accentColor: string;
  textColor: string;
  textMutedColor: string;
  backgroundSoftColor: string;
}>();

const getIconBackground = (): string => {
  const rgb = hexToRgb(props.accentColor);
  if (!rgb) return 'rgba(255, 215, 0, 0.15)';
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const formatScheduledDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
};
</script>
