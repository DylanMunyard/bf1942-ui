<script setup lang="ts">
import { ref, computed } from 'vue';
import PlayerName from '../PlayerName.vue';

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  kills: number;
  deaths: number;
  ping: number;
  teamLabel: string;
}

interface TeamGroup {
  teamName: string;
  players: LeaderboardEntry[];
  totalScore: number;
  totalKills: number;
  totalDeaths: number;
}

interface Props {
  teamGroups: TeamGroup[];
  pinnedPlayers: Set<string>;
  serverGuid: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'toggle-player-pin': [playerName: string];
}>();

const selectedTeamTab = ref(0);

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Create unified player list for mobile single-column view
const unifiedPlayerList = computed(() => {
  const allPlayers: (LeaderboardEntry & { teamName: string })[] = [];
  
  props.teamGroups.forEach(team => {
    team.players.forEach(player => {
      allPlayers.push({
        ...player,
        teamName: team.teamName
      });
    });
  });
  
  // Sort by score descending
  return allPlayers.sort((a, b) => b.score - a.score);
});
</script>

<template>
  <div v-if="teamGroups.length" class="team-leaderboard">
    <!-- Mobile Single Column View -->
    <div class="mobile-unified-view">
      <div class="unified-players-list">
        <div class="players-header-unified">
          <div class="header-rank">#</div>
          <div class="header-player">Player</div>
          <div class="header-team">Team</div>
          <div class="header-score">Score</div>
        </div>
        
        <div class="players-list-unified">
          <div
            v-for="(player, index) in unifiedPlayerList"
            :key="player.playerName"
            class="player-row-unified"
            :class="{
              'top-player': index === 0,
              'pinned-player-row': pinnedPlayers.has(player.playerName)
            }"
          >
            <div class="player-rank">
              <span v-if="index === 0" class="rank-medal">🥇</span>
              <span v-else-if="index === 1" class="rank-medal">🥈</span>
              <span v-else-if="index === 2" class="rank-medal">🥉</span>
              <span v-else class="rank-number">{{ index + 1 }}</span>
            </div>
            <div class="player-name">
              <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
                <PlayerName :name="player.playerName" source="round-report" :server-guid="serverGuid" />
              </router-link>
              <button
                class="pin-player-btn"
                :title="pinnedPlayers.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                @click.stop="$emit('toggle-player-pin', player.playerName)"
              >
                <span v-if="pinnedPlayers.has(player.playerName)">📌</span>
                <span v-else>📍</span>
              </button>
            </div>
            <div class="player-team" :class="`team-${player.teamName.toLowerCase()}-indicator`">
              {{ player.teamName }}
            </div>
            <div class="player-score">{{ player.score.toLocaleString() }}</div>
            <!-- Expandable details on mobile -->
            <div class="player-details-mobile">
              <div class="detail-item">
                <span class="detail-label">K/D:</span>
                <span class="detail-value">
                  <span class="kills">{{ player.kills }}</span>/<span class="deaths">{{ player.deaths }}</span>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Ping:</span>
                <span class="detail-value player-ping" :class="{ 
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

    <!-- Mobile Team Tabs (Fallback - Hidden by default) -->
    <div class="mobile-team-tabs" style="display: none;">
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
                :key="player.playerName"
                class="player-row"
                :class="{
                  'top-player': player.rank === 1,
                  'pinned-player-row': pinnedPlayers.has(player.playerName)
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
                    <PlayerName :name="player.playerName" source="round-report" :server-guid="serverGuid" />
                  </router-link>
                  <button
                    class="pin-player-btn"
                    :title="pinnedPlayers.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                    @click.stop="$emit('toggle-player-pin', player.playerName)"
                  >
                    <span v-if="pinnedPlayers.has(player.playerName)">📌</span>
                    <span v-else>📍</span>
                  </button>
                  <span v-if="pinnedPlayers.has(player.playerName)" class="pinned-badge">Pinned</span>
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

    <!-- Desktop Teams Grid -->
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
              :key="player.playerName"
              class="player-row"
              :class="{
                'top-player': player.rank === 1,
                'pinned-player-row': pinnedPlayers.has(player.playerName)
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
                  <PlayerName :name="player.playerName" source="round-report" :server-guid="serverGuid" />
                </router-link>
                <button
                  class="pin-player-btn"
                  :title="pinnedPlayers.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                  @click.stop="$emit('toggle-player-pin', player.playerName)"
                >
                  <span v-if="pinnedPlayers.has(player.playerName)">📌</span>
                  <span v-else>📍</span>
                </button>
                <span v-if="pinnedPlayers.has(player.playerName)" class="pinned-badge">Pinned</span>
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
</template>

