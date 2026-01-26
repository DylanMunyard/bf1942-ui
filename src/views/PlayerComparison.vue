<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import AchievementModal from '../components/AchievementModal.vue';
import { formatLastSeen, formatRelativeTime } from '@/utils/timeUtils';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';


// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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

interface HourlyOverlap {
  hour: number;
  player1Minutes: number;
  player2Minutes: number;
  overlapMinutes: number;
}

interface BucketTotal {
  bucket: 'Last30Days' | 'Last6Months' | 'LastYear' | 'AllTime';
  player1Totals: PerformanceStats & { playTimeMinutes?: number };
  player2Totals: PerformanceStats & { playTimeMinutes?: number };
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

interface ServerDetails {
  guid: string;
  name: string;
  ip: string;
  port: number;
  gameId: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  org: string;
}

interface ComparisonData {
  player1: string;
  player2: string;
  killRates: KillRateData[];
  bucketTotals: BucketTotal[];
  averagePing: AveragePingData[];
  mapPerformance: MapPerformance[];
  headToHead: HeadToHeadEncounter[];
  hourlyOverlap?: HourlyOverlap[];
  serverDetails?: ServerDetails;
  commonServers?: ServerDetails[];
  player1MilestoneAchievements?: MilestoneAchievement[];
  player2MilestoneAchievements?: MilestoneAchievement[];
}



// Add interface for milestone achievements
interface MilestoneAchievement {
  achievementId: string;
  achievementName: string;
  tier: string;
  value: number;
  achievedAt: string;
}

const route = useRoute();
const router = useRouter();

const player1Input = ref('');
const player2Input = ref('');
const player2InputRef = ref<HTMLInputElement | null>(null);
const comparisonData = ref<ComparisonData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Theme detection state
const isDarkMode = ref(false);
const chartKey = ref(0);

// Function to detect theme by checking computed CSS values
const detectTheme = () => {
  // Get the actual computed color values from CSS custom properties
  const computedStyle = getComputedStyle(document.documentElement);
  const backgroundColor = computedStyle.getPropertyValue('--color-background').trim();
  const textColor = computedStyle.getPropertyValue('--color-text').trim();
  
  // If background is dark purple (dark mode) vs white (light mode)
  const newIsDarkMode = backgroundColor.includes('26, 16, 37') || backgroundColor === '#1a1025';
  
  console.log('Theme detection from CSS:', {
    backgroundColor,
    textColor,
    newIsDarkMode,
    documentClasses: document.documentElement.className
  });
  
  if (newIsDarkMode !== isDarkMode.value) {
    isDarkMode.value = newIsDarkMode;
    chartKey.value++; // Force chart re-render
  }
};

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

const fetchComparisonData = async (player1: string, player2: string, includeServerGuid: boolean = true, specificServerGuid?: string) => {
  if (!player1 || !player2) {
    comparisonData.value = null;
    return;
  }
  
  console.log(`Fetching comparison data for ${player1} vs ${player2}`);
  isLoading.value = true;
  error.value = null;
  comparisonData.value = null;

  try {
    let url = `/stats/players/compare?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`;
    
    // Use specific serverGuid if provided, otherwise fall back to route query
    const serverGuid = specificServerGuid || (route.query.serverGuid as string);
    if (serverGuid && includeServerGuid) {
      url += `&serverGuid=${encodeURIComponent(serverGuid)}`;
    }
    
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
    const query: Record<string, string> = { player1, player2 };
    if (serverGuid && includeServerGuid) {
      query.serverGuid = serverGuid;
    }
    router.replace({ query });
    
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
  }, 300) as unknown as number;
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

// Note: formatLastSeen is now imported from @/utils/timeUtils

const hideDropdowns = () => {
  showPlayer1Dropdown.value = false;
  showPlayer2Dropdown.value = false;
};

// Clear server filter and requery
const clearServerFilter = async () => {
  // Refetch comparison data without server filter
  if (player1Input.value && player2Input.value) {
    await fetchComparisonData(player1Input.value, player2Input.value, false);
  }
};

// Select a specific server for comparison
const selectServer = async (serverGuid: string) => {
  if (player1Input.value && player2Input.value) {
    // Refetch comparison data with the selected server (this will also update the URL)
    await fetchComparisonData(player1Input.value, player2Input.value, true, serverGuid);
  }
};

// Initialize from URL parameters on mount
onMounted(() => {
  // Detect initial theme
  detectTheme();
  
  // Watch for theme changes
  const observer = new MutationObserver(() => {
    detectTheme();
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  // Watch for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectTheme);
  }
  
  const urlPlayer1 = route.query.player1 as string;
  const urlPlayer2 = route.query.player2 as string;
  
  if (urlPlayer1) {
    player1Input.value = urlPlayer1;
    
    if (urlPlayer2) {
      player2Input.value = urlPlayer2;
      fetchComparisonData(urlPlayer1, urlPlayer2);
    } else {
      // If only player1 is provided, focus the player2 input field
      // Use nextTick to ensure the DOM is updated before focusing
      nextTick(() => {
        if (player2InputRef.value) {
          player2InputRef.value.focus();
        }
      });
    }
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

const hourlyOverlap = computed(() => {
  const overlapData = comparisonData.value?.hourlyOverlap ?? [];
  const byHour = new Map<number, HourlyOverlap>();
  for (const entry of overlapData) {
    byHour.set(entry.hour, entry);
  }
  return Array.from({ length: 24 }, (_, hour) =>
    byHour.get(hour) ?? { hour, player1Minutes: 0, player2Minutes: 0, overlapMinutes: 0 }
  );
});

const hourlyOverlapChartData = computed(() => {
  if (!comparisonData.value?.hourlyOverlap?.length) return null;
  const labels = hourlyOverlap.value.map(entry => `${entry.hour.toString().padStart(2, '0')}:00`);
  return {
    labels,
    datasets: [
      {
        label: comparisonData.value?.player1 ?? 'Player 1',
        data: hourlyOverlap.value.map(entry => entry.player1Minutes),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3
      },
      {
        label: comparisonData.value?.player2 ?? 'Player 2',
        data: hourlyOverlap.value.map(entry => entry.player2Minutes),
        borderColor: '#fb923c',
        backgroundColor: 'rgba(251, 146, 60, 0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3
      },
      {
        label: 'Overlap',
        data: hourlyOverlap.value.map(entry => entry.overlapMinutes),
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

const hourlyOverlapChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  scales: {
    x: {
      grid: {
        color: isDarkMode.value ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'
      },
      ticks: {
        color: isDarkMode.value ? '#94a3b8' : '#475569',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12
      }
    },
    y: {
      grid: {
        color: isDarkMode.value ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)'
      },
      ticks: {
        color: isDarkMode.value ? '#94a3b8' : '#475569',
        callback: (value: string | number) => `${Math.round(Number(value))}m`
      }
    }
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: isDarkMode.value ? '#e2e8f0' : '#0f172a',
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: isDarkMode.value ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      displayColors: true,
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${Math.round(context.parsed.y)}m`
      }
    }
  }
}));

const getPerformanceData = (bucket: string) => {
  if (!comparisonData.value?.bucketTotals) return null;
  return comparisonData.value.bucketTotals.find(bt => bt.bucket === bucket);
};

const calculateDelta = (value1: number, value2: number, decimals: number = 0): string => {
  const higher = Math.max(value1, value2);
  const lower = Math.min(value1, value2);
  const diff = higher - lower;
  return decimals > 0 ? `+ ${diff.toFixed(decimals)}` : `+ ${Math.round(diff)}`;
};

const calculateTimeDelta = (value1: number, value2: number): string => {
  const higher = Math.max(value1, value2);
  const lower = Math.min(value1, value2);
  const diffMinutes = higher - lower;
  return `+ ${formatPlayTime(diffMinutes)}`;
};

const getHigherValue = (value1: number, value2: number): 'p1' | 'p2' | 'tie' => {
  if (value1 > value2) return 'p1';
  if (value2 > value1) return 'p2';
  return 'tie';
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

// Toggle state for hiding maps with no scores
const hideNoScores = ref(false);

const sortMapPerformance = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'desc';
  }
};

const sortedMapPerformance = computed(() => {
  if (!comparisonData.value?.mapPerformance) {
    return [];
  }

  let maps = comparisonData.value.mapPerformance;
  
  // Filter out maps with no scores if hideNoScores is enabled
  if (hideNoScores.value) {
    maps = maps.filter(map => 
      map.player1Totals.score > 0 && map.player2Totals.score > 0
    );
  }

  if (!sortColumn.value) {
    return maps;
  }

  return [...maps].sort((a, b) => {
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

// Modal state for milestone achievements
const showMilestoneAchievementsModal = ref(false);
const selectedMilestoneAchievement = ref<MilestoneAchievement | null>(null);
const selectedMilestonePlayer = ref<1 | 2 | null>(null);



const handleMilestoneAchievementClick = (achievement: MilestoneAchievement, playerNumber: 1 | 2) => {
  selectedMilestoneAchievement.value = achievement;
  selectedMilestonePlayer.value = playerNumber;
  showMilestoneAchievementsModal.value = true;
};

const closeMilestoneAchievementsModal = () => {
  showMilestoneAchievementsModal.value = false;
  selectedMilestoneAchievement.value = null;
  selectedMilestonePlayer.value = null;
};

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
};

const getTierColor = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'legendary': return '#FF6B35';
    case 'epic': return '#9D4EDD';
    case 'rare': return '#3A86FF';
    case 'uncommon': return '#06FFA5';
    case 'common': return '#8D99AE';
    default: return '#8D99AE';
  }
};

const getTierGlow = (tier: string): string => {
  const color = getTierColor(tier);
  return `0 0 20px ${color}40, 0 0 40px ${color}20`;
};
</script>

<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg border-b border-slate-700/50">
      <div class="max-w-7xl mx-auto p-6">
        <div class="text-center mb-8">
          <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4">
            Player Comparison
          </h1>
          <p class="text-slate-400 text-lg">
            Compare two players' statistics and performance side-by-side
          </p>
        </div>
        
        <!-- Search Form -->
        <div 
          class="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-4xl mx-auto"
          @click="hideDropdowns"
        >
          <!-- Player 1 Input with Search -->
          <div
            class="relative flex-1 w-full lg:w-auto"
            @click.stop
          >
            <div class="relative group">
              <!-- Search Icon -->
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                  <span class="text-slate-900 text-xs font-bold">👤</span>
                </div>
              </div>
              
              <!-- Enhanced Search Input -->
              <input 
                v-model="player1Input" 
                type="text" 
                placeholder="Player 1 Name" 
                autocomplete="off"
                class="w-full pl-14 pr-14 py-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/20 focus:shadow-cyan-500/30"
                @keyup.enter="handleCompare"
                @input="onPlayerInput(player1Input, 1)"
                @focus="player1Input.length >= 2 && searchPlayers(player1Input, 1)"
              >
              
              <!-- Loading Spinner -->
              <div
                v-if="player1SearchLoading"
                class="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              </div>
              
              <!-- Search Glow Effect -->
              <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <!-- Enhanced Player Dropdown -->
              <div
                v-if="showPlayer1Dropdown"
                class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
              >
                <div
                  v-for="player in player1SearchResults"
                  :key="player.playerName"
                  class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                  @mousedown.prevent="selectPlayer(player, 1)"
                >
                  <div class="space-y-2">
                    <div class="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors">
                      {{ player.playerName }}
                    </div>
                    <div class="flex items-center gap-3 flex-wrap text-xs">
                      <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                      <span class="text-slate-500">{{ formatLastSeen(player.lastSeen) }}</span>
                      <span
                        v-if="player.isActive"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full"
                      >
                        🟢 ONLINE
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-500/20 border border-slate-500/30 rounded-full"
                      >
                        ⚫ OFFLINE
                      </span>
                    </div>
                    <div
                      v-if="player.currentServer && player.isActive"
                      class="text-xs text-cyan-400 font-medium"
                    >
                      🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="player1SearchResults.length === 0 && !player1SearchLoading"
                  class="p-4 text-center text-slate-400 text-sm font-medium"
                >
                  🔍 No players found
                </div>
              </div>
            </div>
          </div>

          <!-- VS Text -->
          <div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 flex-shrink-0">
            VS
          </div>

          <!-- Player 2 Input with Search -->
          <div
            class="relative flex-1 w-full lg:w-auto"
            @click.stop
          >
            <div class="relative group">
              <!-- Search Icon -->
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <div class="w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                  <span class="text-slate-900 text-xs font-bold">👤</span>
                </div>
              </div>
              
              <!-- Enhanced Search Input -->
              <input 
                ref="player2InputRef"
                v-model="player2Input" 
                type="text" 
                placeholder="Player 2 Name" 
                autocomplete="off"
                class="w-full pl-14 pr-14 py-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-orange-500/20 focus:shadow-orange-500/30"
                @keyup.enter="handleCompare"
                @input="onPlayerInput(player2Input, 2)"
                @focus="player2Input.length >= 2 && searchPlayers(player2Input, 2)"
              >
              
              <!-- Loading Spinner -->
              <div
                v-if="player2SearchLoading"
                class="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <div class="w-5 h-5 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin" />
              </div>
              
              <!-- Search Glow Effect -->
              <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <!-- Enhanced Player Dropdown -->
              <div
                v-if="showPlayer2Dropdown"
                class="absolute top-full mt-3 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 max-h-80 overflow-y-auto shadow-2xl z-50"
              >
                <div
                  v-for="player in player2SearchResults"
                  :key="player.playerName"
                  class="group p-4 border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer transition-all duration-300 last:border-b-0 hover:shadow-lg"
                  @mousedown.prevent="selectPlayer(player, 2)"
                >
                  <div class="space-y-2">
                    <div class="font-bold text-slate-200 text-sm group-hover:text-orange-400 transition-colors">
                      {{ player.playerName }}
                    </div>
                    <div class="flex items-center gap-3 flex-wrap text-xs">
                      <span class="text-slate-400 font-medium">{{ formatPlayTime(player.totalPlayTimeMinutes) }}</span>
                      <span class="text-slate-500">{{ formatLastSeen(player.lastSeen) }}</span>
                      <span
                        v-if="player.isActive"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full"
                      >
                        🟢 ONLINE
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-500/20 border border-slate-500/30 rounded-full"
                      >
                        ⚫ OFFLINE
                      </span>
                    </div>
                    <div
                      v-if="player.currentServer && player.isActive"
                      class="text-xs text-orange-400 font-medium"
                    >
                      🎮 {{ player.currentServer.serverName }} - {{ player.currentServer.mapName }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="player2SearchResults.length === 0 && !player2SearchLoading"
                  class="p-4 text-center text-slate-400 text-sm font-medium"
                >
                  🔍 No players found
                </div>
              </div>
            </div>
          </div>

          <!-- Compare Button -->
          <button
            :disabled="isLoading || !player1Input.trim() || !player2Input.trim()"
            class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-purple-500/25 disabled:shadow-none disabled:cursor-not-allowed flex-shrink-0"
            @click="handleCompare"
          >
            <span
              v-if="isLoading"
              class="flex items-center gap-2"
            >
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Comparing...
            </span>
            <span
              v-else
              class="flex items-center gap-2"
            >
              ⚔️ Compare
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-20"
    >
      <div class="text-center space-y-6">
        <div class="relative flex items-center justify-center">
          <div class="w-20 h-20 border-4 border-slate-700 rounded-full animate-spin" />
          <div class="absolute w-20 h-20 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
          <div class="absolute w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full animate-pulse" />
        </div>
        <div class="text-lg font-semibold text-white">
          Fetching player comparison...
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex items-center justify-center py-20"
    >
      <div class="text-center space-y-4">
        <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-red-400"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <line
              x1="15"
              y1="9"
              x2="9"
              y2="15"
            />
            <line
              x1="9"
              y1="9"
              x2="15"
              y2="15"
            />
          </svg>
        </div>
        <div class="text-lg font-semibold text-red-400">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Intro State -->
    <div
      v-else-if="!comparisonData"
      class="max-w-4xl mx-auto p-6 text-center py-20"
    >
      <div class="space-y-6">
        <div class="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-purple-500/30 mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-purple-400"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle
              cx="8.5"
              cy="7"
              r="4"
            />
            <path d="m22 8-5 5" />
            <path d="m17 8 5 5" />
          </svg>
        </div>
        <div class="text-xl font-medium text-slate-300">
          Enter two player names above and click "Compare" to see their stats side-by-side.
        </div>
        <div class="text-sm text-slate-400">
          Compare performance metrics, activity patterns, and head-to-head encounters between any two players.
        </div>
      </div>
    </div>

    <!-- Comparison Results -->
    <div
      v-if="comparisonData"
      class="max-w-7xl mx-auto p-6 space-y-8"
    >
      <!-- Common Servers Selector -->
      <div
        v-if="comparisonData.commonServers && comparisonData.commonServers.length > 0"
        class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div class="p-6">
          <div class="mb-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
              <div>
                <h3 class="text-lg font-bold text-slate-200 flex items-center gap-2">
                  🎮 Compare performance on specific servers
                  <span
                    v-if="comparisonData.serverDetails"
                    class="text-sm font-normal text-slate-400"
                  >(🎯 Currently: {{ comparisonData.serverDetails.name }})</span>
                </h3>
                <p class="text-sm text-slate-400 mt-1">
                  Select a server to focus the comparison
                </p>
              </div>
              <button 
                v-if="comparisonData.serverDetails"
                class="self-start sm:self-auto px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-slate-500/50 rounded-lg text-slate-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center gap-2"
                title="View comparison across all common servers"
                @click="clearServerFilter"
              >
                <span>🌍</span>
                All Servers
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button 
              v-for="server in comparisonData.commonServers" 
              :key="server.guid"
              class="group relative p-3 rounded-lg transition-all duration-300 text-left transform hover:scale-105"
              :class="{ 
                'bg-gradient-to-r from-blue-600/80 to-purple-600/80 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20': comparisonData.serverDetails?.guid === server.guid,
                'bg-slate-800/40 border-2 border-slate-700/50 hover:bg-slate-700/60 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10': comparisonData.serverDetails?.guid !== server.guid
              }"
              :title="`Compare performance on ${server.name}`"
              @click="selectServer(server.guid)"
            >
              <!-- Selected indicator -->
              <div
                v-if="comparisonData.serverDetails?.guid === server.guid"
                class="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold"
              >
                ✓
              </div>
              
              <div class="flex items-center justify-between">
                <div
                  class="font-bold text-base truncate pr-2"
                  :class="{ 
                    'text-white': comparisonData.serverDetails?.guid === server.guid,
                    'text-slate-200 group-hover:text-blue-400': comparisonData.serverDetails?.guid !== server.guid
                  }"
                >
                  {{ server.name }}
                </div>
                
                <span
                  v-if="server.country"
                  class="text-sm font-medium flex items-center gap-1 flex-shrink-0"
                  :class="{ 
                    'text-blue-100': comparisonData.serverDetails?.guid === server.guid,
                    'text-slate-400 group-hover:text-blue-300': comparisonData.serverDetails?.guid !== server.guid
                  }"
                >
                  🌍 {{ server.country }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Panel -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Player 1 Summary -->
        <div
          class="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border transition-all duration-300"
          :class="{
            'border-green-500/70 shadow-green-500/20 shadow-2xl transform scale-105': parseFloat(player1KDR) > parseFloat(player2KDR),
            'border-slate-700/50': parseFloat(player1KDR) <= parseFloat(player2KDR)
          }"
        >
          <!-- Winner Crown -->
          <div
            v-if="parseFloat(player1KDR) > parseFloat(player2KDR)"
            class="absolute -top-3 left-1/2 transform -translate-x-1/2"
          >
            <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              👑 WINNER
            </div>
          </div>
          
          <div class="p-6 text-center">
            <router-link 
              :to="`/players/${encodeURIComponent(comparisonData.player1)}`"
              class="group block mb-4 hover:transform hover:scale-105 transition-all duration-300"
            >
              <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-300">
                {{ comparisonData.player1 }}
              </h2>
            </router-link>
            
            <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <div class="text-4xl font-bold text-cyan-400 mb-2">
                {{ player1KDR }}
              </div>
              <div class="text-sm text-slate-400 uppercase tracking-wide font-medium">
                Overall K/D Ratio
              </div>
            </div>
          </div>
        </div>
        
        <!-- Player 2 Summary -->
        <div
          class="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border transition-all duration-300"
          :class="{
            'border-green-500/70 shadow-green-500/20 shadow-2xl transform scale-105': parseFloat(player2KDR) > parseFloat(player1KDR),
            'border-slate-700/50': parseFloat(player2KDR) <= parseFloat(player1KDR)
          }"
        >
          <!-- Winner Crown -->
          <div
            v-if="parseFloat(player2KDR) > parseFloat(player1KDR)"
            class="absolute -top-3 left-1/2 transform -translate-x-1/2"
          >
            <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              👑 WINNER
            </div>
          </div>
          
          <div class="p-6 text-center">
            <router-link 
              :to="`/players/${encodeURIComponent(comparisonData.player2)}`"
              class="group block mb-4 hover:transform hover:scale-105 transition-all duration-300"
            >
              <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 group-hover:from-orange-300 group-hover:to-red-300 transition-all duration-300">
                {{ comparisonData.player2 }}
              </h2>
            </router-link>
            
            <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <div class="text-4xl font-bold text-orange-400 mb-2">
                {{ player2KDR }}
              </div>
              <div class="text-sm text-slate-400 uppercase tracking-wide font-medium">
                Overall K/D Ratio
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Core Statistics -->
      <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
        <div class="p-6 border-b border-slate-700/50">
          <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 flex items-center gap-3">
            📊 Core Statistics
          </h3>
        </div>
        <div class="p-6">
          <div class="space-y-8">
            <!-- Kill Rate -->
            <div class="text-center">
              <div class="text-lg font-bold text-slate-300 mb-4">
                🎯 Kill Rate (per minute)
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div
                  class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
                  :class="{
                    'border-green-500/70 shadow-green-500/20 shadow-lg': player1KillRate > player2KillRate,
                    'border-slate-700/50': player1KillRate <= player2KillRate
                  }"
                >
                  <div
                    class="text-3xl font-bold mb-2"
                    :class="{
                      'text-green-400': player1KillRate > player2KillRate,
                      'text-cyan-400': player1KillRate <= player2KillRate
                    }"
                  >
                    {{ player1KillRate.toFixed(2) }}
                  </div>
                  <div
                    v-if="getHigherValue(player1KillRate, player2KillRate) === 'p1' && player1KillRate !== player2KillRate" 
                    class="text-sm text-green-300 font-medium"
                  >
                    +{{ calculateDelta(player1KillRate, player2KillRate, 2).substring(2) }} better
                  </div>
                  <div class="text-xs text-slate-400 uppercase tracking-wide font-medium mt-1">
                    {{ comparisonData.player1 }}
                  </div>
                </div>
                
                <div
                  class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
                  :class="{
                    'border-green-500/70 shadow-green-500/20 shadow-lg': player2KillRate > player1KillRate,
                    'border-slate-700/50': player2KillRate <= player1KillRate
                  }"
                >
                  <div
                    class="text-3xl font-bold mb-2"
                    :class="{
                      'text-green-400': player2KillRate > player1KillRate,
                      'text-orange-400': player2KillRate <= player1KillRate
                    }"
                  >
                    {{ player2KillRate.toFixed(2) }}
                  </div>
                  <div
                    v-if="getHigherValue(player1KillRate, player2KillRate) === 'p2' && player1KillRate !== player2KillRate" 
                    class="text-sm text-green-300 font-medium"
                  >
                    +{{ calculateDelta(player1KillRate, player2KillRate, 2).substring(2) }} better
                  </div>
                  <div class="text-xs text-slate-400 uppercase tracking-wide font-medium mt-1">
                    {{ comparisonData.player2 }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Average Ping -->
            <div class="text-center">
              <div class="text-lg font-bold text-slate-300 mb-4">
                📡 Average Ping (lower is better)
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div
                  class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
                  :class="{
                    'border-green-500/70 shadow-green-500/20 shadow-lg': player1AveragePing < player2AveragePing,
                    'border-slate-700/50': player1AveragePing >= player2AveragePing
                  }"
                >
                  <div
                    class="text-3xl font-bold mb-2"
                    :class="{
                      'text-green-400': player1AveragePing < player2AveragePing,
                      'text-cyan-400': player1AveragePing >= player2AveragePing
                    }"
                  >
                    {{ Math.round(player1AveragePing) }}ms
                  </div>
                  <div class="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    {{ comparisonData.player1 }}
                  </div>
                </div>
                
                <div
                  class="bg-slate-800/60 rounded-xl p-6 border transition-all duration-300"
                  :class="{
                    'border-green-500/70 shadow-green-500/20 shadow-lg': player2AveragePing < player1AveragePing,
                    'border-slate-700/50': player2AveragePing >= player1AveragePing
                  }"
                >
                  <div
                    class="text-3xl font-bold mb-2"
                    :class="{
                      'text-green-400': player2AveragePing < player1AveragePing,
                      'text-orange-400': player2AveragePing >= player1AveragePing
                    }"
                  >
                    {{ Math.round(player2AveragePing) }}ms
                  </div>
                  <div class="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    {{ comparisonData.player2 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Playtime Overlap -->
      <div
        v-if="comparisonData.hourlyOverlap && comparisonData.hourlyOverlap.length > 0"
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
              v-if="hourlyOverlapChartData"
              :key="chartKey"
              :data="hourlyOverlapChartData"
              :options="hourlyOverlapChartOptions"
            />
          </div>
          <p class="text-xs text-slate-500">
            Overlap is calculated from simultaneous session time, grouped by hour (UTC).
          </p>
        </div>
      </div>

      <!-- Performance Over Time -->
      <div
        v-if="comparisonData.bucketTotals && comparisonData.bucketTotals.length > 0"
        class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div class="p-6 border-b border-slate-700/50">
          <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center gap-3">
            📈 Performance Over Time
          </h3>
        </div>
        <div class="p-6">
          <!-- Time Period Tabs -->
          <div class="flex flex-wrap gap-2 mb-6">
            <button 
              v-for="period in timePeriodOptions" 
              :key="period.value"
              class="px-4 py-2 rounded-lg border transition-all duration-300 font-medium text-sm"
              :class="{
                'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-500 shadow-lg': selectedTimePeriod === period.value,
                'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-700/80 hover:border-yellow-500/50 hover:text-white': selectedTimePeriod !== period.value
              }"
              @click="selectedTimePeriod = period.value"
            >
              {{ period.label }}
            </button>
          </div>
          
          <!-- Performance Data Grid -->
          <div
            v-if="getPerformanceData(selectedTimePeriod)"
            class="space-y-6"
          >
            <!-- Headers -->
            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Metric
              </div>
              <div class="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                {{ comparisonData.player1 }}
              </div>
              <div class="text-sm font-bold text-orange-400 uppercase tracking-wide">
                {{ comparisonData.player2 }}
              </div>
            </div>
            
            <!-- Stats Rows -->
            <div class="space-y-4">
              <!-- Score -->
              <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <div class="text-slate-300 font-medium flex items-center gap-2">
                  🎖️ Score
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p1',
                      'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p1')
                    }"
                  >
                    {{ getPerformanceData(selectedTimePeriod)?.player1Totals.score?.toLocaleString() }}
                  </div>
                  <div
                    v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p1'"
                    class="text-xs text-green-300 font-medium"
                  >
                    +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score).substring(2) }}
                  </div>
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p2',
                      'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p2')
                    }"
                  >
                    {{ getPerformanceData(selectedTimePeriod)?.player2Totals.score?.toLocaleString() }}
                  </div>
                  <div
                    v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score) === 'p2'"
                    class="text-xs text-green-300 font-medium"
                  >
                    +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.score, getPerformanceData(selectedTimePeriod)!.player2Totals.score).substring(2) }}
                  </div>
                </div>
              </div>
              
              <!-- Kills -->
              <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <div class="text-slate-300 font-medium flex items-center gap-2">
                  ⚔️ Kills
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p1',
                      'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p1')
                    }"
                  >
                    {{ getPerformanceData(selectedTimePeriod)?.player1Totals.kills?.toLocaleString() }}
                  </div>
                  <div
                    v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p1'"
                    class="text-xs text-green-300 font-medium"
                  >
                    +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills).substring(2) }}
                  </div>
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p2',
                      'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p2')
                    }"
                  >
                    {{ getPerformanceData(selectedTimePeriod)?.player2Totals.kills?.toLocaleString() }}
                  </div>
                  <div
                    v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills) === 'p2'"
                    class="text-xs text-green-300 font-medium"
                  >
                    +{{ calculateDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.kills, getPerformanceData(selectedTimePeriod)!.player2Totals.kills).substring(2) }}
                  </div>
                </div>
              </div>
              
              <!-- Deaths (lower is better) -->
              <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <div class="text-slate-300 font-medium flex items-center gap-2">
                  ☠️ Deaths
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p2',
                      'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p2')
                    }"
                  >
                    {{ getPerformanceData(selectedTimePeriod)?.player1Totals.deaths?.toLocaleString() }}
                  </div>
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p1',
                      'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.deaths, getPerformanceData(selectedTimePeriod)!.player2Totals.deaths) === 'p1')
                    }"
                  >
                    {{ getPerformanceData(selectedTimePeriod)?.player2Totals.deaths?.toLocaleString() }}
                  </div>
                </div>
              </div>
              
              <!-- Play Time -->
              <div class="grid grid-cols-3 gap-4 items-center py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <div class="text-slate-300 font-medium flex items-center gap-2">
                  ⏰ Play Time
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p1',
                      'text-cyan-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p1')
                    }"
                  >
                    {{ formatPlayTime(getPerformanceData(selectedTimePeriod)?.player1Totals.playTimeMinutes || 0) }}
                  </div>
                  <div
                    v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p1'"
                    class="text-xs text-green-300 font-medium"
                  >
                    {{ calculateTimeDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) }} more
                  </div>
                </div>
                <div class="text-center">
                  <div
                    class="text-xl font-bold"
                    :class="{
                      'text-green-400': getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p2',
                      'text-orange-400': !(getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p2')
                    }"
                  >
                    {{ formatPlayTime(getPerformanceData(selectedTimePeriod)?.player2Totals.playTimeMinutes || 0) }}
                  </div>
                  <div
                    v-if="getPerformanceData(selectedTimePeriod) && getHigherValue(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) === 'p2'"
                    class="text-xs text-green-300 font-medium"
                  >
                    {{ calculateTimeDelta(getPerformanceData(selectedTimePeriod)!.player1Totals.playTimeMinutes || 0, getPerformanceData(selectedTimePeriod)!.player2Totals.playTimeMinutes || 0) }} more
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Performance -->
      <div
        v-if="combinedMapPerformance.length > 0"
        class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div class="p-6 border-b border-slate-700/50">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-3">
              🗺️ Map Performance
            </h3>
            <div class="flex items-center gap-3">
              <button 
                class="p-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300" 
                :title="hideNoScores ? 'Show all maps including those with no scores' : 'Hide maps where either player has no scores'"
                @click="hideNoScores = !hideNoScores"
              >
                {{ hideNoScores ? '👁️' : '👁️‍🗨️' }}
              </button>
              <button
                class="px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-all duration-300 font-medium text-sm"
                @click="showExtraColumns = !showExtraColumns"
              >
                {{ showExtraColumns ? 'Hide' : 'Show' }} Kills/Deaths
              </button>
            </div>
          </div>
        </div>
        <div class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <!-- Table Header -->
              <thead class="sticky top-0 z-10">
                <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                  <th 
                    class="group p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-blue-500/50 min-w-[180px]"
                    :class="{ 'text-blue-400': sortColumn === 'map' }"
                    @click="sortMapPerformance('map')"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-blue-400 text-xs">🗺️</span>
                      <span class="font-mono font-bold">MAP</span>
                      <span
                        v-if="sortColumn === 'map'"
                        class="text-xs transition-transform duration-200"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  
                  <!-- Player 1 Headers -->
                  <th
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-cyan-400 border-b border-slate-700/30 bg-cyan-500/10 border-l-4 border-l-cyan-400/60"
                    :colspan="showExtraColumns ? 4 : 2"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span class="font-mono font-bold text-sm">{{ comparisonData.player1 }}</span>
                    </div>
                  </th>
                  
                  <!-- Player 2 Headers -->
                  <th
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-orange-400 border-b border-slate-700/30 bg-orange-500/10 border-l-4 border-l-orange-400/60"
                    :colspan="showExtraColumns ? 4 : 2"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span class="font-mono font-bold text-sm">{{ comparisonData.player2 }}</span>
                    </div>
                  </th>
                </tr>
                <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
                  <th class="p-2 border-b border-slate-700/30" />
                  
                  <!-- Player 1 Sub Headers -->
                  <th 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5 border-l-4 border-l-cyan-400/60"
                    :class="{ 'text-cyan-400': sortColumn === 'p1-score' }"
                    @click="sortMapPerformance('p1-score')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>🎖️</span>
                      <span class="font-mono">SCORE</span>
                      <span
                        v-if="sortColumn === 'p1-score'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    v-if="showExtraColumns" 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5"
                    :class="{ 'text-cyan-400': sortColumn === 'p1-kills' }"
                    @click="sortMapPerformance('p1-kills')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>⚔️</span>
                      <span class="font-mono">K</span>
                      <span
                        v-if="sortColumn === 'p1-kills'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    v-if="showExtraColumns" 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5"
                    :class="{ 'text-cyan-400': sortColumn === 'p1-deaths' }"
                    @click="sortMapPerformance('p1-deaths')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>☠️</span>
                      <span class="font-mono">D</span>
                      <span
                        v-if="sortColumn === 'p1-deaths'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  <th 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-cyan-500/50 bg-cyan-500/5 border-r-4 border-r-cyan-400/60"
                    :class="{ 'text-cyan-400': sortColumn === 'p1-kdr' }"
                    @click="sortMapPerformance('p1-kdr')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>🎯</span>
                      <span class="font-mono">K/D</span>
                      <span
                        v-if="sortColumn === 'p1-kdr'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  
                  <!-- Player 2 Sub Headers -->
                  <th 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5 border-l-4 border-l-orange-400/60"
                    :class="{ 'text-orange-400': sortColumn === 'p2-score' }"
                    @click="sortMapPerformance('p2-score')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>🎖️</span>
                      <span class="font-mono">SCORE</span>
                      <span
                        v-if="sortColumn === 'p2-score'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    v-if="showExtraColumns" 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                    :class="{ 'text-orange-400': sortColumn === 'p2-kills' }"
                    @click="sortMapPerformance('p2-kills')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>⚔️</span>
                      <span class="font-mono">K</span>
                      <span
                        v-if="sortColumn === 'p2-kills'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  <th
                    v-if="showExtraColumns" 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                    :class="{ 'text-orange-400': sortColumn === 'p2-deaths' }"
                    @click="sortMapPerformance('p2-deaths')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>☠️</span>
                      <span class="font-mono">D</span>
                      <span
                        v-if="sortColumn === 'p2-deaths'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                  <th 
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-orange-500/50 bg-orange-500/5"
                    :class="{ 'text-orange-400': sortColumn === 'p2-kdr' }"
                    @click="sortMapPerformance('p2-kdr')"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <span>🎯</span>
                      <span class="font-mono">K/D</span>
                      <span
                        v-if="sortColumn === 'p2-kdr'"
                        class="text-xs"
                        :class="{ 'rotate-0': sortDirection === 'asc', 'rotate-180': sortDirection === 'desc' }"
                      >▲</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody>
                <tr
                  v-for="map in sortedMapPerformance"
                  :key="map.mapName"
                  class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/20"
                >
                  <!-- Map Name -->
                  <td class="p-2">
                    <div class="font-bold text-blue-400 text-xs truncate max-w-[180px] font-mono uppercase">
                      {{ map.mapName }}
                    </div>
                  </td>

                  <!-- Player 1 Stats -->
                  <td class="p-2 text-center bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ map.player1Totals.score?.toLocaleString() }}
                    </div>
                  </td>
                  <td
                    v-if="showExtraColumns"
                    class="p-2 text-center bg-cyan-500/5"
                  >
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ map.player1Totals.kills?.toLocaleString() }}
                    </div>
                  </td>
                  <td
                    v-if="showExtraColumns"
                    class="p-2 text-center bg-cyan-500/5"
                  >
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ map.player1Totals.deaths?.toLocaleString() }}
                    </div>
                  </td>
                  <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                    <div
                      class="font-bold text-xs font-mono"
                      :class="{
                        'text-green-400': parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) > parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)),
                        'text-cyan-400': parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)) <= parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths))
                      }"
                    >
                      {{ calculateKDR(map.player1Totals.kills, map.player1Totals.deaths) }}
                    </div>
                  </td>

                  <!-- Player 2 Stats -->
                  <td class="p-2 text-center bg-orange-500/5 border-l-2 border-l-orange-400/40">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ map.player2Totals.score?.toLocaleString() }}
                    </div>
                  </td>
                  <td
                    v-if="showExtraColumns"
                    class="p-2 text-center bg-orange-500/5"
                  >
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ map.player2Totals.kills?.toLocaleString() }}
                    </div>
                  </td>
                  <td
                    v-if="showExtraColumns"
                    class="p-2 text-center bg-orange-500/5"
                  >
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ map.player2Totals.deaths?.toLocaleString() }}
                    </div>
                  </td>
                  <td class="p-2 text-center bg-orange-500/5">
                    <div
                      class="font-bold text-xs font-mono"
                      :class="{
                        'text-green-400': parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) > parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths)),
                        'text-orange-400': parseFloat(calculateKDR(map.player2Totals.kills, map.player2Totals.deaths)) <= parseFloat(calculateKDR(map.player1Totals.kills, map.player1Totals.deaths))
                      }"
                    >
                      {{ calculateKDR(map.player2Totals.kills, map.player2Totals.deaths) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
        
      <!-- Head-to-Head Encounters -->
      <div
        v-if="comparisonData.headToHead && comparisonData.headToHead.length > 0"
        class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div class="p-6 border-b border-slate-700/50">
          <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 flex items-center gap-3">
            ⚔️ Head-to-Head Encounters
          </h3>
        </div>
        <div class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <!-- Table Header -->
              <thead class="sticky top-0 z-10">
                <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                  <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 min-w-[120px]">
                    <div class="flex items-center gap-2">
                      <span class="text-slate-400 text-xs">📅</span>
                      <span class="font-mono font-bold">DATE</span>
                    </div>
                  </th>
                  <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 min-w-[140px]">
                    <div class="flex items-center gap-2">
                      <span class="text-blue-400 text-xs">🗺️</span>
                      <span class="font-mono font-bold">MAP</span>
                    </div>
                  </th>
                  
                  <!-- Player 1 Headers -->
                  <th
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-cyan-400 border-b border-slate-700/30 bg-cyan-500/10 border-l-4 border-l-cyan-400/60"
                    colspan="3"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span class="font-mono font-bold text-sm">{{ comparisonData.player1 }}</span>
                    </div>
                  </th>
                  
                  <!-- Player 2 Headers -->
                  <th
                    class="p-2 text-center font-bold text-xs uppercase tracking-wide text-orange-400 border-b border-slate-700/30 bg-orange-500/10 border-l-4 border-l-orange-400/60"
                    colspan="3"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span class="font-mono font-bold text-sm">{{ comparisonData.player2 }}</span>
                    </div>
                  </th>
                </tr>
                <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
                  <th class="p-2 border-b border-slate-700/30" />
                  <th class="p-2 border-b border-slate-700/30" />
                  
                  <!-- Player 1 Sub Headers -->
                  <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-l-4 border-l-cyan-400/60">
                    <div class="flex items-center justify-center gap-1">
                      <span>🎖️</span>
                      <span class="font-mono">SCORE</span>
                    </div>
                  </th>
                  <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5">
                    <div class="flex items-center justify-center gap-1">
                      <span>⚔️</span>
                      <span class="font-mono">KILLS</span>
                    </div>
                  </th>
                  <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-r-4 border-r-cyan-400/60">
                    <div class="flex items-center justify-center gap-1">
                      <span>☠️</span>
                      <span class="font-mono">DEATHS</span>
                    </div>
                  </th>
                  
                  <!-- Player 2 Sub Headers -->
                  <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5 border-l-4 border-l-orange-400/60">
                    <div class="flex items-center justify-center gap-1">
                      <span>🎖️</span>
                      <span class="font-mono">SCORE</span>
                    </div>
                  </th>
                  <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                    <div class="flex items-center justify-center gap-1">
                      <span>⚔️</span>
                      <span class="font-mono">KILLS</span>
                    </div>
                  </th>
                  <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                    <div class="flex items-center justify-center gap-1">
                      <span>☠️</span>
                      <span class="font-mono">DEATHS</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody>
                <tr
                  v-for="(encounter, index) in sortedHeadToHead"
                  :key="index"
                  class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/20"
                >
                  <!-- Date -->
                  <td class="p-2">
                    <router-link 
                      :to="{
                        name: 'round-report',
                        params: {
                          roundId: encounter.roundId
                        },
                        query: {
                          players: `${player1Input},${player2Input}`
                        }
                      }"
                      class="group/link flex flex-col gap-1 hover:bg-blue-600/20 hover:border-blue-500/50 border border-transparent rounded-lg p-2 transition-all duration-300 transform hover:scale-105"
                      :title="`View round report for ${encounter.mapName} on ${formatDate(encounter.timestamp)} with ${player1Input} and ${player2Input} highlighted`"
                    >
                      <div class="text-slate-200 font-bold text-xs group-hover/link:text-blue-400">
                        {{ formatDate(encounter.timestamp) }}
                      </div>
                      <div class="text-slate-400 text-xs font-mono group-hover/link:text-blue-300">
                        {{ formatTime(encounter.timestamp) }}
                      </div>
                    </router-link>
                  </td>
                  
                  <!-- Map -->
                  <td class="p-2">
                    <div class="font-bold text-blue-400 text-xs truncate font-mono uppercase">
                      {{ encounter.mapName }}
                    </div>
                  </td>

                  <!-- Player 1 Stats -->
                  <td class="p-2 text-center bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ encounter.player1Score?.toLocaleString() }}
                    </div>
                  </td>
                  <td class="p-2 text-center bg-cyan-500/5">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ encounter.player1Kills }}
                    </div>
                  </td>
                  <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ encounter.player1Deaths }}
                    </div>
                  </td>

                  <!-- Player 2 Stats -->
                  <td class="p-2 text-center bg-orange-500/5 border-l-2 border-l-orange-400/40">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ encounter.player2Score?.toLocaleString() }}
                    </div>
                  </td>
                  <td class="p-2 text-center bg-orange-500/5">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ encounter.player2Kills }}
                    </div>
                  </td>
                  <td class="p-2 text-center bg-orange-500/5">
                    <div class="text-slate-200 font-bold text-xs font-mono">
                      {{ encounter.player2Deaths }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>



      <!-- Milestone Achievements Section -->
      <div
        v-if="comparisonData && (comparisonData.player1MilestoneAchievements?.length || comparisonData.player2MilestoneAchievements?.length)"
        class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div class="p-6 border-b border-slate-700/50">
          <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center gap-3">
            🏆 Milestone Achievements
          </h3>
        </div>
        <div class="p-6 space-y-8">
          <!-- Player 1 Milestone Achievements -->
          <div
            v-if="comparisonData.player1MilestoneAchievements?.length"
            class="space-y-6"
          >
            <div class="text-center">
              <div class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl">
                <h4 class="text-2xl font-bold text-cyan-400">
                  {{ comparisonData.player1 }}
                </h4>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div
                v-for="achievement in comparisonData.player1MilestoneAchievements"
                :key="'p1-achievement-' + achievement.achievementId"
                class="group bg-slate-800/60 hover:bg-slate-700/80 border-2 border-transparent hover:border-opacity-70 rounded-xl p-4 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl"
                :class="{
                  'hover:border-yellow-500': achievement.tier.toLowerCase() === 'legendary',
                  'hover:border-purple-500': achievement.tier.toLowerCase() === 'epic',
                  'hover:border-blue-500': achievement.tier.toLowerCase() === 'rare',
                  'hover:border-green-500': achievement.tier.toLowerCase() === 'uncommon',
                  'hover:border-gray-500': achievement.tier.toLowerCase() === 'common'
                }"
                :style="{ boxShadow: getTierGlow(achievement.tier) }"
                @click="handleMilestoneAchievementClick(achievement, 1)"
              >
                <div class="text-center space-y-3">
                  <div class="mx-auto w-16 h-16 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <img
                      :src="getAchievementImage(achievement.achievementId, achievement.tier)"
                      :alt="achievement.achievementName"
                      class="w-full h-full object-contain"
                      @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                    >
                  </div>
                  <div class="space-y-1">
                    <div class="text-xs font-bold text-slate-200 line-clamp-2 leading-tight">
                      {{ achievement.achievementName }}
                    </div>
                    <div class="text-xs text-slate-400 italic">
                      {{ formatRelativeTime(achievement.achievedAt) }}
                    </div>
                    <div
                      v-if="achievement.value"
                      class="text-xs font-bold text-cyan-400"
                    >
                      {{ achievement.value.toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Player 2 Milestone Achievements -->
          <div
            v-if="comparisonData.player2MilestoneAchievements?.length"
            class="space-y-6"
          >
            <div class="text-center">
              <div class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl">
                <h4 class="text-2xl font-bold text-orange-400">
                  {{ comparisonData.player2 }}
                </h4>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div
                v-for="achievement in comparisonData.player2MilestoneAchievements"
                :key="'p2-achievement-' + achievement.achievementId"
                class="group bg-slate-800/60 hover:bg-slate-700/80 border-2 border-transparent hover:border-opacity-70 rounded-xl p-4 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl"
                :class="{
                  'hover:border-yellow-500': achievement.tier.toLowerCase() === 'legendary',
                  'hover:border-purple-500': achievement.tier.toLowerCase() === 'epic',
                  'hover:border-blue-500': achievement.tier.toLowerCase() === 'rare',
                  'hover:border-green-500': achievement.tier.toLowerCase() === 'uncommon',
                  'hover:border-gray-500': achievement.tier.toLowerCase() === 'common'
                }"
                :style="{ boxShadow: getTierGlow(achievement.tier) }"
                @click="handleMilestoneAchievementClick(achievement, 2)"
              >
                <div class="text-center space-y-3">
                  <div class="mx-auto w-16 h-16 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <img
                      :src="getAchievementImage(achievement.achievementId, achievement.tier)"
                      :alt="achievement.achievementName"
                      class="w-full h-full object-contain"
                      @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                    >
                  </div>
                  <div class="space-y-1">
                    <div class="text-xs font-bold text-slate-200 line-clamp-2 leading-tight">
                      {{ achievement.achievementName }}
                    </div>
                    <div class="text-xs text-slate-400 italic">
                      {{ formatRelativeTime(achievement.achievedAt) }}
                    </div>
                    <div
                      v-if="achievement.value"
                      class="text-xs font-bold text-orange-400"
                    >
                      {{ achievement.value.toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Achievement Modal -->
    <AchievementModal
      :is-visible="showMilestoneAchievementsModal"
      :achievement="selectedMilestoneAchievement"
      :player-name="selectedMilestonePlayer === 1 ? comparisonData?.player1 : selectedMilestonePlayer === 2 ? comparisonData?.player2 : undefined"
      @close="closeMilestoneAchievementsModal"
    />
  </div>
</template>

<style scoped>
/* Utilities for line clamping */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 