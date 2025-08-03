<template>
  <div class="player-leaderboard">
    <!-- Desktop Layout -->
    <div class="desktop-layout" v-if="!isMobile">
      <div class="teams-container">
        <div 
          v-for="team in teamGroups" 
          :key="team.teamName"
          class="team-column"
          :class="`team-${team.teamName.toLowerCase()}`"
        >
          <!-- Team Header -->
          <div class="team-header">
            <div class="team-name">
              <span class="team-icon">🛡️</span>
              {{ team.teamName }}
            </div>
            <div class="team-stats">
              <div class="team-stat">
                <span class="stat-label">Score</span>
                <span class="stat-value">{{ team.totalScore.toLocaleString() }}</span>
              </div>
              <div class="team-stat">
                <span class="stat-label"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></span>
                <span class="stat-value">{{ calculateKDR(team.totalKills, team.totalDeaths) }}</span>
              </div>
            </div>
          </div>

          <!-- Team Players -->
          <div class="team-players">
            <div class="players-header">
              <div class="header-rank">#</div>
              <div class="header-player">Player</div>
              <div class="header-score">Score</div>
              <div class="header-kd"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></div>
              <div class="header-ping">Ping</div>
            </div>
            
            <div class="players-list">
              <div
                v-for="player in team.players"
                :key="player.name"
                class="player-row"
                :class="{ 
                  'top-player': player.rank === 1,
                  'pinned-player': pinnedPlayers?.has(player.name)
                }"
              >
                <div class="player-rank">
                  <span v-if="player.rank === 1" class="rank-medal">🥇</span>
                  <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
                  <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
                  <span v-else class="rank-number">{{ player.rank }}</span>
                </div>
                <div class="player-name">
                  <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
                    <PlayerName :name="player.playerName" :source="source" :server-guid="serverGuid" />
                  </router-link>
                  <button
                    v-if="showPinButtons"
                    class="pin-player-btn"
                    :title="pinnedPlayers?.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                    @click.stop="onPinToggle(player.playerName)"
                  >
                    <span v-if="pinnedPlayers?.has(player.playerName)">📌</span>
                    <span v-else>📍</span>
                  </button>
                  <span v-if="showPinButtons && pinnedPlayers?.has(player.playerName)" class="pinned-badge">Pinned</span>
                </div>
                <div class="player-score">{{ player.score.toLocaleString() }}</div>
                <div class="player-kd">
                  <span class="kills">{{ player.kills }}</span>
                  <span class="separator">/</span>
                  <span class="deaths">{{ player.deaths }}</span>
                </div>
                <div class="player-ping" :class="{ 
                  'ping-good': player.ping < 50, 
                  'ping-ok': player.ping >= 50 && player.ping < 100,
                  'ping-bad': player.ping >= 100
                }">
                  {{ player.ping }}ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="mobile-layout" v-else>
      <!-- Mobile Team Tabs -->
      <div class="mobile-team-tabs" v-if="teamGroups.length > 1">
        <div class="tab-buttons">
          <button 
            v-for="(team, index) in teamGroups" 
            :key="team.teamName"
            class="tab-button"
            :class="{ 'active': selectedTeamTab === index }"
            @click="selectedTeamTab = index"
          >
            <span class="team-icon">🛡️</span>
            {{ team.teamName }}
            <span class="team-score-badge">{{ team.totalScore.toLocaleString() }}</span>
          </button>
        </div>
        <div class="tab-content">
          <div 
            v-for="(team, index) in teamGroups" 
            :key="team.teamName"
            v-show="selectedTeamTab === index"
            class="team-column mobile-tab-panel"
            :class="`team-${team.teamName.toLowerCase()}`"
          >
            <!-- Team Header -->
            <div class="team-header">
              <div class="team-name">
                <span class="team-icon">🛡️</span>
                {{ team.teamName }}
              </div>
              <div class="team-stats">
                <div class="team-stat">
                  <span class="stat-label">Score</span>
                  <span class="stat-value">{{ team.totalScore.toLocaleString() }}</span>
                </div>
                <div class="team-stat">
                  <span class="stat-label"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></span>
                  <span class="stat-value">{{ calculateKDR(team.totalKills, team.totalDeaths) }}</span>
                </div>
              </div>
            </div>

            <!-- Team Players -->
            <div class="team-players">
              <div class="players-header">
                <div class="header-rank">#</div>
                <div class="header-player">Player</div>
                <div class="header-score">Score</div>
                <div class="header-kd"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></div>
                <div class="header-ping">Ping</div>
              </div>
              
              <div class="players-list">
                <div
                  v-for="player in team.players"
                  :key="player.name"
                  class="player-row"
                  :class="{ 
                    'top-player': player.rank === 1,
                    'pinned-player': pinnedPlayers?.has(player.name)
                  }"
                >
                  <div class="player-rank">
                    <span v-if="player.rank === 1" class="rank-medal">🥇</span>
                    <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
                    <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
                    <span v-else class="rank-number">{{ player.rank }}</span>
                  </div>
                  <div class="player-name">
                    <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
                      <PlayerName :name="player.playerName" :source="source" :server-guid="serverGuid" />
                    </router-link>
                    <button
                      v-if="showPinButtons"
                      class="pin-player-btn"
                      :title="pinnedPlayers?.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                      @click.stop="onPinToggle(player.playerName)"
                    >
                      <span v-if="pinnedPlayers?.has(player.playerName)">📌</span>
                      <span v-else>📍</span>
                    </button>
                    <span v-if="showPinButtons && pinnedPlayers?.has(player.playerName)" class="pinned-badge">Pinned</span>
                  </div>
                  <div class="player-score">{{ player.score.toLocaleString() }}</div>
                  <div class="player-kd">
                    <div class="kd-section">
                      <span class="kd-label"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></span>
                      <span class="kd-values">
                        <span class="kills">{{ player.kills }}</span>
                        <span class="separator">/</span>
                        <span class="deaths">{{ player.deaths }}</span>
                      </span>
                    </div>
                    <div class="ping-section">
                      <span class="ping-label">Ping:</span>
                      <span class="player-ping" :class="{ 
                        'ping-good': player.ping < 50, 
                        'ping-ok': player.ping >= 50 && player.ping < 100,
                        'ping-bad': player.ping >= 100
                      }">
                        {{ player.ping }}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Single Column Layout for All Players (when no teams or single team) -->
      <div class="single-column-layout" v-else>
        <div class="players-header">
          <div class="header-rank">#</div>
          <div class="header-team">Team</div>
          <div class="header-player">Player</div>
          <div class="header-score">Score</div>
          <div class="header-kd"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></div>
          <div class="header-ping">Ping</div>
        </div>
        
        <div class="players-list">
          <div
            v-for="player in allPlayersSorted"
            :key="player.name"
            class="player-row"
            :class="{ 
              'top-player': player.rank === 1,
              'pinned-player': pinnedPlayers?.has(player.name)
            }"
          >
            <div class="player-rank">
              <span v-if="player.rank === 1" class="rank-medal">🥇</span>
              <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
              <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
              <span v-else class="rank-number">{{ player.rank }}</span>
            </div>
            <div class="player-team">
              <span class="team-badge">{{ player.teamLabel }}</span>
            </div>
            <div class="player-name">
              <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
                <PlayerName :name="player.playerName" :source="source" :server-guid="serverGuid" />
              </router-link>
              <button
                v-if="showPinButtons"
                class="pin-player-btn"
                :title="pinnedPlayers?.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                @click.stop="onPinToggle(player.playerName)"
              >
                <span v-if="pinnedPlayers?.has(player.playerName)">📌</span>
                <span v-else>📍</span>
              </button>
              <span v-if="showPinButtons && pinnedPlayers?.has(player.playerName)" class="pinned-badge">Pinned</span>
            </div>
            <div class="player-score">{{ player.score.toLocaleString() }}</div>
            <div class="player-kd">
              <span class="kills">{{ player.kills }}</span>
              <span class="separator">/</span>
              <span class="deaths">{{ player.deaths }}</span>
            </div>
            <div class="player-ping" :class="{ 
              'ping-good': player.ping < 50, 
              'ping-ok': player.ping >= 50 && player.ping < 100,
              'ping-bad': player.ping >= 100
            }">
              {{ player.ping }}ms
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import PlayerName from './PlayerName.vue';

