<template>
  <div class="landing-page">
    <!-- Compact Hero Section with Player Search -->
    <div class="hero-section">
      <div class="player-search-container">
        <input
          v-model="playerSearchQuery"
          type="text"
          placeholder="Search for players..."
          class="player-search-input"
          @input="onPlayerSearchInput"
          @keyup.enter="navigateToPlayer"
        >
        <div v-if="playerSuggestions.length > 0" class="player-suggestions">
          <div
            v-for="player in playerSuggestions"
            :key="player.name"
            class="player-suggestion"
            @click="selectPlayer(player)"
          >
            <div class="player-info">
              <span class="player-name">{{ player.name }}</span>
              <span class="player-details">
                {{ player.hoursPlayed }}h played • 
                <span :class="player.isOnline ? 'online' : 'offline'">
                  {{ player.isOnline ? 'Online' : `Last seen ${player.lastSeen}` }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Filter Buttons -->
    <div class="game-filters">
      <button
        v-for="game in gameTypes"
        :key="game.id"
        :class="['game-filter', { active: activeFilter === game.id }]"
        @click="setActiveFilter(game.id)"
      >
        <i :class="`tab-icon ${game.iconClass}`"></i>
        <span>{{ game.name }}</span>
      </button>
    </div>

    <!-- Server Display -->
    <div class="servers-section">
      <div v-if="loading" class="loading">
        Loading server data...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else class="server-grid">
        <div
          v-for="server in filteredServers"
          :key="server.guid"
          class="server-row"
        >
          <div class="server-main-info">
            <h3 class="server-name">{{ server.name }}</h3>
            <div class="server-stats">
              <span class="players-stat" @click="showPlayers(server)">
                <label>PLAYERS</label>
                <span class="value">{{ server.numPlayers }}/{{ server.maxPlayers }}</span>
              </span>
              <span class="map-stat">
                <label>MAP</label>
                <span class="value">{{ server.mapName }}</span>
              </span>
              <span class="connection-stat">
                <label>IP:PORT</label>
                <span class="value">{{ server.ip }}:{{ server.port }}</span>
              </span>
              <span class="mode-stat">
                <label>GAME</label>
                <span class="value">{{ getGameDisplayName(server.gameType) }}</span>
              </span>
            </div>
          </div>
          <div class="server-actions">
            <button class="join-btn" @click="joinServer(server)">
              JOIN
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sliding Players Panel -->
    <div
      v-if="showPlayersPanel"
      class="players-panel-overlay"
      @click="closePlayersPanel"
    >
      <div class="players-panel" @click.stop>
        <div class="players-panel-header">
          <h2>{{ selectedServer?.name }}</h2>
          <button class="close-btn" @click="closePlayersPanel">&times;</button>
        </div>
        <div class="players-panel-content">
          <div v-if="selectedServer?.teams" class="teams-container">
            <div v-for="team in selectedServer.teams" :key="team.index" class="team-section">
              <div class="team-header">
                <span class="team-name">{{ team.label }}</span>
                <span class="team-tickets">{{ team.tickets }} tickets</span>
              </div>
              <div class="team-players">
                <div
                  v-for="player in getTeamPlayers(team.index).slice().sort((a, b) => b.score - a.score)"
                  :key="player.name"
                  class="player-row"
                  @click="navigateToPlayerProfile(player.name)"
                >
                  <span class="player-name">{{ player.name }}</span>
                  <div class="player-stats">
                    <span class="stat">{{ player.score }}</span>
                    <span class="stat">{{ player.kills }}/{{ player.deaths }}</span>
                    <span class="stat">{{ player.ping }}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllServers } from '../services/serverDetailsService'
import { ServerSummary } from '../types/server'

const router = useRouter()

// Game types configuration
const gameTypes = [
  { id: 'all', name: 'ALL', iconClass: '' },
  { id: 'bf1942', name: 'BF1942', iconClass: 'icon-bf1942' },
  { id: 'fh2', name: 'FH2', iconClass: 'icon-fh2' },
  { id: 'bfvietnam', name: 'BFV', iconClass: 'icon-bfv' }
]

