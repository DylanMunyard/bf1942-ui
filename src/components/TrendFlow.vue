<template>
  <div class="trend-flow">
    <!-- Smooth Line Chart for Rolling Average -->
    <div class="relative h-16 bg-slate-800/40 rounded-lg overflow-hidden border border-slate-700/30">
      <!-- Chart Canvas -->
      <canvas 
        ref="chartCanvas"
        class="absolute inset-0 w-full h-full"
        :width="canvasWidth"
        :height="canvasHeight"
      />
      
      
      <!-- Hover tooltip with value and time -->
      <div 
        v-if="hoveredPoint"
        class="absolute bg-slate-900/95 border border-slate-600/50 rounded px-2 py-1 text-xs font-mono pointer-events-none z-10 whitespace-nowrap"
        :style="{ 
          left: Math.max(0, Math.min(hoveredPoint.x - 30, canvasWidth - 80)) + 'px', 
          top: Math.max(0, hoveredPoint.y - 35) + 'px' 
        }"
      >
        <div class="text-slate-200 font-medium">{{ hoveredPoint.value.toFixed(0) }} players</div>
        <div class="text-slate-400">{{ hoveredPoint.date }}</div>
      </div>
    </div>
    
    <!-- Trend insights -->
    <div class="mt-2 flex items-center justify-between text-xs">
      <div class="text-slate-400">
        Range: {{ minValue.toFixed(0) }} - {{ maxValue.toFixed(0) }} players
      </div>
      <div class="text-slate-400">
        {{ getPeriodLabel() }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RollingAverageDataPoint } from '../types/playerStatsTypes'

interface Props {
  rollingData: RollingAverageDataPoint[]
  period: string
}

const props = defineProps<Props>()

// Canvas refs and state
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const hoveredPoint = ref<{ x: number, y: number, value: number, date: string } | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(64)

// Computed trend analysis
const values = computed(() => props.rollingData.map(d => d.average))
const minValue = computed(() => Math.min(...values.value))
const maxValue = computed(() => Math.max(...values.value))
const avgValue = computed(() => values.value.reduce((a, b) => a + b, 0) / values.value.length)

const trendChange = computed(() => {
  if (values.value.length < 2) return 0
  const start = values.value[0]
  const end = values.value[values.value.length - 1]
  return ((end - start) / start) * 100
})

const trendDirection = computed(() => {
  if (Math.abs(trendChange.value) < 5) return 'stable'
  return trendChange.value > 0 ? 'increasing' : 'decreasing'
})

// Enhanced data with change calculations
const normalizedData = computed(() => {
  return props.rollingData.map((point, index) => {
    const prevValue = index > 0 ? props.rollingData[index - 1].average : point.average
    const change = index > 0 ? ((point.average - prevValue) / prevValue) * 100 : 0
    
    return {
      date: new Date(point.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: new Date(point.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      value: point.average,
      change: change,
      normalized: (point.average - minValue.value) / (maxValue.value - minValue.value || 1)
    }
  })
})

// Computed positions for min/max labels
const minPosition = computed(() => {
  if (!normalizedData.value.length) return { x: 0, y: 0 }
  const minIndex = normalizedData.value.findIndex(p => p.value === minValue.value)
  const padding = 8
  const chartWidth = canvasWidth.value - (padding * 2)
  const chartHeight = canvasHeight.value - (padding * 2)
  return {
    x: padding + (minIndex / (normalizedData.value.length - 1)) * chartWidth,
    y: padding + (1 - normalizedData.value[minIndex].normalized) * chartHeight
  }
})

const maxPosition = computed(() => {
  if (!normalizedData.value.length) return { x: 0, y: 0 }
  const maxIndex = normalizedData.value.findIndex(p => p.value === maxValue.value)
  const padding = 8
  const chartWidth = canvasWidth.value - (padding * 2)
  const chartHeight = canvasHeight.value - (padding * 2)
  return {
    x: padding + (maxIndex / (normalizedData.value.length - 1)) * chartWidth,
    y: padding + (1 - normalizedData.value[maxIndex].normalized) * chartHeight
  }
})

// Canvas drawing functions
const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas || !normalizedData.value.length) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Setup drawing parameters
  const padding = 8
  const chartWidth = canvas.width - (padding * 2)
  const chartHeight = canvas.height - (padding * 2)

  // Calculate points
  const points = normalizedData.value.map((point, index) => {
    const x = padding + (index / (normalizedData.value.length - 1)) * chartWidth
    const y = padding + (1 - point.normalized) * chartHeight
    return { x, y, ...point }
  })

  // Draw gradient background under curve
  const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding)
  gradient.addColorStop(0, getTrendGradientColor(0.3))
  gradient.addColorStop(1, getTrendGradientColor(0.05))

  ctx.beginPath()
  ctx.moveTo(points[0].x, canvas.height - padding)
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.lineTo(point.x, point.y)
    } else {
      // Smooth curve using quadratic bezier
      const prevPoint = points[index - 1]
      const midX = (prevPoint.x + point.x) / 2
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, (prevPoint.y + point.y) / 2)
      ctx.quadraticCurveTo(midX, (prevPoint.y + point.y) / 2, point.x, point.y)
    }
  })
  ctx.lineTo(points[points.length - 1].x, canvas.height - padding)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  // Draw main trend line
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      const prevPoint = points[index - 1]
      const midX = (prevPoint.x + point.x) / 2
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, (prevPoint.y + point.y) / 2)
      ctx.quadraticCurveTo(midX, (prevPoint.y + point.y) / 2, point.x, point.y)
    }
  })
  ctx.strokeStyle = getTrendLineColor()
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  // Draw data points
  points.forEach(point => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = getPointColor(point.value, point.change)
    ctx.fill()
    
    // Add subtle glow to points
    ctx.shadowColor = getPointColor(point.value, point.change)
    ctx.shadowBlur = 6
    ctx.fill()
    ctx.shadowBlur = 0
  })
}

