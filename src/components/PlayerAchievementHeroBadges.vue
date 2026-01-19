<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Achievement, PlayerAchievementGroup } from '@/types/playerStatsTypes';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';
import AchievementModal from './AchievementModal.vue';

const props = defineProps<{
  playerName: string;
  achievementGroups: PlayerAchievementGroup[];
}>();

const milestoneTypes = new Set(['milestone', 'round_placement']);
const selectedAchievement = ref<Achievement | null>(null);
const showModal = ref(false);
type BadgeKind = 'recent' | 'milestone';

const headerBadges = computed(() => {
  const latestGroups = [...props.achievementGroups]
    .sort((a, b) => new Date(b.latestAchievedAt).getTime() - new Date(a.latestAchievedAt).getTime())
    .slice(0, 5);

  const highestMilestoneGroup = props.achievementGroups
    .filter(group => milestoneTypes.has(group.achievementType.toLowerCase()))
    .sort((a, b) => b.latestValue - a.latestValue)[0];

  const recent = latestGroups.map(group => ({
    achievement: mapGroupToAchievement(group),
    kind: 'recent' as BadgeKind
  }));

  if (!highestMilestoneGroup) {
    return recent;
  }

  const milestoneAchievement = mapGroupToAchievement(highestMilestoneGroup);
  const duplicateIndex = recent.findIndex(item =>
    item.achievement.achievementId === milestoneAchievement.achievementId &&
    item.achievement.achievedAt === milestoneAchievement.achievedAt
  );

  if (duplicateIndex >= 0) {
    const updated = [...recent];
    updated[duplicateIndex] = { achievement: milestoneAchievement, kind: 'milestone' as BadgeKind };
    return updated;
  }

  return [...recent, { achievement: milestoneAchievement, kind: 'milestone' as BadgeKind }];
});

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
};

const mapGroupToAchievement = (group: PlayerAchievementGroup): Achievement => {
  return {
    playerName: props.playerName,
    achievementId: group.achievementId,
    achievementName: group.achievementName,
    achievementType: group.achievementType,
    tier: group.tier,
    value: group.latestValue,
    achievedAt: group.latestAchievedAt,
    processedAt: group.latestAchievedAt,
    serverGuid: '',
    mapName: '',
    roundId: '',
    metadata: '',
    game: group.game,
    version: group.latestAchievedAt
  };
};

const fetchLatestAchievement = async (achievementId: string): Promise<Achievement | null> => {
  try {
    const params = new URLSearchParams({
      playerName: props.playerName,
      achievementId,
      sortBy: 'AchievedAt',
      sortOrder: 'desc',
      page: '1',
      pageSize: '1'
    });
    const response = await fetch(`/stats/gamification/achievements?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.items?.[0] ?? null;
  } catch (err: unknown) {
    console.warn('Failed to fetch achievement details:', err);
    return null;
  }
};

const openAchievementModal = async (achievement: Achievement) => {
  const detailed = await fetchLatestAchievement(achievement.achievementId);
  selectedAchievement.value = detailed ?? achievement;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedAchievement.value = null;
};

</script>

<template>
  <div v-if="headerBadges.length > 0" class="flex items-center gap-2 flex-wrap">
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

  <AchievementModal
    :is-visible="showModal"
    :achievement="selectedAchievement"
    :player-name="playerName"
    @close="closeModal"
  />
</template>
