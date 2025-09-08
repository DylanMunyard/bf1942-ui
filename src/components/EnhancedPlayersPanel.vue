<template>
  <div
    v-if="show"
    class="players-panel-overlay"
    @click="$emit('close')"
  >
    <div
      class="players-panel"
      @click.stop
    >
      <div class="players-panel-header">
        <h2>{{ title || 'Players' }}</h2>
        <button
          class="close-btn"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>
      <div class="players-panel-content">
        <!-- Pinned Players Performance Chart (if any) -->
        <div
          v-if="pinnedPlayers && pinnedPlayers.size > 0 && showPerformanceChart"
          class="performance-chart-section"
        >
          <div class="pinned-players-info">
            <h3>📌 Pinned Players Performance</h3>
            <div class="pinned-players-badges">
              <div
                v-for="playerName in Array.from(pinnedPlayers)"
                :key="playerName"
                class="pinned-player-badge"
              >
                {{ playerName }}
              </div>
              <button
                v-if="pinnedPlayers.size > 1"
                class="clear-all-button"
                title="Clear all pinned players"
                @click="$emit('clear-pinned')"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Team Tabs (for small screens) -->
        <div class="mobile-team-tabs">
          <div class="tab-buttons">
            <button
              v-for="(team, index) in teamGroups"
              :key="team.teamName"
              class="tab-button"
              :class="{ active: selectedTeamIndex === index }"
              @click="selectedTeamIndex = index"
            >
              <div class="team-name">
                {{ team.teamName }}
              </div>
              <div class="team-score-badge">
                {{ team.totalScore }}
              </div>
            </button>
          </div>
          <div class="tab-content">
            <div
              v-if="teamGroups[selectedTeamIndex]"
              class="mobile-tab-panel"
            >
              <div class="team-section">
                <div class="team-header">
                  <span class="team-name">{{ teamGroups[selectedTeamIndex].teamName }}</span>
                  <div class="team-stats">
                    <div class="team-stat">
                      <span class="stat-label">Score</span>
                      <span class="stat-value">{{ teamGroups[selectedTeamIndex].totalScore }}</span>
                    </div>
                    <div class="team-stat">
                      <span class="stat-label">Kills</span>
                      <span class="stat-value">{{ teamGroups[selectedTeamIndex].totalKills }}</span>
                    </div>
                    <div class="team-stat">
                      <span class="stat-label">Deaths</span>
                      <span class="stat-value">{{ teamGroups[selectedTeamIndex].totalDeaths }}</span>
                    </div>
                  </div>
                </div>
                <div class="team-table-container">
                  <table class="players-table">
                    <thead>
                      <tr>
                        <th
                          class="sortable"
                          @click="sortPlayersBy('name')"
                        >
                          Player
                        </th>
                        <th
                          class="sortable"
                          @click="sortPlayersBy('score')"
                        >
                          Score
                        </th>
                        <th class="header-kd">
                          K/D
                        </th>
                        <th class="header-ping">
                          Ping
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="player in teamGroups[selectedTeamIndex].players"
                        :key="player.playerName || player.name"
                        class="player-table-row"
                        :class="{ 'pinned-player-row': pinnedPlayers && pinnedPlayers.has(player.playerName || player.name) }"
                        @click="navigateToPlayerProfile(player.playerName || player.name)"
                      >
                        <td class="player-name-cell">
                          {{ player.playerName || player.name }}
                          <button
                            v-if="showPinButtons"
                            class="pin-player-btn"
                            :title="pinnedPlayers && pinnedPlayers.has(player.playerName || player.name) ? 'Unpin player' : 'Pin player'"
                            @click.stop="togglePlayerPin(player.playerName || player.name)"
                          >
                            {{ pinnedPlayers && pinnedPlayers.has(player.playerName || player.name) ? '📌' : '📍' }}
                          </button>
                        </td>
                        <td
                          class="score-cell"
                          :class="getScoreClass(player.score)"
                        >
                          {{ player.score }}
                        </td>
                        <td class="player-kd">
                          <div class="kd-section">
                            <span class="kd-label">K/D:</span>
                            <div class="kd-values">
                              <span
                                class="kills"
                                :class="getKillsClass(player.kills)"
                              >{{ player.kills }}</span>
                              <span class="separator">/</span>
                              <span
                                class="deaths"
                                :class="getDeathsClass(player.deaths)"
                              >{{ player.deaths }}</span>
                            </div>
                          </div>
                        </td>
                        <td
                          class="player-ping"
                          :class="getPingClass(player.ping)"
                        >
                          <div class="ping-section">
                            <span class="ping-label">Ping:</span>
                            {{ player.ping }}ms
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Team Grid -->
        <div class="teams-container">
          <div
            v-for="team in teamGroups"
            :key="team.teamName"
            class="team-section"
          >
            <div class="team-header">
              <span class="team-name">{{ team.teamName }}</span>
              <div class="team-stats">
                <div class="team-stat">
                  <span class="stat-label">Score</span>
                  <span class="stat-value">{{ team.totalScore }}</span>
                </div>
                <div class="team-stat">
                  <span class="stat-label">Kills</span>
                  <span class="stat-value">{{ team.totalKills }}</span>
                </div>
                <div class="team-stat">
                  <span class="stat-label">Deaths</span>
                  <span class="stat-value">{{ team.totalDeaths }}</span>
                </div>
              </div>
            </div>
            <div class="team-table-container">
              <table class="players-table">
                <thead>
                  <tr>
                    <th
                      class="sortable"
                      @click="sortPlayersBy('rank')"
                    >
                      Rank
                    </th>
                    <th
                      class="sortable"
                      @click="sortPlayersBy('name')"
                    >
                      Player
                    </th>
                    <th
                      class="sortable"
                      @click="sortPlayersBy('score')"
                    >
                      Score
                    </th>
                    <th
                      class="sortable"
                      @click="sortPlayersBy('kills')"
                    >
                      K/D
                    </th>
                    <th
                      class="sortable"
                      @click="sortPlayersBy('ping')"
                    >
                      Ping
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="player in team.players"
                    :key="player.playerName || player.name"
                    class="player-table-row"
                    :class="{ 
                      'pinned-player-row': pinnedPlayers && pinnedPlayers.has(player.playerName || player.name),
                      'top-player': (player.rank || 0) <= 3 
                    }"
                    @click="navigateToPlayerProfile(player.playerName || player.name)"
                  >
                    <td class="player-rank">
                      <div
                        v-if="(player.rank || 0) === 1"
                        class="rank-medal"
                      >
                        🥇
                      </div>
                      <div
                        v-else-if="(player.rank || 0) === 2"
                        class="rank-medal"
                      >
                        🥈
                      </div>
                      <div
                        v-else-if="(player.rank || 0) === 3"
                        class="rank-medal"
                      >
                        🥉
                      </div>
                      <div
                        v-else
                        class="rank-number"
                      >
                        {{ player.rank || '—' }}
                      </div>
                    </td>
                    <td class="player-name-cell">
                      {{ player.playerName || player.name }}
                      <button
                        v-if="showPinButtons"
                        class="pin-player-btn"
                        :title="pinnedPlayers && pinnedPlayers.has(player.playerName || player.name) ? 'Unpin player' : 'Pin player'"
                        @click.stop="togglePlayerPin(player.playerName || player.name)"
                      >
                        {{ pinnedPlayers && pinnedPlayers.has(player.playerName || player.name) ? '📌' : '📍' }}
                      </button>
                    </td>
                    <td
                      class="score-cell"
                      :class="getScoreClass(player.score)"
                    >
                      {{ player.score }}
                    </td>
                    <td class="player-kd">
                      <div class="kd-values">
                        <span
                          class="kills"
                          :class="getKillsClass(player.kills)"
                        >{{ player.kills }}</span>
                        <span class="separator">/</span>
                        <span
                          class="deaths"
                          :class="getDeathsClass(player.deaths)"
                        >{{ player.deaths }}</span>
                      </div>
                    </td>
                    <td
                      class="player-ping"
                      :class="getPingClass(player.ping)"
                    >
                      {{ player.ping }}ms
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface PlayerData {
  name?: string
  playerName?: string
  score: number
  kills: number
  deaths: number
  ping: number
  rank?: number
  team?: number
  teamLabel?: string
}

