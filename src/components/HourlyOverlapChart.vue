<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface HourlyOverlap {
  hour: number;
  player1Minutes: number;
  player2Minutes: number;
  overlapMinutes: number;
}

interface Props {
  hourlyOverlap: HourlyOverlap[];
  player1Name: string;
  player2Name: string;
  isDarkMode: boolean;
  chartKey: number;
}

const props = defineProps<Props>();

const hourlyOverlapData = computed(() => {
  const byHour = new Map<number, HourlyOverlap>();
  for (const entry of props.hourlyOverlap) {
    byHour.set(entry.hour, entry);
  }
  return Array.from({ length: 24 }, (_, hour) =>
    byHour.get(hour) ?? { hour, player1Minutes: 0, player2Minutes: 0, overlapMinutes: 0 }
  );
});

const chartData = computed(() => {
  if (!props.hourlyOverlap?.length) return null;
  const labels = hourlyOverlapData.value.map(entry => `${entry.hour.toString().padStart(2, '0')}:00`);
  return {
    labels,
    datasets: [
      {
        label: props.player1Name,
        data: hourlyOverlapData.value.map(entry => entry.player1Minutes),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3
      },
      {
        label: props.player2Name,
        data: hourlyOverlapData.value.map(entry => entry.player2Minutes),
        borderColor: '#fb923c',
        backgroundColor: 'rgba(251, 146, 60, 0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3
      },
      {
        label: 'Overlap',
        data: hourlyOverlapData.value.map(entry => entry.overlapMinutes),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.25)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3
      }
    ]
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  scales: {
    x: {
      grid: {
        color: props.isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'
      },
      ticks: {
        color: props.isDarkMode ? '#94a3b8' : '#475569',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12
      }
    },
    y: {
      grid: {
        color: props.isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'
      },
      ticks: {
        color: props.isDarkMode ? '#94a3b8' : '#475569',
        callback: (value: string | number) => `${Math.round(Number(value))}m`
      }
    }
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: props.isDarkMode ? '#e2e8f0' : '#0f172a',
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: props.isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      displayColors: true,
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${Math.round(context.parsed.y)}m`
      }
    }
  }
}));
</script>

<template>
  <div
    v-if="hourlyOverlap && hourlyOverlap.length > 0"
    class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
  >
    <div class="p-6 border-b border-slate-700/50">
      <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
        ⏱️ Playtime Overlap (Last 30 Days)
      </h3>
    </div>
    <div class="p-6 space-y-3">
      <div class="h-64">
        <Line
          v-if="chartData"
          :key="chartKey"
          :data="chartData"
          :options="chartOptions"
        />
      </div>
      <p class="text-xs text-slate-500">
        Overlap is calculated from simultaneous session time, grouped by hour (UTC).
      </p>
    </div>
  </div>
</template>
