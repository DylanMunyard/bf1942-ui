<template>
  <div class="space-y-4">
    <!-- Current Players Display -->
    <div v-if="currentPlayers.length > 0" class="current-players-section">
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium" :style="{ color: textMutedColor }">
          Current Players ({{ currentPlayers.length }})
        </label>
        <button
          class="text-xs transition-colors"
          :style="{ color: '#ef4444' }"
          @mouseenter="$el.style.color = '#fca5a5'"
          @mouseleave="$el.style.color = '#ef4444'"
          @click="$emit('clearAllPlayers')"
          :disabled="loading"
        >
          Remove All
        </button>
      </div>

      <!-- Added Players List -->
      <div 
        ref="currentPlayersListRef"
        class="max-h-32 overflow-y-auto rounded-lg p-2 current-players-list" 
        :style="{ 
          backgroundColor: backgroundMuteColor + '80',
          '--current-players-bg': backgroundMuteColor + '80'
        }"
      >
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(player, index) in currentPlayers"
            :key="index"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm"
            :style="{ backgroundColor: props.accentColor + '33', borderColor: props.accentColor + '50', borderWidth: '1px', borderStyle: 'solid' }"
          >
            <span :style="{ color: props.accentColor }">👤</span>
            <span class="font-medium" :style="{ color: accentTextColor }">{{ player }}</span>
            <button
              class="transition-colors ml-1"
              :style="{ color: '#ef4444' }"
              @mouseenter="$el.style.color = '#fca5a5'"
              @mouseleave="$el.style.color = '#ef4444'"
              @click="$emit('removePlayer', index)"
              :disabled="loading"
              title="Remove player"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Search -->
    <div class="space-y-3">
      <div class="relative">
        <input
          v-model="playerSearchQuery"
          type="text"
          :placeholder="placeholder"
          class="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
          :style="{
            backgroundColor: backgroundColor + '95',
            borderColor: accentColor + '30',
            borderWidth: '1px',
            borderStyle: 'solid',
            color: textColor,
            '--tw-ring-color': accentColor + '50'
          }"
          :class="{ 'focus:ring-2': true }"
          :disabled="loading"
          @input="debouncedPlayerSearch"
          @focus="showPlayerDropdown = true"
        >
      </div>

      <!-- Player Search Results -->
      <div v-if="showPlayerDropdown && playerSearchResults.length > 0" class="rounded-lg max-h-64 overflow-y-auto" :style="{ backgroundColor: backgroundColor + '95', borderColor: accentColor + '30', borderWidth: '1px', borderStyle: 'solid' }">
        <div class="p-2 flex items-center justify-between text-xs" :style="{ borderColor: accentColor + '20', borderBottomWidth: '1px', borderBottomStyle: 'solid', color: textMutedColor }">
          <span>{{ selectedPlayerNames.length }} selected</span>
          <div class="flex gap-2">
            <button
              class="px-2 py-1 rounded transition-colors"
              :style="{ color: accentColor }"
              @mouseenter="$el.style.color = accentColor; $el.style.backgroundColor = accentColor + '1a'"
              @mouseleave="$el.style.color = accentColor; $el.style.backgroundColor = 'transparent'"
              @click="selectAllVisiblePlayers"
            >
              Select All
            </button>
            <button
              v-if="selectedPlayerNames.length > 0"
              class="px-2 py-1 rounded transition-colors"
              :style="{ color: textMutedColor }"
              @mouseenter="$el.style.color = textColor; $el.style.backgroundColor = backgroundMuteColor + '80'"
              @mouseleave="$el.style.color = textMutedColor; $el.style.backgroundColor = 'transparent'"
              @click="selectedPlayerNames = []"
            >
              Clear
            </button>
          </div>
        </div>
        <div
          v-for="player in playerSearchResults"
          :key="player.playerName"
          class="p-3 cursor-pointer transition-all last:border-b-0 flex items-center gap-3"
          :style="{ borderColor: accentColor + '20', borderBottomWidth: '1px', borderBottomStyle: 'solid' }"
          @mouseenter="$el.style.backgroundColor = backgroundMuteColor + '80'"
          @mouseleave="$el.style.backgroundColor = 'transparent'"
          @click="togglePlayerSelection(player.playerName)"
        >
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
            :style="isPlayerSelected(player.playerName)
              ? { borderColor: accentColor, backgroundColor: accentColor }
              : { borderColor: textMutedColor, backgroundColor: 'transparent' }"
            @mouseenter="!isPlayerSelected(player.playerName) && ($el.style.borderColor = accentColor)"
            @mouseleave="!isPlayerSelected(player.playerName) && ($el.style.borderColor = textMutedColor)"
          >
            <svg
              v-if="isPlayerSelected(player.playerName)"
              class="w-3 h-3"
              :style="{ color: accentTextColor }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate" :style="{ color: textColor }">
              {{ player.playerName }}
            </div>
            <div class="text-xs mt-0.5" :style="{ color: textMutedColor }">
              {{ formatPlayerStats(player) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="searchingPlayers" class="text-center py-4">
        <div class="w-6 h-6 border-4 rounded-full animate-spin mx-auto"
             :style="{ borderColor: accentColor + '30', borderTopColor: accentColor }" />
        <p class="text-xs mt-2" :style="{ color: textMutedColor }">Searching...</p>
      </div>

      <!-- No Results -->
      <div v-if="showPlayerDropdown && !searchingPlayers && playerSearchQuery.length >= 2 && playerSearchResults.length === 0" class="text-center py-8 rounded-lg" :style="{ backgroundColor: backgroundMuteColor + '80', borderColor: accentColor + '30', borderWidth: '1px', borderStyle: 'solid' }">
        <span class="text-4xl mb-2 block">🔍</span>
        <p class="text-sm" :style="{ color: textMutedColor }">No players found</p>
      </div>

      <!-- Add Selected Button -->
      <button
        v-if="selectedPlayerNames.length > 0"
        class="add-players-btn w-full px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2"
        :style="{
          background: `linear-gradient(90deg, ${props.accentColor}, ${props.accentColor}dd)`,
          color: accentTextColor
        }"
        @mouseenter="handleAddButtonHover(true)"
        @mouseleave="handleAddButtonHover(false)"
        @click="addSelectedPlayers"
        :disabled="loading"
      >
        <span>Add {{ selectedPlayerNames.length }} {{ selectedPlayerNames.length === 1 ? 'Player' : 'Players' }}</span>
      </button>
    </div>

    <p class="mt-2 text-xs" :style="{ color: textMutedColor }">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getContrastingTextColor } from '@/utils/colorUtils';

