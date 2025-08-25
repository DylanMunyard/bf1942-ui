<template>
  <div
    class="relative bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 transition-all duration-300 hover:from-slate-800/50 hover:to-slate-900/50 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
    :class="{ 'border-l-4 border-l-green-500': buddy.player.isOnline }"
  >
    <div class="flex justify-between items-center gap-3">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Avatar -->
        <div class="relative flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-slate-900 font-bold text-lg">
            {{ buddy.buddyPlayerName[0].toUpperCase() }}
          </div>
          <div
            v-if="buddy.player.isOnline"
            class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center"
          >
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <!-- Player Details -->
        <div class="flex-1 min-w-0">
          <router-link
            :to="`/players/${buddy.buddyPlayerName}`"
            class="block text-slate-200 font-semibold text-sm hover:text-purple-400 transition-colors duration-200 truncate"
          >
            {{ buddy.buddyPlayerName }}
          </router-link>
          
          <!-- Status -->
          <div class="text-xs mt-1">
            <div
              v-if="buddy.player.isOnline && buddy.player.currentServer"
              class="text-green-400 font-medium"
            >
              🎮 <router-link
                :to="`/servers/${encodeURIComponent(buddy.player.currentServer)}`"
                class="text-green-400 hover:text-purple-400 transition-colors duration-200 font-medium"
              >{{ truncateServerName(buddy.player.currentServer) }}</router-link>
              <span
                v-if="buddy.player.currentMap"
                class="text-slate-400 block sm:inline"
              > • {{ buddy.player.currentMap }}</span>
            </div>
            <div
              v-else-if="buddy.player.isOnline"
              class="text-green-400 font-medium"
            >
              🟢 Online
            </div>
            <div
              v-else
              class="text-slate-400"
            >
              {{ formatLastSeen(buddy.player.lastSeenIso) }}
            </div>
            
            <!-- Session Stats -->
            <div
              v-if="buddy.player.isOnline && hasSessionStats"
              class="flex gap-2 mt-1 flex-wrap"
            >
              <span
                v-if="buddy.player.currentSessionScore !== undefined"
                class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md text-xs font-medium"
              >
                {{ formatScore(buddy.player.currentSessionScore) }}
              </span>
              <span
                v-if="buddy.player.currentSessionKills !== undefined && buddy.player.currentSessionDeaths !== undefined"
                class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-xs font-medium"
              >
                <span class="text-green-400">{{ buddy.player.currentSessionKills }}</span>/<span class="text-red-400">{{ buddy.player.currentSessionDeaths }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Remove Button -->
      <button
        class="group flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200 hover:scale-110 flex-shrink-0"
        title="Remove from squad"
        @click="$emit('remove', buddy.id)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatLastSeen } from '@/utils/timeUtils';

interface Player {
  name: string;
  firstSeen: string;
  lastSeen: string;
  totalPlayTimeMinutes: number;
  aiBot: boolean;
  isOnline: boolean;
  lastSeenIso: string;
  currentServer: string;
  currentMap?: string;
  currentSessionScore?: number;
  currentSessionKills?: number;
  currentSessionDeaths?: number;
}

interface Buddy {
  id: number;
  buddyPlayerName: string;
  createdAt: string;
  player: Player;
}

const props = defineProps<{
  buddy: Buddy;
}>();

const emit = defineEmits<{
  viewProfile: [playerName: string];
  remove: [id: number];
}>();


const formatScore = (score: number): string => {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toLocaleString();
};

const truncateServerName = (serverName: string): string => {
  if (serverName.length > 25) {
    return `${serverName.substring(0, 25)}...`;
  }
  return serverName;
};

const hasSessionStats = computed(() => {
  return props.buddy.player?.currentSessionScore !== undefined ||
         props.buddy.player?.currentSessionKills !== undefined ||
         props.buddy.player?.currentSessionDeaths !== undefined;
});
</script>

