<template>
  <div class="min-h-screen pb-12">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6 max-w-4xl mx-auto mt-20">
      <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <p class="text-red-400 mb-4">{{ error }}</p>
        <button
          class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          @click="router.push('/servers/bf1942')"
        >
          Back to Servers
        </button>
      </div>
    </div>

    <!-- Tournament Content -->
    <div v-else-if="tournament">
      <!-- Hero Banner Section -->
      <div class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <!-- Background Hero Image -->
        <div
          v-if="tournament.heroImageUrl"
          class="absolute inset-0"
        >
          <img
            :src="tournament.heroImageUrl"
            :alt="tournament.name"
            class="w-full h-full object-cover opacity-30"
          >
          <div class="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900" />
        </div>

        <!-- Decorative Elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 px-4 sm:px-6 py-12 sm:py-20">
          <div class="max-w-6xl mx-auto">
            <!-- Game Icon Badge -->
            <div class="flex justify-center mb-6">
              <div
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cover bg-center border-4 border-amber-500/30 shadow-2xl"
                :style="{ backgroundImage: getGameIcon() }"
              />
            </div>

            <!-- Tournament Name -->
            <h1 class="text-4xl sm:text-5xl md:text-7xl font-black text-center mb-6 leading-tight">
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 drop-shadow-2xl">
                {{ tournament.name }}
              </span>
            </h1>

            <!-- Organizer & Info -->
            <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-300 mb-8">
              <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-amber-400">👤</span>
                <span class="font-medium">{{ tournament.organizer }}</span>
              </div>
              <div v-if="tournament.serverName" class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-cyan-400">🖥️</span>
                <span class="font-medium">{{ tournament.serverName }}</span>
              </div>
              <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-emerald-400">⚔️</span>
                <span class="font-medium">{{ tournament.matches.length }} Matches</span>
              </div>
            </div>

            <!-- Decorative Divider -->
            <div class="flex items-center justify-center gap-4 mb-8">
              <div class="h-px w-20 bg-gradient-to-r from-transparent to-amber-500/50" />
              <div class="w-2 h-2 rotate-45 bg-amber-500" />
              <div class="h-px w-20 bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-8">
        <!-- Matches Section -->
        <div>
          <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
            Match Schedule
          </h2>

          <div v-if="sortedMatches.length > 0" class="space-y-6">
            <div
              v-for="(match, index) in sortedMatches"
              :key="match.id"
              class="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border-2 border-slate-700/50 overflow-hidden hover:border-violet-500/40 transition-all duration-300 shadow-xl"
            >
              <!-- Match Header -->
              <div class="bg-gradient-to-r from-slate-800/50 to-slate-900/50 px-4 sm:px-6 py-3 border-b border-slate-700/50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl sm:text-3xl font-black text-violet-400">{{ index + 1 }}</span>
                    <span class="text-slate-400 text-sm sm:text-base">📅 {{ formatMatchDate(match.scheduledDate) }}</span>
                  </div>
                  <div v-if="match.serverName" class="text-slate-400 text-xs sm:text-sm hidden sm:block">
                    🖥️ {{ match.serverName }}
                  </div>
                </div>
              </div>

              <!-- Team Matchup -->
              <div class="px-4 sm:px-8 py-6 sm:py-8">
                <div class="flex items-center justify-between gap-4 mb-6">
                  <!-- Team 1 -->
                  <div class="flex-1 text-center">
                    <div class="text-2xl sm:text-3xl font-bold text-emerald-400 mb-2">
                      {{ match.team1Name }}
                    </div>
                    <div v-if="getMatchWinner(match) === 'team1'" class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold">
                      🏆 Winner
                    </div>
                  </div>

                  <!-- VS Divider -->
                  <div class="flex-shrink-0">
                    <div class="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-purple-400 px-4">
                      VS
                    </div>
                  </div>

                  <!-- Team 2 -->
                  <div class="flex-1 text-center">
                    <div class="text-2xl sm:text-3xl font-bold text-emerald-400 mb-2">
                      {{ match.team2Name }}
                    </div>
                    <div v-if="getMatchWinner(match) === 'team2'" class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold">
                      🏆 Winner
                    </div>
                  </div>
                </div>

                <!-- Maps & Rounds -->
                <div class="space-y-3">
                  <div class="text-center text-slate-400 text-sm font-medium mb-3">
                    Maps
                  </div>
                  <div
                    v-for="map in match.maps"
                    :key="map.id"
                    class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50"
                  >
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="text-lg font-mono font-bold text-violet-400 flex-shrink-0">{{ map.mapOrder + 1 }}</span>
                        <span class="text-lg font-bold text-amber-400 truncate">{{ map.mapName }}</span>
                      </div>

                      <!-- Round Result -->
                      <div v-if="map.round" class="flex items-center gap-3">
                        <div class="text-right flex-shrink-0">
                          <div v-if="map.round.winnerTeamLabel" class="text-sm font-bold text-emerald-400 mb-1">
                            🏆 {{ map.round.winnerTeamLabel }}
                          </div>
                          <div v-if="map.round.tickets1 !== undefined && map.round.tickets2 !== undefined" class="text-xs text-slate-400">
                            {{ map.round.team1Label || 'Team 1' }}: {{ map.round.tickets1 }} - {{ map.round.team2Label || 'Team 2' }}: {{ map.round.tickets2 }}
                          </div>
                        </div>
                        <button
                          class="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
                          @click="viewRoundReport(map.roundId!)"
                        >
                          <span>View Report</span>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      <!-- Pending Round -->
                      <div v-else class="text-slate-500 text-sm italic">
                        Pending
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-20">
            <div class="text-8xl mb-6 opacity-50">📅</div>
            <h3 class="text-2xl font-bold text-slate-300 mb-3">No Matches Scheduled Yet</h3>
            <p class="text-slate-400 text-lg">
              Check back soon for match announcements!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  publicTournamentService,
  type PublicTournamentDetail,
  type PublicTournamentMatch
} from '@/services/publicTournamentService';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

