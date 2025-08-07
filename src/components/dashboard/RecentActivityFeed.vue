<template>
  <div class="activity-feed">
    <div
      v-if="activities.length === 0"
      class="no-activity"
    >
      <span class="activity-icon">📊</span>
      <p>No recent activity to display</p>
      <small>Your battlefield achievements and activities will appear here</small>
    </div>
    <div
      v-else
      class="activity-list"
    >
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-item"
        :class="`activity-${activity.type}`"
      >
        <div class="activity-icon-container">
          <span class="activity-icon">{{ getActivityIcon(activity.type) }}</span>
        </div>
        <div class="activity-content">
          <p class="activity-description">
            {{ activity.description }}
          </p>
          <span class="activity-time">{{ formatTimestamp(activity.timestamp) }}</span>
          <span
            v-if="activity.playerName"
            class="activity-player"
          >{{ activity.playerName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RecentActivity {
  id: string;
  type: 'achievement' | 'session' | 'buddy_online' | 'rank_up';
  description: string;
  timestamp: string;
  playerName?: string;
}

defineProps<{
  activities: RecentActivity[];
}>();

const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'achievement':
      return '🏆';
    case 'session':
      return '🎮';
    case 'buddy_online':
      return '👥';
    case 'rank_up':
      return '⭐';
    default:
      return '📊';
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  
  return date.toLocaleDateString();
};
</script>

<style scoped>
.activity-feed {
  max-height: 400px;
  overflow-y: auto;
}

.no-activity {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);
}

.no-activity .activity-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
  opacity: 0.7;
}

.no-activity p {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: var(--color-text);
}

.no-activity small {
  font-size: 0.875rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background-color: rgba(var(--color-accent-rgb), 0.03);
  border-radius: 8px;
  border: 1px solid rgba(var(--color-border-rgb), 0.5);
  transition: all 0.2s ease;
}

.activity-item:hover {
  background-color: rgba(var(--color-accent-rgb), 0.06);
  border-color: rgba(var(--color-accent-rgb), 0.2);
}

.activity-achievement {
  border-left: 3px solid #fbbf24;
}

.activity-session {
  border-left: 3px solid #06b6d4;
}

.activity-buddy_online {
  border-left: 3px solid #22c55e;
}

.activity-rank_up {
  border-left: 3px solid #8b5cf6;
}

.activity-icon-container {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon {
  font-size: 1.125rem;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-description {
  color: var(--color-text);
  margin: 0 0 6px 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.activity-time {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  margin-right: 12px;
}

.activity-player {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 600;
}

/* Custom scrollbar */
.activity-feed::-webkit-scrollbar {
  width: 6px;
}

.activity-feed::-webkit-scrollbar-track {
  background: rgba(var(--color-border-rgb), 0.1);
  border-radius: 3px;
}

.activity-feed::-webkit-scrollbar-thumb {
  background: rgba(var(--color-accent-rgb), 0.3);
  border-radius: 3px;
}

.activity-feed::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--color-accent-rgb), 0.5);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .activity-item {
    padding: 12px;
    gap: 8px;
  }
  
  .activity-icon-container {
    width: 32px;
    height: 32px;
  }
  
  .activity-icon {
    font-size: 1rem;
  }
  
  .activity-description {
    font-size: 0.8rem;
  }
  
  .activity-time,
  .activity-player {
    font-size: 0.7rem;
  }
}
</style>