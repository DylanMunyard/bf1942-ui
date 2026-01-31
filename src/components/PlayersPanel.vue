<template>
  <!-- Inline: render only panel content (no overlay). Side-by-side layout when space allows. -->
  <template v-if="show && inline">
    <div
      class="bg-neutral-950 w-full h-full min-h-0 shadow-xl overflow-hidden flex flex-col border-l border-neutral-700/50"
      @click.stop
    >
      <!-- Header -->
      <div class="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-700/50 p-4 flex justify-between items-center">
        <div class="flex flex-col min-w-0 flex-1 mr-4">
          <h2 class="text-xl font-bold text-cyan-400 truncate">
            {{ server?.name || 'Players' }}
          </h2>
          <div class="flex flex-col sm:flex-row sm:gap-4 mt-1">
            <p
              v-if="server?.mapName"
              class="text-sm text-neutral-400 font-mono truncate"
            >
              🗺️ {{ server.mapName }}
            </p>
            <p
              v-if="server?.roundTimeRemain !== undefined && server?.roundTimeRemain !== -1"
              class="text-sm text-neutral-400 font-mono"
            >
              ⏱️ {{ formatTimeRemaining(server.roundTimeRemain) }}
            </p>
          </div>
        </div>
        <button
          class="group p-2 text-neutral-400 hover:text-white hover:bg-red-500/20 border border-neutral-600/50 hover:border-red-500/50 rounded-lg transition-all duration-300 flex items-center justify-center w-10 h-10 flex-shrink-0"
          title="Close panel"
          @click="$emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="group-hover:text-red-400"
          >
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div
          v-if="server?.teams"
          class="p-4 space-y-6"
        >
          <div
            v-for="team in server.teams"
            :key="team.index"
            class="bg-gradient-to-r from-neutral-800/60 to-neutral-900/60 backdrop-blur-lg rounded-xl border border-neutral-700/50 overflow-hidden"
          >
            <!-- Team Header -->
            <div class="bg-gradient-to-r from-neutral-800/95 to-neutral-900/95 backdrop-blur-sm p-4 border-b border-neutral-700/50">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-bold text-neutral-200">
                  {{ team.label }}
                </h3>
                <div class="px-3 py-1 bg-neutral-700/50 backdrop-blur-sm rounded-full text-sm text-neutral-300 border border-neutral-600/50 font-mono">
                  {{ team.tickets }} tickets
                </div>
              </div>
            </div>

            <!-- Team Table -->
            <div class="overflow-hidden">
              <table class="w-full border-collapse">
                <!-- Table Header -->
                <thead class="sticky top-0 z-10">
                  <tr class="bg-gradient-to-r from-neutral-800/95 to-neutral-900/95 backdrop-blur-sm">
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-cyan-500/50"
                      @click="sortPlayersBy('name')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-cyan-400 text-xs">👤</span>
                        <span class="font-mono font-bold">PLAYER</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-cyan-400 opacity-100': playerSortField === 'name',
                            'opacity-50': playerSortField !== 'name',
                            'rotate-0': playerSortField === 'name' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'name' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-green-500/50"
                      @click="sortPlayersBy('score')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-green-400 text-xs">🏆</span>
                        <span class="font-mono font-bold">SCORE</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-green-400 opacity-100': playerSortField === 'score',
                            'opacity-50': playerSortField !== 'score',
                            'rotate-0': playerSortField === 'score' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'score' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-red-500/50"
                      @click="sortPlayersBy('kills')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-red-400 text-xs">⚔️</span>
                        <span class="font-mono font-bold">KILLS</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-red-400 opacity-100': playerSortField === 'kills',
                            'opacity-50': playerSortField !== 'kills',
                            'rotate-0': playerSortField === 'kills' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'kills' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-orange-500/50"
                      @click="sortPlayersBy('deaths')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-orange-400 text-xs">💀</span>
                        <span class="font-mono font-bold">DEATHS</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-orange-400 opacity-100': playerSortField === 'deaths',
                            'opacity-50': playerSortField !== 'deaths',
                            'rotate-0': playerSortField === 'deaths' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'deaths' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-blue-500/50"
                      @click="sortPlayersBy('ping')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-blue-400 text-xs">📡</span>
                        <span class="font-mono font-bold">PING</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-blue-400 opacity-100': playerSortField === 'ping',
                            'opacity-50': playerSortField !== 'ping',
                            'rotate-0': playerSortField === 'ping' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'ping' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <!-- Table Body -->
                <tbody>
                  <tr
                    v-for="player in getSortedTeamPlayers(team.index)"
                    :key="player.name"
                    class="group transition-all duration-300 hover:bg-neutral-800/30 border-b border-neutral-700/30 cursor-pointer"
                    @click="navigateToPlayerProfile(player.name)"
                  >
                    <!-- Player Name -->
                    <td class="p-1.5">
                      <div class="font-bold text-neutral-200 text-sm truncate max-w-xs group-hover:text-cyan-400 transition-colors duration-300 font-mono">
                        {{ player.name }}
                      </div>
                    </td>

                    <!-- Score -->
                    <td class="p-1.5">
                      <div
                        class="text-sm font-mono font-bold"
                        :class="getScoreClass(player.score)"
                      >
                        {{ player.score }}
                      </div>
                    </td>

                    <!-- Kills -->
                    <td class="p-1.5">
                      <div
                        class="text-sm font-mono font-bold"
                        :class="getKillsClass(player.kills)"
                      >
                        {{ player.kills }}
                      </div>
                    </td>

                    <!-- Deaths -->
                    <td class="p-1.5">
                      <div
                        class="text-sm font-mono font-bold"
                        :class="getDeathsClass(player.deaths)"
                      >
                        {{ player.deaths }}
                      </div>
                    </td>

                    <!-- Ping -->
                    <td class="p-1.5">
                      <div
                        class="text-sm font-mono"
                        :class="getPingClass(player.ping)"
                      >
                        {{ player.ping }}ms
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  <!-- Overlay: fixed full-screen with backdrop (mobile / when not side-by-side) -->
  <div
    v-else-if="show"
    class="modal-mobile-safe fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center"
    @click="$emit('close')"
  >
    <div 
      class="bg-neutral-950 w-full max-w-6xl shadow-2xl animate-slide-in-left overflow-hidden flex flex-col border-r border-neutral-700/50 ml-0 mr-0 md:mr-20" 
      :class="{ 'h-[calc(100vh-4rem)]': true, 'md:h-full': true, 'mt-16': true, 'md:mt-0': true }"
      @click.stop
    >
      <!-- Header -->
      <div class="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-700/50 p-4 flex justify-between items-center">
        <div class="flex flex-col min-w-0 flex-1 mr-4">
          <h2 class="text-xl font-bold text-cyan-400 truncate">
            {{ server?.name || 'Players' }}
          </h2>
          <div class="flex flex-col sm:flex-row sm:gap-4 mt-1">
            <p
              v-if="server?.mapName"
              class="text-sm text-neutral-400 font-mono truncate"
            >
              🗺️ {{ server.mapName }}
            </p>
            <p
              v-if="server?.roundTimeRemain !== undefined && server?.roundTimeRemain !== -1"
              class="text-sm text-neutral-400 font-mono"
            >
              ⏱️ {{ formatTimeRemaining(server.roundTimeRemain) }}
            </p>
          </div>
        </div>
        <button 
          class="group p-2 text-neutral-400 hover:text-white hover:bg-red-500/20 border border-neutral-600/50 hover:border-red-500/50 rounded-lg transition-all duration-300 flex items-center justify-center w-10 h-10 flex-shrink-0"
          title="Close panel"
          @click="$emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="group-hover:text-red-400"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-if="server?.teams"
          class="p-4 space-y-6"
        >
          <div
            v-for="team in server.teams"
            :key="team.index"
            class="bg-gradient-to-r from-neutral-800/60 to-neutral-900/60 backdrop-blur-lg rounded-xl border border-neutral-700/50 overflow-hidden"
          >
            <!-- Team Header -->
            <div class="bg-gradient-to-r from-neutral-800/95 to-neutral-900/95 backdrop-blur-sm p-4 border-b border-neutral-700/50">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-bold text-neutral-200">
                  {{ team.label }}
                </h3>
                <div class="px-3 py-1 bg-neutral-700/50 backdrop-blur-sm rounded-full text-sm text-neutral-300 border border-neutral-600/50 font-mono">
                  {{ team.tickets }} tickets
                </div>
              </div>
            </div>

            <!-- Team Table -->
            <div class="overflow-hidden">
              <table class="w-full border-collapse">
                <!-- Table Header -->
                <thead class="sticky top-0 z-10">
                  <tr class="bg-gradient-to-r from-neutral-800/95 to-neutral-900/95 backdrop-blur-sm">
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-cyan-500/50"
                      @click="sortPlayersBy('name')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-cyan-400 text-xs">👤</span>
                        <span class="font-mono font-bold">PLAYER</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-cyan-400 opacity-100': playerSortField === 'name',
                            'opacity-50': playerSortField !== 'name',
                            'rotate-0': playerSortField === 'name' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'name' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-green-500/50"
                      @click="sortPlayersBy('score')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-green-400 text-xs">🏆</span>
                        <span class="font-mono font-bold">SCORE</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-green-400 opacity-100': playerSortField === 'score',
                            'opacity-50': playerSortField !== 'score',
                            'rotate-0': playerSortField === 'score' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'score' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                    <th
                      class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-cyan-500/50"
                      @click="sortPlayersBy('ping')"
                    >
                      <div class="flex items-center gap-1.5">
                        <span class="text-cyan-400 text-xs">📶</span>
                        <span class="font-mono font-bold">PING</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-cyan-400 opacity-100': playerSortField === 'ping',
                            'opacity-50': playerSortField !== 'ping',
                            'rotate-0': playerSortField === 'ping' && playerSortDirection === 'asc',
                            'rotate-180': playerSortField === 'ping' && playerSortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(player, idx) in getSortedTeamPlayers(team.index)"
                    :key="idx"
                    class="group border-b border-neutral-700/30 hover:bg-neutral-700/30 transition-all duration-200 cursor-pointer"
                    @click="navigateToPlayerProfile(player.name)"
                  >
                    <td class="p-1.5">
                      <div class="font-mono font-bold text-neutral-200 group-hover:text-cyan-400 transition-colors truncate">
                        {{ player.name }}
                      </div>
                    </td>
                    <td class="p-1.5">
                      <div
                        class="text-sm font-mono font-bold"
                        :class="getScoreClass(player.score)"
                      >
                        {{ player.score }}
                      </div>
                    </td>
                    <td class="p-1.5">
                      <div
                        class="text-sm font-mono"
                        :class="getPingClass(player.ping)"
                      >
                        {{ player.ping }}ms
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ServerSummary } from '../types/server'
import { formatTimeRemaining } from '../utils/timeUtils'

