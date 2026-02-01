<script setup lang="ts">
import { computed } from 'vue';
import type { BattleHighlight } from '../../utils/battleEventGenerator';

interface Props {
  highlight: BattleHighlight;
  formatTimeOffset: (timestamp: string) => string;
}

const props = defineProps<Props>();

const highlightStyle = computed(() => {
  switch (props.highlight.type) {
    case 'first_blood':
      return {
        bg: 'from-red-500/20 to-red-600/10',
        border: 'border-red-500/40',
        glow: 'shadow-red-500/20',
        text: 'text-red-400',
      };
    case 'killing_spree':
      return {
        bg: 'from-orange-500/20 to-yellow-600/10',
        border: 'border-orange-500/40',
        glow: 'shadow-orange-500/20',
        text: 'text-orange-400',
      };
    case 'lead_change':
      return {
        bg: 'from-purple-500/20 to-blue-600/10',
        border: 'border-purple-500/40',
        glow: 'shadow-purple-500/20',
        text: 'text-purple-400',
      };
    case 'comeback':
      return {
        bg: 'from-green-500/20 to-emerald-600/10',
        border: 'border-green-500/40',
        glow: 'shadow-green-500/20',
        text: 'text-green-400',
      };
    case 'domination':
      return {
        bg: 'from-amber-500/20 to-orange-600/10',
        border: 'border-amber-500/40',
        glow: 'shadow-amber-500/20',
        text: 'text-amber-400',
      };
    case 'mvp':
      return {
        bg: 'from-yellow-500/20 to-amber-600/10',
        border: 'border-yellow-500/40',
        glow: 'shadow-yellow-500/20',
        text: 'text-yellow-400',
      };
    default:
      return {
        bg: 'from-slate-500/20 to-slate-600/10',
        border: 'border-slate-500/40',
        glow: 'shadow-slate-500/20',
        text: 'text-slate-400',
      };
  }
});

const typeLabel = computed(() => {
  switch (props.highlight.type) {
    case 'first_blood': return 'First Blood';
    case 'killing_spree': return 'Kill Streak';
    case 'lead_change': return 'Lead Change';
    case 'comeback': return 'Comeback';
    case 'domination': return 'Domination';
    case 'mvp': return 'MVP';
    default: return 'Highlight';
  }
});
</script>

<template>
  <div
    class="group relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] cursor-default bg-gradient-to-r shadow-lg"
    :class="[highlightStyle.bg, highlightStyle.border, highlightStyle.glow]"
  >
    <!-- Icon -->
    <div class="flex-shrink-0 text-2xl transform group-hover:scale-110 transition-transform duration-300">
      {{ highlight.icon }}
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <span
          class="text-xs font-bold uppercase tracking-wider"
          :class="highlightStyle.text"
        >
          {{ typeLabel }}
        </span>
        <span class="text-xs text-slate-500 font-mono">
          {{ formatTimeOffset(highlight.timestamp) }}
        </span>
      </div>
      <div class="text-sm text-slate-200 font-medium truncate">
        {{ highlight.playerName }}
      </div>
      <div class="text-xs text-slate-400 truncate">
        {{ highlight.description }}
      </div>
    </div>

    <!-- Value Badge -->
    <div
      v-if="highlight.value"
      class="flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold font-mono bg-slate-900/60"
      :class="highlightStyle.text"
    >
      {{ highlight.value }}
    </div>

    <!-- Decorative glow effect -->
    <div
      class="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r blur-xl -z-10"
      :class="highlightStyle.bg"
    />
  </div>
</template>
