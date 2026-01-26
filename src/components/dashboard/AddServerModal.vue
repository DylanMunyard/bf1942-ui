<script setup lang="ts">
import { ref } from 'vue';
import ServerSearch from '../ServerSearch.vue';
import BaseModal from '../BaseModal.vue';
import { statsService } from '@/services/statsService';
import { formatRelativeTime } from '@/utils/timeUtils';

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

    const serverForDashboard = {
      id: selectedServer.value.serverGuid,
      name: selectedServer.value.serverName,
      gameMode: selectedServer.value.gameId.toUpperCase(),
      currentMap: selectedServer.value.currentMap,
      playerCount: selectedServer.value.totalActivePlayersLast24h,
      maxPlayers: selectedServer.value.totalPlayersAllTime,
      isOnline: selectedServer.value.hasActivePlayers,
      ping: 0
    };

    emit('added', serverForDashboard);
  } catch (err) {
    error.value = 'Failed to add server to favorites. Please try again.';
    console.error('Add server error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => emit('close');
</script>

<template>
  <BaseModal
    :model-value="true"
    title="add_favorite_server"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <template #header>
      <h3 class="modal-title">
        Add Favorite Server
      </h3>
      <p class="modal-desc">
        // Save servers to quickly monitor status and join battles
      </p>
    </template>

    <div class="form-group">
      <label for="serverSearch" class="form-label">
        &gt; SERVER_SEARCH
      </label>
      <ServerSearch
        v-model="serverName"
        placeholder="Search for server name..."
        auto-focus
        @select="onServerSelected"
        @enter="handleSubmit"
      />
      <small class="form-hint">
        # Start typing to search for a server name
      </small>
    </div>

    <div v-if="error" class="error-box">
      <span class="error-icon">[!]</span>
      <span>{{ error }}</span>
    </div>

    <div v-if="selectedServer" class="server-preview">
      <div class="preview-header">
        <span class="preview-icon">{::}</span>
        <span class="preview-name">{{ selectedServer.serverName }}</span>
      </div>
      <div class="preview-tags">
        <span class="tag tag-game">{{ selectedServer.gameId.toUpperCase() }}</span>
        <span v-if="selectedServer.hasActivePlayers" class="tag tag-online">ONLINE</span>
        <span v-else class="tag tag-offline">
          OFFLINE {{ formatRelativeTime(selectedServer.lastActivity) }}
        </span>
      </div>
      <div class="preview-details">
        <div class="detail-row">
          <span class="detail-label">&gt; MAP:</span>
          <span class="detail-value">{{ selectedServer.currentMap || 'N/A' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">&gt; PLAYERS_24H:</span>
          <span class="detail-value">{{ selectedServer.totalActivePlayersLast24h }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">&gt; LOCATION:</span>
          <span class="detail-value">{{ selectedServer.city }}, {{ selectedServer.country }}</span>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-action btn-cancel" @click="handleClose">
        [CANCEL]
      </button>
      <button
        type="button"
        :disabled="!selectedServer || isSubmitting"
        class="btn-action btn-submit"
        @click="handleAddServer"
      >
        <span v-if="isSubmitting" class="spinner" />
        {{ isSubmitting ? 'ADDING...' : '[ADD_SERVER]' }}
      </button>
    </div>
  </BaseModal>
</template>

<style scoped>
.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #39ff14;
  margin: 0;
  text-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
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
  color: #39ff14;
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

/* Server Preview */
.server-preview {
  background: rgba(57, 255, 20, 0.05);
  border: 1px solid rgba(57, 255, 20, 0.2);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.preview-icon {
  color: #39ff14;
  font-weight: 700;
}

.preview-name {
  font-size: 1rem;
  font-weight: 700;
  color: #e6edf3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.125rem 0.5rem;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tag-game {
  background: rgba(0, 255, 242, 0.2);
  color: #00fff2;
  border: 1px solid rgba(0, 255, 242, 0.4);
}

.tag-online {
  background: rgba(57, 255, 20, 0.2);
  color: #39ff14;
  border: 1px solid rgba(57, 255, 20, 0.4);
}

.tag-offline {
  background: rgba(139, 148, 158, 0.1);
  color: #8b949e;
  border: 1px solid rgba(139, 148, 158, 0.2);
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.detail-label {
  color: #6e7681;
  flex-shrink: 0;
}

.detail-value {
  color: #8b949e;
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
  color: #39ff14;
  border-color: rgba(57, 255, 20, 0.4);
}

.btn-submit:hover:not(:disabled) {
  background: rgba(57, 255, 20, 0.15);
  border-color: #39ff14;
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.2);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(57, 255, 20, 0.2);
  border-top-color: #39ff14;
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
}
</style>
