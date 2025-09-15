<template>
  <div class="min-h-screen bg-slate-900 px-3 sm:px-6" @click="closeAllModals">
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
              <div
                v-if="isSearchLoading"
                class="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              </div>
              
              <!-- Search Glow Effect -->
              <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <!-- Enhanced Player Dropdown -->
              <div
                v-if="showPlayerDropdown"
                class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
              >
                <div
                  v-for="player in playerSuggestions"
                  :key="player.playerName"
                  class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                  @mousedown.prevent="selectPlayer(player)"
                >
                  <div class="space-y-2">
                    <div class="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors">
                      {{ player.playerName }}
                    </div>
                    <div class="flex items-center gap-3 flex-wrap text-xs">
                      <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                      <span
                        v-if="player.isActive"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full"
                      >
                        🟢 ONLINE
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-500/20 border border-slate-500/30 rounded-full"
                      >
                        ⚫ OFFLINE
                      </span>
                    </div>
                    <div
                      v-if="player.currentServer && player.isActive"
                      class="text-xs text-cyan-400 font-medium"
                    >
                      🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="playerSuggestions.length === 0 && !isSearchLoading && playerSearchQuery.length >= 2"
                  class="p-4 text-center text-slate-400 text-sm font-medium"
                >
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
                />
                <div class="text-sm font-medium hidden sm:block">
                  {{ game.name }}
                </div>
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
                <div
                  v-if="isSearchLoading"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2"
                >
                  <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
                
                <!-- Search Glow Effect -->
                <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <!-- Enhanced Player Dropdown -->
                <div
                  v-if="showPlayerDropdown"
                  class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
                >
                  <div
                    v-for="player in playerSuggestions"
                    :key="player.playerName"
                    class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                    @mousedown.prevent="selectPlayer(player)"
                  >
                    <div class="space-y-2">
                      <div class="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors">
                        {{ player.playerName }}
                      </div>
                      <div class="flex items-center gap-3 flex-wrap text-xs">
                        <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                        <span
                          v-if="player.isActive"
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full"
                        >
                          🟢 ONLINE
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-500/20 border border-slate-500/30 rounded-full"
                        >
                          ⚫ OFFLINE
                        </span>
                      </div>
                      <div
                        v-if="player.currentServer && player.isActive"
                        class="text-xs text-cyan-400 font-medium"
                      >
                        🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="playerSuggestions.length === 0 && !isSearchLoading && playerSearchQuery.length >= 2"
                    class="p-4 text-center text-slate-400 text-sm font-medium"
                  >
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
              />
              <div class="text-sm font-medium">
                {{ game.name }}
              </div>
            </button>
          </div>
        </div>

        <!-- Player History Section -->
        <div class="border-b border-slate-700/30">
          <!-- Toggle Button -->
          <div class="p-3">
            <button
              class="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-all duration-300 group"
              @click="togglePlayerHistory"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span class="text-slate-900 text-sm font-bold">📈</span>
                </div>
                <div class="text-left">
                  <div class="text-sm font-medium text-slate-200">
                    Player Activity History
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ getActiveGameName() }} population trends
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400 hidden sm:block">{{ showPlayerHistory ? 'Hide' : 'Show' }}</span>
                <div
                  class="transform transition-transform duration-300"
                  :class="{ 'rotate-180': showPlayerHistory }"
                >
                  <svg
                    class="w-5 h-5 text-slate-400 group-hover:text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
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
            <!-- Enhanced Period Selector -->
            <div class="flex justify-center gap-1 bg-slate-800/30 rounded-lg p-1">
              <!-- Short periods -->
              <button
                v-for="period in ['1d', '3d', '7d']"
                :key="period"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
                  historyPeriod === period
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                ]"
                @click="changePeriod(period as '1d' | '3d' | '7d')"
              >
                {{ period === '1d' ? '24h' : period === '3d' ? '3 days' : '7 days' }}
              </button>
              
              <!-- Longer periods dropdown -->
              <div class="relative">
                <button
                  :class="[
                    'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1',
                    historyPeriod === 'longer'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  ]"
                  @click="toggleLongerDropdown"
                >
                  {{ getLongerPeriodLabel() }}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <!-- Dropdown menu -->
                <div
                  v-if="showLongerDropdown"
                  class="absolute top-full mt-1 right-0 bg-slate-800/95 backdrop-blur-lg rounded-lg border border-slate-700/50 shadow-xl z-50 min-w-[120px]"
                >
                  <button
                    v-for="period in [{ id: '1month', label: '1 Month' }, { id: '3months', label: '3 Months' }, { id: 'thisyear', label: 'This Year' }, { id: 'alltime', label: 'All Time' }]"
                    :key="period.id"
                    :class="[
                      'w-full text-left px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg',
                      longerPeriod === period.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300'
                    ]"
                    @click="selectLongerPeriod(period.id as '1month' | '3months' | 'thisyear' | 'alltime')"
                  >
                    {{ period.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Chart Container -->
            <div class="bg-slate-800/20 rounded-lg p-4">
              <PlayerHistoryChart
                :chart-data="playerHistoryData"
                :insights="playerHistoryInsights"
                :period="getCurrentPeriod()"
                :rolling-window="historyRollingWindow"
                :loading="historyLoading"
                :error="historyError"
                @rolling-window-change="changeRollingWindow"
              />
            </div>
          </div>
        </div>

        <!-- Game Trends Section -->
        <div class="border-b border-slate-700/30">
          <div class="p-3">
            <!-- Game Trends -->
            <div 
              v-if="gameTrends && !trendsLoading" 
              class="bg-slate-800/30 rounded-lg p-4 space-y-4"
            >
              <!-- Forecast Chart - Vertical Bar Display -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-500 rounded flex items-center justify-center">
                    <span class="text-slate-900 text-xs font-bold">📊</span>
                  </div>
                  <span class="text-xs font-bold text-purple-400 uppercase tracking-wide">Forecast</span>
                </div>
                
                <!-- Vertical bars like Google Maps busy indicator -->
                <div class="flex items-end justify-center gap-1 bg-slate-800/30 rounded-lg p-4 h-32">
                  <div 
                    v-for="(forecast, index) in processedForecast" 
                    :key="index"
                    class="flex flex-col items-center gap-1 flex-1 max-w-[60px] group cursor-pointer"
                  >
                    <!-- Vertical bar -->
                    <div 
                      class="w-6 rounded-t transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30"
                      :class="forecast.isCurrentHour ? 'bg-gradient-to-t from-cyan-300 to-cyan-500 hover:from-cyan-200 hover:to-cyan-400' : 'bg-gradient-to-t from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400'"
                      :style="{ 
                        height: Math.max(8, (forecast.predictedPlayers / gameTrends.maxPredictedPlayers) * 80) + 'px' 
                      }"
                      :title="`${formatHourDisplayFixed(forecast.hourOfDay, forecast.isCurrentHour, index)}: ${Math.round(forecast.predictedPlayers)} players${forecast.isCurrentHour && forecast.actualPlayers ? ` (${forecast.actualPlayers} actual)` : ''}`"
                    />
                    <!-- Time label -->
                    <div class="text-xs font-mono text-center transition-colors duration-300 group-hover:text-slate-200" :class="forecast.isCurrentHour ? 'text-cyan-400 font-bold' : 'text-slate-400'">
                      {{ formatHourDisplayFixed(forecast.hourOfDay, forecast.isCurrentHour, index) }}
                    </div>
                    <!-- Player count -->
                    <div class="text-xs text-center transition-colors duration-300 group-hover:text-slate-200">
                      <div v-if="forecast.isCurrentHour" class="text-cyan-400 font-bold group-hover:text-cyan-300">
                        {{ forecast.actualPlayers || Math.round(forecast.predictedPlayers) }}
                      </div>
                      <div v-else class="text-slate-300 font-semibold">
                        {{ Math.round(forecast.predictedPlayers) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trends Loading State -->
            <div 
              v-else-if="trendsLoading" 
              class="bg-slate-800/30 rounded-lg p-4"
            >
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <span class="text-sm text-slate-400">Loading activity trends...</span>
              </div>
            </div>

            <!-- Trends Error State -->
            <div 
              v-else-if="trendsError" 
              class="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
            >
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
                  <span class="text-red-400 text-xs">⚠️</span>
                </div>
                <span class="text-sm text-red-400">{{ trendsError }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="flex items-center justify-center py-20"
        >
          <div class="text-center space-y-6">
            <div class="relative flex items-center justify-center">
              <div class="w-20 h-20 border-4 border-slate-700 rounded-full animate-spin" />
              <div class="absolute w-20 h-20 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin" />
              <div class="absolute w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse" />
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
          <table class="w-full border-collapse border border-slate-700/30">
            <!-- Table Header -->
            <thead class="sticky top-0 z-10">
              <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                <th class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                  <div class="flex items-center justify-between gap-2">
                    <div
                      class="flex items-center gap-1.5 cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 transition-all duration-300 hover:border-cyan-500/50"
                      @click="sortBy('name')"
                    >
                      <span class="text-slate-400 text-xs">🏷️</span>
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
                    <div
                      class="flex items-center gap-1 cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 transition-all duration-300 hover:border-yellow-500/50"
                      @click="sortBy('timezone')"
                    >
                      <span class="text-yellow-400 text-xs">🌍</span>
                      <span class="font-mono font-bold text-xs">TIME</span>
                      <span
                        class="text-xs transition-transform duration-200"
                        :class="{
                          'text-yellow-400 opacity-100': sortField === 'timezone',
                          'opacity-50': sortField !== 'timezone',
                          'rotate-0': sortField === 'timezone' && sortDirection === 'asc',
                          'rotate-180': sortField === 'timezone' && sortDirection === 'desc'
                        }"
                      >▲</span>
                    </div>
                  </div>
                </th>
                <th
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-green-500/50"
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
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50"
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
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-yellow-500/50"
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
                  class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-purple-500/50"
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
                    <!-- Desktop Layout -->
                    <div class="hidden lg:flex items-center gap-2">
                      <span
                        v-if="server.country"
                        class="text-lg"
                      >{{ getCountryFlag(server.country) }}</span>
                      <div class="flex-1 min-w-0 flex items-center gap-2">
                        <div class="font-bold text-slate-200 truncate max-w-xs text-sm">
                          {{ server.name }}
                        </div>
                        <div
                          v-if="getTimezoneDisplay(server.timezone)"
                          class="text-xs text-slate-400 font-mono"
                        >
                          {{ getTimezoneDisplay(server.timezone) }}
                        </div>
                        <!-- Mini hourly timeline bars (current hour centered) -->
                        <div
                          v-if="serverTrendsByGuid[server.guid]?.hourlyTimeline"
                          class="flex items-end gap-0.5 ml-1 group/timeline relative"
                          aria-label="Server activity timeline"
                          @click.stop="toggleServerModal(server.guid)"
                        >
                          <!-- Original small bars -->
                          <div
                            v-for="(entry, idx) in serverTrendsByGuid[server.guid].hourlyTimeline"
                            :key="idx"
                            class="w-1.5 rounded-t transition-all duration-300 cursor-pointer"
                            :class="entry.isCurrentHour ? 'bg-cyan-400' : 'bg-slate-600'"
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
                            overlay-class="opacity-0 group-hover/timeline:opacity-100"
                            @close="closeServerModal(server.guid)"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <!-- Mobile Layout -->
                    <div class="block lg:hidden">
                      <div class="flex items-center gap-2 mb-1">
                        <span
                          v-if="server.country"
                          class="text-lg"
                        >{{ getCountryFlag(server.country) }}</span>
                        <div class="font-bold text-slate-200 truncate text-sm flex-1">
                          {{ server.name }}
                        </div>
                      </div>
                      
                      <!-- Mobile: Server time and timeline on second line -->
                      <div class="flex items-center gap-2">
                        <div
                          v-if="getTimezoneDisplay(server.timezone)"
                          class="text-xs text-slate-400 font-mono"
                        >
                          {{ getTimezoneDisplay(server.timezone) }}
                        </div>
                        <!-- Mini hourly timeline bars for mobile -->
                        <div
                          v-if="serverTrendsByGuid[server.guid]?.hourlyTimeline"
                          class="flex items-end gap-0.5 ml-1 flex-1 group/timeline relative"
                          aria-label="Server activity timeline"
                          @click.stop="toggleServerModal(server.guid)"
                        >
                          <!-- Original small bars -->
                          <div
                            v-for="(entry, idx) in serverTrendsByGuid[server.guid].hourlyTimeline"
                            :key="idx"
                            class="w-1 rounded-t transition-all duration-300 cursor-pointer"
                            :class="entry.isCurrentHour ? 'bg-cyan-400' : 'bg-slate-600'"
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
                      class="w-5 h-5 rounded bg-cover bg-center border border-slate-600/50"
                      :style="{ backgroundImage: getGameIcon(getGameIconClass(server.gameType)) }"
                    />
                    <span
                      class="px-1.5 py-0.5 rounded text-xs font-bold uppercase font-mono"
                      :class="getGameTypeClass(server.gameType)"
                    >
                      {{ getGameDisplayName(server.gameType) }}
                    </span>
                    <!-- Busy indicator badge -->
                    <span
                      v-if="serverTrendsByGuid[server.guid]?.busyIndicator"
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
                    <div class="font-mono text-xs text-slate-400 font-medium">
                      {{ server.ip }}:{{ server.port }}
                    </div>
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
import { fetchAllServers, fetchServerBusyIndicators, type ServerBusyIndicatorResult, type ServerHourlyTimelineEntry, type BusyLevel } from '../services/serverDetailsService'
import { ServerSummary } from '../types/server'
import { PlayerHistoryDataPoint, PlayerHistoryResponse, PlayerHistoryInsights } from '../types/playerStatsTypes'
import PlayersPanel from '../components/PlayersPanel.vue'
import PlayerHistoryChart from '../components/PlayerHistoryChart.vue'
import { fetchPlayerOnlineHistory } from '../services/playerStatsService'
import { formatTimeRemaining } from '../utils/timeUtils'
import ForecastModal from '../components/ForecastModal.vue'

import bf1942Icon from '@/assets/bf1942.jpg'
import fh2Icon from '@/assets/fh2.jpg'
import bfvIcon from '@/assets/bfv.jpg'

interface GameTrendsInsights {
  currentHourPredictedPlayers: number
  currentActualPlayers: number
  activityComparisonStatus: 'busier_than_usual' | 'quieter_than_usual' | 'as_usual'
  currentStatus: 'very_busy' | 'busy' | 'moderate' | 'quiet' | 'very_quiet'
  trendDirection: 'increasing_significantly' | 'increasing' | 'stable' | 'decreasing' | 'decreasing_significantly'
  nextHourPredictedPlayers: number
  maxPredictedPlayers: number
  forecast: {
    hourOfDay: number
    dayOfWeek: number
    predictedPlayers: number
    dataPoints: number
    isCurrentHour?: boolean
    actualPlayers?: number
    delta?: number
  }[]
  next24HourPeaks: {
    hourOfDay: number
    dayOfWeek: number
    predictedPlayers: number
  }[]
  generatedAt: string
  recommendationMessage: string
}

interface GameTrendsResponse {
  currentActivity: {
    game: string
    serverGuid: string
    currentPlayers: number
    latestActivity: string
    currentMapName: string
  }[]
  insights: GameTrendsInsights
  generatedAt: string
}

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
const playerHistoryInsights = ref<PlayerHistoryInsights | null>(null)
const historyPeriod = ref<'1d' | '3d' | '7d' | 'longer'>('1d')
const longerPeriod = ref<'1month' | '3months' | 'thisyear' | 'alltime'>('1month')
const historyRollingWindow = ref('7d')
const historyLoading = ref(false)
const historyError = ref<string | null>(null)
const showLongerDropdown = ref(false)

// Game trends state
const gameTrends = ref<GameTrendsInsights | null>(null)
const trendsLoading = ref(false)
const trendsError = ref<string | null>(null)

// Per-server trends state (busy indicator + hourly timeline)
const serverTrendsByGuid = ref<Record<string, ServerBusyIndicatorResult>>({})

// Per-server modal state
const serverModalStates = ref<Record<string, boolean>>({})

// Computed properties
const filteredServers = computed(() => {
  return servers.value
})

const processedForecast = computed(() => {
  if (!gameTrends.value?.forecast) return []
  
  const forecast = [...gameTrends.value.forecast]
  
  // Find the current hour entry
  const currentHourEntry = forecast.find(f => f.isCurrentHour)
  if (!currentHourEntry) return forecast
  
  const currentDay = currentHourEntry.dayOfWeek
  const currentHour = currentHourEntry.hourOfDay
  
  // Sort the forecast array chronologically
  return forecast.sort((a, b) => {
    // If both entries are from the same day, sort by hour
    if (a.dayOfWeek === b.dayOfWeek) {
      return a.hourOfDay - b.hourOfDay
    }
    
    // If one entry is from the current day and the other is from the next day
    if (a.dayOfWeek === currentDay && b.dayOfWeek === (currentDay % 7) + 1) {
      return -1 // Current day comes first
    }
    if (b.dayOfWeek === currentDay && a.dayOfWeek === (currentDay % 7) + 1) {
      return 1 // Current day comes first
    }
    
    // If one entry is from the previous day and the other is from the current day
    const prevDay = currentDay === 1 ? 7 : currentDay - 1
    if (a.dayOfWeek === prevDay && b.dayOfWeek === currentDay) {
      return -1 // Previous day comes first
    }
    if (b.dayOfWeek === prevDay && a.dayOfWeek === currentDay) {
      return 1 // Previous day comes first
    }
    
    // Default: sort by day of week
    return a.dayOfWeek - b.dayOfWeek
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
    // Fire-and-forget: fetch per-server busy indicators for active servers (>=5 players)
    fetchAndAttachServerTrends()
  } catch (err) {
    error.value = 'Failed to fetch server data. Please try again.'
    console.error('Error fetching servers:', err)
  } finally {
    if (isInitialLoad) {
      loading.value = false
    }
  }
}

const fetchGameTrends = async (isInitialLoad = false) => {
  // Only show loading state on initial load to prevent flashing
  if (isInitialLoad) {
    trendsLoading.value = true
  }
  trendsError.value = null
  
  try {
    const response = await fetch(`/stats/GameTrends/landing-summary?game=${activeFilter.value}`)
    if (!response.ok) {
      throw new Error('Failed to fetch game trends')
    }

    const data: GameTrendsResponse = await response.json()
    gameTrends.value = data.insights
    console.log('🎮 Game trends loaded:', data.insights)
  } catch (err) {
    trendsError.value = 'Failed to load game trends'
    console.error('Error fetching game trends:', err)
  } finally {
    if (isInitialLoad) {
      trendsLoading.value = false
    }
  }
}

// Helper: fetch per-server busy indicators without blocking main render
const fetchAndAttachServerTrends = async () => {
  try {
    const eligibleGuids = servers.value.filter(s => (s.numPlayers || 0) >= 5 && !!s.guid).map(s => s.guid)
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
    console.warn('Failed to update server busy indicators', e)
  }
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
    default: return 'bg-slate-600/30 text-slate-300 border-slate-600/40'
  }
}

// Timeline bar helpers
const getTimelineBarHeight = (guid: string, entry: ServerHourlyTimelineEntry): number => {
  const timeline = serverTrendsByGuid.value[guid]?.hourlyTimeline || []
  const maxTypical = Math.max(1, ...timeline.map(e => Math.max(0, e.typicalPlayers || 0)))
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
}

const formatTimelineTooltip = (entry: ServerHourlyTimelineEntry): string => {
  // Convert UTC hour to local "HH:00" display
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), entry.hour, 0, 0))
  const local = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const levelLabel = getBusyLevelLabel(entry.busyLevel)
  return `${local} • Typical ${Math.round(entry.typicalPlayers)} • ${levelLabel}`
}

const formatTimelineTimeLabel = (entry: ServerHourlyTimelineEntry): string => {
  // Convert UTC hour to local "HH" display for the expanded view
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), entry.hour, 0, 0))
  return d.toLocaleTimeString(undefined, { hour: '2-digit' })
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
    console.log('🔄 Fetching player history for period:', currentPeriod, 'rolling window:', getRollingWindowDays(historyRollingWindow.value), 'days')
    
    const response = await fetchPlayerOnlineHistory(
      activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam',
      apiPeriod,
      getRollingWindowDays(historyRollingWindow.value)
    )
    
    console.log('📊 API Response:', {
      hasDataPoints: !!response.dataPoints,
      dataPointsLength: response.dataPoints?.length,
      hasInsights: !!response.insights,
      rollingAverageLength: response.insights?.rollingAverage?.length,
      period: response.period
    })
    
    // Set the response data - only update if we have valid data
    if (response.dataPoints && response.dataPoints.length > 0) {
      playerHistoryData.value = response.dataPoints
    }
    if (response.insights) {
      playerHistoryInsights.value = response.insights
    }
    console.log('✅ Set insights data:', {
      hasRollingAverage: !!(response.insights?.rollingAverage),
      rollingPoints: response.insights?.rollingAverage?.length || 0
    })
  } catch (err) {
    historyError.value = 'Failed to load player history'
    // Only clear data on error, not during normal updates
    if (playerHistoryData.value.length === 0) {
      playerHistoryData.value = []
      playerHistoryInsights.value = null
    }
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
  showLongerDropdown.value = false
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

const toggleLongerDropdown = () => {
  showLongerDropdown.value = !showLongerDropdown.value
}

const selectLongerPeriod = (period: '1month' | '3months' | 'thisyear' | 'alltime') => {
  longerPeriod.value = period
  historyPeriod.value = 'longer'
  showLongerDropdown.value = false
  fetchPlayerHistory()
}

const getLongerPeriodLabel = () => {
  if (historyPeriod.value !== 'longer') return 'More'
  const labels = {
    '1month': '1 Month',
    '3months': '3 Months', 
    'thisyear': 'This Year',
    'alltime': 'All Time'
  }
  return labels[longerPeriod.value]
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

// Game trends helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'very_busy': return 'from-red-500 to-orange-500'
    case 'busy': return 'from-orange-500 to-yellow-500'
    case 'moderate': return 'from-yellow-500 to-green-500'
    case 'quiet': return 'from-green-500 to-blue-500'
    case 'very_quiet': return 'from-blue-500 to-slate-500'
    default: return 'from-slate-500 to-slate-600'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'very_busy': return '🔥'
    case 'busy': return '⚡'
    case 'moderate': return '⚖️'
    case 'quiet': return '🌙'
    case 'very_quiet': return '💤'
    default: return '❓'
  }
}

