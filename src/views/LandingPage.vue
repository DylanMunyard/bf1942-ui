<template>
  <div class="landing-page">
    <!-- Hero Section with Player Search -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-header">
          <h1 class="hero-title">BF1942 Servers Dashboard</h1>
          <p class="hero-subtitle">Professional monitoring for Battlefield 1942, Forgotten Hope 2, and Battlefield Vietnam servers</p>
        </div>
        
        <!-- Prominent Player Search -->
        <div class="search-section">
          <div class="search-container">
            <PlayerSearch 
              v-model="playerSearchQuery"
              placeholder="Search players - most used feature!"
              :auto-focus="false"
              @select="handlePlayerSelect"
              @enter="handlePlayerEnter"
              class="main-player-search"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Game Filter Controls -->
    <section class="filter-section">
      <div class="filter-container">
        <h2 class="filter-title">Live Servers</h2>
        <div class="game-filters">
          <button
            v-for="game in gameOptions"
            :key="game.id"
            :class="['game-filter-btn', { active: selectedGame === game.id }]"
            @click="selectedGame = game.id"
          >
            <img :src="game.icon" :alt="game.name" class="game-icon" />
            <span>{{ game.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Simplified Server Table -->
    <section class="servers-section">
      <div class="servers-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading servers...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="refreshServers" class="retry-btn">Retry</button>
        </div>
        
        <div v-else class="servers-grid">
          <div 
            v-for="server in filteredServers"
            :key="server.guid"
            class="server-card"
            @click="navigateToServer(server)"
          >
            <div class="server-header">
              <div class="server-name">{{ server.name }}</div>
              <div class="server-players">
                <span class="player-count">{{ server.numPlayers }}/{{ server.maxPlayers }}</span>
                <div class="player-indicator" :class="getPlayerIndicatorClass(server.numPlayers, server.maxPlayers)"></div>
              </div>
            </div>
            
            <div class="server-details">
              <div class="server-map">
                <span class="map-label">Map:</span>
                <span class="map-name">{{ server.mapName }}</span>
              </div>
              
              <div class="server-connection">
                <span class="ip-port">{{ server.ip }}:{{ server.port }}</span>
                <button 
                  class="quick-join-btn"
                  @click.stop="quickJoin(server)"
                  title="Quick join server"
                >
                  ⚡
                </button>
              </div>
            </div>
            
            <div class="server-actions">
              <button 
                class="players-btn"
                @click.stop="showPlayersOnline(server)"
              >
                View Players ({{ server.numPlayers }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Sliding Players Panel -->
    <div 
      v-if="showPlayersPanel" 
      class="players-panel-overlay"
      @click="closePlayersPanel"
    >
      <div 
        class="players-panel"
        :class="{ open: showPlayersPanel }"
        @click.stop
      >
        <div class="panel-header">
          <h3>Players Online - {{ selectedServerForPlayers?.name }}</h3>
          <button class="close-btn" @click="closePlayersPanel">×</button>
        </div>
        
        <div class="panel-content">
          <div v-if="selectedServerForPlayers" class="server-info">
            <p class="server-map">Map: {{ selectedServerForPlayers.mapName }}</p>
            <p class="server-players">{{ selectedServerForPlayers.numPlayers }}/{{ selectedServerForPlayers.maxPlayers }} players</p>
          </div>
          
          <div class="players-list">
            <div class="team-section" v-for="team in playerTeams" :key="team.index">
              <div class="team-header">
                <span class="team-name">{{ team.label }}</span>
                <span class="team-tickets">{{ team.tickets }} tickets</span>
              </div>
              <div class="team-players">
                <div 
                  v-for="player in team.players"
                  :key="player.name"
                  class="player-row"
                  @click="navigateToPlayer(player.name)"
                >
                  <span class="player-name">{{ player.name }}</span>
                  <div class="player-stats">
                    <span class="score">{{ player.score }}</span>
                    <span class="kd">{{ player.kills }}/{{ player.deaths }}</span>
                    <span class="ping">{{ player.ping }}ms</span>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ServerSummary, PlayerInfo, TeamInfo } from '../types/server'
import { fetchAllServers } from '../services/serverDetailsService'
import PlayerSearch from '../components/PlayerSearch.vue'
import bf1942Icon from '../assets/bf1942.jpg'
import fh2Icon from '../assets/fh2.jpg'
import bfvIcon from '../assets/bfv.jpg'
import '../assets/pro-gamer-theme.css'

const router = useRouter()

// Game filter options
const gameOptions = [
  { id: '42', name: 'BF1942', icon: bf1942Icon },
  { id: 'FH2', name: 'Forgotten Hope 2', icon: fh2Icon },
  { id: 'BFV', name: 'BF Vietnam', icon: bfvIcon }
]

// State
const servers = ref<ServerSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedGame = ref<'42' | 'FH2' | 'BFV'>('42')
const playerSearchQuery = ref('')
const refreshTimer = ref<number | null>(null)

// Players panel state
const showPlayersPanel = ref(false)
const selectedServerForPlayers = ref<ServerSummary | null>(null)

// Computed
const filteredServers = computed(() => {
  return servers.value.filter(server => {
    // Map game types to our filter IDs
    const gameTypeMapping: Record<string, string> = {
      'Battlefield 1942': '42',
      'Forgotten Hope 2': 'FH2',
      'Battlefield Vietnam': 'BFV'
    }
    
    const serverGameType = gameTypeMapping[server.gameType] || server.gameType
    return serverGameType === selectedGame.value
  })
})

const playerTeams = computed(() => {
  if (!selectedServerForPlayers.value) return []
  
  const teams = selectedServerForPlayers.value.teams.map(team => ({
    ...team,
    players: selectedServerForPlayers.value!.players
      .filter(player => player.team === team.index)
      .sort((a, b) => b.score - a.score) // Sort by score descending
  }))
  
  return teams
})

// Methods
const loadServers = async () => {
  try {
    loading.value = true
    error.value = null
    const serverData = await fetchAllServers()
    servers.value = serverData
  } catch (err) {
    console.error('Error loading servers:', err)
    error.value = 'Failed to load servers'
  } finally {
    loading.value = false
  }
}

const refreshServers = () => {
  loadServers()
}

const getPlayerIndicatorClass = (current: number, max: number) => {
  const ratio = current / max
  if (ratio >= 0.8) return 'high'
  if (ratio >= 0.5) return 'medium'
  if (ratio > 0) return 'low'
  return 'empty'
}

const navigateToServer = (server: ServerSummary) => {
  router.push(`/servers/${encodeURIComponent(server.name)}`)
}

const navigateToPlayer = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`)
  closePlayersPanel()
}

const handlePlayerSelect = (player: any) => {
  router.push(`/players/${encodeURIComponent(player.playerName)}`)
}

const handlePlayerEnter = (query: string) => {
  if (query.trim()) {
    router.push(`/players/${encodeURIComponent(query.trim())}`)
  }
}

const quickJoin = (server: ServerSummary) => {
  window.open(server.joinLink, '_blank')
}

const showPlayersOnline = (server: ServerSummary) => {
  selectedServerForPlayers.value = server
  showPlayersPanel.value = true
}

const closePlayersPanel = () => {
  showPlayersPanel.value = false
  selectedServerForPlayers.value = null
}

// Lifecycle
onMounted(() => {
  loadServers()
  
  // Set up auto-refresh
  refreshTimer.value = setInterval(loadServers, 30000) // Refresh every 30 seconds
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
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
}

/* Hero Section */
.hero-section {
  padding: 2rem 1rem 3rem;
  background: var(--pro-gamer-hero-gradient);
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-header {
  margin-bottom: 2rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.search-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.search-container {
  width: 100%;
  max-width: 500px;
}

.main-player-search {
  width: 100%;
}

.main-player-search :deep(.player-search-input) {
  padding: 16px 20px;
  font-size: 1.1rem;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Filter Section */
.filter-section {
  padding: 2rem 1rem;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.filter-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
}

.game-filters {
  display: flex;
  gap: 0.5rem;
}

.game-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.game-filter-btn:hover {
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.game-filter-btn.active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.3);
}

.game-icon {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
}

/* Servers Section */
.servers-section {
  padding: 2rem 1rem;
}

.servers-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-accent);
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

.retry-btn {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: var(--color-accent-hover);
}

/* Server Cards Grid */
.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.server-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--pro-gamer-shadow-md);
  position: relative;
  overflow: hidden;
}

.server-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--pro-gamer-card-gradient);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.server-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--pro-gamer-shadow-xl);
  border-color: var(--pro-gamer-accent);
}

.server-card:hover::before {
  opacity: 1;
}

.dark-mode .server-card:hover {
  box-shadow: var(--pro-gamer-neon-blue);
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.server-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-heading);
  flex: 1;
  margin-right: 1rem;
  line-height: 1.3;
}

.server-players {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.player-count {
  font-weight: 600;
  color: var(--color-text);
}

.player-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.player-indicator.empty { background: #9ca3af; }
.player-indicator.low { background: #22c55e; }
.player-indicator.medium { background: #f59e0b; }
.player-indicator.high { background: #ef4444; }

.server-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.server-map {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.map-label {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.map-name {
  color: var(--color-text);
  font-weight: 500;
}

.server-connection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.ip-port {
  color: var(--color-text-muted);
}

.quick-join-btn {
  background: var(--color-accent);
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-join-btn:hover {
  background: var(--color-accent-hover);
  transform: scale(1.1);
}

.server-actions {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.players-btn {
  width: 100%;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.players-btn:hover {
  background: var(--color-primary-hover);
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
  backdrop-filter: blur(4px);
}

.players-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: var(--color-background);
  border-left: 1px solid var(--color-border);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  overflow-y: auto;
  z-index: 1001;
}

.players-panel.open {
  right: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.panel-header h3 {
  color: var(--color-heading);
  font-size: 1.2rem;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--color-text);
}

.panel-content {
  padding: 1.5rem;
}

.server-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 6px;
}

.server-info p {
  margin: 0.25rem 0;
  color: var(--color-text-muted);
}

.team-section {
  margin-bottom: 2rem;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--color-accent);
  color: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.team-name {
  font-weight: 600;
}

.team-tickets {
  font-size: 0.9rem;
}

.team-players {
  display: flex;
  flex-direction: column;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.player-row:hover {
  background: var(--color-background-soft);
}

.player-row:last-child {
  border-bottom: none;
}

.player-name {
  font-weight: 500;
  color: var(--color-text);
  flex: 1;
}

.player-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.player-stats .score {
  color: var(--color-accent);
  font-weight: 600;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .servers-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .players-panel {
    width: 100vw;
    right: -100vw;
  }
  
  .server-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .server-connection {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 1.5rem 0.5rem 2rem;
  }
  
  .servers-section {
    padding: 1rem 0.5rem;
  }
  
  .server-card {
    padding: 1rem;
  }
  
  .game-filter-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .game-icon {
    width: 20px;
    height: 20px;
  }
}
</style>