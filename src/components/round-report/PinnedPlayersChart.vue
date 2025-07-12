<template>
  <div class="pinned-players-chart" v-if="pinnedPlayers.size > 0">
    <div class="chart-header">
      <h3>Pinned Players Performance</h3>
      <button @click="clearAllPinnedPlayers" class="clear-btn">
        Clear All
      </button>
    </div>
    <div class="chart-container">
      <Line
        :data="chartData"
        :options="chartOptions"
        :key="chartKey"
      />
    </div>
    <div class="pinned-players-list">
      <div 
        v-for="playerName in Array.from(pinnedPlayers)" 
        :key="playerName"
        class="pinned-player-item"
      >
        <span class="player-name">{{ playerName }}</span>
        <button @click="removePlayerPin(playerName)" class="remove-btn">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { Line } from 'vue-chartjs';
import { useThemeDetection } from '../../composables/useThemeDetection';
import { useDateFormatters } from '../../composables/useDateFormatters';

interface LeaderboardEntry {
  playerName: string;
  score: number;
  kills: number;
  deaths: number;
  ping: number;
  team: number;
}

interface LeaderboardSnapshot {
  timestamp: string;
  entries: LeaderboardEntry[];
}

interface Props {
  pinnedPlayers: Set<string>;
  leaderboardSnapshots: LeaderboardSnapshot[];
  selectedSnapshotIndex: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  clearAllPinnedPlayers: [];
  removePlayerPin: [playerName: string];
}>();

const { themeWatcher, getChartColors } = useThemeDetection();
const { getElapsedTime } = useDateFormatters();

// Chart key for forcing re-renders
const chartKey = computed(() => `chart-${themeWatcher.value}-${props.selectedSnapshotIndex}`);

// Pinned players performance over time
const pinnedPlayersPerformance = computed(() => {
  if (!props.pinnedPlayers.size || !props.leaderboardSnapshots.length) return {};
  
  const performances: Record<string, any[]> = {};
  
  Array.from(props.pinnedPlayers).forEach(playerName => {
    performances[playerName] = props.leaderboardSnapshots.map((snap, idx) => {
      const entry = snap.entries.find(e => e.playerName === playerName);
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
const chartData = computed(() => {
  if (!props.pinnedPlayers.size || !props.leaderboardSnapshots.length) {
    return { labels: [], datasets: [] };
  }
  
  // Create labels from timestamps
  const labels = props.leaderboardSnapshots.map(snap => 
    getElapsedTime(snap.timestamp)
  );
  
  // Generate a dataset for each pinned player
  const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
  const datasets = Array.from(props.pinnedPlayers).map((playerName, index) => {
    const performance = pinnedPlayersPerformance.value[playerName] || [];
    const data = props.leaderboardSnapshots.map((snap, idx) => {
      const entry = performance.find(p => p.snapshotIndex === idx);
      return entry ? entry.score : null;
    });
    
    // Create dynamic point styling based on current snapshot
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

// Chart options
const chartOptions = computed(() => {
  const colors = getChartColors();
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    animation: {
      duration: 300,
      easing: 'easeInOutQuad' as const
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (Minutes:Seconds)',
          color: colors.textColor
        },
        grid: {
          color: colors.gridColor
        },
        ticks: {
          color: colors.textColor
        }
      },
      y: {
        title: {
          display: true,
          text: 'Score',
          color: colors.textColor
        },
        grid: {
          color: colors.gridColor
        },
        ticks: {
          color: colors.textColor
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: colors.textColor,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: colors.isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: colors.textColor,
        bodyColor: colors.textColor,
        borderColor: colors.gridColor,
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const timestamp = props.leaderboardSnapshots[index]?.timestamp;
            return timestamp ? `Time: ${getElapsedTime(timestamp)}` : '';
          },
          label: (context: any) => {
            const playerName = context.dataset.label;
            const score = context.parsed.y;
            return `${playerName}: ${score?.toLocaleString() || 'N/A'} points`;
          }
        }
      }
    }
  };
});

const clearAllPinnedPlayers = () => {
  emit('clearAllPinnedPlayers');
};

const removePlayerPin = (playerName: string) => {
  emit('removePlayerPin', playerName);
};
</script>

<style scoped>
.pinned-players-chart {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-soft);
  margin-bottom: 1rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.chart-header h3 {
  margin: 0;
  color: var(--color-text);
}

.clear-btn {
  background: var(--color-danger);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 0.8;
}

.chart-container {
  padding: 1rem;
  height: 400px;
}

.pinned-players-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-background-mute);
  border-top: 1px solid var(--color-border);
}

.pinned-player-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-background);
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.player-name {
  color: var(--color-text);
  font-weight: 500;
}

.remove-btn {
  background: var(--color-danger);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 0.8;
}
</style> 