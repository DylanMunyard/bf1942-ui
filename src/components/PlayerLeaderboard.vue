<template>
  <div class="player-leaderboard">
    <!-- Desktop Layout -->
    <div
      v-if="!isMobile"
      class="desktop-layout"
    >
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
                <span class="stat-label">K/D</span>
                <span class="stat-value">{{ calculateKDR(team.totalKills, team.totalDeaths) }}</span>
              </div>
            </div>
          </div>

          <!-- Team Players -->
          <div class="team-players">
            <div class="players-header">
              <div class="header-rank">
                #
              </div>
              <div class="header-player">
                Player
              </div>
              <div class="header-score">
                Score
              </div>
              <div class="header-kd">
                K/D
              </div>
              <div class="header-ping">
                Ping
              </div>
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
                  <span
                    v-if="player.rank === 1"
                    class="rank-medal"
                  >🥇</span>
                  <span
                    v-else-if="player.rank === 2"
                    class="rank-medal"
                  >🥈</span>
                  <span
                    v-else-if="player.rank === 3"
                    class="rank-medal"
                  >🥉</span>
                  <span
                    v-else
                    class="rank-number"
                  >{{ player.rank }}</span>
                </div>
                <div class="player-name">
                  <router-link
                    :to="`/players/${encodeURIComponent(player.playerName)}`"
                    class="player-link"
                  >
                    <PlayerName
                      :name="player.playerName"
                      :source="source"
                      :server-guid="serverGuid"
                    />
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
                  <span
                    v-if="showPinButtons && pinnedPlayers?.has(player.playerName)"
                    class="pinned-badge"
                  >Pinned</span>
                </div>
                <div class="player-score">
                  {{ player.score.toLocaleString() }}
                </div>
                <div class="player-kd">
                  <span class="kills">{{ player.kills }}</span>
                  <span class="separator">/</span>
                  <span class="deaths">{{ player.deaths }}</span>
                </div>
                <div
                  class="player-ping"
                  :class="{ 
                    'ping-good': player.ping < 50, 
                    'ping-ok': player.ping >= 50 && player.ping < 100,
                    'ping-bad': player.ping >= 100
                  }"
                >
                  {{ player.ping }}ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div
      v-else
      class="mobile-layout"
    >
      <!-- Mobile Team Tabs -->
      <div
        v-if="teamGroups.length > 1"
        class="mobile-team-tabs"
      >
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
            v-show="selectedTeamTab === index"
            :key="team.teamName"
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
                  <span class="stat-label">K/D</span>
                  <span class="stat-value">{{ calculateKDR(team.totalKills, team.totalDeaths) }}</span>
                </div>
              </div>
            </div>

            <!-- Team Players -->
            <div class="team-players">
              <div class="players-header">
                <div class="header-rank">
                  #
                </div>
                <div class="header-player">
                  Player
                </div>
                <div class="header-score">
                  Score
                </div>
                <div class="header-kd">
                  K/D
                </div>
                <div class="header-ping">
                  Ping
                </div>
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
                    <span
                      v-if="player.rank === 1"
                      class="rank-medal"
                    >🥇</span>
                    <span
                      v-else-if="player.rank === 2"
                      class="rank-medal"
                    >🥈</span>
                    <span
                      v-else-if="player.rank === 3"
                      class="rank-medal"
                    >🥉</span>
                    <span
                      v-else
                      class="rank-number"
                    >{{ player.rank }}</span>
                  </div>
                  <div class="player-name">
                    <router-link
                      :to="`/players/${encodeURIComponent(player.playerName)}`"
                      class="player-link"
                    >
                      <PlayerName
                        :name="player.playerName"
                        :source="source"
                        :server-guid="serverGuid"
                      />
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
                    <span
                      v-if="showPinButtons && pinnedPlayers?.has(player.playerName)"
                      class="pinned-badge"
                    >Pinned</span>
                  </div>
                  <div class="player-score">
                    {{ player.score.toLocaleString() }}
                  </div>
                  <div class="player-kd">
                    <div class="kd-section">
                      <span class="kd-label">K/D</span>
                      <span class="kd-values">
                        <span class="kills">{{ player.kills }}</span>
                        <span class="separator">/</span>
                        <span class="deaths">{{ player.deaths }}</span>
                      </span>
                    </div>
                    <div class="ping-section">
                      <span class="ping-label">Ping:</span>
                      <span
                        class="player-ping"
                        :class="{ 
                          'ping-good': player.ping < 50, 
                          'ping-ok': player.ping >= 50 && player.ping < 100,
                          'ping-bad': player.ping >= 100
                        }"
                      >
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
      <div
        v-else
        class="single-column-layout"
      >
        <div class="players-header">
          <div class="header-rank">
            #
          </div>
          <div class="header-team">
            Team
          </div>
          <div class="header-player">
            Player
          </div>
          <div class="header-score">
            Score
          </div>
          <div class="header-kd">
            K/D
          </div>
          <div class="header-ping">
            Ping
          </div>
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
              <span
                v-if="player.rank === 1"
                class="rank-medal"
              >🥇</span>
              <span
                v-else-if="player.rank === 2"
                class="rank-medal"
              >🥈</span>
              <span
                v-else-if="player.rank === 3"
                class="rank-medal"
              >🥉</span>
              <span
                v-else
                class="rank-number"
              >{{ player.rank }}</span>
            </div>
            <div class="player-team">
              <span class="team-badge">{{ player.teamLabel }}</span>
            </div>
            <div class="player-name">
              <router-link
                :to="`/players/${encodeURIComponent(player.playerName)}`"
                class="player-link"
              >
                <PlayerName
                  :name="player.playerName"
                  :source="source"
                  :server-guid="serverGuid"
                />
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
              <span
                v-if="showPinButtons && pinnedPlayers?.has(player.playerName)"
                class="pinned-badge"
              >Pinned</span>
            </div>
            <div class="player-score">
              {{ player.score.toLocaleString() }}
            </div>
            <div class="player-kd">
              <span class="kills">{{ player.kills }}</span>
              <span class="separator">/</span>
              <span class="deaths">{{ player.deaths }}</span>
            </div>
            <div
              class="player-ping"
              :class="{ 
                'ping-good': player.ping < 50, 
                'ping-ok': player.ping >= 50 && player.ping < 100,
                'ping-bad': player.ping >= 100
              }"
            >
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
import { calculateKDR } from '@/utils/statsUtils';

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


interface Props {
  players: Player[];
  teams?: Array<{ index: number; label: string }>;
  pinnedPlayers?: Set<string>;
  source?: string;
  serverGuid?: string;
  showPinButtons?: boolean;
  onPinToggle?: (_playerName: string) => void;
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

<style scoped src="./PlayerLeaderboard.vue.css"></style> 