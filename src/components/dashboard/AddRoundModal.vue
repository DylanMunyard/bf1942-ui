<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-3 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Link Round to Match
            </h2>
            <p class="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">
              Search for and select a completed round for {{ gameLabel }}
            </p>
          </div>
          <button
            class="text-slate-400 hover:text-slate-200 transition-colors"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mode Selector -->
        <div class="mt-2 sm:mt-4 flex items-center gap-1 sm:gap-2 bg-slate-800/30 rounded-lg p-1">
          <button
            :class="[
              'flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all',
              searchMode === 'search'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            ]"
            @click="searchMode = 'search'"
          >
            <span class="sm:hidden">🔍</span>
            <span class="hidden sm:inline">🔍 Search Rounds</span>
          </button>
          <button
            :class="[
              'flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all',
              searchMode === 'direct'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            ]"
            @click="searchMode = 'direct'"
          >
            <span class="sm:hidden">🎯</span>
            <span class="hidden sm:inline">🎯 Enter Round ID</span>
          </button>
        </div>
      </div>

      <!-- Direct Round ID Input Mode -->
      <div v-if="searchMode === 'direct'" class="flex-1 overflow-y-auto p-6">
        <div class="max-w-2xl mx-auto">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Round ID
          </label>
          <input
            v-model="directRoundId"
            type="text"
            placeholder="e.g., bf1942-server-guid-2025-10-29-10-00-00"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
          <p class="mt-2 text-xs text-slate-500">
            Enter the exact round ID if you know it
          </p>
        </div>
      </div>

      <!-- Search Mode -->
      <div v-else class="flex-1 overflow-y-auto">
        <!-- Filters -->
        <div class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-3 sm:p-6 space-y-2 sm:space-y-4">
          <!-- Server Selection -->
          <div class="relative z-50">
            <label class="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
              Server <span class="text-red-400">*</span>
            </label>

            <!-- Selected Server Display -->
            <div v-if="selectedServer" class="mb-2 sm:mb-3">
              <div class="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <span class="text-cyan-400 text-xs sm:text-sm">🖥️</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-slate-200 text-xs sm:text-sm truncate">
                      {{ selectedServer.serverName }}
                    </div>
                    <div v-if="selectedServer.serverIp && selectedServer.serverPort" class="text-xs text-slate-400 mt-0.5 hidden sm:block">
                      {{ selectedServer.serverIp }}:{{ selectedServer.serverPort }}
                    </div>
                  </div>
                </div>
                <button
                  class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                  @click="clearServerSelection"
                  title="Change server"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Server Search Input (only show when no server selected) -->
            <div v-else class="relative">
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <span class="text-slate-500 text-xs">🖥️</span>
              </div>
              <input
                v-model="serverSearchQuery"
                type="text"
                placeholder="Search for server..."
                class="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                @input="onServerSearchInput"
                @focus="onServerSearchFocus"
                @blur="onServerSearchBlur"
              >

              <!-- Server Suggestions Dropdown -->
              <div
                v-if="showServerDropdown"
                class="absolute top-full mt-2 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto shadow-2xl z-50"
              >
                <div
                  v-for="server in serverSuggestions"
                  :key="server.serverGuid"
                  class="p-3 border-b border-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all last:border-b-0"
                  @mousedown.prevent="selectServer(server)"
                >
                  <div class="font-medium text-slate-200 text-sm">
                    {{ server.serverName }}
                  </div>
                  <div class="text-xs text-slate-400 mt-1">
                    {{ server.serverIp }}:{{ server.serverPort }}
                  </div>
                </div>
                <div
                  v-if="serverSuggestions.length === 0 && !isServerSearchLoading && serverSearchQuery.length >= 2"
                  class="p-3 text-center text-slate-400 text-sm"
                >
                  No servers found
                </div>
              </div>
            </div>
          </div>

          <!-- Map Name Search -->
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Map Name</label>
            <input
              v-model="filters.mapName"
              type="text"
              placeholder="Search by map..."
              class="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              @input="debouncedSearch"
            >
          </div>

          <!-- Search Button -->
          <button
            :disabled="!selectedServer || searchingRounds"
            class="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            @click="searchRounds"
          >
            {{ searchingRounds ? 'Searching...' : 'Search Rounds' }}
          </button>
        </div>

        <!-- Rounds List -->
        <div class="p-3 sm:p-6">
          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>

          <!-- Error State -->
          <div v-else-if="searchError" class="text-center py-12">
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-xl font-bold text-slate-300 mb-2">Unable to Load Rounds</h3>
            <p class="text-slate-400">{{ searchError }}</p>
          </div>

          <!-- Rounds Table -->
          <div v-else-if="rounds.length > 0" class="space-y-2">
            <!-- Selection Actions -->
            <div v-if="multiSelect" class="flex items-center justify-between text-xs text-slate-400 pb-2">
              <span>{{ selectedRoundIds.length }} of {{ rounds.length }} selected</span>
              <div class="flex gap-2">
                <button
                  class="px-2 py-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                  @click="selectAllRounds"
                >
                  Select All
                </button>
                <button
                  v-if="selectedRoundIds.length > 0"
                  class="px-2 py-1 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition-colors"
                  @click="clearAllSelections"
                >
                  Clear
                </button>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400 pb-2">
              <span v-if="selectedRoundIds.length > 0">1 round selected</span>
              <span v-else>Select a round</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full">
              <thead>
                <tr class="border-b border-slate-700/50">
                  <th class="text-left py-1.5 sm:py-2 px-2 sm:px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-6 sm:w-8" />
                  <th class="text-left py-1.5 sm:py-2 px-2 sm:px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Map
                  </th>
                  <th class="text-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Players
                  </th>
                  <th class="text-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="round in rounds"
                  :key="round.roundId"
                  class="group border-b border-slate-700/30 hover:bg-slate-800/40 transition-all duration-150 cursor-pointer"
                  :class="{ 'bg-cyan-500/10 border-l-4 border-l-cyan-400': isRoundSelected(round.roundId) }"
                  @click="toggleRoundSelection(round.roundId)"
                >
                  <!-- Selection Indicator -->
                  <td class="py-1.5 sm:py-2 px-2 sm:px-3">
                    <div
                      class="w-4 h-4 sm:w-5 sm:h-5 border-2 flex items-center justify-center transition-all"
                      :class="[
                        multiSelect ? 'rounded' : 'rounded-full',
                        isRoundSelected(round.roundId)
                          ? 'border-cyan-400 bg-cyan-400'
                          : 'border-slate-600 bg-transparent group-hover:border-slate-500'
                      ]"
                    >
                      <!-- Checkbox checkmark for multi-select -->
                      <svg
                        v-if="multiSelect && isRoundSelected(round.roundId)"
                        class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-900"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                      <!-- Radio dot for single-select -->
                      <div
                        v-else-if="!multiSelect && isRoundSelected(round.roundId)"
                        class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-900"
                      />
                    </div>
                  </td>

                  <!-- Map Column (with time as subheading) -->
                  <td class="py-1.5 sm:py-2 px-2 sm:px-3">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs sm:text-sm font-bold text-slate-200">
                        {{ round.mapName }}
                      </span>
                      <span class="text-xs text-slate-500 font-medium">
                        {{ formatDateTime(round.startTime) }}
                      </span>
                    </div>
                  </td>

                  <!-- Players Column (always visible now) -->
                  <td class="py-1.5 sm:py-2 px-2 sm:px-3 text-center">
                    <span class="text-xs sm:text-sm text-slate-400">
                      {{ round.participantCount }}
                    </span>
                  </td>

                  <!-- Duration Column (hidden on mobile/tablet) -->
                  <td class="py-1.5 sm:py-2 px-2 sm:px-3 text-center hidden md:table-cell">
                    <span class="text-xs sm:text-sm text-slate-400 font-mono">
                      {{ round.durationMinutes }}m
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <div class="text-6xl mb-4">{{ selectedServer ? '🔍' : '🖥️' }}</div>
            <h3 class="text-xl font-bold text-slate-300 mb-2">
              {{ selectedServer ? 'No Rounds Found' : 'Select a Server First' }}
            </h3>
            <p class="text-slate-400">
              {{ selectedServer ? 'Try adjusting your filters' : 'Search and select a server to view rounds' }}
            </p>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
            <button
              :disabled="currentPage === 1"
              class="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="changePage(currentPage - 1)"
            >
              Previous
            </button>
            <span class="text-slate-400 text-sm">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              :disabled="currentPage === totalPages"
              class="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="changePage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 border-t border-slate-700/50 p-3 sm:p-6 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
        <!-- Error Message -->
        <div
          v-if="error"
          class="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-xs sm:text-sm text-red-400">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors text-xs sm:text-sm"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            :disabled="(selectedRoundIds.length === 0 && !directRoundId) || adding"
            class="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            @click="addRound"
          >
            <template v-if="adding">
              Linking...
            </template>
            <template v-else>
              Link Round
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { adminTournamentService } from '@/services/adminTournamentService';

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  gameType: string;
}

