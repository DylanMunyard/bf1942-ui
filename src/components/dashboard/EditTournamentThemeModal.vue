<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            🎨 Theme Configuration
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
        <p class="text-sm text-slate-400 mt-2">
          Customize your tournament's look with 3 core colors. The page intelligently derives lighter/darker variants.
        </p>
      </div>

      <!-- Form -->
      <div class="p-6 space-y-6 flex-1 overflow-y-auto">
        <div :class="['space-y-6', showThemePreview && 'grid grid-cols-1 lg:grid-cols-2 lg:gap-6 lg:space-y-0']">
          <!-- Color Pickers -->
          <div class="space-y-6">
            <!-- Background Color -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Background Color
              </label>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <input
                    :value="formData.backgroundColour || '#000000'"
                    type="color"
                    class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                    @change="(e) => {
                      formData.backgroundColour = (e.target as HTMLInputElement).value;
                      bgColorInput = formData.backgroundColour;
                    }"
                  >
                </div>
                <input
                  v-model="bgColorInput"
                  type="text"
                  placeholder="#000000"
                  class="w-24 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  @blur="onBgColorChange"
                  title="Paste or type hex color"
                >
                <button
                  v-if="formData.backgroundColour"
                  type="button"
                  class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                  @click="() => { formData.backgroundColour = ''; bgColorInput = '#000000'; }"
                  title="Reset to default"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                Main page background. Default: Black (#000000)
              </p>
            </div>

            <!-- Text Color -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Text Color
              </label>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <input
                    :value="formData.textColour || '#FFFFFF'"
                    type="color"
                    class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                    @change="(e) => {
                      formData.textColour = (e.target as HTMLInputElement).value;
                      textColorInput = formData.textColour;
                    }"
                  >
                </div>
                <input
                  v-model="textColorInput"
                  type="text"
                  placeholder="#FFFFFF"
                  class="w-24 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  @blur="onTextColorChange"
                  title="Paste or type hex color"
                >
                <button
                  v-if="formData.textColour"
                  type="button"
                  class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                  @click="() => { formData.textColour = ''; textColorInput = '#FFFFFF'; }"
                  title="Reset to default"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                Main text and headings. Default: White (#FFFFFF)
              </p>
            </div>

            <!-- Accent Color -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Accent Color
              </label>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <input
                    :value="formData.accentColour || '#FFD700'"
                    type="color"
                    class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                    @change="(e) => {
                      formData.accentColour = (e.target as HTMLInputElement).value;
                      accentColorInput = formData.accentColour;
                    }"
                  >
                </div>
                <input
                  v-model="accentColorInput"
                  type="text"
                  placeholder="#FFD700"
                  class="w-24 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  @blur="onAccentColorChange"
                  title="Paste or type hex color"
                >
                <button
                  v-if="formData.accentColour"
                  type="button"
                  class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                  @click="() => { formData.accentColour = ''; accentColorInput = '#FFD700'; }"
                  title="Reset to default"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                Borders, buttons, highlights. Default: Golden (#FFD700)
              </p>
            </div>

            <!-- Quick Presets -->
            <div class="pt-4 border-t border-slate-700/30">
              <p class="text-xs text-slate-400 mb-3 font-medium">Quick Presets:</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                  @click="applyPreset('dark')"
                  title="Black background, white text, golden accents"
                >
                  🌙 Dark Mode
                </button>
                <button
                  type="button"
                  class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                  @click="applyPreset('light')"
                  title="White background, black text, blue accents"
                >
                  ☀️ Light Mode
                </button>
                <button
                  type="button"
                  class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                  @click="applyPreset('cyberpunk')"
                  title="Dark background, white text, neon pink/cyan"
                >
                  ⚡ Cyberpunk
                </button>
                <button
                  type="button"
                  class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                  @click="applyPreset('ocean')"
                  title="Dark blue background, white text, cyan accents"
                >
                  🌊 Ocean
                </button>
              </div>
            </div>
          </div>

          <!-- Live Preview -->
          <div v-if="showThemePreview" class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
            <div class="text-xs text-slate-400 mb-3 font-medium">Live Preview:</div>
            <div
              class="rounded-lg overflow-hidden border-2 shadow-xl"
              :style="{
                borderColor: formData.accentColour || '#FFD700',
                backgroundColor: formData.backgroundColour || '#000000'
              }"
            >
              <!-- Mock Tournament Page -->
              <div class="p-6 space-y-4">
                <!-- Header -->
                <div
                  class="rounded-lg p-4"
                  :style="{ backgroundColor: formData.backgroundColour ? `${formData.backgroundColour}20` : 'rgba(255,215,0,0.1)' }"
                >
                  <div :style="{ color: formData.accentColour || '#FFD700' }" class="text-lg font-bold mb-2">Sample Tournament</div>
                  <div :style="{ color: formData.textColour || '#FFFFFF' }" class="text-xs">Organizer: Demo Player</div>
                </div>

                <!-- Match Table -->
                <div class="border-2 rounded-lg overflow-hidden" :style="{ borderColor: formData.accentColour || '#FFD700' }">
                  <div
                    class="px-3 py-2"
                    :style="{ backgroundColor: formData.backgroundColour ? `${formData.backgroundColour}40` : 'rgba(255,215,0,0.15)' }"
                  >
                    <div :style="{ color: formData.textColour || '#FFFFFF' }" class="text-xs font-bold">Matches</div>
                  </div>
                  <div class="space-y-0 border-t" :style="{ borderColor: formData.accentColour || '#FFD700' }">
                    <div
                      class="px-3 py-2 border-b text-xs flex justify-between"
                      :style="{
                        borderColor: formData.accentColour || '#FFD700',
                        backgroundColor: formData.backgroundColour ? `${formData.backgroundColour}20` : 'rgba(0,0,0,0.3)',
                        color: formData.textColour || '#FFFFFF'
                      }"
                    >
                      <span>Team A vs Team B</span>
                      <button
                        type="button"
                        class="px-2 py-0.5 rounded text-xs transition-colors"
                        :style="{
                          backgroundColor: formData.accentColour ? `${formData.accentColour}33` : 'rgba(255,215,0,0.2)',
                          color: formData.accentColour || '#FFD700',
                          border: `1px solid ${formData.accentColour || '#FFD700'}`
                        }"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Map List -->
                <div class="space-y-2">
                  <div :style="{ color: formData.textColour || '#FFFFFF' }" class="text-xs font-medium">Maps:</div>
                  <div
                    v-for="i in 2"
                    :key="i"
                    class="text-xs px-3 py-1.5 rounded flex justify-between"
                    :style="{
                      backgroundColor: formData.backgroundColour ? `${formData.backgroundColour}30` : 'rgba(45,45,45,1)',
                      color: formData.accentColour || '#FFD700'
                    }"
                  >
                    <span>Map {{ String.fromCharCode(64 + i) }}</span>
                    <span style="opacity: 0.7;">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div
          v-if="showSuccessMessage"
          class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
        >
          <p class="text-sm text-emerald-400">✓ Theme saved successfully! Check the public page to see your changes.</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6 flex items-center gap-3">
        <button
          v-if="!showThemePreview"
          type="button"
          class="text-xs px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded transition-all"
          @click="showThemePreview = true"
          title="Show live preview"
        >
          👁️ Preview
        </button>
        <button
          v-else
          type="button"
          class="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded transition-all"
          @click="showThemePreview = false"
          title="Hide preview"
        >
          ✕ Close Preview
        </button>
        <div class="flex-1" />
        <button
          type="button"
          class="px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          @click="$emit('close')"
        >
          Done
        </button>
        <button
          type="button"
          :disabled="loading"
          class="px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="handleSave"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{{ loading ? 'Saving...' : 'Save Theme' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminTournamentService, type TournamentDetail } from '@/services/adminTournamentService';
