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
        <!-- Game type filter: same options as landing (BF1942, FH2, BFV) -->
        <div class="portal-game-filters">
          <button
            v-for="g in gameTypes"
            :key="g.id"
            :class="['portal-game-chip', activeGameFilter === g.id && 'portal-game-chip--active']"
            type="button"
            @click="setGameFilter(g.id)"
          >
            <span class="portal-game-chip-label">{{ g.label }}</span>
          </button>
        </div>
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
          @click="activeTab = 'audit'; auditTabRef?.load?.()"
        >
          <span class="portal-tab-icon">⟩</span> Audit
        </button>
        <button
          v-if="isAdmin"
          :class="['portal-tab', activeTab === 'cron' && 'portal-tab--active']"
          @click="activeTab = 'cron'"
        >
          <span class="portal-tab-icon">⟩</span> Cron
        </button>
        <button
          v-if="isAdmin"
          :class="['portal-tab', activeTab === 'access' && 'portal-tab--active']"
          @click="activeTab = 'access'; accessTabRef?.load?.()"
        >
          <span class="portal-tab-icon">⟩</span> Access
        </button>
        <button
          v-if="isAdmin"
          :class="['portal-tab', activeTab === 'notice' && 'portal-tab--active']"
          @click="activeTab = 'notice'; noticeTabRef?.load?.()"
        >
          <span class="portal-tab-icon">⟩</span> Notice
        </button>
      </div>

      <!-- Post-delete hint: run Daily Aggregate to refresh stats -->
      <div v-if="showPostDeleteAggregateHint" class="portal-hint-banner">
        <span class="portal-hint-banner-text">Round marked as deleted (achievements removed; round and sessions kept). Aggregate stats may be stale — run Daily Aggregate Refresh in Cron to recalc.</span>
        <div class="portal-hint-banner-actions">
          <button type="button" class="portal-btn portal-btn--primary portal-btn--sm" @click="activeTab = 'cron'; showPostDeleteAggregateHint = false">Go to Cron</button>
          <button type="button" class="portal-btn portal-btn--ghost portal-btn--sm" @click="showPostDeleteAggregateHint = false">Dismiss</button>
        </div>
      </div>

      <!-- Post-undelete hint: run Daily Aggregate to refresh stats -->
      <div v-if="showPostUndeleteAggregateHint" class="portal-hint-banner">
        <span class="portal-hint-banner-text">Round restored. Aggregate stats may be stale — run Daily Aggregate Refresh in Cron to recalc. Achievements need to be rebuilt separately.</span>
        <div class="portal-hint-banner-actions">
          <button type="button" class="portal-btn portal-btn--primary portal-btn--sm" @click="activeTab = 'cron'; showPostUndeleteAggregateHint = false">Go to Cron</button>
          <button type="button" class="portal-btn portal-btn--ghost portal-btn--sm" @click="showPostUndeleteAggregateHint = false">Dismiss</button>
        </div>
      </div>

      <!-- Query tab -->
      <div v-show="activeTab === 'query'" class="portal-panel">
        <AdminQueryTab
          :game-filter="activeGameFilter"
          :can-delete="isAdmin"
          @post-delete="showPostDeleteAggregateHint = true"
          @post-undelete="showPostUndeleteAggregateHint = true"
        />
      </div>

      <!-- Audit tab -->
      <div v-show="activeTab === 'audit'" class="portal-panel">
        <AdminAuditTab ref="auditTabRef" />
      </div>

      <!-- Cron tab (admin only) -->
      <div v-if="isAdmin" v-show="activeTab === 'cron'" class="portal-panel">
        <AdminCronTab />
      </div>

      <!-- Access tab (admin only) -->
      <div v-show="activeTab === 'access'" class="portal-panel">
        <AdminAccessTab ref="accessTabRef" />
      </div>

      <!-- Notice tab (admin only) -->
      <div v-if="isAdmin" v-show="activeTab === 'notice'" class="portal-panel">
        <AdminNoticeTab ref="noticeTabRef" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AdminQueryTab from '@/components/admin-data/AdminQueryTab.vue';
