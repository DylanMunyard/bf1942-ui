<template>
  <div
    v-if="show"
    class="players-panel-overlay"
    @click="$emit('close')"
  >
    <div class="players-panel" @click.stop>
      <div class="players-panel-header">
        <h2>{{ server?.name || 'Players' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="players-panel-content">
        <div v-if="server?.teams" class="teams-container">
          <div v-for="team in server.teams" :key="team.index" class="team-section">
            <div class="team-header">
              <span class="team-name">{{ team.label }}</span>
              <span class="team-tickets">{{ team.tickets }} tickets</span>
            </div>
            <div class="team-table-container">
              <table class="players-table">
                <thead>
                  <tr>
                    <th @click="sortPlayersBy('name')" class="sortable">
                      Player
                    </th>
                    <th @click="sortPlayersBy('score')" class="sortable">
                      Score
                    </th>
                    <th @click="sortPlayersBy('kills')" class="sortable">
                      Kills
                    </th>
                    <th @click="sortPlayersBy('deaths')" class="sortable">
                      Deaths
                    </th>
                    <th @click="sortPlayersBy('ping')" class="sortable">
                      Ping
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="player in getSortedTeamPlayers(team.index)"
                    :key="player.name"
                    class="player-table-row"
                    @click="navigateToPlayerProfile(player.name)"
                  >
                    <td class="player-name-cell">{{ player.name }}</td>
                    <td class="score-cell" :class="getScoreClass(player.score)">{{ player.score }}</td>
                    <td class="kills-cell" :class="getKillsClass(player.kills)">{{ player.kills }}</td>
                    <td class="deaths-cell" :class="getDeathsClass(player.deaths)">{{ player.deaths }}</td>
                    <td class="ping-cell" :class="getPingClass(player.ping)">{{ player.ping }}ms</td>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ServerSummary } from '../types/server'

interface Props {
  show: boolean
  server: ServerSummary | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()

// Players panel state
const playerSortField = ref('score')
const playerSortDirection = ref('desc')

const navigateToPlayerProfile = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`)
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

const getSortedTeamPlayers = (teamIndex: number) => {
  if (!props.server?.players) return []
  
  const teamPlayers = props.server.players.filter(player => player.team === teamIndex)
  
  return [...teamPlayers].sort((a, b) => {
    let aVal, bVal
    
    switch (playerSortField.value) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
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
}
</script>

<style scoped>
/* Players Panel */
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
  background: var(--color-background);
  width: 100%;
  max-width: 900px;
  height: 100%;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
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
  background: var(--color-background-soft);
}

.players-panel-content {
  padding: 20px;
}

.teams-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 769px) {
  .teams-container {
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
}

.team-section {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
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

.team-tickets {
  font-size: 14px;
  color: var(--color-text-muted);
}

.team-table-container {
  background: var(--color-background-soft);
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
  background: var(--color-background);
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
  background: var(--color-background);
}

.player-table-row:last-child td {
  border-bottom: none;
}

.player-name-cell {
  font-weight: 600;
  color: var(--color-text);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* Mobile players panel */
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
  
  .teams-container {
    gap: 15px;
  }
  
  .players-table {
    font-size: 11px;
  }
  
  .players-table th,
  .players-table td {
    padding: 4px 8px;
  }
  
  .player-name-cell {
    max-width: 80px;
  }
}
</style>