interface Props {
  show: boolean
  server: ServerSummary | null
  /** When true, render only panel content (no overlay) for side-by-side layout on wide screens */
  inline?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()

// Players panel state
const playerSortField = ref('score')
const playerSortDirection = ref('desc')

const navigateToPlayerProfile = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`)
}

const getScoreClass = (score: number) => {
  if (score >= 100) return 'text-green-400'
  if (score >= 50) return 'text-blue-400'
  if (score >= 25) return 'text-orange-400'
  return 'text-neutral-400'
}

const getKillsClass = (kills: number) => {
  if (kills >= 30) return 'text-red-400'
  if (kills >= 15) return 'text-orange-400'
  if (kills >= 5) return 'text-green-400'
  return 'text-neutral-400'
}

const getDeathsClass = (deaths: number) => {
  if (deaths >= 20) return 'text-red-400'
  if (deaths >= 10) return 'text-orange-400'
  if (deaths >= 5) return 'text-green-400'
  return 'text-blue-400'
}

const getPingClass = (ping: number) => {
  if (ping <= 50) return 'text-green-400'
  if (ping <= 100) return 'text-blue-400'
  if (ping <= 150) return 'text-orange-400'
  return 'text-red-400'
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
  if (!props.server?.players) return []
  
  const teamPlayers = props.server.players.filter(player => player.team === teamIndex)
  
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
</script>

<style scoped>
@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}
</style>