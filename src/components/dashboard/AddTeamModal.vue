<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminTournamentService, type TournamentTeam } from '@/services/adminTournamentService';
import MultiPlayerSelector from '@/components/MultiPlayerSelector.vue';
import BaseModal from '@/components/BaseModal.vue';

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
      if (formData.value.name !== props.team.name) {
        await adminTournamentService.updateTeam(props.tournamentId, props.team.id, {
          name: formData.value.name,
        });
      }

      const currentPlayers = props.team.players.map(p => p.playerName);
      const newPlayers = formData.value.players;

      for (const player of currentPlayers) {
        if (!newPlayers.includes(player)) {
          await adminTournamentService.removePlayerFromTeam(props.tournamentId, props.team.id, player);
        }
      }

      for (const player of newPlayers) {
        if (!currentPlayers.includes(player)) {
          await adminTournamentService.addPlayerToTeam(props.tournamentId, props.team.id, {
            playerName: player,
          });
        }
      }
    } else {
      const team = await adminTournamentService.createTeam(props.tournamentId, {
        name: formData.value.name,
      });

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

const handleClose = () => emit('close');
</script>

<template>
  <BaseModal
    :model-value="true"
    size="lg"
    body-class="space-y-6"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <template #header>
      <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
        {{ editMode ? 'Edit Team' : 'Create Team' }}
      </h2>
      <p class="text-slate-400 text-sm mt-1">
        {{ editMode ? 'Update team details and manage players' : 'Add a new team to the tournament' }}
      </p>
    </template>

    <!-- Error Message -->
    <div
      v-if="error"
      class="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
    >
      <p class="text-red-400 text-sm">
        {{ error }}
      </p>
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

    <template #footer>
      <div class="flex items-center justify-end gap-3 pt-4">
        <button
          class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          :disabled="loading"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          :disabled="loading || !formData.name.trim()"
          @click="handleSubmit"
        >
          <div
            v-if="loading"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
          <span>{{ editMode ? 'Update Team' : 'Create Team' }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>
