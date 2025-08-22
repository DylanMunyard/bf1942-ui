<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { PlayerTimeStatistics } from '@/types/playerStatsTypes';
import { getBadgeDescription, isBadgeServiceInitialized } from '@/services/badgeService';
import AchievementModal from './AchievementModal.vue';

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



// Computed property to get the selected streak's badge description reactively
const selectedStreakDescription = computed(() => {
  if (!selectedStreakGroup.value || !badgeServiceReady.value) return null;
  const streakCount = selectedStreakGroup.value.streak.streakCount;
  const achievementId = `kill_streak_${streakCount}`;
  return getBadgeDescription(achievementId);
});

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
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-[200px] space-y-4"
    >
      <div class="w-10 h-10 border-4 border-slate-600/30 border-t-yellow-500 rounded-full animate-spin"></div>
      <p class="text-slate-400 font-medium">Loading achievements...</p>
    </div>
    
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center min-h-[200px] space-y-4"
    >
      <div class="text-6xl opacity-50">⚠️</div>
      <p class="text-red-400 font-bold text-center">
        {{ error }}
      </p>
    </div>
    
    <div
      v-else-if="gamificationData"
      class="space-y-10"
    >
      <!-- Unified Badge Grid: Best Streak → Recent Streaks → Next Milestone → Achievements -->
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
          <!-- Best Streak (first position) -->
          <div
            v-if="gamificationData.bestStreaks.bestSingleRoundStreak > 0"
            class="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-yellow-500/70 hover:border-yellow-400 transition-all duration-300 cursor-pointer hover:scale-105 p-1 aspect-square hover:shadow-xl hover:shadow-yellow-500/30"
            @click="openBestStreakModal"
            :title="`BEST: ${gamificationData.bestStreaks.bestSingleRoundStreak} Kill Streak - ${gamificationData.bestStreaks.bestStreakMap}`"
          >
            <!-- Best streak background glow -->
            <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500/15 to-orange-500/15"></div>
            
            <!-- Crown badge -->
            <div class="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 text-xs font-bold px-1 py-0.5 rounded-lg shadow-lg border border-yellow-300 z-20">
              👑
            </div>
            
            <div class="relative z-10 flex items-center justify-center h-full p-0.5">
              <img 
                :src="getAchievementImage('kill_streak_' + gamificationData.bestStreaks.bestSingleRoundStreak)" 
                :alt="'Kill streak ' + gamificationData.bestStreaks.bestSingleRoundStreak"
                class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 rounded-lg"
                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
              />
            </div>
          </div>

          <!-- Recent Streaks -->
          <div 
            v-for="(item, index) in combinedStreaks.slice(0, 8)" 
            :key="`streak-${index}`"
            class="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-orange-500/50 hover:border-orange-400 transition-all duration-300 cursor-pointer hover:scale-105 p-1 aspect-square hover:shadow-xl hover:shadow-orange-500/25"
            @click="openStreakModal(item)"
            :title="`${item.streak.streakCount} Kill Streak - ${item.streak.mapName}`"
          >
            <!-- Tier background glow -->
            <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
            
            <!-- Count badge -->
            <div
              v-if="item.count > 1"
              class="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-1 py-0.5 rounded-lg shadow-lg border border-orange-400 z-20"
            >
              ×{{ item.count }}
            </div>
            
            <div class="relative z-10 flex items-center justify-center h-full p-0.5">
              <img 
                :src="getAchievementImage('kill_streak_' + item.streak.streakCount)" 
                :alt="'Kill streak ' + item.streak.streakCount"
                class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 rounded-lg"
                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
              />
            </div>
          </div>
          
          <!-- Next Milestone -->
          <div 
            v-if="nextMilestone"
            class="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-blue-500/70 hover:border-blue-400 transition-all duration-300 cursor-pointer hover:scale-105 p-1 aspect-square hover:shadow-xl hover:shadow-blue-500/30 overflow-hidden"
            @click="openNextMilestoneModal"
            :title="`Next Milestone: ${nextMilestone.milestone.toLocaleString()} Kills (${Math.floor(nextMilestone.progress * 100)}% complete)`"
          >
            <!-- Progress bar at bottom -->
            <div 
              class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 transition-all duration-1000 ease-out"
              :style="{ width: nextMilestone.progress * 100 + '%' }"
            ></div>
            
            <!-- Milestone background glow -->
            <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
            
            <!-- Target badge -->
            <div class="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xs font-bold px-1 py-0.5 rounded-lg shadow-lg border border-blue-300 z-20">
              🎯
            </div>
            
            <div class="relative z-10 flex items-center justify-center h-full p-0.5">
              <img 
                :src="getMilestoneImage(nextMilestone.milestone)" 
                :alt="`${nextMilestone.milestone.toLocaleString()} Kills Milestone`"
                class="w-full h-full object-contain filter grayscale-[0.3] brightness-110 transition-transform duration-300 group-hover:scale-110 rounded-lg"
              />
            </div>
          </div>
          
          <!-- Regular Achievements -->
          <div 
            v-for="(achievement, index) in flattenedAchievements.slice(0, 24)" 
            :key="`achievement-${index}`"
            class="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 p-1 aspect-square"
            :class="[
              achievement.tier.toLowerCase() === 'legendary' ? 'border-orange-500/50 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/25' :
              achievement.tier.toLowerCase() === 'epic' ? 'border-purple-500/50 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/25' :
              achievement.tier.toLowerCase() === 'rare' ? 'border-blue-500/50 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/25' :
              achievement.tier.toLowerCase() === 'uncommon' ? 'border-emerald-500/50 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25' :
              'border-slate-600/50 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-500/20'
            ]"
            :title="getAchievementTooltip(achievement)"
            @click="openAchievementModal(achievement)"
          >
            <!-- Tier background glow (no more tier indicator dots) -->
            <div class="absolute inset-0 rounded-xl opacity-10" :class="[
              achievement.tier.toLowerCase() === 'legendary' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
              achievement.tier.toLowerCase() === 'epic' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
              achievement.tier.toLowerCase() === 'rare' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
              achievement.tier.toLowerCase() === 'uncommon' ? 'bg-gradient-to-br from-emerald-500 to-green-500' :
              'bg-gradient-to-br from-slate-500 to-slate-600'
            ]"></div>
            
            <div class="relative z-10 flex items-center justify-center h-full p-0.5">
              <img 
                :src="getAchievementImage(achievement.achievementId)" 
                :alt="achievement.achievementName"
                class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 rounded-lg"
                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
              />
            </div>
          </div>
        </div>
        
        <!-- View All Button -->
        <div
          v-if="(flattenedAchievements.length > 24) || (combinedStreaks.length > 8)"
          class="flex justify-center pt-6"
        >
          <button class="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 border border-slate-600 hover:border-slate-500">
            View All {{ (gamificationData.bestStreaks.bestSingleRoundStreak > 0 ? 1 : 0) + combinedStreaks.length + (nextMilestone ? 1 : 0) + flattenedAchievements.length }} Items
          </button>
        </div>

      <!-- No Achievements State -->
      <div
        v-if="flattenedAchievements.length === 0 && !gamificationData.bestStreaks.bestSingleRoundStreak && !nextMilestone"
        class="text-center py-20 space-y-8"
      >
        <div class="relative">
          <div class="text-9xl opacity-30 animate-bounce">
            🏆
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-32 h-32 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div class="space-y-4 max-w-lg mx-auto">
          <h3 class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Your Legend Awaits
          </h3>
          <p class="text-slate-300 text-lg leading-relaxed">
            Every battlefield hero starts somewhere. Begin your journey to unlock achievements, build epic kill streaks, and establish your legendary reputation.
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div class="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 rounded-xl border border-slate-600 flex items-center gap-3">
            <span class="text-2xl">🎮</span>
            <span class="text-slate-300 font-medium">Ready to make history?</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Streak Details Modal -->
    <Teleport to="body">
      <div
        v-if="showStreakModal && selectedStreakGroup"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-5"
        @click="closeStreakModal"
      >
        <div
        class="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        @click.stop
      >
        <div class="flex justify-between items-start p-6 border-b border-slate-700/50">
          <div class="flex-1">
            <h3 class="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
              {{ selectedStreakGroup.streak.streakCount }} Kill Streak
            </h3>
            <div class="text-slate-400">
              <span class="font-medium text-slate-300">Achieved {{ selectedStreakGroup.count }} time{{ selectedStreakGroup.count !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-white transition-colors duration-200 text-3xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50"
            @click="closeStreakModal"
          >
            &times;
          </button>
        </div>
        
        <div class="p-6">
          <div class="flex flex-col items-center mb-6">
            <div class="relative">
              <img 
                :src="getAchievementImage('kill_streak_' + selectedStreakGroup.streak.streakCount)" 
                :alt="selectedStreakGroup.streak.streakCount + ' Kill Streak'"
                class="w-48 h-64 rounded-2xl object-contain bg-slate-800/50 border border-slate-700/50"
              />
              
              <!-- Badge Description Overlay -->
              <div
                v-if="selectedStreakDescription"
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-md rounded-b-2xl p-4"
              >
                <p class="text-white text-sm leading-relaxed font-medium text-center drop-shadow-lg">{{ selectedStreakDescription }}</p>
              </div>
            </div>
          </div>
          
          <!-- Gaming-style timeline with compact streak records -->
          <div class="space-y-2">
            <div class="text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
              <span class="w-1 h-4 bg-gradient-to-b from-orange-400 to-red-400 rounded-full"></span>
              Recent {{ selectedStreakGroup.streak.streakCount }}-Kill Streak Records
            </div>
            
            <!-- Compact grid layout for maximum records on screen -->
            <div class="grid gap-2 max-h-96 overflow-y-auto custom-scrollbar">
              <div
                v-for="(streak, index) in selectedStreakGroup.allStreaks.sort((a, b) => new Date(b.streakStart).getTime() - new Date(a.streakStart).getTime()).slice(0, 12)"
                :key="index"
                class="group relative bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-orange-500/20 hover:to-red-500/20 rounded-lg border border-slate-600/50 hover:border-orange-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
                title="Click to view round report"
                @click="navigateToRoundReport(streak)"
              >
                <!-- Animated background effect on hover -->
                <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <!-- Timeline indicator dot -->
                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-red-400 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="relative z-10 p-3 pl-5 flex items-center justify-between">
                  <div class="flex flex-col gap-1 min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-slate-200 font-semibold text-sm truncate">{{ streak.mapName }}</span>
                    </div>
                    <div class="text-xs text-slate-400 flex items-center gap-2">
                      <span class="bg-slate-700/50 px-2 py-0.5 rounded-full font-medium">{{ formatRelativeTime(streak.streakStart) }}</span>
                      <span class="text-slate-500">•</span>
                      <span class="font-mono text-xs opacity-75">
                        {{ new Date(streak.streakStart.endsWith('Z') ? streak.streakStart : streak.streakStart + 'Z').toLocaleString() }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Performance indicator -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <div class="text-orange-400 opacity-75 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Show more indicator if there are additional records -->
              <div 
                v-if="selectedStreakGroup.allStreaks.length > 12"
                class="text-center py-3 text-slate-400 text-xs font-medium bg-slate-800/20 rounded-lg border border-slate-600/30 border-dashed"
              >
                + {{ selectedStreakGroup.allStreaks.length - 12 }} more record{{ selectedStreakGroup.allStreaks.length - 12 !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Teleport>

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
/* Custom animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Responsive adjustments for new grid system */
@media (max-width: 1536px) {
  .\\32 xl\\:grid-cols-10 {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .xl\\:grid-cols-8 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .lg\\:grid-cols-6 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .md\\:grid-cols-5 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  
  .text-3xl {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}

@media (max-width: 640px) {
  .sm\\:grid-cols-4 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  
  .gap-2 {
    gap: 0.25rem;
  }
}

@media (max-width: 480px) {
  .grid-cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Custom scrollbar styling for streak timeline */
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