<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { PlayerTimeStatistics } from '@/types/playerStatsTypes';
import { getBadgeDescription, isBadgeServiceInitialized } from '@/services/badgeService';
import AchievementModal from './AchievementModal.vue';
import StreakModal from './StreakModal.vue';

interface Achievement {
  playerName: string;
  achievementType: string;
  achievementId: string;
  achievementName: string;
  tier: string;
  value: number;
  achievedAt: string;
  processedAt: string;
  serverGuid: string;
  mapName: string;
  roundId: string;
  metadata: string;
}

interface Streak {
  playerName: string;
  streakCount: number;
  streakStart: string;
  streakEnd: string;
  serverGuid: string;
  mapName: string;
  roundId: string;
  isActive: boolean;
}

interface BestStreaks {
  bestSingleRoundStreak: number;
  bestStreakMap: string;
  bestStreakServer: string;
  bestStreakDate: string;
  recentStreaks: Streak[];
}

interface NextMilestone {
  milestone: number;
  currentKills: number;
  progress: number;
  killsRemaining: number;
}

interface GamificationData {
  playerName: string;
  recentAchievements: Achievement[];
  allBadges: Achievement[];
  milestones: Achievement[];
  bestStreaks: BestStreaks;
  lastCalculated: string;
}

const props = defineProps<{
  playerName: string;
  playerStats?: PlayerTimeStatistics;
}>();

const router = useRouter();

const gamificationData = ref<GamificationData | null>(null);
const playerStatsData = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedAchievement = ref<Achievement | null>(null);
const showModal = ref(false);
const selectedStreakGroup = ref<{ streak: Streak, count: number, allStreaks: Streak[] } | null>(null);
const showStreakModal = ref(false);
const showNextMilestoneModal = ref(false);
const badgeServiceReady = ref(isBadgeServiceInitialized());

// Milestone constants
const MILESTONES = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];

const fetchGamificationData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`/stats/gamification/player/${encodeURIComponent(props.playerName)}`);
    if (!response.ok) throw new Error('Failed to fetch gamification data');
    gamificationData.value = await response.json();
  } catch (err: any) {
    console.error('Error fetching gamification data:', err);
    error.value = err.message || 'Failed to load achievements.';
  } finally {
    isLoading.value = false;
  }
};

const fetchPlayerStats = async () => {
  // If player stats are passed as a prop, use them instead of fetching
  if (props.playerStats) {
    playerStatsData.value = props.playerStats;
    return;
  }
  
  try {
    const response = await fetch(`/stats/players/${encodeURIComponent(props.playerName)}`);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    playerStatsData.value = await response.json();
  } catch (err: any) {
    console.error('Error fetching player stats:', err);
  }
};

const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } else if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
};

