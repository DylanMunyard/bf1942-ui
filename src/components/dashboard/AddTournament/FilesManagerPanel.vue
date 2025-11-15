<template>
  <!-- Files Manager Panel -->
  <div class="border-t border-slate-700/30 pt-6">
    <!-- Collapsible Panel Header -->
    <button
      type="button"
      class="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all group"
      @click="isExpanded = !isExpanded"
    >
      <span class="text-lg">📄</span>
      <span class="text-sm font-medium text-slate-300 flex-1 text-left">
        Tournament Files <span class="text-slate-500">(Optional)</span>
      </span>
      <span v-if="modelValue.length > 0" class="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">
        {{ modelValue.length }} file{{ modelValue.length !== 1 ? 's' : '' }}
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
      <p class="text-xs text-slate-500">
        Manage tournament-related files (rules, maps, guides, etc.)
      </p>
      <button
        type="button"
        @click="addFile"
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
      >
        + Add File
      </button>

      <!-- Files List -->
      <div v-if="modelValue.length > 0" class="space-y-2 mb-4">
        <div
          v-for="(file, index) in modelValue"
          :key="index"
          class="flex items-center justify-between gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg"
        >
          <div class="flex-1">
            <div class="text-sm font-medium text-slate-200">{{ file.name }}</div>
            <div class="text-xs text-slate-400 mt-1">
              {{ file.url }}
              <span v-if="file.category" class="text-slate-500"> • {{ file.category }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="editFile(index)"
              class="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
              title="Edit file"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              @click="deleteFile(index)"
              class="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
              title="Delete file"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- File Form Modal -->
      <div v-if="showFileForm" class="mb-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">File Name</label>
          <input
            v-model="editingFileData.name"
            type="text"
            placeholder="e.g., Tournament Rules"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">File URL</label>
          <input
            v-model="editingFileData.url"
            type="url"
            placeholder="https://..."
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Category</label>
          <input
            v-model="editingFileData.category"
            type="text"
            placeholder="e.g., Rules, Maps"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="saveFile"
            class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Save File
          </button>
          <button
            type="button"
            @click="showFileForm = false"
            class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface TournamentFile {
  id?: number;
  name: string;
  url: string;
  category?: string;
  uploadedAt?: string;
}

interface Props {
  modelValue: TournamentFile[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: TournamentFile[]];
}>();

// Panel state
const isExpanded = ref(false);

// File form state
const showFileForm = ref(false);
const editingFileIndex = ref<number | null>(null);
const editingFileData = ref<{ name: string; url: string; category: string }>({
  name: '',
  url: '',
  category: ''
});

// File management functions
const addFile = () => {
  editingFileIndex.value = null;
  editingFileData.value = { name: '', url: '', category: '' };
  showFileForm.value = true;
};

const editFile = (index: number) => {
  editingFileIndex.value = index;
  const file = props.modelValue[index];
  editingFileData.value = {
    name: file.name,
    url: file.url,
    category: file.category || ''
  };
  showFileForm.value = true;
};

const deleteFile = (index: number) => {
  const updatedFiles = [...props.modelValue];
  updatedFiles.splice(index, 1);
  emit('update:modelValue', updatedFiles);
};

const saveFile = () => {
  if (!editingFileData.value.name || !editingFileData.value.url) {
    // Simple validation - could emit an error event if needed
    return;
  }

  const updatedFiles = [...props.modelValue];

  if (editingFileIndex.value !== null) {
    // Update existing file
    updatedFiles[editingFileIndex.value] = { ...editingFileData.value };
  } else {
    // Add new file
    updatedFiles.push({ ...editingFileData.value });
  }

  emit('update:modelValue', updatedFiles);

  // Reset form
  showFileForm.value = false;
  editingFileIndex.value = null;
  editingFileData.value = { name: '', url: '', category: '' };
};
</script>
