<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Props {
  fallbackRoute?: string;
  title?: string;
  onClick?: () => void;
  positioning?: 'standard' | 'compact' | 'left-of-icon';
}

const props = withDefaults(defineProps<Props>(), {
  fallbackRoute: '/',
  title: 'Go back',
  positioning: 'standard'
});

const router = useRouter();

const goBack = () => {
  if (props.onClick) {
    props.onClick();
  } else {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to specified route
      router.push(props.fallbackRoute);
    }
  }
};
</script>

<template>
  <button
    class="absolute z-50 group w-10 h-10 bg-neutral-800/80 hover:bg-neutral-700/90 backdrop-blur-sm border border-neutral-600/50 hover:border-cyan-400/50 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center hover:scale-110"
    :class="{
      'top-4 left-4 sm:top-6 sm:left-6': positioning === 'compact',
      'top-4 left-4 sm:top-8 sm:left-8 md:top-12 md:left-12': positioning === 'standard',
      'top-1/2 left-4 -translate-y-1/2 -translate-x-4': positioning === 'left-of-icon'
    }"
    :title="title"
    style="pointer-events: auto;"
    @click="goBack"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="text-neutral-300 group-hover:text-cyan-400 group-hover:-translate-x-0.5 transition-all duration-300"
    >
      <line
        x1="19"
        y1="12"
        x2="5"
        y2="12"
      />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  </button>
</template>