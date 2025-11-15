<script setup lang="ts">
import { ref, watch } from 'vue';
import { fetchPlayerOnlineHistory } from '../../services/playerStatsService';
import { PlayerHistoryDataPoint, PlayerHistoryInsights } from '../../types/playerStatsTypes';
import PlayerHistoryChart from '../PlayerHistoryChart.vue';

interface Props {
  activeFilter: string;
  gameTypes: Array<{ id: string; name: string; iconClass: string }>;
}

const props = defineProps<Props>();

// State
const showPlayerHistory = ref(false);
const playerHistoryData = ref<PlayerHistoryDataPoint[]>([]);
const playerHistoryInsights = ref<PlayerHistoryInsights | null>(null);
const historyPeriod = ref<'1d' | '3d' | '7d' | 'longer'>('1d');
const longerPeriod = ref<'1month' | '3months' | 'thisyear' | 'alltime'>('1month');
const historyRollingWindow = ref('7d');
const historyLoading = ref(false);
const historyError = ref<string | null>(null);
const showLongerDropdown = ref(false);

// Helper functions
const getRollingWindowDays = (rollingWindow: string): number => {
  switch (rollingWindow) {
    case '7d':
      return 7;
    case '14d':
      return 14;
    case '30d':
      return 30;
    default:
      return 7;
  }
};

const getCurrentPeriod = () => {
  return historyPeriod.value === 'longer' ? longerPeriod.value : historyPeriod.value;
};

const getCurrentPeriodForAPI = (): string => {
  if (historyPeriod.value === 'longer') {
    return longerPeriod.value;
  }
  return historyPeriod.value;
};

const getActiveGameName = () => {
  const gameType = props.gameTypes.find(g => g.id === props.activeFilter);
  return gameType?.name || 'Game';
};

const getLongerPeriodLabel = () => {
  if (historyPeriod.value !== 'longer') return 'More';
  const labels = {
    '1month': '1 Month',
    '3months': '3 Months',
    'thisyear': 'This Year',
    'alltime': 'All Time'
  };
  return labels[longerPeriod.value];
};

// API methods
const fetchPlayerHistory = async () => {
  historyLoading.value = true;
  historyError.value = null;

  try {
    const currentPeriod = getCurrentPeriod();
    const apiPeriod = getCurrentPeriodForAPI();

    const response = await fetchPlayerOnlineHistory(
      props.activeFilter as 'bf1942' | 'fh2' | 'bfvietnam',
      apiPeriod,
      getRollingWindowDays(historyRollingWindow.value)
    );

    // Set the response data - only update if we have valid data
    if (response.dataPoints && response.dataPoints.length > 0) {
      playerHistoryData.value = response.dataPoints;
    }
    if (response.insights) {
      playerHistoryInsights.value = response.insights;
    }
  } catch (err) {
    historyError.value = 'Failed to load player history';
    // Only clear data on error, not during normal updates
    if (playerHistoryData.value.length === 0) {
      playerHistoryData.value = [];
      playerHistoryInsights.value = null;
    }
  } finally {
    historyLoading.value = false;
  }
};

// User interaction methods
const togglePlayerHistory = () => {
  showPlayerHistory.value = !showPlayerHistory.value;
  if (showPlayerHistory.value && playerHistoryData.value.length === 0) {
    fetchPlayerHistory();
  }
};

const changePeriod = (period: '1d' | '3d' | '7d') => {
  historyPeriod.value = period;
  showLongerDropdown.value = false;
  fetchPlayerHistory();
};

const changeRollingWindow = (rollingWindow: string) => {
  historyRollingWindow.value = rollingWindow;
  fetchPlayerHistory();
};

const toggleLongerDropdown = () => {
  showLongerDropdown.value = !showLongerDropdown.value;
};

const selectLongerPeriod = (period: '1month' | '3months' | 'thisyear' | 'alltime') => {
  longerPeriod.value = period;
  historyPeriod.value = 'longer';
  showLongerDropdown.value = false;
  fetchPlayerHistory();
};

// Watch for game filter changes and refetch data
watch(() => props.activeFilter, () => {
  if (showPlayerHistory.value && playerHistoryData.value.length > 0) {
    fetchPlayerHistory();
  }
});
</script>

<template>
  <!-- Player History Section -->
  <div class="border-b border-slate-700/30">
    <!-- Toggle Button -->
    <div class="p-3">
      <button
        class="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-all duration-300 group"
        @click="togglePlayerHistory"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
            <span class="text-slate-900 text-sm font-bold">📈</span>
          </div>
          <div class="text-left">
            <div class="text-sm font-medium text-slate-200">
              Player Activity History
            </div>
            <div class="text-xs text-slate-400">
              {{ getActiveGameName() }} population trends
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400 hidden sm:block">{{ showPlayerHistory ? 'Hide' : 'Show' }}</span>
          <div
            class="transform transition-transform duration-300"
            :class="{ 'rotate-180': showPlayerHistory }"
          >
            <svg
              class="w-5 h-5 text-slate-400 group-hover:text-cyan-400"
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
      <div class="flex justify-center gap-1 bg-slate-800/30 rounded-lg p-1">
        <!-- Short periods -->
        <button
          v-for="period in ['1d', '3d', '7d']"
          :key="period"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-all duration-200',
            historyPeriod === period
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
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
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
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
            class="absolute top-full mt-1 right-0 bg-slate-800/95 backdrop-blur-lg rounded-lg border border-slate-700/50 shadow-xl z-50 min-w-[120px]"
          >
            <button
              v-for="period in [{ id: '1month', label: '1 Month' }, { id: '3months', label: '3 Months' }, { id: 'thisyear', label: 'This Year' }, { id: 'alltime', label: 'All Time' }]"
              :key="period.id"
              :class="[
                'w-full text-left px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg',
                longerPeriod === period.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300'
              ]"
              @click="selectLongerPeriod(period.id as '1month' | '3months' | 'thisyear' | 'alltime')"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Chart Container -->
      <div class="bg-slate-800/20 rounded-lg p-4">
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
