<script setup lang="ts">
import { ref, computed } from 'vue';
import PlayerListItem from './PlayerListItem.vue';
import type { ServerDetails } from '../services/serverDetailsService';
import { formatDate } from '../utils/date';

const props = defineProps<{
  serverDetails: ServerDetails | null;
  serverName: string;
}>();

const selectedTimePeriod = ref<'week' | 'month'>('week');

const toggleTimePeriod = (period: 'week' | 'month') => {
  selectedTimePeriod.value = period;
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

const currentMostActivePlayers = computed(() => {
  if (!props.serverDetails) return [];
  return selectedTimePeriod.value === 'week' 
    ? props.serverDetails.mostActivePlayersByTimeWeek 
    : props.serverDetails.mostActivePlayersByTimeMonth;
});

const currentTopScores = computed(() => {
  if (!props.serverDetails) return [];
  return selectedTimePeriod.value === 'week' 
    ? props.serverDetails.topScoresWeek 
    : props.serverDetails.topScoresMonth;
});
</script>

<template>
  <div class="enhanced-leaderboards-container">
    <!-- Most Active Players -->
    <div class="enhanced-leaderboard-section">
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">⚡</div>
          <h3>Most Active Warriors</h3>
        </div>
        <div class="section-time-controls">
          <button 
            @click="toggleTimePeriod('week')"
            class="enhanced-time-tab"
            :class="{ 'active': selectedTimePeriod === 'week' }"
          >
            7 Days
          </button>
          <button 
            @click="toggleTimePeriod('month')"
            class="enhanced-time-tab"
            :class="{ 'active': selectedTimePeriod === 'month' }"
          >
            30 Days
          </button>
        </div>
      </div>
      
      <!-- All Players -->
      <div class="all-players" v-if="currentMostActivePlayers.length > 0">
        <PlayerListItem
          v-for="(player, index) in currentMostActivePlayers"
          :key="index"
          :rank="index + 1"
          :player-name="player.playerName"
        >
          <template #stats>
            <span class="stat-item">{{ formatPlayTime(player.minutesPlayed) }}</span>
            <span class="stat-separator">•</span>
            <span class="stat-item">
              <span class="kills">{{ player.totalKills }}</span>/<span class="deaths">{{ player.totalDeaths }}</span>
            </span>
          </template>
        </PlayerListItem>
      </div>
    </div>

    <!-- Top Scores -->
    <div class="enhanced-leaderboard-section" v-if="serverDetails">
      <div class="enhanced-section-header">
        <div class="section-title">
          <div class="section-icon">🎯</div>
          <h3>Legendary Performances</h3>
        </div>
        <div class="section-controls">
          <div class="section-time-controls">
            <button 
              @click="toggleTimePeriod('week')"
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'week' }"
            >
              7 Days
            </button>
            <button 
              @click="toggleTimePeriod('month')"
              class="enhanced-time-tab"
              :class="{ 'active': selectedTimePeriod === 'month' }"
            >
              30 Days
            </button>
          </div>
          <router-link 
            :to="`/servers/${encodeURIComponent(serverName)}/rankings`" 
            class="view-all-button"
          >
            View Rankings
          </router-link>
        </div>
      </div>
      
      <!-- All Scores -->
      <div class="all-players" v-if="currentTopScores.length > 0">
        <PlayerListItem
          v-for="(score, index) in currentTopScores"
          :key="index"
          :rank="index + 1"
          :player-name="score.playerName"
        >
          <template #stats>
            <router-link
              :to="{
                path: '/servers/round-report',
                query: {
                  serverGuid: serverDetails.serverGuid,
                  mapName: score.mapName,
                  startTime: score.timestamp,
                  players: score.playerName
                }
              }"
              class="stat-item score-link"
            >
              {{ score.score.toLocaleString() }}
            </router-link>
            <span class="stat-separator">•</span>
            <span class="stat-item">
              <span class="kills">{{ score.kills }}</span>/<span class="deaths">{{ score.deaths }}</span>
            </span>
            <span class="stat-separator">•</span>
            <span class="stat-item">{{ score.mapName }}</span>
            <span class="stat-separator">•</span>
            <span class="stat-item">{{ formatDate(score.timestamp) }}</span>
          </template>
        </PlayerListItem>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Enhanced Leaderboards Container */
.enhanced-leaderboards-container {
  display: flex;
  flex-direction: row;
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
}

/* Enhanced Leaderboard Section */
.enhanced-leaderboard-section {
  flex: 1;
  min-width: 0;
  background: linear-gradient(135deg, var(--color-background-soft) 0%, var(--color-background) 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.enhanced-leaderboard-section:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.enhanced-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.section-title h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.4rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-time-controls {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.enhanced-time-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
  text-align: center;
}

.enhanced-time-tab:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.enhanced-time-tab.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

.view-all-button {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.view-all-button:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

/* All Players */
.all-players {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kills {
  color: #4caf50;
  font-weight: 600;
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

.stat-separator {
  color: var(--color-text-muted);
  font-weight: normal;
  opacity: 0.6;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  flex-shrink: 0;
}

.score-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.score-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .enhanced-leaderboards-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .enhanced-leaderboard-section {
    padding: 16px;
  }
  
  .section-title h3 {
    font-size: 1.3rem;
  }
}

@media (max-width: 768px) {
  .enhanced-leaderboard-section {
    padding: 12px;
    border-radius: 12px;
  }
  
  .enhanced-section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .section-controls {
    justify-content: space-between;
    width: 100%;
  }

  .section-time-controls {
    flex: 1;
  }
  
  .enhanced-time-tab {
    flex: 1;
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .enhanced-leaderboards-container {
    gap: 12px;
  }
  
  .enhanced-leaderboard-section {
    padding: 8px;
  }
  
  .section-title h3 {
    font-size: 1.1rem;
  }
  
  .section-icon {
    font-size: 1.2rem;
  }

  .view-all-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style> 