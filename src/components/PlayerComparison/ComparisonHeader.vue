<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { formatLastSeen } from '@/utils/timeUtils';

// Define the structure for player search results
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

// Props
interface Props {
  initialPlayer1?: string;
  initialPlayer2?: string;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialPlayer1: '',
  initialPlayer2: '',
  isLoading: false,
});

// Emits
interface Emits {
  (e: 'compare', payload: { player1: string; player2: string }): void;
}

const emit = defineEmits<Emits>();

// Internal state
const player1Input = ref('');
const player2Input = ref('');
const player2InputRef = ref<HTMLInputElement | null>(null);
const player1SearchResults = ref<PlayerSearchResult[]>([]);
const player2SearchResults = ref<PlayerSearchResult[]>([]);
const player1SearchLoading = ref(false);
const player2SearchLoading = ref(false);
const showPlayer1Dropdown = ref(false);
const showPlayer2Dropdown = ref(false);
const searchDebounceTimeout = ref<number | null>(null);

// Search functionality
const searchPlayers = async (query: string, playerNumber: 1 | 2) => {
  if (!query || query.length < 2) {
    if (playerNumber === 1) {
      player1SearchResults.value = [];
      showPlayer1Dropdown.value = false;
    } else {
      player2SearchResults.value = [];
      showPlayer2Dropdown.value = false;
    }
    return;
  }

  if (playerNumber === 1) {
    player1SearchLoading.value = true;
  } else {
    player2SearchLoading.value = true;
  }

  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data: PlayerSearchResponse = await response.json();

    if (playerNumber === 1) {
      player1SearchResults.value = data.items;
      showPlayer1Dropdown.value = data.items.length > 0;
    } else {
      player2SearchResults.value = data.items;
      showPlayer2Dropdown.value = data.items.length > 0;
    }
  } catch (error) {
    console.error('Error searching players:', error);
    if (playerNumber === 1) {
      player1SearchResults.value = [];
      showPlayer1Dropdown.value = false;
    } else {
      player2SearchResults.value = [];
      showPlayer2Dropdown.value = false;
    }
  } finally {
    if (playerNumber === 1) {
      player1SearchLoading.value = false;
    } else {
      player2SearchLoading.value = false;
    }
  }
};

const onPlayerInput = (query: string, playerNumber: 1 | 2) => {
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value);
  }

  searchDebounceTimeout.value = setTimeout(() => {
    searchPlayers(query, playerNumber);
  }, 300) as unknown as number;
};