interface RoundListItem {
  roundId: string;
  serverName: string;
  serverGuid: string;
  mapName: string;
  gameType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  participantCount: number;
  isActive: boolean;
}

interface Props {
  tournamentId: number;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  defaultServerGuid?: string;
  defaultServerName?: string;
  defaultMapName?: string;
  multiSelect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  multiSelect: true,
});
const emit = defineEmits<{
  close: [];
  added: [roundId: string];
}>();

const searchMode = ref<'search' | 'direct'>('search');
const directRoundId = ref('');

const rounds = ref<RoundListItem[]>([]);
const selectedRoundIds = ref<string[]>([]);
const loading = ref(false);
const adding = ref(false);
const error = ref<string | null>(null);
const searchError = ref<string | null>(null);

// Server search state
const serverSearchQuery = ref('');
const serverSuggestions = ref<ServerSearchResult[]>([]);
const selectedServer = ref<ServerSearchResult | null>(null);
const isServerSearchLoading = ref(false);
const showServerDropdown = ref(false);
const searchingRounds = ref(false);

const filters = ref({
  mapName: props.defaultMapName || '',
});

const currentPage = ref(1);
const pageSize = 50;
const totalPages = ref(1);

let searchTimeout: number | null = null;
let serverSearchTimeout: number | null = null;
let blurTimeout: number | null = null;

