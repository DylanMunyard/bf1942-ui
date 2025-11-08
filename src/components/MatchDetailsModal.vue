<template>
  <div
    v-if="match"
    class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div
      class="rounded-2xl p-6 w-[95vw] max-w-7xl shadow-2xl max-h-[90vh] overflow-y-auto border-2"
      :style="{
        background: backgroundSoftColor,
        backdropFilter: 'blur(10px)',
        borderColor: accentColor,
        backgroundColor: backgroundSoftColor
      }"
    >
      <!-- Header with Close Button -->
      <div class="flex items-start justify-between mb-8">
        <div class="flex-1">
          <h2 class="text-2xl md:text-4xl font-bold mb-3" :style="{ color: accentColor }">
            {{ match.team1Name }} <span :style="{ color: textMutedColor }">vs</span> {{ match.team2Name }}
          </h2>
          <div class="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm" :style="{ color: textMutedColor }">
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

      <!-- Maps Section -->
      <div class="grid grid-cols-2 gap-4 mb-8">
        <template v-for="map in match.maps" :key="map.id">
          <!-- Map Card with Left/Right Layout -->
          <div class="rounded-xl border-2 p-4" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.05) }">
            <!-- Map Title and Selection Info -->
            <div class="mb-4">
              <h3 class="text-xl font-bold" :style="{ color: accentColor }">
                {{ map.mapName }}
              </h3>
              <p v-if="map.teamName" class="text-xs mt-1" :style="{ color: textMutedColor }">
                🎯 Selected by <span class="font-semibold">{{ map.teamName }}</span>
              </p>
            </div>

            <!-- Left/Right Layout: Image on Left, Results on Right -->
            <div class="flex gap-4">
              <!-- Left: Map Image (128px) -->
              <div class="flex-shrink-0 relative group">
                <div v-if="getMapImageUrl(map)" class="rounded-lg overflow-hidden border-2 w-32 h-32 cursor-pointer" :style="{ borderColor: accentColor }" @click="openFullscreenImage(getMapImageUrl(map), map.mapName)">
                  <img :src="getMapImageUrl(map)" :alt="map.mapName" class="w-full h-full object-cover" loading="lazy" />
                  <!-- Magnifying glass overlay -->
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors rounded-lg">
                    <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div v-else class="rounded-lg border-2 w-32 h-32 flex items-center justify-center" :style="{ borderColor: accentColor, backgroundColor: backgroundMuteColor, color: textMutedColor }">
                  <span class="text-xs text-center px-2">No image</span>
                </div>
              </div>

              <!-- Right: Round Results -->
              <div class="flex-1">
                <div v-if="map.matchResults && map.matchResults.length > 0" class="space-y-0">
                  <!-- Team Names Header -->
                  <div class="grid grid-cols-2 gap-0 text-xs font-bold mb-2" :style="{ color: accentColor }">
                    <span class="text-center">{{ match.team1Name }}</span>
                    <span class="text-center">{{ match.team2Name }}</span>
                  </div>

                  <!-- Round Results -->
                  <div v-for="result in map.matchResults" :key="`${map.id}-${result.id}`" class="grid grid-cols-2 gap-0 text-xs rounded-lg overflow-hidden mb-1">
                    <!-- Team 1 Score -->
                    <div class="flex flex-col items-center justify-center gap-0.5 py-2 px-2" :style="{ backgroundColor: backgroundMuteColor }">
                      <span class="font-bold" :style="{ color: textColor }">{{ getTeamTickets(result, 'team1') }}</span>
                      <span v-if="result.winningTeamId === getTeamIdForColumn('team1')" class="text-sm animate-pulse">🏆</span>
                    </div>

                    <!-- Team 2 Score -->
                    <div class="flex flex-col items-center justify-center gap-0.5 py-2 px-2" :style="{ backgroundColor: backgroundMuteColor }">
                      <span class="font-bold" :style="{ color: textColor }">{{ getTeamTickets(result, 'team2') }}</span>
                      <span v-if="result.winningTeamId === getTeamIdForColumn('team2')" class="text-sm animate-pulse">🏆</span>
                    </div>
                  </div>

                  <!-- Map Subtotal -->
                  <div class="rounded-lg p-3 border-t-2 mt-2" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1) }">
                    <div class="flex items-center justify-between text-sm font-bold">
                      <span :style="{ color: accentColor }">Total</span>
                      <div class="flex gap-4">
                        <span :style="{ color: accentColor }">{{ calculateMapTotal(map).team1 }}</span>
                        <span>-</span>
                        <span :style="{ color: accentColor }">{{ calculateMapTotal(map).team2 }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- No Results State -->
                <div v-else class="text-center py-4" :style="{ color: textMutedColor }">
                  <p class="text-xs">No rounds recorded yet</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Match Summary Footer -->
      <div v-if="hasResults" class="rounded-xl p-6 border-4 mb-8" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1) }">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div class="flex-1">
            <h4 class="text-sm font-bold uppercase mb-3" :style="{ color: textMutedColor }">Match Summary</h4>
            <div class="flex flex-col md:flex-row gap-4 md:gap-8">
              <!-- Team 1 Total -->
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold" :style="{ color: textMutedColor }">{{ match.team1Name }}</span>
                <span class="text-3xl md:text-4xl font-bold" :style="{ color: accentColor }">{{ calculateGrandTotal().team1 }}</span>
              </div>

              <!-- Match Winner -->
              <div v-if="getMatchWinner()" class="flex items-center gap-2">
                <span class="text-4xl">🏆</span>
                <span class="text-sm font-bold uppercase" :style="{ color: accentColor }">{{ getMatchWinner() }} Wins</span>
              </div>

              <!-- Team 2 Total -->
              <div class="flex items-center gap-3">
                <span class="text-3xl md:text-4xl font-bold" :style="{ color: accentColor }">{{ calculateGrandTotal().team2 }}</span>
                <span class="text-sm font-bold" :style="{ color: textMutedColor }">{{ match.team2Name }}</span>
              </div>
            </div>
          </div>
        </div>
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
                      {{ getTeamRoster(match.team1Name).length }} players
                    </span>
                  </div>
                </th>
                <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1), color: accentColor }">
                  <div class="flex flex-col items-center gap-2">
                    <span>{{ match.team2Name }}</span>
                    <span class="text-xs font-normal" :style="{ color: textMutedColor }">
                      {{ getTeamRoster(match.team2Name).length }} players
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(_, idx) in Math.max(
                  getTeamRoster(match.team1Name).length,
                  getTeamRoster(match.team2Name).length
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
                    v-if="getTeamRoster(match.team1Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(match.team1Name)[idx].playerName)
                      ? 'border-2 font-bold'
                      : ''"
                    :style="isPlayerSelected(getTeamRoster(match.team1Name)[idx].playerName)
                      ? {
                          backgroundColor: getAccentColorWithOpacity(0.2),
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          color: accentColor
                        }"
                    @click="selectPlayerForComparison(getTeamRoster(match.team1Name)[idx].playerName)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(match.team1Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(match.team1Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: accentColor }">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </td>
                <!-- Team 2 Player -->
                <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.05) }">
                  <button
                    v-if="getTeamRoster(match.team2Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(match.team2Name)[idx].playerName)
                      ? 'border-2 font-bold'
                      : ''"
                    :style="isPlayerSelected(getTeamRoster(match.team2Name)[idx].playerName)
                      ? {
                          backgroundColor: getAccentColorWithOpacity(0.2),
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          color: accentColor
                        }"
                    @click="selectPlayerForComparison(getTeamRoster(match.team2Name)[idx].playerName)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(match.team2Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(match.team2Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: accentColor }">
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

    <!-- Full-screen Image Modal -->
    <div
      v-if="fullscreenImage"
      class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click="fullscreenImage = null"
    >
      <div class="relative max-w-7xl max-h-[90vh] flex flex-col items-center gap-4" @click.stop>
        <!-- Image -->
        <img
          :src="fullscreenImage.url"
          :alt="fullscreenImage.mapName"
          class="max-w-full max-h-[85vh] rounded-xl object-contain"
        />

        <!-- Map Name -->
        <div class="text-center text-white">
          <h3 class="text-2xl font-bold">{{ fullscreenImage.mapName }}</h3>
        </div>

        <!-- Close Button -->
        <button
          class="absolute top-4 right-4 p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
          @click="fullscreenImage = null"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