const currentPlayersListRef = ref<HTMLElement | null>(null);

interface Props {
  currentPlayers: string[];
  placeholder?: string;
  helpText?: string;
  loading?: boolean;
  // Theme colors
  accentColor?: string;
  textColor?: string;
  textMutedColor?: string;
  backgroundColor?: string;
  backgroundMuteColor?: string;
}

interface PlayerSearchResult {
  playerName: string;
  totalKills?: number;
  totalDeaths?: number;
  kdRatio?: number;
  lastSeen?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search for players by name...',
  helpText: 'Search for players and select multiple to add them to the team. Great for adding clan members!',
  loading: false,
  // Theme color defaults
  accentColor: '#06b6d4',
  textColor: '#FFFFFF',
  textMutedColor: '#9ca3af',
  backgroundColor: '#1a1a1a',
  backgroundMuteColor: '#2d2d2d',
});

const accentTextColor = computed(() => getContrastingTextColor(props.accentColor));

const emit = defineEmits<{
  addPlayers: [players: string[]];
  removePlayer: [index: number];
  clearAllPlayers: [];
}>();

const playerSearchQuery = ref('');
const playerSearchResults = ref<PlayerSearchResult[]>([]);
const selectedPlayerNames = ref<string[]>([]);
const searchingPlayers = ref(false);
const showPlayerDropdown = ref(false);

let playerSearchTimeout: number | null = null;

const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    playerSearchResults.value = [];
    showPlayerDropdown.value = false;
    return;
  }

  searchingPlayers.value = true;

  try {
    const response = await fetch(`/stats/players/search?query=${encodeURIComponent(query)}&pageSize=20`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data = await response.json();
    playerSearchResults.value = data.items || [];
    showPlayerDropdown.value = true;
  } catch (err) {
    console.error('Error searching players:', err);
    playerSearchResults.value = [];
    showPlayerDropdown.value = false;
  } finally {
    searchingPlayers.value = false;
  }
};

