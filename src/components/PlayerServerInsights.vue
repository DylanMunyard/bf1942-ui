<template>
  <div class="space-y-4 border-t border-neutral-700/50 pt-6 mt-6">
    <!-- Insights Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-1 h-6 bg-cyan-400 rounded-full opacity-80"></div>
        <h4 class="text-sm font-bold uppercase tracking-wide text-cyan-400 font-mono">
          Performance Insights
        </h4>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-6">
      <div class="flex items-center gap-3 text-neutral-400">
        <div class="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span class="text-xs font-mono">Analyzing performance...</span>
      </div>
    </div>

    <!-- No Insights State -->
    <div v-else-if="serversWithInsights.length === 0" class="text-center py-6 text-neutral-500 text-xs">
      <p>Keep playing to unlock performance insights.</p>
    </div>

    <!-- Servers with Insights -->
    <div v-else class="space-y-4">
      <div
        v-for="serverData in serversWithInsights"
        :key="serverData.server.serverGuid"
        class="group relative overflow-hidden bg-neutral-800/60 backdrop-blur-sm rounded-lg border border-neutral-700/50 hover:border-cyan-500/30 transition-all duration-200"
      >
        <div class="relative z-10 p-4">
          <!-- Condensed Server Bar Header -->
          <div class="flex items-center gap-4 mb-4">
            <!-- Game Icon -->
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-neutral-700 rounded-lg p-2 group-hover:bg-neutral-600 transition-all">
                <img
                  :src="getGameIcon(serverData.server.gameId)"
                  alt="Server"
                  class="w-full h-full rounded object-cover"
                >
              </div>
            </div>

            <!-- Server Name & Game Badge -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1.5">
                <router-link
                  :to="`/servers/${encodeURIComponent(serverData.server.serverName)}`"
                  class="font-bold text-slate-200 hover:text-cyan-400 transition-colors truncate text-base"
                  :title="`View server details for ${serverData.server.serverName}`"
                >
                  {{ serverData.server.serverName }}
                </router-link>
                <span class="flex-shrink-0 px-2 py-0.5 text-xs font-bold bg-neutral-600 text-slate-200 rounded font-mono">
                  {{ serverData.server.gameId.toUpperCase() }}
                </span>
                <!-- Performance Badge -->
                <div
                  v-if="getServerPerformanceIndicator(serverData.server)"
                  class="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border"
                  :class="getServerPerformanceIndicator(serverData.server)?.color + ' ' + getServerPerformanceIndicator(serverData.server)?.borderColor"
                >
                  <div class="w-1.5 h-1.5 rounded-full"
                       :class="{
                         'bg-emerald-400': getServerPerformanceIndicator(serverData.server)?.type === 'excellent',
                         'bg-cyan-400': getServerPerformanceIndicator(serverData.server)?.type === 'good',
                         'bg-amber-400': getServerPerformanceIndicator(serverData.server)?.type === 'below'
                       }">
                  </div>
                  <span class="text-slate-200">{{ getServerPerformanceIndicator(serverData.server)?.label }}</span>
                </div>
              </div>
              
              <!-- Compact Stats Row -->
              <div class="flex items-center gap-4 text-xs flex-wrap">
                <div class="flex items-center gap-1">
                  <span class="text-emerald-400 font-mono font-semibold">{{ Number(serverData.server.kdRatio).toFixed(2) }}</span>
                  <span class="text-neutral-500">K/D</span>
                  <span
                    v-if="overallAverages && Number(overallAverages.kdRatio) > 0"
                    class="text-xs px-1 py-0.5 rounded ml-1"
                    :class="getKdComparisonClass(serverData.server.kdRatio, overallAverages.kdRatio)"
                  >
                    {{ getKdComparisonText(serverData.server.kdRatio, overallAverages.kdRatio) }}
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-cyan-400 font-mono font-semibold">{{ serverData.server.totalRounds }}</span>
                  <span class="text-neutral-500">rounds</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-cyan-400 font-mono font-semibold">{{ serverData.server.killsPerMinute.toFixed(2) }}</span>
                  <span class="text-neutral-500">KPM</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-neutral-300 font-mono text-xs">{{ formatPlayTime(serverData.server.totalMinutes) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-amber-400 font-mono font-semibold">{{ serverData.server.highestScore?.toLocaleString() || '0' }}</span>
                  <span class="text-neutral-500">best</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-emerald-400 font-semibold">{{ serverData.server.totalKills.toLocaleString() }}</span>
                  <span class="text-neutral-500">/</span>
                  <span class="text-red-400 font-semibold">{{ serverData.server.totalDeaths.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex-shrink-0 flex items-center gap-2">
              <button
                @click="openMapModal(serverData.server.serverGuid)"
                class="px-2.5 py-1.5 text-xs font-medium bg-neutral-700/50 hover:bg-neutral-600 border border-neutral-600 rounded text-slate-300 hover:text-white transition-colors"
                title="View map statistics"
              >
                Maps
              </button>
            </div>
          </div>

          <!-- Insights List -->
          <div class="space-y-2 border-t border-neutral-700/50 pt-4">
            <div
              v-for="(insight, index) in serverData.insights"
              :key="index"
              class="flex items-start gap-3 p-2.5 rounded-lg bg-neutral-800/60 border border-neutral-700/40"
            >
              <div class="flex-shrink-0 w-1 h-full min-h-[32px] rounded-full"
                   :class="getInsightBarColor(insight.type)">
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-0.5 font-mono">
                  {{ insight.type }}
                </div>
                <div class="text-sm font-medium text-slate-200 mb-1">
                  {{ insight.title }}
                </div>
                <p class="text-xs text-neutral-400 leading-relaxed mb-2">
                  {{ insight.description }}
                </p>
                <div class="flex items-center gap-2 flex-wrap">
                  <div
                    v-if="insight.multiplier"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono"
                    :class="{
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': insight.multiplier >= 1.5,
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30': insight.multiplier >= 1.2 && insight.multiplier < 1.5,
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30': insight.multiplier < 1.2
                    }"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <span class="font-mono">{{ insight.multiplier.toFixed(1) }}x</span>
                    <span class="text-neutral-400 font-normal">{{ insight.multiplierLabel }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { calculateKDR } from '@/utils/statsUtils';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';
import defaultIcon from '@/assets/servers.webp';

interface ServerInsight {
  type: string;
  title: string;
  description: string;
  multiplier?: number;
  multiplierLabel?: string;
  stats?: {
    kdRatio?: number;
    kills?: number;
    playTime?: number;
  };
}

interface ServerWithInsights {
  server: typeof props.servers[0];
  insights: ServerInsight[];
}

interface Props {
  playerName: string;
  servers: Array<{
    serverGuid: string;
    serverName: string;
    gameId: string;
    totalKills: number;
    totalDeaths: number;
    kdRatio: number;
    totalMinutes: number;
    totalRounds: number;
    killsPerMinute: number;
    highestScore?: number;
  }>;
  overallAverages?: {
    kdRatio: number;
    killsPerMinute: number;
    totalMinutes: number;
  };
  openMapModal?: (serverGuid: string) => void;
}

const props = defineProps<Props>();
const serversWithInsights = ref<ServerWithInsights[]>([]);
const loading = ref(false);

const gameIcons: { [key: string]: string } = {
  bf1942: bf1942Icon,
  fh2: fh2Icon,
  bfv: bfvIcon,
};

const getGameIcon = (gameId: string): string => {
  if (!gameId) return defaultIcon;
  return gameIcons[gameId.toLowerCase()] || defaultIcon;
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  if (hours === 0) return `${remainingMinutes}m`;
  if (hours === 1) return `${hours}h ${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
};

// Helper function to get performance indicator for a server
const getServerPerformanceIndicator = (server: { kdRatio: number | string; killsPerMinute: number | string }) => {
  if (!props.overallAverages) return null;
  
  const avg = props.overallAverages;
  const serverKd = typeof server.kdRatio === 'number' ? server.kdRatio : parseFloat(String(server.kdRatio)) || 0;
  const serverKpm = typeof server.killsPerMinute === 'number' ? server.killsPerMinute : parseFloat(String(server.killsPerMinute)) || 0;
  const avgKd = typeof avg.kdRatio === 'number' ? avg.kdRatio : 0;
  const avgKpm = typeof avg.killsPerMinute === 'number' ? avg.killsPerMinute : 0;
  const kdMultiplier = avgKd > 0 ? serverKd / avgKd : 1;
  const kpmMultiplier = avgKpm > 0 ? serverKpm / avgKpm : 1;
  
  if (kdMultiplier >= 1.3 || kpmMultiplier >= 1.3) {
    return { 
      type: 'excellent', 
      label: 'Top Performer', 
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/50'
    };
  } else if (kdMultiplier >= 1.1 || kpmMultiplier >= 1.1) {
    return { 
      type: 'good', 
      label: 'Strong', 
      color: 'from-cyan-500/20 to-emerald-500/20',
      borderColor: 'border-cyan-500/50'
    };
  } else if (kdMultiplier < 0.9) {
    return { 
      type: 'below', 
      label: 'Developing', 
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/50'
    };
  }
  return null;
};

// Helper to get K/D comparison class
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

// Helper to get K/D comparison text
const getKdComparisonText = (serverKd: number | string, avgKd: number | string) => {
  const serverKdNum = Number(serverKd);
  const avgKdNum = Number(avgKd);
  const diff = avgKdNum > 0 ? ((serverKdNum / avgKdNum - 1) * 100) : 0;
  return `${serverKdNum > avgKdNum ? '+' : ''}${diff.toFixed(0)}%`;
};

// Handle map modal opening
const openMapModal = (serverGuid: string) => {
  if (props.openMapModal) {
    props.openMapModal(serverGuid);
  }
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

const calculateInsights = async () => {
  if (!props.servers || props.servers.length === 0) {
    console.log('PlayerServerInsights: No servers provided');
    return;
  }

  console.log(`PlayerServerInsights: Calculating insights for ${props.servers.length} servers`);
  loading.value = true;
  const serverInsightsMap = new Map<string, ServerInsight[]>();

  try {

    // Calculate overall averages for comparison
    const overallKdRatioRaw = calculateKDR(
      props.servers.reduce((sum, s) => sum + s.totalKills, 0),
      props.servers.reduce((sum, s) => sum + s.totalDeaths, 0)
    );
    const overallKdRatio = typeof overallKdRatioRaw === 'number' ? overallKdRatioRaw : parseFloat(String(overallKdRatioRaw)) || 0;
    const totalKills = props.servers.reduce((sum, s) => sum + s.totalKills, 0);
    const totalMinutes = props.servers.reduce((sum, s) => sum + s.totalMinutes, 0);
    const overallKillsPerMinute = totalKills / Math.max(totalMinutes, 1) * 60;

    // Initialize insights map for all servers
    props.servers.forEach(server => {
      serverInsightsMap.set(server.serverGuid, []);
    });

    // 1. Best performing server (highest K/D)
    const bestKdServer = [...props.servers].sort((a, b) => {
      const aKd = typeof a.kdRatio === 'number' ? a.kdRatio : parseFloat(String(a.kdRatio)) || 0;
      const bKd = typeof b.kdRatio === 'number' ? b.kdRatio : parseFloat(String(b.kdRatio)) || 0;
      return bKd - aKd;
    })[0];
    if (bestKdServer) {
      const bestKdServerKd = typeof bestKdServer.kdRatio === 'number' ? bestKdServer.kdRatio : parseFloat(String(bestKdServer.kdRatio)) || 0;
      if (bestKdServerKd > overallKdRatio * 1.1) {
        const multiplier = bestKdServerKd / Math.max(overallKdRatio, 0.1);
        const insights = serverInsightsMap.get(bestKdServer.serverGuid) || [];
        insights.push({
          type: 'Server Specialization',
          title: `Your Best Battlefield`,
          description: `You dominate on this server with a ${bestKdServerKd.toFixed(2)} K/D ratio. Your combat effectiveness is significantly higher here.`,
          multiplier: multiplier,
          multiplierLabel: 'better K/D',
          stats: {
            kdRatio: bestKdServerKd,
            kills: bestKdServer.totalKills,
            playTime: bestKdServer.totalMinutes
          }
        });
        serverInsightsMap.set(bestKdServer.serverGuid, insights);
      }
    }

    // 2. Most played server
    const mostPlayedServer = [...props.servers].sort((a, b) => b.totalMinutes - a.totalMinutes)[0];
    if (mostPlayedServer && mostPlayedServer.totalMinutes > 0) {
      const totalPlayTime = props.servers.reduce((sum, s) => sum + s.totalMinutes, 0);
      const percentage = (mostPlayedServer.totalMinutes / totalPlayTime) * 100;
      const mostPlayedKd = typeof mostPlayedServer.kdRatio === 'number' ? mostPlayedServer.kdRatio : parseFloat(String(mostPlayedServer.kdRatio)) || 0;
      const insights = serverInsightsMap.get(mostPlayedServer.serverGuid) || [];
      insights.push({
        type: 'Playtime Leader',
        title: `Home Base`,
        description: `You've spent ${percentage.toFixed(0)}% of your playtime on this server. This is clearly your favorite battleground.`,
        stats: {
          kdRatio: mostPlayedKd,
          kills: mostPlayedServer.totalKills,
          playTime: mostPlayedServer.totalMinutes
        }
      });
      serverInsightsMap.set(mostPlayedServer.serverGuid, insights);
    }

    // 3. High activity server
    const mostRoundsServer = [...props.servers].sort((a, b) => b.totalRounds - a.totalRounds)[0];
    if (mostRoundsServer && mostRoundsServer.totalRounds >= 50) {
      const mostRoundsKd = typeof mostRoundsServer.kdRatio === 'number' ? mostRoundsServer.kdRatio : parseFloat(String(mostRoundsServer.kdRatio)) || 0;
      const insights = serverInsightsMap.get(mostRoundsServer.serverGuid) || [];
      insights.push({
        type: 'Activity Champion',
        title: `${mostRoundsServer.totalRounds} Rounds`,
        description: `You've completed ${mostRoundsServer.totalRounds} rounds here, making it your most active battlefield.`,
        stats: {
          kdRatio: mostRoundsKd,
          kills: mostRoundsServer.totalKills,
          playTime: mostRoundsServer.totalMinutes
        }
      });
      serverInsightsMap.set(mostRoundsServer.serverGuid, insights);
    }

    // 4. Best kill rate server
    // Use the server's existing killsPerMinute property instead of recalculating
    const bestKpmServer = [...props.servers]
      .map(s => ({
        ...s,
        kpm: typeof s.killsPerMinute === 'number' ? s.killsPerMinute : parseFloat(String(s.killsPerMinute)) || 0
      }))
      .sort((a, b) => b.kpm - a.kpm)[0];

    if (bestKpmServer && bestKpmServer.kpm > overallKillsPerMinute * 1.15) {
      const multiplier = bestKpmServer.kpm / Math.max(overallKillsPerMinute, 0.1);
      const bestKpmKd = typeof bestKpmServer.kdRatio === 'number' ? bestKpmServer.kdRatio : parseFloat(String(bestKpmServer.kdRatio)) || 0;
      const insights = serverInsightsMap.get(bestKpmServer.serverGuid) || [];
      insights.push({
        type: 'Combat Intensity',
        title: `High-Octane Action`,
        description: `You maintain a ${bestKpmServer.kpm.toFixed(2)} kills/minute rate here, showing intense combat engagement.`,
        multiplier: multiplier,
        multiplierLabel: 'higher kill rate',
        stats: {
          kdRatio: bestKpmKd,
          kills: bestKpmServer.totalKills,
          playTime: bestKpmServer.totalMinutes
        }
      });
      serverInsightsMap.set(bestKpmServer.serverGuid, insights);
    }

    // Convert map to array and filter out servers with no insights
    const result: ServerWithInsights[] = Array.from(serverInsightsMap.entries())
      .filter(([_, insights]) => insights.length > 0)
      .map(([serverGuid, insights]) => {
        const server = props.servers.find(s => s.serverGuid === serverGuid)!;
        return { server, insights };
      })
      .sort((a, b) => b.insights.length - a.insights.length); // Sort by number of insights

    console.log(`PlayerServerInsights: Generated insights for ${result.length} servers`);
    serversWithInsights.value = result;
  } catch (err) {
    console.error('Error calculating insights:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  calculateInsights();
});

// Recalculate when servers change
watch(() => props.servers, () => {
  if (props.servers && props.servers.length > 0) {
    calculateInsights();
  }
}, { deep: true });

// Expose serversWithInsights so parent can filter servers
defineExpose({
  get serversWithInsights() {
    return serversWithInsights.value;
  }
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
