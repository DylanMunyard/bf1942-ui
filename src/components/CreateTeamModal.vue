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
          <h3 class="text-xl font-bold" :style="{ color: accentTextColor }">Create a Team</h3>
          <p class="text-sm mt-1" :style="{ color: accentTextColor, opacity: 0.8 }">Register your team for the tournament</p>
        </div>
        <button
          class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-colors"
          @click="closeModal"
        >
          &times;
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingPlayerNames" class="p-6 flex items-center justify-center">
        <svg class="w-8 h-8 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <!-- Form -->
      <form v-else class="p-6 space-y-5" @submit.prevent="handleSubmit">
        <!-- Registration Rules (Collapsible) -->
        <div v-if="registrationRules" class="border border-slate-700/50 rounded-lg overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
            @click="showRegistrationRules = !showRegistrationRules"
          >
            <span class="text-sm font-medium text-slate-300">Registration Info</span>
            <svg
              class="w-5 h-5 text-slate-400 transition-transform"
              :class="{ 'rotate-180': showRegistrationRules }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="showRegistrationRules"
            class="px-4 py-3 bg-slate-900/40 border-t border-slate-700/50"
          >
            <div
              class="prose prose-sm prose-invert max-w-none markdown-rules"
              :style="{
                '--color-text': '#e2e8f0',
                '--color-text-muted': '#94a3b8',
                '--rule-primary': accentColor,
                '--rule-secondary': accentColor,
              } as Record<string, string>"
              v-html="renderedRegistrationRules"
            />
          </div>
        </div>

        <!-- Team Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Team Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.teamName"
            type="text"
            maxlength="100"
            class="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            placeholder="Enter team name"
            required
          >
          <p class="mt-1 text-xs text-slate-400">2-100 characters</p>
        </div>

        <!-- Tag -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Team Tag <span class="text-slate-500">(optional)</span>
          </label>
          <input
            v-model="form.tag"
            type="text"
            maxlength="20"
            class="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            placeholder="e.g., [TAG]"
          >
          <p class="mt-1 text-xs text-slate-400">Up to 20 characters, shown before player names</p>
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
              Creating...
            </span>
            <span v-else>Create Team</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import PlayerSearch from '@/components/PlayerSearch.vue';
import { teamRegistrationService, type CreateTeamRequest, type LinkedPlayerName } from '@/services/teamRegistrationService';

interface Props {
  isVisible: boolean;
  tournamentId: number;
  registrationRules?: string;
  accentColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  registrationRules: '',
  accentColor: '#06b6d4',
});

// Registration rules display
const showRegistrationRules = ref(false);
const renderedRegistrationRules = computed(() => {
  if (!props.registrationRules) return '';
  try {
    return marked(props.registrationRules, { breaks: true });
  } catch {
    return '';
  }
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

// Player names state
const linkedPlayerNames = ref<LinkedPlayerName[]>([]);
const isLoadingPlayerNames = ref(false);
const showAddPlayerName = ref(false);
const newPlayerName = ref('');
const isLinkingPlayerName = ref(false);
const linkPlayerError = ref('');

// Form state
const form = ref({
  teamName: '',
  tag: '',
  playerName: '',
  rulesAcknowledged: true,
});

const isSubmitting = ref(false);
const errorMessage = ref('');

const isFormValid = computed(() => {
  return (
    form.value.teamName.trim().length >= 2 &&
    form.value.playerName !== ''
  );
});

const loadPlayerNames = async () => {
  isLoadingPlayerNames.value = true;
  try {
    linkedPlayerNames.value = await teamRegistrationService.getLinkedPlayerNames();
    // Auto-select first player name if only one exists
    if (linkedPlayerNames.value.length === 1) {
      form.value.playerName = linkedPlayerNames.value[0].playerName;
    }
  } catch (error) {
    // Failed to load - user can still add a new one
    linkedPlayerNames.value = [];
  } finally {
    isLoadingPlayerNames.value = false;
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
  form.value = {
    teamName: '',
    tag: '',
    playerName: '',
    rulesAcknowledged: true,
  };
  errorMessage.value = '';
  showAddPlayerName.value = false;
  newPlayerName.value = '';
  linkPlayerError.value = '';
};

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const request: CreateTeamRequest = {
      teamName: form.value.teamName.trim(),
      tag: form.value.tag.trim() || undefined,
      playerName: form.value.playerName,
      rulesAcknowledged: form.value.rulesAcknowledged,
    };

    const response = await teamRegistrationService.createTeam(props.tournamentId, request);
    emit('success', response.teamId, response.teamName);
    resetForm();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create team';
  } finally {
    isSubmitting.value = false;
  }
};

// Load player names when modal becomes visible
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      loadPlayerNames();
    } else {
      resetForm();
    }
  }
);
</script>

<style scoped>
/* Markdown rules styling */
.markdown-rules :deep(h1),
.markdown-rules :deep(h2),
.markdown-rules :deep(h3),
.markdown-rules :deep(h4),
.markdown-rules :deep(h5),
.markdown-rules :deep(h6) {
  color: var(--color-text);
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-rules :deep(p) {
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.markdown-rules :deep(strong) {
  font-weight: 700;
  color: var(--color-text);
}

.markdown-rules :deep(em) {
  color: var(--rule-secondary);
  font-style: italic;
}

.markdown-rules :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.markdown-rules :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.markdown-rules :deep(li) {
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
  margin-left: 1rem;
}

.markdown-rules :deep(code) {
  background: linear-gradient(135deg, var(--rule-primary)15, var(--rule-secondary)10);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: var(--color-text);
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  border: 1px solid var(--rule-primary);
}

.markdown-rules :deep(blockquote) {
  border-left: 4px solid var(--rule-primary);
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
  background: linear-gradient(to right, var(--rule-primary)08, transparent);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}

.markdown-rules :deep(a) {
  color: var(--color-text);
  text-decoration: underline;
  font-weight: 600;
  transition: all 0.2s ease;
}

.markdown-rules :deep(a:hover) {
  color: var(--color-text);
  text-decoration: none;
}

.markdown-rules :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5rem 0;
  border: 2px solid var(--rule-primary);
  border-radius: 0.5rem;
  overflow: hidden;
}

.markdown-rules :deep(thead) {
  background: linear-gradient(to right, var(--rule-primary)30, var(--rule-secondary)20);
  backdrop-filter: blur(0.5rem);
}

.markdown-rules :deep(th) {
  padding: 1rem;
  text-align: left;
  font-weight: 700;
  color: var(--color-text);
  border-bottom: 2px solid var(--rule-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Monaco', 'Menlo', monospace;
}

.markdown-rules :deep(td) {
  padding: 0.75rem 1rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--rule-primary)20;
}

.markdown-rules :deep(tbody tr) {
  background-color: transparent;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.markdown-rules :deep(tbody tr:nth-child(even)) {
  background-color: var(--rule-primary)08;
}

.markdown-rules :deep(tbody tr:hover) {
  background-color: var(--rule-primary)15;
  box-shadow: inset 0 0 16px var(--rule-primary)15;
}
</style>
