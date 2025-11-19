<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerTimeStatistics } from '../../services/playerStatsService';
import HeroBackButton from '../HeroBackButton.vue';

interface Props {
  playerName: string;
  playerStats: PlayerTimeStatistics | null;
}

const props = defineProps<Props>();

// Helper functions
const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
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

  if (diffYears > 0) {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } else if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
};

const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};
</script>

<template>
  <!-- Full-width Hero Section -->
  <div class="w-full bg-slate-800 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between mb-6">
        <HeroBackButton fallback-route="/players" />
      </div>

      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
        <!-- Player Avatar Section (hidden on mobile) -->
        <div class="hidden lg:block flex-shrink-0">
          <div class="relative">
            <!-- Avatar -->
            <div class="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-1 animate-spin-slow">
              <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xl font-bold text-slate-900">
                  {{ playerName?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>
            </div>
            <!-- Online Status Indicator -->
            <div
              v-if="playerStats?.isActive"
              class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"
            />
          </div>
        </div>

        <!-- Player Info -->
        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-4 flex-wrap mb-3">
            <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              {{ playerName }}
            </h1>
            <!-- Currently in game badge with server info -->
            <div
              v-if="playerStats?.isActive && playerStats?.currentServer"
              class="inline-flex items-center gap-3 flex-wrap"
            >
              <!-- Online pill -->
              <div class="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-green-400 bg-green-500/20 border border-green-500/30 rounded-full animate-pulse">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                Online
              </div>

              <!-- Server info pill -->
              <router-link
                :to="`/servers/${encodeURIComponent(playerStats.currentServer.serverName)}`"
                class="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-300 bg-blue-500/20 border border-blue-500/30 rounded-full hover:bg-blue-500/30 transition-all duration-200"
              >
                <div class="w-2 h-2 bg-blue-400 rounded-full" />
                <span class="font-medium">{{ playerStats.currentServer.serverName }}</span>
                <span class="text-xs opacity-75">{{ playerStats.currentServer.gameId?.toUpperCase() }}</span>
              </router-link>

              <!-- Session stats pill (if available) -->
              <div
                v-if="playerStats.currentServer.sessionKills !== undefined && playerStats.currentServer.sessionDeaths !== undefined"
                class="inline-flex items-center gap-3 px-3 py-1 text-sm font-medium text-purple-300 bg-purple-500/20 border border-purple-500/30 rounded-full"
              >
                <!-- K/D -->
                <div class="text-center">
                  <div class="text-sm font-bold text-cyan-400">
                    {{ calculateKDR(playerStats.currentServer.sessionKills, playerStats.currentServer.sessionDeaths) }}
                  </div>
                  <div class="text-xs text-slate-400">
                    K/D
                  </div>
                </div>
                <!-- Kills -->
                <div class="text-center">
                  <div class="text-sm font-bold text-green-400">
                    {{ playerStats.currentServer.sessionKills }}
                  </div>
                  <div class="text-xs text-slate-500">
                    K
                  </div>
                </div>
                <!-- Deaths -->
                <div class="text-center">
                  <div class="text-sm font-bold text-red-400">
                    {{ playerStats.currentServer.sessionDeaths }}
                  </div>
                  <div class="text-xs text-slate-500">
                    D
                  </div>
                </div>
                <!-- Score (if available) -->
                <div
                  v-if="(playerStats.currentServer as any).sessionScore !== undefined || (playerStats.currentServer as any).score !== undefined"
                  class="text-center"
                >
                  <div class="text-sm font-bold text-yellow-400">
                    {{ (playerStats.currentServer as any).sessionScore || (playerStats.currentServer as any).score }}
                  </div>
                  <div class="text-xs text-slate-500">
                    S
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Player Stats Summary -->
          <div class="flex items-center gap-6 text-slate-300 flex-wrap">
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-cyan-400"
              ><circle
                cx="12"
                cy="12"
                r="10"
              /><polyline points="12,6 12,12 16,14" /></svg>
              <span class="font-medium">{{ formatPlayTime(playerStats?.totalPlayTimeMinutes || 0) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-green-400"
              ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>
              <span>{{ formatRelativeTime(playerStats?.lastPlayed || '') }}</span>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="flex flex-col gap-4 items-end">
          <!-- Quick Actions -->
          <div class="flex flex-col sm:flex-row gap-3">
            <router-link
              :to="{ path: '/players/compare', query: { player1: playerName } }"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200"
              title="Compare this player with another"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
              </svg>
              Compare Player
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>
