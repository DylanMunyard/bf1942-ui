<template>
  <Teleport to="body">
    <Transition name="slide-panel">
      <div
        v-if="open"
        class="slide-panel-overlay"
        @click.self="$emit('close')"
      >
        <div class="slide-panel" :class="[sizeClass]">
          <!-- Header -->
          <header class="slide-panel-header">
            <div>
              <h2 class="slide-panel-title">{{ title }}</h2>
              <p v-if="subtitle" class="slide-panel-subtitle">{{ subtitle }}</p>
            </div>
            <button
              class="slide-panel-close"
              @click="$emit('close')"
              title="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <!-- Content -->
          <div class="slide-panel-content">
            <slot />
          </div>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="slide-panel-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
});

defineEmits<{
  (e: 'close'): void;
}>();

const sizeClass = computed(() => {
  const sizes = {
    sm: 'slide-panel--sm',
    md: 'slide-panel--md',
    lg: 'slide-panel--lg',
    xl: 'slide-panel--xl'
  };
  return sizes[props.size];
});
</script>

<style scoped>
/* Portal CSS variables - must be defined here since content is teleported to body */
.slide-panel-overlay {
  --portal-bg: #06060a;
  --portal-surface: #0c0c12;
  --portal-surface-elevated: #111118;
  --portal-border: #1a1a24;
  --portal-border-focus: #2a2a38;
  --portal-accent: #00e5a0;
  --portal-accent-dim: rgba(0, 229, 160, 0.12);
  --portal-accent-glow: rgba(0, 229, 160, 0.25);
  --portal-warn: #f59e0b;
  --portal-danger: #ef4444;
  --portal-danger-glow: rgba(239, 68, 68, 0.2);
  --portal-text: #9ca3af;
  --portal-text-bright: #e5e7eb;

  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
}

.slide-panel {
  height: 100%;
  background: var(--portal-surface, #0c0c12);
  border-left: 1px solid var(--portal-border, #1a1a24);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.slide-panel--sm { width: 100%; max-width: 400px; }
.slide-panel--md { width: 100%; max-width: 500px; }
.slide-panel--lg { width: 100%; max-width: 640px; }
.slide-panel--xl { width: 100%; max-width: 800px; }

@media (max-width: 640px) {
  .slide-panel {
    max-width: 100% !important;
  }
}

.slide-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--portal-border, #1a1a24);
  background: var(--portal-surface-elevated, #111118);
}

.slide-panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--portal-accent, #00e5a0);
  margin: 0;
  letter-spacing: 0.02em;
}

.slide-panel-subtitle {
  font-size: 0.75rem;
  color: var(--portal-text, #9ca3af);
  margin: 0.25rem 0 0;
}

.slide-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  border: 1px solid var(--portal-border, #1a1a24);
  border-radius: 2px;
  color: var(--portal-text, #9ca3af);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.slide-panel-close:hover {
  background: var(--portal-accent-dim, rgba(0, 229, 160, 0.12));
  border-color: var(--portal-accent, #00e5a0);
  color: var(--portal-accent, #00e5a0);
}

.slide-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.slide-panel-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--portal-border, #1a1a24);
  background: var(--portal-surface-elevated, #111118);
}

/* Transition animations */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.2s ease;
}

.slide-panel-enter-active .slide-panel,
.slide-panel-leave-active .slide-panel {
  transition: transform 0.25s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-enter-from .slide-panel,
.slide-panel-leave-to .slide-panel {
  transform: translateX(100%);
}

/* Size utilities */
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
</style>