interface Player {
  name?: string;
  playerName?: string;
  score: number;
  kills: number;
  deaths: number;
  ping: number;
  team: number;
  teamLabel: string;
}

interface PlayerWithRank extends Player {
  rank: number;
  playerName: string;
}

interface TeamGroup {
  teamName: string;
  players: Player[];
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
}

interface Props {
  players: Player[];
  teams?: Array<{ index: number; label: string }>;
  pinnedPlayers?: Set<string>;
  source?: string;
  serverGuid?: string;
  showPinButtons?: boolean;
  onPinToggle?: (playerName: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  teams: () => [],
  pinnedPlayers: () => new Set(),
  source: 'leaderboard',
  serverGuid: undefined,
  showPinButtons: false,
  onPinToggle: () => {}
});

const selectedTeamTab = ref(0);
const isMobile = ref(false);

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Check if mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Group players by team
const teamGroups = computed(() => {
  if (!props.players.length) return [];
  
  // First, sort players by score (descending) and assign ranks
  const sortedPlayers = [...props.players].sort((a, b) => b.score - a.score);
  const playersWithRank: PlayerWithRank[] = sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
    // Handle empty teamLabel by looking it up in teams array
    teamLabel: player.teamLabel || props.teams.find(t => t.index === player.team)?.label || 'Unknown',
    // Ensure we have a valid player name
    playerName: player.name || player.playerName || 'Unknown'
  }));
  
  const groups = playersWithRank.reduce((acc, player) => {
    if (!acc[player.teamLabel]) {
      acc[player.teamLabel] = [];
    }
    acc[player.teamLabel].push(player);
    return acc;
  }, {} as Record<string, PlayerWithRank[]>);
  
  // Sort each team by rank
  Object.values(groups).forEach(team => {
    team.sort((a, b) => a.rank - b.rank);
  });
  
  return Object.entries(groups).map(([teamName, players]) => ({
    teamName,
    players,
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    totalKills: players.reduce((sum, player) => sum + player.kills, 0),
    totalDeaths: players.reduce((sum, player) => sum + player.deaths, 0)
  }));
});

