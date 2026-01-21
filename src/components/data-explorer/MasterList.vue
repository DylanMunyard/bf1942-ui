<template>
  <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
    <!-- List Header -->
    <div class="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
      <div class="flex items-center justify-between">
        <span class="text-slate-300 font-medium">
          {{ modeLabel }}
          <span v-if="mode !== 'players' || players.length > 0" class="text-slate-500 text-sm ml-2">
            ({{ filteredItems.length }})
          </span>
        </span>

        <!-- Game Toggle -->
        <div class="flex items-center gap-1 bg-slate-900/50 rounded-lg p-0.5">
          <button
            v-for="game in games"
            :key="game.id"
            @click="handleGameChange(game.id)"
            :class="[
              'px-2 py-1 rounded text-xs font-medium transition-all duration-200',
              selectedGame === game.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            ]"
            :title="game.name"
          >
            {{ game.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-4">
      <div v-for="i in 8" :key="i" class="animate-pulse mb-3">
        <div class="h-14 bg-slate-700/50 rounded-lg"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6 text-center">
      <div class="text-red-400 mb-2">Failed to load data</div>
      <button
        @click="loadData"
        class="text-cyan-400 hover:text-cyan-300 text-sm"
      >
        Try again
      </button>
    </div>

    <!-- Players Empty State (search-only mode) -->
    <div v-else-if="mode === 'players' && players.length === 0" class="p-6 text-center text-slate-400">
      <div class="text-3xl mb-2">👤</div>
      <p v-if="!searchQuery || searchQuery.length < 3">
        Enter at least 3 characters to search for players
      </p>
      <p v-else>
        No players found matching "{{ searchQuery }}"
      </p>
    </div>

    <!-- Empty State (servers/maps) -->
    <div v-else-if="filteredItems.length === 0 && mode !== 'players'" class="p-6 text-center text-slate-400">
      <div class="text-3xl mb-2">{{ mode === 'servers' ? '🖥️' : '🗺️' }}</div>
      <p>No {{ mode }} found</p>
    </div>

    <!-- List -->
    <div v-else class="max-h-[calc(100vh-280px)] overflow-y-auto">
      <template v-if="mode === 'servers'">
        <ServerListItem
          v-for="server in filteredServers"
          :key="server.guid"
          :server="server"
          :is-selected="selectedItem === server.guid"
          @click="emit('select', server.guid)"
        />
        <!-- Load More Button for Servers -->
        <div v-if="hasMoreServers && !props.searchQuery" class="p-3">
          <button
            @click="loadMoreServers"
            :disabled="isLoadingMore"
            class="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoadingMore">Loading...</span>
            <span v-else>Load More ({{ servers.length }} of {{ totalServerCount }})</span>
          </button>
        </div>
      </template>
      <template v-else-if="mode === 'maps'">
        <MapListItem
          v-for="map in filteredMaps"
          :key="map.mapName"
          :map="map"
          :is-selected="selectedItem === map.mapName"
          @click="emit('select', map.mapName)"
        />
      </template>
      <template v-else-if="mode === 'players'">
        <PlayerListItem
          v-for="player in players"
          :key="player.playerName"
          :player="player"
          :is-selected="selectedItem === player.playerName"
          @click="emit('select', player.playerName)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  fetchServers,
  fetchMaps,
  searchPlayers,
  type ServerSummary,
  type MapSummary,
  type PlayerSearchResult,
  type GameType
} from '../../services/dataExplorerService';
import ServerListItem from './ServerListItem.vue';
import MapListItem from './MapListItem.vue';
import PlayerListItem from './PlayerListItem.vue';

const props = defineProps<{
  mode: 'servers' | 'maps' | 'players';
  searchQuery: string;
  selectedItem: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', item: string | null): void;
  (e: 'gameChange', game: GameType): void;
}>();

// Game toggle state
const games = [
  { id: 'bf1942' as GameType, label: 'BF42', name: 'Battlefield 1942' },
  { id: 'fh2' as GameType, label: 'FH2', name: 'Forgotten Hope 2' },
  { id: 'bfvietnam' as GameType, label: 'BFV', name: 'Battlefield Vietnam' },
];
const selectedGame = ref<GameType>('bf1942');

// Data state
const servers = ref<ServerSummary[]>([]);
const maps = ref<MapSummary[]>([]);
const players = ref<PlayerSearchResult[]>([]);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const error = ref<string | null>(null);

// Pagination state for servers
const currentServerPage = ref(1);
const hasMoreServers = ref(false);
const totalServerCount = ref(0);
const SERVER_PAGE_SIZE = 50;

// Mode label
const modeLabel = computed(() => {
  switch (props.mode) {
    case 'servers': return 'Servers';
    case 'maps': return 'Maps';
    case 'players': return 'Players';
    default: return '';
  }
});

// Computed filtered items
const filteredServers = computed(() => {
  if (!props.searchQuery) return servers.value;
  const query = props.searchQuery.toLowerCase();
  return servers.value.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.game.toLowerCase().includes(query) ||
    (s.country && s.country.toLowerCase().includes(query))
  );
});

