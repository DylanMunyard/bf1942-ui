<template>
  <div class="portal-query-tab">
    <!-- Query form -->
    <section class="portal-card portal-form">
      <div class="portal-form-grid">
        <div class="portal-field portal-field--wide">
          <label class="portal-label">[ SERVER ]</label>
          <div class="portal-input-wrap">
            <input
              v-model="serverSearchQuery"
              type="text"
              placeholder="type to search..."
              class="portal-input"
              @input="onServerSearchInput"
              @focus="showServerDropdown = true"
              @blur="closeServerDropdown"
            />
            <div
              v-if="showServerDropdown"
              class="portal-dropdown"
            >
              <div
                v-for="s in serverSuggestions"
                :key="s.serverGuid"
                class="portal-dropdown-item"
                @mousedown.prevent="selectServer(s)"
              >
                {{ s.serverName }}
              </div>
              <div v-if="serverSearchLoading" class="portal-dropdown-ghost">searching...</div>
              <div v-if="!serverSearchLoading && serverSearchQuery.length >= 2 && serverSuggestions.length === 0" class="portal-dropdown-ghost">no matches</div>
            </div>
          </div>
          <p v-if="selectedServer" class="portal-hint">‹ {{ selectedServer.serverName }}</p>
        </div>
        <div class="portal-field">
          <label class="portal-label">[ MIN SCORE ]</label>
          <input v-model.number="filters.minScore" type="number" min="0" placeholder="0" class="portal-input portal-input--mono" />
        </div>
        <div class="portal-field">
          <label class="portal-label">[ MIN K/D ]</label>
          <input v-model.number="filters.minKd" type="number" min="0" step="0.1" placeholder="0" class="portal-input portal-input--mono" />
        </div>
        <div class="portal-field">
          <label class="portal-label">[ FROM ]</label>
          <input v-model="filters.dateFrom" type="date" class="portal-input portal-input--mono" />
        </div>
        <div class="portal-field">
          <label class="portal-label">[ TO ]</label>
          <input v-model="filters.dateTo" type="date" class="portal-input portal-input--mono" />
        </div>
        <div class="portal-field portal-field--wide" style="display: flex; align-items: center; gap: 0.5rem;">
          <input
            id="include-deleted"
            v-model="includeDeletedRounds"
            type="checkbox"
            class="portal-input"
            style="width: auto;"
          />
          <label for="include-deleted" class="portal-label" style="margin: 0; letter-spacing: 0.05em;">Include deleted rounds (to restore)</label>
        </div>
      </div>
      <div class="portal-actions">
        <button
          type="button"
          class="portal-btn portal-btn--primary"
          :disabled="queryLoading"
          @click="runQuery"
        >
          <span v-if="queryLoading" class="portal-btn-pulse">running</span>
          <span v-else>run query</span>
        </button>
        <button type="button" class="portal-btn portal-btn--ghost" @click="clearQuery">clear</button>
      </div>
    </section>

    <!-- Results + inspect panel -->
    <div class="portal-query-main">
      <section v-if="hasQueried" class="portal-card portal-results">
        <template v-if="tableLoading">
          <div class="portal-empty portal-empty--loading">
            <span class="portal-empty-dash">—</span>
            <span class="portal-empty-text">scanning...</span>
          </div>
        </template>
        <template v-else-if="sessions.length === 0">
          <div class="portal-empty">
            <span class="portal-empty-dash">∅</span>
            <span class="portal-empty-title">no matches</span>
            <span class="portal-empty-desc">No suspicious sessions for this query. Try different filters or thresholds.</span>
          </div>
        </template>
        <template v-else>
          <div class="portal-sessions-wrap">
            <div class="portal-sessions-table-wrap">
              <table class="portal-sessions-table">
                <thead>
                  <tr>
                    <th v-if="canDelete" class="portal-th-select">
                      <input
                        type="checkbox"
                        :checked="allSelectableSelected"
                        :indeterminate="someSelectableSelected && !allSelectableSelected"
                        :disabled="selectableRoundGroups.length === 0"
                        aria-label="Select all rounds"
                        @change="toggleSelectAll"
                      />
                    </th>
                    <th class="portal-sortable" @click="onSortClick('playerName')">player <span v-if="sortField === 'playerName'" class="portal-sort-icon">{{ sortOrder === -1 ? '↓' : '↑' }}</span></th>
                    <th class="portal-sortable" @click="onSortClick('serverName')">server <span v-if="sortField === 'serverName'" class="portal-sort-icon">{{ sortOrder === -1 ? '↓' : '↑' }}</span></th>
                    <th class="portal-sortable" @click="onSortClick('totalScore')">score <span v-if="sortField === 'totalScore'" class="portal-sort-icon">{{ sortOrder === -1 ? '↓' : '↑' }}</span></th>
                    <th class="portal-sortable" @click="onSortClick('totalKills')">kills <span v-if="sortField === 'totalKills'" class="portal-sort-icon">{{ sortOrder === -1 ? '↓' : '↑' }}</span></th>
                    <th class="portal-sortable" @click="onSortClick('kdRatio')">k/d <span v-if="sortField === 'kdRatio'" class="portal-sort-icon">{{ sortOrder === -1 ? '↓' : '↑' }}</span></th>
                    <th>actions</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="{ roundId, sessions: roundSessions } in roundGroups" :key="roundId">
                    <tr>
                      <td v-if="canDelete" class="portal-round-header portal-td-select">
                        <input
                          v-if="!roundSessions[0]?.roundIsDeleted"
                          type="checkbox"
                          :checked="selectedRoundIds.has(roundId)"
                          :aria-label="`Select round ${roundId}`"
                          @change="toggleRound(roundId)"
                        />
                      </td>
                      <td colspan="6" class="portal-round-header">
                        {{ (roundSessions[0]?.roundStartTime ? formatDate(roundSessions[0].roundStartTime) + ' · ' : '') + roundId }}
                        <span v-if="roundSessions[0]?.roundIsDeleted" class="portal-round-header-deleted">[deleted]</span>
                        <span v-if="roundSessions.length > 1" class="portal-round-header-count">{{ roundSessions.length }} exceeding</span>
                      </td>
                    </tr>
                    <tr v-for="s in roundSessions" :key="`${s.roundId}-${s.playerName}`">
                      <td v-if="canDelete" class="portal-td-select" />
                      <td>{{ s.playerName }}</td>
                      <td>{{ s.serverName }}</td>
                      <td class="portal-mono">{{ s.totalScore }}</td>
                      <td class="portal-mono">{{ s.totalKills }}</td>
                      <td :class="['portal-mono', (s.kdRatio ?? 0) >= 5 && 'portal-kd--high']">
                        {{ s.kdRatio != null ? s.kdRatio.toFixed(2) : '–' }}
                      </td>
                      <td>
                        <button type="button" class="portal-cell-btn" @click="viewRound(s.roundId)">inspect</button>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div v-if="canDelete && selectedRoundIds.size > 0" class="portal-bulk-actions">
              <span class="portal-bulk-info">{{ selectedRoundIds.size }} round{{ selectedRoundIds.size === 1 ? '' : 's' }} selected</span>
              <button
                type="button"
                class="portal-btn portal-btn--sm"
                :class="bulkDeleteLoading ? 'portal-btn--ghost' : 'portal-btn--danger'"
                :disabled="bulkDeleteLoading"
                @click="openBulkDeleteModal"
              >
                {{ bulkDeleteLoading ? 'deleting…' : `delete selected (${selectedRoundIds.size})` }}
              </button>
            </div>
            <div class="portal-pagination">
              <div class="portal-pagination-info">
                {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalSessions) }} of {{ totalSessions }}
              </div>
              <div class="portal-pagination-controls">
                <select v-model.number="pageSize" class="portal-pagination-select" @change="onPageSizeChange">
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
                <button
                  type="button"
                  class="portal-btn portal-btn--ghost portal-btn--sm"
                  :disabled="currentPage <= 1"
                  @click="goToPage(currentPage - 1)"
                >
                  prev
                </button>
                <span class="portal-pagination-page">page {{ currentPage }} of {{ totalPages }}</span>
                <button
                  type="button"
                  class="portal-btn portal-btn--ghost portal-btn--sm"
                  :disabled="currentPage >= totalPages"
                  @click="goToPage(currentPage + 1)"
                >
                  next
                </button>
              </div>
            </div>
          </div>
        </template>
      </section>

      <div v-if="roundDetail || roundDetailLoading" class="portal-round-wrap">
        <RoundDetailPanel
          v-if="roundDetail"
          :detail="roundDetail"
          :loading="roundDetailLoading"
          :undelete-error="undeleteError"
          :can-delete="canDelete"
          @delete="openDeleteModal"
          @undelete="onUndelete"
          @view-achievements="onViewAchievements"
        />
        <div v-else class="portal-round-loading portal-card">
          <div class="portal-empty portal-empty--loading">
            <span class="portal-empty-dash">—</span>
            <span class="portal-empty-text">loading...</span>
          </div>
        </div>
      </div>
      <div v-if="showAchievementsPanel && achievementsRoundId" class="portal-achievements-wrap">
        <RoundAchievementsPanel
          :round-id="achievementsRoundId"
          :achievements="roundAchievements"
          :loading="roundAchievementsLoading"
          @close="closeAchievementsPanel"
        />
      </div>
    </div>

    <DeleteConfirmationModal
      v-if="showDeleteModal && roundDetail"
      :impact="{
        achievementCountToDelete: roundDetail.achievementCountToDelete,
        observationCountToDelete: roundDetail.observationCountToDelete,
        sessionCountToDelete: roundDetail.sessionCountToDelete,
        playerCount: roundDetail.players.length,
      }"
      :loading="deleteLoading"
      :error="deleteError"
      @confirm="onDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- Bulk delete confirmation -->
    <div v-if="showBulkDeleteModal" class="delete-modal-backdrop" @click.self="closeBulkDeleteModal">
      <div class="delete-modal" @click.stop>
        <div class="delete-modal-head">
          <span class="delete-modal-label">[ BULK DELETE ]</span>
          <h2 class="delete-modal-title">Delete {{ selectedRoundIds.size }} round{{ selectedRoundIds.size === 1 ? '' : 's' }}</h2>
          <p class="delete-modal-desc">
            Each round will be soft-deleted (achievements removed; round and sessions kept for recovery). Run Daily Aggregate Refresh in Cron after.
          </p>
        </div>
        <div class="delete-modal-body">
          <p v-if="bulkDeleteError" class="delete-modal-err">{{ bulkDeleteError }}</p>
        </div>
        <div class="delete-modal-foot">
          <button
            type="button"
            class="delete-modal-btn delete-modal-btn--ghost"
            :disabled="bulkDeleteLoading"
            @click="closeBulkDeleteModal"
          >
            {{ bulkDeleteDone ? 'close' : 'cancel' }}
          </button>
          <button
            v-if="!bulkDeleteDone"
            type="button"
            class="delete-modal-btn delete-modal-btn--danger"
            :disabled="bulkDeleteLoading"
            @click="onBulkDeleteConfirm"
          >
            {{ bulkDeleteLoading ? 'deleting…' : `delete ${selectedRoundIds.size} round${selectedRoundIds.size === 1 ? '' : 's'}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import RoundDetailPanel from '@/components/admin-data/RoundDetailPanel.vue';
import RoundAchievementsPanel from '@/components/admin-data/RoundAchievementsPanel.vue';
import DeleteConfirmationModal from '@/components/admin-data/DeleteConfirmationModal.vue';
import {
  adminDataService,
  searchServersForAdmin,
  type SuspiciousSessionResponse,
  type RoundDetailResponse,
  type RoundAchievement,
  type ServerSearchResult,
} from '@/services/adminDataService';
import { formatDateTimeShort } from '@/utils/date';

const props = withDefaults(
  defineProps<{ gameFilter?: string; canDelete?: boolean }>(),
  { gameFilter: 'bf1942', canDelete: false }
);

const emit = defineEmits<{ (e: 'post-delete'): void; (e: 'post-undelete'): void }>();

const ADMIN_DATA_LAST_SEARCH_KEY = 'bf1942_admin_data_last_search';

const filters = ref({
  serverGuid: undefined as string | undefined,
  minScore: undefined as number | undefined,
  minKd: undefined as number | undefined,
  dateFrom: '' as string,
  dateTo: '' as string,
});
const serverSearchQuery = ref('');
const selectedServer = ref<ServerSearchResult | null>(null);
const serverSuggestions = ref<ServerSearchResult[]>([]);
const showServerDropdown = ref(false);
const serverSearchLoading = ref(false);
let serverSearchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(selectedServer, (s) => {
  filters.value.serverGuid = s?.serverGuid;
}, { immediate: true });

const hasQueried = ref(false);
const sessions = ref<SuspiciousSessionResponse[]>([]);
const totalSessions = ref(0);
const tableLoading = ref(false);
const queryLoading = ref(false);
const sortField = ref('totalScore');
const sortOrder = ref<-1 | 1>(-1);
const currentPage = ref(1);
const pageSize = ref(50);

const roundDetail = ref<RoundDetailResponse | null>(null);
const roundDetailLoading = ref(false);

const showAchievementsPanel = ref(false);
const achievementsRoundId = ref<string | null>(null);
const roundAchievements = ref<RoundAchievement[]>([]);
const roundAchievementsLoading = ref(false);

const showDeleteModal = ref(false);
const deleteLoading = ref(false);
const deleteError = ref<string | null>(null);

const includeDeletedRounds = ref(false);
const undeleteError = ref<string | null>(null);

const selectedRoundIdsArray = ref<string[]>([]);
const selectedRoundIds = computed(() => new Set(selectedRoundIdsArray.value));

const selectableRoundGroups = computed(() =>
  roundGroups.value.filter((g) => !g.sessions[0]?.roundIsDeleted)
);
const allSelectableSelected = computed(
  () =>
    selectableRoundGroups.value.length > 0 &&
    selectableRoundGroups.value.every((g) => selectedRoundIds.value.has(g.roundId))
);
const someSelectableSelected = computed(() =>
  selectableRoundGroups.value.some((g) => selectedRoundIds.value.has(g.roundId))
);

const showBulkDeleteModal = ref(false);
const bulkDeleteLoading = ref(false);
const bulkDeleteDone = ref(false);
const bulkDeleteError = ref<string | null>(null);
function formatDate(iso: string): string {
  return formatDateTimeShort(iso);
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(ADMIN_DATA_LAST_SEARCH_KEY);
    if (!raw) return;
    const s = JSON.parse(raw) as {
      filters?: { serverGuid?: string; minScore?: number; minKd?: number; dateFrom?: string; dateTo?: string };
      serverSearchQuery?: string;
      serverGuid?: string;
      serverName?: string;
      includeDeletedRounds?: boolean;
    };
    if (s.filters) {
      filters.value = {
        serverGuid: s.filters.serverGuid,
        minScore: s.filters.minScore,
        minKd: s.filters.minKd,
        dateFrom: s.filters.dateFrom ?? '',
        dateTo: s.filters.dateTo ?? '',
      };
    }
    if (s.serverSearchQuery != null) serverSearchQuery.value = s.serverSearchQuery;
    if (s.serverGuid && s.serverName) {
      selectedServer.value = { serverGuid: s.serverGuid, serverName: s.serverName };
    }
    if (typeof s.includeDeletedRounds === 'boolean') includeDeletedRounds.value = s.includeDeletedRounds;
  } catch { /* ignore */ }
});

function onServerSearchInput() {
  selectedServer.value = null;
  if (serverSearchTimeout) clearTimeout(serverSearchTimeout);
  serverSearchTimeout = setTimeout(() => {
    const q = serverSearchQuery.value.trim();
    if (q.length < 2) {
      serverSuggestions.value = [];
      return;
    }
    serverSearchLoading.value = true;
    searchServersForAdmin(q, 20, props.gameFilter || 'bf1942')
      .then((r) => { serverSuggestions.value = r; })
      .finally(() => { serverSearchLoading.value = false; });
  }, 300);
}

function selectServer(s: ServerSearchResult) {
  selectedServer.value = s;
  serverSearchQuery.value = s.serverName;
  serverSuggestions.value = [];
  showServerDropdown.value = false;
}

function closeServerDropdown() {
  setTimeout(() => { showServerDropdown.value = false; }, 150);
}

async function runQuery() {
  queryLoading.value = true;
  hasQueried.value = true;
  currentPage.value = 1;
  await loadSessions();
  queryLoading.value = false;
  try {
    const saved: Record<string, unknown> = {
      filters: { ...filters.value },
      serverSearchQuery: serverSearchQuery.value,
      serverGuid: selectedServer.value?.serverGuid,
      serverName: selectedServer.value?.serverName,
      includeDeletedRounds: includeDeletedRounds.value,
    };
    localStorage.setItem(ADMIN_DATA_LAST_SEARCH_KEY, JSON.stringify(saved));
  } catch { /* ignore */ }
}

function clearQuery() {
  filters.value = { serverGuid: undefined, minScore: undefined, minKd: undefined, dateFrom: '', dateTo: '' };
  selectedServer.value = null;
  serverSearchQuery.value = '';
  sessions.value = [];
  totalSessions.value = 0;
  hasQueried.value = false;
  roundDetail.value = null;
  selectedRoundIdsArray.value = [];
}

function toggleRound(roundId: string) {
  const set = new Set(selectedRoundIdsArray.value);
  if (set.has(roundId)) set.delete(roundId);
  else set.add(roundId);
  selectedRoundIdsArray.value = [...set];
}

function toggleSelectAll() {
  if (allSelectableSelected.value) {
    selectedRoundIdsArray.value = [];
  } else {
    selectedRoundIdsArray.value = selectableRoundGroups.value.map((g) => g.roundId);
  }
}

function openBulkDeleteModal() {
  bulkDeleteError.value = null;
  bulkDeleteDone.value = false;
  showBulkDeleteModal.value = true;
}

function closeBulkDeleteModal() {
  showBulkDeleteModal.value = false;
  bulkDeleteDone.value = false;
  bulkDeleteError.value = null;
}

async function onBulkDeleteConfirm() {
  const ids = [...selectedRoundIds.value];
  bulkDeleteLoading.value = true;
  bulkDeleteError.value = null;
  try {
    await adminDataService.deleteRounds(ids);
    bulkDeleteDone.value = true;
    selectedRoundIdsArray.value = [];
    showBulkDeleteModal.value = false;
    emit('post-delete');
    if (hasQueried.value) loadSessions();
    if (roundDetail.value && ids.includes(roundDetail.value.roundId)) {
      roundDetail.value = null;
    }
  } catch (e) {
    bulkDeleteDone.value = true;
    bulkDeleteError.value = e instanceof Error ? e.message : String(e);
  } finally {
    bulkDeleteLoading.value = false;
  }
}

async function loadSessions() {
  tableLoading.value = true;
  try {
    const dateFrom = filters.value.dateFrom ? `${filters.value.dateFrom}T00:00:00Z` : undefined;
    const dateTo = filters.value.dateTo ? `${filters.value.dateTo}T23:59:59Z` : undefined;
    const res = await adminDataService.querySuspiciousSessions(
      {
        serverGuid: filters.value.serverGuid,
        minScore: filters.value.minScore,
        minKd: filters.value.minKd,
        dateFrom,
        dateTo,
        includeDeletedRounds: includeDeletedRounds.value,
        game: props.gameFilter || 'bf1942',
      },
      currentPage.value,
      pageSize.value,
      sortField.value,
      sortOrder.value
    );
    const items = res.items ?? [];
    sessions.value = items;
    const api = res as { totalCount?: number; totalItems?: number };
    totalSessions.value = api.totalCount ?? api.totalItems ?? items.length;
  } catch {
    sessions.value = [];
    totalSessions.value = 0;
  } finally {
    tableLoading.value = false;
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalSessions.value / pageSize.value)));

const roundGroups = computed(() => {
  const map = new Map<string, SuspiciousSessionResponse[]>();
  const order: string[] = [];
  for (const s of sessions.value) {
    const id = s.roundId || '—';
    if (!map.has(id)) {
      map.set(id, []);
      order.push(id);
    }
    map.get(id)!.push(s);
  }
  return order.map((roundId) => ({ roundId, sessions: map.get(roundId)! }));
});

function onSortClick(field: string) {
  const next = sortField.value === field ? (sortOrder.value === -1 ? 1 : -1) : -1;
  sortField.value = field;
  sortOrder.value = next as -1 | 1;
  currentPage.value = 1;
  loadSessions();
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadSessions();
}

function onPageSizeChange() {
  currentPage.value = 1;
  loadSessions();
}

async function viewRound(roundId: string) {
  closeAchievementsPanel();
  undeleteError.value = null;
  roundDetail.value = null;
  roundDetailLoading.value = true;
  try {
    roundDetail.value = await adminDataService.getRoundDetail(roundId);
  } finally {
    roundDetailLoading.value = false;
  }
}

function openDeleteModal() {
  deleteError.value = null;
  showDeleteModal.value = true;
}

function onViewAchievements() {
  if (!roundDetail.value) return;
  achievementsRoundId.value = roundDetail.value.roundId;
  showAchievementsPanel.value = true;
  roundAchievements.value = [];
  roundAchievementsLoading.value = true;
  adminDataService.getRoundAchievements(roundDetail.value.roundId)
    .then((list) => { roundAchievements.value = list; })
    .catch(() => { roundAchievements.value = []; })
    .finally(() => { roundAchievementsLoading.value = false; });
}

function closeAchievementsPanel() {
  showAchievementsPanel.value = false;
  achievementsRoundId.value = null;
  roundAchievements.value = [];
}

async function onDeleteConfirm() {
  if (!roundDetail.value) return;
  deleteError.value = null;
  deleteLoading.value = true;
  try {
    await adminDataService.deleteRound(roundDetail.value.roundId);
    showDeleteModal.value = false;
    roundDetail.value = null;
    emit('post-delete');
    if (hasQueried.value) loadSessions();
  } catch (e) {
    deleteError.value = e instanceof Error ? e.message : 'Delete failed';
  } finally {
    deleteLoading.value = false;
  }
}

async function onUndelete() {
  if (!roundDetail.value) return;
  undeleteError.value = null;
  roundDetailLoading.value = true;
  try {
    await adminDataService.undeleteRound(roundDetail.value.roundId);
    emit('post-undelete');
    const id = roundDetail.value.roundId;
    roundDetail.value = await adminDataService.getRoundDetail(id);
    if (hasQueried.value) loadSessions();
  } catch (e) {
    undeleteError.value = e instanceof Error ? e.message : 'Undelete failed';
  } finally {
    roundDetailLoading.value = false;
  }
}
</script>

<style scoped src="./AdminQueryTab.vue.css"></style>
