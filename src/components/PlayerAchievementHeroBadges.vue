<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Achievement } from '@/types/playerStatsTypes';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';
import AchievementModal from './AchievementModal.vue';

const props = defineProps<{
  playerName: string;
}>();

const selectedAchievement = ref<Achievement | null>(null);
const showModal = ref(false);
const heroAchievements = ref<Achievement[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

type BadgeKind = 'recent' | 'milestone';

const headerBadges = computed(() => {
  if (heroAchievements.value.length === 0) {
    return [];
  }

  // Find the milestone (should be the first one if it exists)
  const milestone = heroAchievements.value.find(a =>
    a.achievementType?.toLowerCase() === 'milestone' &&
    a.achievementId?.startsWith('total_kills_')
  );

  // Get the other achievements
  const otherAchievements = heroAchievements.value
    .filter(a => a !== milestone)
    .slice(0, 5);

  const result = otherAchievements.map(achievement => ({
    achievement,
    kind: 'recent' as BadgeKind
  }));

  // Add milestone at the beginning if it exists
  if (milestone) {
    result.unshift({
      achievement: milestone,
      kind: 'milestone' as BadgeKind
    });
  }

  return result;
});

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
};

const fetchHeroAchievements = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`/stats/gamification/player/${encodeURIComponent(props.playerName)}/hero-achievements`);
    if (!response.ok) throw new Error('Failed to fetch hero achievements');
    heroAchievements.value = await response.json();
  } catch (err: unknown) {
    console.error('Error fetching hero achievements:', err);
    error.value = 'Failed to load achievements.';
    heroAchievements.value = [];
  } finally {
    isLoading.value = false;
  }
};

const openAchievementModal = (achievement: Achievement) => {
  selectedAchievement.value = achievement;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedAchievement.value = null;
};

onMounted(() => {
  fetchHeroAchievements();
});

</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center gap-2">
    <div
      v-for="n in 6"
      :key="n"
      class="w-9 h-9 bg-slate-900/40 rounded-none animate-pulse"
    />
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="text-xs text-red-400 opacity-60">
    Achievements unavailable
  </div>

  <!-- Achievement Badges -->
  <div v-else-if="headerBadges.length > 0" class="flex items-center gap-2 flex-wrap">
    <button
      v-for="item in headerBadges"
      :key="`${item.kind}-${item.achievement.achievementId}-${item.achievement.achievedAt}`"
      class="group relative w-9 h-9 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-200 flex items-center justify-center rounded-none"
      :class="item.kind === 'milestone' ? 'shadow-[0_0_8px_rgba(250,204,21,0.45)]' : ''"
      :title="item.achievement.achievementName"
      @click="openAchievementModal(item.achievement)"
    >
      <img
        :src="getAchievementImage(item.achievement.achievementId, item.achievement.tier)"
        :alt="item.achievement.achievementName"
        class="w-6 h-6 object-contain group-hover:scale-110 transition-transform duration-200"
      >
    </button>
  </div>

  <!-- No Achievements -->
  <div v-else class="text-xs text-slate-500 opacity-60">
    No achievements
  </div>

  <AchievementModal
    :is-visible="showModal"
    :achievement="selectedAchievement"
    :player-name="playerName"
    @close="closeModal"
  />
</template>
