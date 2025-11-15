<script setup lang="ts">
import { ref, computed, PropType } from 'vue';
import { Line } from 'vue-chartjs';

// Define interfaces
interface PerformanceStats {
  score: number;
  kills: number;
  deaths: number;
}

interface MapPerformance {
  mapName: string;
  player1Totals: PerformanceStats;
  player2Totals: PerformanceStats;
}

interface KillRateData {
  playerName: string;
  killRate: number;
}

interface AveragePingData {
  playerName: string;
  averagePing: number;
}

interface BucketTotal {
  bucket: 'Last30Days' | 'Last6Months' | 'LastYear' | 'AllTime';
  player1Totals: PerformanceStats & { playTimeMinutes?: number };
  player2Totals: PerformanceStats & { playTimeMinutes?: number };
}

interface HeadToHeadEncounter {
  roundId?: string;
  timestamp: string;
  serverGuid: string;
  mapName: string;
  player1Score: number;
  player1Kills: number;
  player1Deaths: number;
  player2Score: number;
  player2Kills: number;
  player2Deaths: number;
}

interface ActivityByHour {
  formattedHour: string;
  hour: number;
  minutesActive: number;
}

interface ActivityHoursData {
  player1ActivityHours: ActivityByHour[];
  player2ActivityHours: ActivityByHour[];
}

interface ComparisonData {
  player1: string;
  player2: string;
  killRates: KillRateData[];
  bucketTotals: BucketTotal[];
  averagePing: AveragePingData[];
  mapPerformance: MapPerformance[];
  headToHead: HeadToHeadEncounter[];
}

// Define props
const props = defineProps({
  comparisonData: {
    type: Object as PropType<ComparisonData>,
    required: true
  },
  activityHoursData: {
    type: Object as PropType<ActivityHoursData | null>,
    default: null
  },
  activityHoursLoading: {
    type: Boolean,
    default: false
  },
  activityHoursError: {
    type: String as PropType<string | null>,
    default: null
  },
  isDarkMode: {
    type: Boolean,
    default: false
  },
  chartKey: {
    type: Number,
    default: 0
  }
});

// Internal state
const selectedTimePeriod = ref<'Last30Days' | 'Last6Months' | 'LastYear' | 'AllTime'>('Last30Days');
const timePeriodOptions = [
  { value: 'Last30Days', label: 'Last 30 Days' },
  { value: 'Last6Months', label: 'Last 6 Months' },
  { value: 'LastYear', label: 'Last Year' },
  { value: 'AllTime', label: 'All Time' },
] as const;

const sortColumn = ref<string>('');
const sortDirection = ref<'asc' | 'desc'>('asc');
const showExtraColumns = ref(false);
const hideNoScores = ref(false);
const showRawActivityData = ref(false);

// Utility functions
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
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
  return `+ ${formatPlayTime(diffMinutes)}`;
};

const getHigherValue = (value1: number, value2: number): 'p1' | 'p2' | 'tie' => {
  if (value1 > value2) return 'p1';
  if (value2 > value1) return 'p2';
  return 'tie';
};

const getPerformanceData = (bucket: string) => {
  if (!props.comparisonData?.bucketTotals) return null;
  return props.comparisonData.bucketTotals.find(bt => bt.bucket === bucket);
};

// Computed properties
const player1KillRate = computed(() => {
  if (!props.comparisonData?.killRates) return 0;
  const player1Data = props.comparisonData.killRates.find(kr => kr.playerName === props.comparisonData?.player1);
  return player1Data?.killRate || 0;
});

const player2KillRate = computed(() => {
  if (!props.comparisonData?.killRates) return 0;
  const player2Data = props.comparisonData.killRates.find(kr => kr.playerName === props.comparisonData?.player2);
  return player2Data?.killRate || 0;
});

const player1AveragePing = computed(() => {
  if (!props.comparisonData?.averagePing) return 0;
  const player1Data = props.comparisonData.averagePing.find(ap => ap.playerName === props.comparisonData?.player1);
  return player1Data?.averagePing || 0;
});

const player2AveragePing = computed(() => {
  if (!props.comparisonData?.averagePing) return 0;
  const player2Data = props.comparisonData.averagePing.find(ap => ap.playerName === props.comparisonData?.player2);
  return player2Data?.averagePing || 0;
});