const getTrendGradientColor = (opacity: number) => {
  switch (trendDirection.value) {
    case 'increasing': return `rgba(34, 197, 94, ${opacity})`
    case 'decreasing': return `rgba(239, 68, 68, ${opacity})`
    default: return `rgba(99, 102, 241, ${opacity})`
  }
}

const getTrendLineColor = () => {
  switch (trendDirection.value) {
    case 'increasing': return '#22c55e'
    case 'decreasing': return '#ef4444'
    default: return '#6366f1'
  }
}

// Mouse interaction
const handleMouseMove = (event: MouseEvent) => {
  const canvas = chartCanvas.value
  if (!canvas || !normalizedData.value.length) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Use display dimensions for calculations
  const padding = 8
  const chartWidth = rect.width - (padding * 2)
  const chartHeight = rect.height - (padding * 2)
  
  let closestPoint = null
  let minDistance = Infinity

  normalizedData.value.forEach((point, index) => {
    const x = padding + (index / (normalizedData.value.length - 1)) * chartWidth
    const y = padding + (1 - point.normalized) * chartHeight
    const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2))
    
    if (distance < minDistance && distance < 25) {
      minDistance = distance
      closestPoint = {
        x: x, // Relative to canvas container
        y: y,
        value: point.value,
        date: `${point.date} ${point.time}`
      }
    }
  })

  hoveredPoint.value = closestPoint
}

const handleMouseLeave = () => {
  hoveredPoint.value = null
}

// Resize observer
const resizeObserver = ref<ResizeObserver | null>(null)

const updateCanvasSize = () => {
  const canvas = chartCanvas.value
  if (!canvas) return

  const container = canvas.parentElement
  if (!container) return

  const rect = container.getBoundingClientRect()
  canvasWidth.value = rect.width
  canvasHeight.value = rect.height
  
  // Set actual canvas size for crisp rendering
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }

  nextTick(() => drawChart())
}

// Visual helpers
const getTrendIcon = () => {
  switch (trendDirection.value) {
    case 'increasing': return '📈'
    case 'decreasing': return '📉'
    default: return '➡️'
  }
}

const getTrendChangeText = () => {
  const change = trendChange.value
  const absChange = Math.abs(change)
  
  if (absChange < 1) return 'No significant change'
  
  const direction = change > 0 ? 'busier' : 'quieter'
  return `${absChange.toFixed(1)}% ${direction}`
}

const getTrendChangeClass = () => {
  const change = trendChange.value
  if (Math.abs(change) < 1) return 'text-slate-400'
  return change > 0 ? 'text-green-400' : 'text-red-400'
}

const getPeriodLabel = () => {
  const periodLabels: Record<string, string> = {
    '1d': '24 hours',
    '3d': '3 days', 
    '7d': '7 days',
    '1month': '1 month',
    '3months': '3 months',
    'thisyear': 'This year',
    'alltime': 'All time'
  }
  return `${periodLabels[props.period] || props.period} average trend`
}

const getPointColor = (value: number, change: number) => {
  // Color based on position in range + recent change
  const position = (value - minValue.value) / (maxValue.value - minValue.value || 1)
  const intensity = 0.8 + (Math.abs(change) * 0.01)
  
  if (change > 2) return `rgba(34, 197, 94, ${intensity})` // Green for growth
  if (change < -2) return `rgba(239, 68, 68, ${intensity})` // Red for decline  
  if (position > 0.7) return `rgba(251, 146, 60, ${intensity})` // Orange for high
  if (position < 0.3) return `rgba(59, 130, 246, ${intensity})` // Blue for low
  return `rgba(139, 92, 246, ${intensity})` // Purple for normal
}

// Lifecycle hooks
onMounted(() => {
  updateCanvasSize()
  
  // Set up resize observer
  if (chartCanvas.value?.parentElement) {
    resizeObserver.value = new ResizeObserver(() => {
      updateCanvasSize()
    })
    resizeObserver.value.observe(chartCanvas.value.parentElement)
  }

  // Add mouse event listeners
  if (chartCanvas.value) {
    chartCanvas.value.addEventListener('mousemove', handleMouseMove)
    chartCanvas.value.addEventListener('mouseleave', handleMouseLeave)
  }
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  
  if (chartCanvas.value) {
    chartCanvas.value.removeEventListener('mousemove', handleMouseMove)
    chartCanvas.value.removeEventListener('mouseleave', handleMouseLeave)
  }
})

// Watch for data changes to redraw
watch(() => props.rollingData, () => {
  nextTick(() => drawChart())
}, { deep: true })

watch([canvasWidth, canvasHeight], () => {
  nextTick(() => drawChart())
})
</script>

<style scoped>
.trend-flow {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>