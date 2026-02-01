<template>
  <button
    class="ai-chat-fab"
    :class="{ 'is-open': isOpen }"
    :aria-label="isOpen ? 'Close AI Chat' : 'Open AI Chat'"
    @click="$emit('click')"
  >
    <span class="fab-icon">
      <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h.01" />
        <path d="M12 10h.01" />
        <path d="M16 10h.01" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </span>
    <span class="fab-pulse" />
  </button>
</template>

<script setup lang="ts">
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
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #00fff2 0%, #60a5fa 100%);
  color: #0d1117;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 20px rgba(0, 255, 242, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
}

.ai-chat-fab:hover {
  transform: scale(1.1);
  box-shadow:
    0 6px 30px rgba(0, 255, 242, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.4);
}

.ai-chat-fab:active {
  transform: scale(0.95);
}

.ai-chat-fab.is-open {
  background: linear-gradient(135deg, #30363d 0%, #21262d 100%);
  color: #8b949e;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3);
}

.ai-chat-fab.is-open:hover {
  color: #e6edf3;
}

.fab-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.fab-icon svg {
  width: 100%;
  height: 100%;
}

.fab-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #00fff2 0%, #60a5fa 100%);
  animation: pulse 2s ease-in-out infinite;
  opacity: 0;
  z-index: 0;
}

.is-open .fab-pulse {
  display: none;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
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
    width: 48px;
    height: 48px;
  }

  .fab-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
