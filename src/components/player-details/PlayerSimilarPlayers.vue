<template>
  <div class="similar-players-section">
    <button 
      @click="toggleSimilarPlayersSection"
      class="section-toggle-btn"
      :class="{ 'expanded': sectionExpanded }"
    >
      <span class="toggle-text">Similar Players</span>
      <span class="toggle-icon">{{ sectionExpanded ? '▼' : '▶' }}</span>
    </button>
    
    <div v-if="sectionExpanded" class="similar-players-content">
      <div v-if="loadingPlayers" class="loading-state">
        Loading similar players...
      </div>
      
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>
      
      <div v-else-if="players.length > 0" class="similar-players-list">
        <div v-for="player in players" :key="player.playerName" class="similar-player-item">
          <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
            <div class="player-info">
              <span class="player-name">{{ player.playerName }}</span>
              <span class="similarity-score">{{ (player.similarityScore * 100).toFixed(1) }}% match</span>
            </div>
          </router-link>
        </div>
      </div>
      
      <div v-else class="no-players-message">
        No similar players found.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { fetchSimilarPlayers, SimilarPlayer } from '../../services/playerStatsService';

interface Props {
  playerName: string;
}

const props = defineProps<Props>();

const players = ref<SimilarPlayer[]>([]);
const loadingPlayers = ref(false);
const error = ref<string | null>(null);
const sectionExpanded = ref(false);

const loadSimilarPlayers = async () => {
  loadingPlayers.value = true;
  error.value = null;
  try {
    players.value = await fetchSimilarPlayers(props.playerName);
  } catch (err: any) {
    console.error('Error loading similar players:', err);
    error.value = err.message || 'Failed to load similar players.';
  } finally {
    loadingPlayers.value = false;
  }
};

const toggleSimilarPlayersSection = async () => {
  sectionExpanded.value = !sectionExpanded.value;
  if (sectionExpanded.value && players.value.length === 0 && !loadingPlayers.value) {
    await loadSimilarPlayers();
  }
};
</script>

<style scoped>
.similar-players-section {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-soft);
}

.section-toggle-btn {
  width: 100%;
  padding: 1rem;
  background: var(--color-background-mute);
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.section-toggle-btn:hover {
  background: var(--color-background-soft);
}

.toggle-text {
  font-weight: 600;
  color: var(--color-text);
}

.toggle-icon {
  color: var(--color-text-muted);
}

.similar-players-content {
  padding: 1rem;
}

.similar-player-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.similar-player-item:last-child {
  border-bottom: none;
}

.player-link {
  text-decoration: none;
  color: inherit;
  display: block;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.player-link:hover {
  background: var(--color-background-mute);
}

.player-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-name {
  font-weight: 500;
  color: var(--color-text);
}

.similarity-score {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.loading-state, .error-state, .no-players-message {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.error-state {
  color: var(--color-error);
}
</style> 