const fullscreenImage = ref<{ url: string; mapName: string } | null>(null)

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

// Helper: Get map image URL
const getMapImageUrl = (map: any): string | undefined => {
  if (!map.imagePath) return undefined
  return `/stats/assets/tournaments/${map.imagePath}`
}

// Helper: Calculate total tickets for a specific map
const calculateMapTotal = (map: any) => {
  if (!props.match?.maps) {
    return { team1: 0, team2: 0 }
  }

  const team1Id = getTeamIdForColumn('team1')

  let team1Total = 0
  let team2Total = 0

  if (map.matchResults) {
    map.matchResults.forEach((roundResult: any) => {
      if (roundResult.team1Id === team1Id) {
        team1Total += roundResult.team1Tickets || 0
        team2Total += roundResult.team2Tickets || 0
      } else {
        team1Total += roundResult.team2Tickets || 0
        team2Total += roundResult.team1Tickets || 0
      }
    })
  }

  return { team1: team1Total, team2: team2Total }
}

// Helper: Get match winner
const getMatchWinner = (): string | null => {
  if (!props.match?.maps) return null

  let team1Wins = 0
  let team2Wins = 0

  for (const map of props.match.maps) {
    if (!map.matchResults || map.matchResults.length === 0) continue

    for (const result of map.matchResults) {
      if (result.winningTeamId === getTeamIdForColumn('team1')) {
        team1Wins++
      } else if (result.winningTeamId === getTeamIdForColumn('team2')) {
        team2Wins++
      }
    }
  }

  if (team1Wins > team2Wins) return props.match.team1Name
  if (team2Wins > team1Wins) return props.match.team2Name
  if (team1Wins === team2Wins && team1Wins > 0) return 'Tie'
  return null
}

