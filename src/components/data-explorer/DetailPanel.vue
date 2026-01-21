<template>
  <Transition name="slide-in">
    <div
      v-if="isOpen"
      class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
    >
      <slot />
    </div>
    <div
      v-else
      class="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden"
    >
      <slot />
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
}>();
</script>

<style scoped>
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s ease-out;
}

.slide-in-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
