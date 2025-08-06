<template>
  <div class="modal-overlay" @click="handleOverlayClick" @mousedown="handleOverlayMouseDown">
    <div class="modal-content" @click.stop @mousedown="handleModalMouseDown">
      <div class="modal-header">
        <h3>Add Squad Member</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="search-section">
          <div class="form-group">
            <label for="playerSearch">Search Players</label>
            <input
              id="playerSearch"
              v-model="searchQuery"
              type="text"
              placeholder="Enter player name to search..."
              @input="handleSearch"
            />
            <small class="help-text">
              Search for players to add to your squad and track their online status
            </small>
          </div>

          <div v-if="isSearching" class="loading-message">
            <span class="spinner"></span>
            Searching players...
          </div>

          <div v-if="searchResults.length > 0" class="search-results">
            <h4>Found Players</h4>
            <div class="player-list">
              <div
                v-for="player in searchResults"
                :key="player.playerName"
                class="player-item"
                :class="{ 'selected': selectedPlayer?.playerName === player.playerName }"
                @click="selectPlayer(player)"
              >
                <div class="player-avatar">
                  <span class="avatar-letter">{{ player.playerName[0].toUpperCase() }}</span>
                  <div v-if="player.isOnline" class="online-indicator"></div>
                </div>
                <div class="player-info">
                  <h5 class="player-name">{{ player.playerName }}</h5>
                  <div class="player-details">
                    <span class="status" :class="{ 'online': player.isOnline }">
                      {{ player.isOnline ? (player.currentServer ? `Playing on ${player.currentServer}` : 'Online') : formatLastSeen(player.lastSeen) }}
                    </span>
                    <div class="stats">
                      <span class="score">Score: {{ formatScore(player.score) }}</span>
                      <span class="rank">Rank: #{{ player.rank }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="searchQuery && !isSearching" class="no-results">
            <span class="icon">👤</span>
            <p>No players found matching "{{ searchQuery }}"</p>
            <small>Try searching for a different player name</small>
          </div>
        </div>

        <div v-if="selectedPlayer" class="selected-player">
          <h4>Selected Player</h4>
          <div class="player-preview">
            <div class="preview-header">
              <div class="player-avatar-large">
                <span class="avatar-letter">{{ selectedPlayer.playerName[0].toUpperCase() }}</span>
                <div v-if="selectedPlayer.isOnline" class="online-indicator"></div>
              </div>
              <div class="player-info-detailed">
                <h5>{{ selectedPlayer.playerName }}</h5>
                <div class="status-info">
                  <span v-if="selectedPlayer.isOnline && selectedPlayer.currentServer" class="status online">
                    🎮 Playing on {{ selectedPlayer.currentServer }}
                  </span>
                  <span v-else-if="selectedPlayer.isOnline" class="status online">
                    🟢 Online
                  </span>
                  <span v-else class="status offline">
                    Last seen {{ formatLastSeen(selectedPlayer.lastSeen) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="preview-stats">
              <div class="stat-item">
                <span class="stat-value">{{ formatScore(selectedPlayer.score) }}</span>
                <span class="stat-label">Total Score</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">#{{ selectedPlayer.rank }}</span>
                <span class="stat-label">Global Rank</span>
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
            @click="handleAddBuddy" 
            :disabled="!selectedPlayer || isSubmitting" 
            class="submit-btn"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Adding...' : 'Add to Squad' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface PlayerSearchResult {
  playerName: string;
  isOnline: boolean;
  lastSeen: string;
  currentServer?: string;
  score: number;
  rank: number;
}

const emit = defineEmits<{
  close: [];
  added: [buddy: PlayerSearchResult];
}>();

const searchQuery = ref('');
const searchResults = ref<PlayerSearchResult[]>([]);
const selectedPlayer = ref<PlayerSearchResult | null>(null);
const isSearching = ref(false);
const isSubmitting = ref(false);
const error = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  selectedPlayer.value = null;
  error.value = '';
});

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (searchQuery.value.trim().length >= 3) {
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
    // TODO: Call actual API to search players
    // Mock search for now
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock results - replace with actual API call
    const mockPlayers: PlayerSearchResult[] = [
      {
        playerName: `${query}_Player1`,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        currentServer: 'Gaming Server #1',
        score: 125000,
        rank: 42
      },
      {
        playerName: `${query}_Veteran`,
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        score: 89000,
        rank: 156
      },
      {
        playerName: `${query}_Pro`,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        score: 203000,
        rank: 18
      }
    ];
    
    searchResults.value = mockPlayers.filter(() => Math.random() > 0.2); // 80% chance to show each player
  } catch (err) {
    error.value = 'Failed to search players. Please try again.';
    console.error('Player search error:', err);
  } finally {
    isSearching.value = false;
  }
};

const selectPlayer = (player: PlayerSearchResult) => {
  selectedPlayer.value = player;
  error.value = '';
};

const handleAddBuddy = async () => {
  if (!selectedPlayer.value) return;
  
  isSubmitting.value = true;
  try {
    // TODO: Call API to add player to user's buddy list
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    emit('added', selectedPlayer.value);
  } catch (err) {
    error.value = 'Failed to add player to squad. Please try again.';
    console.error('Add buddy error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const mouseDownInsideModal = ref(false);

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

const formatScore = (score: number): string => {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toLocaleString();
};

const formatLastSeen = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  }
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
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

.help-text {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-top: 6px;
  display: block;
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

.player-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-item:last-child {
  border-bottom: none;
}

.player-item:hover {
  background-color: rgba(var(--color-accent-rgb), 0.05);
}

.player-item.selected {
  background-color: rgba(var(--color-accent-rgb), 0.1);
  border-color: var(--color-accent);
}

.player-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 1rem;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background-color: #22c55e;
  border: 2px solid var(--color-card-bg);
  border-radius: 50%;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  color: var(--color-text);
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.status.online {
  color: #22c55e;
  font-weight: 500;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

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

.selected-player {
  margin-bottom: 20px;
}

.selected-player h4 {
  color: var(--color-text);
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
}

.player-preview {
  background-color: rgba(var(--color-accent-rgb), 0.05);
  border: 1px solid rgba(var(--color-accent-rgb), 0.2);
  border-radius: 8px;
  padding: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.player-avatar-large {
  position: relative;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.player-avatar-large .avatar-letter {
  font-size: 1.25rem;
}

.player-avatar-large .online-indicator {
  width: 12px;
  height: 12px;
}

.player-info-detailed {
  flex: 1;
}

.player-info-detailed h5 {
  color: var(--color-text);
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.status-info {
  font-size: 0.875rem;
}

.status-info .status.online {
  color: #22c55e;
  font-weight: 500;
}

.status-info .status.offline {
  color: var(--color-text-secondary);
}

.preview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background-color: var(--color-card-bg);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.stat-value {
  display: block;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 1.125rem;
}

.stat-label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  
  .player-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .stats {
    flex-direction: column;
    gap: 4px;
  }
  
  .preview-stats {
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