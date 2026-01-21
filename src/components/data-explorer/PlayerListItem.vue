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
      <!-- Player Avatar -->
      <div class="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0">
        <span class="text-slate-400 text-sm">👤</span>
      </div>

      <!-- Player Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-slate-200 font-medium truncate">{{ player.playerName }}</span>
        </div>
        <div class="flex items-center gap-3 mt-1 text-xs text-slate-400">
          <span class="text-cyan-400 font-medium">{{ player.totalScore.toLocaleString() }} score</span>
          <span>{{ player.kdRatio.toFixed(2) }} K/D</span>
          <span>{{ player.uniqueMaps }} maps</span>
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
import type { PlayerSearchResult } from '../../services/dataExplorerService';

defineProps<{
  player: PlayerSearchResult;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>
