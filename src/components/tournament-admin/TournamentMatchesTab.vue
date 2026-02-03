<template>
  <div class="tournament-matches-tab">
    <!-- Results Form View -->
    <TournamentResultsForm
      v-if="showResultsView && editingMatchForResultsView"
      :tournament="tournament"
      :match="editingMatchForResultsView"
      @close="closeResultsView"
      @updated="onRefresh"
    />

    <!-- Add/Edit Match View -->
    <div v-else-if="showForm" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ {{ editingMatch ? 'EDIT MATCH' : 'SCHEDULE MATCH' }} ]</h2>
          <p class="portal-card-subtitle">
            {{ editingMatch ? 'Update match details' : 'Schedule a new match in the tournament calendar' }}
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

        <!-- No Teams Warning -->
        <div v-if="tournament.teams.length < 2" class="portal-form-error" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3);">
          <p style="color: #fbbf24;">You need at least 2 teams to schedule a match.</p>
        </div>

        <template v-else>
          <!-- Date & Week Row -->
          <div class="portal-form-row">
            <div class="portal-form-section portal-form-section--half">
              <label class="portal-form-label portal-form-label--required">Scheduled Date & Time</label>
              <input
                v-model="formData.scheduledDate"
                type="datetime-local"
                class="portal-form-input portal-form-input--mono"
                :disabled="formLoading"
              >
            </div>
            <div class="portal-form-section portal-form-section--half">
              <label class="portal-form-label">Week</label>
              <select
                v-model="formData.week"
                class="portal-form-input"
                :disabled="formLoading || availableWeeksForForm.length === 0"
              >
                <option :value="null">No Week (Unscheduled)</option>
                <option v-for="week in availableWeeksForForm" :key="week" :value="week">
                  {{ week }}
                </option>
              </select>
              <p class="portal-form-hint">{{ availableWeeksForForm.length === 0 ? 'No week dates defined' : 'Optional: assign to a week' }}</p>
            </div>
          </div>

          <!-- Teams Section -->
          <div class="portal-form-section">
            <label class="portal-form-label portal-form-label--required">Match Teams</label>
            <div class="teams-selector">
              <select
                v-model="formData.team1Id"
                class="portal-form-input"
                :disabled="formLoading"
              >
                <option :value="null" disabled>Team 1...</option>
                <option
                  v-for="team in tournament.teams"
                  :key="team.id"
                  :value="team.id"
                >
                  {{ team.name }} ({{ team.players.length }})
                </option>
              </select>
              <span class="vs-divider">VS</span>
              <select
                v-model="formData.team2Id"
                class="portal-form-input"
                :disabled="formLoading"
              >
                <option :value="null" disabled>Team 2...</option>
                <option
                  v-for="team in tournament.teams.filter(t => t.id !== formData.team1Id)"
                  :key="team.id"
                  :value="team.id"
                >
                  {{ team.name }} ({{ team.players.length }})
                </option>
              </select>
            </div>
          </div>

          <!-- Maps Section -->
          <div class="portal-form-section">
            <label class="portal-form-label portal-form-label--required">Maps</label>
            <div class="maps-list">
              <div v-for="(_map, index) in formData.maps" :key="index" class="map-entry">
                <span class="map-number">{{ index + 1 }}.</span>
                <input
                  v-model="formData.maps[index].name"
                  type="text"
                  placeholder="e.g., Wake Island, El Alamein"
                  class="portal-form-input"
                  :disabled="formLoading"
                >
                <button
                  v-if="formData.maps.length > 1"
                  type="button"
                  class="portal-icon-btn portal-icon-btn--danger"
                  @click="removeMap(index)"
                  :disabled="formLoading"
                  title="Remove map"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                class="portal-btn portal-btn--ghost portal-btn--sm"
                @click="addMap"
                :disabled="formLoading"
              >
                + Add Map
              </button>
            </div>
          </div>

          <!-- Server Section -->
          <div class="portal-form-section">
            <label class="portal-form-label">Server (Optional)</label>
            <div class="server-search">
              <input
                v-model="serverSearchQuery"
                type="text"
                placeholder="Search or enter server name..."
                class="portal-form-input"
                :disabled="formLoading"
                @input="onServerSearchInput"
                @focus="onServerSearchFocus"
                @blur="onServerSearchBlur"
              >
              <div v-if="formData.serverGuid" class="server-linked">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Linked
              </div>
            </div>
            <!-- Server Suggestions -->
            <div v-if="showServerDropdown && serverSuggestions.length > 0" class="server-suggestions">
              <div
                v-for="server in serverSuggestions"
                :key="server.serverGuid"
                class="server-suggestion"
                @mousedown.prevent="selectServer(server)"
              >
                <div class="server-name">{{ server.serverName }}</div>
                <div class="server-ip">{{ server.serverIp }}:{{ server.serverPort }}</div>
              </div>
            </div>
            <p class="portal-form-hint">{{ formData.serverGuid ? 'Server found and linked' : 'No server linked - name only will be saved' }}</p>
          </div>
        </template>

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
            :disabled="formLoading || !isFormValid"
            @click="submitForm"
          >
            <span v-if="formLoading" class="portal-btn-pulse">Saving...</span>
            <span v-else>{{ editingMatch ? 'Update Match' : 'Schedule Match' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Matches List View -->
    <div v-else-if="!showResultsView" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ MATCHES ]</h2>
          <p class="portal-card-subtitle">Schedule and track matches between teams</p>
        </div>
        <div class="header-actions">
          <button
            class="portal-btn portal-btn--ghost"
            @click="openRecalculateModal"
            title="Refresh tournament rankings"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rankings
          </button>
          <button
            class="portal-btn portal-btn--primary"
            @click="openAddForm"
            :disabled="tournament.teams.length < 2"
            :title="tournament.teams.length < 2 ? 'Create at least 2 teams first' : ''"
          >
            + Schedule Match
          </button>
        </div>
      </div>

      <div class="portal-card-body" style="padding: 0">
        <!-- Matches Table -->
        <div v-if="matchesByWeekGroups.length > 0" class="portal-table-wrap">
          <table class="portal-table matches-table">
            <tbody>
              <!-- Week groups with matches -->
              <template v-for="weekGroup in matchesByWeekGroups" :key="weekGroup.week || 'no-week'">
                <!-- Week Header Row -->
                <tr v-if="!weekGroup.hideWeekHeader" class="week-header-row">
                  <td colspan="5" class="week-header-cell">
                    <div class="week-header-content">
                      <div class="week-header-info">
                        <span class="week-name">{{ weekGroup.week }}</span>
                        <span class="week-dates">{{ getWeekDateRange(weekGroup.week, weekGroup.matches) }}</span>
                      </div>
                      <button
                        class="portal-btn portal-btn--sm portal-btn--ghost"
                        @click="openAddForm"
                        :disabled="tournament.teams.length < 2"
                        :title="tournament.teams.length < 2 ? 'Create at least 2 teams first' : ''"
                      >
                        + Match
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Match rows -->
                <tr v-for="match in weekGroup.matches" :key="match.id" class="match-row">
                  <!-- Date -->
                  <td class="match-date">
                    <span class="portal-mono">{{ formatMatchDate(match.scheduledDate) }}</span>
                  </td>

                  <!-- Team Matchup -->
                  <td class="match-teams">
                    <div class="team-matchup">
                      <span class="team-name">{{ match.team1Name }}</span>
                      <span class="vs-label">VS</span>
                      <span class="team-name">{{ match.team2Name }}</span>
                    </div>
                    <div v-if="match.serverName" class="match-server">
                      🖥️ {{ match.serverName }}
                    </div>
                  </td>

                  <!-- Maps Summary -->
                  <td class="match-maps">
                    <div v-for="map in (match.maps || []).filter((m: any) => m)" :key="map.id" class="map-row">
                      <span class="map-order portal-mono">{{ map.mapOrder + 1 }}.</span>
                      <span class="map-name">{{ map.mapName }}</span>
                      <span v-if="map.matchResults?.length > 0" class="map-result">
                        {{ getResultsAggregation(map) }}
                      </span>
                      <span v-else class="map-result map-result--empty">—</span>
                    </div>
                  </td>

                  <!-- Results Count -->
                  <td class="match-status">
                    <div v-if="(match.maps || []).length > 0">
                      <div v-for="map in (match.maps || []).filter((m: any) => m)" :key="`status-${map.id}`" class="status-row">
                        <span v-if="!map.matchResults?.length" class="status-empty">No results</span>
                        <span v-else class="status-complete">
                          {{ map.matchResults.length }} round<span v-if="map.matchResults.length !== 1">s</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="match-actions">
                    <div class="portal-table-actions">
                      <button
                        class="portal-cell-btn"
                        @click="openResultsView(match)"
                        title="Enter match results for all maps"
                      >
                        Results
                      </button>
                      <button
                        class="portal-icon-btn"
                        @click="openMatchFilesAndCommentsModal(match)"
                        title="Add files and comments"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        class="portal-icon-btn"
                        @click="editMatch(match.id)"
                        title="Edit match"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        class="portal-icon-btn portal-icon-btn--danger"
                        @click="confirmDeleteMatch(match.id)"
                        title="Delete match"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="portal-empty">
          <div class="portal-empty-icon">📅</div>
          <h3 class="portal-empty-title">No Matches Scheduled</h3>
          <p class="portal-empty-desc">
            {{ tournament.teams.length < 2 ? 'Create at least 2 teams before scheduling matches' : 'Schedule matches to organize your tournament calendar' }}
          </p>
          <button
            v-if="tournament.teams.length >= 2"
            class="portal-btn portal-btn--primary"
            style="margin-top: 1rem"
            @click="openAddForm"
          >
            Schedule First Match
          </button>
        </div>
      </div>
    </div>

    <!-- Match Files and Comments Modal -->
    <MatchFilesAndCommentsModal
      v-if="showMatchFilesAndCommentsModal && editingMatchForFilesAndComments"
      :tournament-id="tournament.id"
      :match="editingMatchForFilesAndComments"
      @close="showMatchFilesAndCommentsModal = false; editingMatchForFilesAndComments = null"
      @saved="onRefresh"
    />

    <!-- Delete Match Confirmation Modal -->
    <div
      v-if="deleteMatchConfirmation"
      class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
      @click.self="cancelDeleteMatch"
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
              Delete Match?
            </h3>
            <p class="portal-modal-text">
              Delete this scheduled match?
            </p>
            <p class="portal-modal-hint">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="portal-btn portal-btn--ghost"
            @click="cancelDeleteMatch"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--danger flex items-center gap-2"
            :disabled="isDeleting"
            @click="executeDeleteMatch"
          >
            <svg v-if="!isDeleting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete Match' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Recalculate Leaderboard Modal -->
    <div
      v-if="showRecalculateModal"
      class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
      @click.self="closeRecalculateModal"
    >
      <div class="portal-modal portal-modal--large">
        <div class="flex items-start gap-4 mb-6">
          <div class="portal-modal-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="portal-modal-title">
              Recalculate Leaderboard
            </h3>
            <p class="portal-modal-text">
              Choose how you want to recalculate tournament rankings
            </p>
          </div>
        </div>

        <!-- Option 1: Recalculate Everything -->
        <div class="mb-4 p-3 portal-card cursor-pointer" @click="recalculationMode = 'everything'">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              v-model="recalculationMode"
              value="everything"
              class="mt-1"
            >
            <div>
              <div class="font-medium" style="color: var(--portal-text-bright);">Recalculate Everything</div>
              <div class="portal-modal-hint mt-1">Recalculates all weeks and cumulative leaderboard</div>
            </div>
          </label>
        </div>

        <!-- Option 2: Fix a Specific Week (only show if multiple weeks) -->
        <div v-if="hasMultipleWeeks" class="mb-4 p-3 portal-card cursor-pointer" @click="recalculationMode = 'specific-week'">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              v-model="recalculationMode"
              value="specific-week"
              class="mt-1"
            >
            <div class="flex-1">
              <div class="font-medium" style="color: var(--portal-text-bright);">Fix a Specific Week</div>
              <div class="portal-modal-hint mt-1">Recalculate only that week</div>
              <select
                v-if="recalculationMode === 'specific-week'"
                v-model="selectedWeek"
                class="mt-2 portal-input"
              >
                <option :value="null">Select a week...</option>
                <option v-for="week in availableWeeks" :key="week" :value="week">
                  {{ week }}
                </option>
              </select>
            </div>
          </label>
        </div>

        <!-- Option 3: Recalculate From Week Onwards (only show if multiple weeks) -->
        <div v-if="hasMultipleWeeks" class="mb-6 p-3 portal-card cursor-pointer" @click="recalculationMode = 'from-week'">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              v-model="recalculationMode"
              value="from-week"
              class="mt-1"
            >
            <div class="flex-1">
              <div class="font-medium" style="color: var(--portal-text-bright);">Recalculate From Week Onwards</div>
              <div class="portal-modal-hint mt-1">Recalculate from selected week through cumulative</div>
              <select
                v-if="recalculationMode === 'from-week'"
                v-model="fromWeek"
                class="mt-2 portal-input"
              >
                <option :value="null">Select starting week...</option>
                <option v-for="week in availableWeeks" :key="week" :value="week">
                  {{ week }}
                </option>
              </select>
            </div>
          </label>
        </div>

        <!-- Message Display -->
        <div v-if="recalculationMessage" class="mb-6 p-3" :class="recalculationMessage.type === 'success' ? 'portal-card' : 'portal-card'" :style="recalculationMessage.type === 'success' ? 'background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: rgb(167, 243, 208);' : 'background: var(--portal-danger-glow); border-color: rgba(239, 68, 68, 0.3); color: var(--portal-danger);'">
          {{ recalculationMessage.text }}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3">
          <button
            class="portal-btn portal-btn--ghost"
            @click="closeRecalculateModal"
            :disabled="isRecalculating"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--primary flex items-center gap-2"
            :disabled="isRecalculating || (recalculationMode === 'specific-week' && !selectedWeek) || (recalculationMode === 'from-week' && !fromWeek)"
            @click="recalculateLeaderboard"
          >
            <svg v-if="!isRecalculating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isRecalculating ? 'Recalculating...' : 'Recalculate' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  adminTournamentService,
  type TournamentDetail,
  type TournamentMatch,
  type TournamentMatchMap
} from '@/services/adminTournamentService';
import TournamentResultsForm from './TournamentResultsForm.vue';
import MatchFilesAndCommentsModal from '@/components/dashboard/MatchFilesAndCommentsModal.vue';

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  gameType: string;
}

