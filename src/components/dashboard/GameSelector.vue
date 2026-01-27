<script setup lang="ts">
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

interface Props {
  modelValue: 'bf1942' | 'fh2' | 'bfvietnam';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: 'bf1942' | 'fh2' | 'bfvietnam'];
}>();

const games = [
  { id: 'bf1942', name: 'BF1942', icon: bf1942Icon },
  { id: 'fh2', name: 'FH2', icon: fh2Icon },
  { id: 'bfvietnam', name: 'BF Vietnam', icon: bfvIcon }
];
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-2">
      Game <span class="text-red-400">*</span>
    </label>
    <div class="flex items-center gap-2">
      <button
        v-for="game in games"
        :key="game.id"
        type="button"
        :class="[
          'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 flex-1',
          modelValue === game.id
            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 ring-2 ring-cyan-500/30'
            : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
        ]"
        @click="$emit('update:modelValue', game.id as 'bf1942' | 'fh2' | 'bfvietnam')"
      >
        <div
          class="w-6 h-6 rounded bg-cover bg-center"
          :style="{ backgroundImage: `url('${game.icon}')` }"
        />
        <span class="text-sm font-medium">{{ game.name }}</span>
      </button>
    </div>
  </div>
</template>
