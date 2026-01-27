<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { LeaderboardsData } from '../services/serverDetailsService';
import ServerLeaderboard from './ServerLeaderboard.vue';
import OlympicLeaderboard from './OlympicLeaderboard.vue';

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

// Watch for prop changes
watch(() => props.minPlayersForWeighting, (newValue) => {
  if (newValue !== undefined) {
    localMinPlayersForWeighting.value = newValue;
  }
});

watch(() => props.minRoundsForKillBoards, (newValue) => {
  if (newValue !== undefined) {
    localMinRoundsForKillBoards.value = newValue;
  }
});

const toggleTimePeriod = (period: 'week' | 'month' | 'alltime') => {
  selectedTimePeriod.value = period;
  emit('periodChange', period);
};

const togglePlacementType = () => {
  showWeightedPlacements.value = !showWeightedPlacements.value;
};

const updateMinPlayersWeighting = (value: number) => {
  localMinPlayersForWeighting.value = value;
  emit('updateMinPlayersForWeighting', value);
};

const updateMinRoundsForKillBoards = (value: number) => {
  localMinRoundsForKillBoards.value = value;
  emit('updateMinRoundsForKillBoards', value);
};

const currentMostActivePlayers = computed(() => {
  if (!props.leaderboardsData) return [];
  return props.leaderboardsData.mostActivePlayersByTime || [];
});

const currentTopScores = computed(() => {
  if (!props.leaderboardsData) return [];
  return props.leaderboardsData.topScores || [];
});

const currentTopKDRatios = computed(() => {
  if (!props.leaderboardsData) return [];
  return props.leaderboardsData.topKDRatios || [];
});

const currentTopKillRates = computed(() => {
  if (!props.leaderboardsData) return [];
  return props.leaderboardsData.topKillRates || [];
});

const currentTopPlacements = computed(() => {
  if (!props.leaderboardsData) return [];

  // Use weighted placements if available and toggle is on
  if (showWeightedPlacements.value && props.leaderboardsData.weightedTopPlacements) {
    return props.leaderboardsData.weightedTopPlacements;
  }

  return props.leaderboardsData.topPlacements || [];
});

// Check if we have any placement data at all (weighted or regular)
const hasAnyPlacementData = computed(() => {
  if (!props.leaderboardsData) return false;

  return !!(
    props.leaderboardsData.topPlacements?.length ||
    props.leaderboardsData.weightedTopPlacements?.length
  );
});

const placementTypeLabel = computed(() => {
  return showWeightedPlacements.value ? 'High-Stakes Champions' : 'Olympic Champions';
});

const placementTypeSubtitle = computed(() => {
  return showWeightedPlacements.value 
    ? `Top performers in rounds with ${localMinPlayersForWeighting.value}+ players`
    : 'Most podium finishes';
});
</script>

