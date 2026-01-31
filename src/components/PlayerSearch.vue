<script setup lang="ts">
import { ref, watch } from 'vue';

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

interface Props {
  modelValue: string;
  placeholder?: string;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search players...',
  fullWidth: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'select': [player: PlayerSearchResult];
  'enter': [];
}>();

const searchResults = ref<PlayerSearchResult[]>([]);
const isLoading = ref(false);
const showDropdown = ref(false);
const searchDebounceTimeout = ref<number | null>(null);

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    searchResults.value = [];
    showDropdown.value = false;
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data: PlayerSearchResponse = await response.json();
    searchResults.value = data.items;
    showDropdown.value = data.items.length > 0 || query.length >= 2;
  } catch (error) {
    console.error('Error searching players:', error);
    searchResults.value = [];
    showDropdown.value = false;
  } finally {
    isLoading.value = false;
  }
};

const onInput = (query: string) => {
  emit('update:modelValue', query);
  
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value);
  }

  searchDebounceTimeout.value = setTimeout(() => {
    searchPlayers(query);
  }, 300) as unknown as number;
};

const onFocus = () => {
  if (props.modelValue.length >= 2) {
    searchPlayers(props.modelValue);
  }
};

const onBlur = () => {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

const selectPlayer = (player: PlayerSearchResult) => {
  emit('update:modelValue', player.playerName);
  emit('select', player);
  showDropdown.value = false;
  searchResults.value = [];
};

watch(() => props.modelValue, (newValue) => {
  if (newValue.length >= 2) {
    onInput(newValue);
  } else {
    searchResults.value = [];
    showDropdown.value = false;
  }
});
</script>

<template>
  <div
    class="relative group"
    :class="fullWidth ? 'w-full' : 'w-80'"
  >
    <!-- Search Icon with Glow -->
    <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
      <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
        <span class="text-neutral-900 text-xs font-bold">🔍</span>
      </div>
    </div>
    
    <!-- Enhanced Search Input -->
    <input
      :model-value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="w-full pl-14 pr-14 py-3 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 backdrop-blur-lg border border-neutral-700/50 rounded-xl text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/20 focus:shadow-cyan-500/30"
      @input="(e) => onInput((e.target as HTMLInputElement).value)"
      @keyup.enter="$emit('enter')"
      @focus="onFocus"
      @blur="onBlur"
    >
    
    <!-- Loading Spinner -->
    <div
      v-if="isLoading"
      class="absolute right-4 top-1/2 transform -translate-y-1/2"
    >
      <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
    
    <!-- Search Glow Effect -->
    <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    
    <!-- Enhanced Player Dropdown -->
    <div
      v-if="showDropdown"
      class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-neutral-800/95 to-neutral-900/95 backdrop-blur-lg rounded-xl border border-neutral-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
    >
      <div
        v-for="player in searchResults"
        :key="player.playerName"
        class="group p-4 border-b border-neutral-700/30 hover:bg-gradient-to-r hover:from-neutral-700/50 hover:to-neutral-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
        @mousedown.prevent="selectPlayer(player)"
      >
        <div class="space-y-2">
          <div class="font-bold text-neutral-200 text-sm group-hover:text-cyan-400 transition-colors">
            {{ player.playerName }}
          </div>
          <div class="flex items-center gap-3 flex-wrap text-xs">
            <span class="text-neutral-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
            <span
              v-if="player.isActive"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full"
            >
              🟢 ONLINE
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-500 bg-neutral-500/20 border border-neutral-500/30 rounded-full"
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
        v-if="searchResults.length === 0 && !isLoading && modelValue.length >= 2"
        class="p-4 text-center text-neutral-400 text-sm font-medium"
      >
        🔍 No players found
      </div>
    </div>
  </div>
</template>
