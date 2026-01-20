<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {{ editMode ? 'Edit Team' : 'Create Team' }}
            </h2>
            <p class="text-slate-400 text-sm mt-1">
              {{ editMode ? 'Update team details and manage players' : 'Add a new team to the tournament' }}
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
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>

        <!-- Team Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Team Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., [ABC] Clan or Team Alpha"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            :disabled="loading"
          >
          <p class="mt-2 text-xs text-slate-500">
            Usually the clan tag or team name
          </p>
        </div>

        <!-- Players Section -->
        <div>
          <MultiPlayerSelector
            :current-players="formData.players"
            :loading="loading"
            @add-players="handleAddPlayers"
            @remove-player="removePlayer"
            @clear-all-players="clearAllPlayers"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6">
        <div class="flex items-center justify-end gap-3">
          <button
            class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="$emit('close')"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            @click="handleSubmit"
            :disabled="loading || !formData.name.trim()"
          >
            <div v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{{ editMode ? 'Update Team' : 'Create Team' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminTournamentService, type TournamentTeam } from '@/services/adminTournamentService';
import MultiPlayerSelector from '@/components/MultiPlayerSelector.vue';

interface Props {
  tournamentId: number;
  team?: TournamentTeam;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  added: [];
}>();

const editMode = ref(!!props.team);
const loading = ref(false);
const error = ref<string | null>(null);

const formData = ref({
  name: '',
  players: [] as string[],
});

onMounted(() => {
  if (props.team) {
    formData.value.name = props.team.name;
    formData.value.players = props.team.players.map(p => p.playerName);
  }
});

const handleAddPlayers = (players: string[]) => {
  for (const playerName of players) {
    if (!formData.value.players.includes(playerName)) {
      formData.value.players.push(playerName);
    }
  }
  error.value = null;
};

const removePlayer = (index: number) => {
  formData.value.players.splice(index, 1);
};

const clearAllPlayers = () => {
  formData.value.players = [];
};


const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (editMode.value && props.team) {
      // Update team name if changed
      if (formData.value.name !== props.team.name) {
        await adminTournamentService.updateTeam(props.tournamentId, props.team.id, {
          name: formData.value.name,
        });
      }

      // Handle player changes
      const currentPlayers = props.team.players.map(p => p.playerName);
      const newPlayers = formData.value.players;

      // Remove players that are no longer in the list
      for (const player of currentPlayers) {
        if (!newPlayers.includes(player)) {
          await adminTournamentService.removePlayerFromTeam(props.tournamentId, props.team.id, player);
        }
      }

      // Add players that are new to the list
      for (const player of newPlayers) {
        if (!currentPlayers.includes(player)) {
          await adminTournamentService.addPlayerToTeam(props.tournamentId, props.team.id, {
            playerName: player,
          });
        }
      }
    } else {
      // Create new team
      const team = await adminTournamentService.createTeam(props.tournamentId, {
        name: formData.value.name,
      });

      // Add players to the new team
      for (const player of formData.value.players) {
        await adminTournamentService.addPlayerToTeam(props.tournamentId, team.id, {
          playerName: player,
        });
      }
    }

    emit('added');
    emit('close');
  } catch (err) {
    console.error('Error saving team:', err);
    error.value = err instanceof Error ? err.message : 'Failed to save team';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Smooth scrolling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>

