<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { LeaderboardsData } from '../services/serverDetailsService';
import OlympicLeaderboard from './OlympicLeaderboard.vue';
import PlayerName from './PlayerName.vue';

const props = defineProps<{
  leaderboardsData: LeaderboardsData | null;
  isLoading: boolean;
  error: string | null;
  serverName: string;
  serverGuid?: string;
  minPlayersForWeighting?: number;
  minRoundsForKillBoards?: number;
}>();

const emit = defineEmits<{
  updateMinPlayersForWeighting: [value: number];
  updateMinRoundsForKillBoards: [value: number];
  periodChange: [period: 'week' | 'month' | 'alltime'];
}>();

const selectedTimePeriod = ref<'week' | 'month' | 'alltime'>('week');
const showWeightedPlacements = ref(true);
const localMinPlayersForWeighting = ref(props.minPlayersForWeighting || 15);
const localMinRoundsForKillBoards = ref(props.minRoundsForKillBoards || 20);

watch(() => props.minPlayersForWeighting, (newValue) => {
  if (newValue !== undefined) localMinPlayersForWeighting.value = newValue;
});
watch(() => props.minRoundsForKillBoards, (newValue) => {
  if (newValue !== undefined) localMinRoundsForKillBoards.value = newValue;
});

const toggleTimePeriod = (period: 'week' | 'month' | 'alltime') => {
  selectedTimePeriod.value = period;
  emit('periodChange', period);
};
const togglePlacementType = () => { showWeightedPlacements.value = !showWeightedPlacements.value; };
const updateMinPlayersWeighting = (value: number) => {
  localMinPlayersForWeighting.value = value;
  emit('updateMinPlayersForWeighting', value);
};
const updateMinRoundsForKillBoards = (value: number) => {
  localMinRoundsForKillBoards.value = value;
  emit('updateMinRoundsForKillBoards', value);
};

const currentMostActivePlayers = computed(() => props.leaderboardsData?.mostActivePlayersByTime ?? []);
const currentTopScores = computed(() => props.leaderboardsData?.topScores ?? []);
const currentTopKDRatios = computed(() => props.leaderboardsData?.topKDRatios ?? []);
const currentTopKillRates = computed(() => props.leaderboardsData?.topKillRates ?? []);
const currentTopPlacements = computed(() => {
  if (!props.leaderboardsData) return [];
  if (showWeightedPlacements.value && props.leaderboardsData.weightedTopPlacements?.length)
    return props.leaderboardsData.weightedTopPlacements;
  return props.leaderboardsData.topPlacements ?? [];
});

const hasAnyPlacementData = computed(() => !!(
  props.leaderboardsData?.topPlacements?.length || props.leaderboardsData?.weightedTopPlacements?.length
));

const placementTypeLabel = computed(() =>
  showWeightedPlacements.value ? 'High-Stakes Champions' : 'Olympic Champions'
);
const placementTypeSubtitle = computed(() =>
  showWeightedPlacements.value
    ? `Rounds with ${localMinPlayersForWeighting.value}+ players`
    : 'Most podium finishes'
);

const TOP_N = 5;
</script>

