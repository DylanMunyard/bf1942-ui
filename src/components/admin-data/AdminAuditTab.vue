<template>
  <section class="portal-card portal-audit">
    <div class="portal-audit-head">
      <h3 class="portal-audit-title">[ DELETION LOG ]</h3>
      <button
        type="button"
        class="portal-btn portal-btn--ghost portal-btn--sm"
        :disabled="auditLoading"
        @click="load"
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
    <template v-else-if="items.length === 0">
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
            <tr v-for="e in items" :key="e.id">
              <td class="portal-audit-mono">{{ formatDate(e.timestamp) }}</td>
              <td>{{ e.action }}</td>
              <td class="portal-audit-mono">{{ e.targetType }} {{ e.targetId ?? '' }}</td>
              <td>{{ e.adminEmail }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalCount > items.length" class="portal-audit-foot">
        showing {{ items.length }} of {{ totalCount }}
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminDataService, type AuditLogEntry } from '@/services/adminDataService';
import { formatDateTimeShort } from '@/utils/date';

const items = ref<AuditLogEntry[]>([]);
const totalCount = ref(0);
const auditLoading = ref(false);

function formatDate(iso: string): string {
  return formatDateTimeShort(iso);
}

async function load() {
  auditLoading.value = true;
  try {
    const res = await adminDataService.getAuditLog(1, 50);
    items.value = res.items;
    totalCount.value = res.totalCount;
  } catch {
    items.value = [];
    totalCount.value = 0;
  } finally {
    auditLoading.value = false;
  }
}

defineExpose({ load });

onMounted(load);
</script>