import AdminAuditTab from '@/components/admin-data/AdminAuditTab.vue';
import AdminCronTab from '@/components/admin-data/AdminCronTab.vue';
import AdminAccessTab from '@/components/admin-data/AdminAccessTab.vue';
import AdminNoticeTab from '@/components/admin-data/AdminNoticeTab.vue';
import { useAuth } from '@/composables/useAuth';

const { isAdmin } = useAuth();

const ADMIN_DATA_GAME_FILTER_KEY = 'bf1942_admin_data_game_filter';

const gameTypes = [
  { id: 'bf1942', label: 'BF1942' },
  { id: 'fh2', label: 'FH2' },
  { id: 'bfvietnam', label: 'BFV' },
];

const activeTab = ref<'query' | 'audit' | 'cron' | 'access' | 'notice'>('query');
const activeGameFilter = ref<string>('bf1942');
const showPostDeleteAggregateHint = ref(false);
const showPostUndeleteAggregateHint = ref(false);
const auditTabRef = ref<InstanceType<typeof AdminAuditTab> | null>(null);
const accessTabRef = ref<InstanceType<typeof AdminAccessTab> & { load?: () => void } | null>(null);
const noticeTabRef = ref<InstanceType<typeof AdminNoticeTab> & { load?: () => void } | null>(null);

function setGameFilter(id: string) {
  if (!gameTypes.some((g) => g.id === id)) return;
  activeGameFilter.value = id;
  try {
    localStorage.setItem(ADMIN_DATA_GAME_FILTER_KEY, id);
  } catch { /* ignore */ }
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(ADMIN_DATA_GAME_FILTER_KEY);
    if (saved && gameTypes.some((g) => g.id === saved)) activeGameFilter.value = saved;
  } catch { /* ignore */ }
});
</script>

<style scoped src="./AdminDataManagement.vue.css"></style>

