<template>
  <!-- Desktop: Hover Overlay -->
  <div 
    v-if="showOverlay && !isMobile"
    class="absolute left-1/2 transform -translate-x-1/2 w-80 bg-neutral-800 border border-neutral-600 rounded-lg p-4 shadow-2xl transition-all duration-300 z-50 pointer-events-none"
    :class="[overlayClass, openUpward ? 'bottom-full mb-2' : 'top-full mt-2']"
  >
    <div class="space-y-3">
      <!-- Forecast Bars -->
      <div class="space-y-2">
        <!-- Bars container -->
        <div class="flex items-end justify-center gap-1 bg-neutral-800/30 rounded-lg p-4 h-32">
          <div 
            v-for="(entry, index) in hourlyTimeline" 
            :key="index"
            class="flex flex-col items-center flex-1 max-w-[60px] group cursor-pointer"
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
          </div>
        </div>
        
        <!-- Labels container (below bars) -->
        <div class="flex justify-center gap-1 px-4">
          <div 
            v-for="(entry, index) in hourlyTimeline" 
            :key="index"
            class="flex flex-col items-center gap-1 flex-1 max-w-[60px]"
          >
            <!-- Time label -->
            <div
              class="text-xs font-mono text-center transition-colors duration-300"
              :class="entry.isCurrentHour ? 'text-cyan-400 font-bold' : 'text-neutral-400'"
            >
              {{ formatTimelineTimeLabel(entry) }}
            </div>
            <!-- Player count -->
            <div class="text-xs text-center transition-colors duration-300">
              <div
                v-if="entry.isCurrentHour && currentPlayers"
                class="text-cyan-400 font-bold"
              >
                {{ currentPlayers }}
              </div>
              <div
                v-else
                class="text-neutral-300 font-semibold"
              >
                {{ Math.round(entry.typicalPlayers) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Status -->
      <div
        v-if="currentStatus"
        class="flex items-center justify-center gap-3"
      >
        <div class="text-xs text-neutral-400 text-center">
          {{ currentStatus }}
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile: Centered Modal -->
  <div
    v-if="showModal && isMobile"
    class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.stop.prevent="$emit('close')"
  >
    <div 
      class="bg-neutral-800 border border-neutral-600 rounded-lg p-6 w-full max-w-sm shadow-2xl"
      @click.stop
    >
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">
            Activity Forecast
          </h3>
          <button 
            class="text-neutral-400 hover:text-white transition-colors"
            @click.stop.prevent="$emit('close')"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Current Status -->
        <div
          v-if="currentStatus"
          class="text-sm text-neutral-400"
        >
          {{ currentStatus }}
        </div>

        <!-- Forecast Bars -->
        <div class="space-y-2">
          <!-- Bars container -->
          <div class="flex items-end justify-center gap-1 bg-neutral-800/30 rounded-lg p-4 h-28">
            <div 
              v-for="(entry, index) in hourlyTimeline" 
              :key="index"
              class="flex flex-col items-center flex-1 max-w-[40px]"
            >
              <!-- Vertical bar -->
              <div 
                class="w-4 rounded-t transition-all duration-300"
                :class="entry.isCurrentHour ? 'bg-gradient-to-t from-cyan-300 to-cyan-500' : 'bg-gradient-to-t from-cyan-400 to-purple-500'"
                :style="{ 
                  height: getTimelineBarHeight(entry) + 'px' 
                }"
              />
            </div>
          </div>
          
          <!-- Labels container (below bars) -->
          <div class="flex justify-center gap-1 px-4">
            <div 
              v-for="(entry, index) in hourlyTimeline" 
              :key="index"
              class="flex flex-col items-center gap-1 flex-1 max-w-[40px]"
            >
              <!-- Time label -->
              <div
                class="text-xs font-mono text-center"
                :class="entry.isCurrentHour ? 'text-cyan-400 font-bold' : 'text-neutral-400'"
              >
                {{ formatTimelineTimeLabel(entry) }}
              </div>
              <!-- Player count -->
              <div class="text-xs text-center">
                <div
                  v-if="entry.isCurrentHour && currentPlayers"
                  class="text-cyan-400 font-bold"
                >
                  {{ currentPlayers }}
                </div>
                <div
                  v-else
                  class="text-neutral-300 font-semibold"
                >
                  {{ Math.round(entry.typicalPlayers) }}
                </div>
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
  openUpward?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showOverlay: false,
  showModal: false,
  currentStatus: '',
  currentPlayers: undefined,
  overlayClass: 'opacity-0',
  openUpward: false
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
  const maxHeight = 100; // px for forecast bars (increased to match h-40 container)
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