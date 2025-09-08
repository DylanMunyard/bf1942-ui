<template>
  <div class="player-history-chart">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-8"
    >
      <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-red-400 text-sm text-center py-4"
    >
      {{ error }}
    </div>

    <!-- Chart -->
    <div
      v-else-if="chartData.length > 0"
      class="space-y-4"
    >
      <!-- Main Chart Container -->
      <div class="relative h-64 bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
        <Line
          :data="mainChartData"
          :options="chartOptions"
        />
      </div>
      
      <!-- Trend Flow Visualization (when rolling average available) -->
      <div 
        v-if="props.insights?.rollingAverage && props.insights.rollingAverage.length > 0"
        class="mt-3 bg-slate-800/20 rounded-lg border border-slate-700/30 p-3"
      >
        <!-- Rolling Window Toggle -->
        <div class="flex items-center gap-2 mb-3">
          <div class="text-xs text-slate-400 font-medium">
            Rolling Average:
          </div>
          <div class="flex gap-1">
            <button
              v-for="option in rollingWindowOptions"
              :key="option.value"
              class="px-2 py-1 text-xs font-medium transition-all duration-200 rounded border"
              :class="{
                'text-white bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400/50 shadow-sm': props.rollingWindow === option.value,
                'text-slate-400 bg-slate-700/30 border-slate-600/50 hover:text-purple-400 hover:bg-slate-600/50 hover:border-purple-500/50': props.rollingWindow !== option.value
              }"
              :disabled="props.loading"
              @click="handleRollingWindowChange(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <TrendFlow 
          :rolling-data="props.insights.rollingAverage"
          :period="props.period || ''"
        />
      </div>
      
    </div>

    <!-- No Data State -->
    <div
      v-else
      class="text-slate-400 text-sm text-center py-8"
    >
      No historical data available
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { PlayerHistoryDataPoint, PlayerHistoryInsights, RollingAverageDataPoint } from '../types/playerStatsTypes'
import TrendFlow from './TrendFlow.vue'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, annotationPlugin)

interface Props {
  chartData: PlayerHistoryDataPoint[]
  insights?: PlayerHistoryInsights | null
  period?: string
  rollingWindow?: string
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  insights: null,
  period: '1d',
  rollingWindow: '7d',
  loading: false,
  error: null
})

const emit = defineEmits<{
  'rolling-window-change': [rollingWindow: string];
}>()

// Rolling window options
const rollingWindowOptions = [
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '1 Month' }
]

// Handle rolling window change
const handleRollingWindowChange = (rollingWindow: string) => {
  emit('rolling-window-change', rollingWindow)
}

// Computed properties for stats - use insights when available, fallback to calculated
const peakPlayers = computed(() => {
  if (props.insights?.peakPlayers) return props.insights.peakPlayers
  if (props.chartData.length === 0) return 0
  return Math.max(...props.chartData.map(d => d.totalPlayers))
})

const minPlayers = computed(() => {
  if (props.insights?.lowestPlayers) return props.insights.lowestPlayers
  if (props.chartData.length === 0) return 0
  return Math.min(...props.chartData.map(d => d.totalPlayers))
})

const averagePlayers = computed(() => {
  if (props.insights?.overallAverage) return Math.round(props.insights.overallAverage)
  if (props.chartData.length === 0) return 0
  const sum = props.chartData.reduce((acc, d) => acc + d.totalPlayers, 0)
  return Math.round(sum / props.chartData.length)
})

