<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
            <div>
              <h3 class="text-sm font-bold text-white">{{ map.mapName }}</h3>
              <p class="text-xs text-slate-400 mt-1">Map {{ map.mapOrder + 1 }} • Aggregation: <span class="text-emerald-400 font-bold">{{ getResultsAggregation(map) }}</span></p>
            </div>
          </div>

          <!-- Results Table for this Map -->
          <div class="space-y-3">
            <p class="text-xs font-semibold text-slate-300">Results ({{ map.matchResults.length }})</p>

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
                    <td class="p-2 text-slate-400">{{ index + 1 }}</td>
                    <td class="p-2 text-white">{{ result.team1Name || '-' }}</td>
                    <td class="p-2 text-center text-emerald-400 font-medium">{{ result.team1Tickets }}</td>
                    <td class="p-2 text-white">{{ result.team2Name || '-' }}</td>
                    <td class="p-2 text-center text-emerald-400 font-medium">{{ result.team2Tickets }}</td>
                    <td class="p-2 text-center">
                      <span v-if="result.winningTeamName" class="text-yellow-400 font-bold">🏆 {{ result.winningTeamName }}</span>
                      <span v-else class="text-slate-500 text-xs">-</span>
                    </td>
                    <td class="p-2 text-center flex gap-1 justify-center">
                      <button
                        @click="editResult(map, result)"
                        class="p-1 text-blue-400 hover:text-blue-300 transition text-xs"
                        title="Edit result"
                      >
                        ✎
                      </button>
                      <button
                        @click="deleteResult(map, result.id)"
                        :disabled="isSaving"
                        class="p-1 text-red-400 hover:text-red-300 disabled:text-slate-600 transition text-xs"
                        title="Delete result"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>

                  <!-- New Result Row -->
                  <tr class="border-b border-slate-700 bg-slate-800/50">
                    <td class="p-2 text-slate-400">+</td>
                    <td colspan="5" class="p-2">
                      <div v-if="editingMapId !== map.id" class="flex gap-2 h-full items-center justify-start">
                        <button
                          @click="openManualEntry(map)"
                          class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
                        >
                          Enter Manual Result
                        </button>
                        <button
                          @click="currentMapForRound = map; showLinkRoundModal = true"
                          class="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded transition font-medium"
                        >
                          Link Round
                        </button>
                      </div>
                      <div v-else class="space-y-2">
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
                              class="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm"
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
                              class="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <!-- Round Management (when editing existing result) -->
                        <div v-if="editingResult" class="border-t border-slate-600 pt-2 mt-2">
                          <p class="text-xs text-slate-400 font-semibold mb-2">Round Management</p>
                          <div v-if="formData.roundId" class="text-xs text-slate-300 mb-2">
                            📌 Linked to Round: <span class="text-emerald-400">{{ formData.roundId }}</span>
                          </div>
                          <div v-else class="text-xs text-slate-400 mb-2">
                            No round linked
                          </div>
                          <div class="flex gap-2">
                            <button
                              @click="currentMapForRound = editingMapId === null ? null : (props.match.maps || []).find(m => m.id === editingMapId) || null; showLinkRoundModal = true"
                              :disabled="isSaving"
                              class="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded transition font-medium"
                            >
                              {{ formData.roundId ? 'Change Round' : 'Link Round' }}
                            </button>
                            <button
                              v-if="formData.roundId"
                              @click="unlinkRoundFromResult()"
                              :disabled="isSaving"
                              class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded transition font-medium"
                            >
                              Unlink
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
                            {{ isSaving ? 'Saving...' : editingResult ? 'Update' : 'Add Result' }}
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
                    <td class="p-2"></td>
                  </tr>

                  <!-- Empty State Message -->
                  <tr v-if="map.matchResults.length === 0" class="border-b border-slate-700">
                    <td colspan="7" class="p-4 text-center text-slate-400 text-sm">
                      No results yet. Use the row above to add one.
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

