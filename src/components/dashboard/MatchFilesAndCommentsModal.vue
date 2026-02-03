<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 portal-modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="portal-modal portal-modal--large">
      <!-- Header -->
      <div class="portal-modal-header">
        <div>
          <h2 class="portal-modal-title--large" style="color: var(--portal-accent);">
            Match Files & Comments
          </h2>
          <p v-if="match" class="portal-modal-hint mt-1">
            {{ match.team1Name }} vs {{ match.team2Name }} • {{ formatMatchDate(match.scheduledDate) }}
          </p>
        </div>
        <button
          class="portal-modal-close"
          @click="$emit('close')"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="portal-modal-content space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style="border-color: var(--portal-accent-dim); border-top-color: var(--portal-accent);" />
            <p class="portal-modal-hint">Loading files and comments...</p>
          </div>
        </div>

        <template v-else>
          <!-- Error Message -->
          <div v-if="error" class="portal-card" style="background: var(--portal-danger-glow); border-color: rgba(239, 68, 68, 0.3);">
            <p style="color: var(--portal-danger); font-size: 0.875rem;">{{ error }}</p>
          </div>

          <!-- Files Panel -->
          <div class="space-y-3 portal-card">
            <!-- Add Link Input -->
            <div class="space-y-2">
              <div>
                <h3 class="portal-modal-section-title">📎 Links</h3>
                <p class="portal-modal-hint mt-1">Paste URL (auto-fills name), press Enter to add</p>
              </div>

              <!-- Compact Link Input -->
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="newFile.url"
                    type="url"
                    placeholder="https://..."
                    class="flex-1 portal-input"
                    :disabled="isProcessing"
                    @input="autoFillFileDetails"
                    @keydown.enter.prevent="addNewFile"
                  >
                  <button
                    @click="addNewFile"
                    :disabled="isProcessing || !newFile.url.trim()"
                    class="portal-btn portal-btn--ghost"
                    title="Add link (or press Enter)"
                  >
                    +
                  </button>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newFile.name"
                    type="text"
                    placeholder="File name (auto-filled)"
                    class="flex-1 portal-input"
                    :disabled="isProcessing"
                    @keydown.enter.prevent="addNewFile"
                  >
                  <input
                    v-model="newFile.tags"
                    type="text"
                    placeholder="gameplay"
                    class="w-24 portal-input"
                    :disabled="isProcessing"
                    @keydown.enter.prevent="addNewFile"
                  >
                </div>
              </div>
            </div>

            <!-- Files List -->
            <div v-if="existingFiles.length > 0" class="space-y-2 border-t" style="border-color: var(--portal-border); padding-top: 0.75rem;">
              <div
                v-for="file in existingFiles"
                :key="file.id"
                :class="[
                  'portal-card transition-all p-3',
                  editingFileId === file.id ? '' : (file.isNew ? 'animate-pulse-once' : 'group')
                ]"
                :style="editingFileId === file.id ? 'background: var(--portal-surface-elevated); border-color: var(--portal-accent);' : (file.isNew ? 'background: var(--portal-accent-dim); border-color: var(--portal-accent);' : '')"
              >
                <!-- View Mode -->
                <div v-if="editingFileId !== file.id" class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <a
                        :href="file.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs font-medium break-all"
                        style="color: var(--portal-accent);"
                        onmouseover="this.style.color='var(--portal-accent)'"
                        onmouseout="this.style.color='var(--portal-accent)'"
                      >
                        {{ file.name }} ↗️
                      </a>
                      <span v-if="file.isNew" class="text-xs px-2 py-0.5 rounded" style="background: var(--portal-accent-dim); color: var(--portal-accent);">Unsaved</span>
                    </div>
                    <p class="portal-modal-hint truncate mt-0.5">{{ file.url }}</p>
                    <p v-if="file.tags" class="text-xs mt-1" style="color: var(--portal-text);">{{ file.tags }}</p>
                  </div>
                  <div class="flex-shrink-0 flex gap-2">
                    <button
                      @click="startEditFile(file)"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      style="color: var(--portal-text);"
                      onmouseover="this.style.color='var(--portal-accent)'"
                      onmouseout="this.style.color='var(--portal-text)'"
                      title="Edit file"
                    >
                      ✎
                    </button>
                    <button
                      @click="deleteExistingFile(file.id)"
                      :disabled="isProcessing"
                      :class="[
                        'px-2 py-1 text-xs transition-colors disabled:opacity-50',
                        file.isNew ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      ]"
                      style="color: var(--portal-danger);"
                      onmouseover="this.style.color='var(--portal-danger)'"
                      onmouseout="this.style.color='var(--portal-danger)'"
                      title="Delete file"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Edit Mode -->
                <div v-else class="space-y-2">
                  <input
                    v-model="editingFile.name"
                    type="text"
                    placeholder="File name"
                    class="w-full portal-input"
                    :disabled="isProcessing"
                  />
                  <input
                    v-model="editingFile.url"
                    type="url"
                    placeholder="https://..."
                    class="w-full portal-input"
                    :disabled="isProcessing"
                  />
                  <input
                    v-model="editingFile.tags"
                    type="text"
                    placeholder="gameplay"
                    class="w-full portal-input"
                    :disabled="isProcessing"
                  />
                  <div class="flex justify-end gap-2">
                    <button
                      @click="cancelEditFile"
                      :disabled="isProcessing"
                      class="portal-btn portal-btn--ghost"
                    >
                      Cancel
                    </button>
                    <button
                      @click="saveEditFile(file.id as number)"
                      :disabled="isProcessing"
                      class="portal-btn portal-btn--primary"
                    >
                      {{ isProcessing ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Files Message -->
            <div v-else class="text-center py-4 portal-modal-hint border-t" style="border-color: var(--portal-border); padding-top: 0.75rem;">
              No files yet
            </div>
          </div>

          <!-- Comments Panel -->
          <div class="space-y-3 portal-card">
            <!-- Add Comment Input -->
            <div class="space-y-2">
              <div>
                <h3 class="portal-modal-section-title">💬 Comments</h3>
                <p class="portal-modal-hint mt-1">Paste comment, press Enter to add</p>
              </div>

              <!-- Comments Input with Auto-Add -->
              <div class="relative space-y-2">
                <textarea
                  v-model="newComment"
                  @keydown.enter.exact.prevent="addNewComment"
                  placeholder="Your comment..."
                  class="w-full portal-input resize-none"
                  :disabled="isProcessing"
                  rows="2"
                />
                <div class="flex justify-end">
                  <button
                    @click="addNewComment"
                    :disabled="isProcessing || !newComment.trim()"
                    class="portal-btn portal-btn--ghost"
                    title="Add comment (or press Enter)"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <!-- Comments List -->
            <div v-if="existingComments.length > 0" class="space-y-2 border-t" style="border-color: var(--portal-border); padding-top: 0.75rem;">
              <div
                v-for="comment in existingComments"
                :key="comment.id"
                :class="[
                  'portal-card transition-all p-3',
                  editingCommentId === comment.id ? '' : (comment.isNew ? 'animate-pulse-once' : 'group')
                ]"
                :style="editingCommentId === comment.id ? 'background: var(--portal-surface-elevated); border-color: var(--portal-accent);' : (comment.isNew ? 'background: var(--portal-accent-dim); border-color: var(--portal-accent);' : '')"
              >
                <!-- View Mode -->
                <div v-if="editingCommentId !== comment.id" class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-xs break-words whitespace-pre-wrap flex-1" style="color: var(--portal-text-bright);">{{ comment.content }}</p>
                      <span v-if="comment.isNew" class="flex-shrink-0 text-xs px-2 py-0.5 rounded" style="background: var(--portal-accent-dim); color: var(--portal-accent);">Unsaved</span>
                    </div>
                    <p class="portal-modal-hint mt-1">{{ formatCommentDate(comment.createdAt) }}</p>
                  </div>
                  <div class="flex-shrink-0 flex gap-2">
                    <button
                      @click="startEditComment(comment)"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      style="color: var(--portal-text);"
                      onmouseover="this.style.color='var(--portal-accent)'"
                      onmouseout="this.style.color='var(--portal-text)'"
                      title="Edit comment"
                    >
                      ✎
                    </button>
                    <button
                      @click="deleteExistingComment(comment.id)"
                      :disabled="isProcessing"
                      :class="[
                        'px-2 py-1 text-xs transition-colors disabled:opacity-50',
                        comment.isNew ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      ]"
                      style="color: var(--portal-danger);"
                      onmouseover="this.style.color='var(--portal-danger)'"
                      onmouseout="this.style.color='var(--portal-danger)'"
                      title="Delete comment"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Edit Mode -->
                <div v-else class="space-y-2">
                  <textarea
                    v-model="editingComment"
                    placeholder="Comment..."
                    class="w-full portal-input resize-none"
                    :disabled="isProcessing"
                    rows="3"
                  />
                  <div class="flex justify-end gap-2">
                    <button
                      @click="cancelEditComment"
                      :disabled="isProcessing"
                      class="portal-btn portal-btn--ghost"
                    >
                      Cancel
                    </button>
                    <button
                      @click="saveEditComment(comment.id as number)"
                      :disabled="isProcessing"
                      class="portal-btn portal-btn--primary"
                    >
                      {{ isProcessing ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Comments Message -->
            <div v-else class="text-center py-4 portal-modal-hint border-t" style="border-color: var(--portal-border); padding-top: 0.75rem;">
              No comments yet
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="portal-modal-footer flex items-center justify-end gap-3">
        <button
          class="portal-btn portal-btn--ghost"
          @click="$emit('close')"
          :disabled="isProcessing"
        >
          Cancel
        </button>
        <button
          class="portal-btn portal-btn--primary flex items-center gap-2"
          @click="handleSave"
          :disabled="isProcessing || (newFiles.length === 0 && newComments.length === 0)"
          :title="newFiles.length === 0 && newComments.length === 0 ? 'No unsaved items to save' : ''"
        >
          <div v-if="isProcessing" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span v-if="isProcessing">Saving...</span>
          <span v-else>Save {{ newFiles.length + newComments.length }} Item{{ newFiles.length + newComments.length !== 1 ? 's' : '' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminTournamentService, type TournamentMatch, type MatchFile, type MatchComment, type CreateMatchFileRequest, type CreateMatchCommentRequest } from '@/services/adminTournamentService';

interface Props {
  match: TournamentMatch | null;
  tournamentId: number;
}

interface FileEntry {
  name: string;
  url: string;
  tags: string;
  isNew?: boolean;
}

interface CommentEntry {
  content: string;
  isNew?: boolean;
}

interface DisplayFile extends MatchFile {
  isNew?: boolean;
}

interface DisplayComment extends MatchComment {
  isNew?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const isLoading = ref(true);
const isProcessing = ref(false);
const error = ref<string | null>(null);

const existingFiles = ref<DisplayFile[]>([]);
const existingComments = ref<DisplayComment[]>([]);
const newFiles = ref<FileEntry[]>([]);
const newComments = ref<CommentEntry[]>([]);
const newFile = ref({ name: '', url: '', tags: 'gameplay' });
const newComment = ref('');
const recentlyAddedCommentId = ref<string | null>(null);
const recentlyAddedFileId = ref<string | null>(null);

// Edit state
const editingFileId = ref<number | null>(null);
const editingFile = ref({ name: '', url: '', tags: '' });
const editingCommentId = ref<number | null>(null);
const editingComment = ref('');

const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
};

const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
};

const loadFilesAndComments = async () => {
  if (!props.match) return;

  isLoading.value = true;
  error.value = null;

  try {
    const data = await adminTournamentService.getMatchFilesAndComments(props.tournamentId, props.match.id);
    existingFiles.value = data.files;
    existingComments.value = data.comments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Error loading files and comments:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load files and comments';
  } finally {
    isLoading.value = false;
  }
};

const autoFillFileDetails = () => {
  if (!newFile.value.url.trim()) {
    newFile.value.name = '';
    return;
  }

  try {
    const url = new URL(newFile.value.url.trim());
    if (!newFile.value.name) {
      newFile.value.name = url.hostname;
    }
  } catch {
    // Invalid URL, skip auto-fill
  }
};

const addNewFile = () => {
  if (!newFile.value.url.trim()) return;

  try {
    const url = new URL(newFile.value.url.trim());
    const fileId = `temp-file-${Date.now()}`;

    existingFiles.value.unshift({
      id: -1,
      name: newFile.value.name.trim() || url.hostname,
      url: newFile.value.url.trim(),
      tags: newFile.value.tags.trim() || 'gameplay',
      uploadedAt: new Date().toISOString(),
      isNew: true,
    } as DisplayFile);

    recentlyAddedFileId.value = fileId;
    setTimeout(() => {
      recentlyAddedFileId.value = null;
    }, 1500);

    // Add to pending files for saving
    newFiles.value.push({
      name: newFile.value.name.trim() || url.hostname,
      url: newFile.value.url.trim(),
      tags: newFile.value.tags.trim() || 'gameplay',
      isNew: true,
    });

    newFile.value = { name: '', url: '', tags: 'gameplay' };
  } catch {
    error.value = 'Please enter a valid URL';
  }
};

const removeNewFile = (fileId: string | number) => {
  existingFiles.value = existingFiles.value.filter(f => f.id !== fileId);
  newFiles.value = newFiles.value.filter((_, idx) => {
    const file = existingFiles.value[idx];
    return !file || file.id !== fileId;
  });
};

const deleteExistingFile = async (fileId: number | string) => {
  // If it's a new unsaved file, just remove it
  if (typeof fileId === 'string' || fileId < 0) {
    removeNewFile(fileId);
    return;
  }

  if (!props.match || !confirm('Delete this file?')) return;

  isProcessing.value = true;
  error.value = null;

  try {
    await adminTournamentService.deleteMatchFile(props.tournamentId, props.match.id, fileId as number);
    existingFiles.value = existingFiles.value.filter(f => f.id !== fileId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete file';
  } finally {
    isProcessing.value = false;
  }
};

const addNewComment = () => {
  if (!newComment.value.trim()) return;

  const commentId = `temp-comment-${Date.now()}`;

  existingComments.value.unshift({
    id: -1,
    content: newComment.value.trim(),
    createdAt: new Date().toISOString(),
    createdByUserId: 0,
    createdByUserEmail: '',
    updatedAt: new Date().toISOString(),
    isNew: true,
  } as DisplayComment);

  recentlyAddedCommentId.value = commentId;
  setTimeout(() => {
    recentlyAddedCommentId.value = null;
  }, 1500);

  // Add to pending comments for saving
  newComments.value.push({
    content: newComment.value.trim(),
    isNew: true,
  });

  newComment.value = '';
};

const removeNewComment = (commentId: string | number) => {
  existingComments.value = existingComments.value.filter(c => c.id !== commentId);
  newComments.value = newComments.value.filter((_, idx) => {
    const comment = existingComments.value[idx];
    return !comment || comment.id !== commentId;
  });
};

const deleteExistingComment = async (commentId: number | string) => {
  // If it's a new unsaved comment, just remove it
  if (typeof commentId === 'string' || commentId < 0) {
    removeNewComment(commentId);
    return;
  }

  if (!props.match || !confirm('Delete this comment?')) return;

  isProcessing.value = true;
  error.value = null;

  try {
    await adminTournamentService.deleteMatchComment(props.tournamentId, props.match.id, commentId as number);
    existingComments.value = existingComments.value.filter(c => c.id !== commentId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete comment';
  } finally {
    isProcessing.value = false;
  }
};

const startEditFile = (file: DisplayFile) => {
  editingFileId.value = file.id as number;
  editingFile.value = {
    name: file.name,
    url: file.url,
    tags: file.tags,
  };
};

const cancelEditFile = () => {
  editingFileId.value = null;
  editingFile.value = { name: '', url: '', tags: '' };
};

const saveEditFile = async (fileId: number) => {
  if (!props.match || !editingFile.value.url.trim()) {
    error.value = 'URL is required';
    return;
  }

  isProcessing.value = true;
  error.value = null;

  try {
    const updatedFile = await adminTournamentService.updateMatchFile(
      props.tournamentId,
      props.match.id,
      fileId,
      {
        name: editingFile.value.name.trim(),
        url: editingFile.value.url.trim(),
        tags: editingFile.value.tags.trim(),
      }
    );

    const index = existingFiles.value.findIndex(f => f.id === fileId);
    if (index !== -1) {
      existingFiles.value[index] = { ...updatedFile, isNew: false } as DisplayFile;
    }

    editingFileId.value = null;
    editingFile.value = { name: '', url: '', tags: '' };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update file';
  } finally {
    isProcessing.value = false;
  }
};

const startEditComment = (comment: DisplayComment) => {
  editingCommentId.value = comment.id as number;
  editingComment.value = comment.content;
};

const cancelEditComment = () => {
  editingCommentId.value = null;
  editingComment.value = '';
};

const saveEditComment = async (commentId: number) => {
  if (!props.match || !editingComment.value.trim()) {
    error.value = 'Comment cannot be empty';
    return;
  }

  isProcessing.value = true;
  error.value = null;

  try {
    const updatedComment = await adminTournamentService.updateMatchComment(
      props.tournamentId,
      props.match.id,
      commentId,
      {
        content: editingComment.value.trim(),
      }
    );

    const index = existingComments.value.findIndex(c => c.id === commentId);
    if (index !== -1) {
      existingComments.value[index] = { ...updatedComment, isNew: false } as DisplayComment;
    }

    editingCommentId.value = null;
    editingComment.value = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update comment';
  } finally {
    isProcessing.value = false;
  }
};

const handleSave = async () => {
  if (!props.match) return;

  isProcessing.value = true;
  error.value = null;

  try {
    // Create new files
    for (const file of newFiles.value) {
      const fileRequest: CreateMatchFileRequest = {
        name: file.name,
        url: file.url,
        tags: file.tags,
      };
      await adminTournamentService.createMatchFile(props.tournamentId, props.match.id, fileRequest);
    }

    // Create new comments
    for (const comment of newComments.value) {
      const commentRequest: CreateMatchCommentRequest = {
        content: comment.content,
      };
      await adminTournamentService.createMatchComment(props.tournamentId, props.match.id, commentRequest);
    }

    // Remove the "isNew" flags from saved items
    existingFiles.value = existingFiles.value.map(f => ({ ...f, isNew: false }));
    existingComments.value = existingComments.value.map(c => ({ ...c, isNew: false }));

    // Reset new items
    newFiles.value = [];
    newComments.value = [];
    newFile.value = { name: '', url: '', tags: 'gameplay' };
    newComment.value = '';

    // Reload to show new items
    await loadFilesAndComments();

    emit('saved');
  } catch (err) {
    console.error('Error saving files and comments:', err);
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Failed to save files and comments. Please try again.';
    }
  } finally {
    isProcessing.value = false;
  }
};

onMounted(() => {
  loadFilesAndComments();
});
</script>

<style scoped src="./MatchFilesAndCommentsModal.vue.css"></style>
