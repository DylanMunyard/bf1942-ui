<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchSessions, SessionListItem, PlayerContextInfo } from '../services/playerStatsService';
import HeroBackButton from './HeroBackButton.vue';

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

// Router
const router = useRouter();
const route = useRoute();

// Determine context based on route path
const isServerRoute = computed(() => route.path.startsWith('/servers/'));
const isPlayerRoute = computed(() => route.path.startsWith('/players/'));

// Props from router
interface Props {
  playerName?: string;
  serverName?: string;
  mapName?: string;
}

const props = defineProps<Props>();

// State variables
const rounds = ref<any[]>([]);
const playerInfo = ref<PlayerContextInfo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = ref(0);

// Sorting state
const sortBy = ref<string>('endTime');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Filter variables
const mapFilter = ref('');
const serverFilter = ref('');
const gameTypeFilter = ref('');
const uniqueMaps = ref<string[]>([]);
const uniqueServers = ref<string[]>([]);
const uniqueGameTypes = ref<string[]>([]);

// Player search and filter variables
const playerSearchQuery = ref('');
const showOnlyFilteredPlayers = ref(false);
const playerSuggestions = ref<PlayerSearchResult[]>([]);
const isSearchLoading = ref(false);
const showPlayerDropdown = ref(false);
const selectedPlayers = ref<string[]>([]);

// Mobile filters state
const showFilters = ref(false);

// Collapsible sections state
const collapsedMaps = ref(new Set<string>());
const collapsedRounds = ref(new Set<string>());

// Debounced search functionality
const searchTimeout = ref<any>(null);

// Format minutes to hours and minutes
const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};


// Format date to a human-readable relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString: string): string => {
  // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } else if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Calculate round duration in minutes
const calculateRoundDuration = (startTime: Date, endTime: Date): number => {
  return Math.round((startTime.getTime() - endTime.getTime()) / (1000 * 60));
};

// Toggle map collapse state
const toggleMapCollapse = (mapName: string) => {
  if (collapsedMaps.value.has(mapName)) {
    collapsedMaps.value.delete(mapName);
  } else {
    collapsedMaps.value.add(mapName);
  }
};

// Toggle round collapse state
const toggleRoundCollapse = (mapName: string, roundIndex: number) => {
  const roundKey = `${mapName}-${roundIndex}`;
  if (collapsedRounds.value.has(roundKey)) {
    collapsedRounds.value.delete(roundKey);
  } else {
    collapsedRounds.value.add(roundKey);
  }
};

// Check if map is collapsed
const isMapCollapsed = (mapName: string): boolean => {
  return collapsedMaps.value.has(mapName);
};

// Check if round is collapsed
const isRoundCollapsed = (mapName: string, roundIndex: number): boolean => {
  const roundKey = `${mapName}-${roundIndex}`;
  return collapsedRounds.value.has(roundKey);
};

// Update unique values for filters
const updateUniqueValues = () => {
  const maps = new Set<string>();
  const servers = new Set<string>();
  const gameTypes = new Set<string>();

  rounds.value.forEach(round => {
    if (round.mapName) maps.add(round.mapName);
    if (round.serverName) servers.add(round.serverName);
    if (round.gameType) gameTypes.add(round.gameType);
  });

  uniqueMaps.value = Array.from(maps).sort();
  uniqueServers.value = Array.from(servers).sort();
  uniqueGameTypes.value = Array.from(gameTypes).sort();
};

// Fetch player sessions data
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  
  // Clear existing results immediately when starting a new fetch
  rounds.value = [];
  playerInfo.value = null;
  totalItems.value = 0;
  totalPages.value = 0;

  try {
    // Build filter object from current filter values
    const filters: Record<string, string> = {};
    if (mapFilter.value) filters.mapName = mapFilter.value;
    if (serverFilter.value) filters.serverName = serverFilter.value;
    if (gameTypeFilter.value) filters.gameType = gameTypeFilter.value;

    // Add player names from UI filters first, then fallback to props
    if (selectedPlayers.value.length > 0) {
      filters.playerNames = selectedPlayers.value;
    } else if (props.playerName) {
      // If playerName is a comma-delimited string, split it into an array
      if (typeof props.playerName === 'string' && props.playerName.includes(',')) {
        filters.playerNames = props.playerName.split(',').map(name => name.trim()).filter(name => name.length > 0);
      } else {
        filters.playerNames = props.playerName;
      }
    }
    if (props.serverName) filters.serverName = props.serverName;
    if (props.mapName) filters.mapName = props.mapName;

    // Fetch the sessions with pagination, filters, and sorting
    const result = await fetchSessions(
      currentPage.value, 
      pageSize.value,
      filters,
      sortBy.value,
      sortOrder.value,
      isPlayerRoute.value || showOnlyFilteredPlayers.value  // onlySpecifiedPlayers=true when viewing a specific player or when toggled on
    );

    // Update state with the fetched data
    rounds.value = result.items;
    playerInfo.value = result.playerInfo || null;
    totalItems.value = result.totalItems;
    totalPages.value = result.totalPages;

    // Update unique values for filters
    updateUniqueValues();
  } catch (err) {
    console.error('Error fetching player sessions:', err);
    error.value = 'Failed to fetch player sessions. Please try again.';
    // Clear results when there's an error
    rounds.value = [];
    playerInfo.value = null;
    totalItems.value = 0;
    totalPages.value = 0;
  } finally {
    loading.value = false;
  }
};

