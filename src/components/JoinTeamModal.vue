<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
  >
    <div
      class="bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex justify-between items-center px-6 py-4 border-b border-slate-700/50"
        :style="{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)` }"
      >
        <div>
          <h3 class="text-xl font-bold" :style="{ color: accentTextColor }">Join a Team</h3>
          <p class="text-sm mt-1" :style="{ color: accentTextColor, opacity: 0.8 }">Select a team to join</p>
        </div>
        <button
          class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-colors"
          @click="closeModal"
        >
          &times;
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <svg class="w-8 h-8 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- No Teams Available -->
        <div v-else-if="availableTeams.length === 0" class="text-center py-8">
          <div class="text-4xl mb-4">🔍</div>
          <p class="text-slate-400">No teams available to join</p>
          <p class="text-sm text-slate-500 mt-2">Try creating a new team instead</p>
        </div>

        <!-- Form -->
        <form v-else class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Team Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Select Team <span class="text-red-400">*</span>
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              <label
                v-for="team in availableTeams"
                :key="team.id"
                class="flex items-center gap-3 p-4 bg-slate-900/40 border border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors"
                :class="{ 'border-cyan-500 bg-cyan-500/10': selectedTeamId === team.id }"
              >
                <input
                  v-model="selectedTeamId"
                  type="radio"
                  :value="team.id"
                  class="w-4 h-4 text-cyan-500"
                  required
                >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-medium">{{ team.name }}</span>
                    <span v-if="team.tag" class="text-xs text-slate-400">{{ team.tag }}</span>
                  </div>
                  <span class="text-xs text-slate-400">{{ team.playerCount }} player{{ team.playerCount !== 1 ? 's' : '' }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Player Name Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Your In-Game Name <span class="text-red-400">*</span>
            </label>

            <!-- Existing linked player names -->
            <div v-if="linkedPlayerNames.length > 0" class="space-y-2 mb-3">
              <label
                v-for="player in linkedPlayerNames"
                :key="player.id"
                class="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors"
                :class="{ 'border-cyan-500 bg-cyan-500/10': form.playerName === player.playerName }"
              >
                <input
                  v-model="form.playerName"
                  type="radio"
                  :value="player.playerName"
                  class="w-4 h-4 text-cyan-500"
                >
                <span class="text-white">{{ player.playerName }}</span>
              </label>
            </div>

            <!-- Add new player name with search -->
            <div class="space-y-2">
              <div v-if="!showAddPlayerName && linkedPlayerNames.length > 0">
                <button
                  type="button"
                  class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  @click="showAddPlayerName = true"
                >
                  + Link a different player name
                </button>
              </div>

              <div v-if="showAddPlayerName || linkedPlayerNames.length === 0" class="space-y-2">
                <p v-if="linkedPlayerNames.length === 0" class="text-sm text-slate-400 mb-2">
                  Search for your in-game player name:
                </p>
                <div class="flex gap-2">
                  <div class="flex-1">
                    <PlayerSearch
                      v-model="newPlayerName"
                      placeholder="Search for your player name..."
                      @select="handlePlayerSelected"
                    />
                  </div>
                  <button
                    type="button"
                    :disabled="!newPlayerName.trim() || isLinkingPlayerName"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 self-start"
                    :style="{ backgroundColor: accentColor, color: accentTextColor }"
                    @click="handleLinkPlayerName"
                  >
                    {{ isLinkingPlayerName ? '...' : 'Link' }}
                  </button>
                </div>
                <div v-if="linkPlayerError" class="text-red-400 text-sm">{{ linkPlayerError }}</div>
              </div>
            </div>
          </div>


          <!-- Error Message -->
          <div
            v-if="errorMessage"
            class="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
          >
            {{ errorMessage }}
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !isFormValid"
              class="flex-1 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :style="{ backgroundColor: accentColor, color: accentTextColor }"
            >
              <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Joining...
              </span>
              <span v-else>Join Team</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import PlayerSearch from '@/components/PlayerSearch.vue';
import { teamRegistrationService, type JoinTeamRequest, type AvailableTeam, type LinkedPlayerName } from '@/services/teamRegistrationService';

interface Props {
  isVisible: boolean;
  tournamentId: number;
  rules?: string;
  accentColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rules: '',
  accentColor: '#06b6d4',
});

