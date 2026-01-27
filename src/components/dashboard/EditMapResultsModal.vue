<template>
  <div v-if="isOpen" class="modal-mobile-safe fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white">Match Results</h2>
            <p class="text-xs text-slate-400 mt-1">{{ props.match.maps?.length || 0 }} maps • Enter results for all maps below</p>
          </div>
          <button
            @click="$emit('close')"
            class="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Content - All Maps -->
      <div class="px-6 py-4 space-y-6">
        <div v-for="map in props.match.maps || []" :key="map.id" class="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
          <!-- Map Header -->
          <div class="mb-4 pb-3 border-b border-slate-700">
            <h3 class="text-sm font-bold text-white">{{ map.mapName }}</h3>
          </div>

          <!-- Results Table for this Map -->
          <div class="space-y-3">

            <!-- Results Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="bg-slate-800/50 border-b border-slate-700">
                    <th class="p-2 text-left text-xs font-semibold text-slate-300">#</th>
                    <th class="p-2 text-left text-xs font-semibold text-slate-300">Team 1</th>
                    <th class="p-2 text-center text-xs font-semibold text-slate-300">Score</th>
                    <th class="p-2 text-left text-xs font-semibold text-slate-300">Team 2</th>
                    <th class="p-2 text-center text-xs font-semibold text-slate-300">Score</th>
                    <th class="p-2 text-center text-xs font-semibold text-slate-300">Winner</th>
                    <th class="p-2 text-center text-xs font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Existing Results -->
                  <tr
                    v-for="(result, index) in map.matchResults"
                    :key="result.id"
                    class="border-b border-slate-700 hover:bg-slate-800/30 transition"
                  >
                    <!-- Read-only view -->
                    <template v-if="!editingResult || editingResult.id !== result.id">
                      <td class="p-2 text-slate-400">{{ index + 1 }}</td>
                      <td class="p-2 text-white">{{ result.team1Name || '-' }}</td>
                      <td class="p-2 text-center text-emerald-400 font-medium">{{ result.team1Tickets }}</td>
                      <td class="p-2 text-white">{{ result.team2Name || '-' }}</td>
                      <td class="p-2 text-center text-emerald-400 font-medium">{{ result.team2Tickets }}</td>
                      <td class="p-2 text-center">
                        <span v-if="result.winningTeamName" class="text-yellow-400 font-bold">🏆 {{ result.winningTeamName }}</span>
                        <span v-else class="text-slate-500 text-xs">-</span>
                      </td>
                      <td class="p-2 text-center flex gap-2 justify-center">
                        <button
                          @click="editResult(map, result)"
                          class="px-3 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition text-sm"
                          title="Edit result"
                        >
                          ✎ Edit
                        </button>
                        <button
                          @click="deleteResult(map, result.id)"
                          :disabled="isSaving"
                          class="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:text-slate-600 disabled:hover:bg-transparent rounded transition text-sm"
                          title="Delete result"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </template>

                    <!-- Inline edit view -->
                    <template v-else>
                      <td colspan="7" class="p-3">
                        <div class="space-y-3 bg-slate-900/50 p-3 rounded border border-slate-600">
                          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <!-- Team 1 Dropdown -->
                            <div>
                              <label class="text-xs text-slate-400 block mb-1 font-semibold">Team 1</label>
                              <select
                                v-model.number="formData.team1Id"
                                class="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                              >
                                <option :value="undefined">Select team</option>
                                <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                                  {{ team.name }}
                                </option>
                              </select>
                            </div>

                            <!-- Team 1 Score -->
                            <div>
                              <label class="text-xs text-slate-400 block mb-1 font-semibold">Score</label>
                              <input
                                v-model.number="formData.team1Tickets"
                                type="number"
                                min="0"
                                class="w-full px-1.5 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm text-center"
                                placeholder="0"
                              />
                            </div>

                            <!-- Team 2 Dropdown -->
                            <div>
                              <label class="text-xs text-slate-400 block mb-1 font-semibold">Team 2</label>
                              <select
                                v-model.number="formData.team2Id"
                                class="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                              >
                                <option :value="undefined">Select team</option>
                                <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                                  {{ team.name }}
                                </option>
                              </select>
                            </div>

                            <!-- Team 2 Score -->
                            <div>
                              <label class="text-xs text-slate-400 block mb-1 font-semibold">Score</label>
                              <input
                                v-model.number="formData.team2Tickets"
                                type="number"
                                min="0"
                                class="w-full px-1.5 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm text-center"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <!-- Round Linking -->
                          <div class="border-t border-slate-600 pt-3">
                            <div v-if="formData.roundId" class="flex items-center gap-2">
                              <span class="text-xs text-slate-300">📌 Round: <span class="text-emerald-400 font-medium">{{ formData.roundId }}</span></span>
                              <button
                                @click="currentMapForRound = map; showLinkRoundModal = true"
                                :disabled="isSaving"
                                class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded transition font-medium ml-auto"
                              >
                                Edit
                              </button>
                              <button
                                @click="unlinkRoundFromResult()"
                                :disabled="isSaving"
                                class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded transition font-medium"
                              >
                                Unlink
                              </button>
                            </div>
                            <div v-else>
                              <button
                                @click="currentMapForRound = map; showLinkRoundModal = true"
                                :disabled="isSaving"
                                class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded transition font-medium"
                              >
                                Link Round
                              </button>
                            </div>
                          </div>

                          <!-- Action Buttons -->
                          <div class="flex gap-2 pt-2 border-t border-slate-600">
                            <button
                              @click="saveManualResult(map)"
                              :disabled="isSaving || !formData.team1Id || !formData.team2Id"
                              class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded transition font-medium"
                            >
                              {{ isSaving ? 'Saving...' : 'Update' }}
                            </button>
                            <button
                              @click="cancelManualEntry()"
                              class="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </template>
                  </tr>

                  <!-- Add New Result Trigger Row -->
                  <tr v-if="editingMapId !== map.id && !editingResult" class="border-b border-slate-700 bg-slate-800/50">
                    <td class="p-2 text-slate-400">+</td>
                    <td colspan="6" class="p-2">
                      <div class="flex gap-2 items-center justify-center h-full">
                        <p class="text-xs text-slate-400 font-semibold">Add New Result:</p>
                        <button
                          @click="openManualEntry(map)"
                          class="px-3 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition text-sm font-medium"
                          title="Enter a manual result"
                        >
                          + Manually
                        </button>
                        <span class="text-slate-600">|</span>
                        <button
                          @click="currentMapForRound = map; showLinkRoundModal = true"
                          class="px-3 py-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition text-sm font-medium"
                          title="Link a round from the match"
                        >
                          + Link
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- New Result Form Row (only show when adding new result) -->
                  <tr v-if="editingMapId === map.id && !editingResult" class="border-b border-slate-700 bg-slate-800/50">
                    <td class="p-2 text-slate-400">+</td>
                    <td colspan="6" class="p-2">
                      <div class="space-y-2 bg-slate-900/50 p-3 rounded border border-slate-600">
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <!-- Team 1 Dropdown -->
                          <div>
                            <label class="text-xs text-slate-400 block mb-1">Team 1</label>
                            <select
                              v-model.number="formData.team1Id"
                              class="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                            >
                              <option :value="undefined">Select team</option>
                              <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                                {{ team.name }}
                              </option>
                            </select>
                          </div>

                          <!-- Team 1 Tickets -->
                          <div>
                            <label class="text-xs text-slate-400 block mb-1">Tickets</label>
                            <input
                              v-model.number="formData.team1Tickets"
                              type="number"
                              min="0"
                              class="w-full px-1.5 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm text-center"
                              placeholder="0"
                            />
                          </div>

                          <!-- Team 2 Dropdown -->
                          <div>
                            <label class="text-xs text-slate-400 block mb-1">Team 2</label>
                            <select
                              v-model.number="formData.team2Id"
                              class="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                            >
                              <option :value="undefined">Select team</option>
                              <option v-for="team in getMatchTeams()" :key="team.id" :value="team.id">
                                {{ team.name }}
                              </option>
                            </select>
                          </div>

                          <!-- Team 2 Tickets -->
                          <div>
                            <label class="text-xs text-slate-400 block mb-1">Tickets</label>
                            <input
                              v-model.number="formData.team2Tickets"
                              type="number"
                              min="0"
                              class="w-full px-1.5 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm text-center"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <!-- Round Linking (when adding new result) -->
                        <div class="border-t border-slate-600 pt-2 mt-2">
                          <div v-if="formData.roundId" class="flex items-center gap-2">
                            <span class="text-xs text-slate-300">📌 Round: <span class="text-emerald-400 font-medium">{{ formData.roundId }}</span></span>
                            <button
                              @click="currentMapForRound = map; showLinkRoundModal = true"
                              :disabled="isSaving"
                              class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded transition font-medium ml-auto"
                            >
                              Edit
                            </button>
                            <button
                              @click="unlinkRoundFromResult()"
                              :disabled="isSaving"
                              class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded transition font-medium"
                            >
                              Unlink
                            </button>
                          </div>
                          <div v-else>
                            <button
                              @click="currentMapForRound = map; showLinkRoundModal = true"
                              :disabled="isSaving"
                              class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded transition font-medium"
                            >
                              Link Round
                            </button>
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex gap-2 pt-2">
                          <button
                            @click="saveManualResult(map)"
                            :disabled="isSaving || !formData.team1Id || !formData.team2Id"
                            class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded transition font-medium"
                          >
                            {{ isSaving ? 'Saving...' : 'Add Result' }}
                          </button>
                          <button
                            @click="cancelManualEntry()"
                            class="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Empty State Message -->
                  <tr v-if="map.matchResults.length === 0 && editingMapId !== map.id" class="border-b border-slate-700">
                    <td colspan="7" class="p-4 text-center text-slate-400 text-sm">
                      No results yet. Click "Add New Result" below to add one.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-3 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition"
        >
          Close
        </button>
      </div>
    </div>

    <!-- Round Linking Modal -->
    <AddRoundModal
      v-if="showLinkRoundModal && currentMapForRound"
      :tournament-id="props.tournament.id"
      :game="props.tournament.game"
      :default-server-guid="props.match.serverGuid"
      :default-server-name="props.match.serverName"
      :default-map-name="currentMapForRound.mapName"
      :multi-select="false"
      @added="onRoundSelected"
      @close="showLinkRoundModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AddRoundModal from './AddRoundModal.vue';
