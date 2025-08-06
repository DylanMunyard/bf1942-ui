<template>
  <div class="dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1 v-if="isAuthenticated">Welcome back, Commander!</h1>
        <h1 v-else>Welcome to Battlefield Command Center</h1>
        <p v-if="isAuthenticated" class="subtitle">Ready for battle? Here's your tactical overview.</p>
        <p v-else class="subtitle">Sign in to access your personal battlefield dashboard with player profiles, favorite servers, and squad management.</p>
      </div>
      <div v-if="isAuthenticated" class="quick-actions">
        <button @click="showAddPlayerModal = true" class="action-btn primary">
          <span class="icon">👤</span>
          Add Player Profile
        </button>
        <button @click="showAddServerModal = true" class="action-btn secondary">
          <span class="icon">🖥️</span>
          Add Favorite Server
        </button>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Player Profiles Section -->
      <section class="dashboard-section player-profiles">
        <div class="section-header">
          <h2>Your Battlefield Profiles</h2>
          <span class="section-count">{{ userProfiles.length }}</span>
        </div>
        <div class="section-content">
          <div v-if="userProfiles.length > 0" class="profiles-grid">
            <PlayerProfileCard
              v-for="profile in userProfiles"
              :key="profile.playerName"
              :profile="profile"
              @view-details="goToPlayerDetails"
            />
          </div>
          <EmptyStateCard
            v-else
            :title="isAuthenticated ? 'No Player Profiles Yet' : 'Player Profiles'"
            :description="isAuthenticated ? 'Add your in-game player names to see your battlefield stats and achievements.' : 'Sign in to add your player profiles and track your battlefield performance across all servers.'"
            :action-text="isAuthenticated ? 'Add Your First Player' : undefined"
            icon="👤"
            @action="showAddPlayerModal = true"
          />
        </div>
      </section>

      <!-- Favorite Servers Section -->
      <section class="dashboard-section favorite-servers">
        <div class="section-header">
          <h2>Favorite Servers</h2>
          <span class="section-count">{{ favoriteServers.length }}</span>
        </div>
        <div class="section-content">
          <div v-if="favoriteServers.length > 0" class="servers-grid">
            <FavoriteServerCard
              v-for="server in favoriteServers"
              :key="server.id"
              :server="server"
              @join="joinServer"
              @remove="removeFavoriteServer"
            />
          </div>
          <EmptyStateCard
            v-else
            :title="isAuthenticated ? 'No Favorite Servers' : 'Favorite Servers'"
            :description="isAuthenticated ? 'Mark servers as favorites to quickly see their status and join battles.' : 'Sign in to save your favorite servers for quick access and monitoring.'"
            :action-text="isAuthenticated ? 'Add Server' : undefined"
            icon="🖥️"
            @action="showAddServerModal = true"
          />
        </div>
      </section>

      <!-- Buddies Section -->
      <section class="dashboard-section buddies">
        <div class="section-header">
          <h2>Your Squad</h2>
          <span class="section-count">{{ buddies.length }}</span>
        </div>
        <div class="section-content">
          <div v-if="buddies.length > 0" class="buddies-grid">
            <BuddyCard
              v-for="buddy in buddies"
              :key="buddy.playerName"
              :buddy="buddy"
              @view-profile="goToPlayerDetails"
              @remove="removeBuddy"
            />
          </div>
          <EmptyStateCard
            v-else
            :title="isAuthenticated ? 'No Squad Members Yet' : 'Your Squad'"
            :description="isAuthenticated ? 'Add friends to your squad to track their online status and recent activities.' : 'Sign in to build your squad and track your friends\' online status across the battlefield.'"
            :action-text="isAuthenticated ? 'Search Players' : undefined"
            icon="👥"
            @action="showAddBuddyModal = true"
          />
        </div>
      </section>

      <!-- Recent Activity Section -->
      <section class="dashboard-section recent-activity full-width">
        <div class="section-header">
          <h2>Recent Battlefield Activity</h2>
        </div>
        <div class="section-content">
          <RecentActivityFeed :activities="recentActivities" />
        </div>
      </section>
    </div>

    <!-- Modals -->
    <AddPlayerModal v-if="showAddPlayerModal" @close="showAddPlayerModal = false" @added="onPlayerAdded" />
    <AddServerModal v-if="showAddServerModal" @close="showAddServerModal = false" @added="onServerAdded" />
    <AddBuddyModal v-if="showAddBuddyModal" @close="showAddBuddyModal = false" @added="onBuddyAdded" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import PlayerProfileCard from '@/components/dashboard/PlayerProfileCard.vue';
