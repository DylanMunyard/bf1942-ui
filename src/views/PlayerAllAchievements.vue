<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getBadgeDescription } from '@/services/badgeService';
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';
import { formatRelativeTime } from '@/utils/timeUtils';
import AchievementModal from '../components/AchievementModal.vue';
import StreakModal from '../components/StreakModal.vue';
import HeroBackButton from '../components/HeroBackButton.vue';

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
const selectedStreakGroup = ref<{ streak: any, count: number, allStreaks: any[] } | null>(null);
const showStreakModal = ref(false);

// Template refs
const dropdownTrigger = ref<HTMLElement | null>(null);

// Dropdown positioning
const dropdownStyle = computed(() => {
  if (!dropdownTrigger.value || !achievementDropdownOpen.value) {
    return { display: 'none' };
  }
  
  const rect = dropdownTrigger.value.getBoundingClientRect();
  return {
    top: rect.bottom + window.scrollY + 4 + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px'
  };
});

// Filter states
const selectedMapName = ref<string>('');
const selectedAchievementId = ref<string>('');
const achievementLabels = ref<PlayerAchievementLabel[]>([]);
const availableMaps = ref<string[]>([]);
const achievementDropdownOpen = ref(false);

// Mobile filters state
const showFilters = ref(false);

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
    
    // Update filter options from API response
    if (data.playerAchievementLabels && data.playerAchievementLabels.length > 0) {
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

const getAchievementImage = (achievementId: string, tier?: string): string => {
  return getAchievementImageFromObject({ achievementId, tier });
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
  // Check if this is a streak achievement
  if (group.achievement.achievementId.startsWith('kill_streak_')) {
    // Convert achievements to streak format
    const streaks = group.allAchievements.map(achievement => ({
      playerName: achievement.playerName,
      streakCount: parseInt(achievement.achievementId.replace('kill_streak_', '')),
      streakStart: achievement.achievedAt,
      streakEnd: achievement.achievedAt,
      serverGuid: achievement.serverGuid,
      mapName: achievement.mapName,
      roundId: achievement.roundId,
      isActive: false
    }));
    
    selectedStreakGroup.value = {
      streak: streaks[0],
      count: group.count,
      allStreaks: streaks
    };
    showStreakModal.value = true;
  } else {
    selectedAchievementGroup.value = group;
    showGroupModal.value = true;
  }
};

const closeGroupModal = () => {
  showGroupModal.value = false;
  selectedAchievementGroup.value = null;
};

const closeStreakModal = () => {
  showStreakModal.value = false;
  selectedStreakGroup.value = null;
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    updateQueryParams();
    fetchAchievements(page);
  }
};


// Filter functions
const clearFilters = () => {
  selectedMapName.value = '';
  selectedAchievementId.value = '';
  achievementDropdownOpen.value = false;
  currentPage.value = 1; // Reset to first page when clearing filters
  updateQueryParams();
};

const selectAchievement = (achievementId: string) => {
  selectedAchievementId.value = achievementId;
  achievementDropdownOpen.value = false;
};

const getAchievementDisplayName = (achievementId: string): string => {
  const label = achievementLabels.value.find(l => l.achievementId === achievementId);
  return label?.displayName || achievementId;
};

const getAchievementTooltip = (achievement: Achievement): string => {
  const description = getBadgeDescription(achievement.achievementId);
  const basicInfo = `${achievement.achievementName} - ${formatRelativeTime(achievement.achievedAt)}`;
  return description ? `${basicInfo}\n\n${description}` : basicInfo;
};

// Computed property to check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(selectedMapName.value || selectedAchievementId.value);
});


// Timeline helper function
const getTimeGap = (currentAchievement: Achievement, nextAchievement: Achievement): string => {
  const current = new Date(currentAchievement.achievedAt.endsWith('Z') ? currentAchievement.achievedAt : currentAchievement.achievedAt + 'Z');
  const next = new Date(nextAchievement.achievedAt.endsWith('Z') ? nextAchievement.achievedAt : nextAchievement.achievedAt + 'Z');
  
  const diffMs = current.getTime() - next.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays >= 1) {
    return diffDays === 1 ? '1 day later' : `${diffDays} days later`;
  } else if (diffHours >= 2) {
    return `${diffHours} hours later`;
  }
  
  return ''; // Don't show gap for achievements close together
};

