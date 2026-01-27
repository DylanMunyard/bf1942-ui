<script setup lang="ts">
import { ref, computed } from 'vue';

interface PerformanceStats {
  score: number;
  kills: number;
  deaths: number;
  playTimeMinutes?: number;
}

interface BucketTotal {
  bucket: 'Last30Days' | 'Last6Months' | 'LastYear' | 'AllTime';
  player1Totals: PerformanceStats;
  player2Totals: PerformanceStats;
}

interface Props {
  bucketTotals: BucketTotal[];
  player1Name: string;
  player2Name: string;
}

const props = defineProps<Props>();

const selectedTimePeriod = ref<'Last30Days' | 'Last6Months' | 'LastYear' | 'AllTime'>('Last30Days');
const timePeriodOptions = [
  { value: 'Last30Days', label: 'Last 30 Days' },
  { value: 'Last6Months', label: 'Last 6 Months' },
  { value: 'LastYear', label: 'Last Year' },
  { value: 'AllTime', label: 'All Time' },
] as const;

const getPerformanceData = (bucket: string) => {
  return props.bucketTotals.find(bt => bt.bucket === bucket);
};

const calculateDelta = (value1: number, value2: number, decimals: number = 0): string => {
  const higher = Math.max(value1, value2);
  const lower = Math.min(value1, value2);
  const diff = higher - lower;
  return decimals > 0 ? `+ ${diff.toFixed(decimals)}` : `+ ${Math.round(diff)}`;
};

