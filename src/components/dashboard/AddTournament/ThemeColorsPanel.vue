<template>
  <div class="border-t border-slate-700/30 pt-6">
    <!-- Collapsible Panel Header -->
    <button
      type="button"
      class="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all group"
      @click="isExpanded = !isExpanded"
    >
      <span class="text-lg">🎨</span>
      <span class="text-sm font-medium text-slate-300 flex-1 text-left">
        Theme Configuration <span class="text-slate-500">(Optional)</span>
      </span>
      <svg
        class="w-5 h-5 text-slate-400 transition-transform duration-200 group-hover:text-slate-300"
        :class="isExpanded ? 'rotate-0' : '-rotate-90'"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>

    <!-- Panel Content -->
    <div v-if="isExpanded" class="space-y-4">
      <div class="flex items-center gap-2 mb-4">
        <button
          v-if="!showPreview"
          type="button"
          class="ml-auto text-xs px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded transition-all"
          @click="showPreview = true"
          title="Show live preview"
        >
          👁️ Preview
        </button>
        <button
          v-else
          type="button"
          class="ml-auto text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded transition-all"
          @click="showPreview = false"
          title="Hide preview"
        >
          ✕ Close
        </button>
      </div>

      <p class="text-xs text-slate-400 mb-6">
        Customize 3 core colors to create your unique tournament look. The page will intelligently derive lighter/darker variants.
      </p>

      <div :class="['space-y-6', showPreview && 'grid grid-cols-1 lg:grid-cols-2 lg:gap-6 lg:space-y-0']">
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
                  :value="theme.backgroundColour || '#000000'"
                  type="color"
                  class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                  @change="handleBackgroundColorChange"
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
                v-if="theme.backgroundColour"
                type="button"
                class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                @click="resetBackgroundColor"
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
                  :value="theme.textColour || '#FFFFFF'"
                  type="color"
                  class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                  @change="handleTextColorChange"
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
                v-if="theme.textColour"
                type="button"
                class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                @click="resetTextColor"
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
                  :value="theme.accentColour || '#FFD700'"
                  type="color"
                  class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                  @change="handleAccentColorChange"
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
                v-if="theme.accentColour"
                type="button"
                class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                @click="resetAccentColor"
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
        <div v-if="showPreview" class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <div class="text-xs text-slate-400 mb-3 font-medium">Live Preview:</div>
          <div
            class="rounded-lg overflow-hidden border-2 shadow-xl"
            :style="{
              borderColor: theme.accentColour || '#FFD700',
              backgroundColor: theme.backgroundColour || '#000000'
            }"
          >
            <!-- Mock Tournament Page -->
            <div class="p-6 space-y-4">
              <!-- Header -->
              <div
                class="rounded-lg p-4"
                :style="{ backgroundColor: theme.backgroundColour ? `${theme.backgroundColour}20` : 'rgba(255,215,0,0.1)' }"
              >
                <div :style="{ color: theme.accentColour || '#FFD700' }" class="text-lg font-bold mb-2">Sample Tournament</div>
                <div :style="{ color: theme.textColour || '#FFFFFF' }" class="text-xs">Organizer: Demo Player</div>
              </div>

              <!-- Match Table -->
              <div class="border-2 rounded-lg overflow-hidden" :style="{ borderColor: theme.accentColour || '#FFD700' }">
                <div
                  class="px-3 py-2"
                  :style="{ backgroundColor: theme.backgroundColour ? `${theme.backgroundColour}40` : 'rgba(255,215,0,0.15)' }"
                >
                  <div :style="{ color: theme.textColour || '#FFFFFF' }" class="text-xs font-bold">Matches</div>
                </div>
                <div class="space-y-0 border-t" :style="{ borderColor: theme.accentColour || '#FFD700' }">
                  <div
                    class="px-3 py-2 border-b text-xs flex justify-between"
                    :style="{
                      borderColor: theme.accentColour || '#FFD700',
                      backgroundColor: theme.backgroundColour ? `${theme.backgroundColour}20` : 'rgba(0,0,0,0.3)',
                      color: theme.textColour || '#FFFFFF'
                    }"
                  >
                    <span>Team A vs Team B</span>
                    <button
                      type="button"
                      class="px-2 py-0.5 rounded text-xs transition-colors"
                      :style="{
                        backgroundColor: theme.accentColour ? `${theme.accentColour}33` : 'rgba(255,215,0,0.2)',
                        color: theme.accentColour || '#FFD700',
                        border: `1px solid ${theme.accentColour || '#FFD700'}`
                      }"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>

              <!-- Map List -->
              <div class="space-y-2">
                <div :style="{ color: theme.textColour || '#FFFFFF' }" class="text-xs font-medium">Maps:</div>
                <div
                  v-for="i in 2"
                  :key="i"
                  class="text-xs px-3 py-1.5 rounded flex justify-between"
                  :style="{
                    backgroundColor: theme.backgroundColour ? `${theme.backgroundColour}30` : 'rgba(45,45,45,1)',
                    color: theme.accentColour || '#FFD700'
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { isValidHex } from '@/utils/colorUtils';

