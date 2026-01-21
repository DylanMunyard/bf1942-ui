<template>
  <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 pb-4">
    <!-- Title Row -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-200">Data Explorer</h1>
        <p class="text-slate-400 text-sm mt-1">Browse servers and maps with detailed statistics</p>
      </div>

      <!-- Mode Toggle -->
      <div class="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
        <button
          @click="emit('update:mode', 'servers')"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
            mode === 'servers'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          ]"
        >
          Servers
        </button>
        <button
          @click="emit('update:mode', 'maps')"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
            mode === 'maps'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          ]"
        >
          Maps
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative group w-full max-w-md">
      <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
        <span class="text-slate-400">🔍</span>
      </div>
      <input
        :value="search"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        type="text"
        :placeholder="`Search ${mode}...`"
        class="w-full pl-12 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  mode: 'servers' | 'maps';
  search: string;
}>();

const emit = defineEmits<{
  (e: 'update:mode', value: 'servers' | 'maps'): void;
  (e: 'update:search', value: string): void;
}>();
</script>