interface MapEntry {
  name: string;
}

const props = defineProps<{
  tournament: TournamentDetail;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const route = useRoute();
const router = useRouter();

// Form state
const showForm = ref(false);
const editingMatch = ref<TournamentMatch | undefined>(undefined);
const formLoading = ref(false);
const formError = ref<string | null>(null);

const formData = ref({
  scheduledDate: '',
  week: null as string | null,
  team1Id: null as number | null,
  team2Id: null as number | null,
  maps: [{ name: '' }] as MapEntry[],
  serverGuid: '',
  serverName: ''
});

// Server search state
const serverSearchQuery = ref('');
const serverSuggestions = ref<ServerSearchResult[]>([]);
const showServerDropdown = ref(false);
let serverSearchTimeout: number | null = null;
let blurTimeout: number | null = null;

// Results form view state - derived from route params
const editingMatchForResultsView = ref<TournamentMatch | null>(null);

const showResultsView = computed(() => {
  return !!route.query.matchId;
});

// Other modal states
const showMatchFilesAndCommentsModal = ref(false);
const editingMatchForFilesAndComments = ref<TournamentMatch | null>(null);
const deleteMatchConfirmation = ref<{ id: number } | null>(null);
const isDeleting = ref(false);

// Recalculate modal states
const showRecalculateModal = ref(false);
const recalculationMode = ref<'everything' | 'specific-week' | 'from-week'>('everything');
const selectedWeek = ref<string | null>(null);
const fromWeek = ref<string | null>(null);
const isRecalculating = ref(false);
const recalculationMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

// Computed properties
const matchesByWeekGroups = computed(() => {
  if (!props.tournament) return [];

  // Use matchesByWeek if available
  if (props.tournament.matchesByWeek && props.tournament.matchesByWeek.length > 0) {
    const hasOnlyOneNullWeek = props.tournament.matchesByWeek.length === 1 && props.tournament.matchesByWeek[0].week === null;

    return props.tournament.matchesByWeek.map(group => ({
      week: group.week,
      hideWeekHeader: hasOnlyOneNullWeek,
      matches: [...group.matches].sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      })
    }));
  }

  // Fallback: group by week field
  const groups: Map<string | null, typeof props.tournament.matches> = new Map();

  props.tournament.matches.forEach(match => {
    const week = match.week ?? null;
    if (!groups.has(week)) {
      groups.set(week, []);
    }
    groups.get(week)!.push(match);
  });

  const hasOnlyOneNullWeek = groups.size === 1 && groups.has(null);

  return Array.from(groups.entries())
    .map(([week, matches]) => ({
      week,
      hideWeekHeader: hasOnlyOneNullWeek,
      matches: [...matches].sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      })
    }))
    .sort((a, b) => {
      if (a.week === null) return 1;
      if (b.week === null) return -1;
      return (a.week || '').localeCompare(b.week || '');
    });
});

