<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { formatLastSeen } from '@/utils/timeUtils';

// Interface for player search results - matching what's used in other parts of the app
interface PlayerSearchResult {
  playerName: string;
  totalPlayTimeMinutes: number;
  lastSeen: string;
  isActive: boolean;
  currentServer?: {
    serverGuid: string;
    serverName: string;
    sessionKills: number;
    sessionDeaths: number;
    mapName: string;
    gameId: string;
  };
}

interface PlayerSearchResponse {
  items: PlayerSearchResult[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Router
const router = useRouter();
const route = useRoute();

// State variables
const players = ref<PlayerSearchResult[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const sortBy = ref<string>('lastSeen');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Search functionality
const searchQuery = ref('');
const isSearchLoading = ref(false);
const searchTimeout = ref<number | null>(null);

// Pagination state - start with reasonable defaults
const currentPage = ref(1);
const pageSize = ref(100);
const totalItems = ref(0);
const totalPages = ref(0);

// No filters for now - just search


// Sort players function
const sortPlayers = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = field === 'lastSeen' ? 'desc' : 'asc';
  }
  
  currentPage.value = 1;
  fetchPlayers();
};

const getSortClass = (field: string) => {
  if (sortBy.value !== field) return '';
  return sortOrder.value === 'asc' ? 'asc' : 'desc';
};

// Pro gamer color coding functions (inspired by PlayersPanel.vue)
const getScoreClass = (score: number) => {
  if (score >= 100) return 'score-excellent';
  if (score >= 50) return 'score-good';
  if (score >= 25) return 'score-average';
  return 'score-low';
};

const getKillsClass = (kills: number) => {
  if (kills >= 30) return 'kills-excellent';
  if (kills >= 15) return 'kills-good';
  if (kills >= 5) return 'kills-average';
  return 'kills-low';
};

const getDeathsClass = (deaths: number) => {
  if (deaths >= 20) return 'deaths-high';
  if (deaths >= 10) return 'deaths-medium';
  if (deaths >= 5) return 'deaths-low';
  return 'deaths-minimal';
};



// Handle search input with debouncing
const onSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1; // Reset to first page when searching
    fetchPlayers();
  }, 300) as unknown as number;
};

// Navigate to player profile
const navigateToPlayer = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
};