const getTrendIcon = (direction: string) => {
  switch (direction) {
    case 'increasing_significantly': return '🚀'
    case 'increasing': return '📈'
    case 'stable': return '➡️'
    case 'decreasing': return '📉'
    case 'decreasing_significantly': return '⬇️'
    default: return '➡️'
  }
}

const formatHourDisplay = (hourUTC: number) => {
  const now = new Date()
  const currentHour = now.getUTCHours()
  let diff = hourUTC - currentHour
  
  // Handle day boundary crossings (e.g., 22, 23, 0, 1)
  if (diff > 12) diff -= 24
  if (diff < -12) diff += 24
  
  if (diff === 0) return 'Now'
  if (diff === 1) return '+1h'
  if (diff === 2) return '+2h'
  if (diff === 3) return '+3h'
  if (diff === 4) return '+4h'
  if (diff > 0) return `+${diff}h`
  if (diff === -1) return '-1h'
  return `${diff}h`
}

const formatHourDisplayFixed = (hourUTC: number, isCurrentHour?: boolean, forecastIndex?: number) => {
  // If we have the isCurrentHour flag from the API, use it directly
  if (isCurrentHour !== undefined) {
    if (isCurrentHour) return 'Now'
  }
  
  // Convert UTC hour to local time
  const now = new Date()
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUTC, 0, 0))
  const localHour = utcDate.getHours()
  
  // Format the hour as 12-hour time with am/pm
  const formatHour = (hour: number) => {
    if (hour === 0) return '12am'
    if (hour < 12) return `${hour}am`
    if (hour === 12) return '12pm'
    return `${hour - 12}pm`
  }
  
  return formatHour(localHour)
}

