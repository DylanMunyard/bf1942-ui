<template>
  <div class="leaderboard-card">
    <h4 class="card-title">
      {{ title }}
      <span v-if="totalCount > 0" class="card-count">({{ totalCount.toLocaleString() }})</span>
    </h4>

    <!-- Initial Loading State (no data yet) -->
    <div v-if="isLoading && rankings.length === 0" class="card-loading">
      <div class="spinner"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error && rankings.length === 0" class="card-error">
      <div class="error-text">{{ error }}</div>
      <button @click="emit('retry')" class="error-retry">Try again</button>
    </div>

    <!-- Rankings Table (shown even while refreshing) -->
    <div v-else-if="rankings.length > 0" :class="{ 'card-loading-overlay': isRefreshing }">
      <div class="card-table-wrap">
        <table class="card-table">
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th class="col-player">Player</th>
              <th class="col-value">{{ primaryColumnHeader }}</th>
              <th class="col-rounds">Rounds</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in rankings" :key="entry.playerName">
              <td class="col-rank">
                <span :class="getRankClass(entry.rank)">{{ entry.rank }}</span>
              </td>
              <td class="col-player">
                <button @click="navigateToPlayer(entry.playerName)" class="player-link">
                  {{ entry.playerName }}
                </button>
              </td>
              <td class="col-value">{{ formatPrimaryValue(entry) }}</td>
              <td class="col-rounds">{{ entry.totalRounds }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1 || isRefreshing"
          @click="emit('pageChange', currentPage - 1)"
        >
          Prev
        </button>

        <button
          v-for="pageNum in paginationRange"
          :key="pageNum"
          :class="['pagination-btn', pageNum === currentPage && 'pagination-btn--active']"
          :disabled="isRefreshing"
          @click="emit('pageChange', pageNum)"
        >
          {{ pageNum }}
        </button>

        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages || isRefreshing"
          @click="emit('pageChange', currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card-empty">No player data available</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getRankClass } from '@/utils/statsUtils';
import type { MapPlayerRanking, MapRankingSortBy } from '../../services/dataExplorerService';

const router = useRouter();

const props = defineProps<{
  title: string;
  rankings: MapPlayerRanking[];
  isLoading: boolean;
  isRefreshing?: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  sortType: MapRankingSortBy;
}>();

const emit = defineEmits<{
  (e: 'pageChange', page: number): void;
  (e: 'retry'): void;
}>();

const navigateToPlayer = (playerName: string) => {
  router.push({
    name: 'explore-player-detail',
    params: { playerName }
  });
};

const primaryColumnHeader = computed(() => {
  switch (props.sortType) {
    case 'score': return 'Score';
    case 'kills': return 'Kills';
    case 'kdRatio': return 'K/D';
    case 'killRate': return 'Kills/Min';
    default: return 'Score';
  }
});

const formatPrimaryValue = (entry: MapPlayerRanking): string => {
  switch (props.sortType) {
    case 'score':
      return entry.totalScore.toLocaleString();
    case 'kills':
      return entry.totalKills.toLocaleString();
    case 'kdRatio':
      return entry.kdRatio.toFixed(2);
    case 'killRate':
      return entry.killsPerMinute.toFixed(3);
    default:
      return entry.totalScore.toLocaleString();
  }
};


const paginationRange = computed(() => {
  const range: number[] = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, props.currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(props.totalPages, startPage + maxVisiblePages - 1);

  if (endPage === props.totalPages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    range.push(i);
  }

  return range;
});
</script>

<style scoped>
.leaderboard-card {
  background: var(--portal-surface);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  padding: 1rem;
}

.card-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--portal-text-bright);
  margin: 0 0 0.75rem;
}

.card-count {
  color: var(--portal-text);
  font-weight: 400;
  font-size: 0.75rem;
}

.card-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--portal-border);
  border-top-color: var(--portal-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-error {
  text-align: center;
  padding: 1rem;
}

.error-text {
  color: var(--portal-danger);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.error-retry {
  font-size: 0.8rem;
  color: var(--portal-accent);
  background: none;
  border: none;
  cursor: pointer;
}

.error-retry:hover {
  color: #00f5a8;
}

.card-loading-overlay {
  opacity: 0.5;
  pointer-events: none;
}

.card-table-wrap {
  overflow-x: auto;
}

.card-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
}

.card-table th {
  text-align: left;
  padding: 0.5rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--portal-border);
}

.card-table th.col-value,
.card-table th.col-rounds {
  text-align: right;
}

.card-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}

.card-table td.col-value {
  text-align: right;
  color: var(--portal-accent);
  font-weight: 500;
  font-family: ui-monospace, monospace;
}

.card-table td.col-rounds {
  text-align: right;
  color: var(--portal-text);
}

.card-table tbody tr:last-child td {
  border-bottom: none;
}

.col-rank { width: 2rem; }
.col-player {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .col-player { max-width: 120px; }
}

.col-rounds { display: none; }

@media (min-width: 640px) {
  .col-rounds { display: table-cell; }
}

.player-link {
  color: var(--portal-accent);
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s;
}

.player-link:hover {
  color: #00f5a8;
}

.card-empty {
  text-align: center;
  padding: 1rem;
  color: var(--portal-text);
  font-size: 0.8rem;
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid var(--portal-border);
}

.pagination-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  min-width: 1.5rem;
  text-align: center;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--portal-accent-dim);
  color: var(--portal-accent);
  border-color: rgba(0, 229, 160, 0.3);
}

.pagination-btn--active {
  background: var(--portal-accent);
  color: var(--portal-bg);
  border-color: var(--portal-accent);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
