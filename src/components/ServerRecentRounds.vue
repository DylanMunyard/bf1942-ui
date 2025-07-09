<script setup lang="ts">
import type { ServerDetails } from '@/services/serverDetailsService';
import { formatDate } from '../utils/date';

defineProps<{
  serverDetails: ServerDetails;
  serverName: string;
}>();
</script>

<template>
  <div v-if="serverDetails.lastRounds && serverDetails.lastRounds.length > 0" class="enhanced-leaderboard-section recent-rounds-section">
    <div class="enhanced-section-header">
      <div class="section-title">
        <div class="section-icon">🎮</div>
        <h3>Recent Battles</h3>
      </div>
      <router-link 
        :to="{ path: '/rounds', query: { server: serverName } }" 
        class="view-all-button"
      >
        View all
      </router-link>
    </div>
    
    <div class="rounds-grid">
      <div v-for="(round, index) in serverDetails.lastRounds" :key="index" class="round-card">
        <div class="round-status">
          <span v-if="round.isActive && index === 0" class="badge-live">🔴 LIVE</span>
          <span v-else class="round-date">{{ formatDate(round.endTime) }}</span>
        </div>
        <div class="round-map-name">{{ round.mapName }}</div>
        <router-link
          :to="{
            path: '/servers/round-report',
            query: {
              serverGuid: serverDetails.serverGuid,
              mapName: round.mapName,
              startTime: round.startTime
            }
          }"
          class="round-report-button"
        >
          Battle Report
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Recent Rounds */
.recent-rounds-section {
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(76, 175, 80, 0.05) 100%);
  border-color: rgba(76, 175, 80, 0.2);
  margin-top: 24px;
}

.rounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.round-card {
  background: var(--color-background);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.round-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary) 0%, #9c27b0 100%);
}

.round-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.round-status {
  margin-bottom: 8px;
}

.badge-live {
  background: linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.round-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.round-map-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.round-report-button {
  background: linear-gradient(135deg, var(--color-primary) 0%, #9c27b0 100%);
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-block;
}

.round-report-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

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

@media (max-width: 1024px) {
  .enhanced-leaderboard-section {
    padding: 16px;
  }
  
  .section-title h3 {
    font-size: 1.3rem;
  }
  
  .rounds-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

  .rounds-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .enhanced-leaderboard-section {
    padding: 8px;
  }
  
  .section-title h3 {
    font-size: 1.1rem;
  }
  
  .section-icon {
    font-size: 1.2rem;
  }

  .round-card {
    padding: 12px;
  }
  
  .view-all-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .enhanced-leaderboard-section {
    padding: 6px;
  }

  .section-title h3 {
    font-size: 1rem;
  }

  .section-icon {
    font-size: 1rem;
  }
}
</style> 