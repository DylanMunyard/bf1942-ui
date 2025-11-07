<template>
  <div class="min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: getBackgroundColor() }">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

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

    <div v-else-if="tournament">
      <TournamentHero
        :tournament="tournament"
        :tournament-id="tournamentId"
        :hero-image-url="heroImageUrl"
        :logo-image-url="logoImageUrl"
      />

      <!-- Content -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-8">
        <!-- Teams Grid -->
        <div v-if="tournament.teams && tournament.teams.length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="team in tournament.teams"
              :key="team.id"
              class="backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all hover:border-opacity-100"
              :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }"
            >
              <!-- Team Header -->
              <div class="px-6 py-4 border-b-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
                <h3 class="text-lg font-bold" :style="{ color: getTextColor() }">
                  {{ team.name }}
                </h3>
              </div>

              <!-- Team Content -->
              <div class="px-6 py-4">
                <!-- Players List -->
                <div v-if="team.players && team.players.length > 0" class="space-y-2">
                  <p class="text-xs font-bold uppercase" :style="{ color: getTextMutedColor() }">
                    {{ team.players.length }} Player<span v-if="team.players.length !== 1">s</span>
                  </p>
                  <ul class="space-y-1">
                    <li
                      v-for="(player, idx) in team.players"
                      :key="idx"
                      class="text-sm py-1 px-2 rounded"
                      :style="{ backgroundColor: getBackgroundMuteColor() }"
                    >
                      <router-link
                        :to="`/players/${encodeURIComponent(player.playerName)}`"
                        class="hover:underline transition-colors"
                        :style="{ color: getTextColor() }"
                      >
                        {{ player.playerName }}
                      </router-link>
                    </li>
                  </ul>
                </div>
                <div v-else class="text-sm" :style="{ color: getTextMutedColor() }">
                  No players registered yet
                </div>
              </div>

              <!-- Team Meta -->
              <div class="px-6 py-3 border-t-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }">
                <p class="text-xs" :style="{ color: getTextMutedColor() }">
                  Registered: {{ formatDate(team.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
          <div class="text-8xl mb-6 opacity-50">👥</div>
          <h3 class="text-2xl font-bold mb-3" :style="{ color: getTextColor() }">No Teams Registered</h3>
          <p :style="{ color: getTextMutedColor() }">
            Teams will appear here once they register for the tournament.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TournamentHero from '@/components/TournamentHero.vue'
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

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
