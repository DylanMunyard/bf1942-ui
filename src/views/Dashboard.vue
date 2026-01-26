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
                  @edit="() => editTournament(tournament.id)"
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
    <AddTournamentModal
      v-if="showAddTournamentModal"
      :tournament="editingTournament"
      :default-organizer="userProfiles.length > 0 ? userProfiles[0].playerName : undefined"
      @close="showAddTournamentModal = false; editingTournament = null"
      @added="onTournamentAdded"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
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
import AddTournamentModal from '@/components/dashboard/AddTournamentModal.vue';

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
const tournaments = ref<TournamentListItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Modal states
const showAddPlayerModal = ref(false);
const showAddServerModal = ref(false);
const showAddBuddyModal = ref(false);
const showAddTournamentModal = ref(false);
const editingTournament = ref<TournamentListItem | null>(null);

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

const editTournament = async (tournamentId: number) => {
  const tournament = tournaments.value.find(t => t.id === tournamentId);
  if (!tournament) return;

  // Fetch full tournament details for editing
  try {
    const details = await adminTournamentService.getTournamentDetail(tournamentId);
    // Store the details with the id and basic info from the list item
    editingTournament.value = {
      ...tournament,
      ...details
    } as any;
    showAddTournamentModal.value = true;
  } catch (err) {
    console.error('Error loading tournament details:', err);
    error.value = 'Failed to load tournament details';
  }
};

const onTournamentAdded = (tournamentId?: number) => {
  const wasEditing = editingTournament.value !== null;
  showAddTournamentModal.value = false;
  editingTournament.value = null;

  // If a new tournament was created (not editing), navigate to it
  if (tournamentId && !wasEditing) {
    router.push(`/admin/tournaments/${tournamentId}`);
  } else {
    // Otherwise just reload the data
    loadUserData();
  }
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
</script>

<style scoped>
/* ===== L33T HACKER THEME ===== */

/* Base colors */
.dashboard-root {
  --neon-cyan: #00fff2;
  --neon-green: #39ff14;
  --neon-pink: #ff00ff;
  --neon-gold: #ffd700;
  --neon-red: #ff3131;
  --bg-dark: #0a0a0f;
  --bg-panel: #0d1117;
  --bg-card: #161b22;
  --border-color: #30363d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;

  position: relative;
  min-height: 100vh;
  background: var(--bg-dark);
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  overflow-x: hidden;
}

/* Scanline effect */
.scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  animation: scanline-flicker 0.1s infinite;
}

@keyframes scanline-flicker {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.06; }
}

/* Matrix background */
.matrix-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.03;
}

.matrix-column {
  position: absolute;
  top: -100%;
  width: 20px;
  height: 200%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--neon-green) 50%,
    transparent 100%
  );
  animation: matrix-fall 15s linear infinite;
}

@keyframes matrix-fall {
  0% { transform: translateY(-50%); }
  100% { transform: translateY(50%); }
}

