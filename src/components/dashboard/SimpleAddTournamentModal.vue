<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="portal-modal">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="portal-modal-title">
          Create Tournament
        </h2>
        <button
          class="portal-modal-close"
          @click="$emit('close')"
          title="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit">
        <!-- Tournament Name -->
        <div class="mb-6">
          <label class="portal-form-label portal-form-label--required">
            Tournament Name
          </label>
          <input
            v-model="tournamentName"
            type="text"
            required
            placeholder="e.g., Summer Championship 2025"
            class="portal-form-input"
            :disabled="loading"
          >
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="portal-form-error mb-6"
        >
          {{ error }}
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="portal-btn portal-btn--ghost"
            @click="$emit('close')"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="portal-btn portal-btn--primary"
            :disabled="loading || !tournamentName.trim()"
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

<style src="@/styles/portal-admin.css"></style>
