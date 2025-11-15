<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AchievementModal from '../components/AchievementModal.vue';
import ComparisonHeader from '../components/PlayerComparison/ComparisonHeader.vue';
import ComparisonStatsTable from '../components/PlayerComparison/ComparisonStatsTable.vue';
import ComparisonAchievements from '../components/PlayerComparison/ComparisonAchievements.vue';

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

interface ActivityByHour {
  formattedHour: string;
  hour: number;
  minutesActive: number;
}

interface ActivityHoursData {
  player1ActivityHours: ActivityByHour[];
  player2ActivityHours: ActivityByHour[];
}

interface ComparisonData {
  player1: string;
  player2: string;
  killRates: KillRateData[];
  bucketTotals: BucketTotal[];
  averagePing: AveragePingData[];
  mapPerformance: MapPerformance[];
  headToHead: HeadToHeadEncounter[];
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

const comparisonData = ref<ComparisonData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Activity hours state
const activityHoursData = ref<ActivityHoursData | null>(null);
const activityHoursLoading = ref(false);
const activityHoursError = ref<string | null>(null);

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

// Function to fetch activity hours for both players
const fetchActivityHours = async (player1: string, player2: string) => {
  if (!player1 || !player2) {
    activityHoursData.value = null;
    return;
  }
  
  activityHoursLoading.value = true;
  activityHoursError.value = null;
  
  try {
    const url = `/stats/players/compare/activity-hours?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`;
    console.log(`Fetching activity hours from: ${url}`);
    
    const response = await fetch(url);
    console.log(`Activity hours response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity hours data');
    }
    
    const data = await response.json();
    console.log('Activity hours data:', data);
    
    activityHoursData.value = data;
  } catch (err: any) {
    console.error('Error fetching activity hours:', err);
    activityHoursError.value = err.message;
  } finally {
    activityHoursLoading.value = false;
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
    
    // Fetch activity hours data asynchronously (don't block the main comparison)
    fetchActivityHours(player1, player2);
    
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

// Handle comparison event from ComparisonHeader component
const handleCompare = async ({ player1, player2 }: { player1: string; player2: string }) => {
  await fetchComparisonData(player1, player2);
};

// Clear server filter and requery
const clearServerFilter = async () => {
  // Refetch comparison data without server filter
  if (comparisonData.value?.player1 && comparisonData.value?.player2) {
    await fetchComparisonData(comparisonData.value.player1, comparisonData.value.player2, false);
  }
};

// Select a specific server for comparison
const selectServer = async (serverGuid: string) => {
  if (comparisonData.value?.player1 && comparisonData.value?.player2) {
    // Refetch comparison data with the selected server (this will also update the URL)
    await fetchComparisonData(comparisonData.value.player1, comparisonData.value.player2, true, serverGuid);
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

  // If both players are in URL, fetch comparison data
  const urlPlayer1 = route.query.player1 as string;
  const urlPlayer2 = route.query.player2 as string;

  if (urlPlayer1 && urlPlayer2) {
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

// Modal state for milestone achievements
const showMilestoneAchievementsModal = ref(false);
const selectedMilestoneAchievement = ref<MilestoneAchievement | null>(null);
const selectedMilestonePlayer = ref<1 | 2 | null>(null);

const closeMilestoneAchievementsModal = () => {
  showMilestoneAchievementsModal.value = false;
  selectedMilestoneAchievement.value = null;
  selectedMilestonePlayer.value = null;
};

const handleShowAchievement = (event: { achievement: MilestoneAchievement; playerNumber: 1 | 2; playerName: string }) => {
  selectedMilestoneAchievement.value = event.achievement;
  selectedMilestonePlayer.value = event.playerNumber;
  showMilestoneAchievementsModal.value = true;
};

</script>

<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header Section -->
    <ComparisonHeader
      :initial-player1="route.query.player1 as string"
      :initial-player2="route.query.player2 as string"
      :is-loading="isLoading"
      @compare="handleCompare"
    />

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

      <!-- Comparison Stats Table Component -->
      <ComparisonStatsTable
        :comparison-data="comparisonData"
        :activity-hours-data="activityHoursData"
        :activity-hours-loading="activityHoursLoading"
        :activity-hours-error="activityHoursError"
        :is-dark-mode="isDarkMode"
        :chart-key="chartKey"
      />



      <!-- Milestone Achievements Component -->
      <ComparisonAchievements
        v-if="comparisonData"
        :comparison-data="comparisonData"
        @show-achievement="handleShowAchievement"
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
</template> 