<style scoped>
.team-leaderboard {
  width: 100%;
}

/* Mobile unified view - Hidden on desktop */
.mobile-unified-view {
  display: none;
}

/* Mobile Team Tabs - Hidden on desktop */
.mobile-team-tabs {
  display: none;
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.team-column {
  background: var(--color-background-soft);
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
  padding: 8px 12px;
  background: var(--color-background-mute);
  font-size: 0.8rem;
  font-weight: 600;
}

.players-list {
  overflow-y: auto;
}

.player-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px 60px;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
}

.player-row:hover {
  background: var(--color-background-soft);
}

.player-row.top-player {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.player-rank {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank-medal {
  font-size: 1.2rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.rank-number {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-background-mute);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-name {
  font-weight: 500;
}

.player-link {
  color: var(--color-primary);
  text-decoration: none;
}

.player-link:hover {
  text-decoration: underline;
}

.player-score {
  text-align: center;
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
  font-family: monospace;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 6px;
  border-radius: 4px;
}

.ping-good {
  background: rgba(76, 175, 80, 0.2);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.4);
}

.ping-ok {
  background: rgba(255, 152, 0, 0.2);
  color: #e65100;
  border: 1px solid rgba(255, 152, 0, 0.4);
}

.ping-bad {
  background: rgba(244, 67, 54, 0.2);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.4);
}

.pin-player-btn {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 6px;
  font-size: 1rem;
  color: #ffd600;
  transition: color 0.2s;
}

.pin-player-btn:hover {
  color: #ffab00;
}

.pinned-badge {
  background: #ffd600;
  color: #000;
  border-radius: 6px;
  padding: 2px 6px;
  margin-left: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.player-row.pinned-player-row {
  background: linear-gradient(90deg, #ffe082 0%, #fffde7 100%);
  border-left: 4px solid #ffd600;
  color: #1a1a1a;
}

.kdr-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .player-link {
    color: #90caf9;
  }
  
  .player-row.pinned-player-row {
    color: #1a1a1a;
  }
  
  .player-row.pinned-player-row .player-link {
    color: #1a1a1a;
    font-weight: 600;
  }
  
  .ping-good {
    background: rgba(76, 175, 80, 0.3);
    color: #81c784;
    border: 1px solid rgba(76, 175, 80, 0.5);
  }
  
  .ping-ok {
    background: rgba(255, 152, 0, 0.3);
    color: #ffb74d;
    border: 1px solid rgba(255, 152, 0, 0.5);
  }
  
  .ping-bad {
    background: rgba(244, 67, 54, 0.3);
    color: #e57373;
    border: 1px solid rgba(244, 67, 54, 0.5);
  }
  
  .pinned-badge {
    background: #ffd700;
    color: #1a1a1a;
  }
}

html[data-theme="dark"] .player-link,
.dark-mode .player-link {
  color: #90caf9;
}

html[data-theme="dark"] .player-row.pinned-player-row,
.dark-mode .player-row.pinned-player-row {
  color: #1a1a1a;
}

html[data-theme="dark"] .pinned-badge,
.dark-mode .pinned-badge {
  background: #ffd700;
  color: #1a1a1a;
}

/* Mobile responsive design */
@media (max-width: 768px) {
  /* Show mobile unified view, hide desktop grid */
  .mobile-unified-view {
    display: block;
  }
  
  .teams-container {
    display: none;
  }
  
  .mobile-team-tabs {
    display: none !important;
  }
  
  /* Mobile unified player list styles */
  .unified-players-list {
    background: var(--color-background-soft);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid var(--color-border);
  }
  
  .players-header-unified {
    display: grid;
    grid-template-columns: 35px 1fr 60px 70px;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-background-mute);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
  }
  
  .players-list-unified {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .player-row-unified {
    display: grid;
    grid-template-columns: 35px 1fr 60px 70px;
    gap: 8px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.85rem;
    transition: background-color 0.2s;
  }
  
  .player-row-unified:hover {
    background: var(--color-background-mute);
  }
  
  .player-row-unified:last-child {
    border-bottom: none;
  }
  
  .player-row-unified.top-player {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
  }
  
  .player-team {
    font-size: 0.7rem;
    font-weight: 600;
    text-align: center;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid;
  }
  
  .team-allies-indicator {
    background: rgba(76, 175, 80, 0.1);
    color: #2e7d32;
    border-color: rgba(76, 175, 80, 0.3);
  }
  
  .team-axis-indicator {
    background: rgba(244, 67, 54, 0.1);
    color: #c62828;
    border-color: rgba(244, 67, 54, 0.3);
  }
  
  /* Fallback for other team names */
  .player-team:not(.team-allies-indicator):not(.team-axis-indicator) {
    background: var(--color-background-mute);
    color: var(--color-text);
    border-color: var(--color-border);
  }
  
  .player-details-mobile {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    margin-top: 4px;
    font-size: 0.75rem;
    background: var(--color-background-mute);
    border-radius: 4px;
    padding: 6px 8px;
  }
  
  .detail-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .detail-label {
    color: var(--color-text-muted);
    font-weight: 500;
  }
  
  .detail-value {
    font-weight: 600;
  }
  
  .player-row-unified .rank-number {
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
  }
  
  .player-row-unified .rank-medal {
    font-size: 1rem;
  }
  
  .player-row-unified .pin-player-btn {
    font-size: 0.8rem;
    margin-left: 4px;
  }
  
  /* Mobile tab styles */
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
  
  .mobile-tab-panel {
    width: 100%;
    margin: 0;
  }
  
  /* Mobile player layout adjustments */
  .players-header {
    grid-template-columns: 30px 1fr 70px;
    gap: 8px;
    padding: 8px 12px;
    font-size: 0.75rem;
  }
  
  .header-kd,
  .header-ping {
    display: none;
  }
  
  .player-row {
    grid-template-columns: 30px 1fr 70px;
    gap: 8px;
    padding: 10px 12px;
    font-size: 0.9rem;
  }
  
  .player-row .player-kd,
  .player-row .player-ping {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    margin-top: 4px;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  
  .player-row .player-kd {
    justify-content: space-between;
    gap: 8px;
    background: var(--color-background-mute);
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 6px;
  }
  
  .kd-section,
  .ping-section {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .kd-label,
  .ping-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }
  
  .kd-values {
    display: flex;
    align-items: center;
    gap: 2px;
  }
}

@media (max-width: 480px) {
  .players-header-unified {
    grid-template-columns: 30px 1fr 50px 60px;
    gap: 6px;
    padding: 6px 8px;
    font-size: 0.7rem;
  }
  
  .player-row-unified {
    grid-template-columns: 30px 1fr 50px 60px;
    gap: 6px;
    padding: 5px 8px;
    font-size: 0.8rem;
  }
  
  .player-team {
    font-size: 0.65rem;
    padding: 1px 4px;
  }
  
  .player-details-mobile {
    font-size: 0.7rem;
    padding: 4px 6px;
  }
  
  .player-row-unified .rank-number {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
  }
  
  .player-row-unified .rank-medal {
    font-size: 0.9rem;
  }
  
  .player-row-unified .pin-player-btn {
    font-size: 0.75rem;
  }
}
</style>