/* Main content */
.dashboard-content {
  position: relative;
  z-index: 10;
  padding: 1rem;
  padding-bottom: 3rem;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Terminal Header */
.terminal-header {
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-panel);
  box-shadow:
    0 0 20px rgba(0, 255, 242, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.terminal-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, #1a1f26 0%, #0d1117 100%);
  border-bottom: 1px solid var(--border-color);
}

.terminal-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.terminal-title {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.terminal-path {
  color: var(--neon-cyan);
}

.terminal-cmd {
  color: var(--text-primary);
  margin-left: 0.25rem;
}

.cursor {
  color: var(--neon-green);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.header-content {
  padding: 1.5rem;
}

/* Glitch text effect */
.glitch-wrapper {
  position: relative;
}

.glitch-text {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  font-weight: 700;
  color: var(--neon-cyan);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 0.75rem 0;
  text-shadow:
    0 0 10px var(--neon-cyan),
    0 0 20px var(--neon-cyan),
    0 0 40px var(--neon-cyan);
  animation: glitch 3s infinite;
}

@keyframes glitch {
  0%, 90%, 100% {
    text-shadow:
      0 0 10px var(--neon-cyan),
      0 0 20px var(--neon-cyan);
  }
  92% {
    text-shadow:
      -2px 0 var(--neon-pink),
      2px 0 var(--neon-green);
    transform: translate(2px, 0);
  }
  94% {
    text-shadow:
      2px 0 var(--neon-pink),
      -2px 0 var(--neon-green);
    transform: translate(-2px, 0);
  }
}

.header-subtitle {
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.6;
}

.prompt {
  color: var(--neon-green);
  margin-right: 0.5rem;
}

.typing-text {
  border-right: 2px solid var(--neon-green);
  padding-right: 4px;
  animation: typing-cursor 0.8s step-end infinite;
}

@keyframes typing-cursor {
  0%, 100% { border-color: var(--neon-green); }
  50% { border-color: transparent; }
}

.status-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.online {
  background: var(--neon-green);
  box-shadow: 0 0 10px var(--neon-green);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-label {
  color: var(--text-secondary);
}

.status-value {
  color: var(--text-primary);
  font-weight: 600;
}

.status-divider {
  color: var(--border-color);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-wide {
    grid-column: span 2;
  }
}

/* Terminal Panel */
.terminal-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.terminal-panel:hover {
  border-color: rgba(0, 255, 242, 0.3);
  box-shadow: 0 0 30px rgba(0, 255, 242, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
  border-bottom: 1px solid var(--border-color);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ascii-icon {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.panel-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.panel-desc {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Add buttons */
.btn-add {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.btn-cyan {
  border: 2px solid var(--neon-cyan);
  color: var(--neon-cyan);
}

.btn-cyan:hover {
  background: var(--neon-cyan);
  color: var(--bg-dark);
  box-shadow: 0 0 20px var(--neon-cyan);
}

.btn-green {
  border: 2px solid var(--neon-green);
  color: var(--neon-green);
}

.btn-green:hover {
  background: var(--neon-green);
  color: var(--bg-dark);
  box-shadow: 0 0 20px var(--neon-green);
}

.btn-pink {
  border: 2px solid var(--neon-pink);
  color: var(--neon-pink);
}

.btn-pink:hover {
  background: var(--neon-pink);
  color: var(--bg-dark);
  box-shadow: 0 0 20px var(--neon-pink);
}

.btn-gold {
  border: 2px solid var(--neon-gold);
  color: var(--neon-gold);
}

.btn-gold:hover {
  background: var(--neon-gold);
  color: var(--bg-dark);
  box-shadow: 0 0 20px var(--neon-gold);
}

/* Count badges */
.count-badge {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.badge-cyan {
  background: rgba(0, 255, 242, 0.15);
  color: var(--neon-cyan);
  border: 1px solid rgba(0, 255, 242, 0.3);
}

.badge-green {
  background: rgba(57, 255, 20, 0.15);
  color: var(--neon-green);
  border: 1px solid rgba(57, 255, 20, 0.3);
}

.badge-pink {
  background: rgba(255, 0, 255, 0.15);
  color: var(--neon-pink);
  border: 1px solid rgba(255, 0, 255, 0.3);
}

.badge-gold {
  background: rgba(255, 215, 0, 0.15);
  color: var(--neon-gold);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

/* Panel body */
.panel-body {
  padding: 1rem 1.25rem;
}

/* Card grid */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1536px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.card-grid-tournaments {
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .card-grid-tournaments {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid-tournaments {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Neon text colors */
.text-neon-cyan { color: var(--neon-cyan); }
.text-neon-green { color: var(--neon-green); }
.text-neon-pink { color: var(--neon-pink); }
.text-neon-gold { color: var(--neon-gold); }
.text-neon-red { color: var(--neon-red); }

/* Mobile optimizations */
@media (max-width: 640px) {
  .dashboard-content {
    padding: 0.75rem;
  }

  .header-content {
    padding: 1rem;
  }

  .terminal-bar {
    padding: 0.5rem 0.75rem;
  }

  .terminal-title {
    font-size: 0.7rem;
  }

  .glitch-text {
    letter-spacing: 1px;
  }

  .status-bar {
    font-size: 0.65rem;
    padding: 0.5rem 0.75rem;
  }

  .panel-header {
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .panel-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .panel-body {
    padding: 0.75rem 1rem;
  }

  .dashboard-grid {
    gap: 1rem;
  }
}
</style>