const getAchievementImage = (achievementId: string): string => {
  try {
    return new URL(`../assets/achievements/${achievementId}.png`, import.meta.url).href;
  } catch {
    return new URL('../assets/achievements/kill_streak_10.png', import.meta.url).href;
  }
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

// Calculate next milestone
const nextMilestone = computed((): NextMilestone | null => {
  if (!playerStatsData.value) return null;
  
  const currentKills = playerStatsData.value.totalKills;
  
  // Find the next milestone that is greater than current kills
  const nextMilestoneValue = MILESTONES.find(milestone => milestone > currentKills);
  
  if (!nextMilestoneValue) return null; // All milestones achieved or no next milestone
  
  // Calculate progress
  const prevMilestone = [...MILESTONES].reverse().find(m => m < nextMilestoneValue) || 0;
  const progress = (currentKills - prevMilestone) / (nextMilestoneValue - prevMilestone);
  const killsRemaining = nextMilestoneValue - currentKills;
  
  return {
    milestone: nextMilestoneValue,
    currentKills,
    progress: Math.max(0, Math.min(1, progress)),
    killsRemaining: Math.max(0, killsRemaining)
  };
});

const getMilestoneImage = (milestone: number): string => {
  try {
    return new URL(`../assets/achievements/total_kills_${milestone}.png`, import.meta.url).href;
  } catch {
    return new URL('../assets/achievements/kill_streak_10.png', import.meta.url).href;
  }
};



const combinedStreaks = computed(() => {
  if (!gamificationData.value?.bestStreaks.recentStreaks) return [];
  
  const streakMap = new Map<number, { streak: Streak, count: number, allStreaks: Streak[] }>();
  
  gamificationData.value.bestStreaks.recentStreaks.forEach(streak => {
    const key = streak.streakCount;
    
    if (streakMap.has(key)) {
      const existing = streakMap.get(key)!;
      // Keep the most recent streak and add to allStreaks
      if (new Date(streak.streakStart).getTime() > new Date(existing.streak.streakStart).getTime()) {
        existing.streak = streak;
      }
      existing.count++;
      existing.allStreaks.push(streak);
    } else {
      streakMap.set(key, { streak, count: 1, allStreaks: [streak] });
    }
  });
  
  return Array.from(streakMap.values())
    .sort((a, b) => b.streak.streakCount - a.streak.streakCount)
    .slice(0, 6);
});


const flattenedAchievements = computed(() => {
  if (!gamificationData.value) return [];
  
  // Show both milestones and all badges in the Achievement Timeline
  const allAchievements = [
    ...gamificationData.value.milestones,
    ...gamificationData.value.allBadges
  ];
  
  return allAchievements.sort((a, b) => 
    new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );
});

// Count achievements that are NOT kill streaks (i.e., milestones and other badges)
const nonStreakAchievements = computed(() => {
  if (!gamificationData.value) return 0;
  
  const allAchievements = [
    ...gamificationData.value.milestones,
    ...gamificationData.value.allBadges
  ];
  
  // Filter out kill streak achievements
  return allAchievements.filter(achievement => 
    !achievement.achievementId.startsWith('kill_streak_')
  ).length;
});


const openAchievementModal = (achievement: Achievement) => {
  selectedAchievement.value = achievement;
  showModal.value = true;
};

const openNextMilestoneModal = () => {
  showNextMilestoneModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedAchievement.value = null;
};

// Timeline helper function
const getTimeGap = (currentStreak: Streak, nextStreak: Streak): string => {
  const current = new Date(currentStreak.streakStart.endsWith('Z') ? currentStreak.streakStart : currentStreak.streakStart + 'Z');
  const next = new Date(nextStreak.streakStart.endsWith('Z') ? nextStreak.streakStart : nextStreak.streakStart + 'Z');
  
  const diffMs = current.getTime() - next.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays >= 1) {
    return diffDays === 1 ? '1 day later' : `${diffDays} days later`;
  } else if (diffHours >= 2) {
    return `${diffHours} hours later`;
  }
  
  return ''; // Don't show gap for streaks close together
};

const closeNextMilestoneModal = () => {
  showNextMilestoneModal.value = false;
};

const openStreakModal = (streakGroup: { streak: Streak, count: number, allStreaks: Streak[] }) => {
  selectedStreakGroup.value = streakGroup;
  showStreakModal.value = true;
};

const openBestStreakModal = () => {
  if (!gamificationData.value?.bestStreaks) return;
  
  // Create a mock streak object for the best streak
  const bestStreak: Streak = {
    playerName: props.playerName,
    streakCount: gamificationData.value.bestStreaks.bestSingleRoundStreak,
    streakStart: gamificationData.value.bestStreaks.bestStreakDate,
    streakEnd: gamificationData.value.bestStreaks.bestStreakDate,
    serverGuid: gamificationData.value.bestStreaks.bestStreakServer || '',
    mapName: gamificationData.value.bestStreaks.bestStreakMap,
    roundId: '',
    isActive: false
  };
  
  selectedStreakGroup.value = {
    streak: bestStreak,
    count: 1,
    allStreaks: [bestStreak]
  };
  showStreakModal.value = true;
};

const navigateToRoundReport = (streak: Streak) => {
  router.push({
    path: '/servers/round-report',
    query: {
      serverGuid: streak.serverGuid,
      mapName: streak.mapName,
      startTime: streak.streakStart,
      players: props.playerName
    }
  });
};

const closeStreakModal = () => {
  showStreakModal.value = false;
  selectedStreakGroup.value = null;
};

const getAchievementTooltip = (achievement: Achievement): string => {
  const description = getBadgeDescription(achievement.achievementId);
  const basicInfo = `${achievement.achievementName} - ${formatRelativeTime(achievement.achievedAt)}`;
  return description ? `${basicInfo}\n\n${description}` : basicInfo;
};




onMounted(async () => {
  await Promise.all([
    fetchGamificationData(),
    fetchPlayerStats()
  ]);
  
  // Check if badge service is ready, and poll until it is
  const checkBadgeService = () => {
    if (isBadgeServiceInitialized()) {
      badgeServiceReady.value = true;
    } else {
      // Poll every 100ms until badge service is ready
      setTimeout(checkBadgeService, 100);
    }
  };
  
  if (!badgeServiceReady.value) {
    checkBadgeService();
  }
});
</script>

