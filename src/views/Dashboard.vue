<template>
  <div class="relative min-h-screen px-3 sm:px-6">
    <!-- Background Effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>

    <div class="relative z-10 pb-6 sm:pb-12">
      <div class="max-w-7xl mx-auto">
        <!-- Header Section -->
        <div class="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden mb-8">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 opacity-50"></div>
          <div class="relative z-10 p-6 sm:p-8 md:p-12">
            <div class="welcome-section">
              <h1 
                v-if="isAuthenticated"
                class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4"
              >
                Welcome back!
              </h1>
              <h1 
                v-else
                class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4"
              >
                Welcome to Battlefield Command Center
              </h1>
              <p
                v-if="isAuthenticated"
                class="text-slate-300 text-lg sm:text-xl leading-relaxed"
              >
                Ready for battle? Here's your tactical overview.
              </p>
              <p
                v-else
                class="text-slate-300 text-lg sm:text-xl leading-relaxed"
              >
                Sign in to access your personal battlefield dashboard with player profiles, favorite servers, and squad management.
              </p>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <!-- Player Profiles Section -->
          <section class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
            <ConfirmationModal
              v-if="showPlayerConfirm"
              :message="playerConfirmMessage"
              confirm-text="Remove"
              @confirm="handlePlayerRemove"
              @cancel="cancelPlayerConfirm"
            />
            <div class="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/20">
              <div class="flex flex-col gap-2">
                <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center gap-3">
                  👤 Your Battlefield Profiles
                </h2>
                <p class="text-slate-400 text-sm">
                  Link your in-game player name(s) to track stats and achievements
                </p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  v-if="isAuthenticated && userProfiles.length > 0"
                  class="group flex items-center justify-center w-10 h-10 rounded-full border-2 border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300 transform hover:scale-105"
                  title="Add Player Profile"
                  @click="showAddPlayerModal = true"
                >
                  <span class="text-xl font-bold">+</span>
                </button>
                <span class="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold rounded-full">
                  {{ userProfiles.length }}
                </span>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <div
                v-if="userProfiles.length > 0"
                class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3"
              >
                <PlayerNameCard
                  v-for="profile in userProfiles"
                  :key="profile.id"
                  :player-name="profile"
                  @view-details="goToPlayerDetails"
                  @remove="removePlayerName"
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
          <section class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
            <ConfirmationModal
              v-if="showServerConfirm"
              :message="serverConfirmMessage"
              confirm-text="Remove"
              @confirm="handleServerRemove"
              @cancel="cancelServerConfirm"
            />
            <div class="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/20">
              <div class="flex flex-col gap-2">
                <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
                  🖥️ Favorite Servers
                </h2>
                <p class="text-slate-400 text-sm">
                  Save servers to quickly monitor status and join battles
                </p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  v-if="isAuthenticated && favoriteServers.length > 0"
                  class="group flex items-center justify-center w-10 h-10 rounded-full border-2 border-emerald-400 bg-transparent text-emerald-400 hover:bg-emerald-400 hover:text-slate-900 transition-all duration-300 transform hover:scale-105"
                  title="Add Favorite Server"
                  @click="showAddServerModal = true"
                >
                  <span class="text-xl font-bold">+</span>
                </button>
                <span class="px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold rounded-full">
                  {{ favoriteServers.length }}
                </span>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <div
                v-if="favoriteServers.length > 0"
                class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3"
              >
                <FavoriteServerCard
                  v-for="server in favoriteServers"
                  :key="server.id"
                  :server="server"
                  @join="joinServer"
                  @remove="() => removeFavoriteServer(server.id)"
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
          <section class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
        <ConfirmationModal
          v-if="showBuddyConfirm"
          :message="buddyConfirmMessage"
          confirm-text="Remove"
          @confirm="handleBuddyRemove"
          @cancel="cancelBuddyConfirm"
        />
          <div class="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div class="flex flex-col gap-2">
              <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
                👥 Your Squad
              </h2>
              <p class="text-slate-400 text-sm">
                Track friends and squad mates across the battlefield
              </p>
            </div>
            <div class="flex items-center gap-3">
              <button
                v-if="isAuthenticated && buddies.length > 0"
                class="group flex items-center justify-center w-10 h-10 rounded-full border-2 border-purple-400 bg-transparent text-purple-400 hover:bg-purple-400 hover:text-slate-900 transition-all duration-300 transform hover:scale-105"
                title="Add Squad Member"
                @click="showAddBuddyModal = true"
              >
                <span class="text-xl font-bold">+</span>
              </button>
              <span class="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full">
                {{ buddies.length }}
              </span>
            </div>
          </div>
          <div class="p-4 sm:p-6">
            <div
              v-if="buddies.length > 0"
              class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3"
            >
            <BuddyCard
              v-for="buddy in buddies"
              :key="buddy.id"
              :buddy="buddy"
              @remove="() => removeBuddy(buddy.id)"
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
        </div>
      </div>
    </div>
    
    <!-- Modals -->
    <AddPlayerModal
      v-if="showAddPlayerModal"
      @close="showAddPlayerModal = false"
      @added="onPlayerAdded"
    />
    <AddServerModal
      v-if="showAddServerModal"
      @close="showAddServerModal = false"
      @added="onServerAdded"
    />
    <AddBuddyModal
      v-if="showAddBuddyModal"
      @close="showAddBuddyModal = false"
      @added="onBuddyAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { statsService } from '@/services/statsService';
