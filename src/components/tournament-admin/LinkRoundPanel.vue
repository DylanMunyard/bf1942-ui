<template>
  <SlidePanel
    :open="open"
    title="Link Round"
    subtitle="Search for and select a completed round"
    size="lg"
    @close="$emit('close')"
  >
    <!-- Mode Selector -->
    <div class="mode-selector">
      <button
        :class="['mode-btn', { 'mode-btn--active': searchMode === 'search' }]"
        @click="searchMode = 'search'"
      >
        Search Rounds
      </button>
      <button
        :class="['mode-btn', { 'mode-btn--active': searchMode === 'direct' }]"
        @click="searchMode = 'direct'"
      >
        Enter Round ID
      </button>
    </div>

    <!-- Direct Round ID Input Mode -->
    <div v-if="searchMode === 'direct'" class="portal-form-section">
      <label class="portal-form-label">Round ID</label>
      <input
        v-model="directRoundId"
        type="text"
        placeholder="e.g., bf1942-server-guid-2025-10-29-10-00-00"
        class="portal-form-input portal-form-input--mono"
      >
      <p class="portal-form-hint">Enter the exact round ID if you know it</p>
    </div>

    <!-- Search Mode -->
    <div v-else class="search-mode">
      <!-- Server Selection -->
      <div class="portal-form-section">
        <label class="portal-form-label portal-form-label--required">Server</label>

        <!-- Selected Server Display -->
        <div v-if="selectedServer" class="selected-server">
          <div class="selected-server-info">
            <span class="selected-server-name">{{ selectedServer.serverName }}</span>
            <span v-if="selectedServer.serverIp && selectedServer.serverPort" class="selected-server-ip">
              {{ selectedServer.serverIp }}:{{ selectedServer.serverPort }}
            </span>
          </div>
          <button
            class="portal-btn portal-btn--ghost portal-btn--sm"
            @click="clearServerSelection"
            title="Change server"
          >
            Change
          </button>
        </div>

        <!-- Server Search Input -->
        <div v-else class="server-search-wrap">
          <input
            v-model="serverSearchQuery"
            type="text"
            placeholder="Search for server..."
            class="portal-form-input"
            @input="onServerSearchInput"
            @focus="onServerSearchFocus"
            @blur="onServerSearchBlur"
          >

          <!-- Server Suggestions Dropdown -->
          <div v-if="showServerDropdown && serverSuggestions.length > 0" class="server-dropdown">
            <div
              v-for="server in serverSuggestions"
              :key="server.serverGuid"
              class="server-option"
              @mousedown.prevent="selectServer(server)"
            >
              <div class="server-option-name">{{ server.serverName }}</div>
              <div class="server-option-ip">{{ server.serverIp }}:{{ server.serverPort }}</div>
            </div>
          </div>
          <div
            v-else-if="showServerDropdown && serverSearchQuery.length >= 2 && !isServerSearchLoading"
            class="server-dropdown"
          >
            <div class="server-dropdown-empty">No servers found</div>
          </div>
        </div>
      </div>

      <!-- Map Name Search -->
      <div class="portal-form-section">
        <label class="portal-form-label">Map Name</label>
        <input
          v-model="filters.mapName"
          type="text"
          placeholder="Filter by map..."
          class="portal-form-input"
          @input="debouncedSearch"
        >
      </div>

      <!-- Search Button -->
      <button
        :disabled="!selectedServer || searchingRounds"
        class="portal-btn portal-btn--primary search-btn"
        @click="searchRounds"
      >
        {{ searchingRounds ? 'Searching...' : 'Search Rounds' }}
      </button>

      <!-- Rounds List -->
      <div class="rounds-section">
        <!-- Loading State -->
        <div v-if="loading" class="portal-empty portal-empty--loading">
          <div class="loading-spinner" />
        </div>

        <!-- Error State -->
        <div v-else-if="searchError" class="portal-empty">
          <div class="portal-empty-icon">!</div>
          <h3 class="portal-empty-title">Unable to Load Rounds</h3>
          <p class="portal-empty-desc">{{ searchError }}</p>
        </div>

        <!-- Rounds Table -->
        <div v-else-if="rounds.length > 0" class="rounds-list">
          <div class="rounds-count">
            <span v-if="selectedRoundId">1 round selected</span>
            <span v-else>Select a round</span>
          </div>

          <div class="portal-table-wrap">
            <table class="portal-table">
              <thead>
                <tr>
                  <th style="width: 2rem;"></th>
                  <th>Map</th>
                  <th style="text-align: center;">Players</th>
                  <th style="text-align: center;">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="round in rounds"
                  :key="round.roundId"
                  :class="['round-row', { 'round-row--selected': selectedRoundId === round.roundId }]"
                  @click="toggleRoundSelection(round.roundId)"
                >
                  <td>
                    <div
                      :class="[
                        'round-selector',
                        { 'round-selector--selected': selectedRoundId === round.roundId }
                      ]"
                    >
                      <div v-if="selectedRoundId === round.roundId" class="round-selector-dot" />
                    </div>
                  </td>
                  <td>
                    <div class="round-map">
                      <span class="round-map-name">{{ round.mapName }}</span>
                      <span class="round-map-time">{{ formatDateTime(round.startTime) }}</span>
                    </div>
                  </td>
                  <td style="text-align: center;">
                    <span class="portal-mono">{{ round.participantCount }}</span>
                  </td>
                  <td style="text-align: center;">
                    <span class="portal-mono">{{ round.durationMinutes }}m</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="portal-pagination">
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <div class="portal-pagination-controls">
              <button
                :disabled="currentPage === 1"
                class="portal-btn portal-btn--ghost portal-btn--sm"
                @click="changePage(currentPage - 1)"
              >
                Prev
              </button>
              <button
                :disabled="currentPage === totalPages"
                class="portal-btn portal-btn--ghost portal-btn--sm"
                @click="changePage(currentPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="hasSearched" class="portal-empty">
          <div class="portal-empty-icon">?</div>
          <h3 class="portal-empty-title">No Rounds Found</h3>
          <p class="portal-empty-desc">Try adjusting your filters</p>
        </div>

        <!-- Initial State -->
        <div v-else class="portal-empty">
          <div class="portal-empty-icon">@</div>
          <h3 class="portal-empty-title">Select a Server</h3>
          <p class="portal-empty-desc">Search and select a server to view rounds</p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="portal-form-error">
      {{ error }}
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="panel-footer">
        <button
          class="portal-btn portal-btn--ghost"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button
          :disabled="(!selectedRoundId && !directRoundId) || adding"
          class="portal-btn portal-btn--primary"
          @click="linkRound"
        >
          {{ adding ? 'Linking...' : 'Link Round' }}
        </button>
      </div>
    </template>
  </SlidePanel>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SlidePanel from './SlidePanel.vue';

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  gameType: string;
}

