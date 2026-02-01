<template>
  <div class="portal-page" @click="closeAllModals">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner px-0 sm:px-6">
    <div
      class="pt-4 flex flex-col min-h-0 min-h-screen"
      :class="{ 'lg:flex-row': showPlayersPanel && isWideScreen }"
    >
      <!-- Main Server Table -->
      <div class="flex-1 min-w-0 w-full">
        <!-- Header -->
        <div class="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-700/50 p-1 sm:p-3">
          <!-- Mobile: Player Search Full Width -->
          <div class="block lg:hidden w-full mb-4">
            <PlayerSearch
              v-model="playerSearchQuery"
              :full-width="true"
              @select="selectPlayer"
              @enter="navigateToPlayer"
            />
          </div>

          <!-- Desktop: Original Layout -->
          <div class="hidden lg:flex lg:items-center lg:justify-between gap-4">
            <!-- Game Filter Buttons -->
            <GameFilterButtons
              :game-types="gameTypes"
              :active-filter="activeFilter"
              :get-game-icon="getGameIcon"
              @update:active-filter="setActiveFilter"
            />
            
            <!-- Installation Links & Player Search -->
            <div class="flex items-center gap-4 justify-end">
              <!-- Installation Links Dropdown -->
              <InstallationLinksDropdown ref="installDropdownRef" />

              <!-- Player Search -->
              <PlayerSearch
                v-model="playerSearchQuery"
                @select="selectPlayer"
                @enter="navigateToPlayer"
              />
            </div>
          </div>
        </div>

        <!-- Mobile: Game Filter Buttons (Above Table) -->
        <div class="block lg:hidden p-2 sm:p-3 border-b border-neutral-700/30">
          <GameFilterButtons
            :game-types="gameTypes"
            :active-filter="activeFilter"
            :get-game-icon="getGameIcon"
            @update:active-filter="setActiveFilter"
          />
        </div>

        <!-- Player History Section -->
        <PlayerHistorySection
          :active-game-name="getActiveGameName()"
          :player-history-data="playerHistoryData"
          :player-history-insights="playerHistoryInsights"
          :history-period="historyPeriod"
          :longer-period="longerPeriod"
          :history-rolling-window="historyRollingWindow"
          :history-loading="historyLoading"
          :history-error="historyError"
          ref="playerHistorySectionRef"
          @toggle="togglePlayerHistory"
          @period-change="changePeriod"
          @longer-period-change="selectLongerPeriod"
          @rolling-window-change="changeRollingWindow"
        />

        <!-- Loading State -->
        <div
          v-if="loading"
          class="flex items-center justify-center py-20"
        >
          <div class="text-center space-y-6">
            <div class="relative flex items-center justify-center">
              <div class="w-20 h-20 border-4 border-neutral-700 rounded-full animate-spin" />
              <div class="absolute w-20 h-20 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin" />
              <div class="absolute w-8 h-8 bg-cyan-500 rounded-full animate-pulse" style="box-shadow: 0 0 15px rgba(0, 255, 242, 0.5);" />
            </div>
            <div class="text-lg font-semibold text-white">
              Loading servers...
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex items-center justify-center py-20"
        >
          <div class="text-center space-y-4">
            <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-red-400"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />
                <line
                  x1="15"
                  y1="9"
                  x2="9"
                  y2="15"
                />
                <line
                  x1="9"
                  y1="9"
                  x2="15"
                  y2="15"
                />
              </svg>
            </div>
            <div class="text-lg font-semibold text-red-400">
              {{ error }}
            </div>
          </div>
        </div>

        <!-- Server Table -->
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full border-collapse border border-neutral-700/30">
            <!-- Table Header -->
            <thead class="sticky top-0 z-10">
              <tr class="bg-gradient-to-r from-neutral-900/95 to-neutral-950/95 backdrop-blur-sm">
                <!-- Rank Column Header (hidden on mobile - rank controls are in NAME column on mobile) -->
                <th class="hidden lg:table-cell p-1.5 text-center font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-yellow-500/50"
                    @click="sortBy('rank')"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-yellow-400 text-xs">🏆</span>
                    <span class="font-mono font-bold">RANK</span>
                    <span
                      class="text-xs transition-transform duration-200"
                      :class="{
                        'text-yellow-400 opacity-100': sortField === 'rank',
                        'opacity-50': sortField !== 'rank',
                        'rotate-0': sortField === 'rank' && sortDirection === 'asc',
                        'rotate-180': sortField === 'rank' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 border-b border-neutral-700/30">
                  <!-- Desktop Layout: Horizontal -->
                  <div class="hidden lg:flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div
                        class="flex items-center gap-1.5 cursor-pointer hover:bg-neutral-700/50 rounded px-2 py-1 transition-all duration-300 hover:border-cyan-500/50"
                        @click="sortBy('name')"
                      >
                        <span class="text-neutral-400 text-xs">🏷️</span>
                        <span class="font-mono font-bold">NAME</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-cyan-400 opacity-100': sortField === 'name',
                            'opacity-50': sortField !== 'name',
                            'rotate-0': sortField === 'name' && sortDirection === 'asc',
                            'rotate-180': sortField === 'name' && sortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>

                      <!-- Server Filter Input (Desktop) -->
                      <div class="relative">
                        <div class="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                          <span class="text-neutral-500 text-xs">🔍</span>
                        </div>
                        <input
                          v-model="serverFilterQuery"
                          type="text"
                          placeholder="Filter..."
                          class="w-48 pl-7 pr-7 py-1 bg-neutral-700/60 border border-neutral-600/50 rounded text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 text-xs"
                        >
                        <button
                          v-if="serverFilterQuery"
                          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                          @click="serverFilterQuery = ''"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                  </div>

                  <!-- Mobile Layout: Vertical -->
                  <div class="flex lg:hidden flex-col gap-2">
                    <div class="flex items-center justify-between">
                      <div
                        class="flex items-center gap-1.5 cursor-pointer hover:bg-neutral-700/50 rounded px-2 py-1 transition-all duration-300 hover:border-yellow-500/50"
                        @click="sortBy('rank')"
                      >
                        <span class="text-yellow-400 text-xs">🏆</span>
                        <span class="font-mono font-bold">RANK</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-yellow-400 opacity-100': sortField === 'rank',
                            'opacity-50': sortField !== 'rank',
                            'rotate-0': sortField === 'rank' && sortDirection === 'asc',
                            'rotate-180': sortField === 'rank' && sortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                      <div
                        class="flex items-center gap-1.5 cursor-pointer hover:bg-neutral-700/50 rounded px-2 py-1 transition-all duration-300 hover:border-cyan-500/50"
                        @click="sortBy('name')"
                      >
                        <span class="text-neutral-400 text-xs">🏷️</span>
                        <span class="font-mono font-bold">NAME</span>
                        <span
                          class="text-xs transition-transform duration-200"
                          :class="{
                            'text-cyan-400 opacity-100': sortField === 'name',
                            'opacity-50': sortField !== 'name',
                            'rotate-0': sortField === 'name' && sortDirection === 'asc',
                            'rotate-180': sortField === 'name' && sortDirection === 'desc'
                          }"
                        >▲</span>
                      </div>
                    </div>

                    <!-- Server Filter Input (Mobile) -->
                    <div class="relative">
                      <div class="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                        <span class="text-neutral-500 text-xs">🔍</span>
                      </div>
                      <input
                        v-model="serverFilterQuery"
                        type="text"
                        placeholder="Filter servers..."
                        class="w-full pl-7 pr-7 py-1.5 bg-neutral-700/60 border border-neutral-600/50 rounded text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 text-xs"
                      >
                      <button
                        v-if="serverFilterQuery"
                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                        @click="serverFilterQuery = ''"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div
                        v-if="serverFilterQuery && filteredServers.length !== servers.length"
                        class="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                      >
                        {{ filteredServers.length }}
                      </div>
                    </div>
                  </div>
                </th>
                <th
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-green-500/50"
                  @click="sortBy('numPlayers')"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-green-400 text-xs">👥</span>
                    <span class="font-mono font-bold">PLAYERS</span>
                    <span
                      class="text-xs transition-transform duration-200"
                      :class="{
                        'text-green-400 opacity-100': sortField === 'numPlayers',
                        'opacity-50': sortField !== 'numPlayers',
                        'rotate-0': sortField === 'numPlayers' && sortDirection === 'asc',
                        'rotate-180': sortField === 'numPlayers' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-orange-500/50"
                  @click="sortBy('mapName')"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-orange-400 text-xs">🗺️</span>
                    <span class="font-mono font-bold">MAP</span>
                    <span
                      class="text-xs transition-transform duration-200"
                      :class="{
                        'text-orange-400 opacity-100': sortField === 'mapName',
                        'opacity-50': sortField !== 'mapName',
                        'rotate-0': sortField === 'mapName' && sortDirection === 'asc',
                        'rotate-180': sortField === 'mapName' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-yellow-500/50"
                  @click="sortBy('roundTimeRemain')"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-yellow-400 text-xs">⏱️</span>
                    <span class="font-mono font-bold">TIME</span>
                    <span
                      class="text-xs transition-transform duration-200"
                      :class="{
                        'text-yellow-400 opacity-100': sortField === 'roundTimeRemain',
                        'opacity-50': sortField !== 'roundTimeRemain',
                        'rotate-0': sortField === 'roundTimeRemain' && sortDirection === 'asc',
                        'rotate-180': sortField === 'roundTimeRemain' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 cursor-pointer hover:bg-neutral-700/50 transition-all duration-300 border-b border-neutral-700/30 hover:border-purple-500/50"
                  @click="sortBy('gameType')"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="text-purple-400 text-xs">🎮</span>
                    <span class="font-mono font-bold">MODE</span>
                    <span
                      class="text-xs transition-transform duration-200"
                      :class="{
                        'text-purple-400 opacity-100': sortField === 'gameType',
                        'opacity-50': sortField !== 'gameType',
                        'rotate-0': sortField === 'gameType' && sortDirection === 'asc',
                        'rotate-180': sortField === 'gameType' && sortDirection === 'desc'
                      }"
                    >▲</span>
                  </div>
                </th>
                <th class="p-1.5 text-left font-bold text-xs uppercase tracking-wide text-neutral-300 border-b border-neutral-700/30">
                  <div class="flex items-center gap-1.5">
                    <span class="text-blue-400 text-xs">🔗</span>
                    <span class="font-mono font-bold">IP</span>
                  </div>
                </th>
                <th class="p-1.5 text-center font-bold text-xs uppercase tracking-wide text-neutral-300 border-b border-neutral-700/30">
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
                v-for="(server, serverIndex) in sortedServers"
                :key="server.guid"
                class="group transition-all duration-300 hover:bg-neutral-900/20 border-b border-neutral-700/30"
                :class="getServerStatusClass(server)"
              >
                <!-- Rank (hidden on mobile - rank is shown in NAME column on mobile) -->
                <td class="hidden lg:table-cell p-1.5">
                  <div class="flex items-center justify-center">
                    <div class="text-center">
                      <div
                        v-if="getServerRank(server.guid)"
                        class="text-yellow-400 font-bold text-xs font-mono cursor-pointer hover:text-yellow-300 transition-colors relative group"
                        @click.stop="toggleRankTooltip(server.guid)"
                      >
                        #{{ getServerRank(server.guid) }}

                        <!-- Rank Tooltip -->
                        <div
                          v-if="rankTooltipServer === server.guid"
                          class="absolute z-50 left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-neutral-900/95 backdrop-blur-lg rounded-lg border border-neutral-600/50 shadow-xl text-xs text-left whitespace-nowrap"
                        >
                          <div class="text-yellow-400 font-semibold mb-1">
                            Ranked #{{ getServerRank(server.guid) }} by total playtime
                          </div>
                          <div class="text-neutral-300">
                            {{ formatTotalPlayTime(getServerTotalPlayTime(server.guid)) }}
                          </div>
                          <div class="text-neutral-400 text-[10px] mt-1">
                            Last 60 days
                          </div>
                          <!-- Tooltip arrow -->
                          <div class="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-neutral-800/95"></div>
                        </div>
                      </div>
                      <div
                        v-else
                        class="text-neutral-500 text-xs font-mono"
                      >
                        -
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Server Name -->
                <td class="p-1.5">
                  <router-link 
                    :to="`/servers/${encodeURIComponent(server.name)}`" 
                    class="block group-hover:text-cyan-400 transition-all duration-300 no-underline"
                  >
                    <!-- Desktop Layout -->
                    <div class="hidden lg:flex items-center gap-2">
                      <span
                        v-if="server.country"
                        class="text-lg"
                      >{{ getCountryFlag(server.country) }}</span>
                      <div class="flex-1 min-w-0 flex items-center gap-2">
                        <div class="font-bold text-neutral-200 truncate max-w-xs text-sm">
                          {{ server.name }}
                        </div>
                        <div
                          v-if="getTimezoneDisplay(server.timezone)"
                          class="text-xs text-neutral-400 font-mono"
                        >
                          {{ getTimezoneDisplay(server.timezone) }}
                        </div>
                        <!-- Mini hourly timeline bars (current hour centered) -->
                        <div
                          v-if="serverTrendsByGuid[server.guid]?.hourlyTimeline"
                          class="flex items-end gap-0.5 ml-1 py-2 px-1 -my-2 group/timeline relative cursor-pointer hover:bg-neutral-700/20 active:bg-neutral-700/30 rounded transition-colors"
                          aria-label="Server activity timeline - hover or click to view forecast"
                          @click.stop.prevent="toggleServerModal(server.guid)"
                        >
                          <!-- Original small bars -->
                          <div
                            v-for="(entry, idx) in serverTrendsByGuid[server.guid].hourlyTimeline"
                            :key="idx"
                            class="w-1.5 rounded-t transition-opacity duration-300 cursor-pointer"
                            :class="entry.isCurrentHour ? 'bg-cyan-400' : 'bg-neutral-600'"
                            :style="{ height: getTimelineBarHeight(server.guid, entry) + 'px' }"
                            :title="formatTimelineTooltip(entry)"
                          />
                          
                          <!-- Forecast Modal Component -->
                          <ForecastModal
                            :show-overlay="true"
                            :show-modal="serverModalStates[server.guid] || false"
                            :hourly-timeline="serverTrendsByGuid[server.guid].hourlyTimeline"
                            :current-status="`${server.numPlayers} players (typical: ${Math.round(serverTrendsByGuid[server.guid].busyIndicator.typicalPlayers)})`"
                            :current-players="server.numPlayers"
                            :open-upward="shouldOpenUpward(serverIndex)"
                            overlay-class="opacity-0 group-hover/timeline:opacity-100"
                            @close="closeServerModal(server.guid)"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <!-- Mobile Layout -->
                    <div class="block lg:hidden">
                      <div class="flex items-center gap-2 mb-1">
                        <!-- Rank badge on mobile -->
                        <div
                          v-if="getServerRank(server.guid)"
                          class="text-yellow-400 font-bold text-xs font-mono"
                        >
                          #{{ getServerRank(server.guid) }}
                        </div>
                        <span
                          v-if="server.country"
                          class="text-lg"
                        >{{ getCountryFlag(server.country) }}</span>
                        <div class="font-bold text-neutral-200 truncate text-sm flex-1">
                          {{ server.name }}
                        </div>
                      </div>
                      
                      <!-- Mobile: Server time and timeline on second line -->
                      <div class="flex items-center gap-2">
                        <div
                          v-if="getTimezoneDisplay(server.timezone)"
                          class="text-xs text-neutral-400 font-mono"
                        >
                          {{ getTimezoneDisplay(server.timezone) }}
                        </div>
                        <!-- Mini hourly timeline bars for mobile -->
                        <div
                          v-if="serverTrendsByGuid[server.guid]?.hourlyTimeline"
                          class="flex items-end gap-0.5 ml-1 py-2 px-1 -my-2 flex-1 group/timeline relative cursor-pointer active:bg-neutral-700/30 rounded transition-colors"
                          aria-label="Server activity timeline - tap to view forecast"
                          @click.stop.prevent="toggleServerModal(server.guid)"
                        >
                          <!-- Original small bars -->
                          <div
                            v-for="(entry, idx) in serverTrendsByGuid[server.guid].hourlyTimeline"
                            :key="idx"
                            class="w-1 rounded-t transition-opacity duration-300 cursor-pointer"
                            :class="entry.isCurrentHour ? 'bg-cyan-400' : 'bg-neutral-600'"
                            :style="{ height: getTimelineBarHeight(server.guid, entry) + 'px' }"
                            :title="formatTimelineTooltip(entry)"
                          />
                          
                          <!-- Forecast Modal Component -->
                          <ForecastModal
                            :show-overlay="true"
                            :show-modal="serverModalStates[server.guid] || false"
                            :hourly-timeline="serverTrendsByGuid[server.guid].hourlyTimeline"
                            :current-status="`${server.numPlayers} players (typical: ${Math.round(serverTrendsByGuid[server.guid].busyIndicator.typicalPlayers)})`"
                            :current-players="server.numPlayers"
                            :open-upward="shouldOpenUpward(serverIndex)"
                            overlay-class="opacity-0 group-hover/timeline:opacity-100"
                            @close="closeServerModal(server.guid)"
                          />
                        </div>
                      </div>
                    </div>
                  </router-link>
                </td>

                <!-- Players -->
                <td
                  class="p-1.5 cursor-pointer"
                  @click="showPlayers(server)"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="flex items-center gap-1 font-bold"
                      :class="getPlayerCountClass(server)"
                    >
                      <span class="text-sm font-mono">{{ server.numPlayers }}</span>
                      <span class="text-neutral-500 text-xs font-mono">/{{ server.maxPlayers }}</span>
                    </div>
                    <div class="flex-1 max-w-[80px]">
                      <div class="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                        <div 
                          class="h-full transition-all duration-500 rounded-full" 
                          :style="{ 
                            width: getPlayerPercentage(server) + '%', 
                            backgroundColor: getPlayerBarColor(server),
                            boxShadow: `0 0 6px ${getPlayerBarColor(server)}60`
                          }"
                        />
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Map -->
                <td class="p-1.5">
                  <div class="font-bold text-orange-400 text-xs truncate max-w-[180px] font-mono uppercase">
                    {{ server.mapName }}
                  </div>
                </td>

                <!-- Time Remaining -->
                <td class="p-1.5">
                  <div class="text-center">
                    <div class="text-green-400 font-bold text-xs font-mono">
                      {{ formatTimeRemaining(server.roundTimeRemain) }}
                    </div>
                  </div>
                </td>

                <!-- Game Type -->
                <td class="p-1.5">
                  <div class="flex items-center gap-1.5">
                    <div 
                      class="w-5 h-5 rounded bg-cover bg-center border border-neutral-600/50"
                      :style="{ backgroundImage: getGameIcon(getGameIconClass(server.gameType)) }"
                    />
                    <span
                      class="px-1.5 py-0.5 rounded text-xs font-bold uppercase font-mono"
                      :class="getGameTypeClass(server.gameType)"
                    >
                      {{ getGameDisplayName(server.gameType) }}
                    </span>
                    <!-- Busy indicator badge (only when we have enough prediction data) -->
                    <span
                      v-if="hasValidBusyIndicator(server.guid)"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ml-1"
                      :class="getBusyBadgeClass(serverTrendsByGuid[server.guid]!.busyIndicator.busyLevel)"
                      :title="`Typical: ${Math.round(serverTrendsByGuid[server.guid]!.busyIndicator.typicalPlayers)}, Current: ${serverTrendsByGuid[server.guid]!.busyIndicator.currentPlayers}`"
                    >
                      <span>{{ getBusyEmoji(serverTrendsByGuid[server.guid]!.busyIndicator.busyLevel) }}</span>
                      <span class="hidden sm:inline">{{ serverTrendsByGuid[server.guid]!.busyIndicator.busyText }}</span>
                    </span>
                  </div>
                </td>

                <!-- Connection -->
                <td class="p-1.5">
                  <div class="text-center">
                    <div class="font-mono text-xs text-neutral-400 font-medium">
                      {{ server.ip }}:{{ server.port }}
                    </div>
                  </div>
                </td>

                <!-- Action -->
                <td class="p-1.5">
                  <div class="flex items-center justify-center gap-1">
                    <!-- Discord Link -->
                    <a
                      v-if="server.discordUrl"
                      :href="server.discordUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="w-7 h-7 bg-indigo-500/20 hover:bg-indigo-500/30 rounded border border-indigo-500/30 hover:border-indigo-500/50 flex items-center justify-center transition-all duration-200 p-1"
                      title="Join Discord"
                    >
                      <img
                        :src="discordIcon"
                        alt="Discord"
                        class="w-full h-full object-contain"
                      >
                    </a>

                    <!-- Forum Link -->
                    <a
                      v-if="server.forumUrl"
                      :href="server.forumUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="w-7 h-7 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 rounded border border-orange-500/30 hover:border-orange-500/50 flex items-center justify-center transition-all duration-200 text-sm"
                      title="Visit Forum"
                    >
                      📋
                    </a>

                    <!-- Join Server Button -->
                    <button
                      class="px-2.5 py-1 text-xs font-bold uppercase transition-all duration-300 rounded-lg border font-mono"
                      :class="{
                        'bg-cyan-500 hover:bg-cyan-400 text-neutral-900 border-cyan-500 shadow-lg hover:shadow-cyan-500/40 transform hover:scale-105 will-change-transform': server.numPlayers < server.maxPlayers,
                        'bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-60 border-neutral-600': server.numPlayers >= server.maxPlayers
                      }"
                      :disabled="server.numPlayers >= server.maxPlayers"
                      @click="joinServer(server)"
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

      <!-- Players Panel: overlay on mobile, right panel on lg when space permits -->
      <div
        v-if="showPlayersPanel"
        class="fixed inset-0 z-[100] lg:relative lg:inset-auto lg:z-auto lg:w-[480px] xl:w-[520px] lg:flex-shrink-0 lg:border-l lg:border-neutral-700/50 lg:min-h-0 lg:min-w-[480px] xl:min-w-[520px]"
      >
        <PlayersPanel
          :show="showPlayersPanel"
          :server="selectedServer"
          :inline="isWideScreen"
          @close="closePlayersPanel"
        />
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllServers, fetchServerBusyIndicators, fetchServerRankings, type ServerBusyIndicatorResult, type ServerHourlyTimelineEntry, type BusyLevel } from '../services/serverDetailsService'
import { ServerSummary } from '../types/server'
import { PlayerHistoryDataPoint, PlayerHistoryInsights, ServerRank } from '../types/playerStatsTypes'
import PlayersPanel from '../components/PlayersPanel.vue'
import PlayerHistoryChart from '../components/PlayerHistoryChart.vue'
import { fetchPlayerOnlineHistory } from '../services/playerStatsService'
import { formatTimeRemaining } from '../utils/timeUtils'
import ForecastModal from '../components/ForecastModal.vue'
import PlayerSearch from '../components/PlayerSearch.vue'
import GameFilterButtons from '../components/GameFilterButtons.vue'
import InstallationLinksDropdown from '../components/InstallationLinksDropdown.vue'
import PlayerHistorySection from '../components/PlayerHistorySection.vue'

