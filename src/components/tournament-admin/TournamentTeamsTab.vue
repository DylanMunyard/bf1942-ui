<template>
  <div class="tournament-teams-tab">
    <!-- Add/Edit Team View -->
    <div v-if="showForm" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ {{ editingTeam ? 'EDIT TEAM' : 'CREATE TEAM' }} ]</h2>
          <p class="portal-card-subtitle">
            {{ editingTeam ? 'Update team details and manage players' : 'Add a new team to the tournament' }}
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

        <!-- Team Name -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">Team Name</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., [ABC] Clan or Team Alpha"
            class="portal-form-input"
            :disabled="formLoading"
          >
          <p class="portal-form-hint">Usually the clan tag or team name</p>
        </div>

        <!-- Players Section -->
        <div class="portal-form-section">
          <MultiPlayerSelector
            :current-players="formData.players"
            :loading="formLoading"
            accent-color="#00e5a0"
            text-color="#e5e7eb"
            text-muted-color="#9ca3af"
            background-color="#0c0c12"
            background-mute-color="#111118"
            @add-players="handleAddPlayers"
            @remove-player="removePlayer"
            @clear-all-players="clearAllPlayers"
          />
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
            :disabled="formLoading || !formData.name.trim()"
            @click="submitForm"
          >
            <span v-if="formLoading" class="portal-btn-pulse">Saving...</span>
            <span v-else>{{ editingTeam ? 'Update Team' : 'Create Team' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Teams List View -->
    <div v-else class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ TEAMS ]</h2>
          <p class="portal-card-subtitle">Configure tournament teams and their players</p>
        </div>
        <button
          class="portal-btn portal-btn--primary"
          @click="openAddForm"
        >
          + Add Team
        </button>
      </div>

      <div class="portal-card-body">
        <!-- Teams Grid -->
        <div v-if="tournament.teams.length > 0" class="portal-grid-3">
          <div
            v-for="team in tournament.teams"
            :key="team.id"
            class="portal-grid-item"
          >
            <div class="portal-grid-item-header">
              <div>
                <h3 class="portal-grid-item-title">{{ team.name }}</h3>
                <p class="portal-grid-item-subtitle">
                  {{ team.players.length }} {{ team.players.length === 1 ? 'player' : 'players' }}
                </p>
              </div>
              <div class="portal-grid-item-actions">
                <button
                  class="portal-icon-btn"
                  @click="openEditForm(team.id)"
                  title="Edit team"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  class="portal-icon-btn portal-icon-btn--danger"
                  @click="confirmDeleteTeam(team.id, team.name)"
                  title="Delete team"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="portal-empty">
          <div class="portal-empty-icon">👥</div>
          <h3 class="portal-empty-title">No Teams Yet</h3>
          <p class="portal-empty-desc">
            Create teams to organize players for tournament matches
          </p>
          <button
            class="portal-btn portal-btn--primary"
            style="margin-top: 1rem"
            @click="openAddForm"
          >
            Add First Team
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Team Confirmation Modal -->
    <div
      v-if="deleteTeamConfirmation"
      class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
      @click.self="cancelDeleteTeam"
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
              Delete Team?
            </h3>
            <p class="portal-modal-text">
              Delete team <span class="portal-modal-highlight">{{ deleteTeamConfirmation.name }}</span>?
            </p>
            <p class="portal-modal-hint">
              This will remove the team and all its players from the tournament.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="portal-btn portal-btn--ghost"
            @click="cancelDeleteTeam"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--danger flex items-center gap-2"
            :disabled="isDeleting"
            @click="executeDeleteTeam"
          >
            <svg v-if="!isDeleting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete Team' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  adminTournamentService,
  type TournamentDetail,
  type TournamentTeam
} from '@/services/adminTournamentService';
import MultiPlayerSelector from '@/components/MultiPlayerSelector.vue';

const props = defineProps<{
  tournament: TournamentDetail;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// Form state
const showForm = ref(false);
const editingTeam = ref<TournamentTeam | null>(null);
const formLoading = ref(false);
const formError = ref<string | null>(null);

const formData = ref({
  name: '',
  players: [] as string[]
});

// Delete state
const deleteTeamConfirmation = ref<{ id: number; name: string } | null>(null);
const isDeleting = ref(false);

// Form handlers
const openAddForm = () => {
  editingTeam.value = null;
  formData.value = { name: '', players: [] };
  formError.value = null;
  showForm.value = true;
};

const openEditForm = async (teamId: number) => {
  try {
    const team = await adminTournamentService.getTeamDetail(props.tournament.id, teamId);
    editingTeam.value = team;
    formData.value = {
      name: team.name,
      players: team.players.map(p => p.playerName)
    };
    formError.value = null;
    showForm.value = true;
  } catch (err) {
    console.error('Error loading team details:', err);
  }
};

const closeForm = () => {
  showForm.value = false;
  editingTeam.value = null;
  formError.value = null;
};

// Player management
const handleAddPlayers = (players: string[]) => {
  for (const playerName of players) {
    if (!formData.value.players.includes(playerName)) {
      formData.value.players.push(playerName);
    }
  }
  formError.value = null;
};

const removePlayer = (index: number) => {
  formData.value.players.splice(index, 1);
};

const clearAllPlayers = () => {
  formData.value.players = [];
};

const submitForm = async () => {
  if (!formData.value.name.trim()) return;

  formLoading.value = true;
  formError.value = null;

  try {
    if (editingTeam.value) {
      // Update team name if changed
      if (formData.value.name !== editingTeam.value.name) {
        await adminTournamentService.updateTeam(props.tournament.id, editingTeam.value.id, {
          name: formData.value.name,
        });
      }

      // Sync players
      const currentPlayers = editingTeam.value.players.map(p => p.playerName);
      const newPlayers = formData.value.players;

      for (const player of currentPlayers) {
        if (!newPlayers.includes(player)) {
          await adminTournamentService.removePlayerFromTeam(props.tournament.id, editingTeam.value.id, player);
        }
      }

      for (const player of newPlayers) {
        if (!currentPlayers.includes(player)) {
          await adminTournamentService.addPlayerToTeam(props.tournament.id, editingTeam.value.id, {
            playerName: player,
          });
        }
      }
    } else {
      // Create new team
      const team = await adminTournamentService.createTeam(props.tournament.id, {
        name: formData.value.name,
      });

      // Add players
      for (const player of formData.value.players) {
        await adminTournamentService.addPlayerToTeam(props.tournament.id, team.id, {
          playerName: player,
        });
      }
    }

    closeForm();
    emit('refresh');
  } catch (err) {
    console.error('Error saving team:', err);
    formError.value = err instanceof Error ? err.message : 'Failed to save team';
  } finally {
    formLoading.value = false;
  }
};

// Delete handlers
const confirmDeleteTeam = (teamId: number, teamName: string) => {
  deleteTeamConfirmation.value = { id: teamId, name: teamName };
};

const cancelDeleteTeam = () => {
  deleteTeamConfirmation.value = null;
  isDeleting.value = false;
};

const executeDeleteTeam = async () => {
  if (!deleteTeamConfirmation.value) return;

  isDeleting.value = true;
  try {
    await adminTournamentService.deleteTeam(props.tournament.id, deleteTeamConfirmation.value.id);
    deleteTeamConfirmation.value = null;
    emit('refresh');
  } catch (err) {
    console.error('Error deleting team:', err);
  } finally {
    isDeleting.value = false;
  }
};

// Expose load method for parent to trigger refresh
const load = () => {
  // Teams data comes from parent, nothing to load here
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
