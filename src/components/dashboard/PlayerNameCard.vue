<template>
  <div
    class="relative bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 transition-all duration-300 hover:from-slate-800/50 hover:to-slate-900/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
    :class="{ 'border-l-4 border-l-green-500': playerName.player?.isOnline }"
  >
    <div class="flex justify-between items-center gap-3">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Avatar -->
        <div class="relative flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-slate-900 font-bold text-lg">
            {{ playerName.playerName[0].toUpperCase() }}
          </div>
          <div
            v-if="playerName.player?.isOnline"
            class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center"
          >
            <div class="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        
        <!-- Player Details -->
        <div class="flex-1 min-w-0">
          <router-link
            :to="`/players/${playerName.playerName}`"
            class="block text-slate-200 font-semibold text-sm hover:text-cyan-400 transition-colors duration-200 truncate"
          >
            {{ playerName.playerName }}
          </router-link>
          
          <!-- Status -->
          <div class="text-xs mt-1">
            <div
              v-if="playerName.player?.isOnline && playerName.player.currentServer"
              class="text-green-400 font-medium"
            >
              🎮 <router-link
                :to="`/servers/${encodeURIComponent(playerName.player.currentServer)}`"
                class="text-green-400 hover:text-cyan-400 transition-colors duration-200 font-medium"
              >
                {{ truncateServerName(playerName.player.currentServer) }}
              </router-link>
              <span
                v-if="playerName.player.currentMap"
                class="text-slate-400 block sm:inline"
              > • {{ playerName.player.currentMap }}</span>
            </div>
            <div
              v-else-if="playerName.player?.isOnline"
              class="text-green-400 font-medium"
            >
              🟢 Online
            </div>
            <div
              v-else
              class="text-slate-400"
            >
              {{ formatLastSeen(playerName.player.lastSeenIso) }}
            </div>
            
            <!-- Session Stats -->
            <div
              v-if="playerName.player?.isOnline && hasSessionStats"
              class="flex gap-2 mt-1 flex-wrap"
            >
              <span
                v-if="playerName.player.currentSessionScore !== undefined"
                class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md text-xs font-medium"
              >
                {{ formatScore(playerName.player.currentSessionScore) }}
              </span>
              <span
                v-if="playerName.player.currentSessionKills !== undefined && playerName.player.currentSessionDeaths !== undefined"
                class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-xs font-medium"
              >
                <span class="text-green-400">{{ playerName.player.currentSessionKills }}</span>/<span class="text-red-400">{{ playerName.player.currentSessionDeaths }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Remove Button -->
      <button
        class="group flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all duration-200 hover:scale-110 flex-shrink-0"
        title="Remove player"
        @click="$emit('remove', playerName.id)"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
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

interface PlayerName {
  id: number;
  playerName: string;
  createdAt: string;
  player: Player;
}

const props = defineProps<{
  playerName: PlayerName;
}>();

defineEmits<{
  viewDetails: [playerName: string];
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
  return props.playerName.player?.currentSessionScore !== undefined ||
         props.playerName.player?.currentSessionKills !== undefined ||
         props.playerName.player?.currentSessionDeaths !== undefined;
});
</script>

