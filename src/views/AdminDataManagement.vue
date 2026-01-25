<template>
  <div class="admin-data-portal">
    <!-- Subtle grid overlay -->
    <div class="portal-grid" aria-hidden="true" />

    <div class="portal-inner">
      <header class="portal-header">
        <div class="portal-header-glow" />
        <h1 class="portal-title">
          <span class="portal-title-label">[ OPS ]</span>
          <span class="portal-title-main">Data Intel</span>
        </h1>
        <p class="portal-subtitle">
          Trace anomalous sessions. Modded servers, inflated stats, manipulation patterns.
        </p>
      </header>

      <!-- Tabs -->
      <div class="portal-tabs">
        <button
          :class="['portal-tab', activeTab === 'query' && 'portal-tab--active']"
          @click="activeTab = 'query'"
        >
          <span class="portal-tab-icon">⟩</span> Query
        </button>
        <button
          :class="['portal-tab', activeTab === 'audit' && 'portal-tab--active']"
          @click="activeTab = 'audit'; loadAuditLog()"
        >
          <span class="portal-tab-icon">⟩</span> Audit
        </button>
      </div>

      <!-- Query tab -->
      <div v-show="activeTab === 'query'" class="portal-panel">
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

        <!-- Results + inspect panel (side-by-side on wide screens when inspect is open) -->
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
                          <td colspan="6" class="portal-round-header">
                            {{ (roundSessions[0]?.roundStartTime ? formatDate(roundSessions[0].roundStartTime) + ' · ' : '') + roundId }}
                            <span v-if="roundSessions.length > 1" class="portal-round-header-count">{{ roundSessions.length }} exceeding</span>
                          </td>
                        </tr>
                        <tr v-for="s in roundSessions" :key="`${s.roundId}-${s.playerName}`">
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

          <!-- Round detail: to the right on wide screens when there's space -->
          <div v-if="roundDetail || roundDetailLoading" class="portal-round-wrap">
            <RoundDetailPanel v-if="roundDetail" :detail="roundDetail" :loading="roundDetailLoading" @delete="openDeleteModal" @view-achievements="onViewAchievements" />
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
      </div>

      <!-- Audit tab -->
      <div v-show="activeTab === 'audit'" class="portal-panel">
        <section class="portal-card portal-audit">
          <div class="portal-audit-head">
            <h3 class="portal-audit-title">[ DELETION LOG ]</h3>
            <button
              type="button"
              class="portal-btn portal-btn--ghost portal-btn--sm"
              :disabled="auditLoading"
              @click="loadAuditLog"
            >
              refresh
            </button>
          </div>
          <template v-if="auditLoading">
            <div class="portal-empty portal-empty--loading">
              <span class="portal-empty-dash">—</span>
              <span class="portal-empty-text">loading...</span>
            </div>
          </template>
          <template v-else-if="auditItems.length === 0">
            <div class="portal-empty">
              <span class="portal-empty-dash">∅</span>
              <span class="portal-empty-title">no entries</span>
              <span class="portal-empty-desc">No deletions have been recorded yet.</span>
            </div>
          </template>
          <template v-else>
            <div class="portal-audit-table-wrap">
              <table class="portal-audit-table">
                <thead>
                  <tr>
                    <th>time</th>
                    <th>action</th>
                    <th>target</th>
                    <th>admin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="e in auditItems" :key="e.id">
                    <td class="portal-audit-mono">{{ formatDate(e.timestamp) }}</td>
                    <td>{{ e.action }}</td>
                    <td class="portal-audit-mono">{{ e.targetType }} {{ e.targetId ?? '' }}</td>
                    <td>{{ e.adminEmail }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="auditTotalCount > auditItems.length" class="portal-audit-foot">
              showing {{ auditItems.length }} of {{ auditTotalCount }}
            </div>
          </template>
        </section>
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
  type AuditLogEntry,
  type ServerSearchResult,
} from '@/services/adminDataService';

const activeTab = ref<'query' | 'audit'>('query');
const ADMIN_DATA_LAST_SEARCH_KEY = 'bf1942_admin_data_last_search';

// Query form
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

