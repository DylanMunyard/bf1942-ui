<template>
  <div
    class="group relative bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 transition-all duration-300 hover:from-slate-800/50 hover:to-slate-900/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 cursor-pointer"
    @click="$emit('join', server)"
  >
    <div class="flex justify-between items-start gap-3">
      <div class="flex-1 min-w-0">
        <!-- Server Name -->
        <router-link
          :to="`/servers/${encodeURIComponent(server.serverName)}`"
          class="block text-slate-200 font-semibold text-sm hover:text-emerald-400 transition-colors duration-200 truncate group-hover:text-emerald-300"
          @click.stop
        >
          {{ server.serverName }}
        </router-link>
        
        <!-- Server Status -->
        <div class="mt-2 flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div
              v-if="server.currentMap"
              class="text-xs text-slate-400 truncate"
            >
              🗺️ {{ server.currentMap }}
            </div>
            <div
              v-else
              class="text-xs text-red-400 font-medium"
            >
              🔴 Server Offline
            </div>
          </div>
          
          <!-- Player Count Badge -->
          <div
            class="px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 flex-shrink-0"
            :class="getStatusBadgeClass()"
          >
            <template v-if="server.currentMap">
              <span class="text-xs">{{ server.activeSessions }}</span>
              <span class="text-xs opacity-75">/{{ server.maxPlayers }}</span>
            </template>
            <span
              v-else
              class="text-xs tracking-wide"
            >OFFLINE</span>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <a 
          v-if="server.joinLink" 
          :href="server.joinLink" 
          class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all duration-200 hover:scale-110" 
          title="Join Server" 
          @click.stop
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </a>
        <button
          class="group flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110"
          title="Remove from favorites"
          @click.stop="$emit('remove', server.id)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

interface FavoriteServer {
  id: number;
  serverGuid: string;
  serverName: string;
  createdAt: string;
  activeSessions: number;
  currentMap?: string;
  maxPlayers: number;
  joinLink?: string;
}

const props = defineProps<{
  server: FavoriteServer;
}>();

defineEmits<{
  join: [server: FavoriteServer];
  remove: [serverId: number];
}>();

const getStatusBadgeClass = () => {
  // If no current map, server is offline
  if (!props.server.currentMap) return 'bg-red-500/20 text-red-400';
  
  const maxPlayers = props.server.maxPlayers;
  const sessions = props.server.activeSessions;
  
  // Server is online, use emerald-based colors for online servers with players
  if (sessions === 0) return 'bg-emerald-500/10 text-emerald-400';
  if (sessions >= maxPlayers) return 'bg-emerald-500/40 text-emerald-100';
  if (sessions >= maxPlayers * 0.75) return 'bg-emerald-500/30 text-emerald-200';
  if (sessions >= maxPlayers * 0.5) return 'bg-emerald-500/20 text-emerald-300';
  return 'bg-emerald-500/15 text-emerald-400';
};
</script>