const debouncedPlayerSearch = () => {
  selectedPlayerNames.value = [];

  if (playerSearchTimeout) {
    clearTimeout(playerSearchTimeout);
  }

  playerSearchTimeout = setTimeout(() => {
    searchPlayers(playerSearchQuery.value);
  }, 300) as unknown as number;
};

const isPlayerSelected = (playerName: string): boolean => {
  return selectedPlayerNames.value.includes(playerName);
};

const togglePlayerSelection = (playerName: string) => {
  const index = selectedPlayerNames.value.indexOf(playerName);
  if (index > -1) {
    selectedPlayerNames.value.splice(index, 1);
  } else {
    selectedPlayerNames.value.push(playerName);
  }
};

const selectAllVisiblePlayers = () => {
  const newSelections = playerSearchResults.value
    .map(p => p.playerName)
    .filter(name => !props.currentPlayers.includes(name));

  selectedPlayerNames.value = [...new Set([...selectedPlayerNames.value, ...newSelections])];
};

const handleAddButtonHover = (isHovering: boolean) => {
  const button = document.querySelector('.add-players-btn') as HTMLElement;
  if (button) {
    if (isHovering) {
      button.style.background = `linear-gradient(90deg, ${props.accentColor}dd, ${props.accentColor}cc)`;
    } else {
      button.style.background = `linear-gradient(90deg, ${props.accentColor}, ${props.accentColor}dd)`;
    }
  }
  
  // Ensure Current Players section background doesn't change
  if (currentPlayersListRef.value) {
    currentPlayersListRef.value.style.backgroundColor = props.backgroundMuteColor + '80';
  }
};

const addSelectedPlayers = () => {
  const playersToAdd = selectedPlayerNames.value.filter(name => !props.currentPlayers.includes(name));

  if (playersToAdd.length > 0) {
    emit('addPlayers', playersToAdd);
  }

  selectedPlayerNames.value = [];
  playerSearchQuery.value = '';
  playerSearchResults.value = [];
  showPlayerDropdown.value = false;
};

const formatPlayerStats = (player: PlayerSearchResult): string => {
  const parts = [];

  if (player.kdRatio !== undefined) {
    parts.push(`K/D: ${player.kdRatio.toFixed(2)}`);
  }

  if (player.totalKills !== undefined) {
    parts.push(`${player.totalKills} kills`);
  }

  if (player.lastSeen) {
    const date = new Date(player.lastSeen);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      parts.push('Active today');
    } else if (diffDays === 1) {
      parts.push('Active yesterday');
    } else if (diffDays < 7) {
      parts.push(`Active ${diffDays}d ago`);
    } else {
      parts.push(`Last seen ${diffDays}d ago`);
    }
  }

  return parts.length > 0 ? parts.join(' • ') : 'No stats available';
};
</script>

<style scoped>
/* Prevent text selection on interactive elements */
.space-y-4 {
  user-select: none;
  -webkit-user-select: none;
}

/* Remove all focus outlines from container elements */
.space-y-4 *:focus {
  outline: none;
}

/* Allow text selection only in input fields */
input {
  user-select: text;
  -webkit-user-select: text;
}

/* Prevent hover effects from affecting Current Players section */
.current-players-section {
  pointer-events: auto;
  isolation: isolate;
}

.current-players-section,
.current-players-section * {
  transition: none !important;
}

.current-players-list {
  transition: background-color 0s !important;
  background-color: var(--current-players-bg) !important;
}

/* Prevent any hover rules from affecting the Current Players list background */
.space-y-4:hover .current-players-list,
.space-y-4 button:hover ~ .current-players-section .current-players-list,
.add-players-btn:hover ~ .current-players-section .current-players-list,
.add-players-btn:hover + * .current-players-section .current-players-list {
  background-color: var(--current-players-bg) !important;
}

/* Ensure the add button hover doesn't affect siblings */
.add-players-btn {
  isolation: isolate;
}

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