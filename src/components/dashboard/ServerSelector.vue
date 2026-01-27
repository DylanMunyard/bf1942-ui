<script setup lang="ts">
import { ref, watch } from 'vue';

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  gameType: string;
}

interface Props {
  modelValue: string | undefined;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  selectedServer?: {
    serverGuid: string;
    serverName: string;
    serverIp: string;
    serverPort: number;
  } | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [serverGuid: string | undefined];
  'select': [server: ServerSearchResult];
  'clear': [];
}>();

const serverSearchQuery = ref('');
const serverSuggestions = ref<ServerSearchResult[]>([]);
const isServerSearchLoading = ref(false);
const showServerDropdown = ref(false);
let serverSearchTimeout: number | null = null;
let serverBlurTimeout: number | null = null;

const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    serverSuggestions.value = [];
    showServerDropdown.value = false;
    return;
  }

  isServerSearchLoading.value = true;

  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&game=${props.game}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search servers');
    }

    const data = await response.json();
    serverSuggestions.value = data.items || [];
    showServerDropdown.value = (data.items?.length || 0) > 0 || query.length >= 2;
  } catch (error) {
    console.error('Error searching servers:', error);
    serverSuggestions.value = [];
    showServerDropdown.value = false;
  } finally {
    isServerSearchLoading.value = false;
  }
};

const onServerSearchInput = () => {
  emit('update:modelValue', undefined);

  if (serverSearchTimeout) {
    clearTimeout(serverSearchTimeout);
  }

  serverSearchTimeout = setTimeout(() => {
    searchServers(serverSearchQuery.value);
  }, 300) as unknown as number;
};

const onServerSearchFocus = () => {
  if (serverBlurTimeout) {
    clearTimeout(serverBlurTimeout);
  }
  if (serverSearchQuery.value.length >= 2) {
    searchServers(serverSearchQuery.value);
  }
};

const onServerSearchBlur = () => {
  serverBlurTimeout = setTimeout(() => {
    showServerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectServer = (server: ServerSearchResult) => {
  emit('select', server);
  serverSearchQuery.value = server.serverName;
  emit('update:modelValue', server.serverGuid);
  serverSuggestions.value = [];
  showServerDropdown.value = false;
};

const clearServerSelection = () => {
  emit('clear');
  serverSearchQuery.value = '';
  emit('update:modelValue', undefined);
};

watch(() => props.selectedServer, (newServer) => {
  if (newServer) {
    serverSearchQuery.value = newServer.serverName;
  } else {
    serverSearchQuery.value = '';
  }
}, { immediate: true });
</script>

<template>
  <div class="relative z-40">
    <label class="block text-sm font-medium text-slate-300 mb-2">
      Tournament Server <span class="text-slate-500">(Optional)</span>
    </label>

    <!-- Selected Server Display -->
    <div v-if="selectedServer" class="mb-3">
      <div class="flex items-center justify-between gap-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-cyan-400 text-sm">🖥️</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-slate-200 text-sm truncate">
              {{ selectedServer.serverName }}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              {{ selectedServer.serverIp }}:{{ selectedServer.serverPort }}
            </div>
          </div>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          @click="clearServerSelection"
          title="Change server"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Server Search Input (only show when no server selected) -->
    <div v-else class="relative">
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
        <span class="text-slate-500 text-sm">🖥️</span>
      </div>
      <input
        v-model="serverSearchQuery"
        type="text"
        placeholder="Search for server..."
        class="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
        @input="onServerSearchInput"
        @focus="onServerSearchFocus"
        @blur="onServerSearchBlur"
      >

      <!-- Loading Spinner -->
      <div
        v-if="isServerSearchLoading"
        class="absolute right-4 top-1/2 transform -translate-y-1/2"
      >
        <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>

      <!-- Server Suggestions Dropdown -->
      <div
        v-if="showServerDropdown"
        class="absolute top-full mt-2 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto shadow-2xl z-50"
      >
        <div
          v-for="server in serverSuggestions"
          :key="server.serverGuid"
          class="p-3 border-b border-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all last:border-b-0"
          @mousedown.prevent="selectServer(server)"
        >
          <div class="font-medium text-slate-200 text-sm">
            {{ server.serverName }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {{ server.serverIp }}:{{ server.serverPort }}
          </div>
        </div>
        <div
          v-if="serverSuggestions.length === 0 && !isServerSearchLoading && serverSearchQuery.length >= 2"
          class="p-3 text-center text-slate-400 text-sm"
        >
          No servers found
        </div>
      </div>
    </div>
    <p class="mt-1 text-xs text-slate-500">
      Optionally specify which server this tournament will be played on
    </p>
  </div>
</template>
