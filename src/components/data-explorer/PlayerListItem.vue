<template>
  <div
    @click="emit('click')"
    :class="['list-item', isSelected && 'list-item--selected']"
  >
    <div class="list-item-row">
      <!-- Player Icon -->
      <div class="list-item-icon">
        < >
      </div>

      <!-- Player Info -->
      <div class="list-item-content">
        <div class="list-item-title">{{ player.playerName }}</div>
        <div class="list-item-meta">
          <span class="list-item-score">{{ player.totalScore.toLocaleString() }} score</span>
          <span>{{ player.kdRatio.toFixed(2) }} K/D</span>
          <span>{{ player.uniqueMaps }} maps</span>
        </div>
      </div>

      <!-- Arrow -->
      <div class="list-item-arrow">
        <svg class="list-item-arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerSearchResult } from '../../services/dataExplorerService';

defineProps<{
  player: PlayerSearchResult;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style scoped>
.list-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--portal-border);
  cursor: pointer;
  transition: background 0.2s;
  border-left: 3px solid transparent;
}

.list-item:hover {
  background: var(--portal-accent-dim);
}

.list-item--selected {
  background: var(--portal-accent-dim);
  border-left-color: var(--portal-accent);
}

.list-item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.list-item-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 50%;
  font-family: ui-monospace, monospace;
  font-size: 0.6rem;
  color: var(--portal-accent);
  opacity: 0.7;
}

.list-item-content {
  flex: 1;
  min-width: 0;
}

.list-item-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--portal-text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: var(--portal-text);
}

.list-item-score {
  color: var(--portal-accent);
  font-weight: 500;
}

.list-item-arrow {
  flex-shrink: 0;
}

.list-item-arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--portal-text);
  opacity: 0.5;
  transition: opacity 0.2s, color 0.2s;
}

.list-item:hover .list-item-arrow-icon {
  opacity: 1;
  color: var(--portal-accent);
}
</style>
