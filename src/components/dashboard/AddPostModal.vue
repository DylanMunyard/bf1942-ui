<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-5xl w-full shadow-2xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="border-b border-slate-700/50 p-6 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400">
              {{ editMode ? 'Edit Post' : 'Create Post' }}
            </h2>
            <p class="text-slate-400 text-sm mt-1">
              {{ editMode ? 'Update your news post' : 'Create a news post for the tournament feed' }}
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
      <div class="p-6 space-y-6 overflow-y-auto flex-1">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>

        <!-- Post Title -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Title <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="e.g., Week 3 Match Results, Important Announcement"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
            :disabled="loading"
          >
        </div>

        <!-- Post Content -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Content <span class="text-red-400">*</span>
          </label>
          <textarea
            v-model="formData.content"
            rows="12"
            placeholder="Write your post content here. Markdown is supported.&#10;&#10;# Heading&#10;**Bold text** and *italic text*&#10;- List item&#10;[Link text](https://example.com)"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all resize-y font-mono"
            :disabled="loading"
          />

          <!-- Preview Toggle -->
          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              @click="showPreview = !showPreview"
              class="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-200 rounded transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ showPreview ? 'Hide' : 'Show' }} Preview
            </button>
            <span class="text-xs text-slate-500">
              Supports Markdown formatting (headings, bold, lists, links, etc.)
            </span>
          </div>

          <!-- Markdown Preview -->
          <div v-if="showPreview && formData.content.trim()" class="mt-4 bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 overflow-y-auto max-h-72">
            <div class="prose prose-invert prose-sm max-w-none">
              <div
                v-html="renderedContent"
                class="text-slate-300 markdown-content"
              />
            </div>
          </div>
          <div v-else-if="showPreview" class="mt-4 bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center">
            <p class="text-slate-500 text-sm">Enter some content to see the preview</p>
          </div>
        </div>

        <!-- Status and Publish Date Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              v-model="formData.status"
              class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
              :disabled="loading"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <p class="mt-2 text-xs text-slate-500">
              Draft posts are only visible to admins
            </p>
          </div>

          <!-- Publish Date -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Publish Date
            </label>
            <input
              v-model="formData.publishAt"
              type="datetime-local"
              class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
              :disabled="loading"
            >
            <p class="mt-2 text-xs text-slate-500">
              Optional: schedule when the post appears in the feed
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-slate-700/50 p-6 flex items-center justify-end gap-3 flex-shrink-0">
        <button
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          @click="$emit('close')"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          @click="submit"
          :disabled="loading || !isFormValid"
        >
          <svg v-if="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{{ loading ? 'Saving...' : editMode ? 'Update Post' : 'Create Post' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import { adminTournamentService, type TournamentPost, type CreateTournamentPostRequest, type UpdateTournamentPostRequest } from '@/services/adminTournamentService';

interface Props {
  tournamentId: number;
  post?: TournamentPost;
}

interface Emits {
  (e: 'close'): void;
  (e: 'added'): void;
}

const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits<Emits>();

const editMode = computed(() => !!props.post);
const loading = ref(false);
const error = ref<string | null>(null);
const showPreview = ref(false);

// Markdown preview
const renderedContent = computed(() => {
  if (!formData.value.content || !formData.value.content.trim()) {
    return '';
  }
  try {
    return marked(formData.value.content, { breaks: true });
  } catch {
    return '<p class="text-red-400">Invalid markdown</p>';
  }
});

const formData = ref({
  title: '',
  content: '',
  status: 'draft' as 'draft' | 'published',
  publishAt: ''
});

const isFormValid = computed(() => {
  return formData.value.title.trim() && formData.value.content.trim();
});

// Helper to convert ISO string to datetime-local format (in LOCAL time)
const toDateTimeLocal = (isoString: string | null): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    // Format as YYYY-MM-DDTHH:mm for datetime-local input using LOCAL time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

// Helper to convert datetime-local to ISO string
const fromDateTimeLocal = (localString: string): string | null => {
  if (!localString) return null;
  try {
    const date = new Date(localString);
    return date.toISOString();
  } catch {
    return null;
  }
};

watch(
  () => props.post,
  (newPost) => {
    if (newPost) {
      formData.value = {
        title: newPost.title,
        content: newPost.content,
        status: newPost.status,
        publishAt: toDateTimeLocal(newPost.publishAt)
      };
    } else {
      formData.value = {
        title: '',
        content: '',
        status: 'draft',
        publishAt: ''
      };
    }
    error.value = null;
  },
  { immediate: true }
);

const submit = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = null;

  try {
    if (editMode.value && props.post?.id) {
      const updateData: UpdateTournamentPostRequest = {
        title: formData.value.title,
        content: formData.value.content,
        status: formData.value.status,
        publishAt: fromDateTimeLocal(formData.value.publishAt)
      };
      await adminTournamentService.updatePost(
        props.tournamentId,
        props.post.id,
        updateData
      );
    } else {
      const createData: CreateTournamentPostRequest = {
        title: formData.value.title,
        content: formData.value.content,
        status: formData.value.status,
        publishAt: fromDateTimeLocal(formData.value.publishAt)
      };
      await adminTournamentService.createPost(props.tournamentId, createData);
    }
    emit('added');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save post';
    console.error('Error saving post:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped src="./AddPostModal.vue.css"></style>