import bf1942Icon from '@/assets/bf1942.webp'
import fh2Icon from '@/assets/fh2.webp'
import bfvIcon from '@/assets/bfv.webp'
import discordIcon from '@/assets/discord.webp'

// PlayerSearchResult interface is defined in PlayerSearch component
// We need it for the selectPlayer function
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
const serverFilterQuery = ref('')
const activeFilter = ref(getFilterFromMode(props.initialMode))
const sortField = ref('numPlayers')
const sortDirection = ref('desc')
const servers = ref<ServerSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const refreshTimer = ref<number | null>(null)

// Component refs
const installDropdownRef = ref<InstanceType<typeof InstallationLinksDropdown> | null>(null)
const playerHistorySectionRef = ref<InstanceType<typeof PlayerHistorySection> | null>(null)

// Players panel state
const showPlayersPanel = ref(false)
const selectedServer = ref<ServerSummary | null>(null)

// Player history state
const playerHistoryData = ref<PlayerHistoryDataPoint[]>([])
const playerHistoryInsights = ref<PlayerHistoryInsights | null>(null)
const historyPeriod = ref<'1d' | '3d' | '7d' | 'longer'>('1d')
const longerPeriod = ref<'1month' | '3months' | 'thisyear' | 'alltime'>('1month')
const historyRollingWindow = ref('7d')
const historyLoading = ref(false)
const historyError = ref<string | null>(null)


