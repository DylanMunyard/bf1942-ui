<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { ServerDetails, RecentRoundInfo } from '@/services/serverDetailsService';

const props = defineProps<{
  serverDetails: ServerDetails;
  serverName: string;
}>();

const router = useRouter();

const formatPlayTime = (minutes: number): string => {
  if (minutes < 1) {
    return 'less than a minute';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};

const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  if (diffMonths > 0) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  if (diffDays > 0) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  if (diffHours > 0) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  if (diffMinutes > 0) return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  return 'Just now';
};

const getDurationMinutes = (startTime: string, endTime: string): number => {
  if (!endTime || !startTime) return 0;
  const start = new Date(startTime.endsWith('Z') ? startTime : startTime + 'Z');
  const end = new Date(endTime.endsWith('Z') ? endTime : endTime + 'Z');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
};

const navigateToRoundReport = (round: RecentRoundInfo) => {
  router.push({
    path: '/servers/round-report',
    query: {
      serverGuid: props.serverDetails.serverGuid,
      mapName: round.mapName,
      startTime: round.startTime,
    },
  });
};
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
    
    <div class="timeline-container">
      <template v-for="(round, index) in serverDetails.lastRounds" :key="index">
        <div class="timeline-item" @click="navigateToRoundReport(round)">
          <div class="timeline-node-container">
            <div class="timeline-node"></div>
          </div>
          <div class="session-card">
            <div class="session-line-1">
              <span class="time-link">{{ formatRelativeTime(round.startTime) }}</span>
              <span v-if="round.isActive && index === 0" class="badge-active">Live</span>
            </div>
            <div class="session-line-2">
              <span class="map-name">{{ round.mapName }}</span>
            </div>
            <div class="session-line-3">
              <span class="duration-text">
                {{ formatPlayTime(getDurationMinutes(round.startTime, round.endTime)) }}
              </span>
            </div>
          </div>
        </div>
      </template>
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

/* Enhanced section styling from parent component */
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


/* Timeline Styles */
.timeline-container {
  position: relative;
  padding: 0;
  margin: 12px 0 0;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.timeline-item:hover {
  background-color: var(--color-background-soft);
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 1.8em;
  bottom: -1.8em;
  width: 2px;
  background: var(--color-border);
  z-index: 1;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-node-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 12px;
  min-width: 16px;
  z-index: 2;
  align-self: flex-start;
  margin-top: 1.2em;
}

.timeline-node {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-primary);
  border: 2px solid var(--color-background);
  position: relative;
  z-index: 3;
  transition: all 0.2s ease;
}

.timeline-item:hover .timeline-node {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

.session-card {
  flex: 1;
  background-color: transparent;
  line-height: 1.4;
  border-radius: 4px;
}

.session-line-1 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
  flex-wrap: wrap;
}

.time-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.time-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.session-line-2 {
  margin-bottom: 3px;
}

.map-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 1rem;
}

.session-line-3 {
  font-size: 0.85rem;
  color: var(--color-text);
}

.duration-text {
  color: var(--color-text-muted);
  font-style: italic;
}

.badge-active {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: #4CAF50;
  animation: pulse-live 2s infinite;
}

@keyframes pulse-live {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

@media (max-width: 1024px) {
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

  .timeline-item::before {
    left: 8px;
  }

  .timeline-node-container {
    margin-top: 1.1em;
  }

  .map-name {
    font-size: 0.95rem;
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
  
  .view-all-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style> 