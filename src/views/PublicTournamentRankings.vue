<template>
  <div class="min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: getBackgroundColor() }">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div class="relative z-10 text-center max-w-lg w-full">
        <div class="mb-8 flex justify-center">
          <div class="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
            <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 class="text-4xl md:text-5xl font-black mb-4" :style="{ color: getAccentColor() }">
          Tournament Not Found
        </h1>

        <p class="text-lg mb-8" :style="{ color: getTextMutedColor() }">
          {{ error }}
        </p>
      </div>
    </div>

    <!-- Tournament Content -->
    <div v-else-if="tournament">
      <!-- Tournament Hero with Navigation -->
      <TournamentHero
        :tournament="tournament"
        :tournament-id="tournamentId"
        :hero-image-url="heroImageUrl"
        :logo-image-url="logoImageUrl"
      />

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-8">
        <!-- Tournament Leaderboard -->
        <div v-if="leaderboard && leaderboard.rankings.length > 0" class="backdrop-blur-sm border-2 rounded-xl overflow-hidden" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
          <!-- Leaderboard Header -->
          <div class="px-6 py-4 border-b-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
            <h3 class="text-xl font-semibold" :style="{ color: getTextColor() }">
              🏆 Tournament Rankings
            </h3>
          </div>

          <!-- Leaderboard Table -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr :style="{ backgroundColor: getBackgroundMuteColor() }">
                  <th class="p-4 text-left font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Ranking
                  </th>
                  <th class="p-4 text-left font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Team
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Matches Played
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Victories
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Ties
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Losses
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Rounds Won
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Rounds Tied
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Rounds Lost
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Tickets For
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Tickets Against
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Ticket Differential
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ranking, idx) in leaderboard.rankings"
                  :key="ranking.teamId"
                  class="group transition-all duration-300 border-b"
                  :style="{ borderColor: getAccentColor(), backgroundColor: idx % 2 === 0 ? getBackgroundMuteColor() : getBackgroundSoftColor() }"
                >
                  <!-- Ranking -->
                  <td class="p-4">
                    <div class="flex items-center gap-2">
                      <span v-if="ranking.rank === 1" class="text-xl">🥇</span>
                      <span v-else-if="ranking.rank === 2" class="text-xl">🥈</span>
                      <span v-else-if="ranking.rank === 3" class="text-xl">🥉</span>
                      <span v-else class="text-sm font-bold" :style="{ color: getAccentColor() }">{{ ranking.rank }}</span>
                    </div>
                  </td>

                  <!-- Team Name -->
                  <td class="p-4">
                    <div class="text-sm font-bold" :style="{ color: getTextColor() }">
                      {{ ranking.teamName }}
                    </div>
                  </td>

                  <!-- Matches Played -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextColor() }">
                      {{ ranking.matchesPlayed }}
                    </span>
                  </td>

                  <!-- Victories -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ ranking.victories }}
                    </span>
                  </td>

                  <!-- Ties -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.ties }}
                    </span>
                  </td>

                  <!-- Losses -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.losses }}
                    </span>
                  </td>

                  <!-- Rounds Won -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ ranking.roundsWon }}
                    </span>
                  </td>

                  <!-- Rounds Tied -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.roundsTied }}
                    </span>
                  </td>

                  <!-- Rounds Lost -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.roundsLost }}
                    </span>
                  </td>

                  <!-- Tickets For -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-mono" :style="{ color: getTextColor() }">
                      {{ ranking.ticketsFor }}
                    </span>
                  </td>

                  <!-- Tickets Against -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-mono" :style="{ color: getTextColor() }">
                      {{ ranking.ticketsAgainst }}
                    </span>
                  </td>

                  <!-- Ticket Differential -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-mono" :style="{ color: ranking.ticketDifferential >= 0 ? getAccentColor() : '#ef4444' }">
                      {{ ranking.ticketDifferential >= 0 ? '+' : '' }}{{ ranking.ticketDifferential }}
                    </span>
                  </td>

                  <!-- Points -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ ranking.points }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="backdrop-blur-sm border-2 rounded-xl p-8 text-center" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
          <div v-if="logoImageUrl" class="mb-6 flex justify-center">
            <img :src="logoImageUrl" alt="Community logo" class="max-h-32 object-contain opacity-70">
          </div>
          <div v-else class="text-5xl mb-4 opacity-50">🏆</div>
          <h3 class="text-xl font-semibold mb-2" :style="{ color: getTextColor() }">No Rankings Available Yet</h3>
          <p :style="{ color: getTextMutedColor() }">
            Rankings will appear here once matches are completed and results are calculated.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TournamentHero from '@/components/TournamentHero.vue'
import { publicTournamentService, type PublicTournamentLeaderboard } from '@/services/publicTournamentService'
import { usePublicTournamentPage } from '@/composables/usePublicTournamentPage'

const {
  tournament,
  loading,
  error,
  heroImageUrl,
  logoImageUrl,
  tournamentId,
  themeVars,
  getBackgroundColor,
  getTextColor,
  getTextMutedColor,
  getAccentColor,
  getBackgroundMuteColor,
  getBackgroundSoftColor,
} = usePublicTournamentPage()

const leaderboard = ref<PublicTournamentLeaderboard | null>(null)

const loadLeaderboard = async () => {
  try {
    const data = await publicTournamentService.getLeaderboard(tournamentId.value)
    leaderboard.value = data
  } catch (err) {
    console.error('Failed to load leaderboard:', err)
  }
}

// Load leaderboard when tournament ID changes
import { watch, onMounted } from 'vue'
onMounted(() => {
  loadLeaderboard()
})

watch(
  () => tournamentId.value,
  () => {
    loadLeaderboard()
  }
)
</script>