const availableWeeks = computed(() => {
  return matchesByWeekGroups.value
    .filter(group => group.week !== null)
    .map(group => group.week as string);
});

const hasMultipleWeeks = computed(() => {
  return availableWeeks.value.length > 1;
});

// Watch for route changes to load the selected match
watch(() => route.query.matchId, async (matchId) => {
  if (matchId) {
    try {
      const freshMatch = await adminTournamentService.getMatchDetail(props.tournament.id, Number(matchId));
      editingMatchForResultsView.value = freshMatch;
    } catch (err) {
      console.error('Error loading match details:', err);
      editingMatchForResultsView.value = null;
    }
  } else {
    editingMatchForResultsView.value = null;
  }
}, { immediate: true });

// Form computed properties
const availableWeeksForForm = computed(() => {
  if (!props.tournament?.weekDates || props.tournament.weekDates.length === 0) {
    return [];
  }
  return props.tournament.weekDates.map(wd => wd.week).sort();
});

const isFormValid = computed(() => {
  return (
    formData.value.scheduledDate.length > 0 &&
    formData.value.team1Id !== null &&
    formData.value.team2Id !== null &&
    formData.value.team1Id !== formData.value.team2Id &&
    formData.value.maps.length > 0 &&
    formData.value.maps.every(map => map.name.trim().length > 0)
  );
});