// All players sorted by score for single column layout
const allPlayersSorted = computed(() => {
  if (!props.players.length) return [];
  
  const sortedPlayers = [...props.players].sort((a, b) => b.score - a.score);
  return sortedPlayers.map((player, index): PlayerWithRank => ({
    ...player,
    rank: index + 1,
    teamLabel: player.teamLabel || props.teams.find(t => t.index === player.team)?.label || 'Unknown',
    // Ensure we have a valid player name
    playerName: player.name || player.playerName || 'Unknown'
  }));
});

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.player-leaderboard {
  width: 100%;
}

/* Desktop Layout */
.desktop-layout {
  display: block;
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.team-column {
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
}

.team-header {
  padding: 15px;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.team-name {
  font-weight: bold;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-icon {
  font-size: 1.1rem;
}

.team-stats {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.team-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-weight: bold;
  color: var(--color-primary);
}

.team-players {
  padding: 0;
}

.players-header {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px 60px;
  gap: 10px;
  padding: 12px 15px;
  background: var(--color-background-mute);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.players-list {
  overflow-y: auto;
}

.player-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px 60px;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-border);
}

.player-row:hover {
  background: var(--color-background-soft);
}

.player-row.top-player {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.player-row.pinned-player {
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
}

.player-rank {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank-medal {
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.rank-number {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-background-mute);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-name {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-link {
  color: var(--color-primary);
  text-decoration: none;
}

.player-link:hover {
  text-decoration: underline;
}

.pin-player-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--color-text-muted);
  transition: color 0.2s ease;
  padding: 0 4px;
  display: flex;
  align-items: center;
}

.pin-player-btn:hover {
  color: var(--color-primary);
}

.pinned-badge {
  background: var(--color-primary);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  margin-left: 8px;
}

.player-score {
  text-align: center;
  font-weight: 500;
}

.player-kd {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.kills {
  color: #4caf50;
  font-weight: 600;
}

.separator {
  color: var(--color-text-muted);
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

.player-ping {
  text-align: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.ping-good {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.ping-ok {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.ping-bad {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

/* Mobile Layout */
.mobile-layout {
  display: none;
}

/* Mobile Team Tabs */
.mobile-team-tabs {
  width: 100%;
}

.tab-buttons {
  display: flex;
  background: var(--color-background-mute);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 12px;
  gap: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  white-space: nowrap;
}

.tab-button.active {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-button:hover:not(.active) {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.team-score-badge {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.8;
}

.tab-button.active .team-score-badge {
  opacity: 1;
}

.tab-content {
  min-height: 400px;
}

.mobile-tab-panel {
  width: 100%;
  margin: 0;
}

/* Single Column Layout */
.single-column-layout {
  width: 100%;
}

.single-column-layout .players-header {
  display: grid;
  grid-template-columns: 30px 60px 1fr 70px 60px 60px;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.75rem;
}

.single-column-layout .player-row {
  display: grid;
  grid-template-columns: 30px 60px 1fr 70px 60px 60px;
  gap: 8px;
  padding: 10px 12px;
  font-size: 0.9rem;
}

.player-team {
  display: flex;
  align-items: center;
}

.team-badge {
  background: var(--color-background-mute);
  color: var(--color-text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

/* Mobile leaderboard layout - ultra compact rows */
.mobile-team-tabs .players-header {
  display: grid;
  grid-template-columns: 20px 1fr 50px;
  gap: 4px;
  padding: 4px 6px;
  font-size: 0.65rem;
  min-height: 24px;
}

.mobile-team-tabs .header-kd,
.mobile-team-tabs .header-ping {
  display: none;
}

.mobile-team-tabs .player-row {
  display: grid;
  grid-template-columns: 20px 1fr 50px;
  gap: 4px;
  padding: 4px 6px;
  font-size: 0.8rem;
  min-height: 28px;
  border-bottom: 1px solid var(--color-border);
}

.mobile-team-tabs .player-row .player-kd,
.mobile-team-tabs .player-row .player-ping {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  margin-top: 2px;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
}

.mobile-team-tabs .player-row .player-kd {
  border-top: none;
  justify-content: space-between;
  gap: 6px;
  background: var(--color-background-mute);
  padding: 2px 4px;
  border-radius: 3px;
  margin-top: 2px;
}

.kd-section,
.ping-section {
  display: flex;
  align-items: center;
  gap: 2px;
}

.kd-label,
.ping-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--color-text-muted);
  line-height: 1;
}

.kd-values {
  display: flex;
  align-items: center;
  gap: 1px;
}

/* Single Column Layout - ultra compact */
.single-column-layout .players-header {
  display: grid;
  grid-template-columns: 20px 40px 1fr 50px 40px 40px;
  gap: 4px;
  padding: 4px 6px;
  font-size: 0.65rem;
  min-height: 24px;
}

.single-column-layout .player-row {
  display: grid;
  grid-template-columns: 20px 40px 1fr 50px 40px 40px;
  gap: 4px;
  padding: 4px 6px;
  font-size: 0.8rem;
  min-height: 28px;
  border-bottom: 1px solid var(--color-border);
}

.player-team {
  display: flex;
  align-items: center;
}

.team-badge {
  background: var(--color-background-mute);
  color: var(--color-text-muted);
  padding: 1px 3px;
  border-radius: 2px;
  font-size: 0.6rem;
  font-weight: 500;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .desktop-layout {
    display: none;
  }
  
  .mobile-layout {
    display: block;
  }
  
  .mobile-team-tabs {
    display: block;
  }
  
  .single-column-layout {
    display: block;
  }
}

@media (max-width: 480px) {
  .tab-button {
    font-size: 0.7rem;
    padding: 4px 3px;
    min-width: 60px;
  }

  .team-score-badge {
    font-size: 0.6rem;
  }

  .tab-content {
    min-height: 300px;
  }

  .mobile-team-tabs .players-header {
    grid-template-columns: 18px 1fr 45px;
    gap: 3px;
    padding: 3px 4px;
    font-size: 0.6rem;
    min-height: 20px;
  }

  .mobile-team-tabs .player-row {
    grid-template-columns: 18px 1fr 45px;
    gap: 3px;
    padding: 3px 4px;
    font-size: 0.75rem;
    min-height: 24px;
  }

  .mobile-team-tabs .player-row .player-kd {
    font-size: 0.65rem;
    gap: 3px;
  }

  .kd-label,
  .ping-label {
    font-size: 0.55rem;
  }

  .single-column-layout .players-header {
    grid-template-columns: 18px 35px 1fr 45px 35px 35px;
    gap: 3px;
    padding: 3px 4px;
    font-size: 0.6rem;
    min-height: 20px;
  }

  .single-column-layout .player-row {
    grid-template-columns: 18px 35px 1fr 45px 35px 35px;
    gap: 3px;
    padding: 3px 4px;
    font-size: 0.75rem;
    min-height: 24px;
  }

  .team-badge {
    font-size: 0.55rem;
    padding: 1px 2px;
  }
}

@media (max-width: 360px) {
  .tab-button {
    font-size: 0.65rem;
    padding: 3px 2px;
    min-width: 50px;
  }

  .team-score-badge {
    font-size: 0.55rem;
  }

  .tab-content {
    min-height: 250px;
  }

  .mobile-team-tabs .players-header {
    grid-template-columns: 16px 1fr 40px;
    gap: 2px;
    padding: 2px 3px;
    font-size: 0.55rem;
    min-height: 18px;
  }

  .mobile-team-tabs .player-row {
    grid-template-columns: 16px 1fr 40px;
    gap: 2px;
    padding: 2px 3px;
    font-size: 0.7rem;
    min-height: 20px;
  }

  .mobile-team-tabs .player-row .player-kd {
    font-size: 0.6rem;
    gap: 2px;
  }

  .kd-label,
  .ping-label {
    font-size: 0.5rem;
  }

  .single-column-layout .players-header {
    grid-template-columns: 16px 30px 1fr 40px 30px 30px;
    gap: 2px;
    padding: 2px 3px;
    font-size: 0.55rem;
    min-height: 18px;
  }

  .single-column-layout .player-row {
    grid-template-columns: 16px 30px 1fr 40px 30px 30px;
    gap: 2px;
    padding: 2px 3px;
    font-size: 0.7rem;
    min-height: 20px;
  }

  .team-badge {
    font-size: 0.5rem;
    padding: 1px 2px;
  }

  /* Ultra compact rank indicators */
  .rank-medal {
    font-size: 0.8rem;
  }

  .rank-number {
    width: 16px;
    height: 16px;
    font-size: 0.65rem;
  }

  /* Reduce player name font size */
  .player-name {
    font-size: 0.7rem;
  }

  /* Compact pin buttons */
  .pin-player-btn {
    font-size: 0.9rem;
    padding: 0 2px;
  }

  .pinned-badge {
    font-size: 0.55rem;
    padding: 1px 3px;
    margin-left: 4px;
  }
}

.kdr-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

@media (max-width: 768px) {
  .kdr-icon {
    width: 20px;
    height: 20px;
    margin-right: 2px;
  }
}

@media (max-width: 480px) {
  .kdr-icon {
    width: 18px;
    height: 18px;
    margin-right: 1px;
  }
}
</style> 