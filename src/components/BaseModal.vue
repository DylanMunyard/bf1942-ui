<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-mobile-safe modal-backdrop"
      :class="backdropClass"
      :style="{ zIndex }"
      @click="handleOverlayClick"
      @mousedown="handleOverlayMouseDown"
      @keydown.esc="handleClose"
    >
      <div
        ref="modalRef"
        class="modal-container"
        :class="[sizeClass, contentClass]"
        :style="{ maxHeight: maxHeight }"
        @click.stop
        @mousedown="handleModalMouseDown"
      >
        <!-- Terminal Bar -->
        <div class="terminal-bar">
          <div class="terminal-dots">
            <span class="dot dot-red" />
            <span class="dot dot-yellow" />
            <span class="dot dot-green" />
          </div>
          <span class="terminal-title">{{ title || 'modal' }}</span>
          <button
            v-if="showCloseButton"
            type="button"
            class="btn-close"
            aria-label="Close modal"
            @click="handleClose"
          >
            [x]
          </button>
        </div>

        <!-- Header -->
        <div
          v-if="title || $slots.header"
          class="modal-header"
        >
          <div class="header-content">
            <slot name="header">
              <h3 class="modal-title">
                {{ title }}
              </h3>
              <p v-if="subtitle" class="modal-subtitle">
                // {{ subtitle }}
              </p>
            </slot>
          </div>
        </div>

        <!-- Body -->
        <div
          class="modal-body"
          :class="[noPadding ? 'no-padding' : '', bodyClass]"
          :style="{ maxHeight: bodyMaxHeight }"
        >
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  zIndex?: number;
  maxHeight?: string;
  noPadding?: boolean;
  backdropClass?: string;
  contentClass?: string;
  bodyClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  size: 'md',
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  zIndex: 1000,
  maxHeight: '90vh',
  noPadding: false,
  backdropClass: '',
  contentClass: '',
  bodyClass: ''
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const modalRef = ref<HTMLElement | null>(null);
const mouseDownInsideModal = ref(false);

const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'size-sm',
    md: 'size-md',
    lg: 'size-lg',
    xl: 'size-xl',
    full: 'size-full'
  };
  return sizes[props.size] || sizes.md;
});

const bodyMaxHeight = computed(() => {
  // Subtract approximate header height to prevent double scrollbars
  return `calc(${props.maxHeight} - 100px)`;
});

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleOverlayClick = () => {
  if (props.closeOnBackdrop && !mouseDownInsideModal.value) {
    handleClose();
  }
};

const handleModalMouseDown = () => {
  mouseDownInsideModal.value = true;
};

const handleOverlayMouseDown = () => {
  mouseDownInsideModal.value = false;
};

const handleEscapeKey = (e: KeyboardEvent) => {
  if (props.closeOnEscape && props.modelValue && e.key === 'Escape') {
    handleClose();
  }
};

// Lock body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-container {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  width: 100%;
  overflow: hidden;
  box-shadow:
    0 0 40px rgba(0, 255, 242, 0.1),
    0 25px 50px -12px rgba(0, 0, 0, 0.5);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  animation: modal-in 0.2s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Sizes */
.size-sm { max-width: 360px; }
.size-md { max-width: 500px; }
.size-lg { max-width: 680px; }
.size-xl { max-width: 900px; }
.size-full { max-width: 95vw; }

/* Terminal Bar */
.terminal-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(180deg, #1a1f26 0%, #0d1117 100%);
  border-bottom: 1px solid #30363d;
}

.terminal-dots {
  display: flex;
  gap: 5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.terminal-title {
  flex: 1;
  font-size: 0.7rem;
  color: #8b949e;
  text-transform: lowercase;
}

.btn-close {
  background: transparent;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: #ff3131;
  background: rgba(255, 49, 49, 0.1);
}

/* Header */
.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #30363d;
}

.header-content {
  min-width: 0;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #e6edf3;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.75rem;
  color: #6e7681;
  margin: 0.375rem 0 0 0;
  font-style: italic;
}

/* Body */
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-body.no-padding {
  padding: 0;
}

/* Footer */
.modal-footer {
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid #30363d;
}

/* Mobile */
@media (max-width: 480px) {
  .modal-backdrop {
    padding: 0.75rem;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    padding: 0 1rem 1rem;
  }

  .terminal-bar {
    padding: 0.5rem 0.75rem;
  }
}

/* Global styles for content inside modals */
:deep(.text-transparent) {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

:deep(.bg-gradient-to-r) {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

:deep(.from-cyan-400) {
  --tw-gradient-from: #00fff2;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(0, 255, 242, 0));
}

:deep(.to-blue-400) {
  --tw-gradient-to: #60a5fa;
}

:deep(.from-emerald-400) {
  --tw-gradient-from: #34d399;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(52, 211, 153, 0));
}

:deep(.to-cyan-400) {
  --tw-gradient-to: #00fff2;
}

:deep(.from-purple-400) {
  --tw-gradient-from: #c084fc;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(192, 132, 252, 0));
}

:deep(.to-pink-400) {
  --tw-gradient-to: #f472b6;
}
</style>
