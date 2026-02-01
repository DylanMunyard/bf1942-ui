<script setup lang="ts">
import { computed } from 'vue';
import type { RoundSummary } from '../../utils/battleEventGenerator';

interface Props {
  summary: RoundSummary;
}

const props = defineProps<Props>();

const kdColor = computed(() => {
  const kd = props.summary.avgKD;
  if (kd >= 1.5) return 'text-emerald-400';
  if (kd >= 1) return 'text-yellow-400';
  return 'text-orange-400';
});

const mvpKdColor = computed(() => {
  if (!props.summary.mvp) return 'text-slate-400';
  const kd = props.summary.mvp.kd;
  if (kd >= 2) return 'text-emerald-400';
  if (kd >= 1.5) return 'text-green-400';
  if (kd >= 1) return 'text-yellow-400';
  return 'text-orange-400';
});
</script>

<template>
  <div class="bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-700/50 bg-slate-900/40">
      <h3 class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider flex items-center gap-2">
        <span class="text-base">📊</span>
        Battle Statistics
      </h3>
    </div>

    <!-- Stats Grid -->
    <div class="p-4">
      <!-- Primary Stats Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <!-- Duration -->
        <div class="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Duration</div>
          <div class="text-lg font-bold text-cyan-400 font-mono">{{ summary.duration }}</div>
        </div>

        <!-- Total Kills -->
        <div class="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Kills</div>
          <div class="text-lg font-bold text-emerald-400 font-mono">{{ summary.totalKills }}</div>
        </div>

        <!-- Participants -->
        <div class="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Participants</div>
          <div class="text-lg font-bold text-blue-400 font-mono">{{ summary.participants }}</div>
        </div>

        <!-- Avg K/D -->
        <div class="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Avg K/D</div>
          <div class="text-lg font-bold font-mono" :class="kdColor">{{ summary.avgKD.toFixed(2) }}</div>
        </div>
      </div>

      <!-- Secondary Stats Row -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <!-- Lead Changes -->
        <div class="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Lead Changes</div>
          <div class="text-lg font-bold text-purple-400 font-mono">{{ summary.leadChanges }}</div>
        </div>

        <!-- Closest Gap -->
        <div class="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Closest Gap</div>
          <div class="text-lg font-bold text-orange-400 font-mono">{{ summary.closestGap }} pts</div>
        </div>
      </div>

      <!-- MVP Section -->
      <div v-if="summary.mvp" class="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🏆</span>
            <div>
              <div class="text-xs text-yellow-400/80 uppercase tracking-wide font-bold">MVP</div>
              <div class="text-lg font-bold text-yellow-400">{{ summary.mvp.playerName }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-slate-300">
              <span class="text-yellow-400 font-bold">{{ summary.mvp.score }}</span> pts
            </div>
            <div class="text-xs text-slate-400">
              {{ summary.mvp.kills }}/{{ summary.mvp.deaths }}
              <span :class="mvpKdColor" class="font-bold">({{ summary.mvp.kd.toFixed(1) }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Highlights Row -->
      <div v-if="summary.longestStreak || summary.firstBlood" class="mt-4 flex flex-wrap gap-3">
        <!-- First Blood -->
        <div v-if="summary.firstBlood" class="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span class="text-sm">🩸</span>
          <div class="text-xs">
            <span class="text-red-400 font-bold">First Blood</span>
            <span class="text-slate-400 ml-1">{{ summary.firstBlood.playerName }}</span>
          </div>
        </div>

        <!-- Longest Streak -->
        <div v-if="summary.longestStreak" class="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <span class="text-sm">🔥</span>
          <div class="text-xs">
            <span class="text-orange-400 font-bold">Best Streak</span>
            <span class="text-slate-400 ml-1">{{ summary.longestStreak.playerName }} ({{ summary.longestStreak.streak }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
