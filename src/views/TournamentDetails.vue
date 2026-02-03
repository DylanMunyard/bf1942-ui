<template>
  <div class="portal-page tournament-admin-portal">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-card">
          <p class="error-message">{{ error }}</p>
          <button class="portal-btn portal-btn--ghost" @click="router.push('/dashboard')">
            Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Tournament Content -->
      <div v-else-if="tournament">
        <!-- Header Section -->
        <header class="tournament-header">
          <div class="tournament-header-glow" />
          <!-- Hero Image Background -->
          <div v-if="heroImageUrl" class="tournament-hero">
            <img :src="heroImageUrl" :alt="tournament.name" class="tournament-hero-img" />
            <div class="tournament-hero-overlay" />
          </div>

          <div class="tournament-header-content">
            <div class="tournament-header-top">
              <div class="tournament-header-left">
                <div class="tournament-title-row">
                  <button class="back-btn" @click="router.push('/dashboard')" title="Back to Dashboard">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div class="game-icon" :style="{ backgroundImage: getGameIcon() }" />
                  <h1 class="tournament-title">{{ tournament.name }}</h1>
                </div>

                <div class="tournament-meta">
                  <span class="meta-item">
                    <span class="meta-icon">👤</span>
                    <span class="meta-value">{{ tournament.organizer }}</span>
                  </span>
                  <span class="meta-sep">•</span>
                  <span class="meta-item">{{ formatDate(tournament.createdAt) }}</span>
                  <template v-if="tournament.anticipatedRoundCount">
                    <span class="meta-sep">•</span>
                    <span class="meta-item">
                      <span class="meta-icon">🎯</span>
                      <span>{{ (tournament.matches?.length ?? 0) }}/{{ tournament.anticipatedRoundCount }} matches</span>
                    </span>
                  </template>
                </div>
              </div>

              <div class="tournament-header-actions">
                <button
                  class="portal-btn portal-btn--primary view-public-btn"
                  @click="router.push(`/t/${tournament.slug || tournament.id}`)"
                  title="View public tournament page"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Public
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- Tab Navigation -->
        <nav class="portal-tabs">
          <button
            :class="['portal-tab', activeTab === 'matches' && 'portal-tab--active']"
            @click="setTab('matches')"
          >
            <span class="portal-tab-icon">⟩</span> Matches
          </button>
          <button
            :class="['portal-tab', activeTab === 'teams' && 'portal-tab--active']"
            @click="setTab('teams')"
          >
            <span class="portal-tab-icon">⟩</span> Teams
          </button>
          <button
            :class="['portal-tab', activeTab === 'weeks' && 'portal-tab--active']"
            @click="setTab('weeks')"
          >
            <span class="portal-tab-icon">⟩</span> Weeks
          </button>
          <button
            :class="['portal-tab', activeTab === 'files' && 'portal-tab--active']"
            @click="setTab('files')"
          >
            <span class="portal-tab-icon">⟩</span> Files
          </button>
          <button
            :class="['portal-tab', activeTab === 'posts' && 'portal-tab--active']"
            @click="setTab('posts')"
          >
            <span class="portal-tab-icon">⟩</span> Posts
          </button>
          <button
            :class="['portal-tab', activeTab === 'settings' && 'portal-tab--active']"
            @click="setTab('settings')"
          >
            <span class="portal-tab-icon">⟩</span> Settings
          </button>
        </nav>

        <!-- Tab Panels -->
        <div class="portal-panel">
          <div v-show="activeTab === 'matches'">
            <TournamentMatchesTab
              ref="matchesTabRef"
              :tournament="tournament"
              @refresh="loadTournament"
            />
          </div>

          <div v-show="activeTab === 'teams'">
            <TournamentTeamsTab
              ref="teamsTabRef"
              :tournament="tournament"
              @refresh="loadTournament"
            />
          </div>

          <div v-show="activeTab === 'weeks'">
            <TournamentWeeksTab
              ref="weeksTabRef"
              :tournament="tournament"
              @refresh="loadTournament"
            />
          </div>

          <div v-show="activeTab === 'files'">
            <TournamentFilesTab
              ref="filesTabRef"
              :tournament="tournament"
              @refresh="loadTournament"
            />
          </div>

          <div v-show="activeTab === 'posts'">
            <TournamentPostsTab
              ref="postsTabRef"
              :tournament="tournament"
              @refresh="loadTournament"
            />
          </div>

          <div v-show="activeTab === 'settings'">
            <TournamentSettingsTab
              ref="settingsTabRef"
              :tournament="tournament"
              @refresh="loadTournament"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  adminTournamentService,
  type TournamentDetail
} from '@/services/adminTournamentService';
import TournamentTeamsTab from '@/components/tournament-admin/TournamentTeamsTab.vue';
import TournamentWeeksTab from '@/components/tournament-admin/TournamentWeeksTab.vue';
import TournamentFilesTab from '@/components/tournament-admin/TournamentFilesTab.vue';
import TournamentPostsTab from '@/components/tournament-admin/TournamentPostsTab.vue';
import TournamentMatchesTab from '@/components/tournament-admin/TournamentMatchesTab.vue';
import TournamentSettingsTab from '@/components/tournament-admin/TournamentSettingsTab.vue';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

