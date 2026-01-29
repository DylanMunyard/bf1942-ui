<template>
  <div class="master-list">
    <!-- Terminal-style Header -->
    <div class="master-list-header">
      <div class="master-list-header-row">
        <span class="master-list-title">
          <span class="title-icon">{{ modeIcon }}</span>
          {{ modeLabel }}
          <span v-if="mode !== 'players' || players.length > 0" class="master-list-count">
            [{{ filteredItems.length }}]
          </span>
        </span>

        <!-- Game Toggle -->
        <div class="master-list-game-toggle">
          <button
            v-for="game in games"
            :key="game.id"
            @click="handleGameChange(game.id)"
            :class="['master-list-game-btn', selectedGame === game.id && 'master-list-game-btn--active']"
            :title="game.name"
          >
            {{ game.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="master-list-body">
      <div v-for="i in 8" :key="i" class="master-list-skeleton">
        <div class="master-list-skeleton-bar"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="master-list-empty">
      <div class="master-list-error">// ERROR: Failed to load data</div>
      <button @click="loadData" class="master-list-retry">
        $ retry --force
      </button>
    </div>

    <!-- Players Empty State (search-only mode) -->
    <div v-else-if="mode === 'players' && players.length === 0" class="master-list-empty">
      <div class="master-list-empty-icon">&lt;@&gt;</div>
      <p v-if="!searchQuery || searchQuery.length < 3" class="master-list-empty-text">
        // Enter at least 3 characters to search
      </p>
      <p v-else class="master-list-empty-text">
        // No players found matching "{{ searchQuery }}"
      </p>
    </div>

    <!-- Empty State (servers/maps) -->
    <div v-else-if="filteredItems.length === 0 && mode !== 'players'" class="master-list-empty">
      <div class="master-list-empty-icon">{{ mode === 'servers' ? '{::}' : '[#]' }}</div>
      <p class="master-list-empty-text">// No {{ mode }} found</p>
    </div>

    <!-- List -->
    <div v-else class="master-list-scroll">
      <template v-if="mode === 'servers'">
        <ServerListItem
          v-for="server in filteredServers"
          :key="server.guid"
          :server="server"
          :is-selected="selectedItem === server.guid"
          @click="emit('select', server.guid)"
        />
        <!-- Load More Button for Servers -->
        <div v-if="hasMoreServers && !props.searchQuery" class="master-list-load-more">
          <button
            @click="loadMoreServers"
            :disabled="isLoadingMore"
            class="master-list-load-more-btn"
          >
            <span v-if="isLoadingMore">$ loading...</span>
            <span v-else>$ load-more --count {{ totalServerCount - servers.length }}</span>
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

// Mode icon
const modeIcon = computed(() => {
  switch (props.mode) {
    case 'servers': return '{::}';
    case 'maps': return '[#]';
    case 'players': return '<@>';
    default: return '[ ]';
  }
});

// Mode label
const modeLabel = computed(() => {
  switch (props.mode) {
    case 'servers': return 'SERVERS';
    case 'maps': return 'MAPS';
    case 'players': return 'PLAYERS';
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

<style scoped>
.master-list {
  background: var(--bg-panel, #0d1117);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.master-list:hover {
  border-color: rgba(0, 255, 242, 0.2);
  box-shadow: 0 0 20px rgba(0, 255, 242, 0.05);
}

.master-list-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, #30363d);
  background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
}

.master-list-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.master-list-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--neon-cyan, #00fff2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.title-icon {
  opacity: 0.7;
}

.master-list-count {
  color: var(--text-secondary, #8b949e);
  font-weight: 400;
}

.master-list-game-toggle {
  display: flex;
  gap: 0.125rem;
  background: var(--bg-panel, #0d1117);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 4px;
  padding: 0.125rem;
}

.master-list-game-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  font-family: 'JetBrains Mono', monospace;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary, #8b949e);
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.master-list-game-btn:hover {
  color: var(--text-primary, #e6edf3);
}

.master-list-game-btn--active {
  background: rgba(0, 255, 242, 0.15);
  color: var(--neon-cyan, #00fff2);
  box-shadow: 0 0 10px rgba(0, 255, 242, 0.2);
}

.master-list-body {
  padding: 1rem;
}

.master-list-skeleton {
  margin-bottom: 0.75rem;
}

.master-list-skeleton-bar {
  height: 3.5rem;
  background: linear-gradient(
    90deg,
    var(--bg-card, #161b22) 0%,
    var(--border-color, #30363d) 50%,
    var(--bg-card, #161b22) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.master-list-empty {
  padding: 2rem 1rem;
  text-align: center;
}

.master-list-empty-icon {
  font-size: 1.5rem;
  color: var(--neon-cyan, #00fff2);
  opacity: 0.5;
  margin-bottom: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 0 10px rgba(0, 255, 242, 0.3);
}

.master-list-empty-text {
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-secondary, #8b949e);
  margin: 0;
}

.master-list-error {
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--neon-red, #ff3131);
  margin-bottom: 0.75rem;
}

.master-list-retry {
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--neon-cyan, #00fff2);
  background: none;
  border: 1px solid var(--border-color, #30363d);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.master-list-retry:hover {
  background: rgba(0, 255, 242, 0.1);
  border-color: var(--neon-cyan, #00fff2);
  box-shadow: 0 0 15px rgba(0, 255, 242, 0.2);
}

.master-list-scroll {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.master-list-load-more {
  padding: 0.75rem;
}

.master-list-load-more-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-card, #161b22);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 4px;
  color: var(--text-secondary, #8b949e);
  cursor: pointer;
  transition: all 0.2s ease;
}

.master-list-load-more-btn:hover:not(:disabled) {
  background: rgba(0, 255, 242, 0.1);
  color: var(--neon-cyan, #00fff2);
  border-color: rgba(0, 255, 242, 0.3);
  box-shadow: 0 0 10px rgba(0, 255, 242, 0.2);
}

.master-list-load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
