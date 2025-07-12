<template>
  <div class="map-stats-section">
    <div class="section-header">
      <h3>Map Statistics</h3>
      <select v-model="selectedTimeRange" class="time-range-select">
        <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <div v-if="loading" class="loading-state">
      Loading map statistics...
    </div>
    
    <div v-else-if="mapStats.length > 0" class="map-stats-grid">
      <div class="stats-header">
        <button 
          @click="sortMapStats('mapName')"
          class="sort-btn"
          :class="{ 'active': sortField === 'mapName' }"
        >
          Map Name {{ getSortIcon('mapName') }}
        </button>
        <button 
          @click="sortMapStats('totalScore')"
          class="sort-btn"
          :class="{ 'active': sortField === 'totalScore' }"
        >
          Total Score {{ getSortIcon('totalScore') }}
        </button>
        <button 
          @click="sortMapStats('kills')"
          class="sort-btn"
          :class="{ 'active': sortField === 'kills' }"
        >
          Kills {{ getSortIcon('kills') }}
        </button>
        <button 
          @click="sortMapStats('deaths')"
          class="sort-btn"
          :class="{ 'active': sortField === 'deaths' }"
        >
          Deaths {{ getSortIcon('deaths') }}
        </button>
        <button 
          @click="sortMapStats('playTimeMinutes')"
          class="sort-btn"
          :class="{ 'active': sortField === 'playTimeMinutes' }"
        >
          Play Time {{ getSortIcon('playTimeMinutes') }}
        </button>
      </div>
      
      <div class="stats-rows">
        <div v-for="stat in sortedMapStats" :key="stat.mapName" class="stat-row">
          <div class="stat-cell map-name">{{ stat.mapName }}</div>
          <div class="stat-cell">{{ stat.totalScore.toLocaleString() }}</div>
          <div class="stat-cell">{{ stat.kills.toLocaleString() }}</div>
          <div class="stat-cell">{{ stat.deaths.toLocaleString() }}</div>
          <div class="stat-cell">{{ formatPlayTime(stat.playTimeMinutes) }}</div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-data-message">
      No map statistics available for the selected time range.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface MapStat {
  mapName: string;
  totalScore: number;
  kills: number;
  deaths: number;
  playTimeMinutes: number;
}

interface Props {
  playerName: string;
  serverGuid: string;
  initialTimeRange?: string;
}

const props = defineProps<Props>();

const mapStats = ref<MapStat[]>([]);
const loading = ref(false);
const selectedTimeRange = ref(props.initialTimeRange || 'Last30Days');
const sortField = ref('totalScore');
const sortDirection = ref('desc');

const timeRangeOptions = [
  { value: 'Last30Days', label: '30 days' },
  { value: 'ThisYear', label: 'This Year' },
  { value: 'LastYear', label: 'Last Year' }
];

const sortedMapStats = computed(() => {
  if (!mapStats.value.length) return [];
  
  return [...mapStats.value].sort((a, b) => {
    const aValue = a[sortField.value as keyof MapStat];
    const bValue = b[sortField.value as keyof MapStat];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection.value === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection.value === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });
});

const fetchMapStats = async () => {
  loading.value = true;
  try {
    const response = await fetch(`/stats/players/${encodeURIComponent(props.playerName)}/server/${props.serverGuid}/mapstats?range=${selectedTimeRange.value}`);
    if (!response.ok) throw new Error('Failed to fetch map stats');
    mapStats.value = await response.json();
  } catch (err) {
    console.error('Error fetching map stats:', err);
    mapStats.value = [];
  } finally {
    loading.value = false;
  }
};

const sortMapStats = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'desc';
  }
};

const getSortIcon = (field: string) => {
  if (sortField.value !== field) return '↕';
  return sortDirection.value === 'asc' ? '↑' : '↓';
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (hours === 1) {
    return `${hours}h ${remainingMinutes}m`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

// Watch for time range changes
watch(selectedTimeRange, fetchMapStats);

// Fetch initial data
fetchMapStats();
</script>

<style scoped>
.map-stats-section {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-soft);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.section-header h3 {
  margin: 0;
  color: var(--color-text);
}

.time-range-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
}

.map-stats-grid {
  padding: 1rem;
}

.stats-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.sort-btn {
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--color-text);
}

.sort-btn:hover {
  background: var(--color-background-soft);
}

.sort-btn.active {
  background: var(--color-brand);
  color: white;
}

.stats-rows {
  display: grid;
  gap: 0.5rem;
}

.stat-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.5rem;
  background: var(--color-background);
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.stat-cell {
  padding: 0.25rem;
  color: var(--color-text);
}

.map-name {
  font-weight: 500;
}

.loading-state, .no-data-message {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}
</style> 