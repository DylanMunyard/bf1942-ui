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
          <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 m-0">
            Add Player Profile
          </h3>
          <p class="text-slate-400 text-sm font-normal m-0">
            Link your in-game player name(s) to track stats and achievements
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
        <form @submit.prevent="handleSubmit">
          <div class="mb-5">
            <label for="playerName" class="block text-white font-semibold mb-2">Player Name</label>
            <PlayerSearch
              v-model="playerName"
              placeholder="Search for your player name..."
              auto-focus
              @select="onPlayerSelected"
              @enter="handleSubmit"
            />
            <small class="block text-slate-400 text-sm mt-1.5">
              Start typing to search for your exact in-game player name
            </small>
          </div>

          <div
            v-if="error"
            class="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20"
          >
            {{ error }}
          </div>

          <div
            v-if="selectedPlayer"
            class="mb-5"
          >
            <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 class="text-green-400 m-0 mb-3 text-base font-semibold">{{ selectedPlayer.playerName }}</h4>
              <div class="grid grid-cols-3 gap-3">
                <div class="text-center">
                  <span class="block text-white font-bold text-lg">{{ Math.floor(selectedPlayer.totalPlayTimeMinutes / 60) }}h</span>
                  <span class="block text-slate-400 text-xs mt-0.5 uppercase tracking-wider">Play Time</span>
                </div>
                <div class="text-center">
                  <span class="block text-white font-bold text-lg">{{ formatLastSeen(selectedPlayer.lastSeen) }}</span>
                  <span class="block text-slate-400 text-xs mt-0.5 uppercase tracking-wider">Last Seen</span>
                </div>
                <div class="text-center">
                  <span
                    class="block font-bold text-lg"
                    :class="selectedPlayer.isActive ? 'text-green-400' : 'text-gray-500'"
                  >
                    {{ selectedPlayer.isActive ? '🟢 Online' : '⚫ Offline' }}
                  </span>
                  <span class="block text-slate-400 text-xs mt-0.5 uppercase tracking-wider">Status</span>
                </div>
              </div>
              <div
                v-if="selectedPlayer.currentServer && selectedPlayer.isActive"
                class="mt-3 p-3 bg-cyan-500/10 rounded-md text-cyan-400 text-sm italic"
              >
                Currently playing on {{ selectedPlayer.currentServer.serverName }}
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
              type="submit"
              :disabled="!playerName.trim() || isSubmitting"
              class="px-5 py-2.5 rounded-lg border-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white cursor-pointer font-semibold text-sm transition-all duration-200 flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-70 disabled:cursor-not-allowed hover:disabled:shadow-none"
            >
              <span
                v-if="isSubmitting"
                class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
              {{ isSubmitting ? 'Adding...' : 'Add Player' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PlayerSearch from '../PlayerSearch.vue';
import { statsService } from '@/services/statsService';
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

const emit = defineEmits<{
  close: [];
  added: [playerName: string];
}>();

const playerName = ref('');
const error = ref('');
const isSubmitting = ref(false);
const selectedPlayer = ref<PlayerSearchResult | null>(null);
const mouseDownInsideModal = ref(false);

const onPlayerSelected = (player: PlayerSearchResult) => {
  selectedPlayer.value = player;
  error.value = '';
  playerName.value = player.playerName;
};

const handleSubmit = async () => {
  if (!playerName.value.trim()) {
    error.value = 'Please select a player from the search results.';
    return;
  }
  
  isSubmitting.value = true;
  try {
    await statsService.addPlayerName(playerName.value.trim());
    
    emit('added', playerName.value.trim());
  } catch (err) {
    error.value = 'Failed to add player profile. Please try again.';
    console.error('Add player error:', err);
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

// Note: formatLastSeen is now imported from @/utils/timeUtils
</script>

<style scoped>
/* Mobile responsiveness */
@media (max-width: 480px) {
  .bg-gradient-to-r.from-slate-800\/90.to-slate-900\/90 {
    width: 95% !important;
    margin: 20px;
    max-height: 95vh !important;
    overflow: hidden;
  }
  
  .p-6 {
    padding: 16px !important;
  }
  
  .overflow-visible {
    overflow-y: auto !important;
  }
  
  .grid-cols-3 {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
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