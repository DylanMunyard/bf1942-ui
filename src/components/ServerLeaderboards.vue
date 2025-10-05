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
}>();

const emit = defineEmits<{
  updateMinPlayersForWeighting: [value: number];
  periodChange: [period: 'week' | 'month' | 'alltime'];
}>();

const selectedTimePeriod = ref<'week' | 'month' | 'alltime'>('week');
const showWeightedPlacements = ref(true);
const localMinPlayersForWeighting = ref(props.minPlayersForWeighting || 15);

// Watch for minPlayersForWeighting prop changes
watch(() => props.minPlayersForWeighting, (newValue) => {
  if (newValue !== undefined) {
    localMinPlayersForWeighting.value = newValue;
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

<style scoped>
/* Modern Cyberpunk Leaderboards Container */
.enhanced-leaderboards-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
}

/* Olympic Section Styles */
.olympic-section {
  grid-column: 1 / -1; /* Full width */
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.1) 0%,
    rgba(30, 41, 59, 0.4) 50%,
    rgba(15, 23, 42, 0.4) 100%
  );
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.olympic-section:hover {
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.1);
  transform: translateY(-2px);
}

.olympic-section-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.placement-type-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.placement-toggle-btn {
  padding: 0.5rem 1rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0.5rem;
  color: rgba(255, 215, 0, 0.8);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.placement-toggle-btn:hover {
  background: rgba(30, 41, 59, 1);
  border-color: rgba(255, 215, 0, 0.5);
  color: rgba(255, 215, 0, 1);
}

.placement-toggle-btn.active {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%);
  border-color: #FFD700;
  color: #FFD700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.min-players-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.min-players-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.min-players-select {
  padding: 0.25rem 0.5rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0.375rem;
  color: #FFD700;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.min-players-select:hover,
.min-players-select:focus {
  border-color: rgba(255, 215, 0, 0.5);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.section-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.olympic-content {
  padding: 0;
}

/* No placement data styles */
.no-placement-data {
  padding: 3rem 2rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.1);
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.no-data-text h4 {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 600;
}

.no-data-text p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto;
}

/* Enhanced Leaderboard Section */
.enhanced-leaderboard-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%);
  backdrop-filter: blur(16px);
  border-radius: 1rem;
  border: 1px solid rgba(100, 116, 139, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
}

.enhanced-leaderboard-section:hover {
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.1);
  transform: translateY(-2px);
}

.enhanced-section-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(100, 116, 139, 0.3);
  background: rgba(15, 23, 42, 0.6);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.section-icon {
  font-size: 1.25rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.section-title h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

.section-subtitle {
  margin: 0;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.8);
  font-weight: 400;
  font-style: italic;
}

.section-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.section-time-controls {
  display: flex;
  gap: 0.25rem;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 0.5rem;
  border: 1px solid rgba(100, 116, 139, 0.3);
  padding: 0.25rem;
}

.enhanced-time-tab {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(148, 163, 184, 1);
  transition: all 0.3s ease;
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

.enhanced-time-tab:hover {
  background: rgba(30, 41, 59, 0.8);
  color: rgba(226, 232, 240, 1);
}

.enhanced-time-tab.active {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(6, 182, 212, 0.3);
}


/* Leaderboard Table Container */
.leaderboard-table-container {
  overflow-x: auto;
  overflow-y: hidden;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .enhanced-leaderboards-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .enhanced-section-header {
    padding: 0.5rem;
  }
  
  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .section-controls {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
    width: 100%;
  }
  
  .placement-type-controls {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
    margin-bottom: 0;
  }
  
  .placement-toggle-btn {
    width: 100%;
    text-align: center;
  }
  
  .min-players-control {
    justify-content: space-between;
    width: 100%;
  }
  
  .min-players-select {
    flex: 1;
    max-width: 80px;
  }

  .section-time-controls {
    width: 100%;
  }
  
  .enhanced-time-tab {
    flex: 1;
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
  }
  
  /* Olympic section header mobile adjustments */
  .olympic-section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .olympic-section-header .section-controls {
    align-items: stretch;
  }

}

@media (max-width: 480px) {
  .enhanced-leaderboards-container {
    gap: 0.5rem;
  }

  .enhanced-section-header {
    padding: 0.375rem;
  }

  .section-title h3 {
    font-size: 1rem;
  }

  .section-icon {
    font-size: 1.125rem;
  }

}

/* Skeleton Loading Styles */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}

.skeleton-section {
  animation: skeleton-pulse 2s ease-in-out infinite;
}

.skeleton-icon {
  width: 1.5rem;
  height: 1.5rem;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 0.25rem;
}

.skeleton-text {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 0.25rem;
  height: 1rem;
}

.skeleton-title {
  width: 150px;
  height: 1.25rem;
}

.skeleton-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.skeleton-button {
  width: 80px;
  height: 2rem;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 0.5rem;
}

.skeleton-button-group {
  display: flex;
  gap: 0.25rem;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.skeleton-tab {
  width: 60px;
  height: 1.75rem;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 0.375rem;
}

.skeleton-leaderboard {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-row {
  height: 2.5rem;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 0.5rem;
}

/* Error State Styles */
.error-container {
  grid-column: 1 / -1;
  padding: 2rem;
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.error-text {
  color: rgba(248, 113, 113, 0.9);
  font-size: 0.95rem;
  margin: 0;
}

/* Loading Spinner for Filter Buttons */
.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.enhanced-time-tab:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style> 