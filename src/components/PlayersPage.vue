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
  <div class="min-h-screen bg-slate-900">
    <!-- Enhanced Search Section -->
    <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-3 sm:p-6">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-4 sm:mb-6">
          <h1 class="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">Find Players</h1>
          <p class="text-slate-400 text-xs sm:text-sm">Search for players and view their stats, activity, and current server status</p>
        </div>
        
        <div class="relative group max-w-2xl mx-auto">
          <!-- Enhanced Search Icon with Glow -->
          <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
              <span class="text-slate-900 text-xs font-bold">🔍</span>
            </div>
          </div>
          
          <!-- Premium Search Input -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for any player..."
            class="w-full pl-12 sm:pl-14 pr-16 sm:pr-20 py-3 sm:py-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/20 focus:shadow-cyan-500/30 text-base sm:text-lg"
            @input="onSearchInput"
            @keyup.enter="onSearchEnter"
          >
          
          <!-- Loading Spinner -->
          <div v-if="isSearchLoading" class="absolute right-12 sm:right-16 top-1/2 transform -translate-y-1/2">
            <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
          
          <!-- Clear Button -->
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-all duration-200 flex items-center justify-center font-bold text-base sm:text-lg hover:scale-105"
          >
            ×
          </button>
          
          <!-- Search Glow Effect -->
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
          Loading players...
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

    <!-- Hero Section -->
    <div v-else-if="!searchQuery.trim() && players.length === 0" class="max-w-4xl mx-auto px-6 py-16">
      <div class="text-center space-y-8">
        <div class="space-y-4">
          <div class="w-24 h-24 mx-auto bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-full flex items-center justify-center border border-slate-600/50">
            <span class="text-4xl">🎯</span>
          </div>
          <p class="text-xl text-slate-300 font-medium">Start typing a player name above to find their stats and recent activity.</p>
        </div>
        
        <div class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 max-w-lg mx-auto">
          <h3 class="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <span>💡</span> Search Tips
          </h3>
          <div class="space-y-3 text-left">
            <div class="flex items-start gap-3 text-sm text-slate-300">
              <span class="text-green-400 font-bold">•</span>
              <span>You can search by <strong class="text-white">partial names</strong></span>
            </div>
            <div class="flex items-start gap-3 text-sm text-slate-300">
              <span class="text-cyan-400 font-bold">•</span>
              <span>Press <strong class="text-white">Enter</strong> to go to the first result</span>
            </div>
            <div class="flex items-start gap-3 text-sm text-slate-300">
              <span class="text-purple-400 font-bold">•</span>
              <span>See <strong class="text-white">live server activity</strong> and stats</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results Section -->
    <div v-else-if="searchQuery.trim() && players.length === 0" class="max-w-2xl mx-auto px-6 py-16">
      <div class="text-center space-y-6">
        <div class="w-20 h-20 mx-auto bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-full flex items-center justify-center border border-slate-600/50">
          <span class="text-3xl">🔍</span>
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-bold text-slate-200">No players found</h3>
          <p class="text-slate-400">No players match "<strong class="text-white">{{ searchQuery }}</strong>"</p>
          <p class="text-sm text-slate-500 italic">Try a different spelling or partial name.</p>
        </div>
      </div>
    </div>
    
    <!-- Players Table Section -->
    <div v-else class="max-w-7xl mx-auto px-3 sm:px-6 pt-6">
      <!-- Table Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div class="flex items-center gap-4">
          <div class="text-sm font-bold text-slate-300">
            <span class="text-cyan-400">{{ totalItems }}</span> players found
          </div>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <label class="text-slate-400 font-medium">Show:</label>
          <select 
            :value="pageSize" 
            @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
            class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <!-- Compact Players Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-slate-700/30 min-w-[800px] lg:min-w-full">
          <!-- Table Header -->
          <thead class="sticky top-0 z-10">
            <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
              <th @click="sortPlayers('playerName')" class="group p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50">
                <div class="flex items-center gap-2">
                  <span class="text-cyan-400 text-xs">👤</span>
                  <span class="font-mono font-bold">PLAYER</span>
                  <span class="text-xs transition-transform duration-200" :class="{
                    'text-cyan-400 opacity-100': sortBy === 'playerName',
                    'opacity-50': sortBy !== 'playerName',
                    'rotate-0': sortBy === 'playerName' && sortOrder === 'asc',
                    'rotate-180': sortBy === 'playerName' && sortOrder === 'desc'
                  }">▲</span>
                </div>
              </th>
              <th @click="sortPlayers('lastSeen')" class="group p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50">
                <div class="flex items-center gap-2">
                  <span class="text-orange-400 text-xs">📅</span>
                  <span class="font-mono font-bold">LAST SEEN</span>
                  <span class="text-xs transition-transform duration-200" :class="{
                    'text-orange-400 opacity-100': sortBy === 'lastSeen',
                    'opacity-50': sortBy !== 'lastSeen',
                    'rotate-0': sortBy === 'lastSeen' && sortOrder === 'asc',
                    'rotate-180': sortBy === 'lastSeen' && sortOrder === 'desc'
                  }">▲</span>
                </div>
              </th>
              <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                <div class="flex items-center gap-2">
                  <span class="text-purple-400 text-xs">📡</span>
                  <span class="font-mono font-bold">STATUS</span>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody>
            <tr
              v-for="player in players"
              :key="player.playerName"
              class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/30"
              :class="{
                'bg-green-500/5': player.isActive,
                'bg-slate-500/5': !player.isActive
              }"
            >
              <!-- Player Name -->
              <td class="p-2">
                <router-link 
                  :to="`/players/${encodeURIComponent(player.playerName)}`" 
                  class="font-bold text-slate-200 hover:text-cyan-400 transition-colors duration-300 no-underline block max-w-[200px] truncate text-sm"
                >
                  {{ player.playerName }}
                </router-link>
              </td>


              <!-- Last Seen -->
              <td class="p-2">
                <div class="font-mono text-sm text-orange-400 font-medium">
                  {{ formatLastSeen(player.lastSeen) }}
                </div>
              </td>

              <!-- Status -->
              <td class="p-2">
                <div v-if="player.isActive" class="flex items-start gap-2">
                  <span class="text-green-400 text-xs mt-0.5">🟢</span>
                  <div v-if="player.currentServer" class="space-y-1">
                    <router-link 
                      :to="`/servers/${encodeURIComponent(player.currentServer.serverName)}`" 
                      class="text-cyan-400 hover:text-cyan-300 font-medium text-xs block max-w-[160px] truncate no-underline transition-colors duration-300"
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

      <!-- Enhanced Pagination -->
      <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6 pb-4 sm:pb-6">
        <!-- First Page -->
        <button 
          class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono font-bold bg-slate-800/60 border border-slate-700/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1" 
          @click="goToPage(1)"
        >
          ««
        </button>
        
        <!-- Previous Page -->
        <button 
          class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono font-bold bg-slate-800/60 border border-slate-700/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1" 
          @click="goToPage(currentPage - 1)"
        >
          ‹
        </button>
        
        <!-- Page Numbers -->
        <button 
          v-for="page in paginationRange" 
          :key="page" 
          class="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-mono font-bold rounded-lg transition-all duration-200 min-w-[32px] sm:min-w-[40px]"
          :class="{
            'bg-gradient-to-r from-cyan-600 to-purple-600 border border-cyan-500/50 text-white shadow-lg shadow-cyan-500/30': page === currentPage,
            'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-white': page !== currentPage
          }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        
        <!-- Next Page -->
        <button 
          class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono font-bold bg-slate-800/60 border border-slate-700/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages" 
          @click="goToPage(currentPage + 1)"
        >
          ›
        </button>
        
        <!-- Last Page -->
        <button 
          class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono font-bold bg-slate-800/60 border border-slate-700/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages" 
          @click="goToPage(totalPages)"
        >
          ››
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
