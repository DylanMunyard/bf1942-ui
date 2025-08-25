<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  isPlaying: boolean;
  playbackSpeed: number;
  selectedSnapshotIndex: number;
  totalSnapshots: number;
  currentElapsedTime: string;
  snapshotTimeline: Array<{
    index: number;
    label: string;
    timestamp: string;
  }>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'toggle-playback': [];
  'reset-playback': [];
  'set-playback-speed': [speed: number];
  'start-drag': [event: MouseEvent];
  'handle-dot-click': [index: number];
}>();

const sampledDots = computed(() => {
  const maxDots = 20;
  const totalSnapshots = props.snapshotTimeline.length;
  
  if (totalSnapshots <= maxDots) {
    return props.snapshotTimeline;
  }
  
  const step = Math.floor(totalSnapshots / maxDots);
  const dots = [];
  for (let i = 0; i < totalSnapshots; i += step) {
    dots.push(props.snapshotTimeline[i]);
  }
  
  if (dots[dots.length - 1].index !== totalSnapshots - 1) {
    dots.push(props.snapshotTimeline[totalSnapshots - 1]);
  }
  
  return dots;
});

const getElapsedTime = (timestamp: string): string => {
  // This function would need to be passed in or calculated based on round start time
  // For now, returning a placeholder
  return timestamp;
};

const handlePlaybackSpeedChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const speed = parseInt(target.value);
  emit('set-playback-speed', speed);
};
</script>

<template>
  <div
    v-if="snapshotTimeline.length > 1"
    class="timeline-section"
  >
    <div class="timeline-header">
      <div class="instructions-text">
        Click play to watch the match unfold, or drag through the timeline
      </div>
      <div class="timeline-controls-compact">
        <div class="compact-playback">
          <button
            class="mini-button"
            title="Reset"
            @click="$emit('reset-playback')"
          >
            ⏮️
          </button>
          <button
            class="mini-button play-mini"
            :class="{ playing: isPlaying }"
            title="Play/Pause"
            @click="$emit('toggle-playback')"
          >
            {{ isPlaying ? '⏸️' : '▶️' }}
          </button>
          <select
            :value="playbackSpeed"
            class="mini-select"
            @change="handlePlaybackSpeedChange"
          >
            <option :value="500">
              0.5x
            </option>
            <option :value="250">
              1x
            </option>
            <option
              :value="150"
              selected
            >
              2x
            </option>
            <option :value="75">
              4x
            </option>
          </select>
          <span
            v-if="isPlaying"
            class="mini-indicator"
          >🔴</span>
        </div>
        
        <div class="elapsed-badge">
          {{ currentElapsedTime }}
        </div>
      </div>
    </div>
    
    <div class="timeline-scrubber">
      <div 
        class="mini-progress-bar"
        @mousedown="$emit('start-drag', $event)"
      >
        <div 
          class="mini-progress-fill"
          :style="{ width: `${(selectedSnapshotIndex / Math.max(snapshotTimeline.length - 1, 1)) * 100}%` }"
        />
        <div class="scrubber-dots">
          <div 
            v-for="(dot, index) in sampledDots" 
            :key="index"
            class="scrubber-dot"
            :class="{ 'active-dot': dot.index === selectedSnapshotIndex }"
            :title="`${getElapsedTime(dot.timestamp)} elapsed`"
            @click="$emit('handle-dot-click', dot.index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-section {
  margin: 20px 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.timeline-controls-compact {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compact-playback {
  display: flex;
  align-items: center;
  gap: 6px;
  @apply bg-slate-800/60 backdrop-blur-sm border border-slate-700/50;
  padding: 4px 8px;
  border-radius: 16px;
}

.mini-button {
  padding: 4px 6px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  @apply bg-slate-900/60;
  color: var(--color-text);
  cursor: pointer;
}

.mini-button:hover {
  background: var(--color-background-mute);
}

.play-mini.playing {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.mini-select {
  padding: 2px 4px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  @apply bg-slate-900/60;
  color: var(--color-text);
  font-size: 0.75rem;
  cursor: pointer;
  min-width: 45px;
}

.mini-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.mini-indicator {
  color: #ff4444;
  font-size: 0.7rem;
  animation: blink 1.5s infinite alternate;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.timeline-scrubber {
  width: 100%;
}

.mini-progress-bar {
  width: 100%;
  height: 20px;
  background: var(--color-background-mute);
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.mini-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 10px;
  position: relative;
  z-index: 1;
}

.scrubber-dots {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transform: translateY(-50%);
  pointer-events: none;
  padding: 0 10px;
}

.scrubber-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid rgba(0, 0, 0, 0.3);
  opacity: 0.8;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
  z-index: 2;
}

.scrubber-dot:hover, .active-dot {
  opacity: 1;
  transform: scale(1.3);
  border-color: rgba(0, 0, 0, 0.5);
}

.mini-progress-bar:active {
  cursor: grabbing;
}

.elapsed-badge {
  background: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.instructions-text {
  background: var(--color-background-mute);
  padding: 6px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    margin-bottom: 8px;
  }

  .timeline-controls-compact {
    justify-content: center;
    gap: 8px;
  }

  .instructions-text {
    font-size: 0.75rem;
    text-align: center;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .timeline-section {
    margin: 10px 0;
  }

  .timeline-header {
    gap: 6px;
    margin-bottom: 6px;
  }

  .instructions-text {
    font-size: 0.7rem;
    padding: 3px 6px;
  }

  .compact-playback {
    padding: 3px 6px;
    gap: 4px;
  }

  .mini-button {
    padding: 3px 5px;
    font-size: 0.9rem;
  }

  .mini-select {
    font-size: 0.7rem;
    padding: 1px 3px;
    min-width: 40px;
  }

  .elapsed-badge {
    font-size: 0.7rem;
    padding: 3px 6px;
  }

  .mini-progress-bar {
    height: 16px;
  }

  .scrubber-dot {
    width: 12px;
    height: 12px;
  }
}
</style>