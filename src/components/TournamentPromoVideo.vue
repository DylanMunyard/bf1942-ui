<template>
  <div
    v-if="videoId"
    class="rounded-xl border p-6"
    :style="{
      borderColor: accentColor,
      backgroundColor: backgroundSoftColor
    }"
  >
    <h3
      class="text-lg font-semibold mb-4 flex items-center gap-2"
      :style="{ color: textColor }"
    >
      <svg class="w-5 h-5" :style="{ color: accentColor }" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      Promo Video
    </h3>
    <div class="aspect-video rounded-lg overflow-hidden">
      <iframe
        :src="`https://www.youtube.com/embed/${videoId}`"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="w-full h-full"
        frameborder="0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  videoUrl: string;
  accentColor?: string;
  textColor?: string;
  textMutedColor?: string;
  backgroundSoftColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: '#FFD700',
  textColor: '#FFFFFF',
  textMutedColor: '#d0d0d0',
  backgroundSoftColor: '#1a1a1a'
});

const videoId = computed(() => {
  if (!props.videoUrl) return null;
  return extractYouTubeVideoId(props.videoUrl);
});

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
</script>