const tournament = ref<PublicTournamentDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const tournamentId = parseInt(route.params.id as string);

const sortedMatches = computed(() => {
  if (!tournament.value) return [];
  return [...tournament.value.matches].sort((a, b) => {
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });
});

const loadTournament = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (isNaN(tournamentId)) {
      throw new Error('Invalid tournament ID');
    }

    const data = await publicTournamentService.getTournamentDetail(tournamentId);
    tournament.value = data;
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
  } finally {
    loading.value = false;
  }
};

const getGameIcon = (): string => {
  if (!tournament.value) return `url('${bf1942Icon}')`;

  const iconMap: Record<string, string> = {
    'bf1942': `url('${bf1942Icon}')`,
    'fh2': `url('${fh2Icon}')`,
    'bfvietnam': `url('${bfvIcon}')`
  };
  return iconMap[tournament.value.game] || `url('${bf1942Icon}')`;
};

const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getMatchWinner = (match: PublicTournamentMatch): 'team1' | 'team2' | 'draw' | null => {
  // Check if all maps have been played
  const completedMaps = match.maps.filter(map => map.round);
  if (completedMaps.length === 0 || completedMaps.length < match.maps.length) {
    return null;
  }

  let team1Wins = 0;
  let team2Wins = 0;

  for (const map of completedMaps) {
    if (map.round?.winnerTeamLabel) {
      // Match winner label against team names
      if (map.round.winnerTeamLabel === match.team1Name || map.round.team1Label === map.round.winnerTeamLabel) {
        team1Wins++;
      } else if (map.round.winnerTeamLabel === match.team2Name || map.round.team2Label === map.round.winnerTeamLabel) {
        team2Wins++;
      }
    }
  }

  if (team1Wins > team2Wins) return 'team1';
  if (team2Wins > team1Wins) return 'team2';
  if (team1Wins === team2Wins && team1Wins > 0) return 'draw';

  return null;
};

const viewRoundReport = (roundId: string) => {
  router.push(`/rounds/${roundId}/report`);
};

onMounted(() => {
  loadTournament();
});
</script>

<style scoped>
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>
