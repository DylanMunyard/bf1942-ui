<template>
  <div class="space-y-6">
    <!-- Week groups with match cards -->
    <template v-for="weekGroup in groupedMatches" :key="weekGroup.week || 'no-week'">
      <!-- Week Header -->
      <div v-if="!weekGroup.hideWeekHeader && groupByWeek" class="mt-8 mb-4">
        <h3 class="text-lg font-bold uppercase tracking-wide" :style="{ color: accentColor }">
          {{ weekGroup.week }}
        </h3>
        <p class="text-sm mt-1" :style="{ color: textMutedColor }">
          {{ getWeekDateRange(weekGroup.week, weekGroup.matches) }}
        </p>
      </div>

      <!-- Match cards -->
      <div class="space-y-3">
        <div
          v-for="match in weekGroup.matches"
          :key="match.id"
          class="backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all hover:border-opacity-100 cursor-pointer"
          :style="{ borderColor: accentColor, backgroundColor: backgroundSoftColor }"
          @click="emit('match-selected', match)"
        >
          <div class="p-4 sm:p-6">
            <div class="flex flex-col gap-4">
              <!-- First row: Date, Teams, Score (if available) -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <!-- Match Date - wider on desktop -->
                <div class="text-xs sm:text-sm font-mono min-w-max" :style="{ color: textMutedColor }">
                  {{ formatMatchDate(match.scheduledDate) }}
                </div>

                <!-- Teams & Winner -->
                <div class="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div
                    class="text-sm sm:text-base font-semibold flex items-center gap-1 px-2 py-1 rounded"
                    :style="{
                      color: getMatchWinner(match) === 'team1' ? accentColor : textColor,
                      backgroundColor: getMatchWinner(match) === 'team1' ? accentColor + '15' : 'transparent'
                    }"
                  >
                    <span v-if="getMatchWinner(match) === 'team1'" class="text-lg">🏆</span>
                    {{ match.team1Name }}
                  </div>
                  <div class="text-xs sm:text-sm font-medium" :style="{ color: textMutedColor }">
                    vs
                  </div>
                  <div
                    class="text-sm sm:text-base font-semibold flex items-center gap-1 px-2 py-1 rounded"
                    :style="{
                      color: getMatchWinner(match) === 'team2' ? accentColor : textColor,
                      backgroundColor: getMatchWinner(match) === 'team2' ? accentColor + '15' : 'transparent'
                    }"
                  >
                    <span v-if="getMatchWinner(match) === 'team2'" class="text-lg">🏆</span>
                    {{ match.team2Name }}
                  </div>
                </div>

                <!-- Score with round count (only if match has results) -->
                <div v-if="hasMatchResults(match)" class="flex items-center gap-4">
                  <div class="text-sm sm:text-base font-bold" :style="{ color: accentColor }">
                    {{ getResultsAggregation(match) }}
                  </div>

                  <!-- View Button -->
                  <button
                    class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-all self-start sm:self-auto"
                    :style="{
                      backgroundColor: accentColor + '20',
                      color: accentColor,
                      border: `1px solid ${accentColor}`
                    }"
                    @click.stop="emit('match-selected', match)"
                  >
                    Details
                  </button>
                </div>
                <div v-else>
                  <!-- View Button (no results) -->
                  <button
                    class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-all"
                    :style="{
                      backgroundColor: accentColor + '20',
                      color: accentColor,
                      border: `1px solid ${accentColor}`
                    }"
                    @click.stop="emit('match-selected', match)"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-if="groupedMatches.length === 0" class="text-center py-20">
      <div class="text-8xl mb-6 opacity-50">📅</div>
      <h3 class="text-2xl font-bold" :style="{ color: textColor }">No Matches Yet</h3>
      <p class="text-lg" :style="{ color: textMutedColor }">
        Check back soon for match announcements!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PublicTournamentMatch } from '@/services/publicTournamentService'

interface Props {
  matches: PublicTournamentMatch[]
  groupByWeek?: boolean
  // Theme colors
  accentColor: string
  textColor: string
  textMutedColor: string
  backgroundColor: string
  backgroundSoftColor: string
  backgroundMuteColor: string
}

interface WeekGroup {
  week: string | null
  matches: PublicTournamentMatch[]
  hideWeekHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  groupByWeek: true
})

const emit = defineEmits<{
  'match-selected': [match: PublicTournamentMatch]
}>()

// Group matches by week if needed
const groupedMatches = computed<WeekGroup[]>(() => {
  if (!props.groupByWeek) {
    // Return all matches in a single group without week header
    return [
      {
        week: null,
        matches: props.matches,
        hideWeekHeader: true
      }
    ]
  }

  // Group by week
  const grouped = new Map<string | null, PublicTournamentMatch[]>()
  props.matches.forEach(match => {
    const week = match.week || null
    if (!grouped.has(week)) {
      grouped.set(week, [])
    }
    grouped.get(week)!.push(match)
  })

  return Array.from(grouped.entries()).map(([week, matches]) => ({
    week,
    matches,
    hideWeekHeader: false
  }))
})

// Helper: Check if match has results
const hasMatchResults = (match: PublicTournamentMatch): boolean => {
  if (!match.maps || match.maps.length === 0) return false
  return match.maps.some(map => map.matchResults && map.matchResults.length > 0)
}

