<script setup lang="ts">
import { ref, computed } from 'vue';
import PlayerHistoryChart from './PlayerHistoryChart.vue';
import type { PlayerHistoryDataPoint, PlayerHistoryInsights } from '../types/playerStatsTypes';

interface Props {
  activeGameName: string;
  playerHistoryData: PlayerHistoryDataPoint[];
  playerHistoryInsights: PlayerHistoryInsights | null;
  historyPeriod: '1d' | '3d' | '7d' | 'longer';
  longerPeriod: '1month' | '3months' | 'thisyear' | 'alltime';
  historyRollingWindow: string;
  historyLoading: boolean;
  historyError: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'toggle': [];
  'period-change': [period: '1d' | '3d' | '7d'];
  'longer-period-change': [period: '1month' | '3months' | 'thisyear' | 'alltime'];
  'rolling-window-change': [rollingWindow: string];
}>();

const showPlayerHistory = ref(false);
const showLongerDropdown = ref(false);

const togglePlayerHistory = () => {
  showPlayerHistory.value = !showPlayerHistory.value;
  emit('toggle');
};

const changePeriod = (period: '1d' | '3d' | '7d') => {
  emit('period-change', period);
  showLongerDropdown.value = false;
};

const toggleLongerDropdown = () => {
  showLongerDropdown.value = !showLongerDropdown.value;
};

const selectLongerPeriod = (period: '1month' | '3months' | 'thisyear' | 'alltime') => {
  emit('longer-period-change', period);
  showLongerDropdown.value = false;
};

const getLongerPeriodLabel = () => {
  if (props.historyPeriod !== 'longer') return 'More';
  const labels = {
    '1month': '1 Month',
    '3months': '3 Months', 
    'thisyear': 'This Year',
    'alltime': 'All Time'
  };
  return labels[props.longerPeriod];
};

const getCurrentPeriod = () => {
  return props.historyPeriod === 'longer' ? props.longerPeriod : props.historyPeriod;
};

const changeRollingWindow = (rollingWindow: string) => {
  emit('rolling-window-change', rollingWindow);
};

defineExpose({
  show: computed(() => showPlayerHistory.value),
  setShow: (value: boolean) => {
    showPlayerHistory.value = value;
  },
});
</script>

<template>
  <div class="border-b border-neutral-700/30">
    <!-- Toggle Button -->
    <div class="p-3">
      <button
        class="w-full flex items-center justify-between p-3 bg-neutral-800/30 hover:bg-neutral-700/50 rounded-lg border border-neutral-700/50 transition-all duration-300 group"
        @click="togglePlayerHistory"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
            <span class="text-neutral-900 text-sm font-bold">📈</span>
          </div>
          <div class="text-left">
            <div class="text-sm font-medium text-neutral-200">
              Player Activity History
            </div>
            <div class="text-xs text-neutral-400">
              {{ activeGameName }} population trends
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-neutral-400 hidden sm:block">{{ showPlayerHistory ? 'Hide' : 'Show' }}</span>
          <div
            class="transform transition-transform duration-300"
            :class="{ 'rotate-180': showPlayerHistory }"
          >
            <svg
              class="w-5 h-5 text-neutral-400 group-hover:text-cyan-400"
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
          </div>
        </div>
      </button>
    </div>

    <!-- Collapsible History Content -->
    <div 
      v-if="showPlayerHistory" 
      class="px-3 pb-3 space-y-3 animate-in slide-in-from-top duration-300"
    >
      <!-- Enhanced Period Selector -->
      <div class="flex justify-center gap-1 bg-neutral-800/30 rounded-lg p-1">
        <!-- Short periods -->
        <button
          v-for="period in ['1d', '3d', '7d']"
          :key="period"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
            historyPeriod === period
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
          ]"
          @click="changePeriod(period as '1d' | '3d' | '7d')"
        >
          {{ period === '1d' ? '24h' : period === '3d' ? '3 days' : '7 days' }}
        </button>
        
        <!-- Longer periods dropdown -->
        <div class="relative">
          <button
            :class="[
              'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1',
              historyPeriod === 'longer'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
            ]"
            @click="toggleLongerDropdown"
          >
            {{ getLongerPeriodLabel() }}
            <svg
              class="w-3 h-3"
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
          
          <!-- Dropdown menu -->
          <div
            v-if="showLongerDropdown"
            class="absolute top-full mt-1 right-0 bg-neutral-800/95 backdrop-blur-lg rounded-lg border border-neutral-700/50 shadow-xl z-50 min-w-[120px]"
          >
            <button
              v-for="period in [{ id: '1month', label: '1 Month' }, { id: '3months', label: '3 Months' }, { id: 'thisyear', label: 'This Year' }, { id: 'alltime', label: 'All Time' }]"
              :key="period.id"
              :class="[
                'w-full text-left px-3 py-2 text-xs hover:bg-neutral-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg',
                longerPeriod === period.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-300'
              ]"
              @click="selectLongerPeriod(period.id as '1month' | '3months' | 'thisyear' | 'alltime')"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Chart Container -->
      <div class="bg-neutral-800/20 rounded-lg p-4">
        <PlayerHistoryChart
          :chart-data="playerHistoryData"
          :insights="playerHistoryInsights"
          :period="getCurrentPeriod()"
          :rolling-window="historyRollingWindow"
          :loading="historyLoading"
          :error="historyError"
          @rolling-window-change="changeRollingWindow"
        />
      </div>
    </div>
  </div>
</template>
