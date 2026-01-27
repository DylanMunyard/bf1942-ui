<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchDashboardData, DashboardResponse } from '../services/dashboardService';
import { useAuth } from '@/composables/useAuth';
import { formatLastSeen } from '@/utils/timeUtils';
import { useNotifications } from '@/composables/useNotifications';
import type { BuddyNotificationMessage } from '@/types/playerStatsTypes';

// Router and Auth
const router = useRouter();
const { isAuthenticated } = useAuth();

// Notifications
const { 
  recentNotifications,
  unreadRecentCount,
  missedNotificationCount,
  removeRecentNotification,
  markRecentAsViewed,
  markAsInteracted
} = useNotifications();

// State variables
const dashboardData = ref<DashboardResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Auto-refresh functionality
const autoRefreshInterval = ref<number | null>(null);
const refreshIntervalSeconds = 30;
const isAutoRefresh = ref(true);
// Panel state management
const isPanelOpen = ref(false);
const activeTab = ref<'social' | 'notifications'>('social');
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
  // Mark recent notifications as viewed when opening panel
  if (isPanelOpen.value && activeTab.value === 'notifications') {
    markRecentAsViewed();
  }
};

const switchTab = (tab: 'social' | 'notifications') => {
  activeTab.value = tab;
  if (tab === 'notifications') {
    markRecentAsViewed();
  }
};

// Close panel function
const closePanel = () => {
  isPanelOpen.value = false;
};

// Click outside handler
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  const panel = document.querySelector('.social-panel');
  const toggleBtn = document.querySelector('.social-toggle-btn');
  
  if (isPanelOpen.value && panel && toggleBtn && 
      !panel.contains(target) && !toggleBtn.contains(target)) {
    closePanel();
  }
};

// Helper functions


// Note: formatLastSeen is now imported from @/utils/timeUtils

// Calculate server fill percentage
const getServerFillPercentage = (current: number, max: number): number => {
  return max > 0 ? Math.round((current / max) * 100) : 0;
};

// Get server status color
const getServerStatusColor = (current: number, max: number): string => {
  const percentage = getServerFillPercentage(current, max);
  if (percentage >= 90) return '#e74c3c'; // Red - Full
  if (percentage >= 70) return '#f39c12'; // Orange - High
  if (percentage >= 30) return '#2ecc71'; // Green - Good
  return '#95a5a6'; // Gray - Low
};

// Check if server is offline
const isServerOffline = (_current: number, max: number): boolean => {
  return max === 0;
};

// Get server status class for styling (matching Dashboard FavoriteServerCard)
const getServerStatusClass = (current: number, max: number): string => {
  // If server is offline
  if (isServerOffline(current, max)) return 'offline';
  
  const percentage = getServerFillPercentage(current, max);
  
  // Server is online, use green-based colors for online servers with players
  if (current === 0) return 'online-empty';
  if (current >= max) return 'online-full';
  if (percentage >= 75) return 'online-hot';
  if (percentage >= 50) return 'online-active';
  return 'online-low';
};

// Total counts for display
const totalOnlineBuddies = computed(() => dashboardData.value?.onlineBuddies.length || 0);
const totalOfflineBuddies = computed(() => dashboardData.value?.offlineBuddies?.length || 0);
const totalOnline = computed(() => totalOnlineBuddies.value);

// Badge counts for display
const showNotificationBadge = computed(() => unreadRecentCount.value > 0);
const showMissedIndicator = computed(() => missedNotificationCount.value > 0);

// Fetch dashboard data
const fetchDashboardApiData = async () => {
  // Only make API calls if authenticated
  if (!isAuthenticated.value) {
    loading.value = false;
    return;
  }
  
  if (!loading.value) loading.value = true;
  error.value = null;

  try {
    const result = await fetchDashboardData();
    dashboardData.value = result;
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    error.value = 'Failed to fetch dashboard data. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Navigation functions
const goToPlayerDetails = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
  closePanel();
};

const goToServerDetails = (serverName: string) => {
  router.push(`/servers/${encodeURIComponent(serverName)}`);
  closePanel();
};

// Join server function
const joinServer = (joinLink: string) => {
  window.open(joinLink, '_blank');
};

// Handle notification click
const handleNotificationClick = (notification: BuddyNotificationMessage) => {
  // Mark as interacted when clicked from sidebar
  markAsInteracted(notification.id);
  
  // Execute the action if it exists
  if (notification.action) {
    notification.action.handler();
  }
  closePanel();
};

// Format time ago for notifications
const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else {
    return `${diffDay}d ago`;
  }
};

// Check if notification is truly missed (auto-closed without interaction)
const isMissedNotification = (notification: any): boolean => {
  return !notification.viewed && notification.autoRemoved && !notification.interacted;
};

