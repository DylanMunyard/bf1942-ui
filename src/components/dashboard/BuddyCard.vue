<template>
  <div class="buddy-card" :class="{ 'online': buddy.isOnline }">
    <div class="buddy-header">
      <div class="buddy-avatar">
        <span class="avatar-letter">{{ buddy.playerName[0].toUpperCase() }}</span>
        <div v-if="buddy.isOnline" class="online-indicator"></div>
      </div>
      <div class="buddy-info">
        <h3 class="buddy-name">{{ buddy.playerName }}</h3>
        <div class="buddy-status">
          <span v-if="buddy.isOnline && buddy.currentServer" class="status online">
            🎮 {{ buddy.currentServer }}
          </span>
          <span v-else-if="buddy.isOnline" class="status online">
            🟢 Online
          </span>
          <span v-else class="status offline">
            Last seen {{ formatLastSeen(buddy.lastSeen) }}
          </span>
        </div>
      </div>
    </div>

    <div class="buddy-stats">
      <div class="stat-item">
        <span class="stat-value">{{ formatScore(buddy.score) }}</span>
        <span class="stat-label">Score</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">#{{ buddy.rank }}</span>
        <span class="stat-label">Rank</span>
      </div>
    </div>

    <div class="buddy-actions">
      <button @click="$emit('viewProfile', buddy.playerName)" class="view-profile-btn">
        View Profile
      </button>
      <button @click="showRemoveConfirm = true" class="remove-btn" title="Remove from squad">
        ✕
      </button>
    </div>

    <!-- Remove Confirmation -->
    <div v-if="showRemoveConfirm" class="remove-confirm-overlay">
      <div class="remove-confirm">
        <p>Remove {{ buddy.playerName }} from your squad?</p>
        <div class="confirm-actions">
          <button @click="confirmRemove" class="confirm-yes">Yes</button>
          <button @click="showRemoveConfirm = false" class="confirm-no">No</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Buddy {
  playerName: string;
  isOnline: boolean;
  lastSeen: string;
  currentServer?: string;
  score: number;
  rank: number;
}

const props = defineProps<{
  buddy: Buddy;
}>();

const emit = defineEmits<{
  viewProfile: [playerName: string];
  remove: [playerName: string];
}>();

const showRemoveConfirm = ref(false);

const confirmRemove = () => {
  emit('remove', props.buddy.playerName);
  showRemoveConfirm.value = false;
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

const formatLastSeen = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  }
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};
</script>

<style scoped>
.buddy-card {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.buddy-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--color-accent-rgb), 0.3);
}

.buddy-card.online {
  border-left: 4px solid #22c55e;
}

.buddy-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.buddy-avatar {
  position: relative;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 1.125rem;
  font-weight: 700;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background-color: #22c55e;
  border: 2px solid var(--color-card-bg);
  border-radius: 50%;
}

.buddy-info {
  flex: 1;
  min-width: 0;
}

.buddy-name {
  color: var(--color-text);
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.buddy-status {
  margin: 0;
}

.status {
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.status.online {
  color: #22c55e;
  font-weight: 500;
}

.status.offline {
  color: var(--color-text-secondary);
}

.buddy-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background-color: rgba(var(--color-accent-rgb), 0.05);
  border-radius: 6px;
  border: 1px solid rgba(var(--color-border-rgb), 0.5);
}

.stat-value {
  display: block;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 1rem;
}

.stat-label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.buddy-actions {
  display: flex;
  gap: 8px;
}

.view-profile-btn {
  flex: 1;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.view-profile-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(var(--color-accent-rgb), 0.3);
}

.remove-btn {
  width: 32px;
  height: 32px;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.remove-btn:hover {
  background-color: rgba(239, 68, 68, 0.2);
}

/* Remove Confirmation Overlay */
.remove-confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.remove-confirm {
  background-color: var(--color-card-bg);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--color-border);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.remove-confirm p {
  color: var(--color-text);
  margin: 0 0 16px 0;
  font-size: 0.9rem;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.confirm-yes,
.confirm-no {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.confirm-yes {
  background-color: #ef4444;
  color: white;
}

.confirm-yes:hover {
  background-color: #dc2626;
}

.confirm-no {
  background-color: var(--color-card-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.confirm-no:hover {
  background-color: var(--color-card-bg-hover);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .buddy-card {
    padding: 14px;
  }
  
  .buddy-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .buddy-actions {
    flex-direction: column;
  }
  
  .remove-btn {
    width: 100%;
    height: 36px;
  }
}
</style>