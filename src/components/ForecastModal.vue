<template>
  <!-- Desktop: Hover Overlay -->
  <div 
    v-if="showOverlay && !isMobile"
    class="absolute top-full left-1/2 transform -translate-x-1/2 w-80 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-2xl transition-all duration-300 z-50 pointer-events-none mt-2"
    :class="overlayClass"
  >
    <div class="space-y-3">
      <!-- Current Status -->
      <div v-if="currentStatus" class="flex items-center gap-3">
        <div class="text-xs text-slate-400">
          {{ currentStatus }}
        </div>
      </div>

      <!-- Forecast Bars -->
      <div class="space-y-2">
        <div class="text-xs font-bold text-purple-400 uppercase tracking-wide">Activity Forecast</div>
        <div class="flex items-end justify-center gap-1 bg-slate-800/30 rounded-lg p-4 h-32">
          <div 
            v-for="(entry, index) in hourlyTimeline" 
            :key="index"
            class="flex flex-col items-center gap-1 flex-1 max-w-[60px] group cursor-pointer"
          >
            <!-- Vertical bar -->
            <div 
              class="w-6 rounded-t transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30"
              :class="entry.isCurrentHour ? 'bg-gradient-to-t from-cyan-300 to-cyan-500 hover:from-cyan-200 hover:to-cyan-400' : 'bg-gradient-to-t from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400'"
              :style="{ 
                height: getTimelineBarHeight(entry) + 'px' 
              }"
              :title="formatTimelineTooltip(entry)"
            />
            <!-- Time label -->
            <div class="text-xs font-mono text-center transition-colors duration-300 group-hover:text-slate-200" :class="entry.isCurrentHour ? 'text-cyan-400 font-bold' : 'text-slate-400'">
              {{ formatTimelineTimeLabel(entry) }}
            </div>
            <!-- Player count -->
            <div class="text-xs text-center transition-colors duration-300 group-hover:text-slate-200">
              <div v-if="entry.isCurrentHour && currentPlayers" class="text-cyan-400 font-bold group-hover:text-cyan-300">
                {{ currentPlayers }}
              </div>
              <div v-else class="text-slate-300 font-semibold">
                {{ Math.round(entry.typicalPlayers) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile: Centered Modal -->
  <div
    v-if="showModal && isMobile"
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click="$emit('close')"
  >
    <div 
      class="bg-slate-800 border border-slate-600 rounded-lg p-6 w-full max-w-sm shadow-2xl"
      @click.stop
    >
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">Activity Forecast</h3>
          <button 
            @click="$emit('close')"
            class="text-slate-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Current Status -->
        <div v-if="currentStatus" class="text-sm text-slate-400">
          {{ currentStatus }}
        </div>

        <!-- Forecast Bars -->
        <div class="flex items-end justify-center gap-1 bg-slate-800/30 rounded-lg p-4 h-32">
          <div 
            v-for="(entry, index) in hourlyTimeline" 
            :key="index"
            class="flex flex-col items-center gap-1 flex-1 max-w-[40px]"
          >
            <!-- Vertical bar -->
            <div 
              class="w-4 rounded-t transition-all duration-300"
              :class="entry.isCurrentHour ? 'bg-gradient-to-t from-cyan-300 to-cyan-500' : 'bg-gradient-to-t from-cyan-400 to-purple-500'"
              :style="{ 
                height: getTimelineBarHeight(entry) + 'px' 
              }"
            />
            <!-- Time label -->
            <div class="text-xs font-mono text-center" :class="entry.isCurrentHour ? 'text-cyan-400 font-bold' : 'text-slate-400'">
              {{ formatTimelineTimeLabel(entry) }}
            </div>
            <!-- Player count -->
            <div class="text-xs text-center">
              <div v-if="entry.isCurrentHour && currentPlayers" class="text-cyan-400 font-bold">
                {{ currentPlayers }}
              </div>
              <div v-else class="text-slate-300 font-semibold">
                {{ Math.round(entry.typicalPlayers) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ServerHourlyTimelineEntry } from '../services/serverDetailsService';

interface Props {
  showOverlay?: boolean;
  showModal?: boolean;
  hourlyTimeline: ServerHourlyTimelineEntry[];
  currentStatus?: string;
  currentPlayers?: number;
  overlayClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showOverlay: false,
  showModal: false,
  currentStatus: '',
  currentPlayers: undefined,
  overlayClass: 'opacity-0'
});

defineEmits<{
  close: [];
}>();

// Detect mobile device
const isMobile = computed(() => {
  return window.innerWidth < 768; // md breakpoint
});

// Helper functions
const getTimelineBarHeight = (entry: ServerHourlyTimelineEntry): number => {
  const timeline = props.hourlyTimeline || [];
  const maxTypical = Math.max(1, ...timeline.map(e => Math.max(0, e.typicalPlayers || 0)));
  const pct = Math.max(0, Math.min(1, (entry.typicalPlayers || 0) / maxTypical));
  const maxHeight = 80; // px for forecast bars
  const minHeight = 8;
  return Math.max(minHeight, Math.round(pct * maxHeight));
};

const formatTimelineTimeLabel = (entry: ServerHourlyTimelineEntry): string => {
  // Convert UTC hour to local "HH" display
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), entry.hour, 0, 0));
  return d.toLocaleTimeString(undefined, { hour: '2-digit' });
};

const formatTimelineTooltip = (entry: ServerHourlyTimelineEntry): string => {
  // Convert UTC hour to local "HH:00" display
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), entry.hour, 0, 0));
  const local = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const levelLabel = getBusyLevelLabel(entry.busyLevel);
  return `${local} • Typical ${Math.round(entry.typicalPlayers)} • ${levelLabel}`;
};

const getBusyLevelLabel = (level: string): string => {
  switch (level) {
    case 'very_busy': return 'Very busy';
    case 'busy': return 'Busy';
    case 'moderate': return 'Moderate';
    case 'quiet': return 'Quiet';
    case 'very_quiet': return 'Very quiet';
    default: return 'Unknown';
  }
};
</script>