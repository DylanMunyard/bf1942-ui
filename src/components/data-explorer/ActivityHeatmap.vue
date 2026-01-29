<template>
  <div class="heatmap">
    <!-- Day labels -->
    <div class="heatmap-header">
      <div class="heatmap-day-label"></div>
      <div class="heatmap-hours">
        <span v-for="h in 24" :key="h" class="heatmap-hour-label">{{ (h - 1).toString().padStart(2, '0') }}</span>
      </div>
    </div>

    <!-- Heatmap grid -->
    <div v-for="day in days" :key="day.index" class="heatmap-row">
      <div class="heatmap-day-label">{{ day.label }}</div>
      <div class="heatmap-cells">
        <div
          v-for="hour in 24"
          :key="hour"
          class="heatmap-cell"
          :style="{ backgroundColor: getCellColor(day.index, hour - 1) }"
          :title="getCellTooltip(day.index, hour - 1)"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="heatmap-legend">
      <span>Quiet</span>
      <div class="heatmap-legend-colors">
        <div v-for="(color, i) in legendColors" :key="i" class="heatmap-legend-color" :style="{ backgroundColor: color }" />
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

// Get timezone offset in hours (positive = ahead of UTC, negative = behind UTC)
const timezoneOffsetHours = computed(() => {
  // getTimezoneOffset returns minutes and is inverted (UTC-5 returns 300)
  return -new Date().getTimezoneOffset() / 60;
});

// Convert UTC day+hour to local day+hour
const utcToLocal = (utcDay: number, utcHour: number): { day: number; hour: number } => {
  let localHour = utcHour + timezoneOffsetHours.value;
  let localDay = utcDay;

  if (localHour >= 24) {
    localHour -= 24;
    localDay = (localDay + 1) % 7;
  } else if (localHour < 0) {
    localHour += 24;
    localDay = (localDay + 6) % 7; // Same as (localDay - 1 + 7) % 7
  }

  return { day: localDay, hour: localHour };
};

// Create a lookup map with local times as keys
const patternMap = computed(() => {
  const map = new Map<string, ActivityPattern>();
  props.patterns.forEach(p => {
    const local = utcToLocal(p.dayOfWeek, p.hourOfDay);
    map.set(`${local.day}-${local.hour}`, p);
  });
  return map;
});

// Find max players for scaling
const maxPlayers = computed(() => {
  return Math.max(...props.patterns.map(p => p.avgPlayers), 1);
});

// Color scale for heatmap - using portal theme colors
const legendColors = [
  '#111118', // portal-surface-elevated
  '#1a1a24', // portal-border
  '#0d3d2d', // dark teal
  '#0a5c45', // medium teal
  '#07785c', // bright teal
  '#00e5a0', // portal-accent
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
  const timeStr = `${hourOfDay.toString().padStart(2, '0')}:00`;
  if (!pattern) return `${days[dayOfWeek].label} ${timeStr} - No data`;
  return `${days[dayOfWeek].label} ${timeStr} - Avg: ${pattern.avgPlayers.toFixed(1)} players`;
};
</script>

<style scoped>
.heatmap {
  width: 100%;
}

.heatmap-header {
  display: flex;
  margin-bottom: 0.25rem;
}

.heatmap-day-label {
  width: 2.5rem;
  flex-shrink: 0;
  font-size: 0.65rem;
  color: var(--portal-text);
  font-family: ui-monospace, monospace;
}

.heatmap-hours {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 1px;
}

.heatmap-hour-label {
  text-align: center;
  font-size: 0.5rem;
  color: var(--portal-text);
  font-family: ui-monospace, monospace;
  display: none;
}

@media (min-width: 640px) {
  .heatmap-hour-label {
    display: block;
  }
}

.heatmap-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1px;
}

.heatmap-cells {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 1px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 2px;
  transition: box-shadow 0.2s;
}

.heatmap-cell:hover {
  box-shadow: 0 0 0 2px var(--portal-accent-dim);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.65rem;
  color: var(--portal-text);
}

.heatmap-legend-colors {
  display: flex;
  gap: 1px;
}

.heatmap-legend-color {
  width: 1rem;
  height: 0.75rem;
  border-radius: 2px;
}
</style>
