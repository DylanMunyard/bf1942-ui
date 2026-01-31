<template>
  <section class="portal-card portal-notice">
    <div class="portal-notice-head">
      <h3 class="portal-notice-title">[ NOTICE ]</h3>
      <p class="portal-notice-desc">Manage site-wide notice banner. Displays above all pages when active.</p>
    </div>

    <div v-if="error" class="portal-notice-err">{{ error }}</div>
    <div v-if="success" class="portal-notice-ok">{{ success }}</div>

    <!-- Current Notice Preview -->
    <div v-if="currentNotice" class="portal-notice-preview">
      <div class="portal-notice-preview-header">
        <span class="portal-notice-preview-label">CURRENT NOTICE</span>
        <span :class="['portal-notice-type-badge', `portal-notice-type-badge--${currentNotice.type}`]">
          {{ currentNotice.type.toUpperCase() }}
        </span>
      </div>
      <div :class="['portal-notice-preview-content', `portal-notice-preview-content--${currentNotice.type}`]">
        <div class="portal-notice-preview-text" v-html="renderedCurrentNotice" />
      </div>
      <div class="portal-notice-preview-meta">
        <span v-if="currentNotice.dismissible" class="portal-notice-meta-item">Dismissible</span>
        <span v-if="currentNotice.expiresAt" class="portal-notice-meta-item">
          Expires: {{ formatDate(currentNotice.expiresAt) }}
        </span>
        <span class="portal-notice-meta-item">
          Created: {{ formatDate(currentNotice.createdAt) }}
        </span>
      </div>
      <div class="portal-notice-preview-actions">
        <button
          type="button"
          class="portal-btn portal-btn--ghost portal-btn--sm"
          @click="editNotice"
        >
          Edit
        </button>
        <button
          type="button"
          class="portal-btn portal-btn--danger portal-btn--sm"
          :disabled="saving"
          @click="clearNotice"
        >
          {{ saving ? 'Clearing...' : 'Clear Notice' }}
        </button>
      </div>
    </div>

    <!-- No Notice State -->
    <div v-else-if="!isEditing && !loading" class="portal-notice-empty">
      <span class="portal-notice-empty-icon">[ ]</span>
      <span class="portal-notice-empty-text">No active notice</span>
      <button
        type="button"
        class="portal-btn portal-btn--primary portal-btn--sm"
        @click="isEditing = true"
      >
        Create Notice
      </button>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="portal-notice-loading">
      <span class="portal-notice-loading-text">Loading...</span>
    </div>

    <!-- Editor -->
    <div v-if="isEditing" class="portal-notice-editor">
      <div class="portal-notice-editor-header">
        <span class="portal-notice-editor-label">{{ currentNotice ? 'EDIT NOTICE' : 'CREATE NOTICE' }}</span>
      </div>

      <div class="portal-notice-form">
        <!-- Content -->
        <div class="portal-field portal-field--wide">
          <label class="portal-label">Content (Markdown)</label>
          <textarea
            v-model="form.content"
            class="portal-input portal-input--mono portal-textarea"
            placeholder="Enter notice content... Supports **bold**, *italic*, [links](url)"
            rows="4"
          />
        </div>

        <!-- Type -->
        <div class="portal-field">
          <label class="portal-label">Type</label>
          <select v-model="form.type" class="portal-input">
            <option value="info">Info (Cyan)</option>
            <option value="warning">Warning (Gold)</option>
            <option value="success">Success (Green)</option>
            <option value="error">Error (Red)</option>
          </select>
        </div>

        <!-- Dismissible -->
        <div class="portal-field">
          <label class="portal-label">Dismissible</label>
          <div class="portal-checkbox-wrap">
            <input
              id="dismissible"
              v-model="form.dismissible"
              type="checkbox"
              class="portal-checkbox"
            />
            <label for="dismissible" class="portal-checkbox-label">
              Allow users to dismiss
            </label>
          </div>
        </div>

        <!-- Expiration -->
        <div class="portal-field">
          <label class="portal-label">Expires At (Optional)</label>
          <input
            v-model="form.expiresAt"
            type="datetime-local"
            class="portal-input"
          />
        </div>

        <!-- Preview -->
        <div class="portal-field portal-field--wide">
          <label class="portal-label">Preview</label>
          <div :class="['portal-notice-form-preview', `portal-notice-form-preview--${form.type}`]">
            <div v-if="form.content" v-html="renderedFormContent" />
            <span v-else class="portal-notice-form-preview-empty">Enter content to see preview...</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="portal-notice-form-actions portal-field--wide">
          <button
            type="button"
            class="portal-btn portal-btn--ghost"
            @click="cancelEdit"
          >
            Cancel
          </button>
          <button
            type="button"
            class="portal-btn portal-btn--primary"
            :disabled="saving || !form.content.trim()"
            @click="saveNotice"
          >
            {{ saving ? 'Saving...' : (currentNotice ? 'Update Notice' : 'Create Notice') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';
import type { SiteNotice } from '@/types/playerStatsTypes';
import { useSiteNotice } from '@/composables/useSiteNotice';
import { adminDataService } from '@/services/adminDataService';

const { notice: globalNotice, setNotice: setGlobalNotice } = useSiteNotice();

const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const isEditing = ref(false);
const currentNotice = ref<SiteNotice | null>(null);

const form = ref({
  content: '',
  type: 'info' as 'info' | 'warning' | 'success' | 'error',
  dismissible: true,
  expiresAt: '',
});

const renderedCurrentNotice = computed(() => {
  if (!currentNotice.value?.content) return '';
  try {
    return marked(currentNotice.value.content, { breaks: true });
  } catch {
    return currentNotice.value.content;
  }
});

const renderedFormContent = computed(() => {
  if (!form.value.content) return '';
  try {
    return marked(form.value.content, { breaks: true });
  } catch {
    return form.value.content;
  }
});

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString();
  } catch {
    return dateStr;
  }
}