import FavoriteServerCard from '@/components/dashboard/FavoriteServerCard.vue';
import BuddyCard from '@/components/dashboard/BuddyCard.vue';
import EmptyStateCard from '@/components/dashboard/EmptyStateCard.vue';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed.vue';
import AddPlayerModal from '@/components/dashboard/AddPlayerModal.vue';
import AddServerModal from '@/components/dashboard/AddServerModal.vue';
import AddBuddyModal from '@/components/dashboard/AddBuddyModal.vue';

interface UserProfile {
  playerName: string;
  totalPlayTime: number;
  lastSeen: string;
  rank: number;
  score: number;
  kills: number;
  deaths: number;
  favoriteServer: string;
  isOnline: boolean;
  currentServer?: string;
}

interface FavoriteServer {
  id: string;
  name: string;
  gameMode: string;
  currentMap: string;
  playerCount: number;
  maxPlayers: number;
  isOnline: boolean;
  ping: number;
}

interface Buddy {
  playerName: string;
  isOnline: boolean;
  lastSeen: string;
  currentServer?: string;
  score: number;
  rank: number;
}

interface RecentActivity {
  id: string;
  type: 'achievement' | 'session' | 'buddy_online' | 'rank_up';
  description: string;
  timestamp: string;
  playerName?: string;
}

const router = useRouter();
const { isAuthenticated } = useAuth();

// State
const userProfiles = ref<UserProfile[]>([]);
const favoriteServers = ref<FavoriteServer[]>([]);
const buddies = ref<Buddy[]>([]);
const recentActivities = ref<RecentActivity[]>([]);
const loading = ref(true);

// Modal states
const showAddPlayerModal = ref(false);
const showAddServerModal = ref(false);
const showAddBuddyModal = ref(false);

// Actions
const goToPlayerDetails = (playerName: string) => {
  router.push(`/players/${playerName}`);
};

const joinServer = (server: FavoriteServer) => {
  // Implementation will depend on game client integration
  console.log(`Joining server: ${server.name}`);
};

const removeFavoriteServer = (serverId: string) => {
  favoriteServers.value = favoriteServers.value.filter(s => s.id !== serverId);
  // TODO: Call API to remove from favorites
};

const removeBuddy = (playerName: string) => {
  buddies.value = buddies.value.filter(b => b.playerName !== playerName);
  // TODO: Call API to remove buddy
};

const onPlayerAdded = (_playerName: string) => {
  showAddPlayerModal.value = false;
  loadUserData(); // Refresh data
};

const onServerAdded = (server: FavoriteServer) => {
  showAddServerModal.value = false;
  favoriteServers.value.push(server);
};

const onBuddyAdded = (buddy: Buddy) => {
  showAddBuddyModal.value = false;
  buddies.value.push(buddy);
};

const loadUserData = async () => {
  loading.value = true;
  try {
    if (isAuthenticated.value) {
      // TODO: Replace with actual API calls
      // These are mock data structures for now
      await loadUserProfiles();
      await loadFavoriteServers();
      await loadBuddies();
      await loadRecentActivity();
    } else {
      // For unauthenticated users, clear data to show empty states
      userProfiles.value = [];
      favoriteServers.value = [];
      buddies.value = [];
      recentActivities.value = [];
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const loadUserProfiles = async () => {
  // TODO: Call API to get user's player profiles
  // Mock data for now - empty for testing empty states
  userProfiles.value = [];
};

const loadFavoriteServers = async () => {
  // TODO: Call API to get user's favorite servers
  favoriteServers.value = [];
};

const loadBuddies = async () => {
  // TODO: Call API to get user's buddies
  buddies.value = [];
};

const loadRecentActivity = async () => {
  // TODO: Call API to get recent activities
  recentActivities.value = [];
};

onMounted(() => {
  loadUserData();
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(var(--color-accent-rgb), 0.1) 100%);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.welcome-section h1 {
  color: var(--color-text);
  margin: 0 0 5px 0;
  font-size: 2rem;
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 1rem;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background-color: var(--color-accent);
  color: white;
}

.action-btn.primary:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background-color: var(--color-card-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-btn.secondary:hover {
  background-color: var(--color-card-bg-hover);
  transform: translateY(-1px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-section {
  background-color: var(--color-card-bg);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.dashboard-section.full-width {
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background-color: rgba(var(--color-accent-rgb), 0.05);
}

.section-header h2 {
  color: var(--color-text);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.section-count {
  background-color: var(--color-accent);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.section-content {
  padding: 24px;
}

.profiles-grid,
.servers-grid,
.buddies-grid {
  display: grid;
  gap: 16px;
}

.profiles-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.servers-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.buddies-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .quick-actions {
    width: 100%;
    justify-content: center;
  }

  .action-btn {
    flex: 1;
  }

  .section-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 12px;
  }

  .welcome-section h1 {
    font-size: 1.5rem;
  }

  .quick-actions {
    flex-direction: column;
  }

  .profiles-grid,
  .servers-grid,
  .buddies-grid {
    grid-template-columns: 1fr;
  }
}
</style>