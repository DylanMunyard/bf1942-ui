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
      <div class="flex-1 overflow-y-auto p-6">
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
        <div v-else>
          <!-- Back Button and Breadcrumb -->
          <div class="mb-6 flex items-center gap-3">
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
          <div v-else class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                v-for="image in images"
                :key="image.id"
                type="button"
                :class="[
                  'group rounded-lg border overflow-hidden hover:border-cyan-500/50 transition-all bg-slate-800/20 relative',
                  selectedImage?.id === image.id
                    ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                    : 'border-slate-700/30'
                ]"
                @click="selectedImage = image"
              >
                <!-- Image Thumbnail -->
                <div class="bg-slate-900 overflow-hidden aspect-video flex items-center justify-center">
                  <img
                    :src="image.thumbnail"
                    :alt="image.fileName"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <!-- Selection Indicator -->
                <div v-if="selectedImage?.id === image.id" class="absolute top-2 right-2">
                  <div class="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>

                <!-- Image Info -->
                <div class="p-3 space-y-2 border-t border-slate-700/30">
                  <p class="text-xs font-mono text-slate-300 truncate group-hover:text-cyan-400 transition-colors" :title="image.fileName">
                    {{ image.fileName }}
                  </p>
                  <div class="text-xs text-slate-500 space-y-0.5">
                    <p>{{ image.width }}×{{ image.height }}px</p>
                    <p>{{ formatFileSize(image.fileSize) }}</p>
                  </div>
                </div>
              </button>
            </div>

            <!-- Pagination Controls -->
            <div v-if="totalPages > 1" class="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
              <div class="text-sm text-slate-400">
                Page <span class="font-medium text-slate-300">{{ currentPage }}</span> of <span class="font-medium text-slate-300">{{ totalPages }}</span>
                ({{ images.length }} of {{ totalItems }} images)
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="currentPage > 1"
                  class="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-all"
                  @click="loadPreviousPage"
                  :disabled="loadingImages"
                >
                  Previous
                </button>
                <button
                  v-if="currentPage < totalPages"
                  class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-all"
                  @click="loadNextPage"
                  :disabled="loadingImages"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="step === 'images'" class="sticky bottom-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <div v-if="selectedImage" class="text-xs text-slate-400">
            Selected: <span class="text-slate-200 font-mono">{{ selectedImage.relativePath }}</span>
          </div>
          <div v-else class="text-xs text-slate-500">
            Click an image to select it
          </div>
          <button
            v-if="selectedImage"
            class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
            @click="confirmSelection"
          >
            Select Image
          </button>
        </div>
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

// Fetch folders on mount
fetchFolders();
</script>

<style scoped>
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
