<template>
  <div class="placement-leaderboard">
    <!-- Placement Podium for Top 3 -->
    <div
      v-if="topThree.length > 0"
      class="placement-podium"
    >
      <div class="podium-container">
        <!-- Second Place (Silver) -->
        <div 
          v-if="topThree[1]" 
          class="podium-position second-place"
          @click="navigateToPlayer(topThree[1].playerName)"
        >
          <div class="podium-player">
            <div class="medal-container">
              <div class="podium-medal silver">
                <span class="medal-emoji">🥈</span>
              </div>
            </div>
            <div class="player-info">
              <div class="player-name">
                {{ topThree[1].playerName }}
              </div>
              <div class="placement-stats">
                <div class="medal-count">
                  <span class="gold-count">🥇{{ topThree[1].firstPlaces }}</span>
                  <span class="silver-count">🥈{{ topThree[1].secondPlaces }}</span>
                  <span class="bronze-count">🥉{{ topThree[1].thirdPlaces }}</span>
                </div>
                <div class="total-points">
                  {{ topThree[1].placementPoints }} pts
                </div>
              </div>
            </div>
          </div>
          <div class="podium-base silver-base">
            2
          </div>
        </div>

        <!-- First Place (Gold) -->
        <div 
          v-if="topThree[0]" 
          class="podium-position first-place"
          @click="navigateToPlayer(topThree[0].playerName)"
        >
          <div class="podium-player">
            <div class="medal-container">
              <div class="podium-medal gold">
                <span class="medal-emoji">🥇</span>
                <div class="crown">
                  👑
                </div>
              </div>
            </div>
            <div class="player-info">
              <div class="player-name champion">
                {{ topThree[0].playerName }}
              </div>
              <div class="placement-stats">
                <div class="medal-count">
                  <span class="gold-count">🥇{{ topThree[0].firstPlaces }}</span>
                  <span class="silver-count">🥈{{ topThree[0].secondPlaces }}</span>
                  <span class="bronze-count">🥉{{ topThree[0].thirdPlaces }}</span>
                </div>
                <div class="total-points champion-points">
                  {{ topThree[0].placementPoints }} pts
                </div>
              </div>
            </div>
          </div>
          <div class="podium-base gold-base">
            1
          </div>
        </div>

        <!-- Third Place (Bronze) -->
        <div 
          v-if="topThree[2]" 
          class="podium-position third-place"
          @click="navigateToPlayer(topThree[2].playerName)"
        >
          <div class="podium-player">
            <div class="medal-container">
              <div class="podium-medal bronze">
                <span class="medal-emoji">🥉</span>
              </div>
            </div>
            <div class="player-info">
              <div class="player-name">
                {{ topThree[2].playerName }}
              </div>
              <div class="placement-stats">
                <div class="medal-count">
                  <span class="gold-count">🥇{{ topThree[2].firstPlaces }}</span>
                  <span class="silver-count">🥈{{ topThree[2].secondPlaces }}</span>
                  <span class="bronze-count">🥉{{ topThree[2].thirdPlaces }}</span>
                </div>
                <div class="total-points">
                  {{ topThree[2].placementPoints }} pts
                </div>
              </div>
            </div>
          </div>
          <div class="podium-base bronze-base">
            3
          </div>
        </div>
      </div>
    </div>

    <!-- Remaining Players Table -->
    <div
      v-if="remainingPlayers.length > 0"
      class="placement-table"
    >
      <div class="table-header">
        <div class="header-title">
          <span class="leaderboard-icon">🏅</span>
          <span>Placement Standings</span>
        </div>
      </div>
      
      <div class="table-content">
        <div class="table-row table-header-row">
          <div class="rank-col">
            Rank
          </div>
          <div class="player-col">
            Player
          </div>
          <div class="medals-col">
            Medals
          </div>
          <div class="points-col">
            Points
          </div>
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
    <div
      v-if="players.length === 0"
      class="empty-state"
    >
      <div class="empty-icon">
        🏆
      </div>
      <div class="empty-text">
        No placement standings available
      </div>
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
  source: 'podium-leaderboard'
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

<style scoped src="./OlympicLeaderboard.vue.css"></style>

