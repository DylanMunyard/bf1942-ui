<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

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
}>();

const gamificationData = ref<GamificationData | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

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

const groupedAchievements = computed(() => {
  if (!gamificationData.value) return {};
  
  const allAchievements = [
    ...gamificationData.value.milestones,
    ...gamificationData.value.allBadges
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

const sortedDateKeys = computed(() => {
  return Object.keys(groupedAchievements.value).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
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

onMounted(() => {
  fetchGamificationData();
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
      <!-- Best Streak Highlight -->
      <div v-if="gamificationData.bestStreaks.bestSingleRoundStreak > 0" class="best-streak-highlight">
        <div class="streak-icon">🔥</div>
        <div class="streak-info">
          <h4>Best Kill Streak</h4>
          <div class="streak-value">{{ gamificationData.bestStreaks.bestSingleRoundStreak }} kills</div>
          <div class="streak-details">
            <span class="streak-map">{{ gamificationData.bestStreaks.bestStreakMap }}</span>
            <span class="streak-date">{{ formatRelativeTime(gamificationData.bestStreaks.bestStreakDate) }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Streaks -->
      <div v-if="gamificationData.bestStreaks.recentStreaks.length > 0" class="recent-streaks">
        <h4>Recent Kill Streaks</h4>
        <div class="streaks-grid">
          <div 
            v-for="(streak, index) in gamificationData.bestStreaks.recentStreaks.slice(0, 6)" 
            :key="index"
            class="streak-card"
          >
            <div class="streak-count">{{ streak.streakCount }}</div>
            <div class="streak-meta">
              <div class="streak-map">{{ streak.mapName }}</div>
              <div class="streak-time">{{ formatRelativeTime(streak.streakStart) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Timeline -->
      <div v-if="sortedDateKeys.length > 0" class="achievements-timeline">
        <h4>Achievement Timeline</h4>
        <div class="timeline">
          <div v-for="dateKey in sortedDateKeys" :key="dateKey" class="timeline-day">
            <div class="date-header">
              <h5>{{ formatDateHeader(dateKey) }}</h5>
              <div class="achievement-count">{{ groupedAchievements[dateKey].length }} achievement{{ groupedAchievements[dateKey].length !== 1 ? 's' : '' }}</div>
            </div>
            
            <div class="achievements-grid">
              <div 
                v-for="(achievement, index) in groupedAchievements[dateKey]" 
                :key="index"
                class="achievement-card"
                :class="[`tier-${achievement.tier.toLowerCase()}`, achievement.achievementType]"
                :style="{ boxShadow: getTierGlow(achievement.tier) }"
              >
                <div class="achievement-image-container">
                  <img 
                    :src="getAchievementImage(achievement.achievementId)" 
                    :alt="achievement.achievementName"
                    class="achievement-image"
                    @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                  />
                </div>
                
                <div class="achievement-info">
                  <h6 class="achievement-name">{{ achievement.achievementName }}</h6>
                  <div class="achievement-meta">
                    <span class="achievement-type">{{ achievement.achievementType }}</span>
                    <span v-if="achievement.value" class="achievement-value">{{ achievement.value.toLocaleString() }}</span>
                  </div>
                  <div class="achievement-time">{{ formatRelativeTime(achievement.achievedAt) }}</div>
                  <div v-if="achievement.mapName" class="achievement-location">
                    on {{ achievement.mapName }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Achievements State -->
      <div v-if="sortedDateKeys.length === 0 && !gamificationData.bestStreaks.bestSingleRoundStreak" class="no-achievements">
        <div class="no-achievements-icon">🏆</div>
        <h4>No Achievements Yet</h4>
        <p>Start playing to unlock achievements and build your legacy!</p>
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

.best-streak-highlight {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #FF6B35, #FF9F1C);
  border-radius: 12px;
  padding: 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

.best-streak-highlight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="fire" patternUnits="userSpaceOnUse" width="20" height="20"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23fire)"/></svg>');
  opacity: 0.1;
}

.streak-icon {
  font-size: 3rem;
  z-index: 1;
}

.streak-info {
  z-index: 1;
}

.streak-info h4 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.streak-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.streak-details {
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.recent-streaks h4 {
  margin: 0 0 16px 0;
  color: var(--color-heading);
  font-size: 1.1rem;
}

.streaks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.streak-card {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
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

.timeline {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.timeline-day {
  position: relative;
}

.timeline-day:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -16px;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border);
}

.date-header h5 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-heading);
}

.achievement-count {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  padding: 4px 8px;
  border-radius: 12px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.achievement-card {
  display: flex;
  gap: 12px;
  background-color: var(--color-background);
  border-radius: 12px;
  padding: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.achievement-card::before {
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

.achievement-card.tier-legendary {
  --tier-color: #FF6B35;
}

.achievement-card.tier-epic {
  --tier-color: #9D4EDD;
}

.achievement-card.tier-rare {
  --tier-color: #3A86FF;
}

.achievement-card.tier-uncommon {
  --tier-color: #06FFA5;
}

.achievement-card.tier-common {
  --tier-color: #8D99AE;
}

.achievement-card:hover {
  transform: translateY(-2px);
  border-color: var(--tier-color);
}

.achievement-image-container {
  position: relative;
  flex-shrink: 0;
}

.achievement-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}


.achievement-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.achievement-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-heading);
  line-height: 1.2;
}

.achievement-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
}

.achievement-type {
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.achievement-value {
  background-color: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  color: var(--color-text);
}

.achievement-time {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.achievement-location {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
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
  
  .best-streak-highlight {
    padding: 16px;
    gap: 12px;
  }
  
  .streak-icon {
    font-size: 2rem;
  }
  
  .streak-value {
    font-size: 1.5rem;
  }
  
  .streak-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .streaks-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .achievement-card {
    padding: 12px;
  }
  
  .achievement-image {
    width: 48px;
    height: 48px;
  }
  
  .timeline {
    gap: 24px;
  }
  
  .date-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .achievement-card {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .achievement-image-container {
    align-self: center;
  }
}
</style>