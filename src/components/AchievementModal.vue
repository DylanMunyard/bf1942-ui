<template>
  <Teleport to="body">
    <div
      v-if="isVisible && achievement"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-5"
      @click="closeModal"
    >
      <div
        class="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        @click.stop
      >
        <!-- Header with achievement title -->
        <div class="flex justify-between items-start p-6 border-b border-slate-700/50">
          <div class="flex-1">
            <h3 class="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
              {{ achievement.achievementName }}
            </h3>
            <div class="text-slate-400 text-sm">
              <span class="font-medium text-slate-300 mr-1">Achieved:</span>
              {{ new Date(achievement.achievedAt.endsWith('Z') ? achievement.achievedAt : achievement.achievedAt + 'Z').toLocaleString() }}
              <span class="text-slate-500 italic ml-2">({{ formatRelativeTime(achievement.achievedAt) }})</span>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-white transition-colors duration-200 text-3xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50"
            @click="closeModal"
          >
            &times;
          </button>
        </div>
        
        <!-- Modal body -->
        <div class="p-6">
          <!-- Achievement image with description overlay -->
          <div class="flex flex-col items-center mb-6">
            <div class="relative">
              <img 
                :src="getAchievementImage(achievement.achievementId)" 
                :alt="achievement.achievementName"
                class="w-48 h-64 rounded-2xl object-contain bg-slate-800/50 border border-slate-700/50"
              />
              
              <!-- Badge Description Overlay -->
              <div
                v-if="badgeDescription"
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-md rounded-b-2xl p-4"
              >
                <p class="text-white text-sm leading-relaxed font-medium text-center drop-shadow-lg">{{ badgeDescription }}</p>
              </div>
            </div>
          </div>
          
          <!-- Achievement details -->
          <div v-if="achievement.mapName" class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 font-medium text-sm">Map:</span>
              <router-link 
                v-if="achievement.serverGuid && achievement.mapName && achievement.achievedAt && playerName"
                :to="{
                  path: '/servers/round-report',
                  query: {
                    serverGuid: achievement.serverGuid,
                    mapName: achievement.mapName,
                    startTime: achievement.achievedAt,
                    players: playerName
                  }
                }"
                class="text-yellow-400 hover:text-yellow-300 hover:underline transition-colors duration-200 font-medium"
              >
                {{ achievement.mapName }}
              </router-link>
              <span v-else class="text-slate-200 font-medium">{{ achievement.mapName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getBadgeDescription } from '@/services/badgeService';

interface Achievement {
  achievementId: string;
  achievementName: string;
  tier?: string;
  value?: number;
  achievedAt: string;
  mapName?: string;
  serverGuid?: string;
  roundId?: string;
}

interface Props {
  isVisible: boolean;
  achievement: Achievement | null;
  playerName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  playerName: undefined
});

const emit = defineEmits<{
  close: []
}>();

const closeModal = () => {
  emit('close');
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

const badgeDescription = computed(() => {
  if (!props.achievement) return null;
  return getBadgeDescription(props.achievement.achievementId);
});
</script>

<style scoped>
/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .sm\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .w-48 {
    width: 150px;
  }
  
  .h-64 {
    height: 200px;
  }
  
  .text-2xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
}
</style> 