<script setup lang="ts">
import { ref, watch } from 'vue';
import { formatLastSeen } from '@/utils/timeUtils';

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
  placeholder: string;
  playerNumber: 1 | 2;
}

const props = defineProps<Props>();
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
    showDropdown.value = data.items.length > 0;
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

const selectPlayer = (player: PlayerSearchResult) => {
  emit('update:modelValue', player.playerName);
  emit('select', player);
  showDropdown.value = false;
  searchResults.value = [];
};

const hideDropdown = () => {
  showDropdown.value = false;
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
    class="relative flex-1 w-full lg:w-auto"
    @click.stop
  >
    <div class="relative group">
      <!-- Search Icon -->
      <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div 
          class="w-5 h-5 rounded-full flex items-center justify-center"
          :class="playerNumber === 1 
            ? 'bg-gradient-to-r from-cyan-400 to-purple-500' 
            : 'bg-gradient-to-r from-orange-400 to-red-500'"
        >
          <span class="text-slate-900 text-xs font-bold">👤</span>
        </div>
      </div>
      
      <!-- Search Input -->
      <input
        :value="modelValue"
        type="text" 
        :placeholder="placeholder" 
        autocomplete="off"
        class="w-full pl-14 pr-14 py-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 font-medium shadow-lg focus:shadow-cyan-500/30"
        :class="playerNumber === 1 
          ? 'focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:shadow-cyan-500/20' 
          : 'focus:ring-orange-500/50 focus:border-orange-500/50 hover:shadow-orange-500/20'"
        @keyup.enter="$emit('enter')"
        @input="(e) => onInput((e.target as HTMLInputElement).value)"
        @focus="onFocus"
      >
      
      <!-- Loading Spinner -->
      <div
        v-if="isLoading"
        class="absolute right-4 top-1/2 transform -translate-y-1/2"
      >
        <div 
          class="w-5 h-5 border-2 rounded-full animate-spin"
          :class="playerNumber === 1 
            ? 'border-cyan-500/30 border-t-cyan-400' 
            : 'border-orange-500/30 border-t-orange-400'"
        />
      </div>
      
      <!-- Search Glow Effect -->
      <div 
        class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        :class="playerNumber === 1 
          ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10' 
          : 'bg-gradient-to-r from-orange-500/10 to-red-500/10'"
      />
      
      <!-- Player Dropdown -->
      <div
        v-if="showDropdown"
        class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
      >
        <div
          v-for="player in searchResults"
          :key="player.playerName"
          class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
          @mousedown.prevent="selectPlayer(player)"
        >
          <div class="space-y-2">
            <div 
              class="font-bold text-slate-200 text-sm group-hover:transition-colors"
              :class="playerNumber === 1 ? 'group-hover:text-cyan-400' : 'group-hover:text-orange-400'"
            >
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
              class="text-xs font-medium"
              :class="playerNumber === 1 ? 'text-cyan-400' : 'text-orange-400'"
            >
              🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
            </div>
          </div>
        </div>
        <div
          v-if="searchResults.length === 0 && !isLoading"
          class="p-4 text-center text-slate-400 text-sm font-medium"
        >
          🔍 No players found
        </div>
      </div>
    </div>
  </div>
</template>
