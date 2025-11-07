<template>
  <div
    v-if="match"
    class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div
      class="rounded-2xl p-6 max-w-5xl w-full shadow-2xl max-h-[85vh] overflow-y-auto border-2"
      :style="{
        background: backgroundSoftColor,
        backdropFilter: 'blur(10px)',
        borderColor: accentColor,
        backgroundColor: backgroundSoftColor
      }"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1">
          <h3 class="text-3xl font-bold text-center mb-3" :style="{ color: accentColor }">
            Match Details
          </h3>
          <div class="flex items-center justify-center gap-4 text-sm flex-wrap" :style="{ color: textColor }">
            <span>{{ match.team1Name }} vs {{ match.team2Name }}</span>
            <span>📅 {{ formatMatchDate(match.scheduledDate) }}</span>
            <span v-if="match.serverName">🖥️ {{ match.serverName }}</span>
          </div>
        </div>
        <button
          class="p-2 rounded-lg transition-colors flex-shrink-0"
          :style="{ color: accentColor, backgroundColor: getAccentColorWithOpacity(0.2) }"
          @click="emit('close')"
          @mouseenter="(e) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.35);
            }
          }"
          @mouseleave="(e) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.2);
            }
          }"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Maps and Results Table -->
      <div class="rounded-lg overflow-hidden border-2" :style="{ borderColor: accentColor }">
        <table class="w-full border-collapse">
          <thead>
            <tr :style="{ backgroundColor: backgroundMuteColor }">
              <th class="p-3 text-left font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              </th>
              <th class="p-3 text-left font-bold text-xs uppercase border-b border-l-4" :style="{ color: textColor, borderColor: accentColor, borderLeftColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1) }">
                {{ match.team1Name }}
              </th>
              <th class="p-3 text-left font-bold text-xs uppercase border-b border-l-4" :style="{ color: textColor, borderColor: accentColor, borderLeftColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1) }">
                {{ match.team2Name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Group results by map -->
            <template v-for="map in match.maps" :key="map.id">
              <!-- Map Header Row - without the summary score -->
              <tr :style="{ borderColor: accentColor, backgroundColor: backgroundSoftColor }" class="border-b">
                <td colspan="3" class="p-3">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-bold" :style="{ color: accentColor }">
                      {{ map.mapName }}
                    </span>
                    <span v-if="map.teamName" class="text-xs" :style="{ color: textMutedColor }">
                      (Selected by {{ map.teamName }})
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Rounds for this map -->
              <tr
                v-for="(result, roundIndex) in map.matchResults"
                :key="`${map.id}-${result.id}`"
                class="border-b transition-all group"
                :style="{ borderColor: accentColor, backgroundColor: backgroundMuteColor }"
              >
                <!-- Round number -->
                <td class="p-3" :style="{ color: textMutedColor }">
                  <div class="text-xs font-mono">Round {{ roundIndex + 1 }}</div>
                </td>

                <!-- Team 1 Score -->
                <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold" :style="{ color: textColor }">
                      {{ getTeamTickets(match, result, 'team1') }}
                    </span>
                    <span v-if="result.winningTeamId === getTeamIdForColumn(match, 'team1')" class="text-lg">🏆</span>
                  </div>
                </td>

                <!-- Team 2 Score -->
                <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold" :style="{ color: textColor }">
                      {{ getTeamTickets(match, result, 'team2') }}
                    </span>
                    <span v-if="result.winningTeamId === getTeamIdForColumn(match, 'team2')" class="text-lg">🏆</span>
                  </div>
                </td>
              </tr>

              <!-- Empty state if no results for this map -->
              <tr v-if="!map.matchResults || map.matchResults.length === 0" :style="{ borderColor: accentColor, backgroundColor: backgroundMuteColor }" class="border-b">
                <td colspan="3" class="p-3 text-center" :style="{ color: textMutedColor }">
                  <span class="text-xs">No results yet</span>
                </td>
              </tr>
            </template>

            <!-- Total Row (Sum of all rounds across all maps) -->
            <tr v-if="hasResults" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.15) }" class="border-t-4 font-bold">
              <td class="p-4" :style="{ color: accentColor, borderColor: accentColor }">
                <div class="text-xs font-mono uppercase">Total</div>
              </td>
              <td class="p-4" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                <div class="text-lg font-bold" :style="{ color: accentColor }">
                  {{ calculateGrandTotal().team1 }}
                </div>
              </td>
              <td class="p-4" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                <div class="text-lg font-bold" :style="{ color: accentColor }">
                  {{ calculateGrandTotal().team2 }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Expandable Player Stats Section -->
      <!-- Note: Player stats are not available in the current API schema. This will be added in a future update. -->
      <div class="space-y-4">
        <div v-for="map in match.maps" :key="map.id" class="space-y-2">
          <!-- Player stats unavailable - will be added in future update -->
        </div>
      </div>

      <!-- Expandable Player Stats Table (Disabled until round data available) -->
      <!-- This section is disabled and will be implemented in a future update when player stats are available -->

      <!-- Player Comparison Section -->
      <div class="mt-8 space-y-4">
        <h3 class="text-lg font-bold" :style="{ color: accentColor }">Compare Players</h3>

        <!-- Rosters Table -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse rounded-lg overflow-hidden border-2" :style="{ borderColor: accentColor }">
            <thead>
              <tr :style="{ backgroundColor: backgroundMuteColor }">
                <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b border-r-2" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1), color: accentColor }">
                  <div class="flex flex-col items-center gap-2">
                    <span>{{ match.team1Name }}</span>
                    <span class="text-xs font-normal" :style="{ color: textMutedColor }">
                      {{ getTeamRoster(match, match.team1Name).length }} players
                    </span>
                  </div>
                </th>
                <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1), color: accentColor }">
                  <div class="flex flex-col items-center gap-2">
                    <span>{{ match.team2Name }}</span>
                    <span class="text-xs font-normal" :style="{ color: textMutedColor }">
                      {{ getTeamRoster(match, match.team2Name).length }} players
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(_, idx) in Math.max(
                  getTeamRoster(match, match.team1Name).length,
                  getTeamRoster(match, match.team2Name).length
                )"
                :key="idx"
                class="border-b transition-all"
                :style="{ borderColor: accentColor, backgroundColor: backgroundMuteColor }"
                @mouseenter="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.08);
                  }
                }"
                @mouseleave="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = backgroundMuteColor;
                  }
                }"
              >
                <!-- Team 1 Player -->
                <td class="p-3 border-r-2" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.05) }">
                  <button
                    v-if="getTeamRoster(match, match.team1Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(match, match.team1Name)[idx].playerName)
                      ? 'border-2 font-bold'
                      : ''"
                    :style="isPlayerSelected(getTeamRoster(match, match.team1Name)[idx].playerName)
                      ? {
                          backgroundColor: getAccentColorWithOpacity(0.2),
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          color: accentColor
                        }"
                    @click="selectPlayerForComparison(getTeamRoster(match, match.team1Name)[idx].playerName, match.team1Name)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(match, match.team1Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(match, match.team1Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: accentColor }">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </td>
                <!-- Team 2 Player -->
                <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.05) }">
                  <button
                    v-if="getTeamRoster(match, match.team2Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(match, match.team2Name)[idx].playerName)
                      ? 'border-2 font-bold'
                      : ''"
                    :style="isPlayerSelected(getTeamRoster(match, match.team2Name)[idx].playerName)
                      ? {
                          backgroundColor: getAccentColorWithOpacity(0.2),
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          color: accentColor
                        }"
                    @click="selectPlayerForComparison(getTeamRoster(match, match.team2Name)[idx].playerName, match.team2Name)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(match, match.team2Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(match, match.team2Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: accentColor }">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Compare Button -->
        <div v-if="selectedPlayers.length === 2" class="text-center">
          <button
            class="px-8 py-4 font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
            :style="{ backgroundColor: accentColor, color: backgroundColor }"
            @click="emit('compare-players', selectedPlayers)"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '0.8';
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }
            }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Compare {{ selectedPlayers[0] }} vs {{ selectedPlayers[1] }}</span>
            <span>⚡</span>
          </button>
        </div>
        <div v-else-if="selectedPlayers.length === 1" class="text-center text-slate-400 text-sm">
          Select one more player from the other team to compare
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PublicTournamentMatch } from '@/services/publicTournamentService'