<template>
  <!-- Loading State (only show skeleton on initial load when we have no data) -->
  <div v-if="isLoading && !leaderboardsData" class="enhanced-leaderboards-container">
    <!-- Skeleton for Olympic/Placements Section -->
    <div class="olympic-section skeleton-section">
      <div class="olympic-section-header">
        <div class="section-title">
          <div class="skeleton-icon" />
          <div class="skeleton-text skeleton-title" />
        </div>
        <div class="skeleton-controls">
          <div class="skeleton-button" />
          <div class="skeleton-button" />
        </div>
      </div>
      <div class="skeleton-leaderboard">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>
    </div>

    <!-- Skeleton for other leaderboard sections (2 columns) -->
    <div v-for="i in 4" :key="i" class="enhanced-leaderboard-section skeleton-section">
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="skeleton-icon" />
          <div class="skeleton-text skeleton-title" />
        </div>
        <div class="skeleton-controls">
          <div class="skeleton-button-group">
            <div class="skeleton-tab" />
            <div class="skeleton-tab" />
            <div class="skeleton-tab" />
          </div>
        </div>
      </div>
      <div class="skeleton-leaderboard">
        <div v-for="j in 5" :key="j" class="skeleton-row" />
      </div>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="error-container">
    <div class="error-icon">⚠️</div>
    <p class="error-text">{{ error }}</p>
  </div>

  <!-- Content -->
  <div v-else class="enhanced-leaderboards-container">
    <!-- Olympic Placements Leaderboard -->
    <div
      v-if="hasAnyPlacementData"
      class="olympic-section"
    >
      <div class="olympic-section-header">
        <div class="section-title">
          <div class="section-icon">
            {{ showWeightedPlacements ? '🏅' : '🏆' }}
          </div>
          <div>
            <h3>{{ placementTypeLabel }}</h3>
            <p class="section-subtitle">
              {{ placementTypeSubtitle }}
            </p>
          </div>
        </div>
        <div class="section-controls">
          <!-- Placement Type Toggle -->
          <div class="placement-type-controls">
            <button 
              class="placement-toggle-btn"
              :class="{ 'active': showWeightedPlacements }"
              title="Toggle between weighted and regular placements"
              @click="togglePlacementType"
            >
              {{ showWeightedPlacements ? 'High-Stakes' : 'All Rounds' }}
            </button>
            
            <!-- Min Players Control (only show when weighted is active) -->
            <div
              v-if="showWeightedPlacements"
              class="min-players-control"
            >
              <label class="min-players-label">Min Players:</label>
              <select 
                :value="localMinPlayersForWeighting" 
                class="min-players-select"
                @change="updateMinPlayersWeighting(parseInt(($event.target as HTMLSelectElement).value))"
              >
                <option value="10">
                  10+
                </option>
                <option value="15">
                  15+
                </option>
                <option value="20">
                  20+
                </option>
                <option value="25">
                  25+
                </option>
                <option value="30">
                  30+
                </option>
              </select>
            </div>
          </div>
          
          <div class="section-time-controls">
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('week')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'week'" class="loading-spinner" />
              <span v-else>7 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('month')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'month'" class="loading-spinner" />
              <span v-else>30 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('alltime')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'alltime'" class="loading-spinner" />
              <span v-else>All Time</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="olympic-content">
        <OlympicLeaderboard 
          v-if="currentTopPlacements.length > 0"
          :players="currentTopPlacements"
          source="server-olympic-leaderboard"
        />
        
        <!-- No data message for current selection -->
        <div 
          v-else 
          class="no-placement-data"
        >
          <div class="no-data-icon">
            {{ showWeightedPlacements ? '🏅' : '🏆' }}
          </div>
          <div class="no-data-text">
            <h4>No {{ placementTypeLabel.toLowerCase() }} data available</h4>
            <p v-if="showWeightedPlacements">
              Try lowering the minimum player requirement or switch to "All Rounds" to see regular placement data.
            </p>
            <p v-else>
              No placement data available for this time period.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Most Active Players -->
    <div class="enhanced-leaderboard-section">
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">
            ⚡
          </div>
          <h3>Most Active Warriors</h3>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('week')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'week'" class="loading-spinner" />
              <span v-else>7 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('month')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'month'" class="loading-spinner" />
              <span v-else>30 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('alltime')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'alltime'" class="loading-spinner" />
              <span v-else>All Time</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Most Active Players -->
      <div
        v-if="currentMostActivePlayers.length > 0"
        class="leaderboard-table-container"
      >
        <ServerLeaderboard 
          :players="currentMostActivePlayers.map(player => ({
            playerName: player.playerName,
            score: player.minutesPlayed,
            kills: player.totalKills,
            deaths: player.totalDeaths
          }))"
          source="server-leaderboards"
          score-label="Minutes"
          :time-period="selectedTimePeriod"
        />
      </div>
    </div>

    <!-- Top Scores -->
    <div class="enhanced-leaderboard-section">
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">
            🎯
          </div>
          <h3>Top Scorers</h3>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('week')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'week'" class="loading-spinner" />
              <span v-else>7 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('month')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'month'" class="loading-spinner" />
              <span v-else>30 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('alltime')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'alltime'" class="loading-spinner" />
              <span v-else>All Time</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Top Scores -->
      <div
        v-if="currentTopScores.length > 0"
        class="leaderboard-table-container"
      >
        <ServerLeaderboard 
          :players="currentTopScores.map(score => ({
            playerName: score.playerName,
            score: score.score,
            kills: score.kills,
            deaths: score.deaths,
            mapName: score.mapName,
            timestamp: score.timestamp
          }))"
          source="server-leaderboards"
          score-label="Score"
          :time-period="selectedTimePeriod"
          :server-guid="serverGuid"
          :show-round-links="false"
        />
      </div>
    </div>

    <!-- Top K/D Ratios -->
    <div class="enhanced-leaderboard-section">
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">
            ⚔️
          </div>
          <div>
            <h3>Elite K/D Masters</h3>
            <p class="section-subtitle">
              Highest sustained K/D ratio
            </p>
          </div>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('week')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'week'" class="loading-spinner" />
              <span v-else>7 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('month')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'month'" class="loading-spinner" />
              <span v-else>30 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('alltime')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'alltime'" class="loading-spinner" />
              <span v-else>All Time</span>
            </button>
          </div>

          <!-- Min Rounds Control -->
          <div class="min-rounds-control">
            <label class="min-rounds-label">Min Rounds:</label>
            <select
              :value="localMinRoundsForKillBoards"
              class="min-rounds-select"
              @change="updateMinRoundsForKillBoards(parseInt(($event.target as HTMLSelectElement).value))"
            >
              <option value="5">5+</option>
              <option value="10">10+</option>
              <option value="15">15+</option>
              <option value="20">20+</option>
              <option value="25">25+</option>
              <option value="30">30+</option>
              <option value="50">50+</option>
              <option value="100">100+</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Top K/D Ratios -->
      <div
        v-if="currentTopKDRatios.length > 0"
        class="leaderboard-table-container"
      >
        <ServerLeaderboard 
          :players="currentTopKDRatios.map(player => ({
            playerName: player.playerName,
            score: player.kdRatio || 0,
            kills: player.kills,
            deaths: player.deaths,
            mapName: player.mapName,
            timestamp: player.timestamp,
            totalRounds: player.totalRounds || 0
          }))"
          source="server-leaderboards"
          score-label="Ratio"
          :time-period="selectedTimePeriod"
          :server-guid="serverGuid"
          :show-round-links="false"
          :show-total-rounds="true"
        />
      </div>
    </div>

    <!-- Top Kill Rates -->
    <div class="enhanced-leaderboard-section">
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">
            🔥
          </div>
          <div>
            <h3>Killing Machine</h3>
            <p class="section-subtitle">
              Fastest sustained kill rate
            </p>
          </div>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('week')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'week'" class="loading-spinner" />
              <span v-else>7 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('month')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'month'" class="loading-spinner" />
              <span v-else>30 Days</span>
            </button>
            <button
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              :disabled="isLoading"
              @click="toggleTimePeriod('alltime')"
            >
              <span v-if="isLoading && selectedTimePeriod === 'alltime'" class="loading-spinner" />
              <span v-else>All Time</span>
            </button>
          </div>

          <!-- Min Rounds Control -->
          <div class="min-rounds-control">
            <label class="min-rounds-label">Min Rounds:</label>
            <select
              :value="localMinRoundsForKillBoards"
              class="min-rounds-select"
              @change="updateMinRoundsForKillBoards(parseInt(($event.target as HTMLSelectElement).value))"
            >
              <option value="5">5+</option>
              <option value="10">10+</option>
              <option value="15">15+</option>
              <option value="20">20+</option>
              <option value="25">25+</option>
              <option value="30">30+</option>
              <option value="50">50+</option>
              <option value="100">100+</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Top Kill Rates -->
      <div
        v-if="currentTopKillRates.length > 0"
        class="leaderboard-table-container"
      >
        <ServerLeaderboard 
          :players="currentTopKillRates.map(player => ({
            playerName: player.playerName,
            score: player.killRate || 0,
            kills: player.kills,
            deaths: player.deaths,
            mapName: player.mapName,
            timestamp: player.timestamp,
            totalRounds: player.totalRounds || 0
          }))"
          source="server-leaderboards"
          score-label="Kills/Min"
          :time-period="selectedTimePeriod"
          :server-guid="serverGuid"
          :show-round-links="false"
          :show-total-rounds="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped src="./ServerLeaderboards.vue.css"></style> 