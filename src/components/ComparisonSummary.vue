<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  playerName: string;
  kdr: string;
  playerNumber: 1 | 2;
  isWinner: boolean;
}

const props = defineProps<Props>();

const gradientClass = computed(() => {
  return props.playerNumber === 1
    ? 'from-cyan-400 to-blue-400'
    : 'from-orange-400 to-red-400';
});

const kdrColorClass = computed(() => {
  return props.playerNumber === 1 ? 'text-cyan-400' : 'text-orange-400';
});
</script>

<template>
  <div
    class="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border transition-all duration-300"
    :class="{
      'border-green-500/70 shadow-green-500/20 shadow-2xl transform scale-105': isWinner,
      'border-slate-700/50': !isWinner
    }"
  >
    <!-- Winner Crown -->
    <div
      v-if="isWinner"
      class="absolute -top-3 left-1/2 transform -translate-x-1/2"
    >
      <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
        👑 WINNER
      </div>
    </div>
    
    <div class="p-6 text-center">
      <router-link 
        :to="`/players/${encodeURIComponent(playerName)}`"
        class="group block mb-4 hover:transform hover:scale-105 transition-all duration-300"
      >
        <h2 
          class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r transition-all duration-300 group-hover:from-cyan-300 group-hover:to-blue-300"
          :class="playerNumber === 1 
            ? 'from-cyan-400 to-blue-400 group-hover:from-cyan-300 group-hover:to-blue-300' 
            : 'from-orange-400 to-red-400 group-hover:from-orange-300 group-hover:to-red-300'"
        >
          {{ playerName }}
        </h2>
      </router-link>
      
      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <div 
          class="text-4xl font-bold mb-2"
          :class="kdrColorClass"
        >
          {{ kdr }}
        </div>
        <div class="text-sm text-slate-400 uppercase tracking-wide font-medium">
          Overall K/D Ratio
        </div>
      </div>
    </div>
  </div>
</template>
