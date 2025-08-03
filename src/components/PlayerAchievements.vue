<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { PlayerTimeStatistics } from '@/types/playerStatsTypes';
import { getBadgeDescription, isBadgeServiceInitialized } from '@/services/badgeService';

interface Achievement {
  playerName: string;
  achievementType: string;
  achievementId: string;
  achievementName: string;
  tier: string;
  value: number;
  achievedAt: string;
  processedAt: string;
  serverGuid: string;
  mapName: string;
  roundId: string;
  metadata: string;
}

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

interface BestStreaks {
  bestSingleRoundStreak: number;
  bestStreakMap: string;
  bestStreakServer: string;
  bestStreakDate: string;
  recentStreaks: Streak[];
}

interface NextMilestone {
  milestone: number;
  currentKills: number;
  progress: number;
  killsRemaining: number;
}

interface GamificationData {
  playerName: string;
  recentAchievements: Achievement[];
  allBadges: Achievement[];
  milestones: Achievement[];
  bestStreaks: BestStreaks;
  lastCalculated: string;
}

const props = defineProps<{
  playerName: string;
  playerStats?: PlayerTimeStatistics;
}>();

const router = useRouter();

const gamificationData = ref<GamificationData | null>(null);
const playerStats = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedAchievement = ref<Achievement | null>(null);
const showModal = ref(false);
const selectedStreakGroup = ref<{ streak: Streak, count: number, allStreaks: Streak[] } | null>(null);
const showStreakModal = ref(false);
const showNextMilestoneModal = ref(false);
const badgeServiceReady = ref(isBadgeServiceInitialized());

// Milestone constants
const MILESTONES = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];

const fetchGamificationData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`/stats/gamification/player/${encodeURIComponent(props.playerName)}`);
    if (!response.ok) throw new Error('Failed to fetch gamification data');
    gamificationData.value = await response.json();
  } catch (err: any) {
    console.error('Error fetching gamification data:', err);
    error.value = err.message || 'Failed to load achievements.';
  } finally {
    isLoading.value = false;
  }
};

