<template>
  <div
    @click="emit('click')"
    :class="['list-item', isSelected && 'list-item--selected']"
  >
    <div class="list-item-row">
      <!-- Online Status -->
      <div
        :class="['list-item-status', server.isOnline ? 'list-item-status--online' : 'list-item-status--offline']"
        :title="server.isOnline ? 'Online' : 'Offline'"
      />

      <!-- Server Info -->
      <div class="list-item-content">
        <div class="list-item-title-row">
          <span class="list-item-title">{{ server.name }}</span>
          <span class="list-item-tag">
            {{ gameLabel }}
          </span>
        </div>
        <div class="list-item-meta">
          <span v-if="server.country" :title="server.country">
            {{ getCountryFlag(server.country) }}
          </span>
          <span v-if="server.isOnline">
            {{ server.currentPlayers }}/{{ server.maxPlayers }} players
          </span>
          <span>{{ server.totalMaps }} maps</span>
          <span>{{ server.totalRoundsLast30Days }} rounds</span>
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
import type { ServerSummary } from '../../services/dataExplorerService';

const props = defineProps<{
  server: ServerSummary;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

// Game label mapping
const gameLabel = (() => {
  switch (props.server.game.toLowerCase()) {
    case 'bf1942': return 'BF42';
    case 'fh2': return 'FH2';
    case 'bfvietnam': return 'BFV';
    default: return props.server.game.toUpperCase();
  }
})();

// Simple country to flag emoji
const getCountryFlag = (country: string): string => {
  const countryFlags: Record<string, string> = {
    'us': '🇺🇸', 'usa': '🇺🇸', 'united states': '🇺🇸',
    'de': '🇩🇪', 'germany': '🇩🇪',
    'gb': '🇬🇧', 'uk': '🇬🇧', 'united kingdom': '🇬🇧',
    'fr': '🇫🇷', 'france': '🇫🇷',
    'nl': '🇳🇱', 'netherlands': '🇳🇱',
    'se': '🇸🇪', 'sweden': '🇸🇪',
    'au': '🇦🇺', 'australia': '🇦🇺',
    'ca': '🇨🇦', 'canada': '🇨🇦',
    'br': '🇧🇷', 'brazil': '🇧🇷',
    'ru': '🇷🇺', 'russia': '🇷🇺',
    'pl': '🇵🇱', 'poland': '🇵🇱',
  };
  return countryFlags[country.toLowerCase()] || '🌍';
};
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

.list-item-status {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.list-item-status--online {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
}

.list-item-status--offline {
  background: var(--portal-text);
  opacity: 0.4;
}

.list-item-content {
  flex: 1;
  min-width: 0;
}

.list-item-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.list-item-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--portal-text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item-tag {
  flex-shrink: 0;
  padding: 0.125rem 0.375rem;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-family: ui-monospace, monospace;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text);
}

.list-item-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: var(--portal-text);
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
