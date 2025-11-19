<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { PlayerTimeStatistics } from '../../services/playerStatsService';

interface Props {
  playerName: string;
  playerStats: PlayerTimeStatistics | null;
}

const props = defineProps<Props>();
const router = useRouter();

// Best Scores state
const selectedBestScoresTab = ref<'allTime' | 'last30Days' | 'thisWeek'>('allTime');
const bestScoresTabOptions = [
  { key: 'allTime' as const, label: 'All Time' },
  { key: 'last30Days' as const, label: '30 Days' },
  { key: 'thisWeek' as const, label: 'This Week' }
] as const;

// Computed property for current best scores
const currentBestScores = computed(() => {
  if (!props.playerStats?.bestScores) return [];
  return props.playerStats.bestScores[selectedBestScoresTab.value] || [];
});

// Function to handle best scores tab change with scroll reset
const changeBestScoresTab = (tabKey: 'allTime' | 'last30Days' | 'thisWeek') => {
  selectedBestScoresTab.value = tabKey;

  // Reset scroll position of horizontal scroll container on mobile
  setTimeout(() => {
    const scrollContainer = document.querySelector('.best-scores-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollLeft = 0;
    }
  }, 50); // Small delay to ensure DOM has updated
};

// Navigate to round report
const navigateToRoundReport = (roundId: string) => {
  router.push({
    name: 'round-report',
    params: {
      roundId: roundId,
    },
    query: {
      players: props.playerName // Include the player name to pin them
    }
  });
};

// Helper functions
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
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

// Check if best scores should be shown
const shouldShowBestScores = computed(() => {
  return props.playerStats?.bestScores && (
    props.playerStats.bestScores.allTime?.length > 0 ||
    props.playerStats.bestScores.last30Days?.length > 0 ||
    props.playerStats.bestScores.thisWeek?.length > 0
  );
});
</script>

