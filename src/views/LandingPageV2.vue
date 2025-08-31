<template>
  <div class="min-h-screen bg-slate-900 px-3 sm:px-6">

    <div class="min-h-screen pt-4">
      <!-- Main Server Table -->
      <div class="w-full">
        <!-- Header -->
        <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-3">
          <!-- Mobile: Player Search Full Width -->
          <div class="block lg:hidden w-full mb-4">
            <div class="relative group">
              <!-- Search Icon with Glow -->
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                  <span class="text-slate-900 text-xs font-bold">🔍</span>
                </div>
              </div>
              
              <!-- Enhanced Search Input -->
              <input
                v-model="playerSearchQuery"
                type="text"
                placeholder="Search players..."
                class="w-full pl-14 pr-14 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/20 focus:shadow-cyan-500/30"
                @input="onPlayerSearchInput"
                @keyup.enter="navigateToPlayer"
                @focus="onSearchFocus"
                @blur="onSearchBlur"
              >
              
              <!-- Loading Spinner -->
              <div v-if="isSearchLoading" class="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
              </div>
              
              <!-- Search Glow Effect -->
              <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              <!-- Enhanced Player Dropdown -->
              <div v-if="showPlayerDropdown" class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50">
                <div
                  v-for="player in playerSuggestions"
                  :key="player.playerName"
                  class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                  @mousedown.prevent="selectPlayer(player)"
                >
                  <div class="space-y-2">
                    <div class="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors">{{ player.playerName }}</div>
                    <div class="flex items-center gap-3 flex-wrap text-xs">
                      <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                      <span v-if="player.isActive" class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full">
                        🟢 ONLINE
                      </span>
                      <span v-else class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-500/20 border border-slate-500/30 rounded-full">
                        ⚫ OFFLINE
                      </span>
                    </div>
                    <div v-if="player.currentServer && player.isActive" class="text-xs text-cyan-400 font-medium">
                      🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                    </div>
                  </div>
                </div>
                <div v-if="playerSuggestions.length === 0 && !isSearchLoading && playerSearchQuery.length >= 2" class="p-4 text-center text-slate-400 text-sm font-medium">
                  🔍 No players found
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop: Original Layout -->
          <div class="hidden lg:flex lg:items-center lg:justify-between gap-4">
            <!-- Game Filter Buttons -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="game in gameTypes.filter(g => g.id !== 'all')"
                :key="game.id"
                :class="[
                  'group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
                  activeFilter === game.id
                    ? 'bg-slate-700 border-slate-600 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
                ]"
                @click="setActiveFilter(game.id)"
              >
                <div
                  class="w-6 h-6 rounded bg-cover bg-center"
                  :style="{ backgroundImage: getGameIcon(game.iconClass) }"
                ></div>
                <div class="text-sm font-medium hidden sm:block">{{ game.name }}</div>
              </button>
            </div>
            
            <!-- Player Search -->
            <div class="flex justify-end">
              <div class="relative group">
                <!-- Search Icon with Glow -->
                <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                    <span class="text-slate-900 text-xs font-bold">🔍</span>
                  </div>
                </div>
                
                <!-- Enhanced Search Input -->
                <input
                  v-model="playerSearchQuery"
                  type="text"
                  placeholder="Search players..."
                  class="w-80 pl-14 pr-14 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/20 focus:shadow-cyan-500/30"
                  @input="onPlayerSearchInput"
                  @keyup.enter="navigateToPlayer"
                  @focus="onSearchFocus"
                  @blur="onSearchBlur"
                >
                
                <!-- Loading Spinner -->
                <div v-if="isSearchLoading" class="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                </div>
                
                <!-- Search Glow Effect -->
                <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                <!-- Enhanced Player Dropdown -->
                <div v-if="showPlayerDropdown" class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50">
                  <div
                    v-for="player in playerSuggestions"
                    :key="player.playerName"
                    class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                    @mousedown.prevent="selectPlayer(player)"
                  >
                    <div class="space-y-2">
                      <div class="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors">{{ player.playerName }}</div>
                      <div class="flex items-center gap-3 flex-wrap text-xs">
                        <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                        <span v-if="player.isActive" class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full">
                          🟢 ONLINE
                        </span>
                        <span v-else class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-500/20 border border-slate-500/30 rounded-full">
                          ⚫ OFFLINE
                        </span>
                      </div>
                      <div v-if="player.currentServer && player.isActive" class="text-xs text-cyan-400 font-medium">
                        🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                      </div>
                    </div>
                  </div>
                  <div v-if="playerSuggestions.length === 0 && !isSearchLoading && playerSearchQuery.length >= 2" class="p-4 text-center text-slate-400 text-sm font-medium">
                    🔍 No players found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile: Game Filter Buttons (Above Table) -->
        <div class="block lg:hidden p-3 border-b border-slate-700/30">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="game in gameTypes.filter(g => g.id !== 'all')"
              :key="game.id"
              :class="[
                'group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
                activeFilter === game.id
                  ? 'bg-slate-700 border-slate-600 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
              ]"
              @click="setActiveFilter(game.id)"
            >
              <div
                class="w-6 h-6 rounded bg-cover bg-center"
                :style="{ backgroundImage: getGameIcon(game.iconClass) }"
              ></div>
              <div class="text-sm font-medium">{{ game.name }}</div>
            </button>
          </div>
        </div>

        <!-- Player History Section -->
        <div class="border-b border-slate-700/30">
          <!-- Toggle Button -->
          <div class="p-3">
            <button
              @click="togglePlayerHistory"
              class="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-all duration-300 group"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span class="text-slate-900 text-sm font-bold">📈</span>
                </div>
                <div class="text-left">
                  <div class="text-sm font-medium text-slate-200">Player Activity History</div>
                  <div class="text-xs text-slate-400">{{ getActiveGameName() }} population trends</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400 hidden sm:block">{{ showPlayerHistory ? 'Hide' : 'Show' }}</span>
                <div class="transform transition-transform duration-300" :class="{ 'rotate-180': showPlayerHistory }">
                  <svg class="w-5 h-5 text-slate-400 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </button>
          </div>

          <!-- Collapsible History Content -->
          <div 
            v-if="showPlayerHistory" 
            class="px-3 pb-3 space-y-3 animate-in slide-in-from-top duration-300"
          >
            <!-- Period Selector -->
            <div class="flex justify-center gap-1 bg-slate-800/30 rounded-lg p-1">
              <button
                v-for="period in ['1d', '3d', '7d']"
                :key="period"
                @click="changePeriod(period as '1d' | '3d' | '7d')"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
                  historyPeriod === period
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                ]"
              >
                {{ period === '1d' ? '24h' : period === '3d' ? '3 days' : '7 days' }}
              </button>
            </div>

            <!-- Chart Container -->
            <div class="bg-slate-800/20 rounded-lg p-4">
              <PlayerHistoryChart
                :chartData="playerHistoryData"
                :loading="historyLoading"
                :error="historyError"
              />
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="text-center space-y-6">
            <div class="relative flex items-center justify-center">
              <div class="w-20 h-20 border-4 border-slate-700 rounded-full animate-spin"></div>
              <div class="absolute w-20 h-20 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
              <div class="absolute w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse"></div>
            </div>
            <div class="text-lg font-semibold text-white">
              Loading servers...
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex items-center justify-center py-20">
          <div class="text-center space-y-4">
            <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="text-lg font-semibold text-red-400">{{ error }}</div>
          </div>
        </div>

        <!-- Server Table -->
        <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse border border-slate-700/30">
              <!-- Table Header -->
              <thead class="sticky top-0 z-10">
                <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                  <th class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                    <div class="flex items-center justify-between gap-2">
                      <div @click="sortBy('name')" class="flex items-center gap-1.5 cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 transition-all duration-300 hover:border-cyan-500/50">
                        <span class="text-slate-400 text-xs">🏷️</span>
                        <span class="font-mono font-bold">NAME</span>
                        <span class="text-xs transition-transform duration-200" :class="{
                          'text-cyan-400 opacity-100': sortField === 'name',
                          'opacity-50': sortField !== 'name',
                          'rotate-0': sortField === 'name' && sortDirection === 'asc',
                          'rotate-180': sortField === 'name' && sortDirection === 'desc'
                        }">▲</span>
                      </div>
                      <div @click="sortBy('timezone')" class="flex items-center gap-1 cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 transition-all duration-300 hover:border-yellow-500/50">
                        <span class="text-yellow-400 text-xs">🌍</span>
                        <span class="font-mono font-bold text-xs">TIME</span>
                        <span class="text-xs transition-transform duration-200" :class="{
                          'text-yellow-400 opacity-100': sortField === 'timezone',
                          'opacity-50': sortField !== 'timezone',
                          'rotate-0': sortField === 'timezone' && sortDirection === 'asc',
                          'rotate-180': sortField === 'timezone' && sortDirection === 'desc'
                        }">▲</span>
                      </div>
                    </div>
                  </th>
                  <th @click="sortBy('numPlayers')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-green-500/50">
                    <div class="flex items-center gap-1.5">
                      <span class="text-green-400 text-xs">👥</span>
                      <span class="font-mono font-bold">PLAYERS</span>
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-green-400 opacity-100': sortField === 'numPlayers',
                        'opacity-50': sortField !== 'numPlayers',
                        'rotate-0': sortField === 'numPlayers' && sortDirection === 'asc',
                        'rotate-180': sortField === 'numPlayers' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th @click="sortBy('mapName')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50">
                    <div class="flex items-center gap-1.5">
                      <span class="text-orange-400 text-xs">🗺️</span>
                      <span class="font-mono font-bold">MAP</span>
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-orange-400 opacity-100': sortField === 'mapName',
                        'opacity-50': sortField !== 'mapName',
                        'rotate-0': sortField === 'mapName' && sortDirection === 'asc',
                        'rotate-180': sortField === 'mapName' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th @click="sortBy('roundTimeRemain')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-yellow-500/50">
                    <div class="flex items-center gap-1.5">
                      <span class="text-yellow-400 text-xs">⏱️</span>
                      <span class="font-mono font-bold">TIME</span>
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-yellow-400 opacity-100': sortField === 'roundTimeRemain',
                        'opacity-50': sortField !== 'roundTimeRemain',
                        'rotate-0': sortField === 'roundTimeRemain' && sortDirection === 'asc',
                        'rotate-180': sortField === 'roundTimeRemain' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th @click="sortBy('gameType')" class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-purple-500/50">
                    <div class="flex items-center gap-1.5">
                      <span class="text-purple-400 text-xs">🎮</span>
                      <span class="font-mono font-bold">MODE</span>
                      <span class="text-xs transition-transform duration-200" :class="{
                        'text-purple-400 opacity-100': sortField === 'gameType',
                        'opacity-50': sortField !== 'gameType',
                        'rotate-0': sortField === 'gameType' && sortDirection === 'asc',
                        'rotate-180': sortField === 'gameType' && sortDirection === 'desc'
                      }">▲</span>
                    </div>
                  </th>
                  <th class="p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                    <div class="flex items-center gap-1.5">
                      <span class="text-blue-400 text-xs">🔗</span>
                      <span class="font-mono font-bold">IP</span>
                    </div>
                  </th>
                  <th class="p-1.5 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                    <div class="flex items-center justify-center gap-1.5">
                      <span class="text-red-400 text-xs">⚔️</span>
                      <span class="font-mono font-bold">JOIN</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody>
                <tr
                  v-for="server in sortedServers"
                  :key="server.guid"
                  class="group transition-all duration-300 hover:bg-slate-800/20 border-b border-slate-700/30"
                  :class="getServerStatusClass(server)"
                >
                  <!-- Server Name -->
                  <td class="p-1.5">
                    <router-link 
                      :to="`/servers/${encodeURIComponent(server.name)}`" 
                      class="block group-hover:text-cyan-400 transition-all duration-300 no-underline"
                    >
                      <div class="flex items-center gap-2">
                        <span v-if="server.country" class="text-lg">{{ getCountryFlag(server.country) }}</span>
                        <div class="flex-1 min-w-0">
                          <div class="font-bold text-slate-200 truncate max-w-xs text-sm">{{ server.name }}</div>
                          <div v-if="getTimezoneDisplay(server.timezone)" class="text-xs text-slate-400 font-mono">
                            {{ getTimezoneDisplay(server.timezone) }}
                          </div>
                        </div>
                      </div>
                    </router-link>
                  </td>

                  <!-- Players -->
                  <td class="p-1.5 cursor-pointer" @click="showPlayers(server)">
                    <div class="flex items-center gap-2">
                      <div class="flex items-center gap-1 font-bold" :class="getPlayerCountClass(server)">
                        <span class="text-sm font-mono">{{ server.numPlayers }}</span>
                        <span class="text-slate-500 text-xs font-mono">/{{ server.maxPlayers }}</span>
                      </div>
                      <div class="flex-1 max-w-[80px]">
                        <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            class="h-full transition-all duration-500 rounded-full" 
                            :style="{ 
                              width: getPlayerPercentage(server) + '%', 
                              backgroundColor: getPlayerBarColor(server),
                              boxShadow: `0 0 6px ${getPlayerBarColor(server)}60`
                            }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Map -->
                  <td class="p-1.5">
                    <div class="font-bold text-orange-400 text-xs truncate max-w-[180px] font-mono uppercase">{{ server.mapName }}</div>
                  </td>

                  <!-- Time Remaining -->
                  <td class="p-1.5">
                    <div class="text-center">
                      <div class="text-green-400 font-bold text-xs font-mono">{{ formatTimeRemaining(server.roundTimeRemain) }}</div>
                    </div>
                  </td>

                  <!-- Game Type -->
                  <td class="p-1.5">
                    <div class="flex items-center gap-1.5">
                      <div 
                        class="w-5 h-5 rounded bg-cover bg-center border border-slate-600/50"
                        :style="{ backgroundImage: getGameIcon(getGameIconClass(server.gameType)) }"
                      ></div>
                      <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase font-mono" :class="getGameTypeClass(server.gameType)">
                        {{ getGameDisplayName(server.gameType) }}
                      </span>
                    </div>
                  </td>

                  <!-- Connection -->
                  <td class="p-1.5">
                    <div class="text-center">
                      <div class="font-mono text-xs text-slate-400 font-medium">{{ server.ip }}:{{ server.port }}</div>
                    </div>
                  </td>

                  <!-- Action -->
                  <td class="p-1.5">
                    <div class="flex justify-center">
                      <button 
                        class="px-2.5 py-1 text-xs font-bold uppercase transition-all duration-300 rounded-lg border font-mono"
                        :class="{
                          'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-600 shadow-lg hover:shadow-blue-500/30 transform hover:scale-105': server.numPlayers < server.maxPlayers,
                          'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60 border-slate-600': server.numPlayers >= server.maxPlayers
                        }"
                        @click="joinServer(server)" 
                        :disabled="server.numPlayers >= server.maxPlayers"
                      >
                        {{ server.numPlayers >= server.maxPlayers ? 'FULL' : 'JOIN' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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
import { PlayerHistoryDataPoint } from '../types/playerStatsTypes'
import PlayersPanel from '../components/PlayersPanel.vue'
import PlayerHistoryChart from '../components/PlayerHistoryChart.vue'
import { fetchPlayerOnlineHistory } from '../services/playerStatsService'

import bf1942Icon from '@/assets/bf1942.jpg'
import fh2Icon from '@/assets/fh2.jpg'
import bfvIcon from '@/assets/bfv.jpg'

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

// Player history state
const showPlayerHistory = ref(false)
const playerHistoryData = ref<PlayerHistoryDataPoint[]>([])
const historyPeriod = ref<'1d' | '3d' | '7d'>('1d')
const historyLoading = ref(false)
const historyError = ref<string | null>(null)

// Computed properties
const filteredServers = computed(() => {
  return servers.value
})

const getTimezoneOffset = (timezone: string | undefined): number => {
  if (!timezone) return 999 // Sort servers without timezone to the end
  try {
    const now = new Date()
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const offsetMinutes = (tzDate.getTime() - now.getTime()) / 60000
    return Math.round(offsetMinutes / 60)
  } catch {
    return 999
  }
}

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
      case 'timezone':
        // Sort by absolute timezone offset (closest to user's time first)
        aVal = Math.abs(getTimezoneOffset(a.timezone))
        bVal = Math.abs(getTimezoneOffset(b.timezone))
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

// Helper functions
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit' 
  })
}