// Sorting functions
const sortMapPerformance = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'desc';
  }
};

const sortedMapPerformance = computed(() => {
  if (!props.comparisonData?.mapPerformance) {
    return [];
  }

  let maps = props.comparisonData.mapPerformance;

  // Filter out maps with no scores if hideNoScores is enabled
  if (hideNoScores.value) {
    maps = maps.filter(map =>
      map.player1Totals.score > 0 && map.player2Totals.score > 0
    );
  }

  if (!sortColumn.value) {
    return maps;
  }

  return [...maps].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortColumn.value) {
      case 'map':
        aValue = a.mapName;
        bValue = b.mapName;
        break;
      case 'p1-score':
        aValue = a.player1Totals.score;
        bValue = b.player1Totals.score;
        break;
      case 'p1-kills':
        aValue = a.player1Totals.kills;
        bValue = b.player1Totals.kills;
        break;
      case 'p1-deaths':
        aValue = a.player1Totals.deaths;
        bValue = b.player1Totals.deaths;
        break;
      case 'p1-kdr':
        aValue = parseFloat(calculateKDR(a.player1Totals.kills, a.player1Totals.deaths));
        bValue = parseFloat(calculateKDR(b.player1Totals.kills, b.player1Totals.deaths));
        break;
      case 'p2-score':
        aValue = a.player2Totals.score;
        bValue = b.player2Totals.score;
        break;
      case 'p2-kills':
        aValue = a.player2Totals.kills;
        bValue = b.player2Totals.kills;
        break;
      case 'p2-deaths':
        aValue = a.player2Totals.deaths;
        bValue = b.player2Totals.deaths;
        break;
      case 'p2-kdr':
        aValue = parseFloat(calculateKDR(a.player2Totals.kills, a.player2Totals.deaths));
        bValue = parseFloat(calculateKDR(b.player2Totals.kills, b.player2Totals.deaths));
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection.value === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const numA = Number(aValue);
    const numB = Number(bValue);
    return sortDirection.value === 'asc' ? numA - numB : numB - numA;
  });
});

const sortedHeadToHead = computed(() => {
  if (!props.comparisonData?.headToHead) return [];

  return [...props.comparisonData.headToHead].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
});

// Activity hours functions
const convertToLocalHour = (utcHour: number): number => {
  const now = new Date();
  const localDate = new Date(now.setUTCHours(utcHour, 0, 0, 0));
  return localDate.getHours();
};

const getSortedActivityHours = (activityHours: ActivityByHour[]) => {
  if (!activityHours) return [];

  const hoursWithLocalTime = activityHours.map(hourData => ({
    ...hourData,
    localHour: convertToLocalHour(hourData.hour)
  }));

  return [...hoursWithLocalTime].sort((a, b) => a.localHour - b.localHour);
};

const combinedActivityChartData = computed(() => {
  if (!props.activityHoursData?.player1ActivityHours || !props.activityHoursData?.player2ActivityHours) {
    return { labels: [], datasets: [] };
  }

  const player1Sorted = getSortedActivityHours(props.activityHoursData.player1ActivityHours);
  const player2Sorted = getSortedActivityHours(props.activityHoursData.player2ActivityHours);

  const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  const player1Data = new Array(24).fill(0);
  const player2Data = new Array(24).fill(0);

  player1Sorted.forEach(hourData => {
    player1Data[hourData.localHour] = hourData.minutesActive;
  });

  player2Sorted.forEach(hourData => {
    player2Data[hourData.localHour] = hourData.minutesActive;
  });

  if (showRawActivityData.value) {
    return {
      labels,
      datasets: [
        {
          label: props.comparisonData?.player1 || 'Player 1',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          borderColor: 'rgba(156, 39, 176, 1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: 'rgba(156, 39, 176, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          data: player1Data
        },
        {
          label: props.comparisonData?.player2 || 'Player 2',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: 'rgba(33, 150, 243, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          data: player2Data
        }
      ]
    };
  }

  const maxPlayer1 = Math.max(...player1Data);
  const maxPlayer2 = Math.max(...player2Data);

  const combinedActivityData = player1Data.map((p1Activity, index) => {
    const p2Activity = player2Data[index];

    const p1Normalized = maxPlayer1 > 0 ? p1Activity / maxPlayer1 : 0;
    const p2Normalized = maxPlayer2 > 0 ? p2Activity / maxPlayer2 : 0;

    return Math.sqrt(p1Normalized * p2Normalized) * 100;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Overlap Potential',
        backgroundColor: (ctx: any) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(156, 39, 176, 0.4)');
          gradient.addColorStop(0.5, 'rgba(103, 58, 183, 0.3)');
          gradient.addColorStop(1, 'rgba(156, 39, 176, 0.1)');
          return gradient;
        },
        borderColor: 'rgba(156, 39, 176, 0.8)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(156, 39, 176, 0.9)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        data: combinedActivityData
      }
    ]
  };
});

