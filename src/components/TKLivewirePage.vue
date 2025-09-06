<template>
  <div class="tk-livewire-page">
    <h1 class="edgy-title">
      TK Livewire: Teamkillers in Action!
    </h1>
    <div
      v-if="loading && !metrics.length"
      class="loading"
    >
      Loading teamkiller metrics...
    </div>
    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>
    <div v-else>
      <table class="tk-table">
        <thead>
          <tr>
            <th>Server</th>
            <th>Player</th>
            <th>Team</th>
            <th>Map</th>
            <th>Score</th>
            <th>Kills</th>
            <th>Deaths</th>
            <th>Unexpl. Drops (10m)</th>
            <th>Penalties (10m)</th>
            <th>TK Probability</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="metric in metrics"
            :key="metric.serverName + metric.playerName + metric.lastActivity"
          >
            <td>
              <router-link
                :to="'/servers/' + encodeURIComponent(metric.serverName)"
                class="server-link"
              >
                {{ metric.serverName }}
              </router-link>
            </td>
            <td>{{ metric.playerName }}</td>
            <td>{{ metric.teamName }}</td>
            <td>{{ metric.mapName }}</td>
            <td>{{ metric.currentScore }}</td>
            <td>{{ metric.currentKills }}</td>
            <td>{{ metric.currentDeaths }}</td>
            <td>{{ metric.unexplainedDropsLast10Min }}</td>
            <td>
              <span 
                class="penalties-link"
                :class="penaltiesClass(metric.totalPenaltiesLast10Min)"
              >
                {{ metric.totalPenaltiesLast10Min }}
              </span>
            </td>
            <td>
              <span :class="tkProbClass(metric.tkProbability)">
                {{ (metric.tkProbability * 100).toFixed(1) }}%
              </span>
            </td>
            <td>{{ formatDate(metric.lastActivity) }}</td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="metrics.length === 0"
        class="no-data"
      >
        No teamkillers detected right now. Stay sharp!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchTeamKillerMetrics, TeamKillerMetric } from '../services/playerStatsService';

const metrics = ref<TeamKillerMetric[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function tkProbClass(prob: number): string {
  if (prob > 0.8) return 'tk-high';
  if (prob > 0.5) return 'tk-medium';
  return 'tk-low';
}

function penaltiesClass(penalties: number): string {
  if (penalties >= 5) return 'penalties-high';
  if (penalties >= 3) return 'penalties-medium';
  return '';
}

async function loadMetrics() {
  try {
    const newMetrics = await fetchTeamKillerMetrics();
    metrics.value = newMetrics;
    error.value = null;
  } catch (err: any) {
    error.value = err.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadMetrics();
  // Refresh every 10 seconds for "real-time" feel
  setInterval(loadMetrics, 10000);
});
</script>

<style scoped>
.tk-livewire-page {
  padding: 32px;
  color: #fff;
  background: #18181b;
  min-height: 100vh;
}
.edgy-title {
  font-size: 2.2rem;
  font-family: 'Orbitron', 'Oswald', 'Arial Black', Arial, sans-serif;
  color: #ff0059;
  letter-spacing: 2px;
  margin-bottom: 24px;
  text-shadow: 0 2px 12px #ff0059aa, 0 1px 0 #000;
}
.tk-table {
  width: 100%;
  border-collapse: collapse;
  background: #23232b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 16px #000a;
}
.tk-table th, .tk-table td {
  padding: 10px 14px;
  text-align: center;
}
.tk-table th {
  background: #2d2d39;
  color: #ff0059;
  font-weight: bold;
  font-size: 1rem;
  border-bottom: 2px solid #ff0059;
}
.tk-table tr:nth-child(even) {
  background: #23232b;
}
.tk-table tr:nth-child(odd) {
  background: #1a1a22;
}
.tk-high {
  color: #ff0059;
  font-weight: bold;
  text-shadow: 0 0 6px #ff0059aa;
}
.tk-medium {
  color: #ffb300;
  font-weight: bold;
}
.tk-low {
  color: #00e676;
  font-weight: bold;
}
.loading, .error, .no-data {
  margin: 32px 0;
  font-size: 1.2rem;
  text-align: center;
}
.error {
  color: #ff0059;
}
.no-data {
  color: #ffb300;
}

.server-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.server-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.penalties-link {
  text-decoration: none;
  color: inherit;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.penalties-link:hover {
  text-decoration: underline;
}

.penalties-medium {
  color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.penalties-high {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}
</style> 