<style>
/* Unscoped: apply to tab components under .admin-data-portal (scoped does not reach child DOM) */
.admin-data-portal .portal-card { background: var(--portal-surface); border: 1px solid var(--portal-border); border-radius: 2px; overflow: hidden; }
.admin-data-portal .portal-form { padding: 1.25rem; }
.admin-data-portal .portal-btn { padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; border-radius: 2px; cursor: pointer; transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s; border: 1px solid transparent; }
.admin-data-portal .portal-btn--primary { background: var(--portal-accent); color: var(--portal-bg); border-color: var(--portal-accent); }
.admin-data-portal .portal-btn--ghost { background: transparent; color: var(--portal-text); border-color: var(--portal-border); }
.admin-data-portal .portal-btn--sm { padding: 0.35rem 0.65rem; font-size: 0.75rem; }
.admin-data-portal .portal-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; text-align: center; }
.admin-data-portal .portal-empty--loading { padding: 2.5rem; }
.admin-data-portal .portal-empty-dash { font-size: 2rem; color: var(--portal-accent); opacity: 0.5; margin-bottom: 0.5rem; font-family: ui-monospace, monospace; }
.admin-data-portal .portal-empty-text { font-size: 0.8rem; color: var(--portal-text); }
.admin-data-portal .portal-empty-title { font-size: 0.9rem; font-weight: 600; color: var(--portal-text-bright); letter-spacing: 0.04em; }
.admin-data-portal .portal-empty-desc { font-size: 0.8rem; color: var(--portal-text); margin-top: 0.35rem; max-width: 20rem; }
.admin-data-portal .portal-audit { overflow: hidden; }
.admin-data-portal .portal-audit-head { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-audit-title { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; color: var(--portal-accent); margin: 0; font-family: ui-monospace, monospace; }
.admin-data-portal .portal-audit-table-wrap { overflow-x: auto; }
.admin-data-portal .portal-audit-table { width: 100%; font-size: 0.8rem; border-collapse: collapse; }
.admin-data-portal .portal-audit-table th { text-align: left; padding: 0.5rem 1rem; background: var(--portal-surface-elevated); color: var(--portal-accent); font-weight: 600; letter-spacing: 0.06em; font-family: ui-monospace, monospace; border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-audit-table td { padding: 0.5rem 1rem; border-bottom: 1px solid var(--portal-border); color: var(--portal-text-bright); }
.admin-data-portal .portal-audit-mono { font-family: ui-monospace, monospace; color: var(--portal-text); }
.admin-data-portal .portal-audit-foot { padding: 0.5rem 1rem; font-size: 0.7rem; color: var(--portal-text); opacity: 0.8; border-top: 1px solid var(--portal-border); }
.admin-data-portal .portal-cron { overflow: hidden; }
.admin-data-portal .portal-cron-head { padding: 1rem 1.25rem; border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-cron-title { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; color: var(--portal-accent); margin: 0 0 0.35rem; font-family: ui-monospace, monospace; }
.admin-data-portal .portal-cron-desc { font-size: 0.8rem; color: var(--portal-text); margin: 0; line-height: 1.4; }
.admin-data-portal .portal-cron-err { margin: 0.75rem 1.25rem 0; padding: 0.5rem 0.75rem; font-size: 0.8rem; color: var(--portal-danger); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 2px; }
.admin-data-portal .portal-cron-ok { margin: 0.75rem 1.25rem 0; padding: 0.5rem 0.75rem; font-size: 0.8rem; color: var(--portal-accent); background: var(--portal-accent-dim); border: 1px solid rgba(0, 229, 160, 0.3); border-radius: 2px; }
.admin-data-portal .portal-cron-list { padding: 0.75rem 1.25rem 1.25rem; }
.admin-data-portal .portal-cron-item { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-cron-item--priority { background: var(--portal-accent-dim); margin: 0 -1.25rem; padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-cron-item-body { flex: 1 1 14rem; display: flex; flex-direction: column; gap: 0.2rem; }
.admin-data-portal .portal-cron-item-name { font-size: 0.8rem; font-weight: 600; color: var(--portal-text-bright); }
.admin-data-portal .portal-cron-item-desc { font-size: 0.7rem; color: var(--portal-text); opacity: 0.9; }
.admin-data-portal .portal-cron-item-actions { display: flex; align-items: center; gap: 0.5rem; }
.admin-data-portal .portal-cron-select { padding: 0.25rem 0.5rem; background: var(--portal-surface-elevated); border: 1px solid var(--portal-border); border-radius: 2px; color: var(--portal-text-bright); font-size: 0.8rem; cursor: pointer; }
.admin-data-portal .portal-form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem 1.25rem; }
@media (min-width: 640px) { .admin-data-portal .portal-form-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .admin-data-portal .portal-form-grid { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; } }
.admin-data-portal .portal-field--wide { grid-column: 1 / -1; }
.admin-data-portal .portal-label { display: block; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.12em; color: var(--portal-accent); margin-bottom: 0.35rem; font-family: ui-monospace, monospace; }
.admin-data-portal .portal-input-wrap { position: relative; }
.admin-data-portal .portal-input { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; background: var(--portal-surface-elevated); border: 1px solid var(--portal-border); border-radius: 2px; color: var(--portal-text-bright); transition: border-color 0.2s, box-shadow 0.2s; }
.admin-data-portal .portal-input:focus { outline: none; border-color: var(--portal-accent); box-shadow: 0 0 0 3px var(--portal-accent-dim); }
.admin-data-portal .portal-input--mono { font-family: ui-monospace, monospace; }
.admin-data-portal .portal-dropdown { position: absolute; top: 100%; left: 0; right: 0; margin-top: 2px; max-height: 12rem; overflow-y: auto; background: var(--portal-surface-elevated); border: 1px solid var(--portal-border); border-radius: 2px; z-index: 30; }
.admin-data-portal .portal-dropdown-item { padding: 0.5rem 0.75rem; font-size: 0.8rem; color: var(--portal-text-bright); cursor: pointer; border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-dropdown-item:hover { background: var(--portal-accent-dim); color: var(--portal-accent); }
.admin-data-portal .portal-hint { font-size: 0.7rem; color: var(--portal-accent); margin-top: 0.35rem; font-family: ui-monospace, monospace; }
.admin-data-portal .portal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
.admin-data-portal .portal-results { min-height: 200px; }
.admin-data-portal .portal-query-main { display: flex; flex-direction: column; gap: 1rem; }
@media (min-width: 1024px) { .admin-data-portal .portal-query-main { flex-direction: row; align-items: flex-start; } .admin-data-portal .portal-query-main .portal-results { flex: 1 1 400px; min-width: 400px; } .admin-data-portal .portal-query-main .portal-round-wrap { flex: 1 1 520px; min-width: 520px; max-width: 58%; position: sticky; top: 1.5rem; } .admin-data-portal .portal-query-main .portal-achievements-wrap { flex: 1 1 380px; min-width: 320px; max-width: 40%; position: sticky; top: 1.5rem; } }
.admin-data-portal .portal-sessions-table { width: 100%; font-size: 0.8rem; border-collapse: collapse; }
.admin-data-portal .portal-sessions-table th { text-align: left; padding: 0.5rem 0.75rem; background: var(--portal-surface-elevated); color: var(--portal-accent); font-weight: 600; letter-spacing: 0.06em; font-family: ui-monospace, monospace; border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-sessions-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--portal-border); color: var(--portal-text-bright); }
.admin-data-portal .portal-sortable { cursor: pointer; user-select: none; }
.admin-data-portal .portal-round-header { padding: 0.5rem 0.75rem; background: rgba(0, 229, 160, 0.1); color: var(--portal-accent); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; font-family: ui-monospace, monospace; border-top: 1px solid var(--portal-border); border-bottom: 1px solid rgba(0, 229, 160, 0.25); box-shadow: inset 0 0 24px rgba(0, 229, 160, 0.04); }
.admin-data-portal .portal-round-header:first-child { border-left: 3px solid var(--portal-accent); }
.admin-data-portal .portal-round-header-deleted { margin-left: 0.5rem; color: var(--portal-warn); font-size: 0.6rem; font-weight: 600; opacity: 0.9; }
.admin-data-portal .portal-sessions-table tbody td:not(.portal-round-header) { background: rgba(17, 17, 24, 0.5); }
.admin-data-portal .portal-sessions-table tbody tr:hover td:not(.portal-round-header) { background: var(--portal-accent-dim); }
.admin-data-portal .portal-sessions-table tbody tr:hover td.portal-round-header { background: rgba(0, 229, 160, 0.14); box-shadow: inset 0 0 24px rgba(0, 229, 160, 0.06); }
.admin-data-portal .portal-mono { font-family: ui-monospace, monospace; }
.admin-data-portal .portal-cell-btn { padding: 0.25rem 0.5rem; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; background: var(--portal-accent-dim); color: var(--portal-accent); border: 1px solid rgba(0, 229, 160, 0.3); border-radius: 2px; cursor: pointer; }
.admin-data-portal .portal-kd--high { color: var(--portal-warn); font-weight: 600; }
.admin-data-portal .portal-pagination { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding: 0.6rem 0.75rem; border-top: 1px solid var(--portal-border); background: var(--portal-surface-elevated); font-size: 0.75rem; color: var(--portal-text); }
.admin-data-portal .portal-round-loading { min-height: 200px; display: flex; align-items: center; justify-content: center; }
</style>