// State
const playerSearchQuery = ref('')
const playerSuggestions = ref<any[]>([])
const activeFilter = ref('all')
const servers = ref<ServerSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const refreshTimer = ref<number | null>(null)

// Players panel state
const showPlayersPanel = ref(false)
const selectedServer = ref<ServerSummary | null>(null)

// Mock player suggestions for now - you can connect this to your player API later
const mockPlayerSuggestions = [
  { name: 'ProGamer123', hoursPlayed: 156, isOnline: true, lastSeen: '2 hours ago' },
  { name: 'SnipeKing', hoursPlayed: 89, isOnline: false, lastSeen: '1 day ago' },
  { name: 'TankCommander', hoursPlayed: 234, isOnline: true, lastSeen: '5 minutes ago' }
]

// Computed properties
const filteredServers = computed(() => {
  if (activeFilter.value === 'all') {
    return servers.value
  }
  // For now, we'll filter based on server name patterns
  // This could be enhanced by adding gameId to ServerSummary interface
  return servers.value.filter(server => {
    const serverName = server.name.toLowerCase()
    const gameType = server.gameType?.toLowerCase() || ''
    
    if (activeFilter.value === 'bf1942') {
      return serverName.includes('bf1942') || serverName.includes('battlefield 1942') || gameType.includes('bf1942')
    }
    if (activeFilter.value === 'fh2') {
      return serverName.includes('fh2') || serverName.includes('forgotten hope') || gameType.includes('fh2')
    }
    if (activeFilter.value === 'bfvietnam') {
      return serverName.includes('vietnam') || serverName.includes('bfv') || gameType.includes('vietnam')
    }
    return false
  })
})

// Methods
const onPlayerSearchInput = () => {
  if (playerSearchQuery.value.length >= 2) {
    // Filter mock suggestions - replace with real API call
    playerSuggestions.value = mockPlayerSuggestions.filter(p =>
      p.name.toLowerCase().includes(playerSearchQuery.value.toLowerCase())
    )
  } else {
    playerSuggestions.value = []
  }
}

const selectPlayer = (player: any) => {
  playerSearchQuery.value = player.name
  playerSuggestions.value = []
  navigateToPlayerProfile(player.name)
}

const navigateToPlayer = () => {
  if (playerSearchQuery.value.trim()) {
    navigateToPlayerProfile(playerSearchQuery.value.trim())
  }
}

const navigateToPlayerProfile = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`)
}

const setActiveFilter = (filterId: string) => {
  activeFilter.value = filterId
}

const getGameDisplayName = (gameType: string): string => {
  // For now, we'll determine game type based on server characteristics
  // This could be enhanced by adding gameId to ServerSummary interface later
  return gameType || 'Unknown'
}

const joinServer = (server: ServerSummary) => {
  const joinUrl = `bf1942://${server.ip}:${server.port}`
  const newWindow = window.open(joinUrl, '_blank', 'noopener,noreferrer')
  if (newWindow) {
    newWindow.blur()
    window.focus()
  }
}

const showPlayers = (server: ServerSummary) => {
  selectedServer.value = server
  showPlayersPanel.value = true
}

const closePlayersPanel = () => {
  showPlayersPanel.value = false
  selectedServer.value = null
}

const getTeamPlayers = (teamIndex: number) => {
  if (!selectedServer.value?.players) return []
  return selectedServer.value.players.filter(player => player.team === teamIndex)
}

