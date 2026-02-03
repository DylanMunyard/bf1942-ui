<template>
  <div class="tournament-settings-tab">
    <!-- Edit Tournament Details View -->
    <div v-if="currentView === 'editDetails'" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ EDIT TOURNAMENT ]</h2>
          <p class="portal-card-subtitle">Update tournament details and settings</p>
        </div>
        <button
          class="portal-btn portal-btn--ghost"
          @click="closeEditPanel"
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

        <!-- Tournament Name -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">Tournament Name</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., Summer Championship 2025"
            class="portal-form-input"
            :disabled="formLoading"
          >
        </div>

        <!-- URL Slug -->
        <div class="portal-form-section">
          <label class="portal-form-label">URL Slug</label>
          <input
            v-model="formData.slug"
            type="text"
            placeholder="e.g., summer-league-2024"
            class="portal-form-input portal-form-input--mono"
            :disabled="formLoading"
          >
          <p class="portal-form-hint">Short identifier for URLs. Use lowercase letters, numbers, and hyphens only.</p>
        </div>

        <!-- Row: Organizer + Game -->
        <div class="portal-form-row">
          <!-- Organizer -->
          <div class="portal-form-section">
            <label class="portal-form-label portal-form-label--required">Organizer</label>
            <div class="portal-input-wrap">
              <input
                v-model="formData.organizer"
                type="text"
                placeholder="Search for player..."
                class="portal-form-input"
                :disabled="formLoading"
                @input="onOrganizerInput"
                @focus="showPlayerDropdown = true"
                @blur="onOrganizerBlur"
              >
              <div v-if="showPlayerDropdown && playerSuggestions.length > 0" class="portal-dropdown">
                <div
                  v-for="player in playerSuggestions"
                  :key="player.playerName"
                  class="portal-dropdown-item"
                  @mousedown.prevent="selectPlayer(player)"
                >
                  {{ player.playerName }}
                </div>
              </div>
            </div>
          </div>

          <!-- Game -->
          <div class="portal-form-section">
            <label class="portal-form-label portal-form-label--required">Game</label>
            <select
              v-model="formData.game"
              class="portal-form-select"
              :disabled="formLoading"
            >
              <option value="bf1942">Battlefield 1942</option>
              <option value="fh2">Forgotten Hope 2</option>
              <option value="bfvietnam">Battlefield Vietnam</option>
            </select>
          </div>
        </div>

        <!-- Row: Rounds + Status -->
        <div class="portal-form-row">
          <div class="portal-form-section">
            <label class="portal-form-label">Anticipated Rounds</label>
            <input
              v-model.number="formData.anticipatedRoundCount"
              type="number"
              min="1"
              placeholder="e.g., 5"
              class="portal-form-input"
              :disabled="formLoading"
            >
          </div>

          <div class="portal-form-section">
            <label class="portal-form-label">Status</label>
            <select
              v-model="formData.status"
              class="portal-form-select"
              :disabled="formLoading"
            >
              <option value="draft">Draft</option>
              <option value="registration">Registration</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <!-- Game Mode -->
        <div class="portal-form-section">
          <label class="portal-form-label">Game Mode</label>
          <select
            v-model="formData.gameMode"
            class="portal-form-select"
            :disabled="formLoading"
          >
            <option value="Conquest">Conquest</option>
            <option value="CTF">CTF</option>
          </select>
        </div>

        <!-- Social Links Section -->
        <div class="portal-form-section">
          <label class="portal-form-label">Social Links</label>
          <div class="social-links-grid">
            <div class="social-link-item">
              <span class="social-icon">💬</span>
              <input
                v-model="formData.discordUrl"
                type="url"
                placeholder="Discord URL"
                class="portal-form-input"
                :disabled="formLoading"
              >
            </div>
            <div class="social-link-item">
              <span class="social-icon">📺</span>
              <input
                v-model="formData.youTubeUrl"
                type="url"
                placeholder="YouTube URL"
                class="portal-form-input"
                :disabled="formLoading"
              >
            </div>
            <div class="social-link-item">
              <span class="social-icon">🎮</span>
              <input
                v-model="formData.twitchUrl"
                type="url"
                placeholder="Twitch URL"
                class="portal-form-input"
                :disabled="formLoading"
              >
            </div>
            <div class="social-link-item">
              <span class="social-icon">🌐</span>
              <input
                v-model="formData.forumUrl"
                type="url"
                placeholder="Forum URL"
                class="portal-form-input"
                :disabled="formLoading"
              >
            </div>
          </div>
        </div>

        <!-- Promo Video URL -->
        <div class="portal-form-section">
          <label class="portal-form-label">Promo Video URL</label>
          <input
            v-model="formData.promoVideoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="portal-form-input"
            :disabled="formLoading"
          >
          <p class="portal-form-hint">YouTube video URL to embed on tournament page.</p>
        </div>

        <!-- Rules -->
        <div class="portal-form-section">
          <div class="label-with-help">
            <label class="portal-form-label">Tournament Rules (Markdown)</label>
            <button
              type="button"
              class="markdown-help-btn"
              @click="showMarkdownHelp = true"
              title="Show markdown syntax help"
            >
              ? Help
            </button>
          </div>
          <textarea
            v-model="formData.rules"
            placeholder="# Tournament Rules&#10;&#10;Write your tournament rules in markdown..."
            class="portal-form-textarea"
            :disabled="formLoading"
            rows="8"
          />
        </div>

        <!-- Registration Rules -->
        <div class="portal-form-section">
          <div class="label-with-help">
            <label class="portal-form-label">Registration Rules (Markdown)</label>
            <button
              type="button"
              class="markdown-help-btn"
              @click="showMarkdownHelp = true"
              title="Show markdown syntax help"
            >
              ? Help
            </button>
          </div>
          <textarea
            v-model="formData.registrationRules"
            placeholder="# Registration Info&#10;&#10;Write registration instructions in markdown..."
            class="portal-form-textarea"
            :disabled="formLoading"
            rows="6"
          />
          <p class="portal-form-hint">Shown to users when they register for the tournament.</p>
        </div>

        <!-- Form Actions -->
        <div class="portal-form-footer" style="margin-top: 1.5rem">
          <button
            class="portal-btn portal-btn--ghost"
            :disabled="formLoading"
            @click="closeEditPanel"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--primary"
            :disabled="formLoading || !formData.name.trim() || !formData.organizer.trim()"
            @click="submitEditForm"
          >
            <span v-if="formLoading" class="portal-btn-pulse">Saving...</span>
            <span v-else>Update Tournament</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Theme View -->
    <div v-else-if="currentView === 'editTheme'" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ EDIT THEME ]</h2>
          <p class="portal-card-subtitle">Customize colors and images</p>
        </div>
        <button
          class="portal-btn portal-btn--ghost"
          @click="closeThemePanel"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
      </div>

      <div class="portal-card-body">
        <!-- Error Message -->
        <div v-if="themeError" class="portal-form-error">
          {{ themeError }}
        </div>

        <!-- Hero Image -->
        <div class="portal-form-section">
          <label class="portal-form-label">Hero Image</label>
          <div class="image-upload-area">
            <div v-if="heroImagePreview" class="image-preview image-preview--clickable" @click="triggerHeroUpload">
              <img :src="heroImagePreview" alt="Hero preview" />
              <div class="image-overlay">
                <span class="image-overlay-text">Click to replace image</span>
              </div>
              <button
                type="button"
                class="image-remove-btn"
                @click.stop="removeHeroImage"
                title="Remove image"
              >
                ×
              </button>
            </div>
            <div v-else class="image-upload-placeholder" @click="triggerHeroUpload">
              <span class="upload-icon">🖼️</span>
              <span class="upload-text">Click to upload hero image</span>
            </div>
            <input
              ref="heroImageInput"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="handleHeroImageSelect"
            >
          </div>
          <p class="portal-form-hint">Recommended: 1920x400 pixels, max 4MB</p>
        </div>

        <!-- Community Logo -->
        <div class="portal-form-section">
          <label class="portal-form-label">Community Logo</label>
          <div class="image-upload-area">
            <div v-if="logoImagePreview" class="image-preview image-preview--logo image-preview--clickable" @click="triggerLogoUpload">
              <img :src="logoImagePreview" alt="Logo preview" />
              <div class="image-overlay">
                <span class="image-overlay-text">Click to replace image</span>
              </div>
              <button
                type="button"
                class="image-remove-btn"
                @click.stop="removeLogoImage"
                title="Remove image"
              >
                ×
              </button>
            </div>
            <div v-else class="image-upload-placeholder" @click="triggerLogoUpload">
              <span class="upload-icon">🏷️</span>
              <span class="upload-text">Click to upload logo</span>
            </div>
            <input
              ref="logoImageInput"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="handleLogoImageSelect"
            >
          </div>
          <p class="portal-form-hint">Recommended: Square or horizontal, max 4MB</p>
        </div>

        <!-- Background Color -->
        <div class="portal-form-section">
          <label class="portal-form-label">Background Color</label>
          <div class="color-input-row">
            <input
              v-model="themeData.backgroundColour"
              type="color"
              class="color-picker"
              :disabled="themeLoading"
            >
            <input
              v-model="themeData.backgroundColour"
              type="text"
              placeholder="#000000"
              class="portal-form-input portal-form-input--mono color-text-input"
              :disabled="themeLoading"
            >
          </div>
        </div>

        <!-- Text Color -->
        <div class="portal-form-section">
          <label class="portal-form-label">Text Color</label>
          <div class="color-input-row">
            <input
              v-model="themeData.textColour"
              type="color"
              class="color-picker"
              :disabled="themeLoading"
            >
            <input
              v-model="themeData.textColour"
              type="text"
              placeholder="#FFFFFF"
              class="portal-form-input portal-form-input--mono color-text-input"
              :disabled="themeLoading"
            >
          </div>
        </div>

        <!-- Accent Color -->
        <div class="portal-form-section">
          <label class="portal-form-label">Accent Color</label>
          <div class="color-input-row">
            <input
              v-model="themeData.accentColour"
              type="color"
              class="color-picker"
              :disabled="themeLoading"
            >
            <input
              v-model="themeData.accentColour"
              type="text"
              placeholder="#FFD700"
              class="portal-form-input portal-form-input--mono color-text-input"
              :disabled="themeLoading"
            >
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="portal-form-section">
          <label class="portal-form-label">Quick Presets</label>
          <div class="theme-presets">
            <button type="button" class="preset-btn" @click="applyPreset('dark')">🌙 Dark</button>
            <button type="button" class="preset-btn" @click="applyPreset('light')">☀️ Light</button>
            <button type="button" class="preset-btn" @click="applyPreset('cyberpunk')">⚡ Cyberpunk</button>
            <button type="button" class="preset-btn" @click="applyPreset('ocean')">🌊 Ocean</button>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="portal-form-footer" style="margin-top: 1.5rem">
          <button
            class="portal-btn portal-btn--ghost"
            :disabled="themeLoading"
            @click="closeThemePanel"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--primary"
            :disabled="themeLoading"
            @click="submitThemeForm"
          >
            <span v-if="themeLoading" class="portal-btn-pulse">Saving...</span>
            <span v-else>Update Theme</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Default List View -->
    <template v-else>
      <!-- Tournament Details Section -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div>
            <h2 class="portal-card-title">[ DETAILS ]</h2>
            <p class="portal-card-subtitle">Edit tournament name, description, and settings</p>
          </div>
          <button
            class="portal-btn portal-btn--primary"
            @click="openEditPanel"
          >
            Edit Tournament
          </button>
        </div>

        <div class="portal-card-body">
          <div class="settings-grid">
            <div class="setting-item">
              <span class="setting-label">Name</span>
              <span class="setting-value">{{ tournament.name }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Game</span>
              <span class="setting-value">{{ getGameLabel(tournament.game) }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Organizer</span>
              <span class="setting-value">{{ tournament.organizer }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Server</span>
              <span class="setting-value">{{ tournament.serverName || '—' }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Status</span>
              <span class="setting-value">
                <span class="portal-badge" :class="tournament.status === 'active' ? 'portal-badge--success' : 'portal-badge--muted'">
                  {{ tournament.status }}
                </span>
              </span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Anticipated Matches</span>
              <span class="setting-value">{{ tournament.anticipatedRoundCount || '—' }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Slug</span>
              <span class="setting-value portal-mono">{{ tournament.slug || '—' }}</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">Created</span>
              <span class="setting-value">{{ formatDate(tournament.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Theme Section -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div>
            <h2 class="portal-card-title">[ THEME ]</h2>
            <p class="portal-card-subtitle">Customize colors, images, and visual style</p>
          </div>
          <button
            class="portal-btn portal-btn--primary"
            @click="openThemePanel"
          >
            Edit Theme
          </button>
        </div>

        <div class="portal-card-body">
          <div class="theme-preview">
            <div class="theme-row">
              <span class="setting-label">Hero Image</span>
              <span v-if="tournament.hasHeroImage" class="portal-badge portal-badge--success">Uploaded</span>
              <span v-else class="portal-badge portal-badge--muted">Not set</span>
            </div>
            <div class="theme-row">
              <span class="setting-label">Community Logo</span>
              <span v-if="tournament.hasCommunityLogo" class="portal-badge portal-badge--success">Uploaded</span>
              <span v-else class="portal-badge portal-badge--muted">Not set</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rules Section -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div>
            <h2 class="portal-card-title">[ RULES ]</h2>
            <p class="portal-card-subtitle">Tournament rules and guidelines (supports Markdown)</p>
          </div>
        </div>

        <div class="portal-card-body">
          <div v-if="tournament.rules && tournament.rules.trim()" class="rules-preview">
            <div
              v-html="renderedRules"
              class="markdown-rules"
            />
          </div>
          <div v-else class="portal-empty" style="padding: 2rem">
            <div class="portal-empty-icon">📋</div>
            <h3 class="portal-empty-title">No Rules Defined</h3>
            <p class="portal-empty-desc">
              Add tournament rules in the Edit Tournament panel
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Markdown Help Modal -->
    <MarkdownHelpModal
      :is-visible="showMarkdownHelp"
      @close="showMarkdownHelp = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { marked } from 'marked';
import { adminTournamentService, type TournamentDetail } from '@/services/adminTournamentService';
import MarkdownHelpModal from '@/components/dashboard/MarkdownHelpModal.vue';

interface PlayerSearchResult {
  playerName: string;
  totalPlayTimeMinutes: number;
}

const props = defineProps<{
  tournament: TournamentDetail;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// View state: 'list', 'editDetails', or 'editTheme'
type ViewState = 'list' | 'editDetails' | 'editTheme';
const currentView = ref<ViewState>('list');

// Edit Panel State
const formLoading = ref(false);
const formError = ref<string | null>(null);
const showMarkdownHelp = ref(false);
const formData = ref({
  name: '',
  slug: '',
  organizer: '',
  game: 'bf1942' as 'bf1942' | 'fh2' | 'bfvietnam',
  anticipatedRoundCount: undefined as number | undefined,
  status: 'draft' as 'draft' | 'registration' | 'open' | 'closed',
  gameMode: 'Conquest',
  discordUrl: '',
  youTubeUrl: '',
  twitchUrl: '',
  forumUrl: '',
  promoVideoUrl: '',
  rules: '',
  registrationRules: '',
});

// Player search state
const playerSuggestions = ref<PlayerSearchResult[]>([]);
const showPlayerDropdown = ref(false);
let searchTimeout: number | null = null;
let blurTimeout: number | null = null;

// Theme Panel State
const themeLoading = ref(false);
const themeError = ref<string | null>(null);
const themeData = ref({
  backgroundColour: '#000000',
  textColour: '#FFFFFF',
  accentColour: '#FFD700',
});

// Image upload state
const heroImageInput = ref<HTMLInputElement | null>(null);
const logoImageInput = ref<HTMLInputElement | null>(null);
const heroImagePreview = ref<string | null>(null);
const logoImagePreview = ref<string | null>(null);
const heroImageFile = ref<File | null>(null);
const logoImageFile = ref<File | null>(null);
const removeHeroImageFlag = ref(false);
const removeLogoImageFlag = ref(false);

// Computed
const renderedRules = computed(() => {
  if (!props.tournament?.rules || !props.tournament.rules.trim()) {
    return '';
  }
  try {
    return marked(props.tournament.rules, { breaks: true });
  } catch {
    return '<p class="text-red-400">Invalid markdown in rules</p>';
  }
});

// Helpers
const getGameLabel = (game: string): string => {
  const labels: Record<string, string> = {
    'bf1942': 'Battlefield 1942',
    'fh2': 'Forgotten Hope 2',
    'bfvietnam': 'Battlefield Vietnam'
  };
  return labels[game] || game;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

// Edit Panel Functions
const openEditPanel = () => {
  formData.value = {
    name: props.tournament.name,
    slug: props.tournament.slug || '',
    organizer: props.tournament.organizer,
    game: props.tournament.game,
    anticipatedRoundCount: props.tournament.anticipatedRoundCount,
    status: props.tournament.status || 'draft',
    gameMode: props.tournament.gameMode || 'Conquest',
    discordUrl: props.tournament.discordUrl || '',
    youTubeUrl: props.tournament.youTubeUrl || '',
    twitchUrl: props.tournament.twitchUrl || '',
    forumUrl: props.tournament.forumUrl || '',
    promoVideoUrl: props.tournament.promoVideoUrl || '',
    rules: props.tournament.rules || '',
    registrationRules: props.tournament.registrationRules || '',
  };
  formError.value = null;
  currentView.value = 'editDetails';
};

const closeEditPanel = () => {
  currentView.value = 'list';
  formError.value = null;
};

const submitEditForm = async () => {
  if (!formData.value.name.trim() || !formData.value.organizer.trim()) return;

  formLoading.value = true;
  formError.value = null;

  try {
    await adminTournamentService.updateTournament(props.tournament.id, {
      name: formData.value.name.trim(),
      slug: formData.value.slug.trim() || undefined,
      organizer: formData.value.organizer.trim(),
      game: formData.value.game,
      anticipatedRoundCount: formData.value.anticipatedRoundCount || undefined,
      status: formData.value.status,
      gameMode: formData.value.gameMode || undefined,
      discordUrl: formData.value.discordUrl.trim() || undefined,
      youTubeUrl: formData.value.youTubeUrl.trim() || undefined,
      twitchUrl: formData.value.twitchUrl.trim() || undefined,
      forumUrl: formData.value.forumUrl.trim() || undefined,
      promoVideoUrl: formData.value.promoVideoUrl.trim() || undefined,
      rules: formData.value.rules.trim() || undefined,
      registrationRules: formData.value.registrationRules.trim() || undefined,
    });

    closeEditPanel();
    emit('refresh');
  } catch (err) {
    console.error('Error updating tournament:', err);
    formError.value = err instanceof Error ? err.message : 'Failed to update tournament';
  } finally {
    formLoading.value = false;
  }
};

// Player search
const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
    return;
  }

  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) throw new Error('Failed to search');
    const data = await response.json();
    playerSuggestions.value = data.items || [];
    showPlayerDropdown.value = playerSuggestions.value.length > 0;
  } catch {
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
  }
};

const onOrganizerInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchPlayers(formData.value.organizer);
  }, 300) as unknown as number;
};

const onOrganizerBlur = () => {
  blurTimeout = setTimeout(() => {
    showPlayerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectPlayer = (player: PlayerSearchResult) => {
  formData.value.organizer = player.playerName;
  playerSuggestions.value = [];
  showPlayerDropdown.value = false;
};

// Theme Panel Functions
const openThemePanel = async () => {
  themeData.value = {
    backgroundColour: props.tournament.theme?.backgroundColour || '#000000',
    textColour: props.tournament.theme?.textColour || '#FFFFFF',
    accentColour: props.tournament.theme?.accentColour || '#FFD700',
  };
  themeError.value = null;
  heroImageFile.value = null;
  logoImageFile.value = null;
  removeHeroImageFlag.value = false;
  removeLogoImageFlag.value = false;

  // Load existing images
  heroImagePreview.value = null;
  logoImagePreview.value = null;

  currentView.value = 'editTheme';

  if (props.tournament.hasHeroImage) {
    await loadHeroImage();
  }
  if (props.tournament.hasCommunityLogo) {
    await loadLogoImage();
  }
};

const closeThemePanel = () => {
  currentView.value = 'list';
  themeError.value = null;
  // Clean up blob URLs
  if (heroImagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(heroImagePreview.value);
  }
  if (logoImagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(logoImagePreview.value);
  }
};

const loadHeroImage = async () => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/stats/admin/tournaments/${props.tournament.id}/image`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const blob = await response.blob();
      heroImagePreview.value = URL.createObjectURL(blob);
    }
  } catch {
    console.debug('No hero image available');
  }
};

const loadLogoImage = async () => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/stats/admin/tournaments/${props.tournament.id}/logo`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const blob = await response.blob();
      logoImagePreview.value = URL.createObjectURL(blob);
    }
  } catch {
    console.debug('No logo image available');
  }
};

const triggerHeroUpload = () => heroImageInput.value?.click();
const triggerLogoUpload = () => logoImageInput.value?.click();

const handleHeroImageSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) processImage(file, 'hero');
};

const handleLogoImageSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) processImage(file, 'logo');
};

