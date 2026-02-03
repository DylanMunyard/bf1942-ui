<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-md w-full shadow-2xl relative">
      <!-- Header -->
      <div class="p-6 border-b border-slate-700/50">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Create Tournament
          </h2>
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

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Tournament Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Tournament Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="tournamentName"
            type="text"
            required
            placeholder="e.g., Summer Championship 2025"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            :disabled="loading"
          >
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <div class="text-sm text-red-400">
            {{ error }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-4">
          <button
            type="button"
            class="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
            @click="$emit('close')"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading || !tournamentName.trim()"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminTournamentService } from '@/services/adminTournamentService';

interface Props {
  defaultOrganizer?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: [tournamentId: number];
}>();

const tournamentName = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  if (props.defaultOrganizer) {
    // Set organizer if provided, but don't show it in the UI
    // The backend will use this or the authenticated user's profile
  }
});

const handleSubmit = async () => {
  if (!tournamentName.value.trim()) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const request = {
      name: tournamentName.value.trim(),
      organizer: props.defaultOrganizer || '', // Use provided organizer or empty (backend will handle)
      game: 'bf1942' as const,
      theme: {
        backgroundColour: '#000000',
        textColour: '#FFFFFF',
        accentColour: '#FFD700',
      },
    };

    const result = await adminTournamentService.createTournament(request);
    emit('created', result.id);
  } catch (err) {
    console.error('Error creating tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to create tournament';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-mobile-safe {
  /* Ensure modal is visible on mobile */
  z-index: 9999;
}
</style>
