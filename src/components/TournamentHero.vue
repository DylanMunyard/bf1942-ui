<template>
  <div class="relative overflow-hidden" :style="{ background: '#1a1a1a' }">
    <!-- Background Hero Image -->
    <div v-if="heroImageUrl" class="absolute inset-0 z-0">
      <img
        :src="heroImageUrl"
        :alt="tournament.name"
        class="w-full h-full object-cover opacity-30"
      >
      <div
        :style="{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7))',
        }"
        class="absolute inset-0"
      />
    </div>

    <!-- Decorative Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
    </div>

    <!-- Hero Content -->
    <div class="relative z-10 px-4 sm:px-6 py-8 sm:py-10">
      <div class="max-w-6xl mx-auto">
        <!-- Tournament Name -->
        <h1
          class="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-2 leading-tight"
          :style="{ color: getAccentColor() }"
        >
          {{ tournament.name }}
        </h1>

        <!-- Community Logo Display (below tournament name) -->
        <div v-if="logoImageUrl" class="mb-2 flex justify-center">
          <img :src="logoImageUrl" alt="Community logo" class="max-h-64 object-contain">
        </div>

        <!-- Organizer Name Display -->
        <div v-if="tournament.organizer" class="mb-2 text-center">
          <p class="text-sm font-medium" :style="{ color: getTextMutedColor() }">
            Organizer: <span :style="{ color: getAccentColor() }">{{ tournament.organizer }}</span>
          </p>
        </div>

        <!-- Tournament Status & Game Mode Header -->
        <div v-if="tournament.status || tournament.gameMode" class="mb-3 text-center">
          <p class="text-sm font-medium flex items-center justify-center gap-6 flex-wrap" :style="{ color: getTextMutedColor() }">
            <span v-if="tournament.status">
              Tournament status:
              <span
                class="px-3 py-1 rounded-full text-sm font-semibold ml-2 inline-block transition-all"
                :style="{
                  backgroundColor: getStatusColor(tournament.status),
                  color: getStatusTextColor(tournament.status),
                }"
              >
                <span v-if="tournament.status === 'registration'">Registration</span>
                <span v-else-if="tournament.status === 'open'">Open</span>
                <span v-else-if="tournament.status === 'closed'">Closed</span>
              </span>
            </span>
            <span v-if="tournament.gameMode">
              Game mode: <span :style="{ color: getAccentColor() }">{{ tournament.gameMode }}</span>
            </span>
          </p>
        </div>

        <!-- Links -->
        <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white mb-6">
          <a
            v-if="tournament.discordUrl"
            :href="tournament.discordUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 backdrop-blur-sm rounded-full border border-indigo-500/50 hover:border-indigo-400/70 transition-all"
          >
            <span class="text-indigo-400">💬</span>
            <span class="font-medium text-indigo-300">Discord</span>
          </a>
          <a
            v-if="tournament.forumUrl"
            :href="tournament.forumUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-sm rounded-full border border-orange-500/50 hover:border-orange-400/70 transition-all"
          >
            <span class="text-orange-400">📋</span>
            <span class="font-medium text-orange-300">Forum</span>
          </a>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <router-link
            :to="`/tournaments/${tournamentId}`"
            :class="['nav-button', isHeroActive('overview') ? 'nav-button-active' : 'nav-button-inactive']"
            :style="getButtonStyles('overview')"
          >
            Overview
          </router-link>

          <router-link
            :to="`/tournaments/${tournamentId}/rankings`"
            :class="['nav-button', isHeroActive('rankings') ? 'nav-button-active' : 'nav-button-inactive']"
            :style="getButtonStyles('rankings')"
          >
            Rankings
          </router-link>

          <router-link
            :to="`/tournaments/${tournamentId}/matches`"
            :class="['nav-button', isHeroActive('matches') ? 'nav-button-active' : 'nav-button-inactive']"
            :style="getButtonStyles('matches')"
          >
            Matches
          </router-link>

          <router-link
            :to="`/tournaments/${tournamentId}/rules`"
            :class="['nav-button', isHeroActive('rules') ? 'nav-button-active' : 'nav-button-inactive']"
            :style="getButtonStyles('rules')"
          >
            Rules
          </router-link>

          <router-link
            :to="`/tournaments/${tournamentId}/teams`"
            :class="['nav-button', isHeroActive('teams') ? 'nav-button-active' : 'nav-button-inactive']"
            :style="getButtonStyles('teams')"
          >
            Teams
          </router-link>

          <router-link
            :to="`/tournaments/${tournamentId}/files`"
            :class="['nav-button', isHeroActive('files') ? 'nav-button-active' : 'nav-button-inactive']"
            :style="getButtonStyles('files')"
          >
            Files
          </router-link>

          <router-link
            :to="`/tournaments/${tournamentId}/stats`"
            :class="['nav-button', isHeroActive('stats') ? 'nav-button-active' : 'nav-button-inactive']"
            :style="getButtonStyles('stats')"
          >
            Stats
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { isValidHex, normalizeHex, calculateLuminance } from '@/utils/colorUtils'
import type { PublicTournamentDetail } from '@/services/publicTournamentService'

interface Props {
  tournament: PublicTournamentDetail
  tournamentId: number | string
  heroImageUrl: string | null
  logoImageUrl: string | null
}

const props = defineProps<Props>()

const route = useRoute()

const getAccentColor = (): string => {
  if (!props.tournament?.theme?.accentColour) return '#FFD700'
  const normalized = normalizeHex(props.tournament.theme.accentColour)
  return isValidHex(normalized) ? normalized : '#FFD700'
}

const getAccentTextColor = (): string => {
  const accent = getAccentColor()
  const lum = calculateLuminance(accent)
  return lum > 0.5 ? '#000000' : '#FFFFFF'
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'registration':
      return '#3b82f6'
    case 'open':
      return '#10b981'
    case 'closed':
      return '#ef4444'
    default:
      return '#6b7280'
  }
}

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'registration':
      return '#93c5fd'
    case 'open':
      return '#6ee7b7'
    case 'closed':
      return '#fca5a5'
    default:
      return '#d1d5db'
  }
}

const getTextMutedColor = (): string => {
  return '#d0d0d0'
}

const isHeroActive = (page: string): boolean => {
  const currentPath = route.path
  const patternMap: Record<string, RegExp> = {
    overview: /^\/tournaments\/\d+$/,
    rankings: /\/rankings$/,
    teams: /\/teams$/,
    matches: /\/matches$/,
    rules: /\/rules$/,
    files: /\/files$/,
    stats: /\/stats$/,
  }
  return patternMap[page]?.test(currentPath) ?? false
}

const getButtonStyles = (page: string): Record<string, string> => {
  const active = isHeroActive(page)
  const accentColor = getAccentColor()
  const textColor = getAccentTextColor()

  return {
    backgroundColor: active ? accentColor : accentColor + '10',
    color: active ? textColor : accentColor,
    border: active ? `2px solid ${accentColor}` : `1px solid ${accentColor}30`,
    boxShadow: active ? `0 4px 12px ${accentColor}40` : 'none',
  }
}
</script>

<style scoped>
/* Navigation Button Styles */
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