const processImage = (file: File, type: 'hero' | 'logo') => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    themeError.value = 'Invalid file type. Use JPEG, PNG, GIF, or WEBP.';
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    themeError.value = 'File size must be less than 4MB.';
    return;
  }

  themeError.value = null;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (type === 'hero') {
      heroImageFile.value = file;
      heroImagePreview.value = e.target?.result as string;
      removeHeroImageFlag.value = false;
    } else {
      logoImageFile.value = file;
      logoImagePreview.value = e.target?.result as string;
      removeLogoImageFlag.value = false;
    }
  };
  reader.readAsDataURL(file);
};

const removeHeroImage = () => {
  heroImageFile.value = null;
  heroImagePreview.value = null;
  removeHeroImageFlag.value = true;
  if (heroImageInput.value) heroImageInput.value.value = '';
};

const removeLogoImage = () => {
  logoImageFile.value = null;
  logoImagePreview.value = null;
  removeLogoImageFlag.value = true;
  if (logoImageInput.value) logoImageInput.value.value = '';
};

const applyPreset = (preset: string) => {
  const presets: Record<string, { backgroundColour: string; textColour: string; accentColour: string }> = {
    dark: { backgroundColour: '#000000', textColour: '#FFFFFF', accentColour: '#FFD700' },
    light: { backgroundColour: '#FFFFFF', textColour: '#000000', accentColour: '#0066CC' },
    cyberpunk: { backgroundColour: '#0a0e27', textColour: '#FFFFFF', accentColour: '#FF00FF' },
    ocean: { backgroundColour: '#0f2c5c', textColour: '#FFFFFF', accentColour: '#00FFFF' },
  };
  const p = presets[preset];
  if (p) themeData.value = { ...p };
};

