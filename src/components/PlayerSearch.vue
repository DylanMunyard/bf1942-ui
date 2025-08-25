<template>
  <div
    class="player-search-container"
    @click.stop
  >
    <input 
      ref="inputRef"
      v-model="searchInput" 
      type="text" 
      :placeholder="placeholder"
      autocomplete="off"
      class="player-search-input"
      @keyup.enter="$emit('enter', searchInput)"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    >
    <div
      v-if="isLoading"
      class="search-spinner"
    >
      🔄
    </div>
    <div
      v-if="showDropdown && (searchResults.length > 0 || (!isLoading && searchInput.length >= 2))"
      class="search-dropdown"
    >
      <div 
        v-for="player in searchResults" 
        :key="player.playerName"
        class="search-result-item"
        @mousedown.prevent="selectPlayer(player)"
      >
        <div class="player-info">
          <div class="player-name">
            {{ player.playerName }}
          </div>
          <div class="player-details">
            <span class="play-time">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
            <span class="last-seen">{{ formatLastSeen(player.lastSeen) }}</span>
            <span
              v-if="player.isActive"
              class="active-badge"
            >🟢 Online</span>
            <span
              v-else
              class="inactive-badge"
            >⚫ Offline</span>
          </div>
          <div
            v-if="player.currentServer && player.isActive"
            class="current-server"
          >
            {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
          </div>
        </div>
      </div>
      <div
        v-if="searchResults.length === 0 && !isLoading && searchInput.length >= 2"
        class="no-results"
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
.player-search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.player-search-input {
  padding: 12px 40px 12px 15px;
  font-size: 1rem;
  @apply bg-slate-800/40 backdrop-blur-sm border border-slate-700/50;
  border-radius: 8px;
  color: var(--color-text);
  width: 100%;
  transition: all 0.2s ease;
}

.player-search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
}

.search-spinner {
  position: absolute;
  right: 10px;
  font-size: 12px;
  animation: spin 1s linear infinite;
  pointer-events: none;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  @apply bg-slate-800/95 backdrop-blur-md border border-slate-700/50;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1050;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.search-result-item {
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s ease;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  @apply bg-slate-700/40;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-name {
  font-weight: bold;
  font-size: 1rem;
  color: var(--color-text);
}

.player-details {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.play-time,
.last-seen {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.active-badge,
.inactive-badge {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 600;
}

.active-badge {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.inactive-badge {
  background-color: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.current-server {
  font-size: 0.8rem;
  color: var(--color-accent);
  font-style: italic;
}

.no-results {
  padding: 12px 15px;
  color: var(--color-text-secondary);
  text-align: center;
  font-style: italic;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .search-dropdown {
    max-height: 200px;
  }
}
</style>