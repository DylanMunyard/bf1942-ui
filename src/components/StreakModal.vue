<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getBadgeDescription, isBadgeServiceInitialized } from '@/services/badgeService';

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

const getAchievementImage = (achievementId: string): string => {
  try {
    return new URL(`../assets/achievements/${achievementId}.png`, import.meta.url).href;
  } catch {
    return new URL('../assets/achievements/kill_streak_10.png', import.meta.url).href;
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

const selectedStreakDescription = computed(() => {
  if (!props.streakGroup || !badgeServiceReady.value) return null;
  const streakCount = props.streakGroup.streak.streakCount;
  const achievementId = `kill_streak_${streakCount}`;
  return getBadgeDescription(achievementId);
});

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
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible && streakGroup"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-5"
      @click="emit('close')"
    >
      <div
        class="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        @click.stop
      >
        <div class="flex justify-between items-start p-6 border-b border-slate-700/50">
          <div class="flex-1">
            <h3 class="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
              {{ streakGroup.streak.streakCount }} Kill Streak
            </h3>
            <div class="text-slate-400">
              <span class="font-medium text-slate-300">Achieved {{ streakGroup.count }} time{{ streakGroup.count !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-white transition-colors duration-200 text-3xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50"
            @click="emit('close')"
          >
            &times;
          </button>
        </div>
        
        <div class="p-6">
          <div class="flex flex-col items-center mb-6">
            <div class="relative">
              <img 
                :src="getAchievementImage('kill_streak_' + streakGroup.streak.streakCount)" 
                :alt="streakGroup.streak.streakCount + ' Kill Streak'"
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
              Recent {{ streakGroup.streak.streakCount }}-Kill Streak Records
            </div>
            
            <!-- Compact grid layout for maximum records on screen -->
            <div class="grid gap-2 max-h-96 overflow-y-auto custom-scrollbar">
              <div
                v-for="(streak, index) in streakGroup.allStreaks.sort((a, b) => new Date(b.streakStart).getTime() - new Date(a.streakStart).getTime()).slice(0, 12)"
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
                v-if="streakGroup.allStreaks.length > 12"
                class="text-center py-3 text-slate-400 text-xs font-medium bg-slate-800/20 rounded-lg border border-slate-600/30 border-dashed"
              >
                + {{ streakGroup.allStreaks.length - 12 }} more record{{ streakGroup.allStreaks.length - 12 !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
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