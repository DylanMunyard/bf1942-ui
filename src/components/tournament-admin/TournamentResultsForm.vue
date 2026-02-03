<template>
  <div class="tournament-results-form">
    <div class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ MATCH RESULTS ]</h2>
          <p class="portal-card-subtitle">
            {{ match.team1Name }} vs {{ match.team2Name }} - {{ formatMatchDate(match.scheduledDate) }}
          </p>
        </div>
        <button
          class="portal-btn portal-btn--ghost"
          @click="$emit('close')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Back to Matches
        </button>
      </div>

      <div class="portal-card-body">
        <!-- Error Message Banner -->
        <div v-if="saveError" class="portal-form-error error-banner">
          <div class="error-banner-content">
            <span class="error-icon">⚠️</span>
            <span>{{ saveError }}</span>
          </div>
          <button
            class="error-banner-close"
            @click="saveError = null"
            type="button"
            aria-label="Close error"
          >
            ✕
          </button>
        </div>

        <!-- Link Warning Banner -->
        <div v-if="linkWarning" class="portal-form-error warning-banner">
          <div class="error-banner-content">
            <span class="warning-icon">⚠️</span>
            <span>{{ linkWarning }}</span>
          </div>
          <button
            class="error-banner-close"
            @click="linkWarning = null"
            type="button"
            aria-label="Close warning"
          >
            ✕
          </button>
        </div>

        <!-- Maps Loop -->
        <div v-for="map in match.maps || []" :key="map.id" class="map-section">
          <!-- Map Header -->
          <div class="map-header">
            <h3 class="map-title">{{ map.mapName }}</h3>
            <span class="map-results-count">
              {{ map.matchResults.length }} result<span v-if="map.matchResults.length !== 1">s</span>
            </span>
          </div>

          <!-- Results Table -->
          <div class="portal-table-wrap">
            <table class="portal-table results-table">
              <thead>
                <tr>
                  <th style="width: 2rem;">#</th>
                  <th>Team 1</th>
                  <th style="text-align: center; width: 4rem;">Score</th>
                  <th>Team 2</th>
                  <th style="text-align: center; width: 4rem;">Score</th>
                  <th style="text-align: center;">Winner</th>
                  <th style="text-align: right; width: 10rem;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- Existing Results -->
                <template v-for="(result, index) in map.matchResults" :key="result.id">
                  <!-- Read-only view -->
                  <tr v-if="!editingResult || editingResult.id !== result.id" class="result-row">
                    <td class="result-index">{{ index + 1 }}</td>
                    <td>{{ result.team1Name || '-' }}</td>
                    <td class="result-score">{{ result.team1Tickets }}</td>
                    <td>{{ result.team2Name || '-' }}</td>
                    <td class="result-score">{{ result.team2Tickets }}</td>
                    <td class="result-winner">
                      <span v-if="result.winningTeamName" class="winner-badge">
                        {{ result.winningTeamName }}
                      </span>
                      <span v-else class="no-winner">-</span>
                    </td>
                    <td>
                      <div class="portal-table-actions">
                        <button
                          class="portal-cell-btn"
                          @click="editResult(map, result)"
                          title="Edit result"
                        >
                          Edit
                        </button>
                        <button
                          class="portal-icon-btn portal-icon-btn--danger"
                          @click="deleteResult(map, result.id)"
                          :disabled="isSaving"
                          title="Delete result"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- Inline edit view -->
                  <tr v-else class="edit-row">
                    <td colspan="7">
                      <div class="edit-form">
                        <div class="edit-form-grid">
                          <!-- Team 1 -->
                          <div class="portal-form-section">
                            <label class="portal-form-label">Team 1</label>
                            <select
                              v-model.number="formData.team1Id"
                              class="portal-form-input"
                            >
                              <option :value="undefined">Select team</option>
                              <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                                {{ team.name }}
                              </option>
                            </select>
                          </div>

                          <!-- Team 1 Score -->
                          <div class="portal-form-section">
                            <label class="portal-form-label">Score</label>
                            <input
                              v-model.number="formData.team1Tickets"
                              type="number"
                              min="0"
                              class="portal-form-input portal-form-input--mono"
                              placeholder="0"
                            />
                          </div>

                          <!-- Team 2 -->
                          <div class="portal-form-section">
                            <label class="portal-form-label">Team 2</label>
                            <select
                              v-model.number="formData.team2Id"
                              class="portal-form-input"
                            >
                              <option :value="undefined">Select team</option>
                              <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                                {{ team.name }}
                              </option>
                            </select>
                          </div>

                          <!-- Team 2 Score -->
                          <div class="portal-form-section">
                            <label class="portal-form-label">Score</label>
                            <input
                              v-model.number="formData.team2Tickets"
                              type="number"
                              min="0"
                              class="portal-form-input portal-form-input--mono"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <!-- Round Linking -->
                        <div class="round-link-section">
                          <div v-if="formData.roundId" class="linked-round">
                            <span class="linked-round-label">Linked Round:</span>
                            <span class="linked-round-id portal-mono">{{ formData.roundId }}</span>
                            <button
                              class="portal-btn portal-btn--ghost portal-btn--sm"
                              @click="currentMapForRound = map; router.push({ query: { ...route.query, linkingRound: 'true' } })"
                              :disabled="isSaving"
                            >
                              Change
                            </button>
                            <button
                              class="portal-btn portal-btn--danger portal-btn--sm"
                              @click="unlinkRoundFromResult()"
                              :disabled="isSaving"
                            >
                              Unlink
                            </button>
                          </div>
                          <div v-else>
                            <button
                              class="portal-btn portal-btn--ghost portal-btn--sm"
                              @click="currentMapForRound = map; router.push({ query: { ...route.query, linkingRound: 'true' } })"
                              :disabled="isSaving"
                            >
                              Link Round
                            </button>
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="edit-form-actions">
                          <button
                            class="portal-btn portal-btn--ghost"
                            @click="cancelEdit()"
                          >
                            Cancel
                          </button>
                          <button
                            class="portal-btn portal-btn--primary"
                            @click="saveResult(map)"
                            :disabled="isSaving || !formData.team1Id || !formData.team2Id"
                          >
                            {{ isSaving ? 'Saving...' : 'Update' }}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- Add New Result Row -->
                <tr v-if="editingMapId !== map.id && !editingResult" class="add-row">
                  <td class="result-index">+</td>
                  <td colspan="6">
                    <div class="add-result-actions">
                      <span class="add-result-label">Add New Result:</span>
                      <button
                        class="portal-cell-btn"
                        @click="openManualEntry(map)"
                        title="Enter a manual result"
                      >
                        + Manual
                      </button>
                      <span class="add-divider">|</span>
                      <button
                        class="portal-cell-btn portal-cell-btn--link"
                        @click="currentMapForRound = map; router.push({ query: { ...route.query, linkingRound: 'true' } })"
                        title="Link a round from the server"
                      >
                        + Link Round
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- New Result Form Row -->
                <tr v-if="editingMapId === map.id && !editingResult" class="edit-row">
                  <td colspan="7">
                    <div class="edit-form">
                      <div class="edit-form-grid">
                        <!-- Team 1 -->
                        <div class="portal-form-section">
                          <label class="portal-form-label">Team 1</label>
                          <select
                            v-model.number="formData.team1Id"
                            class="portal-form-input"
                          >
                            <option :value="undefined">Select team</option>
                            <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                              {{ team.name }}
                            </option>
                          </select>
                        </div>

                        <!-- Team 1 Score -->
                        <div class="portal-form-section">
                          <label class="portal-form-label">Tickets</label>
                          <input
                            v-model.number="formData.team1Tickets"
                            type="number"
                            min="0"
                            class="portal-form-input portal-form-input--mono"
                            placeholder="0"
                          />
                        </div>

                        <!-- Team 2 -->
                        <div class="portal-form-section">
                          <label class="portal-form-label">Team 2</label>
                          <select
                            v-model.number="formData.team2Id"
                            class="portal-form-input"
                          >
                            <option :value="undefined">Select team</option>
                            <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                              {{ team.name }}
                            </option>
                          </select>
                        </div>

                        <!-- Team 2 Score -->
                        <div class="portal-form-section">
                          <label class="portal-form-label">Tickets</label>
                          <input
                            v-model.number="formData.team2Tickets"
                            type="number"
                            min="0"
                            class="portal-form-input portal-form-input--mono"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <!-- Round Linking (when adding new) -->
                      <div class="round-link-section">
                        <div v-if="formData.roundId" class="linked-round">
                          <span class="linked-round-label">Linked Round:</span>
                          <span class="linked-round-id portal-mono">{{ formData.roundId }}</span>
                          <button
                            class="portal-btn portal-btn--ghost portal-btn--sm"
                            @click="currentMapForRound = map; router.push({ query: { ...route.query, linkingRound: 'true' } })"
                            :disabled="isSaving"
                          >
                            Change
                          </button>
                          <button
                            class="portal-btn portal-btn--danger portal-btn--sm"
                            @click="formData.roundId = undefined"
                            :disabled="isSaving"
                          >
                            Remove
                          </button>
                        </div>
                        <div v-else>
                          <button
                            class="portal-btn portal-btn--ghost portal-btn--sm"
                            @click="currentMapForRound = map; router.push({ query: { ...route.query, linkingRound: 'true' } })"
                            :disabled="isSaving"
                          >
                            Link Round
                          </button>
                        </div>
                      </div>

                      <!-- Actions -->
                      <div class="edit-form-actions">
                        <button
                          class="portal-btn portal-btn--ghost"
                          @click="cancelEdit()"
                        >
                          Cancel
                        </button>
                        <button
                          class="portal-btn portal-btn--primary"
                          @click="saveResult(map)"
                          :disabled="isSaving || !formData.team1Id || !formData.team2Id"
                        >
                          {{ isSaving ? 'Saving...' : 'Add Result' }}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="map.matchResults.length === 0 && editingMapId !== map.id" class="empty-row">
                  <td colspan="7">
                    <div class="empty-message">
                      No results yet. Click "Add New Result" to add one.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Link Round Panel -->
    <LinkRoundPanel
      v-if="showLinkRoundPanel && currentMapForRound"
      :open="showLinkRoundPanel"
      :game="tournament.game"
      :default-server-guid="match.serverGuid"
      :default-server-name="match.serverName"
      :default-map-name="currentMapForRound.mapName"
      @close="router.push({ query: { ...route.query, linkingRound: undefined } })"
      @selected="onRoundSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LinkRoundPanel from './LinkRoundPanel.vue';
