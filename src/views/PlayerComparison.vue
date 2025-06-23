<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Define the structure for player search results
interface PlayerSearchResult {
  playerName: string;
  totalPlayTimeMinutes: number;
  lastSeen: string;
  isActive: boolean;
  currentServer?: {
    serverGuid: string;
    serverName: string;
    sessionKills: number;
    sessionDeaths: number;
    mapName: string;
    gameId: string;
  };
}

interface PlayerSearchResponse {
  items: PlayerSearchResult[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

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

// Search-related state
const player1SearchResults = ref<PlayerSearchResult[]>([]);
const player2SearchResults = ref<PlayerSearchResult[]>([]);
const player1SearchLoading = ref(false);
const player2SearchLoading = ref(false);
const showPlayer1Dropdown = ref(false);
const showPlayer2Dropdown = ref(false);
const searchDebounceTimeout = ref<number | null>(null);

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

// Search functionality
const searchPlayers = async (query: string, playerNumber: 1 | 2) => {
  if (!query || query.length < 2) {
    if (playerNumber === 1) {
      player1SearchResults.value = [];
      showPlayer1Dropdown.value = false;
    } else {
      player2SearchResults.value = [];
      showPlayer2Dropdown.value = false;
    }
    return;
  }

  if (playerNumber === 1) {
    player1SearchLoading.value = true;
  } else {
    player2SearchLoading.value = true;
  }

  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data: PlayerSearchResponse = await response.json();
    
    if (playerNumber === 1) {
      player1SearchResults.value = data.items;
      showPlayer1Dropdown.value = data.items.length > 0;
    } else {
      player2SearchResults.value = data.items;
      showPlayer2Dropdown.value = data.items.length > 0;
    }
  } catch (error) {
    console.error('Error searching players:', error);
    if (playerNumber === 1) {
      player1SearchResults.value = [];
      showPlayer1Dropdown.value = false;
    } else {
      player2SearchResults.value = [];
      showPlayer2Dropdown.value = false;
    }
  } finally {
    if (playerNumber === 1) {
      player1SearchLoading.value = false;
    } else {
      player2SearchLoading.value = false;
    }
  }
};

const onPlayerInput = (query: string, playerNumber: 1 | 2) => {
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value);
  }

  searchDebounceTimeout.value = setTimeout(() => {
    searchPlayers(query, playerNumber);
  }, 300);
};

const selectPlayer = (player: PlayerSearchResult, playerNumber: 1 | 2) => {
  if (playerNumber === 1) {
    player1Input.value = player.playerName;
    showPlayer1Dropdown.value = false;
    player1SearchResults.value = [];
  } else {
    player2Input.value = player.playerName;
    showPlayer2Dropdown.value = false;
    player2SearchResults.value = [];
  }
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const formatLastSeen = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
};

const hideDropdowns = () => {
  showPlayer1Dropdown.value = false;
  showPlayer2Dropdown.value = false;
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

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Sorting state and functions
const sortColumn = ref<string>('');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Toggle state for extra columns
const showExtraColumns = ref(false);

const sortMapPerformance = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'desc';
  }
};

