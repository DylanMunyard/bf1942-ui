<template>
  <div class="olympic-leaderboard">
    <!-- Olympic Podium for Top 3 -->
    <div v-if="topThree.length > 0" class="olympic-podium">
      <div class="podium-container">
        <!-- Second Place (Silver) -->
        <div 
          v-if="topThree[1]" 
          class="podium-position second-place"
          @click="navigateToPlayer(topThree[1].playerName)"
        >
          <div class="podium-player">
            <div class="medal-container">
              <div class="olympic-medal silver">
                <span class="medal-emoji">🥈</span>
              </div>
            </div>
            <div class="player-info">
              <div class="player-name">{{ topThree[1].playerName }}</div>
              <div class="placement-stats">
                <div class="medal-count">
                  <span class="gold-count">🥇{{ topThree[1].firstPlaces }}</span>
                  <span class="silver-count">🥈{{ topThree[1].secondPlaces }}</span>
                  <span class="bronze-count">🥉{{ topThree[1].thirdPlaces }}</span>
                </div>
                <div class="total-points">{{ topThree[1].placementPoints }} pts</div>
              </div>
            </div>
          </div>
          <div class="podium-base silver-base">2</div>
        </div>

        <!-- First Place (Gold) -->
        <div 
          v-if="topThree[0]" 
          class="podium-position first-place"
          @click="navigateToPlayer(topThree[0].playerName)"
        >
          <div class="podium-player">
            <div class="medal-container">
              <div class="olympic-medal gold">
                <span class="medal-emoji">🥇</span>
                <div class="crown">👑</div>
              </div>
            </div>
            <div class="player-info">
              <div class="player-name champion">{{ topThree[0].playerName }}</div>
              <div class="placement-stats">
                <div class="medal-count">
                  <span class="gold-count">🥇{{ topThree[0].firstPlaces }}</span>
                  <span class="silver-count">🥈{{ topThree[0].secondPlaces }}</span>
                  <span class="bronze-count">🥉{{ topThree[0].thirdPlaces }}</span>
                </div>
                <div class="total-points champion-points">{{ topThree[0].placementPoints }} pts</div>
              </div>
            </div>
          </div>
          <div class="podium-base gold-base">1</div>
        </div>

        <!-- Third Place (Bronze) -->
        <div 
          v-if="topThree[2]" 
          class="podium-position third-place"
          @click="navigateToPlayer(topThree[2].playerName)"
        >
          <div class="podium-player">
            <div class="medal-container">
              <div class="olympic-medal bronze">
                <span class="medal-emoji">🥉</span>
              </div>
            </div>
            <div class="player-info">
              <div class="player-name">{{ topThree[2].playerName }}</div>
              <div class="placement-stats">
                <div class="medal-count">
                  <span class="gold-count">🥇{{ topThree[2].firstPlaces }}</span>
                  <span class="silver-count">🥈{{ topThree[2].secondPlaces }}</span>
                  <span class="bronze-count">🥉{{ topThree[2].thirdPlaces }}</span>
                </div>
                <div class="total-points">{{ topThree[2].placementPoints }} pts</div>
              </div>
            </div>
          </div>
          <div class="podium-base bronze-base">3</div>
        </div>
      </div>
    </div>

    <!-- Remaining Players Table -->
    <div v-if="remainingPlayers.length > 0" class="olympic-table">
      <div class="table-header">
        <div class="header-title">
          <span class="olympic-rings">🏅</span>
          <span>Olympic Standings</span>
        </div>
      </div>
      
      <div class="table-content">
        <div class="table-row table-header-row">
          <div class="rank-col">Rank</div>
          <div class="player-col">Player</div>
          <div class="medals-col">Medals</div>
          <div class="points-col">Points</div>
        </div>
        
        <div 
          v-for="player in remainingPlayers" 
          :key="player.playerName"
          class="table-row player-row"
          @click="navigateToPlayer(player.playerName)"
        >
          <div class="rank-col">
            <span class="rank-number">{{ player.rank }}</span>
          </div>
          <div class="player-col">
            <PlayerName 
              :name="player.playerName" 
              :source="source"
            />
          </div>
          <div class="medals-col">
            <div class="medal-breakdown">
              <span class="medal-item gold">🥇{{ player.firstPlaces }}</span>
              <span class="medal-item silver">🥈{{ player.secondPlaces }}</span>
              <span class="medal-item bronze">🥉{{ player.thirdPlaces }}</span>
            </div>
          </div>
          <div class="points-col">
            <span class="points-value">{{ player.placementPoints }}</span>
            <span class="points-label">pts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="players.length === 0" class="empty-state">
      <div class="empty-icon">🏆</div>
      <div class="empty-text">No Olympic standings available</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import PlayerName from './PlayerName.vue';
