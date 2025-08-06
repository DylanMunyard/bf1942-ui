<template>
  <div class="favorite-server-card" :class="{ 'online': server.isOnline, 'full': isFull }">
    <div class="server-header">
      <div class="server-info">
        <h3 class="server-name">{{ server.name }}</h3>
        <div class="server-details">
          <span class="game-mode">{{ server.gameMode }}</span>
          <span class="map-name">{{ server.currentMap }}</span>
        </div>
      </div>
      <div class="status-indicator" :class="{ 'online': server.isOnline, 'offline': !server.isOnline }">
        <span class="status-dot"></span>
        <span class="status-text">{{ server.isOnline ? 'Online' : 'Offline' }}</span>
      </div>
    </div>

    <div class="server-stats">
      <div class="player-count-section">
        <div class="player-count">
          <span class="count-current">{{ server.playerCount }}</span>
          <span class="count-separator">/</span>
          <span class="count-max">{{ server.maxPlayers }}</span>
        </div>
        <div class="player-bar">
          <div class="player-bar-fill" :style="{ width: playerPercentage + '%' }"></div>
        </div>
        <span class="player-label">Players</span>
      </div>

      <div class="ping-section">
        <div class="ping-value" :class="pingClass">
          {{ server.ping }}ms
        </div>
        <span class="ping-label">Ping</span>
      </div>
    </div>

    <div class="server-actions">
      <button 
        @click="$emit('join', server)" 
        :disabled="!server.isOnline" 
        class="join-btn"
        :class="{ 'full': isFull }"
      >
        <span class="btn-icon">🎮</span>
        {{ joinButtonText }}
      </button>
      <button @click="$emit('remove', server.id)" class="remove-btn" title="Remove from favorites">
        <span class="btn-icon">❌</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface FavoriteServer {
  id: string;
  name: string;
  gameMode: string;
  currentMap: string;
  playerCount: number;
  maxPlayers: number;
  isOnline: boolean;
  ping: number;
}

const props = defineProps<{
  server: FavoriteServer;
}>();

defineEmits<{
  join: [server: FavoriteServer];
  remove: [serverId: string];
}>();

const playerPercentage = computed(() => {
  return Math.min((props.server.playerCount / props.server.maxPlayers) * 100, 100);
});

const isFull = computed(() => {
  return props.server.playerCount >= props.server.maxPlayers;
});

const pingClass = computed(() => {
  if (props.server.ping <= 50) return 'excellent';
  if (props.server.ping <= 100) return 'good';
  if (props.server.ping <= 150) return 'fair';
  return 'poor';
});

const joinButtonText = computed(() => {
  if (!props.server.isOnline) return 'Offline';
  if (isFull.value) return 'Server Full';
  return 'Join Battle';
});
</script>

<style scoped>
.favorite-server-card {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px;
  transition: all 0.3s ease;
  position: relative;
}

.favorite-server-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--color-accent-rgb), 0.3);
}

.favorite-server-card.online {
  border-left: 4px solid #22c55e;
}

.favorite-server-card.full {
  border-left: 4px solid #f59e0b;
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.server-info {
  flex: 1;
}

.server-name {
  color: var(--color-text);
  margin: 0 0 6px 0;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
}

.server-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.game-mode {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.map-name {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-indicator.online {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-indicator.offline {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.server-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(var(--color-accent-rgb), 0.05);
  border-radius: 8px;
}

.player-count-section {
  flex: 1;
}

.player-count {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 4px;
}

.count-current {
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 700;
}

.count-separator {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.count-max {
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 600;
}

.player-bar {
  width: 100%;
  height: 4px;
  background-color: rgba(var(--color-border-rgb), 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.player-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #fbbf24 70%, #ef4444 100%);
  transition: width 0.3s ease;
}

.player-label,
.ping-label {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ping-section {
  text-align: right;
  margin-left: 16px;
}

.ping-value {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.ping-value.excellent {
  color: #22c55e;
}

.ping-value.good {
  color: #84cc16;
}

.ping-value.fair {
  color: #fbbf24;
}

.ping-value.poor {
  color: #ef4444;
}

.server-actions {
  display: flex;
  gap: 8px;
}

.join-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.3);
}

.join-btn:disabled {
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  cursor: not-allowed;
  opacity: 0.7;
}

.join-btn.full:not(:disabled) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.remove-btn {
  width: 40px;
  height: 40px;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background-color: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1rem;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .server-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .status-indicator {
    align-self: flex-start;
  }
  
  .server-stats {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .ping-section {
    margin-left: 0;
    text-align: center;
  }
  
  .server-actions {
    flex-direction: column;
  }
  
  .remove-btn {
    width: 100%;
    height: 40px;
  }
}
</style>