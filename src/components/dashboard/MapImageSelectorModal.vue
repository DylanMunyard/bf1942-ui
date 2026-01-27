<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {{ step === 'folders' ? 'Select Tournament' : 'Select Map Image' }}
            </h2>
            <p class="text-slate-400 text-sm mt-1">
              {{ step === 'folders'
                ? 'Choose a tournament folder to browse map images'
                : `Browse images in "${selectedFolder}"`
              }}
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
      <div class="flex-1 overflow-y-auto p-6 flex flex-col">
        <!-- Folder Selection Step -->
        <div v-if="step === 'folders'">
          <div v-if="loadingFolders" class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>

          <div v-else-if="folders.length === 0" class="text-center py-12">
            <p class="text-slate-400">No tournament folders found</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="folder in folders"
              :key="folder"
              class="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:bg-slate-800/50 hover:border-cyan-500/50 transition-all text-left group"
              @click="selectFolder(folder)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {{ folder }}
                  </p>
                </div>
                <svg class="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- Image Selection Step -->
        <div v-else class="flex flex-col h-full">
          <!-- Back Button and Breadcrumb -->
          <div class="mb-4 flex items-center gap-3 flex-shrink-0">
            <button
              class="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all flex items-center gap-1 text-sm"
              @click="step = 'folders'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <p class="text-sm text-slate-400">
              <span class="font-medium text-slate-300">{{ selectedFolder }}</span>
            </p>
          </div>

          <!-- Two-column layout: Images on left, preview on right (desktop), stacked on mobile -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
            <!-- Left side: Image grid -->
            <div class="lg:col-span-2 flex flex-col overflow-hidden">
              <!-- Loading State -->
              <div v-if="loadingImages" class="flex items-center justify-center py-12">
                <div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>

              <!-- Error State -->
              <div v-else-if="imageError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p class="text-red-400 text-sm">{{ imageError }}</p>
              </div>

              <!-- No Images State -->
              <div v-else-if="images.length === 0" class="text-center py-12">
                <p class="text-slate-400">No images found in this folder</p>
              </div>

              <!-- Image Grid -->
              <div v-else class="flex flex-col gap-4 overflow-y-auto flex-1">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    v-for="image in images"
                    :key="image.id"
                    type="button"
                    :class="[
                      'rounded-lg border overflow-hidden hover:border-cyan-500/50 transition-all bg-slate-800/20 relative aspect-video flex items-center justify-center cursor-pointer',
                      selectedImage?.id === image.id
                        ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                        : 'border-slate-700/30'
                    ]"
                    @click="selectedImage = image"
                  >
                    <!-- Image Thumbnail -->
                    <img
                      :src="image.thumbnail"
                      :alt="image.fileName"
                      class="w-full h-full object-cover hover:scale-105 transition-transform"
                    />

                    <!-- Selection Indicator -->
                    <div v-if="selectedImage?.id === image.id" class="absolute top-2 right-2 pointer-events-none">
                      <div class="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>

                <!-- Pagination Controls -->
                <div v-if="totalPages > 1" class="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg flex-shrink-0">
                  <div class="text-xs text-slate-400">
                    Page <span class="font-medium text-slate-300">{{ currentPage }}</span> / <span class="font-medium text-slate-300">{{ totalPages }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="currentPage > 1"
                      class="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded transition-all"
                      @click="loadPreviousPage"
                      :disabled="loadingImages"
                    >
                      ←
                    </button>
                    <button
                      v-if="currentPage < totalPages"
                      class="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-all"
                      @click="loadNextPage"
                      :disabled="loadingImages"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right side: Selected Image Preview (desktop) or below (mobile) -->
            <div class="lg:col-span-1 flex flex-col">
              <div v-if="selectedImage" class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden flex flex-col h-full">
                <!-- Preview Image -->
                <div class="flex-1 bg-slate-900 overflow-hidden flex items-center justify-center min-h-32 cursor-pointer relative group" @click="showImagePreview = true">
                  <img
                    :src="selectedImage.thumbnail"
                    :alt="selectedImage.fileName"
                    class="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                  <!-- Magnifying glass only shows on preview hover -->
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>

                <!-- Metadata -->
                <div class="p-4 border-t border-slate-700/30 space-y-3">
                  <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filename</p>
                    <p class="text-sm font-mono text-slate-200 break-all mt-1">{{ selectedImage.fileName }}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dimensions</p>
                      <p class="text-sm text-slate-200 mt-1">{{ selectedImage.width }}×{{ selectedImage.height }}px</p>
                    </div>
                    <div>
                      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Size</p>
                      <p class="text-sm text-slate-200 mt-1">{{ formatFileSize(selectedImage.fileSize) }}</p>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Path</p>
                    <p class="text-xs font-mono text-cyan-400 break-all mt-1">{{ selectedImage.relativePath }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-dashed border-slate-700/50 rounded-lg p-6 flex items-center justify-center text-center h-full">
                <div>
                  <div class="text-4xl mb-3">🖼️</div>
                  <p class="text-sm text-slate-400">Select an image to preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="step === 'images'" class="sticky bottom-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6">
        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            v-if="selectedImage"
            class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            @click="confirmSelection"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Confirm Selection
          </button>
          <div v-else class="text-sm text-slate-400">
            Select an image to continue
          </div>
        </div>
      </div>
    </div>

    <!-- Full Image Preview Modal -->
    <div
      v-if="showImagePreview && selectedImage"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="showImagePreview = false"
    >
      <div class="relative max-w-4xl max-h-[90vh] w-full">
        <button
          class="absolute -top-10 right-0 text-slate-400 hover:text-slate-200 transition-colors"
          @click="showImagePreview = false"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          :src="selectedImage.thumbnail"
          :alt="selectedImage.fileName"
          class="w-full h-full object-contain rounded-lg"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ImageData {
  id: number;
  fileName: string;
  relativePath: string;
  thumbnail: string;
  width: number;
  height: number;
  fileSize: number;
}

interface Props {
  tournamentId: number;
  initialFolder?: string; // Optional: pre-select folder from image path
  initialImagePath?: string; // Optional: pre-select image by path
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  imageSelected: [imagePath: string];
}>();

const step = ref<'folders' | 'images'>('folders');
const loadingFolders = ref(false);
const loadingImages = ref(false);
const folders = ref<string[]>([]);
const images = ref<ImageData[]>([]);
const selectedFolder = ref('');
const selectedImage = ref<ImageData | null>(null);
const imageError = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const pageSize = 10;
const showImagePreview = ref(false);

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const fetchFolders = async () => {
  loadingFolders.value = true;
  try {
    const response = await fetch('/stats/admin/images/folders', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image folders');
    }

    const data = await response.json();
    folders.value = data.folders || [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    folders.value = [];
  } finally {
    loadingFolders.value = false;
  }
};

const loadImagesFromFolder = async (folder: string, page: number) => {
  loadingImages.value = true;
  imageError.value = '';

  try {
    const response = await fetch(
      `/stats/admin/images/folders/${encodeURIComponent(folder)}?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch images from folder');
    }

    const data = await response.json();
    // Convert base64 thumbnails to data URLs
    images.value = (data.images || []).map((image: ImageData) => ({
      ...image,
      thumbnail: `data:image/png;base64,${image.thumbnail}`
    }));
    currentPage.value = data.page;
    totalPages.value = data.totalPages;
    totalItems.value = data.totalItems;

    // Auto-select the image if initialImagePath is provided
    if (props.initialImagePath && page === 1) {
      const imageToSelect = images.value.find(img => img.relativePath === props.initialImagePath);
      if (imageToSelect) {
        selectedImage.value = imageToSelect;
      }
    }
  } catch (error) {
    console.error('Error fetching images:', error);
    imageError.value = error instanceof Error ? error.message : 'Failed to load images';
  } finally {
    loadingImages.value = false;
  }
};

const selectFolder = async (folder: string) => {
  selectedFolder.value = folder;
  selectedImage.value = null;
  currentPage.value = 1;
  await loadImagesFromFolder(folder, 1);
  step.value = 'images';
};

const loadNextPage = async () => {
  if (currentPage.value < totalPages.value) {
    await loadImagesFromFolder(selectedFolder.value, currentPage.value + 1);
  }
};

const loadPreviousPage = async () => {
  if (currentPage.value > 1) {
    await loadImagesFromFolder(selectedFolder.value, currentPage.value - 1);
  }
};

const confirmSelection = () => {
  if (selectedImage.value) {
    emit('imageSelected', selectedImage.value.relativePath);
    emit('close');
  }
};

// Initialize: fetch folders or load initial folder if provided
const initializeModal = async () => {
  if (props.initialFolder) {
    // Skip folder selection and go straight to images
    selectedFolder.value = props.initialFolder;
    await loadImagesFromFolder(props.initialFolder, 1);
    step.value = 'images';
  } else {
    // Start with folder selection
    await fetchFolders();
  }
};

initializeModal();
</script>

<style scoped src="./MapImageSelectorModal.vue.css"></style>
