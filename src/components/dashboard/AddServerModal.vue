<template>
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
    @click="handleOverlayClick"
    @mousedown="handleOverlayMouseDown"
  >
    <div
      class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-2xl w-[90%] max-w-lg max-h-[90vh] overflow-visible"
      @click.stop
      @mousedown="handleModalMouseDown"
    >
      <div class="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/20">
        <div class="flex flex-col gap-1">
          <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 m-0">
            Add Favorite Server
          </h3>
          <p class="text-slate-400 text-sm font-normal m-0">
            Save servers to quickly monitor status and join battles
          </p>
        </div>
        <button
          class="bg-transparent border-0 text-slate-400 cursor-pointer text-2xl w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
      
      <div class="p-6 overflow-visible max-h-[calc(90vh-140px)]">
        <div class="mb-5">
          <label
            for="serverSearch"
            class="block text-white font-semibold mb-2"
          >Search Servers</label>
          <ServerSearch
            v-model="serverName"
            placeholder="Search for server name..."
            auto-focus
            @select="onServerSelected"
            @enter="handleSubmit"
          />
          <small class="block text-slate-400 text-sm mt-1.5">
            Start typing to search for a server name
          </small>
        </div>

        <div
          v-if="error"
          class="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20"
        >
          {{ error }}
        </div>

        <div
          v-if="selectedServer"
          class="mb-5"
        >
          <h4 class="text-white m-0 mb-3 text-base font-semibold">
            Selected Server
          </h4>
          <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div class="flex flex-col gap-2">
              <h5 class="text-white m-0 text-base font-semibold">
                {{ selectedServer.serverName }}
              </h5>
              <div class="flex flex-wrap gap-2 items-center mb-2">
                <span class="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">{{ selectedServer.gameId.toUpperCase() }}</span>
                <span class="text-slate-400 text-sm font-medium">{{ selectedServer.currentMap }}</span>
                <span
                  v-if="!selectedServer.hasActivePlayers"
                  class="text-slate-400 text-sm"
                >
                  Offline {{ formatLastActivity(selectedServer.lastActivity) }}
                </span>
                <span
                  v-else
                  class="text-green-400 text-sm font-semibold"
                >Online</span>
              </div>
              <div class="flex flex-wrap gap-3 text-sm text-slate-400">
                <span>{{ selectedServer.totalActivePlayersLast24h }} active players (24h)</span>
                <span>{{ selectedServer.city }}, {{ selectedServer.country }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end mt-6 pt-5 border-t border-slate-700/50">
          <button
            type="button"
            class="px-5 py-2.5 rounded-lg border border-slate-700/50 bg-transparent text-slate-400 cursor-pointer font-semibold text-sm transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button 
            type="button" 
            :disabled="!selectedServer || isSubmitting" 
            class="px-5 py-2.5 rounded-lg border-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white cursor-pointer font-semibold text-sm transition-all duration-200 flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed hover:disabled:shadow-none"
            @click="handleAddServer"
          >
            <span
              v-if="isSubmitting"
              class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            {{ isSubmitting ? 'Adding...' : 'Add to Favorites' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ServerSearch from '../ServerSearch.vue';
import { statsService } from '@/services/statsService';

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

const emit = defineEmits<{
  close: [];
  added: [server: any];
}>();

const serverName = ref('');
const selectedServer = ref<ServerSearchResult | null>(null);
const isSubmitting = ref(false);
const error = ref('');
const mouseDownInsideModal = ref(false);

const onServerSelected = (server: ServerSearchResult) => {
  selectedServer.value = server;
  error.value = '';
  serverName.value = server.serverName;
};

const handleSubmit = async () => {
  if (!serverName.value.trim()) {
    error.value = 'Please select a server from the search results.';
    return;
  }
  
  await handleAddServer();
};

const handleAddServer = async () => {
  if (!selectedServer.value) return;
  
  isSubmitting.value = true;
  try {
    await statsService.addFavoriteServer(selectedServer.value.serverGuid);
    
    // Convert server data to format expected by dashboard
    const serverForDashboard = {
      id: selectedServer.value.serverGuid,
      name: selectedServer.value.serverName,
      gameMode: selectedServer.value.gameId.toUpperCase(),
      currentMap: selectedServer.value.currentMap,
      playerCount: selectedServer.value.totalActivePlayersLast24h,
      maxPlayers: selectedServer.value.totalPlayersAllTime,
      isOnline: selectedServer.value.hasActivePlayers,
      ping: 0 // Not available in this API
    };
    
    emit('added', serverForDashboard);
  } catch (err) {
    error.value = 'Failed to add server to favorites. Please try again.';
    console.error('Add server error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleOverlayClick = () => {
  // Only close if the mousedown event also started on the overlay
  if (!mouseDownInsideModal.value) {
    emit('close');
  }
};

const handleModalMouseDown = () => {
  mouseDownInsideModal.value = true;
};

const handleOverlayMouseDown = () => {
  mouseDownInsideModal.value = false;
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
  .bg-gradient-to-r.from-slate-800\/90.to-slate-900\/90 {
    width: 95% !important;
    margin: 20px;
  }
  
  .p-6 {
    padding: 16px !important;
  }
  
  .flex.flex-wrap.gap-3 {
    flex-direction: column !important;
    gap: 4px !important;
  }
  
  .flex.gap-3.justify-end {
    flex-direction: column !important;
  }
  
  .px-5.py-2\.5 {
    width: 100% !important;
    justify-content: center !important;
  }
}
</style>