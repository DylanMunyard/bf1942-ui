<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import PlayerName from '../PlayerName.vue';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  pinnedPlayers: Set<string>;
  roundReport: any;
  selectedSnapshotIndex: number;
  serverGuid: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'clear-all-pinned': [];
}>();

// Track theme changes for chart reactivity
const themeWatcher = ref(0);

// Pinned players performance over time
const pinnedPlayersPerformance = computed(() => {
  if (!props.pinnedPlayers.size || !props.roundReport) return {};
  
  const performances: Record<string, any[]> = {};
  
  Array.from(props.pinnedPlayers).forEach(playerName => {
    performances[playerName] = props.roundReport.leaderboardSnapshots.map((snap: any, idx: number) => {
      const entry = snap.entries.find((e: any) => e.playerName === playerName);
      if (!entry) return null;
      return {
        snapshotIndex: idx,
        timestamp: snap.timestamp,
        ...entry
      };
    }).filter(Boolean);
  });
  
  return performances;
});

// Chart data for pinned players
const pinnedPlayersChartData = computed(() => {
  if (!props.pinnedPlayers.size || !props.roundReport) return { labels: [], datasets: [] };
  
  const labels = props.roundReport.leaderboardSnapshots.map((snap: any) => 
    getElapsedTime(snap.timestamp)
  );
  
  const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
  const datasets = Array.from(props.pinnedPlayers).map((playerName, index) => {
    const performance = pinnedPlayersPerformance.value[playerName] || [];
    const data = props.roundReport.leaderboardSnapshots.map((snap: any, idx: number) => {
      const entry = performance.find((p: any) => p.snapshotIndex === idx);
      return entry ? entry.score : null;
    });
    
    const pointRadii = data.map((_, idx) => idx === props.selectedSnapshotIndex ? 8 : 3);
    const pointBackgroundColors = data.map((_, idx) => 
      idx === props.selectedSnapshotIndex ? '#FFD700' : colors[index % colors.length]
    );
    const pointBorderColors = data.map((_, idx) => 
      idx === props.selectedSnapshotIndex ? '#FF6B00' : '#ffffff'
    );
    const pointBorderWidths = data.map((_, idx) => idx === props.selectedSnapshotIndex ? 3 : 2);
    
    return {
      label: playerName,
      backgroundColor: colors[index % colors.length] + '20',
      borderColor: colors[index % colors.length],
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      pointRadius: pointRadii,
      pointHoverRadius: 10,
      pointBackgroundColor: pointBackgroundColors,
      pointBorderColor: pointBorderColors,
      pointBorderWidth: pointBorderWidths,
      data
    };
  });
  
  return { labels, datasets };
});

// Chart options with theme support
const pinnedPlayersChartOptions = computed(() => {
  themeWatcher.value; // Include in dependencies
  
  const computedStyles = window.getComputedStyle(document.documentElement);
  const textColor = computedStyles.getPropertyValue('--color-text').trim() || '#333333';
  const textMutedColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#666666';
  const isDarkMode = computedStyles.getPropertyValue('--color-background').trim().includes('26, 16, 37') || 
                    document.documentElement.classList.contains('dark-mode') ||
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    animation: {
      duration: 300,
      easing: 'easeInOutQuad'
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: gridColor
        },
        title: {
          display: true,
          text: 'Score',
          color: textMutedColor,
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          color: textMutedColor,
          font: {
            weight: '500'
          }
        }
      },
      x: {
        grid: {
          color: gridColor
        },
        title: {
          display: true,
          text: 'Elapsed Time',
          color: textMutedColor,
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          color: textMutedColor,
          maxTicksLimit: 8,
          font: {
            weight: '500'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: 'line',
          font: {
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(35, 21, 53, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: isDarkMode ? '#ffffff' : '#ffffff',
        bodyColor: isDarkMode ? '#ffffff' : '#ffffff',
        borderColor: isDarkMode ? '#805ad5' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            const playerName = context.dataset.label;
            const snapshotIndex = context.dataIndex;
            const performance = pinnedPlayersPerformance.value[playerName];
            if (performance) {
              const point = performance.find((p: any) => p.snapshotIndex === snapshotIndex);
              if (point) {
                return `${playerName}: ${point.score} | ${point.kills} | ${point.deaths}`;
              }
            }
            return `${playerName}: ${context.parsed.y}`;
          }
        }
      }
    }
  };
});

// Theme change handling
const handleThemeChange = () => {
  themeWatcher.value++;
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

onMounted(() => {
  mediaQuery.addEventListener('change', handleThemeChange);
  const observer = new MutationObserver(handleThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  });
  
  (window as any)._themeObserver = observer;
});

onUnmounted(() => {
  mediaQuery.removeEventListener('change', handleThemeChange);
  if ((window as any)._themeObserver) {
    (window as any)._themeObserver.disconnect();
    delete (window as any)._themeObserver;
  }
});

// Helper function to calculate elapsed time
const getElapsedTime = (timestamp: string): string => {
  if (!props.roundReport) return '+0m';
  
  const roundStart = new Date(props.roundReport.round.startTime);
  const snapshotTime = new Date(timestamp);
  const diffMs = snapshotTime.getTime() - roundStart.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `+${hours}h ${minutes}m`;
  } else {
    return `+${totalMinutes}m`;
  }
};
</script>

<template>
  <div
    v-if="pinnedPlayers.size > 0"
    class="performance-chart-section"
  >
    <div class="pinned-players-info">
      <h3>📌 Pinned Players Performance</h3>
      <div class="pinned-players-badges">
        <div
          v-for="playerName in Array.from(pinnedPlayers)"
          :key="playerName"
          class="pinned-player-badge"
        >
          <PlayerName
            :name="playerName"
            source="round-report-pinned"
            :server-guid="serverGuid"
          />
        </div>
        <button
          v-if="pinnedPlayers.size > 1"
          class="clear-all-button"
          title="Clear all pinned players"
          @click="$emit('clear-all-pinned')"
        >
          Clear All
        </button>
      </div>
    </div>
    
    <div
      v-if="pinnedPlayersChartData.datasets.length > 0"
      class="performance-chart-container"
    >
      <div class="chart-wrapper">
        <Line
          :data="pinnedPlayersChartData"
          :options="pinnedPlayersChartOptions"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-chart-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.pinned-players-info {
  margin-bottom: 12px;
}

.pinned-players-info h3 {
  margin: 0 0 8px 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.pinned-players-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pinned-player-badge {
  background: #ffd600;
  color: #000;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.clear-all-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--color-text);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-button:hover {
  background: var(--color-background-mute);
}

.performance-chart-container {
  @apply bg-slate-800/40 backdrop-blur-sm border border-slate-700/50;
  border-radius: 12px;
  padding: 12px;
}

@media (prefers-color-scheme: dark) {
  .performance-chart-container {
    background: rgba(255, 255, 255, 0.05);
  }
}

html[data-theme="dark"] .performance-chart-container,
.dark-mode .performance-chart-container {
  background: rgba(255, 255, 255, 0.05);
}

.chart-wrapper {
  height: 200px;
  position: relative;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .performance-chart-section {
    padding: 8px;
  }
  
  .pinned-players-info h3 {
    font-size: 0.9rem;
  }
  
  .pinned-players-badges {
    justify-content: center;
  }
  
  .chart-wrapper {
    height: 150px;
  }
}

@media (max-width: 480px) {
  .pinned-player-badge {
    font-size: 0.8rem;
    padding: 3px 8px;
  }
  
  .clear-all-button {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .chart-wrapper {
    height: 120px;
  }
}
</style>