const submitThemeForm = async () => {
  themeLoading.value = true;
  themeError.value = null;

  try {
    const request: any = {
      theme: {
        backgroundColour: themeData.value.backgroundColour,
        textColour: themeData.value.textColour,
        accentColour: themeData.value.accentColour,
      },
    };

    // Handle hero image
    if (heroImageFile.value) {
      const imageData = await adminTournamentService.imageToBase64(heroImageFile.value);
      request.heroImageBase64 = imageData.base64;
      request.heroImageContentType = imageData.contentType;
    } else if (removeHeroImageFlag.value) {
      request.RemoveHeroImage = true;
    }

    // Handle logo image
    if (logoImageFile.value) {
      const logoData = await adminTournamentService.imageToBase64(logoImageFile.value);
      request.communityLogoBase64 = logoData.base64;
      request.communityLogoContentType = logoData.contentType;
    } else if (removeLogoImageFlag.value) {
      request.RemoveCommunityLogo = true;
    }

    await adminTournamentService.updateTournament(props.tournament.id, request);
    closeThemePanel();
    emit('refresh');
  } catch (err) {
    console.error('Error updating theme:', err);
    themeError.value = err instanceof Error ? err.message : 'Failed to update theme';
  } finally {
    themeLoading.value = false;
  }
};

