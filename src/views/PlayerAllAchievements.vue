<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

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

interface PlayerAchievementLabel {
  achievementId: string;
  achievementType: string;
  tier: string;
  category: string;
  displayName: string;
}

interface PaginatedResponse {
  items: Achievement[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  playerInfo: any;
  playerAchievementLabels: PlayerAchievementLabel[];
}

const props = defineProps<{
  playerName: string;
}>();

const router = useRouter();
const route = useRoute();

const achievements = ref<Achievement[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedAchievement = ref<Achievement | null>(null);
const showModal = ref(false);
const selectedAchievementGroup = ref<{ achievement: Achievement, count: number, allAchievements: Achievement[] } | null>(null);
const showGroupModal = ref(false);

// Filter states
const selectedMapName = ref<string>('');
const selectedAchievementId = ref<string>('');
const achievementLabels = ref<PlayerAchievementLabel[]>([]);
const availableMaps = ref<string[]>([]);
const achievementDropdownOpen = ref(false);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(50);
const totalCount = ref(0);
const totalPages = ref(0);
const hasNextPage = ref(false);
const hasPreviousPage = ref(false);

const fetchAchievements = async (page: number = 1) => {
  isLoading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams({
      playerName: props.playerName,
      page: page.toString(),
      pageSize: pageSize.value.toString(),
      sortBy: 'AchievedAt',
      sortOrder: 'desc'
    });
    
    if (selectedMapName.value) params.append('mapName', selectedMapName.value);
    if (selectedAchievementId.value) params.append('achievementId', selectedAchievementId.value);
    
    const response = await fetch(`/stats/gamification/achievements?${params}`);
    if (!response.ok) throw new Error('Failed to fetch achievements');
    
    const data: PaginatedResponse = await response.json();
    achievements.value = data.items;
    
    // Update pagination info
    currentPage.value = data.page;
    totalCount.value = data.totalItems;
    totalPages.value = data.totalPages;
    hasNextPage.value = data.page < data.totalPages;
    hasPreviousPage.value = data.page > 1;
    
    // Update filter options if not already set or if no filters applied
    if (data.playerAchievementLabels) {
      achievementLabels.value = data.playerAchievementLabels;
    }
    
    // Extract unique map names from achievements if no filters applied
    if (!selectedMapName.value && !selectedAchievementId.value) {
      const maps = new Set<string>();
      data.items.forEach(achievement => {
        if (achievement.mapName) maps.add(achievement.mapName);
      });
      availableMaps.value = Array.from(maps).sort();
    }
  } catch (err: any) {
    console.error('Error fetching achievements:', err);
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
  const grouped: { [key: string]: Array<{ achievement: Achievement, count: number, allAchievements: Achievement[] }> } = {};
  
  achievements.value.forEach(achievement => {
    const date = new Date(achievement.achievedAt.endsWith('Z') ? achievement.achievedAt : achievement.achievedAt + 'Z');
    const dateKey = date.toDateString();
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    // Check if this achievement type already exists on this day
    const existingGroup = grouped[dateKey].find(group => 
      group.achievement.achievementId === achievement.achievementId
    );
    
    if (existingGroup) {
      existingGroup.count++;
      existingGroup.allAchievements.push(achievement);
      // Keep the most recent achievement as the display one
      if (new Date(achievement.achievedAt).getTime() > new Date(existingGroup.achievement.achievedAt).getTime()) {
        existingGroup.achievement = achievement;
      }
    } else {
      grouped[dateKey].push({
        achievement,
        count: 1,
        allAchievements: [achievement]
      });
    }
  });
  
  // Sort each day's achievement groups by time (newest first)
  Object.keys(grouped).forEach(dateKey => {
    grouped[dateKey].sort((a, b) => 
      new Date(b.achievement.achievedAt).getTime() - new Date(a.achievement.achievedAt).getTime()
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

const openAchievementModal = (achievement: Achievement) => {
  selectedAchievement.value = achievement;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedAchievement.value = null;
};

const openGroupModal = (group: { achievement: Achievement, count: number, allAchievements: Achievement[] }) => {
  selectedAchievementGroup.value = group;
  showGroupModal.value = true;
};

const closeGroupModal = () => {
  showGroupModal.value = false;
  selectedAchievementGroup.value = null;
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    fetchAchievements(page);
  }
};

const goBack = () => {
  router.push(`/players/${encodeURIComponent(props.playerName)}`);
};

// Filter functions
const clearFilters = () => {
  selectedMapName.value = '';
  selectedAchievementId.value = '';
  achievementDropdownOpen.value = false;
};

const selectAchievement = (achievementId: string) => {
  selectedAchievementId.value = achievementId;
  achievementDropdownOpen.value = false;
};

const getAchievementDisplayName = (achievementId: string): string => {
  const label = achievementLabels.value.find(l => l.achievementId === achievementId);
  return label?.displayName || achievementId;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.achievement-select-wrapper')) {
    achievementDropdownOpen.value = false;
  }
};

// Watch for filter changes
watch([selectedMapName, selectedAchievementId], () => {
  fetchAchievements(1); // Reset to first page when filters change
});

const getPaginationRange = () => {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];

  for (let i = Math.max(2, currentPage.value - delta); 
       i <= Math.min(totalPages.value - 1, currentPage.value + delta); 
       i++) {
    range.push(i);
  }

  if (currentPage.value - delta > 2) {
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage.value + delta < totalPages.value - 1) {
    rangeWithDots.push('...', totalPages.value);
  } else if (totalPages.value > 1) {
    rangeWithDots.push(totalPages.value);
  }

  return rangeWithDots;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchAchievements(1);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Watch for route changes to update playerName and refetch data
watch(
  () => route.params.playerName,
  (newName, oldName) => {
    if (newName !== oldName) {
      fetchAchievements(1);
    }
  }
);
</script>

<template>
  <div class="player-achievements-page">
    <div class="page-header">
      <button @click="goBack" class="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to {{ playerName }}
      </button>
      <div class="page-title">
        <h1>All Achievements</h1>
        <p class="page-subtitle">{{ playerName }}'s complete achievement history</p>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <h4>Filters</h4>
      <div class="filters-grid">
        <!-- Map Name Filter -->
        <div class="filter-group">
          <label for="map-filter" class="filter-label">Map:</label>
          <select 
            id="map-filter"
            v-model="selectedMapName" 
            class="filter-select"
          >
            <option value="">All Maps</option>
            <option 
              v-for="mapName in availableMaps" 
              :key="mapName" 
              :value="mapName"
            >
              {{ mapName }}
            </option>
          </select>
        </div>
        
        <!-- Achievement ID Filter -->
        <div class="filter-group">
          <label for="achievement-filter" class="filter-label">Achievement:</label>
          <div class="achievement-select-wrapper">
            <div 
              class="achievement-select-dropdown" 
              :class="{ open: achievementDropdownOpen }"
              @click="achievementDropdownOpen = !achievementDropdownOpen"
            >
              <div class="selected-achievement">
                <img 
                  v-if="selectedAchievementId"
                  :src="getAchievementImage(selectedAchievementId)" 
                  :alt="getAchievementDisplayName(selectedAchievementId)"
                  class="achievement-select-icon"
                  @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                />
                <span>{{ selectedAchievementId ? getAchievementDisplayName(selectedAchievementId) : 'All Achievements' }}</span>
                <span class="dropdown-arrow">▼</span>
              </div>
              <div v-if="achievementDropdownOpen" class="achievement-options">
                <div 
                  class="achievement-option" 
                  :class="{ selected: selectedAchievementId === '' }"
                  @click.stop="selectAchievement('')"
                >
                  <span>All Achievements</span>
                </div>
                <div 
                  v-for="label in achievementLabels" 
                  :key="label.achievementId"
                  class="achievement-option"
                  :class="{ selected: selectedAchievementId === label.achievementId }"
                  @click.stop="selectAchievement(label.achievementId)"
                >
                  <img 
                    :src="getAchievementImage(label.achievementId)" 
                    :alt="label.displayName"
                    class="achievement-option-icon"
                    @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                  />
                  <span>{{ label.displayName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Clear Filters Button -->
        <div class="filter-group">
          <button 
            @click="clearFilters" 
            class="clear-filters-btn"
            :disabled="!selectedMapName && !selectedAchievementId"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading achievements...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
    </div>
    
    <div v-else-if="achievements.length > 0" class="achievements-content">
      <!-- Pagination info -->
      <div class="pagination-info">
        <span>Showing {{ achievements.length }} of {{ totalCount }} achievements</span>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      </div>

      <!-- Achievement Timeline -->
      <div class="timeline-container">
        <template v-for="dateKey in sortedDateKeys" :key="dateKey">
          <!-- Date Header Timeline Item -->
          <div class="timeline-item date-header-item">
            <div class="timeline-node-container">
              <div class="timeline-node date-node"></div>
            </div>
            <div class="date-header-content">
              <h2>{{ formatDateHeader(dateKey) }}</h2>
              <div class="achievement-count">{{ groupedAchievements[dateKey].length }} achievement{{ groupedAchievements[dateKey].length !== 1 ? 's' : '' }}</div>
            </div>
          </div>
          
          <!-- Achievement Items -->
          <div 
            v-for="(group, index) in groupedAchievements[dateKey]" 
            :key="index"
            class="timeline-item achievement-item"
          >
            <div class="timeline-node-container">
              <div 
                class="timeline-node achievement-node"
                :class="`tier-${group.achievement.tier.toLowerCase()}`"
                :style="{ backgroundColor: getTierColor(group.achievement.tier) }"
              ></div>
            </div>
            
            <div class="achievement-timeline-content">
              <div 
                class="achievement-square"
                :class="[`tier-${group.achievement.tier.toLowerCase()}`, group.achievement.achievementType]"
                :style="{ boxShadow: getTierGlow(group.achievement.tier) }"
                @click="group.count > 1 ? openGroupModal(group) : openAchievementModal(group.achievement)"
                :title="`${group.achievement.achievementName} - ${formatRelativeTime(group.achievement.achievedAt)}`"
              >
                <div class="achievement-image-container">
                  <img 
                    :src="getAchievementImage(group.achievement.achievementId)" 
                    :alt="group.achievement.achievementName"
                    class="achievement-image"
                    @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                  />
                  <div v-if="group.count > 1" class="achievement-count-badge">{{ group.count }}</div>
                </div>
              </div>
              
              <div class="achievement-details">
                <div class="achievement-name">{{ group.achievement.achievementName }}</div>
                <div class="achievement-meta">
                  <span class="achievement-time">{{ formatRelativeTime(group.achievement.achievedAt) }}</span>
                  <span v-if="group.achievement.value" class="achievement-value">{{ group.achievement.value.toLocaleString() }}</span>
                </div>
                <div v-if="group.achievement.mapName && group.count === 1" class="achievement-location">
                  <span v-if="group.achievement.serverGuid && group.achievement.mapName && group.achievement.achievedAt">
                    on <router-link 
                      :to="{
                        path: '/servers/round-report',
                        query: {
                          serverGuid: group.achievement.serverGuid,
                          mapName: group.achievement.mapName,
                          startTime: group.achievement.achievedAt,
                          players: playerName
                        }
                      }"
                      class="map-link"
                    >
                      {{ group.achievement.mapName }}
                    </router-link>
                  </span>
                  <span v-else>
                    on {{ group.achievement.mapName }}
                  </span>
                </div>
                <div v-else-if="group.count > 1" class="achievement-location">
                  Click to see all {{ group.count }} achievements
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button 
          @click="goToPage(currentPage - 1)" 
          :disabled="!hasPreviousPage"
          class="pagination-button"
        >
          Previous
        </button>
        
        <div class="pagination-numbers">
          <template v-for="page in getPaginationRange()" :key="page">
            <button 
              v-if="typeof page === 'number'"
              @click="goToPage(page)"
              :class="['pagination-number', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
            <span v-else class="pagination-dots">{{ page }}</span>
          </template>
        </div>
        
        <button 
          @click="goToPage(currentPage + 1)" 
          :disabled="!hasNextPage"
          class="pagination-button"
        >
          Next
        </button>
      </div>
    </div>

    <!-- No Achievements State -->
    <div v-else class="no-achievements">
      <div class="no-achievements-icon">🏆</div>
      <h2>No Achievements Yet</h2>
      <p>Start playing to unlock achievements and build your legacy!</p>
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
          
          <div class="achievement-details-grid">
            <div v-if="selectedAchievement.mapName" class="detail-item">
              <span class="detail-label">Map:</span>
              <span class="detail-value">
                <router-link 
                  v-if="selectedAchievement.serverGuid && selectedAchievement.mapName && selectedAchievement.achievedAt"
                  :to="{
                    path: '/servers/round-report',
                    query: {
                      serverGuid: selectedAchievement.serverGuid,
                      mapName: selectedAchievement.mapName,
                      startTime: selectedAchievement.achievedAt,
                      players: playerName
                    }
                  }"
                  class="map-link"
                >
                  {{ selectedAchievement.mapName }}
                </router-link>
                <span v-else>{{ selectedAchievement.mapName }}</span>
              </span>
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

    <!-- Grouped Achievement Modal -->
    <div v-if="showGroupModal && selectedAchievementGroup" class="modal-overlay" @click="closeGroupModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="achievement-title-info">
            <h3 class="modal-achievement-name">{{ selectedAchievementGroup.achievement.achievementName }}</h3>
            <div class="modal-achievement-date">
              <span class="date-label">Achieved {{ selectedAchievementGroup.count }} time{{ selectedAchievementGroup.count !== 1 ? 's' : '' }}</span>
            </div>
          </div>
          <button class="close-button" @click="closeGroupModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="modal-achievement-image-container">
            <img 
              :src="getAchievementImage(selectedAchievementGroup.achievement.achievementId)" 
              :alt="selectedAchievementGroup.achievement.achievementName"
              class="modal-achievement-image"
            />
          </div>
          
          <div class="achievement-instances-list">
            <div 
              v-for="(achievement, index) in selectedAchievementGroup.allAchievements.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())" 
              :key="index" 
              class="achievement-instance-item"
            >
              <div class="achievement-instance-header">
                <span v-if="achievement.mapName" class="achievement-instance-map">{{ achievement.mapName }}</span>
                <span class="achievement-instance-date">{{ formatRelativeTime(achievement.achievedAt) }}</span>
              </div>
              <div class="achievement-instance-time">
                {{ new Date(achievement.achievedAt.endsWith('Z') ? achievement.achievedAt : achievement.achievedAt + 'Z').toLocaleString() }}
              </div>
              <div v-if="achievement.serverGuid && achievement.mapName && achievement.achievedAt">
                <router-link 
                  :to="{
                    path: '/servers/round-report',
                    query: {
                      serverGuid: achievement.serverGuid,
                      mapName: achievement.mapName,
                      startTime: achievement.achievedAt,
                      players: playerName
                    }
                  }"
                  class="round-report-btn"
                  title="View round report"
                >
                  📊 View Round
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-achievements-page {
  background-color: var(--color-background);
  min-height: 100vh;
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-background-mute);
  border-radius: 6px;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.back-button:hover {
  background-color: var(--color-primary);
  color: white;
}

.page-title h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--color-heading);
}

.page-subtitle {
  margin: 4px 0 0 0;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.loading-container, .error-container, .no-achievements {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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

/* Filters Section Styles */
.filters-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
  margin-bottom: 24px;
}

.filters-section h4 {
  margin: 0 0 16px 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-filters-btn {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark, var(--color-primary));
  transform: translateY(-1px);
}

.clear-filters-btn:disabled {
  background-color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Custom Achievement Dropdown Styles */
.achievement-select-wrapper {
  position: relative;
  width: 100%;
}

.achievement-select-dropdown {
  position: relative;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.achievement-select-dropdown:hover {
  border-color: var(--color-primary);
}

.achievement-select-dropdown.open {
  border-color: var(--color-primary);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.selected-achievement {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
}

.selected-achievement span:nth-child(2) {
  flex: 1;
  color: var(--color-text);
}

.dropdown-arrow {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  transform: rotate(0deg);
  transition: transform 0.2s ease;
}

.achievement-select-dropdown.open .dropdown-arrow {
  transform: rotate(180deg);
}

.achievement-select-icon {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  object-fit: contain;
}

.achievement-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-background);
  border: 1px solid var(--color-primary);
  border-top: none;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.achievement-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.achievement-option:hover {
  background-color: var(--color-background-soft);
}

.achievement-option.selected {
  background-color: var(--color-primary);
  color: white;
}

.achievement-option-icon {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  object-fit: contain;
  flex-shrink: 0;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  padding: 12px 16px;
  background-color: var(--color-background-soft);
  border-radius: 8px;
}

/* Timeline Styles */
.timeline-container {
  position: relative;
  padding: 0;
  margin: 12px 0;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--color-border);
  z-index: 1;
}

.timeline-item:last-child::before {
  height: 24px;
}

.timeline-node-container {
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

.timeline-node {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--color-background);
  position: relative;
  z-index: 3;
  transition: all 0.2s ease;
  cursor: pointer;
}

.timeline-node:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

.date-node {
  background-color: var(--color-primary);
  width: 12px;
  height: 12px;
  border: 3px solid var(--color-background);
}

.achievement-node {
  width: 8px;
  height: 8px;
  border: 2px solid var(--color-background);
}

/* Date Header Styles */
.date-header-item {
  margin-bottom: 24px;
}

.date-header-item .timeline-node-container {
  margin-top: 0.5em;
}

.date-header-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border);
}

.date-header-content h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.achievement-count {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background-color: var(--color-background);
  padding: 6px 12px;
  border-radius: 16px;
}

/* Achievement Timeline Content */
.achievement-item {
  margin-bottom: 12px;
}

.achievement-item .timeline-node-container {
  margin-top: 1em;
}

.achievement-timeline-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.achievement-square {
  position: relative;
  width: 60px;
  height: 60px;
  background-color: var(--color-background-soft);
  border-radius: 12px;
  padding: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.achievement-square::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, var(--tier-color, transparent) 100%);
  opacity: 0.1;
  pointer-events: none;
}

