<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchDashboardData, DashboardResponse } from '../services/dashboardService';
import { useAuth } from '@/composables/useAuth';
import { formatLastSeen } from '@/utils/timeUtils';

// Router and Auth
const router = useRouter();
const { isAuthenticated } = useAuth();

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
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
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

// Format session duration
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

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
const isServerOffline = (current: number, max: number): boolean => {
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
const totalFavoriteServers = computed(() => dashboardData.value?.favoriteServers.length || 0);
const totalOnline = computed(() => totalOnlineBuddies.value);

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
        <span class="status-indicator" />
        {{ totalOnline }}
      </span>
      <span v-else>×</span>
    </button>

    <!-- Slide-out panel -->
    <div
      class="social-panel"
      :class="{ open: isPanelOpen }"
    >
      <div class="panel-header">
        <h3 class="panel-title">
          <span class="buddies-icon">👥</span>
          Social
        </h3>
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
        v-else-if="dashboardData"
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
              <div class="server-actions">
              </div>
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

<style scoped>
.social-container {
  position: relative;
}

/* Toggle Button */
.social-toggle-btn {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #5865F2, #7289DA);
  color: #fff;
  border: none;
  border-radius: 12px 0 0 12px;
  padding: 12px 16px;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  min-width: 48px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: -2px 0 12px rgba(88, 101, 242, 0.3);
  transition: all 0.2s ease;
}

.social-toggle-btn:hover {
  transform: translateY(-50%) translateX(-2px);
  box-shadow: -4px 0 16px rgba(88, 101, 242, 0.4);
}

.button-content {
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.status-indicator {
  width: 8px;
  height: 8px;
  background-color: #57F287;
  border-radius: 50%;
  animation: discord-pulse 2s infinite;
}

@keyframes discord-pulse {
  0% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.7;
    transform: scale(1.2);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}

/* Social Panel */
.social-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  max-width: 90vw;
  height: 100vh;
  background: #2F3136;
  border-left: 1px solid #40444B;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.social-panel.open {
  transform: translateX(0);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #40444B;
  background: #36393F;
}

.panel-title {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.buddies-icon {
  font-size: 18px;
}

/* Social Content */
.social-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  padding: 16px 20px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header h4 {
  color: #B9BBBE;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.status-dot.online {
  background-color: #57F287;
}

.status-dot.offline {
  background-color: #747F8D;
}

.server-icon {
  font-size: 12px;
}

/* Buddy List */
.buddy-list {
  padding: 0 12px;
}

.buddy-item {
  display: flex;
  align-items: center;
  padding: 8px 8px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.buddy-item:hover {
  background-color: #34373C;
}

.buddy-item.offline {
  opacity: 0.6;
}

.buddy-item.offline:hover {
  opacity: 0.8;
}

.buddy-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5865F2, #7289DA);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.avatar-text {
  color: #FFFFFF;
  font-weight: 600;
  font-size: 14px;
}

.online-status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background-color: #57F287;
  border: 3px solid #2F3136;
  border-radius: 50%;
}

.offline-status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background-color: #747F8D;
  border: 3px solid #2F3136;
  border-radius: 50%;
}

.buddy-info {
  flex: 1;
  min-width: 0;
}

.buddy-name {
  color: #DCDDDE;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buddy-activity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.activity-text {
  color: #B9BBBE;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-map {
  color: #72767D;
  font-size: 11px;
  font-style: italic;
}

.buddy-stats {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.stat {
  color: #B9BBBE;
  background-color: #4F545C;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 500;
}

.stat.score {
  color: #DCDDDE;
  background-color: #4F545C;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 500;
}

.stat.kills {
  color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.stat.deaths {
  color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.buddy-actions {
  display: flex;
  gap: 4px;
}

.join-btn {
  width: 24px;
  height: 24px;
  border: none;
  background-color: #5865F2;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.join-btn:hover {
  background-color: #4752C4;
  transform: scale(1.1);
}

/* Server List */
.server-list {
  padding: 0 12px;
}

.server-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.server-item:hover {
  background-color: #34373C;
}

.server-status {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  margin-right: 12px;
  background-color: #4F545C;
  overflow: hidden;
  position: relative;
}

.server-fill-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #72767D;
  border-radius: 2px;
}

.server-fill-progress {
  height: 100%;
  background-color: inherit;
  transition: height 0.3s ease;
}

.server-info {
  flex: 1;
  min-width: 0;
}

.server-name {
  color: #DCDDDE;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-details-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-status-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-map {
  color: #B9BBBE;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.server-players {
  color: #72767D;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.player-count-badge {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 50px;
  justify-content: center;
  white-space: nowrap;
}

/* Offline server - red styling */
.player-count-badge.offline {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.offline-text {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Online server with no players - light green */
.player-count-badge.online-empty {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

/* Online server with low players - medium green */
.player-count-badge.online-low {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

/* Online server with active players - bright green */
.player-count-badge.online-active {
  background-color: rgba(34, 197, 94, 0.3);
  color: #15803d;
}

/* Online server with hot activity - vibrant green */
.player-count-badge.online-hot {
  background-color: rgba(34, 197, 94, 0.4);
  color: #166534;
}

/* Online server that's full - dark green */
.player-count-badge.online-full {
  background-color: rgba(34, 197, 94, 0.5);
  color: #14532d;
}

.count {
  font-size: 0.8rem;
}

.max {
  font-size: 0.7rem;
  opacity: 0.7;
}

.server-actions {
  display: flex;
  gap: 4px;
}

/* Loading/Error States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #72767D;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #40444B;
  border-top: 3px solid #5865F2;
  border-radius: 50%;
  animation: discord-spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes discord-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  color: #DCDDDE;
  font-weight: 600;
  font-size: 16px;
  margin: 8px 0;
}

.empty-subtext {
  color: #72767D;
  font-size: 14px;
  margin: 0;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .social-panel {
    width: 100vw;
  }
  
  .buddy-item, .server-item {
    padding: 12px 8px;
  }
  
  .buddy-name, .server-name {
    font-size: 16px;
  }
  
  .activity-text, .server-map {
    font-size: 14px;
  }
}

/* End of styles */
</style>

<style>
body.no-scroll {
  overflow: hidden;
}
</style>