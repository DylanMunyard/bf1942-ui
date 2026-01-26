<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getBadgeDescription, isBadgeServiceInitialized } from '@/services/badgeService';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';
import { formatRelativeTime } from '@/utils/timeUtils';
import BaseModal from './BaseModal.vue';

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

interface StreakGroup {
  streak: Streak;
  count: number;
  allStreaks: Streak[];
}

const props = defineProps<{
  isVisible: boolean;
  streakGroup: StreakGroup | null;
  playerName: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const badgeServiceReady = computed(() => isBadgeServiceInitialized());

const modalTitle = computed(() =>
  props.streakGroup ? `${props.streakGroup.streak.streakCount} Kill Streak` : ''
);

const modalSubtitle = computed(() =>
  props.streakGroup ? `Achieved ${props.streakGroup.count} time${props.streakGroup.count !== 1 ? 's' : ''}` : ''
);

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
};

const selectedStreakDescription = computed(() => {
  if (!props.streakGroup || !badgeServiceReady.value) return null;
  const streakCount = props.streakGroup.streak.streakCount;
  const achievementId = `kill_streak_${streakCount}`;
  return getBadgeDescription(achievementId);
});

const sortedStreaks = computed(() => {
  if (!props.streakGroup) return [];
  return [...props.streakGroup.allStreaks]
    .sort((a, b) => new Date(b.streakStart).getTime() - new Date(a.streakStart).getTime())
    .slice(0, 12);
});

const navigateToRoundReport = (streak: Streak) => {
  router.push({
    name: 'round-report',
    params: { roundId: streak.roundId },
    query: { players: props.playerName }
  });
};

const handleClose = () => emit('close');
</script>

<template>
  <BaseModal
    :model-value="isVisible && !!streakGroup"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    :z-index="9999"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <template #header>
      <h3 class="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
        {{ modalTitle }}
      </h3>
      <div class="text-slate-400">
        <span class="font-medium text-slate-300">{{ modalSubtitle }}</span>
      </div>
    </template>

    <div
      v-if="streakGroup"
      class="space-y-6"
    >
      <!-- Achievement Image -->
      <div class="flex flex-col items-center">
        <div class="relative">
          <img
            :src="getAchievementImage('kill_streak_' + streakGroup.streak.streakCount)"
            :alt="streakGroup.streak.streakCount + ' Kill Streak'"
            class="w-48 h-64 rounded-2xl object-contain bg-slate-800/50 border border-slate-700/50"
          >
          <div
            v-if="selectedStreakDescription"
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-md rounded-b-2xl p-4"
          >
            <p class="text-white text-sm leading-relaxed font-medium text-center drop-shadow-lg">
              {{ selectedStreakDescription }}
            </p>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="space-y-2">
        <div class="text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
          <span class="w-1 h-4 bg-gradient-to-b from-orange-400 to-red-400 rounded-full" />
          Recent {{ streakGroup.streak.streakCount }}-Kill Streak Records
        </div>

        <div class="grid gap-2 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="(streak, index) in sortedStreaks"
            :key="index"
            class="group relative bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-orange-500/20 hover:to-red-500/20 rounded-lg border border-slate-600/50 hover:border-orange-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
            title="Click to view round report"
            @click="navigateToRoundReport(streak)"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-red-400 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

            <div class="relative z-10 p-3 pl-5 flex items-center justify-between">
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <span class="text-slate-200 font-semibold text-sm truncate">{{ streak.mapName }}</span>
                <div class="text-xs text-slate-400 flex items-center gap-2">
                  <span class="bg-slate-700/50 px-2 py-0.5 rounded-full font-medium">{{ formatRelativeTime(streak.streakStart) }}</span>
                  <span class="text-slate-500">-</span>
                  <span class="font-mono text-xs opacity-75">
                    {{ new Date(streak.streakStart.endsWith('Z') ? streak.streakStart : streak.streakStart + 'Z').toLocaleString() }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <svg
                  class="w-4 h-4 text-orange-400 opacity-75 group-hover:opacity-100 transition-opacity"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            v-if="streakGroup.allStreaks.length > 12"
            class="text-center py-3 text-slate-400 text-xs font-medium bg-slate-800/20 rounded-lg border border-slate-600/30 border-dashed"
          >
            + {{ streakGroup.allStreaks.length - 12 }} more record{{ streakGroup.allStreaks.length - 12 !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
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
