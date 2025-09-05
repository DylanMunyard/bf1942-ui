<template>
  <Teleport to="body">
    <div
      v-if="isVisible && achievement"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-5"
      @click="closeModal"
    >
      <div
        class="relative bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        @click.stop
      >
        <!-- Header with achievement title -->
        <div class="flex justify-between items-start p-6 border-b border-slate-700/50">
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-yellow-400 mb-2">
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
          <!-- Round Placement Achievement Layout -->
          <div v-if="isRoundPlacementAchievement && parsedMetadata" class="space-y-6">
            <!-- Hero Section with Placement Display -->
            <div class="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <!-- Animated background effects -->
              <div class="absolute inset-0 bg-gradient-to-br opacity-20" :class="getPlacementColor(achievement.value || 1)"></div>
              <div class="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-30" :class="`bg-gradient-to-br ${getPlacementColor(achievement.value || 1)}`"></div>
              
              <div class="relative z-10 p-8">
                <div class="flex flex-col lg:flex-row items-center gap-8">
                  <!-- Achievement Image -->
                  <div class="flex-shrink-0">
                    <img 
                      :src="getAchievementImage(achievement.achievementId, achievement.tier)" 
                      :alt="achievement.achievementName"
                      class="w-32 h-40 object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <!-- Placement Details -->
                  <div class="flex-1 text-center lg:text-left space-y-4">
                    <div class="space-y-3">
                      <div class="flex items-center justify-center lg:justify-start gap-3">
                        <div class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r" :class="getPlacementColor(achievement.value || 1)">
                          {{ achievement.value || 1 }}<span class="text-2xl">{{ getPlacementSuffix(achievement.value || 1) }}</span>
                        </div>
                        <span class="text-2xl font-bold text-white">Place</span>
                      </div>
                      
                      <!-- Map Info integrated -->
                      <div class="space-y-2">
                        <p class="text-lg text-slate-300 font-medium">
                          Achieved in a {{ parsedMetadata.Kills }}-kill performance!
                        </p>
                        <div v-if="achievement.mapName" class="flex items-center justify-center lg:justify-start gap-2 text-sm">
                          <span class="text-purple-400">🗺️</span>
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
                            class="text-slate-300 hover:text-purple-300 font-medium hover:underline transition-colors duration-200"
                          >
                            {{ achievement.mapName }}
                          </router-link>
                          <span v-else class="text-slate-300 font-medium">{{ achievement.mapName }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Performance Stats -->
                    <div class="flex items-center justify-center lg:justify-start gap-6">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-green-400">{{ parsedMetadata.Kills }}</div>
                        <div class="text-xs text-slate-400 uppercase tracking-wide">Kills</div>
                      </div>
                      <div class="w-px h-8 bg-slate-600"></div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-400">{{ parsedMetadata.Score }}</div>
                        <div class="text-xs text-slate-400 uppercase tracking-wide">Score</div>
                      </div>
                      <div class="w-px h-8 bg-slate-600"></div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-cyan-400">{{ parsedMetadata.TeamLabel }}</div>
                        <div class="text-xs text-slate-400 uppercase tracking-wide">Team</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Server Information -->
            <div class="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-4 rounded-xl border border-blue-500/20">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-sm">🖥️</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-slate-400 uppercase tracking-wide font-medium">Server</span>
                    <span class="text-blue-400 text-xs">•</span>
                    <span class="text-blue-400 text-xs">Where glory was earned</span>
                  </div>
                  <p class="text-slate-200 font-medium leading-tight break-words">{{ parsedMetadata.ServerName }}</p>
                </div>
              </div>
            </div>
            
            <!-- Additional Context (compact) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Team Details -->
              <div class="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 rounded-lg border border-cyan-500/20">
                <div class="flex items-center gap-2">
                  <span class="text-cyan-400 text-sm">⚔️</span>
                  <span class="text-xs text-slate-400 uppercase tracking-wide">Fighting for</span>
                  <span class="text-cyan-400 font-bold">{{ parsedMetadata.TeamLabel }}</span>
                </div>
              </div>
              
              <!-- Quick Stats -->
              <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-4 rounded-lg border border-green-500/20">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-green-400 text-sm">🎯</span>
                    <span class="text-xs text-slate-400 uppercase tracking-wide">K/D Ratio</span>
                  </div>
                  <span class="text-green-400 font-bold">{{ (parsedMetadata.Kills / Math.max(1, (parsedMetadata.Deaths || 1))).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Default Achievement Layout (for non-round-placement achievements) -->
          <div v-else class="space-y-6">
            <!-- Achievement image with description overlay -->
            <div class="flex flex-col items-center">
              <div class="relative">
                <img 
                  :src="getAchievementImage(achievement.achievementId, achievement.tier)" 
                  :alt="achievement.achievementName"
                  class="w-48 h-64 rounded-2xl object-contain bg-slate-800/50 border border-slate-700/50"
                />
                
                <!-- Badge Description Overlay -->
                <div
                  v-if="badgeDescription"
                  class="absolute bottom-0 left-0 right-0 bg-slate-900/70 backdrop-blur-sm rounded-b-2xl p-4"
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
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getBadgeDescription } from '@/services/badgeService';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';

interface Achievement {
  achievementId: string;
  achievementName: string;
  achievementType?: string;
  tier?: string;
  value?: number;
  achievedAt: string;
  mapName?: string;
  serverGuid?: string;
  roundId?: string;
  metadata?: string;
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

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
};

const badgeDescription = computed(() => {
  if (!props.achievement) return null;
  return getBadgeDescription(props.achievement.achievementId);
});

const parsedMetadata = computed(() => {
  if (!props.achievement?.metadata) return null;
  try {
    return JSON.parse(props.achievement.metadata);
  } catch {
    return null;
  }
});

const isRoundPlacementAchievement = computed(() => {
  return props.achievement?.achievementType === 'round_placement' || 
         props.achievement?.achievementId?.startsWith('round_placement_');
});

const getPlacementSuffix = (place: number): string => {
  if (place === 1) return 'st';
  if (place === 2) return 'nd';
  if (place === 3) return 'rd';
  return 'th';
};

const getPlacementColor = (place: number): string => {
  if (place === 1) return 'from-yellow-400 to-amber-500';
  if (place === 2) return 'from-gray-300 to-slate-400';
  if (place === 3) return 'from-orange-400 to-amber-600';
  return 'from-purple-400 to-indigo-500';
};
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