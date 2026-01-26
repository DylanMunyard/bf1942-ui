<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-mobile-safe fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      :class="backdropClass"
      :style="{ zIndex }"
      @click="handleOverlayClick"
      @mousedown="handleOverlayMouseDown"
      @keydown.esc="handleClose"
    >
      <div
        ref="modalRef"
        class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-2xl w-full overflow-hidden"
        :class="[sizeClass, contentClass]"
        :style="{ maxHeight: maxHeight }"
        @click.stop
        @mousedown="handleModalMouseDown"
      >
        <!-- Header -->
        <div
          v-if="title || $slots.header"
          class="flex justify-between items-start p-6 border-b border-slate-700/50"
        >
          <div class="flex-1 min-w-0">
            <slot name="header">
              <h3 class="text-xl font-bold text-white m-0">
                {{ title }}
              </h3>
              <p
                v-if="subtitle"
                class="text-slate-400 text-sm mt-1 m-0"
              >
                {{ subtitle }}
              </p>
            </slot>
          </div>
          <button
            v-if="showCloseButton"
            type="button"
            class="flex-shrink-0 ml-4 text-slate-400 hover:text-white transition-colors duration-200 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50"
            aria-label="Close modal"
            @click="handleClose"
          >
            &times;
          </button>
        </div>

        <!-- Body -->
        <div
          class="overflow-y-auto"
          :class="[noPadding ? '' : 'p-6', bodyClass]"
          :style="{ maxHeight: bodyMaxHeight }"
        >
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="p-6 pt-0 border-t border-slate-700/50 mt-auto"
        >
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
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]'
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
