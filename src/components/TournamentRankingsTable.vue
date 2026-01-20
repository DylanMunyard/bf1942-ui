<template>
  <div v-if="leaderboard && leaderboard.rankings.length > 0" class="backdrop-blur-sm border-2 rounded-xl overflow-hidden" :style="{ borderColor: accentColor, backgroundColor: backgroundSoftColor }">
    <!-- Rankings Header -->
    <div class="px-6 py-4 border-b-2" :style="{ borderColor: accentColor, backgroundColor: backgroundSoftColor }">
      <h3 class="text-xl font-semibold" :style="{ color: textColor }">
        🏆 {{ title || 'Tournament Rankings' }}
      </h3>
    </div>

    <!-- Rankings Table -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr :style="{ backgroundColor: backgroundMuteColor }">
            <th class="p-4 text-left font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Ranking
            </th>
            <th class="p-4 text-left font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Team
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Matches Played
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Victories
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Ties
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Losses
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Rounds Won
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Rounds Tied
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Rounds Lost
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              {{ ticketsForLabel }}
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              {{ ticketsAgainstLabel }}
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              {{ ticketDifferentialLabel }}
            </th>
            <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: textColor, borderColor: accentColor }">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(ranking, idx) in leaderboard.rankings"
            :key="ranking.teamId"
            class="group transition-all duration-300 border-b"
            :style="{ borderColor: accentColor, backgroundColor: idx % 2 === 0 ? backgroundMuteColor : backgroundSoftColor }"
          >
            <!-- Ranking -->
            <td class="p-4">
              <div class="flex items-center gap-2">
                <span v-if="ranking.rank === 1" class="text-xl">🥇</span>
                <span v-else-if="ranking.rank === 2" class="text-xl">🥈</span>
                <span v-else-if="ranking.rank === 3" class="text-xl">🥉</span>
                <span v-else class="text-sm font-bold" :style="{ color: textColor }">{{ ranking.rank }}</span>
              </div>
            </td>

            <!-- Team Name -->
            <td class="p-4">
              <div class="text-sm font-bold" :style="{ color: textColor }">
                {{ ranking.teamName }}
              </div>
            </td>

            <!-- Matches Played -->
            <td class="p-4 text-center">
              <span class="text-sm" :style="{ color: textColor }">
                {{ ranking.matchesPlayed }}
              </span>
            </td>

            <!-- Victories -->
            <td class="p-4 text-center">
              <span class="text-sm font-bold" :style="{ color: textColor }">
                {{ ranking.victories }}
              </span>
            </td>

            <!-- Ties -->
            <td class="p-4 text-center">
              <span class="text-sm" :style="{ color: textColor }">
                {{ ranking.ties }}
              </span>
            </td>

            <!-- Losses -->
            <td class="p-4 text-center">
              <span class="text-sm" :style="{ color: textColor }">
                {{ ranking.losses }}
              </span>
            </td>

            <!-- Rounds Won -->
            <td class="p-4 text-center">
              <span class="text-sm font-bold" :style="{ color: textColor }">
                {{ ranking.roundsWon }}
              </span>
            </td>

            <!-- Rounds Tied -->
            <td class="p-4 text-center">
              <span class="text-sm" :style="{ color: textColor }">
                {{ ranking.roundsTied }}
              </span>
            </td>

            <!-- Rounds Lost -->
            <td class="p-4 text-center">
              <span class="text-sm" :style="{ color: textColor }">
                {{ ranking.roundsLost }}
              </span>
            </td>

            <!-- Tickets For -->
            <td class="p-4 text-center">
              <span class="text-sm font-mono" :style="{ color: textColor }">
                {{ ranking.ticketsFor }}
              </span>
            </td>

            <!-- Tickets Against -->
            <td class="p-4 text-center">
              <span class="text-sm font-mono" :style="{ color: textColor }">
                {{ ranking.ticketsAgainst }}
              </span>
            </td>

            <!-- Ticket Differential -->
            <td class="p-4 text-center">
              <span class="text-sm font-mono" :style="{ color: ranking.ticketDifferential > 0 ? '#22c55e' : ranking.ticketDifferential === 0 ? '#eab308' : '#ef4444' }">
                {{ ranking.ticketDifferential >= 0 ? '+' : '' }}{{ ranking.ticketDifferential }}
              </span>
            </td>

            <!-- Points -->
            <td class="p-4 text-center">
              <span class="text-sm font-bold" :style="{ color: textColor }">
                {{ ranking.points }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <!-- Empty State -->
  <div v-else class="backdrop-blur-sm border-2 rounded-xl p-8 text-center" :style="{ borderColor: accentColor, backgroundColor: backgroundSoftColor }">
    <div v-if="logoImageUrl" class="mb-6 flex justify-center">
      <img :src="logoImageUrl" alt="Community logo" class="max-h-32 object-contain opacity-70">
    </div>
    <div v-else class="text-5xl mb-4 opacity-50">🏆</div>
    <h3 class="text-xl font-semibold mb-2" :style="{ color: textColor }">No Rankings Available Yet</h3>
    <p :style="{ color: textMutedColor }">
      Rankings will appear here once matches are completed and results are calculated.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PublicTournamentLeaderboard } from '@/services/publicTournamentService'

interface Props {
  leaderboard: PublicTournamentLeaderboard | null
  title?: string
  logoImageUrl?: string | null
  gameMode?: string | null
  accentColor: string
  textColor: string
  textMutedColor: string
  backgroundSoftColor: string
  backgroundMuteColor: string
}

const props = defineProps<Props>()

// CTF mode uses different terminology for tickets/flags
const isCTF = computed(() => props.gameMode?.toLowerCase() === 'ctf')

const ticketsForLabel = computed(() => isCTF.value ? 'Flags Captured' : 'Tickets For')
const ticketsAgainstLabel = computed(() => isCTF.value ? 'Flags Lost' : 'Tickets Against')
const ticketDifferentialLabel = computed(() => isCTF.value ? 'Flag Caps – Flags Lost' : 'Ticket Differential')
</script>