const peakTime = computed(() => {
  const timestamp = props.insights?.peakTimestamp || props.chartData.find(d => d.totalPlayers === peakPlayers.value)?.timestamp
  if (!timestamp) return ''
  const utcDate = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z')
  return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
         utcDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

const minTime = computed(() => {
  const timestamp = props.insights?.lowestTimestamp || props.chartData.find(d => d.totalPlayers === minPlayers.value)?.timestamp
  if (!timestamp) return ''
  const utcDate = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z')
  return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
         utcDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

// Basic trend info for subtle data enhancement (no alarming messages)
const trendDirection = computed(() => props.insights?.trendDirection || 'stable')
const percentageChange = computed(() => props.insights?.percentageChange || 0)

// Main chart data configuration (clean, no overlays)
const mainChartData = computed(() => {
  if (props.chartData.length === 0) {
    return { labels: [], datasets: [] }
  }

  // Convert timestamps to readable labels (ensure proper UTC to local conversion)
  const labels = props.chartData.map(point => {
    // Ensure the timestamp is properly parsed as UTC
    const utcDate = new Date(point.timestamp.endsWith('Z') ? point.timestamp : point.timestamp + 'Z')
    
    // Format in user's local timezone
    return utcDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    }) + ' ' + utcDate.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  })

  // Create gradient datasets based on proximity to min/max
  const dataPoints = props.chartData.map(point => point.totalPlayers)
  const range = peakPlayers.value - minPlayers.value
  
  // Create point colors based on value ranges
  const pointColors = dataPoints.map(value => {
    const normalizedValue = (value - minPlayers.value) / Math.max(range, 1)
    if (value === peakPlayers.value) return '#ef4444' // Red for peak
    if (value === minPlayers.value) return '#3b82f6' // Blue for minimum  
    if (normalizedValue > 0.8) return '#f59e0b' // Amber for high
    if (normalizedValue < 0.2) return '#06b6d4' // Cyan for low
    return '#10b981' // Green for normal
  })

  const datasets = [
    {
      label: 'Players Online',
      data: dataPoints,
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.15)',
      fill: true,
      tension: 0.5,
      pointRadius: 0,
      pointHoverRadius: 8,
      pointBackgroundColor: pointColors,
      pointBorderColor: pointColors,
      pointBorderWidth: 2,
      borderWidth: 3,
      order: 0 // Always on top
    }
  ]

  // Keep main chart clean - rolling average will be shown separately below

  return {
    labels,
    datasets
  }
})

// Chart.js options configuration
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: '#94a3b8',
        font: {
          size: 11
        },
        usePointStyle: true,
        pointStyle: 'circle',
        // Clean legend with just the main data
        filter: () => true
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#f1f5f9',
      bodyColor: '#cbd5e1',
      borderColor: '#475569',
      borderWidth: 1,
      callbacks: {
        title: (context: any) => {
          const point = props.chartData[context[0].dataIndex]
          // Ensure the timestamp is properly parsed as UTC
          const utcDate = new Date(point.timestamp.endsWith('Z') ? point.timestamp : point.timestamp + 'Z')
          return utcDate.toLocaleDateString() + ' ' + utcDate.toLocaleTimeString()
        },
        label: (context: any) => {
          const value = context.parsed.y
          const peak = peakPlayers.value
          const avg = averagePlayers.value
          const lowest = minPlayers.value
          
          // Determine status with simple emojis
          let status = ''
          if (value === peak) status = ' 🔥 Peak!'
          else if (value === lowest) status = ' 💤 Quietest'
          else if (value >= avg * 1.2) status = ' 🚀 Busy'
          else if (value <= avg * 0.8) status = ' 😴 Quiet'
          else status = ' ⚡ Normal'
          
          const lines = [`${value} players online${status}`]
          
          // Add simple comparisons
          if (value !== peak) {
            const diffFromPeak = peak - value
            lines.push(`${diffFromPeak} less than peak (${peak})`)
          }
          
          if (value !== avg && Math.abs(value - avg) > 1) {
            const diffFromAvg = value - avg
            const comparison = diffFromAvg > 0 ? 'more' : 'less'
            lines.push(`${Math.abs(diffFromAvg)} ${comparison} than average (${avg})`)
          }
          
          if (value !== lowest) {
            const diffFromLowest = value - lowest
            lines.push(`${diffFromLowest} more than quietest (${lowest})`)
          }
          
          return lines
        }
      }
    },
    annotation: {
      annotations: {
        maxLine: {
          type: 'line' as const,
          yMin: peakPlayers.value,
          yMax: peakPlayers.value,
          borderColor: '#ef4444',
          borderWidth: 2,
          borderDash: [8, 4],
          label: {
            content: `Peak: ${peakPlayers.value}`,
            enabled: true,
            position: 'end' as const,
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#ffffff',
            font: {
              size: 10,
              weight: 'bold' as const
            },
            padding: 4,
            cornerRadius: 4
          }
        },
        minLine: {
          type: 'line' as const,
          yMin: minPlayers.value,
          yMax: minPlayers.value,
          borderColor: '#3b82f6',
          borderWidth: 2,
          borderDash: [8, 4],
          label: {
            content: `Lowest: ${minPlayers.value}`,
            enabled: true,
            position: 'start' as const,
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            color: '#ffffff',
            font: {
              size: 10,
              weight: 'bold' as const
            },
            padding: 4,
            cornerRadius: 4
          }
        },
        averageLine: {
          type: 'line' as const,
          yMin: averagePlayers.value,
          yMax: averagePlayers.value,
          borderColor: '#10b981',
          borderWidth: 1,
          borderDash: [4, 4],
          label: {
            content: `Avg: ${averagePlayers.value}`,
            enabled: true,
            position: 'center' as const,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            color: '#ffffff',
            font: {
              size: 10
            },
            padding: 3,
            cornerRadius: 3
          }
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
      },
      ticks: {
        color: '#64748b',
        font: {
          size: 10
        },
        maxTicksLimit: 8
      }
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
      },
      ticks: {
        color: '#64748b',
        font: {
          size: 10
        }
      },
      title: {
        display: true,
        text: 'Players Online',
        color: '#06b6d4',
        font: {
          size: 12
        }
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
}))
</script>

<style scoped>
/* Clean chart styling */
.player-history-chart {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>