// Helper: Get team roster/players
const getTeamRoster = (_teamName: string) => {
  const players: Array<{ playerName: string; teamName: string }> = []
  // For now, we'll return empty since the API doesn't provide player names in matchResults
  // This can be enhanced when player data becomes available
  return players
}

// Helper: Check if player is selected
const isPlayerSelected = (playerName: string): boolean => {
  return selectedPlayers.value.some(p => p === playerName)
}

// Helper: Select player for comparison
const selectPlayerForComparison = (playerName: string) => {
  const playerKey = playerName

  const index = selectedPlayers.value.indexOf(playerKey)
  if (index > -1) {
    selectedPlayers.value.splice(index, 1)
  } else if (selectedPlayers.value.length < 2) {
    selectedPlayers.value.push(playerKey)
  }
}

// Helper: Get the team ID for a specific column (team1 or team2)
const getTeamIdForColumn = (column: 'team1' | 'team2'): number | undefined => {
  if (!props.match) return undefined
  const targetName = column === 'team1' ? props.match.team1Name : props.match.team2Name

  // Find this team's ID from any round result
  for (const map of props.match.maps) {
    if (map.matchResults && map.matchResults.length > 0) {
      const result = map.matchResults[0]
      if (result.team1Name === targetName) return result.team1Id
      if (result.team2Name === targetName) return result.team2Id
    }
  }
  return undefined
}

// Helper: Get the correct ticket count for a specific team column in a result
const getTeamTickets = (result: any, column: 'team1' | 'team2'): number => {
  if (!props.match) return 0

  const targetTeamId = getTeamIdForColumn(column)
  if (!targetTeamId) return 0

  // Find which position this team is in for this particular result
  if (result.team1Id === targetTeamId) {
    return result.team1Tickets || 0
  } else if (result.team2Id === targetTeamId) {
    return result.team2Tickets || 0
  }
  return 0
}

// Helper: Open full-screen image viewer
const openFullscreenImage = (imageUrl: string | undefined, mapName: string) => {
  if (imageUrl) {
    fullscreenImage.value = { url: imageUrl, mapName }
  }
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
