<template>
  <div class="landing-page">
    <div class="main-layout">
      <!-- Player Search Sidebar -->
      <div class="player-search-sidebar" :class="{ 'expanded': playerSearchQuery.length >= 2 || playerSuggestions.length > 0 }">
        <div class="search-input-wrapper">
          <i class="search-icon">🔍</i>
          <input
            v-model="playerSearchQuery"
            type="text"
            placeholder="Search players..."
            class="player-search-input"
            @input="onPlayerSearchInput"
            @keyup.enter="navigateToPlayer"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          >
          <div v-if="isSearchLoading" class="search-spinner">
            🔄
          </div>
        </div>
        <div v-if="showPlayerDropdown" class="player-suggestions">
          <div
            v-for="player in playerSuggestions"
            :key="player.playerName"
            class="player-suggestion"
            @mousedown.prevent="selectPlayer(player)"
          >
            <div class="player-info">
              <div class="player-name">{{ player.playerName }}</div>
              <div class="player-details">
                <span class="play-time">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                <span class="last-seen">{{ formatLastSeen(player.lastSeen) }}</span>
                <span v-if="player.isActive" class="online">🟢 Online</span>
                <span v-else class="offline">⚫ Offline</span>
              </div>
              <div v-if="player.currentServer && player.isActive" class="current-server">
                {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
              </div>
            </div>
          </div>
          <div v-if="playerSuggestions.length === 0 && !isSearchLoading && playerSearchQuery.length >= 2" class="no-results">
            No players found
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Game Filter Buttons -->
        <div class="game-filters">
          <button
            v-for="game in gameTypes.filter(g => g.id !== 'all')"
            :key="game.id"
            :class="['game-filter', { active: activeFilter === game.id }]"
            @click="setActiveFilter(game.id)"
            :title="game.name"
          >
            <i :class="`tab-icon ${game.iconClass}`"></i>
          </button>
        </div>

        <!-- Server Table -->
        <div class="servers-section">
          <div v-if="loading" class="loading">
            Loading server data...
          </div>
          <div v-else-if="error" class="error">
            {{ error }}
          </div>
          <div v-else>
            <div class="server-count">
              Showing {{ sortedServers.length }} servers ({{ servers.length }} total)
            </div>
            <div class="server-table-container">
            <table class="server-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')" class="sortable">
                    Server Name
                    <span class="sort-indicator" :class="getSortClass('name')">▲</span>
                  </th>
                  <th @click="sortBy('numPlayers')" class="sortable players-col">
                    Players
                    <span class="sort-indicator" :class="getSortClass('numPlayers')">▲</span>
                  </th>
                  <th @click="sortBy('mapName')" class="sortable">
                    Map
                    <span class="sort-indicator" :class="getSortClass('mapName')">▲</span>
                  </th>
                  <th @click="sortBy('roundTimeRemain')" class="sortable">
                    Time Left
                    <span class="sort-indicator" :class="getSortClass('roundTimeRemain')">▲</span>
                  </th>
                  <th @click="sortBy('gameType')" class="sortable">
                    Game
                    <span class="sort-indicator" :class="getSortClass('gameType')">▲</span>
                  </th>
                  <th>Connection</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="server in sortedServers"
                  :key="server.guid"
                  class="server-row"
                  :class="getServerStatusClass(server)"
                >
                  <td class="server-name-cell">
                    <div class="server-name">{{ server.name }}</div>
                  </td>
                  <td class="players-cell" @click="showPlayers(server)">
                    <div class="player-count" :class="getPlayerCountClass(server)">
                      <span class="current">{{ server.numPlayers }}</span>
                      <span class="separator">/</span>
                      <span class="max">{{ server.maxPlayers }}</span>
                    </div>
                    <div class="player-bar">
                      <div class="player-fill" :style="{ width: getPlayerPercentage(server) + '%', backgroundColor: getPlayerBarColor(server) }"></div>
                    </div>
                  </td>
                  <td class="map-cell">
                    <span class="map-name">{{ server.mapName }}</span>
                  </td>
                  <td class="time-cell">
                    <span class="time-remaining">{{ formatTimeRemaining(server.roundTimeRemain) }}</span>
                  </td>
                  <td class="game-cell">
                    <span class="game-type" :class="getGameTypeClass(server.gameType)">{{ getGameDisplayName(server.gameType) }}</span>
                  </td>
                  <td class="connection-cell">
                    <span class="connection-info">{{ server.ip }}:{{ server.port }}</span>
                  </td>
                  <td class="action-cell">
                    <button class="join-btn" @click="joinServer(server)" :disabled="server.numPlayers >= server.maxPlayers">
                      {{ server.numPlayers >= server.maxPlayers ? 'FULL' : 'JOIN' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
              <div class="team-table-container">
                <table class="players-table">
                  <thead>
                    <tr>
                      <th @click="sortPlayersBy('name')" class="sortable">
                        Player
                      </th>
                      <th @click="sortPlayersBy('score')" class="sortable">
                        Score
                      </th>
                      <th @click="sortPlayersBy('kills')" class="sortable">
                        Kills
                      </th>
                      <th @click="sortPlayersBy('deaths')" class="sortable">
                        Deaths
                      </th>
                      <th @click="sortPlayersBy('ping')" class="sortable">
                        Ping
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="player in getSortedTeamPlayers(team.index)"
                      :key="player.name"
                      class="player-table-row"
                      @click="navigateToPlayerProfile(player.name)"
                    >
                      <td class="player-name-cell">{{ player.name }}</td>
                      <td class="score-cell" :class="getScoreClass(player.score)">{{ player.score }}</td>
                      <td class="kills-cell" :class="getKillsClass(player.kills)">{{ player.kills }}</td>
                      <td class="deaths-cell" :class="getDeathsClass(player.deaths)">{{ player.deaths }}</td>
                      <td class="ping-cell" :class="getPingClass(player.ping)">{{ player.ping }}ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllServers } from '../services/serverDetailsService'
import { ServerSummary } from '../types/server'
import { formatLastSeen } from '@/utils/timeUtils'

interface PlayerSearchResult {
  playerName: string
  totalPlayTimeMinutes: number
  lastSeen: string
  isActive: boolean
  currentServer?: {
    serverGuid: string
    serverName: string
    sessionKills: number
    sessionDeaths: number
    mapName: string
    gameId: string
  }
}

interface PlayerSearchResponse {
  items: PlayerSearchResult[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

const router = useRouter()

// Props from router
interface Props {
  initialMode?: 'FH2' | '42' | 'BFV';
}

const props = defineProps<Props>();

// Game types configuration
const gameTypes = [
  { id: 'all', name: 'ALL', iconClass: '' },
  { id: 'bf1942', name: 'BF1942', iconClass: 'icon-bf1942' },
  { id: 'fh2', name: 'FH2', iconClass: 'icon-fh2' },
  { id: 'bfvietnam', name: 'BFV', iconClass: 'icon-bfv' }
]

// Map router props to filter IDs
const getFilterFromMode = (mode?: string) => {
  switch (mode) {
    case '42':
      return 'bf1942'
    case 'FH2':
      return 'fh2'
    case 'BFV':
      return 'bfvietnam'
    default:
      return 'bf1942'
  }
}

// State
const playerSearchQuery = ref('')
const playerSuggestions = ref<PlayerSearchResult[]>([])
const isSearchLoading = ref(false)
const showPlayerDropdown = ref(false)
const activeFilter = ref(getFilterFromMode(props.initialMode))
const sortField = ref('numPlayers')
const sortDirection = ref('desc')
const servers = ref<ServerSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const refreshTimer = ref<number | null>(null)
let searchTimeout: number | null = null
let blurTimeout: number | null = null

// Players panel state
const showPlayersPanel = ref(false)
const selectedServer = ref<ServerSummary | null>(null)
const playerSortField = ref('score')
const playerSortDirection = ref('desc')


// Computed properties
const filteredServers = computed(() => {
  // Since we're fetching servers for specific game types from the API,
  // we don't need additional filtering - just return all servers
  return servers.value
})

const sortedServers = computed(() => {
  const filtered = [...filteredServers.value]
  
  return filtered.sort((a, b) => {
    let aVal, bVal
    
    switch (sortField.value) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'numPlayers':
        aVal = a.numPlayers
        bVal = b.numPlayers
        break
      case 'mapName':
        aVal = a.mapName?.toLowerCase() || ''
        bVal = b.mapName?.toLowerCase() || ''
        break
      case 'gameType':
        aVal = a.gameType?.toLowerCase() || ''
        bVal = b.gameType?.toLowerCase() || ''
        break
      case 'roundTimeRemain':
        aVal = a.roundTimeRemain || 0
        bVal = b.roundTimeRemain || 0
        break
      default:
        aVal = a.numPlayers
        bVal = b.numPlayers
    }
    
    if (sortDirection.value === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
})

// Player search methods
const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    playerSuggestions.value = []
    showPlayerDropdown.value = false
    return
  }

  isSearchLoading.value = true
  
  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`)
    if (!response.ok) {
      throw new Error('Failed to search players')
    }

    const data: PlayerSearchResponse = await response.json()
    playerSuggestions.value = data.items
    showPlayerDropdown.value = data.items.length > 0 || query.length >= 2
  } catch (error) {
    console.error('Error searching players:', error)
    playerSuggestions.value = []
    showPlayerDropdown.value = false
  } finally {
    isSearchLoading.value = false
  }
}

const onPlayerSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    searchPlayers(playerSearchQuery.value)
  }, 300) as unknown as number
}

const onSearchFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout)
  }
  if (playerSearchQuery.value.length >= 2) {
    searchPlayers(playerSearchQuery.value)
  }
}

const onSearchBlur = () => {
  blurTimeout = setTimeout(() => {
    showPlayerDropdown.value = false
  }, 200) as unknown as number
}

const selectPlayer = (player: PlayerSearchResult) => {
  playerSearchQuery.value = player.playerName
  playerSuggestions.value = []
  showPlayerDropdown.value = false
  navigateToPlayerProfile(player.playerName)
}

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h`
  }
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

const formatTimeRemaining = (timeValue: number): string => {
  if (!timeValue || timeValue < 0) return '-'
  
  // Extract minutes and seconds from the combined value
  // e.g., 823 = 8 minutes 23 seconds, 2403 = 24 minutes 3 seconds
  const minutes = Math.floor(timeValue / 100)
  const seconds = timeValue % 100
  
  // Format as MM:SS
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
  
  // Update the route to match the new filter
  const routeMap = {
    'bf1942': '/servers/bf1942',
    'fh2': '/servers/fh2',
    'bfvietnam': '/servers/bfv'
  }
  
  const newRoute = routeMap[filterId as keyof typeof routeMap]
  if (newRoute && router.currentRoute.value.path !== newRoute) {
    router.push(newRoute)
  }
  
  // fetchServersForGame will be called by the watcher
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
  // Reset to default sorting when opening new server
  playerSortField.value = 'score'
  playerSortDirection.value = 'desc'
}

const closePlayersPanel = () => {
  showPlayersPanel.value = false
  selectedServer.value = null
}


const getScoreClass = (score: number) => {
  if (score >= 100) return 'score-excellent'
  if (score >= 50) return 'score-good'
  if (score >= 25) return 'score-average'
  return 'score-low'
}

const getKillsClass = (kills: number) => {
  if (kills >= 30) return 'kills-excellent'
  if (kills >= 15) return 'kills-good'
  if (kills >= 5) return 'kills-average'
  return 'kills-low'
}

const getDeathsClass = (deaths: number) => {
  if (deaths >= 20) return 'deaths-high'
  if (deaths >= 10) return 'deaths-medium'
  if (deaths >= 5) return 'deaths-low'
  return 'deaths-minimal'
}

const getPingClass = (ping: number) => {
  if (ping <= 50) return 'ping-excellent'
  if (ping <= 100) return 'ping-good'
  if (ping <= 150) return 'ping-average'
  return 'ping-poor'
}

const sortPlayersBy = (field: string) => {
  if (playerSortField.value === field) {
    playerSortDirection.value = playerSortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    playerSortField.value = field
    playerSortDirection.value = field === 'name' ? 'asc' : 'desc'
  }
}


const getSortedTeamPlayers = (teamIndex: number) => {
  if (!selectedServer.value?.players) return []
  
  const teamPlayers = selectedServer.value.players.filter(player => player.team === teamIndex)
  
  return [...teamPlayers].sort((a, b) => {
    let aVal, bVal
    
    switch (playerSortField.value) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'score':
        aVal = a.score
        bVal = b.score
        break
      case 'kills':
        aVal = a.kills
        bVal = b.kills
        break
      case 'deaths':
        aVal = a.deaths
        bVal = b.deaths
        break
      case 'ping':
        aVal = a.ping
        bVal = b.ping
        break
      default:
        aVal = a.score
        bVal = b.score
    }
    
    if (playerSortDirection.value === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
}

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = field === 'numPlayers' ? 'desc' : 'asc'
  }
}

const getSortClass = (field: string) => {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? 'asc' : 'desc'
}

const getPlayerPercentage = (server: ServerSummary) => {
  return server.maxPlayers > 0 ? (server.numPlayers / server.maxPlayers) * 100 : 0
}

const getPlayerCountClass = (server: ServerSummary) => {
  const percentage = getPlayerPercentage(server)
  if (percentage >= 100) return 'full'
  if (percentage >= 80) return 'high'
  if (percentage >= 40) return 'medium'
  return 'low'
}

const getPlayerBarColor = (server: ServerSummary) => {
  const percentage = getPlayerPercentage(server)
  if (percentage >= 100) return '#f44336'
  if (percentage >= 80) return '#ff9800'
  if (percentage >= 40) return '#4caf50'
  return '#2196f3'
}

const getServerStatusClass = (server: ServerSummary) => {
  const percentage = getPlayerPercentage(server)
  if (percentage >= 100) return 'server-full'
  if (percentage >= 80) return 'server-high'
  if (percentage === 0) return 'server-empty'
  return 'server-active'
}

const getGameTypeClass = (gameType: string) => {
  const type = gameType?.toLowerCase() || ''
  if (type.includes('bf1942')) return 'game-bf1942'
  if (type.includes('fh2')) return 'game-fh2'
  if (type.includes('vietnam')) return 'game-bfv'
  return 'game-unknown'
}

const fetchServersForGame = async (gameType: 'bf1942' | 'fh2' | 'bfvietnam', isInitialLoad = false) => {
  if (isInitialLoad) {
    loading.value = true
  }
  error.value = null
  
  try {
    const serverData = await fetchAllServers(gameType)
    servers.value = serverData.sort((a, b) => b.numPlayers - a.numPlayers)
  } catch (err) {
    error.value = 'Failed to fetch server data. Please try again.'
    console.error('Error fetching servers:', err)
  } finally {
    if (isInitialLoad) {
      loading.value = false
    }
  }
}

// Watch for game filter changes and fetch new data
watch(activeFilter, (newFilter) => {
  fetchServersForGame(newFilter as 'bf1942' | 'fh2' | 'bfvietnam', true) // Show loading when switching game types
})

// Lifecycle
onMounted(() => {
  // Fetch initial data for BF1942
  fetchServersForGame(activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam', true)
  
  // Auto-refresh every 30 seconds for current game type (no loading state)
  refreshTimer.value = window.setInterval(() => {
    fetchServersForGame(activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam', false)
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

/* Main Layout */
.main-layout {
  display: flex;
  min-height: 100vh;
  gap: 0;
}

/* Player Search Sidebar */
.player-search-sidebar {
  width: 280px;
  background: transparent;
  border-right: 2px solid var(--color-border);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  transition: width 0.3s ease;
}

.player-search-sidebar.expanded {
  width: 320px;
}

.search-input-wrapper {
  position: relative;
  margin: 20px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 14px;
  z-index: 2;
}

.search-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  animation: spin 1s linear infinite;
  pointer-events: none;
}

.player-search-input {
  width: 100%;
  padding: 10px 40px 10px 36px;
  font-size: 14px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.player-search-input::placeholder {
  color: var(--color-text-muted);
}

.player-search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-background);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.player-suggestions {
  margin: 0 20px 20px 20px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-suggestion {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s;
}

.player-suggestion:last-child {
  border-bottom: none;
}

.player-suggestion:hover {
  background-color: var(--color-background-soft);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.player-details {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--color-text-muted);
}

.play-time,
.last-seen {
  font-size: 11px;
  color: var(--color-text-muted);
}

.current-server {
  font-size: 11px;
  color: var(--color-primary);
  font-style: italic;
  margin-top: 2px;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 13px;
}

.online {
  color: #4CAF50;
  font-weight: 500;
  font-size: 10px;
}

.offline {
  color: #999;
  font-size: 10px;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-x: auto;
}

/* Game Filter Buttons */
.game-filters {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.game-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--color-background-soft);
  border: 2px solid transparent;
  border-radius: 12px;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  position: relative;
}

.game-filter:hover {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.game-filter.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.game-filter.active::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
  border-radius: 16px;
  z-index: -1;
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.tab-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.game-filter.active .tab-icon {
  transform: scale(1.1);
  filter: brightness(1.2) contrast(1.1);
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

/* Server Table */
.servers-section {
  flex: 1;
}

.server-count {
  margin-bottom: 12px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: right;
}

.loading, .error {
  text-align: center;
  padding: 40px 20px;
  font-size: 18px;
}

.error {
  color: #e74c3c;
}

.server-table-container {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.server-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.server-table th {
  background: var(--color-background-mute);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  border-bottom: 2px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.server-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  user-select: none;
}

.server-table th.sortable:hover {
  background: var(--color-background);
}

.sort-indicator {
  display: inline-block;
  margin-left: 6px;
  font-size: 10px;
  transition: transform 0.2s;
  opacity: 0.5;
}

.sort-indicator.asc {
  transform: rotate(0deg);
  opacity: 1;
  color: var(--color-primary);
}

.sort-indicator.desc {
  transform: rotate(180deg);
  opacity: 1;
  color: var(--color-primary);
}

.server-table td {
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.server-row {
  transition: all 0.2s ease;
}

.server-row:hover {
  background: var(--color-background);
}

.server-row.server-full {
  background: rgba(244, 67, 54, 0.05);
}

.server-row.server-high {
  background: rgba(255, 152, 0, 0.05);
}

.server-row.server-empty {
  background: rgba(158, 158, 158, 0.05);
}

.server-row.server-active {
  background: rgba(76, 175, 80, 0.02);
}

.server-name-cell {
  max-width: 300px;
}

.server-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.players-cell {
  cursor: pointer;
  min-width: 80px;
}

.player-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  margin-bottom: 2px;
}

.player-count.full .current {
  color: #f44336;
}

.player-count.high .current {
  color: #ff9800;
}

.player-count.medium .current {
  color: #4caf50;
}

.player-count.low .current {
  color: #2196f3;
}

.separator {
  color: var(--color-text-muted);
}

.max {
  color: var(--color-text-muted);
}

.player-bar {
  width: 100%;
  height: 3px;
  background: var(--color-background-mute);
  border-radius: 2px;
  overflow: hidden;
}

.player-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.map-cell {
  max-width: 200px;
}

.map-name {
  color: #ff9800;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-cell {
  min-width: 80px;
  text-align: center;
}

.time-remaining {
  color: #4caf50;
  font-weight: 600;
  font-size: 12px;
}

.game-cell {
  min-width: 80px;
}

.game-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.game-bf1942 {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.game-fh2 {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.game-bfv {
  background: rgba(156, 39, 176, 0.2);
  color: #9c27b0;
}

.game-unknown {
  background: rgba(158, 158, 158, 0.2);
  color: #9e9e9e;
}

.connection-cell {
  font-family: monospace;
  font-size: 12px;
  color: var(--color-text-muted);
  min-width: 120px;
}

.action-cell {
  text-align: center;
  min-width: 80px;
}

.join-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  min-width: 50px;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.join-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Mobile Responsiveness */
@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  
  .player-search-sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .player-search-sidebar.expanded {
    width: 100%;
  }
  
  .search-input-wrapper {
    margin: 15px;
  }
  
  .player-suggestions {
    margin: 0 15px 15px 15px;
    max-height: 200px;
  }
  
  .server-table-container {
    overflow-x: auto;
  }
  
  .server-table {
    min-width: 700px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }
  
  .game-filters {
    justify-content: center;
    gap: 8px;
  }
  
  .game-filter {
    padding: 10px;
    font-size: 12px;
  }
  
  .tab-icon {
    width: 20px;
    height: 20px;
  }
  
  .server-table th,
  .server-table td {
    padding: 8px 12px;
  }
  
  .server-table {
    font-size: 12px;
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
  max-width: 900px;
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

.teams-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 769px) {
  .teams-container {
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
}

.team-section {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
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

.team-table-container {
  background: var(--color-background-soft);
  overflow: hidden;
}

.players-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.players-table th {
  background: var(--color-background-mute);
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.players-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  user-select: none;
}

.players-table th.sortable:hover {
  background: var(--color-background);
}

.players-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.player-table-row {
  transition: all 0.2s ease;
  cursor: pointer;
}

.player-table-row:hover {
  background: var(--color-background);
}

.player-table-row:last-child td {
  border-bottom: none;
}

.player-name-cell {
  font-weight: 600;
  color: var(--color-text);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Score color coding */
.score-excellent {
  color: #4caf50;
  font-weight: 700;
}

.score-good {
  color: #2196f3;
  font-weight: 600;
}

.score-average {
  color: #ff9800;
  font-weight: 500;
}

.score-low {
  color: var(--color-text-muted);
}

/* Kills color coding */
.kills-excellent {
  color: #f44336;
  font-weight: 700;
}

.kills-good {
  color: #ff9800;
  font-weight: 600;
}

.kills-average {
  color: #4caf50;
  font-weight: 500;
}

.kills-low {
  color: var(--color-text-muted);
}

/* Deaths color coding */
.deaths-high {
  color: #f44336;
  font-weight: 600;
}

.deaths-medium {
  color: #ff9800;
  font-weight: 500;
}

.deaths-low {
  color: #4caf50;
  font-weight: 500;
}

.deaths-minimal {
  color: #2196f3;
  font-weight: 500;
}

/* Ping color coding */
.ping-excellent {
  color: #4caf50;
  font-weight: 600;
}

.ping-good {
  color: #2196f3;
  font-weight: 500;
}

.ping-average {
  color: #ff9800;
  font-weight: 500;
}

.ping-poor {
  color: #f44336;
  font-weight: 600;
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
  
  .teams-container {
    gap: 15px;
  }
  
  .players-table {
    font-size: 11px;
  }
  
  .players-table th,
  .players-table td {
    padding: 4px 8px;
  }
  
  .player-name-cell {
    max-width: 80px;
  }
}
</style>