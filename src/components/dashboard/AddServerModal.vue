<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Add Favorite Server</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="search-section">
          <div class="form-group">
            <label for="serverSearch">Search Servers</label>
            <input
              id="serverSearch"
              v-model="searchQuery"
              type="text"
              placeholder="Enter server name to search..."
              @input="handleSearch"
            />
          </div>

          <div v-if="isSearching" class="loading-message">
            <span class="spinner"></span>
            Searching servers...
          </div>

          <div v-if="searchResults.length > 0" class="search-results">
            <h4>Available Servers</h4>
            <div class="server-list">
              <div
                v-for="server in searchResults"
                :key="server.id"
                class="server-item"
                :class="{ 'selected': selectedServer?.id === server.id }"
                @click="selectServer(server)"
              >
                <div class="server-info">
                  <h5 class="server-name">{{ server.name }}</h5>
                  <div class="server-details">
                    <span class="game-mode">{{ server.gameMode }}</span>
                    <span class="map">{{ server.currentMap }}</span>
                    <span class="players" :class="{ 'full': server.playerCount >= server.maxPlayers }">
                      {{ server.playerCount }}/{{ server.maxPlayers }}
                    </span>
                  </div>
                </div>
                <div class="server-status">
                  <span class="status-indicator" :class="{ 'online': server.isOnline }"></span>
                  <span class="ping" :class="getPingClass(server.ping)">{{ server.ping }}ms</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="searchQuery && !isSearching" class="no-results">
            <span class="icon">🔍</span>
            <p>No servers found matching "{{ searchQuery }}"</p>
            <small>Try searching for a different server name</small>
          </div>
        </div>

        <div v-if="selectedServer" class="selected-server">
          <h4>Selected Server</h4>
          <div class="server-preview">
            <div class="preview-header">
              <h5>{{ selectedServer.name }}</h5>
              <div class="status-badge" :class="{ 'online': selectedServer.isOnline }">
                {{ selectedServer.isOnline ? 'Online' : 'Offline' }}
              </div>
            </div>
            <div class="preview-details">
              <div class="detail-item">
                <span class="label">Game Mode:</span>
                <span class="value">{{ selectedServer.gameMode }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Current Map:</span>
                <span class="value">{{ selectedServer.currentMap }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Players:</span>
                <span class="value">{{ selectedServer.playerCount }}/{{ selectedServer.maxPlayers }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Ping:</span>
                <span class="value">{{ selectedServer.ping }}ms</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
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
import { ref, watch } from 'vue';

interface ServerSearchResult {
  id: string;
  name: string;
  gameMode: string;
  currentMap: string;
  playerCount: number;
  maxPlayers: number;
  isOnline: boolean;
  ping: number;
}

const emit = defineEmits<{
  close: [];
  added: [server: ServerSearchResult];
}>();

const searchQuery = ref('');
const searchResults = ref<ServerSearchResult[]>([]);
const selectedServer = ref<ServerSearchResult | null>(null);
const isSearching = ref(false);
const isSubmitting = ref(false);
const error = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  selectedServer.value = null;
  error.value = '';
});

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (searchQuery.value.trim().length >= 2) {
    searchTimeout = setTimeout(() => {
      performSearch(searchQuery.value.trim());
    }, 300);
  } else {
    searchResults.value = [];
  }
};

const performSearch = async (query: string) => {
  isSearching.value = true;
  try {
    // TODO: Call actual API to search servers
    // Mock search for now
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock results - replace with actual API call
    const mockServers: ServerSearchResult[] = [
      {
        id: '1',
        name: `${query} Gaming Server #1`,
        gameMode: 'BF1942',
        currentMap: 'Stalingrad',
        playerCount: 32,
        maxPlayers: 64,
        isOnline: true,
        ping: 45
      },
      {
        id: '2',
        name: `${query} FH2 Hardcore`,
        gameMode: 'FH2',
        currentMap: 'El Alamein',
        playerCount: 28,
        maxPlayers: 32,
        isOnline: true,
        ping: 78
      },
      {
        id: '3',
        name: `${query} Vietnam Server`,
        gameMode: 'BFV',
        currentMap: 'Operation Flaming Dart',
        playerCount: 16,
        maxPlayers: 32,
        isOnline: false,
        ping: 120
      }
    ];
    
    searchResults.value = mockServers;
  } catch (err) {
    error.value = 'Failed to search servers. Please try again.';
    console.error('Server search error:', err);
  } finally {
    isSearching.value = false;
  }
};

const selectServer = (server: ServerSearchResult) => {
  selectedServer.value = server;
  error.value = '';
};

const handleAddServer = async () => {
  if (!selectedServer.value) return;
  
  isSubmitting.value = true;
  try {
    // TODO: Call API to add server to user's favorites
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    emit('added', selectedServer.value);
  } catch (err) {
    error.value = 'Failed to add server to favorites. Please try again.';
    console.error('Add server error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleOverlayClick = () => {
  emit('close');
};

const getPingClass = (ping: number): string => {
  if (ping <= 50) return 'excellent';
  if (ping <= 100) return 'good';
  if (ping <= 150) return 'fair';
  return 'poor';
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
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
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
  overflow-y: auto;
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

.loading-message {
  color: var(--color-accent);
  font-size: 0.875rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-results {
  margin-bottom: 20px;
}

.search-results h4 {
  color: var(--color-text);
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
}

.server-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.server-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.server-item:last-child {
  border-bottom: none;
}

.server-item:hover {
  background-color: rgba(var(--color-accent-rgb), 0.05);
}

.server-item.selected {
  background-color: rgba(var(--color-accent-rgb), 0.1);
  border-color: var(--color-accent);
}

.server-info {
  flex: 1;
}

.server-name {
  color: var(--color-text);
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.server-details {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
}

.game-mode {
  color: var(--color-accent);
  font-weight: 600;
}

.map {
  color: var(--color-text-secondary);
}

.players {
  color: var(--color-text-secondary);
}

.players.full {
  color: #f59e0b;
  font-weight: 600;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
}

.status-indicator.online {
  background-color: #22c55e;
}

.ping.excellent { color: #22c55e; }
.ping.good { color: #84cc16; }
.ping.fair { color: #fbbf24; }
.ping.poor { color: #ef4444; }

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);
}

.no-results .icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 12px;
  opacity: 0.7;
}

.no-results p {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: var(--color-text);
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

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-header h5 {
  color: var(--color-text);
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-badge.online {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.preview-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.detail-item .label {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.detail-item .value {
  color: var(--color-text);
  font-weight: 600;
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