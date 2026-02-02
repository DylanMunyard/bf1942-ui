<template>
  <div class="portal-page min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: 'var(--portal-bg)' }">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
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
      <div class="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 mt-8 sm:mt-12 space-y-8">
        <!-- Tournament Rankings Table Component -->
        <TournamentRankingsTable
          :leaderboard="leaderboard"
          title="Tournament Rankings"
          :logo-image-url="logoImageUrl"
          :game-mode="tournament?.gameMode"
          :accent-color="getAccentColor()"
          :text-color="getTextColor()"
          :text-muted-color="getTextMutedColor()"
          :background-soft-color="getBackgroundSoftColor()"
          :background-mute-color="getBackgroundMuteColor()"
        />
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TournamentHero from '@/components/TournamentHero.vue'
import TournamentRankingsTable from '@/components/TournamentRankingsTable.vue'
import { publicTournamentService, type PublicTournamentLeaderboard } from '@/services/publicTournamentService'
import { usePublicTournamentPage } from '@/composables/usePublicTournamentPage'
import { notificationService } from '@/services/notificationService'

const {
  tournament,
  loading,
  error,
  heroImageUrl,
  logoImageUrl,
  tournamentId,
  themeVars,
  getBackgroundColor,
  getBackgroundSoftColor,
  getBackgroundMuteColor,
  getTextColor,
  getTextMutedColor,
  getAccentColor,
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

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `Rankings - ${newTournament.name} - BF Stats`
    document.title = fullTitle
    notificationService.updateOriginalTitle()
  }
})

</script>

<style src="./portal-layout.css"></style>