// Sync selected server to filters
watch(selectedServer, (s) => {
  filters.value.serverGuid = s?.serverGuid;
}, { immediate: true });

// Table
const hasQueried = ref(false);
const sessions = ref<SuspiciousSessionResponse[]>([]);
const totalSessions = ref(0);
const tableLoading = ref(false);
const queryLoading = ref(false);
const sortField = ref('totalScore');
const sortOrder = ref<-1 | 1>(-1);
const currentPage = ref(1);
const pageSize = ref(50);

// Round detail
const roundDetail = ref<RoundDetailResponse | null>(null);
const roundDetailLoading = ref(false);

// Achievements slide-out
const showAchievementsPanel = ref(false);
const achievementsRoundId = ref<string | null>(null);
const roundAchievements = ref<RoundAchievement[]>([]);
const roundAchievementsLoading = ref(false);

// Delete modal
const showDeleteModal = ref(false);
const deleteLoading = ref(false);
const deleteError = ref<string | null>(null);

// Audit log
const auditItems = ref<AuditLogEntry[]>([]);
const auditTotalCount = ref(0);
const auditLoading = ref(false);

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
    searchServersForAdmin(q, 20)
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

onMounted(() => {
  try {
    const raw = localStorage.getItem(ADMIN_DATA_LAST_SEARCH_KEY);
    if (!raw) return;
    const s = JSON.parse(raw) as {
      filters?: { serverGuid?: string; minScore?: number; minKd?: number; dateFrom?: string; dateTo?: string };
      serverSearchQuery?: string;
      serverGuid?: string;
      serverName?: string;
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
  } catch { /* ignore */ }
});

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
}

async function loadSessions() {
  tableLoading.value = true;
  try {
    // From: midnight (00:00:00) of the date; To: 23:59:59 of the date
    const dateFrom = filters.value.dateFrom ? `${filters.value.dateFrom}T00:00:00Z` : undefined;
    const dateTo = filters.value.dateTo ? `${filters.value.dateTo}T23:59:59Z` : undefined;
    const res = await adminDataService.querySuspiciousSessions(
      {
        serverGuid: filters.value.serverGuid,
        minScore: filters.value.minScore,
        minKd: filters.value.minKd,
        dateFrom,
        dateTo,
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
  } catch (e) {
    sessions.value = [];
    totalSessions.value = 0;
  } finally {
    tableLoading.value = false;
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalSessions.value / pageSize.value)));

/** Group sessions by roundId so we can see rounds where multiple players exceed the threshold */
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
    // Refresh sessions if we have a table
    if (hasQueried.value) loadSessions();
  } catch (e) {
    deleteError.value = e instanceof Error ? e.message : 'Delete failed';
  } finally {
    deleteLoading.value = false;
  }
}

async function loadAuditLog() {
  auditLoading.value = true;
  try {
    const res = await adminDataService.getAuditLog(1, 50);
    auditItems.value = res.items ?? [];
    auditTotalCount.value = res.totalCount ?? 0;
  } catch {
    auditItems.value = [];
    auditTotalCount.value = 0;
  } finally {
    auditLoading.value = false;
  }
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
.admin-data-portal {
  --portal-bg: #06060a;
  --portal-surface: #0c0c12;
  --portal-surface-elevated: #111118;
  --portal-border: #1a1a24;
  --portal-border-focus: #2a2a38;
  --portal-accent: #00e5a0;
  --portal-accent-dim: rgba(0, 229, 160, 0.12);
  --portal-accent-glow: rgba(0, 229, 160, 0.25);
  --portal-warn: #f59e0b;
  --portal-danger: #ef4444;
  --portal-danger-glow: rgba(239, 68, 68, 0.2);
  --portal-text: #9ca3af;
  --portal-text-bright: #e5e7eb;
  min-height: 100vh;
  background: var(--portal-bg);
  color: var(--portal-text);
  position: relative;
  font-family: system-ui, sans-serif;
}

.portal-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 229, 160, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 229, 160, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
  z-index: 0;
}

.portal-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 1.5rem 1.5rem 3rem;
}