// Per-server trends state (busy indicator + hourly timeline)
const serverTrendsByGuid = ref<Record<string, ServerBusyIndicatorResult>>({})

// Per-server modal state
const serverModalStates = ref<Record<string, boolean>>({})

// Server rankings state
const serverRankings = ref<ServerRank[]>([])
const rankingsLoading = ref(false)
const rankingsError = ref<string | null>(null)

// Rank tooltip state
const rankTooltipServer = ref<string | null>(null)

// Wide viewport: show players panel on the right (lg: 1024px+)
const isWideScreen = ref(false)
const updateWideScreen = () => {
  isWideScreen.value = typeof window !== 'undefined' && window.innerWidth >= 1024
}

// Helper to determine if modal should open upward (for rows near bottom)
const shouldOpenUpward = (index: number) => {
  const totalRows = sortedServers.value.length
  // Open upward if in the last 3 rows
  return index >= totalRows - 3
}

// Helper to get server rank
const getServerRank = (serverGuid: string): number | null => {
  const ranking = serverRankings.value.find(r => r.serverGuid === serverGuid)
  return ranking ? ranking.rank : null
}

// Helper to get server total playtime
const getServerTotalPlayTime = (serverGuid: string): number => {
  const ranking = serverRankings.value.find(r => r.serverGuid === serverGuid)
  return ranking ? ranking.totalPlayTimeMinutes : 0
}