const getServerCount = (gameType: string) => {
  if (gameType === activeFilter.value) {
    return servers.value.length
  }
  return 0
}

const getTotalPlayers = () => {
  return servers.value.reduce((total, server) => total + server.numPlayers, 0)
}

const getServerRegion = (server: ServerSummary) => {
  // Simple region detection based on server name or IP
  const name = server.name.toLowerCase()
  if (name.includes('us') || name.includes('america')) return 'US'
  if (name.includes('eu') || name.includes('europe')) return 'EU'
  if (name.includes('asia') || name.includes('jp')) return 'ASIA'
  return 'Global'
}

const getMapType = (mapName: string) => {
  // Simple map type detection
  if (!mapName) return 'Unknown'
  if (mapName.toLowerCase().includes('city') || mapName.toLowerCase().includes('urban')) return 'Urban'
  if (mapName.toLowerCase().includes('desert') || mapName.toLowerCase().includes('sand')) return 'Desert'
  if (mapName.toLowerCase().includes('forest') || mapName.toLowerCase().includes('wood')) return 'Forest'
  if (mapName.toLowerCase().includes('island') || mapName.toLowerCase().includes('beach')) return 'Island'
  return 'Mixed'
}

const getGameIconClass = (gameType: string) => {
  const type = gameType?.toLowerCase() || ''
  if (type.includes('bf1942')) return 'icon-bf1942'
  if (type.includes('fh2')) return 'icon-fh2'
  if (type.includes('vietnam')) return 'icon-bfv'
  return 'icon-bf1942'
}

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
  
  const minutes = Math.floor(timeValue / 100)
  const seconds = timeValue % 100
  
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
  
  const routeMap = {
    'bf1942': '/servers/bf1942',
    'fh2': '/servers/fh2',
    'bfvietnam': '/servers/bfv'
  }
  
  const newRoute = routeMap[filterId as keyof typeof routeMap]
  if (newRoute && router.currentRoute.value.path !== newRoute) {
    router.push(newRoute)
  }
}

