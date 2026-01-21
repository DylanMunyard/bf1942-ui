<template>
  <div
    @click="emit('click')"
    :class="[
      'px-4 py-3 border-b border-slate-700/30 cursor-pointer transition-all duration-200',
      isSelected
        ? 'bg-cyan-500/20 border-l-4 border-l-cyan-500'
        : 'hover:bg-slate-700/30 border-l-4 border-l-transparent'
    ]"
  >
    <div class="flex items-center gap-3">
      <!-- Online Status -->
      <div
        :class="[
          'w-2.5 h-2.5 rounded-full flex-shrink-0',
          server.isOnline ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'
        ]"
        :title="server.isOnline ? 'Online' : 'Offline'"
      />

      <!-- Server Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-slate-200 font-medium truncate">{{ server.name }}</span>
          <span class="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 flex-shrink-0">
            {{ gameLabel }}
          </span>
        </div>
        <div class="flex items-center gap-3 mt-1 text-xs text-slate-400">
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
      <div class="text-slate-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