// Format total playtime nicely
const formatTotalPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} total playtime`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? 's' : ''} total playtime`
  }
  return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''} total playtime`
}

// Toggle rank tooltip
const toggleRankTooltip = (serverGuid: string) => {
  rankTooltipServer.value = rankTooltipServer.value === serverGuid ? null : serverGuid
}

// Computed properties
const filteredServers = computed(() => {
  if (!serverFilterQuery.value.trim()) {
    return servers.value
  }

  const query = serverFilterQuery.value.toLowerCase().trim()

  return servers.value.filter(server => {
    // Search across multiple fields
    return (
      server.name?.toLowerCase().includes(query) ||
      server.mapName?.toLowerCase().includes(query) ||
      server.ip?.toLowerCase().includes(query) ||
      server.gameType?.toLowerCase().includes(query) ||
      server.country?.toLowerCase().includes(query) ||
      server.timezone?.toLowerCase().includes(query) ||
      `${server.ip}:${server.port}`.toLowerCase().includes(query)
    )
  })
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
      case 'rank':
        // Sort by server rank (lower rank number = higher ranking)
        const aRank = getServerRank(a.guid) || 999999
        const bRank = getServerRank(b.guid) || 999999
        aVal = aRank
        bVal = bRank
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

// Generate dynamic keywords from top 5 servers by player count for SEO
const topServerKeywords = computed(() => {
  const topServers = [...servers.value]
    .sort((a, b) => b.numPlayers - a.numPlayers)
    .slice(0, 5)
    .map(s => s.name)
    .filter(name => name && name.trim())
  
  return topServers.join(', ')
})

// Base keywords that always appear
const baseKeywords = computed(() => {
  const gameType = activeFilter.value
  if (gameType === 'bf1942') {
    return 'Battlefield 1942, BF1942, WW2 multiplayer, WWII FPS, BF1942 servers, online players, server browser, player stats'
  } else if (gameType === 'fh2') {
    return 'Forgotten Hope 2, FH2, BF2 mod, realistic WW2, FH2 servers, tactical shooter, milsim, online players'
  } else if (gameType === 'bfvietnam') {
    return 'Battlefield Vietnam, BF Vietnam, BFV, Vietnam War game, BFV servers, 1960s FPS, online players'
  }
  return 'Battlefield 1942, Forgotten Hope 2, Battlefield Vietnam, server browser, player statistics, gaming stats, server monitoring'
})

// Combined SEO keywords
const seoKeywords = computed(() => {
  const keywords = [baseKeywords.value]
  if (topServerKeywords.value) {
    keywords.push(topServerKeywords.value)
  }
  return keywords.join(', ')
})

// Dynamic meta description with live stats
const seoDescription = computed(() => {
  const gameType = activeFilter.value
  const totalPlayers = servers.value.reduce((sum, s) => sum + (s.numPlayers || 0), 0)
  const activeServers = servers.value.filter(s => (s.numPlayers || 0) > 0).length
  const topServer = servers.value.length > 0 
    ? [...servers.value].sort((a, b) => b.numPlayers - a.numPlayers)[0]
    : null
  
  let gameName = 'Battlefield 1942'
  if (gameType === 'fh2') gameName = 'Forgotten Hope 2'
  else if (gameType === 'bfvietnam') gameName = 'Battlefield Vietnam'
  
  let description = `Live ${gameName} server browser with ${activeServers} active servers`
  if (totalPlayers > 0) {
    description += ` and ${totalPlayers} online players`
  }
  if (topServer && topServer.numPlayers > 0) {
    description += `. Most popular: ${topServer.name} (${topServer.numPlayers}/${topServer.maxPlayers})`
  }
  description += '. Real-time stats, player counts, maps, and instant join links.'
  
  return description
})

// Structured data for rich search results
const structuredData = computed(() => {
  const gameType = activeFilter.value
  const totalPlayers = servers.value.reduce((sum, s) => sum + (s.numPlayers || 0), 0)
  
  let gameName = 'Battlefield 1942'
  if (gameType === 'fh2') gameName = 'Forgotten Hope 2'
  else if (gameType === 'bfvietnam') gameName = 'Battlefield Vietnam'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${gameName} Server Browser - BF Stats`,
    applicationCategory: 'GameApplication',
    description: seoDescription.value,
    url: window.location.href,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: totalPlayers > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: totalPlayers.toString()
    } : undefined,
    featureList: [
      'Real-time server monitoring',
      'Live player statistics',
      'Instant server join',
      'Player search and tracking',
      'Server activity forecasts'
    ]
  }
})

