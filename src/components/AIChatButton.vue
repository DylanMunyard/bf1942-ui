<template>
  <button
    class="ai-chat-fab"
    :class="{ 'is-open': isOpen }"
    :aria-label="isOpen ? 'Close AI Chat' : 'Open AI Chat'"
    @click="$emit('click')"
  >
    <span class="fab-icon">
      <img
        v-if="!isOpen"
        :src="clippyIcon"
        alt="AI Assistant"
        class="fab-clippy"
      >
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </span>
    <span class="fab-pulse" />
  </button>
</template>

<script setup lang="ts">
import clippyIcon from '@/assets/clippy_my_boi.png';

interface Props {
  isOpen?: boolean;
}

withDefaults(defineProps<Props>(), {
  isOpen: false,
});

defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.ai-chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  border: 2px solid transparent;
  background: linear-gradient(#161b22, #161b22) padding-box,
    linear-gradient(135deg, #00fff2, #60a5fa, #00fff2) border-box;
  color: #0d1117;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 24px rgba(0, 255, 242, 0.35),
    0 0 48px rgba(96, 165, 250, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  z-index: 1000;
  animation: fab-glow 3s ease-in-out infinite;
}

.ai-chat-fab:hover {
  transform: scale(1.06);
  box-shadow:
    0 0 32px rgba(0, 255, 242, 0.5),
    0 0 56px rgba(96, 165, 250, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.ai-chat-fab:active {
  transform: scale(0.98);
}

.ai-chat-fab.is-open {
  background: linear-gradient(#21262d, #161b22) padding-box,
    linear-gradient(135deg, #30363d, #484f58) border-box;
  color: #8b949e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: none;
}

.ai-chat-fab.is-open:hover {
  color: #e6edf3;
}

@keyframes fab-glow {
  0%, 100% {
    box-shadow:
      0 0 24px rgba(0, 255, 242, 0.35),
      0 0 48px rgba(96, 165, 250, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  50% {
    box-shadow:
      0 0 28px rgba(0, 255, 242, 0.45),
      0 0 56px rgba(96, 165, 250, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

.fab-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.fab-clippy {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.fab-icon svg {
  width: 22px;
  height: 22px;
}

.fab-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(0, 255, 242, 0.15), rgba(96, 165, 250, 0.15));
  animation: pulse 2.5s ease-in-out infinite;
  opacity: 0;
  z-index: 0;
}

.is-open .fab-pulse {
  display: none;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.15);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .ai-chat-fab {
    bottom: 16px;
    right: 16px;
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }

  .fab-icon {
    width: 32px;
    height: 32px;
  }

  .fab-icon svg {
    width: 20px;
    height: 20px;
  }

  .fab-pulse {
    border-radius: 14px;
  }
}
</style>