<template>
  <div class="relative">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 text-slate-400"
    >
      <div class="w-12 h-12 border-4 border-slate-600/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
      <p class="text-lg font-medium">Loading achievements...</p>
      <p class="text-sm text-slate-500 mt-2">Scanning battlefield records</p>
    </div>
    
    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 text-center"
    >
      <div class="text-6xl mb-4 opacity-50">⚠️</div>
      <p class="text-red-400 text-lg font-semibold mb-4">{{ error }}</p>
      <button 
        @click="fetchGamificationData"
        class="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
    
    <!-- Combat Achievements Header -->
    <div v-if="gamificationData" class="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
      <!-- Trophy Icon -->
      <div class="flex-shrink-0">
        <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-1">
          <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
            <div class="text-2xl">🏆</div>
          </div>
        </div>
      </div>

      <!-- Header Content -->
      <div class="flex-grow">
        <h2 class="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-3">
          Combat Achievements
        </h2>
        
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div class="text-lg font-bold text-yellow-400">{{ flattenedAchievements.length }}</div>
            <div class="text-xs text-slate-400">Total Earned</div>
          </div>
          <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div class="text-lg font-bold text-orange-400">{{ gamificationData.bestStreaks.bestSingleRoundStreak || 0 }}</div>
            <div class="text-xs text-slate-400">Best Streak</div>
          </div>
          <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div class="text-lg font-bold text-purple-400">{{ nonStreakAchievements }}</div>
            <div class="text-xs text-slate-400">Milestones</div>
          </div>
          <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div class="text-lg font-bold text-cyan-400">{{ combinedStreaks.length }}</div>
            <div class="text-xs text-slate-400">Kill Streaks</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured Achievements Section -->
    <div v-if="gamificationData && (gamificationData.bestStreaks.bestSingleRoundStreak > 0 || nextMilestone)" class="mb-6">
      <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-3 mb-4">
        ⭐ Featured Achievements
      </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Best Streak Showcase -->
          <div 
            v-if="gamificationData.bestStreaks.bestSingleRoundStreak > 0"
            class="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-yellow-500/50 hover:border-yellow-400 transition-all duration-300 cursor-pointer hover:scale-[1.02] overflow-hidden"
            @click="openBestStreakModal"
          >
            <!-- Animated background -->
            <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Crown badge -->
            <div class="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 text-sm font-bold px-3 py-1.5 rounded-xl shadow-lg border border-yellow-300 z-10">
              👑 LEGENDARY
            </div>
            
            <div class="relative z-10 p-6">
              <div class="flex flex-col items-center text-center space-y-4">
                <div class="relative">
                  <img 
                    :src="getAchievementImage('kill_streak_' + gamificationData.bestStreaks.bestSingleRoundStreak)" 
                    :alt="'Best Kill Streak: ' + gamificationData.bestStreaks.bestSingleRoundStreak"
                    class="w-24 h-32 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div class="space-y-2">
                  <h4 class="text-lg font-bold text-yellow-400">Best Kill Streak</h4>
                  <div class="text-2xl font-extrabold text-white">{{ gamificationData.bestStreaks.bestSingleRoundStreak }}</div>
                  <p class="text-sm text-slate-400">{{ gamificationData.bestStreaks.bestStreakMap }}</p>
                  <p class="text-xs text-slate-500">{{ formatRelativeTime(gamificationData.bestStreaks.bestStreakDate) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Next Milestone -->
          <div 
            v-if="nextMilestone"
            class="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-blue-500/50 hover:border-blue-400 transition-all duration-300 cursor-pointer hover:scale-[1.02] overflow-hidden"
            @click="openNextMilestoneModal"
          >
            <!-- Progress bar background -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50">
              <div 
                class="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 transition-all duration-1000 ease-out"
                :style="{ width: nextMilestone.progress * 100 + '%' }"
              ></div>
            </div>
            
            <!-- Target badge -->
            <div class="absolute -top-2 -right-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl shadow-lg border border-blue-300 z-10">
              🎯 NEXT GOAL
            </div>
            
            <div class="relative z-10 p-6">
              <div class="flex flex-col items-center text-center space-y-4">
                <div class="relative">
                  <img 
                    :src="getMilestoneImage(nextMilestone.milestone)" 
                    :alt="`${nextMilestone.milestone.toLocaleString()} Kills Milestone`"
                    class="w-24 h-32 object-contain filter brightness-110 saturate-75 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div class="space-y-2">
                  <h4 class="text-lg font-bold text-blue-400">Next Milestone</h4>
                  <div class="text-2xl font-extrabold text-white">{{ nextMilestone.milestone.toLocaleString() }}</div>
                  <p class="text-sm text-slate-400">{{ Math.floor(nextMilestone.progress * 100) }}% Complete</p>
                  <p class="text-xs text-slate-500">{{ nextMilestone.killsRemaining.toLocaleString() }} kills remaining</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Achievement Highlight -->
          <div 
            v-if="gamificationData.recentAchievements.length > 0"
            class="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-emerald-500/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer hover:scale-[1.02] overflow-hidden"
            @click="openAchievementModal(gamificationData.recentAchievements[0])"
          >
            <!-- Fresh badge -->
            <div class="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-400 to-green-500 text-emerald-900 text-sm font-bold px-3 py-1.5 rounded-xl shadow-lg border border-emerald-300 z-10">
              ✨ RECENT
            </div>
            
            <div class="relative z-10 p-6">
              <div class="flex flex-col items-center text-center space-y-4">
                <div class="relative">
                  <img 
                    :src="getAchievementImage(gamificationData.recentAchievements[0].achievementId)" 
                    :alt="gamificationData.recentAchievements[0].achievementName"
                    class="w-24 h-32 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div class="space-y-2">
                  <h4 class="text-lg font-bold text-emerald-400">Latest Achievement</h4>
                  <div class="text-lg font-bold text-white">{{ gamificationData.recentAchievements[0].achievementName }}</div>
                  <p class="text-sm text-slate-400 capitalize">{{ gamificationData.recentAchievements[0].tier }} Tier</p>
                  <p class="text-xs text-slate-500">{{ formatRelativeTime(gamificationData.recentAchievements[0].achievedAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>

    <!-- Kill Streaks Gallery -->
    <div v-if="gamificationData && combinedStreaks.length > 0" class="mb-6">
      <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 flex items-center gap-3 mb-4">
        🔥 Kill Streak Records
      </h3>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          <div 
            v-for="(item, index) in combinedStreaks.slice(0, 16)" 
            :key="`streak-${index}`"
            class="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-orange-500/30 hover:border-orange-400 transition-all duration-300 cursor-pointer hover:scale-105 aspect-square overflow-hidden"
            @click="openStreakModal(item)"
          >
            <!-- Streak glow effect -->
            <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <!-- Count badge -->
            <div
              v-if="item.count > 1"
              class="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg border border-orange-400 z-10"
            >
              ×{{ item.count }}
            </div>
            
            <div class="relative z-10 p-3 flex flex-col items-center justify-center h-full">
              <img 
                :src="getAchievementImage('kill_streak_' + item.streak.streakCount)" 
                :alt="`${item.streak.streakCount} Kill Streak`"
                class="w-12 h-16 object-contain transition-transform duration-300 group-hover:scale-110 mb-2"
              />
              <div class="text-center">
                <div class="text-lg font-bold text-orange-400">{{ item.streak.streakCount }}</div>
                <div class="text-xs text-slate-400">Kills</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="combinedStreaks.length > 16" class="text-center">
          <button class="text-orange-400 hover:text-orange-300 text-sm font-medium px-4 py-2 bg-slate-700/30 hover:bg-slate-600/50 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all duration-200">
            View All {{ combinedStreaks.length }} Kill Streaks
          </button>
        </div>
    </div>

    <!-- All Achievements Grid -->
    <div v-if="gamificationData && flattenedAchievements.length > 0" class="mb-6">
      <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3 mb-4">
        🏅 Achievement Collection
      </h3>
        
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
          <div 
            v-for="(achievement, index) in flattenedAchievements.slice(0, 36)" 
            :key="`achievement-${index}`"
            class="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 aspect-square overflow-hidden"
            :class="[
              achievement.tier.toLowerCase() === 'legendary' ? 'border-orange-500/40 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20' :
              achievement.tier.toLowerCase() === 'epic' ? 'border-purple-500/40 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20' :
              achievement.tier.toLowerCase() === 'rare' ? 'border-blue-500/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20' :
              achievement.tier.toLowerCase() === 'uncommon' ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20' :
              'border-slate-600/40 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-500/20'
            ]"
            :title="getAchievementTooltip(achievement)"
            @click="openAchievementModal(achievement)"
          >
            <!-- Tier background glow -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" :class="[
              achievement.tier.toLowerCase() === 'legendary' ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10' :
              achievement.tier.toLowerCase() === 'epic' ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10' :
              achievement.tier.toLowerCase() === 'rare' ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10' :
              achievement.tier.toLowerCase() === 'uncommon' ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10' :
              'bg-gradient-to-br from-slate-500/10 to-slate-600/10'
            ]"></div>
            
            <div class="relative z-10 p-2 flex items-center justify-center h-full">
              <img 
                :src="getAchievementImage(achievement.achievementId)" 
                :alt="achievement.achievementName"
                class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
        
        <div v-if="flattenedAchievements.length > 36" class="text-center">
          <button class="text-purple-400 hover:text-purple-300 text-sm font-medium px-6 py-3 bg-slate-700/30 hover:bg-slate-600/50 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200">
            View All {{ flattenedAchievements.length }} Achievements
          </button>
        </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="gamificationData && flattenedAchievements.length === 0 && !gamificationData.bestStreaks.bestSingleRoundStreak && !nextMilestone"
      class="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-12 text-center"
    >
        <div class="relative mb-8">
          <div class="text-8xl opacity-20 animate-pulse">🏆</div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-32 h-32 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-xl"></div>
          </div>
        </div>
        
        <div class="space-y-4 max-w-lg mx-auto">
          <h3 class="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Your Legend Awaits
          </h3>
          <p class="text-slate-400 text-lg leading-relaxed">
            Every battlefield hero starts somewhere. Begin your journey to unlock achievements, build epic kill streaks, and establish your legendary reputation.
          </p>
        </div>
        
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div class="bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm px-6 py-4 rounded-xl border border-slate-600/50 flex items-center gap-3">
            <span class="text-2xl">🎮</span>
            <span class="text-slate-300 font-medium">Ready to make history?</span>
          </div>
        </div>
    </div>

    <!-- Streak Modal -->
    <StreakModal
      :is-visible="showStreakModal"
      :streak-group="selectedStreakGroup"
      :player-name="playerName"
      @close="closeStreakModal"
    />

    <!-- Achievement Modal -->
    <AchievementModal
      :is-visible="showModal"
      :achievement="selectedAchievement"
      :player-name="playerName"
      @close="closeModal"
    />

    <!-- Next Milestone Modal -->
    <Teleport to="body">
      <div
        v-if="showNextMilestoneModal && nextMilestone"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-5"
        @click="closeNextMilestoneModal"
      >
        <div 
        class="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden"
        @click.stop
      >
        <!-- Progress bar at bottom -->
        <div class="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-cyan-400 to-yellow-400 transition-all duration-700 z-10" :style="{ width: nextMilestone.progress * 100 + '%' }"></div>
        
        <div class="flex justify-between items-start p-6 border-b border-slate-700/50">
          <div class="flex-1">
            <h3 class="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
              Next Milestone: {{ nextMilestone.milestone.toLocaleString() }} Kills
            </h3>
            <div class="text-slate-400">
              <span class="font-medium text-slate-300">Current Progress:</span>
              {{ nextMilestone.currentKills.toLocaleString() }} / {{ nextMilestone.milestone.toLocaleString() }} kills
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-white transition-colors duration-200 text-3xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50"
            @click="closeNextMilestoneModal"
          >
            &times;
          </button>
        </div>
        
        <div class="p-6">
          <div class="flex justify-center mb-6">
            <img 
              :src="getMilestoneImage(nextMilestone.milestone)" 
              :alt="`${nextMilestone.milestone.toLocaleString()} Kills Milestone`"
              class="w-48 h-64 rounded-2xl object-contain bg-slate-800/50 border border-slate-700/50 filter grayscale-[0.3] brightness-110"
            />
          </div>
          
          <div class="grid gap-4">
            <div class="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span class="text-slate-400 font-medium">Progress:</span>
              <span class="text-yellow-400 font-bold">{{ Math.floor(nextMilestone.progress * 100) }}% complete</span>
            </div>
            
            <div class="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span class="text-slate-400 font-medium">Kills Remaining:</span>
              <span class="text-orange-400 font-bold">{{ nextMilestone.killsRemaining.toLocaleString() }} kills to go</span>
            </div>
            
            <div class="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span class="text-slate-400 font-medium">Current Total:</span>
              <span class="text-blue-400 font-bold">{{ nextMilestone.currentKills.toLocaleString() }} kills</span>
            </div>
            
            <div class="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span class="text-slate-400 font-medium">Target:</span>
              <span class="text-green-400 font-bold">{{ nextMilestone.milestone.toLocaleString() }} kills</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling for modal timeline */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #f97316, #dc2626);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #ea580c, #b91c1c);
}
</style>