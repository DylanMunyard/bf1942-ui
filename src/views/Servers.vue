<template>
  <div class="servers-container">
    <ServerTable :initialMode="props.initialMode" @show-players="showPlayersModal" />
    
    <!-- Players Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content players-modal" @click.stop>
        <div class="modal-header">
          <div class="header-left">
            <h2>🗺️ {{ selectedServer?.mapName || 'Unknown Map' }}</h2>
            <div class="server-name-header">{{ selectedServer?.name || 'Unknown Server' }}</div>
            <div v-if="selectedServer?.ip && selectedServer?.port" class="server-address-header">
              🌐 {{ selectedServer.ip }}:{{ selectedServer.port }}
            </div>
          </div>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedServer && teamGroups.length" class="leaderboard-section">
            <!-- Mobile Team Tabs -->
            <div class="mobile-team-tabs">
              <div class="tab-buttons">
                <button 
                  v-for="(team, index) in teamGroups" 
                  :key="team.teamName"
                  class="tab-button"
                  :class="{ 'active': selectedTeamTab === index }"
                  @click="selectedTeamTab = index"
                >
                  <span class="team-icon">🛡️</span>
                  {{ team.teamName }}
                  <span class="team-score-badge">{{ team.totalScore.toLocaleString() }}</span>
                </button>
              </div>
              <div class="tab-content">
                <div 
                  v-for="(team, index) in teamGroups" 
                  :key="team.teamName"
                  v-show="selectedTeamTab === index"
                  class="team-column mobile-tab-panel"
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
                          <div class="kd-section">
                            <span class="kd-label">K/D:</span>
                            <span class="kd-values">
                              <span class="kills">{{ player.kills }}</span>
                              <span class="separator">/</span>
                              <span class="deaths">{{ player.deaths }}</span>
                            </span>
                          </div>
                          <div class="ping-section">
                            <span class="ping-label">Ping:</span>
                            <span class="player-ping" :class="{ 
                              'ping-good': player.ping < 50, 
                              'ping-ok': player.ping >= 50 && player.ping < 100,
                              'ping-bad': player.ping >= 100
                            }">
                              {{ player.ping }}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Desktop Teams Grid -->
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
const selectedTeamTab = ref(0); // For mobile tabbed interface

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
.servers-container {
  background-color: var(--color-background);
  border-radius: 0;
  box-shadow: none;
  padding: 12px;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .servers-container {
    padding: 8px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .servers-container {
    padding: 4px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .servers-container {
    padding: 4px;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .servers-container {
    padding: 4px;
  }
}

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

.server-address-header {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-family: monospace;
  margin-top: 2px;
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

/* Mobile Team Tabs - Hidden on desktop */
.mobile-team-tabs {
  display: none;
}

@media (max-width: 768px) {
  /* Show mobile tabs, hide desktop grid */
  .mobile-team-tabs {
    display: block;
  }

  .teams-container {
    display: none;
  }

  /* Mobile tab styles */
  .tab-buttons {
    display: flex;
    background: var(--color-background-mute);
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 12px;
    gap: 4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 6px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 80px;
    white-space: nowrap;
  }

  .tab-button.active {
    background: var(--color-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .tab-button:hover:not(.active) {
    background: var(--color-background-soft);
    color: var(--color-text);
  }

  .team-score-badge {
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .tab-button.active .team-score-badge {
    opacity: 1;
  }

  .tab-content {
    min-height: 400px;
  }

  .mobile-tab-panel {
    width: 100%;
    margin: 0;
  }

  /* Mobile leaderboard layout - two rows per player */
  .mobile-team-tabs .players-header {
    display: grid;
    grid-template-columns: 30px 1fr 70px;
    gap: 8px;
    padding: 8px 12px;
    font-size: 0.75rem;
  }

  .mobile-team-tabs .header-kd,
  .mobile-team-tabs .header-ping {
    display: none;
  }

  .mobile-team-tabs .player-row {
    display: grid;
    grid-template-columns: 30px 1fr 70px;
    gap: 8px;
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .mobile-team-tabs .player-row .player-kd,
  .mobile-team-tabs .player-row .player-ping {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    margin-top: 4px;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    border-top: 1px solid var(--color-border);
  }

  .mobile-team-tabs .player-row .player-kd {
    border-top: none;
    justify-content: space-between;
    gap: 8px;
    background: var(--color-background-mute);
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 6px;
  }

  .kd-section,
  .ping-section {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ping-section {
    align-items: center;
  }

  .kd-label,
  .ping-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-muted);
    line-height: 1;
  }

  .ping-label {
    padding: 2px 0;
  }

  .kd-values {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  /* Preserve ping styling in mobile layout */
  .mobile-team-tabs .player-row .player-ping {
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
    text-align: center;
  }

  .mobile-team-tabs .player-row .player-ping.ping-good {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }

  .mobile-team-tabs .player-row .player-ping.ping-ok {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }

  .mobile-team-tabs .player-row .player-ping.ping-bad {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }
  
  .modal-content {
    width: 98%;
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 15px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  /* Smaller tab buttons for small screens */
  .tab-button {
    font-size: 0.75rem;
    padding: 6px 4px;
    min-width: 70px;
  }

  .team-score-badge {
    font-size: 0.65rem;
  }

  .tab-content {
    min-height: 350px;
  }

  .mobile-team-tabs .players-header {
    grid-template-columns: 25px 1fr 60px;
    gap: 6px;
    padding: 6px 8px;
    font-size: 0.7rem;
  }

  .mobile-team-tabs .player-row {
    grid-template-columns: 25px 1fr 60px;
    gap: 6px;
    padding: 8px;
    font-size: 0.85rem;
  }

  .mobile-team-tabs .player-row .player-kd {
    font-size: 0.75rem;
    gap: 6px;
  }

  .kd-label,
  .ping-label {
    font-size: 0.65rem;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  /* Even smaller tab buttons for extra small screens */
  .tab-button {
    font-size: 0.7rem;
    padding: 5px 3px;
    min-width: 60px;
  }

  .team-score-badge {
    font-size: 0.6rem;
  }

  .tab-content {
    min-height: 300px;
  }

  .mobile-team-tabs .players-header {
    grid-template-columns: 22px 1fr 55px;
    gap: 4px;
    padding: 4px 6px;
    font-size: 0.65rem;
  }

  .mobile-team-tabs .player-row {
    grid-template-columns: 22px 1fr 55px;
    gap: 4px;
    padding: 6px;
    font-size: 0.8rem;
  }

  .mobile-team-tabs .player-row .player-kd {
    font-size: 0.7rem;
    gap: 4px;
  }

  .kd-label,
  .ping-label {
    font-size: 0.6rem;
  }
}
</style> 