interface RoundListItem {
  roundId: string;
  serverName: string;
  serverGuid: string;
  mapName: string;
  gameType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  participantCount: number;
  isActive: boolean;
}

interface Props {
  open: boolean;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  defaultServerGuid?: string;
  defaultServerName?: string;
  defaultMapName?: string;
}

const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selected', roundId: string): void;
}>();

const searchMode = ref<'search' | 'direct'>('search');
const directRoundId = ref('');

const rounds = ref<RoundListItem[]>([]);
const selectedRoundId = ref<string | null>(null);
const loading = ref(false);
const adding = ref(false);
const error = ref<string | null>(null);
const searchError = ref<string | null>(null);
const hasSearched = ref(false);

// Server search state
const serverSearchQuery = ref('');
const serverSuggestions = ref<ServerSearchResult[]>([]);
const selectedServer = ref<ServerSearchResult | null>(null);
const isServerSearchLoading = ref(false);
const showServerDropdown = ref(false);
const searchingRounds = ref(false);

const filters = ref({
  mapName: props.defaultMapName || '',
});

const currentPage = ref(1);
const pageSize = 50;
const totalPages = ref(1);

let searchTimeout: number | null = null;
let serverSearchTimeout: number | null = null;
let blurTimeout: number | null = null;

const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    serverSuggestions.value = [];
    showServerDropdown.value = false;
    return;
  }

  isServerSearchLoading.value = true;

  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&game=${props.game}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search servers');
    }

    const data = await response.json();
    serverSuggestions.value = data.items || [];
    showServerDropdown.value = (data.items?.length || 0) > 0 || query.length >= 2;
  } catch (err) {
    console.error('Error searching servers:', err);
    serverSuggestions.value = [];
    showServerDropdown.value = false;
  } finally {
    isServerSearchLoading.value = false;
  }
};

const onServerSearchInput = () => {
  selectedServer.value = null;

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
  selectedServer.value = server;
  serverSearchQuery.value = server.serverName;
  serverSuggestions.value = [];
  showServerDropdown.value = false;

  // Auto-search rounds when server is selected
  searchRounds();
};

const clearServerSelection = () => {
  selectedServer.value = null;
  serverSearchQuery.value = '';
  rounds.value = [];
  selectedRoundId.value = null;
  hasSearched.value = false;
};

const toggleRoundSelection = (roundId: string) => {
  if (selectedRoundId.value === roundId) {
    selectedRoundId.value = null;
  } else {
    selectedRoundId.value = roundId;
  }
};

