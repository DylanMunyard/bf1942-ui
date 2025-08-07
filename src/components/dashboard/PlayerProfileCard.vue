<template>
  <div
    class="player-profile-card"
    :class="{ 'online': profile.isOnline }"
  >
    <div class="card-header">
      <div class="player-info">
        <div class="player-avatar">
          <span class="avatar-letter">{{ profile.playerName[0].toUpperCase() }}</span>
          <div
            v-if="profile.isOnline"
            class="online-indicator"
          />
        </div>
        <div class="player-details">
          <h3 class="player-name">
            {{ profile.playerName }}
          </h3>
          <div class="player-status">
            <span
              v-if="profile.isOnline && profile.currentServer"
              class="status online"
            >
              🎮 Playing on {{ profile.currentServer }}
            </span>
            <span
              v-else-if="profile.isOnline"
              class="status online"
            >
              🟢 Online
            </span>
            <span
              v-else
              class="status offline"
            >
              Last seen {{ formatLastSeen(profile.lastSeen) }}
            </span>
          </div>
        </div>
      </div>
      <div class="rank-badge">
        <span class="rank-number">#{{ profile.rank }}</span>
      </div>
    </div>

    <div class="stats-section">
      <div class="primary-stats">
        <div class="stat-item large">
          <span class="stat-value">{{ formatPlayTime(profile.totalPlayTime) }}</span>
          <span class="stat-label">Play Time</span>
        </div>
        <div class="stat-item large">
          <span class="stat-value">{{ formatScore(profile.score) }}</span>
          <span class="stat-label">Total Score</span>
        </div>
      </div>

      <div class="secondary-stats">
        <div class="stat-item">
          <span class="stat-value">{{ profile.kills.toLocaleString() }}</span>
          <span class="stat-label">Kills</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ profile.deaths.toLocaleString() }}</span>
          <span class="stat-label">Deaths</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ kdr }}</span>
          <span class="stat-label">K/D Ratio</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="favorite-server">
        <span class="label">Favorite Server:</span>
        <span class="server-name">{{ profile.favoriteServer || 'Not set' }}</span>
      </div>
      <button
        class="view-details-btn"
        @click="$emit('viewDetails', profile.playerName)"
      >
        View Details
        <span class="arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatLastSeen } from '@/utils/timeUtils';

interface PlayerProfile {
  playerName: string;
  totalPlayTime: number;
  lastSeen: string;
  rank: number;
  score: number;
  kills: number;
  deaths: number;
  favoriteServer: string;
  isOnline: boolean;
  currentServer?: string;
}

const props = defineProps<{
  profile: PlayerProfile;
}>();

defineEmits<{
  viewDetails: [playerName: string];
}>();

const kdr = computed(() => {
  const ratio = props.profile.deaths > 0 ? props.profile.kills / props.profile.deaths : props.profile.kills;
  return ratio.toFixed(2);
});

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
};

const formatScore = (score: number): string => {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toLocaleString();
};

// Note: formatLastSeen is now imported from @/utils/timeUtils
</script>

<style scoped>
.player-profile-card {
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(var(--color-accent-rgb), 0.02) 100%);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.player-profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--color-accent-rgb), 0.3);
}

.player-profile-card.online {
  border-left: 4px solid #22c55e;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
  color: white;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background-color: #22c55e;
  border: 2px solid var(--color-card-bg);
  border-radius: 50%;
}

.avatar-letter {
  font-size: 1.25rem;
  font-weight: 700;
}

.player-details {
  flex: 1;
}

.player-name {
  color: var(--color-text);
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.player-status {
  margin: 0;
}

.status {
  font-size: 0.875rem;
  padding: 2px 0;
  border-radius: 4px;
}

.status.online {
  color: #22c55e;
  font-weight: 500;
}

.status.offline {
  color: var(--color-text-secondary);
}

.rank-badge {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.stats-section {
  margin-bottom: 20px;
}

.primary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.secondary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background-color: rgba(var(--color-accent-rgb), 0.05);
  border-radius: 8px;
  border: 1px solid rgba(var(--color-border-rgb), 0.5);
}

.stat-item.large {
  padding: 12px;
}

.stat-value {
  display: block;
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.125rem;
}

.stat-item.large .stat-value {
  font-size: 1.5rem;
  color: var(--color-accent);
}

.stat-label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--color-border-rgb), 0.5);
}

.favorite-server {
  flex: 1;
}

.favorite-server .label {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  display: block;
  margin-bottom: 2px;
}

.server-name {
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
}

.view-details-btn {
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.view-details-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.3);
}

.arrow {
  transition: transform 0.2s ease;
}

.view-details-btn:hover .arrow {
  transform: translateX(2px);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .secondary-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .view-details-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>