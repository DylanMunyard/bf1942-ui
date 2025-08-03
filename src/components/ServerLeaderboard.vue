<template>
  <div class="server-leaderboard">
    <!-- Desktop Layout -->
    <div
      v-if="!isMobile"
      class="desktop-layout"
    >
      <div class="players-header">
        <div class="header-rank">
          #
        </div>
        <div class="header-player">
          Player
        </div>
        <div class="header-score">
          {{ scoreLabel }}
        </div>
        <div class="header-kd">
          K/D
        </div>
      </div>
      
      <div class="players-list">
        <div
          v-for="player in playersWithRank"
          :key="`${player.playerName}-${props.timePeriod}`"
          class="player-row"
          :class="{ 
            'top-player': player.rank === 1
          }"
        >
          <div class="player-rank">
            <span
              v-if="player.rank === 1"
              class="rank-medal"
            >🥇</span>
            <span
              v-else-if="player.rank === 2"
              class="rank-medal"
            >🥈</span>
            <span
              v-else-if="player.rank === 3"
              class="rank-medal"
            >🥉</span>
            <span
              v-else
              class="rank-number"
            >{{ player.rank }}</span>
          </div>
          <div class="player-name">
            <router-link
              :to="`/players/${encodeURIComponent(player.playerName)}`"
              class="player-link"
            >
              <PlayerName
                :name="player.playerName"
                :source="source"
              />
            </router-link>
          </div>
          <div class="player-score">
            {{ player.score.toLocaleString() }}
          </div>
          <div class="player-kd">
            <span class="kills">{{ player.kills }}</span>
            <span class="separator">/</span>
            <span class="deaths">{{ player.deaths }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div
      v-else
      class="mobile-layout"
    >
      <div class="players-header">
        <div class="header-rank">
          #
        </div>
        <div class="header-player">
          Player
        </div>
        <div class="header-score">
          {{ scoreLabel }}
        </div>
        <div class="header-kd">
          K/D
        </div>
      </div>
      
      <div class="players-list">
        <div
          v-for="player in playersWithRank"
          :key="`${player.playerName}-${props.timePeriod}`"
          class="player-row"
          :class="{ 
            'top-player': player.rank === 1
          }"
        >
          <div class="player-rank">
            <span
              v-if="player.rank === 1"
              class="rank-medal"
            >🥇</span>
            <span
              v-else-if="player.rank === 2"
              class="rank-medal"
            >🥈</span>
            <span
              v-else-if="player.rank === 3"
              class="rank-medal"
            >🥉</span>
            <span
              v-else
              class="rank-number"
            >{{ player.rank }}</span>
          </div>
          <div class="player-name">
            <router-link
              :to="`/players/${encodeURIComponent(player.playerName)}`"
              class="player-link"
            >
              <PlayerName
                :name="player.playerName"
                :source="source"
              />
            </router-link>
          </div>
          <div class="player-score">
            {{ player.score.toLocaleString() }}
          </div>
          <div class="player-kd">
            <span class="kills">{{ player.kills }}</span>
            <span class="separator">/</span>
            <span class="deaths">{{ player.deaths }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import PlayerName from './PlayerName.vue';

interface Player {
  name?: string;
  playerName?: string;
  score: number;
  kills: number;
  deaths: number;
}

interface PlayerWithRank extends Player {
  rank: number;
  playerName: string;
}

interface Props {
  players: Player[];
  source?: string;
  scoreLabel?: string;
  timePeriod?: 'week' | 'month';
}

const props = withDefaults(defineProps<Props>(), {
  source: 'server-leaderboard',
  scoreLabel: 'Score',
  timePeriod: 'week'
});

const isMobile = ref(false);

// Check if mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Sort players by score and assign ranks
const playersWithRank = computed(() => {
  if (!props.players.length) return [];
  
  const sortedPlayers = [...props.players].sort((a, b) => b.score - a.score);
  return sortedPlayers.map((player, index): PlayerWithRank => ({
    ...player,
    rank: index + 1,
    playerName: player.playerName || player.name || 'Unknown'
  }));
});

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.server-leaderboard {
  width: 100%;
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
}

/* Desktop Layout */
.desktop-layout {
  display: block;
}

.players-header {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px;
  gap: 10px;
  padding: 12px 15px;
  background: var(--color-background-mute);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.players-list {
  overflow-y: auto;
}

.player-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-border);
}

.player-row:hover {
  background: var(--color-background-soft);
}

.player-row.top-player {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.player-rank {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank-medal {
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.rank-number {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-background-mute);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-name {
  font-weight: 500;
  display: flex;
  align-items: center;
}

.player-link {
  color: var(--color-primary);
  text-decoration: none;
}

.player-link:hover {
  text-decoration: underline;
}

.player-score {
  text-align: center;
  font-weight: 500;
}

.player-kd {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.kills {
  color: #4caf50;
  font-weight: 600;
}

.separator {
  color: var(--color-text-muted);
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

/* Mobile Layout */
.mobile-layout {
  display: none;
}

.mobile-layout .players-header {
  display: grid;
  grid-template-columns: 30px 1fr 60px 50px;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.75rem;
}

.mobile-layout .player-row {
  display: grid;
  grid-template-columns: 30px 1fr 60px 50px;
  gap: 8px;
  padding: 10px 12px;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .desktop-layout {
    display: none;
  }
  
  .mobile-layout {
    display: block;
  }
}

@media (max-width: 480px) {
  .mobile-layout .players-header {
    grid-template-columns: 25px 1fr 50px 45px;
    gap: 6px;
    padding: 6px 8px;
    font-size: 0.7rem;
  }

  .mobile-layout .player-row {
    grid-template-columns: 25px 1fr 50px 45px;
    gap: 6px;
    padding: 8px;
    font-size: 0.8rem;
  }

  .rank-medal {
    font-size: 0.9rem;
  }

  .rank-number {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
  }
}

.kdr-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

@media (max-width: 768px) {
  .kdr-icon {
    width: 20px;
    height: 20px;
    margin-right: 2px;
  }
}

@media (max-width: 480px) {
  .kdr-icon {
    width: 18px;
    height: 18px;
    margin-right: 1px;
  }
}
</style> 