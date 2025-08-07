<template>
  <div class="favorite-server-card" @click="$emit('join', server)">
    <div class="server-row">
      <div class="server-info">
        <router-link :to="`/servers/${encodeURIComponent(server.serverName)}`" class="server-name-link" @click.stop>
          <span class="server-name">{{ server.serverName }}</span>
        </router-link>
        <div class="server-details">
          <span v-if="server.currentMap" class="current-map">{{ server.currentMap }}</span>
          <div class="player-count-badge" :class="getStatusClass()">
            <template v-if="server.currentMap">
              <span class="count">{{ server.activeSessions }}</span>
              <span class="max">/{{ server.maxPlayers }}</span>
            </template>
            <span v-else class="offline-text">OFFLINE</span>
          </div>
        </div>
      </div>
      <div class="server-stats">
        <a 
          v-if="server.joinLink" 
          :href="server.joinLink" 
          @click.stop 
          class="join-btn" 
          title="Join Server"
        >
          🚀
        </a>
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
  maxPlayers: number;
  joinLink?: string;
}

const props = defineProps<{
  server: FavoriteServer;
}>();

defineEmits<{
  join: [server: FavoriteServer];
  remove: [serverId: number];
}>();

const getStatusClass = () => {
  // If no current map, server is offline
  if (!props.server.currentMap) return 'offline';
  
  const maxPlayers = props.server.maxPlayers;
  const sessions = props.server.activeSessions;
  
  // Server is online, use green-based colors for online servers with players
  if (sessions === 0) return 'online-empty';
  if (sessions >= maxPlayers) return 'online-full';
  if (sessions >= maxPlayers * 0.75) return 'online-hot';
  if (sessions >= maxPlayers * 0.5) return 'online-active';
  return 'online-low';
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
  margin-right: 12px;
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
  gap: 8px;
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
  min-width: fit-content;
}

.player-count-badge {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 50px;
  justify-content: center;
  white-space: nowrap;
}

/* Offline server - red styling */
.player-count-badge.offline {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.offline-text {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Online server with no players - light green */
.player-count-badge.online-empty {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

/* Online server with low players - medium green */
.player-count-badge.online-low {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

/* Online server with active players - bright green */
.player-count-badge.online-active {
  background-color: rgba(34, 197, 94, 0.3);
  color: #15803d;
}

/* Online server with hot activity - vibrant green */
.player-count-badge.online-hot {
  background-color: rgba(34, 197, 94, 0.4);
  color: #166534;
}

/* Online server that's full - dark green */
.player-count-badge.online-full {
  background-color: rgba(34, 197, 94, 0.5);
  color: #14532d;
}

.count {
  font-size: 0.8rem;
}

.max {
  font-size: 0.7rem;
  opacity: 0.7;
}

.join-btn {
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
  text-decoration: none;
}

.join-btn:hover {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  transform: scale(1.1);
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
  
  .join-btn,
  .remove-btn {
    width: 20px;
    height: 20px;
    font-size: 0.9rem;
  }
}
</style>