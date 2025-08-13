<template>
  <div class="landing-page">
    <!-- Hero Section with Player Search -->
    <div class="hero-section">
      <div class="hero-content">
        <PlayerSearch
          v-model="searchQuery"
          placeholder="Find your player profile..."
          auto-focus
          @select="onPlayerSelect"
          class="hero-search"
        />
      </div>
    </div>

    <!-- Game Filters -->
    <div class="game-filters">
      <button
        v-for="game in gameFilters"
        :key="game.id"
        :class="['game-filter', { active: activeGame === game.id }]"
        @click="setActiveGame(game.id)"
      >
        <img :src="game.icon" :alt="game.name" class="game-icon">
        <span class="game-name">{{ game.name }}</span>
      </button>
    </div>

    <!-- Server Cards -->
    <div class="servers-section">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading servers...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchServers" class="retry-button">Retry</button>
      </div>
      
      <div v-else class="server-grid">
        <div
          v-for="server in filteredServers"
          :key="server.guid"
          class="server-card"
          @click="viewServerDetails(server)"
        >
          <div class="server-header">
            <h3 class="server-name">{{ server.name }}</h3>
            <div class="player-count">
              <span class="current-players">{{ server.numPlayers }}</span>
              <span class="separator">/</span>
              <span class="max-players">{{ server.maxPlayers }}</span>
            </div>
          </div>
          
          <div class="server-info">
            <div class="map-name">
              <span class="label">Map:</span>
              <span class="value">{{ server.mapName }}</span>
            </div>
            
            <div class="server-address">
              <span class="label">IP:</span>
              <span class="value">{{ server.ip }}:{{ server.port }}</span>
            </div>
            
            <div v-if="server.roundTimeRemain" class="round-time">
              <span class="label">Time remaining:</span>
              <span class="value">{{ formatTime(server.roundTimeRemain) }}</span>
            </div>
          </div>
          
          <div class="server-actions">
            <button 
              @click.stop="showPlayers(server)" 
              class="action-button players-btn"
              :disabled="server.numPlayers === 0"
            >
              👥 {{ server.numPlayers }} Players
            </button>
            <a 
              :href="server.joinLink" 
              target="_blank" 
              class="action-button join-btn"
              @click.stop
            >
              🎮 Join Server
            </a>
          </div>
          
          <div v-if="server.teams && server.teams.length > 1" class="team-scores">
            <div class="team-score">
              <span class="team-name">{{ server.teams[0].label }}</span>
              <span class="team-tickets">{{ server.teams[0].tickets }}</span>
            </div>
            <div class="vs">VS</div>
            <div class="team-score">
              <span class="team-name">{{ server.teams[1].label }}</span>
              <span class="team-tickets">{{ server.teams[1].tickets }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Players Sliding Panel -->
    <div 
      :class="['players-panel', { active: showPlayersPanel }]"
      @click="hidePlayersPanel"
    >
      <div class="panel-content" @click.stop>
        <div class="panel-header">
          <h3>{{ selectedServer?.name }} - Players Online</h3>
          <button @click="hidePlayersPanel" class="close-button">✕</button>
        </div>
        
        <div v-if="selectedServer" class="server-details">
          <p><strong>Map:</strong> {{ selectedServer.mapName }}</p>
          <p><strong>Players:</strong> {{ selectedServer.numPlayers }}/{{ selectedServer.maxPlayers }}</p>
          <div v-if="selectedServer.teams && selectedServer.teams.length > 1" class="team-info">
            <div class="team">
              <span class="team-label">{{ selectedServer.teams[0].label }}</span>
              <span class="team-tickets">{{ selectedServer.teams[0].tickets }} tickets</span>
            </div>
            <div class="team">
              <span class="team-label">{{ selectedServer.teams[1].label }}</span>
              <span class="team-tickets">{{ selectedServer.teams[1].tickets }} tickets</span>
            </div>
          </div>
        </div>
        
        <div v-if="selectedServer && selectedServer.players.length > 0" class="players-list">
          <div class="players-by-team">
            <div
              v-for="team in getTeamPlayers(selectedServer)"
              :key="team.index"
              class="team-section"
            >
              <h4 class="team-title">{{ team.label }} ({{ team.players.length }})</h4>
              <div class="players">
                <div
                  v-for="player in team.players"
                  :key="player.name"
                  class="player-row"
                  @click="viewPlayerDetails(player.name)"
                >
                  <div class="player-info">
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-stats">
                      {{ player.score }}pts | {{ player.kills }}K/{{ player.deaths }}D | {{ player.ping }}ms
                    </span>
                  </div>
                  <div class="player-kdr">
                    {{ calculateKDR(player.kills, player.deaths) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="selectedServer" class="no-players">
          <p>No players currently online</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ServerSummary, PlayerInfo, TeamInfo } from '../types/server';
import { fetchAllServers } from '../services/serverDetailsService';
import PlayerSearch from '../components/PlayerSearch.vue';

// Import game icons
import bf1942Icon from '../assets/bf1942.jpg';
import fh2Icon from '../assets/fh2.jpg';
import bfvIcon from '../assets/bfv.jpg';

// Router
const router = useRouter();

// Game configuration
const gameFilters = [
  { id: 'bf1942', name: 'BF1942', icon: bf1942Icon, apiName: 'bf1942' },
  { id: 'fh2', name: 'FH2', icon: fh2Icon, apiName: 'fh2' },
  { id: 'bfv', name: 'BFV', icon: bfvIcon, apiName: 'bfvietnam' }
] as const;

// Reactive state
const activeGame = ref<string>('bf1942');
const servers = ref<ServerSummary[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const showPlayersPanel = ref(false);
const selectedServer = ref<ServerSummary | null>(null);
const refreshTimer = ref<number | null>(null);

// Computed properties
const filteredServers = computed(() => {
  return servers.value.filter(server => {
    // Filter by game type based on server properties
    const currentGameConfig = gameFilters.find(g => g.id === activeGame.value);
    if (!currentGameConfig) return false;
    
    // Simple game type detection based on common patterns
    const serverName = server.name.toLowerCase();
    const gameType = server.gameType?.toLowerCase() || '';
    
    switch (activeGame.value) {
      case 'fh2':
        return gameType.includes('fh2') || serverName.includes('forgotten hope') || serverName.includes('fh2');
      case 'bfv':
        return gameType.includes('vietnam') || serverName.includes('vietnam') || serverName.includes('bfv');
      case 'bf1942':
      default:
        return !gameType.includes('fh2') && !gameType.includes('vietnam') && 
               !serverName.includes('forgotten hope') && !serverName.includes('vietnam') &&
               !serverName.includes('fh2') && !serverName.includes('bfv');
    }
  }).sort((a, b) => b.numPlayers - a.numPlayers); // Sort by player count descending
});

// Methods
const setActiveGame = (gameId: string) => {
  activeGame.value = gameId;
  fetchServers();
};

const fetchServers = async () => {
  const currentGameConfig = gameFilters.find(g => g.id === activeGame.value);
  if (!currentGameConfig) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const serverData = await fetchAllServers(currentGameConfig.apiName as 'bf1942' | 'fh2' | 'bfvietnam');
    servers.value = serverData;
  } catch (err) {
    error.value = 'Failed to load servers. Please try again.';
    console.error('Error fetching servers:', err);
  } finally {
    loading.value = false;
  }
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills > 0 ? '∞' : '0.00';
  return (kills / deaths).toFixed(2);
};

const onPlayerSelect = (player: any) => {
  router.push(`/players/${encodeURIComponent(player.playerName)}`);
};

const viewServerDetails = (server: ServerSummary) => {
  router.push(`/servers/${encodeURIComponent(server.name)}`);
};

const showPlayers = (server: ServerSummary) => {
  selectedServer.value = server;
  showPlayersPanel.value = true;
};

const hidePlayersPanel = () => {
  showPlayersPanel.value = false;
  selectedServer.value = null;
};

const viewPlayerDetails = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
  hidePlayersPanel();
};

const getTeamPlayers = (server: ServerSummary) => {
  if (!server.teams || !server.players) return [];
  
  return server.teams.map(team => ({
    ...team,
    players: server.players
      .filter(player => player.team === team.index)
      .sort((a, b) => b.score - a.score) // Sort by score descending
  }));
};

// Auto-refresh
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    fetchServers();
  }, 30000) as unknown as number; // Refresh every 30 seconds
};

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// Lifecycle
onMounted(() => {
  fetchServers();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: var(--color-text);
}

/* Hero Section */
.hero-section {
  padding: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-content {
  width: 100%;
  max-width: 600px;
}

.hero-search {
  width: 100%;
}

.hero-search :deep(.player-search-input) {
  padding: 16px 20px;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.hero-search :deep(.player-search-input:focus) {
  border-color: #7c3aed;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

.hero-search :deep(.player-search-input::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

/* Game Filters */
.game-filters {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  flex-wrap: wrap;
}

.game-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
}

.game-filter:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.game-filter.active {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-color: #7c3aed;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
}

.game-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

/* Servers Section */
.servers-section {
  padding: 0 20px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.retry-button {
  margin-top: 16px;
  padding: 12px 24px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #a855f7;
  transform: translateY(-2px);
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.server-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.server-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.server-name {
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
  margin-right: 16px;
  line-height: 1.3;
}

.player-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1.2rem;
  font-weight: 700;
}

.current-players {
  color: #22c55e;
}

.separator {
  color: rgba(255, 255, 255, 0.5);
}

.max-players {
  color: rgba(255, 255, 255, 0.7);
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.server-info > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.value {
  color: white;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.server-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.action-button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.players-btn {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.players-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.3);
  border-color: #22c55e;
}

.players-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.join-btn {
  background: rgba(124, 58, 237, 0.2);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.3);
}

.join-btn:hover {
  background: rgba(124, 58, 237, 0.3);
  border-color: #7c3aed;
}

.team-scores {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
}

.team-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.team-name {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.team-tickets {
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.vs {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 700;
  font-size: 0.8rem;
}

/* Players Panel */
.players-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
}

.players-panel.active {
  right: 0;
}

.panel-content {
  padding: 24px;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  color: white;
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.3;
  flex: 1;
  margin-right: 16px;
}

.close-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.server-details {
  margin-bottom: 24px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.server-details p {
  margin: 8px 0;
}

.team-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.team {
  text-align: center;
}

.team-label {
  display: block;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.team-tickets {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}

.players-by-team {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.team-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 16px;
}

.team-title {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.players {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-row:hover {
  background: rgba(255, 255, 255, 0.08);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.player-name {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.player-stats {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
}

.player-kdr {
  color: #7c3aed;
  font-weight: 700;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

.no-players {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  padding: 40px 0;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .hero-section {
    padding: 12px;
  }

  .game-filters {
    padding: 16px 12px;
    gap: 8px;
  }

  .game-filter {
    padding: 10px 16px;
    font-size: 0.85rem;
  }

  .game-name {
    display: none;
  }

  .servers-section {
    padding: 0 12px 30px;
  }

  .server-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .server-card {
    padding: 20px;
  }

  .server-actions {
    flex-direction: column;
  }

  .players-panel {
    width: 100vw;
    right: -100vw;
  }

  .players-panel.active {
    right: 0;
  }
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .landing-page {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  }
}
</style>