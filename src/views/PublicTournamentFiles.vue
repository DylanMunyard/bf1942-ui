<template>
  <div class="portal-page min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: 'var(--portal-bg)' }">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
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
      />

      <!-- Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        <!-- Files List -->
        <div v-if="tournament.files && tournament.files.length > 0" class="space-y-3">

          <a
            v-for="file in tournament.files"
            :key="file.id"
            :href="file.url"
            target="_blank"
            rel="noopener noreferrer"
            class="block p-4 rounded-lg transition-all duration-200 hover:shadow-lg"
            :style="{
              backgroundColor: getBackgroundSoftColor(),
              color: getTextColor(),
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`
            }"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-base truncate transition-colors hover:opacity-80" :style="{ color: getTextColor() }">
                  {{ file.name }}
                </p>
                <p class="text-xs mt-1" :style="{ color: getTextMutedColor() }">
                  <span v-if="file.category" class="inline-block mr-3">{{ file.category }}</span>
                  <span>Uploaded: {{ formatDate(file.uploadedAt) }}</span>
                </p>
              </div>
              <svg class="w-5 h-5 flex-shrink-0 transition-all duration-200 hover:opacity-100" style="opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: getAccentColor() }">
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
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import TournamentHero from '@/components/TournamentHero.vue'
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
  getTextColor,
  getTextMutedColor,
  getAccentColor,
  getBackgroundSoftColor,
} = usePublicTournamentPage()

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
         date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `Files - ${newTournament.name} - BF Stats`
    document.title = fullTitle
    notificationService.updateOriginalTitle()
  }
})
</script>

<style src="./portal-layout.css"></style>
