<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {{ editMode ? 'Edit Match' : 'Schedule Match' }}
            </h2>
            <p class="text-slate-400 text-sm mt-1">
              {{ editMode ? 'Update match details' : 'Schedule a new match in the tournament calendar' }}
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

        <!-- No Teams Warning -->
        <div v-if="teams.length < 2" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p class="text-amber-400 text-sm">
            You need at least 2 teams to schedule a match. Please create teams first.
          </p>
        </div>

        <!-- Form -->
        <template v-else>
          <!-- Scheduled Date -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Scheduled Date & Time <span class="text-red-400">*</span>
            </label>
            <input
              v-model="formData.scheduledDate"
              type="datetime-local"
              class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              :disabled="loading"
            >
          </div>

          <!-- Week -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Week <span class="text-slate-500 text-xs">(Optional)</span>
            </label>
            <select
              v-model="formData.week"
              class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              :disabled="loading || availableWeeks.length === 0"
            >
              <option :value="null">No Week (Unscheduled)</option>
              <option
                v-for="week in availableWeeks"
                :key="week"
                :value="week"
              >
                {{ week }}
              </option>
            </select>
            <p class="text-xs text-slate-500 mt-1">
              {{ availableWeeks.length === 0
                ? 'No week dates defined for this tournament. Define week dates in tournament settings.'
                : 'Select a week or leave unscheduled. Matches without a week will be grouped under "Unscheduled"'
              }}
            </p>
          </div>

          <!-- Teams Section -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Match Teams <span class="text-red-400">*</span>
            </label>
            <div class="flex items-center gap-3">
              <!-- Team 1 -->
              <select
                v-model="formData.team1Id"
                class="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                :disabled="loading"
              >
                <option :value="null" disabled>Team 1...</option>
                <option
                  v-for="team in availableTeamsForTeam1"
                  :key="team.id"
                  :value="team.id"
                >
                  {{ team.name }} ({{ team.players.length }})
                </option>
              </select>

              <!-- VS Divider -->
              <div class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 flex-shrink-0">
                VS
              </div>

              <!-- Team 2 -->
              <select
                v-model="formData.team2Id"
                class="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                :disabled="loading"
              >
                <option :value="null" disabled>Team 2...</option>
                <option
                  v-for="team in availableTeamsForTeam2"
                  :key="team.id"
                  :value="team.id"
                >
                  {{ team.name }} ({{ team.players.length }})
                </option>
              </select>
            </div>
          </div>

          <!-- Map Names -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Maps <span class="text-red-400">*</span>
            </label>
            <div class="space-y-3">
              <div
                v-for="(_map, index) in formData.maps"
                :key="index"
                class="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3"
              >
                <!-- Map Name Row -->
                <div class="flex items-center gap-2 mb-2">
                  <div class="flex-shrink-0 w-6 text-center text-slate-500 text-sm font-mono">
                    {{ index + 1 }}
                  </div>
                  <input
                    v-model="formData.maps[index].name"
                    type="text"
                    placeholder="e.g., Wake Island, El Alamein"
                    class="flex-1 px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    :disabled="loading"
                  >
                  <button
                    type="button"
                    class="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all"
                    @click="openImageSelector(index)"
                    :disabled="loading"
                    :title="formData.maps[index].imagePath ? 'Change map image' : 'Select map image'"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    v-if="formData.maps.length > 1"
                    type="button"
                    class="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all"
                    @click="removeMap(index)"
                    :disabled="loading"
                    title="Remove map"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Image Preview Row -->
                <div v-if="formData.maps[index].imagePath" class="flex items-center gap-2 ml-8 mb-2">
                  <span class="text-xs text-slate-400 flex-shrink-0">Image:</span>
                  <div class="flex items-center gap-2 flex-1">
                    <div class="flex-1 px-3 py-1.5 bg-slate-700/30 border border-slate-600 rounded-lg text-xs text-slate-300 truncate">
                      {{ formData.maps[index].imagePath }}
                    </div>
                    <button
                      type="button"
                      class="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
                      @click="clearMapImage(index)"
                      :disabled="loading"
                      title="Clear image"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Team Selection Row -->
                <div v-if="formData.team1Id && formData.team2Id" class="flex items-center gap-2 ml-8">
                  <span class="text-xs text-slate-400 flex-shrink-0">Selected by:</span>
                  <div class="flex items-center gap-2 flex-1">
                    <button
                      v-for="team in props.teams.filter(t => t.id === formData.team1Id || t.id === formData.team2Id)"
                      :key="team.id"
                      @click="formData.maps[index].teamId = formData.maps[index].teamId === team.id ? null : team.id"
                      :disabled="loading"
                      :class="[
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                        formData.maps[index].teamId === team.id
                          ? 'bg-cyan-600 border-cyan-500 text-white'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50'
                      ]"
                    >
                      {{ team.name }}
                    </button>
                  </div>
                </div>

              </div>
              <button
                class="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                @click="addMap"
                :disabled="loading"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Map</span>
              </button>
            </div>
          </div>

          <!-- Server Details -->
          <div class="space-y-3 bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
            <div>
              <h3 class="text-sm font-medium text-slate-300">Server (Optional)</h3>
              <p class="text-xs text-slate-500 mt-1">
                Search for an existing server or enter a name manually if it doesn't exist yet.
              </p>
            </div>

            <!-- Server Search/Input -->
            <div class="relative">
              <input
                v-model="serverSearchQuery"
                type="text"
                placeholder="Search or enter server name..."
                class="w-full px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                :disabled="loading"
                @input="onServerSearchInput"
                @focus="onServerSearchFocus"
                @blur="onServerSearchBlur"
              >

              <!-- Server Suggestions Dropdown -->
              <div
                v-if="showServerDropdown && serverSuggestions.length > 0"
                class="absolute top-full mt-2 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-48 overflow-y-auto shadow-2xl z-50"
              >
                <div
                  v-for="server in serverSuggestions"
                  :key="server.serverGuid"
                  class="p-3 border-b border-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all last:border-b-0"
                  @mousedown.prevent="selectServer(server)"
                >
                  <div class="font-medium text-slate-200 text-sm">
                    {{ server.serverName }}
                  </div>
                  <div class="text-xs text-slate-400 mt-1">
                    {{ server.serverIp }}:{{ server.serverPort }}
                  </div>
                </div>
              </div>

              <!-- Selected Server Indicator -->
              <div v-if="formData.serverGuid" class="absolute right-3 top-1/2 -translate-y-1/2">
                <div class="flex items-center gap-1 text-xs text-green-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Linked</span>
                </div>
              </div>
            </div>

            <p class="text-xs text-slate-500">
              {{ formData.serverGuid ? 'Server found and linked. Edit to search again.' : 'No server linked - name only will be saved.' }}
            </p>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6">
        <!-- Validation Messages -->
        <div v-if="!isFormValid && !loading" class="mb-4 space-y-1">
          <p v-if="!formData.scheduledDate" class="text-xs text-amber-400 flex items-center gap-1">
            <span>⚠</span>
            <span>Please select a scheduled date and time</span>
          </p>
          <p v-if="formData.team1Id === null" class="text-xs text-amber-400 flex items-center gap-1">
            <span>⚠</span>
            <span>Please select Team 1</span>
          </p>
          <p v-if="formData.team2Id === null" class="text-xs text-amber-400 flex items-center gap-1">
            <span>⚠</span>
            <span>Please select Team 2</span>
          </p>
          <p v-if="formData.team1Id !== null && formData.team2Id !== null && formData.team1Id === formData.team2Id" class="text-xs text-amber-400 flex items-center gap-1">
            <span>⚠</span>
            <span>Team 1 and Team 2 must be different</span>
          </p>
          <p v-if="formData.maps.length === 0" class="text-xs text-amber-400 flex items-center gap-1">
            <span>⚠</span>
            <span>Please add at least one map</span>
          </p>
          <p v-if="formData.maps.length > 0 && !formData.maps.every(map => map.name.trim().length > 0)" class="text-xs text-amber-400 flex items-center gap-1">
            <span>⚠</span>
            <span>All map names must be filled in (or remove empty maps)</span>
          </p>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="$emit('close')"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSubmit"
            :disabled="loading || !isFormValid"
            :title="!isFormValid ? 'Please fill in all required fields' : ''"
          >
            <div v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{{ editMode ? 'Update Match' : 'Schedule Match' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Map Image Selector Modal -->
  <MapImageSelectorModal
    v-if="showImageSelector"
    :tournament-id="tournamentId"
    :initial-folder="currentMapImageFolder"
    @close="showImageSelector = false"
    @image-selected="onImageSelected"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { adminTournamentService, type TournamentTeam, type TournamentMatch, type TournamentDetail } from '@/services/adminTournamentService';
import MapImageSelectorModal from './MapImageSelectorModal.vue';

interface Props {
  tournamentId: number;
  teams: TournamentTeam[];
  tournament: TournamentDetail;
  match?: TournamentMatch;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  added: [];
}>();

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  gameType: string;
}

const editMode = ref(!!props.match);
const loading = ref(false);
const error = ref<string | null>(null);
const serverSearchQuery = ref('');
const serverSuggestions = ref<ServerSearchResult[]>([]);
const showServerDropdown = ref(false);
const isServerSearching = ref(false);
const showImageSelector = ref(false);
const selectedMapIndex = ref<number | null>(null);

let serverSearchTimeout: number | null = null;
let blurTimeout: number | null = null;

interface MapEntry {
  name: string;
  teamId?: number | null;
  imagePath?: string | null;
}

const formData = ref({
  scheduledDate: '',
  team1Id: null as number | null,
  team2Id: null as number | null,
  maps: [{ name: '' }] as MapEntry[],
  serverGuid: '',
  serverName: '',
  week: null as string | null,
});

const availableTeamsForTeam1 = computed(() => {
  return props.teams;
});

const availableTeamsForTeam2 = computed(() => {
  // Exclude team 1 from team 2 options
  return props.teams.filter(team => team.id !== formData.value.team1Id);
});

const availableWeeks = computed(() => {
  // Extract week names from tournament weekDates
  if (!props.tournament?.weekDates || props.tournament.weekDates.length === 0) {
    return [];
  }
  return props.tournament.weekDates.map(wd => wd.week).sort();
});

const currentMapImageFolder = computed(() => {
  if (selectedMapIndex.value === null) return undefined;
  return getFolderFromImagePath(formData.value.maps[selectedMapIndex.value].imagePath);
});

const isFormValid = computed(() => {
  return (
    formData.value.scheduledDate &&
    formData.value.team1Id !== null &&
    formData.value.team2Id !== null &&
    formData.value.team1Id !== formData.value.team2Id &&
    formData.value.maps.length > 0 &&
    formData.value.maps.every(map => map.name.trim().length > 0)
  );
});

const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    serverSuggestions.value = [];
    showServerDropdown.value = false;
    return;
  }

  isServerSearching.value = true;

  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search servers');
    }

    const data = await response.json();
    serverSuggestions.value = data.items || [];
    showServerDropdown.value = (data.items?.length || 0) > 0 || query.length >= 2;
  } catch (error) {
    console.error('Error searching servers:', error);
    serverSuggestions.value = [];
    showServerDropdown.value = false;
  } finally {
    isServerSearching.value = false;
  }
};