// Helper functions
const getGameIconClass = (gameType: string) => {
  const type = gameType?.toLowerCase() || ''
  if (type.includes('bf1942')) return 'icon-bf1942'
  if (type.includes('fh2')) return 'icon-fh2'
  if (type.includes('vietnam')) return 'icon-bfv'
  return 'icon-bf1942'
}

// Player search methods
const selectPlayer = (player: PlayerSearchResult) => {
  playerSearchQuery.value = player.playerName
  navigateToPlayerProfile(player.playerName)
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
    if (field === 'numPlayers' || field === 'rank') {
      sortDirection.value = 'asc' // Lower numbers first (higher rank = lower number)
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
  if (percentage === 0) return 'bg-neutral-500/5'
  return 'bg-green-500/5'
}

const getGameTypeClass = (gameType: string) => {
  const type = gameType?.toLowerCase() || ''
  if (type.includes('bf1942')) return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  if (type.includes('fh2')) return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (type.includes('vietnam')) return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
  return 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30'
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
    // Update SEO meta tags with fresh server data
    updateSeoMetaTags()
    // Fire-and-forget: fetch per-server busy indicators for active servers (>=5 players)
    fetchAndAttachServerTrends()
    // Fire-and-forget: fetch server rankings
    fetchServerRankingsData()
  } catch (err) {
    error.value = 'Failed to fetch server data. Please try again.'
  } finally {
    if (isInitialLoad) {
      loading.value = false
    }
  }
}

