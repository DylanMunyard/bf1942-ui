<script setup lang="ts">
import { formatRelativeTime } from '@/utils/timeUtils';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';

interface MilestoneAchievement {
  achievementId: string;
  achievementName: string;
  tier: string;
  value: number;
  achievedAt: string;
}

interface Props {
  player1Name: string;
  player2Name: string;
  player1Achievements?: MilestoneAchievement[];
  player2Achievements?: MilestoneAchievement[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'achievement-click': [achievement: MilestoneAchievement, playerNumber: 1 | 2];
}>();

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
};

const getTierGlow = (tier: string): string => {
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
  const color = getTierColor(tier);
  return `0 0 20px ${color}40, 0 0 40px ${color}20`;
};
</script>

<template>
  <div
    v-if="(player1Achievements && player1Achievements.length > 0) || (player2Achievements && player2Achievements.length > 0)"
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
        v-if="player1Achievements && player1Achievements.length > 0"
        class="space-y-6"
      >
        <div class="text-center">
          <div class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl">
            <h4 class="text-2xl font-bold text-cyan-400">
              {{ player1Name }}
            </h4>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div
            v-for="achievement in player1Achievements"
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
            @click="$emit('achievement-click', achievement, 1)"
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
        v-if="player2Achievements && player2Achievements.length > 0"
        class="space-y-6"
      >
        <div class="text-center">
          <div class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl">
            <h4 class="text-2xl font-bold text-orange-400">
              {{ player2Name }}
            </h4>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div
            v-for="achievement in player2Achievements"
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
            @click="$emit('achievement-click', achievement, 2)"
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
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
