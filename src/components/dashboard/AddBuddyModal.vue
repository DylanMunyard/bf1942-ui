<script setup lang="ts">
import { ref } from 'vue';
import PlayerSearch from '../PlayerSearch.vue';
import BaseModal from '../BaseModal.vue';
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
  added: [buddy: PlayerSearchResult];
}>();

const playerName = ref('');
const error = ref('');
const isSubmitting = ref(false);
const selectedPlayer = ref<PlayerSearchResult | null>(null);

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
    await statsService.addBuddy(playerName.value.trim());
    emit('added', selectedPlayer.value!);
  } catch (err) {
    error.value = 'Failed to add player to squad. Please try again.';
    console.error('Add buddy error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => emit('close');
</script>

<template>
  <BaseModal
    :model-value="true"
    size="lg"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <template #header>
      <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 m-0">
        Add Squad Member
      </h3>
      <p class="text-slate-400 text-sm font-normal m-0 mt-1">
        Track friends and squad mates across the battlefield
      </p>
    </template>

    <form @submit.prevent="handleSubmit">
      <div class="mb-5">
        <label
          for="playerName"
          class="block text-white font-semibold mb-2"
        >Player Name</label>
        <PlayerSearch
          v-model="playerName"
          placeholder="Search for a player to add to your squad..."
          auto-focus
          @select="onPlayerSelected"
          @enter="handleSubmit"
        />
        <small class="block text-slate-400 text-sm mt-1.5">
          Start typing to search for players to add to your squad and track their online status
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
          <h4 class="text-green-400 m-0 mb-3 text-base font-semibold">
            {{ selectedPlayer.playerName }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                {{ selectedPlayer.isActive ? 'Online' : 'Offline' }}
              </span>
              <span class="block text-slate-400 text-xs mt-0.5 uppercase tracking-wider">Status</span>
            </div>
          </div>
          <div
            v-if="selectedPlayer.currentServer && selectedPlayer.isActive"
            class="mt-3 p-3 bg-purple-500/10 rounded-md text-purple-400 text-sm italic"
          >
            Currently playing on {{ selectedPlayer.currentServer.serverName }}
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 justify-end mt-6 pt-5 border-t border-slate-700/50">
        <button
          type="button"
          class="px-5 py-2.5 rounded-lg border border-slate-700/50 bg-transparent text-slate-400 cursor-pointer font-semibold text-sm transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!playerName.trim() || isSubmitting"
          class="px-5 py-2.5 rounded-lg border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white cursor-pointer font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-70 disabled:cursor-not-allowed hover:disabled:shadow-none"
        >
          <span
            v-if="isSubmitting"
            class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
          {{ isSubmitting ? 'Adding...' : 'Add to Squad' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
