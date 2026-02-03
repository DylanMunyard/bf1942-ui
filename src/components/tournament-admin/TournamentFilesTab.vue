<template>
  <div class="tournament-files-tab">
    <!-- Add/Edit File View -->
    <div v-if="showForm" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ {{ editingFile ? 'EDIT FILE' : 'ADD FILE' }} ]</h2>
          <p class="portal-card-subtitle">
            {{ editingFile ? 'Update file details' : 'Add a new tournament file' }}
          </p>
        </div>
        <button
          class="portal-btn portal-btn--ghost"
          @click="closeForm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
      </div>

      <div class="portal-card-body">
        <!-- Error Message -->
        <div v-if="formError" class="portal-form-error">
          {{ formError }}
        </div>

        <!-- File Name -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">File Name</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., Tournament Rules, Schedule"
            class="portal-form-input"
            :disabled="formLoading"
          >
        </div>

        <!-- File URL -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">File URL</label>
          <input
            v-model="formData.url"
            type="url"
            placeholder="https://example.com/file.pdf"
            class="portal-form-input"
            :disabled="formLoading"
          >
          <p class="portal-form-hint">Direct link to the file (PDF, document, etc.)</p>
        </div>

        <!-- Category -->
        <div class="portal-form-section">
          <label class="portal-form-label">Category</label>
          <input
            v-model="formData.category"
            type="text"
            placeholder="e.g., rules, schedule, guide"
            class="portal-form-input"
            :disabled="formLoading"
          >
          <p class="portal-form-hint">Optional: helps organize files by type</p>
        </div>

        <!-- Form Actions -->
        <div class="portal-form-footer" style="margin-top: 1.5rem">
          <button
            class="portal-btn portal-btn--ghost"
            :disabled="formLoading"
            @click="closeForm"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--primary"
            :disabled="formLoading || !isFormValid"
            @click="submitForm"
          >
            <span v-if="formLoading" class="portal-btn-pulse">Saving...</span>
            <span v-else>{{ editingFile ? 'Update File' : 'Add File' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Files List View -->
    <div v-else class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ FILES ]</h2>
          <p class="portal-card-subtitle">Share documents, rules, and resources</p>
        </div>
        <button
          class="portal-btn portal-btn--primary"
          @click="openAddForm"
        >
          + Add File
        </button>
      </div>

      <div class="portal-card-body" style="padding: 0">
        <!-- Files Table -->
        <div v-if="tournament.files && tournament.files.length > 0" class="portal-table-wrap">
          <table class="portal-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Uploaded</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in tournament.files" :key="file.id">
                <td>
                  <a
                    :href="file.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="file-link"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6h6m0 0v6m0-6L10 17" />
                    </svg>
                    {{ file.name }}
                  </a>
                </td>
                <td>
                  <span v-if="file.category" class="portal-badge portal-badge--muted">{{ file.category }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>{{ formatDate(file.uploadedAt) }}</td>
                <td>
                  <div class="portal-table-actions">
                    <button
                      class="portal-icon-btn"
                      @click="openEditForm(file)"
                      title="Edit file"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      class="portal-icon-btn portal-icon-btn--danger"
                      @click="confirmDeleteFile(file.id, file.name)"
                      title="Delete file"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="portal-empty">
          <div class="portal-empty-icon">📄</div>
          <h3 class="portal-empty-title">No Files Shared</h3>
          <p class="portal-empty-desc">
            Add files like rules, schedules, or guides for your tournament
          </p>
          <button
            class="portal-btn portal-btn--primary"
            style="margin-top: 1rem"
            @click="openAddForm"
          >
            Add First File
          </button>
        </div>
      </div>
    </div>

    <!-- Delete File Confirmation Modal -->
    <div
      v-if="deleteFileConfirmation"
      class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
      @click.self="cancelDeleteFile"
    >
      <div class="portal-modal">
        <div class="flex items-start gap-4 mb-6">
          <div class="portal-modal-icon portal-modal-icon--danger">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="portal-modal-title">
              Delete File?
            </h3>
            <p class="portal-modal-text">
              Delete file <span class="portal-modal-highlight">{{ deleteFileConfirmation.name }}</span>?
            </p>
            <p class="portal-modal-hint">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="portal-btn portal-btn--ghost"
            @click="cancelDeleteFile"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--danger flex items-center gap-2"
            :disabled="isProcessing"
            @click="executeDeleteFile"
          >
            <svg v-if="!isProcessing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isProcessing ? 'Deleting...' : 'Delete File' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  adminTournamentService,
  type TournamentDetail,
  type TournamentFile
} from '@/services/adminTournamentService';

const props = defineProps<{
  tournament: TournamentDetail;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// Form state
const showForm = ref(false);
const editingFile = ref<TournamentFile | null>(null);
const formLoading = ref(false);
const formError = ref<string | null>(null);

const formData = ref({
  name: '',
  url: '',
  category: ''
});

const isFormValid = computed(() => {
  return formData.value.name.trim() && formData.value.url.trim();
});

// Delete state
const deleteFileConfirmation = ref<{ id: number; name: string } | null>(null);
const isProcessing = ref(false);

// Formatting
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

// Form handlers
const openAddForm = () => {
  editingFile.value = null;
  formData.value = { name: '', url: '', category: '' };
  formError.value = null;
  showForm.value = true;
};

const openEditForm = (file: TournamentFile) => {
  editingFile.value = file;
  formData.value = {
    name: file.name,
    url: file.url,
    category: file.category || ''
  };
  formError.value = null;
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingFile.value = null;
  formError.value = null;
};

const submitForm = async () => {
  if (!isFormValid.value) return;

  formLoading.value = true;
  formError.value = null;

  try {
    if (editingFile.value?.id) {
      const updateData: Partial<Omit<TournamentFile, 'id'>> = {
        name: formData.value.name,
        url: formData.value.url
      };
      if (formData.value.category) {
        updateData.category = formData.value.category;
      }
      await adminTournamentService.updateFile(props.tournament.id, editingFile.value.id, updateData);
    } else {
      const createData: Omit<TournamentFile, 'id'> = {
        name: formData.value.name,
        url: formData.value.url,
        uploadedAt: new Date().toISOString()
      };
      if (formData.value.category) {
        createData.category = formData.value.category;
      }
      await adminTournamentService.createFile(props.tournament.id, createData);
    }
    closeForm();
    emit('refresh');
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Failed to save file';
    console.error('Error saving file:', err);
  } finally {
    formLoading.value = false;
  }
};

// Delete handlers
const confirmDeleteFile = (fileId: number, fileName: string) => {
  deleteFileConfirmation.value = { id: fileId, name: fileName };
};

const cancelDeleteFile = () => {
  deleteFileConfirmation.value = null;
  isProcessing.value = false;
};

const executeDeleteFile = async () => {
  if (!deleteFileConfirmation.value) return;

  isProcessing.value = true;
  try {
    await adminTournamentService.deleteFile(props.tournament.id, deleteFileConfirmation.value.id);
    deleteFileConfirmation.value = null;
    emit('refresh');
  } catch (err) {
    console.error('Error deleting file:', err);
  } finally {
    isProcessing.value = false;
  }
};

// Expose load method for parent to trigger refresh
const load = () => {
  // Files data comes from parent, nothing to load here
};

defineExpose({ load });
</script>

<style scoped>
.portal-card-subtitle {
  font-size: 0.75rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--portal-accent);
  text-decoration: none;
  transition: color 0.2s;
}

.file-link:hover {
  color: #00f5a8;
}

.text-muted {
  color: var(--portal-text);
  opacity: 0.6;
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.w-12 {
  width: 3rem;
}

.h-12 {
  height: 3rem;
}
</style>
