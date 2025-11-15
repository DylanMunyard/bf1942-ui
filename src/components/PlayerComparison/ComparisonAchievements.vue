<script setup lang="ts">
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';

// Interface for milestone achievements
interface MilestoneAchievement {
  achievementId: string;
  achievementName: string;
  tier: string;
  value: number;
  achievedAt: string;
}

interface ComparisonData {
  player1: string;
  player2: string;
  player1MilestoneAchievements?: MilestoneAchievement[];
  player2MilestoneAchievements?: MilestoneAchievement[];
}

interface AchievementClickEvent {
  achievement: MilestoneAchievement;
  playerNumber: 1 | 2;
  playerName: string;
}

const props = defineProps<{
  comparisonData: ComparisonData;
}>();

const emit = defineEmits<{
  'show-achievement': [event: AchievementClickEvent];
}>();

const handleAchievementClick = (achievement: MilestoneAchievement, playerNumber: 1 | 2) => {
  // Emit event to parent
  const playerName = playerNumber === 1 ? props.comparisonData.player1 : props.comparisonData.player2;
  emit('show-achievement', {
    achievement,
    playerNumber,
    playerName
  });
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
</script>

<template>
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
            @click="handleAchievementClick(achievement, 1)"
          >
            <div class="text-center space-y-3">
              <div class="mx-auto w-16 h-16 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img
                  :src="getAchievementImage(achievement.achievementId, achievement.tier)"
                  :alt="achievement.achievementName"
                  class="w-full h-full object-contain"
                  @error="(e: Event) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
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
            @click="handleAchievementClick(achievement, 2)"
          >
            <div class="text-center space-y-3">
              <div class="mx-auto w-16 h-16 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img
                  :src="getAchievementImage(achievement.achievementId, achievement.tier)"
                  :alt="achievement.achievementName"
                  class="w-full h-full object-contain"
                  @error="(e: Event) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
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
