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
        <!-- Tournament Matches Table -->
        <div v-if="allMatchesByWeek.length > 0" class="backdrop-blur-sm border-2 rounded-xl overflow-hidden" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
            <h3 class="text-xl font-semibold flex items-center gap-3" :style="{ color: getTextColor() }">
              All Matches
            </h3>
          </div>

          <!-- Matches Table -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <!-- Table Body -->
              <tbody>
                <!-- Week groups with matches -->
                <template v-for="weekGroup in allMatchesByWeek" :key="weekGroup.week || 'no-week'">
                  <!-- Week Header Row -->
                  <tr v-if="!weekGroup.hideWeekHeader" class="border-b" :style="{ backgroundColor: getBackgroundSoftColor(), borderColor: getAccentColor() }">
                    <td class="p-4 w-32">
                      <span class="text-sm font-bold uppercase tracking-wide" :style="{ color: getAccentColor() }">
                        {{ weekGroup.week }}
                      </span>
                    </td>
                    <td colspan="3" class="p-4 text-center">
                      <span class="text-sm font-bold uppercase tracking-wide" :style="{ color: getAccentColor() }">
                        {{ getWeekDateRange(weekGroup.week, weekGroup.matches) }}
                      </span>
                    </td>
                  </tr>

                  <!-- Match rows -->
                  <tr
                    v-for="matchItem in weekGroup.matches"
                    :key="matchItem.match.id"
                    class="group transition-all duration-300 border-b"
                    :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }"
                  >
                    <!-- Date -->
                    <td class="p-3">
                      <div class="text-xs font-mono" :style="{ color: getTextMutedColor() }">
                        {{ formatMatchDate(matchItem.match.scheduledDate) }}
                      </div>
                    </td>

                    <!-- Team Matchup -->
                    <td class="p-3">
                      <div class="flex items-center gap-2 flex-wrap">
                        <button
                          class="text-left px-2 py-1 rounded transition-all hover:bg-slate-700/30"
                          :class="{ 'font-bold': getMatchWinner(matchItem.match) === 'team1' }"
                          :style="{ color: getMatchWinner(matchItem.match) === 'team1' ? getAccentColor() : getTextColor() }"
                          @click="openMatchupModal(matchItem.match)"
                        >
                          <div class="flex items-center gap-1">
                            <span v-if="getMatchWinner(matchItem.match) === 'team1'" class="text-lg">🏆</span>
                            {{ matchItem.match.team1Name }}
                          </div>
                        </button>
                        <div class="text-xs font-medium" :style="{ color: getTextMutedColor() }">VS</div>
                        <button
                          class="text-left px-2 py-1 rounded transition-all hover:bg-slate-700/30"
                          :class="{ 'font-bold': getMatchWinner(matchItem.match) === 'team2' }"
                          :style="{ color: getMatchWinner(matchItem.match) === 'team2' ? getAccentColor() : getTextColor() }"
                          @click="openMatchupModal(matchItem.match)"
                        >
                          <div class="flex items-center gap-1">
                            <span v-if="getMatchWinner(matchItem.match) === 'team2'" class="text-lg">🏆</span>
                            {{ matchItem.match.team2Name }}
                          </div>
                        </button>
                      </div>
                    </td>

                    <!-- Maps Summary (scores only) -->
                    <td class="p-3">
                      <div class="text-xs space-y-0.5">
                        <div v-for="map in matchItem.match.maps" :key="map.id" class="flex items-center gap-2">
                          <span class="font-mono" :style="{ color: getTextMutedColor() }">{{ map.mapOrder + 1 }}.</span>
                          <span v-if="map.matchResults?.length > 0" :style="{ color: getAccentColor() }" class="font-bold">
                            {{ getFormattedScore(map) }}
                          </span>
                          <span v-else :style="{ color: getTextMutedColor() }">—</span>
                        </div>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="p-3 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          class="px-3 py-1.5 text-xs font-bold transition-all rounded border-2"
                          :style="{ borderColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.2), color: getAccentColor() }"
                          @click="openMatchupModal(matchItem.match)"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="allMatchesByWeek.length === 0" class="text-center py-20">
          <div class="text-8xl mb-6 opacity-50">📅</div>
          <h3 class="text-2xl font-bold" :style="{ color: getTextColor() }">No Matches Yet</h3>
          <p class="text-lg" :style="{ color: getTextMutedColor() }">
            Check back soon for match announcements!
          </p>
        </div>
      </div>

      <!-- Match Details Modal -->
      <div
        v-if="selectedMatch"
        class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="closeMatchupModal"
      >
        <div
          class="rounded-2xl p-6 max-w-5xl w-full shadow-2xl max-h-[85vh] overflow-y-auto border-2"
          :style="{
            background: getBackgroundSoftColor(),
            backdropFilter: 'blur(10px)',
            borderColor: getAccentColor(),
            backgroundColor: getBackgroundSoftColor()
          }"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div class="flex-1">
              <h3 class="text-3xl font-bold text-center mb-3" :style="{ color: getAccentColor() }">
                Match Details
              </h3>
            </div>
            <button
              class="p-2 rounded-lg transition-colors flex-shrink-0"
              :style="{ color: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.2) }"
              @click="closeMatchupModal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Match Summary -->
          <div class="mb-8 p-4 rounded-lg" :style="{ backgroundColor: getBackgroundMuteColor(), borderLeft: `4px solid ${getAccentColor()}` }">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="text-center">
                <p class="text-sm mb-2" :style="{ color: getTextMutedColor() }">{{ formatMatchDate(selectedMatch.scheduledDate) }}</p>
                <p class="text-xl font-bold" :style="{ color: getTextColor() }">{{ selectedMatch.team1Name }}</p>
              </div>
              <p class="text-sm font-mono" :style="{ color: getTextMutedColor() }">{{ getResultsAggregation(selectedMatch) }}</p>
              <div class="text-center">
                <p class="text-xl font-bold" :style="{ color: getTextColor() }">{{ selectedMatch.team2Name }}</p>
              </div>
            </div>
          </div>

          <!-- Match Results by Map -->
          <div class="space-y-6">
            <div v-for="map in selectedMatch.maps" :key="map.id" class="p-4 rounded-lg border-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }">
              <!-- Map Name -->
              <h4 class="text-lg font-bold mb-4" :style="{ color: getAccentColor() }">{{ map.mapName }}</h4>

              <!-- Round Results -->
              <div class="space-y-3 mb-4">
                <div
                  v-for="(result, idx) in map.matchResults"
                  :key="idx"
                  class="p-3 rounded flex items-center justify-between"
                  :style="{ backgroundColor: getBackgroundSoftColor() }"
                >
                  <div class="flex items-center gap-4 flex-1">
                    <span class="text-xs font-bold w-12" :style="{ color: getTextMutedColor() }">ROUND {{ idx + 1 }}</span>
                    <span class="font-mono font-bold" :style="{ color: getTextColor() }">{{ result.team1Tickets }}</span>
                    <span :style="{ color: getTextMutedColor() }">—</span>
                    <span class="font-mono font-bold" :style="{ color: getTextColor() }">{{ result.team2Tickets }}</span>
                  </div>
                </div>
              </div>

              <!-- Total for Map -->
              <div class="p-3 rounded border-t-2 pt-4 font-bold flex items-center justify-between" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
                <span :style="{ color: getAccentColor() }">TOTAL</span>
                <div class="flex items-center gap-4">
                  <span class="font-mono" :style="{ color: getAccentColor() }">{{ getResultsAggregation(selectedMatch, map.id).split(' – ')[0] }}</span>
                  <span :style="{ color: getTextMutedColor() }">—</span>
                  <span class="font-mono" :style="{ color: getAccentColor() }">{{ getResultsAggregation(selectedMatch, map.id).split(' – ')[1] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TournamentHero from '@/components/TournamentHero.vue'
import { publicTournamentService, type PublicTournamentMatch } from '@/services/publicTournamentService'
import { usePublicTournamentPage } from '@/composables/usePublicTournamentPage'

interface MatchItem {
  match: PublicTournamentMatch
}

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
  getAccentColorWithOpacity,
} = usePublicTournamentPage()

const selectedMatch = ref<PublicTournamentMatch | null>(null)

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
</script>
