<template>
  <div>
    <ServerTable :initialMode="props.initialMode" @show-players="showPlayersModal" />
    
    <!-- Players Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content players-modal" @click.stop>
        <div class="modal-header">
          <div class="header-left">
            <h2>🗺️ {{ selectedServer?.mapName || 'Unknown Map' }}</h2>
            <div class="server-name-header">{{ selectedServer?.name || 'Unknown Server' }}</div>
          </div>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedServer && teamGroups.length" class="leaderboard-section">
            <div class="teams-container">
              <div 
                v-for="team in teamGroups" 
                :key="team.teamName"
                class="team-column"
                :class="`team-${team.teamName.toLowerCase()}`"
              >
                <!-- Team Header -->
                <div class="team-header">
                  <div class="team-name">
                    <span class="team-icon">🛡️</span>
                    {{ team.teamName }}
                  </div>
                  <div class="team-stats">
                    <div class="team-stat">
                      <span class="stat-label">Score</span>
                      <span class="stat-value">{{ team.totalScore.toLocaleString() }}</span>
                    </div>
                    <div class="team-stat">
                      <span class="stat-label">K/D</span>
                      <span class="stat-value">{{ calculateKDR(team.totalKills, team.totalDeaths) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Team Players -->
                <div class="team-players">
                  <div class="players-header">
                    <div class="header-rank">#</div>
                    <div class="header-player">Player</div>
                    <div class="header-score">Score</div>
                    <div class="header-kd">K/D</div>
                    <div class="header-ping">Ping</div>
                  </div>
                  
                  <div class="players-list">
                    <div
                      v-for="player in team.players"
                      :key="player.name"
                      class="player-row"
                      :class="{ 
                        'top-player': player.rank === 1
                      }"
                    >
                      <div class="player-rank">
                        <span v-if="player.rank === 1" class="rank-medal">🥇</span>
                        <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
                        <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
                        <span v-else class="rank-number">{{ player.rank }}</span>
                      </div>
                      <div class="player-name">
                        <router-link :to="`/player/${encodeURIComponent(player.name)}`" class="player-link">
                          {{ player.name }}
                        </router-link>
                      </div>
                      <div class="player-score">{{ player.score.toLocaleString() }}</div>
                      <div class="player-kd">
                        <span class="kills">{{ player.kills }}</span>
                        <span class="separator">/</span>
                        <span class="deaths">{{ player.deaths }}</span>
                      </div>
                      <div class="player-ping" :class="{ 
                        'ping-good': player.ping < 50, 
                        'ping-ok': player.ping >= 50 && player.ping < 100,
                        'ping-bad': player.ping >= 100
                      }">
                        {{ player.ping }}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="selectedServer && selectedServer.players.length === 0" class="no-players">
            No players currently on this server
          </div>
          <div v-else class="no-data">
            No server data available
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ServerTable from '../components/ServerTable.vue';
import { ServerInfo } from '../types/server';

// Props from router
interface Props {
  initialMode?: 'FH2' | '42';
}

const props = defineProps<Props>();

const showModal = ref(false);
const selectedServer = ref<ServerInfo | null>(null);

// Show players modal when ServerTable emits the event
const showPlayersModal = (server: ServerInfo) => {
  selectedServer.value = server;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedServer.value = null;
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Group players by team, similar to RoundReport.vue
const teamGroups = computed(() => {
  if (!selectedServer.value || !selectedServer.value.players.length) return [];
  
  // First, sort players by score (descending) and assign ranks
  const sortedPlayers = [...selectedServer.value.players].sort((a, b) => b.score - a.score);
  const playersWithRank = sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
    // Handle empty teamLabel by looking it up in teams array
    teamLabel: player.teamLabel || selectedServer.value!.teams.find(t => t.index === player.team)?.label || 'Unknown'
  }));
  
  const groups = playersWithRank.reduce((acc, player) => {
    if (!acc[player.teamLabel]) {
      acc[player.teamLabel] = [];
    }
    acc[player.teamLabel].push(player);
    return acc;
  }, {} as Record<string, typeof playersWithRank>);
  
  // Sort each team by rank
  Object.values(groups).forEach(team => {
    team.sort((a, b) => a.rank - b.rank);
  });
  
  return Object.entries(groups).map(([teamName, players]) => ({
    teamName,
    players,
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    totalKills: players.reduce((sum, player) => sum + player.kills, 0),
    totalDeaths: players.reduce((sum, player) => sum + player.deaths, 0)
  }));
});
</script>

<style scoped>
/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-background);
  border-radius: 8px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.players-modal {
  background: var(--color-background);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-mute);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-left h2 {
  margin: 0;
  color: var(--color-heading);
}

.server-name-header {
  font-size: 0.9rem;
  color: var(--color-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
  padding: 4px;
  border-radius: 4px;
}

.close-button:hover {
  background-color: var(--color-background-soft);
}

.modal-body {
  padding: 20px;
}

.leaderboard-section {
  background: var(--color-background);
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.team-column {
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
}

.team-header {
  padding: 15px;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.team-name {
  font-weight: bold;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-icon {
  font-size: 1.1rem;
}

.team-stats {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.team-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-weight: bold;
  color: var(--color-primary);
}

.team-players {
  padding: 0;
}

.players-header {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px 60px;
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
  grid-template-columns: 40px 1fr 80px 60px 60px;
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
  font-size: 1.2rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.rank-number {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-background-mute);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-name {
  font-weight: 500;
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

.player-ping {
  text-align: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.ping-good {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.ping-ok {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.ping-bad {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.no-players, .no-data {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .teams-container {
    grid-template-columns: 1fr;
  }
  
  .players-header,
  .player-row {
    grid-template-columns: 30px 1fr 60px 50px 50px;
    padding: 10px 12px;
  }
  
  .modal-content {
    width: 98%;
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 15px;
  }
}
</style> 