import { useNotifications } from '@/composables/useNotifications';
import {
  TournamentDetail,
  TournamentMatch,
  TournamentMatchMap,
  TournamentMatchResult,
  adminTournamentService,
} from '@/services/adminTournamentService';

interface Props {
  isOpen: boolean;
  tournament: TournamentDetail;
  match: TournamentMatch;
}

interface Emits {
  (e: 'close'): void;
  (e: 'updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { addNotification } = useNotifications();

const showLinkRoundModal = ref(false);
const editingMapId = ref<number | null>(null);
const currentMapForRound = ref<TournamentMatchMap | null>(null);
const editingResult = ref<TournamentMatchResult | null>(null);
const isSaving = ref(false);

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

function getMatchTeams() {
  if (!props.tournament) return [];
  const match = props.match;
  return props.tournament.teams.filter(
    team => team.id === match.team1Id || team.id === match.team2Id
  );
}

function openManualEntry(map: TournamentMatchMap): void {
  editingMapId.value = map.id;
  editingResult.value = null;
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
  editingMapId.value = map.id;
  editingResult.value = result;
  const resultWithRound = result as any; // Result may have roundId from API
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

function cancelManualEntry(): void {
  editingMapId.value = null;
  editingResult.value = null;
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

async function saveManualResult(map: TournamentMatchMap): Promise<void> {
  if (!formData.value.team1Id || !formData.value.team2Id) {
    addNotification({
      type: 'warning',
      title: 'Incomplete Form',
      message: 'Please select both teams',
      duration: 4000,
    });
    return;
  }

  isSaving.value = true;
  try {
    // Determine winning team based on tickets
    const winningTeamId = formData.value.team1Tickets > formData.value.team2Tickets
      ? formData.value.team1Id
      : formData.value.team2Id;

    let updatedResult: TournamentMatchResult;

    if (editingResult.value) {
      // Update existing result - now accepts all fields including team IDs
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
      // Create new result (with optional roundId)
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

    // Update local state with returned result so UI refreshes immediately
    const mapIndex = props.match.maps?.findIndex(m => m.id === map.id);
    if (mapIndex !== undefined && mapIndex !== -1 && props.match.maps) {
      const resultIndex = props.match.maps[mapIndex].matchResults.findIndex(r => r.id === updatedResult.id);
      if (resultIndex !== -1) {
        // Update existing result
        props.match.maps[mapIndex].matchResults[resultIndex] = updatedResult;
      } else {
        // Add new result
        props.match.maps[mapIndex].matchResults.push(updatedResult);
      }
    }

    cancelManualEntry();
    emit('updated');
  } catch (error) {
    console.error('Failed to save result:', error);
    const errorMessage = error instanceof Error ? error.message : 'There was an error saving the result. Please try again.';
    addNotification({
      type: 'error',
      title: 'Failed to Save Result',
      message: errorMessage,
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

async function deleteResult(map: TournamentMatchMap, resultId: number): Promise<void> {
  if (!confirm('Delete this result?')) return;

  isSaving.value = true;
  try {
    // Delete via service (handles authentication)
    await adminTournamentService.deleteMatchResult(props.tournament.id, resultId);

    // Remove from local state
    const resultIndex = map.matchResults.findIndex(r => r.id === resultId);
    if (resultIndex !== -1) {
      map.matchResults.splice(resultIndex, 1);
    }

    emit('updated');
  } catch (error) {
    console.error('Failed to delete result:', error);
    const errorMessage = error instanceof Error ? error.message : 'There was an error deleting the result. Please try again.';
    addNotification({
      type: 'error',
      title: 'Failed to Delete Result',
      message: errorMessage,
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

async function onRoundLinked(roundId: string): Promise<void> {
  if (!currentMapForRound.value) return;

  const map = currentMapForRound.value;
  showLinkRoundModal.value = false;
  isSaving.value = true;

  try {
    // POST to create result with roundId - backend will populate teams and scores from round
    const result = await adminTournamentService.createManualResult(
      props.tournament.id,
      props.match.id,
      map.id,
      {
        mapId: map.id,
        roundId,
      }
    );

    // Update local state with returned result so UI refreshes immediately
    const mapIndex = props.match.maps?.findIndex(m => m.id === map.id);
    if (mapIndex !== undefined && mapIndex !== -1 && props.match.maps) {
      props.match.maps[mapIndex].matchResults.push(result);
    }

    // Refresh parent with new result
    emit('updated');

    // Check for team mapping warning
    const resultWithWarning = result as any;
    if (resultWithWarning.teamMappingWarning) {
      // Show warning and open form for manual team mapping
      addNotification({
        type: 'warning',
        title: 'Team Mapping Warning',
        message: `${resultWithWarning.teamMappingWarning}\n\nPlease review and confirm the team assignments below.`,
        duration: 8000,
      });

      // Load the result into the editing form so user can review/edit
      editingMapId.value = map.id;
      editingResult.value = result;
      formData.value = {
        team1Id: result.team1Id,
        team1Name: result.team1Name || '',
        team2Id: result.team2Id,
        team2Name: result.team2Name || '',
        team1Tickets: result.team1Tickets,
        team2Tickets: result.team2Tickets,
        winningTeamId: result.winningTeamId,
        winningTeamName: result.winningTeamName || '',
        roundId: (result as any).roundId,
      };
    } else {
      // No warning - show success notification
      addNotification({
        type: 'success',
        title: 'Round Linked',
        message: 'Round successfully linked to result. You can close this modal or link another.',
        duration: 4000,
      });
    }
  } catch (error) {
    console.error('Failed to link round:', error);
    const errorMessage = error instanceof Error ? error.message : 'There was an error linking the round. Please try again.';
    addNotification({
      type: 'error',
      title: 'Failed to Link Round',
      message: errorMessage,
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}

function onRoundSelected(roundId: string): void {
  if (editingResult.value) {
    linkRoundToExistingResult(roundId);
  } else {
    onRoundLinked(roundId);
  }
}

async function linkRoundToExistingResult(roundId: string): Promise<void> {
  if (!editingResult.value) return;

  isSaving.value = true;
  try {
    console.log(`Linking round ${roundId} to result ${editingResult.value.id}`);
    // Link via service (handles authentication)
    const result = await adminTournamentService.linkRoundToResult(
      props.tournament.id,
      editingResult.value.id,
      roundId
    );
    console.log('Round link response:', result);

    // Check for team mapping warning
    if ((result as any).teamMappingWarning) {
      addNotification({
        type: 'warning',
        title: 'Team Mapping Warning',
        message: `${(result as any).teamMappingWarning}\n\nThe round has been linked, but team names couldn't be auto-identified. Please manually select the correct teams in the form.`,
        duration: 8000,
      });

      // Update form with the result data from response
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
    } else {
      // Success - update form with response data and refresh
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
      emit('updated');
    }
  } catch (error) {
    console.error('Failed to link round to result:', error);
    const errorMessage = error instanceof Error ? error.message : 'There was an error linking the round. Please try again.';
    addNotification({
      type: 'error',
      title: 'Failed to Link Round',
      message: errorMessage,
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
    // Unlink via service (handles authentication)
    const result = await adminTournamentService.unlinkRoundFromResult(
      props.tournament.id,
      editingResult.value.id
    );

    // Update local state with result
    editingResult.value = result;
    formData.value.roundId = (result as any).roundId;

    emit('updated');
  } catch (error) {
    console.error('Failed to unlink round:', error);
    const errorMessage = error instanceof Error ? error.message : 'There was an error unlinking the round. Please try again.';
    addNotification({
      type: 'error',
      title: 'Failed to Unlink Round',
      message: errorMessage,
      duration: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped src="./EditMapResultsModal.vue.css"></style>
