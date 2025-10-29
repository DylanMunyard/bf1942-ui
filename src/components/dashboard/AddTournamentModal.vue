<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {{ editMode ? 'Edit Tournament' : 'Create Tournament' }}
          </h2>
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

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Tournament Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Tournament Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            placeholder="e.g., Summer Championship 2025"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
        </div>

        <!-- Organizer (with player search) -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Organizer <span class="text-red-400">*</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                <span class="text-slate-900 text-xs font-bold">👤</span>
              </div>
            </div>

            <input
              v-model="formData.organizer"
              type="text"
              required
              placeholder="Search for player..."
              class="w-full pl-14 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              @input="onOrganizerInput"
              @focus="onSearchFocus"
              @blur="onSearchBlur"
            >

            <!-- Loading Spinner -->
            <div
              v-if="isSearchLoading"
              class="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>

            <!-- Player Suggestions Dropdown -->
            <div
              v-if="showPlayerDropdown"
              class="absolute top-full mt-2 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto shadow-2xl z-50"
            >
              <div
                v-for="player in playerSuggestions"
                :key="player.playerName"
                class="p-3 border-b border-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all last:border-b-0"
                @mousedown.prevent="selectPlayer(player)"
              >
                <div class="font-medium text-slate-200 text-sm">
                  {{ player.playerName }}
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  {{ formatPlayTime(player.totalPlayTimeMinutes) }} playtime
                </div>
              </div>
              <div
                v-if="playerSuggestions.length === 0 && !isSearchLoading && formData.organizer.length >= 2"
                class="p-3 text-center text-slate-400 text-sm"
              >
                No players found
              </div>
            </div>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Search for an existing player
          </p>
        </div>

        <!-- Game Selection -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Game <span class="text-red-400">*</span>
          </label>
          <div class="flex items-center gap-2">
            <button
              v-for="game in [{id: 'bf1942', name: 'BF1942', icon: bf1942Icon}, {id: 'fh2', name: 'FH2', icon: fh2Icon}, {id: 'bfvietnam', name: 'BF Vietnam', icon: bfvIcon}]"
              :key="game.id"
              type="button"
              :class="[
                'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 flex-1',
                formData.game === game.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 ring-2 ring-cyan-500/30'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
              ]"
              @click="formData.game = game.id as 'bf1942' | 'fh2' | 'bfvietnam'"
            >
              <div
                class="w-6 h-6 rounded bg-cover bg-center"
                :style="{ backgroundImage: `url('${game.icon}')` }"
              />
              <span class="text-sm font-medium">{{ game.name }}</span>
            </button>
          </div>
        </div>

        <!-- Server Selection (Optional) -->
        <div class="relative z-40">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Tournament Server <span class="text-slate-500">(Optional)</span>
          </label>

          <!-- Selected Server Display -->
          <div v-if="selectedServer" class="mb-3">
            <div class="flex items-center justify-between gap-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="text-cyan-400 text-sm">🖥️</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-slate-200 text-sm truncate">
                    {{ selectedServer.serverName }}
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5">
                    {{ selectedServer.serverIp }}:{{ selectedServer.serverPort }}
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                @click="clearServerSelection"
                title="Change server"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Server Search Input (only show when no server selected) -->
          <div v-else class="relative">
            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <span class="text-slate-500 text-sm">🖥️</span>
            </div>
            <input
              v-model="serverSearchQuery"
              type="text"
              placeholder="Search for server..."
              class="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              @input="onServerSearchInput"
              @focus="onServerSearchFocus"
              @blur="onServerSearchBlur"
            >

            <!-- Server Suggestions Dropdown -->
            <div
              v-if="showServerDropdown"
              class="absolute top-full mt-2 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto shadow-2xl z-50"
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
              <div
                v-if="serverSuggestions.length === 0 && !isServerSearchLoading && serverSearchQuery.length >= 2"
                class="p-3 text-center text-slate-400 text-sm"
              >
                No servers found
              </div>
            </div>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Optionally specify which server this tournament will be played on
          </p>
        </div>

        <!-- Anticipated Round Count -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            # Matches
          </label>
          <input
            v-model.number="formData.anticipatedRoundCount"
            type="number"
            min="1"
            placeholder="e.g., 5"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
          <p class="mt-1 text-xs text-slate-500">
            How many matches do you expect in this tournament?
          </p>
        </div>

        <!-- Hero Image Upload -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Hero Image
          </label>

          <!-- Image Preview -->
          <div
            v-if="imagePreview"
            class="relative mb-3 rounded-lg overflow-hidden border border-slate-700/50"
          >
            <img
              :src="imagePreview"
              alt="Tournament hero image"
              class="w-full h-48 object-cover"
            >
            <button
              type="button"
              class="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
              @click="removeImage"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Upload Button -->
          <div
            class="relative border-2 border-dashed border-slate-700/50 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            :class="{ 'border-cyan-500/50 bg-cyan-500/5': isDragging }"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              class="hidden"
              @change="handleFileSelect"
            >
            <div class="text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm font-medium">
                {{ imagePreview ? 'Change Image' : 'Upload Hero Image' }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                Click or drag & drop (Max 4MB, JPEG/PNG/GIF/WEBP)
              </p>
            </div>
          </div>

          <!-- Error Message -->
          <p v-if="imageError" class="mt-2 text-xs text-red-400">
            {{ imageError }}
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-4">
          <button
            type="button"
            class="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Saving...' : (editMode ? 'Update Tournament' : 'Create Tournament') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminTournamentService, type CreateTournamentRequest, type TournamentDetail } from '@/services/adminTournamentService';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

interface PlayerSearchResult {
  playerName: string;
  totalPlayTimeMinutes: number;
  lastSeen: string;
  isActive: boolean;
}

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  gameType: string;
}

