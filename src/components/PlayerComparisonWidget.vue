<script setup lang="ts">
import { usePlayerComparison } from '@/composables/usePlayerComparison';

const {
  selectedPlayers,
  isVisible,
  canAddPlayer,
  canCompare,
  hasSelections,
  removePlayer,
  clearAll,
  compareSelected,
  hideWidget
} = usePlayerComparison();

const getPlayerSlotText = (index: number) => {
  const player = selectedPlayers.value[index];
  return player ? player.name : `Player ${index + 1}`;
};

const getPlayerSlotClass = (index: number) => {
  const player = selectedPlayers.value[index];
  return {
    'selected': !!player,
    'empty': !player
  };
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="comparison-widget">
      <div class="widget-header">
        <h3>Compare Players</h3>
        <button @click="hideWidget" class="close-btn" title="Hide widget">×</button>
      </div>
      
      <div class="widget-content">
        <div class="player-slots">
          <div 
            v-for="index in 2" 
            :key="index"
            class="player-slot"
            :class="getPlayerSlotClass(index - 1)"
          >
            <div class="slot-content">
              <span class="player-name">{{ getPlayerSlotText(index - 1) }}</span>
              <button 
                v-if="selectedPlayers[index - 1]" 
                @click="removePlayer(selectedPlayers[index - 1].name)"
                class="remove-player-btn"
                title="Remove player"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        
        <div class="widget-actions">
          <button 
            @click="compareSelected" 
            :disabled="!canCompare"
            class="compare-btn"
            :class="{ 'ready': canCompare }"
          >
            Compare
          </button>
          <button 
            @click="clearAll" 
            :disabled="!hasSelections"
            class="clear-btn"
          >
            Clear All
          </button>
        </div>
        
        <div class="widget-instructions">
          <p v-if="selectedPlayers.length === 0">
            Click on player names throughout the site to select them for comparison.
          </p>
          <p v-else-if="selectedPlayers.length === 1">
            Select one more player to compare.
          </p>
          <p v-else>
            Ready to compare! Click "Compare" to view the detailed comparison.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.comparison-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: var(--color-background-soft);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  font-family: inherit;
  backdrop-filter: blur(8px);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-background-mute);
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid var(--color-border);
}

.widget-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-heading);
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.widget-content {
  padding: 16px;
}

.player-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.player-slot {
  padding: 12px;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  transition: all 0.2s ease;
  min-height: 20px;
}

.player-slot.selected {
  border-style: solid;
  border-color: var(--color-primary);
  background: var(--color-background-soft);
}

.player-slot.empty {
  border-color: var(--color-border);
  background: var(--color-background-mute);
}

.slot-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.player-name {
  font-weight: 500;
  color: var(--color-text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-slot.empty .player-name {
  color: var(--color-text-muted);
  font-style: italic;
}

.remove-player-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.2rem;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.remove-player-btn:hover {
  background: #ff5252;
  color: white;
}

.widget-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.compare-btn, .clear-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.compare-btn {
  background: var(--color-background-mute);
  color: var(--color-text-muted);
}

.compare-btn.ready {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.compare-btn:disabled {
  cursor: not-allowed;
}

.compare-btn.ready:hover {
  background: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.clear-btn {
  background: var(--color-background);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.clear-btn:hover:not(:disabled) {
  background: #ff5252;
  color: white;
  border-color: #ff5252;
}

.clear-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.widget-instructions {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.4;
}

.widget-instructions p {
  margin: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .comparison-widget {
    width: calc(100vw - 40px);
    max-width: 320px;
    bottom: 10px;
    right: 10px;
    left: 10px;
    margin: 0 auto;
  }
}

/* Animation for when widget appears */
.comparison-widget {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>