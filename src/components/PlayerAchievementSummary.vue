<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import type { PlayerAchievementGroup } from '@/types/playerStatsTypes';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';

const props = defineProps<{
  playerName: string;
  achievementGroups?: PlayerAchievementGroup[];
  loading?: boolean;
  error?: string | null;
}>();

const groups = ref<PlayerAchievementGroup[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const milestoneTypes = new Set(['milestone']);

const isUsingExternalGroups = computed(() => Array.isArray(props.achievementGroups));

const displayGroups = computed(() => {
  return isUsingExternalGroups.value ? (props.achievementGroups ?? []) : groups.value;
});

const milestoneGroups = computed(() => {
  return displayGroups.value
    .filter(group => milestoneTypes.has(group.achievementType.toLowerCase()))
    .sort((a, b) => new Date(b.latestAchievedAt).getTime() - new Date(a.latestAchievedAt).getTime());
});

const otherGroups = computed(() => {
  return displayGroups.value
    .filter(group => !milestoneTypes.has(group.achievementType.toLowerCase()))
    .sort((a, b) => b.count - a.count || a.achievementName.localeCompare(b.achievementName));
});

const totalEarned = computed(() => {
  return displayGroups.value.reduce((sum, group) => sum + group.count, 0);
});

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
};

const getTierBorderClass = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'legend':
    case 'legendary':
      return 'border-orange-500/40 hover:border-orange-400/70';
    case 'gold':
      return 'border-yellow-500/40 hover:border-yellow-400/70';
    case 'silver':
      return 'border-blue-500/40 hover:border-blue-400/70';
    case 'bronze':
      return 'border-orange-600/40 hover:border-orange-500/70';
    default:
      return 'border-slate-600/40 hover:border-slate-500/70';
  }
};

const fetchAchievementGroups = async () => {
  if (isUsingExternalGroups.value) {
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(
      `/stats/gamification/player/${encodeURIComponent(props.playerName)}/achievement-groups`
    );
    if (!response.ok) throw new Error('Failed to fetch achievements');
    groups.value = await response.json();
  } catch (err: unknown) {
    console.error('Error fetching achievement groups:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load achievements.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAchievementGroups();
});

watch(
  () => props.playerName,
  (newName, oldName) => {
    if (newName && newName !== oldName) {
      fetchAchievementGroups();
    }
  }
);

watch(
  () => props.achievementGroups,
  (newGroups) => {
    if (Array.isArray(newGroups)) {
      groups.value = newGroups;
      isLoading.value = false;
      error.value = null;
    }
  },
  { immediate: true }
);

watch(
  () => props.loading,
  (newLoading) => {
    if (typeof newLoading === 'boolean') {
      isLoading.value = newLoading;
    }
  },
  { immediate: true }
);

watch(
  () => props.error,
  (newError) => {
    if (newError !== undefined) {
      error.value = newError ?? null;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="relative">
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-16 text-slate-400"
    >
      <div class="w-12 h-12 border-4 border-slate-600/30 border-t-yellow-400 rounded-full animate-spin mb-4" />
      <p class="text-lg font-medium">
        Loading achievements...
      </p>
      <p class="text-sm text-slate-500 mt-2">
        Counting battlefield honors
      </p>
    </div>

    <div
      v-else-if="error"
      class="bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 text-center"
    >
      <div class="text-5xl mb-4 opacity-60">
        ⚠️
      </div>
      <p class="text-red-400 text-lg font-semibold mb-4">
        {{ error }}
      </p>
      <button
        class="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
        @click="fetchAchievementGroups"
      >
        Try Again
      </button>
    </div>

    <div
      v-else-if="groups.length === 0"
      class="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-12 text-center"
    >
      <div class="text-6xl mb-4 opacity-40">
        🏆
      </div>
      <h3 class="text-2xl font-bold text-slate-400 mb-2">
        No Achievements Yet
      </h3>
      <p class="text-slate-500">
        This soldier hasn't unlocked achievements yet.
      </p>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <div class="flex flex-wrap items-center gap-3">
        <div class="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm text-slate-300">
          🎯 {{ totalEarned }} earned
        </div>
        <div class="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm text-slate-300">
          🏅 {{ groups.length }} unique types
        </div>
      </div>

      <div v-if="milestoneGroups.length > 0" class="space-y-3">
        <h4 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
          Milestones
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="milestone in milestoneGroups"
            :key="milestone.achievementId"
            class="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/70 backdrop-blur-sm rounded-xl border border-yellow-500/30 hover:border-yellow-400/60 transition-all duration-300 overflow-hidden"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div class="relative z-10 p-3 flex flex-col items-center text-center gap-2">
              <img
                :src="getAchievementImage(milestone.achievementId, milestone.tier)"
                :alt="milestone.achievementName"
                class="w-16 h-20 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
              >
              <div class="text-sm font-semibold text-slate-200 line-clamp-2">
                {{ milestone.achievementName }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h4 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Achievement Collection
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="achievement in otherGroups"
            :key="achievement.achievementId"
            class="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/70 backdrop-blur-sm rounded-xl border transition-all duration-300 overflow-hidden"
            :class="getTierBorderClass(achievement.tier)"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-slate-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div class="relative z-10 p-3 flex flex-col items-center text-center gap-2">
              <div class="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg border border-amber-400/60">
                ×{{ achievement.count }}
              </div>
              <img
                :src="getAchievementImage(achievement.achievementId, achievement.tier)"
                :alt="achievement.achievementName"
                class="w-14 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
              >
              <div class="text-sm font-semibold text-slate-200 line-clamp-2">
                {{ achievement.achievementName }}
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