import type { TopPlacement } from '../services/serverDetailsService';

interface Props {
  players: TopPlacement[];
  source?: string;
}

const props = withDefaults(defineProps<Props>(), {
  source: 'olympic-leaderboard'
});

const router = useRouter();

// Top 3 players for the podium
const topThree = computed(() => {
  return props.players.slice(0, 3);
});

// Remaining players for the table
const remainingPlayers = computed(() => {
  return props.players.slice(3);
});

// Navigate to player profile
const navigateToPlayer = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
};
</script>

<style scoped>
.olympic-leaderboard {
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.1) 0%,    /* Gold */
    rgba(192, 192, 192, 0.1) 25%, /* Silver */
    rgba(205, 127, 50, 0.1) 50%,  /* Bronze */
    rgba(30, 41, 59, 0.4) 100%    /* Dark */
  );
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  backdrop-filter: blur(16px);
}

/* Olympic Podium Styles */
.olympic-podium {
  padding: 2rem 1rem 1rem;
  background: linear-gradient(180deg, 
    rgba(255, 215, 0, 0.05) 0%, 
    transparent 100%
  );
}

.podium-container {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.podium-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.podium-position:hover {
  transform: translateY(-5px);
}

.podium-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
  z-index: 2;
  position: relative;
}

.medal-container {
  margin-bottom: 1rem;
  position: relative;
}

.olympic-medal {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.olympic-medal.gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: 3px solid #FFD700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
}

.olympic-medal.silver {
  background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
  border: 3px solid #C0C0C0;
  box-shadow: 0 0 20px rgba(192, 192, 192, 0.5);
}

.olympic-medal.bronze {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
  border: 3px solid #CD7F32;
  box-shadow: 0 0 20px rgba(205, 127, 50, 0.5);
}

.medal-emoji {
  font-size: 2rem;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
}

.crown {
  position: absolute;
  top: -15px;
  font-size: 1.5rem;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.player-info {
  text-align: center;
  min-width: 120px;
}

.player-name {
  font-weight: bold;
  font-size: 0.9rem;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

.player-name.champion {
  font-size: 1.1rem;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.placement-stats {
  font-size: 0.75rem;
}

.medal-count {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.gold-count, .silver-count, .bronze-count {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.total-points {
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
}

.champion-points {
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* Podium Bases */
.podium-base {
  width: 100px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.gold-base {
  height: 120px;
  background: linear-gradient(180deg, #FFD700, #DAA520);
  border: 2px solid #FFD700;
}

.silver-base {
  height: 90px;
  background: linear-gradient(180deg, #C0C0C0, #A8A8A8);
  border: 2px solid #C0C0C0;
}

.bronze-base {
  height: 70px;
  background: linear-gradient(180deg, #CD7F32, #B8860B);
  border: 2px solid #CD7F32;
}

/* Responsive Podium */
.first-place { order: 2; }
.second-place { order: 1; }
.third-place { order: 3; }

/* Olympic Table Styles */
.olympic-table {
  margin-top: 1rem;
}

.table-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  background: rgba(0, 0, 0, 0.2);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.olympic-rings {
  font-size: 1.3rem;
}

.table-content {
  padding: 0 1.5rem 1.5rem;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 140px 80px;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.table-header-row {
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  margin-bottom: 0.5rem;
}

.player-row {
  cursor: pointer;
}

.player-row:hover {
  background: rgba(255, 215, 0, 0.1);
  transform: translateX(4px);
  border-left: 3px solid #FFD700;
  padding-left: 1rem;
}

.rank-number {
  font-weight: bold;
  color: #FFD700;
  font-size: 1.1rem;
}

.medal-breakdown {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.medal-item {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.points-value {
  font-weight: bold;
  color: #FFD700;
  font-size: 1rem;
}

.points-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  margin-left: 0.25rem;
}

/* Empty State */
.empty-state {
  padding: 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.1rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .podium-container {
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .olympic-medal {
    width: 60px;
    height: 60px;
  }
  
  .medal-emoji {
    font-size: 1.5rem;
  }
  
  .podium-base {
    width: 80px;
  }
  
  .gold-base { height: 100px; }
  .silver-base { height: 75px; }
  .bronze-base { height: 60px; }
  
  .table-row {
    grid-template-columns: 50px 1fr 120px 70px;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }
  
  .medal-breakdown {
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.7rem;
  }
}
</style>
