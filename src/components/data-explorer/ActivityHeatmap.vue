<template>
  <div class="w-full">
    <!-- Day labels -->
    <div class="flex">
      <div class="w-10"></div>
      <div class="flex-1 grid grid-cols-24 gap-px text-xs text-slate-500 text-center mb-1">
        <span v-for="h in 24" :key="h" class="hidden sm:block">{{ (h - 1).toString().padStart(2, '0') }}</span>
      </div>
    </div>

    <!-- Heatmap grid -->
    <div v-for="day in days" :key="day.index" class="flex items-center gap-1 mb-px">
      <div class="w-10 text-xs text-slate-500">{{ day.label }}</div>
      <div class="flex-1 grid grid-cols-24 gap-px">
        <div
          v-for="hour in 24"
          :key="hour"
          class="aspect-square rounded-sm transition-all duration-200 hover:ring-2 hover:ring-cyan-400/50"
          :style="{ backgroundColor: getCellColor(day.index, hour - 1) }"
          :title="getCellTooltip(day.index, hour - 1)"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
      <span>Quiet</span>
      <div class="flex gap-px">
        <div v-for="(color, i) in legendColors" :key="i" class="w-4 h-3 rounded-sm" :style="{ backgroundColor: color }" />
      </div>
      <span>Busy</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ActivityPattern } from '../../services/dataExplorerService';

const props = defineProps<{
  patterns: ActivityPattern[];
}>();

const days = [
  { index: 0, label: 'Sun' },
  { index: 1, label: 'Mon' },
  { index: 2, label: 'Tue' },
  { index: 3, label: 'Wed' },
  { index: 4, label: 'Thu' },
  { index: 5, label: 'Fri' },
  { index: 6, label: 'Sat' },
];

// Create a lookup map
const patternMap = computed(() => {
  const map = new Map<string, ActivityPattern>();
  props.patterns.forEach(p => {
    map.set(`${p.dayOfWeek}-${p.hourOfDay}`, p);
  });
  return map;
});

// Find max players for scaling
const maxPlayers = computed(() => {
  return Math.max(...props.patterns.map(p => p.avgPlayers), 1);
});

// Color scale for heatmap
const legendColors = [
  'rgb(30, 41, 59)', // slate-800
  'rgb(51, 65, 85)', // slate-700
  'rgb(6, 95, 70)', // emerald-800
  'rgb(4, 120, 87)', // emerald-700
  'rgb(5, 150, 105)', // emerald-600
  'rgb(16, 185, 129)', // emerald-500
];

const getCellColor = (dayOfWeek: number, hourOfDay: number): string => {
  const pattern = patternMap.value.get(`${dayOfWeek}-${hourOfDay}`);
  if (!pattern) return legendColors[0];

  const intensity = pattern.avgPlayers / maxPlayers.value;
  const colorIndex = Math.min(Math.floor(intensity * legendColors.length), legendColors.length - 1);
  return legendColors[colorIndex];
};

const getCellTooltip = (dayOfWeek: number, hourOfDay: number): string => {
  const pattern = patternMap.value.get(`${dayOfWeek}-${hourOfDay}`);
  if (!pattern) return `${days[dayOfWeek].label} ${hourOfDay}:00 - No data`;
  return `${days[dayOfWeek].label} ${hourOfDay}:00 - Avg: ${pattern.avgPlayers.toFixed(1)} players`;
};
</script>

<style scoped>
.grid-cols-24 {
  grid-template-columns: repeat(24, minmax(0, 1fr));
}
</style>