<template>
  <!-- Loading -->
  <div v-if="isLoading && !leaderboardsData" class="hacker-leaderboards">
    <div class="hacker-leaderboards-global-bar skeleton-bar" />
    <div class="hacker-leaderboards-grid">
      <div v-for="i in 5" :key="i" class="hacker-tile skeleton-tile">
        <div class="skeleton-tile-header" />
        <div v-for="j in 4" :key="j" class="skeleton-row" />
      </div>
    </div>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="hacker-leaderboards-error">
    <span class="hacker-leaderboards-error-icon">⚠</span>
    <p class="hacker-leaderboards-error-text">{{ error }}</p>
  </div>

  <!-- Content -->
  <div v-else class="hacker-leaderboards">
    <!-- Global period bar -->
    <div class="hacker-leaderboards-global-bar">
      <span class="hacker-leaderboards-global-label">Period</span>
      <div class="hacker-leaderboards-period-tabs">
        <button
          v-for="period in [['week', '7d'], ['month', '30d'], ['alltime', 'All']] as const"
          :key="period[0]"
          type="button"
          class="hacker-period-tab"
          :class="{ 'hacker-period-tab--active': selectedTimePeriod === period[0] }"
          :disabled="isLoading"
          @click="toggleTimePeriod(period[0])"
        >
          <span v-if="isLoading && selectedTimePeriod === period[0]" class="hacker-period-tab-spinner" />
          <span v-else>{{ period[1] }}</span>
        </button>
      </div>
    </div>

    <div class="hacker-leaderboards-grid">
      <!-- Placements tile -->
      <section v-if="hasAnyPlacementData" class="hacker-tile hacker-tile--placements">
        <div class="hacker-tile-header">
          <span class="hacker-tile-icon" aria-hidden="true">◆</span>
          <div class="hacker-tile-heading">
            <h3 class="hacker-tile-title">{{ placementTypeLabel }}</h3>
            <p class="hacker-tile-subtitle">{{ placementTypeSubtitle }}</p>
          </div>
          <div class="hacker-tile-actions">
            <button
              type="button"
              class="hacker-tile-toggle"
              :class="{ 'hacker-tile-toggle--active': showWeightedPlacements }"
              title="Toggle placement type"
              @click="togglePlacementType"
            >
              {{ showWeightedPlacements ? 'High-Stakes' : 'All Rounds' }}
            </button>
            <select
              v-if="showWeightedPlacements"
              :value="localMinPlayersForWeighting"
              class="hacker-tile-select"
              aria-label="Min players"
              @change="updateMinPlayersWeighting(parseInt(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="n in [10, 15, 20, 25, 30]" :key="n" :value="n">{{ n }}+</option>
            </select>
          </div>
        </div>
        <div class="hacker-tile-body hacker-tile-body--podium">
          <OlympicLeaderboard
            v-if="currentTopPlacements.length > 0"
            :players="currentTopPlacements"
            source="server-olympic-leaderboard"
          />
          <div v-else class="hacker-tile-empty">
            <span class="hacker-tile-empty-icon">◆</span>
            <p>No {{ placementTypeLabel.toLowerCase() }} for this period.</p>
          </div>
        </div>
      </section>

      <!-- Most Active -->
      <section class="hacker-tile">
        <div class="hacker-tile-header">
          <span class="hacker-tile-icon" aria-hidden="true">⚡</span>
          <h3 class="hacker-tile-title">Most Active</h3>
        </div>
        <div class="hacker-tile-body">
          <template v-if="currentMostActivePlayers.length > 0">
            <ul class="hacker-list">
              <li
                v-for="(player, i) in currentMostActivePlayers.slice(0, TOP_N)"
                :key="player.playerName"
                class="hacker-list-row"
                :class="i < 3 ? `hacker-list-row--top-${i + 1}` : ''"
              >
                <span class="hacker-list-rank">{{ i + 1 }}</span>
                <router-link
                  :to="`/players/${encodeURIComponent(player.playerName)}`"
                  class="hacker-list-name"
                >
                  <PlayerName :name="player.playerName" source="server-leaderboards" />
                </router-link>
                <span class="hacker-list-value hacker-mono">{{ player.minutesPlayed }}m</span>
              </li>
            </ul>
          </template>
          <div v-else class="hacker-tile-empty">No activity data</div>
        </div>
      </section>

      <!-- Top Scores -->
      <section class="hacker-tile">
        <div class="hacker-tile-header">
          <span class="hacker-tile-icon" aria-hidden="true">▣</span>
          <h3 class="hacker-tile-title">Top Scores</h3>
        </div>
        <div class="hacker-tile-body">
          <template v-if="currentTopScores.length > 0">
            <ul class="hacker-list">
              <li
                v-for="(entry, i) in currentTopScores.slice(0, TOP_N)"
                :key="`${entry.playerName}-${entry.score}-${i}`"
                class="hacker-list-row"
                :class="i < 3 ? `hacker-list-row--top-${i + 1}` : ''"
              >
                <span class="hacker-list-rank">{{ i + 1 }}</span>
                <router-link
                  :to="`/players/${encodeURIComponent(entry.playerName)}`"
                  class="hacker-list-name"
                >
                  <PlayerName :name="entry.playerName" source="server-leaderboards" />
                </router-link>
                <span class="hacker-list-value hacker-mono">{{ entry.score.toLocaleString() }}</span>
              </li>
            </ul>
          </template>
          <div v-else class="hacker-tile-empty">No score data</div>
        </div>
      </section>

      <!-- Elite K/D -->
      <section class="hacker-tile">
        <div class="hacker-tile-header">
          <span class="hacker-tile-icon" aria-hidden="true">⚔</span>
          <div class="hacker-tile-heading">
            <h3 class="hacker-tile-title">Elite K/D</h3>
            <p class="hacker-tile-subtitle">Min rounds</p>
          </div>
          <select
            :value="localMinRoundsForKillBoards"
            class="hacker-tile-select"
            aria-label="Min rounds"
            @change="updateMinRoundsForKillBoards(parseInt(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="n in [5, 10, 15, 20, 25, 30, 50, 100]" :key="n" :value="n">{{ n }}+</option>
          </select>
        </div>
        <div class="hacker-tile-body">
          <template v-if="currentTopKDRatios.length > 0">
            <ul class="hacker-list">
              <li
                v-for="(entry, i) in currentTopKDRatios.slice(0, TOP_N)"
                :key="`${entry.playerName}-${entry.kdRatio}-${i}`"
                class="hacker-list-row"
                :class="i < 3 ? `hacker-list-row--top-${i + 1}` : ''"
              >
                <span class="hacker-list-rank">{{ i + 1 }}</span>
                <router-link
                  :to="`/players/${encodeURIComponent(entry.playerName)}`"
                  class="hacker-list-name"
                >
                  <PlayerName :name="entry.playerName" source="server-leaderboards" />
                </router-link>
                <span class="hacker-list-value hacker-mono">{{ (entry.kdRatio ?? 0).toFixed(2) }}</span>
              </li>
            </ul>
          </template>
          <div v-else class="hacker-tile-empty">No K/D data</div>
        </div>
      </section>

      <!-- Kill Rate -->
      <section class="hacker-tile">
        <div class="hacker-tile-header">
          <span class="hacker-tile-icon" aria-hidden="true">▸</span>
          <h3 class="hacker-tile-title">Kill Rate</h3>
          <select
            :value="localMinRoundsForKillBoards"
            class="hacker-tile-select hacker-tile-select--right"
            aria-label="Min rounds"
            @change="updateMinRoundsForKillBoards(parseInt(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="n in [5, 10, 15, 20, 25, 30, 50, 100]" :key="n" :value="n">{{ n }}+</option>
          </select>
        </div>
        <div class="hacker-tile-body">
          <template v-if="currentTopKillRates.length > 0">
            <ul class="hacker-list">
              <li
                v-for="(entry, i) in currentTopKillRates.slice(0, TOP_N)"
                :key="`${entry.playerName}-${entry.killRate}-${i}`"
                class="hacker-list-row"
                :class="i < 3 ? `hacker-list-row--top-${i + 1}` : ''"
              >
                <span class="hacker-list-rank">{{ i + 1 }}</span>
                <router-link
                  :to="`/players/${encodeURIComponent(entry.playerName)}`"
                  class="hacker-list-name"
                >
                  <PlayerName :name="entry.playerName" source="server-leaderboards" />
                </router-link>
                <span class="hacker-list-value hacker-mono">{{ (entry.killRate ?? 0).toFixed(2) }}/m</span>
              </li>
            </ul>
          </template>
          <div v-else class="hacker-tile-empty">No kill rate data</div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped src="./ServerLeaderboards.vue.css"></style>