// Formatting
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

const getWeekDateRange = (week: string | null, matches?: TournamentMatch[]): string => {
  if (props.tournament?.weekDates && week) {
    const weekDate = props.tournament.weekDates.find(w => w.week === week);
    if (weekDate) {
      const formatDateRange = (date: Date) => {
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
      };
      const startDate = new Date(weekDate.startDate);
      const endDate = new Date(weekDate.endDate);
      return `${formatDateRange(startDate)} - ${formatDateRange(endDate)}`;
    }
  }

  if (!matches || matches.length === 0) return '';

  const dates = matches.map(m => new Date(m.scheduledDate));
  if (dates.length === 0) return '';

  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const formatDateRange = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return `${formatDateRange(earliestDate)} - ${formatDateRange(latestDate)}`;
};

const getResultsAggregation = (map: TournamentMatchMap): string => {
  const results = map.matchResults;
  if (!results || results.length === 0) return '—';

  const team1Id = results[0]?.team1Id;
  const team2Id = results[0]?.team2Id;
  if (!team1Id || !team2Id) return '—';

  const team1Wins = results.filter((r) => r.winningTeamId === team1Id).length;
  const team2Wins = results.filter((r) => r.winningTeamId === team2Id).length;
  const draws = results.filter((r) => r.winningTeamId !== team1Id && r.winningTeamId !== team2Id).length;

  if (draws > 0) {
    return `${team1Wins}-${team2Wins}-${draws}`;
  }
  return `${team1Wins}-${team2Wins}`;
};