const onServerSearchInput = () => {
  // Clear GUID when user types (they might be entering a new server name)
  if (formData.value.serverGuid) {
    formData.value.serverGuid = '';
  }

  if (serverSearchTimeout) {
    clearTimeout(serverSearchTimeout);
  }

  serverSearchTimeout = setTimeout(() => {
    searchServers(serverSearchQuery.value);
  }, 300) as unknown as number;
};

const onServerSearchFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
  if (serverSearchQuery.value.length >= 2) {
    searchServers(serverSearchQuery.value);
  }
};

const onServerSearchBlur = () => {
  blurTimeout = setTimeout(() => {
    showServerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectServer = (server: ServerSearchResult) => {
  serverSearchQuery.value = server.serverName;
  formData.value.serverGuid = server.serverGuid;
  formData.value.serverName = server.serverName;
  serverSuggestions.value = [];
  showServerDropdown.value = false;
};

const addMap = () => {
  formData.value.maps.push({ name: '' });
};

const removeMap = (index: number) => {
  formData.value.maps.splice(index, 1);
};

const openImageSelector = (mapIndex: number) => {
  selectedMapIndex.value = mapIndex;
  showImageSelector.value = true;
};

// Helper to extract folder path from image path
const getFolderFromImagePath = (imagePath: string | null | undefined): string | undefined => {
  if (!imagePath) return undefined;
  // Extract directory by removing the filename
  const parts = imagePath.split('/');
  if (parts.length <= 1) return undefined;
  // Remove the last part (filename) and rejoin
  return parts.slice(0, -1).join('/');
};

const onImageSelected = (imagePath: string) => {
  if (selectedMapIndex.value !== null) {
    formData.value.maps[selectedMapIndex.value].imagePath = imagePath;
  }
};

const clearMapImage = (mapIndex: number) => {
  formData.value.maps[mapIndex].imagePath = null;
};

onMounted(() => {
  if (props.match) {
    // Convert ISO date to datetime-local format
    const date = new Date(props.match.scheduledDate);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    formData.value.scheduledDate = localDate.toISOString().slice(0, 16);

    // Find team IDs from team names
    const team1 = props.teams.find(t => t.name === props.match!.team1Name);
    const team2 = props.teams.find(t => t.name === props.match!.team2Name);

    formData.value.team1Id = team1?.id || null;
    formData.value.team2Id = team2?.id || null;
    // Extract maps
    formData.value.maps = props.match.maps.map(m => ({
      name: m.mapName,
      teamId: m.teamId || null,
      imagePath: (m as any).imagePath || null
    }));
    formData.value.serverGuid = props.match.serverGuid || '';
    formData.value.serverName = props.match.serverName || '';
    formData.value.week = props.match.week || null;
    serverSearchQuery.value = props.match.serverName || '';
  } else {
    // Set default date to now
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    formData.value.scheduledDate = localDate.toISOString().slice(0, 16);
  }
});

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Use serverSearchQuery as the server name (could be typed manually or selected)
    const serverName = serverSearchQuery.value.trim() || formData.value.serverName.trim();

    // Both create and update now use the same payload structure
    const weekValue = formData.value.week ? formData.value.week.trim() : null;
    const requestData = {
      scheduledDate: new Date(formData.value.scheduledDate).toISOString(),
      team1Id: formData.value.team1Id!,
      team2Id: formData.value.team2Id!,
      maps: formData.value.maps
        .filter(map => map.name.trim().length > 0)
        .map(map => ({
          mapName: map.name.trim(),
          ...(map.teamId && { teamId: map.teamId }),
          ...(map.imagePath && { imagePath: map.imagePath })
        })),
      serverGuid: formData.value.serverGuid.trim() || undefined,
      serverName: serverName || undefined,
      week: weekValue && weekValue.length > 0 ? weekValue : null,
    };

    if (editMode.value && props.match) {
      console.log('Updating match with data:', requestData);
      await adminTournamentService.updateMatch(props.tournamentId, props.match.id, requestData);
    } else {
      console.log('Creating match with data:', requestData);
      await adminTournamentService.createMatch(props.tournamentId, requestData);
    }

    emit('added');
    emit('close');
  } catch (err) {
    console.error('Error saving match:', err);
    // Handle different error types
    if (err instanceof Error) {
      error.value = err.message;
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      error.value = String((err as any).message);
    } else {
      error.value = 'Failed to save match. Please check the console for details.';
    }
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

