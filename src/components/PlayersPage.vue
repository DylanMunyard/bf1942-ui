<script setup lang="ts">
import { ref, onMounted, computed, watch, defineProps } from 'vue';
import { useRouter } from 'vue-router';
import { formatLastSeen, formatPlayTime } from '@/utils/timeUtils';
import { calculateKDR, getKDRColor } from '@/utils/statsUtils';

// Props from parent
interface Props {
  searchQuery?: string;
  manualSearch?: boolean; // If true, don't auto-load on mount
}

const props = defineProps<Props>();

// Router
const router = useRouter();

// Interface for player search results with enhanced stats
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
  // Enhanced stats (from aggregate tables)
  totalKills?: number;
  totalDeaths?: number;
  totalRounds?: number;
  favoriteServer?: string;
  recentActivity?: {
    roundsThisWeek: number;
    lastScore?: number;
  };
}

interface PlayerSearchResponse {
  items: PlayerSearchResult[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// State variables
const players = ref<PlayerSearchResult[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const sortBy = ref<string>('lastSeen');
const sortOrder = ref<'asc' | 'desc'>('desc');
const hasSearched = ref(false);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(50);
const totalItems = ref(0);
const totalPages = ref(0);

// Sort players function
const sortPlayers = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = field === 'lastSeen' ? 'desc' : 'asc';
  }

  currentPage.value = 1;
  if (hasSearched.value) {
    fetchPlayers();
  }
};

// Fetch players list
const fetchPlayers = async () => {
  loading.value = true;
  error.value = null;
  hasSearched.value = true;

  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });

    const query = String(props.searchQuery || '');
    if (query.trim()) {
      params.append('playerName', query.trim());
    } else if (props.manualSearch) {
      // In manual search mode, don't fetch without a query
      players.value = [];
      loading.value = false;
      hasSearched.value = false;
      return;
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

// Computed property for pagination range display
const paginationRange = computed(() => {
  const range = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

  if (endPage === totalPages.value) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }

  return range;
});

// Navigate to player profile
const navigateToPlayer = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
};

// Watch for external search query changes
watch(() => props.searchQuery, (newQuery, oldQuery) => {
  if (newQuery !== oldQuery) {
    currentPage.value = 1;
    if (newQuery?.trim() || !props.manualSearch) {
      fetchPlayers();
    } else {
      players.value = [];
      hasSearched.value = false;
    }
  }
});

