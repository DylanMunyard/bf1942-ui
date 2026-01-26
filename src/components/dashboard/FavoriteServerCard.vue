<template>
  <div
    class="hacker-card"
    :class="{ 'is-online': server.currentMap }"
    @click="$emit('join', server)"
  >
    <div class="card-content">
      <div class="card-main">
        <!-- Server Icon -->
        <div class="server-icon">
          <span class="icon-text">{::}</span>
          <div v-if="server.currentMap" class="status-led online" />
          <div v-else class="status-led offline" />
        </div>

        <!-- Server Details -->
        <div class="server-info">
          <router-link
            :to="`/servers/${encodeURIComponent(server.serverName)}`"
            class="server-name"
            @click.stop
          >
            {{ server.serverName }}
          </router-link>

          <div class="server-status">
            <div v-if="server.currentMap" class="status-row">
              <span class="map-label">&gt; MAP:</span>
              <span class="map-name">{{ server.currentMap }}</span>
            </div>
            <div v-else class="status-row offline">
              <span class="status-label">// SERVER_OFFLINE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Player Count & Actions -->
      <div class="card-actions">
        <!-- Player Count Badge -->
        <div class="player-count" :class="getStatusClass()">
          <template v-if="server.currentMap">
            <span class="count-current">{{ server.activeSessions }}</span>
            <span class="count-divider">/</span>
            <span class="count-max">{{ server.maxPlayers }}</span>
          </template>
          <span v-else class="status-offline-text">OFF</span>
        </div>

        <!-- Action Buttons -->
        <div class="btn-group">
          <a
            v-if="server.joinLink"
            :href="server.joinLink"
            class="btn-action btn-join"
            title="Join Server"
            @click.stop
          >
            <span>&gt;&gt;</span>
          </a>
          <button
            class="btn-action btn-remove"
            title="Remove from favorites"
            @click.stop="$emit('remove', server.id)"
          >
            <span>[x]</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

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
  if (!props.server.currentMap) return 'status-offline';

  const maxPlayers = props.server.maxPlayers;
  const sessions = props.server.activeSessions;

  if (sessions === 0) return 'status-empty';
  if (sessions >= maxPlayers) return 'status-full';
  if (sessions >= maxPlayers * 0.75) return 'status-high';
  if (sessions >= maxPlayers * 0.5) return 'status-medium';
  return 'status-low';
};
</script>

<style scoped>
.hacker-card {
  --card-accent: #39ff14;
  position: relative;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  cursor: pointer;
}

.hacker-card:hover {
  border-color: var(--card-accent);
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.15);
}

.hacker-card:not(.is-online) {
  --card-accent: #ff3131;
}

.hacker-card:not(.is-online):hover {
  box-shadow: 0 0 20px rgba(255, 49, 49, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
}

.card-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

/* Server Icon */
.server-icon {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(57, 255, 20, 0.15) 0%, rgba(57, 255, 20, 0.05) 100%);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 4px;
}

.hacker-card:not(.is-online) .server-icon {
  background: linear-gradient(135deg, rgba(255, 49, 49, 0.15) 0%, rgba(255, 49, 49, 0.05) 100%);
  border-color: rgba(255, 49, 49, 0.3);
}

.icon-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: #39ff14;
}

.hacker-card:not(.is-online) .icon-text {
  color: #ff3131;
}

.status-led {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #0d1117;
}

.status-led.online {
  background: #39ff14;
  box-shadow: 0 0 8px #39ff14;
  animation: blink 2s infinite;
}

.status-led.offline {
  background: #ff3131;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Server Info */
.server-info {
  flex: 1;
  min-width: 0;
}

.server-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #e6edf3;
  text-decoration: none;
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-name:hover {
  color: #39ff14;
  text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
}

.server-status {
  margin-top: 0.375rem;
  font-size: 0.7rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.map-label {
  color: #39ff14;
  font-weight: bold;
}

.map-name {
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-row.offline .status-label {
  color: #ff3131;
  font-style: italic;
}

/* Card Actions */
.card-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Player Count */
.player-count {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.player-count.status-offline {
  background: rgba(255, 49, 49, 0.15);
  border: 1px solid rgba(255, 49, 49, 0.3);
  color: #ff3131;
}

.player-count.status-empty {
  background: rgba(57, 255, 20, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.2);
  color: #39ff14;
}

.player-count.status-low {
  background: rgba(57, 255, 20, 0.15);
  border: 1px solid rgba(57, 255, 20, 0.3);
  color: #39ff14;
}

.player-count.status-medium {
  background: rgba(57, 255, 20, 0.2);
  border: 1px solid rgba(57, 255, 20, 0.4);
  color: #39ff14;
}

.player-count.status-high {
  background: rgba(0, 255, 242, 0.2);
  border: 1px solid rgba(0, 255, 242, 0.4);
  color: #00fff2;
}

.player-count.status-full {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.4);
  color: #ffd700;
}

.count-current {
  color: inherit;
}

.count-divider {
  opacity: 0.5;
  margin: 0 1px;
}

.count-max {
  opacity: 0.7;
}

.status-offline-text {
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Button Group */
.btn-group {
  display: flex;
  gap: 0.375rem;
}

.btn-action {
  padding: 0.375rem 0.5rem;
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-join {
  color: #39ff14;
  border-color: rgba(57, 255, 20, 0.3);
}

.btn-join:hover {
  background: rgba(57, 255, 20, 0.15);
  border-color: #39ff14;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
}

.btn-remove {
  color: #8b949e;
}

.btn-remove:hover {
  border-color: #ff3131;
  color: #ff3131;
  background: rgba(255, 49, 49, 0.1);
}

/* Mobile */
@media (max-width: 480px) {
  .card-content {
    padding: 0.75rem;
    flex-direction: column;
    align-items: stretch;
  }

  .card-main {
    margin-bottom: 0.5rem;
  }

  .card-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .server-icon {
    width: 32px;
    height: 32px;
  }

  .icon-text {
    font-size: 0.7rem;
  }

  .server-name {
    font-size: 0.8rem;
  }

  .server-status {
    font-size: 0.65rem;
  }
}
</style>