const sortedMapPerformance = computed(() => {
  if (!comparisonData.value?.mapPerformance || !sortColumn.value) {
    return comparisonData.value?.mapPerformance || [];
  }

  return [...comparisonData.value.mapPerformance].sort((a, b) => {
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
  if (!comparisonData.value?.headToHead) return [];
  
  return [...comparisonData.value.headToHead].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
});

</script>

<template>
  <div class="player-comparison-container">
    <div class="comparison-header">
      <h1>Player Comparison</h1>
      <div class="input-form" @click="hideDropdowns">
        <!-- Player 1 Input with Search -->
        <div class="player-input-container" @click.stop>
          <input 
            type="text" 
            v-model="player1Input" 
            placeholder="Player 1 Name" 
            @keyup.enter="handleCompare"
            @input="onPlayerInput(player1Input, 1)"
            @focus="player1Input.length >= 2 && searchPlayers(player1Input, 1)"
            autocomplete="off"
          />
          <div class="search-spinner" v-if="player1SearchLoading">🔄</div>
          <div v-if="showPlayer1Dropdown" class="search-dropdown">
            <div 
              v-for="player in player1SearchResults" 
              :key="player.playerName"
              class="search-result-item"
              @click="selectPlayer(player, 1)"
            >
              <div class="player-info">
                <div class="player-name">{{ player.playerName }}</div>
                <div class="player-details">
                  <span class="play-time">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                  <span class="last-seen">{{ formatLastSeen(player.lastSeen) }}</span>
                  <span v-if="player.isActive" class="active-badge">🟢 Online</span>
                  <span v-else class="inactive-badge">⚫ Offline</span>
                </div>
                <div v-if="player.currentServer && player.isActive" class="current-server">
                  {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                </div>
              </div>
            </div>
            <div v-if="player1SearchResults.length === 0 && !player1SearchLoading" class="no-results">
              No players found
            </div>
          </div>
        </div>

        <span class="vs-text">vs</span>

        <!-- Player 2 Input with Search -->
        <div class="player-input-container" @click.stop>
          <input 
            type="text" 
            v-model="player2Input" 
            placeholder="Player 2 Name" 
            @keyup.enter="handleCompare"
            @input="onPlayerInput(player2Input, 2)"
            @focus="player2Input.length >= 2 && searchPlayers(player2Input, 2)"
            autocomplete="off"
          />
          <div class="search-spinner" v-if="player2SearchLoading">🔄</div>
          <div v-if="showPlayer2Dropdown" class="search-dropdown">
            <div 
              v-for="player in player2SearchResults" 
              :key="player.playerName"
              class="search-result-item"
              @click="selectPlayer(player, 2)"
            >
              <div class="player-info">
                <div class="player-name">{{ player.playerName }}</div>
                <div class="player-details">
                  <span class="play-time">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                  <span class="last-seen">{{ formatLastSeen(player.lastSeen) }}</span>
                  <span v-if="player.isActive" class="active-badge">🟢 Online</span>
                  <span v-else class="inactive-badge">⚫ Offline</span>
                </div>
                <div v-if="player.currentServer && player.isActive" class="current-server">
                  {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                </div>
              </div>
            </div>
            <div v-if="player2SearchResults.length === 0 && !player2SearchLoading" class="no-results">
              No players found
            </div>
          </div>
        </div>

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
            <div class="section-header">
                <h3>Map Performance</h3>
                <button class="toggle-columns-btn" @click="showExtraColumns = !showExtraColumns">
                    {{ showExtraColumns ? 'Hide' : 'Show' }} Kills/Deaths
                </button>
            </div>
            <div class="map-performance-table">
                <div class="table-header" :class="{ 'expanded': showExtraColumns }">
                    <div class="map-name-header sortable" @click="sortMapPerformance('map')" :class="{ 'sort-active': sortColumn === 'map' }">
                        Map
                        <span class="sort-indicator" v-if="sortColumn === 'map'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="player-group" :class="{ 'expanded': showExtraColumns }">{{ comparisonData.player1 }}</div>
                    <div class="player-group" :class="{ 'expanded': showExtraColumns }">{{ comparisonData.player2 }}</div>
                </div>
                <div class="table-subheader" :class="{ 'expanded': showExtraColumns }">
                    <div></div>
                    <div class="sortable" @click="sortMapPerformance('p1-score')" :class="{ 'sort-active': sortColumn === 'p1-score' }">
                        Score
                        <span class="sort-indicator" v-if="sortColumn === 'p1-score'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="sortable extra-column" v-show="showExtraColumns" @click="sortMapPerformance('p1-kills')" :class="{ 'sort-active': sortColumn === 'p1-kills' }">
                        Kills
                        <span class="sort-indicator" v-if="sortColumn === 'p1-kills'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="sortable extra-column" v-show="showExtraColumns" @click="sortMapPerformance('p1-deaths')" :class="{ 'sort-active': sortColumn === 'p1-deaths' }">
                        Deaths
                        <span class="sort-indicator" v-if="sortColumn === 'p1-deaths'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="sortable" @click="sortMapPerformance('p1-kdr')" :class="{ 'sort-active': sortColumn === 'p1-kdr' }">
                        K/D
                        <span class="sort-indicator" v-if="sortColumn === 'p1-kdr'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="sortable" @click="sortMapPerformance('p2-score')" :class="{ 'sort-active': sortColumn === 'p2-score' }">
                        Score
                        <span class="sort-indicator" v-if="sortColumn === 'p2-score'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="sortable extra-column" v-show="showExtraColumns" @click="sortMapPerformance('p2-kills')" :class="{ 'sort-active': sortColumn === 'p2-kills' }">
                        Kills
                        <span class="sort-indicator" v-if="sortColumn === 'p2-kills'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="sortable extra-column" v-show="showExtraColumns" @click="sortMapPerformance('p2-deaths')" :class="{ 'sort-active': sortColumn === 'p2-deaths' }">
                        Deaths
                        <span class="sort-indicator" v-if="sortColumn === 'p2-deaths'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                    <div class="sortable" @click="sortMapPerformance('p2-kdr')" :class="{ 'sort-active': sortColumn === 'p2-kdr' }">
                        K/D
                        <span class="sort-indicator" v-if="sortColumn === 'p2-kdr'">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                    </div>
                </div>
                <div class="table-body">
                    <div v-for="map in sortedMapPerformance" :key="map.mapName" class="table-row" :class="{ 'expanded': showExtraColumns }">
                        <div class="map-name">{{ map.mapName }}</div>
                        <div class="map-stat">{{ map.player1Totals.score }}</div>
                        <div class="map-stat extra-column" v-show="showExtraColumns">{{ map.player1Totals.kills }}</div>
                        <div class="map-stat extra-column" v-show="showExtraColumns">{{ map.player1Totals.deaths }}</div>
                        <div class="map-kdr" :class="{ 'winner': parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) > parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) }">
                            {{ calculateKDR(map.player1Totals.kills, map.player1Totals.deaths) }}
                        </div>
                        <div class="map-stat">{{ map.player2Totals.score }}</div>
                        <div class="map-stat extra-column" v-show="showExtraColumns">{{ map.player2Totals.kills }}</div>
                        <div class="map-stat extra-column" v-show="showExtraColumns">{{ map.player2Totals.deaths }}</div>
                        <div class="map-kdr" :class="{ 'winner': parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) > parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) }">
                            {{ calculateKDR(map.player2Totals.kills, map.player2Totals.deaths) }}
                        </div>
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
                    <div v-for="(encounter, index) in sortedHeadToHead" :key="index" class="h2h-table-row">
                        <div class="h2h-date-cell">
                            <router-link 
                                :to="{
                                    path: '/servers/round-report',
                                    query: {
                                        serverGuid: encounter.serverGuid,
                                        mapName: encounter.mapName,
                                        startTime: new Date(new Date(encounter.timestamp).getTime() + 2 * 60 * 1000).toISOString(),
                                        players: `${player1Input},${player2Input}`
                                    }
                                }"
                                class="h2h-date-link"
                                :title="`View round report for ${encounter.mapName} on ${formatDate(encounter.timestamp)} with ${player1Input} and ${player2Input} highlighted`"
                            >
                                <div class="h2h-date">{{ formatDate(encounter.timestamp) }}</div>
                                <div class="h2h-time">{{ formatTime(encounter.timestamp) }}</div>
                            </router-link>
                        </div>
                        <div>{{ encounter.mapName }}</div>
                        <div>{{ encounter.player1Score }}</div>
                        <div>{{ encounter.player1Kills }}</div>
                        <div>{{ encounter.player1Deaths }}</div>
                        <div>{{ encounter.player2Score }}</div>
                        <div>{{ encounter.player2Kills }}</div>
                        <div>{{ encounter.player2Deaths }}</div>
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
  position: relative;
}

.player-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-form input {
  padding: 12px 40px 12px 15px;
  font-size: 1rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  width: 250px;
}

.search-spinner {
  position: absolute;
  right: 10px;
  font-size: 12px;
  animation: spin 1s linear infinite;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s ease;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: var(--color-background);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-name {
  font-weight: bold;
  font-size: 1rem;
  color: var(--color-text);
}

.player-details {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.play-time {
  background-color: var(--color-background);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.last-seen {
  color: var(--color-text-muted);
}

.active-badge {
  color: #4CAF50;
  font-size: 0.8rem;
  font-weight: bold;
}

.inactive-badge {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.current-server {
  font-size: 0.8rem;
  color: var(--color-primary);
  font-style: italic;
  margin-top: 2px;
}

.no-results {
  padding: 15px;
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
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

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-header h3 {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
}

.toggle-columns-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toggle-columns-btn:hover {
    background-color: var(--color-accent);
    transform: translateY(-1px);
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
    overflow-x: auto;
}
.table-header, .table-subheader, .table-row {
    display: grid;
    grid-template-columns: 2fr repeat(4, 1fr);
    background-color: var(--color-background-soft);
    min-width: 600px;
    transition: grid-template-columns 0.3s ease;
}

.table-header.expanded, .table-subheader.expanded, .table-row.expanded {
    grid-template-columns: 2fr repeat(8, 1fr);
    min-width: 900px;
}
.table-header {
    font-weight: bold;
    color: var(--color-heading);
    background-color: var(--color-background-mute);
}
.table-subheader {
    font-weight: bold;
    color: var(--color-text-muted);
    background-color: var(--color-background-mute);
    font-size: 0.9rem;
}
.table-header > div, .table-subheader > div, .table-row > div {
    padding: 12px 8px;
    text-align: center;
    border-right: 1px solid var(--color-border);
}
.table-header > div:last-child, .table-subheader > div:last-child, .table-row > div:last-child {
    border-right: none;
}
.table-row > div.map-name {
    text-align: left;
    font-weight: 500;
    padding-left: 15px;
}
.table-row .map-kdr.winner {
    font-weight: bold;
    color: #4CAF50;
}
.player-group {
    grid-column: span 2;
    text-align: center;
    font-weight: bold;
}

.player-group.expanded {
    grid-column: span 4;
}
.map-stat {
    font-size: 0.95rem;
}
.sortable {
    cursor: pointer;
    user-select: none;
    position: relative;
    transition: background-color 0.2s ease;
}
.sortable:hover {
    background-color: var(--color-background);
}
.sortable.sort-active {
    color: var(--color-primary);
    font-weight: bold;
}
.sort-indicator {
    margin-left: 4px;
    font-size: 0.8rem;
    opacity: 0.8;
}

.extra-column {
    transition: all 0.3s ease;
    overflow: hidden;
}

.extra-column.v-enter-active,
.extra-column.v-leave-active {
    transition: all 0.3s ease;
}

.extra-column.v-enter-from,
.extra-column.v-leave-to {
    opacity: 0;
    max-width: 0;
    padding-left: 0;
    padding-right: 0;
}

.extra-column.v-enter-to,
.extra-column.v-leave-from {
    opacity: 1;
    max-width: 200px;
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

.h2h-date-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.h2h-date {
    font-weight: 500;
    line-height: 1.2;
}

.h2h-time {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    font-weight: 400;
    line-height: 1;
}

.h2h-date-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    padding: 4px 8px;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
}

.h2h-date-link:hover {
    background-color: var(--color-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.h2h-date-link:hover .h2h-date {
    color: white;
    font-weight: 600;
}

.h2h-date-link:hover .h2h-time {
    color: rgba(255, 255, 255, 0.9);
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
    .player-input-container {
        width: 100%;
    }
    .search-dropdown {
        left: 0;
        right: 0;
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
    
    .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
    
    .toggle-columns-btn {
        align-self: center;
        width: fit-content;
    }
}

</style> 