// Lifecycle hooks
onMounted(() => {
  // Only auto-load if not in manual search mode
  if (!props.manualSearch) {
    fetchPlayers();
  }
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
      <p class="text-lg text-slate-300">Searching players...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-slate-800/70 backdrop-blur-sm border border-red-500/30 rounded-xl p-8 text-center"
    >
      <div class="text-6xl mb-4">⚠️</div>
      <p class="text-red-400 text-lg font-medium">{{ error }}</p>
    </div>

    <!-- Welcome State (before first search) -->
    <div
      v-else-if="!hasSearched && props.manualSearch"
      class="py-16 text-center"
    >
      <p class="text-slate-500 text-sm">Enter a player name to search</p>
    </div>

    <!-- No Results State -->
    <div
      v-else-if="hasSearched && players.length === 0"
      class="py-16 text-center"
    >
      <p class="text-slate-400 mb-1">No players found for "<span class="text-cyan-400">{{ props.searchQuery }}</span>"</p>
      <p class="text-slate-500 text-sm">Try a different name</p>
    </div>

    <!-- Results Section -->
    <div v-else-if="players.length > 0" class="space-y-4">
      <!-- Results Header -->
      <div class="flex items-center justify-between">
        <div class="text-sm text-slate-400">
          Found <span class="text-cyan-400 font-semibold">{{ totalItems }}</span> player{{ totalItems !== 1 ? 's' : '' }}
          <span v-if="props.searchQuery"> matching "{{ props.searchQuery }}"</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">Sort by:</span>
          <button
            class="px-2 py-1 text-xs rounded transition-colors"
            :class="sortBy === 'lastSeen' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'"
            @click="sortPlayers('lastSeen')"
          >
            Last Seen {{ sortBy === 'lastSeen' ? (sortOrder === 'desc' ? '↓' : '↑') : '' }}
          </button>
          <button
            class="px-2 py-1 text-xs rounded transition-colors"
            :class="sortBy === 'playerName' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'"
            @click="sortPlayers('playerName')"
          >
            Name {{ sortBy === 'playerName' ? (sortOrder === 'desc' ? '↓' : '↑') : '' }}
          </button>
        </div>
      </div>

      <!-- Player Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="player in players"
          :key="player.playerName"
          class="group relative bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl p-4 transition-all duration-300 cursor-pointer"
          @click="navigateToPlayer(player.playerName)"
        >
          <!-- Status Indicator -->
          <div
            class="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
            :class="player.isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-600'"
          />

          <!-- Player Name -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg font-bold text-cyan-400">
              {{ player.playerName.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                {{ player.playerName }}
              </h4>
              <div class="text-xs text-slate-500">
                {{ formatLastSeen(player.lastSeen) }}
              </div>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="flex items-center gap-1" title="Total playtime">
              <span class="text-slate-500">⏱️</span>
              <span class="text-slate-300 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
            </div>
            <template v-if="player.totalKills !== undefined && player.totalKills !== null">
              <span class="text-slate-600">|</span>
              <div class="flex items-center gap-1" title="All-time K/D ratio">
                <span :class="getKDRColor(player.totalKills, player.totalDeaths ?? 0)" class="font-semibold">
                  {{ calculateKDR(player.totalKills, player.totalDeaths ?? 0) }}
                </span>
                <span class="text-slate-500">K/D</span>
              </div>
            </template>
            <template v-if="player.totalRounds">
              <span class="text-slate-600">|</span>
              <div class="flex items-center gap-1" title="Total rounds played">
                <span class="text-slate-300 font-medium">{{ player.totalRounds }}</span>
                <span class="text-slate-500">rounds</span>
              </div>
            </template>
          </div>

          <!-- Favorite Server & Recent Activity -->
          <div v-if="player.favoriteServer || player.recentActivity" class="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <template v-if="player.favoriteServer">
              <div class="flex items-center gap-1" title="Most played server">
                <span class="text-slate-500">⭐</span>
                <span class="text-slate-400 truncate max-w-[140px]">{{ player.favoriteServer }}</span>
              </div>
            </template>
            <template v-if="player.recentActivity?.roundsThisWeek">
              <span v-if="player.favoriteServer" class="text-slate-600">|</span>
              <div class="flex items-center gap-1" title="Rounds played this week">
                <span class="text-cyan-400 font-medium">{{ player.recentActivity.roundsThisWeek }}</span>
                <span class="text-slate-500">this week</span>
              </div>
            </template>
          </div>

          <!-- Current Session (if active) -->
          <div
            v-if="player.isActive && player.currentServer"
            class="mt-3 pt-3 border-t border-slate-700/50"
          >
            <div class="flex items-center gap-2 text-xs">
              <span class="text-green-400 font-medium">LIVE</span>
              <span class="text-slate-500">on</span>
              <span class="text-cyan-400 font-medium truncate flex-1">{{ player.currentServer.serverName }}</span>
            </div>
            <div class="flex items-center gap-3 mt-1.5 text-xs">
              <span class="text-slate-400">{{ player.currentServer.mapName }}</span>
              <span class="text-slate-600">|</span>
              <span :class="getKDRColor(player.currentServer.sessionKills, player.currentServer.sessionDeaths)">
                {{ calculateKDR(player.currentServer.sessionKills, player.currentServer.sessionDeaths) }} K/D
              </span>
              <span class="text-slate-600">|</span>
              <span class="text-green-400">{{ player.currentServer.sessionKills }}K</span>
              <span class="text-red-400">{{ player.currentServer.sessionDeaths }}D</span>
            </div>
          </div>

          <!-- Hover Arrow -->
          <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-400">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-700/30"
      >
        <button
          class="px-3 py-2 text-sm font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="goToPage(1)"
        >
          First
        </button>

        <button
          class="px-3 py-2 text-sm font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          ← Prev
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in paginationRange"
            :key="page"
            class="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 min-w-[40px]"
            :class="{
              'bg-cyan-500 text-slate-900 font-bold': page === currentPage,
              'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200': page !== currentPage
            }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button
          class="px-3 py-2 text-sm font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next →
        </button>

        <button
          class="px-3 py-2 text-sm font-medium bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded-lg transition-all duration-200 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="goToPage(totalPages)"
        >
          Last
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles for player cards */
</style>
