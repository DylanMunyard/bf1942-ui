<template>
  <div
    class="hacker-card"
    :class="{ 'is-online': playerName.player?.isOnline }"
  >
    <!-- Online indicator bar -->
    <div v-if="playerName.player?.isOnline" class="online-bar" />

    <div class="card-content">
      <div class="card-main">
        <!-- Avatar -->
        <div class="avatar-container">
          <div class="avatar">
            <span class="avatar-text">{{ playerName.playerName[0].toUpperCase() }}</span>
          </div>
          <div v-if="playerName.player?.isOnline" class="online-indicator">
            <div class="online-pulse" />
          </div>
        </div>

        <!-- Player Details -->
        <div class="player-info">
          <router-link
            :to="`/players/${playerName.playerName}`"
            class="player-name"
          >
            {{ playerName.playerName }}
          </router-link>

          <!-- Status -->
          <div class="player-status">
            <div
              v-if="playerName.player?.isOnline && playerName.player.currentServer"
              class="status-online"
            >
              <span class="status-icon">&gt;</span>
              <router-link
                :to="`/servers/${encodeURIComponent(playerName.player.currentServer)}`"
                class="server-link"
              >
                {{ truncateServerName(playerName.player.currentServer) }}
              </router-link>
              <span v-if="playerName.player.currentMap" class="map-name">
                :: {{ playerName.player.currentMap }}
              </span>
            </div>
            <div v-else-if="playerName.player?.isOnline" class="status-online">
              <span class="status-icon">&gt;</span>
              <span class="status-text">CONNECTED</span>
            </div>
            <div v-else class="status-offline">
              <span class="status-icon">#</span>
              <span class="status-text">{{ formatLastSeen(playerName.player.lastSeenIso) }}</span>
            </div>

            <!-- Session Stats -->
            <div v-if="playerName.player?.isOnline && hasSessionStats" class="session-stats">
              <span v-if="playerName.player.currentSessionScore !== undefined" class="stat-badge stat-score">
                SCR:{{ formatScore(playerName.player.currentSessionScore) }}
              </span>
              <span
                v-if="playerName.player.currentSessionKills !== undefined && playerName.player.currentSessionDeaths !== undefined"
                class="stat-badge stat-kd"
              >
                K:<span class="kills">{{ playerName.player.currentSessionKills }}</span>/D:<span class="deaths">{{ playerName.player.currentSessionDeaths }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Remove Button -->
      <button
        class="btn-remove"
        title="Remove player"
        @click="$emit('remove', playerName.id)"
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

interface PlayerName {
  id: number;
  playerName: string;
  createdAt: string;
  player: Player;
}

const props = defineProps<{
  playerName: PlayerName;
}>();

defineEmits<{
  viewDetails: [playerName: string];
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
  return props.playerName.player?.currentSessionScore !== undefined ||
         props.playerName.player?.currentSessionKills !== undefined ||
         props.playerName.player?.currentSessionDeaths !== undefined;
});
</script>

<style scoped>
.hacker-card {
  --card-accent: #00fff2;
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
  box-shadow: 0 0 20px rgba(0, 255, 242, 0.15);
}

.hacker-card.is-online {
  --card-accent: #39ff14;
}

.online-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--card-accent);
  box-shadow: 0 0 10px var(--card-accent);
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
  background: linear-gradient(135deg, rgba(0, 255, 242, 0.2) 0%, rgba(0, 255, 242, 0.05) 100%);
  border: 1px solid rgba(0, 255, 242, 0.4);
  border-radius: 4px;
}

.avatar-text {
  font-size: 1rem;
  font-weight: 700;
  color: #00fff2;
  text-shadow: 0 0 10px rgba(0, 255, 242, 0.5);
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
  color: #00fff2;
  text-shadow: 0 0 10px rgba(0, 255, 242, 0.5);
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
  color: #00fff2;
  text-shadow: 0 0 8px rgba(0, 255, 242, 0.5);
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
  background: rgba(0, 255, 242, 0.15);
  color: #00fff2;
  border: 1px solid rgba(0, 255, 242, 0.3);
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