import { isValidHex } from '@/utils/colorUtils';

interface Props {
  tournament: TournamentDetail;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
}>();

const formData = ref({
  backgroundColour: '',
  textColour: '',
  accentColour: '',
});

const loading = ref(false);
const error = ref<string | null>(null);
const showThemePreview = ref(false);
const showSuccessMessage = ref(false);

// Theme color input state
const bgColorInput = ref('#000000');
const textColorInput = ref('#FFFFFF');
const accentColorInput = ref('#FFD700');

onMounted(() => {
  if (props.tournament.theme) {
    formData.value = {
      backgroundColour: props.tournament.theme.backgroundColour || '#000000',
      textColour: props.tournament.theme.textColour || '#FFFFFF',
      accentColour: props.tournament.theme.accentColour || '#FFD700',
    };
    bgColorInput.value = formData.value.backgroundColour;
    textColorInput.value = formData.value.textColour;
    accentColorInput.value = formData.value.accentColour;
  }
});

const onBgColorChange = () => {
  let input = bgColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    formData.value.backgroundColour = input;
    bgColorInput.value = input;
  } else if (input === '') {
    formData.value.backgroundColour = '#000000';
    bgColorInput.value = '#000000';
  }
};

const onTextColorChange = () => {
  let input = textColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    formData.value.textColour = input;
    textColorInput.value = input;
  } else if (input === '') {
    formData.value.textColour = '#FFFFFF';
    textColorInput.value = '#FFFFFF';
  }
};

const onAccentColorChange = () => {
  let input = accentColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    formData.value.accentColour = input;
    accentColorInput.value = input;
  } else if (input === '') {
    formData.value.accentColour = '#FFD700';
    accentColorInput.value = '#FFD700';
  }
};

const applyPreset = (presetName: string) => {
  const presets: Record<string, { backgroundColour: string; textColour: string; accentColour: string }> = {
    dark: {
      backgroundColour: '#000000',
      textColour: '#FFFFFF',
      accentColour: '#FFD700',
    },
    light: {
      backgroundColour: '#FFFFFF',
      textColour: '#000000',
      accentColour: '#0066CC',
    },
    cyberpunk: {
      backgroundColour: '#0a0e27',
      textColour: '#FFFFFF',
      accentColour: '#FF00FF',
    },
    ocean: {
      backgroundColour: '#0f2c5c',
      textColour: '#FFFFFF',
      accentColour: '#00FFFF',
    },
  };

  const preset = presets[presetName];
  if (preset) {
    formData.value = { ...preset };
    bgColorInput.value = preset.backgroundColour;
    textColorInput.value = preset.textColour;
    accentColorInput.value = preset.accentColour;
  }
};

const handleSave = async () => {
  loading.value = true;
  error.value = null;
  showSuccessMessage.value = false;

  try {
    await adminTournamentService.updateTournament(props.tournament.id, {
      name: props.tournament.name,
      organizer: props.tournament.organizer,
      game: props.tournament.game,
      theme: {
        backgroundColour: formData.value.backgroundColour || '#000000',
        textColour: formData.value.textColour || '#FFFFFF',
        accentColour: formData.value.accentColour || '#FFD700',
      },
    });

    showSuccessMessage.value = true;
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      showSuccessMessage.value = false;
    }, 3000);
  } catch (err) {
    console.error('Error saving theme:', err);
    error.value = err instanceof Error ? err.message : 'Failed to save theme';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* No additional styles needed for this modal */
</style>