interface ThemeColors {
  backgroundColour: string;
  textColour: string;
  accentColour: string;
}

interface Props {
  modelValue: ThemeColors;
}

interface Emits {
  (e: 'update:modelValue', value: ThemeColors): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local reactive copy of theme
const theme = ref<ThemeColors>({ ...props.modelValue });

// Panel state
const isExpanded = ref(false);
const showPreview = ref(false);

// Color input state
const bgColorInput = ref('#000000');
const textColorInput = ref('#FFFFFF');
const accentColorInput = ref('#FFD700');

onMounted(() => {
  // Initialize color inputs from props
  bgColorInput.value = props.modelValue.backgroundColour || '#000000';
  textColorInput.value = props.modelValue.textColour || '#FFFFFF';
  accentColorInput.value = props.modelValue.accentColour || '#FFD700';
});

// Helper to emit updates
const updateTheme = (updates: Partial<ThemeColors>) => {
  theme.value = { ...theme.value, ...updates };
  emit('update:modelValue', theme.value);
};

// Background color handlers
const handleBackgroundColorChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  bgColorInput.value = value;
  updateTheme({ backgroundColour: value });
};

const onBgColorChange = () => {
  let input = bgColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    bgColorInput.value = input;
    updateTheme({ backgroundColour: input });
  } else if (input === '') {
    // Allow clearing the field
    bgColorInput.value = '#000000';
    updateTheme({ backgroundColour: '' });
  }
};

const resetBackgroundColor = () => {
  bgColorInput.value = '#000000';
  updateTheme({ backgroundColour: '' });
};

// Text color handlers
const handleTextColorChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  textColorInput.value = value;
  updateTheme({ textColour: value });
};

const onTextColorChange = () => {
  let input = textColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    textColorInput.value = input;
    updateTheme({ textColour: input });
  } else if (input === '') {
    // Allow clearing the field
    textColorInput.value = '#FFFFFF';
    updateTheme({ textColour: '' });
  }
};

const resetTextColor = () => {
  textColorInput.value = '#FFFFFF';
  updateTheme({ textColour: '' });
};

// Accent color handlers
const handleAccentColorChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  accentColorInput.value = value;
  updateTheme({ accentColour: value });
};

const onAccentColorChange = () => {
  let input = accentColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    accentColorInput.value = input;
    updateTheme({ accentColour: input });
  } else if (input === '') {
    // Allow clearing the field
    accentColorInput.value = '#FFD700';
    updateTheme({ accentColour: '' });
  }
};

const resetAccentColor = () => {
  accentColorInput.value = '#FFD700';
  updateTheme({ accentColour: '' });
};

// Preset application
const applyPreset = (presetName: string) => {
  const presets: Record<string, ThemeColors> = {
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
    bgColorInput.value = preset.backgroundColour;
    textColorInput.value = preset.textColour;
    accentColorInput.value = preset.accentColour;
    updateTheme(preset);
  }
};
</script>
