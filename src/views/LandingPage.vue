<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div class="relative overflow-hidden">
      <!-- Background effects -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20"></div>
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
    <div class="relative z-10 flex flex-col lg:flex-row min-h-screen">
      <!-- Player Search Sidebar -->
      <div class="flex-shrink-0 transition-all duration-300 ease-in-out"
           :class="{
             'lg:w-80 w-full': playerSearchQuery.length >= 2 || playerSuggestions.length > 0,
             'lg:w-72 w-full': !(playerSearchQuery.length >= 2 || playerSuggestions.length > 0)
           }"
      >
        <div class="lg:sticky lg:top-0 lg:h-screen overflow-y-auto bg-slate-800/30 backdrop-blur-md lg:border-r border-b lg:border-b-0 border-slate-700/50">
        <div class="relative m-5">
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm z-10">🔍</div>
          <input
            v-model="playerSearchQuery"
            type="text"
            placeholder="Search players..."
            class="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all duration-300"
            @input="onPlayerSearchInput"
            @keyup.enter="navigateToPlayer"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          >
          <div v-if="isSearchLoading" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 animate-spin">
            🔄
          </div>
        </div>
        <div v-if="showPlayerDropdown" class="mx-5 mb-5 bg-slate-800/80 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-96 overflow-y-auto shadow-2xl">
          <div
            v-for="player in playerSuggestions"
            :key="player.playerName"
            class="p-4 border-b border-slate-700/30 hover:bg-slate-700/40 cursor-pointer transition-all duration-200 last:border-b-0"
            @mousedown.prevent="selectPlayer(player)"
          >
            <div class="space-y-2">
              <div class="font-semibold text-slate-200 text-sm">{{ player.playerName }}</div>
              <div class="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                <span>{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                <span>{{ formatLastSeen(player.lastSeen) }}</span>
                <span v-if="player.isActive" class="text-green-400 font-medium text-xs">🟢 Online</span>
                <span v-else class="text-slate-500 text-xs">⚫ Offline</span>
              </div>
              <div v-if="player.currentServer && player.isActive" class="text-xs text-cyan-400 italic">
                {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
              </div>
            </div>
          </div>
          <div v-if="playerSuggestions.length === 0 && !isSearchLoading && playerSearchQuery.length >= 2" class="p-4 text-center text-slate-400 text-xs italic">
            No players found
          </div>
        </div>
        </div>
      <!-- Main Content Area -->
      <div class="flex-1 p-4 lg:p-6 overflow-x-auto">
        <!-- Game Filter Buttons and Server Count -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4 lg:gap-5">
          <div class="flex gap-2 lg:gap-3 flex-wrap justify-center lg:justify-start">
            <button
              v-for="game in gameTypes.filter(g => g.id !== 'all')"
              :key="game.id"
              :class="[
                'group relative flex items-center justify-center p-2 lg:p-3 rounded-lg lg:rounded-xl border-2 transition-all duration-300 transform hover:scale-105',
                activeFilter === game.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 border-cyan-500/50 shadow-lg shadow-cyan-500/25 text-white'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 text-slate-300 hover:bg-slate-700/70 backdrop-blur-sm'
              ]"
              @click="setActiveFilter(game.id)"
              :title="game.name"
            >
              <div class="relative">
                <div
                  :class="[
                    'w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-cover bg-center transition-all duration-300',
                    activeFilter === game.id ? 'scale-110 brightness-110' : ''
                  ]"
                  :style="{ backgroundImage: getGameIcon(game.iconClass) }"
                ></div>
                <div v-if="activeFilter === game.id" class="absolute -inset-0.5 lg:-inset-1 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full blur animate-pulse"></div>
              </div>
            </button>
          </div>
          <div v-if="!loading && !error" class="text-xs lg:text-sm text-slate-400 text-center lg:text-left whitespace-nowrap">
            Showing {{ sortedServers.length }} servers ({{ servers.length }} total)
          </div>
        </div>

        <!-- Server Table -->
        <div class="flex-1">
          <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
            <div class="relative">
              <div class="w-16 h-16 border-4 border-slate-700 rounded-full animate-spin">
                <div class="absolute top-0 left-0 w-16 h-16 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div class="text-center space-y-2">
              <p class="text-lg font-semibold text-slate-300">Loading server data...</p>
              <p class="text-slate-500 text-sm">Fetching battlefield intelligence</p>
            </div>
          </div>
          <div v-else-if="error" class="flex flex-col items-center justify-center py-20 space-y-4">
            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="text-center space-y-2">
              <p class="text-lg font-semibold text-red-400">{{ error }}</p>
            </div>
          </div>
          <div v-else>
            <div class="bg-slate-800/40 backdrop-blur-lg rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl">
              <div class="overflow-x-auto">
            <table class="w-full border-collapse text-xs lg:text-sm min-w-[800px]">
              <thead>
                <tr class="bg-slate-900/50">
                  <th @click="sortBy('name')" class="p-4 text-left font-semibold text-xs uppercase tracking-wider text-slate-300 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 select-none sticky top-0 z-10">
                    <div class="flex items-center gap-2">
                      Server Name
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-cyan-400 opacity-100': sortField === 'name',
                        'opacity-50': sortField !== 'name',
                        'rotate-0': sortField === 'name' && sortDirection === 'asc',
                        'rotate-180': sortField === 'name' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th @click="sortBy('numPlayers')" class="p-4 text-left font-semibold text-xs uppercase tracking-wider text-slate-300 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 select-none sticky top-0 z-10 min-w-[100px]">
                    <div class="flex items-center gap-2">
                      Players
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-cyan-400 opacity-100': sortField === 'numPlayers',
                        'opacity-50': sortField !== 'numPlayers',
                        'rotate-0': sortField === 'numPlayers' && sortDirection === 'asc',
                        'rotate-180': sortField === 'numPlayers' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th @click="sortBy('mapName')" class="p-4 text-left font-semibold text-xs uppercase tracking-wider text-slate-300 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 select-none sticky top-0 z-10">
                    <div class="flex items-center gap-2">
                      Map
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-cyan-400 opacity-100': sortField === 'mapName',
                        'opacity-50': sortField !== 'mapName',
                        'rotate-0': sortField === 'mapName' && sortDirection === 'asc',
                        'rotate-180': sortField === 'mapName' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th @click="sortBy('roundTimeRemain')" class="p-4 text-left font-semibold text-xs uppercase tracking-wider text-slate-300 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 select-none sticky top-0 z-10 min-w-[100px]">
                    <div class="flex items-center gap-2">
                      Time Left
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-cyan-400 opacity-100': sortField === 'roundTimeRemain',
                        'opacity-50': sortField !== 'roundTimeRemain',
                        'rotate-0': sortField === 'roundTimeRemain' && sortDirection === 'asc',
                        'rotate-180': sortField === 'roundTimeRemain' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th @click="sortBy('gameType')" class="p-4 text-left font-semibold text-xs uppercase tracking-wider text-slate-300 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 select-none sticky top-0 z-10 min-w-[100px]">
                    <div class="flex items-center gap-2">
                      Game
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-cyan-400 opacity-100': sortField === 'gameType',
                        'opacity-50': sortField !== 'gameType',
                        'rotate-0': sortField === 'gameType' && sortDirection === 'asc',
                        'rotate-180': sortField === 'gameType' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th class="p-4 text-left font-semibold text-xs uppercase tracking-wider text-slate-300 sticky top-0 z-10 min-w-[120px]">Connection</th>
                  <th class="p-4 text-center font-semibold text-xs uppercase tracking-wider text-slate-300 sticky top-0 z-10 min-w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="server in sortedServers"
                  :key="server.guid"
                  class="transition-all duration-200 hover:bg-slate-700/30"
                  :class="getServerStatusClass(server)"
                >
                  <td class="p-3 border-b border-slate-700/30 max-w-xs">
                    <router-link :to="`/servers/${encodeURIComponent(server.name)}`" class="block text-slate-200 hover:text-cyan-400 transition-colors duration-200 no-underline">
                      <div class="font-semibold text-sm truncate">{{ server.name }}</div>
                    </router-link>
                  </td>
                  <td class="p-3 border-b border-slate-700/30 cursor-pointer min-w-[100px]" @click="showPlayers(server)">
                    <div class="flex items-center gap-1 font-semibold mb-1" :class="getPlayerCountClass(server)">
                      <span class="text-sm">{{ server.numPlayers }}</span>
                      <span class="text-slate-500 text-sm">/</span>
                      <span class="text-slate-500 text-sm">{{ server.maxPlayers }}</span>
                    </div>
                    <div class="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full transition-all duration-300 rounded-full" :style="{ width: getPlayerPercentage(server) + '%', backgroundColor: getPlayerBarColor(server) }"></div>
                    </div>
                  </td>
                  <td class="p-3 border-b border-slate-700/30 max-w-[200px]">
                    <span class="text-orange-400 font-medium text-sm truncate block">{{ server.mapName }}</span>
                  </td>
                  <td class="p-3 border-b border-slate-700/30 text-center min-w-[100px]">
                    <span class="text-green-400 font-semibold text-xs">{{ formatTimeRemaining(server.roundTimeRemain) }}</span>
                  </td>
                  <td class="p-3 border-b border-slate-700/30 min-w-[100px]">
                    <span class="px-2 py-1 rounded text-xs font-semibold uppercase" :class="getGameTypeClass(server.gameType)">{{ getGameDisplayName(server.gameType) }}</span>
                  </td>
                  <td class="p-3 border-b border-slate-700/30 min-w-[120px]">
                    <span class="font-mono text-xs text-slate-400">{{ server.ip }}:{{ server.port }}</span>
                  </td>
                  <td class="p-3 border-b border-slate-700/30 text-center min-w-[100px]">
                    <button 
                      class="px-3 py-1.5 text-xs font-semibold uppercase transition-all duration-200 rounded border-2"
                      :class="{
                        'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-transparent transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25': server.numPlayers < server.maxPlayers,
                        'bg-slate-600 text-slate-400 cursor-not-allowed opacity-60 border-slate-600': server.numPlayers >= server.maxPlayers
                      }"
                      @click="joinServer(server)" 
                      :disabled="server.numPlayers >= server.maxPlayers"
                    >
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

    <!-- Players Panel -->
    <PlayersPanel
      :show="showPlayersPanel"
      :server="selectedServer"
      @close="closePlayersPanel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllServers } from '../services/serverDetailsService'