const selectPlayer = (player: PlayerSearchResult, playerNumber: 1 | 2) => {
  if (playerNumber === 1) {
    player1Input.value = player.playerName;
    showPlayer1Dropdown.value = false;
    player1SearchResults.value = [];
  } else {
    player2Input.value = player.playerName;
    showPlayer2Dropdown.value = false;
    player2SearchResults.value = [];
  }
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const hideDropdowns = () => {
  showPlayer1Dropdown.value = false;
  showPlayer2Dropdown.value = false;
};

const handleCompare = () => {
  const p1 = player1Input.value.trim();
  const p2 = player2Input.value.trim();

  if (p1 && p2) {
    emit('compare', { player1: p1, player2: p2 });
  }
};

// Initialize from props on mount
onMounted(() => {
  if (props.initialPlayer1) {
    player1Input.value = props.initialPlayer1;

    if (props.initialPlayer2) {
      player2Input.value = props.initialPlayer2;
    } else {
      // If only player1 is provided, focus the player2 input field
      nextTick(() => {
        if (player2InputRef.value) {
          player2InputRef.value.focus();
        }
      });
    }
  }
});
</script>

<template>
  <!-- Header Section -->
  <div class="bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg border-b border-slate-700/50">
    <div class="max-w-7xl mx-auto p-6">
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4">
          Player Comparison
        </h1>
        <p class="text-slate-400 text-lg">
          Compare two players' statistics and performance side-by-side
        </p>
      </div>

      <!-- Search Form -->
      <div
        class="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-4xl mx-auto"
        @click="hideDropdowns"
      >
        <!-- Player 1 Input with Search -->
        <div
          class="relative flex-1 w-full lg:w-auto"
          @click.stop
        >
          <div class="relative group">
            <!-- Search Icon -->
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                <span class="text-slate-900 text-xs font-bold">👤</span>
              </div>
            </div>

            <!-- Enhanced Search Input -->
            <input
              v-model="player1Input"
              type="text"
              placeholder="Player 1 Name"
              autocomplete="off"
              class="w-full pl-14 pr-14 py-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/20 focus:shadow-cyan-500/30"
              @keyup.enter="handleCompare"
              @input="onPlayerInput(player1Input, 1)"
              @focus="player1Input.length >= 2 && searchPlayers(player1Input, 1)"
            >

            <!-- Loading Spinner -->
            <div
              v-if="player1SearchLoading"
              class="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>

            <!-- Search Glow Effect -->
            <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <!-- Enhanced Player Dropdown -->
            <div
              v-if="showPlayer1Dropdown"
              class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
            >
              <div
                v-for="player in player1SearchResults"
                :key="player.playerName"
                class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                @mousedown.prevent="selectPlayer(player, 1)"
              >
                <div class="space-y-2">
                  <div class="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors">
                    {{ player.playerName }}
                  </div>
                  <div class="flex items-center gap-3 flex-wrap text-xs">
                    <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                    <span class="text-slate-500">{{ formatLastSeen(player.lastSeen) }}</span>
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
                v-if="player1SearchResults.length === 0 && !player1SearchLoading"
                class="p-4 text-center text-slate-400 text-sm font-medium"
              >
                🔍 No players found
              </div>
            </div>
          </div>
        </div>

        <!-- VS Text -->
        <div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 flex-shrink-0">
          VS
        </div>

        <!-- Player 2 Input with Search -->
        <div
          class="relative flex-1 w-full lg:w-auto"
          @click.stop
        >
          <div class="relative group">
            <!-- Search Icon -->
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div class="w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                <span class="text-slate-900 text-xs font-bold">👤</span>
              </div>
            </div>

            <!-- Enhanced Search Input -->
            <input
              ref="player2InputRef"
              v-model="player2Input"
              type="text"
              placeholder="Player 2 Name"
              autocomplete="off"
              class="w-full pl-14 pr-14 py-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-orange-500/20 focus:shadow-orange-500/30"
              @keyup.enter="handleCompare"
              @input="onPlayerInput(player2Input, 2)"
              @focus="player2Input.length >= 2 && searchPlayers(player2Input, 2)"
            >

            <!-- Loading Spinner -->
            <div
              v-if="player2SearchLoading"
              class="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <div class="w-5 h-5 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
            </div>

            <!-- Search Glow Effect -->
            <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <!-- Enhanced Player Dropdown -->
            <div
              v-if="showPlayer2Dropdown"
              class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
            >
              <div
                v-for="player in player2SearchResults"
                :key="player.playerName"
                class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                @mousedown.prevent="selectPlayer(player, 2)"
              >
                <div class="space-y-2">
                  <div class="font-bold text-slate-200 text-sm group-hover:text-orange-400 transition-colors">
                    {{ player.playerName }}
                  </div>
                  <div class="flex items-center gap-3 flex-wrap text-xs">
                    <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                    <span class="text-slate-500">{{ formatLastSeen(player.lastSeen) }}</span>
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
                    class="text-xs text-orange-400 font-medium"
                  >
                    🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                  </div>
                </div>
              </div>
              <div
                v-if="player2SearchResults.length === 0 && !player2SearchLoading"
                class="p-4 text-center text-slate-400 text-sm font-medium"
              >
                🔍 No players found
              </div>
            </div>
          </div>
        </div>

        <!-- Compare Button -->
        <button
          :disabled="isLoading || !player1Input.trim() || !player2Input.trim()"
          class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-purple-500/25 disabled:shadow-none disabled:cursor-not-allowed flex-shrink-0"
          @click="handleCompare"
        >
          <span
            v-if="isLoading"
            class="flex items-center gap-2"
          >
            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Comparing...
          </span>
          <span
            v-else
            class="flex items-center gap-2"
          >
            ⚔️ Compare
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