interface Props {
  match: PublicTournamentMatch | null
  accentColor: string
  textColor: string
  textMutedColor: string
  backgroundColor: string
  backgroundSoftColor: string
  backgroundMuteColor: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'compare-players': [players: string[]]
}>()

const selectedPlayers = ref<string[]>([])

// Check if match has any results
const hasResults = computed(() => {
  if (!props.match?.maps) return false
  return props.match.maps.some(map => map.matchResults && map.matchResults.length > 0)
})

// Helper: Get accent color with opacity
const getAccentColorWithOpacity = (opacity: number): string => {
  const color = props.accentColor
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
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

// Helper: Get team roster/players
const getTeamRoster = (match: PublicTournamentMatch, teamName: string) => {
  const players: Array<{ playerName: string; teamName: string }> = []
  match.maps.forEach(map => {
    map.matchResults?.forEach(result => {
      // For now, we'll return empty since the API doesn't provide player names in matchResults
      // This can be enhanced when player data becomes available
    })
  })
  return players
}

// Helper: Check if player is selected
const isPlayerSelected = (playerName: string): boolean => {
  return selectedPlayers.value.some(p => p === playerName)
}

// Helper: Select player for comparison
const selectPlayerForComparison = (playerName: string, teamName: string) => {
  const playerKey = playerName // In a full implementation, you'd include team context

  const index = selectedPlayers.value.indexOf(playerKey)
  if (index > -1) {
    selectedPlayers.value.splice(index, 1)
  } else if (selectedPlayers.value.length < 2) {
    selectedPlayers.value.push(playerKey)
  }
}

// Helper: Get the team ID for a specific column (team1 or team2)
const getTeamIdForColumn = (match: PublicTournamentMatch | null, column: 'team1' | 'team2'): number | undefined => {
  if (!match) return undefined
  // team1 column shows match.team1Name, so find the ID of that team
  // team2 column shows match.team2Name, so find the ID of that team
  const targetName = column === 'team1' ? match.team1Name : match.team2Name

  // Find this team's ID from any round result
  for (const map of match.maps) {
    if (map.matchResults && map.matchResults.length > 0) {
      const result = map.matchResults[0]
      if (result.team1Name === targetName) return result.team1Id
      if (result.team2Name === targetName) return result.team2Id
    }
  }
  return undefined
}

// Helper: Get the correct ticket count for a specific team column in a result
const getTeamTickets = (match: PublicTournamentMatch | null, result: any, column: 'team1' | 'team2'): number => {
  if (!match) return 0

  const targetTeamId = getTeamIdForColumn(match, column)
  if (!targetTeamId) return 0

  // Find which position this team is in for this particular result
  if (result.team1Id === targetTeamId) {
    return result.team1Tickets || 0
  } else if (result.team2Id === targetTeamId) {
    return result.team2Tickets || 0
  }
  return 0
}

// Helper: Calculate grand total across all rounds and maps
// Uses actual team IDs to handle cases where team1/team2 positions flip between rounds
const calculateGrandTotal = () => {
  if (!props.match?.maps) {
    return { team1: 0, team2: 0 }
  }

  // Get the two distinct teams from all rounds
  const teamsMap = new Map<number, { id: number, name: string }>()

  for (const map of props.match.maps) {
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

  if (teamsMap.size !== 2) {
    return { team1: 0, team2: 0 }
  }

  const teams = Array.from(teamsMap.values())
  const teamA = teams[0]
  const teamB = teams[1]

  // Determine which team is "team1" based on match-level team names
  const isATeam1 = teamA.name === props.match.team1Name
  const team1Id = isATeam1 ? teamA.id : teamB.id
  const team2Id = isATeam1 ? teamB.id : teamA.id

  let team1Total = 0
  let team2Total = 0

  props.match.maps.forEach(map => {
    if (map.matchResults) {
      map.matchResults.forEach(result => {
        // Add tickets for each team based on their actual ID
        if (result.team1Id === team1Id) {
          team1Total += result.team1Tickets || 0
          team2Total += result.team2Tickets || 0
        } else {
          team1Total += result.team2Tickets || 0
          team2Total += result.team1Tickets || 0
        }
      })
    }
  })

  return {
    team1: team1Total,
    team2: team2Total
  }
}
</script>