const fetchServerRankingsData = async () => {
  rankingsLoading.value = true
  rankingsError.value = null

  try {
    const serverGuids = servers.value.map(s => s.guid)
    if (serverGuids.length > 0) {
      const rankings = await fetchServerRankings(serverGuids, 60) // Last 60 days for more data
      serverRankings.value = rankings
    }
  } catch (err) {
    rankingsError.value = 'Failed to load server rankings'
    console.error('Error fetching server rankings:', err)
  } finally {
    rankingsLoading.value = false
  }
}

// Helper: fetch per-server busy indicators without blocking main render
const fetchAndAttachServerTrends = async () => {
  try {
    // Get top 10 servers from the sorted list (as displayed to user)
    const topServers = sortedServers.value.slice(0, 10)
    const eligibleGuids = topServers.filter(s => !!s.guid).map(s => s.guid)
    
    if (eligibleGuids.length === 0) {
      return
    }

    // Chunk requests to avoid overly long URLs
    const chunkSize = 25
    const chunks: string[][] = []
    for (let i = 0; i < eligibleGuids.length; i += chunkSize) {
      chunks.push(eligibleGuids.slice(i, i + chunkSize))
    }

    const results = await Promise.all(chunks.map(chunk => fetchServerBusyIndicators(chunk)))
    const combined = results.flatMap(r => r.serverResults)

    // Merge into map keyed by serverGuid
    const updated: Record<string, ServerBusyIndicatorResult> = { ...serverTrendsByGuid.value }
    for (const res of combined) {
      updated[res.serverGuid] = res
    }
    serverTrendsByGuid.value = updated
  } catch (e) {
    // Non-fatal: keep UI working without trends
  }
}

