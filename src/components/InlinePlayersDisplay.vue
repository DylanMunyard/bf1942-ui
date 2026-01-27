<template>
  <div class="inline-players-display">
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

<style scoped src="./InlinePlayersDisplay.vue.css"></style>