import { ServerSummary } from '../types/server'
import { formatLastSeen } from '@/utils/timeUtils'
import PlayersPanel from '../components/PlayersPanel.vue'

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

const getGameIcon = (iconClass: string): string => {
  const iconMap: Record<string, string> = {
    'icon-bf1942': "url('../assets/bf1942.jpg')",
    'icon-fh2': "url('../assets/fh2.jpg')",
    'icon-bfv': "url('../assets/bfv.jpg')"
  }
  return iconMap[iconClass] || "url('../assets/servers.jpg')"
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


// Player-related functions are now handled by PlayersPanel component

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
  if (percentage >= 100) return 'text-red-400'
  if (percentage >= 80) return 'text-orange-400'
  if (percentage >= 40) return 'text-green-400'
  return 'text-blue-400'
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
  if (percentage >= 100) return 'bg-red-500/5'
  if (percentage >= 80) return 'bg-orange-500/5'
  if (percentage === 0) return 'bg-slate-500/5'
  return 'bg-green-500/5'
}

const getGameTypeClass = (gameType: string) => {
  const type = gameType?.toLowerCase() || ''
  if (type.includes('bf1942')) return 'bg-blue-500/20 text-blue-400'
  if (type.includes('fh2')) return 'bg-green-500/20 text-green-400'
  if (type.includes('vietnam')) return 'bg-purple-500/20 text-purple-400'
  return 'bg-slate-500/20 text-slate-400'
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

/* Filters and Count Container */
.filters-and-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

/* Game Filter Buttons */
.game-filters {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
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
  font-size: 14px;
  color: var(--color-text-muted);
  white-space: nowrap;
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

.server-name-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: color 0.2s ease;
}

.server-name-link:hover {
  color: var(--color-primary);
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
  
  .filters-and-count {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .game-filters {
    justify-content: center;
    gap: 8px;
  }
  
  .server-count {
    text-align: center;
    font-size: 13px;
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

/* Players Panel styles are now handled by PlayersPanel component */
</style>