// Helper functions
const roundToNextCleanTime = (date: Date): Date => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  if (minutes < 30) {
    rounded.setMinutes(30, 0, 0);
  } else {
    rounded.setHours(rounded.getHours() + 1);
    rounded.setMinutes(0, 0, 0);
  }
  return rounded;
};

const dateToDatetimeLocal = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

// Form handlers
const openAddForm = () => {
  editingMatch.value = undefined;
  const now = new Date();
  const rounded = roundToNextCleanTime(now);
  formData.value = {
    scheduledDate: dateToDatetimeLocal(rounded),
    week: null,
    team1Id: null,
    team2Id: null,
    maps: [{ name: '' }],
    serverGuid: '',
    serverName: ''
  };
  serverSearchQuery.value = '';
  formError.value = null;
  showForm.value = true;
};

const editMatch = async (matchId: number) => {
  try {
    const match = await adminTournamentService.getMatchDetail(props.tournament.id, matchId);
    editingMatch.value = match;

    const team1 = props.tournament.teams.find(t => t.name === match.team1Name);
    const team2 = props.tournament.teams.find(t => t.name === match.team2Name);

    formData.value = {
      scheduledDate: dateToDatetimeLocal(new Date(match.scheduledDate)),
      week: match.week || null,
      team1Id: team1?.id || null,
      team2Id: team2?.id || null,
      maps: match.maps.map(m => ({ name: m.mapName })),
      serverGuid: match.serverGuid || '',
      serverName: match.serverName || ''
    };
    serverSearchQuery.value = match.serverName || '';
    formError.value = null;
    showForm.value = true;
  } catch (err) {
    console.error('Error loading match details:', err);
  }
};