// Function to navigate to round report
const navigateToRoundReport = (sessionId: number, event?: Event, includePlayerName: boolean = true) => {
  // Prevent event propagation to stop any unwanted behavior
  if (event) {
    event.stopPropagation();
  }

  let roundId = null;
  let playerNames = null;

  if (isServerMode.value) {
    // In server mode, search through rounds
    for (const round of rounds.value) {
      if (round.roundId && round.players) {
        const player = round.players.find((p: any) => p.sessionId === sessionId);
        if (player) {
          roundId = round.roundId;
          // Only include player name if explicitly requested (e.g., from individual session clicks)
          if (includePlayerName) {
            playerNames = player.playerName;
          }
          break;
        }
      }
    }
  } else {
    // In player mode, search through flattened sessions and always include player name from props
    const session = sessions.value.find(s => s.sessionId === sessionId);
    if (session && session.roundId) {
      roundId = session.roundId;
      playerNames = props.playerName;
    }
  }

  if (roundId) {
    // Navigate to the round report page
    const routeParams: any = {
      name: 'round-report',
      params: {
        roundId: roundId
      }
    };
    
    // Only include query params if we have player names
    if (playerNames) {
      routeParams.query = {
        players: playerNames
      };
    }
    
    router.push(routeParams);
  }
};

// Filter handlers
const handleMapFilterChange = (event: Event) => {
  mapFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  totalPages.value = 1; // Reset to prevent stale pagination display
  updateQueryParams();
  fetchData();
};

const handleServerFilterChange = (event: Event) => {
  serverFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  totalPages.value = 1; // Reset to prevent stale pagination display
  updateQueryParams();
  fetchData();
};

const handleGameTypeFilterChange = (event: Event) => {
  gameTypeFilter.value = (event.target as HTMLSelectElement).value;
  currentPage.value = 1; // Reset to first page when filtering
  totalPages.value = 1; // Reset to prevent stale pagination display
  updateQueryParams();
  fetchData();
};

// Reset all filters
const resetFilters = () => {
  mapFilter.value = '';
  serverFilter.value = '';
  gameTypeFilter.value = '';
  selectedPlayers.value = [];
  showOnlyFilteredPlayers.value = false;
  currentPage.value = 1; // Reset to first page when resetting filters
  totalPages.value = 1; // Reset to prevent stale pagination display
  updateQueryParams();
  fetchData();
};

// Player search methods
const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
    return;
  }

  isSearchLoading.value = true;
  
  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data = await response.json();
    playerSuggestions.value = data.items.filter((player: PlayerSearchResult) => 
      !selectedPlayers.value.includes(player.playerName)
    );
    showPlayerDropdown.value = playerSuggestions.value.length > 0;
  } catch (error) {
    console.error('Error searching players:', error);
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
  } finally {
    isSearchLoading.value = false;
  }
};

let blurTimeout: number | null = null;

const onPlayerSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    searchPlayers(playerSearchQuery.value);
  }, 300) as unknown as number;
};

const onSearchFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
  if (playerSearchQuery.value.length >= 2) {
    searchPlayers(playerSearchQuery.value);
  }
};