import PlayerNameCard from '@/components/dashboard/PlayerNameCard.vue';
import FavoriteServerCard from '@/components/dashboard/FavoriteServerCard.vue';
import BuddyCard from '@/components/dashboard/BuddyCard.vue';
import EmptyStateCard from '@/components/dashboard/EmptyStateCard.vue';
import AddPlayerModal from '@/components/dashboard/AddPlayerModal.vue';
import AddServerModal from '@/components/dashboard/AddServerModal.vue';
import AddBuddyModal from '@/components/dashboard/AddBuddyModal.vue';
import ConfirmationModal from '@/components/dashboard/ConfirmationModal.vue';

interface Player {
  name: string;
  firstSeen: string;
  lastSeen: string;
  totalPlayTimeMinutes: number;
  aiBot: boolean;
  isOnline: boolean;
  lastSeenIso: string;
  currentServer: string;
  currentMap?: string;
  currentSessionScore?: number;
  currentSessionKills?: number;
  currentSessionDeaths?: number;
}

interface UserProfile {
  id: number;
  playerName: string;
  createdAt: string;
  player: Player;
}

interface FavoriteServer {
  id: number;
  serverGuid: string;
  serverName: string;
  createdAt: string;
  activeSessions: number;
  currentMap?: string;
  maxPlayers: number;
  joinLink?: string;
}

interface Buddy {
  id: number;
  buddyPlayerName: string;
  createdAt: string;
  player: Player;
}



const router = useRouter();
const { isAuthenticated } = useAuth();