// Function to navigate to round report
const navigateToRoundReport = (achievement: Achievement) => {
  if (achievement.roundId) {
    router.push({
      name: 'round-report',
      params: {
        roundId: achievement.roundId
      },
      query: {
        players: props.playerName
      }
    });
  }
};

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.achievement-select-wrapper')) {
    achievementDropdownOpen.value = false;
  }
};

// Initialize state from URL query parameters
const initializeFromQuery = () => {
  const query = route.query;
  
  // Set filters from query params
  if (query.map && typeof query.map === 'string') {
    selectedMapName.value = query.map;
  }
  if (query.achievement && typeof query.achievement === 'string') {
    selectedAchievementId.value = query.achievement;
  }
  
  // Set pagination from query params
  if (query.page && typeof query.page === 'string') {
    const pageNum = parseInt(query.page);
    if (!isNaN(pageNum) && pageNum > 0) {
      currentPage.value = pageNum;
    }
  }
  if (query.pageSize && typeof query.pageSize === 'string') {
    const size = parseInt(query.pageSize);
    if (!isNaN(size) && [25, 50, 100].includes(size)) {
      pageSize.value = size;
    }
  }
};

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string> = {};
  
  // Add filters to query
  if (selectedMapName.value) query.map = selectedMapName.value;
  if (selectedAchievementId.value) query.achievement = selectedAchievementId.value;
  
  // Add pagination to query
  if (currentPage.value !== 1) query.page = currentPage.value.toString();
  if (pageSize.value !== 50) query.pageSize = pageSize.value.toString();
  
  // Update URL without triggering navigation
  router.replace({ query });
};

// Watch for filter changes
watch([selectedMapName, selectedAchievementId], () => {
  currentPage.value = 1; // Reset to first page when filters change
  updateQueryParams();
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
  initializeFromQuery();
  fetchAchievements(currentPage.value);
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

// Helper methods for tier styling - updated to match API tier names
const getTierBorderClass = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'legend': 
    case 'legendary': return 'hover:border-orange-500/50'
    case 'gold': return 'hover:border-yellow-500/50'
    case 'silver': return 'hover:border-blue-500/50'
    case 'bronze': return 'hover:border-orange-600/50'
    default: return 'hover:border-neutral-500/50'
  }
}

const getTierGlowClass = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'legend':
    case 'legendary': return 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
    case 'gold': return 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
    case 'silver': return 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
    case 'bronze': return 'bg-gradient-to-br from-orange-600/20 to-orange-700/20'
    default: return 'bg-gradient-to-br from-neutral-500/20 to-neutral-600/20'
  }
}

const getTierDotClass = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'legend':
    case 'legendary': return 'bg-gradient-to-r from-orange-400 to-red-500'
    case 'gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500'
    case 'silver': return 'bg-gradient-to-r from-blue-400 to-cyan-500'
    case 'bronze': return 'bg-gradient-to-r from-orange-500 to-orange-600'
    default: return 'bg-gradient-to-r from-neutral-400 to-neutral-500'
  }
}
</script>