// Only show busy badge when we have valid prediction data (not "Not enough data")
const hasValidBusyIndicator = (serverGuid: string): boolean => {
  const data = serverTrendsByGuid.value[serverGuid]?.busyIndicator
  return !!(data && data.busyText !== 'Not enough data')
}

// UI helpers for busy badge
const getBusyEmoji = (level: BusyLevel): string => {
  switch (level) {
    case 'very_busy': return '🔥'
    case 'busy': return '⚡'
    case 'moderate': return '⚖️'
    case 'quiet': return '🌙'
    case 'very_quiet': return '💤'
    default: return '❓'
  }
}

const getBusyBadgeClass = (level: BusyLevel): string => {
  switch (level) {
    case 'very_busy': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'busy': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case 'moderate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'quiet': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'very_quiet': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    default: return 'bg-neutral-600/30 text-neutral-300 border-neutral-600/40'
  }
}

// Timeline bar helpers - Pre-compute max heights for performance
const timelineMaxHeights = computed(() => {
  const maxHeights: Record<string, number> = {}
  Object.entries(serverTrendsByGuid.value).forEach(([guid, data]) => {
    const timeline = data?.hourlyTimeline || []
    maxHeights[guid] = Math.max(1, ...timeline.map(e => Math.max(0, e.typicalPlayers || 0)))
  })
  return maxHeights
})

const getTimelineBarHeight = (guid: string, entry: ServerHourlyTimelineEntry): number => {
  const maxTypical = timelineMaxHeights.value[guid] || 1
  const pct = Math.max(0, Math.min(1, (entry.typicalPlayers || 0) / maxTypical))
  const maxHeight = 18 // px
  const minHeight = 2
  return Math.max(minHeight, Math.round(pct * maxHeight))
}

// Modal helpers
const toggleServerModal = (serverGuid: string) => {
  serverModalStates.value[serverGuid] = !serverModalStates.value[serverGuid]
}

const closeServerModal = (serverGuid: string) => {
  serverModalStates.value[serverGuid] = false
}

const closeAllModals = () => {
  // Close all server modals
  Object.keys(serverModalStates.value).forEach(guid => {
    serverModalStates.value[guid] = false
  })
  // Close rank tooltip
  rankTooltipServer.value = null
}

const formatTimelineTooltip = (entry: ServerHourlyTimelineEntry): string => {
  // Convert UTC hour to local "HH:00" display
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), entry.hour, 0, 0))
  const local = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const levelLabel = getBusyLevelLabel(entry.busyLevel)
  return `${local} • Typical ${Math.round(entry.typicalPlayers)} • ${levelLabel}`
}

