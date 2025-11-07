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
                <h3 class="text-lg font-bold" :style="{ color: getAccentColor() }">
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
                      :style="{ color: getTextColor(), backgroundColor: getBackgroundMuteColor() }"
                    >
                      {{ player.playerName }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TournamentHero from '@/components/TournamentHero.vue'
import { publicTournamentService, type PublicTournamentDetail } from '@/services/publicTournamentService'

const route = useRoute()

const tournament = ref<PublicTournamentDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const heroImageUrl = ref<string | null>(null)
const logoImageUrl = ref<string | null>(null)
const tournamentId = computed(() => route.params.id as string)

const themeVars = computed(() => ({
  '--tournament-bg': tournament.value?.theme?.backgroundColour ?? '#1a1a1a',
  '--tournament-text': tournament.value?.theme?.textColour ?? '#ffffff',
  '--tournament-accent': tournament.value?.theme?.accentColour ?? '#FFD700',
}))

const getBackgroundColor = (): string => tournament.value?.theme?.backgroundColour ?? '#1a1a1a'
const getTextColor = (): string => tournament.value?.theme?.textColour ?? '#ffffff'
const getTextMutedColor = (): string => '#a0a0a0'
const getAccentColor = (): string => tournament.value?.theme?.accentColour ?? '#FFD700'
const getBackgroundMuteColor = (): string => tournament.value?.theme?.backgroundColour ? `${tournament.value.theme.backgroundColour}40` : '#2a2a2a'
const getBackgroundSoftColor = (): string => tournament.value?.theme?.backgroundColour ? `${tournament.value.theme.backgroundColour}20` : '#242424'

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const loadTournament = async () => {
  try {
    loading.value = true
    error.value = null

    const data = await publicTournamentService.getTournamentDetail(parseInt(tournamentId.value))
    tournament.value = data

    // Load images
    if (data.hasHeroImage) {
      loadHeroImage().catch(err => console.debug('Failed to load hero image:', err))
    }
    if (data.hasCommunityLogo) {
      loadLogoImage().catch(err => console.debug('Failed to load logo image:', err))
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load tournament'
  } finally {
    loading.value = false
  }
}

const loadHeroImage = async () => {
  if (tournament.value?.hasHeroImage) {
    const url = publicTournamentService.getTournamentImageUrl(parseInt(tournamentId.value))
    heroImageUrl.value = url
  }
}

const loadLogoImage = async () => {
  if (tournament.value?.hasCommunityLogo) {
    const url = publicTournamentService.getTournamentImageUrl(parseInt(tournamentId.value))
    logoImageUrl.value = url
  }
}

onMounted(() => {
  loadTournament()
})

watch(
  () => route.params.id,
  () => {
    loadTournament()
  }
)
</script>