// Cleanup
onUnmounted(() => {
  if (heroImagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(heroImagePreview.value);
  }
  if (logoImagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(logoImagePreview.value);
  }
});

// Expose load method for parent to trigger refresh
const load = () => {
  // Settings data comes from parent, nothing to load here
};

defineExpose({ load });
</script>

<style scoped>
.tournament-settings-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.label-with-help {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.label-with-help .portal-form-label {
  margin-bottom: 0;
}

.markdown-help-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text);
  cursor: pointer;
  transition: all 0.2s;
}

.markdown-help-btn:hover {
  background: var(--portal-accent-dim);
  border-color: var(--portal-accent);
  color: var(--portal-accent);
}

.portal-card-subtitle {
  font-size: 0.75rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .settings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .settings-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--portal-accent);
  font-family: ui-monospace, monospace;
  text-transform: uppercase;
}

.setting-value {
  font-size: 0.875rem;
  color: var(--portal-text-bright);
}

.theme-preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--portal-border);
}

.theme-row:last-child {
  border-bottom: none;
}

.rules-preview {
  max-height: 400px;
  overflow-y: auto;
}

/* Social Links Grid */
.social-links-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@media (min-width: 480px) {
  .social-links-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.social-link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.social-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Image Upload */
.image-upload-area {
  border: 1px dashed var(--portal-border);
  border-radius: 2px;
  overflow: hidden;
}

.image-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: pointer;
  transition: background 0.2s;
}