.portal-header {
  position: relative;
  margin-bottom: 1.5rem;
}
.portal-header-glow {
  position: absolute;
  top: -40px;
  left: -20px;
  width: 200px;
  height: 120px;
  background: radial-gradient(ellipse, var(--portal-accent-glow) 0%, transparent 70%);
  filter: blur(24px);
  opacity: 0.6;
}
.portal-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin: 0;
}
.portal-title-label {
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
  font-size: 0.7em;
  margin-right: 0.5rem;
}
.portal-title-main {
  color: var(--portal-text-bright);
}
.portal-subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--portal-text);
  opacity: 0.9;
}

.portal-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--portal-border);
}
.portal-tab {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: 1px solid transparent;
  margin-bottom: -1px;
  color: var(--portal-text);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.portal-tab:hover {
  color: var(--portal-text-bright);
}
.portal-tab--active {
  color: var(--portal-accent);
  border-color: var(--portal-border);
  border-bottom-color: var(--portal-surface);
  background: var(--portal-surface);
}
.portal-tab-icon {
  margin-right: 0.35rem;
  opacity: 0.7;
}

.portal-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.portal-card {
  background: var(--portal-surface);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  overflow: hidden;
}

.portal-form {
  padding: 1.25rem;
}
.portal-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem 1.25rem;
}
@media (min-width: 640px) {
  .portal-form-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (min-width: 1024px) {
  .portal-form-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  }
}
.portal-field--wide {
  grid-column: 1 / -1;
}
@media (min-width: 1024px) {
  .portal-field--wide {
    grid-column: span 2;
  }
}
.portal-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--portal-accent);
  margin-bottom: 0.35rem;
  font-family: ui-monospace, monospace;
}
.portal-input-wrap {
  position: relative;
}
.portal-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text-bright);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.portal-input::placeholder {
  color: var(--portal-text);
  opacity: 0.5;
}
.portal-input:focus {
  outline: none;
  border-color: var(--portal-accent);
  box-shadow: 0 0 0 3px var(--portal-accent-dim);
}
.portal-input--mono {
  font-family: ui-monospace, monospace;
}
.portal-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 12rem;
  overflow-y: auto;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  z-index: 30;
}
.portal-dropdown-item {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--portal-text-bright);
  cursor: pointer;
  border-bottom: 1px solid var(--portal-border);
  transition: background 0.15s;
}
.portal-dropdown-item:last-child {
  border-bottom: none;
}
.portal-dropdown-item:hover {
  background: var(--portal-accent-dim);
  color: var(--portal-accent);
}
.portal-dropdown-ghost {
  padding: 0.6rem 0.75rem;
  font-size: 0.8rem;
  color: var(--portal-text);
  opacity: 0.7;
}
.portal-hint {
  font-size: 0.7rem;
  color: var(--portal-accent);
  margin-top: 0.35rem;
  font-family: ui-monospace, monospace;
}
.portal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
.portal-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
  border: 1px solid transparent;
}
.portal-btn--primary {
  background: var(--portal-accent);
  color: var(--portal-bg);
  border-color: var(--portal-accent);
}
.portal-btn--primary:hover:not(:disabled) {
  background: #00f5a8;
  border-color: #00f5a8;
  box-shadow: 0 0 16px var(--portal-accent-glow);
}
.portal-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.portal-btn--ghost {
  background: transparent;
  color: var(--portal-text);
  border-color: var(--portal-border);
}
.portal-btn--ghost:hover:not(:disabled) {
  color: var(--portal-text-bright);
  border-color: var(--portal-border-focus);
  background: var(--portal-accent-dim);
}
.portal-btn--sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
}
.portal-btn-pulse {
  animation: portal-pulse 0.8s ease-in-out infinite;
}
@keyframes portal-pulse {
  50% { opacity: 0.6; }
}

.portal-results {
  min-height: 200px;
}

.portal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}
.portal-empty--loading {
  padding: 2.5rem;
}
.portal-empty-dash {
  font-size: 2rem;
  color: var(--portal-accent);
  opacity: 0.5;
  margin-bottom: 0.5rem;
  font-family: ui-monospace, monospace;
}
.portal-empty-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--portal-text-bright);
  letter-spacing: 0.04em;
}
.portal-empty-desc {
  font-size: 0.8rem;
  color: var(--portal-text);
  margin-top: 0.35rem;
  max-width: 20rem;
}

