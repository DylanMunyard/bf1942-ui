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
      <!-- Background decorative elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <!-- Error content -->
      <div class="relative z-10 text-center max-w-lg w-full">
        <!-- Error icon -->
        <div class="mb-8 flex justify-center">
          <div class="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
            <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <!-- Error heading -->
        <h1 class="text-4xl md:text-5xl font-black mb-4" :style="{ color: getAccentColor() }">
          Tournament Not Found
        </h1>

        <!-- Error message -->
        <p class="text-lg mb-8" :style="{ color: getTextMutedColor() }">
          {{ error }}
        </p>

        <!-- Description -->
        <p class="text-sm mb-12" :style="{ color: getTextMutedColor() }">
          The tournament you're looking for isn't here .. or it might be coming soon, so stay tuned
        </p>

        <!-- Decorative divider -->
        <div class="flex items-center justify-center gap-4 mb-12">
          <div class="h-px w-12" :style="{ backgroundColor: getAccentColorWithOpacity(0.3) }" />
          <div class="w-2 h-2 rotate-45" :style="{ backgroundColor: getAccentColor() }" />
          <div class="h-px w-12" :style="{ backgroundColor: getAccentColorWithOpacity(0.3) }" />
        </div>

        <!-- Action button -->
        <div class="flex justify-center">
          <button
            class="px-8 py-3 rounded-lg font-medium transition-all border-2"
            :style="{
              borderColor: getAccentColor(),
              backgroundColor: getAccentColor(),
              color: getBackgroundColor()
            }"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '0.9';
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }
            }"
            @click="router.push('/servers')"
          >
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-2m6 2l6-2" />
              </svg>
              Browse Servers
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tournament Content -->
    <div v-else-if="tournament">
      <!-- Tournament Hero with Navigation -->
      <TournamentHero
        :tournament="tournament"
        :tournament-id="tournamentId"
        :hero-image-url="heroImageUrl"
        :logo-image-url="logoImageUrl"
      />

      <!-- Main Content -->
      <div class="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 mt-8 sm:mt-12 space-y-8">
        <!-- Registration Open Banner -->
        <div
          v-if="tournament.status === 'registration'"
          class="relative overflow-hidden rounded-xl border-2 p-6 sm:p-8"
          :style="{
            borderColor: getAccentColor(),
            backgroundColor: getAccentColorWithOpacity(0.1)
          }"
        >
          <!-- Background decoration -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              class="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl"
              :style="{ backgroundColor: getAccentColorWithOpacity(0.15) }"
            />
            <div
              class="absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl"
              :style="{ backgroundColor: getAccentColorWithOpacity(0.1) }"
            />
          </div>

          <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <!-- Icon -->
            <div
              class="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: getAccentColorWithOpacity(0.2) }"
            >
              <svg class="w-7 h-7" :style="{ color: getAccentColor() }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-grow">
              <h3 class="text-xl sm:text-2xl font-bold mb-1" :style="{ color: getAccentColor() }">
                Team Registrations Are Open!
              </h3>
              <p class="text-sm sm:text-base" :style="{ color: getTextMutedColor() }">
                Ready to compete? Register your team now or join an existing one to participate in this tournament.
              </p>
            </div>

            <!-- CTA Button -->
            <router-link
              :to="`/t/${tournamentId}/teams`"
              class="flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
              :style="{
                backgroundColor: getAccentColor(),
                color: getAccentTextColor()
              }"
            >
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                View Teams
              </span>
            </router-link>
          </div>
        </div>

        <!-- Promo Video (shown above news feed during registration) -->
        <TournamentPromoVideo
          v-if="tournament.promoVideoUrl && tournament.status === 'registration'"
          :video-url="tournament.promoVideoUrl"
          :accent-color="getAccentColor()"
          :text-color="getTextColor()"
          :text-muted-color="getTextMutedColor()"
          :background-soft-color="getBackgroundSoftColor()"
        />

        <!-- News Feed Section -->
        <div>
          <div class="mb-6">
            <h3 class="text-xl font-semibold" :style="{ color: getTextColor() }">
              📰 News & Updates
            </h3>
          </div>

          <TournamentNewsFeed
            :tournament-id="tournamentId"
            :accent-color="getAccentColor()"
            :text-color="getTextColor()"
            :text-muted-color="getTextMutedColor()"
            :background-soft-color="getBackgroundSoftColor()"
          />
        </div>

        <!-- Promo Video (shown below news feed when open or closed) -->
        <TournamentPromoVideo
          v-if="tournament.promoVideoUrl && (tournament.status === 'open' || tournament.status === 'closed')"
          :video-url="tournament.promoVideoUrl"
          :accent-color="getAccentColor()"
          :text-color="getTextColor()"
          :text-muted-color="getTextMutedColor()"
          :background-soft-color="getBackgroundSoftColor()"
        />
      </div>
    </div>

    <!-- Match Details Modal Component -->
    <MatchDetailsModal
      :match="selectedMatch"
      :teams="tournament?.teams || []"
      :tournament-id="tournamentId"
      :accent-color="getAccentColor()"
      :text-color="getTextColor()"
      :text-muted-color="getTextMutedColor()"
      :background-color="getBackgroundColor()"
      :background-soft-color="getBackgroundSoftColor()"
      :background-mute-color="getBackgroundMuteColor()"
      @close="closeMatchupModal"
      @compare-players="comparePlayers"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePlayerComparison } from '@/composables/usePlayerComparison';
