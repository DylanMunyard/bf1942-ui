import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTournamentCache } from './useTournamentCache'
import { isValidHex, normalizeHex, hexToRgb, rgbToHex, calculateLuminance, getContrastingTextColor } from '@/utils/colorUtils'
import type { PublicTournamentDetail } from '@/services/publicTournamentService'

/**
 * Composable for tournament pages - handles all common loading, caching, and theme logic
 * Eliminates duplication across all tournament page components
 */
export function usePublicTournamentPage() {
  const route = useRoute()
  const { useTournament, clearCache } = useTournamentCache()

  // Refs
  const tournament = ref<PublicTournamentDetail | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const heroImageUrl = ref<string | null>(null)
  const logoImageUrl = ref<string | null>(null)

  // Computed
  const tournamentId = computed(() => route.params.id as string)

  const themeVars = computed<Record<string, string>>(() => {
    const defaults = {
      background: '#000000',
      backgroundSoft: '#1a1a1a',
      backgroundMute: '#2d2d2d',
      text: '#FFFFFF',
      textMuted: '#d0d0d0',
      border: '#FFD700',
    } as const

    const bgHex = normalizeHex(tournament.value?.theme?.backgroundColour ?? '') || defaults.background
    const textHexRaw = normalizeHex(tournament.value?.theme?.textColour ?? '')
    const borderHexRaw = normalizeHex(tournament.value?.theme?.accentColour ?? '')

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
      '--color-heading': text,
      '--color-border': border,
      '--color-primary': border,
      '--tournament-accent': border,
    }
  })

  // Theme color getters
  const getBackgroundColor = (): string => {
    return themeVars.value['--color-background'] || '#000000'
  }

  const getBackgroundSoftColor = (): string => {
    return themeVars.value['--color-background-soft'] || '#1a1a1a'
  }

  const getBackgroundMuteColor = (): string => {
    return themeVars.value['--color-background-mute'] || '#2d2d2d'
  }

  const getTextColor = (): string => {
    return themeVars.value['--color-text'] || '#FFFFFF'
  }

  const getTextMutedColor = (): string => {
    return themeVars.value['--color-text-muted'] || '#d0d0d0'
  }

  const getAccentColor = (): string => {
    if (!tournament.value?.theme?.accentColour) return '#FFD700'
    const normalized = normalizeHex(tournament.value.theme.accentColour)
    return isValidHex(normalized) ? normalized : '#FFD700'
  }

  // Helper for opacity colors
  const getAccentColorWithOpacity = (opacity: number): string => {
    const color = getAccentColor()
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Loading logic
  const loadTournament = async () => {
    try {
      loading.value = true
      error.value = null

      const { tournament: cachedTournament, heroImageUrl: cachedHeroUrl, logoImageUrl: cachedLogoUrl, error: cacheError } = await useTournament(tournamentId.value)

      if (cacheError.value) {
        error.value = cacheError.value
        return
      }

      tournament.value = cachedTournament.value
      heroImageUrl.value = cachedHeroUrl.value
      logoImageUrl.value = cachedLogoUrl.value

      // Watch for async image loads - images load in background after page renders
      watch(cachedHeroUrl, (newUrl) => {
        if (newUrl) heroImageUrl.value = newUrl
      }, { immediate: true })

      watch(cachedLogoUrl, (newUrl) => {
        if (newUrl) logoImageUrl.value = newUrl
      }, { immediate: true })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tournament'
    } finally {
      loading.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    loadTournament()
  })

  watch(
    () => route.params.id,
    () => {
      loadTournament()
    }
  )

  return {
    // Refs
    tournament,
    loading,
    error,
    heroImageUrl,
    logoImageUrl,

    // Computed
    tournamentId,
    themeVars,

    // Functions
    getBackgroundColor,
    getTextColor,
    getTextMutedColor,
    getAccentColor,
    getBackgroundMuteColor,
    getBackgroundSoftColor,
    getAccentColorWithOpacity,

    // Methods
    loadTournament,
    clearCache,
  }
}