const filteredMaps = computed(() => {
  if (!props.searchQuery) return maps.value;
  const query = props.searchQuery.toLowerCase();
  return maps.value.filter(m =>
    m.mapName.toLowerCase().includes(query)
  );
});

const filteredItems = computed(() => {
  if (props.mode === 'servers') return filteredServers.value;
  if (props.mode === 'maps') return filteredMaps.value;
  return players.value;
});

// Handle game change
const handleGameChange = (game: GameType) => {
  selectedGame.value = game;
  emit('gameChange', game);
};

// Load data for servers/maps
const loadData = async () => {
  if (props.mode === 'players') {
    // Players mode uses search, not initial load
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    if (props.mode === 'servers') {
      // Reset pagination state
      currentServerPage.value = 1;
      const response = await fetchServers(selectedGame.value, 1, SERVER_PAGE_SIZE);
      servers.value = response.servers;
      hasMoreServers.value = response.hasMore;
      totalServerCount.value = response.totalCount;
    } else if (props.mode === 'maps') {
      const response = await fetchMaps(selectedGame.value);
      maps.value = response.maps;
    }
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load data';
  } finally {
    isLoading.value = false;
  }
};

// Load more servers (pagination)
const loadMoreServers = async () => {
  if (!hasMoreServers.value || isLoadingMore.value) return;

  isLoadingMore.value = true;

  try {
    const nextPage = currentServerPage.value + 1;
    const response = await fetchServers(selectedGame.value, nextPage, SERVER_PAGE_SIZE);
    // Append new servers to existing list
    servers.value = [...servers.value, ...response.servers];
    currentServerPage.value = nextPage;
    hasMoreServers.value = response.hasMore;
  } catch (err) {
    console.error('Error loading more servers:', err);
    // Don't overwrite the error state, just log it
  } finally {
    isLoadingMore.value = false;
  }
};

// Search players
const searchPlayersData = async () => {
  if (props.mode !== 'players') return;
  if (!props.searchQuery || props.searchQuery.length < 3) {
    players.value = [];
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const response = await searchPlayers(props.searchQuery, selectedGame.value);
    players.value = response.players;
  } catch (err) {
    console.error('Error searching players:', err);
    error.value = 'Failed to search players';
    players.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Load data on mount (only for servers/maps)
onMounted(() => {
  if (props.mode !== 'players') {
    loadData();
  }
});

// Reload when mode changes
watch(() => props.mode, (newMode) => {
  if (newMode === 'players') {
    // Clear players when switching to players mode, will search when user types
    players.value = [];
    if (props.searchQuery && props.searchQuery.length >= 3) {
      searchPlayersData();
    }
  } else {
    loadData();
  }
});

// Reload when game filter changes
watch(selectedGame, () => {
  if (props.mode === 'players') {
    if (props.searchQuery && props.searchQuery.length >= 3) {
      searchPlayersData();
    }
  } else {
    loadData();
  }
});

// Search when query changes (for players mode)
watch(() => props.searchQuery, () => {
  if (props.mode === 'players') {
    searchPlayersData();
  }
});
</script>
