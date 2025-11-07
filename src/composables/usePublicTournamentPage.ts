import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTournamentCache } from './useTournamentCache'
import type { PublicTournamentDetail } from '@/services/publicTournamentService'

/**
 * Composable for tournament pages - handles all common loading, caching, and theme logic
 * Eliminates duplication across all tournament page components
 */
export function usePublicTournamentPage() {
  const route = useRoute()
  const { useTournament } = useTournamentCache()

  // Refs
  const tournament = ref<PublicTournamentDetail | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const heroImageUrl = ref<string | null>(null)
  const logoImageUrl = ref<string | null>(null)

  // Computed
  const tournamentId = computed(() => route.params.id as string)

  const themeVars = computed(() => ({
    '--tournament-bg': tournament.value?.theme?.backgroundColour ?? '#1a1a1a',
    '--tournament-text': tournament.value?.theme?.textColour ?? '#ffffff',
    '--tournament-accent': tournament.value?.theme?.accentColour ?? '#FFD700',
  }))

  // Theme color getters
  const getBackgroundColor = (): string => tournament.value?.theme?.backgroundColour ?? '#1a1a1a'
  const getTextColor = (): string => tournament.value?.theme?.textColour ?? '#ffffff'
  const getTextMutedColor = (): string => '#a0a0a0'
  const getAccentColor = (): string => tournament.value?.theme?.accentColour ?? '#FFD700'
  const getBackgroundMuteColor = (): string =>
    tournament.value?.theme?.backgroundColour ? `${tournament.value.theme.backgroundColour}40` : '#2a2a2a'
  const getBackgroundSoftColor = (): string =>
    tournament.value?.theme?.backgroundColour ? `${tournament.value.theme.backgroundColour}20` : '#242424'

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

      const { tournament: cachedTournament, heroImageUrl: cachedHeroUrl, logoImageUrl: cachedLogoUrl, error: cacheError } = await useTournament(parseInt(tournamentId.value))

      if (cacheError.value) {
        error.value = cacheError.value
        return
      }

      tournament.value = cachedTournament.value
      heroImageUrl.value = cachedHeroUrl.value
      logoImageUrl.value = cachedLogoUrl.value
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
  }
}