// Computed property for accent text color (black on light accents, white on dark accents)
const accentTextColor = computed(() => {
  const accent = props.accentColor;
  if (!accent) return '#FFFFFF';

  // Simple luminance calculation
  const hex = accent.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance using the formula: (0.299*R + 0.587*G + 0.114*B)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If accent color is light (high luminance), use dark text; if dark, use light text
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
});

const emit = defineEmits<{
  close: [];
  success: [teamId: number, teamName: string];
}>();

// Loading state
const isLoading = ref(false);

// Teams state
const availableTeams = ref<AvailableTeam[]>([]);
const selectedTeamId = ref<number | null>(null);

// Player names state
const linkedPlayerNames = ref<LinkedPlayerName[]>([]);
const showAddPlayerName = ref(false);
const newPlayerName = ref('');
const isLinkingPlayerName = ref(false);
const linkPlayerError = ref('');

// Form state
const form = ref({
  playerName: '',
  rulesAcknowledged: true,
});

const isSubmitting = ref(false);
const errorMessage = ref('');

const isFormValid = computed(() => {
  return (
    selectedTeamId.value !== null &&
    form.value.playerName !== ''
  );
});

const loadData = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Load teams and player names in parallel
    const [teams, playerNames] = await Promise.all([
      teamRegistrationService.getAvailableTeams(props.tournamentId),
      teamRegistrationService.getLinkedPlayerNames().catch(() => [] as LinkedPlayerName[]),
    ]);

    availableTeams.value = teams;
    linkedPlayerNames.value = playerNames;

    // Auto-select first player name if only one exists
    if (playerNames.length === 1) {
      form.value.playerName = playerNames[0].playerName;
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load teams';
  } finally {
    isLoading.value = false;
  }
};

const handlePlayerSelected = (player: { playerName: string }) => {
  newPlayerName.value = player.playerName;
};

const handleLinkPlayerName = async () => {
  if (!newPlayerName.value.trim() || isLinkingPlayerName.value) return;

  isLinkingPlayerName.value = true;
  linkPlayerError.value = '';

  try {
    const linked = await teamRegistrationService.linkPlayerName(newPlayerName.value.trim());
    linkedPlayerNames.value.push(linked);
    form.value.playerName = linked.playerName;
    newPlayerName.value = '';
    showAddPlayerName.value = false;
  } catch (error) {
    linkPlayerError.value = error instanceof Error ? error.message : 'Failed to link player name';
  } finally {
    isLinkingPlayerName.value = false;
  }
};

const closeModal = () => {
  emit('close');
};

const resetForm = () => {
  selectedTeamId.value = null;
  form.value = {
    playerName: '',
    rulesAcknowledged: true,
  };
  errorMessage.value = '';
  showAddPlayerName.value = false;
  newPlayerName.value = '';
  linkPlayerError.value = '';
};

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value || selectedTeamId.value === null) return;

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const request: JoinTeamRequest = {
      playerName: form.value.playerName,
      rulesAcknowledged: form.value.rulesAcknowledged,
    };

    await teamRegistrationService.joinTeam(props.tournamentId, selectedTeamId.value, request);

    const joinedTeam = availableTeams.value.find(t => t.id === selectedTeamId.value);
    emit('success', selectedTeamId.value, joinedTeam?.name || 'Team');
    resetForm();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to join team';
  } finally {
    isSubmitting.value = false;
  }
};

// Load data when modal becomes visible
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      loadData();
    } else {
      resetForm();
    }
  }
);
</script>
