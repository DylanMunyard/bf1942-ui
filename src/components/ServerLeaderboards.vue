<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ServerDetails } from '../services/serverDetailsService';
import { formatDate } from '../utils/date';
import PlayerName from './PlayerName.vue';

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
      <div class="leaderboard-table-container" v-if="currentMostActivePlayers.length > 0">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Time Played</th>
              <th>Player</th>
              <th>Kills</th>
              <th>Deaths</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in currentMostActivePlayers" :key="player.playerName">
              <td>{{ formatPlayTime(player.minutesPlayed) }}</td>
              <td><PlayerName :name="player.playerName" /></td>
              <td class="kills">{{ player.totalKills.toLocaleString() }}</td>
              <td class="deaths">{{ player.totalDeaths.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
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
      <div class="leaderboard-table-container" v-if="currentTopScores.length > 0">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Player</th>
              <th>K/D</th>
              <th>Map</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="score in currentTopScores" :key="score.timestamp + score.playerName">
              <td class="score-link">
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
                >
                  {{ score.score.toLocaleString() }}
                </router-link>
              </td>
              <td><PlayerName :name="score.playerName" /></td>
              <td>
                <span class="kills">{{ score.kills }}</span>/<span class="deaths">{{ score.deaths }}</span>
              </td>
              <td>{{ score.mapName }}</td>
              <td>{{ formatDate(score.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
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

/* Leaderboard Table */
.leaderboard-table-container {
  overflow-x: auto;
  margin-top: 16px;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.leaderboard-table th {
  background-color: var(--color-background-soft);
  font-weight: 600;
  color: var(--color-heading);
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.leaderboard-table tbody tr:last-child td {
  border-bottom: none;
}

.leaderboard-table tbody tr:hover {
  background-color: var(--color-background-mute);
}

.kills {
  color: #4caf50;
  font-weight: 600;
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

.score-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.score-link a:hover {
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