import TournamentHero from '@/components/TournamentHero.vue';
import TournamentPageNav from '@/components/TournamentPageNav.vue';
import TournamentMatchesTable from '@/components/TournamentMatchesTable.vue';
import TournamentNewsFeed from '@/components/TournamentNewsFeed.vue';
import TournamentPromoVideo from '@/components/TournamentPromoVideo.vue';
import MatchDetailsModal from '@/components/MatchDetailsModal.vue';
import {
  publicTournamentService,
  type PublicTournamentDetail,
  type PublicTournamentMatch,
} from '@/services/publicTournamentService';
import { notificationService } from '@/services/notificationService';
import { isValidHex, normalizeHex, getContrastingTextColor, hexToRgb, rgbToHex, calculateLuminance } from '@/utils/colorUtils';
import { useTournamentCache } from '@/composables/useTournamentCache';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();
const { useTournament } = useTournamentCache();
const { comparePlayers } = usePlayerComparison();

const tournament = ref<PublicTournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const logoImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedMatch = ref<PublicTournamentMatch | null>(null);
const selectedPlayers = ref<string[]>([]);
const expandedMaps = ref<Set<string>>(new Set());

const tournamentId = route.params.id as string;

// Helper function to get themed accent color
const getThemedAccentColor = (): string => {
  const colors = getThemeColors();
  return colors.accent;
};

// Helper function to determine match winner
const getMatchWinner = (match: PublicTournamentMatch): 'team1' | 'team2' | 'tie' | null => {
  if (!match.maps || match.maps.length === 0) return null;

  let team1Wins = 0;
  let team2Wins = 0;

  for (const map of match.maps) {
    if (!map.matchResults || map.matchResults.length === 0) continue;

    for (const result of map.matchResults) {
      if (result.winningTeamId === result.team1Id) {
        team1Wins++;
      } else if (result.winningTeamId === result.team2Id) {
        team2Wins++;
      }
    }
  }

  if (team1Wins > team2Wins) return 'team1';
  if (team2Wins > team1Wins) return 'team2';
  if (team1Wins === team2Wins && team1Wins > 0) return 'tie';
  return null;
};

// Helper function to get formatted score with both ticket and round scores: "[Tickets] ([Rounds])"
const getFormattedScore = (map: any, matchTeam1Name?: string, matchTeam2Name?: string): string => {
  const results = map.matchResults;
  if (!results || results.length === 0) return '—';

  const team1Id = results[0]?.team1Id;
  const team2Id = results[0]?.team2Id;
  if (!team1Id || !team2Id) return '—';

  // Calculate round scores (wins/losses)
  const team1RoundWins = results.filter((r: any) => r.winningTeamId === team1Id).length;
  const team2RoundWins = results.filter((r: any) => r.winningTeamId === team2Id).length;
  const draws = results.filter((r: any) => r.winningTeamId !== team1Id && r.winningTeamId !== team2Id).length;

  // Calculate ticket scores
  let team1Tickets = 0;
  let team2Tickets = 0;
  for (const result of results) {
    team1Tickets += result.team1Tickets || 0;
    team2Tickets += result.team2Tickets || 0;
  }

  // Format round score
  let roundScore: string;
  if (draws > 0) {
    roundScore = `${team1RoundWins}-${team2RoundWins}-${draws}`;
  } else {
    roundScore = `${team1RoundWins}-${team2RoundWins}`;
  }

  // Format as "[Tickets] ([Rounds])"
  const scoreStr = `${team1Tickets}-${team2Tickets} (${roundScore})`;

  // Add team names if provided
  if (matchTeam1Name && matchTeam2Name) {
    return `${matchTeam1Name} ${scoreStr} ${matchTeam2Name}`;
  }
  return scoreStr;
};

