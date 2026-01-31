<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import { useSiteNotice } from '@/composables/useSiteNotice';

const { notice, isVisible, dismissNotice } = useSiteNotice();

const renderedContent = computed(() => {
  if (!notice.value?.content) return '';
  try {
    return marked(notice.value.content, { breaks: true });
  } catch {
    return notice.value.content;
  }
});

const bannerClass = computed(() => {
  const type = notice.value?.type || 'info';
  return `hacker-notice-banner hacker-notice-banner--${type}`;
});
</script>

<template>
  <Transition name="notice-slide">
    <div v-if="isVisible" :class="bannerClass">
      <div class="markdown-content" v-html="renderedContent" />
      <button
        v-if="notice?.dismissible"
        type="button"
        class="hacker-notice-dismiss"
        @click="dismissNotice"
        aria-label="Dismiss notice"
      >
        DISMISS
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.notice-slide-enter-active,
.notice-slide-leave-active {
  transition: all 0.3s ease;
}

.notice-slide-enter-from,
.notice-slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.markdown-content :deep(p) {
  margin: 0;
}

.markdown-content :deep(p + p) {
  margin-top: 0.5rem;
}

.markdown-content :deep(strong) {
  font-weight: 700;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
  font-size: 0.85em;
}
</style>
