<template>
  <div class="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl border transition-all duration-300 hover:scale-[1.01]"
       :class="performanceIndicator?.borderColor || 'border-slate-700/50 hover:border-blue-500/50'">
    <!-- Background Effects -->
    <div 
      class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      :class="performanceIndicator?.color || 'bg-gradient-to-br from-blue-500/5 to-purple-500/5'"
    />
    
    <div class="relative z-10 p-4">
      <!-- Main Server Info - Horizontal Layout -->
      <div class="flex items-center gap-4 mb-3">
        <!-- Game Icon -->
        <div class="flex-shrink-0">
          <div class="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-2.5 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
            <img
              :src="gameIcon"
              alt="Server"
              class="w-full h-full rounded object-cover"
            >
          </div>
        </div>

        <!-- Server Name & Game Badge -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <router-link
              :to="`/servers/${encodeURIComponent(server.serverName)}`"
              class="font-bold text-white hover:text-cyan-400 transition-colors duration-200 truncate text-lg"
              :title="`View server details for ${server.serverName}`"
            >
              {{ server.serverName }}
            </router-link>
            <span class="flex-shrink-0 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
              {{ server.gameId.toUpperCase() }}
            </span>
            <!-- Performance Badge -->
            <div
              v-if="performanceIndicator"
              class="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm border"
              :class="performanceIndicator.color + ' ' + performanceIndicator.borderColor"
            >
              <div class="w-1.5 h-1.5 rounded-full"
                   :class="{
                     'bg-green-400': performanceIndicator.type === 'excellent',
                     'bg-blue-400': performanceIndicator.type === 'good',
                     'bg-amber-400': performanceIndicator.type === 'below'
                   }">
              </div>
              <span class="text-white">{{ performanceIndicator.label }}</span>
            </div>
          </div>
          
          <!-- Compact Stats Row -->
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span class="text-green-400 font-semibold">{{ Number(server.kdRatio).toFixed(2) }}</span>
              <span class="text-slate-500">K/D</span>
              <span
                v-if="Number(overallKdRatio) > 0"
                class="text-xs px-1 py-0.5 rounded ml-1"
                :class="getKdComparisonClass(server.kdRatio, overallKdRatio)"
              >
                {{ getKdComparisonText(server.kdRatio, overallKdRatio) }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span class="text-blue-400 font-semibold">{{ server.totalRounds }}</span>
              <span class="text-slate-500">rounds</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
              <span class="text-purple-400 font-semibold">{{ server.killsPerMinute.toFixed(2) }}</span>
              <span class="text-slate-500">KPM</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
              <span class="text-cyan-400 font-semibold">{{ formatPlayTime(server.totalMinutes) }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex-shrink-0 flex items-center gap-2">
          <button
            @click="$emit('view-maps', server.serverGuid)"
            class="px-3 py-1.5 text-xs font-medium bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            title="View map statistics"
          >
            Maps
          </button>
        </div>
      </div>

      <!-- Playtime Progress Bar -->
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="text-slate-400">Playtime Share</span>
          <span class="text-slate-300 font-medium">{{ playtimePercentage.toFixed(0) }}%</span>
        </div>
        <div class="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            :style="{ width: `${playtimePercentage}%` }"
          />
        </div>
      </div>

      <!-- Server Insights -->
      <div v-if="serverInsights.length > 0" class="space-y-2 pt-3 border-t border-slate-700/50">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Key Insights</div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(insight, index) in serverInsights"
            :key="index"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border"
            :class="getInsightBadgeClass(insight.type)"
          >
            <div class="w-1 h-4 rounded-full"
                 :class="getInsightBarColor(insight.type)">
            </div>
            <span class="font-medium text-white">{{ insight.title }}</span>
            <span
              v-if="insight.multiplier"
              class="font-mono text-xs px-1.5 py-0.5 rounded"
              :class="{
                'bg-green-500/20 text-green-400': insight.multiplier >= 1.5,
                'bg-yellow-500/20 text-yellow-400': insight.multiplier >= 1.2 && insight.multiplier < 1.5,
                'bg-blue-500/20 text-blue-400': insight.multiplier < 1.2
              }"
            >
              {{ insight.multiplier.toFixed(1) }}x
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { calculateKDR } from '@/utils/statsUtils';

interface ServerInsight {
  type: string;
  title: string;
  multiplier?: number;
}

interface Props {
  server: {
    serverGuid: string;
    serverName: string;
    gameId: string;
    totalKills: number;
    totalDeaths: number;
    kdRatio: number | string;
    totalMinutes: number;
    totalRounds: number;
    killsPerMinute: number;
  };
  serverInsights: ServerInsight[];
  overallKdRatio: number;
  totalPlayTime: number;
  performanceIndicator?: {
    type: string;
    label: string;
    color: string;
    borderColor: string;
  };
  gameIcon: string;
}

const props = defineProps<Props>();

defineEmits<{
  'view-maps': [serverGuid: string];
}>();

const playtimePercentage = computed(() => {
  return props.totalPlayTime > 0 ? (props.server.totalMinutes / props.totalPlayTime) * 100 : 0;
});

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  if (hours === 0) return `${remainingMinutes}m`;
  if (hours === 1) return `${hours}h ${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
};

const getKdComparisonClass = (serverKd: number | string, avgKd: number | string) => {
  const serverKdNum = Number(serverKd);
  const avgKdNum = Number(avgKd);
  if (serverKdNum > avgKdNum * 1.1) {
    return 'bg-green-500/20 text-green-400';
  } else if (serverKdNum < avgKdNum * 0.9) {
    return 'bg-amber-500/20 text-amber-400';
  }
  return 'bg-slate-700/50 text-slate-400';
};

const getKdComparisonText = (serverKd: number | string, avgKd: number | string) => {
  const serverKdNum = Number(serverKd);
  const avgKdNum = Number(avgKd);
  const diff = avgKdNum > 0 ? ((serverKdNum / avgKdNum - 1) * 100) : 0;
  return `${serverKdNum > avgKdNum ? '+' : ''}${diff.toFixed(0)}%`;
};

const getInsightBadgeClass = (type: string) => {
  const classes: Record<string, string> = {
    'Server Specialization': 'bg-green-500/10 border-green-500/30',
    'Playtime Leader': 'bg-blue-500/10 border-blue-500/30',
    'Map Mastery': 'bg-purple-500/10 border-purple-500/30',
    'Map Explorer': 'bg-amber-500/10 border-amber-500/30',
    'Activity Champion': 'bg-indigo-500/10 border-indigo-500/30',
    'Combat Intensity': 'bg-yellow-500/10 border-yellow-500/30'
  };
  return classes[type] || 'bg-slate-700/50 border-slate-600/50';
};

const getInsightBarColor = (type: string) => {
  const colors: Record<string, string> = {
    'Server Specialization': 'bg-gradient-to-b from-green-500 to-emerald-500',
    'Playtime Leader': 'bg-gradient-to-b from-blue-500 to-cyan-500',
    'Map Mastery': 'bg-gradient-to-b from-purple-500 to-pink-500',
    'Map Explorer': 'bg-gradient-to-b from-amber-500 to-orange-500',
    'Activity Champion': 'bg-gradient-to-b from-indigo-500 to-purple-500',
    'Combat Intensity': 'bg-gradient-to-b from-yellow-500 to-amber-500'
  };
  return colors[type] || 'bg-slate-500';
};
</script>