const searchRounds = async () => {
  if (!selectedServer.value) {
    searchError.value = 'Please select a server first';
    return;
  }

  loading.value = true;
  searchingRounds.value = true;
  searchError.value = null;
  hasSearched.value = true;

  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.toString(),
      sortBy: 'StartTime',
      sortOrder: 'desc',
      includePlayers: 'false',
      serverGuid: selectedServer.value.serverGuid,
    });

    if (filters.value.mapName) {
      params.append('mapName', filters.value.mapName);
    }

    const response = await fetch(`/stats/rounds?${params.toString()}`);

    // Handle 404 as "no results found"
    if (response.status === 404) {
      rounds.value = [];
      totalPages.value = 0;
      searchError.value = null;
    } else if (!response.ok) {
      throw new Error('Failed to search rounds');
    } else {
      const data = await response.json();
      rounds.value = data.items;
      totalPages.value = data.totalPages;
      searchError.value = null;
    }
  } catch (err) {
    console.error('Error searching rounds:', err);
    searchError.value = 'Failed to load rounds';
  } finally {
    loading.value = false;
    searchingRounds.value = false;
  }
};

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    if (selectedServer.value) {
      currentPage.value = 1;
      searchRounds();
    }
  }, 300) as unknown as number;
};

const changePage = (page: number) => {
  currentPage.value = page;
  searchRounds();
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const linkRound = () => {
  const roundId = searchMode.value === 'direct'
    ? directRoundId.value.trim()
    : selectedRoundId.value;

  if (!roundId) return;

  adding.value = true;
  error.value = null;

  // Emit the selected round ID - parent component handles the API call
  emit('selected', roundId);
  adding.value = false;
};

// Initialize default server if provided
onMounted(() => {
  if (props.defaultServerGuid && props.defaultServerName) {
    selectedServer.value = {
      serverGuid: props.defaultServerGuid,
      serverName: props.defaultServerName,
      serverIp: '',
      serverPort: 0,
      gameType: props.game,
    };
    // Auto-search rounds with the pre-selected server
    searchRounds();
  }
});
</script>

<style scoped>
.mode-selector {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--portal-surface-elevated, #111118);
  border: 1px solid var(--portal-border, #1a1a24);
  border-radius: 2px;
  margin-bottom: 1.5rem;
}

.mode-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 2px;
  color: var(--portal-text, #9ca3af);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  color: var(--portal-text-bright, #e5e7eb);
}

.mode-btn--active {
  background: var(--portal-accent-dim, rgba(0, 229, 160, 0.12));
  border-color: rgba(0, 229, 160, 0.3);
  color: var(--portal-accent, #00e5a0);
}

.search-mode {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.server-search-wrap {
  position: relative;
}

.server-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--portal-surface-elevated, #111118);
  border: 1px solid var(--portal-border, #1a1a24);
  border-radius: 2px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
}

.server-option {
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  border-bottom: 1px solid var(--portal-border, #1a1a24);
  transition: background 0.15s;
}

.server-option:last-child {
  border-bottom: none;
}

.server-option:hover {
  background: var(--portal-accent-dim, rgba(0, 229, 160, 0.12));
}

.server-option-name {
  font-size: 0.875rem;
  color: var(--portal-text-bright, #e5e7eb);
}

.server-option-ip {
  font-size: 0.7rem;
  color: var(--portal-text, #9ca3af);
  margin-top: 0.125rem;
}

.server-dropdown-empty {
  padding: 0.75rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--portal-text, #9ca3af);
}

.selected-server {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--portal-accent-dim, rgba(0, 229, 160, 0.12));
  border: 1px solid rgba(0, 229, 160, 0.3);
  border-radius: 2px;
}

.selected-server-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.selected-server-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--portal-accent, #00e5a0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-server-ip {
  font-size: 0.7rem;
  color: var(--portal-text, #9ca3af);
}

.search-btn {
  width: 100%;
}

.rounds-section {
  margin-top: 0.5rem;
}

.rounds-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rounds-count {
  font-size: 0.75rem;
  color: var(--portal-text, #9ca3af);
}

.round-row {
  cursor: pointer;
  transition: background 0.15s;
}

.round-row:hover td {
  background: var(--portal-accent-dim, rgba(0, 229, 160, 0.12));
}

.round-row--selected td {
  background: rgba(0, 229, 160, 0.15);
  border-left: 3px solid var(--portal-accent, #00e5a0);
}

.round-selector {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid var(--portal-border, #1a1a24);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.round-selector--selected {
  border-color: var(--portal-accent, #00e5a0);
  background: var(--portal-accent, #00e5a0);
}

.round-selector-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--portal-bg, #06060a);
}

.round-map {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.round-map-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--portal-text-bright, #e5e7eb);
}

.round-map-time {
  font-size: 0.7rem;
  color: var(--portal-text, #9ca3af);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--portal-border, #1a1a24);
  border-top-color: var(--portal-accent, #00e5a0);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Portal styles are inherited from global portal-admin.css */
</style>