<template>
  <!-- Best Scores Section -->
  <div
    v-if="shouldShowBestScores"
    class="relative bg-gradient-to-br from-amber-900/20 via-slate-800/80 to-slate-900/80 backdrop-blur-lg rounded-2xl border border-amber-500/30 shadow-2xl"
  >
    <!-- Spectacular Background Effects -->
    <div class="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10" />
    <div class="absolute top-0 left-1/3 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
    <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-yellow-500/15 to-orange-500/15 rounded-full blur-2xl animate-pulse delay-700" />
    <div class="absolute top-1/2 left-0 w-32 h-32 bg-amber-400/20 rounded-full blur-xl animate-ping delay-300" />

    <!-- Crown decoration -->
    <div class="absolute top-4 right-8 text-4xl md:text-6xl opacity-20 animate-bounce">
      👑
    </div>

    <div class="relative z-10 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <!-- Header with dramatic styling - More compact on mobile -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-lg sm:text-2xl animate-spin-slow">
              🏆
            </div>
            <h3 class="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
              Best Scores
            </h3>
          </div>
          <p class="text-amber-200/90 text-sm sm:text-lg font-medium">
            Your greatest battlefield achievements
          </p>
        </div>

        <!-- Tab Controls with premium styling - More compact on mobile -->
        <div class="flex items-center bg-slate-900/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 sm:p-2 border border-amber-500/20 shadow-xl">
          <div
            v-for="tab in bestScoresTabOptions"
            :key="tab.key"
            class="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base cursor-pointer transition-all duration-300 group"
            :class="{
              'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg transform scale-105': selectedBestScoresTab === tab.key,
              'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10': selectedBestScoresTab !== tab.key
            }"
            @click="changeBestScoresTab(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <div
              v-if="selectedBestScoresTab === tab.key"
              class="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-lg sm:rounded-xl animate-pulse"
            />
          </div>
        </div>
      </div>

      <!-- Best Scores Content -->
      <div class="space-y-3 sm:space-y-4">
        <!-- No scores message -->
        <div
          v-if="currentBestScores.length === 0"
          class="flex flex-col items-center justify-center py-8 sm:py-16 text-center space-y-3 sm:space-y-4"
        >
          <div class="text-4xl sm:text-8xl opacity-30">
            🎯
          </div>
          <p class="text-lg sm:text-xl font-semibold text-amber-300">
            No scores recorded yet
          </p>
          <p class="text-amber-200/70 text-sm sm:text-base">
            Start playing to build your legendary scores!
          </p>
        </div>

        <!-- Mobile: Horizontal Scroll Layout / Desktop: Grid Layout -->
        <div v-else>
          <!-- Mobile Horizontal Scroll (< lg screens) -->
          <div class="lg:hidden">
            <div class="overflow-x-auto pb-4 scrollbar-hide best-scores-scroll-container">
              <div class="flex gap-3 min-w-max px-1 pt-4 pb-2">
                <div
                  v-for="(score, index) in currentBestScores.slice(0, 6)"
                  :key="`${score.roundId}-${index}`"
                  class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-500/20 hover:border-amber-400/50 transition-all duration-500 hover:scale-105 cursor-pointer flex-none w-72"
                  @click="navigateToRoundReport(score.roundId)"
                >
                  <!-- Mobile Card Content - More Compact -->
                  <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

                  <!-- Rank badge - smaller on mobile -->
                  <div class="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-black text-slate-900 text-sm shadow-lg z-20">
                    {{ index + 1 }}
                  </div>

                  <div class="relative z-10 p-4 space-y-3">
                    <!-- Compact Score Header -->
                    <div class="flex items-center justify-between">
                      <div class="space-y-1">
                        <div class="text-2xl font-black text-amber-300">
                          {{ score.score.toLocaleString() }}
                        </div>
                        <div class="text-xs text-amber-200/70">
                          SCORE
                        </div>
                      </div>
                      <div class="text-right space-y-1">
                        <div class="text-lg font-bold text-emerald-400">
                          {{ calculateKDR(score.kills, score.deaths) }}
                        </div>
                        <div class="text-xs text-slate-400">
                          K/D
                        </div>
                      </div>
                    </div>

                    <!-- Compact Stats Row -->
                    <div class="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div class="flex items-center gap-3">
                        <div class="text-center">
                          <div class="text-sm font-bold text-emerald-400">
                            {{ score.kills }}
                          </div>
                          <div class="text-xs text-slate-500">
                            K
                          </div>
                        </div>
                        <div class="w-px h-6 bg-slate-600" />
                        <div class="text-center">
                          <div class="text-sm font-bold text-red-400">
                            {{ score.deaths }}
                          </div>
                          <div class="text-xs text-slate-500">
                            D
                          </div>
                        </div>
                      </div>
                      <div class="text-lg opacity-50">
                        ⚔️
                      </div>
                    </div>

                    <!-- Map & Server Info - Compact -->
                    <div class="space-y-2">
                      <div class="text-xs text-amber-300 font-semibold truncate">
                        {{ score.mapName }}
                      </div>
                      <div class="text-xs text-slate-400 truncate">
                        {{ score.serverName }}
                      </div>
                      <div class="flex items-center gap-1 text-xs text-slate-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                          />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                        <span>{{ formatRelativeTime(score.timestamp) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Show More Button for Mobile -->
            <div
              v-if="currentBestScores.length > 6"
              class="text-center pt-3"
            >
              <router-link
                :to="`/players/${encodeURIComponent(playerName)}/achievements`"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-400/50 rounded-lg transition-all duration-300"
              >
                <span>View All {{ currentBestScores.length }} Scores</span>
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
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </router-link>
            </div>
          </div>

          <!-- Desktop Grid Layout (lg+ screens) -->
          <div class="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-6 pt-6">
            <div
              v-for="(score, index) in currentBestScores"
              :key="`${score.roundId}-${index}`"
              class="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-amber-500/20 hover:border-amber-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer"
              @click="navigateToRoundReport(score.roundId)"
            >
              <!-- Card background effects -->
              <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div class="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <!-- Rank badge -->
              <div class="absolute -top-5 -right-5 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-black text-slate-900 text-base shadow-xl z-20">
                {{ index + 1 }}
              </div>

              <!-- Hover overlay -->
              <div class="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

              <!-- Click indicator -->
              <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <div class="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
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
                    class="text-amber-400"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </div>

              <div class="relative z-10 p-6 space-y-4">
                <!-- Score Header -->
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <div class="text-3xl font-black text-amber-300">
                      {{ score.score.toLocaleString() }}
                    </div>
                    <div class="text-sm text-amber-200/70">
                      SCORE
                    </div>
                  </div>
                  <div class="text-right space-y-1">
                    <div class="text-lg font-bold text-emerald-400">
                      {{ calculateKDR(score.kills, score.deaths) }}
                    </div>
                    <div class="text-sm text-slate-400">
                      K/D
                    </div>
                  </div>
                </div>

                <!-- Stats Row -->
                <div class="flex items-center justify-between py-3 px-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div class="flex items-center gap-4">
                    <div class="text-center">
                      <div class="text-lg font-bold text-emerald-400">
                        {{ score.kills }}
                      </div>
                      <div class="text-xs text-slate-500">
                        KILLS
                      </div>
                    </div>
                    <div class="w-px h-8 bg-slate-600" />
                    <div class="text-center">
                      <div class="text-lg font-bold text-red-400">
                        {{ score.deaths }}
                      </div>
                      <div class="text-xs text-slate-500">
                        DEATHS
                      </div>
                    </div>
                  </div>
                  <div class="text-2xl opacity-50">
                    ⚔️
                  </div>
                </div>

                <!-- Map & Server Info -->
                <div class="space-y-3">
                  <div class="space-y-1">
                    <div class="text-sm text-amber-300 font-semibold">
                      {{ score.mapName }}
                    </div>
                    <div class="text-xs text-slate-400 truncate">
                      {{ score.serverName }}
                    </div>
                  </div>

                  <!-- Timestamp -->
                  <div class="flex items-center gap-2 text-xs text-slate-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                      />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <span>{{ formatRelativeTime(score.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
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

.delay-300 {
  animation-delay: 300ms;
}

.delay-700 {
  animation-delay: 700ms;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
