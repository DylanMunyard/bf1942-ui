<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AchievementModal from '../components/AchievementModal.vue';
import PlayerSearchInput from '../components/PlayerSearchInput.vue';
import ComparisonSummary from '../components/ComparisonSummary.vue';
import ComparisonCoreStats from '../components/ComparisonCoreStats.vue';
import PerformanceOverTime from '../components/PerformanceOverTime.vue';
import CommonServersSelector from '../components/CommonServersSelector.vue';
import HourlyOverlapChart from '../components/HourlyOverlapChart.vue';
import MapPerformanceTable from '../components/MapPerformanceTable.vue';
import HeadToHeadTable from '../components/HeadToHeadTable.vue';
import MilestoneAchievementsSection from '../components/MilestoneAchievementsSection.vue';
import { formatRelativeTime } from '@/utils/timeUtils';
import { calculateKDR } from '@/utils/statsUtils';



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

const selectPlayer = (player: PlayerSearchResult, playerNumber: 1 | 2) => {
  if (playerNumber === 1) {
    player1Input.value = player.playerName;
  } else {
    player2Input.value = player.playerName;
  }
};

const hideDropdowns = () => {
  // Handled by components now
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

</script>

<template>
  <div class="portal-page">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
    <!-- Header Section -->
    <div class="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] mb-6">
      <div class="w-full max-w-screen-2xl mx-auto px-0 sm:px-8 lg:px-12 py-6">
        <div class="text-center mb-8 px-4 sm:px-0">
          <h1 class="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
            Player Comparison
          </h1>
          <p class="text-neutral-400 text-sm">
            Compare statistics side-by-side
          </p>
        </div>
        
        <!-- Search Form -->
        <div 
          class="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-4xl mx-auto px-4 sm:px-0"
          @click="hideDropdowns"
        >
          <!-- Player 1 Input with Search -->
          <PlayerSearchInput
            v-model="player1Input"
            placeholder="Player 1 Name"
            :player-number="1"
            @select="(player) => selectPlayer(player, 1)"
            @enter="handleCompare"
          />

          <!-- VS Text -->
          <div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 flex-shrink-0">
            VS
          </div>

          <!-- Player 2 Input with Search -->
          <PlayerSearchInput
            v-model="player2Input"
            placeholder="Player 2 Name"
            :player-number="2"
            :input-ref="player2InputRef"
            @select="(player) => selectPlayer(player, 2)"
            @enter="handleCompare"
          />

          <!-- Compare Button -->
          <button
            :disabled="isLoading || !player1Input.trim() || !player2Input.trim()"
            class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-neutral-700 disabled:to-neutral-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-purple-500/25 disabled:shadow-none disabled:cursor-not-allowed flex-shrink-0"
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
          <div class="w-20 h-20 border-4 border-neutral-700 rounded-full animate-spin" />
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
        <div class="text-xl font-medium text-neutral-300">
          Enter two player names above and click "Compare" to see their stats side-by-side.
        </div>
        <div class="text-sm text-neutral-400">
          Compare performance metrics, activity patterns, and head-to-head encounters between any two players.
        </div>
      </div>
    </div>

    <!-- Comparison Results -->
    <div
      v-if="comparisonData"
      class="w-full max-w-screen-2xl mx-auto px-2 sm:px-8 lg:px-12 py-6 space-y-8"
    >
      <!-- Common Servers Selector -->
      <CommonServersSelector
        v-if="comparisonData.commonServers && comparisonData.commonServers.length > 0"
        :common-servers="comparisonData.commonServers"
        :selected-server-guid="comparisonData.serverDetails?.guid"
        @select="selectServer"
        @clear="clearServerFilter"
      />

      <!-- Summary Panel -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComparisonSummary
          :player-name="comparisonData.player1"
          :kdr="player1KDR"
          :player-number="1"
          :is-winner="parseFloat(player1KDR) > parseFloat(player2KDR)"
        />
        <ComparisonSummary
          :player-name="comparisonData.player2"
          :kdr="player2KDR"
          :player-number="2"
          :is-winner="parseFloat(player2KDR) > parseFloat(player1KDR)"
        />
      </div>

      <!-- Core Statistics -->
      <ComparisonCoreStats
        :player1-name="comparisonData.player1"
        :player2-name="comparisonData.player2"
        :player1-kill-rate="player1KillRate"
        :player2-kill-rate="player2KillRate"
        :player1-average-ping="player1AveragePing"
        :player2-average-ping="player2AveragePing"
      />

      <!-- Playtime Overlap -->
      <HourlyOverlapChart
        v-if="comparisonData.hourlyOverlap && comparisonData.hourlyOverlap.length > 0"
        :hourly-overlap="comparisonData.hourlyOverlap"
        :player1-name="comparisonData.player1"
        :player2-name="comparisonData.player2"
        :is-dark-mode="isDarkMode"
        :chart-key="chartKey"
      />

      <!-- Performance Over Time -->
      <PerformanceOverTime
        v-if="comparisonData.bucketTotals && comparisonData.bucketTotals.length > 0"
        :bucket-totals="comparisonData.bucketTotals"
        :player1-name="comparisonData.player1"
        :player2-name="comparisonData.player2"
      />

      <!-- Map Performance -->
      <MapPerformanceTable
        v-if="combinedMapPerformance.length > 0"
        :map-performance="comparisonData.mapPerformance"
        :player1-name="comparisonData.player1"
        :player2-name="comparisonData.player2"
      />
        
      <!-- Head-to-Head Encounters -->
      <HeadToHeadTable
        v-if="comparisonData.headToHead && comparisonData.headToHead.length > 0"
        :head-to-head="comparisonData.headToHead"
        :player1-name="comparisonData.player1"
        :player2-name="comparisonData.player2"
        :player1-input="player1Input"
        :player2-input="player2Input"
      />



      <!-- Milestone Achievements Section -->
      <MilestoneAchievementsSection
        v-if="comparisonData && (comparisonData.player1MilestoneAchievements?.length || comparisonData.player2MilestoneAchievements?.length)"
        :player1-name="comparisonData.player1"
        :player2-name="comparisonData.player2"
        :player1-achievements="comparisonData.player1MilestoneAchievements"
        :player2-achievements="comparisonData.player2MilestoneAchievements"
        @achievement-click="handleMilestoneAchievementClick"
      />
    </div>
    
    <!-- Achievement Modal -->
    <AchievementModal
      :is-visible="showMilestoneAchievementsModal"
      :achievement="selectedMilestoneAchievement"
      :player-name="selectedMilestonePlayer === 1 ? comparisonData?.player1 : selectedMilestonePlayer === 2 ? comparisonData?.player2 : undefined"
      @close="closeMilestoneAchievementsModal"
    />
    </div>
  </div>
</template>

<style src="./portal-layout.css"></style>
<style scoped src="./PlayerComparison.vue.css"></style> 