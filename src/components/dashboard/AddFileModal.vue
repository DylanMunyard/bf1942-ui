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
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              {{ editMode ? 'Edit File' : 'Add File' }}
            </h2>
            <p class="text-slate-400 text-sm mt-1">
              {{ editMode ? 'Update file details' : 'Add a new tournament file' }}
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

        <!-- File Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            File Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., Tournament Rules, Schedule"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            :disabled="loading"
          >
        </div>

        <!-- File URL -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            File URL <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.url"
            type="url"
            placeholder="https://example.com/file.pdf"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            :disabled="loading"
          >
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Category
          </label>
          <input
            v-model="formData.category"
            type="text"
            placeholder="e.g., rules, schedule, guide"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            :disabled="loading"
          >
          <p class="mt-2 text-xs text-slate-500">
            Optional: categorize the file (e.g., rules, schedule, guide)
          </p>
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
          class="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          @click="submit"
          :disabled="loading || !isFormValid"
        >
          <svg v-if="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{{ loading ? 'Saving...' : editMode ? 'Update File' : 'Add File' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { adminTournamentService, type TournamentFile } from '@/services/adminTournamentService';

interface Props {
  tournamentId: number;
  file?: TournamentFile;
}

interface Emits {
  (e: 'close'): void;
  (e: 'added'): void;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits<Emits>();

const editMode = computed(() => !!props.file);
const loading = ref(false);
const error = ref<string | null>(null);

const formData = ref({
  name: '',
  url: '',
  category: ''
});

const isFormValid = computed(() => {
  return formData.value.name.trim() && formData.value.url.trim();
});

watch(
  () => props.file,
  (newFile) => {
    if (newFile) {
      formData.value = {
        name: newFile.name,
        url: newFile.url,
        category: newFile.category || ''
      };
    } else {
      formData.value = {
        name: '',
        url: '',
        category: ''
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
    if (editMode.value && props.file?.id) {
      const updateData: Partial<Omit<TournamentFile, 'id'>> = {
        name: formData.value.name,
        url: formData.value.url
      };
      if (formData.value.category) {
        updateData.category = formData.value.category;
      }
      await adminTournamentService.updateFile(
        props.tournamentId,
        props.file.id,
        updateData
      );
    } else {
      const createData: Omit<TournamentFile, 'id'> = {
        name: formData.value.name,
        url: formData.value.url,
        uploadedAt: new Date().toISOString()
      };
      if (formData.value.category) {
        createData.category = formData.value.category;
      }
      await adminTournamentService.createFile(props.tournamentId, createData);
    }
    emit('added');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save file';
    console.error('Error saving file:', err);
  } finally {
    loading.value = false;
  }
};
</script>
