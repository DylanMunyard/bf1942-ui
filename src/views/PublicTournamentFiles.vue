<template>
  <div class="min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: getBackgroundColor() }">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <div v-else-if="error" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-black mb-4" :style="{ color: getAccentColor() }">Error</h1>
        <p :style="{ color: getTextMutedColor() }">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="tournament">
      <TournamentHero
        :tournament="tournament"
        :tournament-id="tournamentId"
        :hero-image-url="heroImageUrl"
        :logo-image-url="logoImageUrl"
        @open-rules="() => {}"
      />

      <!-- Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        <!-- Files List -->
        <div v-if="tournament.files && tournament.files.length > 0" class="space-y-3">
          <h3 class="text-2xl font-bold mb-6" :style="{ color: getTextColor() }">
            📁 Tournament Files
          </h3>

          <a
            v-for="file in tournament.files"
            :key="file.id"
            :href="file.url"
            target="_blank"
            rel="noopener noreferrer"
            class="block p-4 rounded-lg border-2"
            :style="{
              borderColor: getAccentColor(),
              backgroundColor: getBackgroundSoftColor(),
              color: getAccentColor()
            }"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-base truncate hover:underline">
                  {{ file.name }}
                </p>
                <p class="text-xs mt-1" :style="{ color: getTextMutedColor() }">
                  <span v-if="file.category" class="inline-block mr-3">{{ file.category }}</span>
                  <span>Uploaded: {{ formatDate(file.uploadedAt) }}</span>
                </p>
              </div>
              <svg class="w-5 h-5 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
          <div class="text-8xl mb-6 opacity-50">📁</div>
          <h3 class="text-2xl font-bold mb-3" :style="{ color: getTextColor() }">No Files Available</h3>
          <p :style="{ color: getTextMutedColor() }">
            The tournament organizer hasn't uploaded any files yet.
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
         date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
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
