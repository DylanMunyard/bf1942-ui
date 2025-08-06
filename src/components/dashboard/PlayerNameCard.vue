<template>
  <div class="player-name-card" :class="{ 'online': playerName.player?.isOnline }">
    <div class="card-header">
      <div class="player-info">
        <div class="player-avatar">
          <span class="avatar-letter">{{ playerName.playerName[0].toUpperCase() }}</span>
          <div v-if="playerName.player?.isOnline" class="online-indicator"></div>
        </div>
        <div class="player-details">
          <h3 class="player-name">{{ playerName.playerName }}</h3>
          <div class="player-status">
            <span v-if="playerName.player?.isOnline && playerName.player.currentServer" class="status online">
              🎮 <router-link :to="`/servers/${encodeURIComponent(playerName.player.currentServer)}`" class="server-link">{{ playerName.player.currentServer }}</router-link>
            </span>
            <span v-else-if="playerName.player?.isOnline" class="status online">
              🟢 Online
            </span>
            <span v-else class="status offline">
              Last seen {{ formatLastSeen(playerName.player.lastSeenIso) }}
            </span>
            
            <!-- Current map info for online players -->
            <div v-if="playerName.player?.isOnline && playerName.player.currentMap" class="current-map">
              🗺️ {{ playerName.player.currentMap }}
            </div>
            
            <!-- Current session stats inline -->
            <div v-if="playerName.player?.isOnline && hasSessionStats" class="session-stats">
              <span class="stat-score" v-if="playerName.player.currentSessionScore !== undefined">
                {{ formatScore(playerName.player.currentSessionScore) }}
              </span>
              <span class="stat-kd" v-if="playerName.player.currentSessionKills !== undefined && playerName.player.currentSessionDeaths !== undefined">
                (<span class="kills">{{ playerName.player.currentSessionKills }}</span> / <span class="deaths">{{ playerName.player.currentSessionDeaths }}</span>)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <div class="card-footer">
      <button @click="$emit('viewDetails', playerName.playerName)" class="view-details-btn">
        View Stats
        <span class="arrow">→</span>
      </button>
      <button @click="$emit('remove', playerName.id)" class="remove-btn" title="Remove player">
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
  return props.playerName.player?.currentSessionScore !== undefined ||
         props.playerName.player?.currentSessionKills !== undefined ||
         props.playerName.player?.currentSessionDeaths !== undefined;
});
</script>

<style scoped>
.player-name-card {
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(var(--color-accent-rgb), 0.02) 100%);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.player-name-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--color-accent-rgb), 0.3);
}

.card-header {
  margin-bottom: 16px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.avatar-letter {
  font-size: 1rem;
  font-weight: 700;
}

.player-details {
  flex: 1;
}

.player-name {
  color: var(--color-text);
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
}

.added-date {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.status {
  font-size: 0.75rem;
}

.status.online {
  color: #22c55e;
  font-weight: 500;
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

.status.offline {
  color: var(--color-text-secondary);
}

.current-map {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 2px;
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

.player-name-card.online {
  border-left: 4px solid #22c55e;
}

.session-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.stat-score {
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-kd {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
}

.stat-kd .kills {
  color: #4caf50;
}

.stat-kd .deaths {
  color: #f44336;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.view-details-btn {
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.view-details-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.3);
}

.remove-btn {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.arrow {
  transition: transform 0.2s ease;
}

.view-details-btn:hover .arrow {
  transform: translateX(2px);
}
</style>