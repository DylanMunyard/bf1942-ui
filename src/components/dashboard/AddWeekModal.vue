<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-md w-full shadow-2xl">
      <!-- Header -->
      <div class="border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-cyan-400">
              {{ editMode ? 'Edit Week' : 'Create Week' }}
            </h2>
            <p class="text-slate-400 text-sm mt-1">
              {{ editMode ? 'Update week schedule' : 'Add a new tournament week' }}
            </p>
          </div>
          <button
            class="text-slate-400 hover:text-slate-200 transition-colors"
            @click="$emit('close')"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>

        <!-- Week Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Week Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.week"
            type="text"
            placeholder="e.g., Week 1, Round 1, etc."
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            :disabled="loading"
          >
        </div>

        <!-- Start Date -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Start Date <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.startDate"
            type="date"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            :disabled="loading"
          >
        </div>

        <!-- End Date -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            End Date <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.endDate"
            type="date"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            :disabled="loading"
          >
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-slate-700/50 p-6 flex items-center justify-end gap-3">
        <button
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          @click="$emit('close')"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          @click="submit"
          :disabled="loading || !isFormValid"
        >
          <svg v-if="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{{ loading ? 'Saving...' : editMode ? 'Update Week' : 'Create Week' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { adminTournamentService, type TournamentWeekDate } from '@/services/adminTournamentService';

interface Props {
  tournamentId: number;
  week?: TournamentWeekDate;
}

interface Emits {
  (e: 'close'): void;
  (e: 'added'): void;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits<Emits>();

const editMode = computed(() => !!props.week);
const loading = ref(false);
const error = ref<string | null>(null);

const formData = ref({
  week: '',
  startDate: '',
  endDate: ''
});

const isFormValid = computed(() => {
  return formData.value.week.trim() && formData.value.startDate && formData.value.endDate;
});

watch(
  () => props.week,
  (newWeek) => {
    if (newWeek) {
      formData.value = {
        week: newWeek.week,
        startDate: newWeek.startDate,
        endDate: newWeek.endDate
      };
    } else {
      formData.value = {
        week: '',
        startDate: '',
        endDate: ''
      };
    }
    error.value = null;
  },
  { immediate: true }
);

const submit = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = null;

  try {
    if (editMode.value && props.week?.id) {
      await adminTournamentService.updateWeek(
        props.tournamentId,
        props.week.id,
        {
          week: formData.value.week,
          startDate: formData.value.startDate,
          endDate: formData.value.endDate
        }
      );
    } else {
      await adminTournamentService.createWeek(props.tournamentId, {
        week: formData.value.week,
        startDate: formData.value.startDate,
        endDate: formData.value.endDate
      });
    }
    emit('added');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save week';
    console.error('Error saving week:', err);
  } finally {
    loading.value = false;
  }
};
</script>
