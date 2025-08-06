<template>
  <div class="favorite-server-card" @click="$emit('join', server)">
    <div class="server-status">
      <div class="status-indicator" :class="{ 'active': server.activeSessions > 0 }">
        <div class="status-pulse"></div>
        <span class="player-count">{{ server.activeSessions }}</span>
      </div>
      <button @click.stop="$emit('remove', server.id)" class="remove-btn" title="Remove from favorites">
        ❤️
      </button>
    </div>
    
    <div class="server-content">
      <router-link :to="`/servers/${encodeURIComponent(server.serverName)}`" class="server-name-link" @click.stop>
        <div class="server-name">{{ server.serverName }}</div>
      </router-link>
      <div v-if="server.currentMap" class="current-battle">
        <span class="battle-icon">⚔️</span>
        <span class="map-name">{{ server.currentMap }}</span>
      </div>
      <div v-else class="server-idle">
        <span class="idle-icon">💤</span>
        <span class="idle-text">Awaiting Orders</span>
      </div>
    </div>
    
    <div class="join-indicator">
      <span class="join-text">{{ joinText }}</span>
      <span class="join-arrow">→</span>
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

const joinText = computed(() => {
  if (props.server.activeSessions === 0) return 'EMPTY';
  if (props.server.activeSessions >= 64) return 'FULL';
  if (props.server.activeSessions >= 48) return 'HOT';
  return 'JOIN';
});
</script>

<style scoped>
.favorite-server-card {
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(var(--color-accent-rgb), 0.03) 100%);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.favorite-server-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #22c55e 0%, var(--color-accent) 50%, #f59e0b 100%);
  opacity: 0.7;
}

.favorite-server-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(var(--color-accent-rgb), 0.4);
}

.favorite-server-card:hover::before {
  opacity: 1;
  height: 6px;
}

.server-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: rgba(107, 114, 128, 0.1);
  border-radius: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background-color: rgba(34, 197, 94, 0.15);
}

.status-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #6b7280;
  transition: all 0.3s ease;
}

.status-indicator.active .status-pulse {
  background-color: #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.player-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  min-width: 20px;
  text-align: center;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transform: scale(1.1);
}

.server-content {
  flex: 1;
  margin-bottom: 8px;
}

.server-name-link {
  text-decoration: none;
  display: block;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  border-radius: 6px;
  padding: 2px 0;
}

.server-name-link:hover {
  background-color: rgba(var(--color-accent-rgb), 0.1);
  padding: 2px 6px;
}

.server-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.server-name-link:hover .server-name {
  color: var(--color-accent);
}

.current-battle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-radius: 8px;
  border-left: 3px solid #22c55e;
}

.battle-icon {
  font-size: 1rem;
}

.map-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.server-idle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: rgba(107, 114, 128, 0.1);
  border-radius: 8px;
  border-left: 3px solid #6b7280;
}

.idle-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.idle-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.join-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.1) 0%, rgba(var(--color-accent-rgb), 0.05) 100%);
  border-radius: 8px;
  margin-top: auto;
}

.join-text {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-accent);
}

.join-arrow {
  font-size: 1.2rem;
  color: var(--color-accent);
  transition: transform 0.2s ease;
}

.favorite-server-card:hover .join-arrow {
  transform: translateX(4px);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .favorite-server-card {
    padding: 16px;
    min-height: 100px;
  }
  
  .server-name {
    font-size: 1rem;
  }
  
  .status-indicator {
    padding: 4px 8px;
  }
  
  .player-count {
    font-size: 1rem;
  }
}
</style>