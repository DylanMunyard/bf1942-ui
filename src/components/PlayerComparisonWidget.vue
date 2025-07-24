<script setup lang="ts">
import { usePlayerComparison } from '@/composables/usePlayerComparison';
import { ref, onMounted, onUnmounted } from 'vue';

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

// Mobile state management
const isExpanded = ref(false);
const widgetRef = ref<HTMLElement | null>(null);

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

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const collapseWidget = () => {
  isExpanded.value = false;
};

const handleCompare = () => {
  compareSelected();
  // Don't auto-collapse after comparing so users can easily remove players
  // isExpanded.value = false;
};

const handleClear = () => {
  clearAll();
  isExpanded.value = false; // Collapse after clearing
};

const handleHide = () => {
  hideWidget();
  isExpanded.value = false; // Reset expansion state
};

const handleRemovePlayer = (playerName: string) => {
  removePlayer(playerName);
  // Auto-collapse if no players left
  if (selectedPlayers.value.length === 0) {
    isExpanded.value = false;
  }
};

// Click outside to collapse
const handleClickOutside = (event: MouseEvent) => {
  if (widgetRef.value && !widgetRef.value.contains(event.target as Node) && isExpanded.value) {
    collapseWidget();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isVisible" 
      ref="widgetRef"
      class="comparison-widget" 
      :class="{ 'expanded': isExpanded }"
    >
      <!-- Mobile Compact View -->
      <div class="mobile-compact" @click="toggleExpanded">
        <div class="compact-content">
          <!-- Show player count when no players or show individual players with remove buttons -->
          <div v-if="selectedPlayers.length === 0" class="player-count-indicator">
            <span class="count">0</span>
            <span class="label">players</span>
          </div>
          <div v-else class="compact-players-list">
            <div 
              v-for="player in selectedPlayers" 
              :key="player.name"
              class="compact-player-item"
              @click.stop
            >
              <span class="compact-player-name">{{ player.name }}</span>
              <button 
                @click="handleRemovePlayer(player.name)"
                class="compact-remove-btn"
                title="Remove player"
              >
                ×
              </button>
            </div>
          </div>
          <div class="compact-actions">
            <button 
              v-if="canCompare" 
              @click.stop="handleCompare"
              class="compact-compare-btn"
              title="Quick compare"
            >
              <img src="@/assets/player_comparison.jpg" alt="Compare" class="compare-icon" />
            </button>
            <button class="expand-btn" :title="isExpanded ? 'Collapse' : 'Expand'">
              {{ isExpanded ? '▼' : '▲' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop/Expanded Mobile View -->
      <div class="full-widget">
        <div class="widget-header">
          <h3>Compare Players</h3>
          <div class="header-actions">
            <!-- Mobile collapse button -->
            <button 
              @click="collapseWidget" 
              class="collapse-btn mobile-only" 
              title="Collapse"
            >
              ▼
            </button>
            <button @click="handleHide" class="close-btn" title="Hide widget">×</button>
          </div>
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
                  @click="handleRemovePlayer(selectedPlayers[index - 1].name)"
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
              @click="handleCompare" 
              :disabled="!canCompare"
              class="compare-btn"
              :class="{ 'ready': canCompare }"
            >
              Compare
            </button>
            <button 
              @click="handleClear" 
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
              Ready to compare! Click "Compare" to start, or select another player for head-to-head.
            </p>
            <p v-else>
              Ready to compare! Click "Compare" to view the detailed comparison.
            </p>
          </div>
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
  z-index: 1000;
  font-family: inherit;
}

/* Desktop styles - show full widget by default */
.full-widget {
  width: 320px;
  background: var(--color-background-soft);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

.mobile-compact {
  display: none;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn, .close-btn {
  background: none;
  border: none;
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

.collapse-btn {
  font-size: 1rem;
}

.close-btn {
  font-size: 1.5rem;
}

.collapse-btn:hover, .close-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

/* Hide mobile-only elements on desktop */
.mobile-only {
  display: none;
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
  flex-shrink: 0;
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
    bottom: 80px; /* Position above bottom navigation/browser UI */
    right: 16px;
  }

  /* Hide full widget by default on mobile */
  .full-widget {
    display: none;
  }

  /* Show compact version on mobile */
  .mobile-compact {
    display: block;
    background: var(--color-primary);
    border-radius: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 80px;
  }

  .mobile-compact:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  .compact-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    gap: 8px;
  }

  .player-count-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    color: white;
    font-size: 0.8rem;
  }

  .count {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.7rem;
  }

  .label {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .compact-players-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .compact-player-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 4px 8px;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .compact-player-item:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .compact-player-name {
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .compact-remove-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 0.8rem;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .compact-remove-btn:hover {
    background: #ff5252;
    transform: scale(1.1);
  }

  .compact-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .compact-compare-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 16px;
    color: white;
    font-size: 0.9rem;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .compact-compare-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .compare-icon {
    width: 16px;
    height: 16px;
    object-fit: cover;
    border-radius: 2px;
  }

  .expand-btn {
    background: none;
    border: none;
    color: white;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 2px;
  }

  /* Show mobile-only elements on mobile */
  .mobile-only {
    display: flex;
  }

  /* Show full widget when expanded on mobile */
  .comparison-widget.expanded .full-widget {
    display: block;
    width: calc(100vw - 32px);
    max-width: 320px;
  }

  .comparison-widget.expanded .mobile-compact {
    display: none;
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

/* Mobile expansion animation */
@media (max-width: 768px) {
  .full-widget {
    animation: expandUp 0.3s ease-out;
  }

  @keyframes expandUp {
    from {
      transform: translateY(100%) scale(0.8);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
}


</style>