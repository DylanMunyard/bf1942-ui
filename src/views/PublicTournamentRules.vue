<template>
  <div class="portal-page min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: 'var(--portal-bg)' }">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <!-- Error State -->
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
        <h1 class="text-4xl md:text-5xl font-black mb-4" :style="{ color: getAccentColor() }">Error</h1>
        <p class="text-lg mb-8" :style="{ color: getTextMutedColor() }">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="tournament">
      <TournamentHero
        :tournament="tournament"
        :tournament-id="tournamentId"
        :hero-image-url="heroImageUrl"
        :logo-image-url="logoImageUrl"
      />

      <!-- Rules Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        <div v-if="tournament.rules && tournament.rules.trim()" class="backdrop-blur-sm border-2 rounded-xl overflow-hidden p-6 sm:p-8" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
          <div
            class="prose prose-invert prose-sm max-w-none markdown-rules"
            :style="{
              '--rule-primary': getAccentColor(),
              '--rule-secondary': getAccentColor(),
            } as Record<string, string>"
          >
            <div
              v-html="renderedRules"
              class="text-white"
            />
          </div>
        </div>
        <div v-else class="text-center py-20">
          <div class="text-6xl mb-6 opacity-50">📜</div>
          <h3 class="text-2xl font-bold mb-3" :style="{ color: getTextColor() }">No Rules Available</h3>
          <p :style="{ color: getTextMutedColor() }">The tournament organizer hasn't added rules yet.</p>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { marked } from 'marked'
import TournamentHero from '@/components/TournamentHero.vue'
import { isValidHex, normalizeHex, hexToRgb, rgbToHex, calculateLuminance, getContrastingTextColor } from '@/utils/colorUtils'
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

const renderedRules = computed(() => {
  if (!tournament.value?.rules || !tournament.value.rules.trim()) {
    return ''
  }
  try {
    return marked(tournament.value.rules, { breaks: true })
  } catch {
    return '<p class="text-red-400">Invalid markdown in rules</p>'
  }
})

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
    '--rule-primary': border,
    '--rule-secondary': border,
  }
})

const getAccentColor = (): string => {
  if (!tournament.value?.theme?.accentColour) return '#FFD700'
  const normalized = normalizeHex(tournament.value.theme.accentColour)
  return isValidHex(normalized) ? normalized : '#FFD700'
}

const getBackgroundColor = (): string => {
  return themeVars.value['--color-background'] || '#000000'
}

const getBackgroundSoftColor = (): string => {
  return themeVars.value['--color-background-soft'] || '#1a1a1a'
}

const getTextColor = (): string => {
  return themeVars.value['--color-text'] || '#FFFFFF'
}

const getTextMutedColor = (): string => {
  return themeVars.value['--color-text-muted'] || '#d0d0d0'
}

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `Rules - ${newTournament.name} - BF Stats`
    document.title = fullTitle
    notificationService.updateOriginalTitle()
  }
})
</script>

<style src="./portal-layout.css"></style>
<style scoped>
/* Markdown rules styling */
.markdown-rules :deep(h1),
.markdown-rules :deep(h2),
.markdown-rules :deep(h3),
.markdown-rules :deep(h4),
.markdown-rules :deep(h5),
.markdown-rules :deep(h6) {
  color: var(--color-text);
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-rules :deep(p) {
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.markdown-rules :deep(strong) {
  font-weight: 700;
  color: var(--color-text);
}

.markdown-rules :deep(em) {
  color: var(--rule-secondary);
  font-style: italic;
}

.markdown-rules :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.markdown-rules :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.markdown-rules :deep(li) {
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
  margin-left: 1rem;
}

.markdown-rules :deep(code) {
  background: linear-gradient(135deg, var(--rule-primary)15, var(--rule-secondary)10);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: var(--color-text);
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  border: 1px solid var(--rule-primary);
}

.markdown-rules :deep(blockquote) {
  border-left: 4px solid var(--rule-primary);
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
  background: linear-gradient(to right, var(--rule-primary)08, transparent);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}

.markdown-rules :deep(a) {
  color: var(--color-text);
  text-decoration: underline;
  font-weight: 600;
  transition: all 0.2s ease;
}

.markdown-rules :deep(a:hover) {
  color: var(--color-text);
  text-decoration: none;
}

.markdown-rules :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5rem 0;
  border: 2px solid var(--rule-primary);
  border-radius: 0.5rem;
  overflow: hidden;
}

.markdown-rules :deep(thead) {
  background: linear-gradient(to right, var(--rule-primary)30, var(--rule-secondary)20);
  backdrop-filter: blur(0.5rem);
}

.markdown-rules :deep(th) {
  padding: 1rem;
  text-align: left;
  font-weight: 700;
  color: var(--color-text);
  border-bottom: 2px solid var(--rule-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Monaco', 'Menlo', monospace;
}

.markdown-rules :deep(td) {
  padding: 0.75rem 1rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--rule-primary)20;
}

.markdown-rules :deep(tbody tr) {
  background-color: transparent;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.markdown-rules :deep(tbody tr:nth-child(even)) {
  background-color: var(--rule-primary)08;
}

.markdown-rules :deep(tbody tr:hover) {
  background-color: var(--rule-primary)15;
  box-shadow: inset 0 0 16px var(--rule-primary)15;
}
</style>
