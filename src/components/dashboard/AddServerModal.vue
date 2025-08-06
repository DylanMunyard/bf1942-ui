<template>
  <div class="modal-overlay" @click="handleOverlayClick" @mousedown="handleOverlayMouseDown">
    <div class="modal-content" @click.stop @mousedown="handleModalMouseDown">
      <div class="modal-header">
        <h3>Add Favorite Server</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="serverSearch">Search Servers</label>
          <ServerSearch
            v-model="serverName"
            placeholder="Search for server name..."
            @select="onServerSelected"
            @enter="handleSubmit"
          />
          <small class="help-text">
            Start typing to search for a server name
          </small>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="selectedServer" class="selected-server">
          <h4>Selected Server</h4>
          <div class="server-preview">
            <div class="preview-content">
              <h5 class="server-title">{{ selectedServer.serverName }}</h5>
              <div class="server-meta">
                <span class="game-badge">{{ selectedServer.gameId.toUpperCase() }}</span>
                <span class="map-info">{{ selectedServer.currentMap }}</span>
                <span v-if="!selectedServer.hasActivePlayers" class="offline-status">
                  Offline {{ formatLastActivity(selectedServer.lastActivity) }}
                </span>
                <span v-else class="online-status">Online</span>
              </div>
              <div class="server-details">
                <span class="players">{{ selectedServer.totalActivePlayersLast24h }} active players (24h)</span>
                <span class="location">{{ selectedServer.city }}, {{ selectedServer.country }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="cancel-btn">
            Cancel
          </button>
          <button 
            type="button" 
            @click="handleAddServer" 
            :disabled="!selectedServer || isSubmitting" 
            class="submit-btn"
          >
            <span v-if="isSubmitting" class="spinner"></span>
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--color-card-bg);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: visible;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background-color: rgba(var(--color-accent-rgb), 0.05);
}

.modal-header h3 {
  color: var(--color-text);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.modal-body {
  padding: 24px;
  overflow: visible;
  max-height: calc(90vh - 140px);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: var(--color-text);
  font-weight: 600;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
}

.help-text {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-top: 6px;
  display: block;
}



.selected-server {
  margin-bottom: 20px;
}

.selected-server h4 {
  color: var(--color-text);
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
}

.server-preview {
  background-color: rgba(var(--color-accent-rgb), 0.05);
  border: 1px solid rgba(var(--color-accent-rgb), 0.2);
  border-radius: 8px;
  padding: 16px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.server-title {
  color: var(--color-text);
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.server-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.server-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.game-badge {
  background-color: var(--color-accent);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.map-info {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.online-status {
  color: #22c55e;
  font-size: 0.875rem;
  font-weight: 600;
}

.offline-status {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 16px;
  padding: 8px 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn {
  background-color: var(--color-card-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.cancel-btn:hover {
  background-color: var(--color-card-bg-hover);
  color: var(--color-text);
}

.submit-btn {
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-body {
    padding: 16px;
  }
  
  .server-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .preview-details {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .submit-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>