interface Props {
  tournament?: TournamentDetail | any;
  defaultOrganizer?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  added: [tournamentId?: number];
}>();

const editMode = ref(!!props.tournament);

const formData = ref({
  name: '',
  organizer: '',
  game: 'bf1942' as 'bf1942' | 'fh2' | 'bfvietnam',
  anticipatedRoundCount: undefined as number | undefined,
  serverGuid: undefined as string | undefined,
});

const loading = ref(false);
const error = ref<string | null>(null);

// Player search state
const playerSuggestions = ref<PlayerSearchResult[]>([]);
const isSearchLoading = ref(false);
const showPlayerDropdown = ref(false);
let searchTimeout: number | null = null;
let blurTimeout: number | null = null;

// Server search state
const serverSearchQuery = ref('');
const serverSuggestions = ref<ServerSearchResult[]>([]);
const selectedServer = ref<ServerSearchResult | null>(null);
const isServerSearchLoading = ref(false);
const showServerDropdown = ref(false);
let serverSearchTimeout: number | null = null;
let serverBlurTimeout: number | null = null;

// Image upload state
const fileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | null>(null);
const imageFile = ref<File | null>(null);
const imageError = ref<string | null>(null);
const isDragging = ref(false);

onMounted(() => {
  if (props.tournament) {
    // Edit mode - populate form
    formData.value = {
      name: props.tournament.name,
      organizer: props.tournament.organizer,
      game: props.tournament.game,
      anticipatedRoundCount: props.tournament.anticipatedRoundCount,
      serverGuid: props.tournament.serverGuid,
    };

    // Populate server selection if available
    if (props.tournament.serverGuid && props.tournament.serverName) {
      selectedServer.value = {
        serverGuid: props.tournament.serverGuid,
        serverName: props.tournament.serverName,
        serverIp: '',
        serverPort: 0,
        gameType: props.tournament.game,
      };
      serverSearchQuery.value = props.tournament.serverName;
    }

    // Load existing image if available
    if (props.tournament.heroImageBase64) {
      // If we have base64 data, use it directly
      imagePreview.value = `data:${props.tournament.heroImageContentType || 'image/png'};base64,${props.tournament.heroImageBase64}`;
    } else if (props.tournament.hasHeroImage || props.tournament.id) {
      // Otherwise try to fetch from the API
      imagePreview.value = adminTournamentService.getTournamentImageUrl(props.tournament.id);
    }
  } else if (props.defaultOrganizer) {
    // Create mode with default organizer
    formData.value.organizer = props.defaultOrganizer;
  }
});