// Helper function to get results aggregation (e.g., "Team A 2-0 Team B", "Team A 1-1 Team B") - kept for backward compatibility
const getResultsAggregation = (map: any, matchTeam1Name?: string, matchTeam2Name?: string): string => {
  const results = map.matchResults;
  if (!results || results.length === 0) return '—';

  const team1Id = results[0]?.team1Id;
  const team2Id = results[0]?.team2Id;
  if (!team1Id || !team2Id) return '—';

  const team1Wins = results.filter((r: any) => r.winningTeamId === team1Id).length;
  const team2Wins = results.filter((r: any) => r.winningTeamId === team2Id).length;
  const draws = results.filter((r: any) => r.winningTeamId !== team1Id && r.winningTeamId !== team2Id).length;

  let scoreStr: string;
  if (draws > 0) {
    scoreStr = `${team1Wins}-${team2Wins}-${draws}`;
  } else {
    scoreStr = `${team1Wins}-${team2Wins}`;
  }

  // Add team names if provided
  if (matchTeam1Name && matchTeam2Name) {
    return `${matchTeam1Name} ${scoreStr} ${matchTeam2Name}`;
  }
  return scoreStr;
};

// Helper function to get theme colors
const getThemeColors = () => {
  if (!tournament.value?.theme) {
    return {
      background: '#000000',
      text: '#FFFFFF',
      accent: '#FFD700',
    };
  }

  return {
    background: tournament.value.theme.backgroundColour || '#000000',
    text: tournament.value.theme.textColour || '#FFFFFF',
    accent: tournament.value.theme.accentColour || '#FFD700',
  };
};

const themeVars = computed<Record<string, string>>(() => {
  // Defaults - black background, white text, yellow/golden borders
  const defaults = {
    background: '#000000',       // black
    backgroundSoft: '#1a1a1a',   // very dark gray
    backgroundMute: '#2d2d2d',   // dark gray
    text: '#FFFFFF',             // white
    textMuted: '#d0d0d0',        // light gray
    border: '#FFD700',           // golden/yellow
  } as const;

  const bgHex = normalizeHex(tournament.value?.theme?.backgroundColour ?? '') || defaults.background;
  const textHexRaw = normalizeHex(tournament.value?.theme?.textColour ?? '');
  const borderHexRaw = normalizeHex(tournament.value?.theme?.accentColour ?? '');

  const bg = isValidHex(bgHex) ? bgHex : defaults.background;
  const bgLum = calculateLuminance(bg);
  const isDark = bgLum < 0.5;

  // Helper to mix two hex colors
  const mixHex = (a: string, b: string, t: number): string => {
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    if (!ra || !rb) return a;
    const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
    return rgbToHex(mix(ra.r, rb.r), mix(ra.g, rb.g), mix(ra.b, rb.b));
  };

  const text = isValidHex(textHexRaw) ? textHexRaw : getContrastingTextColor(bg);
  const border = isValidHex(borderHexRaw) ? borderHexRaw : defaults.border;

  const backgroundSoft = isDark ? mixHex(bg, '#FFFFFF', 0.08) : mixHex(bg, '#000000', 0.06);
  const backgroundMute = isDark ? mixHex(bg, '#FFFFFF', 0.16) : mixHex(bg, '#000000', 0.12);
  const textMuted = isDark ? mixHex(text, bg, 0.35) : mixHex(text, bg, 0.45);

  const borderHover = isDark ? mixHex(border, '#FFFFFF', 0.1) : mixHex(border, '#000000', 0.1);

  return {
    '--color-background': bg,
    '--color-background-soft': backgroundSoft,
    '--color-background-mute': backgroundMute,
    '--color-text': text,
    '--color-text-muted': textMuted,
    '--color-heading': text,
    '--color-border': border,
    '--color-primary': border,
    '--color-primary-hover': borderHover,
    '--rule-primary': border,
    '--rule-secondary': border,
  };
});

// Helper functions to derive colors from theme
const getAccentColor = (): string => {
  if (!tournament.value?.theme?.accentColour) return '#FFD700';
  const normalized = normalizeHex(tournament.value.theme.accentColour);
  return isValidHex(normalized) ? normalized : '#FFD700';
};

