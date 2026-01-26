<template>
  <div
    class="hacker-card"
    :class="{ 'is-online': buddy.player.isOnline }"
  >
    <!-- Online indicator bar -->
    <div v-if="buddy.player.isOnline" class="online-bar" />

    <div class="card-content">
      <div class="card-main">
        <!-- Avatar -->
        <div class="avatar-container">
          <div class="avatar">
            <span class="avatar-text">{{ buddy.buddyPlayerName[0].toUpperCase() }}</span>
          </div>
          <div v-if="buddy.player.isOnline" class="online-indicator">
            <div class="online-pulse" />
          </div>
        </div>

        <!-- Player Details -->
        <div class="player-info">
          <router-link
            :to="`/players/${buddy.buddyPlayerName}`"
            class="player-name"
          >
            {{ buddy.buddyPlayerName }}
          </router-link>

          <!-- Status -->
          <div class="player-status">
            <div
              v-if="buddy.player.isOnline && buddy.player.currentServer"
              class="status-online"
            >
              <span class="status-icon">&gt;</span>
              <router-link
                :to="`/servers/${encodeURIComponent(buddy.player.currentServer)}`"
                class="server-link"
              >
                {{ truncateServerName(buddy.player.currentServer) }}
              </router-link>
              <span v-if="buddy.player.currentMap" class="map-name">
                :: {{ buddy.player.currentMap }}
              </span>
            </div>
            <div v-else-if="buddy.player.isOnline" class="status-online">
              <span class="status-icon">&gt;</span>
              <span class="status-text">CONNECTED</span>
            </div>
            <div v-else class="status-offline">
              <span class="status-icon">#</span>
              <span class="status-text">{{ formatLastSeen(buddy.player.lastSeenIso) }}</span>
            </div>

            <!-- Session Stats -->
            <div v-if="buddy.player.isOnline && hasSessionStats" class="session-stats">
              <span v-if="buddy.player.currentSessionScore !== undefined" class="stat-badge stat-score">
                SCR:{{ formatScore(buddy.player.currentSessionScore) }}
              </span>
              <span
                v-if="buddy.player.currentSessionKills !== undefined && buddy.player.currentSessionDeaths !== undefined"
                class="stat-badge stat-kd"
              >
                K:<span class="kills">{{ buddy.player.currentSessionKills }}</span>/D:<span class="deaths">{{ buddy.player.currentSessionDeaths }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Remove Button -->
      <button
        class="btn-remove"
        title="Remove from squad"
        @click="$emit('remove', buddy.id)"
      >
        <span class="btn-icon">[x]</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatLastSeen } from '@/utils/timeUtils';

interface Player {
  name: string;
  firstSeen: string;
  lastSeen: string;
  totalPlayTimeMinutes: number;
  aiBot: boolean;
  isOnline: boolean;
  lastSeenIso: string;
  currentServer: string;
  currentMap?: string;
  currentSessionScore?: number;
  currentSessionKills?: number;
  currentSessionDeaths?: number;
}

interface Buddy {
  id: number;
  buddyPlayerName: string;
  createdAt: string;
  player: Player;
}

const props = defineProps<{
  buddy: Buddy;
}>();

defineEmits<{
  viewProfile: [playerName: string];
  remove: [id: number];
}>();


const formatScore = (score: number): string => {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toLocaleString();
};

const truncateServerName = (serverName: string): string => {
  if (serverName.length > 25) {
    return `${serverName.substring(0, 25)}...`;
  }
  return serverName;
};

const hasSessionStats = computed(() => {
  return props.buddy.player?.currentSessionScore !== undefined ||
         props.buddy.player?.currentSessionKills !== undefined ||
         props.buddy.player?.currentSessionDeaths !== undefined;
});
</script>

<style scoped>
.hacker-card {
  --card-accent: #ff00ff;
  position: relative;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.hacker-card:hover {
  border-color: var(--card-accent);
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.15);
}

.hacker-card.is-online {
  --card-accent: #39ff14;
}

.hacker-card.is-online:hover {
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.15);
}

.online-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #39ff14;
  box-shadow: 0 0 10px #39ff14;
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

/* Avatar */
.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 0, 255, 0.2) 0%, rgba(255, 0, 255, 0.05) 100%);
  border: 1px solid rgba(255, 0, 255, 0.4);
  border-radius: 4px;
}

.avatar-text {
  font-size: 1rem;
  font-weight: 700;
  color: #ff00ff;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.online-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #0d1117;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-pulse {
  width: 8px;
  height: 8px;
  background: #39ff14;
  border-radius: 50%;
  box-shadow: 0 0 8px #39ff14;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.9); }
}

/* Player Info */
.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
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

.player-name:hover {
  color: #ff00ff;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.player-status {
  margin-top: 0.375rem;
  font-size: 0.7rem;
}

.status-online, .status-offline {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.status-icon {
  color: #8b949e;
  font-weight: bold;
}

.status-online .status-icon {
  color: #39ff14;
}

.status-text {
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-online .status-text {
  color: #39ff14;
}

.server-link {
  color: #39ff14;
  text-decoration: none;
  transition: all 0.2s ease;
}

.server-link:hover {
  color: #ff00ff;
  text-shadow: 0 0 8px rgba(255, 0, 255, 0.5);
}

.map-name {
  color: #6e7681;
}

/* Session Stats */
.session-stats {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.375rem;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-score {
  background: rgba(255, 0, 255, 0.15);
  color: #ff00ff;
  border: 1px solid rgba(255, 0, 255, 0.3);
}

.stat-kd {
  background: rgba(139, 148, 158, 0.1);
  color: #8b949e;
  border: 1px solid rgba(139, 148, 158, 0.2);
}

.stat-kd .kills {
  color: #39ff14;
}

.stat-kd .deaths {
  color: #ff3131;
}

/* Remove Button */
.btn-remove {
  flex-shrink: 0;
  padding: 0.375rem 0.5rem;
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 4px;
  color: #8b949e;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 0.75rem;
}

.btn-remove:hover {
  border-color: #ff3131;
  color: #ff3131;
  background: rgba(255, 49, 49, 0.1);
}

.btn-icon {
  font-weight: bold;
}

/* Mobile */
@media (max-width: 480px) {
  .card-content {
    padding: 0.75rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
  }

  .avatar-text {
    font-size: 0.875rem;
  }

  .player-name {
    font-size: 0.8rem;
  }

  .player-status {
    font-size: 0.65rem;
  }
}
</style>
