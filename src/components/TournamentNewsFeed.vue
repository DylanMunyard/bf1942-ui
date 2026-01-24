<template>
  <div class="tournament-news-feed">
    <!-- Loading State -->
    <div v-if="loading && items.length === 0" class="flex flex-col items-center justify-center py-16">
      <div
        class="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4"
        :style="{ borderColor: accentColor, borderTopColor: 'transparent' }"
      />
      <p class="text-sm" :style="{ color: textMutedColor }">Loading news feed...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error && items.length === 0"
      class="rounded-xl p-8 text-center border"
      :style="{ backgroundColor: backgroundSoftColor, borderColor: 'transparent' }"
    >
      <div class="text-4xl mb-4 opacity-50">📰</div>
      <h3 class="text-lg font-semibold mb-2" :style="{ color: textColor }">
        Unable to Load Feed
      </h3>
      <p class="text-sm mb-4" :style="{ color: textMutedColor }">{{ error }}</p>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
        :style="{ backgroundColor: accentColor, color: getContrastText(accentColor) }"
        @click="loadFeed(true)"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading && items.length === 0"
      class="rounded-xl p-8 text-center border"
      :style="{ backgroundColor: backgroundSoftColor, borderColor: 'transparent' }"
    >
      <div class="text-4xl mb-4 opacity-50">📰</div>
      <h3 class="text-lg font-semibold mb-2" :style="{ color: textColor }">
        No News Yet
      </h3>
      <p class="text-sm" :style="{ color: textMutedColor }">
        Stay tuned for tournament updates, match results, and announcements.
      </p>
    </div>

    <!-- Feed Content -->
    <div v-else class="space-y-6">
      <!-- Featured Post (Latest Post) -->
      <div v-if="featuredPost" class="mb-8">
        <TournamentFeedPost
          :post="featuredPost"
          :featured="true"
          :accent-color="accentColor"
          :text-color="textColor"
          :text-muted-color="textMutedColor"
          :background-soft-color="backgroundSoftColor"
        />
      </div>

      <!-- Timeline Section Header -->
      <div v-if="timelineItems.length > 0" class="flex items-center gap-3 mb-4">
        <div class="h-px flex-grow" :style="{ backgroundColor: getAccentWithOpacity(0.2) }" />
        <span class="text-xs font-medium uppercase tracking-wider" :style="{ color: textMutedColor }">
          Earlier Updates
        </span>
        <div class="h-px flex-grow" :style="{ backgroundColor: getAccentWithOpacity(0.2) }" />
      </div>

      <!-- Timeline Items -->
      <div class="space-y-4">
        <template v-for="item in timelineItems" :key="getItemKey(item)">
          <!-- Post (not featured) -->
          <TournamentFeedPost
            v-if="item.type === 'post' && isPostData(item.data)"
            :post="item.data"
            :featured="false"
            :accent-color="accentColor"
            :text-color="textColor"
            :text-muted-color="textMutedColor"
            :background-soft-color="backgroundSoftColor"
          />

          <!-- System Events -->
          <TournamentFeedEvent
            v-else
            :item="item"
            :accent-color="accentColor"
            :text-color="textColor"
            :text-muted-color="textMutedColor"
            :background-soft-color="backgroundSoftColor"
          />
        </template>
      </div>

      <!-- Load More Trigger (Infinite Scroll) -->
      <div
        ref="loadMoreTrigger"
        class="flex items-center justify-center py-8"
      >
        <!-- Loading indicator while fetching more -->
        <div v-if="loading" class="flex items-center gap-3">
          <div
            class="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            :style="{ borderColor: accentColor, borderTopColor: 'transparent' }"
          />
          <span class="text-sm" :style="{ color: textMutedColor }">Loading more...</span>
        </div>

        <!-- End of feed message -->
        <div v-else-if="!hasMore" class="text-center">
          <div class="flex items-center justify-center gap-4 mb-2">
            <div class="h-px w-8" :style="{ backgroundColor: getAccentWithOpacity(0.3) }" />
            <div class="w-2 h-2 rotate-45" :style="{ backgroundColor: accentColor }" />
            <div class="h-px w-8" :style="{ backgroundColor: getAccentWithOpacity(0.3) }" />
          </div>
          <span class="text-xs" :style="{ color: textMutedColor }">You've reached the beginning</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import TournamentFeedPost from './TournamentFeedPost.vue';
import TournamentFeedEvent from './TournamentFeedEvent.vue';
import {
  tournamentFeedService,
  isPostData,
  type FeedItem,
  type FeedPostData
} from '@/services/tournamentFeedService';

const props = defineProps<{
  tournamentId: string | number;
  accentColor: string;
  textColor: string;
  textMutedColor: string;
  backgroundSoftColor: string;
}>();

// State
const items = ref<FeedItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const hasMore = ref(true);
const nextCursor = ref<string | null>(null);

// Infinite scroll refs
const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// Computed properties
const featuredPost = computed<FeedPostData | null>(() => {
  // Find the first post item
  const firstPost = items.value.find(item => item.type === 'post' && isPostData(item.data));
  if (firstPost && isPostData(firstPost.data)) {
    return firstPost.data;
  }
  return null;
});

const timelineItems = computed<FeedItem[]>(() => {
  // Skip the first post (featured) and return the rest
  let skippedFeatured = false;
  return items.value.filter(item => {
    if (!skippedFeatured && item.type === 'post' && isPostData(item.data)) {
      skippedFeatured = true;
      return false;
    }
    return true;
  });
});

// Helper functions
const getItemKey = (item: FeedItem): string => {
  if (item.type === 'post' && isPostData(item.data)) {
    return `post-${item.data.id}`;
  }
  if (item.type === 'match_result' && 'resultId' in item.data) {
    return `match-result-${item.data.resultId}`;
  }
  if (item.type === 'team_created' && 'teamId' in item.data) {
    return `team-${item.data.teamId}`;
  }
  if (item.type === 'match_scheduled' && 'matchId' in item.data) {
    return `match-scheduled-${item.data.matchId}`;
  }
  return `${item.type}-${item.timestamp}`;
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

const getAccentWithOpacity = (opacity: number): string => {
  const rgb = hexToRgb(props.accentColor);
  if (!rgb) return `rgba(255, 215, 0, ${opacity})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

// Load feed data
const loadFeed = async (reset = false) => {
  if (loading.value) return;
  if (!reset && !hasMore.value) return;

  loading.value = true;
  error.value = null;

  try {
    const cursor = reset ? undefined : nextCursor.value ?? undefined;
    const response = await tournamentFeedService.getFeed(props.tournamentId, cursor, 10);

    if (reset) {
      items.value = response.items;
    } else {
      items.value = [...items.value, ...response.items];
    }

    nextCursor.value = response.nextCursor;
    hasMore.value = response.hasMore;
  } catch (err) {
    console.error('Error loading feed:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load feed';
  } finally {
    loading.value = false;
  }
};

// Setup IntersectionObserver for infinite scroll
const setupObserver = () => {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        loadFeed();
      }
    },
    { threshold: 0.1 }
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
};

// Watch for trigger element changes
watch(loadMoreTrigger, (newTrigger) => {
  if (newTrigger && observer) {
    observer.observe(newTrigger);
  }
});

// Watch for tournament changes
watch(() => props.tournamentId, () => {
  loadFeed(true);
});

// Lifecycle
onMounted(() => {
  loadFeed(true);
  setupObserver();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<style scoped>
.tournament-news-feed {
  width: 100%;
}
</style>