// Core state
const tournament = ref<TournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const logoImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Tab state
type TabName = 'matches' | 'teams' | 'weeks' | 'files' | 'posts' | 'settings';
const activeTab = ref<TabName>('matches');

// Initialize activeTab from route
const initializeTabFromRoute = () => {
  const tabParam = route.params.tab as string;
  const validTabs: TabName[] = ['matches', 'teams', 'weeks', 'files', 'posts', 'settings'];
  if (tabParam && validTabs.includes(tabParam as TabName)) {
    activeTab.value = tabParam as TabName;
  } else {
    activeTab.value = 'matches';
  }
};

// Watch for route changes to update active tab and trigger load
watch(() => route.params.tab, (newTab) => {
  const validTabs: TabName[] = ['matches', 'teams', 'weeks', 'files', 'posts', 'settings'];
  if (newTab && validTabs.includes(newTab as TabName)) {
    activeTab.value = newTab as TabName;
    // Trigger load on the tab component when route changes
    const tabRefs: Record<TabName, { value: { load?: () => void } | null }> = {
      matches: matchesTabRef,
      teams: teamsTabRef,
      weeks: weeksTabRef,
      files: filesTabRef,
      posts: postsTabRef,
      settings: settingsTabRef
    };
    tabRefs[newTab as TabName].value?.load?.();
  }
});

// Tab refs for triggering load on tab switch
const matchesTabRef = ref<InstanceType<typeof TournamentMatchesTab> | null>(null);
const teamsTabRef = ref<InstanceType<typeof TournamentTeamsTab> | null>(null);
const weeksTabRef = ref<InstanceType<typeof TournamentWeeksTab> | null>(null);
const filesTabRef = ref<InstanceType<typeof TournamentFilesTab> | null>(null);
const postsTabRef = ref<InstanceType<typeof TournamentPostsTab> | null>(null);
const settingsTabRef = ref<InstanceType<typeof TournamentSettingsTab> | null>(null);

const tournamentId = parseInt(route.params.id as string);

// Tab switching
const setTab = (tab: TabName) => {
  // Update route instead of just local state
  router.push(`/admin/tournaments/${tournamentId}/${tab}`);
  // Trigger load on the tab component when it becomes active
  const tabRefs: Record<TabName, { value: { load?: () => void } | null }> = {
    matches: matchesTabRef,
    teams: teamsTabRef,
    weeks: weeksTabRef,
    files: filesTabRef,
    posts: postsTabRef,
    settings: settingsTabRef
  };
  tabRefs[tab].value?.load?.();
};

// Data loading
const loadTournament = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (isNaN(tournamentId)) {
      throw new Error('Invalid tournament ID');
    }

    const data = await adminTournamentService.getTournamentDetail(tournamentId);
    tournament.value = {
      ...data,
      matches: data.matches ?? []
    };

    document.title = `${tournament.value.name} - Tournament Details`;
    loading.value = false;

    // Load images asynchronously
    if (data.hasHeroImage) {
      loadHeroImage().catch(err => console.debug('Failed to load hero image:', err));
    } else {
      heroImageUrl.value = null;
    }

    if (data.hasCommunityLogo) {
      loadLogoImage().catch(err => console.debug('Failed to load logo image:', err));
    } else {
      logoImageUrl.value = null;
    }
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
    loading.value = false;
  }
};

