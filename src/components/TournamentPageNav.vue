<template>
  <div class="py-6 px-4 sm:px-6 border-b" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
    <div class="max-w-6xl mx-auto">
      <!-- Navigation Buttons -->
      <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <router-link
          :to="`/t/${tournamentId}`"
          :class="['nav-button', isActive('overview') ? 'nav-button-active' : 'nav-button-inactive']"
          :style="getButtonStyles('overview')"
        >
          Overview
        </router-link>

        <router-link
          :to="`/t/${tournamentId}/teams`"
          :class="['nav-button', isActive('teams') ? 'nav-button-active' : 'nav-button-inactive']"
          :style="getButtonStyles('teams')"
        >
          Teams
        </router-link>

        <router-link
          :to="`/t/${tournamentId}/matches`"
          :class="['nav-button', isActive('matches') ? 'nav-button-active' : 'nav-button-inactive']"
          :style="getButtonStyles('matches')"
        >
          Matches
        </router-link>

        <router-link
          :to="`/t/${tournamentId}/rules`"
          :class="['nav-button', isActive('rules') ? 'nav-button-active' : 'nav-button-inactive']"
          :style="getButtonStyles('rules')"
        >
          Rules
        </router-link>

        <router-link
          :to="`/t/${tournamentId}/files`"
          :class="['nav-button', isActive('files') ? 'nav-button-active' : 'nav-button-inactive']"
          :style="getButtonStyles('files')"
        >
          Files
        </router-link>

        <router-link
          :to="`/t/${tournamentId}/stats`"
          :class="['nav-button', isActive('stats') ? 'nav-button-active' : 'nav-button-inactive']"
          :style="getButtonStyles('stats')"
        >
          Stats
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { isValidHex, normalizeHex, calculateLuminance } from '@/utils/colorUtils'

interface Props {
  tournamentId: number | string
  accentColor?: string
  backgroundSoftColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: '#FFD700',
  backgroundSoftColor: '#1a1a1a'
})

const route = useRoute()

const getAccentColor = (): string => {
  const normalized = normalizeHex(props.accentColor)
  return isValidHex(normalized) ? normalized : '#FFD700'
}

const getAccentTextColor = (): string => {
  const accent = getAccentColor()
  const lum = calculateLuminance(accent)
  // If accent is light, use dark text; if dark, use light text
  return lum > 0.5 ? '#000000' : '#FFFFFF'
}

const getBackgroundSoftColor = (): string => {
  const normalized = normalizeHex(props.backgroundSoftColor)
  return isValidHex(normalized) ? normalized : '#1a1a1a'
}

const isActive = (page: string): boolean => {
  const currentPath = route.path
  const patternMap: Record<string, RegExp> = {
    overview: /^\/t\/[^/]+$/,
    teams: /\/teams$/,
    matches: /\/matches$/,
    rules: /\/rules$/,
    files: /\/files$/,
    stats: /\/stats$/
  }
  return patternMap[page]?.test(currentPath) ?? false
}

const getButtonStyles = (page: string): Record<string, string> => {
  const active = isActive(page)
  const accentColor = getAccentColor()
  const textColor = getAccentTextColor()

  return {
    backgroundColor: active ? accentColor : accentColor + '10',
    color: active ? textColor : accentColor,
    border: active ? `2px solid ${accentColor}` : `1px solid ${accentColor}30`,
    boxShadow: active ? `0 4px 12px ${accentColor}40` : 'none'
  }
}
</script>

<style scoped>
.nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  font-size: inherit;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  cursor: pointer;
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
  pointer-events: none;
}

.nav-button:hover::before {
  width: 300px;
  height: 300px;
}

.nav-button-inactive {
  opacity: 0.85;
}

.nav-button-inactive:hover {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2) !important;
}

.nav-button-active {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.nav-button-active:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

@media (max-width: 640px) {
  .nav-button {
    padding: 0.6rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
