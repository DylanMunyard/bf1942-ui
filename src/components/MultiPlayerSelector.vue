<template>
  <div class="space-y-4">
    <!-- Current Players Display -->
    <div v-if="currentPlayers.length > 0">
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-slate-300">
          Current Players ({{ currentPlayers.length }})
        </label>
        <button
          class="text-xs text-red-400 hover:text-red-300 transition-colors"
          @click="$emit('clearAllPlayers')"
          :disabled="loading"
        >
          Remove All
        </button>
      </div>

      <!-- Added Players List -->
      <div class="max-h-32 overflow-y-auto bg-slate-800/30 border border-slate-700/30 rounded-lg p-2">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(player, index) in currentPlayers"
            :key="index"
            class="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm"
          >
            <span class="text-cyan-400">👤</span>
            <span class="text-slate-200 font-medium">{{ player }}</span>
            <button
              class="text-red-400 hover:text-red-300 transition-colors ml-1"
              @click="$emit('removePlayer', index)"
              :disabled="loading"
              title="Remove player"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Search -->
    <div class="space-y-3">
      <div class="relative">
        <input
          v-model="playerSearchQuery"
          type="text"
          :placeholder="placeholder"
          class="w-full px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          :disabled="loading"
          @input="debouncedPlayerSearch"
          @focus="showPlayerDropdown = true"
        >
      </div>

      <!-- Player Search Results -->
      <div v-if="showPlayerDropdown && playerSearchResults.length > 0" class="bg-slate-800/60 border border-slate-700/50 rounded-lg max-h-64 overflow-y-auto">
        <div class="p-2 border-b border-slate-700/30 flex items-center justify-between text-xs text-slate-400">
          <span>{{ selectedPlayerNames.length }} selected</span>
          <div class="flex gap-2">
            <button
              class="px-2 py-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
              @click="selectAllVisiblePlayers"
            >
              Select All
            </button>
            <button
              v-if="selectedPlayerNames.length > 0"
              class="px-2 py-1 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition-colors"
              @click="selectedPlayerNames = []"
            >
              Clear
            </button>
          </div>
        </div>
        <div
          v-for="player in playerSearchResults"
          :key="player.playerName"
          class="p-3 border-b border-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all last:border-b-0 flex items-center gap-3"
          @click="togglePlayerSelection(player.playerName)"
        >
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
            :class="isPlayerSelected(player.playerName)
              ? 'border-cyan-400 bg-cyan-400'
              : 'border-slate-600 bg-transparent hover:border-slate-500'"
          >
            <svg
              v-if="isPlayerSelected(player.playerName)"
              class="w-3 h-3 text-slate-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-slate-200 text-sm truncate">
              {{ player.playerName }}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              {{ formatPlayerStats(player) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="searchingPlayers" class="text-center py-4">
        <div class="w-6 h-6 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
        <p class="text-slate-400 text-xs mt-2">Searching...</p>
      </div>

      <!-- No Results -->
      <div v-if="showPlayerDropdown && !searchingPlayers && playerSearchQuery.length >= 2 && playerSearchResults.length === 0" class="text-center py-8 bg-slate-800/30 border border-slate-700/30 rounded-lg">
        <span class="text-4xl mb-2 block">🔍</span>
        <p class="text-slate-400 text-sm">No players found</p>
      </div>

      <!-- Add Selected Button -->
      <button
        v-if="selectedPlayerNames.length > 0"
        class="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2"
        @click="addSelectedPlayers"
        :disabled="loading"
      >
        <span>Add {{ selectedPlayerNames.length }} {{ selectedPlayerNames.length === 1 ? 'Player' : 'Players' }}</span>
      </button>
    </div>

    <p class="mt-2 text-xs text-slate-500">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  currentPlayers: string[];
  placeholder?: string;
  helpText?: string;
  loading?: boolean;
}

interface PlayerSearchResult {
  playerName: string;
  totalKills?: number;
  totalDeaths?: number;
  kdRatio?: number;
  lastSeen?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search for players by name...',
  helpText: 'Search for players and select multiple to add them to the team. Great for adding clan members!',
  loading: false,
});

const emit = defineEmits<{
  addPlayers: [players: string[]];
  removePlayer: [index: number];
  clearAllPlayers: [];
}>();

const playerSearchQuery = ref('');
const playerSearchResults = ref<PlayerSearchResult[]>([]);
const selectedPlayerNames = ref<string[]>([]);
const searchingPlayers = ref(false);
const showPlayerDropdown = ref(false);

let playerSearchTimeout: number | null = null;

const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    playerSearchResults.value = [];
    showPlayerDropdown.value = false;
    return;
  }

  searchingPlayers.value = true;

  try {
    const response = await fetch(`/stats/players/search?query=${encodeURIComponent(query)}&pageSize=20`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data = await response.json();
    playerSearchResults.value = data.items || [];
    showPlayerDropdown.value = true;
  } catch (err) {
    console.error('Error searching players:', err);
    playerSearchResults.value = [];
    showPlayerDropdown.value = false;
  } finally {
    searchingPlayers.value = false;
  }
};

const debouncedPlayerSearch = () => {
  selectedPlayerNames.value = [];

  if (playerSearchTimeout) {
    clearTimeout(playerSearchTimeout);
  }

  playerSearchTimeout = setTimeout(() => {
    searchPlayers(playerSearchQuery.value);
  }, 300) as unknown as number;
};

const isPlayerSelected = (playerName: string): boolean => {
  return selectedPlayerNames.value.includes(playerName);
};

const togglePlayerSelection = (playerName: string) => {
  const index = selectedPlayerNames.value.indexOf(playerName);
  if (index > -1) {
    selectedPlayerNames.value.splice(index, 1);
  } else {
    selectedPlayerNames.value.push(playerName);
  }
};

const selectAllVisiblePlayers = () => {
  const newSelections = playerSearchResults.value
    .map(p => p.playerName)
    .filter(name => !props.currentPlayers.includes(name));

  selectedPlayerNames.value = [...new Set([...selectedPlayerNames.value, ...newSelections])];
};

const addSelectedPlayers = () => {
  const playersToAdd = selectedPlayerNames.value.filter(name => !props.currentPlayers.includes(name));

  if (playersToAdd.length > 0) {
    emit('addPlayers', playersToAdd);
  }

  selectedPlayerNames.value = [];
  playerSearchQuery.value = '';
  playerSearchResults.value = [];
  showPlayerDropdown.value = false;
};

const formatPlayerStats = (player: PlayerSearchResult): string => {
  const parts = [];

  if (player.kdRatio !== undefined) {
    parts.push(`K/D: ${player.kdRatio.toFixed(2)}`);
  }

  if (player.totalKills !== undefined) {
    parts.push(`${player.totalKills} kills`);
  }

  if (player.lastSeen) {
    const date = new Date(player.lastSeen);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      parts.push('Active today');
    } else if (diffDays === 1) {
      parts.push('Active yesterday');
    } else if (diffDays < 7) {
      parts.push(`Active ${diffDays}d ago`);
    } else {
      parts.push(`Last seen ${diffDays}d ago`);
    }
  }

  return parts.length > 0 ? parts.join(' • ') : 'No stats available';
};
</script>

<style scoped>
/* Smooth scrolling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>