const fetchAllServerData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch all game types
    const [bf1942Servers, fh2Servers, bfvServers] = await Promise.allSettled([
      fetchAllServers('bf1942'),
      fetchAllServers('fh2'),
      fetchAllServers('bfvietnam')
    ])
    
    const allServers: ServerSummary[] = []
    
    if (bf1942Servers.status === 'fulfilled') {
      allServers.push(...bf1942Servers.value)
    }
    if (fh2Servers.status === 'fulfilled') {
      allServers.push(...fh2Servers.value)
    }
    if (bfvServers.status === 'fulfilled') {
      allServers.push(...bfvServers.value)
    }
    
    // Sort by player count descending
    servers.value = allServers.sort((a, b) => b.numPlayers - a.numPlayers)
  } catch (err) {
    error.value = 'Failed to fetch server data. Please try again.'
    console.error('Error fetching servers:', err)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchAllServerData()
  
  // Auto-refresh every 30 seconds
  refreshTimer.value = window.setInterval(() => {
    fetchAllServerData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--color-background);
}

/* Compact Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 15px;
  margin-bottom: 20px;
}

.player-search-container {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.player-search-input {
  width: 100%;
  padding: 15px 20px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.player-search-input:focus {
  outline: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.player-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.player-suggestion {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.player-suggestion:last-child {
  border-bottom: none;
}

.player-suggestion:hover {
  background-color: #f8f9fa;
}

.player-name {
  font-weight: 600;
  color: #333;
  display: block;
}

.player-details {
  font-size: 14px;
  color: #666;
  margin-top: 2px;
  display: block;
}

.online {
  color: #4CAF50;
  font-weight: 500;
}

.offline {
  color: #999;
}

/* Game Filter Buttons */
.game-filters {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  padding: 0 15px;
}

.game-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-background-soft);
  border: 2px solid transparent;
  border-radius: 8px;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.game-filter:hover {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
}

.game-filter.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.tab-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 50%;
}

.icon-bf1942 {
  background-image: url('../assets/bf1942.jpg');
}

.icon-fh2 {
  background-image: url('../assets/fh2.jpg');
}

.icon-bfv {
  background-image: url('../assets/bfv.jpg');
}

/* Servers Section */
.servers-section {
  padding: 0 15px;
}

.loading, .error {
  text-align: center;
  padding: 40px 20px;
  font-size: 18px;
}

.error {
  color: #e74c3c;
}

.server-grid {
  display: grid;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.server-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-background-soft);
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.server-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.server-main-info {
  flex: 1;
}

.server-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.server-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: center;
}

.players-stat,
.map-stat,
.connection-stat,
.mode-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.players-stat {
  cursor: pointer;
  transition: color 0.2s;
}

.players-stat:hover {
  color: var(--color-primary);
}

.server-stats label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

.server-stats .value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.players-stat .value {
  color: #4CAF50;
}

.map-stat .value {
  color: #FF9800;
}

.connection-stat .value {
  color: #2196F3;
  font-family: monospace;
}

.mode-stat .value {
  color: #9C27B0;
}

.server-actions {
  display: flex;
  align-items: center;
}

.join-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.join-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .server-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .server-row {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .server-actions {
    justify-content: center;
  }
  
  .join-btn {
    width: 100%;
    padding: 12px 16px;
  }
  
  .game-filters {
    justify-content: center;
    gap: 6px;
  }
  
  .game-filter {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .tab-icon {
    width: 16px;
    height: 16px;
  }
}

/* Players Panel */
.players-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.players-panel {
  background: var(--color-background);
  width: 100%;
  max-width: 500px;
  height: 100%;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
  overflow-y: auto;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.players-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-mute);
}

.players-panel-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: var(--color-background-soft);
}

.players-panel-content {
  padding: 20px;
}

.team-section {
  margin-bottom: 30px;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-background-soft);
  border-radius: 6px;
  margin-bottom: 12px;
}

.team-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-text);
}

.team-tickets {
  font-size: 14px;
  color: var(--color-text-muted);
}

.team-players {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-background);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-row:hover {
  background: var(--color-background-mute);
  transform: translateX(4px);
}

.player-row .player-name {
  font-weight: 500;
  color: var(--color-text);
}

.player-stats {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: var(--color-text-muted);
}

.player-stats .stat {
  font-weight: 500;
}

/* Mobile players panel */
@media (max-width: 768px) {
  .players-panel {
    max-width: 100%;
  }
  
  .players-panel-header {
    padding: 16px;
  }
  
  .players-panel-content {
    padding: 16px;
  }
  
  .player-stats {
    gap: 8px;
    font-size: 13px;
  }
}
</style>