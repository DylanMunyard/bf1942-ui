<template>
  <Transition name="slide-in">
    <div
      v-if="isOpen"
      class="detail-panel detail-panel--open"
    >
      <slot />
    </div>
    <div
      v-else
      class="detail-panel"
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
.detail-panel {
  background: var(--bg-panel, #0d1117);
  border: 1px solid var(--border-color, #30363d);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.detail-panel--open {
  border-color: rgba(0, 255, 242, 0.2);
  box-shadow:
    0 0 30px rgba(0, 255, 242, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

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