const getHoursUntilPeak = () => {
  if (!processedForecast.value.length) return 'Peak expected'
  
  const peakForecast = processedForecast.value.find(
    f => f.predictedPlayers === gameTrends.value!.maxPredictedPlayers
  )
  
  if (!peakForecast) return 'Peak expected'
  
  const currentHourIndex = processedForecast.value.findIndex(f => f.isCurrentHour)
  if (currentHourIndex === -1) return 'Peak expected'
  
  const peakIndex = processedForecast.value.findIndex(f => f.predictedPlayers === gameTrends.value!.maxPredictedPlayers)
  const diff = peakIndex - currentHourIndex
  
  if (diff === 0) return 'Peak now'
  if (diff === 1) return 'Peak in 1 hour'
  if (diff > 0) return `Peak in ${diff} hours`
  return 'Peak expected'
}

const getActivityComparisonInfo = (status: string) => {
  switch (status) {
    case 'busier_than_usual':
      return { label: 'Busier than usual', color: 'text-green-400', icon: '📈', bgColor: 'from-green-400 to-emerald-500' }
    case 'quieter_than_usual':
      return { label: 'Quieter than usual', color: 'text-blue-400', icon: '📉', bgColor: 'from-blue-400 to-cyan-500' }
    case 'as_usual':
      return { label: 'As usual', color: 'text-slate-400', icon: '➡️', bgColor: 'from-slate-400 to-slate-500' }
    default:
      return { label: 'Normal', color: 'text-slate-400', icon: '➡️', bgColor: 'from-slate-400 to-slate-500' }
  }
}

// Watch for game filter changes and fetch new data
watch(activeFilter, (newFilter) => {
  // Reset per-server trends when switching games to avoid stale badges
  serverTrendsByGuid.value = {}
  fetchServersForGame(newFilter as 'bf1942' | 'fh2' | 'bfvietnam', true)
  // Also refresh player history if it's visible
  if (showPlayerHistory.value) {
    fetchPlayerHistory()
  }
  // Refresh game trends
  fetchGameTrends(true)
})

// Lifecycle
onMounted(() => {
  fetchServersForGame(activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam', true)
  fetchGameTrends(true)
  
  refreshTimer.value = window.setInterval(() => {
    fetchServersForGame(activeFilter.value as 'bf1942' | 'fh2' | 'bfvietnam', false)
    
    // Only fetch trends if we're at a new hour
    const now = new Date()
    const lastFetchTime = gameTrends.value ? new Date(gameTrends.value.generatedAt) : null
    if (!lastFetchTime || now.getUTCHours() !== lastFetchTime.getUTCHours()) {
      fetchGameTrends()
    }
  }, 300000)
  
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const target = e.target as Element
    if (!target.closest('.relative')) {
      showLongerDropdown.value = false
    }
  })
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