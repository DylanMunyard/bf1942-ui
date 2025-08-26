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
      class="w-full px-5 py-4 pr-12 text-base bg-slate-800/60 backdrop-blur-lg border border-slate-600/50 rounded-xl text-white placeholder-slate-400 font-normal transition-all duration-300 shadow-md focus:outline-none focus:border-emerald-500 focus:shadow-emerald-500/15 focus:shadow-lg focus:-translate-y-0.5 focus:bg-slate-800/80"
      @keyup.enter="$emit('enter', searchInput)"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    >
    <div
      v-if="isLoading"
      class="absolute right-4 text-base text-emerald-500 animate-spin pointer-events-none"
    >
      🔄
    </div>
    <div
      v-if="showDropdown && (searchResults.length > 0 || (!isLoading && searchInput.length >= 2))"
      class="absolute top-full mt-1 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl max-h-80 overflow-y-auto z-[1050] shadow-2xl"
    >
      <div 
        v-for="(server, index) in searchResults" 
        :key="server.serverGuid"
        class="p-4 px-5 cursor-pointer border-b border-slate-600/20 last:border-b-0 transition-all duration-200 hover:bg-slate-700/60 hover:shadow-[inset_3px_0_0_#10b981] first:rounded-t-xl last:rounded-b-xl relative before:absolute before:inset-0 before:bg-emerald-500/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
        :class="{
          'rounded-xl': searchResults.length === 1
        }"
        @mousedown.prevent="selectServer(server)"
      >
        <div class="flex flex-col gap-1.5">
          <div class="font-semibold text-lg text-white mb-0.5">
            {{ server.serverName }}
          </div>
          <div class="flex gap-3 items-center flex-wrap">
            <span class="text-emerald-500 font-bold text-xs px-2 py-0.5 bg-emerald-500/15 rounded-xl border border-emerald-500/20 uppercase">{{ server.gameId.toUpperCase() }}</span>
            <span class="text-slate-400 text-sm font-medium">{{ server.currentMap }}</span>
            <span class="text-slate-400 text-sm font-medium">{{ server.totalActivePlayersLast24h }} active (24h)</span>
            <span class="text-slate-400 italic text-xs">{{ server.city }}, {{ server.country }}</span>
          </div>
          <div class="flex items-center gap-2 mt-1.5">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :class="server.hasActivePlayers ? 'bg-green-500 shadow-green-500/40 shadow-sm' : 'bg-red-500 shadow-red-500/40 shadow-sm'"
            />
            <span
              v-if="!server.hasActivePlayers"
              class="text-slate-400 text-xs font-medium"
            >{{ formatLastActivity(server.lastActivity) }}</span>
            <span
              v-else
              class="text-green-500 text-xs font-semibold px-1.5 py-0.5 bg-green-500/10 rounded border border-green-500/20"
            >Online</span>
          </div>
        </div>
      </div>
      <div
        v-if="searchResults.length === 0 && !isLoading && searchInput.length >= 2"
        class="p-5 text-slate-400 text-center italic text-sm"
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
/* Mobile responsiveness */
@media (max-width: 480px) {
  .max-h-80 {
    max-height: 200px;
  }
  
  .flex-wrap {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>