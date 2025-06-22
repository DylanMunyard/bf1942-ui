<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Define the structure for player and comparison data based on the API response
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
  player1Totals: PerformanceStats;
  player2Totals: PerformanceStats;
}

interface HeadToHeadEncounter {
  date: string;
  mapName: string;
  player1Stats: PerformanceStats;
  player2Stats: PerformanceStats;
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

const route = useRoute();
const router = useRouter();

const player1Input = ref('');
const player2Input = ref('');
const comparisonData = ref<ComparisonData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const selectedTimePeriod = ref<'Last30Days' | 'Last6Months' | 'LastYear' | 'AllTime'>('Last30Days');
const timePeriodOptions = [
  { value: 'Last30Days', label: 'Last 30 Days' },
  { value: 'Last6Months', label: 'Last 6 Months' },
  { value: 'LastYear', label: 'Last Year' },
  { value: 'AllTime', label: 'All Time' },
] as const;

const fetchComparisonData = async (player1: string, player2: string) => {
  if (!player1 || !player2) {
    comparisonData.value = null;
    return;
  }
  
  console.log(`Fetching comparison data for ${player1} vs ${player2}`);
  isLoading.value = true;
  error.value = null;
  comparisonData.value = null;

  try {
    const url = `/stats/players/compare?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`;
    console.log(`Making API call to: ${url}`);
    
    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`One or both players not found. Please check the names and try again.`);
      }
      throw new Error('Failed to fetch comparison data. Please try again later.');
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!data || !data.player1 || !data.player2 || !data.killRates || !data.bucketTotals) {
        throw new Error('No comparison data returned. The players may not have any recent overlapping history.');
    }
    
    comparisonData.value = data;
    
    // Update URL for sharing/bookmarking (but don't rely on it for functionality)
    router.replace({ query: { player1, player2 } });
    
  } catch (err: any) {
    console.error('Error fetching comparison data:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleCompare = async () => {
  console.log('handleCompare called');
  console.log('player1Input.value:', player1Input.value);
  console.log('player2Input.value:', player2Input.value);
  
  const p1 = player1Input.value.trim();
  const p2 = player2Input.value.trim();
  
  console.log('p1 after trim:', p1);
  console.log('p2 after trim:', p2);
  
  if (p1 && p2) {
    console.log('Calling fetchComparisonData');
    await fetchComparisonData(p1, p2);
  } else {
    console.log('Not calling fetchComparisonData - one or both inputs are empty');
  }
};

// Initialize from URL parameters on mount
onMounted(() => {
  const urlPlayer1 = route.query.player1 as string;
  const urlPlayer2 = route.query.player2 as string;
  
  if (urlPlayer1 && urlPlayer2) {
    player1Input.value = urlPlayer1;
    player2Input.value = urlPlayer2;
    fetchComparisonData(urlPlayer1, urlPlayer2);
  }
});

const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

const player1KDR = computed(() => {
  if (!comparisonData.value?.bucketTotals) return '0.00';
  const allTimeData = comparisonData.value.bucketTotals.find(bucket => bucket.bucket === 'AllTime');
  if (!allTimeData) return '0.00';
  const { kills, deaths } = allTimeData.player1Totals;
  return calculateKDR(kills, deaths);
});

const player2KDR = computed(() => {
  if (!comparisonData.value?.bucketTotals) return '0.00';
  const allTimeData = comparisonData.value.bucketTotals.find(bucket => bucket.bucket === 'AllTime');
  if (!allTimeData) return '0.00';
  const { kills, deaths } = allTimeData.player2Totals;
  return calculateKDR(kills, deaths);
});

const combinedMapPerformance = computed(() => {
    if (!comparisonData.value?.mapPerformance) return [];
    
    return comparisonData.value.mapPerformance.map(map => {
        const p1Stats = map.player1Totals;
        const p2Stats = map.player2Totals;
        const p1Kdr = p1Stats ? parseFloat(calculateKDR(p1Stats.kills, p1Stats.deaths)) : -1;
        const p2Kdr = p2Stats ? parseFloat(calculateKDR(p2Stats.kills, p2Stats.deaths)) : -1;
        return {
            mapName: map.mapName,
            player1KDR: p1Stats ? calculateKDR(p1Stats.kills, p1Stats.deaths) : 'N/A',
            player2KDR: p2Stats ? calculateKDR(p2Stats.kills, p2Stats.deaths) : 'N/A',
            winner: p1Kdr > p2Kdr ? 'p1' : (p2Kdr > p1Kdr ? 'p2' : 'tie')
        };
    });
});

// Helper computed properties for easier access to player data
const player1KillRate = computed(() => {
  if (!comparisonData.value?.killRates) return 0;
  const player1Data = comparisonData.value.killRates.find(kr => kr.playerName === comparisonData.value?.player1);
  return player1Data?.killRate || 0;
});

const player2KillRate = computed(() => {
  if (!comparisonData.value?.killRates) return 0;
  const player2Data = comparisonData.value.killRates.find(kr => kr.playerName === comparisonData.value?.player2);
  return player2Data?.killRate || 0;
});

const player1AveragePing = computed(() => {
  if (!comparisonData.value?.averagePing) return 0;
  const player1Data = comparisonData.value.averagePing.find(ap => ap.playerName === comparisonData.value?.player1);
  return player1Data?.averagePing || 0;
});

const player2AveragePing = computed(() => {
  if (!comparisonData.value?.averagePing) return 0;
  const player2Data = comparisonData.value.averagePing.find(ap => ap.playerName === comparisonData.value?.player2);
  return player2Data?.averagePing || 0;
});

const getPerformanceData = (bucket: string) => {
  if (!comparisonData.value?.bucketTotals) return null;
  return comparisonData.value.bucketTotals.find(bt => bt.bucket === bucket);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

</script>

<template>
  <div class="player-comparison-container">
    <div class="comparison-header">
      <h1>Player Comparison</h1>
      <div class="input-form">
        <input type="text" v-model="player1Input" placeholder="Player 1 Name" @keyup.enter="handleCompare" />
        <span class="vs-text">vs</span>
        <input type="text" v-model="player2Input" placeholder="Player 2 Name" @keyup.enter="handleCompare" />
        <button @click="handleCompare" :disabled="isLoading || !player1Input.trim() || !player2Input.trim()">
          {{ isLoading ? 'Comparing...' : 'Compare' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Fetching player comparison...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="!comparisonData" class="intro-container">
        <p>Enter two player names above and click "Compare" to see their stats side-by-side.</p>
    </div>

    <div v-if="comparisonData" class="comparison-results">
        <!-- Summary Panel -->
        <div class="summary-panel">
            <div class="player-summary left" :class="{ 'winner': parseFloat(player1KDR) > parseFloat(player2KDR) }">
                <h2>{{ comparisonData.player1 }}</h2>
                <div class="kdr-summary">
                    <span>{{ player1KDR }}</span>
                    <label>Overall K/D</label>
                </div>
            </div>
            <div class="player-summary right" :class="{ 'winner': parseFloat(player2KDR) > parseFloat(player1KDR) }">
                <h2>{{ comparisonData.player2 }}</h2>
                <div class="kdr-summary">
                    <span>{{ player2KDR }}</span>
                    <label>Overall K/D</label>
                </div>
            </div>
        </div>

        <!-- Core Statistics -->
        <div class="comparison-section">
            <h3>Core Statistics</h3>
            <div class="stat-comparison-grid">
                <!-- Kill Rate -->
                <div class="stat-label">Kill Rate (per min)</div>
                <div class="stat-value p1" :class="{ 'better': player1KillRate > player2KillRate }">
                    {{ player1KillRate.toFixed(2) }}
                </div>
                <div class="stat-value p2" :class="{ 'better': player2KillRate > player1KillRate }">
                    {{ player2KillRate.toFixed(2) }}
                </div>

                <!-- Average Ping -->
                <div class="stat-label">Average Ping</div>
                 <div class="stat-value p1" :class="{ 'better': player1AveragePing < player2AveragePing }">
                    {{ Math.round(player1AveragePing) }}ms
                </div>
                <div class="stat-value p2" :class="{ 'better': player2AveragePing < player1AveragePing }">
                    {{ Math.round(player2AveragePing) }}ms
                </div>
            </div>
        </div>
        
        <!-- Performance Over Time -->
        <div class="comparison-section" v-if="comparisonData.bucketTotals && comparisonData.bucketTotals.length > 0">
            <h3>Performance Over Time</h3>
            <div class="tabs">
                <button 
                    v-for="period in timePeriodOptions" 
                    :key="period.value"
                    :class="{ 'active': selectedTimePeriod === period.value }"
                    @click="selectedTimePeriod = period.value">
                    {{ period.label }}
                </button>
            </div>
            <div class="performance-details">
                <div class="performance-grid" v-if="getPerformanceData(selectedTimePeriod)">
                    <div class="grid-header"></div>
                    <div class="grid-header p1-header">{{ comparisonData.player1 }}</div>
                    <div class="grid-header p2-header">{{ comparisonData.player2 }}</div>

                    <div class="grid-label">Score</div>
                    <div class="grid-value p1">{{ getPerformanceData(selectedTimePeriod).player1Totals.score }}</div>
                    <div class="grid-value p2">{{ getPerformanceData(selectedTimePeriod).player2Totals.score }}</div>
                    
                    <div class="grid-label">Kills</div>
                    <div class="grid-value p1">{{ getPerformanceData(selectedTimePeriod).player1Totals.kills }}</div>
                    <div class="grid-value p2">{{ getPerformanceData(selectedTimePeriod).player2Totals.kills }}</div>

                    <div class="grid-label">Deaths</div>
                    <div class="grid-value p1">{{ getPerformanceData(selectedTimePeriod).player1Totals.deaths }}</div>
                    <div class="grid-value p2">{{ getPerformanceData(selectedTimePeriod).player2Totals.deaths }}</div>
                </div>
            </div>
        </div>

        <!-- Map Performance -->
        <div class="comparison-section" v-if="combinedMapPerformance.length > 0">
            <h3>Map Performance</h3>
            <div class="map-performance-table">
                <div class="table-header">
                    <div class="map-name-header">Map</div>
                    <div>{{ comparisonData.player1 }} K/D</div>
                    <div>{{ comparisonData.player2 }} K/D</div>
                </div>
                <div class="table-body">
                    <div v-for="map in combinedMapPerformance" :key="map.mapName" class="table-row">
                        <div class="map-name">{{ map.mapName }}</div>
                        <div class="map-kdr" :class="{ 'winner': map.winner === 'p1' }">{{ map.player1KDR }}</div>
                        <div class="map-kdr" :class="{ 'winner': map.winner === 'p2' }">{{ map.player2KDR }}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Head-to-Head Encounters -->
        <div class="comparison-section" v-if="comparisonData.headToHead && comparisonData.headToHead.length > 0">
            <h3>Head-to-Head Encounters</h3>
            <div class="h2h-table">
                 <div class="h2h-table-header">
                    <div>Date</div>
                    <div>Map</div>
                    <div class="h2h-player-header" colspan="3">{{ comparisonData.player1 }}</div>
                    <div class="h2h-player-header" colspan="3">{{ comparisonData.player2 }}</div>
                </div>
                <div class="h2h-table-subheader">
                    <div></div>
                    <div></div>
                    <div>Score</div>
                    <div>Kills</div>
                    <div>Deaths</div>
                    <div>Score</div>
                    <div>Kills</div>
                    <div>Deaths</div>
                </div>
                <div class="h2h-table-body">
                    <div v-for="(encounter, index) in comparisonData.headToHead" :key="index" class="h2h-table-row">
                        <div>{{ formatDate(encounter.date) }}</div>
                        <div>{{ encounter.mapName }}</div>
                        <div>{{ encounter.player1Stats.score }}</div>
                        <div>{{ encounter.player1Stats.kills }}</div>
                        <div>{{ encounter.player1Stats.deaths }}</div>
                        <div>{{ encounter.player2Stats.score }}</div>
                        <div>{{ encounter.player2Stats.kills }}</div>
                        <div>{{ encounter.player2Stats.deaths }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.player-comparison-container {
  padding: 20px;
  background-color: var(--color-background);
  color: var(--color-text);
  max-width: 1200px;
  margin: 0 auto;
}

.comparison-header {
  text-align: center;
  margin-bottom: 30px;
}

.comparison-header h1 {
  font-size: 2.5rem;
  color: var(--color-heading);
  margin-bottom: 20px;
}

.input-form {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.input-form input {
  padding: 12px 15px;
  font-size: 1rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  width: 250px;
}

.input-form .vs-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text-muted);
}

.input-form button {
  padding: 12px 25px;
  font-size: 1rem;
  font-weight: bold;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.input-form button:hover:not(:disabled) {
  background-color: var(--color-accent);
}

.input-form button:disabled {
  background-color: var(--color-background-mute);
  cursor: not-allowed;
}

.loading-container, .error-container, .intro-container {
  text-align: center;
  padding: 50px 0;
  color: var(--color-text-muted);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto 15px auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-container p {
  color: #ff5252;
  font-size: 1.1rem;
}

.comparison-results {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.comparison-section {
    background-color: var(--color-background-soft);
    border-radius: 8px;
    padding: 20px;
}

.comparison-section h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.5rem;
    color: var(--color-heading);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 10px;
}

/* Summary Panel */
.summary-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    text-align: center;
}

.player-summary {
    background: var(--color-background-soft);
    padding: 20px;
    border-radius: 8px;
    border-bottom: 4px solid var(--color-border);
    transition: all 0.3s ease;
}

.player-summary.winner {
    border-color: #4CAF50; /* Green for winner */
    transform: scale(1.02);
    box-shadow: 0 5px 20px rgba(76, 175, 80, 0.2);
}

.player-summary h2 {
    margin-top: 0;
    font-size: 1.8rem;
    color: var(--color-heading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kdr-summary span {
    font-size: 3rem;
    font-weight: bold;
    color: var(--color-primary);
    line-height: 1;
}

.kdr-summary label {
    display: block;
    font-size: 1rem;
    color: var(--color-text-muted);
    margin-top: 5px;
}

/* Core Statistics */
.stat-comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 15px 20px;
    align-items: center;
}
.stat-comparison-grid .stat-label {
    grid-column: 1 / 3;
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--color-text-muted);
    text-align: center;
}
.stat-comparison-grid .stat-value {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    background: var(--color-background);
    padding: 15px;
    border-radius: 6px;
    transition: all 0.2s ease;
}
.stat-comparison-grid .stat-value.better {
    color: #4CAF50; /* Green for better */
}
.stat-comparison-grid .stat-value.worse {
    color: #f44336; /* Red for worse */
}

/* Performance Over Time */
.tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}
.tabs button {
    padding: 10px 20px;
    font-size: 1rem;
    background-color: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.tabs button.active {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}
.tabs button:hover:not(.active) {
    background-color: var(--color-background-mute);
}
.performance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    text-align: center;
}
.grid-header { font-weight: bold; font-size: 1.2rem; color: var(--color-heading); }
.grid-label { font-weight: bold; color: var(--color-text-muted); text-align: left; padding-left: 10px; }
.grid-value { font-size: 1.2rem; background: var(--color-background); padding: 10px; border-radius: 4px; }

/* Map Performance */
.map-performance-table {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background-color: var(--color-border);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    overflow: hidden;
}
.table-header, .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    background-color: var(--color-background-soft);
}
.table-header {
    font-weight: bold;
    color: var(--color-heading);
    background-color: var(--color-background-mute);
}
.table-header > div, .table-row > div {
    padding: 12px 15px;
    text-align: center;
}
.table-row > div.map-name {
    text-align: left;
    font-weight: 500;
}
.table-row .map-kdr.winner {
    font-weight: bold;
    color: #4CAF50;
}

/* Head to Head */
.h2h-table {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background-color: var(--color-border);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    overflow-x: auto;
}
.h2h-table-header, .h2h-table-subheader, .h2h-table-row {
    display: grid;
    grid-template-columns: 1fr 1.5fr repeat(6, 1fr);
    background-color: var(--color-background-soft);
    min-width: 800px;
}
.h2h-table-header, .h2h-table-subheader {
    font-weight: bold;
    color: var(--color-heading);
    background-color: var(--color-background-mute);
}
.h2h-table-header > div, .h2h-table-subheader > div, .h2h-table-row > div {
    padding: 12px 10px;
    text-align: center;
    border-right: 1px solid var(--color-border);
}
.h2h-table-header > div:last-child, .h2h-table-subheader > div:last-child, .h2h-table-row > div:last-child {
    border-right: none;
}
.h2h-player-header {
    grid-column: span 3;
    text-align: center;
}


@media (max-width: 768px) {
    .player-comparison-container {
        padding: 10px;
    }
    .input-form {
        flex-direction: column;
    }
    .input-form input {
        width: 100%;
    }
    .summary-panel {
        grid-template-columns: 1fr;
    }
    .performance-grid, .stat-comparison-grid {
        grid-template-columns: 1fr 1fr;
    }
    .grid-label { grid-column: 1/3; text-align: center; }
    .stat-comparison-grid .stat-label { grid-column: 1/3; }
    .p1-header, .p2-header { display: none; }
    .grid-value.p1 { grid-column: 1/2; }
    .grid-value.p2 { grid-column: 2/3; }
}

</style> 