// Helper: Format match date
const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  return date.toLocaleDateString('en-US', options)
}

// Helper: Determine match winner based on round wins
// Uses actual team IDs to handle cases where team1/team2 positions flip between rounds
const getMatchWinner = (match: PublicTournamentMatch): 'team1' | 'team2' | 'tie' => {
  if (!match.maps || match.maps.length === 0) return 'tie'

  // Get the two distinct teams from all rounds
  const teamsMap = new Map<number, { id: number, name: string }>()

  for (const map of match.maps) {
    if (map.matchResults && map.matchResults.length > 0) {
      for (const round of map.matchResults) {
        if (round.team1Id && round.team1Name) {
          teamsMap.set(round.team1Id, { id: round.team1Id, name: round.team1Name })
        }
        if (round.team2Id && round.team2Name) {
          teamsMap.set(round.team2Id, { id: round.team2Id, name: round.team2Name })
        }
      }
    }
  }

  if (teamsMap.size !== 2) return 'tie'

  const teams = Array.from(teamsMap.values())
  const teamA = teams[0]
  const teamB = teams[1]

  // Determine which team is "team1" based on match-level team names
  const isATeam1 = teamA.name === match.team1Name
  const team1Id = isATeam1 ? teamA.id : teamB.id
  const team2Id = isATeam1 ? teamB.id : teamA.id

  let team1RoundsWon = 0
  let team2RoundsWon = 0
  let team1TotalTickets = 0
  let team2TotalTickets = 0

  match.maps.forEach(map => {
    if (map.matchResults && map.matchResults.length > 0) {
      map.matchResults.forEach(round => {
        if (round.winningTeamId === team1Id) {
          team1RoundsWon++
        } else if (round.winningTeamId === team2Id) {
          team2RoundsWon++
        }

        // Track total tickets for tiebreaker
        if (round.team1Id === team1Id) {
          team1TotalTickets += round.team1Tickets || 0
          team2TotalTickets += round.team2Tickets || 0
        } else {
          team1TotalTickets += round.team2Tickets || 0
          team2TotalTickets += round.team1Tickets || 0
        }
      })
    }
  })

  if (team1RoundsWon > team2RoundsWon) return 'team1'
  if (team2RoundsWon > team1RoundsWon) return 'team2'

  // If round wins are tied, use total tickets as tiebreaker
  if (team1TotalTickets > team2TotalTickets) return 'team1'
  if (team2TotalTickets > team1TotalTickets) return 'team2'

  return 'tie'
}

// Helper: Get aggregated results across all maps
// Returns format: "793 – 0 (4 – 0)" where first is ticket score, second is round score
// Uses actual team IDs to handle cases where team1/team2 positions flip between rounds
const getResultsAggregation = (match: PublicTournamentMatch, mapId?: number): string => {
  if (!match.maps || match.maps.length === 0) return '0 – 0 (0 – 0)'

  // Get the two distinct teams from all rounds
  const teamsMap = new Map<number, { id: number, name: string }>()

  for (const map of match.maps) {
    if (map.matchResults && map.matchResults.length > 0) {
      for (const round of map.matchResults) {
        if (round.team1Id && round.team1Name) {
          teamsMap.set(round.team1Id, { id: round.team1Id, name: round.team1Name })
        }
        if (round.team2Id && round.team2Name) {
          teamsMap.set(round.team2Id, { id: round.team2Id, name: round.team2Name })
        }
      }
    }
  }

  if (teamsMap.size !== 2) return '0 – 0 (0 – 0)'

  const teams = Array.from(teamsMap.values())
  const teamA = teams[0]
  const teamB = teams[1]

  // Determine which team is "team1" based on match-level team names
  const isATeam1 = teamA.name === match.team1Name
  const team1Id = isATeam1 ? teamA.id : teamB.id
  const team2Id = isATeam1 ? teamB.id : teamA.id

  let team1Total = 0
  let team2Total = 0
  let team1RoundsWon = 0
  let team2RoundsWon = 0

  const mapsToUse = mapId ? match.maps.filter(m => m.id === mapId) : match.maps

  mapsToUse.forEach(map => {
    if (map.matchResults && map.matchResults.length > 0) {
      map.matchResults.forEach(round => {
        // Add tickets for each team based on their actual ID
        if (round.team1Id === team1Id) {
          team1Total += round.team1Tickets
          team2Total += round.team2Tickets
        } else {
          team1Total += round.team2Tickets
          team2Total += round.team1Tickets
        }

        // Count round wins
        if (round.winningTeamId === team1Id) {
          team1RoundsWon++
        } else if (round.winningTeamId === team2Id) {
          team2RoundsWon++
        }
      })
    }
  })

  return `${team1Total} – ${team2Total} (${team1RoundsWon} – ${team2RoundsWon})`
}

// Helper: Get week date range
const getWeekDateRange = (week: string | null, matches: PublicTournamentMatch[]): string => {
  if (!matches || matches.length === 0) return week || 'Unscheduled'

  const dates = matches
    .map(m => new Date(m.scheduledDate).getTime())
    .filter(d => !isNaN(d))

  if (dates.length === 0) return week || 'Unscheduled'

  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  })

  if (minDate.getTime() === maxDate.getTime()) {
    return formatter.format(minDate)
  }

  return `${formatter.format(minDate)} – ${formatter.format(maxDate)}`
}
</script>