const onSearchBlur = () => {
  blurTimeout = setTimeout(() => {
    showPlayerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectPlayer = (player: PlayerSearchResult) => {
  if (!selectedPlayers.value.includes(player.playerName)) {
    selectedPlayers.value.push(player.playerName);
    playerSearchQuery.value = '';
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
    currentPage.value = 1; // Reset to first page when adding filter
    updateQueryParams();
    fetchData();
  }
};

const removePlayer = (playerName: string) => {
  selectedPlayers.value = selectedPlayers.value.filter(name => name !== playerName);
  currentPage.value = 1; // Reset to first page when removing filter
  updateQueryParams();
  fetchData();
};

// Handle sort column click

// Function to handle pagination
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  updateQueryParams();
  fetchData();
};

// Computed property to determine if we're in server mode (showing sessions from multiple players)
const isServerMode = computed(() => {
  return isServerRoute.value;
});

// Computed property to flatten rounds into sessions for player/non-server mode
const sessions = computed(() => {
  if (isServerMode.value) {
    return []; // Not used in server mode
  }
  
  // Flatten rounds into sessions by merging player data with parent round details
  const allSessions: any[] = [];
  rounds.value.forEach(round => {
    if (round.players) {
      round.players.forEach((player: any) => {
        allSessions.push({
          // Player-specific data
          sessionId: player.sessionId,
          roundId: player.roundId || round.roundId, // Use player's roundId first, then round's roundId
          playerName: player.playerName,
          startTime: player.startTime || round.startTime,
          endTime: player.endTime || round.endTime,
          durationMinutes: player.durationMinutes || round.durationMinutes,
          score: player.score,
          kills: player.kills,
          deaths: player.deaths,
          isActive: player.isActive,
          // Parent round details
          serverName: round.serverName,
          serverGuid: round.serverGuid,
          mapName: round.mapName,
          gameType: round.gameType,
        });
      });
    }
  });
  
  return allSessions;
});


// Computed property to group rounds by map name (only in server mode)
const groupedSessions = computed(() => {
  if (!isServerMode.value) {
    return null; // Return null for non-server mode
  }

  // Group rounds by map name
  const mapGroups = new Map<string, any[]>();
  
  rounds.value.forEach(round => {
    const mapName = round.mapName;
    if (!mapGroups.has(mapName)) {
      mapGroups.set(mapName, []);
    }
    mapGroups.get(mapName)!.push(round);
  });

  // Convert to the expected format
  return Array.from(mapGroups.entries()).map(([mapName, mapRounds]) => {
    // Sort rounds by start time (newest first)
    const sortedRounds = mapRounds.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Transform rounds to include leaderboard data
    const roundsWithLeaderboard = sortedRounds.map(round => {
      // Sort players by score (descending), then by K/D ratio as tiebreaker
      const sortedPlayers = [...(round.players || [])].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aKDR = a.deaths === 0 ? a.kills : a.kills / a.deaths;
        const bKDR = b.deaths === 0 ? b.kills : b.kills / b.deaths;
        return bKDR - aKDR;
      });

      return {
        ...round,
        startTime: new Date(round.startTime),
        endTime: new Date(round.endTime),
        leaderboard: sortedPlayers.map((player, index) => ({
          ...player,
          rank: index + 1,
          kdr: player.deaths === 0 ? player.kills : +(player.kills / player.deaths).toFixed(2)
        }))
      };
    });

    return {
      mapName,
      rounds: roundsWithLeaderboard,
      totalSessions: mapRounds.reduce((sum, round) => sum + (round.players?.length || 0), 0),
      roundCount: mapRounds.length
    };
  });
});

// Computed property for pagination range
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

// Watch for route props changes (after initial load)
watch(() => props.playerName, (newPlayerName) => {
  if (newPlayerName) {
    fetchData();
  }
});

// Watch for server name changes (after initial load)
watch(() => props.serverName, (newServerName) => {
  if (newServerName) {
    fetchData();
  }
});

// Watch for map name changes (after initial load)
watch(() => props.mapName, (newMapName) => {
  if (newMapName) {
    fetchData();
  }
});

// Watch for page size changes
watch(() => pageSize.value, () => {
  currentPage.value = 1; // Reset to first page when changing page size
  updateQueryParams();
  fetchData();
});

// Initialize state from URL query parameters
const initializeFromQuery = () => {
  const query = route.query;
  
  // Set filters from query params
  if (query.map && typeof query.map === 'string') {
    mapFilter.value = query.map;
  }
  if (query.server && typeof query.server === 'string') {
    serverFilter.value = query.server;
  }
  if (query.gameType && typeof query.gameType === 'string') {
    gameTypeFilter.value = query.gameType;
  }
  if (query.playerNames) {
    if (Array.isArray(query.playerNames)) {
      selectedPlayers.value = query.playerNames.filter(name => typeof name === 'string') as string[];
    } else if (typeof query.playerNames === 'string') {
      selectedPlayers.value = query.playerNames.split(',').filter(name => name.trim().length > 0);
    }
  }
  
  // Set sorting from query params
  if (query.sortBy && typeof query.sortBy === 'string') {
    sortBy.value = query.sortBy;
  }
  if (query.sortOrder && (query.sortOrder === 'asc' || query.sortOrder === 'desc')) {
    sortOrder.value = query.sortOrder;
  }
  
  // Set pagination from query params
  if (query.page && typeof query.page === 'string') {
    const pageNum = parseInt(query.page);
    if (!isNaN(pageNum) && pageNum > 0) {
      currentPage.value = pageNum;
    }
  }
  if (query.pageSize && typeof query.pageSize === 'string') {
    const size = parseInt(query.pageSize);
    if (!isNaN(size) && [10, 20, 50].includes(size)) {
      pageSize.value = size;
    }
  }
  
  // Fetch data after initializing from URL
  fetchData();
};

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string | string[]> = {};
  
  // Add filters to query
  if (mapFilter.value) query.map = mapFilter.value;
  if (serverFilter.value) query.server = serverFilter.value;
  if (gameTypeFilter.value) query.gameType = gameTypeFilter.value;
  if (selectedPlayers.value.length > 0) {
    // Create separate playerNames parameters for each player
    query.playerNames = selectedPlayers.value;
  }
  
  // Add sorting to query
  if (sortBy.value !== 'endTime') query.sortBy = sortBy.value;
  if (sortOrder.value !== 'desc') query.sortOrder = sortOrder.value;
  
  // Add pagination to query
  if (currentPage.value !== 1) query.page = currentPage.value.toString();
  if (pageSize.value !== 10) query.pageSize = pageSize.value.toString();
  
  // Update URL without triggering navigation
  router.replace({ query });
};