// Auto-refresh functionality
const startAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
  }
  
  autoRefreshInterval.value = window.setInterval(() => {
    if (isAutoRefresh.value && isAuthenticated.value) {
      fetchDashboardApiData();
    }
  }, refreshIntervalSeconds * 1000);
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
};

// Auto-refresh functionality

// Watch panel state changes
watch(isPanelOpen, (open) => {
  if (open) {
    document.body.classList.add('no-scroll');
    document.addEventListener('click', handleClickOutside);
  } else {
    document.body.classList.remove('no-scroll');
    document.removeEventListener('click', handleClickOutside);
  }
});

// Lifecycle
onMounted(() => {
  // Only fetch data and start auto-refresh if authenticated
  if (isAuthenticated.value) {
    fetchDashboardApiData();
    if (isAutoRefresh.value) {
      startAutoRefresh();
    }
  }
});

onUnmounted(() => {
  stopAutoRefresh();
  // Ensure body scrolling is re-enabled when component is destroyed
  document.body.classList.remove('no-scroll');
  // Clean up click outside listener
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="social-container">
    <!-- Toggle handle fixed to the right edge -->
    <button
      class="social-toggle-btn"
      @click="togglePanel"
    >
      <span
        v-if="!isPanelOpen"
        class="button-content"
      >
        <span
          class="status-indicator"
          :class="{ 
            'has-notifications': showNotificationBadge,
            'has-missed': showMissedIndicator 
          }"
        />
        {{ totalOnline }}
        <span
          v-if="showMissedIndicator"
          class="missed-notification-badge"
        >{{ missedNotificationCount.value }}</span>
        <span
          v-else-if="showNotificationBadge"
          class="notification-badge"
        >{{ unreadRecentCount.value }}</span>
      </span>
      <span v-else>×</span>
    </button>

    <!-- Slide-out panel -->
    <div
      class="social-panel"
      :class="{ open: isPanelOpen }"
    >
      <div class="panel-header">
        <div class="tab-navigation">
          <button
            class="tab-button"
            :class="{ active: activeTab === 'social' }"
            @click="switchTab('social')"
          >
            <span class="tab-icon">👥</span>
            <span class="tab-label">Social</span>
            <span
              v-if="totalOnline > 0"
              class="tab-badge"
            >{{ totalOnline }}</span>
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'notifications' }"
            @click="switchTab('notifications')"
          >
            <span class="tab-icon">🔔</span>
            <span class="tab-label">Notifications</span>
            <span
              v-if="missedNotificationCount.value > 0"
              class="tab-badge missed"
              title="Missed notifications"
            >{{ missedNotificationCount.value }}!</span>
            <span
              v-else-if="unreadRecentCount.value > 0"
              class="tab-badge notification"
            >{{ unreadRecentCount.value }}</span>
          </button>
        </div>
      </div>

      <!-- Loading/Error States -->
      <div
        v-if="loading && !dashboardData"
        class="loading-state"
      >
        <div class="loading-spinner" />
      </div>
      <div
        v-else-if="error"
        class="error-state"
      >
        <p>{{ error }}</p>
      </div>
      <div
        v-else-if="activeTab === 'social' && dashboardData"
        class="social-content"
      >
        <!-- Online Buddies Section -->
        <div
          v-if="dashboardData.onlineBuddies.length > 0"
          class="section"
        >
          <div class="section-header">
            <span class="status-dot online" />
            <h4>Online — {{ dashboardData.onlineBuddies.length }}</h4>
          </div>
          <div class="buddy-list">
            <div
              v-for="buddy in dashboardData.onlineBuddies"
              :key="buddy.playerName"
              class="buddy-item"
              @click="goToPlayerDetails(buddy.playerName)"
            >
              <div class="buddy-avatar">
                <span class="avatar-text">{{ buddy.playerName.charAt(0).toUpperCase() }}</span>
                <span class="online-status" />
              </div>
              <div class="buddy-info">
                <div class="buddy-name">
                  {{ buddy.playerName }}
                </div>
                <div class="buddy-activity">
                  <span class="activity-text">{{ buddy.serverName }}</span>
                  <span class="activity-map">{{ buddy.currentMap }}</span>
                </div>
                <div class="buddy-stats">
                  <span class="stat score">{{ buddy.currentScore || 0 }}</span>
                  <span class="stat kills">{{ buddy.currentKills }}</span>
                  <span class="stat deaths">{{ buddy.currentDeaths }}</span>
                </div>
              </div>
              <div class="buddy-actions">
                <button 
                  class="join-btn"
                  title="Join Server"
                  @click.stop="joinServer(buddy.joinLink)"
                >
                  🎮
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Offline Buddies Section -->
        <div
          v-if="dashboardData?.offlineBuddies?.length > 0"
          class="section"
        >
          <div class="section-header">
            <span class="status-dot offline" />
            <h4>Offline — {{ totalOfflineBuddies }}</h4>
          </div>
          <div class="buddy-list">
            <div
              v-for="buddy in dashboardData.offlineBuddies.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())"
              :key="buddy.playerName"
              class="buddy-item offline"
              @click="goToPlayerDetails(buddy.playerName)"
            >
              <div class="buddy-avatar">
                <span class="avatar-text">{{ buddy.playerName.charAt(0).toUpperCase() }}</span>
                <span class="offline-status" />
              </div>
              <div class="buddy-info">
                <div class="buddy-name">
                  {{ buddy.playerName }}
                </div>
                <div class="buddy-activity">
                  <span class="activity-text">{{ formatLastSeen(buddy.lastSeen) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Favorite Servers Section -->
        <div
          v-if="dashboardData.favoriteServers.length > 0"
          class="section"
        >
          <div class="section-header">
            <span class="server-icon">🖥️</span>
            <h4>Favorite Servers — {{ dashboardData.favoriteServers.length }}</h4>
          </div>
          <div class="server-list">
            <div
              v-for="server in dashboardData.favoriteServers"
              :key="server.id"
              class="server-item"
              @click="goToServerDetails(server.serverName)"
            >
              <div class="server-status">
                <div 
                  class="server-fill-bar"
                  :style="{ backgroundColor: getServerStatusColor(server.currentPlayers, server.maxPlayers) }"
                >
                  <div 
                    class="server-fill-progress"
                    :style="{ width: getServerFillPercentage(server.currentPlayers, server.maxPlayers) + '%' }"
                  />
                </div>
              </div>
              <div class="server-info">
                <div class="server-name">
                  {{ server.serverName }}
                </div>
                <div class="server-details">
                  <div class="server-details-row">
                    <span 
                      v-if="!isServerOffline(server.currentPlayers, server.maxPlayers)" 
                      class="server-map"
                    >{{ server.currentMap || 'Unknown Map' }}</span>
                    <div class="server-status-actions">
                      <div
                        class="player-count-badge"
                        :class="getServerStatusClass(server.currentPlayers, server.maxPlayers)"
                      >
                        <template v-if="!isServerOffline(server.currentPlayers, server.maxPlayers)">
                          <span class="count">{{ server.currentPlayers }}</span>
                          <span class="max">/{{ server.maxPlayers }}</span>
                        </template>
                        <span
                          v-else
                          class="offline-text"
                        >OFFLINE</span>
                      </div>
                      <button 
                        v-if="!isServerOffline(server.currentPlayers, server.maxPlayers)"
                        class="join-btn"
                        title="Join Server"
                        @click.stop="joinServer(server.joinLink)"
                      >
                        🎮
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="server-actions" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="dashboardData.onlineBuddies.length === 0 && dashboardData.favoriteServers.length === 0 && dashboardData.offlineBuddies.length === 0"
          class="empty-state"
        >
          <div class="empty-icon">
            😴
          </div>
          <p class="empty-text">
            No buddies online
          </p>
          <p class="empty-subtext">
            Check back later or add some friends!
          </p>
        </div>
      </div>

      <!-- Notifications Tab Content -->
      <div
        v-else-if="activeTab === 'notifications'"
        class="notifications-content"
      >
        <div
          v-if="recentNotifications.length > 0"
          class="notifications-list"
        >
          <div
            v-for="notification in recentNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 
              unread: !notification.viewed,
              missed: isMissedNotification(notification)
            }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              {{ notification.icon || '🔔' }}
            </div>
            <div class="notification-content">
              <div class="notification-title">
                {{ notification.title }}
                <span
                  v-if="isMissedNotification(notification)"
                  class="missed-indicator"
                  title="You missed this notification"
                >!</span>
              </div>
              <div class="notification-message">
                {{ notification.message }}
              </div>
              <div class="notification-timestamp">
                {{ formatTimeAgo(notification.timestamp) }}
              </div>
            </div>
            <div class="notification-actions">
              <button
                class="notification-close"
                title="Remove notification"
                @click.stop="removeRecentNotification(notification.id)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div
          v-else
          class="empty-state"
        >
          <div class="empty-icon">
            🔔
          </div>
          <p class="empty-text">
            No recent notifications
          </p>
          <p class="empty-subtext">
            You'll see your recent notifications here
          </p>
        </div>
      </div>

      <div
        v-else
        class="empty-state"
      >
        <div class="empty-icon">
          👥
        </div>
        <p class="empty-text">
          No social data
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped src="./OnlinePlayersSidebar.vue.css"></style>

<style>
body.no-scroll {
  overflow: hidden;
}
</style>