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
          v-if="heroImageUrl"
          class="absolute inset-0"
        >
          <img
            :src="heroImageUrl"
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
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-12">
        <!-- Upcoming Matches Section -->
        <div v-if="upcomingMatches.length > 0">
          <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
            Upcoming Matches
          </h2>

          <div class="space-y-6">
            <div
              v-for="(match, index) in upcomingMatches"
              :key="match.id"
              class="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border-2 border-violet-500/40 overflow-hidden hover:border-violet-500/60 transition-all duration-300 shadow-xl"
            >
              <MatchCard :match="match" :index="index" :is-upcoming="true" />
            </div>
          </div>
        </div>

        <!-- Completed Matches Section -->
        <div v-if="completedMatches.length > 0">
          <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            Completed Matches
          </h2>

          <div class="space-y-6">
            <div
              v-for="(match, index) in completedMatches"
              :key="match.id"
              class="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border-2 border-slate-700/50 overflow-hidden hover:border-emerald-500/40 transition-all duration-300 shadow-xl"
            >
              <MatchCard :match="match" :index="index" :is-upcoming="false" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="upcomingMatches.length === 0 && completedMatches.length === 0" class="text-center py-20">
          <div class="text-8xl mb-6 opacity-50">📅</div>
          <h3 class="text-2xl font-bold text-slate-300 mb-3">No Matches Scheduled Yet</h3>
          <p class="text-slate-400 text-lg">
            Check back soon for match announcements!
          </p>
        </div>

        <!-- Teams Section -->
        <div v-if="tournament.teams.length > 0">
          <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            Teams
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="team in tournament.teams"
              :key="team.id"
              class="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-xl border-2 border-slate-700/50 p-6 hover:border-amber-500/40 transition-all duration-300 shadow-lg text-left"
              @click="openTeamModal(team)"
            >
              <h3 class="text-xl font-bold text-amber-400 mb-2">{{ team.name }}</h3>
              <p class="text-slate-400">
                {{ team.players.length }} {{ team.players.length === 1 ? 'player' : 'players' }}
              </p>
              <div class="mt-3 text-sm text-cyan-400 flex items-center gap-2">
                <span>View Roster</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Roster Modal -->
    <div
      v-if="selectedTeam"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeTeamModal"
    >
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h3 class="text-2xl font-bold text-amber-400 mb-2">{{ selectedTeam.name }}</h3>
            <p class="text-slate-400">{{ selectedTeam.players.length }} {{ selectedTeam.players.length === 1 ? 'player' : 'players' }}</p>
          </div>
          <button
            class="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            @click="closeTeamModal"
          >
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-2">
          <router-link
            v-for="player in selectedTeam.players"
            :key="player.playerName"
            :to="`/players/${player.playerName}`"
            class="block px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/50 rounded-lg transition-all"
          >
            <span class="text-cyan-400 hover:text-cyan-300 font-medium">{{ player.playerName }}</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import {
  publicTournamentService,
  type PublicTournamentDetail,
  type PublicTournamentMatch,
  type PublicTournamentTeam,
  type PublicTournamentMatchMap
} from '@/services/publicTournamentService';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

const tournament = ref<PublicTournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedTeam = ref<PublicTournamentTeam | null>(null);

const tournamentId = parseInt(route.params.id as string);