const calculateTimeDelta = (value1: number, value2: number): string => {
  const higher = Math.max(value1, value2);
  const lower = Math.min(value1, value2);
  const diffMinutes = higher - lower;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) {
    return `+ ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `+ ${days}d ${hours % 24}h`;
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const getHigherValue = (value1: number, value2: number): 'p1' | 'p2' | 'tie' => {
  if (value1 > value2) return 'p1';
  if (value2 > value1) return 'p2';
  return 'tie';
};

const currentData = computed(() => getPerformanceData(selectedTimePeriod.value));
</script>

<template>
  <div
    v-if="bucketTotals && bucketTotals.length > 0"
    class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
  >
    <div class="p-6 border-b border-slate-700/50">
      <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center gap-3">
        📈 Performance Over Time
      </h3>
    </div>
    <div class="p-6">
      <!-- Time Period Tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button 
          v-for="period in timePeriodOptions" 
          :key="period.value"
          class="px-4 py-2 rounded-lg border transition-all duration-300 font-medium text-sm"
          :class="{
            'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-500 shadow-lg': selectedTimePeriod === period.value,
            'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-700/80 hover:border-yellow-500/50 hover:text-white': selectedTimePeriod !== period.value
          }"
          @click="selectedTimePeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>
      
      <!-- Performance Data Grid -->
      <div
        v-if="currentData"
        class="space-y-6"
      >
        <!-- Headers -->
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="text-sm font-bold text-slate-400 uppercase tracking-wide">
            Metric
          </div>
          <div class="text-sm font-bold text-cyan-400 uppercase tracking-wide">
            {{ player1Name }}
          </div>
          <div class="text-sm font-bold text-orange-400 uppercase tracking-wide">
            {{ player2Name }}
          </div>
        </div>
        
        <!-- Stats Rows -->
        <div class="space-y-4">
          <!-- Score -->
          <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
            <div class="text-slate-300 font-medium flex items-center gap-2">
              🎖️ Score
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.score, currentData.player2Totals.score) === 'p1',
                  'text-cyan-400': getHigherValue(currentData.player1Totals.score, currentData.player2Totals.score) !== 'p1'
                }"
              >
                {{ currentData.player1Totals.score?.toLocaleString() }}
              </div>
              <div
                v-if="getHigherValue(currentData.player1Totals.score, currentData.player2Totals.score) === 'p1'"
                class="text-xs text-green-300 font-medium"
              >
                +{{ calculateDelta(currentData.player1Totals.score, currentData.player2Totals.score).substring(2) }}
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.score, currentData.player2Totals.score) === 'p2',
                  'text-orange-400': getHigherValue(currentData.player1Totals.score, currentData.player2Totals.score) !== 'p2'
                }"
              >
                {{ currentData.player2Totals.score?.toLocaleString() }}
              </div>
              <div
                v-if="getHigherValue(currentData.player1Totals.score, currentData.player2Totals.score) === 'p2'"
                class="text-xs text-green-300 font-medium"
              >
                +{{ calculateDelta(currentData.player1Totals.score, currentData.player2Totals.score).substring(2) }}
              </div>
            </div>
          </div>
          
          <!-- Kills -->
          <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
            <div class="text-slate-300 font-medium flex items-center gap-2">
              ⚔️ Kills
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.kills, currentData.player2Totals.kills) === 'p1',
                  'text-cyan-400': getHigherValue(currentData.player1Totals.kills, currentData.player2Totals.kills) !== 'p1'
                }"
              >
                {{ currentData.player1Totals.kills?.toLocaleString() }}
              </div>
              <div
                v-if="getHigherValue(currentData.player1Totals.kills, currentData.player2Totals.kills) === 'p1'"
                class="text-xs text-green-300 font-medium"
              >
                +{{ calculateDelta(currentData.player1Totals.kills, currentData.player2Totals.kills).substring(2) }}
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.kills, currentData.player2Totals.kills) === 'p2',
                  'text-orange-400': getHigherValue(currentData.player1Totals.kills, currentData.player2Totals.kills) !== 'p2'
                }"
              >
                {{ currentData.player2Totals.kills?.toLocaleString() }}
              </div>
              <div
                v-if="getHigherValue(currentData.player1Totals.kills, currentData.player2Totals.kills) === 'p2'"
                class="text-xs text-green-300 font-medium"
              >
                +{{ calculateDelta(currentData.player1Totals.kills, currentData.player2Totals.kills).substring(2) }}
              </div>
            </div>
          </div>
          
          <!-- Deaths (lower is better) -->
          <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
            <div class="text-slate-300 font-medium flex items-center gap-2">
              ☠️ Deaths
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.deaths, currentData.player2Totals.deaths) === 'p2',
                  'text-cyan-400': getHigherValue(currentData.player1Totals.deaths, currentData.player2Totals.deaths) !== 'p2'
                }"
              >
                {{ currentData.player1Totals.deaths?.toLocaleString() }}
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.deaths, currentData.player2Totals.deaths) === 'p1',
                  'text-orange-400': getHigherValue(currentData.player1Totals.deaths, currentData.player2Totals.deaths) !== 'p1'
                }"
              >
                {{ currentData.player2Totals.deaths?.toLocaleString() }}
              </div>
            </div>
          </div>
          
          <!-- Play Time -->
          <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
            <div class="text-slate-300 font-medium flex items-center gap-2">
              ⏰ Play Time
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) === 'p1',
                  'text-cyan-400': getHigherValue(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) !== 'p1'
                }"
              >
                {{ formatPlayTime(currentData.player1Totals.playTimeMinutes || 0) }}
              </div>
              <div
                v-if="getHigherValue(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) === 'p1'"
                class="text-xs text-green-300 font-medium"
              >
                {{ calculateTimeDelta(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) }} more
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-xl font-bold"
                :class="{
                  'text-green-400': getHigherValue(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) === 'p2',
                  'text-orange-400': getHigherValue(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) !== 'p2'
                }"
              >
                {{ formatPlayTime(currentData.player2Totals.playTimeMinutes || 0) }}
              </div>
              <div
                v-if="getHigherValue(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) === 'p2'"
                class="text-xs text-green-300 font-medium"
              >
                {{ calculateTimeDelta(currentData.player1Totals.playTimeMinutes || 0, currentData.player2Totals.playTimeMinutes || 0) }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
