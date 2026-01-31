<template>
  <div class="player-history-chart">
    <!-- Initial Loading State (only when no data exists) -->
    <div
      v-if="loading && chartData.length === 0"
      class="flex items-center justify-center py-8"
    >
      <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error && chartData.length === 0"
      class="text-red-400 text-sm text-center py-4"
    >
      {{ error }}
    </div>

    <!-- Chart Container (always show when data exists, even during loading) -->
    <div
      v-else-if="chartData.length > 0"
      class="space-y-4"
    >
      <!-- Main Chart Container with Rolling Average Overlay -->
      <div class="relative h-64 bg-neutral-800/30 rounded-lg border border-neutral-700/50 p-4">
        <!-- Loading Overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 bg-neutral-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
        >
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <div class="text-cyan-400 text-sm font-medium">
              Updating chart...
            </div>
          </div>
        </div>

        <Line
          :key="`chart-${chartData.length}-${period}-${rollingWindow}`"
          :data="mainChartData"
          :options="chartOptions"
        />
      </div>

      <!-- Rolling Window Toggle (above the chart) -->
      <div
        v-if="props.insights?.rollingAverage && props.insights.rollingAverage.length > 0"
        class="flex items-center gap-2"
      >
        <div class="text-xs text-neutral-400 font-medium">
          Rolling Average:
        </div>
        <div class="flex gap-1">
          <button
            v-for="option in rollingWindowOptions"
            :key="option.value"
            class="px-2 py-1 text-xs font-medium transition-all duration-200 rounded border"
            :class="{
              'text-white bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400/50 shadow-sm': props.rollingWindow === option.value,
              'text-neutral-400 bg-neutral-700/30 border-neutral-600/50 hover:text-purple-400 hover:bg-neutral-600/50 hover:border-purple-500/50': props.rollingWindow !== option.value
            }"
            :disabled="props.loading"
            @click="handleRollingWindowChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div
      v-else-if="!loading && chartData.length === 0"
      class="text-neutral-400 text-sm text-center py-8"
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
import { PlayerHistoryDataPoint, PlayerHistoryInsights } from '../types/playerStatsTypes'

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


// Weekend detection for highlighting
const getWeekendAnnotations = () => {
  if (props.chartData.length === 0) return {}
  
  const annotations: any = {}
  let annotationIndex = 0
  
  
  // Group consecutive weekend periods together
  const weekendPeriods: { startIndex: number, endIndex: number }[] = []
  let currentWeekendStart: number | null = null
  
  props.chartData.forEach((point, index) => {
    const utcDate = new Date(point.timestamp.endsWith('Z') ? point.timestamp : point.timestamp + 'Z')
    const dayOfWeek = utcDate.getDay() // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    if (isWeekend) {
      // Start a new weekend period if we're not already in one
      if (currentWeekendStart === null) {
        currentWeekendStart = index
      }
    } else {
      // End the current weekend period if we were in one
      if (currentWeekendStart !== null) {
        weekendPeriods.push({
          startIndex: currentWeekendStart,
          endIndex: index - 1
        })
        currentWeekendStart = null
      }
    }
  })
  
  // Handle case where weekend extends to the end of the data
  if (currentWeekendStart !== null) {
    weekendPeriods.push({
      startIndex: currentWeekendStart,
      endIndex: props.chartData.length - 1
    })
  }
  
  // Create weekend annotations for each continuous weekend period
  weekendPeriods.forEach((period) => {
    annotations[`weekend-${annotationIndex}`] = {
      type: 'box' as const,
      xMin: period.startIndex,
      xMax: period.endIndex,
      yMin: 'min',
      yMax: 'max',
      backgroundColor: 'rgba(255, 193, 7, 0.08)', // Very subtle amber shading
      borderColor: 'transparent', // No border for softer look
      borderWidth: 0,
      label: {
        content: 'Weekend',
        enabled: true,
        position: 'top' as const,
        backgroundColor: 'rgba(255, 193, 7, 0.7)',
        color: '#ffffff',
        font: {
          size: 8,
          weight: 'bold' as const
        },
        padding: 2,
        cornerRadius: 3,
        // Make label more subtle
        opacity: 0.8
      }
    }
    annotationIndex++
  })
  
  return annotations
}

// Main chart data configuration with rolling average overlay
const mainChartData = computed(() => {
  if (props.chartData.length === 0) {
    return { labels: [], datasets: [] }
  }

  // Convert timestamps to readable labels with day names (ensure proper UTC to local conversion)
  const labels = props.chartData.map(point => {
    // Ensure the timestamp is properly parsed as UTC
    const utcDate = new Date(point.timestamp.endsWith('Z') ? point.timestamp : point.timestamp + 'Z')

    // Format in user's local timezone with day name
    return utcDate.toLocaleDateString(undefined, {
      weekday: 'short',
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

  // Add rolling average overlay if available
  if (props.insights?.rollingAverage && props.insights.rollingAverage.length > 0) {
    const rollingAverageValues = props.insights.rollingAverage.map(point => point.average)
    datasets.push({
      label: `Rolling Average (${props.rollingWindow})`,
      data: rollingAverageValues,
      borderColor: '#a78bfa', // Purple/Violet
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.6, // Slightly smoother curve
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 2.5, // Slightly thicker
      borderDash: [5, 5], // Dashed line
      opacity: 0.6, // Lower opacity
      order: 1
    } as any)
  }

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
      padding: 12,
      callbacks: {
        title: (context: any) => {
          const point = props.chartData[context[0].dataIndex]
          // Ensure the timestamp is properly parsed as UTC
          const utcDate = new Date(point.timestamp.endsWith('Z') ? point.timestamp : point.timestamp + 'Z')
          return utcDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          }) + ' ' + utcDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        label: (context: any) => {
          const datasetLabel = context.dataset.label
          const value = context.parsed.y

          // For "Players Online" (raw data)
          if (datasetLabel === 'Players Online') {
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

            const lines = [`Raw players: ${value}${status}`]

            // Add rolling average if available
            if (props.insights?.rollingAverage && props.insights.rollingAverage[context.dataIndex] !== undefined) {
              const rollingAvgDataPoint = props.insights.rollingAverage[context.dataIndex]
              lines.push(`${props.rollingWindow} rolling avg: ${rollingAvgDataPoint.average.toFixed(1)}`)
            }

            return lines
          }

          // For rolling average line - don't show label since it's already shown in Players Online tooltip
          if (datasetLabel?.includes('Rolling Average')) {
            return ''
          }

          return `${value}`
        }
      }
    },
    annotation: {
      annotations: {
        // Weekend highlighting
        ...getWeekendAnnotations(),
        // Statistical lines
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