const getGameDisplayName = (gameType: string): string => {
  return gameType || 'Unknown'
}

const getGameIcon = (iconClass: string): string => {
  const iconMap: Record<string, string> = {
    'icon-bf1942': `url('${bf1942Icon}')`,
    'icon-fh2': `url('${fh2Icon}')`,
    'icon-bfv': `url('${bfvIcon}')`
  }
  return iconMap[iconClass] || `url('${bf1942Icon}')`
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

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    // Default sorting directions
    if (field === 'numPlayers') {
      sortDirection.value = 'desc'
    } else if (field === 'timezone') {
      sortDirection.value = 'asc' // Closest timezone first
    } else {
      sortDirection.value = 'asc'
    }
  }
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
  if (type.includes('bf1942')) return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  if (type.includes('fh2')) return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (type.includes('vietnam')) return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
  return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
}

const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return ''
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  
  return String.fromCodePoint(...codePoints)
}

const getTimezoneDisplay = (timezone: string | undefined): string | null => {
  if (!timezone) return null
  try {
    const now = new Date()
    const time = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit', minute: '2-digit', timeZone: timezone
    }).format(now)
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const offsetMinutes = (tzDate.getTime() - now.getTime()) / 60000
    const offsetHours = Math.round(offsetMinutes / 60)
    
    if (offsetHours === 0) {
      return `${time} (Same as you)`
    }
    
    const sign = offsetHours > 0 ? '+' : '-'
    return `${time} (${sign}${Math.abs(offsetHours)} hours)`
  } catch {
    return timezone
  }
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

