<script setup lang="ts">
import discordLogo from '@/assets/discord.webp';
import youtubeLogo from '@/assets/youtube-logo.webp';
import twitchLogo from '@/assets/twitch.webp';

interface Props {
  discordUrl: string;
  youTubeUrl: string;
  twitchUrl: string;
  forumUrl: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:discordUrl': [value: string];
  'update:youTubeUrl': [value: string];
  'update:twitchUrl': [value: string];
  'update:forumUrl': [value: string];
}>();
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-3">
      Social Media Links <span class="text-slate-500">(Optional)</span>
    </label>
    <div class="space-y-3">
      <!-- Discord Link -->
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
          <img :src="discordLogo" alt="Discord" class="w-6 h-6 object-contain">
        </div>
        <input
          :model-value="discordUrl"
          type="url"
          placeholder="https://discord.gg/..."
          class="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          @input="(e) => $emit('update:discordUrl', (e.target as HTMLInputElement).value)"
        >
      </div>

      <!-- YouTube Link -->
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center overflow-hidden">
          <img :src="youtubeLogo" alt="YouTube" class="w-6 h-6 object-contain">
        </div>
        <input
          :model-value="youTubeUrl"
          type="url"
          placeholder="https://youtube.com/@..."
          class="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
          @input="(e) => $emit('update:youTubeUrl', (e.target as HTMLInputElement).value)"
        >
      </div>

      <!-- Twitch Link -->
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center overflow-hidden">
          <img :src="twitchLogo" alt="Twitch" class="w-6 h-6 object-contain">
        </div>
        <input
          :model-value="twitchUrl"
          type="url"
          placeholder="https://twitch.tv/..."
          class="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          @input="(e) => $emit('update:twitchUrl', (e.target as HTMLInputElement).value)"
        >
      </div>

      <!-- Forum Link -->
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <span class="text-orange-400 text-lg">📋</span>
        </div>
        <input
          :model-value="forumUrl"
          type="url"
          placeholder="https://..."
          class="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
          @input="(e) => $emit('update:forumUrl', (e.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>