const getAccentTextColor = (): string => {
  const accent = getAccentColor();
  const lum = calculateLuminance(accent);
  // If accent is light, use dark text; if dark, use light text
  return lum > 0.5 ? '#000000' : '#FFFFFF';
};

const getAccentColorWithOpacity = (opacity: number): string => {
  const accent = getAccentColor();
  const rgb = hexToRgb(accent);
  if (!rgb) return `rgba(255, 215, 0, ${opacity})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

const getBackgroundColor = (): string => {
  return themeVars.value['--color-background'] || '#000000';
};

const getBackgroundSoftColor = (): string => {
  return themeVars.value['--color-background-soft'] || '#1a1a1a';
};

const getBackgroundMuteColor = (): string => {
  return themeVars.value['--color-background-mute'] || '#2d2d2d';
};

const getTextColor = (): string => {
  return themeVars.value['--color-text'] || '#FFFFFF';
};

const getTextMutedColor = (): string => {
  return themeVars.value['--color-text-muted'] || '#d0d0d0';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'registration':
      return '#FFEB3B'; // Yellow
    case 'open':
      return '#4CAF50'; // Green
    case 'closed':
      return '#EF4444'; // Red
    default:
      return '#FFD700'; // Golden (fallback)
  }
};

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'registration':
      return '#000000'; // Black text on yellow
    case 'open':
      return '#FFFFFF'; // White text on green
    case 'closed':
      return '#FFFFFF'; // White text on red
    default:
      return '#000000'; // Black text (fallback)
  }
};

const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getWeekDateRange = (week: string | null, matches?: MatchWithStatus[]): string => {
  // Try to use week dates if available
  if (tournament.value?.weekDates && week) {
    const weekDate = tournament.value.weekDates.find(w => w.week === week);
    if (weekDate) {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      };
      const startDate = new Date(weekDate.startDate);
      const endDate = new Date(weekDate.endDate);
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  }

  // Fallback: calculate from matches if week dates not available
  if (!matches || matches.length === 0) return '';

  const dates = matches.flatMap(m => m.match.maps.map(_map => new Date(m.match.scheduledDate)));

  if (dates.length === 0) return '';

  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return `${formatDate(earliestDate)} - ${formatDate(latestDate)}`;
};

const viewRoundReport = (roundId: string) => {
  router.push(`/rounds/${roundId}/report`);
};

// Consolidated matches by week for condensed table view
interface MatchWithStatus {
  match: PublicTournamentMatch;
  status: 'upcoming' | 'completed';
  isCompleted: boolean;
}

// Compute latest matches - use API-provided latestMatches or derive from matches array
const computedLatestMatches = computed(() => {
  // If API provides latestMatches, use it
  if (tournament.value?.latestMatches && tournament.value.latestMatches.length > 0) {
    return tournament.value.latestMatches.slice(0, 2);
  }

  // Otherwise, derive from all matches by finding completed matches
  if (!tournament.value?.matches) return [];

  const completedMatches = tournament.value.matches.filter(match => {
    const completedMaps = match.maps.filter(map => map.matchResults?.length > 0);
    return completedMaps.length === match.maps.length && match.maps.length > 0;
  });

  // Return the most recent 2 completed matches (assuming createdAt is ordered)
  return completedMatches.slice(-2).reverse();
});

const allMatchesByWeek = computed(() => {
  if (!tournament.value?.matchesByWeek) return [];

  // Check if there's only one week group with null week value
  const hasOnlyOneNullWeek = tournament.value.matchesByWeek.length === 1 && tournament.value.matchesByWeek[0].week === null;

  const filtered = tournament.value.matchesByWeek
    .map(group => ({
      week: group.week,
      hideWeekHeader: hasOnlyOneNullWeek,
      matches: group.matches.map(match => {
        const completedMaps = match.maps.filter(map => map.matchResults?.length > 0);
        const isCompleted = completedMaps.length === match.maps.length && match.maps.length > 0;
        return {
          match,
          status: isCompleted ? 'completed' : 'upcoming',
          isCompleted
        } as MatchWithStatus;
      })
    }))
    .filter(group => group.matches.length > 0);

  return filtered;
});


const loadTournament = async () => {
  error.value = null;

  try {
    const { tournament: cachedTournament, heroImageUrl: cachedHeroUrl, logoImageUrl: cachedLogoUrl, error: cacheError } = await useTournament(tournamentId);

    if (cacheError.value) {
      throw new Error(cacheError.value);
    }

    tournament.value = cachedTournament.value;
    heroImageUrl.value = cachedHeroUrl.value;
    logoImageUrl.value = cachedLogoUrl.value;

    // Watch for async image loads - images load in background after page renders
    watch(cachedHeroUrl, (newUrl) => {
      if (newUrl) heroImageUrl.value = newUrl;
    }, { immediate: true });

    watch(cachedLogoUrl, (newUrl) => {
      if (newUrl) logoImageUrl.value = newUrl;
    }, { immediate: true });

    const data = cachedTournament.value;
    if (!data) return;

    // Debug logging for theme colors
    console.log('Tournament loaded:', {
      name: data.name,
      theme: data.theme
    });

    // Create description
    const matchCount = data.matchesByWeek
      ? data.matchesByWeek.reduce((sum, week) => sum + week.matches.length, 0)
      : 0;
    let description = `View tournament schedule, matches, and results for ${data.name}. `;
    description += `${matchCount} match${matchCount !== 1 ? 'es' : ''} scheduled`;
    if (data.organizer) {
      description += ` organized by ${data.organizer}`;
    }
    description += '. Track live tournament progress and player statistics.';

    // Update meta description tag
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute('content', description);
    }

    // Create title
    const fullTitle = `${data.name} - BF Stats`;

    // Update Open Graph tags
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', fullTitle);
    }

    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) {
      ogDescriptionTag.setAttribute('content', description);
    }

    // Always set loading to false - data is ready either from cache or API
    loading.value = false;
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
    loading.value = false;
  }
};

const openMatchupModal = (match: PublicTournamentMatch) => {
  selectedMatch.value = match;
  selectedPlayers.value = [];
};

const closeMatchupModal = () => {
  selectedMatch.value = null;
  selectedPlayers.value = [];
  expandedMaps.value.clear();
};

const toggleMapExpansion = (mapId: number) => {
  const mapIdStr = String(mapId);
  if (expandedMaps.value.has(mapIdStr)) {
    expandedMaps.value.delete(mapIdStr);
  } else {
    expandedMaps.value.add(mapIdStr);
  }
};

const isMapExpanded = (mapId: number): boolean => {
  return expandedMaps.value.has(String(mapId));
};

const getTeamRoster = (_match: PublicTournamentMatch, teamName: string) => {
  if (!tournament.value) return [];
  const team = tournament.value.teams.find(t => t.name === teamName);
  return team?.players || [];
};

const getTeamName = (_map: any, teamNumber: 1 | 2): string => {
  if (!selectedMatch.value) return '';
  return teamNumber === 1 ? selectedMatch.value.team1Name : selectedMatch.value.team2Name;
};

const getTeamPlayers = (map: any, teamNumber: 1 | 2): any[] => {
  if (!map.round?.players) return [];
  const teamName = getTeamName(map, teamNumber);
  return map.round.players.filter((p: any) => p.teamName === teamName);
};

const selectPlayerForComparison = (playerName: string, teamName: string) => {
  const currentIndex = selectedPlayers.value.indexOf(playerName);

  // If player already selected, deselect them
  if (currentIndex !== -1) {
    selectedPlayers.value.splice(currentIndex, 1);
    return;
  }

  // If we have 2 players selected, we need to replace one
  if (selectedPlayers.value.length === 2) {
    // Find which team the currently selected players are from
    const player1Team = selectedMatch.value?.team1Name;

    const player1InTeam1 = getTeamRoster(selectedMatch.value!, player1Team!).some(p => p.playerName === selectedPlayers.value[0]);
    const newPlayerInTeam1 = teamName === player1Team;

    // Replace the player from the same team
    if (player1InTeam1 === newPlayerInTeam1) {
      selectedPlayers.value[0] = playerName;
    } else {
      selectedPlayers.value[1] = playerName;
    }
  } else {
    // Add the player
    selectedPlayers.value.push(playerName);
  }
};

const isPlayerSelected = (playerName: string): boolean => {
  return selectedPlayers.value.includes(playerName);
};

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `${newTournament.name} - BF Stats`;
    document.title = fullTitle;
    notificationService.updateOriginalTitle();
  }
});

onMounted(() => {
  loadTournament();
});
</script>

<style src="./portal-layout.css"></style>
<style scoped src="./PublicTournament.vue.css"></style>
