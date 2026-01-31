<script setup lang="ts">
interface Props {
  player1Name: string;
  player2Name: string;
  player1KillRate: number;
  player2KillRate: number;
  player1AveragePing: number;
  player2AveragePing: number;
}

const props = defineProps<Props>();

const getHigherValue = (value1: number, value2: number): 'p1' | 'p2' | 'tie' => {
  if (value1 > value2) return 'p1';
  if (value2 > value1) return 'p2';
  return 'tie';
};

const calculateDelta = (value1: number, value2: number, decimals: number = 0): string => {
  const higher = Math.max(value1, value2);
  const lower = Math.min(value1, value2);
  const diff = higher - lower;
  return decimals > 0 ? `+ ${diff.toFixed(decimals)}` : `+ ${Math.round(diff)}`;
};
</script>

<template>
  <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <h3 class="text-2xl font-bold text-cyan-400 flex items-center gap-3">
        Core Statistics
      </h3>
    </div>
    <div class="p-6">
      <div class="space-y-8">
        <!-- Kill Rate -->
        <div class="text-center">
          <div class="text-lg font-bold text-slate-300 mb-4">
            🎯 Kill Rate (per minute)
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div
              class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
              :class="{
                'border-green-500/70 shadow-green-500/20 shadow-lg': player1KillRate > player2KillRate,
                'border-slate-700/50': player1KillRate <= player2KillRate
              }"
            >
              <div
                class="text-3xl font-bold mb-2"
                :class="{
                  'text-green-400': player1KillRate > player2KillRate,
                  'text-cyan-400': player1KillRate <= player2KillRate
                }"
              >
                {{ player1KillRate.toFixed(2) }}
              </div>
              <div
                v-if="getHigherValue(player1KillRate, player2KillRate) === 'p1' && player1KillRate !== player2KillRate" 
                class="text-sm text-green-300 font-medium"
              >
                +{{ calculateDelta(player1KillRate, player2KillRate, 2).substring(2) }} better
              </div>
              <div class="text-xs text-slate-400 uppercase tracking-wide font-medium mt-1">
                {{ player1Name }}
              </div>
            </div>
            
            <div
              class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
              :class="{
                'border-green-500/70 shadow-green-500/20 shadow-lg': player2KillRate > player1KillRate,
                'border-slate-700/50': player2KillRate <= player1KillRate
              }"
            >
              <div
                class="text-3xl font-bold mb-2"
                :class="{
                  'text-green-400': player2KillRate > player1KillRate,
                  'text-orange-400': player2KillRate <= player1KillRate
                }"
              >
                {{ player2KillRate.toFixed(2) }}
              </div>
              <div
                v-if="getHigherValue(player1KillRate, player2KillRate) === 'p2' && player1KillRate !== player2KillRate" 
                class="text-sm text-green-300 font-medium"
              >
                +{{ calculateDelta(player1KillRate, player2KillRate, 2).substring(2) }} better
              </div>
              <div class="text-xs text-slate-400 uppercase tracking-wide font-medium mt-1">
                {{ player2Name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Average Ping -->
        <div class="text-center">
          <div class="text-lg font-bold text-slate-300 mb-4">
            📡 Average Ping (lower is better)
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div
              class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
              :class="{
                'border-green-500/70 shadow-green-500/20 shadow-lg': player1AveragePing < player2AveragePing,
                'border-slate-700/50': player1AveragePing >= player2AveragePing
              }"
            >
              <div
                class="text-3xl font-bold mb-2"
                :class="{
                  'text-green-400': player1AveragePing < player2AveragePing,
                  'text-cyan-400': player1AveragePing >= player2AveragePing
                }"
              >
                {{ Math.round(player1AveragePing) }}ms
              </div>
              <div class="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {{ player1Name }}
              </div>
            </div>
            
            <div
              class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
              :class="{
                'border-green-500/70 shadow-green-500/20 shadow-lg': player2AveragePing < player1AveragePing,
                'border-slate-700/50': player2AveragePing >= player1AveragePing
              }"
            >
              <div
                class="text-3xl font-bold mb-2"
                :class="{
                  'text-green-400': player2AveragePing < player1AveragePing,
                  'text-orange-400': player2AveragePing >= player1AveragePing
                }"
              >
                {{ Math.round(player2AveragePing) }}ms
              </div>
              <div class="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {{ player2Name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
