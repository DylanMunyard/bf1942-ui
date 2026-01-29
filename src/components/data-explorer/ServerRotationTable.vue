<template>
  <div class="server-table-wrap">
    <table class="server-table">
      <thead>
        <tr>
          <th class="col-server">Server</th>
          <th class="col-status">Status</th>
          <th class="col-rounds">Rounds</th>
          <th class="col-win">Win Stats</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="server in servers"
          :key="server.serverGuid"
          @click="emit('navigate', server.serverGuid)"
        >
          <td class="col-server">
            <div class="server-name">
              <span>{{ server.serverName }}</span>
              <span class="game-tag">{{ getGameLabel(server.game) }}</span>
              <span class="arrow">-></span>
            </div>
          </td>
          <td class="col-status">
            <div :class="['status-dot', server.isOnline ? 'status-dot--online' : 'status-dot--offline']" :title="server.isOnline ? 'Online' : 'Offline'" />
          </td>
          <td class="col-rounds">{{ server.totalRoundsOnMap }}</td>
          <td class="col-win">
            <div class="win-bar">
              <div class="win-bar-team1" :style="{ width: `${server.winStats.team1WinPercentage}%` }" :title="`${server.winStats.team1Label}: ${server.winStats.team1WinPercentage}%`" />
              <div class="win-bar-team2" :style="{ width: `${server.winStats.team2WinPercentage}%` }" :title="`${server.winStats.team2Label}: ${server.winStats.team2WinPercentage}%`" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ServerOnMap } from '../../services/dataExplorerService';

defineProps<{
  servers: ServerOnMap[];
}>();

const emit = defineEmits<{
  (e: 'navigate', serverGuid: string): void;
}>();

const getGameLabel = (game: string): string => {
  switch (game.toLowerCase()) {
    case 'bf1942': return 'BF42';
    case 'fh2': return 'FH2';
    case 'bfvietnam': return 'BFV';
    default: return game.toUpperCase();
  }
};
</script>

<style scoped>
.server-table-wrap {
  overflow-x: auto;
}

.server-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
  table-layout: fixed;
}

.server-table th {
  text-align: left;
  padding: 0.5rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--portal-border);
  white-space: nowrap;
}

.server-table th.col-status {
  text-align: center;
}

.server-table th.col-rounds {
  text-align: right;
}

.server-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}

.server-table td.col-status {
  text-align: center;
}

.server-table td.col-rounds {
  text-align: right;
  color: var(--portal-text);
  font-family: ui-monospace, monospace;
}

.server-table tbody tr {
  cursor: pointer;
  transition: background 0.2s;
}

.server-table tbody tr:hover td {
  background: var(--portal-accent-dim);
}

.col-server { width: auto; }
.col-status { width: 3.5rem; }
.col-rounds { width: 4rem; }
.col-win { width: 6rem; display: none; }

@media (min-width: 640px) {
  .col-win { display: table-cell; }
}

.server-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.server-name > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-tag {
  flex-shrink: 0;
  padding: 0.125rem 0.375rem;
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-family: ui-monospace, monospace;
  background: var(--portal-surface);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text);
}

.arrow {
  color: var(--portal-accent);
  font-size: 0.7rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.server-table tbody tr:hover .arrow {
  opacity: 1;
}

.status-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.status-dot--online {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
}

.status-dot--offline {
  background: var(--portal-text);
  opacity: 0.4;
}

.win-bar {
  height: 0.375rem;
  border-radius: 2px;
  overflow: hidden;
  background: var(--portal-surface);
  display: flex;
}

.win-bar-team1 {
  background: #ef4444;
}

.win-bar-team2 {
  background: #3b82f6;
}
</style>
