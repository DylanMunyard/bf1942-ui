<template>
  <Teleport to="body">
    <div
      v-if="isVisible && achievement"
      class="modal-overlay"
      @click="closeModal"
    >
      <div
      class="modal-content"
      @click.stop
    >
      <div class="modal-header">
        <div class="achievement-title-info">
          <h3 class="modal-achievement-name">
            {{ achievement.achievementName }}
          </h3>
          <div class="modal-achievement-date">
            <span class="date-label">Achieved:</span>
            {{ new Date(achievement.achievedAt.endsWith('Z') ? achievement.achievedAt : achievement.achievedAt + 'Z').toLocaleString() }}
            <span class="relative-time">({{ formatRelativeTime(achievement.achievedAt) }})</span>
          </div>
        </div>
        <button
          class="close-button"
          @click="closeModal"
        >
          &times;
        </button>
      </div>
      
      <div class="modal-body">
        <div class="modal-achievement-image-container">
          <img 
            :src="getAchievementImage(achievement.achievementId)" 
            :alt="achievement.achievementName"
            class="modal-achievement-image"
          >
        </div>

        <!-- Badge Description -->
        <div
          v-if="badgeDescription"
          class="achievement-description"
        >
          <h4>Description</h4>
          <p>{{ badgeDescription }}</p>
        </div>
        
        <div class="achievement-details-grid">
          <div
            v-if="achievement.mapName"
            class="detail-item"
          >
            <span class="detail-label">Map:</span>
            <span class="detail-value">
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
                class="map-link"
              >
                {{ achievement.mapName }}
              </router-link>
              <span v-else>{{ achievement.mapName }}</span>
            </span>
          </div>
          
          <div
            v-if="achievement.serverGuid"
            class="detail-item"
          >
            <span class="detail-label">Server ID:</span>
            <span class="detail-value">{{ achievement.serverGuid }}</span>
          </div>
          
          <div
            v-if="achievement.value"
            class="detail-item"
          >
            <span class="detail-label">Value:</span>
            <span class="detail-value">{{ achievement.value.toLocaleString() }}</span>
          </div>

          <div
            v-if="playerName"
            class="detail-item"
          >
            <span class="detail-label">Player:</span>
            <span class="detail-value">{{ playerName }}</span>
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
  z-index: 9999;
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

.map-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.map-link:hover {
  opacity: 0.8;
  text-decoration: underline;
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
</style> 