.portal-kd {
  color: var(--portal-text);
}
.portal-kd--high {
  color: var(--portal-warn);
  font-weight: 600;
}
.portal-cell-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: var(--portal-accent-dim);
  color: var(--portal-accent);
  border: 1px solid rgba(0, 229, 160, 0.3);
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
}
.portal-cell-btn:hover {
  background: rgba(0, 229, 160, 0.2);
  box-shadow: 0 0 10px var(--portal-accent-dim);
}

.portal-query-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 1024px) {
  .portal-query-main {
    flex-direction: row;
    align-items: flex-start;
  }
  .portal-query-main .portal-results {
    flex: 1 1 400px;
    min-width: 400px;
  }
  .portal-query-main .portal-round-wrap {
    flex: 1 1 520px;
    min-width: 520px;
    max-width: 58%;
    position: sticky;
    top: 1.5rem;
  }
  .portal-query-main .portal-achievements-wrap {
    flex: 1 1 380px;
    min-width: 320px;
    max-width: 40%;
    position: sticky;
    top: 1.5rem;
  }
}
.portal-round-loading {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portal-mono {
  font-family: ui-monospace, monospace;
}
.portal-sessions-wrap {
  overflow: hidden;
}
.portal-sessions-table-wrap {
  overflow-x: auto;
}
.portal-sessions-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
}
.portal-sessions-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  background: var(--portal-surface-elevated);
  color: var(--portal-accent);
  font-weight: 600;
  letter-spacing: 0.06em;
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--portal-border);
}
.portal-sortable {
  cursor: pointer;
  user-select: none;
}
.portal-sortable:hover {
  color: var(--portal-text-bright);
}
.portal-sort-icon {
  margin-left: 0.25rem;
  opacity: 0.9;
}
.portal-round-header {
  padding: 0.5rem 0.75rem;
  background: rgba(17, 17, 24, 0.95);
  color: var(--portal-accent);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  font-family: ui-monospace, monospace;
  border-top: 1px solid var(--portal-border);
  border-bottom: 1px solid var(--portal-border);
}
.portal-round-header-count {
  margin-left: 0.5rem;
  color: var(--portal-warn);
  font-weight: 700;
}
.portal-sessions-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}
.portal-sessions-table tbody tr:hover td {
  background: var(--portal-accent-dim);
}
.portal-sessions-table tbody tr:hover td.portal-round-header {
  background: rgba(17, 17, 24, 0.95);
}
.portal-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-top: 1px solid var(--portal-border);
  background: var(--portal-surface-elevated);
  font-size: 0.75rem;
  color: var(--portal-text);
}
.portal-pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.portal-pagination-select {
  padding: 0.25rem 0.5rem;
  background: var(--portal-surface);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text-bright);
  font-size: 0.75rem;
  cursor: pointer;
}
.portal-pagination-page {
  color: var(--portal-text);
  opacity: 0.9;
}

.portal-audit {
  overflow: hidden;
}
.portal-audit-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--portal-border);
}
.portal-audit-title {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--portal-accent);
  margin: 0;
  font-family: ui-monospace, monospace;
}
.portal-audit-table-wrap {
  overflow-x: auto;
}
.portal-audit-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
}
.portal-audit-table th {
  text-align: left;
  padding: 0.5rem 1rem;
  background: var(--portal-surface-elevated);
  color: var(--portal-accent);
  font-weight: 600;
  letter-spacing: 0.06em;
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--portal-border);
}
.portal-audit-table td {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--portal-border);
  color: var(--portal-text-bright);
}
.portal-audit-table tbody tr:hover td {
  background: var(--portal-accent-dim);
}
.portal-audit-mono {
  font-family: ui-monospace, monospace;
  color: var(--portal-text);
}
.portal-audit-foot {
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  color: var(--portal-text);
  opacity: 0.8;
  border-top: 1px solid var(--portal-border);
}
</style>
