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

      <div class="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 mt-8 sm:mt-12">
        <div class="text-center py-20">
          <div class="text-6xl mb-6 opacity-50">📊</div>
          <h3 class="text-2xl font-bold mb-3" :style="{ color: getTextColor() }">Stats Coming Soon</h3>
          <p :style="{ color: getTextMutedColor() }">This page is currently under development.</p>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { isValidHex, normalizeHex, hexToRgb, rgbToHex, calculateLuminance, getContrastingTextColor } from '@/utils/colorUtils'
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
} = usePublicTournamentPage()

const themeVars = computed<Record<string, string>>(() => {
  const defaults = { background: '#000000', backgroundSoft: '#1a1a1a', backgroundMute: '#2d2d2d', text: '#FFFFFF', textMuted: '#d0d0d0', border: '#FFD700' } as const
  const bgHex = normalizeHex(tournament.value?.theme?.backgroundColour ?? '') || defaults.background
  const bg = isValidHex(bgHex) ? bgHex : defaults.background
  const bgLum = calculateLuminance(bg)
  const isDark = bgLum < 0.5

  const mixHex = (a: string, b: string, t: number): string => {
    const ra = hexToRgb(a)
    const rb = hexToRgb(b)
    if (!ra || !rb) return a
    const mix = (x: number, y: number) => Math.round(x + (y - x) * t)
    return rgbToHex(mix(ra.r, rb.r), mix(ra.g, rb.g), mix(ra.b, rb.b))
  }

  const textHexRaw = normalizeHex(tournament.value?.theme?.textColour ?? '')
  const borderHexRaw = normalizeHex(tournament.value?.theme?.accentColour ?? '')
  const text = isValidHex(textHexRaw) ? textHexRaw : getContrastingTextColor(bg)
  const border = isValidHex(borderHexRaw) ? borderHexRaw : defaults.border

  const backgroundSoft = isDark ? mixHex(bg, '#FFFFFF', 0.08) : mixHex(bg, '#000000', 0.06)
  const backgroundMute = isDark ? mixHex(bg, '#FFFFFF', 0.16) : mixHex(bg, '#000000', 0.12)
  const textMuted = isDark ? mixHex(text, bg, 0.35) : mixHex(text, bg, 0.45)

  return {
    '--color-background': bg,
    '--color-background-soft': backgroundSoft,
    '--color-background-mute': backgroundMute,
    '--color-text': text,
    '--color-text-muted': textMuted,
  }
})

const getAccentColor = (): string => {
  if (!tournament.value?.theme?.accentColour) return '#FFD700'
  const normalized = normalizeHex(tournament.value.theme.accentColour)
  return isValidHex(normalized) ? normalized : '#FFD700'
}

const getBackgroundColor = (): string => themeVars.value['--color-background'] || '#000000'
const getTextColor = (): string => themeVars.value['--color-text'] || '#FFFFFF'
const getTextMutedColor = (): string => themeVars.value['--color-text-muted'] || '#d0d0d0'

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `Stats - ${newTournament.name} - BF Stats`
    document.title = fullTitle
    notificationService.updateOriginalTitle()
  }
})
</script>

<style src="./portal-layout.css"></style>
