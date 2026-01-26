<template>
  <div class="portal-access-tab">
    <div class="portal-card portal-audit">
      <div class="portal-audit-head">
        <h2 class="portal-audit-title">[ ACCESS ]</h2>
        <button
          type="button"
          class="portal-btn portal-btn--ghost portal-btn--sm"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? 'loading…' : 'refresh' }}
        </button>
      </div>
      <p class="portal-access-desc">Assign User or Support. Admin is fixed. Only admins can change roles.</p>
      <div v-if="error" class="portal-cron-err">{{ error }}</div>
      <div class="portal-audit-table-wrap">
        <table class="portal-audit-table">
          <thead>
            <tr>
              <th>email</th>
              <th>role</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.userId">
              <td class="portal-audit-mono">{{ u.email }}</td>
              <td>
                <select
                  :value="u.role"
                  :disabled="u.role === 'Admin' || savingId === u.userId"
                  class="portal-cron-select"
                  @change="onRoleChange(u.userId, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="User">User</option>
                  <option value="Support">Support</option>
                  <option value="Admin" disabled>Admin (fixed)</option>
                </select>
              </td>
              <td>
                <span v-if="u.role === 'Admin'" class="portal-access-fixed">—</span>
                <span v-else-if="savingId === u.userId" class="portal-access-saving">saving…</span>
                <span v-else-if="saveErrorId === u.userId" class="portal-access-err">{{ saveError }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="users.length === 0 && !loading" class="portal-empty">
        <span class="portal-empty-dash">∅</span>
        <span class="portal-empty-title">No users</span>
        <span class="portal-empty-desc">Users appear after they sign in.</span>
      </div>
      <div class="portal-audit-foot">Users who have signed in. Role takes effect on next login or token refresh.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminDataService, type UserWithRoleResponse } from '@/services/adminDataService';
import { ROLE_USER, ROLE_SUPPORT } from '@/constants/roles';

const users = ref<UserWithRoleResponse[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const savingId = ref<number | null>(null);
const saveError = ref<string | null>(null);
const saveErrorId = ref<number | null>(null);

const ALLOWED_ROLES = [ROLE_USER, ROLE_SUPPORT];

async function load() {
  loading.value = true;
  error.value = null;
  try {
    users.value = await adminDataService.listUsers();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load users';
    users.value = [];
  } finally {
    loading.value = false;
  }
}

async function onRoleChange(userId: number, role: string) {
  if (!ALLOWED_ROLES.includes(role)) return;
  savingId.value = userId;
  saveError.value = null;
  saveErrorId.value = null;
  try {
    await adminDataService.setUserRole(userId, role);
    const u = users.value.find((x) => x.userId === userId);
    if (u) u.role = role;
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Failed to save';
    saveErrorId.value = userId;
  } finally {
    savingId.value = null;
  }
}

onMounted(() => load());

defineExpose({ load });
</script>

<style scoped>
.portal-access-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.portal-access-desc {
  margin: 0;
  padding: 0 1.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--portal-text);
  opacity: 0.9;
}
.portal-access-fixed {
  font-size: 0.75rem;
  color: var(--portal-text);
  opacity: 0.7;
}
.portal-access-saving {
  font-size: 0.75rem;
  color: var(--portal-accent);
}
.portal-access-err {
  font-size: 0.75rem;
  color: var(--portal-danger);
}
</style>
