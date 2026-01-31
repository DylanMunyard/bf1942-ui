<script setup lang="ts">
import { ref } from 'vue';

const showDropdown = ref(false);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

defineExpose({
  close: () => {
    showDropdown.value = false;
  },
});
</script>

<template>
  <div class="relative">
    <button
      class="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-[background-color,box-shadow,transform] duration-300 shadow-lg hover:shadow-green-500/30 transform hover:scale-105 will-change-transform"
      @click="toggleDropdown"
    >
      <span class="text-lg">🎮</span>
      <span class="hidden sm:inline">Get Online</span>
      <span class="sm:hidden">Install</span>
      <svg
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-180': showDropdown }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Installation Links Dropdown Menu -->
    <div
      v-if="showDropdown"
      class="absolute top-full mt-2 right-0 bg-gradient-to-br from-neutral-800/95 to-neutral-900/95 backdrop-blur-lg rounded-xl border border-neutral-700/50 shadow-2xl z-50 min-w-[280px] sm:min-w-[320px]"
    >
      <div class="p-2">
        <div class="px-4 py-2 text-sm font-medium text-neutral-400 border-b border-neutral-700/30 mb-2">
          🎯 Installation Guides
        </div>
        <a
          href="https://team-simple.org/download/"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 hover:bg-neutral-700/50 rounded-lg transition-all duration-200 group"
        >
          <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
            <span class="text-blue-400 text-sm">📦</span>
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-neutral-200 group-hover:text-blue-400">SiMPLE | BF1942 installers</div>
            <div class="text-xs text-neutral-500">Official installers and patches</div>
          </div>
          <span class="text-neutral-500 group-hover:text-blue-400 transition-colors">↗</span>
        </a>
        <a
          href="https://bf1942.online/guide/installation"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 hover:bg-neutral-700/50 rounded-lg transition-all duration-200 group"
        >
          <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
            <span class="text-green-400 text-sm">📋</span>
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-neutral-200 group-hover:text-green-400">BF1942 Online | Step-by-step</div>
            <div class="text-xs text-neutral-500">Complete installation guide</div>
          </div>
          <span class="text-neutral-500 group-hover:text-green-400 transition-colors">↗</span>
        </a>
        <a
          href="https://steamcommunity.com/sharedfiles/filedetails/?id=2721068159"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 hover:bg-neutral-700/50 rounded-lg transition-all duration-200 group"
        >
          <div class="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
            <span class="text-purple-400 text-sm">📚</span>
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-neutral-200 group-hover:text-purple-400">Steam Community | Wiki</div>
            <div class="text-xs text-neutral-500">Community installation wiki</div>
          </div>
          <span class="text-neutral-500 group-hover:text-purple-400 transition-colors">↗</span>
        </a>
      </div>
    </div>
  </div>
</template>