const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
    return;
  }

  isSearchLoading.value = true;

  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data = await response.json();
    playerSuggestions.value = data.items;
    showPlayerDropdown.value = data.items.length > 0 || query.length >= 2;
  } catch (error) {
    console.error('Error searching players:', error);
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
  } finally {
    isSearchLoading.value = false;
  }
};

const onOrganizerInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    searchPlayers(formData.value.organizer);
  }, 300) as unknown as number;
};

const onSearchFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
  if (formData.value.organizer.length >= 2) {
    searchPlayers(formData.value.organizer);
  }
};

const onSearchBlur = () => {
  blurTimeout = setTimeout(() => {
    showPlayerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectPlayer = (player: PlayerSearchResult) => {
  formData.value.organizer = player.playerName;
  playerSuggestions.value = [];
  showPlayerDropdown.value = false;
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

// Server search functions
const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    serverSuggestions.value = [];
    showServerDropdown.value = false;
    return;
  }

  isServerSearchLoading.value = true;

  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&game=${formData.value.game}&pageSize=10`);
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
    isServerSearchLoading.value = false;
  }
};

const onServerSearchInput = () => {
  selectedServer.value = null;
  formData.value.serverGuid = undefined;

  if (serverSearchTimeout) {
    clearTimeout(serverSearchTimeout);
  }

  serverSearchTimeout = setTimeout(() => {
    searchServers(serverSearchQuery.value);
  }, 300) as unknown as number;
};

const onServerSearchFocus = () => {
  if (serverBlurTimeout) {
    clearTimeout(serverBlurTimeout);
  }
  if (serverSearchQuery.value.length >= 2) {
    searchServers(serverSearchQuery.value);
  }
};

const onServerSearchBlur = () => {
  serverBlurTimeout = setTimeout(() => {
    showServerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectServer = (server: ServerSearchResult) => {
  selectedServer.value = server;
  serverSearchQuery.value = server.serverName;
  formData.value.serverGuid = server.serverGuid;
  serverSuggestions.value = [];
  showServerDropdown.value = false;
};

const clearServerSelection = () => {
  selectedServer.value = null;
  serverSearchQuery.value = '';
  formData.value.serverGuid = undefined;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processImageFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processImageFile(file);
  }
};

const processImageFile = (file: File) => {
  imageError.value = null;

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    imageError.value = 'Invalid file type. Please use JPEG, PNG, GIF, or WEBP.';
    return;
  }

  // Validate file size (4MB)
  if (file.size > 4 * 1024 * 1024) {
    imageError.value = 'File size must be less than 4MB.';
    return;
  }

  imageFile.value = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  imageFile.value = null;
  imagePreview.value = null;
  imageError.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    const request: CreateTournamentRequest = {
      name: formData.value.name.trim(),
      organizer: formData.value.organizer.trim(),
      game: formData.value.game,
    };

    if (formData.value.anticipatedRoundCount) {
      request.anticipatedRoundCount = formData.value.anticipatedRoundCount;
    }

    if (formData.value.serverGuid) {
      request.serverGuid = formData.value.serverGuid;
    }

    // Convert image to base64 if provided
    if (imageFile.value) {
      const imageData = await adminTournamentService.imageToBase64(imageFile.value);
      request.heroImageBase64 = imageData.base64;
      request.heroImageContentType = imageData.contentType;
    }

    let tournamentId: number | undefined;

    if (editMode.value && props.tournament) {
      await adminTournamentService.updateTournament(props.tournament.id, request);
      tournamentId = props.tournament.id;
    } else {
      const result = await adminTournamentService.createTournament(request);
      tournamentId = result.id;
    }

    emit('added', tournamentId);
    emit('close');
  } catch (err) {
    console.error('Error saving tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to save tournament';
  } finally {
    loading.value = false;
  }
};
</script>
