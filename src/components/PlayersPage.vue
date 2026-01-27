<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch, defineProps } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { formatLastSeen } from '@/utils/timeUtils';

// Props from parent
interface Props {
  searchQuery?: string;
}

const props = defineProps<Props>();


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
const _router = useRouter();
const _route = useRoute();

// State variables
const players = ref<PlayerSearchResult[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const sortBy = ref<string>('lastSeen');
const sortOrder = ref<'asc' | 'desc'>('desc');


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
    const query = String(props.searchQuery || '');
    if (query.trim()) {
      params.append('playerName', query.trim());
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

// Watch for external search query changes
watch(() => props.searchQuery, (newQuery) => {
  if (newQuery !== undefined) {
    currentPage.value = 1;
    fetchPlayers();
  }
});

// Lifecycle hooks
onMounted(() => {
  // Load active players by default on page load
  fetchPlayers();
});

onUnmounted(() => {
  // Cleanup handled by parent component
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-20 text-slate-400"
    >
      <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4" />
      <p class="text-lg text-slate-300">
        Loading players...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-slate-800/70 backdrop-blur-sm border border-red-800/50 rounded-xl p-8 text-center"
    >
      <div class="text-6xl mb-4">
        ⚠️
      </div>
      <p class="text-red-400 text-lg font-medium">
        {{ error }}
      </p>
    </div>

    <!-- Welcome State -->
    <div
      v-else-if="!props.searchQuery && players.length === 0"
      class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-slate-700/50">
        <h3 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-3">
          🎯 Player Search
        </h3>
      </div>
      <div class="p-6">
        <div class="text-center space-y-6">
          <p class="text-lg text-slate-300 font-medium">
            Start typing a player name above to find their stats and recent activity.
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div class="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">
                🔍
              </div>
              <div class="text-sm text-slate-300">
                Search by <span class="text-cyan-400 font-semibold">partial names</span>
              </div>
            </div>
            <div class="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">
                ⚡
              </div>
              <div class="text-sm text-slate-300">
                Press <span class="text-cyan-400 font-semibold">Enter</span> for first result
              </div>
            </div>
            <div class="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 text-center">
              <div class="text-2xl mb-2">
                📊
              </div>
              <div class="text-sm text-slate-300">
                View <span class="text-cyan-400 font-semibold">live stats</span> and activity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results State -->
    <div
      v-else-if="props.searchQuery && players.length === 0"
      class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center"
    >
      <div class="text-6xl mb-4 opacity-50">
        🔍
      </div>
      <h3 class="text-2xl font-bold text-slate-200 mb-2">
        No players found
      </h3>
      <p class="text-slate-400">
        No players match "<span class="text-slate-200 font-semibold">{{ props.searchQuery || '' }}</span>"
      </p>
      <p class="text-sm text-slate-500 mt-2 italic">
        Try a different spelling or partial name.
      </p>
    </div>
          
    <!-- Players Results Section -->
    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full border-collapse border border-slate-700/30">
        <!-- Table Header -->
        <thead class="sticky top-0 z-10">
          <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
            <th
              class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50"
              @click="sortPlayers('playerName')"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-cyan-400 text-xs">👤</span>
                <span class="font-mono font-bold">PLAYER</span>
                <span
                  class="text-xs transition-transform duration-200"
                  :class="{
                    'text-cyan-400 opacity-100': sortBy === 'playerName',
                    'opacity-50': sortBy !== 'playerName',
                    'rotate-0': sortBy === 'playerName' && sortOrder === 'asc',
                    'rotate-180': sortBy === 'playerName' && sortOrder === 'desc'
                  }"
                >▲</span>
              </div>
            </th>
            <th
              class="group p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50"
              @click="sortPlayers('lastSeen')"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-orange-400 text-xs">📅</span>
                <span class="font-mono font-bold">LAST SEEN</span>
                <span
                  class="text-xs transition-transform duration-200"
                  :class="{
                    'text-orange-400 opacity-100': sortBy === 'lastSeen',
                    'opacity-50': sortBy !== 'lastSeen',
                    'rotate-0': sortBy === 'lastSeen' && sortOrder === 'asc',
                    'rotate-180': sortBy === 'lastSeen' && sortOrder === 'desc'
                  }"
                >▲</span>
              </div>
            </th>
            <th class="p-1.5 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
              <div class="flex items-center gap-1.5">
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
            class="group transition-all duration-300 hover:bg-slate-800/20 border-b border-slate-700/30"
            :class="{
              'bg-green-500/5': player.isActive,
              'bg-slate-800/30': !player.isActive
            }"
          >
            <!-- Player Name -->
            <td class="p-1.5">
              <router-link 
                :to="`/players/${encodeURIComponent(player.playerName)}`" 
                class="block group-hover:text-cyan-400 transition-all duration-300 no-underline"
              >
                <div class="font-bold text-slate-200 truncate max-w-xs text-sm">
                  {{ player.playerName }}
                </div>
              </router-link>
            </td>

            <!-- Last Seen -->
            <td class="p-1.5">
              <div class="font-mono text-sm text-orange-400 font-medium">
                {{ formatLastSeen(player.lastSeen) }}
              </div>
            </td>

            <!-- Status -->
            <td class="p-1.5">
              <div
                v-if="player.isActive"
                class="flex items-start gap-2"
              >
                <span class="text-green-400 text-xs mt-0.5">🟢</span>
                <div
                  v-if="player.currentServer"
                  class="space-y-1"
                >
                  <router-link 
                    :to="`/servers/${encodeURIComponent(player.currentServer.serverName)}`" 
                    class="text-cyan-400 hover:text-cyan-300 font-medium text-xs block max-w-[160px] truncate no-underline transition-colors duration-200"
                  >
                    {{ player.currentServer.serverName }}
                  </router-link>
                  <div class="flex items-center gap-1 text-xs font-mono">
                    <span
                      class="font-bold"
                      :class="{
                        'text-emerald-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) >= 100,
                        'text-blue-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) >= 50,
                        'text-orange-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) >= 25,
                        'text-slate-400': (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) < 25
                      }"
                    >
                      {{ (player.currentServer.sessionKills || 0) + (player.currentServer.sessionDeaths || 0) }}
                    </span>
                    <span class="text-slate-500">/</span>
                    <span
                      class="font-bold"
                      :class="{
                        'text-red-400': (player.currentServer.sessionKills || 0) >= 30,
                        'text-orange-400': (player.currentServer.sessionKills || 0) >= 15,
                        'text-green-400': (player.currentServer.sessionKills || 0) >= 5,
                        'text-slate-400': (player.currentServer.sessionKills || 0) < 5
                      }"
                    >
                      {{ player.currentServer.sessionKills || 0 }}
                    </span>
                    <span class="text-slate-500">/</span>
                    <span
                      class="font-bold"
                      :class="{
                        'text-red-400': (player.currentServer.sessionDeaths || 0) >= 20,
                        'text-orange-400': (player.currentServer.sessionDeaths || 0) >= 10,
                        'text-green-400': (player.currentServer.sessionDeaths || 0) >= 5,
                        'text-blue-400': (player.currentServer.sessionDeaths || 0) < 5
                      }"
                    >
                      {{ player.currentServer.sessionDeaths || 0 }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="flex items-center gap-2"
              >
                <span class="text-slate-500 text-xs">⚫</span>
                <span class="text-slate-500 font-medium text-xs uppercase">OFFLINE</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      
      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-6 border-t border-slate-700/30 pt-6"
      >
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
</template>

<style scoped src="./PlayersPage.vue.css"></style>