.image-upload-placeholder:hover {
  background: var(--portal-accent-dim);
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.upload-text {
  font-size: 0.75rem;
  color: var(--portal-text);
}

.image-preview {
  position: relative;
  aspect-ratio: 16/4;
}

.image-preview--logo {
  aspect-ratio: 4/3;
  max-height: 150px;
}

.image-preview--clickable {
  cursor: pointer;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s;
}

.image-preview--clickable:hover img {
  opacity: 0.7;
}

.image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.image-preview--clickable:hover .image-overlay {
  opacity: 1;
}

.image-overlay-text {
  color: var(--portal-text-bright);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  padding: 0.5rem 1rem;
  background: var(--portal-surface);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
}

.image-remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: none;
  background: var(--portal-danger);
  color: white;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s, transform 0.2s;
}

.image-remove-btn:hover {
  background: var(--portal-danger);
  transform: scale(1.1);
  box-shadow: 0 0 8px var(--portal-danger-glow);
}

.hidden-input {
  display: none;
}

/* Color Input */
.color-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 3rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  cursor: pointer;
  background: transparent;
}

.color-text-input {
  flex: 1;
}

/* Theme Presets */
.theme-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.5rem;
  font-size: 0.75rem;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  color: var(--portal-text-bright);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: var(--portal-accent-dim);
  border-color: var(--portal-accent);
}

