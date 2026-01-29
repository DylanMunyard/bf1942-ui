<template>
  <div class="rotation-table-wrap">
    <div class="rotation-table-scroll">
      <table class="rotation-table">
        <thead>
          <tr>
            <th class="col-map">Map</th>
            <th
              class="col-play sortable"
              @click="handleSort('playTimePercentage')"
            >
              <div class="th-content">
                <span>Play %</span>
                <svg v-if="sortColumn === 'playTimePercentage'" class="sort-icon" :class="{ 'sort-asc': sortDirection === 'asc' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </th>
            <th class="col-rounds">Rounds</th>
            <th
              class="col-avg sortable"
              @click="handleSort('avgConcurrentPlayers')"
            >
              <div class="th-content">
                <span>Avg</span>
                <svg v-if="sortColumn === 'avgConcurrentPlayers'" class="sort-icon" :class="{ 'sort-asc': sortDirection === 'asc' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </th>
            <th class="col-win">Win Stats</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="map in sortedMapRotation"
            :key="map.mapName"
            @click="emit('navigate', map.mapName)"
          >
            <td class="col-map">
              <div class="map-name">
                <span>{{ map.mapName }}</span>
                <span class="arrow">-></span>
              </div>
            </td>
            <td class="col-play">{{ map.playTimePercentage }}%</td>
            <td class="col-rounds">{{ map.totalRounds }}</td>
            <td class="col-avg">{{ map.avgConcurrentPlayers }}</td>
            <td class="col-win">
              <div class="win-bar">
                <div class="win-bar-team1" :style="{ width: `${map.winStats.team1WinPercentage}%` }" :title="`${map.winStats.team1Label}: ${map.winStats.team1WinPercentage}%`" />
                <div class="win-bar-team2" :style="{ width: `${map.winStats.team2WinPercentage}%` }" :title="`${map.winStats.team2Label}: ${map.winStats.team2WinPercentage}%`" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="pagination">
      <div class="pagination-info">
        Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }}
      </div>

      <div class="pagination-controls">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1 || isLoading"
          @click="emit('pageChange', currentPage - 1)"
        >
          Prev
        </button>

        <button
          v-for="pageNum in paginationRange"
          :key="pageNum"
          :class="['pagination-btn', pageNum === currentPage && 'pagination-btn--active']"
          :disabled="isLoading"
          @click="emit('pageChange', pageNum)"
        >
          {{ pageNum }}
        </button>

        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages || isLoading"
          @click="emit('pageChange', currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MapRotationItem } from '../../services/dataExplorerService';

const props = defineProps<{
  mapRotation: MapRotationItem[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'navigate', mapName: string): void;
  (e: 'pageChange', page: number): void;
}>();

// Sorting state
type SortColumn = 'playTimePercentage' | 'avgConcurrentPlayers' | null;
type SortDirection = 'asc' | 'desc';

const sortColumn = ref<SortColumn>(null);
const sortDirection = ref<SortDirection>('desc');

const handleSort = (column: 'playTimePercentage' | 'avgConcurrentPlayers') => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'desc';
  }
};

const sortedMapRotation = computed(() => {
  if (!sortColumn.value) {
    return props.mapRotation;
  }

  const sorted = [...props.mapRotation];

  sorted.sort((a, b) => {
    let aValue: number;
    let bValue: number;

    if (sortColumn.value === 'playTimePercentage') {
      aValue = a.playTimePercentage;
      bValue = b.playTimePercentage;
    } else if (sortColumn.value === 'avgConcurrentPlayers') {
      aValue = a.avgConcurrentPlayers;
      bValue = b.avgConcurrentPlayers;
    } else {
      return 0;
    }

    if (sortDirection.value === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  return sorted;
});

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
.rotation-table-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rotation-table-scroll {
  overflow-x: auto;
}

.rotation-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
  table-layout: fixed;
}

.rotation-table th {
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

.rotation-table th.col-play,
.rotation-table th.col-rounds,
.rotation-table th.col-avg {
  text-align: right;
}

.rotation-table .sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.rotation-table .sortable:hover {
  color: #00f5a8;
}

.th-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.sort-icon {
  width: 0.75rem;
  height: 0.75rem;
  transition: transform 0.2s;
}

.sort-icon.sort-asc {
  transform: rotate(180deg);
}

.rotation-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}

.rotation-table td.col-play {
  text-align: right;
  font-family: ui-monospace, monospace;
}

.rotation-table td.col-rounds,
.rotation-table td.col-avg {
  text-align: right;
  color: var(--portal-text);
  font-family: ui-monospace, monospace;
}

.rotation-table tbody tr {
  cursor: pointer;
  transition: background 0.2s;
}

.rotation-table tbody tr:hover td {
  background: var(--portal-accent-dim);
}

.col-map { width: 7rem; }
.col-play { width: 3.5rem; }
.col-rounds { width: 3.5rem; }
.col-avg { width: 2.5rem; display: none; }
.col-win { width: 6rem; display: none; }

@media (min-width: 640px) {
  .col-avg { display: table-cell; }
}

@media (min-width: 768px) {
  .col-win { display: table-cell; }
}

.map-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.map-name span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  color: var(--portal-accent);
  font-size: 0.7rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.rotation-table tbody tr:hover .arrow {
  opacity: 1;
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

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--portal-border);
}

.pagination-info {
  font-size: 0.75rem;
  color: var(--portal-text);
}

.pagination-controls {
  display: flex;
  gap: 0.25rem;
}

.pagination-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--portal-surface);
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