// Fetch players list for main table
const fetchPlayers = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Available query parameters for future use:
    // page, pageSize, sortBy, sortOrder, playerName, minPlayTime, maxPlayTime,
    // lastSeenFrom, lastSeenTo, isActive, serverName, gameId, mapName
    
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });

    // Add search query if provided - use playerName parameter
    if (searchQuery.value.trim()) {
      params.append('playerName', searchQuery.value.trim());
      // Don't filter by isActive when searching to include offline players
    } else {
      // Only show active players when not searching
      params.append('isActive', 'true');
    }

    const response = await fetch(`/stats/players?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch players');
    }

    const data: PlayerSearchResponse = await response.json();
    players.value = data.items;
    totalItems.value = data.totalItems;
    totalPages.value = data.totalPages;

  } catch (err) {
    console.error('Error fetching players:', err);
    error.value = 'Failed to fetch players data. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Pagination functions
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchPlayers();
};

const changePageSize = (newPageSize: number) => {
  pageSize.value = newPageSize;
  currentPage.value = 1;
  fetchPlayers();
};

// Handle enter key in search
const onSearchEnter = () => {
  if (searchQuery.value.trim() && players.value.length === 1) {
    // If there's exactly one result, navigate to that player
    navigateToPlayer(players.value[0].playerName);
  } else if (searchQuery.value.trim() && players.value.length > 0) {
    // If there are multiple results, navigate to the first one
    navigateToPlayer(players.value[0].playerName);
  }
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  fetchPlayers();
};

// Computed property for pagination range display
const paginationRange = computed(() => {
  const range = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

  // Adjust start page if end page is at max
  if (endPage === totalPages.value) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }

  return range;
});

// Lifecycle hooks
onMounted(() => {
  // Load active players by default on page load
  fetchPlayers();
});

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<template>
  <div>
    <!-- Search Section -->
    <div class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl mb-6">
      <div class="p-6">
        <div class="relative group max-w-2xl mx-auto">
          <!-- Search Icon -->
          <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <span class="text-slate-400 text-lg">🔍</span>
          </div>
          
          <!-- Search Input -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for any player..."
            class="w-full pl-12 pr-20 py-4 bg-slate-700 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 text-lg"
            @input="onSearchInput"
            @keyup.enter="onSearchEnter"
          >
          
          <!-- Loading Spinner -->
          <div v-if="isSearchLoading" class="absolute right-16 top-1/2 transform -translate-y-1/2">
            <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
          
          <!-- Clear Button -->
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-slate-600 hover:bg-slate-500 border border-slate-500 rounded-lg text-slate-400 hover:text-slate-200 transition-all duration-200 flex items-center justify-center font-bold text-lg"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-20 text-slate-400"
    >
      <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
      <p class="text-lg text-slate-300">Loading players...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-slate-800/70 backdrop-blur-sm border border-red-800/50 rounded-xl p-8 text-center"
    >
      <div class="text-6xl mb-4">⚠️</div>
      <p class="text-red-400 text-lg font-medium">{{ error }}</p>
    </div>

    <!-- Welcome State -->
    <div
      v-else-if="!searchQuery.trim() && players.length === 0"
      class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-slate-700/50">
        <h3 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-3">
          🎯 Player Search
        </h3>
      </div>
      <div class="p-6">
        <div class="text-center space-y-6">
          <p class="text-lg text-slate-300 font-medium">Start typing a player name above to find their stats and recent activity.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div class="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">🔍</div>
              <div class="text-sm text-slate-300">Search by <span class="text-cyan-400 font-semibold">partial names</span></div>
            </div>
            <div class="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">⚡</div>
              <div class="text-sm text-slate-300">Press <span class="text-cyan-400 font-semibold">Enter</span> for first result</div>
            </div>
            <div class="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">📊</div>
              <div class="text-sm text-slate-300">View <span class="text-cyan-400 font-semibold">live stats</span> and activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results State -->
    <div
      v-else-if="searchQuery.trim() && players.length === 0"
      class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center"
    >
      <div class="text-6xl mb-4 opacity-50">🔍</div>
      <h3 class="text-2xl font-bold text-slate-200 mb-2">No players found</h3>
      <p class="text-slate-400">No players match "<span class="text-slate-200 font-semibold">{{ searchQuery }}</span>"</p>
      <p class="text-sm text-slate-500 mt-2 italic">Try a different spelling or partial name.</p>
    </div>
          
    <!-- Players Results Section -->
    <div v-else class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-700/50">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
            👥 Player Results
            <span class="text-sm font-normal text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full">{{ totalItems }} found</span>
          </h3>
          <div class="flex items-center gap-2 text-sm">
            <label class="text-slate-400 font-medium">Show:</label>
            <select 
              :value="pageSize" 
              @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
              class="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
      <div class="p-6">
              <!-- Players Table -->
              <div class="overflow-x-auto">
                <table class="w-full border-collapse min-w-[800px] lg:min-w-full">
                  <!-- Table Header -->
                  <thead>
                    <tr class="bg-slate-700/50 border-b border-slate-600/50">
                      <th @click="sortPlayers('playerName')" class="group p-4 text-left font-medium text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-600/50 transition-all duration-200">
                        <div class="flex items-center gap-2">
                          <span class="text-cyan-400 text-sm">👤</span>
                          <span class="font-semibold">PLAYER</span>
                          <span class="text-xs transition-transform duration-200" :class="{
                            'text-cyan-400 opacity-100': sortBy === 'playerName',
                            'opacity-50': sortBy !== 'playerName',
                            'rotate-0': sortBy === 'playerName' && sortOrder === 'asc',
                            'rotate-180': sortBy === 'playerName' && sortOrder === 'desc'
                          }">▲</span>
                        </div>
                      </th>
                      <th @click="sortPlayers('lastSeen')" class="group p-4 text-left font-medium text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-600/50 transition-all duration-200">
                        <div class="flex items-center gap-2">
                          <span class="text-orange-400 text-sm">📅</span>
                          <span class="font-semibold">LAST SEEN</span>
                          <span class="text-xs transition-transform duration-200" :class="{
                            'text-orange-400 opacity-100': sortBy === 'lastSeen',
                            'opacity-50': sortBy !== 'lastSeen',
                            'rotate-0': sortBy === 'lastSeen' && sortOrder === 'asc',
                            'rotate-180': sortBy === 'lastSeen' && sortOrder === 'desc'
                          }">▲</span>
                        </div>
                      </th>
                      <th class="p-4 text-left font-medium text-xs uppercase tracking-wide text-slate-300">
                        <div class="flex items-center gap-2">
                          <span class="text-purple-400 text-sm">📡</span>
                          <span class="font-semibold">STATUS</span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <!-- Table Body -->
                  <tbody class="bg-slate-800/50">
                    <tr
                      v-for="player in players"
                      :key="player.playerName"
                      class="group transition-all duration-200 hover:bg-slate-700/30 border-b border-slate-600/30"
                      :class="{
                        'bg-green-500/5': player.isActive,
                        'bg-slate-800/30': !player.isActive
                      }"
                    >
                      <!-- Player Name -->
                      <td class="p-4">
                        <router-link 
                          :to="`/players/${encodeURIComponent(player.playerName)}`" 
                          class="font-semibold text-slate-200 hover:text-cyan-400 transition-colors duration-200 no-underline block max-w-[200px] truncate text-sm"
                        >
                          {{ player.playerName }}
                        </router-link>
                      </td>

                      <!-- Last Seen -->
                      <td class="p-4">
                        <div class="font-mono text-sm text-orange-400 font-medium">
                          {{ formatLastSeen(player.lastSeen) }}
                        </div>
                      </td>

                      <!-- Status -->
                      <td class="p-4">
                        <div v-if="player.isActive" class="flex items-start gap-2">
                          <span class="text-green-400 text-xs mt-0.5">🟢</span>
                          <div v-if="player.currentServer" class="space-y-1">
                            <router-link 
                              :to="`/servers/${encodeURIComponent(player.currentServer.serverName)}`" 
                              class="text-cyan-400 hover:text-cyan-300 font-medium text-xs block max-w-[160px] truncate no-underline transition-colors duration-200"
                            >
                              {{ player.currentServer.serverName }}
                            </router-link>
                            <div class="flex items-center gap-1 text-xs font-mono">
                              <span class="font-bold" :class="{
                                'text-emerald-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) >= 100,
                                'text-blue-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) >= 50,
                                'text-orange-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) >= 25,
                                'text-slate-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) < 25
                              }">
                                {{ (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) }}
                              </span>
                              <span class="text-slate-500">/</span>
                              <span class="font-bold" :class="{
                                'text-red-400': (player.currentServer.sessionKills || 0) >= 30,
                                'text-orange-400': (player.currentServer.sessionKills || 0) >= 15,
                                'text-green-400': (player.currentServer.sessionKills || 0) >= 5,
                                'text-slate-400': (player.currentServer.sessionKills || 0) < 5
                              }">
                                {{ player.currentServer.sessionKills || 0 }}
                              </span>
                              <span class="text-slate-500">/</span>
                              <span class="font-bold" :class="{
                                'text-red-400': (player.currentServer.sessionDeaths || 0) >= 20,
                                'text-orange-400': (player.currentServer.sessionDeaths || 0) >= 10,
                                'text-green-400': (player.currentServer.sessionDeaths || 0) >= 5,
                                'text-blue-400': (player.currentServer.sessionDeaths || 0) < 5
                              }">
                                {{ player.currentServer.sessionDeaths || 0 }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div v-else class="flex items-center gap-2">
                          <span class="text-slate-500 text-xs">⚫</span>
                          <span class="text-slate-500 font-medium text-xs uppercase">OFFLINE</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-6 border-t border-slate-600/50 pt-6">
          <!-- First Page -->
          <button 
            class="px-3 py-2 text-sm font-medium bg-slate-700 border border-slate-600 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === 1" 
            @click="goToPage(1)"
          >
            ««
          </button>
          
          <!-- Previous Page -->
          <button 
            class="px-3 py-2 text-sm font-medium bg-slate-700 border border-slate-600 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === 1" 
            @click="goToPage(currentPage - 1)"
          >
            ‹
          </button>
          
          <!-- Page Numbers -->
          <button 
            v-for="page in paginationRange" 
            :key="page" 
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 min-w-[40px]"
            :class="{
              'bg-gradient-to-r from-cyan-600 to-purple-600 border border-cyan-500/50 text-white shadow-lg shadow-cyan-500/20': page === currentPage,
              'bg-slate-700 border border-slate-600 text-slate-400 hover:bg-slate-600 hover:border-slate-500 hover:text-slate-200': page !== currentPage
            }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          
          <!-- Next Page -->
          <button 
            class="px-3 py-2 text-sm font-medium bg-slate-700 border border-slate-600 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === totalPages" 
            @click="goToPage(currentPage + 1)"
          >
            ›
          </button>
          
          <!-- Last Page -->
          <button 
            class="px-3 py-2 text-sm font-medium bg-slate-700 border border-slate-600 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === totalPages" 
            @click="goToPage(totalPages)"
          >
            ››
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations for enhanced visual effects */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
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

/* Ensure table has proper scrolling on mobile */
@media (max-width: 1024px) {
  table {
    min-width: 800px;
  }
}
</style>
