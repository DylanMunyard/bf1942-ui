<template>
  <div class="player-history-chart">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-red-400 text-sm text-center py-4">
      {{ error }}
    </div>

    <!-- Chart -->
    <div v-else-if="chartData.length > 0" class="space-y-4">
      <!-- Chart Container -->
      <div class="relative h-64 bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
        <Line :data="chartJsData" :options="chartOptions" />
      </div>
      
      <!-- Stats Summary -->
      <div class="grid grid-cols-2 gap-4 text-center">
        <div class="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3">
          <div class="text-xs text-slate-400">Peak Players</div>
          <div class="text-lg font-mono text-cyan-400">{{ peakPlayers }}</div>
        </div>
        <div class="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3">
          <div class="text-xs text-slate-400">Average Players</div>
          <div class="text-lg font-mono text-green-400">{{ averagePlayers }}</div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="text-slate-400 text-sm text-center py-8">
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
import { PlayerHistoryDataPoint } from '../types/playerStatsTypes'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  chartData: PlayerHistoryDataPoint[]
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

// Computed properties for stats
const peakPlayers = computed(() => {
  if (props.chartData.length === 0) return 0
  return Math.max(...props.chartData.map(d => d.totalPlayers))
})

const averagePlayers = computed(() => {
  if (props.chartData.length === 0) return 0
  const sum = props.chartData.reduce((acc, d) => acc + d.totalPlayers, 0)
  return Math.round(sum / props.chartData.length)
})

// Chart.js data configuration
const chartJsData = computed(() => {
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

  return {
    labels,
    datasets: [
      {
        label: 'Players Online',
        data: props.chartData.map(point => point.totalPlayers),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      }
    ]
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
          size: 12
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
          const datasetLabel = context.dataset.label
          const value = context.parsed.y
          return `${datasetLabel}: ${value}`
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