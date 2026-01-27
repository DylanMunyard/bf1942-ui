<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  modelValue: File | null;
  preview: string | null;
  label: string;
  accept?: string;
  maxSizeMB?: number;
  aspectRatio?: 'hero' | 'logo';
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  maxSizeMB: 4,
  aspectRatio: 'hero'
});

const emit = defineEmits<{
  'update:modelValue': [file: File | null];
  'update:preview': [preview: string | null];
  'remove': [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const error = ref<string | null>(null);
const isDragging = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file: File) => {
  error.value = null;

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    error.value = `Invalid file type. Please use JPEG, PNG, GIF, or WEBP.`;
    return;
  }

  if (file.size > props.maxSizeMB * 1024 * 1024) {
    error.value = `File size must be less than ${props.maxSizeMB}MB.`;
    return;
  }

  emit('update:modelValue', file);

  const reader = new FileReader();
  reader.onload = (e) => {
    emit('update:preview', e.target?.result as string);
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  emit('update:modelValue', null);
  emit('update:preview', null);
  emit('remove');
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-2">
      {{ label }} <span class="text-slate-500">(Optional)</span>
    </label>

    <!-- Image Preview -->
    <div
      v-if="preview"
      class="relative mb-3 rounded-lg overflow-hidden border border-slate-700/50"
      :class="aspectRatio === 'hero' ? '' : 'bg-slate-800/30 p-4 flex items-center justify-center h-32'"
    >
      <img
        :src="preview"
        :alt="label"
        :class="aspectRatio === 'hero' ? 'w-full h-48 object-cover' : 'max-h-28 max-w-full object-contain'"
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
      :class="{ 'border-cyan-500/50 bg-cyan-500/5': isDragging }"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        class="hidden"
        @change="handleFileSelect"
      >
      <div class="text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm font-medium">
          {{ preview ? 'Change Image' : `Upload ${label}` }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          Click or drag & drop (Max {{ maxSizeMB }}MB, JPEG/PNG/GIF/WEBP)
        </p>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-2 text-xs text-red-400">
      {{ error }}
    </p>
  </div>
</template>
