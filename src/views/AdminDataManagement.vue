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
          @click="activeTab = 'audit'; auditTabRef?.load?.()"
        >
          <span class="portal-tab-icon">⟩</span> Audit
        </button>
        <button
          :class="['portal-tab', activeTab === 'cron' && 'portal-tab--active']"
          @click="activeTab = 'cron'"
        >
          <span class="portal-tab-icon">⟩</span> Cron
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

      <!-- Query tab -->
      <div v-show="activeTab === 'query'" class="portal-panel">
        <AdminQueryTab @post-delete="showPostDeleteAggregateHint = true" />
      </div>

      <!-- Audit tab -->
      <div v-show="activeTab === 'audit'" class="portal-panel">
        <AdminAuditTab ref="auditTabRef" />
      </div>

      <!-- Cron tab -->
      <div v-show="activeTab === 'cron'" class="portal-panel">
        <AdminCronTab />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AdminQueryTab from '@/components/admin-data/AdminQueryTab.vue';
import AdminAuditTab from '@/components/admin-data/AdminAuditTab.vue';
import AdminCronTab from '@/components/admin-data/AdminCronTab.vue';

const activeTab = ref<'query' | 'audit' | 'cron'>('query');
const showPostDeleteAggregateHint = ref(false);
const auditTabRef = ref<InstanceType<typeof AdminAuditTab> | null>(null);
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

/* Post-delete hint banner */
.portal-hint-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 2px;
  margin-bottom: 1rem;
}
.portal-hint-banner-text {
  flex: 1 1 12rem;
  font-size: 0.8rem;
  color: var(--portal-text-bright);
}
.portal-hint-banner-actions {
  display: flex;
  gap: 0.5rem;
}

/* Cron (background jobs) */
.portal-cron {
  overflow: hidden;
}
.portal-cron-head {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--portal-border);
}
.portal-cron-title {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--portal-accent);
  margin: 0 0 0.35rem;
  font-family: ui-monospace, monospace;
}
.portal-cron-desc {
  font-size: 0.8rem;
  color: var(--portal-text);
  margin: 0;
  line-height: 1.4;
}
.portal-cron-desc strong {
  color: var(--portal-text-bright);
}
.portal-cron-err {
  margin: 0.75rem 1.25rem 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--portal-danger);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 2px;
}
.portal-cron-ok {
  margin: 0.75rem 1.25rem 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--portal-accent);
  background: var(--portal-accent-dim);
  border: 1px solid rgba(0, 229, 160, 0.3);
  border-radius: 2px;
}
.portal-cron-list {
  padding: 0.75rem 1.25rem 1.25rem;
}
.portal-cron-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--portal-border);
}
.portal-cron-item:last-child {
  border-bottom: none;
}
.portal-cron-item--priority {
  background: var(--portal-accent-dim);
  margin: 0 -1.25rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--portal-border);
}
.portal-cron-item-body {
  flex: 1 1 14rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.portal-cron-item-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--portal-text-bright);
}
.portal-cron-item-desc {
  font-size: 0.7rem;
  color: var(--portal-text);
  opacity: 0.9;
}
.portal-cron-item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.portal-cron-select {
  padding: 0.25rem 0.5rem;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text-bright);
  font-size: 0.8rem;
  cursor: pointer;
}
</style>

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
.admin-data-portal .portal-round-header { padding: 0.5rem 0.75rem; background: rgba(17, 17, 24, 0.95); color: var(--portal-accent); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; font-family: ui-monospace, monospace; border-top: 1px solid var(--portal-border); border-bottom: 1px solid var(--portal-border); }
.admin-data-portal .portal-mono { font-family: ui-monospace, monospace; }
.admin-data-portal .portal-cell-btn { padding: 0.25rem 0.5rem; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; background: var(--portal-accent-dim); color: var(--portal-accent); border: 1px solid rgba(0, 229, 160, 0.3); border-radius: 2px; cursor: pointer; }
.admin-data-portal .portal-kd--high { color: var(--portal-warn); font-weight: 600; }
.admin-data-portal .portal-pagination { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding: 0.6rem 0.75rem; border-top: 1px solid var(--portal-border); background: var(--portal-surface-elevated); font-size: 0.75rem; color: var(--portal-text); }
.admin-data-portal .portal-round-loading { min-height: 200px; display: flex; align-items: center; justify-content: center; }
</style>