const closeForm = () => {
  showForm.value = false;
  editingMatch.value = undefined;
  formError.value = null;
};

const addMap = () => {
  formData.value.maps.push({ name: '' });
};

const removeMap = (index: number) => {
  formData.value.maps.splice(index, 1);
};

// Server search functions
const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    serverSuggestions.value = [];
    showServerDropdown.value = false;
    return;
  }

  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) throw new Error('Failed to search servers');
    const data = await response.json();
    serverSuggestions.value = data.items || [];
    showServerDropdown.value = (data.items?.length || 0) > 0;
  } catch (error) {
    console.error('Error searching servers:', error);
    serverSuggestions.value = [];
    showServerDropdown.value = false;
  }
};

const onServerSearchInput = () => {
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

const submitForm = async () => {
  if (!isFormValid.value) return;

  formLoading.value = true;
  formError.value = null;

  try {
    const serverName = serverSearchQuery.value.trim() || formData.value.serverName.trim();
    const weekValue = formData.value.week ? formData.value.week.trim() : null;
    const scheduledDate = new Date(formData.value.scheduledDate);

    const requestData = {
      scheduledDate: scheduledDate.toISOString(),
      team1Id: formData.value.team1Id!,
      team2Id: formData.value.team2Id!,
      maps: formData.value.maps
        .filter(map => map.name.trim().length > 0)
        .map(map => ({ mapName: map.name.trim() })),
      serverGuid: formData.value.serverGuid.trim() || undefined,
      serverName: serverName || undefined,
      week: weekValue && weekValue.length > 0 ? weekValue : null,
    };

    if (editingMatch.value) {
      await adminTournamentService.updateMatch(props.tournament.id, editingMatch.value.id, requestData);
    } else {
      await adminTournamentService.createMatch(props.tournament.id, requestData);
    }

    closeForm();
    emit('refresh');
  } catch (err) {
    console.error('Error saving match:', err);
    formError.value = err instanceof Error ? err.message : 'Failed to save match';
  } finally {
    formLoading.value = false;
  }
};

const openResultsView = (match: TournamentMatch) => {
  router.push({
    query: {
      ...route.query,
      matchId: match.id.toString()
    }
  });
};

const closeResultsView = () => {
  router.push({
    query: {
      ...route.query,
      matchId: undefined,
      resultId: undefined
    }
  });
};

const openMatchFilesAndCommentsModal = (match: TournamentMatch) => {
  editingMatchForFilesAndComments.value = match;
  showMatchFilesAndCommentsModal.value = true;
};

const confirmDeleteMatch = (matchId: number) => {
  deleteMatchConfirmation.value = { id: matchId };
};

const cancelDeleteMatch = () => {
  deleteMatchConfirmation.value = null;
  isDeleting.value = false;
};

const executeDeleteMatch = async () => {
  if (!deleteMatchConfirmation.value) return;

  isDeleting.value = true;
  try {
    await adminTournamentService.deleteMatch(props.tournament.id, deleteMatchConfirmation.value.id);
    deleteMatchConfirmation.value = null;
    emit('refresh');
  } catch (err) {
    console.error('Error deleting match:', err);
  } finally {
    isDeleting.value = false;
  }
};

const onRefresh = () => {
  emit('refresh');
};

// Recalculate modal
const openRecalculateModal = () => {
  recalculationMode.value = 'everything';
  selectedWeek.value = null;
  fromWeek.value = null;
  recalculationMessage.value = null;
  showRecalculateModal.value = true;
};

const closeRecalculateModal = () => {
  showRecalculateModal.value = false;
  recalculationMessage.value = null;
};

const recalculateLeaderboard = async () => {
  isRecalculating.value = true;
  recalculationMessage.value = null;

  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const payload: Record<string, string> = {};
    if (recalculationMode.value === 'specific-week' && selectedWeek.value) {
      payload.week = selectedWeek.value;
    } else if (recalculationMode.value === 'from-week' && fromWeek.value) {
      payload.fromWeek = fromWeek.value;
    }

    const response = await fetch(`/stats/admin/tournaments/${props.tournament.id}/leaderboard/recalculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to recalculate leaderboard');
    }

    recalculationMessage.value = {
      type: 'success',
      text: 'Leaderboard recalculated successfully'
    };

    setTimeout(() => {
      closeRecalculateModal();
    }, 2000);
  } catch (err) {
    console.error('Error recalculating leaderboard:', err);
    recalculationMessage.value = {
      type: 'error',
      text: err instanceof Error ? err.message : 'Failed to recalculate leaderboard'
    };
  } finally {
    isRecalculating.value = false;
  }
};

// Expose load method for parent to trigger refresh
const load = () => {
  // Matches data comes from parent, nothing to load here
};

defineExpose({ load });
</script>

<style scoped>
.portal-card-subtitle {
  font-size: 0.75rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.matches-table {
  width: 100%;
}

.week-header-row {
  background: rgba(0, 229, 160, 0.08);
}

.week-header-cell {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 229, 160, 0.2);
}

.week-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.week-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.week-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--portal-accent);
  letter-spacing: 0.05em;
}

.week-dates {
  font-size: 0.75rem;
  color: var(--portal-text);
}

.match-row td {
  padding: 0.75rem 1rem;
  vertical-align: top;
}

.match-date {
  font-size: 0.75rem;
  color: var(--portal-text);
  white-space: nowrap;
}

.match-teams {
  min-width: 180px;
}

.team-matchup {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.team-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--portal-accent);
}

.vs-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--portal-text);
  opacity: 0.6;
}

.match-server {
  font-size: 0.7rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
}

.match-maps {
  font-size: 0.75rem;
}

.map-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.map-row:last-child {
  margin-bottom: 0;
}

.map-order {
  color: var(--portal-text);
  opacity: 0.6;
  font-size: 0.7rem;
}

.map-name {
  color: var(--portal-warn);
  font-weight: 500;
}

.map-result {
  color: var(--portal-accent);
  font-weight: 500;
}

.map-result--empty {
  color: var(--portal-text);
  opacity: 0.5;
}

.match-status {
  font-size: 0.7rem;
}

.status-row {
  margin-bottom: 0.25rem;
}

.status-row:last-child {
  margin-bottom: 0;
}

.status-empty {
  color: var(--portal-text);
  opacity: 0.6;
}

.status-complete {
  color: var(--portal-accent);
}

.match-actions {
  white-space: nowrap;
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

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .match-row td {
    padding: 0.5rem 0.75rem;
  }

  .team-matchup {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}

/* Form styles */
.portal-form-row {
  display: flex;
  gap: 1rem;
}

.portal-form-section--half {
  flex: 1;
}

.teams-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.teams-selector .portal-form-input {
  flex: 1;
}

.vs-divider {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--portal-accent);
  flex-shrink: 0;
}

.maps-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.map-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.map-entry .portal-form-input {
  flex: 1;
}

.map-number {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--portal-text);
  width: 1.5rem;
  flex-shrink: 0;
}

.server-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.server-search .portal-form-input {
  flex: 1;
}

.server-linked {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--portal-accent);
  flex-shrink: 0;
}

.server-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: var(--portal-surface-elevated, #111118);
  border: 1px solid var(--portal-border, #1a1a24);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.server-suggestion {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.server-suggestion:hover {
  background: var(--portal-accent-dim, rgba(0, 229, 160, 0.12));
}

.server-name {
  font-size: 0.875rem;
  color: var(--portal-text-bright, #e5e7eb);
}

.server-ip {
  font-size: 0.7rem;
  color: var(--portal-text, #9ca3af);
  margin-top: 0.125rem;
}

@media (max-width: 640px) {
  .portal-form-row {
    flex-direction: column;
  }

  .teams-selector {
    flex-direction: column;
  }

  .vs-divider {
    margin: 0.25rem 0;
  }
}
</style>