<template>
  <div class="portal-page">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
    <!-- Hero Section -->
    <div class="w-full rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] mb-6">
      <div class="w-full max-w-screen-2xl mx-auto px-0 sm:px-8 lg:px-12">
        <div class="px-4 sm:px-0">
          <HeroBackButton :fallback-route="`/players/${encodeURIComponent(playerName)}`" />
        </div>
        <div class="py-6 sm:py-8 px-4 sm:px-0">
          <div class="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <!-- Achievement Trophy Avatar -->
            <div class="flex-shrink-0">
              <div class="relative">
                <div class="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-1">
                  <div class="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center">
                    <div class="w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl lg:text-3xl font-bold text-neutral-900">
                      🏆
                    </div>
                  </div>
                </div>
                <!-- Achievement Status indicator -->
                <div class="absolute -bottom-2 -right-2">
                  <div class="w-6 h-6 lg:w-8 lg:h-8 bg-amber-500 rounded-full border-4 border-neutral-950 animate-pulse" />
                </div>
              </div>
            </div>

            <!-- Achievement Info -->
            <div class="flex-grow">
              <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 mb-4">
                {{ playerName }}'s Hall of Fame
              </h1>
              <p class="text-neutral-300 text-lg mb-6">
                Complete achievement history and legendary moments
              </p>

              <!-- Stats Summary -->
              <div
                v-if="!isLoading && achievements.length > 0"
                class="flex flex-wrap gap-4"
              >
                <div class="px-4 py-2 bg-neutral-700/50 backdrop-blur-sm rounded-full text-sm text-neutral-300 border border-neutral-600/50">
                  🎯 {{ totalCount }} Total Achievements
                </div>
                <div
                  v-if="achievementLabels.length > 0"
                  class="px-4 py-2 bg-neutral-700/50 backdrop-blur-sm rounded-full text-sm text-neutral-300 border border-neutral-600/50"
                >
                  🏅 {{ achievementLabels.length }} Unique Types
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-3">
              <button
                :disabled="isLoading"
                class="group bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:from-neutral-600 disabled:to-neutral-500 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 disabled:hover:scale-100 disabled:shadow-none flex items-center gap-2"
                @click="fetchAchievements(currentPage)"
              >
                <svg
                  v-if="!isLoading"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="group-hover:rotate-180 transition-transform duration-300"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                <div
                  v-else
                  class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                />
                <span class="font-semibold">{{ isLoading ? 'Loading...' : 'Refresh Data' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="min-h-screen bg-neutral-950">
      <div class="relative py-6 sm:py-8">
        <div class="w-full max-w-screen-2xl mx-auto px-2 sm:px-8 lg:px-12">
          <div
            v-if="(!isLoading && achievements.length > 0) || (isLoading && achievements.length > 0)"
            class="bg-neutral-950 rounded-lg border border-neutral-700 p-6"
          >
            <div class="space-y-4 sm:space-y-8">
              <!-- Filter Controls -->
              <div class="mb-6">
                <button
                  class="lg:hidden group bg-neutral-800/50 hover:bg-neutral-700/70 backdrop-blur-sm border border-neutral-700/50 hover:border-cyan-500/50 rounded-xl px-6 py-3 w-full transition-all duration-300 flex items-center justify-center gap-3"
                  @click="showFilters = !showFilters"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-amber-400"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span class="text-amber-400 font-medium">Achievement Filters</span>
                  <span
                    v-if="hasActiveFilters"
                    class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-neutral-400 transition-transform duration-300"
                    :class="{ 'rotate-180': showFilters }"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <!-- Filter Panel -->
                <div
                  class="mt-4 transition-all duration-300 ease-in-out"
                  :class="showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 lg:max-h-96 lg:opacity-100'"
                >
                  <div class="bg-neutral-800/70 backdrop-blur-sm rounded-lg border border-neutral-700 p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div class="space-y-2">
                        <label
                          for="mapFilter"
                          class="block text-sm font-medium text-neutral-300"
                        >🗺️ Battlefield</label>
                        <select
                          id="mapFilter"
                          v-model="selectedMapName"
                          class="w-full px-4 py-3 bg-neutral-800 border border-neutral-600/50 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">
                            All Maps
                          </option>
                          <option
                            v-for="mapName in availableMaps"
                            :key="mapName"
                            :value="mapName"
                          >
                            {{ mapName }}
                          </option>
                        </select>
                      </div>
                    
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">🏆 Achievement Type</label>
                        <div
                          class="relative achievement-select-wrapper"
                          style="z-index: 100000; transform: translateZ(0);"
                        >
                          <div
                            ref="dropdownTrigger"
                            class="w-full px-4 py-3 bg-neutral-800 border border-neutral-600/50 rounded-lg text-white cursor-pointer transition-all duration-200 hover:border-amber-400/50 focus:ring-2 focus:ring-amber-400 focus:border-transparent flex items-center justify-between"
                            @click="achievementDropdownOpen = !achievementDropdownOpen"
                          >
                            <div class="flex items-center gap-2">
                              <img 
                                v-if="selectedAchievementId"
                                :src="getAchievementImage(selectedAchievementId)" 
                                :alt="getAchievementDisplayName(selectedAchievementId)"
                                class="w-5 h-5 rounded object-contain"
                                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                              >
                              <span class="text-sm">{{ selectedAchievementId ? getAchievementDisplayName(selectedAchievementId) : 'All Achievements' }}</span>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              class="text-neutral-400 transition-transform duration-200"
                              :class="{ 'rotate-180': achievementDropdownOpen }"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">📊 Showing</label>
                        <div class="text-sm text-neutral-400 px-4 py-3 bg-neutral-800/50 rounded-lg border border-neutral-600/50">
                          {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }}
                        </div>
                      </div>
                    
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">Actions</label>
                        <button
                          :disabled="!hasActiveFilters"
                          class="w-full px-4 py-3 bg-neutral-700/50 hover:bg-neutral-600/70 disabled:bg-neutral-800/50 border border-neutral-600/50 hover:border-neutral-500/70 disabled:border-neutral-700/50 text-neutral-300 hover:text-white disabled:text-neutral-500 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                          @click="clearFilters"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="opacity-70"
                          >
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                          </svg>
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
              <!-- Achievements Data Display -->
              <div
                v-if="achievements.length > 0"
                class="space-y-6"
              >
                <!-- Achievement Timeline -->
                <div class="space-y-8">
                  <template
                    v-for="dateKey in sortedDateKeys"
                    :key="dateKey"
                  >
                    <!-- Date Header -->
                    <div class="relative">
                      <div class="flex items-center gap-4 mb-6">
                        <div class="flex items-center gap-3">
                          <div class="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse" />
                          <h2 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                            {{ formatDateHeader(dateKey) }}
                          </h2>
                        </div>
                        <div class="px-3 py-1 bg-neutral-700/50 backdrop-blur-sm rounded-full text-sm text-neutral-400 border border-neutral-600/50">
                          {{ groupedAchievements[dateKey].length }} achievement{{ groupedAchievements[dateKey].length !== 1 ? 's' : '' }}
                        </div>
                        <div class="flex-1 h-px bg-gradient-to-r from-neutral-600/50 to-transparent" />
                      </div>

                      <!-- Achievement Cards Grid -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div
                          v-for="(group, index) in groupedAchievements[dateKey]"
                          :key="index"
                          class="group relative bg-gradient-to-br from-neutral-800/50 to-neutral-900/60 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-amber-500/30 overflow-hidden transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-xl"
                          :class="getTierBorderClass(group.achievement.tier)"
                          :title="getAchievementTooltip(group.achievement)"
                          @click="group.count > 1 ? openGroupModal(group) : openAchievementModal(group.achievement)"
                        >
                          <!-- Tier Glow Effect -->
                          <div
                            class="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                            :class="getTierGlowClass(group.achievement.tier)"
                          />
                        
                          <!-- Achievement Image -->
                          <div class="relative p-4 flex justify-center">
                            <div class="relative">
                              <img 
                                :src="getAchievementImage(group.achievement.achievementId, group.achievement.tier)" 
                                :alt="group.achievement.achievementName"
                                class="w-16 h-16 object-contain rounded-lg group-hover:scale-110 transition-transform duration-300"
                                @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                              >
                              <!-- Count Badge -->
                              <div
                                v-if="group.count > 1"
                                class="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                              >
                                {{ group.count }}
                              </div>
                              <!-- Tier Indicator -->
                              <div
                                class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full"
                                :class="getTierDotClass(group.achievement.tier)"
                              />
                            </div>
                          </div>
                        
                          <!-- Achievement Details -->
                          <div class="px-4 pb-4 space-y-2">
                            <h3 class="font-semibold text-white text-sm line-clamp-2 group-hover:text-amber-200 transition-colors duration-300">
                              {{ group.achievement.achievementName }}
                            </h3>
                          
                            <!-- Meta Info -->
                            <div class="flex items-center justify-between text-xs">
                              <span class="text-amber-400 font-medium">{{ formatRelativeTime(group.achievement.achievedAt) }}</span>
                              <span
                                v-if="group.achievement.value"
                                class="px-2 py-1 bg-neutral-700/50 text-neutral-300 rounded font-mono"
                              >{{ group.achievement.value.toLocaleString() }}</span>
                            </div>

                            <!-- Location Info -->
                            <div
                              v-if="group.achievement.mapName && group.count === 1"
                              class="text-xs text-neutral-400 truncate"
                            >
                              <span v-if="group.achievement.roundId">
                                📍 <router-link 
                                  :to="{
                                    name: 'round-report',
                                    params: {
                                      roundId: group.achievement.roundId
                                    },
                                    query: {
                                      players: playerName
                                    }
                                  }"
                                  class="text-amber-400 hover:text-amber-300 transition-colors"
                                  @click.stop
                                >
                                  {{ group.achievement.mapName }}
                                </router-link>
                              </span>
                              <span v-else>📍 {{ group.achievement.mapName }}</span>
                            </div>
                            <div
                              v-else-if="group.count > 1"
                              class="text-xs text-neutral-500 italic"
                            >
                              Click to see all {{ group.count }} achievements
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Pagination Controls -->
                <div
                  v-if="totalPages > 1"
                  class="bg-neutral-800/30 backdrop-blur-sm rounded-lg border border-neutral-700/50 p-4"
                >
                  <div class="flex items-center justify-between gap-4">
                    <!-- Pagination Info -->
                    <div class="text-neutral-400 text-sm">
                      Page {{ currentPage }} of {{ totalPages }}
                    </div>

                    <!-- Pagination Buttons -->
                    <div class="flex items-center gap-1">
                      <button
                        :disabled="currentPage === 1"
                        class="p-1.5 rounded bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                        title="First"
                        @click="goToPage(1)"
                      >
                        ⟨⟨
                      </button>
                    
                      <button
                        :disabled="!hasPreviousPage"
                        class="p-1.5 rounded bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                        title="Previous"
                        @click="goToPage(currentPage - 1)"
                      >
                        ⟨
                      </button>
                    
                      <!-- Page Numbers -->
                      <div class="hidden sm:flex items-center gap-1 mx-2">
                        <template
                          v-for="page in getPaginationRange()"
                          :key="page"
                        >
                          <button
                            v-if="typeof page === 'number'"
                            class="px-2 py-1 rounded text-xs transition-all"
                            :class="page === currentPage
                              ? 'bg-amber-600 text-white'
                              : 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/70'"
                            @click="goToPage(page)"
                          >
                            {{ page }}
                          </button>
                          <span
                            v-else
                            class="px-1 py-1 text-neutral-500 text-xs"
                          >{{ page }}</span>
                        </template>
                      </div>

                      <!-- Current Page (Mobile) -->
                      <div class="sm:hidden px-2 py-1 bg-amber-600 text-white rounded text-xs mx-2">
                        {{ currentPage }}
                      </div>

                      <button
                        :disabled="!hasNextPage"
                        class="p-1.5 rounded bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                        title="Next"
                        @click="goToPage(currentPage + 1)"
                      >
                        ⟩
                      </button>
                    
                      <button
                        :disabled="currentPage === totalPages"
                        class="p-1.5 rounded bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs" 
                        title="Last"
                        @click="goToPage(totalPages)"
                      >
                        ⟩⟩
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          <!-- Loading State -->
          <div
            v-else-if="isLoading && achievements.length === 0"
            class="bg-neutral-950 rounded-lg border border-neutral-700 p-6"
          >
            <div class="flex flex-col items-center justify-center py-20 text-neutral-400">
              <div class="w-12 h-12 border-4 border-neutral-600 border-t-amber-400 rounded-full animate-spin mb-4" />
              <p class="text-lg">
                🏆 Loading achievement hall...
              </p>
              <p class="text-sm text-neutral-500 mt-2">
                Scanning legendary moments
              </p>
            </div>
          </div>

          <!-- Error State -->
          <div
            v-else-if="error"
            class="bg-neutral-950 rounded-lg border border-neutral-700 p-6"
          >
            <div class="bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 text-center">
              <div class="text-6xl mb-4">
                ⚠️
              </div>
              <p class="text-red-400 text-lg font-semibold">
                {{ error }}
              </p>
              <button
                class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                @click="fetchAchievements(currentPage)"
              >
                Try Again
              </button>
            </div>
          </div>
        
          <!-- No Achievements State -->
          <div
            v-else
            class="bg-neutral-950 rounded-lg border border-neutral-700 p-6"
          >
            <div class="bg-neutral-800/50 backdrop-blur-lg rounded-2xl border border-neutral-700/50 p-12 text-center">
              <div class="text-6xl mb-4 opacity-50">
                🏆
              </div>
              <h3 class="text-2xl font-bold text-neutral-400 mb-2">
                No Achievements Found
              </h3>
              <p class="text-neutral-500 mb-6">
                This soldier hasn't unlocked any achievements yet, or they're still being processed.
              </p>
              <button
                class="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-amber-500/25 font-medium"
                @click="fetchAchievements(currentPage)"
              >
                🔄 Refresh Achievements
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Modal -->
      <AchievementModal
        :is-visible="showModal"
        :achievement="selectedAchievement"
        :player-name="playerName"
        @close="closeModal"
      />

      <!-- Streak Modal -->
      <StreakModal
        :is-visible="showStreakModal"
        :streak-group="selectedStreakGroup"
        :player-name="playerName"
        @close="closeStreakModal"
      />

      <!-- Grouped Achievement Modal -->
      <div
        v-if="showGroupModal && selectedAchievementGroup"
        class="modal-mobile-safe fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="closeGroupModal"
      >
        <div
          class="relative bg-neutral-800/90 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          @click.stop
        >
          <!-- Header with achievement title -->
          <div class="flex justify-between items-start p-6 border-b border-neutral-700/50">
            <div class="flex-1">
              <h3 class="text-2xl font-bold text-yellow-400 mb-2">
                {{ selectedAchievementGroup.achievement.achievementName }}
              </h3>
              <div class="text-neutral-400 text-sm">
                <span class="font-medium text-neutral-300 mr-1">Achieved:</span>
                {{ selectedAchievementGroup.count }} time{{ selectedAchievementGroup.count !== 1 ? 's' : '' }}
                <span class="text-neutral-500 italic ml-2">(Multiple instances)</span>
              </div>
            </div>
            <button
              class="text-neutral-400 hover:text-white transition-colors duration-200 text-3xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700/50"
              @click="closeGroupModal"
            >
              &times;
            </button>
          </div>
        
          <!-- Modal body -->
          <div class="p-6">
            <!-- Achievement Hero Section -->
            <div class="space-y-6">
              <!-- Achievement image with description overlay -->
              <div class="flex flex-col items-center">
                <div class="relative">
                  <img
                    :src="getAchievementImage(selectedAchievementGroup.achievement.achievementId, selectedAchievementGroup.achievement.tier)"
                    :alt="selectedAchievementGroup.achievement.achievementName"
                    class="w-48 h-64 rounded-2xl object-contain bg-neutral-800/50 border border-neutral-700/50"
                  >

                  <!-- Badge Description Overlay -->
                  <div
                    v-if="getBadgeDescription(selectedAchievementGroup.achievement.achievementId)"
                    class="absolute bottom-0 left-0 right-0 bg-neutral-900/70 backdrop-blur-sm rounded-b-2xl p-4"
                  >
                    <p class="text-white text-sm leading-relaxed font-medium text-center drop-shadow-lg">
                      {{ getBadgeDescription(selectedAchievementGroup.achievement.achievementId) }}
                    </p>
                  </div>
                </div>
              </div>
            
              <!-- Achievement Timeline -->
              <div class="space-y-4">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse" />
                  <h4 class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                    Achievement History
                  </h4>
                  <div class="px-3 py-1 bg-neutral-700/50 backdrop-blur-sm rounded-full text-sm text-neutral-400 border border-neutral-600/50">
                    {{ selectedAchievementGroup.count }} instances
                  </div>
                  <div class="flex-1 h-px bg-gradient-to-r from-neutral-600/50 to-transparent" />
                </div>
              
                <div class="space-y-4">
                  <template
                    v-for="(achievement, index) in selectedAchievementGroup.allAchievements.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())"
                    :key="index"
                  >
                    <!-- Achievement Instance Card -->
                    <div class="relative">
                      <!-- Timeline connector -->
                      <div
                        v-if="index < selectedAchievementGroup.allAchievements.length - 1"
                        class="absolute left-4 top-16 w-0.5 h-8 bg-gradient-to-b from-amber-400/50 to-transparent"
                      />
                    
                      <div class="flex items-start gap-4">
                        <!-- Timeline Dot -->
                        <div class="flex-shrink-0 mt-3">
                          <div
                            class="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg"
                            :class="getTierDotClass(achievement.tier)"
                          />
                        </div>
                      
                        <!-- Achievement Card -->
                        <div
                          class="flex-1 group relative bg-gradient-to-br from-neutral-800/50 to-neutral-900/60 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-amber-500/30 overflow-hidden transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
                          :class="[
                            getTierBorderClass(achievement.tier),
                            achievement.serverGuid && achievement.mapName && achievement.achievedAt ? 'cursor-pointer' : ''
                          ]"
                          @click="achievement.serverGuid && achievement.mapName && achievement.achievedAt ? navigateToRoundReport(achievement) : null"
                        >
                          <!-- Tier Glow Effect -->
                          <div
                            class="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                            :class="getTierGlowClass(achievement.tier)"
                          />
                        
                          <div class="relative z-10 p-4">
                            <!-- Header with time and value -->
                            <div class="flex items-center justify-between mb-3">
                              <div class="flex items-center gap-3">
                                <span class="text-amber-400 font-semibold text-sm">{{ formatRelativeTime(achievement.achievedAt) }}</span>
                                <div class="w-1 h-1 bg-neutral-500 rounded-full" />
                                <span class="text-neutral-500 text-xs">{{ new Date(achievement.achievedAt.endsWith('Z') ? achievement.achievedAt : achievement.achievedAt + 'Z').toLocaleDateString() }}</span>
                              </div>
                              <div
                                v-if="achievement.value"
                                class="px-3 py-1 bg-neutral-700/50 text-neutral-300 rounded-full text-xs font-mono"
                              >
                                {{ achievement.value.toLocaleString() }}
                              </div>
                            </div>
                          
                            <!-- Map info (if available) -->
                            <div
                              v-if="achievement.mapName"
                              class="flex items-center gap-2 text-sm mb-2"
                            >
                              <span class="text-purple-400">🗺️</span>
                              <span class="text-neutral-300 font-medium">{{ achievement.mapName }}</span>
                              <span
                                v-if="achievement.serverGuid && achievement.mapName && achievement.achievedAt"
                                class="text-xs text-neutral-500 italic"
                              >
                                (Click to view round report)
                              </span>
                            </div>

                            <!-- Full timestamp -->
                            <div class="text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-700/50">
                              {{ new Date(achievement.achievedAt.endsWith('Z') ? achievement.achievedAt : achievement.achievedAt + 'Z').toLocaleString() }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Time Gap Indicator -->
                      <div
                        v-if="index < selectedAchievementGroup.allAchievements.length - 1 && getTimeGap(achievement, selectedAchievementGroup.allAchievements[index + 1])"
                        class="flex items-center gap-3 py-3 ml-4 text-xs text-neutral-500"
                      >
                        <div class="w-3 flex justify-center">
                          <div class="w-px h-6 bg-gradient-to-b from-neutral-600 to-transparent" />
                        </div>
                        <div class="flex-1 flex items-center gap-2">
                          <div class="flex-1 border-t border-dashed border-neutral-600/50" />
                          <span class="px-3 py-1 bg-neutral-800/70 backdrop-blur-sm rounded-full text-neutral-400 border border-neutral-700/50">
                            {{ getTimeGap(achievement, selectedAchievementGroup.allAchievements[index + 1]) }}
                          </span>
                          <div class="flex-1 border-t border-dashed border-neutral-600/50" />
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Achievement Dropdown Portal (positioned outside main content to avoid z-index issues) -->
    <div
      v-show="achievementDropdownOpen"
      class="fixed bg-neutral-800 border border-neutral-600/50 rounded-lg max-h-48 overflow-y-auto shadow-xl"
      style="z-index: 99999;"
      :style="dropdownStyle"
    >
      <div
        class="px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-700/50 cursor-pointer transition-colors duration-200 border-b border-neutral-600/30"
        :class="{ 'bg-amber-600 text-white': selectedAchievementId === '' }"
        @click="selectAchievement('')"
      >
        All Achievements
      </div>
      <div
        v-for="label in achievementLabels"
        :key="label.achievementId"
        class="px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-700/50 cursor-pointer transition-colors duration-200 flex items-center gap-2 border-b border-neutral-600/30 last:border-b-0"
        :class="{ 'bg-amber-600 text-white': selectedAchievementId === label.achievementId }"
        @click="selectAchievement(label.achievementId)"
      >
        <img 
          :src="getAchievementImage(label.achievementId)" 
          :alt="label.displayName"
          class="w-5 h-5 rounded object-contain flex-shrink-0"
          @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
        >
        <span>{{ label.displayName }}</span>
      </div>
    </div>
    </div>
  </div>
</template>

<style src="./portal-layout.css"></style>
<style scoped>
/* Utility class for text truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>