function getResultsAggregation(map: TournamentMatchMap): string {
  const results = map.matchResults;
  if (!results || results.length === 0) return '—';

  const team1Id = results[0]?.team1Id;
  if (!team1Id) return '—';

  const team1Wins = results.filter((r) => r.winningTeamId === team1Id).length;
  const team2Wins = results.length - team1Wins;
  return `${team1Wins}-${team2Wins}`;
}

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
    alert('Please select both teams');
    return;
  }

  isSaving.value = true;
  try {
    // Determine winning team based on tickets
    const winningTeamId = formData.value.team1Tickets > formData.value.team2Tickets
      ? formData.value.team1Id
      : formData.value.team2Id;

    if (editingResult.value) {
      // Update existing result - now accepts all fields including team IDs
      await adminTournamentService.updateManualResult(
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
      await adminTournamentService.createManualResult(
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
        }
      );
    }

    cancelManualEntry();
    emit('updated');
  } catch (error) {
    console.error('Failed to save result:', error);
    alert('Failed to save result. Please try again.');
  } finally {
    isSaving.value = false;
  }
}

async function deleteResult(_map: TournamentMatchMap, resultId: number): Promise<void> {
  if (!confirm('Delete this result?')) return;

  isSaving.value = true;
  try {
    // Call API to delete the result
    // Note: This endpoint may need to be added to the backend if it doesn't exist
    const response = await fetch(`/stats/admin/tournaments/${props.tournament.id}/match-results/${resultId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete result');
    }

    emit('updated');
  } catch (error) {
    console.error('Failed to delete result:', error);
    alert('Failed to delete result. Please try again.');
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
    // Link the round to the map
    const response = await adminTournamentService.updateMatchMap(
      props.tournament.id,
      props.match.id,
      map.id,
      {
        mapId: map.id,
        roundId,
        updateRoundId: true,
      }
    );

    // Check for team mapping warning - if the algorithm couldn't auto-identify teams
    const responseWithWarning = response as any;
    if (responseWithWarning.teamMappingWarning) {
      // Get the newly created result from the response
      const newResult = responseWithWarning.response?.matchResults?.[responseWithWarning.response.matchResults.length - 1];

      if (newResult) {
        // Show warning to user
        alert(
          `⚠️ Team Mapping Warning:\n\n${responseWithWarning.teamMappingWarning}\n\n` +
          `The round has been linked, but team names couldn't be auto-identified. ` +
          `Please manually select the correct teams in the form below.`
        );

        // Open the form to allow manual team mapping
        editingMapId.value = map.id;
        editingResult.value = newResult;
        formData.value = {
          team1Id: undefined,
          team1Name: '',
          team2Id: undefined,
          team2Name: '',
          team1Tickets: newResult.team1Tickets || 0,
          team2Tickets: newResult.team2Tickets || 0,
          winningTeamId: newResult.winningTeamId,
          winningTeamName: newResult.winningTeamName || '',
          roundId: (newResult as any).roundId,
        };
      } else {
        // Warning but no result found - still emit updated to refresh
        alert(
          `⚠️ Team Mapping Warning:\n\n${responseWithWarning.teamMappingWarning}\n\n` +
          `Please edit the result above to set the correct teams.`
        );
        emit('updated');
      }
    } else {
      // No warning - success
      emit('updated');
    }
  } catch (error) {
    console.error('Failed to link round:', error);
    alert('Failed to link round. Please try again.');
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
    const response = await fetch(
      `/stats/admin/tournaments/${props.tournament.id}/match-results/${editingResult.value.id}/round`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to link round');
    }

    const result = await response.json();
    console.log('Round link response:', result);

    // Check for team mapping warning
    if (result.teamMappingWarning) {
      alert(
        `⚠️ Team Mapping Warning:\n\n${result.teamMappingWarning}\n\n` +
        `The round has been linked, but team names couldn't be auto-identified. ` +
        `Please manually select the correct teams in the form.`
      );

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
        roundId: result.roundId,
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
        roundId: result.roundId,
      };
      emit('updated');
    }
  } catch (error) {
    console.error('Failed to link round to result:', error);
    alert('Failed to link round. Please try again.');
  } finally {
    isSaving.value = false;
  }
}

async function unlinkRoundFromResult(): Promise<void> {
  if (!editingResult.value || !confirm('Unlink this round?')) return;

  isSaving.value = true;
  try {
    const response = await fetch(
      `/stats/admin/tournaments/${props.tournament.id}/match-results/${editingResult.value.id}/round`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId: null }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to unlink round');
    }

    emit('updated');
  } catch (error) {
    console.error('Failed to unlink round:', error);
    alert('Failed to unlink round. Please try again.');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
/* Modal enters from center with fade effect */
:deep(.fixed) {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Expand transition for manual entry form */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
