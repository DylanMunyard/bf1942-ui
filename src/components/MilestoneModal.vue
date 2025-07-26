<template>
  <div v-if="isVisible" class="milestone-modal-overlay" @click="closeModal">
    <div class="milestone-modal" @click.stop>
      <div class="milestone-modal-header">
        <div class="milestone-modal-title">
          <img :src="milestoneImage" :alt="`${milestone?.toLocaleString()} Kills Badge`" class="milestone-modal-badge" />
          <h3>{{ milestone?.toLocaleString() }} Kills</h3>
        </div>
        <button class="milestone-modal-close" @click="closeModal">×</button>
      </div>
      
      <div class="milestone-modal-content">
        <div v-if="isAchieved" class="milestone-achieved">
          <div class="achievement-status">
            <span class="achievement-icon">🏆</span>
            <span class="achievement-text">Achieved!</span>
          </div>
          
          <div class="achievement-details">
            <div class="detail-item">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{{ formatAchievementDate(achievementData?.achievedDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Total Kills:</span>
              <span class="detail-value">{{ achievementData?.totalKillsAtMilestone?.toLocaleString() }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Time to Achieve:</span>
              <span class="detail-value">{{ achievementData?.daysToAchieve }} days</span>
            </div>
          </div>
          
          <!-- Comparison data for PlayerComparison.vue -->
          <div v-if="comparisonData" class="comparison-section">
            <h4>Comparison</h4>
            <div class="comparison-details">
              <div v-if="comparisonData.isFaster" class="comparison-result faster">
                <span class="comparison-icon">⚡</span>
                <span>Achieved faster than opponent!</span>
              </div>
              <div v-else-if="comparisonData.isSlower" class="comparison-result slower">
                <span class="comparison-icon">🐌</span>
                <span>Achieved slower than opponent</span>
              </div>
              <div v-else-if="comparisonData.hasBothAchieved" class="comparison-result tie">
                <span class="comparison-icon">🤝</span>
                <span>Same achievement time</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="isNext" class="milestone-next">
          <div class="progress-status">
            <span class="progress-icon">🎯</span>
            <span class="progress-text">Next Target</span>
          </div>
          
          <div class="progress-details">
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
              <span class="progress-percentage">{{ Math.floor(progressPercentage) }}%</span>
            </div>
            <div class="progress-info">
              <span>{{ currentKills?.toLocaleString() }} / {{ milestone?.toLocaleString() }} kills</span>
            </div>
          </div>
        </div>
        
        <div v-else class="milestone-locked">
          <div class="locked-status">
            <span class="locked-icon">🔒</span>
            <span class="locked-text">Locked</span>
          </div>
          <p class="locked-description">
            Achieve previous milestones to unlock this badge.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

const progressPercentage = computed(() => {
  if (!props.milestone || !props.currentKills) return 0;
  
  // Find the previous milestone to calculate progress from
  const MILESTONES = [5000, 10000, 20000, 40000, 50000, 75000, 100000];
  const currentIndex = MILESTONES.findIndex(m => m === props.milestone);
  const prevMilestone = currentIndex > 0 ? MILESTONES[currentIndex - 1] : 0;
  
  const progress = (props.currentKills - prevMilestone) / (props.milestone - prevMilestone);
  return Math.max(0, Math.min(100, progress * 100));
});

const closeModal = () => {
  emit('close');
};

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
</script>

<style scoped>
.milestone-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.milestone-modal {
  background: var(--color-background-soft);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
}

.milestone-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 16px 16px 0 0;
  color: white;
}

.milestone-modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.milestone-modal-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.milestone-modal-title h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.milestone-modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.milestone-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.milestone-modal-content {
  padding: 20px;
}

.milestone-achieved,
.milestone-next,
.milestone-locked {
  text-align: center;
}

.achievement-status,
.progress-status,
.locked-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.achievement-icon,
.progress-icon,
.locked-icon {
  font-size: 1.5rem;
}

.achievement-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #4CAF50;
}

.progress-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-primary);
}

.locked-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.achievement-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.detail-label {
  font-weight: 500;
  color: var(--color-text-muted);
}

.detail-value {
  font-weight: 600;
  color: var(--color-text);
}

.comparison-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.comparison-section h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: var(--color-heading);
  text-align: center;
}

.comparison-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
}

.comparison-result.faster {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.comparison-result.slower {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.comparison-result.tie {
  background: rgba(156, 39, 176, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(156, 39, 176, 0.3);
}

.comparison-icon {
  font-size: 1.2rem;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.3s ease;
}

.progress-percentage {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 0.9rem;
  min-width: 40px;
}

.progress-info {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.locked-description {
  margin: 8px 0 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .milestone-modal-overlay {
    background: rgba(0, 0, 0, 0.8);
  }
}
</style> 