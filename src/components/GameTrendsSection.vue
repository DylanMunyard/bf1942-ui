<script setup lang="ts">
interface ForecastEntry {
  hourOfDay: number;
  dayOfWeek: number;
  predictedPlayers: number;
  dataPoints: number;
  isCurrentHour?: boolean;
  actualPlayers?: number;
  delta?: number;
}

interface GameTrendsInsights {
  currentHourPredictedPlayers: number;
  currentActualPlayers: number;
  activityComparisonStatus: 'busier_than_usual' | 'quieter_than_usual' | 'as_usual';
  currentStatus: 'very_busy' | 'busy' | 'moderate' | 'quiet' | 'very_quiet';
  trendDirection: 'increasing_significantly' | 'increasing' | 'stable' | 'decreasing' | 'decreasing_significantly';
  nextHourPredictedPlayers: number;
  maxPredictedPlayers: number;
  forecast: ForecastEntry[];
  next24HourPeaks: {
    hourOfDay: number;
    dayOfWeek: number;
    predictedPlayers: number;
  }[];
  generatedAt: string;
  recommendationMessage: string;
}

interface Props {
  gameTrends: GameTrendsInsights | null;
  trendsLoading: boolean;
  trendsError: string | null;
  processedForecast: ForecastEntry[];
  formatHourDisplayFixed: (hourUTC: number, isCurrentHour?: boolean, forecastIndex?: number) => string;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="border-b border-slate-700/30">
    <div class="p-3">
      <!-- Game Trends -->
      <div 
        v-if="gameTrends && !trendsLoading" 
        class="bg-slate-800/30 rounded-lg p-4 space-y-4"
      >
        <!-- Forecast Chart - Vertical Bar Display -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-500 rounded flex items-center justify-center">
              <span class="text-slate-900 text-xs font-bold">📊</span>
            </div>
            <span class="text-xs font-bold text-purple-400 uppercase tracking-wide">Forecast</span>
          </div>
          
          <!-- Vertical bars like Google Maps busy indicator -->
          <div class="flex items-end justify-center gap-1 bg-slate-800/30 rounded-lg p-4 h-32">
            <div 
              v-for="(forecast, index) in processedForecast" 
              :key="index"
              class="flex flex-col items-center gap-1 flex-1 max-w-[60px] group cursor-pointer"
            >
              <!-- Vertical bar -->
              <div
                class="w-6 rounded-t transition-[background-color,transform,box-shadow] duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30 will-change-transform"
                :class="forecast.isCurrentHour ? 'bg-gradient-to-t from-cyan-300 to-cyan-500 hover:from-cyan-200 hover:to-cyan-400' : 'bg-gradient-to-t from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400'"
                :style="{
                  height: Math.max(8, (forecast.predictedPlayers / gameTrends.maxPredictedPlayers) * 80) + 'px'
                }"
                :title="`${formatHourDisplayFixed(forecast.hourOfDay, forecast.isCurrentHour, index)}: ${Math.round(forecast.predictedPlayers)} players${forecast.isCurrentHour && forecast.actualPlayers ? ` (${forecast.actualPlayers} actual)` : ''}`"
              />
              <!-- Time label -->
              <div
                class="text-xs font-mono text-center transition-colors duration-300 group-hover:text-slate-200"
                :class="forecast.isCurrentHour ? 'text-cyan-400 font-bold' : 'text-slate-400'"
              >
                {{ formatHourDisplayFixed(forecast.hourOfDay, forecast.isCurrentHour, index) }}
              </div>
              <!-- Player count -->
              <div class="text-xs text-center transition-colors duration-300 group-hover:text-slate-200">
                <div
                  v-if="forecast.isCurrentHour"
                  class="text-cyan-400 font-bold group-hover:text-cyan-300"
                >
                  {{ forecast.actualPlayers || Math.round(forecast.predictedPlayers) }}
                </div>
                <div
                  v-else
                  class="text-slate-300 font-semibold"
                >
                  {{ Math.round(forecast.predictedPlayers) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trends Loading State -->
      <div 
        v-else-if="trendsLoading" 
        class="bg-slate-800/30 rounded-lg p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span class="text-sm text-slate-400">Loading activity trends...</span>
        </div>
      </div>

      <!-- Trends Error State -->
      <div 
        v-else-if="trendsError" 
        class="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
            <span class="text-red-400 text-xs">⚠️</span>
          </div>
          <span class="text-sm text-red-400">{{ trendsError }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
