<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ServerDetails } from '../services/serverDetailsService';
import ServerLeaderboard from './ServerLeaderboard.vue';

const props = defineProps<{
  serverDetails: ServerDetails | null;
  serverName: string;
}>();

const selectedTimePeriod = ref<'week' | 'month' | 'alltime'>('week');

const toggleTimePeriod = (period: 'week' | 'month' | 'alltime') => {
  selectedTimePeriod.value = period;
};

const currentMostActivePlayers = computed(() => {
  if (!props.serverDetails) return [];
  switch (selectedTimePeriod.value) {
    case 'week':
      return props.serverDetails.mostActivePlayersByTimeWeek;
    case 'month':
      return props.serverDetails.mostActivePlayersByTimeMonth;
    case 'alltime':
      return props.serverDetails.mostActivePlayersByTimeAllTime;
    default:
      return props.serverDetails.mostActivePlayersByTimeWeek;
  }
});

const currentTopScores = computed(() => {
  if (!props.serverDetails) return [];
  switch (selectedTimePeriod.value) {
    case 'week':
      return props.serverDetails.topScoresWeek;
    case 'month':
      return props.serverDetails.topScoresMonth;
    case 'alltime':
      return props.serverDetails.topScoresAllTime;
    default:
      return props.serverDetails.topScoresWeek;
  }
});

const currentTopKDRatios = computed(() => {
  if (!props.serverDetails) return [];
  switch (selectedTimePeriod.value) {
    case 'week':
      return props.serverDetails.topKDRatiosWeek;
    case 'month':
      return props.serverDetails.topKDRatiosMonth;
    case 'alltime':
      return props.serverDetails.topKDRatiosAllTime;
    default:
      return props.serverDetails.topKDRatiosWeek;
  }
});

const currentTopKillRates = computed(() => {
  if (!props.serverDetails) return [];
  switch (selectedTimePeriod.value) {
    case 'week':
      return props.serverDetails.topKillRatesWeek;
    case 'month':
      return props.serverDetails.topKillRatesMonth;
    case 'alltime':
      return props.serverDetails.topKillRatesAllTime;
    default:
      return props.serverDetails.topKillRatesWeek;
  }
});
</script>

<template>
  <div class="enhanced-leaderboards-container">
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
              @click="toggleTimePeriod('week')"
            >
              7 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              @click="toggleTimePeriod('month')"
            >
              30 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              @click="toggleTimePeriod('alltime')"
            >
              All Time
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
    <div
      v-if="serverDetails"
      class="enhanced-leaderboard-section"
    >
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">
            🎯
          </div>
          <h3>Legendary Performances</h3>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              @click="toggleTimePeriod('week')"
            >
              7 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              @click="toggleTimePeriod('month')"
            >
              30 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              @click="toggleTimePeriod('alltime')"
            >
              All Time
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
          :server-guid="serverDetails?.serverGuid"
          :show-round-links="false"
        />
      </div>
    </div>

    <!-- Top K/D Ratios -->
    <div
      v-if="serverDetails"
      class="enhanced-leaderboard-section"
    >
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">
            ⚔️
          </div>
          <div>
            <h3>Elite K/D Masters</h3>
            <p class="section-subtitle">Highest sustained K/D ratio</p>
          </div>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              @click="toggleTimePeriod('week')"
            >
              7 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              @click="toggleTimePeriod('month')"
            >
              30 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              @click="toggleTimePeriod('alltime')"
            >
              All Time
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
            score: player.kdRatio,
            kills: player.kills,
            deaths: player.deaths,
            mapName: player.mapName,
            timestamp: player.timestamp,
            totalRounds: player.totalRounds
          }))"
          source="server-leaderboards"
          score-label="K/D Ratio"
          :time-period="selectedTimePeriod"
          :server-guid="serverDetails?.serverGuid"
          :show-round-links="false"
          :show-total-rounds="true"
        />
      </div>
    </div>

    <!-- Top Kill Rates -->
    <div
      v-if="serverDetails"
      class="enhanced-leaderboard-section"
    >
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">
            🔥
          </div>
          <div>
            <h3>Killing Machine</h3>
            <p class="section-subtitle">Fastest sustained kill rate</p>
          </div>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
              @click="toggleTimePeriod('week')"
            >
              7 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
              @click="toggleTimePeriod('month')"
            >
              30 Days
            </button>
            <button 
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'alltime' }"
              @click="toggleTimePeriod('alltime')"
            >
              All Time
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
            score: player.killRate,
            kills: player.kills,
            deaths: player.deaths,
            mapName: player.mapName,
            timestamp: player.timestamp,
            totalRounds: player.totalRounds
          }))"
          source="server-leaderboards"
          score-label="Kills/Min"
          :time-period="selectedTimePeriod"
          :server-guid="serverDetails?.serverGuid"
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
  }

  .section-time-controls {
    width: 100%;
  }
  
  .enhanced-time-tab {
    flex: 1;
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
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
</style> 