// State
const userProfiles = ref<UserProfile[]>([]);
const favoriteServers = ref<FavoriteServer[]>([]);
const buddies = ref<Buddy[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Modal states
const showAddPlayerModal = ref(false);
const showAddServerModal = ref(false);
const showAddBuddyModal = ref(false);

// Confirmation modal states for each section
const showPlayerConfirm = ref(false);
const showServerConfirm = ref(false);
const showBuddyConfirm = ref(false);
const playerConfirmMessage = ref('');
const serverConfirmMessage = ref('');
const buddyConfirmMessage = ref('');
const pendingPlayerAction = ref<(() => Promise<void>) | null>(null);
const pendingServerAction = ref<(() => Promise<void>) | null>(null);
const pendingBuddyAction = ref<(() => Promise<void>) | null>(null);

// Actions
const goToPlayerDetails = (playerName: string) => {
  router.push(`/players/${playerName}`);
};

const joinServer = (server: FavoriteServer) => {
  // Implementation will depend on game client integration
  console.log(`Joining server: ${server.serverName}`);
};

const removeFavoriteServer = (serverId: number) => {
  const server = favoriteServers.value.find(s => s.id === serverId);
  if (!server) return;
  
  serverConfirmMessage.value = `Remove ${server.serverName}`;
  pendingServerAction.value = async () => {
    try {
      await statsService.removeFavoriteServer(serverId);
      favoriteServers.value = favoriteServers.value.filter(s => s.id !== serverId);
    } catch (err) {
      console.error('Error removing favorite server:', err);
      error.value = 'Failed to remove favorite server';
    }
  };
  showServerConfirm.value = true;
};

const removePlayerName = (playerId: number) => {
  const profile = userProfiles.value.find(p => p.id === playerId);
  if (!profile) return;
  
  playerConfirmMessage.value = `Remove ${profile.playerName}`;
  pendingPlayerAction.value = async () => {
    try {
      await statsService.removePlayerName(playerId);
      userProfiles.value = userProfiles.value.filter(p => p.id !== playerId);
    } catch (err) {
      console.error('Error removing player name:', err);
      error.value = 'Failed to remove player name';
    }
  };
  showPlayerConfirm.value = true;
};

const removeBuddy = (buddyId: number) => {
  const buddy = buddies.value.find(b => b.id === buddyId);
  if (!buddy) return;
  
  buddyConfirmMessage.value = `Remove ${buddy.buddyPlayerName}`;
  pendingBuddyAction.value = async () => {
    try {
      await statsService.removeBuddy(buddyId);
      buddies.value = buddies.value.filter(b => b.id !== buddyId);
    } catch (err) {
      console.error('Error removing buddy:', err);
      error.value = 'Failed to remove buddy';
    }
  };
  showBuddyConfirm.value = true;
};

const onPlayerAdded = () => {
  showAddPlayerModal.value = false;
  loadUserData(); // Refresh data
};

const onServerAdded = () => {
  showAddServerModal.value = false;
  loadUserData(); // Refresh data
};

const onBuddyAdded = () => {
  showAddBuddyModal.value = false;
  loadUserData(); // Refresh data
};

const loadUserData = async () => {
  loading.value = true;
  error.value = null;
  try {
    if (isAuthenticated.value) {
      const profile = await statsService.getUserProfile();
      userProfiles.value = profile.playerNames;
      favoriteServers.value = profile.favoriteServers;
      // Sort buddies: online first, then by name
      buddies.value = profile.buddies.sort((a, b) => {
        // First sort by online status (online first)
        if (a.player.isOnline && !b.player.isOnline) return -1;
        if (!a.player.isOnline && b.player.isOnline) return 1;
        // Then sort by name alphabetically
        return a.buddyPlayerName.localeCompare(b.buddyPlayerName);
      });
    } else {
      // For unauthenticated users, clear data to show empty states
      userProfiles.value = [];
      favoriteServers.value = [];
      buddies.value = [];
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    error.value = 'Failed to load dashboard data';
    // Clear data on error
    userProfiles.value = [];
    favoriteServers.value = [];
    buddies.value = [];
  } finally {
    loading.value = false;
  }
};

// Confirmation modal handlers
const handlePlayerRemove = async () => {
  if (pendingPlayerAction.value) {
    await pendingPlayerAction.value();
  }
  cancelPlayerConfirm();
};

const cancelPlayerConfirm = () => {
  showPlayerConfirm.value = false;
  playerConfirmMessage.value = '';
  pendingPlayerAction.value = null;
};

const handleServerRemove = async () => {
  if (pendingServerAction.value) {
    await pendingServerAction.value();
  }
  cancelServerConfirm();
};

const cancelServerConfirm = () => {
  showServerConfirm.value = false;
  serverConfirmMessage.value = '';
  pendingServerAction.value = null;
};

const handleBuddyRemove = async () => {
  if (pendingBuddyAction.value) {
    await pendingBuddyAction.value();
  }
  cancelBuddyConfirm();
};

const cancelBuddyConfirm = () => {
  showBuddyConfirm.value = false;
  buddyConfirmMessage.value = '';
  pendingBuddyAction.value = null;
};

onMounted(() => {
  loadUserData();
});
</script>

<style scoped>
/* Custom animations for enhanced visual effects */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>