const gameLabel = computed(() => {
  const labels: Record<string, string> = {
    'bf1942': 'Battlefield 1942',
    'fh2': 'Forgotten Hope 2',
    'bfvietnam': 'Battlefield Vietnam',
  };
  return labels[props.game] || props.game;
});

const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    serverSuggestions.value = [];
    showServerDropdown.value = false;
    return;
  }

  isServerSearchLoading.value = true;

  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&game=${props.game}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search servers');
    }

    const data = await response.json();
    serverSuggestions.value = data.items || [];
    showServerDropdown.value = (data.items?.length || 0) > 0 || query.length >= 2;
  } catch (error) {
    console.error('Error searching servers:', error);
    serverSuggestions.value = [];
    showServerDropdown.value = false;
  } finally {
    isServerSearchLoading.value = false;
  }
};

const onServerSearchInput = () => {
  selectedServer.value = null;

  if (serverSearchTimeout) {
    clearTimeout(serverSearchTimeout);
  }

  serverSearchTimeout = setTimeout(() => {
    searchServers(serverSearchQuery.value);
  }, 300) as unknown as number;
};

const onServerSearchFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
  if (serverSearchQuery.value.length >= 2) {
    searchServers(serverSearchQuery.value);
  }
};

const onServerSearchBlur = () => {
  blurTimeout = setTimeout(() => {
    showServerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectServer = (server: ServerSearchResult) => {
  selectedServer.value = server;
  serverSearchQuery.value = server.serverName;
  serverSuggestions.value = [];
  showServerDropdown.value = false;

  // Auto-search rounds when server is selected
  searchRounds();
};

const clearServerSelection = () => {
  selectedServer.value = null;
  serverSearchQuery.value = '';
  rounds.value = [];
  selectedRoundIds.value = [];
};

const isRoundSelected = (roundId: string): boolean => {
  return selectedRoundIds.value.includes(roundId);
};

const toggleRoundSelection = (roundId: string) => {
  if (!props.multiSelect) {
    // Single select mode - replace selection
    if (selectedRoundIds.value[0] === roundId) {
      selectedRoundIds.value = [];
    } else {
      selectedRoundIds.value = [roundId];
    }
  } else {
    // Multi-select mode - toggle
    const index = selectedRoundIds.value.indexOf(roundId);
    if (index > -1) {
      selectedRoundIds.value.splice(index, 1);
    } else {
      selectedRoundIds.value.push(roundId);
    }
  }
};

const selectAllRounds = () => {
  selectedRoundIds.value = rounds.value.map(r => r.roundId);
};

const clearAllSelections = () => {
  selectedRoundIds.value = [];
};

const searchRounds = async () => {
  if (!selectedServer.value) {
    searchError.value = 'Please select a server first';
    return;
  }

  loading.value = true;
  searchingRounds.value = true;
  searchError.value = null;

  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.toString(),
      sortBy: 'StartTime',
      sortOrder: 'desc',
      includePlayers: 'false',
      serverGuid: selectedServer.value.serverGuid,
    });

    if (filters.value.mapName) {
      params.append('mapName', filters.value.mapName);
    }

    const response = await fetch(`/stats/rounds?${params.toString()}`);

    // Handle 404 as "no results found" instead of an error
    if (response.status === 404) {
      rounds.value = [];
      totalPages.value = 0;
      searchError.value = null;
    } else if (!response.ok) {
      throw new Error('Failed to search rounds');
    } else {
      const data = await response.json();
      rounds.value = data.items;
      totalPages.value = data.totalPages;
      searchError.value = null;
    }
  } catch (err) {
    console.error('Error searching rounds:', err);
    searchError.value = 'Failed to load rounds';
  } finally {
    loading.value = false;
    searchingRounds.value = false;
  }
};

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    if (selectedServer.value) {
      currentPage.value = 1;
      searchRounds();
    }
  }, 300) as unknown as number;
};

const changePage = (page: number) => {
  currentPage.value = page;
  searchRounds();
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const addRound = async () => {
  const roundIds = searchMode.value === 'direct'
    ? [directRoundId.value].filter(Boolean)
    : selectedRoundIds.value;

  if (roundIds.length === 0) return;

  adding.value = true;
  error.value = null;

  try {
    // For now, just emit the first selected round ID
    // This is used to link rounds to matches
    const roundId = roundIds[0];
    emit('added', roundId);
    emit('close');
  } catch (err) {
    console.error('Error selecting round:', err);
    error.value = err instanceof Error ? err.message : 'Failed to select round';
  } finally {
    adding.value = false;
  }
};

// Initialize default server if provided
onMounted(() => {
  if (props.defaultServerGuid && props.defaultServerName) {
    selectedServer.value = {
      serverGuid: props.defaultServerGuid,
      serverName: props.defaultServerName,
      serverIp: '',
      serverPort: 0,
      gameType: props.game,
    };
    // Auto-search rounds with the pre-selected server
    searchRounds();
  }
});
</script>

<style scoped src="./AddRoundModal.vue.css"></style>