function editNotice() {
  if (currentNotice.value) {
    form.value = {
      content: currentNotice.value.content,
      type: currentNotice.value.type,
      dismissible: currentNotice.value.dismissible,
      expiresAt: currentNotice.value.expiresAt
        ? new Date(currentNotice.value.expiresAt).toISOString().slice(0, 16)
        : '',
    };
  }
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
  form.value = {
    content: '',
    type: 'info',
    dismissible: true,
    expiresAt: '',
  };
}

async function loadNotice() {
  loading.value = true;
  error.value = null;
  try {
    const data = await adminDataService.getAppData('site_notice');
    if (data && data.value) {
      currentNotice.value = JSON.parse(data.value) as SiteNotice;
    } else {
      currentNotice.value = null;
    }
  } catch (e) {
    // If 404, no notice exists
    currentNotice.value = null;
  } finally {
    loading.value = false;
  }
}

async function saveNotice() {
  if (!form.value.content.trim()) return;

  saving.value = true;
  error.value = null;
  success.value = null;

  try {
    const noticeData: SiteNotice = {
      id: currentNotice.value?.id || crypto.randomUUID(),
      content: form.value.content.trim(),
      type: form.value.type,
      dismissible: form.value.dismissible,
      expiresAt: form.value.expiresAt ? new Date(form.value.expiresAt).toISOString() : undefined,
      createdAt: currentNotice.value?.createdAt || new Date().toISOString(),
    };

    await adminDataService.setAppData('site_notice', JSON.stringify(noticeData));
    currentNotice.value = noticeData;
    setGlobalNotice(noticeData);
    isEditing.value = false;
    success.value = 'Notice saved successfully.';
    form.value = { content: '', type: 'info', dismissible: true, expiresAt: '' };
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save notice';
  } finally {
    saving.value = false;
  }
}

async function clearNotice() {
  saving.value = true;
  error.value = null;
  success.value = null;

  try {
    await adminDataService.deleteAppData('site_notice');
    currentNotice.value = null;
    setGlobalNotice(null);
    success.value = 'Notice cleared.';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to clear notice';
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadNotice();
});

defineExpose({ load: loadNotice });
</script>

<style scoped>
.portal-notice-head {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--portal-border);
}

.portal-notice-title {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--portal-accent);
  margin: 0 0 0.35rem;
  font-family: ui-monospace, monospace;
}

.portal-notice-desc {
  font-size: 0.8rem;
  color: var(--portal-text);
  margin: 0;
  line-height: 1.4;
}

.portal-notice-err {
  margin: 0.75rem 1.25rem 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--neon-red);
  background: rgba(255, 49, 49, 0.1);
  border: 1px solid rgba(255, 49, 49, 0.3);
  border-radius: 2px;
}

.portal-notice-ok {
  margin: 0.75rem 1.25rem 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--neon-green);
  background: rgba(57, 255, 20, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 2px;
}

.portal-notice-preview {
  margin: 1rem 1.25rem;
  border: 1px solid var(--portal-border);
  border-radius: 4px;
  overflow: hidden;
}

.portal-notice-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--portal-surface-elevated);
  border-bottom: 1px solid var(--portal-border);
}