interface TeamGroup {
  teamName: string
  players: PlayerData[]
  totalScore: number
  totalKills: number
  totalDeaths: number
}

interface Props {
  show: boolean
  title?: string
  players: PlayerData[]
  pinnedPlayers?: Set<string>
  showPinButtons?: boolean
  showPerformanceChart?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPinButtons: false,
  showPerformanceChart: false
})

const emit = defineEmits<{
  close: []
  'pin-toggle': [playerName: string]
  'clear-pinned': []
}>()

const router = useRouter()

// State
const playerSortField = ref('score')
const playerSortDirection = ref('desc')
const selectedTeamIndex = ref(0)

// Computed team groups
const teamGroups = computed<TeamGroup[]>(() => {
  if (!props.players.length) return []
  
  const groups = props.players.reduce((acc, player) => {
    const teamName = player.teamLabel || `Team ${player.team || 'Unknown'}`
    if (!acc[teamName]) acc[teamName] = []
    acc[teamName].push(player)
    return acc
  }, {} as Record<string, PlayerData[]>)
  
  Object.values(groups).forEach(team => {
    // Sort players within team based on current sort settings
    team.sort((a, b) => {
      // Pin pinned players at the top
      const aName = a.playerName || a.name || ''
      const bName = b.playerName || b.name || ''
      if (props.pinnedPlayers?.has(aName) && !props.pinnedPlayers?.has(bName)) return -1
      if (!props.pinnedPlayers?.has(aName) && props.pinnedPlayers?.has(bName)) return 1
      
      let aVal, bVal
      switch (playerSortField.value) {
        case 'name':
          aVal = aName.toLowerCase()
          bVal = bName.toLowerCase()
          break
        case 'score':
          aVal = a.score
          bVal = b.score
          break
        case 'kills':
          aVal = a.kills
          bVal = b.kills
          break
        case 'deaths':
          aVal = a.deaths
          bVal = b.deaths
          break
        case 'ping':
          aVal = a.ping
          bVal = b.ping
          break
        case 'rank':
          aVal = a.rank || 999
          bVal = b.rank || 999
          break
        default:
          aVal = a.score
          bVal = b.score
      }
      
      if (playerSortDirection.value === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
  })
  
  return Object.entries(groups).map(([teamName, players]) => ({
    teamName,
    players,
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    totalKills: players.reduce((sum, player) => sum + player.kills, 0),
    totalDeaths: players.reduce((sum, player) => sum + player.deaths, 0)
  })).sort((a, b) => a.teamName.localeCompare(b.teamName))
})

// Methods
const navigateToPlayerProfile = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`)
}

const togglePlayerPin = (playerName: string) => {
  emit('pin-toggle', playerName)
}

const getScoreClass = (score: number) => {
  if (score >= 100) return 'score-excellent'
  if (score >= 50) return 'score-good'
  if (score >= 25) return 'score-average'
  return 'score-low'
}

const getKillsClass = (kills: number) => {
  if (kills >= 30) return 'kills-excellent'
  if (kills >= 15) return 'kills-good'
  if (kills >= 5) return 'kills-average'
  return 'kills-low'
}

const getDeathsClass = (deaths: number) => {
  if (deaths >= 20) return 'deaths-high'
  if (deaths >= 10) return 'deaths-medium'
  if (deaths >= 5) return 'deaths-low'
  return 'deaths-minimal'
}

const getPingClass = (ping: number) => {
  if (ping <= 50) return 'ping-excellent'
  if (ping <= 100) return 'ping-good'
  if (ping <= 150) return 'ping-average'
  return 'ping-poor'
}

const sortPlayersBy = (field: string) => {
  if (playerSortField.value === field) {
    playerSortDirection.value = playerSortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    playerSortField.value = field
    playerSortDirection.value = field === 'name' ? 'asc' : 'desc'
  }
}
</script>

<style scoped>
/* Players Panel - Base styles from LandingPage.vue */
.players-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.players-panel {
  @apply bg-slate-900/95 backdrop-blur-md border-l border-slate-700/50;
  width: 100%;
  max-width: 900px;
  height: 100%;
  box-shadow: -4px 0 25px rgba(0, 0, 0, 0.3);
  animation: slideInRight 0.3s ease-out;
  overflow-y: auto;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.players-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-mute);
}

.players-panel-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  @apply bg-slate-700/50;
}

.players-panel-content {
  padding: 20px;
}

/* Performance Chart Section */
.performance-chart-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.pinned-players-info {
  margin-bottom: 12px;
}

.pinned-players-info h3 {
  margin: 0 0 8px 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.pinned-players-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pinned-player-badge {
  background: #ffd600;
  color: #000;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.clear-all-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--color-text);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-button:hover {
  background: var(--color-background-mute);
}

/* Mobile Team Tabs - Hidden on desktop */
.mobile-team-tabs {
  display: none;
}

/* Desktop Teams Container */
.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.team-section {
  @apply bg-slate-800/40 border border-slate-700/50;
  border-radius: 12px;
  overflow: hidden;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.team-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-text);
}

.team-stats {
  display: flex;
  gap: 15px;
}

.team-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-weight: bold;
  color: var(--color-primary);
}

.team-table-container {
  @apply bg-slate-800/30;
  overflow: hidden;
}

.players-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.players-table th {
  background: var(--color-background-mute);
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.players-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  user-select: none;
}

.players-table th.sortable:hover {
  @apply bg-slate-700/50;
}

.players-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.player-table-row {
  transition: all 0.2s ease;
  cursor: pointer;
}

.player-table-row:hover {
  @apply bg-slate-700/30;
}

.player-table-row:last-child td {
  border-bottom: none;
}

.player-table-row.top-player {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.player-table-row.pinned-player-row {
  background: linear-gradient(90deg, #ffe082 0%, #fffde7 100%);
  border-left: 4px solid #ffd600;
  color: #1a1a1a;
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

.player-name-cell {
  font-weight: 600;
  color: var(--color-text);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
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

/* Score color coding */
.score-excellent {
  color: #4caf50;
  font-weight: 700;
}

.score-good {
  color: #2196f3;
  font-weight: 600;
}

.score-average {
  color: #ff9800;
  font-weight: 500;
}

.score-low {
  color: var(--color-text-muted);
}

/* Kills color coding */
.kills-excellent {
  color: #f44336;
  font-weight: 700;
}

.kills-good {
  color: #ff9800;
  font-weight: 600;
}

.kills-average {
  color: #4caf50;
  font-weight: 500;
}

.kills-low {
  color: var(--color-text-muted);
}

/* Deaths color coding */
.deaths-high {
  color: #f44336;
  font-weight: 600;
}

.deaths-medium {
  color: #ff9800;
  font-weight: 500;
}

.deaths-low {
  color: #4caf50;
  font-weight: 500;
}

.deaths-minimal {
  color: #2196f3;
  font-weight: 500;
}

/* Ping color coding */
.ping-excellent {
  color: #4caf50;
  font-weight: 600;
}

.ping-good {
  color: #2196f3;
  font-weight: 500;
}

.ping-average {
  color: #ff9800;
  font-weight: 500;
}

.ping-poor {
  color: #f44336;
  font-weight: 600;
}

.player-kd {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.kd-values {
  display: flex;
  align-items: center;
  gap: 2px;
}

.separator {
  color: var(--color-text-muted);
}

/* Mobile Styles */
@media (max-width: 768px) {
  .players-panel {
    max-width: 100%;
  }
  
  .players-panel-header {
    padding: 16px;
  }
  
  .players-panel-content {
    padding: 16px;
  }
  
  /* Show mobile tabs, hide desktop grid */
  .mobile-team-tabs {
    display: block;
  }

  .teams-container {
    display: none;
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
    @apply bg-slate-700/50;
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

  /* Mobile leaderboard layout */
  .players-table th,
  .players-table td {
    padding: 4px 8px;
  }
  
  .players-table {
    font-size: 11px;
  }
  
  .player-name-cell {
    max-width: 80px;
  }

  .header-kd,
  .header-ping {
    display: none;
  }

  .player-kd,
  .player-ping {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    margin-top: 4px;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    border-top: 1px solid var(--color-border);
  }

  .player-kd {
    border-top: none;
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
    line-height: 1;
  }

  /* Performance chart mobile styles */
  .performance-chart-section {
    padding: 8px;
  }
  
  .pinned-players-info h3 {
    font-size: 0.9rem;
  }
  
  .pinned-players-badges {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .pinned-player-badge {
    font-size: 0.8rem;
    padding: 3px 8px;
  }
  
  .clear-all-button {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
}

/* Dark mode pinned player styling */
@media (prefers-color-scheme: dark) {
  .player-table-row.pinned-player-row {
    color: #1a1a1a;
  }
  
  .player-table-row.pinned-player-row .player-name-cell,
  .player-table-row.pinned-player-row .score-cell,
  .player-table-row.pinned-player-row .kills,
  .player-table-row.pinned-player-row .deaths {
    color: #1a1a1a;
    font-weight: 600;
  }
}

html[data-theme="dark"] .player-table-row.pinned-player-row,
.dark-mode .player-table-row.pinned-player-row {
  color: #1a1a1a;
}

html[data-theme="dark"] .player-table-row.pinned-player-row .player-name-cell,
html[data-theme="dark"] .player-table-row.pinned-player-row .score-cell,
html[data-theme="dark"] .player-table-row.pinned-player-row .kills,
html[data-theme="dark"] .player-table-row.pinned-player-row .deaths,
.dark-mode .player-table-row.pinned-player-row .player-name-cell,
.dark-mode .player-table-row.pinned-player-row .score-cell,
.dark-mode .player-table-row.pinned-player-row .kills,
.dark-mode .player-table-row.pinned-player-row .deaths {
  color: #1a1a1a;
  font-weight: 600;
}
</style>