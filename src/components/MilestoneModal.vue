<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from './BaseModal.vue';

interface Props {
  isVisible: boolean;
  milestone: number | null;
  milestoneImage: string;
  isAchieved: boolean;
  isNext: boolean;
  achievementData?: {
    achievedDate: string;
    totalKillsAtMilestone: number;
    daysToAchieve: number;
  } | null;
  comparisonData?: {
    isFaster: boolean;
    isSlower: boolean;
    hasBothAchieved: boolean;
  } | null;
  currentKills?: number;
}

const props = withDefaults(defineProps<Props>(), {
  achievementData: null,
  comparisonData: null,
  currentKills: 0
});

const emit = defineEmits<{
  close: []
}>();

const modalTitle = computed(() => props.milestone ? `${props.milestone.toLocaleString()} Kills` : '');

const modalSubtitle = computed(() => {
  if (props.isAchieved && props.achievementData) {
    return `${formatAchievementDate(props.achievementData.achievedDate)} - ${props.achievementData.daysToAchieve} days to achieve`;
  }
  if (props.isNext) {
    return `Next milestone - ${Math.floor(progressPercentage.value)}% complete`;
  }
  return 'Locked milestone';
});

const progressPercentage = computed(() => {
  if (!props.milestone || !props.currentKills) return 0;
  const MILESTONES = [5000, 10000, 20000, 40000, 50000, 75000, 100000];
  const currentIndex = MILESTONES.findIndex(m => m === props.milestone);
  const prevMilestone = currentIndex > 0 ? MILESTONES[currentIndex - 1] : 0;
  const progress = (props.currentKills - prevMilestone) / (props.milestone - prevMilestone);
  return Math.max(0, Math.min(100, progress * 100));
});

const formatAchievementDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const handleClose = () => emit('close');
</script>

<template>
  <BaseModal
    :model-value="isVisible"
    size="sm"
    content-class="overflow-hidden"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <template #header>
      <div class="flex flex-col gap-1">
        <h3 class="text-xl font-semibold text-white m-0">
          {{ modalTitle }}
        </h3>
        <p class="text-sm text-white/80 m-0">
          {{ modalSubtitle }}
        </p>
      </div>
    </template>

    <div class="text-center">
      <!-- Badge Display -->
      <div class="flex justify-center mb-5">
        <img
          :src="milestoneImage"
          :alt="`${milestone?.toLocaleString()} Kills Badge`"
          class="w-20 h-20 rounded-full border-3 border-purple-500 shadow-lg shadow-purple-500/30"
        >
      </div>

      <!-- Achieved State -->
      <div
        v-if="isAchieved"
        class="space-y-4"
      >
        <div class="flex items-center justify-center gap-2">
          <span class="text-2xl">🏆</span>
          <span class="text-lg font-semibold text-green-400">Achievement Unlocked!</span>
        </div>

        <div
          v-if="comparisonData"
          class="pt-4 border-t border-slate-700/50"
        >
          <h4 class="text-base text-white mb-3">
            Comparison
          </h4>
          <div
            v-if="comparisonData.isFaster"
            class="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400"
          >
            <span class="text-xl">⚡</span>
            <span>Achieved faster than opponent!</span>
          </div>
          <div
            v-else-if="comparisonData.isSlower"
            class="flex items-center justify-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400"
          >
            <span class="text-xl">🐌</span>
            <span>Achieved slower than opponent</span>
          </div>
          <div
            v-else-if="comparisonData.hasBothAchieved"
            class="flex items-center justify-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400"
          >
            <span class="text-xl">🤝</span>
            <span>Same achievement time</span>
          </div>
        </div>
      </div>

      <!-- Next Target State -->
      <div
        v-else-if="isNext"
        class="space-y-4"
      >
        <div class="flex items-center justify-center gap-2">
          <span class="text-2xl">🎯</span>
          <span class="text-lg font-semibold text-purple-400">Next Target</span>
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                :style="{ width: progressPercentage + '%' }"
              />
            </div>
            <span class="text-sm font-semibold text-purple-400 min-w-[40px]">{{ Math.floor(progressPercentage) }}%</span>
          </div>
          <p class="text-sm text-slate-400">
            {{ currentKills?.toLocaleString() }} / {{ milestone?.toLocaleString() }} kills
          </p>
        </div>
      </div>

      <!-- Locked State -->
      <div
        v-else
        class="space-y-3"
      >
        <div class="flex items-center justify-center gap-2">
          <span class="text-2xl">🔒</span>
          <span class="text-lg font-semibold text-slate-400">Locked</span>
        </div>
        <p class="text-sm text-slate-500">
          Achieve previous milestones to unlock this badge.
        </p>
      </div>
    </div>
  </BaseModal>
</template>
