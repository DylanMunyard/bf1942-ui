<template>
  <div class="server-table-wrap">
    <table class="server-table">
      <thead>
        <tr>
          <th class="col-rank">#</th>
          <th class="col-server">Server</th>
          <th class="col-score">Score</th>
          <th class="col-kills">Kills</th>
          <th class="col-kd">K/D</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="server in serverStats" :key="server.serverGuid">
          <td class="col-rank">
            <span :class="getRankClass(server.rank)">{{ server.rank }}</span>
          </td>
          <td class="col-server">
            <button @click="handleServerClick(server.serverGuid)" class="server-link" :title="server.serverName">
              {{ server.serverName }}
            </button>
          </td>
          <td class="col-score">{{ server.totalScore.toLocaleString() }}</td>
          <td class="col-kills">{{ server.totalKills.toLocaleString() }}</td>
          <td class="col-kd">{{ server.kdRatio.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="serverStats.length === 0" class="server-empty">
      No server data available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerServerStats } from '../../services/dataExplorerService';
import { getRankClass } from '@/utils/statsUtils';

defineProps<{
  serverStats: PlayerServerStats[];
}>();

const emit = defineEmits<{
  'navigate-to-server': [serverGuid: string];
}>();

const handleServerClick = (serverGuid: string) => {
  emit('navigate-to-server', serverGuid);
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
}

.server-table th {
  text-align: left;
  padding: 0.35rem 0.5rem;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--portal-border);
}

.server-table th.col-score,
.server-table th.col-kills,
.server-table th.col-kd {
  text-align: right;
}

.server-table td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}

.server-table td.col-score {
  text-align: right;
  color: var(--portal-text-bright);
}

.server-table td.col-kills,
.server-table td.col-kd {
  text-align: right;
  color: var(--portal-text);
}

.server-table tbody tr:last-child td {
  border-bottom: none;
}

.col-rank { width: 1.5rem; }
.col-server {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-link {
  color: var(--portal-text-bright);
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.server-link:hover {
  color: var(--portal-accent);
}

.server-empty {
  text-align: center;
  padding: 1rem;
  color: var(--portal-text);
  font-size: 0.8rem;
}
</style>