const fetchPlayerHistory = async () => {
  historyLoading.value = true
  historyError.value = null
  
  try {
    const response = await fetchPlayerOnlineHistory(
      activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam',
      historyPeriod.value
    )
    playerHistoryData.value = response.dataPoints
  } catch (err) {
    historyError.value = 'Failed to load player history'
    console.error('Error fetching player history:', err)
  } finally {
    historyLoading.value = false
  }
}

const togglePlayerHistory = () => {
  showPlayerHistory.value = !showPlayerHistory.value
  if (showPlayerHistory.value && playerHistoryData.value.length === 0) {
    fetchPlayerHistory()
  }
}

const changePeriod = (period: '1d' | '3d' | '7d') => {
  historyPeriod.value = period
  fetchPlayerHistory()
}

const getActiveGameName = () => {
  const gameType = gameTypes.find(g => g.id === activeFilter.value)
  return gameType?.name || 'Game'
}

// Watch for game filter changes and fetch new data
watch(activeFilter, (newFilter) => {
  fetchServersForGame(newFilter as 'bf1942' | 'fh2' | 'bfvietnam', true)
  // Also refresh player history if it's visible
  if (showPlayerHistory.value) {
    fetchPlayerHistory()
  }
})

// Lifecycle
onMounted(() => {
  fetchServersForGame(activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam', true)
  
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
/* Custom animations for enhanced gaming feel */
@keyframes animate-spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: animate-spin-slow 3s linear infinite;
}

/* Game icon backgrounds - handled dynamically by getGameIcon() */

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.7);
}

/* Enhanced table row hover effects */
tbody tr:hover {
  /* Removed transform and box-shadow to prevent wobbling */
}

/* Clean typography for the entire table */
table {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Compact row spacing with better typography */
tbody tr {
  height: 32px;
}

/* Gaming-style glow effects */
.glow-cyan {
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
}

.glow-green {
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
}

.glow-orange {
  box-shadow: 0 0 10px rgba(251, 146, 60, 0.4);
}

/* Search input focus glow */
input:focus {
  box-shadow: 0 0 0 1px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.2);
}

/* Responsive table behavior */
@media (max-width: 1024px) {
  table {
    min-width: 800px;
  }
}

@media (max-width: 768px) {
  table {
    min-width: 700px;
  }
  
  /* Make table cells more compact on mobile */
  th, td {
    padding: 0.5rem 0.25rem;
  }
  
  /* Hide less critical columns on very small screens */
  th:nth-child(4), td:nth-child(4), /* Time column */
  th:nth-child(6), td:nth-child(6) { /* IP column */
    display: none;
  }
}
</style>