<template>
  <div class="relative min-h-screen px-3 sm:px-6 pb-12">
    <!-- Background Effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <div class="relative z-10 max-w-7xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center min-h-screen">
        <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6">
        <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <p class="text-red-400 mb-4">{{ error }}</p>
          <button
            class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="router.push('/dashboard')"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Tournament Content -->
      <div v-else-if="tournament" class="space-y-6">
        <!-- Header Section -->
        <div class="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
          <!-- Hero Image Background -->
          <div
            v-if="heroImageUrl"
            class="absolute inset-0 opacity-20"
          >
            <img
              :src="heroImageUrl"
              :alt="tournament.name"
              class="w-full h-full object-cover"
            >
            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
          </div>

          <!-- Header Content -->
          <div class="relative z-10 p-6 sm:p-8 md:p-12">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <button
                    class="text-slate-400 hover:text-slate-200 transition-colors"
                    @click="router.push('/dashboard')"
                    title="Back to Dashboard"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div
                    class="w-8 h-8 rounded bg-cover bg-center flex-shrink-0"
                    :style="{ backgroundImage: getGameIcon() }"
                  />
                  <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400">
                    {{ tournament.name }}
                  </h1>
                </div>

                <div class="flex flex-wrap items-center gap-4 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span>👤</span>
                    <span class="font-medium">{{ tournament.organizer }}</span>
                  </span>
                  <span>•</span>
                  <span>{{ formatDate(tournament.createdAt) }}</span>
                  <span v-if="tournament.serverName">
                    •
                  </span>
                  <span v-if="tournament.serverName" class="flex items-center gap-2">
                    <span>🖥️</span>
                    <span class="font-medium">{{ tournament.serverName }}</span>
                  </span>
                  <span v-if="tournament.anticipatedRoundCount">
                    •
                  </span>
                  <span v-if="tournament.anticipatedRoundCount" class="flex items-center gap-2">
                    <span>🎯</span>
                    <span>{{ tournament.rounds.length }}/{{ tournament.anticipatedRoundCount }} rounds</span>
                  </span>
                </div>
              </div>

              <button
                class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg transition-all flex items-center gap-2"
                @click="showEditModal = true"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
            </div>

            <!-- Progress Bar -->
            <div v-if="tournament.anticipatedRoundCount" class="mt-6">
              <div class="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Tournament Progress</span>
                <span class="font-mono">{{ getProgressPercentage() }}%</span>
              </div>
              <div class="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  :style="{ width: getProgressPercentage() + '%' }"
                />
              </div>
            </div>

            <!-- Overall Winner -->
            <div
              v-if="tournament.overallWinner"
              class="mt-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <span class="text-3xl">🏆</span>
                <div>
                  <div class="font-bold text-lg text-amber-400">Tournament Winner</div>
                  <div class="text-slate-300">{{ tournament.overallWinner.team }}</div>
                  <div class="text-sm text-slate-400 mt-1">
                    {{ tournament.overallWinner.players.join(', ') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rounds Section -->
        <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
          <div class="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div>
              <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Tournament Rounds
              </h2>
              <p class="text-slate-400 text-sm mt-1">
                Manage and track all rounds in this tournament
              </p>
            </div>
            <button
              class="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              @click="showAddRoundModal = true"
            >
              <span class="text-lg">+</span>
              <span>Add Round</span>
            </button>
          </div>

          <div class="p-4 sm:p-6">
            <!-- Rounds Table -->
            <div v-if="tournament.rounds.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-700/50">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Round
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
                      Server
                    </th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(round, index) in tournament.rounds"
                    :key="round.roundId"
                    class="group border-l-4 border-b border-slate-700/30 hover:bg-slate-800/40 transition-all duration-150"
                    :class="getLeftBorderColor(round.winningTeam)"
                  >
                    <!-- Round Number -->
                    <td class="py-3 px-4">
                      <span class="px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full">
                        #{{ index + 1 }}
                      </span>
                    </td>

                    <!-- Map Column (with time as subheading) -->
                    <td class="py-3 px-4">
                      <div class="flex flex-col gap-1">
                        <span
                          class="text-sm font-bold"
                          :class="getMapAccentColor(round.mapName)"
                        >
                          {{ round.mapName }}
                        </span>
                        <span class="text-xs text-slate-500 font-medium">
                          {{ formatRelativeTime(round.startTime) }} ago
                        </span>
                      </div>
                    </td>

                    <!-- Winner Column -->
                    <td class="py-3 px-4">
                      <span
                        v-if="round.winningTeam"
                        class="text-sm font-semibold"
                        :class="getTeamColor(round.winningTeam)"
                      >
                        {{ round.winningTeam }}
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
                        v-if="round.tickets1 !== null && round.tickets2 !== null"
                        class="flex items-center gap-1 font-mono text-sm"
                      >
                        <span class="text-slate-200 font-bold">{{ round.tickets1 }}</span>
                        <span class="text-slate-600">-</span>
                        <span class="text-slate-500">{{ round.tickets2 }}</span>
                      </div>
                      <span
                        v-else
                        class="text-sm text-slate-500"
                      >
                        —
                      </span>
                    </td>

                    <!-- Server Column (hidden on mobile) -->
                    <td class="py-3 px-4 hidden md:table-cell">
                      <span class="text-sm text-slate-400 truncate max-w-[200px] block">
                        {{ round.serverName }}
                      </span>
                    </td>

                    <!-- Actions Column -->
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          class="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all text-xs font-medium"
                          @click="viewRoundReport(round.roundId)"
                        >
                          View Report
                        </button>
                        <button
                          class="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all"
                          @click="confirmDeleteRound(round.roundId, round.mapName, round.serverName, index + 1)"
                          title="Remove round from tournament"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
              <div class="text-6xl mb-4">🎮</div>
              <h3 class="text-xl font-bold text-slate-300 mb-2">No Rounds Yet</h3>
              <p class="text-slate-400 mb-6">
                Add rounds as the tournament progresses to track results and determine the winner
              </p>
              <button
                class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
                @click="showAddRoundModal = true"
              >
                Add First Round
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Tournament Modal -->
    <AddTournamentModal
      v-if="showEditModal && tournament"
      :tournament="tournament"
      @close="showEditModal = false"
      @added="onTournamentUpdated"
    />

    <!-- Add Round Modal -->
    <AddRoundModal
      v-if="showAddRoundModal && tournament"
      :tournament-id="tournament.id"
      :game="tournament.game"
      :default-server-guid="tournament.serverGuid"
      :default-server-name="tournament.serverName"
      @close="showAddRoundModal = false"
      @added="onRoundAdded"
    />

    <!-- Delete Round Confirmation Modal -->
    <div
      v-if="deleteRoundConfirmation"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="cancelDeleteRound"
    >
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-slate-100 mb-2">
              Remove Round from Tournament?
            </h3>
            <p class="text-slate-300 mb-2">
              Remove <span class="font-bold text-cyan-400">Round #{{ deleteRoundConfirmation.roundNumber }}</span>
              (<span class="text-amber-400">{{ deleteRoundConfirmation.mapName }}</span>) on
              <span class="text-slate-300">{{ deleteRoundConfirmation.serverName }}</span> from this tournament?
            </p>
            <p class="text-slate-400">
              You can re-add it later using ID: <code class="text-cyan-400 font-mono">{{ deleteRoundConfirmation.roundId }}</code>
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="cancelDeleteRound"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            :disabled="isDeleting"
            @click="executeDeleteRound"
          >
            <svg v-if="!isDeleting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{{ isDeleting ? 'Removing...' : 'Remove Round' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminTournamentService, type TournamentDetail } from '@/services/adminTournamentService';
import AddTournamentModal from '@/components/dashboard/AddTournamentModal.vue';
import AddRoundModal from '@/components/dashboard/AddRoundModal.vue';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

const tournament = ref<TournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showEditModal = ref(false);
const showAddRoundModal = ref(false);
const deleteRoundConfirmation = ref<{ roundId: string; mapName: string; serverName: string; roundNumber: number } | null>(null);
const isDeleting = ref(false);

const tournamentId = parseInt(route.params.id as string);

const loadTournament = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (isNaN(tournamentId)) {
      throw new Error('Invalid tournament ID');
    }

    const data = await adminTournamentService.getTournamentDetail(tournamentId);
    tournament.value = data;

    // Load hero image if available
    if (data.heroImageBase64) {
      heroImageUrl.value = `data:${data.heroImageContentType || 'image/png'};base64,${data.heroImageBase64}`;
    } else {
      // Try to fetch from API
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
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(adminTournamentService.getTournamentImageUrl(tournamentId), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      heroImageUrl.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    // Silently fail - hero image is optional
    console.debug('No hero image available');
  }
};

const getProgressPercentage = (): number => {
  if (!tournament.value?.anticipatedRoundCount || tournament.value.anticipatedRoundCount === 0) {
    return 0;
  }
  return Math.min(100, (tournament.value.rounds.length / tournament.value.anticipatedRoundCount) * 100);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
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

const getTeamColor = (teamLabel: string | null | undefined): string => {
  if (!teamLabel) return 'text-slate-300';
  const label = teamLabel.toLowerCase();
  if (label.includes('axis') || label.includes('red')) return 'text-red-400';
  if (label.includes('allies') || label.includes('blue')) return 'text-blue-400';
  if (label.includes('north') || label.includes('nva')) return 'text-red-400';
  if (label.includes('south') || label.includes('usa')) return 'text-blue-400';
  return 'text-purple-400';
};

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

const getLeftBorderColor = (winningTeam: string | undefined): string => {
  if (!winningTeam) return 'border-l-cyan-400';
  const team = winningTeam.toLowerCase();
  if (team.includes('axis') || team.includes('red')) return 'border-l-red-400';
  if (team.includes('allies') || team.includes('blue')) return 'border-l-blue-400';
  return 'border-l-cyan-400';
};

const viewRoundReport = (roundId: string) => {
  router.push(`/rounds/${roundId}/report`);
};

const onTournamentUpdated = () => {
  showEditModal.value = false;
  loadTournament(); // Reload to get updated data
};

const onRoundAdded = () => {
  showAddRoundModal.value = false;
  loadTournament(); // Reload to get updated rounds
};

const confirmDeleteRound = (roundId: string, mapName: string, serverName: string, roundNumber: number) => {
  deleteRoundConfirmation.value = { roundId, mapName, serverName, roundNumber };
};

const cancelDeleteRound = () => {
  deleteRoundConfirmation.value = null;
  isDeleting.value = false;
};

const executeDeleteRound = async () => {
  if (!deleteRoundConfirmation.value || !tournament.value) return;

  isDeleting.value = true;
  try {
    await adminTournamentService.removeRoundFromTournament(
      tournament.value.id,
      deleteRoundConfirmation.value.roundId
    );

    // Close modal and reload tournament data
    deleteRoundConfirmation.value = null;
    await loadTournament();
  } catch (err) {
    console.error('Error removing round:', err);
    error.value = err instanceof Error ? err.message : 'Failed to remove round';
  } finally {
    isDeleting.value = false;
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

onMounted(() => {
  loadTournament();
});
</script>

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
