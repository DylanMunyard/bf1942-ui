<template>
  <div class="favorite-server-card" @click="$emit('join', server)">
    <div class="server-row">
      <div class="server-info">
        <router-link :to="`/servers/${encodeURIComponent(server.serverName)}`" class="server-name-link" @click.stop>
          <span class="server-name">{{ server.serverName }}</span>
        </router-link>
        <div class="server-details">
          <span v-if="server.currentMap" class="current-map">{{ server.currentMap }}</span>
          <span v-else class="idle-text">Awaiting Orders</span>
        </div>
      </div>
      <div class="server-stats">
        <div class="player-count-badge" :class="getStatusClass()">
          <span class="count">{{ server.activeSessions }}</span>
          <span class="max">/64</span>
        </div>
        <button @click.stop="$emit('remove', server.id)" class="remove-btn" title="Remove from favorites">
          ❤️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface FavoriteServer {
  id: number;
  serverGuid: string;
  serverName: string;
  createdAt: string;
  activeSessions: number;
  currentMap?: string;
}

const props = defineProps<{
  server: FavoriteServer;
}>();

defineEmits<{
  join: [server: FavoriteServer];
  remove: [serverId: number];
}>();

const getStatusClass = () => {
  if (props.server.activeSessions === 0) return 'empty';
  if (props.server.activeSessions >= 64) return 'full';
  if (props.server.activeSessions >= 48) return 'hot';
  if (props.server.activeSessions >= 32) return 'active';
  return 'low';
};
</script>

<style scoped>
.favorite-server-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.favorite-server-card:hover {
  border-color: rgba(var(--color-accent-rgb), 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.server-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.server-info {
  flex: 1;
  min-width: 0;
}

.server-name-link {
  text-decoration: none;
  display: block;
  margin-bottom: 2px;
}

.server-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.server-name-link:hover .server-name {
  color: var(--color-accent);
}

.server-details {
  display: flex;
  align-items: center;
  gap: 4px;
}

.current-map {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.idle-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.server-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.player-count-badge {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 45px;
  justify-content: center;
}

.player-count-badge.empty {
  background-color: rgba(107, 114, 128, 0.2);
  color: var(--color-text-secondary);
}

.player-count-badge.low {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.player-count-badge.active {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.player-count-badge.hot {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.player-count-badge.full {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.count {
  font-size: 0.8rem;
}

.max {
  font-size: 0.7rem;
  opacity: 0.7;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.remove-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transform: scale(1.1);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .favorite-server-card {
    padding: 10px;
  }
  
  .server-name {
    font-size: 0.85rem;
  }
  
  .current-map, .idle-text {
    font-size: 0.7rem;
  }
  
  .player-count-badge {
    padding: 3px 6px;
    min-width: 40px;
  }
  
  .remove-btn {
    width: 20px;
    height: 20px;
    font-size: 0.9rem;
  }
}
</style>