// Initialize from query when component is mounted
onMounted(() => {
  initializeFromQuery();
});

// Performance styling helper functions
const getPerformanceGradient = (session: SessionListItem): string => {
  const kdr = session.deaths === 0 ? session.kills : session.kills / session.deaths;
  
  if (kdr >= 3.0) return 'bg-gradient-to-b from-purple-500 via-pink-500 to-purple-600';
  if (kdr >= 2.0) return 'bg-gradient-to-b from-emerald-500 via-green-500 to-emerald-600';
  if (kdr >= 1.5) return 'bg-gradient-to-b from-blue-500 via-cyan-500 to-blue-600';
  if (kdr >= 1.0) return 'bg-gradient-to-b from-yellow-500 via-orange-500 to-yellow-600';
  if (kdr >= 0.5) return 'bg-gradient-to-b from-orange-500 via-red-500 to-orange-600';
  return 'bg-gradient-to-b from-red-500 via-red-600 to-red-700';
};

const getRankBadge = (rank: number): { emoji: string; classes: string } => {
  switch (rank) {
    case 1:
      return { emoji: '🥇', classes: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900' };
    case 2:
      return { emoji: '🥈', classes: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' };
    case 3:
      return { emoji: '🥉', classes: 'bg-gradient-to-r from-amber-600 to-orange-600 text-orange-100' };
    default:
      return { emoji: `#${rank}`, classes: 'bg-slate-600/50 text-slate-300' };
  }
};


const getTimeGap = (currentSession: SessionListItem, nextSession: SessionListItem): string => {
  const current = new Date(currentSession.startTime.endsWith('Z') ? currentSession.startTime : currentSession.startTime + 'Z');
  const next = new Date(nextSession.startTime.endsWith('Z') ? nextSession.startTime : nextSession.startTime + 'Z');
  
  const diffMs = current.getTime() - next.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays >= 1) {
    return diffDays === 1 ? '1 day later' : `${diffDays} days later`;
  } else if (diffHours >= 2) {
    return `${diffHours} hours later`;
  }
  
  return ''; // Don't show gap for sessions close together
};

// Cleanup when component is unmounted
onUnmounted(() => {
  // Clear any pending search timeouts
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
});
</script>

<template>
  <!-- Full-width Hero Section -->
  <div class="w-full bg-slate-800 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between">
        <HeroBackButton
          :on-click="() => {
            if (isPlayerRoute && props.playerName) {
              $router.push(`/players/${encodeURIComponent(props.playerName)}`);
            } else if (props.serverName) {
              $router.push(`/servers/${encodeURIComponent(props.serverName)}`);
            } else {
              $router.push('/servers/bf1942');
            }
          }"
        />
      </div>
      
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 mt-6">
        <!-- Session Icon -->
        <div class="flex-shrink-0">
          <div class="relative">
            <div class="w-20 h-20 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center">
              <span class="text-2xl">🎮</span>
            </div>
            <!-- Status indicator -->
            <div class="absolute -bottom-1 -right-1">
              <div class="w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" />
            </div>
          </div>
        </div>

        <!-- Session Info -->
        <div class="flex-grow min-w-0">
          <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-3">
            <template v-if="isPlayerRoute">
              {{ props.playerName }}'s Combat History
            </template>
            <template v-else-if="isServerRoute && props.serverName && props.mapName">
              {{ props.serverName }} - {{ props.mapName }} Sessions
            </template>
            <template v-else-if="isServerRoute && props.serverName">
              {{ props.serverName }} Player Sessions
            </template>
            <template v-else-if="props.mapName">
              {{ props.mapName }} Sessions
            </template>
            <template v-else>
              Combat History
            </template>
          </h1>
          
          <div class="text-slate-400 text-sm">
            📊 Battlefield session history and performance data
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            :disabled="loading"
            class="group bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-500 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 disabled:shadow-none flex items-center gap-2"
            @click="fetchData"
          >
            <svg
              v-if="!loading"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
