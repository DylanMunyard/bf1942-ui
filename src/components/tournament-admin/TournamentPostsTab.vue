<template>
  <div class="tournament-posts-tab">
    <!-- Edit/Create Form View -->
    <div v-if="showForm" class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ {{ editingPost ? 'EDIT POST' : 'CREATE POST' }} ]</h2>
          <p class="portal-card-subtitle">{{ editingPost ? 'Update your news post' : 'Create a news post for the tournament feed' }}</p>
        </div>
        <button
          class="portal-btn portal-btn--ghost"
          @click="closeForm"
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

        <!-- Post Title -->
        <div class="portal-form-section">
          <label class="portal-form-label portal-form-label--required">Title</label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="e.g., Week 3 Match Results, Important Announcement"
            class="portal-form-input"
            :disabled="formLoading"
          >
        </div>

        <!-- Post Content -->
        <div class="portal-form-section">
          <div class="label-with-help">
            <label class="portal-form-label portal-form-label--required">Content</label>
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
            v-model="formData.content"
            rows="12"
            placeholder="Write your post content here. Markdown is supported.&#10;&#10;# Heading&#10;**Bold text** and *italic text*&#10;- List item&#10;[Link text](https://example.com)"
            class="portal-form-textarea portal-form-input--mono"
            :disabled="formLoading"
          />

          <!-- Preview Toggle -->
          <div class="preview-toggle">
            <button
              type="button"
              @click="showPreview = !showPreview"
              class="portal-btn portal-btn--sm portal-btn--ghost"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
            </button>
          </div>

          <!-- Markdown Preview -->
          <div v-if="showPreview && formData.content.trim()" class="markdown-preview">
            <div
              v-html="renderedContent"
              class="markdown-content"
            />
          </div>
          <div v-else-if="showPreview" class="markdown-preview markdown-preview--empty">
            Enter some content to see the preview
          </div>
        </div>

        <!-- Status and Publish Date Row -->
        <div class="portal-form-row">
          <!-- Status -->
          <div class="portal-form-section">
            <label class="portal-form-label">Status</label>
            <select
              v-model="formData.status"
              class="portal-form-select"
              :disabled="formLoading"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <p class="portal-form-hint">Draft posts are only visible to admins</p>
          </div>

          <!-- Publish Date -->
          <div class="portal-form-section">
            <label class="portal-form-label">Publish Date</label>
            <input
              v-model="formData.publishAt"
              type="datetime-local"
              class="portal-form-input portal-form-input--mono"
              :disabled="formLoading"
            >
            <p class="portal-form-hint">Optional: schedule when the post appears</p>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="portal-form-footer" style="margin-top: 1.5rem">
          <button
            class="portal-btn portal-btn--ghost"
            :disabled="formLoading"
            @click="closeForm"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--primary"
            :disabled="formLoading || !isFormValid"
            @click="submitForm"
          >
            <span v-if="formLoading" class="portal-btn-pulse">Saving...</span>
            <span v-else>{{ editingPost ? 'Update Post' : 'Create Post' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Posts List View -->
    <div v-else class="portal-card">
      <div class="portal-card-header">
        <div>
          <h2 class="portal-card-title">[ POSTS ]</h2>
          <p class="portal-card-subtitle">Create news posts for the tournament feed</p>
        </div>
        <button
          class="portal-btn portal-btn--primary"
          @click="openAddForm"
        >
          + Add Post
        </button>
      </div>

      <div class="portal-card-body" style="padding: 0">
        <!-- Posts Table -->
        <div v-if="posts.length > 0" class="portal-table-wrap">
          <table class="portal-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Publish Date</th>
                <th>Created</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in posts" :key="post.id">
                <td>
                  <span class="post-title">{{ post.title }}</span>
                </td>
                <td>
                  <span
                    class="portal-badge"
                    :class="post.status === 'published' ? 'portal-badge--success' : 'portal-badge--muted'"
                  >
                    {{ post.status === 'published' ? 'Published' : 'Draft' }}
                  </span>
                </td>
                <td>
                  <span v-if="post.publishAt">{{ formatDate(post.publishAt) }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>{{ formatDate(post.createdAt) }}</td>
                <td>
                  <div class="portal-table-actions">
                    <button
                      class="portal-icon-btn"
                      @click="openEditForm(post)"
                      title="Edit post"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      class="portal-icon-btn portal-icon-btn--danger"
                      @click="confirmDeletePost(post.id, post.title)"
                      title="Delete post"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="portal-empty">
          <div class="portal-empty-icon">📰</div>
          <h3 class="portal-empty-title">No Posts Yet</h3>
          <p class="portal-empty-desc">
            Create news posts to share updates with tournament participants
          </p>
          <button
            class="portal-btn portal-btn--primary"
            style="margin-top: 1rem"
            @click="openAddForm"
          >
            Create First Post
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Post Confirmation Modal -->
    <div
      v-if="deletePostConfirmation"
      class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
      @click.self="cancelDeletePost"
    >
      <div class="portal-modal">
        <div class="flex items-start gap-4 mb-6">
          <div class="portal-modal-icon portal-modal-icon--danger">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="portal-modal-title">
              Delete Post?
            </h3>
            <p class="portal-modal-text">
              Delete post <span class="portal-modal-highlight">{{ deletePostConfirmation.title }}</span>?
            </p>
            <p class="portal-modal-hint">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="portal-btn portal-btn--ghost"
            @click="cancelDeletePost"
          >
            Cancel
          </button>
          <button
            class="portal-btn portal-btn--danger flex items-center gap-2"
            :disabled="isProcessing"
            @click="executeDeletePost"
          >
            <svg v-if="!isProcessing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{{ isProcessing ? 'Deleting...' : 'Delete Post' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Markdown Help Modal -->
    <MarkdownHelpModal
      :is-visible="showMarkdownHelp"
      @close="showMarkdownHelp = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';
import {
  adminTournamentService,
  type TournamentDetail,
  type TournamentPost,
  type CreateTournamentPostRequest,
  type UpdateTournamentPostRequest
} from '@/services/adminTournamentService';
import MarkdownHelpModal from '@/components/dashboard/MarkdownHelpModal.vue';

const props = defineProps<{
  tournament: TournamentDetail;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

// Posts data (loaded separately from tournament)
const posts = ref<TournamentPost[]>([]);

// Form state
const showForm = ref(false);
const editingPost = ref<TournamentPost | null>(null);
const formLoading = ref(false);
const formError = ref<string | null>(null);
const showPreview = ref(false);

const formData = ref({
  title: '',
  content: '',
  status: 'draft' as 'draft' | 'published',
  publishAt: ''
});
const showMarkdownHelp = ref(false);

const isFormValid = computed(() => {
  return formData.value.title.trim() && formData.value.content.trim();
});

const renderedContent = computed(() => {
  if (!formData.value.content || !formData.value.content.trim()) {
    return '';
  }
  try {
    return marked(formData.value.content, { breaks: true });
  } catch {
    return '<p style="color: var(--portal-danger)">Invalid markdown</p>';
  }
});

// Delete state
const deletePostConfirmation = ref<{ id: number; title: string } | null>(null);
const isProcessing = ref(false);

// Formatting
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

// Helper to convert ISO string to datetime-local format
const toDateTimeLocal = (isoString: string | null): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
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

// Load posts
const loadPosts = async () => {
  try {
    posts.value = await adminTournamentService.getPosts(props.tournament.id);
  } catch (err) {
    console.error('Error loading posts:', err);
    posts.value = [];
  }
};

// Form handlers
const openAddForm = () => {
  editingPost.value = null;
  formData.value = { title: '', content: '', status: 'draft', publishAt: '' };
  formError.value = null;
  showPreview.value = false;
  showForm.value = true;
};

const openEditForm = (post: TournamentPost) => {
  editingPost.value = post;
  formData.value = {
    title: post.title,
    content: post.content,
    status: post.status,
    publishAt: toDateTimeLocal(post.publishAt)
  };
  formError.value = null;
  showPreview.value = false;
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingPost.value = null;
  formError.value = null;
};

const submitForm = async () => {
  if (!isFormValid.value) return;

  formLoading.value = true;
  formError.value = null;

  try {
    if (editingPost.value?.id) {
      const updateData: UpdateTournamentPostRequest = {
        title: formData.value.title,
        content: formData.value.content,
        status: formData.value.status,
        publishAt: fromDateTimeLocal(formData.value.publishAt)
      };
      await adminTournamentService.updatePost(
        props.tournament.id,
        editingPost.value.id,
        updateData
      );
    } else {
      const createData: CreateTournamentPostRequest = {
        title: formData.value.title,
        content: formData.value.content,
        status: formData.value.status,
        publishAt: fromDateTimeLocal(formData.value.publishAt)
      };
      await adminTournamentService.createPost(props.tournament.id, createData);
    }
    closeForm();
    await loadPosts();
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Failed to save post';
    console.error('Error saving post:', err);
  } finally {
    formLoading.value = false;
  }
};

// Delete handlers
const confirmDeletePost = (postId: number, postTitle: string) => {
  deletePostConfirmation.value = { id: postId, title: postTitle };
};

const cancelDeletePost = () => {
  deletePostConfirmation.value = null;
  isProcessing.value = false;
};

const executeDeletePost = async () => {
  if (!deletePostConfirmation.value) return;

  isProcessing.value = true;
  try {
    await adminTournamentService.deletePost(props.tournament.id, deletePostConfirmation.value.id);
    deletePostConfirmation.value = null;
    await loadPosts();
  } catch (err) {
    console.error('Error deleting post:', err);
  } finally {
    isProcessing.value = false;
  }
};

// Expose load method for parent to trigger refresh when tab is selected
const load = () => {
  loadPosts();
};

onMounted(() => {
  loadPosts();
});

defineExpose({ load });
</script>

<style scoped>
.portal-card-subtitle {
  font-size: 0.75rem;
  color: var(--portal-text);
  margin-top: 0.25rem;
}

.post-title {
  font-weight: 500;
  color: var(--portal-accent);
}

.text-muted {
  color: var(--portal-text);
  opacity: 0.6;
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

.preview-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.markdown-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--portal-surface-elevated);
  border: 1px solid var(--portal-border);
  border-radius: 2px;
  max-height: 16rem;
  overflow-y: auto;
}

.markdown-preview--empty {
  color: var(--portal-text);
  opacity: 0.6;
  text-align: center;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  color: var(--portal-text-bright);
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(h1) { font-size: 1.5rem; }
.markdown-content :deep(h2) { font-size: 1.25rem; }
.markdown-content :deep(h3) { font-size: 1.1rem; }

.markdown-content :deep(p) {
  margin-bottom: 0.75rem;
  color: var(--portal-text-bright);
  line-height: 1.6;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--portal-accent);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
  color: var(--portal-text-bright);
}

.markdown-content :deep(a) {
  color: var(--portal-accent);
  text-decoration: underline;
}

.markdown-content :deep(code) {
  background: var(--portal-surface);
  padding: 0.125rem 0.375rem;
  border-radius: 2px;
  font-family: ui-monospace, monospace;
  font-size: 0.875em;
  color: var(--portal-warn);
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--portal-accent);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--portal-text);
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.w-12 {
  width: 3rem;
}

.h-12 {
  height: 3rem;
}
</style>
