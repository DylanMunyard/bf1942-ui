<template>
  <div
    class="relative flex items-center"
    @click.stop
  >
    <input 
      ref="inputRef"
      v-model="searchInput" 
      type="text" 
      :placeholder="placeholder"
      autocomplete="off"
      class="w-full px-5 py-4 pr-12 text-base bg-slate-800/60 backdrop-blur-lg border border-slate-600/50 rounded-xl text-white placeholder-slate-400 font-normal transition-all duration-300 shadow-md focus:outline-none focus:border-cyan-500 focus:shadow-cyan-500/15 focus:shadow-lg focus:-translate-y-0.5 focus:bg-slate-800/80"
      @keyup.enter="$emit('enter', searchInput)"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    >
    <div
      v-if="isLoading"
      class="absolute right-4 text-base text-cyan-500 animate-spin pointer-events-none"
    >
      🔄
    </div>
    <div
      v-if="showDropdown && (searchResults.length > 0 || (!isLoading && searchInput.length >= 2))"
      class="absolute top-full mt-1 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl max-h-80 overflow-y-auto z-[1050] shadow-2xl"
    >
      <div 
        v-for="player in searchResults" 
        :key="player.playerName"
        class="p-4 px-5 cursor-pointer border-b border-slate-600/20 last:border-b-0 transition-all duration-200 hover:bg-slate-700/60 hover:shadow-[inset_3px_0_0_#06b6d4] first:rounded-t-xl last:rounded-b-xl relative before:absolute before:inset-0 before:bg-cyan-500/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
        :class="{
          'rounded-xl': searchResults.length === 1
        }"
        @mousedown.prevent="selectPlayer(player)"
      >
        <div class="flex flex-col gap-1.5">
          <div class="font-semibold text-lg text-white mb-0.5">
            {{ player.playerName }}
          </div>
          <div class="flex gap-3 items-center flex-wrap">
            <span class="text-slate-400 text-sm font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
            <span class="text-slate-400 text-sm font-medium">{{ formatLastSeen(player.lastSeen) }}</span>
            <span
              v-if="player.isActive"
              class="text-green-500 text-xs font-semibold px-2 py-1 bg-green-500/15 border border-green-500/20 rounded-xl inline-flex items-center gap-1"
            >🟢 Online</span>
            <span
              v-else
              class="text-gray-400 text-xs font-semibold px-2 py-1 bg-gray-500/15 border border-gray-500/20 rounded-xl inline-flex items-center gap-1"
            >⚫ Offline</span>
          </div>
          <div
            v-if="player.currentServer && player.isActive"
            class="text-sm text-cyan-400 italic px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded mt-1"
          >
            {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
          </div>
        </div>
      </div>
      <div
        v-if="searchResults.length === 0 && !isLoading && searchInput.length >= 2"
        class="p-5 text-slate-400 text-center italic text-sm"
      >
        No players found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
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
  modelValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search player name...',
  autoFocus: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'select': [player: PlayerSearchResult];
  'enter': [value: string];
}>();

const inputRef = ref<HTMLInputElement>();
const searchInput = ref(props.modelValue || '');
const searchResults = ref<PlayerSearchResult[]>([]);
const isLoading = ref(false);
const showDropdown = ref(false);
let searchTimeout: number | null = null;
let blurTimeout: number | null = null;

// Watch for external model value changes
watch(() => props.modelValue, (newValue) => {
  searchInput.value = newValue || '';
});

// Watch for input changes and emit to parent
watch(searchInput, (newValue) => {
  emit('update:modelValue', newValue);
});

// Auto-focus on mount if requested
onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

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

const onInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    searchPlayers(searchInput.value);
  }, 300) as unknown as number;
};

const onFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
  if (searchInput.value.length >= 2) {
    searchPlayers(searchInput.value);
  }
};

const onBlur = () => {
  // Delay hiding dropdown to allow for click events
  blurTimeout = setTimeout(() => {
    showDropdown.value = false;
  }, 200) as unknown as number;
};

const selectPlayer = (player: PlayerSearchResult) => {
  searchInput.value = player.playerName;
  searchResults.value = [];
  showDropdown.value = false;
  emit('select', player);
  emit('update:modelValue', player.playerName);
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

// Note: formatLastSeen is now imported from @/utils/timeUtils
</script>

<style scoped>
/* Mobile responsiveness */
@media (max-width: 480px) {
  .max-h-80 {
    max-height: 200px;
  }
}
</style>