const getBusyLevelLabel = (level: BusyLevel): string => {
  switch (level) {
    case 'very_busy': return 'Very busy'
    case 'busy': return 'Busy'
    case 'moderate': return 'Moderate'
    case 'quiet': return 'Quiet'
    case 'very_quiet': return 'Very quiet'
    default: return 'Unknown'
  }
}

const fetchPlayerHistory = async () => {
  historyLoading.value = true
  historyError.value = null
  
  try {
    const currentPeriod = getCurrentPeriod()
    const apiPeriod = getCurrentPeriodForAPI()

    const response = await fetchPlayerOnlineHistory(
      activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam',
      apiPeriod,
      getRollingWindowDays(historyRollingWindow.value)
    )

    // Set the response data - only update if we have valid data
    if (response.dataPoints && response.dataPoints.length > 0) {
      playerHistoryData.value = response.dataPoints
    }
    if (response.insights) {
      playerHistoryInsights.value = response.insights
    }
  } catch (err) {
    historyError.value = 'Failed to load player history'
    // Only clear data on error, not during normal updates
    if (playerHistoryData.value.length === 0) {
      playerHistoryData.value = []
      playerHistoryInsights.value = null
    }
  } finally {
    historyLoading.value = false
  }
}

const togglePlayerHistory = () => {
  if (playerHistorySectionRef.value) {
    // The child component already toggles its own state, so just check if we need to fetch data
    // Use a nextTick-like delay to read the state after the child has updated
    const isNowShowing = playerHistorySectionRef.value.show
    if (isNowShowing && playerHistoryData.value.length === 0) {
      fetchPlayerHistory()
    }
  }
}

const changePeriod = (period: '1d' | '3d' | '7d') => {
  historyPeriod.value = period
  fetchPlayerHistory()
}

const changeRollingWindow = (rollingWindow: string) => {
  historyRollingWindow.value = rollingWindow
  fetchPlayerHistory()
}

// Convert rolling window string to numerical days
const getRollingWindowDays = (rollingWindow: string): number => {
  switch (rollingWindow) {
    case '7d':
      return 7
    case '14d':
      return 14
    case '30d':
      return 30
    default:
      return 7
  }
}

const selectLongerPeriod = (period: '1month' | '3months' | 'thisyear' | 'alltime') => {
  longerPeriod.value = period
  historyPeriod.value = 'longer'
  fetchPlayerHistory()
}

const getCurrentPeriod = () => {
  return historyPeriod.value === 'longer' ? longerPeriod.value : historyPeriod.value
}

const getCurrentPeriodForAPI = (): string => {
  if (historyPeriod.value === 'longer') {
    // Return the longer period value directly
    return longerPeriod.value
  }
  // Return the actual period value for 1d, 3d, 7d
  return historyPeriod.value
}

const getActiveGameName = () => {
  const gameType = gameTypes.find(g => g.id === activeFilter.value)
  return gameType?.name || 'Game'
}

// Update SEO meta tags when server data changes
const updateSeoMetaTags = () => {
  // Helper function to update or create meta tags
  const updateMetaTag = (selector: string, attribute: string, content: string) => {
    let tag = document.querySelector(selector)
    if (!tag) {
      tag = document.createElement('meta')
      const attrName = attribute.includes('property') ? 'property' : 'name'
      const attrValue = attribute.replace('property=', '').replace('name=', '')
      tag.setAttribute(attrName, attrValue)
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)
  }

  // Update keywords
  updateMetaTag('meta[name="keywords"]', 'name=keywords', seoKeywords.value)
  
  // Update descriptions
  updateMetaTag('meta[name="description"]', 'name=description', seoDescription.value)
  updateMetaTag('meta[property="og:description"]', 'property=og:description', seoDescription.value)
  updateMetaTag('meta[name="twitter:description"]', 'name=twitter:description', seoDescription.value)
  
  // Update or create structured data script tag
  let structuredDataScript = document.querySelector('script[type="application/ld+json"]')
  if (!structuredDataScript) {
    structuredDataScript = document.createElement('script')
    structuredDataScript.setAttribute('type', 'application/ld+json')
    document.head.appendChild(structuredDataScript)
  }
  structuredDataScript.textContent = JSON.stringify(structuredData.value)
}

// Watch for server data changes to update SEO
watch([servers, activeFilter], () => {
  if (servers.value.length > 0) {
    updateSeoMetaTags()
  }
}, { immediate: false })

// Watch for game filter changes and fetch new data
watch(activeFilter, (newFilter) => {
  // Reset per-server trends and rankings when switching games to avoid stale data
  serverTrendsByGuid.value = {}
  serverRankings.value = []
  fetchServersForGame(newFilter as 'bf1942' | 'fh2' | 'bfvietnam', true)
  // Also refresh player history if it's visible
  if (playerHistorySectionRef.value?.show) {
    fetchPlayerHistory()
  }
})

// Lifecycle
onMounted(() => {
  updateWideScreen()
  window.addEventListener('resize', updateWideScreen)
  fetchServersForGame(activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam', true)

  refreshTimer.value = window.setInterval(() => {
    fetchServersForGame(activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam', false)
  }, 300000)

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const target = e.target as Element
    if (!target.closest('.relative')) {
      if (installDropdownRef.value) {
        installDropdownRef.value.close()
      }
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWideScreen)
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style src="./portal-layout.css"></style>
<style scoped src="./LandingPageV2.vue.css"></style>
