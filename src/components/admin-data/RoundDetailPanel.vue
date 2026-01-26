<template>
  <div class="round-panel">
    <div v-if="detail.isDeleted" class="round-panel-deleted-banner">
      This round has been marked as deleted. It is excluded from stats and aggregates. Achievements were removed; round and sessions remain for recovery.
      <span v-if="props.undeleteError" class="round-panel-deleted-err">{{ props.undeleteError }}</span>
    </div>
    <div class="round-panel-head">
      <div class="round-panel-meta">
        <h3 class="round-panel-title">[ ROUND ] {{ detail.roundId }}</h3>
        <div v-if="detail.mapName || detail.serverName" class="round-panel-tags">
          <span v-if="detail.mapName" class="round-panel-tag">{{ detail.mapName }}</span>
          <span v-if="detail.serverName" class="round-panel-tag">{{ detail.serverName }}</span>
          <span v-if="detail.startTime" class="round-panel-tag round-panel-tag--mono">{{ formatDate(detail.startTime) }}</span>
        </div>
      </div>
      <button
        v-if="canDelete && !detail.isDeleted"
        type="button"
        class="round-panel-delete"
        :disabled="loading"
        @click="$emit('delete')"
      >
        delete round
      </button>
      <button
        v-else-if="canDelete && detail.isDeleted"
        type="button"
        class="round-panel-undelete"
        :disabled="loading"
        @click="$emit('undelete')"
      >
        undelete round
      </button>
    </div>

    <div class="round-panel-body">
      <div class="round-panel-stats">
        <div class="round-stat">
          <span class="round-stat-label">players</span>
          <span class="round-stat-value">{{ detail.players.length }}</span>
        </div>
        <div class="round-stat round-stat--warn">
          <span class="round-stat-label">achievements to delete</span>
          <span class="round-stat-value">
            {{ achievementCount }}
            <button
              v-if="achievementCount > 0"
              type="button"
              class="round-stat-view"
              @click="$emit('viewAchievements')"
            >
              view
            </button>
          </span>
        </div>
        <div v-if="detail.observationCountToDelete != null" class="round-stat">
          <span class="round-stat-label">observations</span>
          <span class="round-stat-value">{{ detail.observationCountToDelete }}</span>
        </div>
        <div v-if="detail.sessionCountToDelete != null" class="round-stat">
          <span class="round-stat-label">sessions</span>
          <span class="round-stat-value">{{ detail.sessionCountToDelete }}</span>
        </div>
      </div>

      <div class="round-panel-table-wrap">
        <div class="round-panel-table-label">[ PLAYERS IN ROUND ]</div>
        <table class="round-panel-table">
          <thead>
            <tr>
              <th>player</th>
              <th>score</th>
              <th>kills</th>
              <th>deaths</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in playersByScoreDesc" :key="p.playerName">
              <td>{{ p.playerName }}</td>
              <td class="round-panel-mono">{{ pickScore(p) }}</td>
              <td class="round-panel-mono">{{ pickKills(p) }}</td>
              <td class="round-panel-mono">{{ pickDeaths(p) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RoundDetailResponse, RoundPlayerEntry } from '@/services/adminDataService';

const props = withDefaults(
  defineProps<{
    detail: RoundDetailResponse;
    loading?: boolean;
    undeleteError?: string | null;
    canDelete?: boolean;
  }>(),
  { canDelete: false }
);

defineEmits<{
  delete: [];
  undelete: [];
  viewAchievements: [];
}>();

const achievementCount = computed(() => props.detail.achievementCountToDelete ?? 0);

const playersByScoreDesc = computed(() => {
  const players = [...(props.detail.players ?? [])];
  return players.sort((a, b) => pickScore(b) - pickScore(a));
});

function pickScore(p: RoundPlayerEntry): number {
  return p.totalScore ?? p.score ?? 0;
}
function pickKills(p: RoundPlayerEntry): number {
  return p.totalKills ?? p.kills ?? 0;
}
function pickDeaths(p: RoundPlayerEntry): number {
  return p.totalDeaths ?? p.deaths ?? 0;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.round-panel {
  --rp-bg: #0c0c12;
  --rp-border: #1a1a24;
  --rp-accent: #00e5a0;
  --rp-accent-dim: rgba(0, 229, 160, 0.12);
  --rp-warn: #f59e0b;
  --rp-danger: #ef4444;
  --rp-text: #9ca3af;
  --rp-text-bright: #e5e7eb;
  background: var(--rp-bg);
  border: 1px solid var(--rp-border);
  border-radius: 2px;
  overflow: hidden;
}
.round-panel-deleted-banner {
  padding: 0.6rem 1rem;
  font-size: 0.75rem;
  color: var(--rp-warn);
  background: rgba(245, 158, 11, 0.1);
  border-bottom: 1px solid rgba(245, 158, 11, 0.3);
}
.round-panel-deleted-err {
  display: block;
  margin-top: 0.35rem;
  color: var(--rp-danger);
  font-size: 0.7rem;
}
.round-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--rp-border);
  background: rgba(17, 17, 24, 0.6);
}
.round-panel-meta {
  flex: 1;
  min-width: 0;
}
.round-panel-title {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--rp-accent);
  margin: 0;
  font-family: ui-monospace, monospace;
}
.round-panel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--rp-text);
}
.round-panel-tag--mono {
  font-family: ui-monospace, monospace;
}
.round-panel-delete {
  padding: 0.4rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: rgba(239, 68, 68, 0.15);
  color: var(--rp-danger);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.round-panel-delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
}
.round-panel-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.round-panel-undelete {
  padding: 0.4rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: rgba(0, 229, 160, 0.15);
  color: var(--rp-accent);
  border: 1px solid rgba(0, 229, 160, 0.4);
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.round-panel-undelete:hover:not(:disabled) {
  background: rgba(0, 229, 160, 0.25);
  box-shadow: 0 0 12px var(--rp-accent-dim);
}
.round-panel-undelete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.round-panel-body {
  padding: 1rem 1.25rem;
}
.round-panel-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.round-stat {
  background: rgba(17, 17, 24, 0.8);
  border: 1px solid var(--rp-border);
  border-radius: 2px;
  padding: 0.6rem 0.75rem;
}
.round-stat--warn .round-stat-value {
  color: var(--rp-warn);
}
.round-stat-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--rp-accent);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.round-stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--rp-text-bright);
  font-family: ui-monospace, monospace;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.round-stat-view {
  padding: 0.2rem 0.4rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: var(--rp-accent-dim);
  color: var(--rp-accent);
  border: 1px solid rgba(0, 229, 160, 0.3);
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
}
.round-stat-view:hover {
  background: rgba(0, 229, 160, 0.2);
  box-shadow: 0 0 8px var(--rp-accent-dim);
}
.round-panel-table-wrap {
  border: 1px solid var(--rp-border);
  border-radius: 2px;
  overflow: hidden;
}
.round-panel-table-label {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--rp-accent);
  padding: 0.5rem 0.75rem;
  background: rgba(17, 17, 24, 0.8);
  border-bottom: 1px solid var(--rp-border);
  font-family: ui-monospace, monospace;
}
.round-panel-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
}
.round-panel-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  background: rgba(26, 26, 36, 0.8);
  color: var(--rp-accent);
  font-weight: 600;
  letter-spacing: 0.04em;
  font-family: ui-monospace, monospace;
}
.round-panel-table td {
  padding: 0.45rem 0.75rem;
  border-top: 1px solid var(--rp-border);
  color: var(--rp-text-bright);
}
.round-panel-table tbody tr:hover td {
  background: var(--rp-accent-dim);
}
.round-panel-mono {
  font-family: ui-monospace, monospace;
}
</style>