class="group-hover:rotate-180 transition-transform duration-300"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            <div
              v-else
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            <span class="font-medium text-sm">{{ loading ? 'Loading...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="min-h-screen bg-slate-900">
    <div class="relative">
      <div class="relative py-6 sm:py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Sessions Content -->
          <div
            v-if="!loading || rounds.length > 0"
            class="space-y-6"
          >
            <!-- Filter Controls -->
            <div class="mb-6">
              <button
                class="lg:hidden group bg-slate-800/50 hover:bg-slate-700/70 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 rounded-xl px-6 py-3 w-full transition-all duration-300 flex items-center justify-center gap-3"
                @click="showFilters = !showFilters"
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
                  class="text-cyan-400"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span class="text-cyan-400 font-medium">Combat Filters</span>
                <span
                  v-if="mapFilter || serverFilter || gameTypeFilter"
                  class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-slate-400 transition-transform duration-300"
:class="{ 'rotate-180': showFilters }"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <!-- Filter Panel -->
              <div
                class="mt-4 transition-all duration-300 ease-in-out"
                :class="showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 lg:max-h-96 lg:opacity-100 overflow-hidden'"
              >
                <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6">
                  <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-4"
                    :class="props.serverName ? 'lg:grid-cols-2' : 'lg:grid-cols-3'"
                  >
                    <!-- Player Filter -->
                    <div
                      v-if="isServerRoute"
                      class="space-y-2"
                    >
                      <label class="block text-sm font-medium text-slate-300">👥 Players</label>
                      <div class="space-y-2">
                        <!-- Selected Players -->
                        <div
                          v-if="selectedPlayers.length > 0"
                          class="flex flex-wrap gap-2"
                        >
                          <div
                            v-for="player in selectedPlayers"
                            :key="player"
                            class="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-md text-xs text-cyan-400"
                          >
                            <span>{{ player }}</span>
                            <button
                              class="hover:text-red-400 transition-colors"
                              title="Remove player"
                              @click="removePlayer(player)"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                  
                        <!-- Player Search Input -->
                        <div class="relative">
                          <input
                            v-model="playerSearchQuery"
                            type="text"
                            placeholder="Search players to add..."
                            class="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
                            @input="onPlayerSearchInput"
                            @focus="onSearchFocus"
                            @blur="onSearchBlur"
                          >
                    
                          <!-- Loading Spinner -->
                          <div
                            v-if="isSearchLoading"
                            class="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <div class="w-4 h-4 border-2 border-slate-400/30 border-t-cyan-400 rounded-full animate-spin" />
                          </div>
                    
                          <!-- Player Dropdown -->
                          <div
                            v-if="showPlayerDropdown && playerSuggestions.length > 0"
                            class="absolute top-full mt-1 left-0 right-0 bg-slate-800/95 backdrop-blur-lg rounded-lg border border-slate-600/50 max-h-48 overflow-y-auto shadow-xl z-50"
                          >
                            <div
                              v-for="player in playerSuggestions"
                              :key="player.playerName"
                              class="p-3 hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-700/30 last:border-b-0"
                              @mousedown.prevent="selectPlayer(player)"
                            >
                              <div class="flex items-center justify-between">
                                <div>
                                  <div class="font-medium text-slate-200">
                                    {{ player.playerName }}
                                  </div>
                                  <div class="text-xs text-slate-400">
                                    {{ formatPlayTime(player.totalPlayTimeMinutes) }} playtime
                                  </div>
                                </div>
                                <div class="flex items-center gap-2">
                                  <span
                                    v-if="player.isActive"
                                    class="text-xs text-green-400 font-medium"
                                  >ONLINE</span>
                                  <span
                                    v-else
                                    class="text-xs text-slate-500"
                                  >OFFLINE</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                
                      <!-- Show Only Filtered Players Toggle -->
                      <div
                        v-if="selectedPlayers.length > 0 || (props.playerName && props.playerName.includes(','))"
                        class="mt-3 pt-2 border-t border-slate-700/30"
                      >
                        <label class="flex items-center gap-2 text-sm text-slate-300">
                          <input 
                            v-model="showOnlyFilteredPlayers"
                            type="checkbox"
                            class="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0"
                            @change="currentPage = 1; updateQueryParams(); fetchData()"
                          >
                          <span>Show only filtered players in results</span>
                        </label>
                        <div class="text-xs text-slate-500 mt-1">
                          When unchecked, shows all players in rounds where filtered players participated
                        </div>
                      </div>
                    </div>
              
                    <div class="space-y-2">
                      <label
                        for="mapFilter"
                        class="block text-sm font-medium text-slate-300"
                      >🗺️ Battlefield</label>
                      <select 
                        id="mapFilter" 
                        v-model="mapFilter" 
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
                        @change="handleMapFilterChange"
                      >
                        <option value="">
                          All Maps
                        </option>
                        <option
                          v-for="map in uniqueMaps"
                          :key="map"
                          :value="map"
                        >
                          {{ map }}
                        </option>
                      </select>
                    </div>
              
                    <div
                      v-if="!props.serverName"
                      class="space-y-2"
                    >
                      <label
                        for="serverFilter"
                        class="block text-sm font-medium text-slate-300"
                      >🖥️ Server</label>
                      <select 
                        id="serverFilter" 
                        v-model="serverFilter" 
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
                        @change="handleServerFilterChange"
                      >
                        <option value="">
                          All Servers
                        </option>
                        <option
                          v-for="server in uniqueServers"
                          :key="server"
                          :value="server"
                        >
                          {{ server }}
                        </option>
                      </select>
                    </div>
              
                    <div class="space-y-2">
                      <label
                        for="gameTypeFilter"
                        class="block text-sm font-medium text-slate-300"
                      >🎮 Game Mode</label>
                      <select 
                        id="gameTypeFilter" 
                        v-model="gameTypeFilter" 
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
                        @change="handleGameTypeFilterChange"
                      >
                        <option value="">
                          All Game Types
                        </option>
                        <option
                          v-for="gameType in uniqueGameTypes"
                          :key="gameType"
                          :value="gameType"
                        >
                          {{ gameType }}
                        </option>
                      </select>
                    </div>
              
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-slate-300">Actions</label>
                      <button
                        class="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
                        @click="resetFilters"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="opacity-70"
                        >
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                        Reset Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sessions Data -->
            <div
              v-if="rounds.length > 0"
              class="space-y-6"
            >
              <!-- Stats Summary -->
              <div class="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-slate-400">
                      Showing <span class="text-cyan-400 font-medium">{{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalItems) }}</span> 
                      of <span class="text-cyan-400 font-medium">{{ totalItems }}</span> sessions
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <label
                      for="pageSize"
                      class="text-xs text-slate-500"
                    >Per page:</label>
                    <select
                      id="pageSize"
                      v-model="pageSize"
                      class="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                      @change="currentPage = 1; updateQueryParams(); fetchData()"
                    >
                      <option value="10">
                        10
                      </option>
                      <option value="20">
                        20
                      </option>
                      <option value="50">
                        50
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Combat Sessions Timeline -->
              <div class="space-y-6">
                <!-- Grouped Sessions (Server Mode) -->
                <template v-if="isServerMode && groupedSessions">
                  <div
                    v-for="group in groupedSessions"
                    :key="group.mapName"
                    class="space-y-4"
                  >
                    <!-- Map Group Header -->
                    <div 
                      class="sticky top-4 z-20 bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-xl p-4 shadow-lg cursor-pointer hover:bg-slate-800/90 transition-all duration-200"
                      @click.stop="toggleMapCollapse(group.mapName)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-cyan-400 transition-transform duration-200"
:class="{ 'rotate-90': !isMapCollapsed(group.mapName) }"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <div class="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                          <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                            {{ group.mapName }}
                          </h3>
                        </div>
                        <div class="flex items-center gap-4">
                          <span class="text-sm text-slate-400">
                            {{ group.roundCount }} round{{ group.roundCount !== 1 ? 's' : '' }}
                          </span>
                          <span class="text-xs text-slate-500">
                            {{ group.totalSessions }} session{{ group.totalSessions !== 1 ? 's' : '' }}
                          </span>
                        </div>
                      </div>
                    </div>
              
                    <!-- Rounds in this map group -->
                    <div
                      v-show="!isMapCollapsed(group.mapName)"
                      class="space-y-6 ml-4"
                    >
                      <div
                        v-for="(round, roundIndex) in group.rounds"
                        :key="`${group.mapName}-round-${roundIndex}`"
                        class="space-y-3"
                      >
                        <!-- Round Header -->
                        <div 
                          class="flex items-center gap-3 px-4 py-2 bg-slate-700/30 rounded-lg border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 transition-all duration-200"
                          @click.stop="toggleRoundCollapse(group.mapName, roundIndex)"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-emerald-400 transition-transform duration-200"
:class="{ 'rotate-90': !isRoundCollapsed(group.mapName, roundIndex) }"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <div class="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" />
                          <span class="text-sm font-medium text-slate-300">
                            {{ round.durationMinutes }} min
                          </span>
                          <span class="text-xs text-slate-500">•</span>
                          <span class="text-sm font-medium text-slate-300">
                            {{ round.participantCount }} player{{ round.participantCount !== 1 ? 's' : '' }}
                          </span>
                          <span class="text-xs text-slate-500">•</span>
                          <span class="text-xs text-slate-500">
                            {{ formatRelativeTime(round.startTime.toISOString()) }}
                          </span>
                        </div>
                  
                        <!-- Round Leaderboard -->
                        <div v-show="!isRoundCollapsed(group.mapName, roundIndex)">
                          <div class="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
                            <!-- Leaderboard Header -->
                            <div class="bg-slate-700/50 px-4 py-3 border-b border-slate-600/50">
                              <div class="flex items-center justify-between">
                                <h4 class="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                                  🏆 Round Leaderboard
                                </h4>
                                <button
                                  class="text-xs bg-cyan-600/80 hover:bg-cyan-500 text-white px-3 py-1 rounded-md transition-colors font-medium"
                                  @click="(event) => navigateToRoundReport(round.leaderboard[0].sessionId, event, false)"
                                >
                                  View Round Report
                                </button>
                              </div>
                            </div>
                      
                            <!-- Leaderboard Table -->
                            <div class="overflow-x-auto">
                              <table class="w-full">
                                <thead class="bg-slate-700/30">
                                  <tr class="text-left text-xs text-slate-400 uppercase tracking-wider">
                                    <th class="px-4 py-3 w-16">
                                      Rank
                                    </th>
                                    <th class="px-4 py-3">
                                      Player
                                    </th>
                                    <th class="px-4 py-3 text-center w-20">
                                      Score
                                    </th>
                                    <th class="px-4 py-3 text-center w-16">
                                      K
                                    </th>
                                    <th class="px-4 py-3 text-center w-16">
                                      D
                                    </th>
                                    <th class="px-4 py-3 text-center w-20">
                                      K/D
                                    </th>
                                    <th class="px-4 py-3 text-center w-20 hidden sm:table-cell">
                                      Time
                                    </th>
                                  </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-700/50">
                                  <tr 
                                    v-for="player in round.leaderboard" 
                                    :key="player.sessionId"
                                    :class="selectedPlayers.includes(player.playerName) ? 
                                      'bg-emerald-900/40 border-l-4 border-emerald-400 hover:bg-emerald-900/60 transition-colors' : 
                                      'hover:bg-slate-700/20 transition-colors'"
                                  >
                                    <!-- Rank -->
                                    <td class="px-4 py-3">
                                      <div class="flex items-center justify-center">
                                        <span 
                                          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                                          :class="getRankBadge(player.rank).classes"
                                        >
                                          {{ getRankBadge(player.rank).emoji }}
                                        </span>
                                      </div>
                                    </td>
                              
                                    <!-- Player -->
                                    <td class="px-4 py-3">
                                      <router-link 
                                        :to="`/players/${encodeURIComponent(player.playerName)}`" 
                                        :class="selectedPlayers.includes(player.playerName) ? 
                                          'text-emerald-300 hover:text-emerald-200 transition-colors font-bold' : 
                                          'text-yellow-400 hover:text-yellow-300 transition-colors font-semibold'"
                                        @click.stop
                                      >
                                        {{ player.playerName }}
                                      </router-link>
                                    </td>
                              
                                    <!-- Score -->
                                    <td class="px-4 py-3 text-center">
                                      <span class="font-semibold text-yellow-400">{{ player.score }}</span>
                                    </td>
                              
                                    <!-- Kills -->
                                    <td class="px-4 py-3 text-center">
                                      <span class="font-semibold text-emerald-400">{{ player.kills }}</span>
                                    </td>
                              
                                    <!-- Deaths -->
                                    <td class="px-4 py-3 text-center">
                                      <span class="font-semibold text-red-400">{{ player.deaths }}</span>
                                    </td>
                              
                                    <!-- K/D Ratio -->
                                    <td class="px-4 py-3 text-center">
                                      <span 
                                        class="font-semibold" 
                                        :class="player.kdr > 1 ? 'text-green-400' : player.kdr === 1 ? 'text-yellow-400' : 'text-red-400'"
                                      >
                                        {{ player.kdr }}
                                      </span>
                                    </td>
                              
                                    <!-- Play Time -->
                                    <td class="px-4 py-3 text-center text-sm text-slate-300 hidden sm:table-cell">
                                      {{ formatPlayTime(player.durationMinutes) }}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div> <!-- End round leaderboard -->
                      </div> <!-- End round -->
                    </div> <!-- End rounds in this map group -->
                  </div> <!-- End map group -->
                </template>
          
                <!-- Ungrouped Sessions (Player/Other Modes) -->
                <template v-else>
                  <div class="space-y-3">
                    <template
                      v-for="(session, index) in sessions"
                      :key="session.sessionId"
                    >
                      <!-- Session Card -->
                      <div
                        class="group relative"
                        @click="(event) => navigateToRoundReport(session.sessionId, event)"
                      >
                        <!-- Performance indicator line -->
                        <div
                          class="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                          :class="getPerformanceGradient(session)"
                        />
                  
                        <!-- Main Session Card -->
                        <div class="ml-4 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-cyan-500/30 overflow-hidden transition-all duration-200 cursor-pointer group-hover:bg-slate-800/60">
                          <div class="p-4">
                            <!-- Multi-Row Layout -->
                            <div class="space-y-2">
                              <!-- Top Row: Time & Map Info with Stats -->
                              <div class="flex items-center justify-between gap-4">
                                <!-- Time & Map Info -->
                                <div class="flex items-center gap-4 flex-grow min-w-0">
                                  <div class="text-cyan-400 font-medium text-sm whitespace-nowrap">
                                    {{ formatRelativeTime(session.startTime) }}
                                  </div>
                                  <div class="hidden sm:block w-px h-4 bg-slate-600" />
                                  <div class="flex items-center gap-2 min-w-0">
                                    <span class="font-semibold text-white truncate">{{ session.mapName }}</span>
                                    <span class="text-xs text-slate-400 hidden sm:inline">({{ session.gameType }})</span>
                                  </div>
                                  <div class="hidden lg:block w-px h-4 bg-slate-600" />
                                  <router-link 
                                    :to="`/servers/${encodeURIComponent(session.serverName)}`" 
                                    class="text-slate-400 hover:text-cyan-400 transition-colors text-xs truncate hidden lg:block max-w-[200px]"
                                    @click.stop
                                  >
                                    {{ session.serverName }}
                                  </router-link>
                                </div>
                          
                                <!-- Compact Stats -->
                                <div class="flex items-center gap-4 text-sm flex-shrink-0">
                                  <div class="text-center">
                                    <div class="font-semibold text-emerald-400">
                                      {{ session.kills }}
                                    </div>
                                    <div class="text-xs text-slate-500">
                                      K
                                    </div>
                                  </div>
                                  <div class="text-center">
                                    <div class="font-semibold text-red-400">
                                      {{ session.deaths }}
                                    </div>
                                    <div class="text-xs text-slate-500">
                                      D
                                    </div>
                                  </div>
                                  <div class="text-center">
                                    <div class="font-semibold text-yellow-400">
                                      {{ session.score }}
                                    </div>
                                    <div class="text-xs text-slate-500">
                                      S
                                    </div>
                                  </div>
                                  <div class="text-center hidden sm:block">
                                    <div class="text-blue-400 font-semibold">
                                      {{ formatPlayTime(session.durationMinutes) }}
                                    </div>
                                    <div class="text-xs text-slate-500">
                                      Time
                                    </div>
                                  </div>
                                </div>
                              </div>
                        
                              <!-- Player Name Row (only in server mode) -->
                              <div
                                v-if="isServerMode"
                                class="flex items-center"
                              >
                                <div class="flex items-center gap-2">
                                  <span class="text-slate-400 text-sm">Player:</span>
                                  <router-link 
                                    :to="`/players/${encodeURIComponent(session.playerName)}`" 
                                    class="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold text-base"
                                    @click.stop
                                  >
                                    {{ session.playerName }}
                                  </router-link>
                                </div>
                              </div>
                        
                              <!-- Bottom Row: K/D Ratio -->
                              <div class="flex items-center">
                                <div class="text-sm">
                                  <span class="text-slate-400">K/D Ratio:</span>
                                  <span
                                    class="ml-2 font-semibold"
                                    :class="session.kills > session.deaths ? 'text-green-400' : session.kills === session.deaths ? 'text-yellow-400' : 'text-red-400'"
                                  >
                                    {{ calculateKDR(session.kills, session.deaths) }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Time Gap Separator -->
                      <div
                        v-if="index < sessions.length - 1 && getTimeGap(session, sessions[index + 1])"
                        class="flex items-center justify-center py-2"
                      >
                        <div class="flex items-center gap-2 px-3 py-1 bg-slate-800/20 rounded text-xs text-slate-500">
                          <span>{{ getTimeGap(session, sessions[index + 1]) }}</span>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </div>

              <!-- Pagination Controls -->
              <div
                v-if="totalPages > 1"
                class="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4"
              >
                <div class="flex items-center justify-between gap-4">
                  <!-- Pagination Info -->
                  <div class="text-slate-400 text-sm">
                    Page {{ currentPage }} of {{ totalPages }}
                  </div>
            
                  <!-- Pagination Buttons -->
                  <div class="flex items-center gap-1">
                    <button 
                      :disabled="currentPage === 1"
                      class="p-1.5 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                      title="First"
                      @click="goToPage(1)"
                    >
                      ⟨⟨
                    </button>
              
                    <button 
                      :disabled="currentPage === 1"
                      class="p-1.5 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                      title="Previous"
                      @click="goToPage(currentPage - 1)"
                    >
                      ⟨
                    </button>
              
                    <!-- Page Numbers -->
                    <div class="hidden sm:flex items-center gap-1 mx-2">
                      <button 
                        v-for="page in paginationRange" 
                        :key="page" 
                        class="px-2 py-1 rounded text-xs transition-all"
                        :class="page === currentPage 
                          ? 'bg-cyan-600 text-white' 
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70'"
                        @click="goToPage(page)"
                      >
                        {{ page }}
                      </button>
                    </div>
              
                    <!-- Current Page (Mobile) -->
                    <div class="sm:hidden px-2 py-1 bg-cyan-600 text-white rounded text-xs mx-2">
                      {{ currentPage }}
                    </div>
              
                    <button 
                      :disabled="currentPage === totalPages"
                      class="p-1.5 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                      title="Next"
                      @click="goToPage(currentPage + 1)"
                    >
                      ⟩
                    </button>
              
                    <button 
                      :disabled="currentPage === totalPages"
                      class="p-1.5 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                      title="Last"
                      @click="goToPage(totalPages)"
                    >
                      ⟩⟩
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-else-if="loading && rounds.length === 0"
            class="flex flex-col items-center justify-center py-20 text-slate-400"
          >
            <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <p class="text-lg text-slate-300">
              Loading session history...
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
            <button
              class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              @click="fetchData"
            >
              Try Again
            </button>
          </div>

          <!-- No Data State -->
          <div
            v-else
            class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center"
          >
            <div class="text-6xl mb-4 opacity-50">
              🎯
            </div>
            <h3 class="text-2xl font-bold text-slate-400 mb-2">
              No Combat Records Found
            </h3>
            <p class="text-slate-500 mb-6">
              This soldier hasn't entered any battles yet, or the records are still being processed.
            </p>
            <button
              class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 font-medium"
              @click="fetchData"
            >
              🔄 Refresh Records
            </button>
          </div>
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

</style>