/* Markdown rules styling */
.markdown-rules :deep(h1),
.markdown-rules :deep(h2),
.markdown-rules :deep(h3),
.markdown-rules :deep(h4),
.markdown-rules :deep(h5),
.markdown-rules :deep(h6) {
  color: var(--portal-text-bright);
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-rules :deep(p) {
  margin-bottom: 0.5rem;
  color: var(--portal-text-bright);
}

.markdown-rules :deep(strong) {
  font-weight: 600;
  color: var(--portal-accent);
}

.markdown-rules :deep(em) {
  color: var(--portal-text-bright);
  font-style: italic;
}

.markdown-rules :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.markdown-rules :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.markdown-rules :deep(li) {
  margin-bottom: 0.25rem;
  color: var(--portal-text-bright);
  margin-left: 1rem;
}

.markdown-rules :deep(code) {
  background-color: var(--portal-surface-elevated);
  padding: 0.125rem 0.375rem;
  border-radius: 2px;
  color: var(--portal-warn);
  font-family: ui-monospace, monospace;
}

.markdown-rules :deep(blockquote) {
  border-left: 3px solid var(--portal-border);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--portal-text);
}

.markdown-rules :deep(a) {
  color: var(--portal-accent);
  text-decoration: underline;
}

.markdown-rules :deep(a:hover) {
  color: #00f5a8;
}

.markdown-rules :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  overflow: hidden;
}

.markdown-rules :deep(th) {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--portal-accent);
  background: var(--portal-surface-elevated);
  border-bottom: 1px solid var(--portal-border);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: ui-monospace, monospace;
}

.markdown-rules :deep(td) {
  padding: 0.5rem 0.75rem;
  color: var(--portal-text-bright);
  border-bottom: 1px solid var(--portal-border);
}

.markdown-rules :deep(tbody tr:hover) {
  background: var(--portal-accent-dim);
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}
</style>