const fetchPlayerStats = async () => {
  // If player stats are passed as a prop, use them instead of fetching
  if (props.playerStats) {
    playerStats.value = props.playerStats;
    return;
  }
  
  try {
    const response = await fetch(`/stats/players/${encodeURIComponent(props.playerName)}`);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    playerStats.value = await response.json();
  } catch (err: any) {
    console.error('Error fetching player stats:', err);
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

const getAchievementImage = (achievementId: string): string => {
  try {
    return new URL(`../assets/achievements/${achievementId}.png`, import.meta.url).href;
  } catch {
    return new URL('../assets/achievements/kill_streak_10.png', import.meta.url).href;
  }
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

// Calculate next milestone
const nextMilestone = computed((): NextMilestone | null => {
  if (!playerStats.value) return null;
  
  const currentKills = playerStats.value.totalKills;
  
  // Find the next milestone that is greater than current kills
  const nextMilestoneValue = MILESTONES.find(milestone => milestone > currentKills);
  
  if (!nextMilestoneValue) return null; // All milestones achieved or no next milestone
  
  // Calculate progress
  const prevMilestone = [...MILESTONES].reverse().find(m => m < nextMilestoneValue) || 0;
  const progress = (currentKills - prevMilestone) / (nextMilestoneValue - prevMilestone);
  const killsRemaining = nextMilestoneValue - currentKills;
  
  return {
    milestone: nextMilestoneValue,
    currentKills,
    progress: Math.max(0, Math.min(1, progress)),
    killsRemaining: Math.max(0, killsRemaining)
  };
});

const getMilestoneImage = (milestone: number): string => {
  try {
    return new URL(`../assets/achievements/total_kills_${milestone}.png`, import.meta.url).href;
  } catch {
    return new URL('../assets/achievements/kill_streak_10.png', import.meta.url).href;
  }
};

const groupedAchievements = computed(() => {
  if (!gamificationData.value) return {};
  
  const allAchievements = [
    ...gamificationData.value.milestones,
    ...gamificationData.value.allBadges,
    ...gamificationData.value.recentAchievements
  ];
  
  const grouped: { [key: string]: Achievement[] } = {};
  
  allAchievements.forEach(achievement => {
    const date = new Date(achievement.achievedAt.endsWith('Z') ? achievement.achievedAt : achievement.achievedAt + 'Z');
    const dateKey = date.toDateString();
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(achievement);
  });
  
  // Sort each day's achievements by time (newest first)
  Object.keys(grouped).forEach(dateKey => {
    grouped[dateKey].sort((a, b) => 
      new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
    );
  });
  
  return grouped;
});

const combinedStreaks = computed(() => {
  if (!gamificationData.value?.bestStreaks.recentStreaks) return [];
  
  const streakMap = new Map<number, { streak: Streak, count: number, allStreaks: Streak[] }>();
  
  gamificationData.value.bestStreaks.recentStreaks.forEach(streak => {
    const key = streak.streakCount;
    
    if (streakMap.has(key)) {
      const existing = streakMap.get(key)!;
      // Keep the most recent streak and add to allStreaks
      if (new Date(streak.streakStart).getTime() > new Date(existing.streak.streakStart).getTime()) {
        existing.streak = streak;
      }
      existing.count++;
      existing.allStreaks.push(streak);
    } else {
      streakMap.set(key, { streak, count: 1, allStreaks: [streak] });
    }
  });
  
  return Array.from(streakMap.values())
    .sort((a, b) => b.streak.streakCount - a.streak.streakCount)
    .slice(0, 6);
});

const sortedDateKeys = computed(() => {
  return Object.keys(groupedAchievements.value).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
});

const flattenedAchievements = computed(() => {
  if (!gamificationData.value) return [];
  
  // Show both milestones and all badges in the Achievement Timeline
  const allAchievements = [
    ...gamificationData.value.milestones,
    ...gamificationData.value.allBadges
  ];
  
  return allAchievements.sort((a, b) => 
    new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );
});

const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

const openAchievementModal = (achievement: Achievement) => {
  selectedAchievement.value = achievement;
  showModal.value = true;
};

const openNextMilestoneModal = () => {
  showNextMilestoneModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedAchievement.value = null;
};

// Timeline helper function
const getTimeGap = (currentStreak: Streak, nextStreak: Streak): string => {
  const current = new Date(currentStreak.streakStart.endsWith('Z') ? currentStreak.streakStart : currentStreak.streakStart + 'Z');
  const next = new Date(nextStreak.streakStart.endsWith('Z') ? nextStreak.streakStart : nextStreak.streakStart + 'Z');
  
  const diffMs = current.getTime() - next.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays >= 1) {
    return diffDays === 1 ? '1 day later' : `${diffDays} days later`;
  } else if (diffHours >= 2) {
    return `${diffHours} hours later`;
  }
  
  return ''; // Don't show gap for streaks close together
};

const closeNextMilestoneModal = () => {
  showNextMilestoneModal.value = false;
};

const openStreakModal = (streakGroup: { streak: Streak, count: number, allStreaks: Streak[] }) => {
  selectedStreakGroup.value = streakGroup;
  showStreakModal.value = true;
};

const openBestStreakModal = () => {
  if (!gamificationData.value?.bestStreaks) return;
  
  // Create a mock streak object for the best streak
  const bestStreak: Streak = {
    playerName: props.playerName,
    streakCount: gamificationData.value.bestStreaks.bestSingleRoundStreak,
    streakStart: gamificationData.value.bestStreaks.bestStreakDate,
    streakEnd: gamificationData.value.bestStreaks.bestStreakDate,
    serverGuid: gamificationData.value.bestStreaks.bestStreakServer || '',
    mapName: gamificationData.value.bestStreaks.bestStreakMap,
    roundId: '',
    isActive: false
  };
  
  selectedStreakGroup.value = {
    streak: bestStreak,
    count: 1,
    allStreaks: [bestStreak]
  };
  showStreakModal.value = true;
};

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

const closeStreakModal = () => {
  showStreakModal.value = false;
  selectedStreakGroup.value = null;
};

const getAchievementTooltip = (achievement: Achievement): string => {
  const description = getBadgeDescription(achievement.achievementId);
  const basicInfo = `${achievement.achievementName} - ${formatRelativeTime(achievement.achievedAt)}`;
  return description ? `${basicInfo}\n\n${description}` : basicInfo;
};

// Computed property to get the selected achievement's badge description reactively
const selectedAchievementDescription = computed(() => {
  if (!selectedAchievement.value || !badgeServiceReady.value) return null;
  return getBadgeDescription(selectedAchievement.value.achievementId);
});

onMounted(async () => {
  await Promise.all([
    fetchGamificationData(),
    fetchPlayerStats()
  ]);
  
  // Check if badge service is ready, and poll until it is
  const checkBadgeService = () => {
    if (isBadgeServiceInitialized()) {
      badgeServiceReady.value = true;
    } else {
      // Poll every 100ms until badge service is ready
      setTimeout(checkBadgeService, 100);
    }
  };
  
  if (!badgeServiceReady.value) {
    checkBadgeService();
  }
});
</script>

<template>
  <div class="player-achievements">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading achievements...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
    </div>
    
    <div v-else-if="gamificationData" class="achievements-content">
      <!-- Kill Streaks -->
      <div v-if="gamificationData.bestStreaks.bestSingleRoundStreak > 0 || gamificationData.bestStreaks.recentStreaks.length > 0" class="recent-streaks">
        <h4>Kill Streaks</h4>
        <div class="streaks-grid">
          <!-- Best Streak -->
          <div v-if="gamificationData.bestStreaks.bestSingleRoundStreak > 0" class="streak-card best-streak">
            <div class="streak-icon-container" @click="openBestStreakModal">
              <img 
                :src="getAchievementImage('kill_streak_' + gamificationData.bestStreaks.bestSingleRoundStreak)" 
                :alt="'Kill streak ' + gamificationData.bestStreaks.bestSingleRoundStreak"
                class="streak-card-icon"
                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
              />
              <div class="best-streak-badge">Best</div>
            </div>
            <div class="streak-meta">
              <div class="streak-map">{{ gamificationData.bestStreaks.bestStreakMap }}</div>
              <div class="streak-date">{{ formatRelativeTime(gamificationData.bestStreaks.bestStreakDate) }}</div>
            </div>
          </div>
          
          <!-- Recent Separator -->
          <div v-if="gamificationData.bestStreaks.bestSingleRoundStreak > 0 && gamificationData.bestStreaks.recentStreaks.length > 0" class="recent-separator">
            <div class="separator-line"></div>
            <span class="separator-text">Recent</span>
            <div class="separator-line"></div>
          </div>
          
          <!-- Recent Streaks -->
          <div 
            v-for="(item, index) in combinedStreaks" 
            :key="index"
            class="streak-card recent-streak"
          >
            <div class="streak-icon-container" @click="openStreakModal(item)">
              <img 
                :src="getAchievementImage('kill_streak_' + item.streak.streakCount)" 
                :alt="'Kill streak ' + item.streak.streakCount"
                class="streak-card-icon"
                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
              />
              <div v-if="item.count > 1" class="streak-count-badge">x{{ item.count }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Timeline -->
      <div v-if="nextMilestone || flattenedAchievements.length > 0" class="achievements-timeline">
        <h4>Achievement Timeline</h4>
        <div class="achievements-single-grid">
          <!-- Next Milestone (if available) -->
          <div 
            v-if="nextMilestone"
            class="achievement-compact-card next-milestone"
            :class="[`tier-legendary`]"
            :style="{ 
              boxShadow: getTierGlow('legendary'),
              '--progress-percentage': nextMilestone.progress * 100 + '%'
            }"
            @click="openNextMilestoneModal"
          >
            <div class="achievement-compact-icon-container">
              <img 
                :src="getMilestoneImage(nextMilestone.milestone)" 
                :alt="`${nextMilestone.milestone.toLocaleString()} Kills Milestone`"
                class="achievement-compact-icon milestone-icon"
              />
            </div>
            
            <div class="achievement-compact-info next-milestone-info">
              <div class="achievement-compact-time next-milestone-label">
                Next: {{ nextMilestone.milestone.toLocaleString() }} Kills
              </div>
              <div class="achievement-compact-location next-milestone-progress">
                {{ Math.floor(nextMilestone.progress * 100) }}% ({{ nextMilestone.killsRemaining.toLocaleString() }} to go)
              </div>
            </div>
          </div>
          
          <!-- Regular Achievements -->
          <div 
            v-for="(achievement, index) in flattenedAchievements" 
            :key="`achievement-${index}`"
            class="achievement-compact-card"
            :class="[`tier-${achievement.tier.toLowerCase()}`, achievement.achievementType]"
            :style="{ boxShadow: getTierGlow(achievement.tier) }"
            :title="getAchievementTooltip(achievement)"
            @click="openAchievementModal(achievement)"
          >
            <div class="achievement-compact-icon-container">
              <img 
                :src="getAchievementImage(achievement.achievementId)" 
                :alt="achievement.achievementName"
                class="achievement-compact-icon"
                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
              />
            </div>
            
            <div class="achievement-compact-info">
              <div class="achievement-compact-time">{{ formatRelativeTime(achievement.achievedAt) }}</div>
              <div v-if="achievement.mapName" class="achievement-compact-location">
                {{ achievement.mapName }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Achievements State -->
      <div v-if="flattenedAchievements.length === 0 && !gamificationData.bestStreaks.bestSingleRoundStreak && !nextMilestone" class="no-achievements">
        <div class="no-achievements-icon">🏆</div>
        <h4>No Achievements Yet</h4>
        <p>Start playing to unlock achievements and build your legacy!</p>
      </div>
    </div>

    <!-- Streak Details Modal -->
    <div v-if="showStreakModal && selectedStreakGroup" class="modal-overlay" @click="closeStreakModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="achievement-title-info">
            <h3 class="modal-achievement-name">{{ selectedStreakGroup.streak.streakCount }} Kill Streak</h3>
            <div class="modal-achievement-date">
              <span class="date-label">Achieved {{ selectedStreakGroup.count }} time{{ selectedStreakGroup.count !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          <button class="close-button" @click="closeStreakModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="modal-achievement-image-container">
            <img 
              :src="getAchievementImage('kill_streak_' + selectedStreakGroup.streak.streakCount)" 
              :alt="selectedStreakGroup.streak.streakCount + ' Kill Streak'"
              class="modal-achievement-image"
            />
          </div>
          
          <div class="timeline-container">
            <template v-for="(streak, index) in selectedStreakGroup.allStreaks.sort((a, b) => new Date(b.streakStart).getTime() - new Date(a.streakStart).getTime())" :key="index">
              <!-- Streak timeline item -->
              <div class="timeline-item">
                <!-- Timeline node -->
                <div class="timeline-node-container">
                  <div class="timeline-node streak-node"></div>
                </div>
                
                <!-- Streak card -->
                <div class="streak-card" @click="navigateToRoundReport(streak)" title="View round report">
                  <div class="streak-line-1">
                    <span class="streak-time-text">{{ formatRelativeTime(streak.streakStart) }}</span>
                    <span class="streak-separator">-</span>
                    <div class="streak-map-container">
                      <span class="streak-map">{{ streak.mapName }}</span>
                      <span class="streak-detail-time">
                        {{ new Date(streak.streakStart.endsWith('Z') ? streak.streakStart : streak.streakStart + 'Z').toLocaleString() }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Time gap as a separate timeline item -->
              <div 
                v-if="index < selectedStreakGroup.allStreaks.length - 1 && getTimeGap(streak, selectedStreakGroup.allStreaks[index + 1])" 
                class="timeline-gap-item"
              >
                <div class="time-gap-separator">
                  <div class="time-gap-line"></div>
                  <div class="time-gap-badge">
                    {{ getTimeGap(streak, selectedStreakGroup.allStreaks[index + 1]) }}
                  </div>
                  <div class="time-gap-line"></div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Achievement Details Modal -->
    <div v-if="showModal && selectedAchievement" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="achievement-title-info">
            <h3 class="modal-achievement-name">{{ selectedAchievement.achievementName }}</h3>
            <div class="modal-achievement-date">
              <span class="date-label">Achieved:</span>
              {{ new Date(selectedAchievement.achievedAt.endsWith('Z') ? selectedAchievement.achievedAt : selectedAchievement.achievedAt + 'Z').toLocaleString() }}
              <span class="relative-time">({{ formatRelativeTime(selectedAchievement.achievedAt) }})</span>
            </div>
          </div>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="modal-achievement-image-container">
            <img 
              :src="getAchievementImage(selectedAchievement.achievementId)" 
              :alt="selectedAchievement.achievementName"
              class="modal-achievement-image"
            />
          </div>

          <!-- Badge Description -->
          <div v-if="selectedAchievementDescription" class="achievement-description">
            <h4>Description</h4>
            <p>{{ selectedAchievementDescription }}</p>
          </div>
          
          <div class="achievement-details-grid">
            <div v-if="selectedAchievement.mapName" class="detail-item">
              <span class="detail-label">Map:</span>
              <span class="detail-value">{{ selectedAchievement.mapName }}</span>
            </div>
            
            <div v-if="selectedAchievement.serverGuid" class="detail-item">
              <span class="detail-label">Server ID:</span>
              <span class="detail-value">{{ selectedAchievement.serverGuid }}</span>
            </div>
            
            <div v-if="selectedAchievement.roundId" class="detail-item">
              <span class="detail-label">Round ID:</span>
              <span class="detail-value">{{ selectedAchievement.roundId }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Next Milestone Modal -->
    <div v-if="showNextMilestoneModal && nextMilestone" class="modal-overlay" @click="closeNextMilestoneModal">
      <div 
        class="modal-content milestone-modal" 
        :style="{ '--progress-percentage': nextMilestone.progress * 100 + '%' }"
        @click.stop
      >
        <div class="modal-header">
          <div class="achievement-title-info">
            <h3 class="modal-achievement-name">Next Milestone: {{ nextMilestone.milestone.toLocaleString() }} Kills</h3>
            <div class="modal-achievement-date">
              <span class="date-label">Current Progress:</span>
              {{ nextMilestone.currentKills.toLocaleString() }} / {{ nextMilestone.milestone.toLocaleString() }} kills
            </div>
          </div>
          <button class="close-button" @click="closeNextMilestoneModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="modal-achievement-image-container">
            <img 
              :src="getMilestoneImage(nextMilestone.milestone)" 
              :alt="`${nextMilestone.milestone.toLocaleString()} Kills Milestone`"
              class="modal-achievement-image milestone-icon-large"
            />
          </div>
          
          <div class="achievement-details-grid">
            <div class="detail-item full-width">
              <span class="detail-label">Progress:</span>
              <span class="detail-value">{{ Math.floor(nextMilestone.progress * 100) }}% complete</span>
            </div>
            
            <div class="detail-item full-width">
              <span class="detail-label">Kills Remaining:</span>
              <span class="detail-value">{{ nextMilestone.killsRemaining.toLocaleString() }} kills to go</span>
            </div>
            
            <div class="detail-item full-width">
              <span class="detail-label">Current Total:</span>
              <span class="detail-value">{{ nextMilestone.currentKills.toLocaleString() }} kills</span>
            </div>
            
            <div class="detail-item full-width">
              <span class="detail-label">Target:</span>
              <span class="detail-value">{{ nextMilestone.milestone.toLocaleString() }} kills</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-achievements {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 16px;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #ff5252;
  font-weight: bold;
}

.achievements-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.best-streak-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #8B4513;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
  border: 2px solid var(--color-background);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.best-streak {
  border: 2px solid #FFD700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  background: linear-gradient(135deg, var(--color-background) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.recent-streak {
  background: transparent;
  border: none;
  padding: 8px;
}

.recent-streak:hover {
  border: none;
  box-shadow: none;
}

.recent-separator {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0 16px;
  min-width: 120px;
}

.separator-line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.separator-text {
  margin: 0 12px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-streaks h4 {
  margin: 0 0 16px 0;
  color: var(--color-heading);
  font-size: 1.1rem;
}

.streaks-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.streak-card {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 120px;
  flex-shrink: 0;
}

.streak-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.streak-icon-container:hover {
  transform: scale(1.05);
}

.streak-card-icon {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  object-fit: contain;
}

.streak-count-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #FF6B35, #FF9F1C);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid var(--color-background);
}

.streak-card:hover {
  border-color: #FF6B35;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
}

.streak-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #FF6B35;
  margin-bottom: 4px;
}

.streak-meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.streak-map {
  font-weight: 500;
  color: var(--color-text);
}

.achievements-timeline h4 {
  margin: 0 0 20px 0;
  color: var(--color-heading);
  font-size: 1.1rem;
}

.achievements-single-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-start;
  align-items: flex-start;
}

.achievement-compact-card {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 120px;
  min-width: 120px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.achievement-compact-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, var(--tier-color, transparent) 100%);
  opacity: 0.05;
  pointer-events: none;
}

.achievement-compact-card.tier-legendary {
  --tier-color: #FF6B35;
}

.achievement-compact-card.tier-epic {
  --tier-color: #9D4EDD;
}

.achievement-compact-card.tier-rare {
  --tier-color: #3A86FF;
}

.achievement-compact-card.tier-uncommon {
  --tier-color: #06FFA5;
}

.achievement-compact-card.tier-common {
  --tier-color: #8D99AE;
}

.achievement-compact-card:hover {
  border-color: var(--tier-color);
  cursor: pointer;
  transform: translateY(-2px);
}

.achievement-compact-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s ease;
}

.achievement-compact-icon-container:hover {
  transform: scale(1.05);
}

.achievement-compact-icon {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  object-fit: contain;
}

.achievement-compact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.achievement-compact-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.achievement-compact-location {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* Next Milestone Styles */
.next-milestone {
  border: 3px solid #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, var(--color-background) 50%, rgba(255, 215, 0, 0.05) 100%);
  position: relative;
  overflow: visible;
}

.next-milestone::before {
  content: '🎯';
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #FFD700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  z-index: 10;
}

.next-milestone::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  width: var(--progress-percentage);
  background: linear-gradient(90deg, #26C6DA, #FFD700);
  border-radius: 0 0 6px 6px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.milestone-icon {
  filter: grayscale(0.3) brightness(1.1);
}

.next-milestone-info {
  text-align: center;
}

.next-milestone-label {
  font-weight: 700;
  color: #FFD700;
  font-size: 0.8rem;
}

.next-milestone-progress {
  font-size: 0.7rem;
  color: var(--color-text);
  font-weight: 500;
}

.no-achievements {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
}

.no-achievements-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-achievements h4 {
  margin: 0 0 8px 0;
  color: var(--color-heading);
}

.no-achievements p {
  margin: 0;
  font-size: 0.9rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .player-achievements {
    padding: 12px;
  }
  
  .achievements-content {
    gap: 16px;
  }
  
  .streaks-grid {
    gap: 8px;
  }
  
  .streak-card {
    width: 100px;
  }
  
  .achievements-single-grid {
    gap: 8px;
  }
  
  .achievement-compact-card {
    width: 100px;
    padding: 12px;
    gap: 8px;
  }
  
  .achievement-compact-icon {
    width: 64px;
    height: 64px;
  }
  
  .achievement-compact-info {
    display: none;
  }
  
  .next-milestone .achievement-compact-info {
    display: flex;
  }
  
  .milestone-progress-border {
    width: 58px;
    height: 58px;
    top: -2px;
    left: -2px;
  }
}

@media (max-width: 480px) {
  .achievement-compact-card {
    width: 100px;
    padding: 12px;
    gap: 8px;
  }
  
  .achievement-compact-icon {
    width: 64px;
    height: 64px;
  }
  
  .achievement-compact-info {
    display: none;
  }
  
  .next-milestone .achievement-compact-info {
    display: flex;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: var(--color-background);
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 2px solid var(--color-border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
}

.achievement-title-info {
  flex: 1;
}

.modal-achievement-name {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.2;
}

.modal-achievement-date {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.date-label {
  font-weight: 500;
  color: var(--color-text);
  margin-right: 4px;
}

.relative-time {
  font-style: italic;
  opacity: 0.8;
  margin-left: 8px;
}

.modal-achievement-image-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  padding: 8px;
}

.modal-achievement-image {
  width: 180px;
  height: 240px;
  border-radius: 16px;
  object-fit: contain;
  background-color: var(--color-background-mute);
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: var(--color-background-mute);
  color: var(--color-text);
}

.modal-body {
  padding: 24px;
  overflow: visible;
}

.achievement-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.detail-value {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 400;
  word-break: break-word;
}

/* Achievement Description Styles */
.achievement-description {
  padding: 16px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid var(--color-primary);
}

.achievement-description h4 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.achievement-description p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text);
  line-height: 1.5;
}

/* Modal responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 16px;
  }
  
  .modal-achievement-image {
    width: 150px;
    height: 200px;
  }
  
  .modal-achievement-name {
    font-size: 1.2rem;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .achievement-details-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* Streak Details Modal Styles */
.streak-details-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.streak-detail-item {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
}

.streak-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.streak-detail-map {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.streak-detail-date {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.streak-detail-time {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-style: italic;
}

.round-report-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
}

.round-report-btn:hover {
  background: var(--color-primary-dark, var(--color-primary));
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Next Milestone Modal Styles */
.milestone-modal::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 6px;
  width: var(--progress-percentage);
  background: linear-gradient(90deg, #26C6DA, #FFD700);
  border-radius: 0 0 14px 14px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.milestone-icon-large {
  filter: grayscale(0.3) brightness(1.1);
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

/* Timeline Styles for Streak Modal - Only apply within modal context */
.modal-content .timeline-container {
  position: relative;
  padding: 0;
  margin: 12px 0;
}

.modal-content .timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.modal-content .timeline-item:last-child {
  margin-bottom: 0;
}

.modal-content .timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--color-border);
  z-index: 1;
}

.modal-content .timeline-node-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 12px;
  min-width: 16px;
  z-index: 2;
  align-self: flex-start;
  margin-top: 1.8em;
}

.modal-content .timeline-node {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--color-background);
  position: relative;
  z-index: 3;
  transition: all 0.2s ease;
  cursor: pointer;
}

.modal-content .timeline-node:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

.modal-content .streak-node {
  background-color: #FF9800;
  border-color: #E65100;
}

.modal-content .streak-card {
  flex: 1;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid transparent;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}

.modal-content .streak-card:hover {
  background-color: var(--color-background-soft);
  border-color: var(--color-border);
}

.modal-content .timeline-item:hover::before {
  background: var(--color-primary);
}

.modal-content .streak-line-1 {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 3px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.modal-content .streak-time-text {
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.9rem;
}

.modal-content .streak-separator {
  color: var(--color-text-muted);
  font-weight: normal;
  margin: 0 4px;
}

.modal-content .streak-map-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-content .streak-map {
  font-weight: 500;
  color: var(--color-text);
  margin-right: 4px;
  font-size: 0.9rem;
}

.modal-content .streak-detail-time {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-style: italic;
}

.modal-content .streak-line-2 {
  margin-bottom: 3px;
}

.modal-content .streak-line-3 {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: var(--color-text);
  justify-content: flex-start;
}

.modal-content .timeline-gap-item {
  position: relative;
  padding: 8px 0;
  margin-left: 28px;
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-start;
}

.modal-content .time-gap-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  min-width: 200px;
  max-width: 400px;
}

.modal-content .time-gap-line {
  flex: 1;
  height: 2px;
  min-width: 40px;
  max-width: 100px;
  background-image: repeating-linear-gradient(-45deg,
    var(--color-border) 0px,
    var(--color-border) 4px,
    transparent 4px,
    transparent 8px);
  background-size: 8px 2px;
}

.modal-content .time-gap-badge {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  font-style: italic;
  white-space: nowrap;
  z-index: 2;
}

/* Mobile responsive styles for timeline - Only apply within modal context */
@media (max-width: 768px) {
  .modal-content .timeline-container {
    margin: 8px 0;
  }
  
  .modal-content .timeline-item {
    margin-bottom: 12px;
  }
  
  .modal-content .timeline-item::before {
    left: 5px;
  }
  
  .modal-content .timeline-node-container {
    margin-right: 10px;
    min-width: 12px;
    margin-top: 1.5em;
  }
  
  .modal-content .timeline-node {
    width: 6px;
    height: 6px;
  }
  
  .modal-content .streak-card {
    padding: 4px 6px;
  }
  
  .modal-content .streak-line-1 .streak-time-link,
  .modal-content .streak-line-1 .streak-map {
    font-size: 0.85rem;
  }
  
  .modal-content .streak-detail-time {
    font-size: 0.8rem;
  }
  
  .modal-content .streak-line-3 {
    font-size: 0.8rem;
    gap: 6px;
  }
  
  .modal-content .timeline-gap-item {
    margin-left: 24px;
    padding: 6px 0;
    margin-bottom: 12px;
  }
  
  .modal-content .time-gap-separator {
    min-width: 160px;
    max-width: 300px;
  }
  
  .modal-content .time-gap-line {
    min-width: 30px;
    max-width: 80px;
    height: 1px;
  }
  
  .modal-content .time-gap-badge {
    font-size: 0.75rem;
    padding: 1px 6px;
  }
}
</style>