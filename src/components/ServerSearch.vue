<template>
  <div
    class="server-search-container"
    @click.stop
  >
    <input 
      ref="inputRef"
      v-model="searchInput" 
      type="text" 
      :placeholder="placeholder"
      autocomplete="off"
      class="server-search-input"
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
        v-for="server in searchResults" 
        :key="server.serverGuid"
        class="search-result-item"
        @mousedown.prevent="selectServer(server)"
      >
        <div class="server-info">
          <div class="server-name">
            {{ server.serverName }}
          </div>
          <div class="server-details">
            <span class="game-mode">{{ server.gameId.toUpperCase() }}</span>
            <span class="map">{{ server.currentMap }}</span>
            <span class="players">{{ server.totalActivePlayersLast24h }} active (24h)</span>
            <span class="location">{{ server.city }}, {{ server.country }}</span>
          </div>
          <div class="server-status">
            <span
              class="status-indicator"
              :class="{ 'online': server.hasActivePlayers }"
            />
            <span
              v-if="!server.hasActivePlayers"
              class="last-activity"
            >{{ formatLastActivity(server.lastActivity) }}</span>
            <span
              v-else
              class="online-status"
            >Online</span>
          </div>
        </div>
      </div>
      <div
        v-if="searchResults.length === 0 && !isLoading && searchInput.length >= 2"
        class="no-results"
      >
        No servers found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  gameId: string;
  serverIp: string;
  serverPort: number;
  country: string;
  region: string;
  city: string;
  timezone: string;
  totalActivePlayersLast24h: number;
  totalPlayersAllTime: number;
  currentMap: string;
  hasActivePlayers: boolean;
  lastActivity: string;
}

interface ServerSearchResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: ServerSearchResult[];
  serverContext: any;
}

interface Props {
  modelValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'select', server: ServerSearchResult): void;
  (e: 'enter', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search server name...',
  autoFocus: false
});

const emit = defineEmits<Emits>();

const inputRef = ref<HTMLInputElement>();
const searchInput = ref(props.modelValue || '');
const searchResults = ref<ServerSearchResult[]>([]);
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

const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    searchResults.value = [];
    showDropdown.value = false;
    return;
  }

  isLoading.value = true;
  
  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&page=1&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search servers');
    }

    const data: ServerSearchResponse = await response.json();
    searchResults.value = data.items;
    showDropdown.value = data.items.length > 0;
  } catch (error) {
    console.error('Error searching servers:', error);
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
    searchServers(searchInput.value);
  }, 300) as unknown as number;
};

const onFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
  if (searchInput.value.length >= 2) {
    searchServers(searchInput.value);
  }
};

const onBlur = () => {
  // Delay hiding dropdown to allow for click events
  blurTimeout = setTimeout(() => {
    showDropdown.value = false;
  }, 200) as unknown as number;
};

const selectServer = (server: ServerSearchResult) => {
  searchInput.value = server.serverName;
  searchResults.value = [];
  showDropdown.value = false;
  emit('select', server);
  emit('update:modelValue', server.serverName);
};

const formatLastActivity = (lastActivity: string): string => {
  // Parse the UTC timestamp and convert to local time
  const utcDate = new Date(lastActivity + 'Z'); // Ensure it's treated as UTC
  const now = new Date();
  const diffInMs = now.getTime() - utcDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
};
</script>

<style scoped>
.server-search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.server-search-input {
  padding: 12px 40px 12px 15px;
  font-size: 1rem;
  @apply bg-slate-800/40 backdrop-blur-sm border border-slate-700/50;
  border-radius: 6px;
  color: var(--color-text);
  width: 100%;
  transition: all 0.2s ease;
}

.server-search-input:focus {
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
  border-radius: 0 0 6px 6px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1050;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
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

.server-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-weight: bold;
  font-size: 1rem;
  color: var(--color-text);
}

.server-details {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.game-mode {
  color: var(--color-accent);
  font-weight: 600;
  font-size: 0.75rem;
}

.map {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.players {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.location {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: 0.75rem;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
}

.status-indicator.online {
  background-color: #22c55e;
}

.last-activity {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.online-status {
  color: #22c55e;
  font-size: 0.75rem;
  font-weight: 600;
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
  
  .server-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>