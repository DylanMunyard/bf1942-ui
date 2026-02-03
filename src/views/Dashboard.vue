<template>
  <div class="dashboard-root">
    <!-- Scanline overlay -->
    <div class="scanlines" />

    <!-- Matrix rain background effect -->
    <div class="matrix-bg">
      <div v-for="i in 20" :key="i" class="matrix-column" :style="{ left: `${i * 5}%`, animationDelay: `${Math.random() * 5}s` }" />
    </div>

    <div class="dashboard-content">
      <div class="dashboard-container">
        <!-- Terminal Header -->
        <header class="terminal-header">
          <div class="terminal-bar">
            <div class="terminal-dots">
              <span class="dot dot-red" />
              <span class="dot dot-yellow" />
              <span class="dot dot-green" />
            </div>
            <div class="terminal-title">
              <span class="terminal-path">~/battlefield/</span>
              <span class="terminal-cmd">dashboard</span>
              <span class="cursor">_</span>
            </div>
          </div>

          <div class="header-content">
            <div class="glitch-wrapper">
              <h1
                v-if="isAuthenticated"
                class="glitch-text"
                data-text="WELCOME_BACK//"
              >
                Welcome back!
              </h1>
              <h1
                v-else
                class="glitch-text"
                data-text="BF_COMMAND_CENTER//"
              >
                Welcome to Battlefield Command Center
              </h1>
            </div>
            <p class="header-subtitle">
              <span class="prompt">&gt;</span>
              <span v-if="isAuthenticated" class="typing-text">
                Ready for battle? Here's your tactical overview.
              </span>
              <span v-else class="typing-text">
                Sign in to access your personal battlefield dashboard with player profiles, favorite servers, and squad management.
              </span>
            </p>
            <div class="status-bar">
              <span class="status-item">
                <span class="status-dot online" />
                <span class="status-label">SYS_STATUS:</span>
                <span class="status-value">ONLINE</span>
              </span>
              <span class="status-divider">|</span>
              <span class="status-item">
                <span class="status-label">AUTH:</span>
                <span :class="['status-value', isAuthenticated ? 'text-neon-green' : 'text-neon-red']">
                  {{ isAuthenticated ? 'VERIFIED' : 'GUEST' }}
                </span>
              </span>
            </div>
          </div>
        </header>

        <!-- Main Grid -->
        <div class="dashboard-grid">
          <!-- Player Profiles Section -->
          <section class="terminal-panel">
            <div class="panel-header">
              <div class="panel-title-row">
                <div class="panel-icon">
                  <span class="ascii-icon">[&gt;_]</span>
                </div>
                <div class="panel-info">
                  <h2 class="panel-title text-neon-cyan">
                    PLAYER_PROFILES
                  </h2>
                  <p class="panel-desc">
                    // linked identities for stat tracking
                  </p>
                </div>
              </div>
              <div class="panel-actions">
                <button
                  v-if="isAuthenticated && userProfiles.length > 0"
                  class="btn-add btn-cyan"
                  title="Add Player Profile"
                  @click="showAddPlayerModal = true"
                >
                  <span>+</span>
                </button>
                <span class="count-badge badge-cyan">
                  {{ userProfiles.length }}
                </span>
              </div>
            </div>
            <div class="panel-body">
              <div
                v-if="userProfiles.length > 0"
                class="card-grid"
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
                :title="isAuthenticated ? 'NO_DATA_FOUND' : 'PLAYER_PROFILES'"
                :description="isAuthenticated ? 'Add your in-game player names to see your battlefield stats and achievements.' : 'Sign in to add your player profiles and track your battlefield performance across all servers.'"
                :action-text="isAuthenticated ? '+ ADD_PLAYER' : undefined"
                icon="[>_]"
                @action="showAddPlayerModal = true"
              />
            </div>
          </section>

          <!-- Favorite Servers Section -->
          <section class="terminal-panel">
            <div class="panel-header">
              <div class="panel-title-row">
                <div class="panel-icon">
                  <span class="ascii-icon">{::}</span>
                </div>
                <div class="panel-info">
                  <h2 class="panel-title text-neon-green">
                    FAVORITE_SERVERS
                  </h2>
                  <p class="panel-desc">
                    // quick access to preferred battlegrounds
                  </p>
                </div>
              </div>
              <div class="panel-actions">
                <button
                  v-if="isAuthenticated && favoriteServers.length > 0"
                  class="btn-add btn-green"
                  title="Add Favorite Server"
                  @click="showAddServerModal = true"
                >
                  <span>+</span>
                </button>
                <span class="count-badge badge-green">
                  {{ favoriteServers.length }}
                </span>
              </div>
            </div>
            <div class="panel-body">
              <div
                v-if="favoriteServers.length > 0"
                class="card-grid"
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
                :title="isAuthenticated ? 'NO_SERVERS_SAVED' : 'FAVORITE_SERVERS'"
                :description="isAuthenticated ? 'Mark servers as favorites to quickly see their status and join battles.' : 'Sign in to save your favorite servers for quick access and monitoring.'"
                :action-text="isAuthenticated ? '+ ADD_SERVER' : undefined"
                icon="{::}"
                @action="showAddServerModal = true"
              />
            </div>
          </section>

          <!-- Buddies Section -->
          <section class="terminal-panel">
            <div class="panel-header">
              <div class="panel-title-row">
                <div class="panel-icon">
                  <span class="ascii-icon">[@]</span>
                </div>
                <div class="panel-info">
                  <h2 class="panel-title text-neon-pink">
                    SQUAD_ROSTER
                  </h2>
                  <p class="panel-desc">
                    // track allies across the battlefield
                  </p>
                </div>
              </div>
              <div class="panel-actions">
                <button
                  v-if="isAuthenticated && buddies.length > 0"
                  class="btn-add btn-pink"
                  title="Add Squad Member"
                  @click="showAddBuddyModal = true"
                >
                  <span>+</span>
                </button>
                <span class="count-badge badge-pink">
                  {{ buddies.length }}
                </span>
              </div>
            </div>
            <div class="panel-body">
              <div
                v-if="buddies.length > 0"
                class="card-grid"
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
                :title="isAuthenticated ? 'SQUAD_EMPTY' : 'SQUAD_ROSTER'"
                :description="isAuthenticated ? 'Add friends to your squad to track their online status and recent activities.' : 'Sign in to build your squad and track your friends online status across the battlefield.'"
                :action-text="isAuthenticated ? '+ RECRUIT_MEMBER' : undefined"
                icon="[@]"
                @action="showAddBuddyModal = true"
              />
            </div>
          </section>

          <!-- Tournaments Section - Full Width -->
          <section class="terminal-panel panel-wide">
            <div class="panel-header">
              <div class="panel-title-row">
                <div class="panel-icon">
                  <span class="ascii-icon">[#]</span>
                </div>
                <div class="panel-info">
                  <h2 class="panel-title text-neon-gold">
                    TOURNAMENTS
                  </h2>
                  <p class="panel-desc">
                    // competitive events and rankings
                  </p>
                </div>
              </div>
              <div class="panel-actions">
                <button
                  v-if="isAuthenticated && tournaments.length > 0"
                  class="btn-add btn-gold"
                  title="Create Tournament"
                  @click="showAddTournamentModal = true"
                >
                  <span>+</span>
                </button>
                <span class="count-badge badge-gold">
                  {{ tournaments.length }}
                </span>
              </div>
            </div>
            <div class="panel-body">
              <div
                v-if="tournaments.length > 0"
                class="card-grid card-grid-tournaments"
              >
                <TournamentCard
                  v-for="tournament in tournaments"
                  :key="tournament.id"
                  :tournament="tournament"
                  @view-details="() => router.push(`/admin/tournaments/${tournament.id}`)"
                  @remove="() => removeTournament(tournament.id)"
                />
              </div>
              <EmptyStateCard
                v-else
                :title="isAuthenticated ? 'NO_ACTIVE_TOURNAMENTS' : 'TOURNAMENTS'"
                :description="isAuthenticated ? 'Create competitive tournaments and track results across multiple rounds.' : 'Sign in to create and manage your own tournaments.'"
                :action-text="isAuthenticated ? '+ CREATE_TOURNAMENT' : undefined"
                icon="[#]"
                @action="showAddTournamentModal = true"
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
    <SimpleAddTournamentModal
      v-if="showAddTournamentModal"
      :default-organizer="userProfiles.length > 0 ? userProfiles[0].playerName : undefined"
      @close="showAddTournamentModal = false"
      @created="onTournamentCreated"
    />

    <!-- Confirmation Modals -->
    <ConfirmationModal
      v-if="showPlayerConfirm"
      :message="playerConfirmMessage"
      confirm-text="Remove"
      @confirm="handlePlayerRemove"
      @cancel="cancelPlayerConfirm"
    />
    <ConfirmationModal
      v-if="showServerConfirm"
      :message="serverConfirmMessage"
      confirm-text="Remove"
      @confirm="handleServerRemove"
      @cancel="cancelServerConfirm"
    />
    <ConfirmationModal
      v-if="showBuddyConfirm"
      :message="buddyConfirmMessage"
      confirm-text="Remove"
      @confirm="handleBuddyRemove"
      @cancel="cancelBuddyConfirm"
    />
    <ConfirmationModal
      v-if="showTournamentConfirm"
      :message="tournamentConfirmMessage"
      confirm-text="Remove"
      @confirm="handleTournamentRemove"
      @cancel="cancelTournamentConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { statsService } from '@/services/statsService';
import { adminTournamentService, type TournamentListItem } from '@/services/adminTournamentService';
import PlayerNameCard from '@/components/dashboard/PlayerNameCard.vue';
import FavoriteServerCard from '@/components/dashboard/FavoriteServerCard.vue';
import BuddyCard from '@/components/dashboard/BuddyCard.vue';
import EmptyStateCard from '@/components/dashboard/EmptyStateCard.vue';
import AddPlayerModal from '@/components/dashboard/AddPlayerModal.vue';
import AddServerModal from '@/components/dashboard/AddServerModal.vue';
import AddBuddyModal from '@/components/dashboard/AddBuddyModal.vue';
import ConfirmationModal from '@/components/dashboard/ConfirmationModal.vue';
import TournamentCard from '@/components/dashboard/TournamentCard.vue';
import SimpleAddTournamentModal from '@/components/dashboard/SimpleAddTournamentModal.vue';

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
const route = useRoute();
const { isAuthenticated } = useAuth();

// State
const userProfiles = ref<UserProfile[]>([]);
const favoriteServers = ref<FavoriteServer[]>([]);
const buddies = ref<Buddy[]>([]);
const tournaments = ref<TournamentListItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Modal states
const showAddPlayerModal = ref(false);
const showAddServerModal = ref(false);
const showAddBuddyModal = ref(false);
const showAddTournamentModal = ref(false);

// Confirmation modal states for each section
const showPlayerConfirm = ref(false);
const showServerConfirm = ref(false);
const showBuddyConfirm = ref(false);
const showTournamentConfirm = ref(false);
const playerConfirmMessage = ref('');
const serverConfirmMessage = ref('');
const buddyConfirmMessage = ref('');
const tournamentConfirmMessage = ref('');
const pendingPlayerAction = ref<(() => Promise<void>) | null>(null);
const pendingServerAction = ref<(() => Promise<void>) | null>(null);
const pendingBuddyAction = ref<(() => Promise<void>) | null>(null);
const pendingTournamentAction = ref<(() => Promise<void>) | null>(null);

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

const removeTournament = (tournamentId: number) => {
  const tournament = tournaments.value.find(t => t.id === tournamentId);
  if (!tournament) return;

  tournamentConfirmMessage.value = `Remove tournament "${tournament.name}"`;
  pendingTournamentAction.value = async () => {
    try {
      await adminTournamentService.deleteTournament(tournamentId);
      tournaments.value = tournaments.value.filter(t => t.id !== tournamentId);
    } catch (err) {
      console.error('Error removing tournament:', err);
      error.value = 'Failed to remove tournament';
    }
  };
  showTournamentConfirm.value = true;
};

const onTournamentCreated = (tournamentId: number) => {
  showAddTournamentModal.value = false;
  // Navigate to the tournament settings tab
  router.push(`/admin/tournaments/${tournamentId}/settings`);
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

      // Load all tournaments created by current user
      const allTournaments = await adminTournamentService.getAllTournaments();
      tournaments.value = allTournaments;
    } else {
      // For unauthenticated users, clear data to show empty states
      userProfiles.value = [];
      favoriteServers.value = [];
      buddies.value = [];
      tournaments.value = [];
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    error.value = 'Failed to load dashboard data';
    // Clear data on error
    userProfiles.value = [];
    favoriteServers.value = [];
    buddies.value = [];
    tournaments.value = [];
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

const handleTournamentRemove = async () => {
  if (pendingTournamentAction.value) {
    await pendingTournamentAction.value();
  }
  cancelTournamentConfirm();
};

const cancelTournamentConfirm = () => {
  showTournamentConfirm.value = false;
  tournamentConfirmMessage.value = '';
  pendingTournamentAction.value = null;
};

onMounted(() => {
  loadUserData();
});

// Reload data when navigating back to the dashboard
watch(() => route.path, (newPath) => {
  if (newPath === '/dashboard') {
    loadUserData();
  }
});
</script>

<style scoped src="./Dashboard.vue.css"></style>
