<template>
  <article
    class="rounded-xl overflow-hidden border-2 transition-all"
    :style="{
      borderColor: featured ? accentColor : 'transparent',
      backgroundColor: backgroundSoftColor
    }"
  >
    <!-- Post header -->
    <div class="p-4 sm:p-6">
      <!-- Featured badge for first post -->
      <div v-if="featured" class="flex items-center gap-2 mb-3">
        <span
          class="px-2 py-1 text-xs font-semibold rounded-full"
          :style="{ backgroundColor: accentColor, color: getContrastText(accentColor) }"
        >
          Latest
        </span>
      </div>

      <!-- Title -->
      <h3
        class="text-lg sm:text-xl font-bold mb-2 cursor-pointer hover:opacity-80 transition-opacity"
        :style="{ color: textColor }"
        @click="toggleExpanded"
      >
        {{ post.title }}
      </h3>

      <!-- Meta info -->
      <div class="flex flex-wrap items-center gap-2 text-xs mb-4" :style="{ color: textMutedColor }">
        <span>{{ formatDate(post.publishAt || post.createdAt) }}</span>
      </div>

      <!-- Content -->
      <div
        class="prose prose-sm max-w-none markdown-content"
        :class="{ 'line-clamp-4': !featured && !expanded }"
        :style="{ color: textMutedColor }"
        v-html="renderedContent"
      />

      <!-- Read more / collapse button for non-featured posts -->
      <button
        v-if="!featured && hasMoreContent"
        class="mt-3 text-sm font-medium hover:opacity-80 transition-opacity"
        :style="{ color: accentColor }"
        @click="toggleExpanded"
      >
        {{ expanded ? 'Show less' : 'Read more' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { marked } from 'marked';
import type { FeedPostData } from '@/services/tournamentFeedService';

const props = defineProps<{
  post: FeedPostData;
  featured?: boolean;
  accentColor: string;
  textColor: string;
  textMutedColor: string;
  backgroundSoftColor: string;
}>();

const expanded = ref(false);

const renderedContent = computed(() => {
  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true
  });
  return marked.parse(props.post.content) as string;
});

const hasMoreContent = computed(() => {
  return props.post.content.length > 300 || props.post.content.split('\n').length > 4;
});

const toggleExpanded = () => {
  if (!props.featured) {
    expanded.value = !expanded.value;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const getContrastText = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};
</script>

<style scoped>
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Markdown content styling */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  color: v-bind(textColor);
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.markdown-content :deep(a) {
  color: v-bind(accentColor);
  text-decoration: underline;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
}

.markdown-content :deep(code) {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.markdown-content :deep(pre) {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid v-bind(accentColor);
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 0.75rem;
  opacity: 0.9;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}
</style>
