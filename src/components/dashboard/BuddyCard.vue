<template>
  <div
    class="player-name-card"
    :class="{ 'online': buddy.player.isOnline }"
  >
    <div class="player-row">
      <div class="player-info">
        <div class="player-avatar">
          <span class="avatar-letter">{{ buddy.buddyPlayerName[0].toUpperCase() }}</span>
          <div
            v-if="buddy.player.isOnline"
            class="online-indicator"
          />
        </div>
        <div class="player-details">
          <div class="player-name">
            <router-link
              :to="`/players/${buddy.buddyPlayerName}`"
              class="player-name-link"
            >
              {{ buddy.buddyPlayerName }}
            </router-link>
          </div>
          <div class="player-status">
            <span
              v-if="buddy.player.isOnline && buddy.player.currentServer"
              class="status-info"
            >
              🎮 <router-link
                :to="`/servers/${encodeURIComponent(buddy.player.currentServer)}`"
                class="server-link"
              >{{ buddy.player.currentServer }}</router-link>
              <span
                v-if="buddy.player.currentMap"
                class="map-info"
              >• {{ buddy.player.currentMap }}</span>
            </span>
            <span
              v-else-if="buddy.player.isOnline"
              class="status-info online"
            >
              🟢 Online
            </span>
            <span
              v-else
              class="status-info offline"
            >
              Last seen {{ formatLastSeen(buddy.player.lastSeenIso) }}
            </span>
            
            <!-- Current session stats inline -->
            <div
              v-if="buddy.player.isOnline && hasSessionStats"
              class="session-stats"
            >
              <span
                v-if="buddy.player.currentSessionScore !== undefined"
                class="stat-score"
              >
                {{ formatScore(buddy.player.currentSessionScore) }}
              </span>
              <span
                v-if="buddy.player.currentSessionKills !== undefined && buddy.player.currentSessionDeaths !== undefined"
                class="stat-kd"
              >
                (<span class="kills">{{ buddy.player.currentSessionKills }}</span>/<span class="deaths">{{ buddy.player.currentSessionDeaths }}</span>)
              </span>
            </div>
          </div>
        </div>
      </div>
      <button
        class="remove-btn"
        title="Remove from squad"
        @click="$emit('remove', buddy.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

const emit = defineEmits<{
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

const hasSessionStats = computed(() => {
  return props.buddy.player?.currentSessionScore !== undefined ||
         props.buddy.player?.currentSessionKills !== undefined ||
         props.buddy.player?.currentSessionDeaths !== undefined;
});
</script>

<style scoped>
.player-name-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.player-name-card:hover {
  border-color: rgba(var(--color-accent-rgb), 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-name-card.online {
  border-left: 3px solid #22c55e;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.player-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 0.85rem;
  font-weight: 700;
}

.online-indicator {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  background-color: #22c55e;
  border: 2px solid var(--color-card-bg);
  border-radius: 50%;
}

.player-details {
  flex: 1;
  min-width: 0;
}

.player-name {
  margin: 0 0 2px 0;
  font-size: 0.9rem;
}

.player-name-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.player-name-link:hover {
  color: var(--color-accent);
}

.player-status {
  font-size: 0.75rem;
  line-height: 1.3;
}

.status-info {
  display: block;
  margin-bottom: 2px;
}

.status-info.online {
  color: #22c55e;
  font-weight: 500;
}

.status-info.offline {
  color: var(--color-text-secondary);
}

.server-link {
  color: #22c55e;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.server-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.map-info {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.session-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 0.7rem;
}

.stat-score {
  color: var(--color-text);
  font-weight: 600;
}

.stat-kd {
  font-weight: 600;
  color: var(--color-text);
}

.stat-kd .kills {
  color: #4caf50;
}

.stat-kd .deaths {
  color: #f44336;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 0.9rem;
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
  .player-name-card {
    padding: 10px;
  }
  
  .player-avatar {
    width: 28px;
    height: 28px;
  }
  
  .avatar-letter {
    font-size: 0.8rem;
  }
  
  .player-name {
    font-size: 0.85rem;
  }
  
  .player-status {
    font-size: 0.7rem;
  }
  
  .remove-btn {
    width: 20px;
    height: 20px;
    font-size: 0.8rem;
  }
}
</style>