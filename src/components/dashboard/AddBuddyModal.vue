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
    title="add_squad_member"
    size="lg"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <template #header>
      <h3 class="modal-title">
        Add Squad Member
      </h3>
      <p class="modal-desc">
        // Track friends and squad mates across the battlefield
      </p>
    </template>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="playerName" class="form-label">
          &gt; PLAYER_SEARCH
        </label>
        <PlayerSearch
          v-model="playerName"
          placeholder="Search for a player to add to your squad..."
          auto-focus
          @select="onPlayerSelected"
          @enter="handleSubmit"
        />
        <small class="form-hint">
          # Start typing to search for players to add to your squad and track their online status
        </small>
      </div>

      <div v-if="error" class="error-box">
        <span class="error-icon">[!]</span>
        <span>{{ error }}</span>
      </div>

      <div v-if="selectedPlayer" class="player-preview">
        <div class="preview-header">
          <span class="preview-icon">[@]</span>
          <span class="preview-name">{{ selectedPlayer.playerName }}</span>
          <span v-if="selectedPlayer.isActive" class="status-badge online">ONLINE</span>
          <span v-else class="status-badge offline">OFFLINE</span>
        </div>
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-value">{{ Math.floor(selectedPlayer.totalPlayTimeMinutes / 60) }}h</span>
            <span class="stat-label">PLAY_TIME</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatLastSeen(selectedPlayer.lastSeen) }}</span>
            <span class="stat-label">LAST_SEEN</span>
          </div>
        </div>
        <div
          v-if="selectedPlayer.currentServer && selectedPlayer.isActive"
          class="server-info"
        >
          &gt; Currently playing on {{ selectedPlayer.currentServer.serverName }}
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-action btn-cancel" @click="handleClose">
          [CANCEL]
        </button>
        <button
          type="submit"
          :disabled="!playerName.trim() || isSubmitting"
          class="btn-action btn-submit"
        >
          <span v-if="isSubmitting" class="spinner" />
          {{ isSubmitting ? 'ADDING...' : '[RECRUIT]' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ff00ff;
  margin: 0;
  text-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
}

.modal-desc {
  font-size: 0.75rem;
  color: #6e7681;
  margin: 0.375rem 0 0 0;
  font-style: italic;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ff00ff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.form-hint {
  display: block;
  font-size: 0.7rem;
  color: #6e7681;
  margin-top: 0.5rem;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 49, 49, 0.1);
  border: 1px solid rgba(255, 49, 49, 0.3);
  border-radius: 4px;
  color: #ff3131;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.error-icon {
  font-weight: 700;
}

/* Player Preview */
.player-preview {
  background: rgba(255, 0, 255, 0.05);
  border: 1px solid rgba(255, 0, 255, 0.2);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.preview-icon {
  color: #ff00ff;
  font-weight: 700;
}

.preview-name {
  font-size: 1rem;
  font-weight: 700;
  color: #ff00ff;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-badge.online {
  background: rgba(57, 255, 20, 0.2);
  color: #39ff14;
  border: 1px solid rgba(57, 255, 20, 0.4);
}

.status-badge.offline {
  background: rgba(139, 148, 158, 0.1);
  color: #8b949e;
  border: 1px solid rgba(139, 148, 158, 0.2);
}

.preview-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #e6edf3;
}

.stat-label {
  font-size: 0.6rem;
  color: #6e7681;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.server-info {
  font-size: 0.75rem;
  color: #ff00ff;
  font-style: italic;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 0, 255, 0.2);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid #30363d;
}

.btn-action {
  flex: 1;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  color: #8b949e;
}

.btn-cancel:hover {
  background: rgba(139, 148, 158, 0.1);
  border-color: #8b949e;
}

.btn-submit {
  color: #ff00ff;
  border-color: rgba(255, 0, 255, 0.4);
}

.btn-submit:hover:not(:disabled) {
  background: rgba(255, 0, 255, 0.15);
  border-color: #ff00ff;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 0, 255, 0.2);
  border-top-color: #ff00ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile */
@media (max-width: 480px) {
  .form-actions {
    flex-direction: column;
  }

  .preview-stats {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
