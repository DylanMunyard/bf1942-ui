import { ref, type Ref } from 'vue'
import { publicTournamentService, type PublicTournamentDetail } from '@/services/publicTournamentService'

/**
 * Composable for caching tournament data and images across pages
 * This prevents the jitter effect when navigating between tournament pages
 * by sharing loaded tournament data and images globally
 */

interface CachedTournament {
  data: PublicTournamentDetail
  heroImageUrl: string | null
  logoImageUrl: string | null
  loadedAt: number
}

// Cache with tournament identifier (ID or name) as key
const tournamentCache = ref<Map<string, CachedTournament>>(new Map())

// Cache TTL: 5 minutes (300000 ms)
const CACHE_TTL = 5 * 60 * 1000

const isCacheValid = (cachedAt: number): boolean => {
  return Date.now() - cachedAt < CACHE_TTL
}

// Normalize cache key to string
const toCacheKey = (idOrName: number | string): string => String(idOrName)

const getCachedTournament = (idOrName: number | string): CachedTournament | null => {
  const key = toCacheKey(idOrName)
  const cached = tournamentCache.value.get(key)
  if (!cached || !isCacheValid(cached.loadedAt)) {
    tournamentCache.value.delete(key)
    return null
  }
  return cached
}

const setCachedTournament = (idOrName: number | string, tournament: CachedTournament) => {
  tournamentCache.value.set(toCacheKey(idOrName), tournament)
}

const loadHeroImage = async (tournamentId: number): Promise<string | null> => {
  try {
    const response = await fetch(publicTournamentService.getTournamentImageUrl(tournamentId))
    if (response.ok) {
      const blob = await response.blob()
      return URL.createObjectURL(blob)
    }
  } catch {
    // Silently fail - hero image is optional
    console.debug('No hero image available')
  }
  return null
}

const loadLogoImage = async (tournamentId: number): Promise<string | null> => {
  try {
    const response = await fetch(publicTournamentService.getTournamentLogoUrl(tournamentId))
    if (response.ok) {
      const blob = await response.blob()
      return URL.createObjectURL(blob)
    }
  } catch {
    // Silently fail - logo image is optional
    console.debug('No logo image available')
  }
  return null
}

export function useTournamentCache() {
  return {
    /**
     * Load tournament data with cached images
     * Returns refs that can be used directly in templates
     * Automatically detects cache hits and avoids loading state for instant display
     * @param idOrName - Tournament ID (number) or name/slug (string)
     */
    useTournament: async (idOrName: number | string) => {
      const tournament = ref<PublicTournamentDetail | null>(null)
      const heroImageUrl: Ref<string | null> = ref(null)
      const logoImageUrl: Ref<string | null> = ref(null)
      const loading = ref(false)
      const error = ref<string | null>(null)
      const isCacheHit = ref(false)

      // Check cache first (synchronous)
      const cached = getCachedTournament(idOrName)
      if (cached) {
        // Instant cache hit - no loading state needed
        tournament.value = cached.data
        heroImageUrl.value = cached.heroImageUrl
        logoImageUrl.value = cached.logoImageUrl
        isCacheHit.value = true
        return { tournament, heroImageUrl, logoImageUrl, loading, error, isCacheHit }
      }

      // Load from API if not cached
      loading.value = true
      error.value = null
      isCacheHit.value = false

      try {
        // Load tournament data (API supports both ID and name)
        const data = await publicTournamentService.getTournamentDetail(idOrName)
        tournament.value = data

        // Set loading to false immediately - page can render with tournament data
        loading.value = false

        // Use the numeric ID from the response for image loading
        const numericId = data.id

        // Load images asynchronously without blocking the page render
        // Images will appear when they're ready
        const loadImagesAsync = async () => {
          const [heroUrl, logoUrl] = await Promise.all([
            data.hasHeroImage ? loadHeroImage(numericId) : Promise.resolve(null),
            data.hasCommunityLogo ? loadLogoImage(numericId) : Promise.resolve(null),
          ])

          heroImageUrl.value = heroUrl
          logoImageUrl.value = logoUrl

          // Cache the results including images (cache by the original identifier)
          setCachedTournament(idOrName, {
            data,
            heroImageUrl: heroUrl,
            logoImageUrl: logoUrl,
            loadedAt: Date.now(),
          })
        }

        // Fire and forget - don't await
        loadImagesAsync().catch(err => {
          console.debug('Failed to load tournament images:', err)
        })

        // Cache tournament data immediately (images will be updated when loaded)
        setCachedTournament(idOrName, {
          data,
          heroImageUrl: null,
          logoImageUrl: null,
          loadedAt: Date.now(),
        })
      } catch (err) {
        console.error('Error loading tournament:', err)
        error.value = err instanceof Error ? err.message : 'Failed to load tournament'
        loading.value = false
      }

      return { tournament, heroImageUrl, logoImageUrl, loading, error, isCacheHit }
    },

    /**
     * Check if tournament is already cached without loading
     * Useful for prefetching or checking cache status
     */
    isCached: (idOrName: number | string): boolean => {
      return getCachedTournament(idOrName) !== null
    },

    /**
     * Clear cache for a specific tournament
     */
    clearCache: (idOrName: number | string) => {
      tournamentCache.value.delete(toCacheKey(idOrName))
    },

    /**
     * Clear all cached tournaments
     */
    clearAllCache: () => {
      tournamentCache.value.clear()
    },
  }
}