const loadHeroImage = async () => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(`/stats/admin/tournaments/${tournamentId}/image`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const blob = await response.blob();
      heroImageUrl.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    console.debug('No hero image available');
  }
};

const loadLogoImage = async () => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(`/stats/admin/tournaments/${tournamentId}/logo`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const blob = await response.blob();
      logoImageUrl.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    console.debug('No logo image available');
  }
};

// Helpers
const getProgressPercentage = (): number => {
  if (!tournament.value?.anticipatedRoundCount || tournament.value.anticipatedRoundCount === 0) {
    return 0;
  }
  return Math.min(100, ((tournament.value.matches?.length ?? 0) / tournament.value.anticipatedRoundCount) * 100);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

const getGameIcon = (): string => {
  if (!tournament.value) return `url('${bf1942Icon}')`;

  const iconMap: Record<string, string> = {
    'bf1942': `url('${bf1942Icon}')`,
    'fh2': `url('${fh2Icon}')`,
    'bfvietnam': `url('${bfvIcon}')`
  };
  return iconMap[tournament.value.game] || `url('${bf1942Icon}')`;
};

onMounted(() => {
  initializeTabFromRoute();
  loadTournament();
});

onUnmounted(() => {
  // Clean up blob URLs
  if (heroImageUrl.value) URL.revokeObjectURL(heroImageUrl.value);
  if (logoImageUrl.value) URL.revokeObjectURL(logoImageUrl.value);
});
</script>

<style src="./portal-layout.css"></style>
<style src="@/styles/portal-admin.css"></style>
<style scoped src="./TournamentDetails.vue.css"></style>

<style scoped>
/* Tournament-specific header styles */
.tournament-admin-portal {
  --portal-accent: #00e5a0;
}

.tournament-header {
  position: relative;
  background: var(--portal-surface);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.tournament-header-glow {
  position: absolute;
  top: -40px;
  left: -20px;
  width: 200px;
  height: 120px;
  background: radial-gradient(ellipse, var(--portal-accent-glow) 0%, transparent 70%);
  filter: blur(24px);
  opacity: 0.6;
  z-index: 1;
}

.tournament-hero {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  z-index: 0;
}

.tournament-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tournament-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, var(--portal-surface) 100%);
}

.tournament-header-content {
  position: relative;
  z-index: 2;
  padding: 1rem 1.5rem;
}

@media (min-width: 640px) {
  .tournament-header-content {
    padding: 1rem 2rem;
  }
}

.tournament-header-top {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .tournament-header-top {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.tournament-header-left {
  flex: 1;
}

.tournament-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--portal-text);
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--portal-text-bright);
}

.game-icon {
  width: 2rem;
  height: 2rem;
  background-size: cover;
  background-position: center;
  border-radius: 2px;
  flex-shrink: 0;
}

.tournament-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--portal-accent);
  margin: 0;
  letter-spacing: 0.02em;
}

@media (min-width: 640px) {
  .tournament-title {
    font-size: 2rem;
  }
}

.tournament-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-icon {
  font-size: 0.9rem;
}

.meta-value {
  font-weight: 500;
  color: var(--portal-text-bright);
}

.meta-sep {
  opacity: 0.5;
}

.tournament-header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.view-public-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}


/* Loading and error states */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--portal-border);
  border-top-color: var(--portal-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  padding: 1.5rem;
}

.error-card {
  background: var(--portal-danger-glow);
  border: 1px solid var(--portal-danger);
  border-radius: 2px;
  padding: 1.5rem;
  text-align: center;
}

.error-message {
  color: var(--portal-danger);
  margin-bottom: 1rem;
}

/* Size utilities */
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-6 { width: 1.5rem; }
.h-6 { height: 1.5rem; }
</style>
