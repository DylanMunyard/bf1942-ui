<template>
  <div class="explorer-header">
    <!-- Terminal Bar -->
    <div class="terminal-bar">
      <div class="terminal-dots">
        <span class="dot dot-red" />
        <span class="dot dot-yellow" />
        <span class="dot dot-green" />
      </div>
      <div class="terminal-title">
        <span class="terminal-path">~/battlefield/</span>
        <span class="terminal-cmd">{{ modeCommand }}</span>
        <span class="cursor">_</span>
      </div>
    </div>

    <!-- Header Content -->
    <div class="header-content">
      <!-- Title Row -->
      <div class="explorer-header-row">
        <div class="explorer-header-left">
          <div class="glitch-wrapper">
            <h1 class="glitch-text" :data-text="modeTitle">
              {{ modeTitle }}
            </h1>
          </div>
          <p class="header-subtitle">
            <span class="prompt">&gt;</span>
            <span class="typing-text">{{ modeDescription }}</span>
          </p>
        </div>

        <!-- Mode Toggle -->
        <div class="explorer-mode-toggle">
          <button
            @click="emit('update:mode', 'servers')"
            :class="['explorer-mode-btn', mode === 'servers' && 'explorer-mode-btn--active']"
          >
            <span class="mode-icon">{::}</span>
            <span class="mode-label">Servers</span>
          </button>
          <button
            @click="emit('update:mode', 'maps')"
            :class="['explorer-mode-btn', mode === 'maps' && 'explorer-mode-btn--active']"
          >
            <span class="mode-icon">[#]</span>
            <span class="mode-label">Maps</span>
          </button>
          <button
            @click="emit('update:mode', 'players')"
            :class="['explorer-mode-btn', mode === 'players' && 'explorer-mode-btn--active']"
          >
            <span class="mode-icon">&lt;@&gt;</span>
            <span class="mode-label">Players</span>
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="explorer-search">
        <span class="explorer-search-icon">$</span>
        <input
          :value="search"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
          type="text"
          :placeholder="searchPlaceholder"
          class="explorer-search-input"
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  mode: 'servers' | 'maps' | 'players';
  search: string;
}>();

const emit = defineEmits<{
  (e: 'update:mode', value: 'servers' | 'maps' | 'players'): void;
  (e: 'update:search', value: string): void;
}>();

const modeCommand = computed(() => {
  switch (props.mode) {
    case 'servers': return 'list-servers';
    case 'maps': return 'list-maps';
    case 'players': return 'find-player';
    default: return 'explore';
  }
});

const modeTitle = computed(() => {
  switch (props.mode) {
    case 'servers': return 'SERVER_BROWSER';
    case 'maps': return 'MAP_INTEL';
    case 'players': return 'PLAYER_LOOKUP';
    default: return 'DATA_EXPLORER';
  }
});

const modeDescription = computed(() => {
  switch (props.mode) {
    case 'servers': return 'Browse active servers, player counts, and current maps';
    case 'maps': return 'Explore map statistics, rotations, and leaderboards';
    case 'players': return 'Search player stats, rankings, and battle history';
    default: return 'Browse servers, maps, and players with detailed statistics';
  }
});

const searchPlaceholder = computed(() => {
  if (props.mode === 'players') {
    return 'grep player --min-chars 3...';
  }
  return `grep ${props.mode}...`;
});
</script>

<style scoped>
.explorer-header {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color, #30363d);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-panel, #0d1117);
  box-shadow:
    0 0 20px rgba(0, 255, 242, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Terminal Bar */
.terminal-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, #1a1f26 0%, #0d1117 100%);
  border-bottom: 1px solid var(--border-color, #30363d);
}

.terminal-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.terminal-title {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-secondary, #8b949e);
}

.terminal-path {
  color: var(--neon-cyan, #00fff2);
}

.terminal-cmd {
  color: var(--text-primary, #e6edf3);
  margin-left: 0.25rem;
}

.cursor {
  color: var(--neon-green, #39ff14);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Header Content */
.header-content {
  padding: 1.25rem;
}

.explorer-header-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .explorer-header-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.explorer-header-left {
  position: relative;
}

/* Glitch text effect */
.glitch-wrapper {
  position: relative;
}

.glitch-text {
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--neon-cyan, #00fff2);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 0.5rem 0;
  text-shadow:
    0 0 10px var(--neon-cyan, #00fff2),
    0 0 20px var(--neon-cyan, #00fff2);
  animation: glitch 3s infinite;
}

@keyframes glitch {
  0%, 90%, 100% {
    text-shadow:
      0 0 10px var(--neon-cyan, #00fff2),
      0 0 20px var(--neon-cyan, #00fff2);
  }
  92% {
    text-shadow:
      -2px 0 var(--neon-pink, #ff00ff),
      2px 0 var(--neon-green, #39ff14);
    transform: translate(2px, 0);
  }
  94% {
    text-shadow:
      2px 0 var(--neon-pink, #ff00ff),
      -2px 0 var(--neon-green, #39ff14);
    transform: translate(-2px, 0);
  }
}

.header-subtitle {
  color: var(--text-secondary, #8b949e);
  margin: 0;
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.5;
}

.prompt {
  color: var(--neon-green, #39ff14);
  margin-right: 0.5rem;
}

.typing-text {
  border-right: 2px solid var(--neon-green, #39ff14);
  padding-right: 4px;
  animation: typing-cursor 0.8s step-end infinite;
}

@keyframes typing-cursor {
  0%, 100% { border-color: var(--neon-green, #39ff14); }
  50% { border-color: transparent; }
}

/* Mode Toggle */
.explorer-mode-toggle {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-panel, #0d1117);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 4px;
  padding: 0.25rem;
}

.explorer-mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.04em;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary, #8b949e);
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.explorer-mode-btn:hover {
  color: var(--text-primary, #e6edf3);
  background: rgba(0, 255, 242, 0.1);
}

.explorer-mode-btn--active {
  background: var(--neon-cyan, #00fff2);
  color: var(--bg-dark, #0a0a0f);
  box-shadow: 0 0 15px rgba(0, 255, 242, 0.4);
}

.mode-icon {
  font-size: 0.9em;
  opacity: 0.8;
}

.explorer-mode-btn--active .mode-icon {
  opacity: 1;
}

@media (max-width: 640px) {
  .mode-label {
    display: none;
  }

  .explorer-mode-btn {
    padding: 0.5rem;
  }

  .mode-icon {
    font-size: 1em;
  }
}

/* Search */
.explorer-search {
  position: relative;
  width: 100%;
  max-width: 28rem;
}

.explorer-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--neon-green, #39ff14);
  opacity: 0.8;
  font-size: 0.875rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.explorer-search-input {
  width: 100%;
  padding: 0.6rem 0.75rem 0.6rem 2rem;
  font-size: 0.875rem;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-card, #161b22);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 4px;
  color: var(--text-primary, #e6edf3);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.explorer-search-input::placeholder {
  color: var(--text-secondary, #8b949e);
  opacity: 0.5;
}

.explorer-search-input:focus {
  outline: none;
  border-color: var(--neon-cyan, #00fff2);
  box-shadow: 0 0 15px rgba(0, 255, 242, 0.2);
}

/* Mobile */
@media (max-width: 640px) {
  .terminal-bar {
    padding: 0.5rem 0.75rem;
  }

  .terminal-title {
    font-size: 0.7rem;
  }

  .header-content {
    padding: 1rem;
  }

  .glitch-text {
    letter-spacing: 1px;
  }

  .header-subtitle {
    font-size: 0.75rem;
  }
}
</style>
