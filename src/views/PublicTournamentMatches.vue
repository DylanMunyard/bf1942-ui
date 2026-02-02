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
        <!-- Matches Table Component -->
        <TournamentMatchesTable
          :matches="allMatches"
          :group-by-week="true"
          :accent-color="getAccentColor()"
          :text-color="getTextColor()"
          :text-muted-color="getTextMutedColor()"
          :background-color="getBackgroundColor()"
          :background-soft-color="getBackgroundSoftColor()"
          :background-mute-color="getBackgroundMuteColor()"
          @match-selected="openMatchupModal"
        />
      </div>

      <!-- Match Details Modal Component -->
      <MatchDetailsModal
        :match="selectedMatch"
        :teams="tournament?.teams || []"
        :tournament-id="tournamentId"
        :accent-color="getAccentColor()"
        :text-color="getTextColor()"
        :text-muted-color="getTextMutedColor()"
        :background-color="getBackgroundColor()"
        :background-soft-color="getBackgroundSoftColor()"
        :background-mute-color="getBackgroundMuteColor()"
        @close="closeMatchupModal"
        @compare-players="comparePlayers"
      />
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlayerComparison } from '@/composables/usePlayerComparison'
import TournamentHero from '@/components/TournamentHero.vue'
import TournamentMatchesTable from '@/components/TournamentMatchesTable.vue'
import MatchDetailsModal from '@/components/MatchDetailsModal.vue'
import { publicTournamentService, type PublicTournamentMatch } from '@/services/publicTournamentService'
import { usePublicTournamentPage } from '@/composables/usePublicTournamentPage'
import { notificationService } from '@/services/notificationService'

interface MatchItem {
  match: PublicTournamentMatch
}

const { comparePlayers } = usePlayerComparison()

const {
  tournament,
  loading,
  error,
  heroImageUrl,
  logoImageUrl,
  tournamentId,
  themeVars,
  getAccentColorWithOpacity,
  getBackgroundColor,
  getBackgroundSoftColor,
  getBackgroundMuteColor,
  getTextColor,
  getTextMutedColor,
  getAccentColor,
} = usePublicTournamentPage()

const selectedMatch = ref<PublicTournamentMatch | null>(null)

const allMatches = computed(() => {
  if (!tournament.value?.matchesByWeek) return []

  // Flatten all matches from all week groups
  const flattened: PublicTournamentMatch[] = []
  tournament.value.matchesByWeek.forEach(group => {
    flattened.push(...group.matches)
  })
  return flattened
})

const allMatchesByWeek = computed(() => {
  if (!tournament.value?.matchesByWeek) return []

  // Check if there's only one week group with null week value
  const hasOnlyOneNullWeek = tournament.value.matchesByWeek.length === 1 && tournament.value.matchesByWeek[0].week === null

  return tournament.value.matchesByWeek
    .map(group => ({
      week: group.week,
      hideWeekHeader: hasOnlyOneNullWeek,
      matches: group.matches.map(match => ({ match }))
    }))
    .filter(group => group.matches.length > 0)
})

const formatMatchDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
         date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const getMatchWinner = (match: PublicTournamentMatch): 'team1' | 'team2' | 'tie' => {
  if (!match.maps || match.maps.length === 0) return 'tie'

  let team1RoundsWon = 0
  let team2RoundsWon = 0

  match.maps.forEach(map => {
    if (map.matchResults && map.matchResults.length > 0) {
      const lastRound = map.matchResults[map.matchResults.length - 1]
      if (lastRound.team1Tickets > lastRound.team2Tickets) team1RoundsWon++
      else if (lastRound.team2Tickets > lastRound.team1Tickets) team2RoundsWon++
    }
  })

  if (team1RoundsWon > team2RoundsWon) return 'team1'
  if (team2RoundsWon > team1RoundsWon) return 'team2'
  return 'tie'
}

const getFormattedScore = (map: any): string => {
  if (!map.matchResults || map.matchResults.length === 0) return '—'

  const results = map.matchResults
  const lastRound = results[results.length - 1]

  const team1Tickets = lastRound.team1Tickets
  const team2Tickets = lastRound.team2Tickets

  return `${team1Tickets} – ${team2Tickets} (${results.length} – ${results.length})`
}

const getResultsAggregation = (match: PublicTournamentMatch, mapId?: number): string => {
  if (!match.maps || match.maps.length === 0) return '0 – 0'

  const mapsToUse = mapId ? match.maps.filter(m => m.id === mapId) : match.maps

  let team1Total = 0
  let team2Total = 0

  mapsToUse.forEach(map => {
    if (map.matchResults && map.matchResults.length > 0) {
      const lastRound = map.matchResults[map.matchResults.length - 1]
      team1Total += lastRound.team1Tickets
      team2Total += lastRound.team2Tickets
    }
  })

  return `${team1Total} – ${team2Total}`
}

const getWeekDateRange = (week: string | null, matches: MatchItem[]): string => {
  if (!matches || matches.length === 0) return week || 'Unscheduled'

  const dates = matches
    .map(m => new Date(m.match.scheduledDate).getTime())
    .filter(d => !isNaN(d))

  if (dates.length === 0) return week || 'Unscheduled'

  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return `${formatDate(minDate)} - ${formatDate(maxDate)}`
}

const openMatchupModal = (match: PublicTournamentMatch) => {
  selectedMatch.value = match
}

const closeMatchupModal = () => {
  selectedMatch.value = null
}

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `Matches - ${newTournament.name} - BF Stats`
    document.title = fullTitle
    notificationService.updateOriginalTitle()
  }
})

</script>

<style src="./portal-layout.css"></style>