const combinedActivityChartOptions = computed(() => {
  const computedStyle = getComputedStyle(document.documentElement);
  const cssTextColor = computedStyle.getPropertyValue('--color-text').trim();
  const cssHeadingColor = computedStyle.getPropertyValue('--color-heading').trim();

  const textColor = cssHeadingColor || (props.isDarkMode ? '#ffffff' : '#2c3e50');
  const gridColor = props.isDarkMode ? 'rgba(235, 235, 235, 0.15)' : 'rgba(60, 60, 60, 0.12)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    scales: {
      y: {
        beginAtZero: true,
        display: false,
        grid: {
          display: false
        }
      },
      x: {
        display: true,
        grid: {
          display: true,
          color: gridColor
        },
        ticks: {
          color: textColor,
          font: {
            size: 10
          },
          maxTicksLimit: 6
        },
        title: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: textColor,
          usePointStyle: false,
          padding: 20,
          font: {
            size: 14,
            weight: 'bold' as const
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: props.isDarkMode ? 'rgba(35, 21, 53, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: props.isDarkMode ? '#7e57c2' : '#2196F3',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 12,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 11
        },
        callbacks: {
          title: function(context: any) {
            return `${context[0].label}`;
          },
          label: function(context: any) {
            if (showRawActivityData.value) {
              return `${context.dataset.label}: ${context.parsed.y} minutes active`;
            }

            const value = context.parsed.y;
            let likelihood;
            if (value < 25) {
              likelihood = 'Unlikely';
            } else if (value < 70) {
              likelihood = 'Possible';
            } else {
              likelihood = 'Most Likely';
            }

            return `${context.dataset.label}: ${likelihood}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4
      }
    }
  };
});
</script>

<template>
  <div class="space-y-6">
    <!-- Core Statistics -->
    <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
      <div class="p-6 border-b border-slate-700/50">
        <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 flex items-center gap-3">
          📊 Core Statistics
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
                  {{ comparisonData.player1 }}
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
                  {{ comparisonData.player2 }}
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
                  {{ comparisonData.player1 }}
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
                  {{ comparisonData.player2 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Typical Online Hours -->
    <div
      v-if="activityHoursData?.player1ActivityHours && activityHoursData?.player2ActivityHours"
      class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      <div class="p-6 border-b border-slate-700/50">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
            🕰️ Typical Online Hours
          </h3>
          <button
            class="px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 font-medium text-sm flex items-center gap-2"
            :title="showRawActivityData ? 'Show overlap potential' : 'Show individual activity'"
            @click="showRawActivityData = !showRawActivityData"
          >
            <span>{{ showRawActivityData ? '🔀 Show Overlap' : '📊 Show Individual' }}</span>
          </button>
        </div>
      </div>
      <div class="p-6">
        <!-- Loading State -->
        <div
          v-if="activityHoursLoading"
          class="flex items-center justify-center py-12"
        >
          <div class="text-center space-y-4">
            <div class="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
            <p class="text-slate-400">
              Loading activity data...
            </p>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="activityHoursError"
          class="text-center py-12"
        >
          <div class="text-red-400 font-medium">
            {{ activityHoursError }}
          </div>
        </div>

        <!-- Activity Chart -->
        <div
          v-else
          class="space-y-6"
        >
          <!-- Chart Container -->
          <div class="relative">
            <div class="h-64 relative border border-slate-700/50 rounded-xl overflow-hidden bg-gradient-to-r from-slate-800/60 to-slate-900/60">
              <!-- Background zones for time periods -->
              <div class="absolute inset-0 flex pointer-events-none">
                <div
                  class="flex-[8] bg-gradient-to-r from-purple-500/10 to-purple-500/5"
                  title="Early (00:00 - 08:00)"
                />
                <div
                  class="flex-[8] bg-gradient-to-r from-blue-500/10 to-blue-500/5"
                  title="Day (08:00 - 16:00)"
                />
                <div
                  class="flex-[8] bg-gradient-to-r from-indigo-500/10 to-indigo-500/5"
                  title="Night (16:00 - 24:00)"
                />
              </div>
              <div class="relative z-10 h-full p-2">
                <Line
                  :key="chartKey"
                  :data="combinedActivityChartData"
                  :options="combinedActivityChartOptions"
                />
              </div>
            </div>
          </div>

          <!-- Time period labels -->
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="space-y-1">
              <div class="text-sm font-bold text-purple-400">
                Early Hours
              </div>
              <div class="text-xs text-slate-400 font-mono">
                12AM - 8AM
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-sm font-bold text-blue-400">
                Day Hours
              </div>
              <div class="text-xs text-slate-400 font-mono">
                8AM - 4PM
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-sm font-bold text-indigo-400">
                Night Hours
              </div>
              <div class="text-xs text-slate-400 font-mono">
                4PM - 12AM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Over Time -->
    <div
      v-if="comparisonData.bucketTotals && comparisonData.bucketTotals.length > 0"
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
          v-if="getPerformanceData(selectedTimePeriod)"
          class="space-y-6"
        >
          <!-- Headers -->
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="text-sm font-bold text-slate-400 uppercase tracking-wide">
              Metric
            </div>
            <div class="text-sm font-bold text-cyan-400 uppercase tracking-wide">
              {{ comparisonData.player1 }}
            </div>
            <div class="text-sm font-bold text-orange-400 uppercase tracking-wide">
              {{ comparisonData.player2 }}
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
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p1',
                    'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p1')
                  }"
                >
                  {{ getPerformanceData(selectedTimePeriod)?.player1Totals.score?.toLocaleString() }}
                </div>
                <div
                  v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p1'"
                  class="text-xs text-green-300 font-medium"
                >
                  +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score).substring(2) }}
                </div>
              </div>
              <div class="text-center">
                <div
                  class="text-xl font-bold"
                  :class="{
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p2',
                    'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p2')
                  }"
                >
                  {{ getPerformanceData(selectedTimePeriod)?.player2Totals.score?.toLocaleString() }}
                </div>
                <div
                  v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p2'"
                  class="text-xs text-green-300 font-medium"
                >
                  +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score).substring(2) }}
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
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p1',
                    'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p1')
                  }"
                >
                  {{ getPerformanceData(selectedTimePeriod)?.player1Totals.kills?.toLocaleString() }}
                </div>
                <div
                  v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p1'"
                  class="text-xs text-green-300 font-medium"
                >
                  +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills).substring(2) }}
                </div>
              </div>
              <div class="text-center">
                <div
                  class="text-xl font-bold"
                  :class="{
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p2',
                    'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p2')
                  }"
                >
                  {{ getPerformanceData(selectedTimePeriod)?.player2Totals.kills?.toLocaleString() }}
                </div>
                <div
                  v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p2'"
                  class="text-xs text-green-300 font-medium"
                >
                  +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills).substring(2) }}
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
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p2',
                    'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p2')
                  }"
                >
                  {{ getPerformanceData(selectedTimePeriod)?.player1Totals.deaths?.toLocaleString() }}
                </div>
              </div>
              <div class="text-center">
                <div
                  class="text-xl font-bold"
                  :class="{
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p1',
                    'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p1')
                  }"
                >
                  {{ getPerformanceData(selectedTimePeriod)?.player2Totals.deaths?.toLocaleString() }}
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
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p1',
                    'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p1')
                  }"
                >
                  {{ formatPlayTime(getPerformanceData(selectedTimePeriod)?.player1Totals.playTimeMinutes || 0) }}
                </div>
                <div
                  v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p1'"
                  class="text-xs text-green-300 font-medium"
                >
                  {{ calculateTimeDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) }} more
                </div>
              </div>
              <div class="text-center">
                <div
                  class="text-xl font-bold"
                  :class="{
                    'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p2',
                    'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p2')
                  }"
                >
                  {{ formatPlayTime(getPerformanceData(selectedTimePeriod)?.player2Totals.playTimeMinutes || 0) }}
                </div>
                <div
                  v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p2'"
                  class="text-xs text-green-300 font-medium"
                >
                  {{ calculateTimeDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) }} more
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Performance -->
    <div
      v-if="comparisonData.mapPerformance && comparisonData.mapPerformance.length > 0"
      class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      <div class="p-6 border-b border-slate-700/50">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-3">
            🗺️ Map Performance
          </h3>
          <div class="flex items-center gap-3">
            <button
              class="p-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300"
              :title="hideNoScores ? 'Show all maps including those with no scores' : 'Hide maps where either player has no scores'"
              @click="hideNoScores = !hideNoScores"
            >
              {{ hideNoScores ? '👁️' : '👁️‍🗨️' }}
            </button>
            <button
              class="px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 font-medium text-sm"
              @click="showExtraColumns = !showExtraColumns"
            >
              {{ showExtraColumns ? 'Hide' : 'Show' }} Kills/Deaths
            </button>
          </div>
        </div>
      </div>
      <div class="overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <!-- Table Header -->
            <thead class="sticky top-0 z-10">
              <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                <th
                  class="group p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-blue-500/50 min-w-[180px]"
                  :class="{ 'text-blue-400': sortColumn === 'map' }"
                  @click="sortMapPerformance('map')"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-blue-400 text-xs">🗺️</span>
                    <span class="font-mono font-bold">MAP</span>
                    <span
                      v-if="sortColumn === 'map'"
                      class="text-xs transition-transform duration-200"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>

                <!-- Player 1 Headers -->
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-cyan-400 border-b border-slate-700/30 bg-cyan-500/10 border-l-4 border-l-cyan-400/60"
                  :colspan="showExtraColumns ? 4 : 2"
                >
                  <div class="flex items-center justify-center gap-2">
                    <span class="font-mono font-bold text-sm">{{ comparisonData.player1 }}</span>
                  </div>
                </th>

                <!-- Player 2 Headers -->
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-orange-400 border-b border-slate-700/30 bg-orange-500/10 border-l-4 border-l-orange-400/60"
                  :colspan="showExtraColumns ? 4 : 2"
                >
                  <div class="flex items-center justify-center gap-2">
                    <span class="font-mono font-bold text-sm">{{ comparisonData.player2 }}</span>
                  </div>
                </th>
              </tr>
              <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
                <th class="p-2 border-b border-slate-700/30" />

                <!-- Player 1 Sub Headers -->
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5 border-l-4 border-l-cyan-400/60"
                  :class="{ 'text-cyan-400': sortColumn === 'p1-score' }"
                  @click="sortMapPerformance('p1-score')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>🎖️</span>
                    <span class="font-mono">SCORE</span>
                    <span
                      v-if="sortColumn === 'p1-score'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>
                <th
                  v-if="showExtraColumns"
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5"
                  :class="{ 'text-cyan-400': sortColumn === 'p1-kills' }"
                  @click="sortMapPerformance('p1-kills')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>⚔️</span>
                    <span class="font-mono">K</span>
                    <span
                      v-if="sortColumn === 'p1-kills'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>
                <th
                  v-if="showExtraColumns"
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5"
                  :class="{ 'text-cyan-400': sortColumn === 'p1-deaths' }"
                  @click="sortMapPerformance('p1-deaths')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>☠️</span>
                    <span class="font-mono">D</span>
                    <span
                      v-if="sortColumn === 'p1-deaths'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5 border-r-4 border-r-cyan-400/60"
                  :class="{ 'text-cyan-400': sortColumn === 'p1-kdr' }"
                  @click="sortMapPerformance('p1-kdr')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>🎯</span>
                    <span class="font-mono">K/D</span>
                    <span
                      v-if="sortColumn === 'p1-kdr'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>

                <!-- Player 2 Sub Headers -->
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5 border-l-4 border-l-orange-400/60"
                  :class="{ 'text-orange-400': sortColumn === 'p2-score' }"
                  @click="sortMapPerformance('p2-score')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>🎖️</span>
                    <span class="font-mono">SCORE</span>
                    <span
                      v-if="sortColumn === 'p2-score'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>
                <th
                  v-if="showExtraColumns"
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                  :class="{ 'text-orange-400': sortColumn === 'p2-kills' }"
                  @click="sortMapPerformance('p2-kills')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>⚔️</span>
                    <span class="font-mono">K</span>
                    <span
                      v-if="sortColumn === 'p2-kills'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>
                <th
                  v-if="showExtraColumns"
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                  :class="{ 'text-orange-400': sortColumn === 'p2-deaths' }"
                  @click="sortMapPerformance('p2-deaths')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>☠️</span>
                    <span class="font-mono">D</span>
                    <span
                      v-if="sortColumn === 'p2-deaths'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                  :class="{ 'text-orange-400': sortColumn === 'p2-kdr' }"
                  @click="sortMapPerformance('p2-kdr')"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span>🎯</span>
                    <span class="font-mono">K/D</span>
                    <span
                      v-if="sortColumn === 'p2-kdr'"
                      class="text-xs"
                      :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                    >▲</span>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody>
              <tr
                v-for="map in sortedMapPerformance"
                :key="map.mapName"
                class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/20"
              >
                <!-- Map Name -->
                <td class="p-2">
                  <div class="font-bold text-blue-400 text-xs truncate max-w-[180px] font-mono uppercase">
                    {{ map.mapName }}
                  </div>
                </td>

                <!-- Player 1 Stats -->
                <td class="p-2 text-center bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ map.player1Totals.score?.toLocaleString() }}
                  </div>
                </td>
                <td
                  v-if="showExtraColumns"
                  class="p-2 text-center bg-cyan-500/5"
                >
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ map.player1Totals.kills?.toLocaleString() }}
                  </div>
                </td>
                <td
                  v-if="showExtraColumns"
                  class="p-2 text-center bg-cyan-500/5"
                >
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ map.player1Totals.deaths?.toLocaleString() }}
                  </div>
                </td>
                <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                  <div
                    class="font-bold text-xs font-mono"
                    :class="{
                      'text-green-400': parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) > parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)),
                      'text-cyan-400': parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) <= parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths))
                    }"
                  >
                    {{ calculateKDR(map.player1Totals.kills, map.player1Totals.deaths) }}
                  </div>
                </td>

                <!-- Player 2 Stats -->
                <td class="p-2 text-center bg-orange-500/5 border-l-2 border-l-orange-400/40">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ map.player2Totals.score?.toLocaleString() }}
                  </div>
                </td>
                <td
                  v-if="showExtraColumns"
                  class="p-2 text-center bg-orange-500/5"
                >
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ map.player2Totals.kills?.toLocaleString() }}
                  </div>
                </td>
                <td
                  v-if="showExtraColumns"
                  class="p-2 text-center bg-orange-500/5"
                >
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ map.player2Totals.deaths?.toLocaleString() }}
                  </div>
                </td>
                <td class="p-2 text-center bg-orange-500/5">
                  <div
                    class="font-bold text-xs font-mono"
                    :class="{
                      'text-green-400': parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) > parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)),
                      'text-orange-400': parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) <= parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths))
                    }"
                  >
                    {{ calculateKDR(map.player2Totals.kills, map.player2Totals.deaths) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Head-to-Head Encounters -->
    <div
      v-if="comparisonData.headToHead && comparisonData.headToHead.length > 0"
      class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      <div class="p-6 border-b border-slate-700/50">
        <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 flex items-center gap-3">
          ⚔️ Head-to-Head Encounters
        </h3>
      </div>
      <div class="overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <!-- Table Header -->
            <thead class="sticky top-0 z-10">
              <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 min-w-[120px]">
                  <div class="flex items-center gap-2">
                    <span class="text-slate-400 text-xs">📅</span>
                    <span class="font-mono font-bold">DATE</span>
                  </div>
                </th>
                <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 min-w-[140px]">
                  <div class="flex items-center gap-2">
                    <span class="text-blue-400 text-xs">🗺️</span>
                    <span class="font-mono font-bold">MAP</span>
                  </div>
                </th>

                <!-- Player 1 Headers -->
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-cyan-400 border-b border-slate-700/30 bg-cyan-500/10 border-l-4 border-l-cyan-400/60"
                  colspan="3"
                >
                  <div class="flex items-center justify-center gap-2">
                    <span class="font-mono font-bold text-sm">{{ comparisonData.player1 }}</span>
                  </div>
                </th>

                <!-- Player 2 Headers -->
                <th
                  class="p-2 text-center font-bold text-xs uppercase tracking-wide text-orange-400 border-b border-slate-700/30 bg-orange-500/10 border-l-4 border-l-orange-400/60"
                  colspan="3"
                >
                  <div class="flex items-center justify-center gap-2">
                    <span class="font-mono font-bold text-sm">{{ comparisonData.player2 }}</span>
                  </div>
                </th>
              </tr>
              <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
                <th class="p-2 border-b border-slate-700/30" />
                <th class="p-2 border-b border-slate-700/30" />

                <!-- Player 1 Sub Headers -->
                <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-l-4 border-l-cyan-400/60">
                  <div class="flex items-center justify-center gap-1">
                    <span>🎖️</span>
                    <span class="font-mono">SCORE</span>
                  </div>
                </th>
                <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5">
                  <div class="flex items-center justify-center gap-1">
                    <span>⚔️</span>
                    <span class="font-mono">KILLS</span>
                  </div>
                </th>
                <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-r-4 border-r-cyan-400/60">
                  <div class="flex items-center justify-center gap-1">
                    <span>☠️</span>
                    <span class="font-mono">DEATHS</span>
                  </div>
                </th>

                <!-- Player 2 Sub Headers -->
                <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5 border-l-4 border-l-orange-400/60">
                  <div class="flex items-center justify-center gap-1">
                    <span>🎖️</span>
                    <span class="font-mono">SCORE</span>
                  </div>
                </th>
                <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                  <div class="flex items-center justify-center gap-1">
                    <span>⚔️</span>
                    <span class="font-mono">KILLS</span>
                  </div>
                </th>
                <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                  <div class="flex items-center justify-center gap-1">
                    <span>☠️</span>
                    <span class="font-mono">DEATHS</span>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody>
              <tr
                v-for="(encounter, index) in sortedHeadToHead"
                :key="index"
                class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/20"
              >
                <!-- Date -->
                <td class="p-2">
                  <router-link
                    v-if="encounter.roundId"
                    :to="{
                      name: 'round-report',
                      params: {
                        roundId: encounter.roundId
                      },
                      query: {
                        players: `${comparisonData.player1},${comparisonData.player2}`
                      }
                    }"
                    class="group/link flex flex-col gap-1 hover:bg-blue-600/20 hover:border-blue-500/50 border border-transparent rounded-lg p-2 transition-all duration-300 transform hover:scale-105"
                    :title="`View round report for ${encounter.mapName} on ${formatDate(encounter.timestamp)} with ${comparisonData.player1} and ${comparisonData.player2} highlighted`"
                  >
                    <div class="text-slate-200 font-bold text-xs group-hover/link:text-blue-400">
                      {{ formatDate(encounter.timestamp) }}
                    </div>
                    <div class="text-slate-400 text-xs font-mono group-hover/link:text-blue-300">
                      {{ formatTime(encounter.timestamp) }}
                    </div>
                  </router-link>
                  <div
                    v-else
                    class="flex flex-col gap-1 p-2"
                  >
                    <div class="text-slate-200 font-bold text-xs">
                      {{ formatDate(encounter.timestamp) }}
                    </div>
                    <div class="text-slate-400 text-xs font-mono">
                      {{ formatTime(encounter.timestamp) }}
                    </div>
                  </div>
                </td>

                <!-- Map -->
                <td class="p-2">
                  <div class="font-bold text-blue-400 text-xs truncate font-mono uppercase">
                    {{ encounter.mapName }}
                  </div>
                </td>

                <!-- Player 1 Stats -->
                <td class="p-2 text-center bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ encounter.player1Score?.toLocaleString() }}
                  </div>
                </td>
                <td class="p-2 text-center bg-cyan-500/5">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ encounter.player1Kills }}
                  </div>
                </td>
                <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ encounter.player1Deaths }}
                  </div>
                </td>

                <!-- Player 2 Stats -->
                <td class="p-2 text-center bg-orange-500/5 border-l-2 border-l-orange-400/40">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ encounter.player2Score?.toLocaleString() }}
                  </div>
                </td>
                <td class="p-2 text-center bg-orange-500/5">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ encounter.player2Kills }}
                  </div>
                </td>
                <td class="p-2 text-center bg-orange-500/5">
                  <div class="text-slate-200 font-bold text-xs font-mono">
                    {{ encounter.player2Deaths }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
