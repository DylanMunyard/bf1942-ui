<template>
  <div class="tournament-weeks-tab">
    <!-- Add/Edit Week View -->
    <div v-if="showForm" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ {{ editingWeek ? 'EDIT WEEK' : 'CREATE WEEK' }} ]</h2>
          <p class="portal-card-subtitle">
            {{ editingWeek ? 'Update week schedule' : 'Add a new tournament week' }}
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

        <!-- Week Name -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">Week Name</label>
          <input
            v-model="formData.week"
            type="text"
            placeholder="e.g., Week 1, Round 1"
            class="portal-form-input"
            :disabled="formLoading"
          >
          <p class="portal-form-hint">Identifier shown in the schedule</p>
        </div>

        <!-- Start Date -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">Start Date</label>
          <input
            v-model="formData.startDate"
            type="date"
            class="portal-form-input portal-form-input--mono"
            :disabled="formLoading"
          >
        </div>

        <!-- End Date -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">End Date</label>
          <input
            v-model="formData.endDate"
            type="date"
            class="portal-form-input portal-form-input--mono"
            :disabled="formLoading"
          >
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
            <span v-else>{{ editingWeek ? 'Update Week' : 'Create Week' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Weeks List View -->
    <div v-else class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ WEEKS ]</h2>
          <p class="portal-card-subtitle">Define week schedules and date ranges</p>
        </div>
        <button
          class="portal-btn portal-btn--primary"
          @click="openAddForm"
        >
          + Add Week
        </button>
      </div>

      <div class="portal-card-body" style="padding: 0">
        <!-- Weeks Table -->
        <div v-if="tournament.weekDates && tournament.weekDates.length > 0" class="portal-table-wrap">
          <table class="portal-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="week in tournament.weekDates" :key="week.id">
                <td>
                  <span class="portal-mono">{{ week.week }}</span>
                </td>
                <td>{{ formatDate(week.startDate) }}</td>
                <td>{{ formatDate(week.endDate) }}</td>
                <td>
                  <div class="portal-table-actions">
                    <button
                      class="portal-icon-btn"
                      @click="openEditForm(week)"
                      title="Edit week"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      class="portal-icon-btn portal-icon-btn--danger"
                      @click="confirmDeleteWeek(week.id!, week.week)"
                      title="Delete week"
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
          <div class="portal-empty-icon">📅</div>
          <h3 class="portal-empty-title">No Weeks Defined</h3>
          <p class="portal-empty-desc">
            Create weeks to organize your tournament schedule
          </p>
          <button
            class="portal-btn portal-btn--primary"
            style="margin-top: 1rem"
            @click="openAddForm"
          >
            Add First Week
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Week Confirmation Modal -->
    <div
      v-if="deleteWeekConfirmation"
      class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
      @click.self="cancelDeleteWeek"
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
              Delete Week?
            </h3>
            <p class="portal-modal-text">
              Delete week <span class="portal-modal-highlight">{{ deleteWeekConfirmation.name }}</span>?
            </p>
            <p class="portal-modal-hint">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="portal-btn portal-btn--ghost"
            @click="cancelDeleteWeek"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--danger flex items-center gap-2"
            :disabled="isProcessing"
            @click="executeDeleteWeek"
          >
            <svg v-if="!isProcessing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isProcessing ? 'Deleting...' : 'Delete Week' }}</span>
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
  type TournamentWeekDate
} from '@/services/adminTournamentService';

const props = defineProps<{
  tournament: TournamentDetail;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// Form state
const showForm = ref(false);
const editingWeek = ref<TournamentWeekDate | null>(null);
const formLoading = ref(false);
const formError = ref<string | null>(null);

const formData = ref({
  week: '',
  startDate: '',
  endDate: ''
});

const isFormValid = computed(() => {
  return formData.value.week.trim() && formData.value.startDate && formData.value.endDate;
});

// Delete state
const deleteWeekConfirmation = ref<{ id: number; name: string } | null>(null);
const isProcessing = ref(false);

// Formatting
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

// Form handlers
const openAddForm = () => {
  editingWeek.value = null;
  formData.value = { week: '', startDate: '', endDate: '' };
  formError.value = null;
  showForm.value = true;
};

const openEditForm = (week: TournamentWeekDate) => {
  editingWeek.value = week;
  formData.value = {
    week: week.week,
    startDate: week.startDate,
    endDate: week.endDate
  };
  formError.value = null;
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingWeek.value = null;
  formError.value = null;
};

const submitForm = async () => {
  if (!isFormValid.value) return;

  formLoading.value = true;
  formError.value = null;

  try {
    if (editingWeek.value?.id) {
      await adminTournamentService.updateWeek(
        props.tournament.id,
        editingWeek.value.id,
        {
          week: formData.value.week,
          startDate: formData.value.startDate,
          endDate: formData.value.endDate
        }
      );
    } else {
      await adminTournamentService.createWeek(props.tournament.id, {
        week: formData.value.week,
        startDate: formData.value.startDate,
        endDate: formData.value.endDate
      });
    }
    closeForm();
    emit('refresh');
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Failed to save week';
    console.error('Error saving week:', err);
  } finally {
    formLoading.value = false;
  }
};

// Delete handlers
const confirmDeleteWeek = (weekId: number, weekName: string) => {
  deleteWeekConfirmation.value = { id: weekId, name: weekName };
};

const cancelDeleteWeek = () => {
  deleteWeekConfirmation.value = null;
  isProcessing.value = false;
};

const executeDeleteWeek = async () => {
  if (!deleteWeekConfirmation.value) return;

  isProcessing.value = true;
  try {
    await adminTournamentService.deleteWeek(props.tournament.id, deleteWeekConfirmation.value.id);
    deleteWeekConfirmation.value = null;
    emit('refresh');
  } catch (err) {
    console.error('Error deleting week:', err);
  } finally {
    isProcessing.value = false;
  }
};

// Expose load method for parent to trigger refresh
const load = () => {
  // Weeks data comes from parent, nothing to load here
};

defineExpose({ load });
</script>

<style scoped>
.portal-card-subtitle {
  font-size: 0.75rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
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