// Match Card Component
const MatchCard = defineComponent({
  props: {
    match: {
      type: Object as () => PublicTournamentMatch,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    isUpcoming: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    const router = useRouter();

    const viewRoundReport = (roundId: string) => {
      router.push(`/rounds/${roundId}/report`);
    };

    const getTeamPlayers = (map: PublicTournamentMatchMap, team: number) => {
      if (!map.round?.players) return [];
      return map.round.players
        .filter(p => p.team === team)
        .sort((a, b) => b.totalScore - a.totalScore);
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

    const getMatchWinner = (): string | null => {
      const completedMaps = props.match.maps.filter(map => map.round);
      if (completedMaps.length === 0 || completedMaps.length < props.match.maps.length) {
        return null;
      }

      const team1Wins = completedMaps.filter(map => map.round?.winningTeamName === props.match.team1Name).length;
      const team2Wins = completedMaps.filter(map => map.round?.winningTeamName === props.match.team2Name).length;

      if (team1Wins > team2Wins) return props.match.team1Name;
      if (team2Wins > team1Wins) return props.match.team2Name;
      return null;
    };

    return () => h('div', [
      // Match Header
      h('div', {
        class: 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 px-4 sm:px-6 py-3 border-b border-slate-700/50'
      }, [
        h('div', { class: 'flex items-center justify-between' }, [
          h('div', { class: 'flex items-center gap-3' }, [
            h('span', { class: 'text-2xl sm:text-3xl font-black text-violet-400' }, props.index + 1),
            h('span', { class: 'text-slate-400 text-sm sm:text-base' }, `📅 ${formatMatchDate(props.match.scheduledDate)}`)
          ]),
          props.match.serverName && h('div', { class: 'text-slate-400 text-xs sm:text-sm hidden sm:block' }, `🖥️ ${props.match.serverName}`)
        ])
      ]),

      // Team Matchup
      h('div', { class: 'px-4 sm:px-8 py-6 sm:py-8' }, [
        h('div', { class: 'flex items-center justify-between gap-4 mb-6' }, [
          // Team 1
          h('div', { class: 'flex-1 text-center' }, [
            h('div', { class: 'text-2xl sm:text-3xl font-bold text-emerald-400 mb-2' }, props.match.team1Name),
            getMatchWinner() === props.match.team1Name && h('div', {
              class: 'inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold'
            }, '🏆 Winner')
          ]),

          // VS Divider
          h('div', { class: 'flex-shrink-0' }, [
            h('div', {
              class: 'text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-purple-400 px-4'
            }, 'VS')
          ]),

          // Team 2
          h('div', { class: 'flex-1 text-center' }, [
            h('div', { class: 'text-2xl sm:text-3xl font-bold text-emerald-400 mb-2' }, props.match.team2Name),
            getMatchWinner() === props.match.team2Name && h('div', {
              class: 'inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold'
            }, '🏆 Winner')
          ])
        ]),

        // Maps & Rounds
        h('div', { class: 'space-y-3' }, [
          h('div', { class: 'text-center text-slate-400 text-sm font-medium mb-3' }, 'Maps'),
          ...props.match.maps.map(map =>
            h('div', {
              key: map.id,
              class: 'bg-slate-800/60 rounded-xl p-4 border border-slate-700/50'
            }, [
              // Map Header
              h('div', { class: 'flex items-center justify-between gap-4 mb-4' }, [
                h('div', { class: 'flex items-center gap-3 flex-1 min-w-0' }, [
                  h('span', { class: 'text-lg font-mono font-bold text-violet-400 flex-shrink-0' }, map.mapOrder + 1),
                  h('span', { class: 'text-lg font-bold text-amber-400 truncate' }, map.mapName)
                ]),
                map.round
                  ? h('button', {
                      class: 'px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all text-sm font-medium flex items-center gap-2',
                      onClick: () => viewRoundReport(map.roundId!)
                    }, [
                      h('span', {}, 'View Report'),
                      h('svg', {
                        class: 'w-4 h-4',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                      }, [
                        h('path', {
                          'stroke-linecap': 'round',
                          'stroke-linejoin': 'round',
                          'stroke-width': '2',
                          d: 'M9 5l7 7-7 7'
                        })
                      ])
                    ])
                  : h('div', { class: 'text-slate-500 text-sm italic' }, 'Pending')
              ]),

              // Leaderboard
              map.round?.players && map.round.players.length > 0 && h('div', { class: 'grid grid-cols-1 lg:grid-cols-2 gap-4' }, [
                // Team 1 Column
                h('div', {
                  class: map.round.winningTeamName === props.match.team1Name
                    ? 'bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg p-3'
                    : 'bg-slate-700/30 border border-slate-600/30 rounded-lg p-3'
                }, [
                  h('div', { class: 'text-center font-bold text-emerald-400 mb-3 flex items-center justify-center gap-2' }, [
                    h('span', {}, props.match.team1Name),
                    map.round.winningTeamName === props.match.team1Name && h('span', {}, '🏆')
                  ]),
                  h('div', { class: 'space-y-2' }, [
                    // Header
                    h('div', { class: 'grid grid-cols-4 gap-2 text-xs text-slate-400 font-medium pb-2 border-b border-slate-600/50' }, [
                      h('div', {}, 'Player'),
                      h('div', { class: 'text-center' }, 'S'),
                      h('div', { class: 'text-center' }, 'K'),
                      h('div', { class: 'text-center' }, 'D')
                    ]),
                    // Players
                    ...getTeamPlayers(map, 1).map(player =>
                      h('div', {
                        key: player.playerName,
                        class: 'grid grid-cols-4 gap-2 text-sm hover:bg-slate-600/20 rounded px-1 py-1'
                      }, [
                        h(RouterLink, {
                          to: `/players/${player.playerName}`,
                          class: 'text-cyan-400 hover:text-cyan-300 truncate'
                        }, () => player.playerName),
                        h('div', { class: 'text-center text-slate-300' }, player.totalScore.toLocaleString()),
                        h('div', { class: 'text-center text-slate-300' }, player.totalKills),
                        h('div', { class: 'text-center text-slate-300' }, player.totalDeaths)
                      ])
                    )
                  ])
                ]),

                // Team 2 Column
                h('div', {
                  class: map.round.winningTeamName === props.match.team2Name
                    ? 'bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg p-3'
                    : 'bg-slate-700/30 border border-slate-600/30 rounded-lg p-3'
                }, [
                  h('div', { class: 'text-center font-bold text-emerald-400 mb-3 flex items-center justify-center gap-2' }, [
                    h('span', {}, props.match.team2Name),
                    map.round.winningTeamName === props.match.team2Name && h('span', {}, '🏆')
                  ]),
                  h('div', { class: 'space-y-2' }, [
                    // Header
                    h('div', { class: 'grid grid-cols-4 gap-2 text-xs text-slate-400 font-medium pb-2 border-b border-slate-600/50' }, [
                      h('div', {}, 'Player'),
                      h('div', { class: 'text-center' }, 'S'),
                      h('div', { class: 'text-center' }, 'K'),
                      h('div', { class: 'text-center' }, 'D')
                    ]),
                    // Players
                    ...getTeamPlayers(map, 2).map(player =>
                      h('div', {
                        key: player.playerName,
                        class: 'grid grid-cols-4 gap-2 text-sm hover:bg-slate-600/20 rounded px-1 py-1'
                      }, [
                        h(RouterLink, {
                          to: `/players/${player.playerName}`,
                          class: 'text-cyan-400 hover:text-cyan-300 truncate'
                        }, () => player.playerName),
                        h('div', { class: 'text-center text-slate-300' }, player.totalScore.toLocaleString()),
                        h('div', { class: 'text-center text-slate-300' }, player.totalKills),
                        h('div', { class: 'text-center text-slate-300' }, player.totalDeaths)
                      ])
                    )
                  ])
                ])
              ])
            ])
          )
        ])
      ])
    ]);
  }
});

const upcomingMatches = computed(() => {
  if (!tournament.value) return [];
  return tournament.value.matches
    .filter(match => {
      // A match is upcoming if not all maps have been played
      const completedMaps = match.maps.filter(map => map.round);
      return completedMaps.length < match.maps.length;
    })
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
});

const completedMatches = computed(() => {
  if (!tournament.value) return [];
  return tournament.value.matches
    .filter(match => {
      // A match is completed if all maps have been played
      const completedMaps = match.maps.filter(map => map.round);
      return completedMaps.length === match.maps.length && match.maps.length > 0;
    })
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
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

    // Load hero image if available
    if (data.hasHeroImage) {
      await loadHeroImage();
    }
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
  } finally {
    loading.value = false;
  }
};

const loadHeroImage = async () => {
  try {
    const response = await fetch(publicTournamentService.getTournamentImageUrl(tournamentId));

    if (response.ok) {
      const blob = await response.blob();
      heroImageUrl.value = URL.createObjectURL(blob);
    }
  } catch {
    // Silently fail - hero image is optional
    console.debug('No hero image available');
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

const openTeamModal = (team: PublicTournamentTeam) => {
  selectedTeam.value = team;
};

const closeTeamModal = () => {
  selectedTeam.value = null;
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

/* Modal scrollbar styling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