.achievement-square:hover {
  transform: translateY(-2px) scale(1.05);
  border-color: var(--tier-color);
  z-index: 10;
}

.achievement-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.achievement-count-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: linear-gradient(135deg, #FF6B35, #FF9F1C);
  color: white;
  font-size: 0.6rem;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 14px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-background);
  line-height: 1.2;
}

/* Remove old grid styles */
/* Replaced by new .achievements-grid above */

.achievement-card {
  display: flex;
  gap: 12px;
  background-color: var(--color-background-soft);
  border-radius: 12px;
  padding: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
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

.achievement-square .achievement-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: contain;
  max-width: 44px;
  max-height: 44px;
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

.achievement-details .achievement-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  line-height: 1.2;
}

.achievement-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  line-height: 1.2;
}

.achievement-details .achievement-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
}

.achievement-details .achievement-value {
  background-color: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  color: var(--color-text);
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

.achievement-details .achievement-time {
  color: var(--color-primary);
  font-weight: 500;
}

.achievement-time {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.achievement-details .achievement-location {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.achievement-location {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
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

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
}

.pagination-button {
  padding: 8px 16px;
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  gap: 4px;
}

.pagination-number {
  padding: 8px 12px;
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
}

.pagination-number:hover {
  background-color: var(--color-primary);
  color: white;
}

.pagination-number.active {
  background-color: var(--color-primary);
  color: white;
}

.pagination-dots {
  padding: 8px 4px;
  color: var(--color-text-muted);
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

.no-achievements h2 {
  margin: 0 0 8px 0;
  color: var(--color-heading);
}

.no-achievements p {
  margin: 0;
  font-size: 0.9rem;
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

/* Mobile Responsive */
@media (max-width: 768px) {
  .player-achievements-page {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .filter-group:last-child {
    justify-self: start;
  }
  
  .timeline-container {
    margin: 8px 0;
  }
  
  .timeline-item {
    margin-bottom: 12px;
  }
  
  .timeline-item::before {
    left: 5px;
  }
  
  .timeline-node-container {
    margin-right: 10px;
    min-width: 12px;
    margin-top: 1.5em;
  }
  
  .date-header-item .timeline-node-container {
    margin-top: 0.3em;
  }
  
  .achievement-item .timeline-node-container {
    margin-top: 0.8em;
  }
  
  .timeline-node {
    width: 6px;
    height: 6px;
  }
  
  .date-node {
    width: 8px;
    height: 8px;
    border: 2px solid var(--color-background);
  }
  
  .achievement-square {
    width: 48px;
    height: 48px;
    padding: 6px;
    border-radius: 8px;
  }
  
  .achievement-square .achievement-image {
    max-width: 36px;
    max-height: 36px;
  }
  
  .achievement-timeline-content {
    gap: 8px;
  }
  
  .date-header-content h2 {
    font-size: 1.2rem;
  }
  
  .achievement-details .achievement-name {
    font-size: 0.9rem;
  }
  
  .achievement-details .achievement-meta {
    font-size: 0.75rem;
  }
  
  .achievement-details .achievement-location {
    font-size: 0.7rem;
  }
  
  .achievement-card {
    padding: 12px;
  }
  
  .achievement-image {
    width: 48px;
    height: 48px;
  }
  
  .date-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .pagination-numbers {
    order: 2;
    width: 100%;
    justify-content: center;
  }
  
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

/* Grouped Achievement Modal Styles */
.achievement-instances-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-instance-item {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
}

.achievement-instance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.achievement-instance-map {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.achievement-instance-date {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.achievement-instance-time {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-style: italic;
  margin-bottom: 8px;
}

.round-report-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.round-report-btn:hover {
  background: var(--color-primary-dark, var(--color-primary));
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  color: white;
  text-decoration: none;
}

@media (max-width: 480px) {
  .achievement-square {
    width: 40px;
    height: 40px;
    padding: 4px;
    border-radius: 6px;
  }
  
  .achievement-square .achievement-image {
    max-width: 32px;
    max-height: 32px;
  }
  
  .achievement-count-badge {
    font-size: 0.5rem;
    padding: 1px 3px;
    min-width: 12px;
    top: -1px;
    right: -1px;
  }
  
  .achievement-timeline-content {
    gap: 6px;
  }
  
  .date-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .achievement-details .achievement-name {
    font-size: 0.85rem;
  }
  
  .achievement-details .achievement-meta {
    font-size: 0.7rem;
    gap: 6px;
  }
  
  .achievement-details .achievement-location {
    font-size: 0.65rem;
  }
}
</style>