.portal-notice-preview-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--portal-text);
  font-family: ui-monospace, monospace;
}

.portal-notice-type-badge {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 0.125rem 0.375rem;
  border-radius: 2px;
  font-family: ui-monospace, monospace;
}

.portal-notice-type-badge--info {
  background: rgba(0, 255, 242, 0.15);
  color: var(--neon-cyan);
}

.portal-notice-type-badge--warning {
  background: rgba(255, 215, 0, 0.15);
  color: var(--neon-gold);
}

.portal-notice-type-badge--success {
  background: rgba(57, 255, 20, 0.15);
  color: var(--neon-green);
}

.portal-notice-type-badge--error {
  background: rgba(255, 49, 49, 0.15);
  color: var(--neon-red);
}

.portal-notice-preview-content {
  padding: 0.75rem;
  font-size: 0.85rem;
  line-height: 1.5;
}

.portal-notice-preview-content--info {
  background: rgba(0, 255, 242, 0.08);
  color: var(--neon-cyan);
}

.portal-notice-preview-content--warning {
  background: rgba(255, 215, 0, 0.08);
  color: var(--neon-gold);
}

.portal-notice-preview-content--success {
  background: rgba(57, 255, 20, 0.08);
  color: var(--neon-green);
}

.portal-notice-preview-content--error {
  background: rgba(255, 49, 49, 0.08);
  color: var(--neon-red);
}

.portal-notice-preview-text :deep(p) {
  margin: 0;
}

.portal-notice-preview-text :deep(p + p) {
  margin-top: 0.5rem;
}

.portal-notice-preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--portal-border);
  background: var(--portal-surface-elevated);
}

.portal-notice-meta-item {
  font-size: 0.7rem;
  color: var(--portal-text);
  font-family: ui-monospace, monospace;
}

.portal-notice-preview-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid var(--portal-border);
}

.portal-notice-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  gap: 0.75rem;
}

.portal-notice-empty-icon {
  font-size: 2rem;
  color: var(--portal-accent);
  opacity: 0.5;
  font-family: ui-monospace, monospace;
}

.portal-notice-empty-text {
  font-size: 0.85rem;
  color: var(--portal-text);
}

.portal-notice-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.portal-notice-loading-text {
  font-size: 0.8rem;
  color: var(--portal-text);
  font-family: ui-monospace, monospace;
}

.portal-notice-editor {
  margin: 1rem 1.25rem;
  border: 1px solid var(--portal-border);
  border-radius: 4px;
  overflow: hidden;
}

.portal-notice-editor-header {
  padding: 0.5rem 0.75rem;
  background: var(--portal-surface-elevated);
  border-bottom: 1px solid var(--portal-border);
}

.portal-notice-editor-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
}

.portal-notice-form {
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .portal-notice-form {
    grid-template-columns: 1fr;
  }
}

.portal-field--wide {
  grid-column: 1 / -1;
}

.portal-textarea {
  min-height: 6rem;
  resize: vertical;
  font-family: ui-monospace, monospace;
}

.portal-checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.portal-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--portal-accent);
}

.portal-checkbox-label {
  font-size: 0.8rem;
  color: var(--portal-text-bright);
}

.portal-notice-form-preview {
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  line-height: 1.5;
  min-height: 2.5rem;
}

.portal-notice-form-preview--info {
  background: rgba(0, 255, 242, 0.08);
  border: 1px solid rgba(0, 255, 242, 0.3);
  color: var(--neon-cyan);
}

.portal-notice-form-preview--warning {
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: var(--neon-gold);
}

.portal-notice-form-preview--success {
  background: rgba(57, 255, 20, 0.08);
  border: 1px solid rgba(57, 255, 20, 0.3);
  color: var(--neon-green);
}

.portal-notice-form-preview--error {
  background: rgba(255, 49, 49, 0.08);
  border: 1px solid rgba(255, 49, 49, 0.3);
  color: var(--neon-red);
}

.portal-notice-form-preview :deep(p) {
  margin: 0;
}

.portal-notice-form-preview :deep(p + p) {
  margin-top: 0.5rem;
}

.portal-notice-form-preview-empty {
  color: var(--portal-text);
  opacity: 0.5;
  font-style: italic;
}

.portal-notice-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.portal-btn--danger {
  background: transparent;
  color: var(--neon-red);
  border-color: var(--neon-red);
}

.portal-btn--danger:hover:not(:disabled) {
  background: rgba(255, 49, 49, 0.15);
  box-shadow: 0 0 15px rgba(255, 49, 49, 0.3);
}
</style>