import { useNotifications } from '@/composables/useNotifications';
import {
  TournamentDetail,
  TournamentMatch,
  TournamentMatchMap,
  TournamentMatchResult,
  adminTournamentService,
} from '@/services/adminTournamentService';

interface Props {
  tournament: TournamentDetail;
  match: TournamentMatch;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const route = useRoute();
const router = useRouter();
const { addNotification } = useNotifications();

const currentMapForRound = ref<TournamentMatchMap | null>(null);
const isSaving = ref(false);
const saveError = ref<string | null>(null);
const linkWarning = ref<string | null>(null);

// Computed states based on route params
const showLinkRoundPanel = computed(() => {
  return route.query.linkingRound === 'true';
});

const editingMapId = computed(() => {
  const mapId = route.query.editMapId;
  return mapId ? Number(mapId) : null;
});

const editingResult = computed(() => {
  const resultId = route.query.editResultId;
  if (!resultId) return null;

  // Find the result in the match data
  const numResultId = Number(resultId);
  for (const map of props.match.maps || []) {
    const result = map.matchResults.find(r => r.id === numResultId);
    if (result) return result;
  }
  return null;
});

const formData = ref({
  team1Id: undefined as number | undefined,
  team1Name: '',
  team2Id: undefined as number | undefined,
  team2Name: '',
  team1Tickets: 0,
  team2Tickets: 0,
  winningTeamId: undefined as number | undefined,
  winningTeamName: '',
  roundId: undefined as string | undefined,
});

const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function getMatchTeams() {
  if (!props.tournament) return [];
  const match = props.match;
  return props.tournament.teams.filter(
    team => team.id === match.team1Id || team.id === match.team2Id
  );
}

function openManualEntry(map: TournamentMatchMap): void {
  saveError.value = null;
  linkWarning.value = null;
    router.push({
    query: {
      ...route.query,
      editMapId: map.id.toString(),
      editResultId: undefined
    }
  });
  formData.value = {
    team1Id: undefined,
    team1Name: '',
    team2Id: undefined,
    team2Name: '',
    team1Tickets: 0,
    team2Tickets: 0,
    winningTeamId: undefined,
    winningTeamName: '',
    roundId: undefined,
  };
}

function editResult(map: TournamentMatchMap, result: TournamentMatchResult): void {
  saveError.value = null;
  linkWarning.value = null;
    router.push({
    query: {
      ...route.query,
      editMapId: map.id.toString(),
      editResultId: result.id.toString()
    }
  });
  const resultWithRound = result as any;
  formData.value = {
    team1Id: result.team1Id,
    team1Name: result.team1Name || '',
    team2Id: result.team2Id,
    team2Name: result.team2Name || '',
    team1Tickets: result.team1Tickets,
    team2Tickets: result.team2Tickets,
    winningTeamId: result.winningTeamId,
    winningTeamName: result.winningTeamName || '',
    roundId: resultWithRound.roundId,
  };
}

function cancelEdit(): void {
  saveError.value = null;
  linkWarning.value = null;
    router.push({
    query: {
      ...route.query,
      editMapId: undefined,
      editResultId: undefined
    }
  });
  formData.value = {
    team1Id: undefined,
    team1Name: '',
    team2Id: undefined,
    team2Name: '',
    team1Tickets: 0,
    team2Tickets: 0,
    winningTeamId: undefined,
    winningTeamName: '',
    roundId: undefined,
  };
}

// Watch for edits to load form data
watch(() => editingResult.value, (result) => {
  if (result) {
    const resultWithRound = result as any;
    formData.value = {
      team1Id: result.team1Id,
      team1Name: result.team1Name || '',
      team2Id: result.team2Id,
      team2Name: result.team2Name || '',
      team1Tickets: result.team1Tickets,
      team2Tickets: result.team2Tickets,
      winningTeamId: result.winningTeamId,
      winningTeamName: result.winningTeamName || '',
      roundId: resultWithRound.roundId,
    };
  }
}, { immediate: true });

async function saveResult(map: TournamentMatchMap): Promise<void> {
  if (!formData.value.team1Id || !formData.value.team2Id) {
    saveError.value = 'Please select both teams';
    return;
  }

  isSaving.value = true;
  saveError.value = null;

  try {
    // Determine winning team based on tickets
    const winningTeamId = formData.value.team1Tickets > formData.value.team2Tickets
      ? formData.value.team1Id
      : formData.value.team2Id;

    let updatedResult: TournamentMatchResult;

    if (editingResult.value) {
      // Update existing result
      updatedResult = await adminTournamentService.updateManualResult(
        props.tournament.id,
        editingResult.value.id,
        {
          team1Id: formData.value.team1Id,
          team2Id: formData.value.team2Id,
          team1Tickets: formData.value.team1Tickets,
          team2Tickets: formData.value.team2Tickets,
          winningTeamId,
        }
      );
    } else {
      // Create new result
      updatedResult = await adminTournamentService.createManualResult(
        props.tournament.id,
        props.match.id,
        map.id,
        {
          mapId: map.id,
          team1Id: formData.value.team1Id,
          team2Id: formData.value.team2Id,
          team1Tickets: formData.value.team1Tickets,
          team2Tickets: formData.value.team2Tickets,
          winningTeamId,
          roundId: formData.value.roundId,
        }
      );
    }

    // Update local state
    const mapIndex = props.match.maps?.findIndex(m => m.id === map.id);
    if (mapIndex !== undefined && mapIndex !== -1 && props.match.maps) {
      const resultIndex = props.match.maps[mapIndex].matchResults.findIndex(r => r.id === updatedResult.id);
      if (resultIndex !== -1) {
        props.match.maps[mapIndex].matchResults[resultIndex] = updatedResult;
      } else {
        props.match.maps[mapIndex].matchResults.push(updatedResult);
      }
    }

    // Check for team mapping warning
    const resultWithWarning = updatedResult as any;
    if (resultWithWarning.teamMappingWarning) {
      addNotification({
        type: 'warning',
        title: 'Team Mapping Warning',
        message: resultWithWarning.teamMappingWarning,
        duration: 6000,
      });
    } else {
      addNotification({
        type: 'success',
        title: 'Result Saved',
        message: 'Result saved successfully.',
        duration: 3000,
      });
    }

    cancelEdit();
    emit('updated');
  } catch (error) {
    console.error('Failed to save result:', error);
    // Set error message and keep form open
    saveError.value = error instanceof Error ? error.message : 'Failed to save result. Please try again.';
    // Don't close the form - user needs to fix the error
  } finally {
    isSaving.value = false;
  }
}

async function deleteResult(map: TournamentMatchMap, resultId: number): Promise<void> {
  if (!confirm('Delete this result?')) return;

  isSaving.value = true;
  try {
    await adminTournamentService.deleteMatchResult(props.tournament.id, resultId);

    const resultIndex = map.matchResults.findIndex(r => r.id === resultId);
    if (resultIndex !== -1) {
      map.matchResults.splice(resultIndex, 1);
    }

    emit('updated');
  } catch (error) {
    console.error('Failed to delete result:', error);
    addNotification({
      type: 'error',
      title: 'Failed to Delete Result',
      message: error instanceof Error ? error.message : 'Please try again.',
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

function onRoundSelected(roundId: string): void {
  // Close the link panel
  router.push({
    query: {
      ...route.query,
      linkingRound: undefined
    }
  });

  if (editingResult.value) {
    // Link round to existing result
    linkRoundToExistingResult(roundId);
  } else if (editingMapId.value) {
    // Adding new result - just set roundId in form
    formData.value.roundId = roundId;
  } else if (currentMapForRound.value) {
    // Not in edit mode - create new result from round directly
    createResultFromRound(currentMapForRound.value, roundId);
  }
}

async function createResultFromRound(map: TournamentMatchMap, roundId: string): Promise<void> {
  isSaving.value = true;
  linkWarning.value = null;

  try {
    const result = await adminTournamentService.createManualResult(
      props.tournament.id,
      props.match.id,
      map.id,
      {
        mapId: map.id,
        roundId,
      }
    );

    // Check for team mapping warning FIRST (before anything else)
    const resultWithRound = result as any;
    const hasWarning = !!resultWithRound.teamMappingWarning;

    if (hasWarning) {
      linkWarning.value = `${resultWithRound.teamMappingWarning} - Please review and confirm the team assignments.`;
    }

    // Update local state
    const mapIndex = props.match.maps?.findIndex(m => m.id === map.id);
    if (mapIndex !== undefined && mapIndex !== -1 && props.match.maps) {
      props.match.maps[mapIndex].matchResults.push(result);
    }

    // Navigate to edit mode - the watch will populate formData
    await router.push({
      query: {
        ...route.query,
        editMapId: map.id.toString(),
        editResultId: result.id.toString()
      }
    });

    // Only emit updated if there's no warning - let user see and confirm warning first
    if (!hasWarning) {
      emit('updated');
      addNotification({
        type: 'success',
        title: 'Round Linked',
        message: 'Round successfully linked to result.',
        duration: 4000,
      });
    } else {
      // Show warning in the form banner - user must confirm before we refresh
      linkWarning.value = `${resultWithRound.teamMappingWarning} - Please review and confirm the team assignments.`;
    }
  } catch (error) {
    console.error('Failed to link round:', error);
    addNotification({
      type: 'error',
      title: 'Failed to Link Round',
      message: error instanceof Error ? error.message : 'Please try again.',
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

async function linkRoundToExistingResult(roundId: string): Promise<void> {
  if (!editingResult.value) return;

  isSaving.value = true;
  linkWarning.value = null;

  try {
    const result = await adminTournamentService.linkRoundToResult(
      props.tournament.id,
      editingResult.value.id,
      roundId
    );

    // Update form with result data
    editingResult.value = result;
    formData.value = {
      team1Id: result.team1Id,
      team1Name: result.team1Name || '',
      team2Id: result.team2Id,
      team2Name: result.team2Name || '',
      team1Tickets: result.team1Tickets || 0,
      team2Tickets: result.team2Tickets || 0,
      winningTeamId: result.winningTeamId,
      winningTeamName: result.winningTeamName || '',
      roundId: (result as any).roundId,
    };

    // Check for team mapping warning
    const resultWithWarning = result as any;
    if (resultWithWarning.teamMappingWarning) {
      // Show warning in the form banner - user must confirm before we refresh
      linkWarning.value = `${resultWithWarning.teamMappingWarning} - Please manually select the correct teams.`;
    } else {
      addNotification({
        type: 'success',
        title: 'Round Linked',
        message: 'Round successfully linked.',
        duration: 3000,
      });
      emit('updated');
    }
  } catch (error) {
    console.error('Failed to link round to result:', error);
    addNotification({
      type: 'error',
      title: 'Failed to Link Round',
      message: error instanceof Error ? error.message : 'Please try again.',
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

async function unlinkRoundFromResult(): Promise<void> {
  if (!editingResult.value || !confirm('Unlink this round?')) return;

  isSaving.value = true;
  try {
    const result = await adminTournamentService.unlinkRoundFromResult(
      props.tournament.id,
      editingResult.value.id
    );

    editingResult.value = result;
    formData.value.roundId = (result as any).roundId;

    // Check for team mapping warning
    const resultWithWarning = result as any;
    if (resultWithWarning.teamMappingWarning) {
      addNotification({
        type: 'warning',
        title: 'Team Mapping Warning',
        message: resultWithWarning.teamMappingWarning,
        duration: 6000,
      });
    } else {
      addNotification({
        type: 'success',
        title: 'Round Unlinked',
        message: 'Round successfully unlinked.',
        duration: 3000,
      });
    }

    emit('updated');
  } catch (error) {
    console.error('Failed to unlink round:', error);
    addNotification({
      type: 'error',
      title: 'Failed to Unlink Round',
      message: error instanceof Error ? error.message : 'Please try again.',
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.tournament-results-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.portal-card-subtitle {
  font-size: 0.75rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
}

.map-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--portal-border);
}

.map-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.map-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--portal-warn);
  margin: 0;
}

.map-results-count {
  font-size: 0.7rem;
  color: var(--portal-text);
}

.results-table {
  font-size: 0.8rem;
}

.results-table th {
  font-size: 0.65rem;
}

.result-row td {
  vertical-align: middle;
}

.result-index {
  color: var(--portal-text);
  opacity: 0.6;
  font-family: ui-monospace, monospace;
}

.result-score {
  text-align: center;
  font-weight: 600;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
}

.result-winner {
  text-align: center;
}

.winner-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 2px;
  color: var(--portal-warn);
  font-size: 0.7rem;
  font-weight: 600;
}

.no-winner {
  color: var(--portal-text);
  opacity: 0.5;
}

.add-row {
  background: var(--portal-surface-elevated);
}

.add-row td {
  padding: 0.75rem;
}

.add-result-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.add-result-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--portal-text);
}

.add-divider {
  color: var(--portal-border);
}

.portal-cell-btn--link {
  background: rgba(245, 158, 11, 0.12);
  color: var(--portal-warn);
  border-color: rgba(245, 158, 11, 0.3);
}

.portal-cell-btn--link:hover {
  background: rgba(245, 158, 11, 0.2);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
}

.edit-row {
  background: var(--portal-surface-elevated);
}

.edit-row td {
  padding: 0;
}

.edit-form {
  padding: 1rem;
  border: 1px solid var(--portal-border);
  margin: 0.5rem;
  border-radius: 2px;
  background: var(--portal-surface);
}

.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .edit-form-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.edit-form .portal-form-section {
  margin-bottom: 0;
}

.round-link-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--portal-border);
}

.linked-round {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.linked-round-label {
  font-size: 0.75rem;
  color: var(--portal-text);
}

.linked-round-id {
  font-size: 0.75rem;
  color: var(--portal-accent);
  background: var(--portal-accent-dim);
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
}

.edit-form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--portal-border);
}

.empty-row td {
  padding: 2rem;
}

.empty-message {
  text-align: center;
  font-size: 0.8rem;
  color: var(--portal-text);
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--portal-danger-glow);
  border: 1px solid var(--portal-danger);
  border-radius: 2px;
  margin-bottom: 1rem;
}

.error-banner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  font-size: 0.875rem;
  color: var(--portal-danger);
}

.error-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.warning-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 2px;
  margin-bottom: 1rem;
}

.warning-banner .error-banner-content {
  color: var(--portal-warn);
}

.warning-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.error-banner-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--portal-danger);
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.error-banner-close:hover {
  background: rgba(239, 68, 68, 0.2);
}

.warning-banner .error-banner-close {
  color: var(--portal-warn);
}

.warning-banner .error-banner-close:hover {
  background: rgba(245, 158, 11, 0.2);
}

@media (max-width: 640px) {
  .map-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .add-result-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .add-divider {
    display: none;
  }

  .linked-round {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
